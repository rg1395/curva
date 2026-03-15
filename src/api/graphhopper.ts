import { GeocodingResult, LatLng, Route, RouteInstruction, RouteSegment, SegmentType, SurfaceQuality } from '../types';
import { decodePolyline, polylineLengthKm, splitPolylineByDistance } from '../utils/geo';
import { sinuosityIndex, averageSinuosity, estimateCurvesCount } from '../utils/sinuosity';
import { calculateFunScore, computeSurfaceQualityAvg } from '../utils/funScore';

const GH_API_KEY = process.env.EXPO_PUBLIC_GRAPHHOPPER_API_KEY ?? '';
const GH_BASE_URL = 'https://graphhopper.com/api/1';

// Custom model: penalizes fast roads, rewards winding secondary/tertiary roads
const CURVY_CUSTOM_MODEL = {
  priority: [
    { if: 'road_class == MOTORWAY', multiply_by: '0.01' },
    { if: 'road_class == TRUNK', multiply_by: '0.1' },
    { if: 'road_class == PRIMARY', multiply_by: '0.5' },
    { if: 'road_class == SECONDARY', multiply_by: '1.5' },
    { if: 'road_class == TERTIARY', multiply_by: '2.0' },
    { if: 'road_environment == TUNNEL', multiply_by: '0.1' },
  ],
  speed: [{ if: 'road_class == MOTORWAY', limit_to: '80' }],
};

interface GraphHopperResponse {
  paths: Array<{
    distance: number;
    time: number;
    ascend: number;
    points: string; // encoded polyline
    instructions: Array<{
      text: string;
      distance: number;
      sign: number;
      interval: [number, number];
    }>;
    details: {
      road_class?: Array<[number, number, string]>;
      road_environment?: Array<[number, number, string]>;
      surface?: Array<[number, number, string]>;
    };
  }>;
}

/**
 * Get a curvy motorcycle route from A to B (or multi-waypoint for loops).
 */
export async function getRoute(
  waypoints: LatLng[],
  origin: GeocodingResult,
  destination: GeocodingResult
): Promise<Route> {
  const pointParams = waypoints.map(p => `point=${p.lat},${p.lng}`).join('&');

  const url =
    `${GH_BASE_URL}/route?${pointParams}` +
    `&vehicle=motorcycle` +
    `&elevation=true` +
    `&instructions=true` +
    `&details=road_class,road_environment,surface` +
    `&key=${GH_API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ custom_model: CURVY_CUSTOM_MODEL }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`GraphHopper error ${response.status}: ${err}`);
  }

  const data: GraphHopperResponse = await response.json();
  const path = data.paths[0];

  const geometry = decodePolyline(path.points);
  const distanceKm = path.distance / 1000;
  const durationMin = Math.round(path.time / 60000);
  const elevationGainM = Math.round(path.ascend ?? 0);

  const segments = buildSegments(geometry, path.details);
  const avgSI = averageSinuosity(geometry);
  const curvesCount = estimateCurvesCount(geometry);
  const funScoreBreakdown = calculateFunScore({ avgSinuosity: avgSI, segments, elevationGainM });
  const surfaceQualityAvg = computeSurfaceQualityAvg(segments);

  const instructions: RouteInstruction[] = (path.instructions ?? []).map(ins => ({
    text: ins.text,
    distanceM: ins.distance,
    sign: ins.sign,
    interval: ins.interval,
  }));

  return {
    name: buildRouteName(origin, destination),
    origin,
    destination,
    geometry,
    segments,
    instructions,
    distanceKm: parseFloat(distanceKm.toFixed(1)),
    durationMin,
    curvesCount,
    elevationGainM,
    surfaceQualityAvg,
    funScore: funScoreBreakdown.total,
    funScoreBreakdown,
    isLoop: origin.fullAddress === destination.fullAddress,
  };
}

function buildRouteName(origin: GeocodingResult, destination: GeocodingResult): string {
  const from = origin.name;
  const to = destination.name;
  if (from === to) return `Loop da ${from}`;
  return `${from} → ${to}`;
}

/**
 * Build route segments with metadata from GraphHopper details.
 */
function buildSegments(
  geometry: LatLng[],
  details: GraphHopperResponse['paths'][0]['details']
): RouteSegment[] {
  const chunks = splitPolylineByDistance(geometry, 1.0);
  const segments: RouteSegment[] = [];

  let pointOffset = 0;

  for (const chunk of chunks) {
    const distanceKm = polylineLengthKm(chunk);
    const si = sinuosityIndex(chunk);

    // Find the middle point index to look up details
    const midPointIndex = pointOffset + Math.floor(chunk.length / 2);

    const roadClass = getDetailAt(details.road_class, midPointIndex) ?? 'SECONDARY';
    const roadEnvironment = getDetailAt(details.road_environment, midPointIndex) ?? 'OTHER';
    const surface = getDetailAt(details.surface, midPointIndex) ?? 'asphalt';

    const segType = classifySegType(si, roadEnvironment);

    segments.push({
      points: chunk,
      distanceKm,
      type: segType,
      sinuosityIndex: si,
      roadClass,
      roadEnvironment,
      surface,
      surfaceQuality: 'unknown', // will be filled from Supabase
      surfaceConfidence: 0,
      elevationGainM: 0,
    });

    pointOffset += chunk.length - 1;
  }

  return segments;
}

function getDetailAt(
  detail: Array<[number, number, string]> | undefined,
  index: number
): string | undefined {
  if (!detail) return undefined;
  for (const [from, to, value] of detail) {
    if (index >= from && index < to) return value;
  }
  return undefined;
}

function classifySegType(si: number, roadEnvironment: string): SegmentType {
  const env = roadEnvironment.toLowerCase();
  if (env.includes('water') || env === 'ferry') return 'scenic';
  if (si > 1.5) return 'curvy';
  if (si < 1.2) return 'transfer';
  return 'curvy';
}

/**
 * Generate a "Sorprendimi" random loop from the current position.
 * Retries up to 3 times if Fun Score < 6.
 */
export async function generateSorprendimi(
  currentLocation: LatLng,
  radiusKm: number = 50
): Promise<Route> {
  const { generateRandomWaypoints } = await import('../utils/geo');

  let lastRoute: Route | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    const waypointCount = 3 + Math.floor(Math.random() * 3); // 3-5
    const waypoints = generateRandomWaypoints(currentLocation, radiusKm, waypointCount);
    const allPoints = [currentLocation, ...waypoints, currentLocation];

    const startLocation: GeocodingResult = {
      name: 'Posizione attuale',
      fullAddress: 'Posizione attuale',
      coordinates: currentLocation,
    };

    try {
      const route = await getRoute(allPoints, startLocation, startLocation);
      lastRoute = route;
      if (route.funScore >= 6) return route;
    } catch {
      // retry with different waypoints
    }
  }

  if (!lastRoute) {
    throw new Error('Impossibile generare un percorso. Riprova.');
  }

  return lastRoute;
}
