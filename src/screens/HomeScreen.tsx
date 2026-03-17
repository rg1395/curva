import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';

import { RootStackParamList } from '../types';
import { GeocodingResult } from '../types';
import { colors, fonts, fontSizes, spacing, radius, touchTarget } from '../constants/theme';
import { searchAddress } from '../api/geocoding';
import { getRoute, generateSorprendimi } from '../api/graphhopper';
import { useRouteStore } from '../store/routeStore';
import { MiniMapPreview } from '../components/map/MiniMapPreview';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { CurvaLogo } from '../components/ui/CurvaLogo';
import {
  IconMoto, IconDice, IconLoop, IconTrophy, IconBookmark,
  IconSwap, IconLocation, IconHeart,
} from '../components/icons';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

interface Suggestion {
  id: string;
  name: string;
  fullAddress: string;
  coordinates: { lat: number; lng: number };
}

export function HomeScreen() {
  const navigation = useNavigation<NavProp>();
  const {
    origin, destination,
    setOrigin, setDestination,
    swapOriginDestination,
    currentRoute, savedRoutes,
    isLoading, error,
    setLoading, setError, setCurrentRoute,
  } = useRouteStore();

  const [originText, setOriginText] = useState(origin?.name ?? '');
  const [destText, setDestText] = useState(destination?.name ?? '');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activeField, setActiveField] = useState<'origin' | 'dest' | null>(null);
  const [locating, setLocating] = useState(false);
  const [loopLoading, setLoopLoading] = useState(false);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((text: string, field: 'origin' | 'dest') => {
    if (field === 'origin') setOriginText(text);
    else setDestText(text);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      if (text.length >= 3) {
        const results = await searchAddress(text);
        setSuggestions(results);
      } else {
        setSuggestions([]);
      }
    }, 300);
  }, []);

  const handleSelectSuggestion = (suggestion: Suggestion, field: 'origin' | 'dest') => {
    const result: GeocodingResult = {
      name: suggestion.name,
      fullAddress: suggestion.fullAddress,
      coordinates: suggestion.coordinates,
    };
    if (field === 'origin') {
      setOrigin(result);
      setOriginText(suggestion.name);
    } else {
      setDestination(result);
      setDestText(suggestion.name);
    }
    setSuggestions([]);
    setActiveField(null);
  };

  const handleUseCurrentLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Consenti la posizione nelle impostazioni');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const result: GeocodingResult = {
        name: 'Posizione attuale',
        fullAddress: 'Posizione attuale',
        coordinates: { lat: loc.coords.latitude, lng: loc.coords.longitude },
      };
      setOrigin(result);
      setOriginText('Posizione attuale');
      setSuggestions([]);
      setActiveField(null);
    } catch {
      setError('Impossibile ottenere la posizione');
    } finally {
      setLocating(false);
    }
  };

  const handleFindRoute = async () => {
    if (!origin || !destination) return;
    setLoading(true);
    setError(null);
    try {
      const route = await getRoute([origin.coordinates, destination.coordinates], origin, destination);
      setCurrentRoute(route);
      navigation.navigate('RouteResult', { route });
    } catch (e: any) {
      setError(e.message ?? 'Errore nel calcolo del percorso');
    } finally {
      setLoading(false);
    }
  };

  const handleSorprendimi = async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Servizi di localizzazione necessari per Sorprendimi');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const currentLocation = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      const route = await generateSorprendimi(currentLocation);
      setCurrentRoute(route);
      navigation.navigate('RouteResult', { route });
    } catch (e: any) {
      setError(e.message ?? 'Impossibile generare il percorso');
    } finally {
      setLoading(false);
    }
  };

  const handleLoopRoute = async () => {
    setLoopLoading(true);
    setError(null);
    try {
      let startCoords: { lat: number; lng: number };

      if (origin) {
        startCoords = origin.coordinates;
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Consenti la posizione o imposta una partenza');
          return;
        }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        startCoords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      }

      const route = await generateSorprendimi(startCoords, 40);
      setCurrentRoute(route);
      navigation.navigate('RouteResult', { route });
    } catch (e: any) {
      setError(e.message ?? 'Impossibile generare il giro ad anello');
    } finally {
      setLoopLoading(false);
    }
  };

  const canSearch = !!origin && !!destination;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <CurvaLogo size="md" />
          {savedRoutes.length > 0 && (
            <TouchableOpacity
              style={styles.savedPill}
              onPress={() => navigation.navigate('SavedRoutes')}
            >
              <IconHeart size={14} color={colors.accent} filled />
              <Text style={styles.savedPillText}>{savedRoutes.length}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Hero */}
        <View style={styles.heroSection}>
          <Text style={styles.heroText}>
            Trova la strada{'\n'}
            <Text style={styles.heroAccent}>più bella.</Text>
          </Text>
          <Text style={styles.heroSub}>Percorsi curvosi, asfalto premiato, zero autostrade.</Text>
        </View>

        {/* Input Card */}
        <Card style={styles.inputCard} padding={spacing.lg}>
          {/* Origin row */}
          <View style={styles.inputRow}>
            <View style={[styles.inputDot, { backgroundColor: colors.accent }]} />
            <TextInput
              style={styles.input}
              placeholder="Partenza"
              placeholderTextColor={colors.muted}
              value={originText}
              onChangeText={t => handleSearch(t, 'origin')}
              onFocus={() => setActiveField('origin')}
              returnKeyType="next"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.gpsBtn}
              onPress={handleUseCurrentLocation}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              disabled={locating}
            >
              {locating ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <IconLocation size={18} color={colors.accent} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Destination row */}
          <View style={styles.inputRow}>
            <View style={[styles.inputDot, { backgroundColor: colors.green }]} />
            <TextInput
              style={styles.input}
              placeholder="Destinazione"
              placeholderTextColor={colors.muted}
              value={destText}
              onChangeText={t => handleSearch(t, 'dest')}
              onFocus={() => setActiveField('dest')}
              returnKeyType="search"
              onSubmitEditing={canSearch ? handleFindRoute : undefined}
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.swapBtn}
              onPress={() => {
                swapOriginDestination();
                const tmpText = originText;
                setOriginText(destText);
                setDestText(tmpText);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <IconSwap size={20} color={colors.accent} />
            </TouchableOpacity>
          </View>

          {/* Autocomplete suggestions */}
          {suggestions.length > 0 && activeField && (
            <View style={styles.suggestions}>
              {suggestions.map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={styles.suggestionItem}
                  onPress={() => handleSelectSuggestion(s, activeField)}
                >
                  <Text style={styles.suggestionName}>{s.name}</Text>
                  <Text style={styles.suggestionAddr} numberOfLines={1}>{s.fullAddress}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Mini map preview */}
          {(origin || destination) && suggestions.length === 0 && (
            <View style={{ marginTop: spacing.md }}>
              <MiniMapPreview
                origin={origin?.coordinates}
                destination={destination?.coordinates}
                height={110}
              />
            </View>
          )}

          {/* CTA */}
          <View style={{ marginTop: spacing.md }}>
            {error && <Text style={styles.errorText}>{error}</Text>}
            <Button
              label={isLoading ? 'Calcolo in corso...' : 'Trova il percorso'}
              onPress={handleFindRoute}
              disabled={!canSearch || isLoading}
              loading={isLoading}
            />
          </View>
        </Card>

        {/* Quick actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Scopri</Text>
        </View>
        <View style={styles.quickActions}>
          <QuickActionCard
            icon={<IconDice size={32} color={colors.accent} />}
            label="Sorprendimi"
            sub="Giro random da te"
            onPress={handleSorprendimi}
            loading={isLoading}
            highlight
          />
          <QuickActionCard
            icon={<IconLoop size={32} color={colors.blue} />}
            label="Giro ad anello"
            sub={origin ? `Da ${origin.name}` : 'Torna alla partenza'}
            onPress={handleLoopRoute}
            loading={loopLoading}
          />
          <QuickActionCard
            icon={<IconBookmark size={32} color={savedRoutes.length > 0 ? colors.accent : colors.muted} />}
            label="I miei percorsi"
            sub={savedRoutes.length > 0 ? `${savedRoutes.length} salvati` : 'Nessuno ancora'}
            onPress={() => navigation.navigate('SavedRoutes')}
          />
          <QuickActionCard
            icon={<IconTrophy size={32} color={colors.accent} />}
            label="Top strade"
            sub="Le migliori d'Italia"
            onPress={() => navigation.navigate('TopRoads')}
          />
        </View>

        {/* Last route */}
        {currentRoute && (
          <View style={{ marginTop: spacing.xl }}>
            <Text style={styles.sectionTitle}>Ultimo giro</Text>
            <TouchableOpacity
              style={styles.lastRouteCard}
              onPress={() => navigation.navigate('RouteResult', { route: currentRoute })}
              activeOpacity={0.8}
            >
              <View style={styles.lastRouteLeft}>
                <IconMoto size={28} color={colors.accent} />
                <View style={{ marginLeft: spacing.md, flex: 1 }}>
                  <Text style={styles.lastRouteName} numberOfLines={1}>{currentRoute.name}</Text>
                  <Text style={styles.lastRouteSub}>
                    {currentRoute.distanceKm} km · {currentRoute.curvesCount} curve · {currentRoute.durationMin < 60 ? `${currentRoute.durationMin} min` : `${Math.floor(currentRoute.durationMin / 60)}h ${currentRoute.durationMin % 60}m`}
                  </Text>
                </View>
              </View>
              <View style={styles.lastRouteFunScore}>
                <Text style={styles.funScoreNum}>{currentRoute.funScore.toFixed(1)}</Text>
                <Text style={styles.funScoreLabel}>Fun</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickActionCard({
  icon, label, sub, onPress, loading, highlight,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  onPress: () => void;
  loading?: boolean;
  highlight?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.quickCard, highlight && styles.quickCardHighlight]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color={highlight ? colors.accent : colors.muted} />
      ) : (
        icon
      )}
      <Text style={styles.quickLabel}>{label}</Text>
      <Text style={styles.quickSub} numberOfLines={1}>{sub}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  savedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.accent + '15',
    borderWidth: 1,
    borderColor: colors.accent + '40',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  savedPillText: {
    color: colors.accent,
    fontFamily: fonts.bodySemibold,
    fontSize: fontSizes.sm,
  },
  heroSection: {
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  heroText: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: fontSizes.hero,
    lineHeight: fontSizes.hero * 1.12,
  },
  heroAccent: {
    color: colors.accent,
  },
  heroSub: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * 1.5,
    marginTop: spacing.xs,
  },
  inputCard: {
    marginBottom: spacing.xl,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 54,
    gap: spacing.md,
  },
  inputDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    height: 54,
  },
  gpsBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  swapBtn: {
    width: touchTarget.action,
    height: touchTarget.action,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 22,
  },
  suggestions: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  suggestionItem: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestionName: {
    color: colors.text,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.md,
  },
  suggestionAddr: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    marginTop: 2,
  },
  errorText: {
    color: colors.red,
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.muted,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  quickCard: {
    width: '47%',
    minHeight: 108,
    backgroundColor: colors.card,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    justifyContent: 'center',
    gap: 5,
  },
  quickCardHighlight: {
    borderColor: colors.accent + '50',
    backgroundColor: colors.accent + '08',
  },
  quickLabel: {
    color: colors.text,
    fontFamily: fonts.bodySemibold,
    fontSize: fontSizes.md,
    marginTop: spacing.sm,
  },
  quickSub: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
  },
  lastRouteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  lastRouteLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  lastRouteName: {
    color: colors.text,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.md,
  },
  lastRouteSub: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    marginTop: 3,
  },
  lastRouteFunScore: {
    alignItems: 'center',
    marginLeft: spacing.lg,
  },
  funScoreNum: {
    color: colors.accent,
    fontFamily: fonts.display,
    fontSize: fontSizes.xxl,
  },
  funScoreLabel: {
    color: colors.muted,
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
  },
});
