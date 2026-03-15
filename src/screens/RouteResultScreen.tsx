import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParamList, RouteSegment } from '../types';
import { colors, fonts, fontSizes, spacing, radius, touchTarget } from '../constants/theme';
import { RouteMap } from '../components/map/RouteMap';
import { FunScoreBar } from '../components/ui/FunScoreBar';
import { SurfaceQualityBar } from '../components/ui/SurfaceQualityBar';
import { StatCard } from '../components/ui/StatCard';
import { Button } from '../components/ui/Button';
import {
  IconArrowLeft, IconShare, IconHelmet, IconCurve,
  IconMountain, IconTimer, IconMoto,
} from '../components/icons';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type ScreenRoute = RouteProp<RootStackParamList, 'RouteResult'>;

const SEGMENT_TYPE_LABELS = {
  curvy: 'Curvy',
  scenic: 'Panorama',
  transfer: 'Trasferimento',
};

const SEGMENT_TYPE_COLORS = {
  curvy: colors.green,
  scenic: colors.blue,
  transfer: colors.muted,
};

const SURFACE_COLORS = {
  excellent: colors.green,
  good: colors.accent,
  fair: colors.yellow,
  bad: colors.red,
  unknown: colors.muted,
};

const SURFACE_LABELS = {
  excellent: 'Ottimo',
  good: 'Buono',
  fair: 'Discreto',
  bad: 'Dissestato',
  unknown: 'Nessun dato',
};

export function RouteResultScreen() {
  const navigation = useNavigation<NavProp>();
  const { params } = useRoute<ScreenRoute>();
  const { route } = params;

  const formatDuration = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h === 0) return `${m} min`;
    return `${h}h ${m}m`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Fixed header */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <IconArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{route.name}</Text>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.navigate('ShareableCard', { route })}
        >
          <IconShare size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Map */}
        <RouteMap route={route} height={240} interactive={false} />

        {/* Fun Score */}
        <View style={styles.section}>
          <FunScoreBar score={route.funScore} showLabel />
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon={<IconMoto size={28} color={colors.muted} />}
            label="Distanza"
            value={`${route.distanceKm}`}
            sub="km"
          />
          <StatCard
            icon={<IconTimer size={28} color={colors.muted} />}
            label="Tempo"
            value={formatDuration(route.durationMin)}
          />
          <StatCard
            icon={<IconCurve size={28} color={colors.green} />}
            label="Curve"
            value={`${route.curvesCount}`}
            highlight
          />
          <StatCard
            icon={<IconMountain size={28} color={colors.blue} />}
            label="Dislivello"
            value={`${route.elevationGainM}`}
            sub="m"
          />
        </View>

        {/* Surface quality */}
        <View style={styles.section}>
          <SurfaceQualityBar segments={route.segments} showLabel />
        </View>

        {/* Fun Score breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dettaglio Fun Score</Text>
          <View style={styles.breakdownList}>
            <BreakdownRow label="Sinuosità" value={route.funScoreBreakdown.sinuosity} weight="40%" />
            <BreakdownRow label="Asfalto" value={route.funScoreBreakdown.surface} weight="25%" />
            <BreakdownRow label="Panoramicità" value={route.funScoreBreakdown.scenic} weight="15%" />
            <BreakdownRow label="Traffico basso" value={route.funScoreBreakdown.lowTraffic} weight="10%" />
            <BreakdownRow label="Dislivello" value={route.funScoreBreakdown.elevation} weight="10%" />
          </View>
        </View>

        {/* Segment timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Segmenti</Text>
          {route.segments.map((seg, i) => (
            <SegmentRow key={i} segment={seg} index={i} />
          ))}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Fixed bottom actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.helmetBtn}
          onPress={() => navigation.navigate('DriveMode', { route })}
        >
          <IconHelmet size={28} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Button
            label="Naviga e registra"
            onPress={() => navigation.navigate('RideRecording', { route })}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function BreakdownRow({ label, value, weight }: { label: string; value: number; weight: string }) {
  const percentage = value * 100;
  return (
    <View style={styles.breakdownRow}>
      <Text style={styles.breakdownLabel}>{label}</Text>
      <Text style={styles.breakdownWeight}>{weight}</Text>
      <View style={styles.breakdownTrack}>
        <View style={[styles.breakdownFill, { width: `${percentage}%` }]} />
      </View>
      <Text style={styles.breakdownValue}>{(value * 10).toFixed(1)}</Text>
    </View>
  );
}

function SegmentRow({ segment, index }: { segment: RouteSegment; index: number }) {
  const typeColor = SEGMENT_TYPE_COLORS[segment.type] ?? colors.muted;
  const surfaceColor = SURFACE_COLORS[segment.surfaceQuality] ?? colors.muted;
  const surfaceLabel = SURFACE_LABELS[segment.surfaceQuality] ?? 'Nessun dato';

  return (
    <View style={styles.segmentRow}>
      <View style={[styles.segmentDot, { backgroundColor: typeColor }]} />
      <View style={styles.segmentInfo}>
        <View style={styles.segmentHeader}>
          <Text style={styles.segmentName}>Tratto {index + 1}</Text>
          <View style={[styles.segmentBadge, { backgroundColor: typeColor + '20' }]}>
            <Text style={[styles.segmentBadgeText, { color: typeColor }]}>
              {SEGMENT_TYPE_LABELS[segment.type]}
            </Text>
          </View>
        </View>
        <View style={styles.segmentMeta}>
          <Text style={styles.segmentMetaText}>{segment.distanceKm.toFixed(1)} km</Text>
          <Text style={styles.segmentMetaText}>·</Text>
          <View style={[styles.surfaceDot, { backgroundColor: surfaceColor }]} />
          <Text style={[styles.segmentMetaText, { color: surfaceColor }]}>{surfaceLabel}</Text>
          {segment.surfaceConfidence < 0.3 && (
            <Text style={styles.noDataBadge}>nessun dato</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  iconBtn: {
    width: touchTarget.action,
    height: touchTarget.action,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    color: colors.text,
    fontFamily: fonts.bodySemibold,
    fontSize: fontSizes.base,
    textAlign: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: spacing.xl,
    gap: spacing.xl,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.muted,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  // Breakdown
  breakdownList: {
    gap: spacing.md,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  breakdownLabel: {
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    width: 100,
  },
  breakdownWeight: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    width: 32,
    textAlign: 'right',
  },
  breakdownTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  breakdownFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: radius.full,
  },
  breakdownValue: {
    color: colors.accent,
    fontFamily: fonts.display,
    fontSize: fontSizes.md,
    width: 32,
    textAlign: 'right',
  },
  // Segments
  segmentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  segmentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  segmentInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  segmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  segmentName: {
    color: colors.text,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.md,
  },
  segmentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  segmentBadgeText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
  },
  segmentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  segmentMetaText: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
  },
  surfaceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  noDataBadge: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  // Bottom bar
  bottomBar: {
    flexDirection: 'row',
    padding: spacing.xl,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
    alignItems: 'center',
  },
  helmetBtn: {
    width: touchTarget.cta,
    height: touchTarget.cta,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
