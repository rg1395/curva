// ─── Geo ──────────────────────────────────────────────────────────────────

export interface LatLng {
  lat: number;
  lng: number;
}

// ─── Route ────────────────────────────────────────────────────────────────

export type SegmentType = 'curvy' | 'scenic' | 'transfer';

export type SurfaceQuality = 'excellent' | 'good' | 'fair' | 'bad' | 'unknown';

export interface RouteSegment {
  points: LatLng[];
  distanceKm: number;
  type: SegmentType;
  sinuosityIndex: number;
  roadClass: string;
  roadEnvironment: string;
  surface: string;
  surfaceQuality: SurfaceQuality;
  surfaceConfidence: number; // 0-1
  elevationGainM: number;
}

export interface RouteInstruction {
  text: string;
  distanceM: number;
  sign: number; // GraphHopper sign codes
  interval: [number, number]; // indices into decoded polyline
}

export interface FunScoreBreakdown {
  sinuosity: number;   // 0-1
  surface: number;     // 0-1
  scenic: number;      // 0-1
  lowTraffic: number;  // 0-1
  elevation: number;   // 0-1
  total: number;       // 1-10
}

export interface Route {
  id?: string;
  name: string;
  origin: GeocodingResult;
  destination: GeocodingResult;
  geometry: LatLng[];
  segments: RouteSegment[];
  instructions: RouteInstruction[];
  distanceKm: number;
  durationMin: number;
  curvesCount: number;
  elevationGainM: number;
  surfaceQualityAvg: number;  // 0-100
  funScore: number;           // 1-10
  funScoreBreakdown: FunScoreBreakdown;
  isLoop: boolean;
}

// ─── Geocoding ────────────────────────────────────────────────────────────

export interface GeocodingResult {
  name: string;
  fullAddress: string;
  coordinates: LatLng;
}

// ─── Accelerometer ────────────────────────────────────────────────────────

export interface AccelerometerSample {
  x: number;
  y: number;
  z: number;
  timestamp: number;
  lat?: number;
  lng?: number;
  speedKmh?: number;
}

export interface SurfaceReadingBatch {
  samples: AccelerometerSample[];
  vibrationRms: number;
  normalizedRms: number;
  lat: number;
  lng: number;
  speedKmh: number;
  timestamp: string;
  deviceModel: string;
}

// ─── Surface Quality ──────────────────────────────────────────────────────

export interface SurfaceQualityData {
  segmentId: string;
  qualityScore: number; // 0-100
  confidence: number;   // 0-1
  lastUpdated: string;
  readingsCount: number;
  ratingsCount: number;
}

// ─── Ride ─────────────────────────────────────────────────────────────────

export interface RideState {
  isRecording: boolean;
  startedAt: string | null;
  elapsedSeconds: number;
  dataPoints: number;
  currentSurfaceQuality: SurfaceQuality;
  currentVibrationRms: number;
  waveformData: number[];  // last N values for animation
}

// ─── Top Roads ────────────────────────────────────────────────────────────

export interface TopRoad {
  id: string;
  name: string;
  region: string;
  funScore: number;
  distanceKm: number;
  curvesCount: number;
  surfaceQuality: SurfaceQuality;
  passagesCount: number;
}

// ─── Navigation ───────────────────────────────────────────────────────────

export type RootStackParamList = {
  Home: undefined;
  RouteResult: { route: Route };
  DriveMode: { route: Route };
  RideRecording: { route: Route };
  PostRideRating: { route: Route; rideId: string };
  ShareableCard: { route: Route; rideId?: string };
  TopRoads: undefined;
};
