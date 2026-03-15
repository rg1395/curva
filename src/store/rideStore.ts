import { create } from 'zustand';
import { RideState, SurfaceQuality } from '../types';

interface RideStore extends RideState {
  startRide: () => void;
  stopRide: () => void;
  updateQuality: (quality: SurfaceQuality, rms: number) => void;
  incrementDataPoints: (count: number) => void;
  addWaveformValue: (value: number) => void;
  tick: () => void;
  reset: () => void;
}

const initialState: RideState = {
  isRecording: false,
  startedAt: null,
  elapsedSeconds: 0,
  dataPoints: 0,
  currentSurfaceQuality: 'unknown',
  currentVibrationRms: 0,
  waveformData: new Array(50).fill(0),
};

export const useRideStore = create<RideStore>((set) => ({
  ...initialState,

  startRide: () =>
    set({
      isRecording: true,
      startedAt: new Date().toISOString(),
      elapsedSeconds: 0,
      dataPoints: 0,
      currentSurfaceQuality: 'unknown',
      currentVibrationRms: 0,
      waveformData: new Array(50).fill(0),
    }),

  stopRide: () => set({ isRecording: false }),

  updateQuality: (quality, rms) =>
    set({ currentSurfaceQuality: quality, currentVibrationRms: rms }),

  incrementDataPoints: (count) =>
    set((state) => ({ dataPoints: state.dataPoints + count })),

  addWaveformValue: (value) =>
    set((state) => ({
      waveformData: [...state.waveformData.slice(1), value],
    })),

  tick: () => set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 })),

  reset: () => set(initialState),
}));
