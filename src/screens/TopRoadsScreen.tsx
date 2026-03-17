import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { TopRoad } from '../types';
import { colors, fonts, fontSizes, spacing, radius, touchTarget } from '../constants/theme';
import { fetchTopRoads } from '../api/surface';
import { IconArrowLeft, IconTrophy, IconCurve, IconMoto } from '../components/icons';

const SURFACE_LABELS: Record<string, string> = {
  excellent: 'Ottimo', good: 'Buono', fair: 'Discreto', bad: 'Dissestato', unknown: '—',
};

const SURFACE_COLORS: Record<string, string> = {
  excellent: colors.green, good: colors.accent,
  fair: colors.yellow, bad: colors.red, unknown: colors.muted,
};

export function TopRoadsScreen() {
  const navigation = useNavigation();
  const [roads, setRoads] = useState<TopRoad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRoads();
  }, []);

  const loadRoads = async () => {
    setLoading(true);
    try {
      const data = await fetchTopRoads(undefined, 20);
      if (data.length === 0) {
        // Show mock data for demo when no DB data available
        setRoads(getMockRoads());
      } else {
        setRoads(data);
      }
    } catch (e) {
      setRoads(getMockRoads());
    } finally {
      setLoading(false);
    }
  };

  const getMockRoads = (): TopRoad[] => [
    { id: '1', name: 'SS163 Amalfitana', region: 'Campania', funScore: 9.4, distanceKm: 45, curvesCount: 312, surfaceQuality: 'good', passagesCount: 1247 },
    { id: '2', name: 'Passo dello Stelvio', region: 'Alto Adige', funScore: 9.2, distanceKm: 25, curvesCount: 48, surfaceQuality: 'excellent', passagesCount: 3421 },
    { id: '3', name: 'Passo Gavia', region: 'Lombardia', funScore: 8.9, distanceKm: 32, curvesCount: 72, surfaceQuality: 'excellent', passagesCount: 892 },
    { id: '4', name: 'SS18 Tirrenica Meridionale', region: 'Calabria', funScore: 8.7, distanceKm: 78, curvesCount: 156, surfaceQuality: 'good', passagesCount: 567 },
    { id: '5', name: 'Passo Pordoi', region: 'Trentino', funScore: 8.5, distanceKm: 18, curvesCount: 33, surfaceQuality: 'excellent', passagesCount: 2103 },
    { id: '6', name: 'SS45 Gardesana Occidentale', region: 'Lombardia', funScore: 8.3, distanceKm: 62, curvesCount: 245, surfaceQuality: 'good', passagesCount: 4231 },
    { id: '7', name: 'SP108 Colli Euganei', region: 'Veneto', funScore: 7.9, distanceKm: 41, curvesCount: 98, surfaceQuality: 'excellent', passagesCount: 334 },
    { id: '8', name: 'SS126 Centro Occidentale Sarda', region: 'Sardegna', funScore: 7.7, distanceKm: 120, curvesCount: 87, surfaceQuality: 'fair', passagesCount: 221 },
  ];

  const renderRoad = ({ item, index }: { item: TopRoad; index: number }) => {
    const isTop3 = index < 3;
    const position = index + 1;
    const positionColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

    return (
      <View style={[styles.roadCard, isTop3 && styles.roadCardHighlight]}>
        {/* Position */}
        <Text style={[
          styles.position,
          isTop3 && { color: positionColors[index] },
        ]}>
          {position}
        </Text>

        {/* Road info */}
        <View style={styles.roadInfo}>
          <Text style={styles.roadName}>{item.name}</Text>
          <Text style={styles.roadRegion}>{item.region}</Text>
          <View style={styles.roadMeta}>
            <MetaChip icon={<IconMoto size={14} color={colors.muted} />} label={`${item.distanceKm} km`} />
            <MetaChip icon={<IconCurve size={14} color={colors.green} />} label={`${item.curvesCount} curve`} />
            <View style={[styles.surfaceDot, { backgroundColor: SURFACE_COLORS[item.surfaceQuality] }]} />
            <Text style={[styles.surfaceText, { color: SURFACE_COLORS[item.surfaceQuality] }]}>
              {SURFACE_LABELS[item.surfaceQuality]}
            </Text>
          </View>
        </View>

        {/* Fun Score */}
        <View style={styles.scoreContainer}>
          <Text style={styles.score}>{item.funScore.toFixed(1)}</Text>
          <Text style={styles.scoreLabel}>Fun</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <IconArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <IconTrophy size={24} color={colors.accent} />
          <Text style={styles.title}>Top strade</Text>
        </View>
        <View style={{ width: touchTarget.action }} />
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : (
        <FlatList
          data={roads}
          keyExtractor={item => item.id}
          renderItem={renderRoad}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        />
      )}
    </SafeAreaView>
  );
}

function MetaChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View style={styles.metaChip}>
      {icon}
      <Text style={styles.metaLabel}>{label}</Text>
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
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: touchTarget.action,
    height: touchTarget.action,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: spacing.xl,
    paddingTop: spacing.md,
  },
  roadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    minHeight: 84,
  },
  roadCardHighlight: {
    borderColor: colors.accent + '30',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  position: {
    color: colors.muted,
    fontFamily: fonts.display,
    fontSize: fontSizes.display,
    width: 36,
    textAlign: 'center',
  },
  roadInfo: {
    flex: 1,
    gap: 4,
  },
  roadName: {
    color: colors.text,
    fontFamily: fonts.bodySemibold,
    fontSize: fontSizes.md,
  },
  roadRegion: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
  },
  roadMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaLabel: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
  },
  surfaceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  surfaceText: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  score: {
    color: colors.accent,
    fontFamily: fonts.display,
    fontSize: fontSizes.xxl,
  },
  scoreLabel: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
  },
});
