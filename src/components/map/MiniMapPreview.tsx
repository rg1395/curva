import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { LatLng } from '../../types';
import { colors } from '../../constants/theme';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '';
const MAP_STYLE = MAPBOX_TOKEN
  ? `https://api.mapbox.com/styles/v1/mapbox/dark-v11?access_token=${MAPBOX_TOKEN}`
  : 'https://demotiles.maplibre.org/style.json';

interface MiniMapPreviewProps {
  origin?: LatLng;
  destination?: LatLng;
  height?: number;
}

export function MiniMapPreview({ origin, destination, height = 120 }: MiniMapPreviewProps) {
  if (!origin && !destination) return null;

  const center = origin ?? destination!;

  return (
    <View style={[styles.container, { height }]}>
      <MapLibreGL.MapView
        style={styles.map}
        styleURL={MAP_STYLE}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        attributionEnabled={false}
        logoEnabled={false}
      >
        <MapLibreGL.Camera
          centerCoordinate={[center.lng, center.lat]}
          zoomLevel={11}
          animationDuration={300}
        />

        {origin && (
          <MapLibreGL.ShapeSource
            id="mini-origin"
            shape={{
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [origin.lng, origin.lat] },
              properties: {},
            }}
          >
            <MapLibreGL.CircleLayer
              id="mini-origin-dot"
              style={{
                circleRadius: 7,
                circleColor: colors.accent,
                circleStrokeWidth: 2,
                circleStrokeColor: '#fff',
              }}
            />
          </MapLibreGL.ShapeSource>
        )}

        {destination && (
          <MapLibreGL.ShapeSource
            id="mini-dest"
            shape={{
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [destination.lng, destination.lat] },
              properties: {},
            }}
          >
            <MapLibreGL.CircleLayer
              id="mini-dest-dot"
              style={{
                circleRadius: 7,
                circleColor: colors.green,
                circleStrokeWidth: 2,
                circleStrokeColor: '#fff',
              }}
            />
          </MapLibreGL.ShapeSource>
        )}

        {origin && destination && (
          <MapLibreGL.ShapeSource
            id="mini-line"
            shape={{
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: [
                  [origin.lng, origin.lat],
                  [destination.lng, destination.lat],
                ],
              },
              properties: {},
            }}
          >
            <MapLibreGL.LineLayer
              id="mini-line-layer"
              style={{
                lineColor: colors.accent,
                lineWidth: 2,
                lineDasharray: [4, 3],
                lineOpacity: 0.6,
              }}
            />
          </MapLibreGL.ShapeSource>
        )}
      </MapLibreGL.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
});
