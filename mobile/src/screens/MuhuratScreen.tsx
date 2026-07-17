import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MuhuratIcon } from '../components/icons/MuhuratIcon';
import { Page } from '../components/Page';
import { GradientText } from '../components/GradientText';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radii } from '../theme/tokens';
import { useLang } from '../i18n/LanguageProvider';
import { hTap } from '../lib/haptics';
import { MUHURAT_GROUPS, MuhuratCat } from '../data/muhuratCategories';

// Premium pure-black + gold category card with a hand-drawn gold SVG icon.
function CatCard({ cat, onPress }: { cat: MuhuratCat; onPress: () => void }) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v: number) => Animated.spring(scale, { toValue: v, useNativeDriver: true, friction: 7 }).start();
  // light mode: opaque warm-white card (solid hex — inside a transform-animated wrapper)
  const light = !theme.isDark;
  return (
    <Animated.View style={{ width: '48%', transform: [{ scale }] }}>
      <Pressable onPress={() => { hTap(); onPress(); }} onPressIn={() => to(0.97)} onPressOut={() => to(1)}>
        <View style={[styles.card, light && { backgroundColor: '#fffdf7', borderColor: theme.cardBorder }]}>
          {/* top-corner gold glow over the pure-black card */}
          <LinearGradient colors={['rgba(233,184,80,0.20)', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 0.85, y: 0.7 }} style={styles.sheen} />
          <View style={[styles.iconBadge, light && { borderColor: theme.cardBorder, backgroundColor: '#f8efd9' }]}>
            <MuhuratIcon k={cat.key} color={light ? '#92400e' : '#f0c65e'} size={28} />
          </View>
          <Text style={[styles.cardName, light && { color: theme.text }]} numberOfLines={2}>{lang === 'hi' ? cat.name.hi : cat.name.en}</Text>
          <Text style={[styles.cardBlurb, light && { color: theme.textMuted }]} numberOfLines={2}>{lang === 'hi' ? cat.blurb.hi : cat.blurb.en}</Text>
          {cat.nameBased && (
            <View style={[styles.nameTag, light && { borderColor: theme.cardBorder, backgroundColor: '#f8efd9' }]}>
              <Text style={[styles.nameTagTxt, light && { color: '#92400e' }]}>🌙 {lang === 'hi' ? 'नाम से भी' : 'By name'}</Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function MuhuratScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { lang } = useLang();

  return (
    <Page title={lang === 'hi' ? 'शुभ मुहूर्त' : 'Shubh Muhurat'} onBack={() => { hTap(); navigation.goBack(); }}>
      <LinearGradient
        colors={theme.isDark ? ['#170f04', '#000000'] : ['#ffffff', '#fff3d6']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.hero, { borderColor: theme.cardBorder }]}
      >
        <Text style={[styles.eyebrow, { color: theme.gold2 }]}>{lang === 'hi' ? 'पंचांग-आधारित सटीक गणना' : 'Precise Panchang-based calculation'}</Text>
        <GradientText style={styles.heroTitle}>{lang === 'hi' ? 'शुभ मुहूर्त खोजें' : 'Find an Auspicious Muhurat'}</GradientText>
        <Text style={[styles.heroSub, { color: theme.textSoft }]}>
          {lang === 'hi'
            ? 'किसी भी शुभ कार्य के लिए सबसे अच्छा दिन व समय — तिथि, वार, नक्षत्र, योग, करण और नाम-राशि के चंद्रबल से, राहुकाल-भद्रा हटाकर।'
            : 'The best day & time for any auspicious work — from tithi, vaar, nakshatra, yoga, karana and your naam-rashi Chandrabal, with Rahu-Kaal & Bhadra removed.'}
        </Text>
      </LinearGradient>

      {MUHURAT_GROUPS.map((g) => (
        <View key={g.key} style={{ marginTop: 20 }}>
          <Text style={[styles.groupTitle, { color: theme.goldText }]}>{lang === 'hi' ? g.title.hi : g.title.en}</Text>
          <View style={styles.grid}>
            {g.items.map((c) => (
              <CatCard key={c.key} cat={c} onPress={() => navigation.navigate('MuhuratFinder', { categoryKey: c.key })} />
            ))}
          </View>
        </View>
      ))}

      <Text style={[styles.note, { color: theme.textMuted }]}>
        {lang === 'hi'
          ? '🔒 गणना खगोलीय इंजन (Lahiri अयनांश) और शास्त्रीय मुहूर्त नियमों पर आधारित है — कोई अनुमान नहीं।'
          : '🔒 Calculated with an astronomy engine (Lahiri ayanamsa) and classical muhurat rules — nothing guessed.'}
      </Text>
      <View style={{ height: 10 }} />
    </Page>
  );
}

const styles = StyleSheet.create({
  hero: { borderWidth: 1, borderRadius: 22, padding: 18, overflow: 'hidden' },
  eyebrow: { fontFamily: fonts.interSemi, fontSize: 10.5, letterSpacing: 1.2, textTransform: 'uppercase' },
  heroTitle: { fontFamily: fonts.playfairBold, fontSize: 24, lineHeight: 30, marginTop: 5 },
  heroSub: { fontFamily: fonts.inter, fontSize: 12.8, lineHeight: 19, marginTop: 8 },

  groupTitle: { fontFamily: fonts.cinzelSemi, fontSize: 13.5, letterSpacing: 1, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  card: { borderWidth: 1, borderColor: 'rgba(233,184,80,0.34)', borderRadius: 18, padding: 15, minHeight: 158, overflow: 'hidden', backgroundColor: '#000000', justifyContent: 'flex-start' },
  sheen: { position: 'absolute', top: 0, left: 0, right: 0, height: 90 },
  iconBadge: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(233,184,80,0.4)', backgroundColor: 'rgba(233,184,80,0.08)', alignItems: 'center', justifyContent: 'center' },
  cardName: { fontFamily: fonts.playfairBold, fontSize: 16, lineHeight: 20, color: '#fce8a8', marginTop: 16 },
  cardBlurb: { fontFamily: fonts.inter, fontSize: 11, lineHeight: 15, color: 'rgba(246,210,122,0.68)', marginTop: 4 },
  nameTag: { alignSelf: 'flex-start', marginTop: 10, borderWidth: 1, borderColor: 'rgba(233,184,80,0.4)', backgroundColor: 'rgba(233,184,80,0.10)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  nameTagTxt: { fontFamily: fonts.interSemi, fontSize: 8.5, letterSpacing: 0.3, color: '#e9b850' },

  note: { fontFamily: fonts.inter, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 22 },
});
