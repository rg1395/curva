import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

import { RootStackParamList, Route } from '../types';
import { colors, fonts, fontSizes, spacing, radius, touchTarget } from '../constants/theme';
import { useRouteStore } from '../store/routeStore';
import { IconArrowLeft, IconBookmark, IconMoto, IconCurve, IconTimer, IconHeart } from '../components/icons';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export function SavedRoutesScreen() {
  const navigation = useNavigation<NavProp>();
  const { savedRoutes, removeSavedRoute } = useRouteStore();

  const formatDuration = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h === 0) return `${m} min`;
    return `${h}h ${m}m`;
  };

  const renderRoute = ({ item, index }: { item: Route; index: number }) => {
    const funColor =
      item.funScore >= 8 ? colors.green :
      item.funScore >= 6 ? colors.accent :
      colors.yellow;

    return (
      <TouchableOpacity
        style={styles.routeCard}
        onPress={() => navigation.navigate('RouteResult', { route: item })}
        activeOpacity={0.85}
      >
        {/* Fun score accent line */}
        <LinearGradient
          colors={[funColor + '60', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.accentLine}
        />

        <View style={styles.cardContent}>
          <View style={styles.cardLeft}>
            <Text style={styles.routeName} numberOfLines={1}>{item.name}</Text>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <IconMoto size={13} color={colors.muted} />
                <Text style={styles.metaText}>{item.distanceKm} km</Text>
              </View>
              <Text style={styles.metaDot}>·</Text>
              <View style={styles.metaItem}>
                <IconTimer size={13} color={colors.muted} />
                <Text style={styles.metaText}>{formatDuration(item.durationMin)}</Text>
              </View>
              <Text style={styles.metaDot}>·</Text>
              <View style={styles.metaItem}>
                <IconCurve size={13} color={colors.green} />
                <Text style={styles.metaText}>{item.curvesCount} curve</Text>
              </View>
            </View>
          </View>

          <View style={styles.cardRight}>
            <Text style={[styles.funScore, { color: funColor }]}>{item.funScore.toFixed(1)}</Text>
            <Text style={styles.funLabel}>Fun</Text>
          </View>
        </View>

        {/* Delete button */}
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => removeSavedRoute(index)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.deleteBtnText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <IconArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <IconBookmark size={22} color={colors.accent} />
          <Text style={styles.title}>I miei percorsi</Text>
        </View>
        <View style={{ width: touchTarget.action }} />
      </View>

      {savedRoutes.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <IconHeart size={40} color={colors.muted} />
          </View>
          <Text style={styles.emptyTitle}>Nessun percorso salvato</Text>
          <Text style={styles.emptyText}>
            Salva i percorsi che ami per ritrovarli qui.{'\n'}
            Tocca il cuore nella schermata del percorso.
          </Text>
        </View>
      ) : (
        <FlatList
          data={savedRoutes}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderRoute}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          ListHeaderComponent={
            <Text style={styles.countText}>
              {savedRoutes.length} {savedRoutes.length === 1 ? 'percorso salvato' : 'percorsi salvati'}
            </Text>
          }
        />
      )}
    </SafeAreaView>
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
  list: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  countText: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  routeCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  accentLine: {
    height: 2,
    width: '100%',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.md,
    paddingRight: 48,
  },
  cardLeft: {
    flex: 1,
    gap: 6,
  },
  routeName: {
    color: colors.text,
    fontFamily: fonts.bodySemibold,
    fontSize: fontSizes.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
  },
  metaDot: {
    color: colors.border,
    fontSize: fontSizes.xs,
  },
  cardRight: {
    alignItems: 'center',
    marginLeft: spacing.lg,
  },
  funScore: {
    fontFamily: fonts.display,
    fontSize: fontSizes.xxl,
  },
  funLabel: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
  },
  deleteBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    color: colors.muted,
    fontSize: fontSizes.sm,
    fontFamily: fonts.body,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    textAlign: 'center',
  },
  emptyText: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    textAlign: 'center',
    lineHeight: fontSizes.sm * 1.7,
  },
});
