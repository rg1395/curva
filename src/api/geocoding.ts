import { GeocodingResult, LatLng } from '../types';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '';

export interface GeocodingSuggestion {
  id: string;
  name: string;
  fullAddress: string;
  coordinates: LatLng;
}

/**
 * Search for address suggestions using Mapbox Geocoding API.
 */
export async function searchAddress(
  query: string,
  proximity?: LatLng
): Promise<GeocodingSuggestion[]> {
  if (query.length < 3 || !MAPBOX_TOKEN) return [];

  const proximityParam = proximity
    ? `&proximity=${proximity.lng},${proximity.lat}`
    : '';

  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
    `?access_token=${MAPBOX_TOKEN}&language=it&types=address,place,poi&limit=5${proximityParam}`;

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
  if (!MAPBOX_TOKEN) return null;

  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords.lng},${coords.lat}.json` +
    `?access_token=${MAPBOX_TOKEN}&language=it&types=address,place&limit=1`;

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
