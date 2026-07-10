import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radii } from '../theme/tokens';
import { hTap } from '../lib/haptics';
import { useLang } from '../i18n/LanguageProvider';
import { GradientText } from './GradientText';
import { OCCASIONS, Occasion } from '../data/occasions';

/**
 * "🌸 Shubh Avsar" — the highlight of the Library screen. Large, one-tap occasion cards in a
 * 2-column grid, sized for elderly / first-time users. One tap → complete ritual guide.
 */
function OccasionCard({ o, onOpen }: { o: Occasion; onOpen: (id: string) => void }) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const hi = lang === 'hi';
  const scale = useRef(new Animated.Value(1)).current;
  const spring = (to: number) => Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 40, bounciness: 6 }).start();

  return (
    <Pressable
      onPress={() => { hTap(); onOpen(o.id); }}
      onPressIn={() => spring(0.96)}
      onPressOut={() => spring(1)}
      style={styles.cell}
    >
      <Animated.View
        style={[
          styles.card,
          {
            borderColor: theme.isDark ? o.accent + '66' : theme.cardBorder,
            backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.9)',
            shadowColor: o.accent,
            transform: [{ scale }],
          },
        ]}
      >
        {/* glowing icon disc */}
        <View style={[styles.discWrap, { shadowColor: o.accent }]}>
          <LinearGradient
            colors={[o.accent + (theme.isDark ? '3a' : '2a'), o.accent + '12']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[styles.disc, { borderColor: o.accent + '80' }]}
          >
            <Text style={styles.emoji}>{o.emoji}</Text>
          </LinearGradient>
        </View>

        <Text style={[styles.label, { color: theme.text }]} numberOfLines={1}>{hi ? o.hi : o.en}</Text>
        <Text style={[styles.sub, { color: theme.textMuted }]} numberOfLines={1}>{hi ? o.subHi : o.subEn}</Text>

        <View style={[styles.badges, { borderTopColor: theme.cardBorder }]}>
          <Text style={[styles.badge, { color: theme.gold2 }]} numberOfLines={1}>
            📿 {hi ? 'मंत्र' : 'Mantra'} · 🪔 {hi ? 'आरती' : 'Aarti'} · 📖 {hi ? 'विधि' : 'Vidhi'}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export function ShubhAvsar({ onOpen }: { onOpen: (id: string) => void }) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const hi = lang === 'hi';
  const dim = theme.isDark ? '#b89a5b' : theme.textMuted;

  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <Text style={styles.headEmoji}>🌸</Text>
        <GradientText style={styles.headTitle}>{hi ? 'शुभ अवसर' : 'SHUBH AVSAR'}</GradientText>
        <Text style={styles.headEmoji}>🌸</Text>
      </View>
      <Text style={[styles.headSub, { color: dim }]}>
        {hi ? 'हर मंगल कार्य की पूरी पूजा विधि — एक टैप में' : 'Complete puja guide for every occasion — one tap'}
      </Text>

      <View style={styles.grid}>
        {OCCASIONS.map((o) => <OccasionCard key={o.id} o={o} onOpen={onOpen} />)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 6, marginBottom: 18 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  headEmoji: { fontSize: 15 },
  headTitle: { fontFamily: fonts.cinzelSemi, fontSize: 17, letterSpacing: 2, textAlign: 'center' },
  headSub: { fontFamily: fonts.inter, fontSize: 11.5, textAlign: 'center', marginTop: 5, marginBottom: 14 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  cell: { width: '48.5%' },
  card: {
    borderWidth: 1, borderRadius: 18, paddingVertical: 16, paddingHorizontal: 12, alignItems: 'center',
    shadowOpacity: 0.34, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  discWrap: { shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, marginBottom: 11 },
  disc: { width: 60, height: 60, borderRadius: 30, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 30 },
  label: { fontFamily: fonts.playfair, fontSize: 16.5, textAlign: 'center' },
  sub: { fontFamily: fonts.inter, fontSize: 11, textAlign: 'center', marginTop: 3 },
  badges: { borderTopWidth: 1, marginTop: 12, paddingTop: 9, alignSelf: 'stretch', alignItems: 'center' },
  badge: { fontFamily: fonts.interSemi, fontSize: 10, letterSpacing: 0.2 },
});
