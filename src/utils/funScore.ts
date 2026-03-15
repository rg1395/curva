import { FunScoreBreakdown, RouteSegment } from '../types';

/**
 * Normalize a sinuosity average into a 0-1 score.
 * SI 1.0 (straight) → 0.0
 * SI 2.5 (very curvy) → 1.0
 */
export function normalizeSinuosity(avgSI: number): number {
  const clamped = Math.max(1.0, Math.min(2.5, avgSI));
  return (clamped - 1.0) / (2.5 - 1.0);
}

/**
 * Normalize surface quality score (0-100) to 0-1.
 */
export function normalizeSurface(qualityScore: number): number {
  return Math.max(0, Math.min(1, qualityScore / 100));
}

/**
 * Compute scenic score (0-1) from segments.
 * Based on road_environment tags (water, forest, viewpoints).
 */
export function computeScenicScore(segments: RouteSegment[]): number {
  if (segments.length === 0) return 0;
  const scenic = segments.filter(s => s.type === 'scenic' || isScenicEnvironment(s.roadEnvironment));
  return scenic.length / segments.length;
}

function isScenicEnvironment(env: string): boolean {
  const lower = env.toLowerCase();
  return lower.includes('water') || lower.includes('ferry') || lower.includes('ford');
}

/**
 * Compute low-traffic score (0-1) from segment road classes.
 * tertiary/unclassified/track → 1.0
 * secondary → 0.75
 * primary → 0.4
 * trunk → 0.1
 * motorway → 0.0
 */
export function computeLowTrafficScore(segments: RouteSegment[]): number {
  if (segments.length === 0) return 0.5;

  const ROAD_CLASS_SCORE: Record<string, number> = {
    MOTORWAY: 0.0,
    TRUNK: 0.1,
    PRIMARY: 0.4,
    SECONDARY: 0.75,
    TERTIARY: 1.0,
    UNCLASSIFIED: 1.0,
    RESIDENTIAL: 0.9,
    TRACK: 1.0,
    OTHER: 0.8,
  };

  let totalWeightedScore = 0;
  let totalKm = 0;

  for (const seg of segments) {
    const key = seg.roadClass.toUpperCase();
    const score = ROAD_CLASS_SCORE[key] ?? 0.5;
    totalWeightedScore += score * seg.distanceKm;
    totalKm += seg.distanceKm;
  }

  return totalKm > 0 ? totalWeightedScore / totalKm : 0.5;
}

/**
 * Normalize elevation gain to 0-1.
 * 0m → 0.0, 800m → 1.0
 */
export function normalizeElevation(gainM: number): number {
  return Math.max(0, Math.min(1, gainM / 800));
}

/**
 * Compute average surface quality score from segments (0-100 → 0-1).
 * Returns 0.5 if no data.
 */
export function computeSurfaceScore(segments: RouteSegment[]): number {
  const withData = segments.filter(s => s.surfaceConfidence > 0.3);
  if (withData.length === 0) return 0.5;

  let totalWeighted = 0;
  let totalKm = 0;

  for (const seg of withData) {
    const score = surfaceQualityToScore(seg.surfaceQuality);
    totalWeighted += score * seg.distanceKm;
    totalKm += seg.distanceKm;
  }

  return totalKm > 0 ? totalWeighted / totalKm : 0.5;
}

function surfaceQualityToScore(quality: string): number {
  switch (quality) {
    case 'excellent': return 1.0;
    case 'good': return 0.75;
    case 'fair': return 0.4;
    case 'bad': return 0.1;
    default: return 0.5;
  }
}

/**
 * Compute average surface quality percentage (0-100) for display.
 */
export function computeSurfaceQualityAvg(segments: RouteSegment[]): number {
  const withData = segments.filter(s => s.surfaceConfidence > 0.3);
  if (withData.length === 0) return 50;

  let total = 0;
  for (const seg of withData) {
    total += surfaceQualityToScore(seg.surfaceQuality) * 100;
  }
  return Math.round(total / withData.length);
}

/**
 * Main Fun Score calculation.
 *
 * fun_score = (
 *   sinuosity * 0.40 +
 *   surface   * 0.25 +
 *   scenic    * 0.15 +
 *   lowTraffic * 0.10 +
 *   elevation * 0.10
 * ) * 10
 */
export function calculateFunScore(params: {
  avgSinuosity: number;
  segments: RouteSegment[];
  elevationGainM: number;
}): FunScoreBreakdown {
  const { avgSinuosity, segments, elevationGainM } = params;

  const sinuosity = normalizeSinuosity(avgSinuosity);
  const surface = computeSurfaceScore(segments);
  const scenic = computeScenicScore(segments);
  const lowTraffic = computeLowTrafficScore(segments);
  const elevation = normalizeElevation(elevationGainM);

  const total =
    sinuosity * 0.4 +
    surface * 0.25 +
    scenic * 0.15 +
    lowTraffic * 0.1 +
    elevation * 0.1;

  return {
    sinuosity,
    surface,
    scenic,
    lowTraffic,
    elevation,
    total: Math.max(1, Math.min(10, parseFloat((total * 10).toFixed(1)))),
  };
}
