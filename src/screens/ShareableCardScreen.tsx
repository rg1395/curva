import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

import { RootStackParamList } from '../types';
import { colors, fonts, fontSizes, spacing, radius } from '../constants/theme';
import { FunScoreBar } from '../components/ui/FunScoreBar';
import { CurvaLogoMark } from '../components/ui/CurvaLogo';
import { IconClose } from '../components/icons';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type ScreenRoute = RouteProp<RootStackParamList, 'ShareableCard'>;

export function ShareableCardScreen() {
  const navigation = useNavigation<NavProp>();
  const { params } = useRoute<ScreenRoute>();
  const { route } = params;

  const cardRef = useRef<ViewShot>(null);

  const captureAndShare = async (platform: 'whatsapp' | 'instagram' | 'copy') => {
    try {
      if (!cardRef.current) return;

      const uri = await (cardRef.current as any).capture?.();

      if (platform === 'copy' || !uri) {
        // Fallback: share as text
        await Share.share({
          message: buildShareText(route),
          title: `CURVA — ${route.name}`,
        });
        return;
      }

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        await Share.share({ message: buildShareText(route) });
        return;
      }

      if (platform === 'whatsapp') {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `Condividi su WhatsApp`,
        });
      } else if (platform === 'instagram') {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `Condividi su Instagram`,
        });
      } else {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `Condividi il tuo giro`,
        });
      }
    } catch (e) {
      console.warn('Share failed:', e);
    }
  };

  return (
    <View style={styles.overlay}>
      <SafeAreaView style={styles.safeArea}>
        {/* Close */}
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}
        >
          <IconClose size={24} color={colors.text} />
        </TouchableOpacity>

        {/* Shareable Card */}
        <ViewShot ref={cardRef} options={{ format: 'png', quality: 0.95 }}>
          <View style={styles.card}>
            {/* Card header */}
            <View style={styles.cardHeader}>
              <View style={styles.logoRow}>
                <CurvaLogoMark size={22} />
                <Text style={styles.logoText}>CURVA</Text>
              </View>
              <Text style={styles.cardTagline}>Il mio giro su CURVA</Text>
            </View>

            {/* Fun Score hero */}
            <View style={styles.funScoreHero}>
              <Text style={styles.funScoreLabel}>Fun Score</Text>
              <Text style={styles.funScoreNum}>{route.funScore.toFixed(1)}</Text>
              <Text style={styles.funScoreMax}>/10</Text>
            </View>

            {/* Route name */}
            <Text style={styles.routeName}>{route.name}</Text>

            {/* Stats */}
            <View style={styles.statsRow}>
              <StatItem label="Distanza" value={`${route.distanceKm} km`} />
              <StatItem label="Curve" value={`${route.curvesCount}`} />
              <StatItem label="Asfalto" value={`${route.surfaceQualityAvg}%`} />
            </View>

            {/* Score bar */}
            <View style={{ marginTop: spacing.lg }}>
              <FunScoreBar score={route.funScore} showLabel={false} compact />
            </View>

            {/* Footer */}
            <Text style={styles.footer}>curva.app — La strada più divertente</Text>
          </View>
        </ViewShot>

        {/* Share buttons */}
        <View style={styles.shareButtons}>
          <ShareButton
            label="WhatsApp"
            backgroundColor="#25D366"
            onPress={() => captureAndShare('whatsapp')}
          />
          <ShareButton
            label="Instagram"
            backgroundColor="#E1306C"
            onPress={() => captureAndShare('instagram')}
          />
          <ShareButton
            label="Copia"
            backgroundColor={colors.card}
            borderColor={colors.border}
            onPress={() => captureAndShare('copy')}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ShareButton({
  label,
  backgroundColor,
  borderColor,
  onPress,
}: {
  label: string;
  backgroundColor: string;
  borderColor?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.shareBtn, { backgroundColor, borderColor, borderWidth: borderColor ? 1 : 0 }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={styles.shareBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

function buildShareText(route: any): string {
  return (
    `🏍️ Giro completato su CURVA!\n\n` +
    `📍 ${route.name}\n` +
    `⭐ Fun Score: ${route.funScore.toFixed(1)}/10\n` +
    `📏 ${route.distanceKm} km · ${route.curvesCount} curve\n\n` +
    `Scarica CURVA: curva.app`
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 8, 10, 0.95)',
  },
  safeArea: {
    flex: 1,
    padding: spacing.xl,
    gap: spacing.xl,
    justifyContent: 'center',
  },
  closeBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xxxl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  cardHeader: {
    gap: 4,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoText: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: fontSizes.lg,
    letterSpacing: 2,
  },
  cardTagline: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
  },
  funScoreHero: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    alignSelf: 'center',
  },
  funScoreLabel: {
    color: colors.muted,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.md,
  },
  funScoreNum: {
    color: colors.accent,
    fontFamily: fonts.display,
    fontSize: fontSizes.giant,
    lineHeight: fontSizes.giant,
  },
  funScoreMax: {
    color: colors.muted,
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
  },
  routeName: {
    color: colors.text,
    fontFamily: fonts.bodySemibold,
    fontSize: fontSizes.lg,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
  },
  statLabel: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  footer: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    textAlign: 'center',
    opacity: 0.5,
  },
  shareButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  shareBtn: {
    flex: 1,
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.xl,
  },
  shareBtnText: {
    color: '#fff',
    fontFamily: fonts.bodySemibold,
    fontSize: fontSizes.md,
  },
});
