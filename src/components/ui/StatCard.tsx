import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, fontSizes, radius, spacing } from '../../constants/theme';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}

export function StatCard({ icon, label, value, sub, highlight = false }: StatCardProps) {
  return (
    <View style={[styles.card, highlight && styles.highlighted]}>
      {icon}
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, highlight && styles.valueHighlight]}>{value}</Text>
      {sub && <Text style={styles.sub}>{sub}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 105,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
    justifyContent: 'center',
  },
  highlighted: {
    borderColor: colors.accent + '40',
    backgroundColor: colors.accent + '10',
  },
  label: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: spacing.xs,
  },
  value: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: fontSizes.xxl,
    lineHeight: fontSizes.xxl * 1.1,
  },
  valueHighlight: {
    color: colors.accent,
  },
  sub: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
  },
});
