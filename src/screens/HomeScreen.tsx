import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TextInput, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';

import { RootStackParamList, GeocodingResult } from '../types';
import { colors, fonts, fontSizes, spacing, radius, touchTarget } from '../constants/theme';
import { searchAddress } from '../api/geocoding';
import { getRoute, generateSorprendimi } from '../api/graphhopper';
import { useRouteStore } from '../store/routeStore';
import { MiniMapPreview } from '../components/map/MiniMapPreview';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { CurvaLogo } from '../components/ui/CurvaLogo';
import { IconDice, IconLoop, IconTrophy, IconBookmark, IconSwap, IconLocation, IconHeart, IconMoto } from '../components/icons';
import { MOCK_ROUTE } from '../data/mockRoute';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const HAS_API = !!(process.env.EXPO_PUBLIC_GRAPHHOPPER_API_KEY && process.env.EXPO_PUBLIC_MAPTILER_API_KEY);

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
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [activeField, setActiveField] = useState<'origin' | 'dest' | null>(null);
  const [locating, setLocating] = useState(false);
  const [loopLoading, setLoopLoading] = useState(false);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = useCallback((text: string, field: 'origin' | 'dest') => {
    if (field === 'origin') setOriginText(text);
    else setDestText(text);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (text.length < 3) { setSuggestions([]); return; }

    searchTimeout.current = setTimeout(async () => {
      try {
        const results = await searchAddress(text);
        setSuggestions(results as GeocodingResult[]);
      } catch {
        setSuggestions([]);
      }
    }, 300);
  }, []);

  const handleSelectSuggestion = (s: GeocodingResult, field: 'origin' | 'dest') => {
    if (field === 'origin') { setOrigin(s); setOriginText(s.name); }
    else { setDestination(s); setDestText(s.name); }
    setSuggestions([]);
    setActiveField(null);
  };

  const handleUseCurrentLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setError('Consenti la posizione nelle impostazioni'); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const result: GeocodingResult = {
        name: 'Posizione attuale',
        fullAddress: 'Posizione attuale',
        coordinates: { lat: loc.coords.latitude, lng: loc.coords.longitude },
      };
      setOrigin(result);
      setOriginText('Posizione attuale');
      setSuggestions([]);
    } catch {
      setError('Impossibile ottenere la posizione');
    } finally {
      setLocating(false);
    }
  };

  const handleFindRoute = async () => {
    if (!HAS_API) {
      setCurrentRoute(MOCK_ROUTE);
      navigation.navigate('RouteResult', { route: MOCK_ROUTE });
      return;
    }
    if (!origin || !destination) return;
    setLoading(true);
    setError(null);
    try {
      const route = await getRoute([origin.coordinates, destination.coordinates], origin, destination);
      setCurrentRoute(route);
      navigation.navigate('RouteResult', { route });
    } catch (e: any) {
      setError(e?.message ?? 'Errore nel calcolo del percorso');
    } finally {
      setLoading(false);
    }
  };

  const handleSorprendimi = async () => {
    if (!HAS_API) {
      setCurrentRoute(MOCK_ROUTE);
      navigation.navigate('RouteResult', { route: MOCK_ROUTE });
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setError('Servizi di localizzazione necessari'); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const route = await generateSorprendimi({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      setCurrentRoute(route);
      navigation.navigate('RouteResult', { route });
    } catch (e: any) {
      setError(e?.message ?? 'Impossibile generare il percorso');
    } finally {
      setLoading(false);
    }
  };

  const handleLoopRoute = async () => {
    if (!HAS_API) {
      setCurrentRoute(MOCK_ROUTE);
      navigation.navigate('RouteResult', { route: MOCK_ROUTE });
      return;
    }
    setLoopLoading(true);
    setError(null);
    try {
      let coords = origin?.coordinates;
      if (!coords) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') { setError('Consenti la posizione o imposta una partenza'); return; }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      }
      const route = await generateSorprendimi(coords, 40);
      setCurrentRoute(route);
      navigation.navigate('RouteResult', { route });
    } catch (e: any) {
      setError(e?.message ?? 'Impossibile generare il giro ad anello');
    } finally {
      setLoopLoading(false);
    }
  };

  const canSearch = !!origin && !!destination;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <CurvaLogo size="md" />
          {savedRoutes.length > 0 && (
            <TouchableOpacity style={styles.savedPill} onPress={() => navigation.navigate('SavedRoutes')}>
              <IconHeart size={14} color={colors.accent} filled />
              <Text style={styles.savedPillText}>{savedRoutes.length}</Text>
            </TouchableOpacity>
          )}
        </View>

        {!HAS_API && (
          <View style={styles.demoBanner}>
            <Text style={styles.demoBannerText}>
              Modalità demo · configura le chiavi API in .env per routing e mappe reali
            </Text>
          </View>
        )}

        <View style={styles.hero}>
          <Text style={styles.heroTitle}>
            Trova la strada{'\n'}<Text style={styles.heroAccent}>più bella.</Text>
          </Text>
          <Text style={styles.heroSub}>Percorsi curvosi, asfalto premiato, zero autostrade.</Text>
        </View>

        <Card style={styles.inputCard} padding={spacing.lg}>
          <View style={styles.inputRow}>
            <View style={[styles.dot, { backgroundColor: colors.accent }]} />
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
            <TouchableOpacity style={styles.iconBtn} onPress={handleUseCurrentLocation} disabled={locating}>
              {locating
                ? <ActivityIndicator size="small" color={colors.accent} />
                : <IconLocation size={18} color={colors.accent} />}
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.inputRow}>
            <View style={[styles.dot, { backgroundColor: colors.green }]} />
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
            <TouchableOpacity style={styles.iconBtn} onPress={() => {
              swapOriginDestination();
              const tmp = originText; setOriginText(destText); setDestText(tmp);
            }}>
              <IconSwap size={20} color={colors.accent} />
            </TouchableOpacity>
          </View>

          {suggestions.length > 0 && activeField && (
            <View style={styles.suggestions}>
              {suggestions.map((s, i) => (
                <TouchableOpacity
                  key={`${s.name}-${i}`}
                  style={styles.suggestionItem}
                  onPress={() => handleSelectSuggestion(s, activeField!)}
                >
                  <Text style={styles.suggestionName}>{s.name}</Text>
                  <Text style={styles.suggestionAddr} numberOfLines={1}>{s.fullAddress}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {(origin || destination) && suggestions.length === 0 && (
            <View style={{ marginTop: spacing.md }}>
              <MiniMapPreview
                origin={origin?.coordinates}
                destination={destination?.coordinates}
                height={110}
              />
            </View>
          )}

          <View style={{ marginTop: spacing.md }}>
            {!!error && <Text style={styles.errorText}>{error}</Text>}
            <Button
              label={isLoading ? 'Calcolo in corso...' : 'Trova il percorso'}
              onPress={handleFindRoute}
              disabled={(HAS_API && !canSearch) || isLoading}
              loading={isLoading}
            />
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Scopri</Text>
        <View style={styles.grid}>
          <QuickCard
            icon={<IconDice size={32} color={colors.accent} />}
            label="Sorprendimi"
            sub="Giro random da te"
            onPress={handleSorprendimi}
            loading={isLoading}
            highlight
          />
          <QuickCard
            icon={<IconLoop size={32} color={colors.blue} />}
            label="Giro ad anello"
            sub={origin ? `Da ${origin.name}` : 'Torna alla partenza'}
            onPress={handleLoopRoute}
            loading={loopLoading}
          />
          <QuickCard
            icon={<IconBookmark size={32} color={savedRoutes.length > 0 ? colors.accent : colors.muted} />}
            label="I miei percorsi"
            sub={savedRoutes.length > 0 ? `${savedRoutes.length} salvati` : 'Nessuno ancora'}
            onPress={() => navigation.navigate('SavedRoutes')}
          />
          <QuickCard
            icon={<IconTrophy size={32} color={colors.accent} />}
            label="Top strade"
            sub="Le migliori d'Italia"
            onPress={() => navigation.navigate('TopRoads')}
          />
        </View>

        {currentRoute && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Ultimo giro</Text>
            <TouchableOpacity
              style={styles.lastRoute}
              onPress={() => navigation.navigate('RouteResult', { route: currentRoute })}
              activeOpacity={0.8}
            >
              <IconMoto size={28} color={colors.accent} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.lastRouteName} numberOfLines={1}>{currentRoute.name}</Text>
                <Text style={styles.lastRouteSub}>{currentRoute.distanceKm} km · {currentRoute.curvesCount} curve</Text>
              </View>
              <View style={styles.funScore}>
                <Text style={styles.funScoreNum}>{currentRoute.funScore.toFixed(1)}</Text>
                <Text style={styles.funScoreLabel}>Fun</Text>
              </View>
            </TouchableOpacity>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickCard({
  icon, label, sub, onPress, loading, highlight,
}: {
  icon: React.ReactNode; label: string; sub: string;
  onPress: () => void; loading?: boolean; highlight?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.quickCard, highlight && styles.quickCardHL]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={loading}
    >
      {loading ? <ActivityIndicator color={highlight ? colors.accent : colors.muted} /> : icon}
      <Text style={styles.quickLabel}>{label}</Text>
      <Text style={styles.quickSub} numberOfLines={1}>{sub}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: { padding: spacing.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  savedPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.accent + '15', borderWidth: 1, borderColor: colors.accent + '40',
    paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.full,
  },
  savedPillText: { color: colors.accent, fontFamily: fonts.bodySemibold, fontSize: fontSizes.sm },
  demoBanner: {
    backgroundColor: colors.blue + '18', borderWidth: 1, borderColor: colors.blue + '40',
    borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.xl,
  },
  demoBannerText: { color: colors.blue, fontFamily: fonts.body, fontSize: fontSizes.sm, textAlign: 'center' },
  hero: { marginBottom: spacing.xl, gap: spacing.sm },
  heroTitle: { color: colors.text, fontFamily: fonts.display, fontSize: fontSizes.hero, lineHeight: fontSizes.hero * 1.1 },
  heroAccent: { color: colors.accent },
  heroSub: { color: colors.muted, fontFamily: fonts.body, fontSize: fontSizes.sm, lineHeight: fontSizes.sm * 1.5, marginTop: spacing.xs },
  inputCard: { marginBottom: spacing.xl },
  inputRow: { flexDirection: 'row', alignItems: 'center', minHeight: 54, gap: spacing.md },
  dot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  input: { flex: 1, color: colors.text, fontFamily: fonts.body, fontSize: fontSizes.base, height: 54 },
  iconBtn: { width: touchTarget.min, height: touchTarget.min, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 22 },
  suggestions: { marginTop: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, overflow: 'hidden' },
  suggestionItem: { padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  suggestionName: { color: colors.text, fontFamily: fonts.bodyMedium, fontSize: fontSizes.md },
  suggestionAddr: { color: colors.muted, fontFamily: fonts.body, fontSize: fontSizes.xs, marginTop: 2 },
  errorText: { color: colors.red, fontFamily: fonts.body, fontSize: fontSizes.sm, marginBottom: spacing.sm, textAlign: 'center' },
  sectionTitle: { color: colors.muted, fontFamily: fonts.bodyMedium, fontSize: fontSizes.sm, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  quickCard: { width: '47%', minHeight: 108, backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, justifyContent: 'center', gap: 5 },
  quickCardHL: { borderColor: colors.accent + '50', backgroundColor: colors.accent + '08' },
  quickLabel: { color: colors.text, fontFamily: fonts.bodySemibold, fontSize: fontSizes.md, marginTop: spacing.sm },
  quickSub: { color: colors.muted, fontFamily: fonts.body, fontSize: fontSizes.xs },
  lastRoute: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginTop: spacing.sm },
  lastRouteName: { color: colors.text, fontFamily: fonts.bodyMedium, fontSize: fontSizes.md },
  lastRouteSub: { color: colors.muted, fontFamily: fonts.body, fontSize: fontSizes.xs, marginTop: 3 },
  funScore: { alignItems: 'center', marginLeft: spacing.lg },
  funScoreNum: { color: colors.accent, fontFamily: fonts.display, fontSize: fontSizes.xxl },
  funScoreLabel: { color: colors.muted, fontFamily: fonts.body, fontSize: fontSizes.xs },
});
