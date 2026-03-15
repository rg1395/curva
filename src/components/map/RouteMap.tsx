import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { LatLng, Route, SegmentType } from '../../types';
import { colors } from '../../constants/theme';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '';
const MAP_STYLE = `https://api.mapbox.com/styles/v1/mapbox/dark-v11?access_token=${MAPBOX_TOKEN}`;

// Fallback style if no Mapbox token
const OSM_STYLE = 'https://demotiles.maplibre.org/style.json';

interface RouteMapProps {
  route: Route;
  height?: number;
  interactive?: boolean;
  showUserLocation?: boolean;
}

const SEGMENT_COLORS: Record<SegmentType, string> = {
  curvy: colors.green,
  scenic: colors.blue,
  transfer: '#4A4A52',
};

export function RouteMap({
  route,
  height = 240,
  interactive = false,
  showUserLocation = false,
}: RouteMapProps) {
  const mapStyle = MAPBOX_TOKEN ? MAP_STYLE : OSM_STYLE;

  // Build GeoJSON for all segments with color property
  const routeGeoJSON = useMemo(() => buildRouteGeoJSON(route), [route]);

  // Calculate bounding box for initial camera
  const bounds = useMemo(() => calculateBounds(route.geometry), [route.geometry]);

  const center = useMemo(() => ({
    lat: (bounds.minLat + bounds.maxLat) / 2,
    lng: (bounds.minLng + bounds.maxLng) / 2,
  }), [bounds]);

  return (
    <View style={[styles.container, { height }]}>
      <MapLibreGL.MapView
        style={styles.map}
        styleURL={mapStyle}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        rotateEnabled={false}
        pitchEnabled={false}
        attributionEnabled={false}
        logoEnabled={false}
      >
        <MapLibreGL.Camera
          bounds={{
            ne: [bounds.maxLng, bounds.maxLat],
            sw: [bounds.minLng, bounds.minLat],
            paddingTop: 20,
            paddingBottom: 20,
            paddingLeft: 20,
            paddingRight: 20,
          }}
          animationDuration={500}
        />

        {showUserLocation && <MapLibreGL.UserLocation visible renderMode="native" />}

        {/* Route segments colored by type */}
        <MapLibreGL.ShapeSource id="route" shape={routeGeoJSON}>
          {/* Transfer (grey) segments - draw first (bottom layer) */}
          <MapLibreGL.LineLayer
            id="route-transfer"
            style={{
              lineColor: '#4A4A52',
              lineWidth: 3,
              lineOpacity: 0.8,
            }}
            filter={['==', ['get', 'type'], 'transfer']}
          />
          {/* Curvy (green) segments */}
          <MapLibreGL.LineLayer
            id="route-curvy"
            style={{
              lineColor: colors.green,
              lineWidth: 4,
              lineOpacity: 0.9,
            }}
            filter={['==', ['get', 'type'], 'curvy']}
          />
          {/* Scenic (blue) segments */}
          <MapLibreGL.LineLayer
            id="route-scenic"
            style={{
              lineColor: colors.blue,
              lineWidth: 4,
              lineOpacity: 0.9,
            }}
            filter={['==', ['get', 'type'], 'scenic']}
          />
        </MapLibreGL.ShapeSource>

        {/* Origin marker */}
        <MapLibreGL.ShapeSource
          id="origin"
          shape={{
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [route.origin.coordinates.lng, route.origin.coordinates.lat],
            },
            properties: {},
          }}
        >
          <MapLibreGL.CircleLayer
            id="origin-dot"
            style={{
              circleRadius: 8,
              circleColor: colors.accent,
              circleStrokeWidth: 2,
              circleStrokeColor: '#fff',
            }}
          />
        </MapLibreGL.ShapeSource>

        {/* Destination marker */}
        <MapLibreGL.ShapeSource
          id="destination"
          shape={{
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [route.destination.coordinates.lng, route.destination.coordinates.lat],
            },
            properties: {},
          }}
        >
          <MapLibreGL.CircleLayer
            id="destination-dot"
            style={{
              circleRadius: 8,
              circleColor: colors.green,
              circleStrokeWidth: 2,
              circleStrokeColor: '#fff',
            }}
          />
        </MapLibreGL.ShapeSource>
      </MapLibreGL.MapView>

      {/* Legend */}
      {!interactive && (
        <View style={styles.legend} pointerEvents="none">
          <LegendItem color={colors.green} label="Curvy" />
          <LegendItem color={colors.blue} label="Panorama" />
          <LegendItem color="#4A4A52" label="Trasferimento" />
        </View>
      )}
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendLine, { backgroundColor: color }]} />
      <View style={styles.legendText}>
        <View style={{ width: 4 }} />
      </View>
    </View>
  );
}

function buildRouteGeoJSON(route: Route): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = route.segments.map((seg) => ({
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: seg.points.map(p => [p.lng, p.lat]),
    },
    properties: {
      type: seg.type,
      sinuosity: seg.sinuosityIndex,
      surface: seg.surfaceQuality,
    },
  }));

  return { type: 'FeatureCollection', features };
}

interface Bounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

function calculateBounds(points: LatLng[]): Bounds {
  if (points.length === 0) {
    return { minLat: 41, maxLat: 42, minLng: 12, maxLng: 13 };
  }

  let minLat = points[0].lat;
  let maxLat = points[0].lat;
  let minLng = points[0].lng;
  let maxLng = points[0].lng;

  for (const p of points) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  }

  return { minLat, maxLat, minLng, maxLng };
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  legend: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'rgba(8, 8, 10, 0.8)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendLine: {
    width: 16,
    height: 3,
    borderRadius: 2,
  },
  legendText: {
    flexDirection: 'row',
  },
});
