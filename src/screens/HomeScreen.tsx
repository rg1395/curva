import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
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
import {
  IconMoto, IconDice, IconLoop, IconTrophy, IconBookmark,
  IconSwap, IconMenu, IconArrowLeft, IconCurve,
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
          <View style={styles.logoRow}>
            <IconCurve size={28} color={colors.accent} />
            <Text style={styles.logoText}>CURVA</Text>
          </View>
          <TouchableOpacity style={styles.menuBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <IconMenu size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Hero */}
        <View style={styles.heroSection}>
          <Text style={styles.heroText}>
            Trova la strada{'\n'}
            <Text style={styles.heroAccent}>più bella.</Text>
          </Text>
        </View>

        {/* Input Card */}
        <Card style={styles.inputCard} padding={spacing.lg}>
          {/* Origin */}
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
          </View>

          <View style={styles.divider} />

          {/* Destination */}
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
          {(origin || destination) && (
            <View style={{ marginTop: spacing.md }}>
              <MiniMapPreview
                origin={origin?.coordinates}
                destination={destination?.coordinates}
                height={120}
              />
            </View>
          )}

          {/* CTA */}
          <View style={{ marginTop: spacing.md }}>
            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}
            <Button
              label={isLoading ? 'Calcolo in corso...' : 'Trova il percorso'}
              onPress={handleFindRoute}
              disabled={!canSearch || isLoading}
              loading={isLoading}
            />
          </View>
        </Card>

        {/* Quick actions */}
        <View style={styles.quickActions}>
          <QuickActionCard
            icon={<IconDice size={36} color={colors.accent} />}
            label="Sorprendimi"
            sub="Giro random"
            onPress={handleSorprendimi}
            loading={isLoading}
            highlight
          />
          <QuickActionCard
            icon={<IconLoop size={36} color={colors.blue} />}
            label="Giro ad anello"
            sub="Torna alla partenza"
            onPress={() => { /* TODO: loop screen */ }}
          />
          <QuickActionCard
            icon={<IconBookmark size={36} color={colors.muted} />}
            label="I miei percorsi"
            sub={`${savedRoutes.length} salvati`}
            onPress={() => { /* TODO: saved routes */ }}
          />
          <QuickActionCard
            icon={<IconTrophy size={36} color={colors.accent} />}
            label="Top strade"
            sub="Le migliori"
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
                <IconMoto size={32} color={colors.accent} />
                <View style={{ marginLeft: spacing.md }}>
                  <Text style={styles.lastRouteName}>{currentRoute.name}</Text>
                  <Text style={styles.lastRouteSub}>
                    {currentRoute.distanceKm} km · {currentRoute.curvesCount} curve
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

        <View style={{ height: 32 }} />
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
      {loading && highlight ? (
        <ActivityIndicator color={colors.accent} />
      ) : (
        icon
      )}
      <Text style={styles.quickLabel}>{label}</Text>
      <Text style={styles.quickSub}>{sub}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoText: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    letterSpacing: 2,
  },
  menuBtn: {
    width: touchTarget.action,
    height: touchTarget.action,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSection: {
    marginBottom: spacing.xl,
  },
  heroText: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: fontSizes.hero,
    lineHeight: fontSizes.hero * 1.15,
  },
  heroAccent: {
    color: colors.accent,
  },
  inputCard: {
    marginBottom: spacing.xl,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 58,
    gap: spacing.md,
  },
  inputDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: fontSizes.base,
    height: 58,
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
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  quickCard: {
    width: '47%',
    minHeight: 110,
    backgroundColor: colors.card,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    justifyContent: 'center',
    gap: spacing.xs,
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
  sectionTitle: {
    color: colors.muted,
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
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
    marginTop: 2,
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
