import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Polygon, Rect } from 'react-native-svg';
import { rashiImage } from './rashiImages';

type SignKey =
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius'
  | 'capricorn'
  | 'aquarius'
  | 'pisces';

const SIGN_ALIASES: Record<SignKey, string[]> = {
  aries: ['aries', 'mesha', 'mesh'],
  taurus: ['taurus', 'vrishabha', 'vrishabh', 'vrisabha'],
  gemini: ['gemini', 'mithuna', 'mithun'],
  cancer: ['cancer', 'karka', 'kark'],
  leo: ['leo', 'simha', 'singh'],
  virgo: ['virgo', 'kanya'],
  libra: ['libra', 'tula'],
  scorpio: ['scorpio', 'vrischika', 'vrishchika', 'vrishchik'],
  sagittarius: ['sagittarius', 'dhanu', 'dhanus'],
  capricorn: ['capricorn', 'makara', 'makar'],
  aquarius: ['aquarius', 'kumbha', 'kumbh'],
  pisces: ['pisces', 'meena', 'meen'],
};

const signKeyFrom = (sign?: string | null): SignKey | null => {
  const raw = String(sign || '').toLowerCase();
  const compact = raw.replace(/[^a-z]/g, '');
  for (const key of Object.keys(SIGN_ALIASES) as SignKey[]) {
    if (SIGN_ALIASES[key].some((alias) => compact.includes(alias))) return key;
  }
  return null;
};

function ZodiacArt({ signKey, color, accent }: { signKey: SignKey | null; color: string; accent: string }) {
  const sw = {
    stroke: color,
    strokeWidth: 3,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none' as const,
  };
  const fine = {
    stroke: accent,
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none' as const,
  };
  const softFill = { fill: color, fillOpacity: 0.16 };
  const accentFill = { fill: accent, fillOpacity: 0.22 };

  switch (signKey) {
    case 'aries':
      return (
        <G>
          <Path {...softFill} d="M23 51c0-18 12-31 25-15c13-16 25-3 25 15c0 13-7 23-18 23c-6 0-9-4-7-10c-3 0-6 0-9 0c2 6-1 10-7 10c-11 0-19-10-19-23z" />
          <Path {...sw} d="M27 63c-12-10-9-34 8-36c8-1 13 6 13 20" />
          <Path {...sw} d="M69 63c12-10 9-34-8-36c-8-1-13 6-13 20" />
          <Path {...fine} d="M48 47v24M39 53c4 4 14 4 18 0" />
        </G>
      );
    case 'taurus':
      return (
        <G>
          <Path {...accentFill} d="M25 28c6 9 14 12 23 12s17-3 23-12c0 18-10 31-23 31S25 46 25 28z" />
          <Path {...sw} d="M20 22c6 15 18 18 28 18s22-3 28-18" />
          <Circle {...sw} cx={48} cy={57} r={17} />
          <Path {...fine} d="M39 55h.1M57 55h.1M43 65c4 3 6 3 10 0" />
        </G>
      );
    case 'gemini':
      return (
        <G>
          <Path {...softFill} d="M30 27c8 4 28 4 36 0v42c-8-4-28-4-36 0z" />
          <Path {...sw} d="M27 24c14 7 28 7 42 0M27 72c14-7 28-7 42 0" />
          <Line {...sw} x1={36} y1={29} x2={36} y2={67} />
          <Line {...sw} x1={60} y1={29} x2={60} y2={67} />
          <Circle {...fine} cx={36} cy={22} r={3} />
          <Circle {...fine} cx={60} cy={22} r={3} />
        </G>
      );
    case 'cancer':
      return (
        <G>
          <Path {...softFill} d="M22 43c10-17 42-17 52 0c-7-7-19-6-26 1c-7-7-19-8-26-1z" />
          <Path {...sw} d="M21 39c10-15 39-16 54-3" />
          <Path {...sw} d="M75 57c-10 15-39 16-54 3" />
          <Circle {...sw} cx={35} cy={41} r={8} />
          <Circle {...sw} cx={61} cy={55} r={8} />
          <Path {...fine} d="M22 34l-8-5M74 62l8 5" />
        </G>
      );
    case 'leo':
      return (
        <G>
          <Path {...accentFill} d="M48 17c21 0 33 20 23 39c-8 15-13 23-23 23s-15-8-23-23C15 37 27 17 48 17z" />
          <Path {...softFill} d="M23 42c-8-12 1-27 15-25c5-10 23-10 28 0c14-2 23 13 15 25c8 11 0 28-14 28c-7 11-31 11-38 0c-14 0-22-17-6-28z" />
          <Path {...sw} d="M28 44c-8-17 8-33 20-20c12-13 28 3 20 20" />
          <Path {...sw} d="M28 46c0 21 11 33 20 33s20-12 20-33" />
          <Path {...fine} d="M36 44h.1M60 44h.1" />
          <Path {...fine} d="M43 56l5 4l5-4M40 66c5 4 11 4 16 0" />
          <Path {...sw} d="M28 54c-8 5-8 18 2 20M68 54c8 5 8 18-2 20" />
        </G>
      );
    case 'virgo':
      return (
        <G>
          <Path {...softFill} d="M35 25c14-10 31 5 21 22c-4 6-4 14 2 21c-15-2-27-11-33-25c-3-8 1-14 10-18z" />
          <Circle {...sw} cx={42} cy={30} r={9} />
          <Path {...sw} d="M35 41c-6 9-8 19-5 31M50 40c7 11 11 21 13 32" />
          <Path {...fine} d="M31 58c13 4 25 4 38 0M64 28c5 3 8 7 9 13" />
          <Path {...sw} d="M66 28l6-8M30 72c10-7 23-8 36 0" />
        </G>
      );
    case 'libra':
      return (
        <G>
          <Path {...softFill} d="M25 43h46v25H25z" />
          <Line {...sw} x1={22} y1={67} x2={74} y2={67} />
          <Line {...sw} x1={18} y1={76} x2={78} y2={76} />
          <Path {...sw} d="M35 55c0-18 26-18 26 0" />
          <Line {...fine} x1={48} y1={29} x2={48} y2={67} />
          <Path {...fine} d="M28 42h40M30 42l-9 14h18zM66 42l-9 14h18z" />
        </G>
      );
    case 'scorpio':
      return (
        <G>
          <Path {...softFill} d="M24 66c9 11 26 13 38 3c12-9 13-25 2-36c9 20-8 35-25 27c-7-3-10-10-15-18z" />
          <Path {...sw} d="M20 26v35M33 26v35M46 26v27c0 12 11 17 22 12" />
          <Path {...sw} d="M20 31c4-7 13-7 13 3M33 31c4-7 13-7 13 3" />
          <Path {...fine} d="M67 65l8-2l-3 8M26 65c12 12 30 11 42 0" />
        </G>
      );
    case 'sagittarius':
      return (
        <G>
          <Circle {...softFill} cx={39} cy={57} r={15} />
          <Path {...sw} d="M26 73c8-22 23-37 46-49" />
          <Polygon points="61,21 76,20 74,35" fill={color} fillOpacity={0.2} stroke={color} strokeWidth={3} strokeLinejoin="round" />
          <Path {...fine} d="M26 38c10 2 17 9 20 20M34 40l23 23" />
          <Path {...sw} d="M26 73c-5-7-4-16 3-22" />
        </G>
      );
    case 'capricorn':
      return (
        <G>
          <Path {...softFill} d="M21 31c10-12 28-3 26 14c12-9 29 2 21 17c-7 14-31 12-35-1c-6-1-11-7-12-30z" />
          <Path {...sw} d="M21 29c9-9 24-6 24 10v30" />
          <Path {...sw} d="M45 49c13-15 34-1 23 16c-8 13-30 7-24-8" />
          <Path {...fine} d="M26 28c-1-7 7-10 12-5M33 70c-8-3-13-11-12-22" />
          <Path {...fine} d="M62 65c-6 3-13 1-16-4" />
        </G>
      );
    case 'aquarius':
      return (
        <G>
          <Path {...accentFill} d="M25 27l25-9l7 21l-25 9z" />
          <Rect x={28} y={21} width={25} height={25} rx={5} fill="none" stroke={color} strokeWidth={3} transform="rotate(-18 40.5 33.5)" />
          <Path {...sw} d="M20 60c5-5 10-5 15 0s10 5 15 0s10-5 15 0s8 5 11 2" />
          <Path {...sw} d="M20 73c5-5 10-5 15 0s10 5 15 0s10-5 15 0s8 5 11 2" />
          <Path {...fine} d="M52 39c8 4 14 6 22 5" />
        </G>
      );
    case 'pisces':
      return (
        <G>
          <Path {...accentFill} d="M21 35c9-11 23-11 31 0c-8 12-22 13-31 0z" />
          <Path {...softFill} d="M44 61c8-12 22-13 31-2c-9 11-23 13-31 2z" />
          <Path {...sw} d="M20 36c10-13 23-14 33 0c-10 14-23 13-33 0z" />
          <Path {...sw} d="M43 60c10-13 23-14 33 0c-10 14-23 13-33 0z" />
          <Circle cx={40} cy={35} r={2.2} fill={color} />
          <Circle cx={56} cy={61} r={2.2} fill={color} />
          <Path {...fine} d="M24 36l-8-7v14zM72 60l8-7v14zM32 48h32" />
        </G>
      );
    default:
      return (
        <G>
          <Circle {...softFill} cx={48} cy={48} r={22} />
          <Path {...sw} d="M48 21l4 17l17 4l-17 4l-4 17l-4-17l-17-4l17-4z" />
        </G>
      );
  }
}

export function ZodiacIcon({ sign, size = 96, theme }: { sign?: string | null; size?: number; theme: any }) {
  const signKey = signKeyFrom(sign);
  const img = rashiImage(sign);
  const gold = theme.gold1 || '#e9b850';
  const accent = theme.gold2 || '#f4d07a';
  const glow = theme.isDark ? 'rgba(233,184,80,0.22)' : 'rgba(176,115,22,0.16)';

  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2, borderColor: theme.gold2 }]}>
      {/* completely black background behind the rashi icon (both themes) */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000' }]} />
      {/* decorative rings/glow ONLY for the SVG-glyph fallback; when a rashi PNG is
          shown the background stays PURE BLACK (no glow, no rings) per request. */}
      {!img && (
        <Svg width={size} height={size} viewBox="0 0 96 96" style={StyleSheet.absoluteFill}>
          <Circle cx={48} cy={48} r={43} fill={glow} />
          <Circle cx={48} cy={48} r={36} fill="none" stroke={accent} strokeWidth={1.1} strokeOpacity={0.28} />
          <Circle cx={48} cy={48} r={28} fill="none" stroke={gold} strokeWidth={0.8} strokeDasharray="3 5" strokeOpacity={0.42} />
          <ZodiacArt signKey={signKey} color={gold} accent={accent} />
        </Svg>
      )}
      {img && <Image source={img} style={{ width: size * 0.64, height: size * 0.64 }} resizeMode="contain" />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
});
