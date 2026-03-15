import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, fontSizes, radius, spacing } from '../../constants/theme';

interface FunScoreBarProps {
  score: number; // 1-10
  showLabel?: boolean;
  compact?: boolean;
}

export function FunScoreBar({ score, showLabel = true, compact = false }: FunScoreBarProps) {
  const percentage = (score / 10) * 100;

  return (
    <View style={styles.container}>
      {showLabel && (
        <View style={styles.header}>
          <Text style={styles.label}>Fun Score</Text>
          <Text style={styles.score}>{score.toFixed(1)}</Text>
        </View>
      )}
      <View style={[styles.track, compact && styles.trackCompact]}>
        <LinearGradient
          colors={[colors.yellow, colors.accent, colors.green]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { width: `${percentage}%` }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: colors.muted,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  score: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: fontSizes.display,
  },
  track: {
    height: 10,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  trackCompact: {
    height: 6,
  },
  fill: {
    height: '100%',
    borderRadius: radius.full,
  },
});
