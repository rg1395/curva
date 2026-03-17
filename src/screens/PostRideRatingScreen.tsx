import React, { useState, useRef } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';

import { RootStackParamList, RouteSegment, SurfaceQuality } from '../types';
import { colors, fonts, fontSizes, spacing, radius, touchTarget } from '../constants/theme';
import { Button } from '../components/ui/Button';
import { IconArrowLeft, IconQualityExcellent, IconQualityGood, IconQualityFair, IconQualityBad } from '../components/icons';
import { saveSegmentRating } from '../api/surface';
import { supabase } from '../api/supabase';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type ScreenRoute = RouteProp<RootStackParamList, 'PostRideRating'>;

type RatingMap = Record<number, SurfaceQuality>;

const QUALITY_OPTIONS: Array<{
  key: SurfaceQuality;
  label: string;
  icon: (selected: boolean) => React.ReactNode;
}> = [
  { key: 'excellent', label: 'Ottimo', icon: (sel) => <IconQualityExcellent size={40} selected={sel} /> },
  { key: 'good', label: 'Buono', icon: (sel) => <IconQualityGood size={40} selected={sel} /> },
  { key: 'fair', label: 'Discreto', icon: (sel) => <IconQualityFair size={40} selected={sel} /> },
  { key: 'bad', label: 'Dissestato', icon: (sel) => <IconQualityBad size={40} selected={sel} /> },
];

const QUALITY_COLORS: Record<SurfaceQuality, string> = {
  excellent: colors.green,
  good: colors.accent,
  fair: colors.yellow,
  bad: colors.red,
  unknown: colors.muted,
};

export function PostRideRatingScreen() {
  const navigation = useNavigation<NavProp>();
  const { params } = useRoute<ScreenRoute>();
  const { route, rideId } = params;
  const scrollRef = useRef<ScrollView>(null);

  // Pre-select based on accelerometer auto-rating
  const initialRatings: RatingMap = {};
  route.segments.forEach((seg, i) => {
    if (seg.surfaceQuality !== 'unknown') {
      initialRatings[i] = seg.surfaceQuality;
    }
  });

  const [ratings, setRatings] = useState<RatingMap>(initialRatings);
  const [saving, setSaving] = useState(false);

  const ratedCount = Object.keys(ratings).length;
  const totalCount = route.segments.length;
  const progressPercent = totalCount > 0 ? (ratedCount / totalCount) * 100 : 0;

  const handleRate = (segmentIndex: number, quality: SurfaceQuality) => {
    setRatings(prev => ({ ...prev, [segmentIndex]: quality }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id ?? 'anonymous';

      const savePromises = route.segments.map(async (seg, i) => {
        const rating = ratings[i];
        if (rating) {
          await saveSegmentRating(`seg-${i}`, rating, userId);
        }
      });

      await Promise.allSettled(savePromises);
      navigation.navigate('ShareableCard', { route, rideId });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <IconArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Com'era l'asfalto?</Text>
          <Text style={styles.subtitle}>Aiuta gli altri motociclisti</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>
            {ratedCount} di {totalCount} tratti valutati
          </Text>
          <Text style={styles.progressPercent}>{Math.round(progressPercent)}%</Text>
        </View>
        <View style={styles.progressTrack}>
          <LinearGradient
            colors={[colors.accent, colors.green]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${progressPercent}%` }]}
          />
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {route.segments.map((seg, i) => (
          <SegmentRater
            key={i}
            segment={seg}
            index={i}
            totalCount={totalCount}
            selected={ratings[i]}
            autoRating={seg.surfaceQuality !== 'unknown' ? seg.surfaceQuality : undefined}
            onRate={(q) => handleRate(i, q)}
          />
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        {ratedCount < totalCount && (
          <Text style={styles.bottomHint}>
            {totalCount - ratedCount} tratti ancora da valutare
          </Text>
        )}
        <Button
          label={saving ? 'Salvataggio...' : 'Salva e condividi'}
          onPress={handleSave}
          loading={saving}
        />
      </View>
    </SafeAreaView>
  );
}

function SegmentRater({
  segment,
  index,
  totalCount,
  selected,
  autoRating,
  onRate,
}: {
  segment: RouteSegment;
  index: number;
  totalCount: number;
  selected?: SurfaceQuality;
  autoRating?: SurfaceQuality;
  onRate: (q: SurfaceQuality) => void;
}) {
  return (
    <View style={styles.segmentCard}>
      <View style={styles.segmentHeader}>
        <View style={styles.segmentTitleRow}>
          <Text style={styles.segmentName}>Tratto {index + 1}</Text>
          <Text style={styles.segmentCounter}>/{totalCount}</Text>
          <Text style={styles.segmentKm}>{segment.distanceKm.toFixed(1)} km</Text>
        </View>
        {autoRating && (
          <View style={[styles.autoBadge, { backgroundColor: QUALITY_COLORS[autoRating] + '20' }]}>
            <Text style={[styles.autoBadgeText, { color: QUALITY_COLORS[autoRating] }]}>
              Rilevato: {autoRating === 'excellent' ? 'Ottimo' :
                        autoRating === 'good' ? 'Buono' :
                        autoRating === 'fair' ? 'Discreto' : 'Dissestato'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.optionsRow}>
        {QUALITY_OPTIONS.map(opt => {
          const isSelected = selected === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.optionBtn,
                isSelected && {
                  backgroundColor: QUALITY_COLORS[opt.key] + '15',
                  borderColor: QUALITY_COLORS[opt.key],
                },
              ]}
              onPress={() => onRate(opt.key)}
              activeOpacity={0.8}
            >
              {opt.icon(isSelected)}
              <Text style={[
                styles.optionLabel,
                isSelected && { color: QUALITY_COLORS[opt.key] },
              ]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.lg,
  },
  backBtn: {
    width: touchTarget.action,
    height: touchTarget.action,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    gap: 2,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
  },
  subtitle: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
  },
  progressContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
  },
  progressPercent: {
    color: colors.accent,
    fontFamily: fonts.bodySemibold,
    fontSize: fontSizes.xs,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    gap: spacing.lg,
  },
  segmentCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  segmentHeader: {
    gap: spacing.xs,
  },
  segmentTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  segmentName: {
    color: colors.text,
    fontFamily: fonts.bodySemibold,
    fontSize: fontSizes.md,
  },
  segmentCounter: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
  },
  segmentKm: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    marginLeft: 'auto' as any,
  },
  autoBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  autoBadgeText: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  optionBtn: {
    flex: 1,
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: 5,
    paddingVertical: spacing.sm,
  },
  optionLabel: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
  },
  bottomBar: {
    padding: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
    gap: spacing.sm,
  },
  bottomHint: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    textAlign: 'center',
  },
});
