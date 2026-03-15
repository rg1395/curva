import { supabase } from './supabase';
import { SurfaceQuality, SurfaceQualityData } from '../types';

/**
 * Upload a batch of accelerometer readings to Supabase.
 */
export async function uploadSurfaceReading(params: {
  lat: number;
  lng: number;
  vibrationRms: number;
  normalizedRms: number;
  speedKmh: number;
  timestamp: string;
  deviceModel: string;
}): Promise<void> {
  const { error } = await supabase.from('surface_readings').insert({
    lat: params.lat,
    lng: params.lng,
    vibration_rms: params.vibrationRms,
    speed_kmh: params.speedKmh,
    timestamp: params.timestamp,
    device_model: params.deviceModel,
  });

  if (error) {
    console.warn('Failed to upload surface reading:', error.message);
  }
}

/**
 * Save a manual post-ride rating for a road segment.
 */
export async function saveSegmentRating(
  segmentId: string,
  quality: SurfaceQuality,
  userId: string
): Promise<void> {
  const { error } = await supabase.from('surface_ratings').upsert({
    segment_id: segmentId,
    user_id: userId,
    quality,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.warn('Failed to save rating:', error.message);
  }
}

/**
 * Fetch surface quality data for a list of segment IDs.
 */
export async function fetchSurfaceQuality(
  segmentIds: string[]
): Promise<Map<string, SurfaceQualityData>> {
  if (segmentIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from('surface_quality')
    .select('*')
    .in('segment_id', segmentIds);

  if (error || !data) return new Map();

  const map = new Map<string, SurfaceQualityData>();
  for (const row of data) {
    map.set(row.segment_id, {
      segmentId: row.segment_id,
      qualityScore: row.quality_score,
      confidence: row.confidence,
      lastUpdated: row.last_updated,
      readingsCount: row.readings_count,
      ratingsCount: row.ratings_count,
    });
  }

  return map;
}

/**
 * Fetch top roads leaderboard for a given region.
 */
export async function fetchTopRoads(region?: string, limit = 20) {
  let query = supabase
    .from('road_segments')
    .select('id, name, region, fun_score, distance_km, curves_count, surface_type')
    .order('fun_score', { ascending: false })
    .limit(limit);

  if (region) {
    query = query.eq('region', region);
  }

  const { data, error } = await query;

  if (error || !data) return [];

  return data.map((row: any, index: number) => ({
    id: row.id,
    name: row.name ?? `Strada ${index + 1}`,
    region: row.region ?? 'Italia',
    funScore: row.fun_score ?? 7.0,
    distanceKm: row.distance_km ?? 10,
    curvesCount: row.curves_count ?? 0,
    surfaceQuality: surfaceTypeToQuality(row.surface_type),
    passagesCount: 0,
  }));
}

function surfaceTypeToQuality(surface: string): SurfaceQuality {
  switch (surface?.toLowerCase()) {
    case 'asphalt':
    case 'concrete': return 'excellent';
    case 'paved': return 'good';
    case 'cobblestone':
    case 'sett': return 'fair';
    case 'gravel':
    case 'dirt':
    case 'unpaved': return 'bad';
    default: return 'unknown';
  }
}

/**
 * Save a completed ride to the database.
 */
export async function saveRide(params: {
  routeId?: string;
  startedAt: string;
  endedAt: string;
  actualDistanceKm: number;
  funScore: number;
}): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('ride_history')
    .insert({
      user_id: user.id,
      route_id: params.routeId ?? null,
      started_at: params.startedAt,
      ended_at: params.endedAt,
      actual_distance_km: params.actualDistanceKm,
      fun_score: params.funScore,
      shared: false,
    })
    .select('id')
    .single();

  if (error) return null;
  return data?.id ?? null;
}
