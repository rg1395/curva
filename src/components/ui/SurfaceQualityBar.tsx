import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RouteSegment } from '../../types';
import { colors, fonts, fontSizes, radius, spacing } from '../../constants/theme';

interface SurfaceQualityBarProps {
  segments: RouteSegment[];
  showLabel?: boolean;
}

const QUALITY_COLORS: Record<string, string> = {
  excellent: colors.green,
  good: colors.accent,
  fair: colors.yellow,
  bad: colors.red,
  unknown: colors.border,
};

const QUALITY_LABELS: Record<string, string> = {
  excellent: 'Ottimo',
  good: 'Buono',
  fair: 'Discreto',
  bad: 'Dissestato',
  unknown: '—',
};

export function SurfaceQualityBar({ segments, showLabel = true }: SurfaceQualityBarProps) {
  const totalKm = segments.reduce((acc, s) => acc + s.distanceKm, 0);

  if (totalKm === 0) return null;

  // Calculate percentages for each quality level
  const qualityCounts: Record<string, number> = {};
  for (const seg of segments) {
    const q = seg.surfaceQuality || 'unknown';
    qualityCounts[q] = (qualityCounts[q] || 0) + seg.distanceKm;
  }

  return (
    <View style={styles.container}>
      {showLabel && (
        <Text style={styles.label}>Qualità asfalto</Text>
      )}
      <View style={styles.bar}>
        {Object.entries(qualityCounts).map(([quality, km]) => {
          const pct = (km / totalKm) * 100;
          return (
            <View
              key={quality}
              style={[
                styles.segment,
                { flex: pct, backgroundColor: QUALITY_COLORS[quality] ?? colors.border },
              ]}
            />
          );
        })}
      </View>
      <View style={styles.legend}>
        {Object.entries(qualityCounts).map(([quality, km]) => (
          <View key={quality} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: QUALITY_COLORS[quality] ?? colors.border }]} />
            <Text style={styles.legendText}>{QUALITY_LABELS[quality]} {((km / totalKm) * 100).toFixed(0)}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  label: {
    color: colors.muted,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bar: {
    height: 8,
    borderRadius: radius.full,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: colors.border,
    gap: 2,
  },
  segment: {
    borderRadius: radius.full,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
  },
});
