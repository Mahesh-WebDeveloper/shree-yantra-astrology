import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fonts } from '../../theme/tokens';

// Vedic moon-sign (rashi) → zodiac symbol. Dynamic per user — no per-sign image needed.
const SYMBOL: Record<string, string> = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋', Leo: '♌', Virgo: '♍',
  Libra: '♎', Scorpio: '♏', Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
};

export function ZodiacIcon({ sign, size = 96, theme }: { sign?: string | null; size?: number; theme: any }) {
  const sym = (sign && SYMBOL[sign]) || '✶';
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2, borderColor: theme.gold2 }]}>
      <LinearGradient
        colors={theme.isDark ? ['#241452', '#0e0822'] : ['#fff3d6', '#f1e1ba']}
        start={{ x: 0.3, y: 0.2 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Text style={{ fontFamily: fonts.cinzel, fontSize: size * 0.46, lineHeight: size * 0.62, color: theme.gold1 }}>{sym}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
