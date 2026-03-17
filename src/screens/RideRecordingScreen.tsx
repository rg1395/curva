import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Polyline } from 'react-native-svg';
import { RootStackParamList } from '../types';
import { colors, fonts, fontSizes, spacing, radius, touchTarget } from '../constants/theme';
import { startAccelerometer, stopAccelerometer, getWaveformData } from '../utils/accelerometer';
import { classifySurfaceQuality } from '../utils/accelerometer';
import { uploadSurfaceReading } from '../api/surface';
import { saveRide } from '../api/surface';
import { useRideStore } from '../store/rideStore';
import { Button } from '../components/ui/Button';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type ScreenRoute = RouteProp<RootStackParamList, 'RideRecording'>;

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
  unknown: '—',
};

export function RideRecordingScreen() {
  const navigation = useNavigation<NavProp>();
  const { params } = useRoute<ScreenRoute>();
  const { route } = params;

  const {
    isRecording, startedAt, elapsedSeconds, dataPoints,
    currentSurfaceQuality, currentVibrationRms, waveformData,
    startRide, stopRide, updateQuality, incrementDataPoints,
    addWaveformValue, tick, reset,
  } = useRideStore();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveformRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dotAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    beginRide();
    return () => {
      stopEverything();
    };
  }, []);

  const beginRide = async () => {
    startRide();

    // Pulsing dot animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        Animated.timing(dotAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();

    // Timer
    timerRef.current = setInterval(() => {
      tick();
    }, 1000);

    // Waveform update
    waveformRef.current = setInterval(() => {
      const values = getWaveformData(50);
      const last = values[values.length - 1] ?? 0;
      addWaveformValue(last);
    }, 200);

    // Start accelerometer
    await startAccelerometer(
      async (batch) => {
        incrementDataPoints(1);
        const quality = classifySurfaceQuality(batch.normalizedRms);
        updateQuality(quality, batch.vibrationRms);

        // Upload to Supabase
        await uploadSurfaceReading({
          lat: batch.lat,
          lng: batch.lng,
          vibrationRms: batch.vibrationRms,
          normalizedRms: batch.normalizedRms,
          speedKmh: batch.speedKmh,
          timestamp: batch.timestamp,
          deviceModel: Platform.OS === 'ios' ? 'iOS Device' : 'Android Device',
        });
      },
      (quality, rms) => {
        updateQuality(quality, rms);
      }
    );
  };

  const stopEverything = () => {
    stopAccelerometer();
    if (timerRef.current) clearInterval(timerRef.current);
    if (waveformRef.current) clearInterval(waveformRef.current);
    stopRide();
    dotAnim.stopAnimation();
  };

  const handleEndRide = async () => {
    stopEverything();

    const endedAt = new Date().toISOString();
    const rideId = await saveRide({
      startedAt: startedAt ?? new Date().toISOString(),
      endedAt,
      actualDistanceKm: route.distanceKm,
      funScore: route.funScore,
    });

    navigation.replace('PostRideRating', {
      route,
      rideId: rideId ?? 'local',
    });
  };

  const formatTime = (s: number): string => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${pad(m)}:${pad(sec)}`;
    return `${pad(m)}:${pad(sec)}`;
  };

  const pad = (n: number) => n.toString().padStart(2, '0');

  const surfaceColor = SURFACE_COLORS[currentSurfaceQuality];
  const surfaceLabel = SURFACE_LABELS[currentSurfaceQuality];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Recording indicator */}
      <View style={styles.topBar}>
        <View style={styles.recordingBadge}>
          <Animated.View style={[styles.recDot, { opacity: dotAnim }]} />
          <Text style={styles.recText}>Registrando</Text>
        </View>
        <TouchableOpacity
          style={styles.endBtn}
          onPress={handleEndRide}
        >
          <Text style={styles.endBtnText}>Termina giro</Text>
        </TouchableOpacity>
      </View>

      {/* Timer */}
      <View style={styles.timerSection}>
        <Text style={styles.timer}>{formatTime(elapsedSeconds)}</Text>
      </View>

      {/* Accelerometer card */}
      <View style={styles.accelCard}>
        <View style={styles.accelHeader}>
          <Text style={styles.accelTitle}>Accelerometro</Text>
          <View style={styles.accelBadge}>
            <Text style={styles.accelBadgeText}>16 Hz</Text>
          </View>
        </View>

        {/* Waveform visualization */}
        <View style={styles.waveform}>
          <Svg width="100%" height={60} viewBox={`0 0 ${waveformData.length * 4} 60`}>
            <Polyline
              points={waveformData.map((v, i) => `${i * 4},${60 - Math.min(v * 200, 55)}`).join(' ')}
              fill="none"
              stroke={surfaceColor}
              strokeWidth="1.5"
            />
          </Svg>
        </View>

        <View style={styles.accelStats}>
          <View>
            <Text style={styles.accelStatLabel}>Data points</Text>
            <Text style={styles.accelStatValue}>{dataPoints * 480}</Text>
          </View>
          <View>
            <Text style={styles.accelStatLabel}>Asfalto attuale</Text>
            <Text style={[styles.accelStatValue, { color: surfaceColor }]}>{surfaceLabel}</Text>
          </View>
        </View>
      </View>

      {/* Info message */}
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Telefono nel supporto o in tasca.{'\n'}
          L'accelerometro rileva la superficie automaticamente.
        </Text>
      </View>

      {/* Privacy note */}
      <Text style={styles.privacyNote}>
        I dati vengono anonimizzati prima di essere condivisi con la community.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.xl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  recordingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.red + '20',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.red + '40',
  },
  recDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.red,
  },
  recText: {
    color: colors.red,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
  },
  endBtn: {
    minHeight: 56,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.red,
  },
  endBtnText: {
    color: colors.red,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.md,
  },
  timerSection: {
    alignItems: 'center',
    marginVertical: spacing.xxl,
  },
  timer: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: fontSizes.ultra,
    letterSpacing: 2,
  },
  accelCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  accelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  accelTitle: {
    color: colors.text,
    fontFamily: fonts.bodySemibold,
    fontSize: fontSizes.base,
  },
  accelBadge: {
    backgroundColor: colors.green + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  accelBadgeText: {
    color: colors.green,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.xs,
  },
  waveform: {
    height: 60,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  accelStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  accelStatLabel: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  accelStatValue: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    marginTop: 4,
  },
  infoBox: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoText: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * 1.6,
    textAlign: 'center',
  },
  privacyNote: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    textAlign: 'center',
    marginTop: spacing.xl,
    opacity: 0.6,
  },
});
