import { create } from 'zustand';
import { GeocodingResult, Route } from '../types';

interface RouteStore {
  // Search inputs
  origin: GeocodingResult | null;
  destination: GeocodingResult | null;
  setOrigin: (origin: GeocodingResult | null) => void;
  setDestination: (destination: GeocodingResult | null) => void;
  swapOriginDestination: () => void;

  // Current route result
  currentRoute: Route | null;
  setCurrentRoute: (route: Route | null) => void;

  // Saved routes
  savedRoutes: Route[];
  saveRoute: (route: Route) => void;
  removeSavedRoute: (index: number) => void;

  // Loading state
  isLoading: boolean;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useRouteStore = create<RouteStore>((set, get) => ({
  origin: null,
  destination: null,
  currentRoute: null,
  savedRoutes: [],
  isLoading: false,
  error: null,

  setOrigin: (origin) => set({ origin }),
  setDestination: (destination) => set({ destination }),

  swapOriginDestination: () => {
    const { origin, destination } = get();
    set({ origin: destination, destination: origin });
  },

  setCurrentRoute: (route) => set({ currentRoute: route }),

  saveRoute: (route) =>
    set((state) => ({
      savedRoutes: [route, ...state.savedRoutes].slice(0, 20),
    })),

  removeSavedRoute: (index) =>
    set((state) => ({
      savedRoutes: state.savedRoutes.filter((_, i) => i !== index),
    })),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
