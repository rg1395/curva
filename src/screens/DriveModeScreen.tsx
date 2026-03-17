import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import Svg, { Path, Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

import { RootStackParamList, RouteInstruction } from '../types';
import { colors, fonts, fontSizes, spacing, radius, touchTarget } from '../constants/theme';
import { IconClose } from '../components/icons';
import { haversineKm } from '../utils/geo';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type ScreenRoute = RouteProp<RootStackParamList, 'DriveMode'>;

const SIGN_TO_DIRECTION: Record<number, string> = {
  [-7]: 'Inversione a U a sinistra',
  [-3]: 'Svolta decisa a sinistra',
  [-2]: 'Svolta a sinistra',
  [-1]: 'Tieni la sinistra',
  [0]: 'Prosegui dritto',
  [1]: 'Tieni la destra',
  [2]: 'Svolta a destra',
  [3]: 'Svolta decisa a destra',
  [4]: 'Sei arrivato',
  [5]: 'Arrivo a sinistra',
  [6]: 'Arrivo a destra',
  [7]: 'Inversione a U a destra',
};

const SURFACE_QUALITY_COLORS: Record<string, string> = {
  excellent: colors.green,
  good: colors.accent,
  fair: colors.yellow,
  bad: colors.red,
  unknown: colors.muted,
};

function DirectionArrow({ sign }: { sign: number }) {
  const rotationMap: Record<number, number> = {
    [-7]: 180, [-3]: -90, [-2]: -55, [-1]: -25,
    [0]: 0, [1]: 25, [2]: 55, [3]: 90,
    [4]: 0, [5]: 0, [6]: 0, [7]: 180,
  };
  const rotation = rotationMap[sign] ?? 0;

  return (
    <View style={{ transform: [{ rotate: `${rotation}deg` }], alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={52} height={52} viewBox="0 0 52 52" fill="none">
        <Path
          d="M26 44 L26 12"
          stroke={colors.text}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <Path
          d="M14 24 L26 12 L38 24"
          stroke={colors.text}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

export function DriveModeScreen() {
  const navigation = useNavigation<NavProp>();
  const { params } = useRoute<ScreenRoute>();
  const { route } = params;

  const [currentInstructionIndex, setCurrentInstructionIndex] = useState(0);
  const [distanceToNextM, setDistanceToNextM] = useState(0);
  const [remainingKm, setRemainingKm] = useState(route.distanceKm);
  const [currentSurface, setCurrentSurface] = useState<string>('—');
  const [surfaceColor, setSurfaceColor] = useState(colors.muted);

  const locationSub = useRef<Location.LocationSubscription | null>(null);

  const currentInstruction = route.instructions[currentInstructionIndex];
  const nextInstruction = route.instructions[currentInstructionIndex + 1];

  const isArrived = currentInstruction?.sign === 4 ||
    (currentInstructionIndex >= route.instructions.length - 1 && remainingKm < 0.1);

  useEffect(() => {
    activateKeepAwakeAsync();
    startLocationTracking();
    return () => {
      deactivateKeepAwake();
      locationSub.current?.remove();
    };
  }, []);

  const startLocationTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    locationSub.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 8 },
      (loc) => updateNavigation(loc.coords.latitude, loc.coords.longitude)
    );
  };

  const updateNavigation = (lat: number, lng: number) => {
    if (!route.instructions.length) return;

    let minDist = Infinity;
    let closestIdx = currentInstructionIndex;

    const end = Math.min(currentInstructionIndex + 15, route.instructions.length);
    for (let i = currentInstructionIndex; i < end; i++) {
      const ins = route.instructions[i];
      const point = route.geometry[ins.interval[0]];
      if (!point) continue;
      const d = haversineKm({ lat, lng }, point);
      if (d < minDist) {
        minDist = d;
        closestIdx = i;
      }
    }

    const nextIns = route.instructions[closestIdx + 1];
    if (nextIns) {
      const nextPoint = route.geometry[nextIns.interval[0]];
      if (nextPoint) {
        const dKm = haversineKm({ lat, lng }, nextPoint);
        setDistanceToNextM(Math.round(dKm * 1000));
      }
    }

    if (minDist < 0.05 && closestIdx < route.instructions.length - 1) {
      setCurrentInstructionIndex(closestIdx + 1);
    }

    const destPoint = route.geometry[route.geometry.length - 1];
    if (destPoint) {
      const remKm = haversineKm({ lat, lng }, destPoint);
      setRemainingKm(Math.max(0, parseFloat(remKm.toFixed(1))));
    }

    const nearestSeg = route.segments.find(seg =>
      seg.points.some(p => haversineKm({ lat, lng }, p) < 0.2)
    );
    if (nearestSeg) {
      const qualityLabels: Record<string, string> = {
        excellent: 'Ottimo', good: 'Buono', fair: 'Discreto', bad: 'Dissestato', unknown: '—',
      };
      setCurrentSurface(qualityLabels[nearestSeg.surfaceQuality] ?? '—');
      setSurfaceColor(SURFACE_QUALITY_COLORS[nearestSeg.surfaceQuality] ?? colors.muted);
    }
  };

  const formatDistance = (m: number): string => {
    if (m >= 1000) return `${(m / 1000).toFixed(1)} km`;
    if (m >= 200) return `${Math.round(m / 100) * 100} m`;
    if (m >= 50) return `${Math.round(m / 50) * 50} m`;
    return `${m} m`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Top bar: close + current instruction */}
      <SafeAreaView style={styles.topBar}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <IconClose size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.instructionCard}>
          {currentInstruction && (
            <Text style={styles.instructionText} numberOfLines={2}>
              {SIGN_TO_DIRECTION[currentInstruction.sign] ?? currentInstruction.text}
            </Text>
          )}
        </View>
      </SafeAreaView>

      {/* Main navigation area */}
      <View style={styles.main}>
        {isArrived ? (
          <View style={styles.arrivedContainer}>
            <Text style={styles.arrivedEmoji}>🏁</Text>
            <Text style={styles.arrivedText}>Sei arrivato!</Text>
          </View>
        ) : (
          <>
            {/* Arrow circle with gradient border */}
            <View style={styles.arrowWrapper}>
              <LinearGradient
                colors={[colors.accent + '60', colors.green + '30']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.arrowGradientBorder}
              >
                <View style={styles.arrowCircle}>
                  <DirectionArrow sign={nextInstruction?.sign ?? 0} />
                </View>
              </LinearGradient>
            </View>

            {/* Distance to next maneuver */}
            <Text style={styles.distanceText}>{formatDistance(distanceToNextM)}</Text>

            {nextInstruction && (
              <View style={styles.nextRow}>
                <Text style={styles.nextLabel}>poi</Text>
                <Text style={styles.nextText} numberOfLines={1}>
                  {SIGN_TO_DIRECTION[nextInstruction.sign] ?? nextInstruction.text}
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* Bottom info strip */}
      <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Rimanenti</Text>
          <Text style={styles.infoValue}>{remainingKm} km</Text>
        </View>
        <View style={styles.infoCardDivider} />
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Asfalto</Text>
          <Text style={[styles.infoValue, { color: surfaceColor }]}>{currentSurface}</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  closeBtn: {
    width: touchTarget.cta,
    height: touchTarget.cta,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    flexShrink: 0,
  },
  instructionCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: touchTarget.cta,
    justifyContent: 'center',
  },
  instructionText: {
    color: colors.text,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg * 1.3,
  },
  main: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  arrowWrapper: {},
  arrowGradientBorder: {
    width: 148,
    height: 148,
    borderRadius: 74,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  arrowCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 71,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  distanceText: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: fontSizes.mega,
    letterSpacing: -1,
    lineHeight: fontSizes.mega,
  },
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  nextLabel: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
  },
  nextText: {
    color: colors.muted,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.md,
    flexShrink: 1,
  },
  arrivedContainer: {
    alignItems: 'center',
    gap: spacing.xl,
  },
  arrivedEmoji: {
    fontSize: 72,
  },
  arrivedText: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: fontSizes.display,
  },
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: 0,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderTopLeftRadius: radius.xxxl,
    borderTopRightRadius: radius.xxxl,
    overflow: 'hidden',
  },
  infoCard: {
    flex: 1,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  infoCardDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  infoLabel: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  infoValue: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: fontSizes.display,
  },
});
