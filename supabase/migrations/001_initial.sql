-- CURVA App — Initial Database Schema
-- Run this in your Supabase SQL editor or via supabase db push

-- Enable PostGIS extension for geographic queries
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── USERS ────────────────────────────────────────────────────────────────────

CREATE TABLE public.users (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT,
  display_name TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  total_km     FLOAT DEFAULT 0,
  total_rides  INT DEFAULT 0
);

-- Trigger: create user profile on sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email)
  ON CONFLICT DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- ─── ROUTES ───────────────────────────────────────────────────────────────────

CREATE TABLE public.routes (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  origin_lat          FLOAT NOT NULL,
  origin_lng          FLOAT NOT NULL,
  dest_lat            FLOAT NOT NULL,
  dest_lng            FLOAT NOT NULL,
  geometry            JSONB NOT NULL,       -- Array of {lat, lng} points
  fun_score           FLOAT,
  distance_km         FLOAT,
  duration_min        INT,
  curves_count        INT DEFAULT 0,
  elevation_gain_m    INT DEFAULT 0,
  surface_quality_avg FLOAT DEFAULT 50,
  is_loop             BOOLEAN DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own routes" ON public.routes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public can read routes" ON public.routes FOR SELECT USING (true);

-- ─── ROAD SEGMENTS ────────────────────────────────────────────────────────────

CREATE TABLE public.road_segments (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  osm_way_id       BIGINT,
  geom             GEOMETRY(LineString, 4326),
  name             TEXT,
  region           TEXT,
  sinuosity_index  FLOAT DEFAULT 1.0,
  road_class       TEXT DEFAULT 'SECONDARY',
  surface_type     TEXT DEFAULT 'asphalt',
  avg_speed_limit  INT DEFAULT 50,
  scenic_score     FLOAT DEFAULT 0,
  fun_score        FLOAT DEFAULT 5.0,
  distance_km      FLOAT DEFAULT 0,
  curves_count     INT DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.road_segments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read segments" ON public.road_segments FOR SELECT USING (true);

-- ─── SURFACE READINGS (Accelerometer data) ────────────────────────────────────

CREATE TABLE public.surface_readings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES public.users(id) ON DELETE SET NULL,
  segment_id      UUID REFERENCES public.road_segments(id) ON DELETE SET NULL,
  lat             FLOAT NOT NULL,
  lng             FLOAT NOT NULL,
  vibration_rms   FLOAT NOT NULL,
  speed_kmh       FLOAT DEFAULT 0,
  timestamp       TIMESTAMPTZ NOT NULL,
  device_model    TEXT
);

ALTER TABLE public.surface_readings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert own readings" ON public.surface_readings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Aggregated readings are public" ON public.surface_readings FOR SELECT USING (true);

-- ─── SURFACE RATINGS (Manual post-ride ratings) ───────────────────────────────

CREATE TYPE surface_quality_enum AS ENUM ('excellent', 'good', 'fair', 'bad');

CREATE TABLE public.surface_ratings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES public.users(id) ON DELETE CASCADE,
  segment_id  UUID REFERENCES public.road_segments(id) ON DELETE CASCADE,
  quality     surface_quality_enum NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, segment_id)
);

ALTER TABLE public.surface_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own ratings" ON public.surface_ratings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public can read ratings" ON public.surface_ratings FOR SELECT USING (true);

-- ─── SURFACE QUALITY (Aggregated per segment) ────────────────────────────────

CREATE TABLE public.surface_quality (
  segment_id      UUID PRIMARY KEY REFERENCES public.road_segments(id) ON DELETE CASCADE,
  quality_score   FLOAT DEFAULT 50,  -- 0-100
  confidence      FLOAT DEFAULT 0,   -- 0-1
  last_updated    TIMESTAMPTZ DEFAULT NOW(),
  readings_count  INT DEFAULT 0,
  ratings_count   INT DEFAULT 0
);

ALTER TABLE public.surface_quality ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read surface quality" ON public.surface_quality FOR SELECT USING (true);

-- ─── RIDE HISTORY ─────────────────────────────────────────────────────────────

CREATE TABLE public.ride_history (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID REFERENCES public.users(id) ON DELETE CASCADE,
  route_id            UUID REFERENCES public.routes(id) ON DELETE SET NULL,
  started_at          TIMESTAMPTZ NOT NULL,
  ended_at            TIMESTAMPTZ,
  actual_geometry     JSONB,  -- GPS trace
  actual_distance_km  FLOAT DEFAULT 0,
  fun_score           FLOAT,
  shared              BOOLEAN DEFAULT FALSE
);

ALTER TABLE public.ride_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own rides" ON public.ride_history FOR ALL USING (auth.uid() = user_id);

-- ─── INDEXES ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_road_segments_geom ON public.road_segments USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_road_segments_fun_score ON public.road_segments (fun_score DESC);
CREATE INDEX IF NOT EXISTS idx_road_segments_region ON public.road_segments (region);
CREATE INDEX IF NOT EXISTS idx_surface_readings_lat_lng ON public.surface_readings (lat, lng);
CREATE INDEX IF NOT EXISTS idx_surface_readings_timestamp ON public.surface_readings (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_routes_user ON public.routes (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ride_history_user ON public.ride_history (user_id, started_at DESC);

-- ─── FUNCTION: Aggregate surface quality ──────────────────────────────────────

CREATE OR REPLACE FUNCTION update_surface_quality(p_segment_id UUID)
RETURNS VOID AS $$
DECLARE
  v_readings_count INT;
  v_ratings_count INT;
  v_quality_score FLOAT;
  v_confidence FLOAT;
  v_recency_factor FLOAT := 0.85; -- Data older than 6 months has 85% weight
BEGIN
  -- Count readings and ratings
  SELECT COUNT(*) INTO v_readings_count
  FROM surface_readings WHERE segment_id = p_segment_id;

  SELECT COUNT(*) INTO v_ratings_count
  FROM surface_ratings WHERE segment_id = p_segment_id;

  -- Calculate quality score from manual ratings (weighted 70%) + readings (30%)
  WITH rating_scores AS (
    SELECT
      CASE quality
        WHEN 'excellent' THEN 100
        WHEN 'good' THEN 75
        WHEN 'fair' THEN 40
        WHEN 'bad' THEN 10
      END AS score
    FROM surface_ratings WHERE segment_id = p_segment_id
  )
  SELECT COALESCE(AVG(score), 50) INTO v_quality_score FROM rating_scores;

  -- Calculate confidence
  v_confidence := LEAST(1.0, (v_readings_count * 0.1 + v_ratings_count * 0.3)) * v_recency_factor;

  -- Upsert aggregated quality
  INSERT INTO surface_quality (segment_id, quality_score, confidence, last_updated, readings_count, ratings_count)
  VALUES (p_segment_id, v_quality_score, v_confidence, NOW(), v_readings_count, v_ratings_count)
  ON CONFLICT (segment_id) DO UPDATE SET
    quality_score = EXCLUDED.quality_score,
    confidence = EXCLUDED.confidence,
    last_updated = EXCLUDED.last_updated,
    readings_count = EXCLUDED.readings_count,
    ratings_count = EXCLUDED.ratings_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
