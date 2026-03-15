import React, { useState } from 'react';
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
  {
    key: 'excellent',
    label: 'Ottimo',
    icon: (sel) => <IconQualityExcellent size={44} selected={sel} />,
  },
  {
    key: 'good',
    label: 'Buono',
    icon: (sel) => <IconQualityGood size={44} selected={sel} />,
  },
  {
    key: 'fair',
    label: 'Discreto',
    icon: (sel) => <IconQualityFair size={44} selected={sel} />,
  },
  {
    key: 'bad',
    label: 'Dissestato',
    icon: (sel) => <IconQualityBad size={44} selected={sel} />,
  },
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

  // Pre-select based on accelerometer auto-rating
  const initialRatings: RatingMap = {};
  route.segments.forEach((seg, i) => {
    if (seg.surfaceQuality !== 'unknown') {
      initialRatings[i] = seg.surfaceQuality;
    }
  });

  const [ratings, setRatings] = useState<RatingMap>(initialRatings);
  const [saving, setSaving] = useState(false);

  const handleRate = (segmentIndex: number, quality: SurfaceQuality) => {
    setRatings(prev => ({ ...prev, [segmentIndex]: quality }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id ?? 'anonymous';

      // Save ratings for segments that have IDs
      const savePromises = route.segments.map(async (seg, i) => {
        const rating = ratings[i];
        if (rating && seg.sinuosityIndex) {
          // Use sinuosity as a proxy segment ID for now
          // In production, segments would have real IDs from road_segments table
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
        >
          <IconArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Com'era l'asfalto?</Text>
          <Text style={styles.subtitle}>Aiuta gli altri motociclisti</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {route.segments.map((seg, i) => (
          <SegmentRater
            key={i}
            segment={seg}
            index={i}
            selected={ratings[i]}
            autoRating={seg.surfaceQuality !== 'unknown' ? seg.surfaceQuality : undefined}
            onRate={(q) => handleRate(i, q)}
          />
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button
          label="Salva e condividi"
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
  selected,
  autoRating,
  onRate,
}: {
  segment: RouteSegment;
  index: number;
  selected?: SurfaceQuality;
  autoRating?: SurfaceQuality;
  onRate: (q: SurfaceQuality) => void;
}) {
  return (
    <View style={styles.segmentCard}>
      <View style={styles.segmentHeader}>
        <Text style={styles.segmentName}>Tratto {index + 1}</Text>
        <Text style={styles.segmentKm}>{segment.distanceKm.toFixed(1)} km</Text>
        {autoRating && (
          <View style={[styles.autoBadge, { backgroundColor: QUALITY_COLORS[autoRating] + '20' }]}>
            <Text style={[styles.autoBadgeText, { color: QUALITY_COLORS[autoRating] }]}>
              Auto: {autoRating === 'excellent' ? 'Ottimo' :
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
    padding: spacing.xl,
    gap: spacing.lg,
  },
  backBtn: {
    width: touchTarget.action,
    height: touchTarget.action,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginTop: 2,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.xl,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  segmentName: {
    color: colors.text,
    fontFamily: fonts.bodySemibold,
    fontSize: fontSizes.md,
  },
  segmentKm: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
  },
  autoBadge: {
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
    gap: 6,
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
  },
});
