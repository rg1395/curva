import { GeocodingResult, LatLng } from '../types';

const MAPTILER_KEY = process.env.EXPO_PUBLIC_MAPTILER_API_KEY ?? '';

export interface GeocodingSuggestion {
  id: string;
  name: string;
  fullAddress: string;
  coordinates: LatLng;
}

/**
 * Search for address suggestions using MapTiler Geocoding API.
 */
export async function searchAddress(
  query: string,
  proximity?: LatLng
): Promise<GeocodingSuggestion[]> {
  if (query.length < 3 || !MAPTILER_KEY) return [];

  const proximityParam = proximity
    ? `&proximity=${proximity.lng},${proximity.lat}`
    : '';

  const url =
    `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json` +
    `?key=${MAPTILER_KEY}&language=it&types=address,place,poi&limit=5${proximityParam}`;

  try {
    const response = await fetch(url);
    if (!response.ok) return [];

    const data = await response.json();

    return (data.features ?? []).map((feature: any) => ({
      id: feature.id,
      name: feature.text,
      fullAddress: feature.place_name,
      coordinates: {
        lat: feature.center[1],
        lng: feature.center[0],
      },
    }));
  } catch {
    return [];
  }
}

/**
 * Reverse geocode a coordinate to get a human-readable address.
 */
export async function reverseGeocode(coords: LatLng): Promise<GeocodingResult | null> {
  if (!MAPTILER_KEY) return null;

  const url =
    `https://api.maptiler.com/geocoding/${coords.lng},${coords.lat}.json` +
    `?key=${MAPTILER_KEY}&language=it&types=address,place&limit=1`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    const feature = data.features?.[0];
    if (!feature) return null;

    return {
      name: feature.text,
      fullAddress: feature.place_name,
      coordinates: { lat: feature.center[1], lng: feature.center[0] },
    };
  } catch {
    return null;
  }
}
