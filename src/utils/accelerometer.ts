import { Accelerometer } from 'expo-sensors';
import * as Location from 'expo-location';
import { SurfaceQuality } from '../types';

const SAMPLE_RATE_HZ = 16;
const BATCH_INTERVAL_MS = 30_000; // 30 seconds
const MIN_SPEED_KMH = 5; // below this, stop recording (battery saving)

interface Sample {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

interface BatchData {
  vibrationRms: number;
  normalizedRms: number;
  lat: number;
  lng: number;
  speedKmh: number;
  timestamp: string;
}

type BatchCallback = (batch: BatchData) => void;
type QualityCallback = (quality: SurfaceQuality, rms: number) => void;

let buffer: Sample[] = [];
let subscription: { remove: () => void } | null = null;
let batchTimer: ReturnType<typeof setInterval> | null = null;
let onBatch: BatchCallback | null = null;
let onQualityUpdate: QualityCallback | null = null;

/**
 * Calculate Root Mean Square of Z-axis (vertical vibrations).
 */
export function calculateRms(samples: Sample[]): number {
  if (samples.length === 0) return 0;
  const sumSquares = samples.reduce((acc, s) => acc + s.z * s.z, 0);
  return Math.sqrt(sumSquares / samples.length);
}

/**
 * Normalize RMS by speed to get a speed-independent quality measure.
 */
export function normalizeRmsBySpeed(rms: number, speedKmh: number): number {
  if (speedKmh < 1) return rms;
  return rms / Math.sqrt(speedKmh);
}

/**
 * Classify surface quality from normalized RMS.
 * Thresholds from spec — to be calibrated with real data.
 */
export function classifySurfaceQuality(normalizedRms: number): SurfaceQuality {
  if (normalizedRms < 0.15) return 'excellent';
  if (normalizedRms < 0.30) return 'good';
  if (normalizedRms < 0.50) return 'fair';
  return 'bad';
}

/**
 * Start accelerometer recording.
 * @param batchCallback - called every 30s with aggregated data
 * @param qualityCallback - called on every batch with current quality
 */
export async function startAccelerometer(
  batchCallback: BatchCallback,
  qualityCallback: QualityCallback
): Promise<void> {
  onBatch = batchCallback;
  onQualityUpdate = qualityCallback;
  buffer = [];

  Accelerometer.setUpdateInterval(Math.round(1000 / SAMPLE_RATE_HZ));

  subscription = Accelerometer.addListener(({ x, y, z }) => {
    buffer.push({ x, y, z, timestamp: Date.now() });
  });

  batchTimer = setInterval(async () => {
    await processBatch();
  }, BATCH_INTERVAL_MS);
}

/**
 * Stop accelerometer recording.
 */
export function stopAccelerometer(): void {
  subscription?.remove();
  subscription = null;
  if (batchTimer) {
    clearInterval(batchTimer);
    batchTimer = null;
  }
  buffer = [];
  onBatch = null;
  onQualityUpdate = null;
}

async function processBatch(): Promise<void> {
  if (buffer.length === 0 || !onBatch) return;

  const samples = [...buffer];
  buffer = [];

  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const speedKmh = (location.coords.speed ?? 0) * 3.6;

    // Battery optimization: stop if not moving
    if (speedKmh < MIN_SPEED_KMH) return;

    const vibrationRms = calculateRms(samples);
    const normalizedRms = normalizeRmsBySpeed(vibrationRms, speedKmh);
    const quality = classifySurfaceQuality(normalizedRms);

    const batch: BatchData = {
      vibrationRms,
      normalizedRms,
      lat: location.coords.latitude,
      lng: location.coords.longitude,
      speedKmh,
      timestamp: new Date().toISOString(),
    };

    onBatch(batch);
    onQualityUpdate?.(quality, normalizedRms);
  } catch {
    // GPS unavailable — skip this batch
  }
}

/**
 * Get the last N samples for waveform visualization.
 */
export function getWaveformData(n: number): number[] {
  const last = buffer.slice(-n);
  return last.map(s => Math.abs(s.z));
}

/**
 * Current buffer size (for displaying data point count).
 */
export function getBufferSize(): number {
  return buffer.length;
}
