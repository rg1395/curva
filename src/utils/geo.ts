import { LatLng } from '../types';

const EARTH_RADIUS_KM = 6371;

/**
 * Haversine distance between two coordinates in kilometers.
 */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Total length of a polyline in kilometers.
 */
export function polylineLengthKm(points: LatLng[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineKm(points[i - 1], points[i]);
  }
  return total;
}

/**
 * Destination point from a start coordinate, bearing (degrees), and distance (km).
 * Used by Sorprendimi to generate random waypoints.
 */
export function destinationPoint(start: LatLng, bearingDeg: number, distanceKm: number): LatLng {
  const d = distanceKm / EARTH_RADIUS_KM;
  const bearing = toRad(bearingDeg);
  const lat1 = toRad(start.lat);
  const lng1 = toRad(start.lng);

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(bearing)
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
    );

  return {
    lat: (lat2 * 180) / Math.PI,
    lng: ((lng2 * 180) / Math.PI + 540) % 360 - 180,
  };
}

/**
 * Generate random waypoints for Sorprendimi loop.
 */
export function generateRandomWaypoints(
  origin: LatLng,
  radiusKm: number,
  count: number
): LatLng[] {
  const waypoints: LatLng[] = [];
  for (let i = 0; i < count; i++) {
    const bearing = Math.random() * 360;
    const distance = (radiusKm * 0.3) + Math.random() * (radiusKm * 0.7);
    waypoints.push(destinationPoint(origin, bearing, distance));
  }
  return waypoints;
}

/**
 * Decode a Google-encoded polyline string into LatLng array.
 */
export function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const deltaLat = (result & 1) ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const deltaLng = (result & 1) ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return points;
}

/**
 * Splits a polyline into chunks of approximately chunkKm kilometers.
 */
export function splitPolylineByDistance(
  points: LatLng[],
  chunkKm: number
): LatLng[][] {
  if (points.length === 0) return [];

  const chunks: LatLng[][] = [];
  let currentChunk: LatLng[] = [points[0]];
  let currentKm = 0;

  for (let i = 1; i < points.length; i++) {
    const segKm = haversineKm(points[i - 1], points[i]);
    currentKm += segKm;
    currentChunk.push(points[i]);

    if (currentKm >= chunkKm && i < points.length - 1) {
      chunks.push(currentChunk);
      currentChunk = [points[i]];
      currentKm = 0;
    }
  }

  if (currentChunk.length > 1) {
    chunks.push(currentChunk);
  }

  return chunks;
}
