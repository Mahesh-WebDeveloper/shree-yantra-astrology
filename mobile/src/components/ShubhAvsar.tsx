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
 * "🌸 Shubh Avsar" — the Library highlight, shown as a premium horizontal slider just below
 * the filter chips. Large glowing occasion cards; one tap → the complete ritual guide.
 */
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
            borderColor: theme.isDark ? o.accent + '66' : theme.cardBorder,
            backgroundColor: theme.isDark ? '#000000' : 'rgba(255,253,247,0.92)',
            shadowColor: o.accent,
            transform: [{ scale }],
          },
        ]}
      >
        {/* soft accent glow wash at the top (kept subtle so the card stays deep black) */}
        {theme.isDark && (
          <LinearGradient
            colors={[o.accent + '24', 'transparent']}
            start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
            style={styles.wash}
          />
        )}

        <View style={[styles.discWrap, { shadowColor: o.accent }]}>
          <LinearGradient
            colors={[o.accent + (theme.isDark ? '46' : '2a'), o.accent + '10']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[styles.disc, { borderColor: o.accent + '99' }]}
          >
            <Text style={styles.emoji}>{o.emoji}</Text>
          </LinearGradient>
        </View>

        <Text style={[styles.label, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{hi ? o.hi : o.en}</Text>
        <Text style={[styles.sub, { color: theme.textMuted }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{hi ? o.subHi : o.subEn}</Text>

        <View style={[styles.badges, { borderTopColor: theme.isDark ? 'rgba(233,184,80,0.18)' : theme.cardBorder }]}>
          <Text style={[styles.badge, { color: theme.gold2 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
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
        {hi ? 'हर मंगल कार्य की पूरी पूजा विधि — एक टैप में' : 'Complete puja guide for every occasion — one tap'}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={CARD_W + GAP}
        snapToAlignment="start"
        contentContainerStyle={styles.track}
      >
        {OCCASIONS.map((o) => <OccasionCard key={o.id} o={o} onOpen={onOpen} />)}
      </ScrollView>
    </View>
  );
}

const CARD_W = 150;
const GAP = 12;

const styles = StyleSheet.create({
  section: { marginBottom: 18 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  headEmoji: { fontSize: 15 },
  headTitle: { fontFamily: fonts.cinzelSemi, fontSize: 17, letterSpacing: 2, textAlign: 'center' },
  headSub: { fontFamily: fonts.inter, fontSize: 11.5, textAlign: 'center', marginTop: 5, marginBottom: 14 },

  track: { gap: GAP, paddingHorizontal: 2, paddingBottom: 6, paddingRight: 6 },
  card: {
    width: CARD_W, borderWidth: 1, borderRadius: 20, paddingVertical: 18, paddingHorizontal: 12,
    alignItems: 'center', overflow: 'hidden',
    shadowOpacity: 0.4, shadowRadius: 13, shadowOffset: { width: 0, height: 5 }, elevation: 6,
  },
  wash: { position: 'absolute', top: 0, left: 0, right: 0, height: 78 },
  discWrap: { shadowOpacity: 0.6, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, marginBottom: 12 },
  disc: { width: 62, height: 62, borderRadius: 31, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 31 },
  label: { fontFamily: fonts.playfair, fontSize: 16.5, textAlign: 'center', alignSelf: 'stretch' },
  sub: { fontFamily: fonts.inter, fontSize: 10.5, textAlign: 'center', marginTop: 4, alignSelf: 'stretch' },
  badges: { borderTopWidth: 1, marginTop: 13, paddingTop: 10, alignSelf: 'stretch', alignItems: 'center' },
  badge: { fontFamily: fonts.interSemi, fontSize: 9.5, letterSpacing: 0.2, textAlign: 'center', alignSelf: 'stretch' },
});
