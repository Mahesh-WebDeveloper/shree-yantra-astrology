import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';
import { hTap } from '../lib/haptics';
import { useLang } from '../i18n/LanguageProvider';
import { GradientText } from './GradientText';
import { OCCASIONS, Occasion } from '../data/occasions';

/**
 * "🌸 Shubh Avsar" — the Library highlight: a premium, horizontally-scrolling slider just below
 * the filter chips. Pure-black cards (dark) with an accent glow; one tap → the full ritual guide.
 */
const CARD_W = 144;
const GAP = 12;

function OccasionCard({ o, onOpen }: { o: Occasion; onOpen: (id: string) => void }) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const hi = lang === 'hi';
  const scale = useRef(new Animated.Value(1)).current;
  const spring = (to: number) => Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 40, bounciness: 7 }).start();

  return (
    <Pressable onPress={() => { hTap(); onOpen(o.id); }} onPressIn={() => spring(0.95)} onPressOut={() => spring(1)}>
      <Animated.View
        style={[
          styles.card,
          {
            borderColor: theme.isDark ? o.accent + '77' : theme.cardBorder,
            backgroundColor: theme.isDark ? '#000000' : 'rgba(255,253,247,0.95)',
            shadowColor: o.accent,
            transform: [{ scale }],
          },
        ]}
      >
        <View style={[styles.discWrap, { shadowColor: o.accent }]}>
          <LinearGradient
            colors={[o.accent + (theme.isDark ? '4d' : '2a'), o.accent + '10']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[styles.disc, { borderColor: o.accent + 'aa' }]}
          >
            <Text style={styles.emoji}>{o.emoji}</Text>
          </LinearGradient>
        </View>

        <Text style={[styles.label, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{hi ? o.hi : o.en}</Text>
        <Text style={[styles.sub, { color: theme.textMuted }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{hi ? o.subHi : o.subEn}</Text>

        <View style={[styles.badges, { borderTopColor: theme.isDark ? 'rgba(233,184,80,0.2)' : theme.cardBorder }]}>
          <Text style={[styles.badge, { color: theme.gold2 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
            📿 {hi ? 'मंत्र' : 'Mantra'}  ·  🪔 {hi ? 'आरती' : 'Aarti'}  ·  📖 {hi ? 'विधि' : 'Vidhi'}
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
        {hi ? 'हर मंगल कार्य की पूरी पूजा विधि — साइड में स्लाइड करें →' : 'Full puja guide for every occasion — swipe →'}
      </Text>

      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.track}
      >
        {OCCASIONS.map((o) => (
          <View key={o.id} style={{ width: CARD_W, marginRight: GAP }}>
            <OccasionCard o={o} onOpen={onOpen} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 18 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  headEmoji: { fontSize: 15 },
  headTitle: { fontFamily: fonts.cinzelSemi, fontSize: 17, letterSpacing: 2, textAlign: 'center' },
  headSub: { fontFamily: fonts.inter, fontSize: 11.5, textAlign: 'center', marginTop: 5, marginBottom: 14 },

  track: { paddingLeft: 2, paddingRight: 4, paddingBottom: 8 },
  card: {
    width: CARD_W, borderWidth: 1, borderRadius: 20, paddingVertical: 18, paddingHorizontal: 10,
    alignItems: 'center',
    shadowOpacity: 0.42, shadowRadius: 13, shadowOffset: { width: 0, height: 5 }, elevation: 6,
  },
  discWrap: { shadowOpacity: 0.65, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, marginBottom: 12 },
  disc: { width: 62, height: 62, borderRadius: 31, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 31 },
  label: { fontFamily: fonts.playfair, fontSize: 16, textAlign: 'center', alignSelf: 'stretch' },
  sub: { fontFamily: fonts.inter, fontSize: 10.5, textAlign: 'center', marginTop: 4, alignSelf: 'stretch' },
  // fixed-height row so the chip text sits perfectly centered both ways
  badges: { borderTopWidth: 1, marginTop: 13, paddingTop: 4, alignSelf: 'stretch', height: 34, alignItems: 'center', justifyContent: 'center' },
  badge: { fontFamily: fonts.interSemi, fontSize: 9.5, letterSpacing: 0.2, textAlign: 'center', textAlignVertical: 'center', includeFontPadding: false, alignSelf: 'stretch' },
});
