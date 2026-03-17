import React from 'react';
import Svg, { Path, Circle, Rect, G, Line, Polyline, Polygon } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export function IconMoto({ size = 36, color = '#FF6B35' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <Circle cx="9" cy="25" r="5" stroke={color} strokeWidth="2" />
      <Circle cx="27" cy="25" r="5" stroke={color} strokeWidth="2" />
      <Path d="M9 25 L14 14 L22 14 L27 25" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <Path d="M18 14 L22 8 L28 8" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="28" cy="8" r="2" fill={color} />
    </Svg>
  );
}

export function IconCurve({ size = 36, color = '#34D399' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <Path
        d="M4 30 C4 18 12 18 18 18 C24 18 32 12 32 6"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <Path d="M26 6 L32 6 L32 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconCompass({ size = 36, color = '#FF6B35' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <Circle cx="18" cy="18" r="14" stroke={color} strokeWidth="2" />
      <Polygon points="18,6 21,18 18,16 15,18" fill={color} />
      <Polygon points="18,30 15,18 18,20 21,18" fill="#87878C" />
    </Svg>
  );
}

export function IconSurface({ size = 36, color = '#34D399' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <Rect x="4" y="28" width="28" height="4" rx="2" fill={color} opacity="0.3" />
      <Path d="M4 22 Q8 18 12 22 Q16 26 20 22 Q24 18 28 22 L32 22" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export function IconSurfaceWave({ size = 44, color = '#34D399' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 44 44" fill="none">
      <Rect x="4" y="36" width="36" height="4" rx="2" fill={color} opacity="0.2" />
      <Path d="M4 26 L40 26" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

export function IconSurfaceGood({ size = 44, color = '#FF6B35' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 44 44" fill="none">
      <Rect x="4" y="36" width="36" height="4" rx="2" fill={color} opacity="0.2" />
      <Path d="M4 26 Q14 22 22 26 Q30 30 40 26" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export function IconSurfaceFair({ size = 44, color = '#FBBF24' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 44 44" fill="none">
      <Rect x="4" y="36" width="36" height="4" rx="2" fill={color} opacity="0.2" />
      <Path d="M4 26 Q8 20 14 26 Q18 30 22 24 Q26 18 32 26 Q36 30 40 26" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export function IconSurfaceBad({ size = 44, color = '#EF4444' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 44 44" fill="none">
      <Rect x="4" y="36" width="36" height="4" rx="2" fill={color} opacity="0.2" />
      <Path d="M4 26 L8 20 L12 28 L16 18 L20 30 L24 16 L28 28 L32 20 L36 26 L40 22" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconStar({ size = 28, color = '#FF6B35' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Polygon
        points="14,2 17.5,10.5 26,11 20,16.5 22,25 14,20.5 6,25 8,16.5 2,11 10.5,10.5"
        fill={color}
      />
    </Svg>
  );
}

export function IconShare({ size = 28, color = '#FFFFFF' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Circle cx="22" cy="5" r="3" stroke={color} strokeWidth="2" />
      <Circle cx="6" cy="14" r="3" stroke={color} strokeWidth="2" />
      <Circle cx="22" cy="23" r="3" stroke={color} strokeWidth="2" />
      <Line x1="8.5" y1="12.5" x2="19.5" y2="6.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="8.5" y1="15.5" x2="19.5" y2="21.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function IconHelmet({ size = 32, color = '#FFFFFF' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Path d="M6 18 C6 10 10 4 16 4 C22 4 26 10 26 18 L26 22 C26 24 24 26 22 26 L10 26 C8 26 6 24 6 22 Z" stroke={color} strokeWidth="2" fill="none" />
      <Path d="M6 18 L26 18" stroke={color} strokeWidth="1.5" />
      <Path d="M10 22 L22 22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function IconArrowLeft({ size = 24, color = '#FFFFFF' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12 H5 M12 5 L5 12 L12 19" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconClose({ size = 24, color = '#FFFFFF' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6 L6 18 M6 6 L18 18" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

export function IconSwap({ size = 24, color = '#FF6B35' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M7 4 L7 16 M7 16 L3 12 M7 16 L11 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M17 20 L17 8 M17 8 L13 12 M17 8 L21 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconMenu({ size = 24, color = '#FFFFFF' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="3" y1="7" x2="21" y2="7" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="12" x2="21" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="17" x2="15" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function IconMountain({ size = 28, color = '#60A5FA' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Path d="M2 24 L10 10 L16 18 L20 14 L26 24 Z" stroke={color} strokeWidth="2" strokeLinejoin="round" fill="none" />
      <Circle cx="21" cy="7" r="3" stroke={color} strokeWidth="1.5" />
    </Svg>
  );
}

export function IconTimer({ size = 28, color = '#87878C' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Circle cx="14" cy="15" r="10" stroke={color} strokeWidth="2" />
      <Path d="M14 9 L14 15 L18 19" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M11 3 L17 3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function IconTrophy({ size = 36, color = '#FF6B35' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <Path d="M10 4 L26 4 L26 20 C26 24.4 22.4 28 18 28 C13.6 28 10 24.4 10 20 Z" stroke={color} strokeWidth="2" fill="none" />
      <Path d="M18 28 L18 32 M13 32 L23 32" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M10 8 L4 8 L4 14 C4 16 6 18 8 18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M26 8 L32 8 L32 14 C32 16 30 18 28 18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

export function IconBookmark({ size = 36, color = '#87878C' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <Path d="M10 4 L26 4 L26 32 L18 26 L10 32 Z" stroke={color} strokeWidth="2" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

export function IconLoop({ size = 36, color = '#60A5FA' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <Path d="M18 6 C28 6 30 18 24 24 C18 30 8 28 6 20" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <Path d="M6 14 L6 20 L12 20" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IconDice({ size = 36, color = '#FF6B35' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <Rect x="4" y="4" width="28" height="28" rx="6" stroke={color} strokeWidth="2" fill="none" />
      <Circle cx="12" cy="12" r="2.5" fill={color} />
      <Circle cx="24" cy="12" r="2.5" fill={color} />
      <Circle cx="18" cy="18" r="2.5" fill={color} />
      <Circle cx="12" cy="24" r="2.5" fill={color} />
      <Circle cx="24" cy="24" r="2.5" fill={color} />
    </Svg>
  );
}

export function IconLocation({ size = 24, color = '#FF6B35' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke={color} strokeWidth="2" fill="none" />
      <Circle cx="12" cy="9" r="2.5" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

export function IconHeart({ size = 24, color = '#FF6B35', filled = false }: IconProps & { filled?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        stroke={color}
        strokeWidth="2"
        fill={filled ? color : 'none'}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconCheck({ size = 24, color = '#34D399' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Surface quality icons for post-ride rating
export function IconQualityExcellent({ size = 44, selected = false }: { size?: number; selected?: boolean }) {
  const color = '#34D399';
  return <IconSurfaceWave size={size} color={selected ? color : '#252528'} />;
}

export function IconQualityGood({ size = 44, selected = false }: { size?: number; selected?: boolean }) {
  const color = '#FF6B35';
  return <IconSurfaceGood size={size} color={selected ? color : '#252528'} />;
}

export function IconQualityFair({ size = 44, selected = false }: { size?: number; selected?: boolean }) {
  const color = '#FBBF24';
  return <IconSurfaceFair size={size} color={selected ? color : '#252528'} />;
}

export function IconQualityBad({ size = 44, selected = false }: { size?: number; selected?: boolean }) {
  const color = '#EF4444';
  return <IconSurfaceBad size={size} color={selected ? color : '#252528'} />;
}
