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

import { RootStackParamList, RouteInstruction } from '../types';
import { colors, fonts, fontSizes, spacing, radius, touchTarget } from '../constants/theme';
import { IconClose } from '../components/icons';
import { haversineKm } from '../utils/geo';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type ScreenRoute = RouteProp<RootStackParamList, 'DriveMode'>;

// GraphHopper sign codes → direction
const SIGN_TO_DIRECTION: Record<number, string> = {
  [-7]: 'Inversione a U (sx)',
  [-3]: 'Svolta decisa a sinistra',
  [-2]: 'Svolta a sinistra',
  [-1]: 'Tieni la sinistra',
  [0]: 'Dritto',
  [1]: 'Tieni la destra',
  [2]: 'Svolta a destra',
  [3]: 'Svolta decisa a destra',
  [4]: 'Arrivo',
  [5]: 'Arrivo a sinistra',
  [6]: 'Arrivo a destra',
  [7]: 'Inversione a U (dx)',
};

function DirectionArrow({ sign }: { sign: number }) {
  // Map sign to rotation degrees
  const rotationMap: Record<number, number> = {
    [-7]: 180, [-3]: -90, [-2]: -60, [-1]: -30,
    [0]: 0, [1]: 30, [2]: 60, [3]: 90,
    [4]: 0, [5]: 0, [6]: 0, [7]: 180,
  };

  const rotation = rotationMap[sign] ?? 0;

  return (
    <View style={[styles.arrowContainer, { transform: [{ rotate: `${rotation}deg` }] }]}>
      <Svg width={56} height={56} viewBox="0 0 56 56" fill="none">
        {/* Up arrow */}
        <Path d="M28 10 L28 46" stroke={colors.text} strokeWidth="4" strokeLinecap="round" />
        <Path d="M14 24 L28 10 L42 24" stroke={colors.text} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
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
  const [currentSurface, setCurrentSurface] = useState('—');

  const locationSub = useRef<Location.LocationSubscription | null>(null);

  const currentInstruction = route.instructions[currentInstructionIndex];
  const nextInstruction = route.instructions[currentInstructionIndex + 1];

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
      { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 10 },
      (loc) => {
        updateNavigation(loc.coords.latitude, loc.coords.longitude);
      }
    );
  };

  const updateNavigation = (lat: number, lng: number) => {
    if (!route.instructions.length) return;

    // Find closest instruction
    let minDist = Infinity;
    let closestIdx = currentInstructionIndex;

    const end = Math.min(currentInstructionIndex + 5, route.instructions.length);
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

    // Estimate remaining distance
    const destPoint = route.geometry[route.geometry.length - 1];
    if (destPoint) {
      const remKm = haversineKm({ lat, lng }, destPoint);
      setRemainingKm(Math.max(0, parseFloat(remKm.toFixed(1))));
    }

    // Surface quality at current position
    const nearestSeg = route.segments.find(seg => {
      return seg.points.some(p => haversineKm({ lat, lng }, p) < 0.2);
    });
    if (nearestSeg) {
      const qualityLabels: Record<string, string> = {
        excellent: 'Ottimo', good: 'Buono', fair: 'Discreto', bad: 'Dissestato', unknown: '—',
      };
      setCurrentSurface(qualityLabels[nearestSeg.surfaceQuality] ?? '—');
    }
  };

  const formatDistance = (m: number): string => {
    if (m >= 1000) return `${(m / 1000).toFixed(1)} km`;
    if (m >= 100) return `${Math.round(m / 100) * 100} m`;
    return `${m} m`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Close button */}
      <SafeAreaView style={styles.topBar}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}
        >
          <IconClose size={24} color={colors.text} />
        </TouchableOpacity>

        {/* Current instruction text */}
        {currentInstruction && (
          <Text style={styles.instructionText} numberOfLines={2}>
            {SIGN_TO_DIRECTION[currentInstruction.sign] ?? currentInstruction.text}
          </Text>
        )}
      </SafeAreaView>

      {/* Main: arrow + distance */}
      <View style={styles.main}>
        {/* Arrow circle */}
        <View style={styles.arrowCircle}>
          <DirectionArrow sign={nextInstruction?.sign ?? 0} />
        </View>

        {/* Distance to next maneuver */}
        <Text style={styles.distanceText}>
          {formatDistance(distanceToNextM)}
        </Text>

        {nextInstruction && (
          <Text style={styles.nextText}>
            {SIGN_TO_DIRECTION[nextInstruction.sign] ?? nextInstruction.text}
          </Text>
        )}
      </View>

      {/* Bottom info */}
      <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Rimanenti</Text>
          <Text style={styles.infoValue}>{remainingKm} km</Text>
        </View>
        <View style={[styles.infoCard, styles.infoCardRight]}>
          <Text style={styles.infoLabel}>Asfalto</Text>
          <Text style={[styles.infoValue, styles.surfaceText]}>{currentSurface}</Text>
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
    padding: spacing.xl,
    gap: spacing.lg,
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
  },
  instructionText: {
    flex: 1,
    color: colors.green,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg * 1.3,
  },
  main: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  arrowCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  arrowContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  distanceText: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: fontSizes.ultra,
    lineHeight: fontSizes.ultra,
  },
  nextText: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: fontSizes.lg,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  infoCard: {
    flex: 1,
    minHeight: 80,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  infoCardRight: {},
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
  surfaceText: {
    color: colors.green,
  },
});
