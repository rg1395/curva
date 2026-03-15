import { LatLng, SegmentType } from '../types';
import { haversineKm, polylineLengthKm, splitPolylineByDistance } from './geo';

/**
 * Sinuosity Index for a polyline segment.
 * SI = actual_distance / straight_line_distance
 * SI = 1.0 → perfectly straight
 * SI > 1.5 → curvy
 * SI > 2.0 → very curvy
 */
export function sinuosityIndex(points: LatLng[]): number {
  if (points.length < 2) return 1.0;

  const straightLine = haversineKm(points[0], points[points.length - 1]);
  if (straightLine === 0) return 1.0;

  const actual = polylineLengthKm(points);
  return actual / straightLine;
}

/**
 * Classify a sinuosity index into a segment type.
 */
export function classifySegment(si: number, roadEnvironment?: string): SegmentType {
  const isScenic =
    roadEnvironment === 'FERRY' ||
    roadEnvironment === 'FORD' ||
    (roadEnvironment?.toLowerCase().includes('water') ?? false);

  if (isScenic) return 'scenic';
  if (si > 1.5) return 'curvy';
  if (si < 1.2) return 'transfer';
  return 'curvy';
}

/**
 * Computes sinuosity index for each 1km chunk of a polyline.
 * Returns an array of SI values (one per chunk).
 */
export function sinuosityPerKm(points: LatLng[]): number[] {
  const chunks = splitPolylineByDistance(points, 1.0);
  return chunks.map(chunk => sinuosityIndex(chunk));
}

/**
 * Average sinuosity index across the whole route.
 */
export function averageSinuosity(points: LatLng[]): number {
  const values = sinuosityPerKm(points);
  if (values.length === 0) return 1.0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Count of "curves" (direction changes > 15 degrees over 50m windows).
 * Simple heuristic for display purposes.
 */
export function estimateCurvesCount(points: LatLng[]): number {
  if (points.length < 3) return 0;

  let curves = 0;
  const WINDOW = 3; // consecutive points to check bearing change

  for (let i = WINDOW; i < points.length - WINDOW; i++) {
    const bearingBefore = bearing(points[i - WINDOW], points[i]);
    const bearingAfter = bearing(points[i], points[i + WINDOW]);
    const diff = Math.abs(angleDiff(bearingBefore, bearingAfter));
    if (diff > 15) curves++;
  }

  // Normalize: we're over-counting, so divide by ~3
  return Math.round(curves / 3);
}

function bearing(a: LatLng, b: LatLng): number {
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180) / Math.PI;
}

function angleDiff(a: number, b: number): number {
  let diff = ((b - a + 540) % 360) - 180;
  return diff;
}
