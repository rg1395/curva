import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { colors, fonts, fontSizes } from '../../constants/theme';

interface CurvaLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
}

/**
 * CURVA logo mark: a stylized winding road / curve forming a C-shape,
 * with a gradient from accent orange to green.
 */
export function CurvaLogoMark({ size = 32, color = colors.accent }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Defs>
        <SvgGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={colors.accent} />
          <Stop offset="1" stopColor={colors.green} />
        </SvgGradient>
      </Defs>
      {/* Outer arc — the curve itself */}
      <Path
        d="M26 6 C26 6 28 10 26 16 C24 22 18 26 10 26"
        stroke="url(#logoGrad)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* Inner arc — lane marking */}
      <Path
        d="M20 9 C20 9 22 13 20 18 C18 22 14 24 8 24"
        stroke="url(#logoGrad)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="3 3"
        fill="none"
        opacity="0.45"
      />
      {/* Start dot */}
      <Circle cx="26" cy="6" r="2.5" fill={colors.accent} />
      {/* End dot */}
      <Circle cx="10" cy="26" r="2.5" fill={colors.green} />
    </Svg>
  );
}

export function CurvaLogo({ size = 'md', showWordmark = true }: CurvaLogoProps) {
  const markSize = size === 'lg' ? 40 : size === 'md' ? 28 : 20;
  const textSize = size === 'lg' ? fontSizes.xl : size === 'md' ? fontSizes.lg : fontSizes.base;
  const spacing = size === 'lg' ? 10 : 7;

  return (
    <View style={[styles.row, { gap: spacing }]}>
      <CurvaLogoMark size={markSize} />
      {showWordmark && (
        <Text style={[styles.wordmark, { fontSize: textSize }]}>CURVA</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordmark: {
    color: colors.text,
    fontFamily: fonts.display,
    letterSpacing: 3,
  },
});
