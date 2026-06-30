import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { Page } from '../components/Page';
import { GradientText } from '../components/GradientText';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radii } from '../theme/tokens';
import { useLang } from '../i18n/LanguageProvider';
import { hTap } from '../lib/haptics';
import { MUHURAT_GROUPS, MuhuratCat } from '../data/muhuratCategories';

// subtle sun-rays backdrop drawn behind each category card
function Rays({ tint }: { tint: string }) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
      <Circle cx={84} cy={18} r={22} fill="none" stroke={tint} strokeWidth={0.8} opacity={0.5} />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * Math.PI) / 6;
        return <Line key={i} x1={84 + 14 * Math.cos(a)} y1={18 + 14 * Math.sin(a)} x2={84 + 24 * Math.cos(a)} y2={18 + 24 * Math.sin(a)} stroke={tint} strokeWidth={0.8} opacity={0.4} />;
      })}
      <Path d="M-6 96 q40 -26 112 -6" fill="none" stroke={tint} strokeWidth={0.8} opacity={0.35} />
    </Svg>
  );
}

function CatCard({ cat, onPress }: { cat: MuhuratCat; onPress: () => void }) {
  const { lang } = useLang();
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v: number) => Animated.spring(scale, { toValue: v, useNativeDriver: true, friction: 7 }).start();
  return (
    <Animated.View style={{ width: '48%', transform: [{ scale }] }}>
      <Pressable onPress={() => { hTap(); onPress(); }} onPressIn={() => to(0.96)} onPressOut={() => to(1)}>
        <LinearGradient colors={cat.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
          <Rays tint="#fff8ec" />
          <View style={styles.cardEmojiWrap}><Text style={styles.cardEmoji}>{cat.emoji}</Text></View>
          <Text style={styles.cardName} numberOfLines={2}>{lang === 'hi' ? cat.name.hi : cat.name.en}</Text>
          <Text style={styles.cardBlurb} numberOfLines={2}>{lang === 'hi' ? cat.blurb.hi : cat.blurb.en}</Text>
          {cat.nameBased && (
            <View style={styles.nameTag}><Text style={styles.nameTagTxt}>{lang === 'hi' ? 'नाम से भी' : 'By name too'}</Text></View>
          )}
        </LinearGradient>
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
  card: { borderRadius: 18, padding: 14, minHeight: 132, overflow: 'hidden', justifyContent: 'flex-end' },
  cardEmojiWrap: { position: 'absolute', top: 12, left: 13 },
  cardEmoji: { fontSize: 30 },
  cardName: { fontFamily: fonts.playfairBold, fontSize: 16, lineHeight: 20, color: '#fff8ec', marginTop: 30 },
  cardBlurb: { fontFamily: fonts.inter, fontSize: 11, lineHeight: 15, color: 'rgba(255,248,236,0.88)', marginTop: 3 },
  nameTag: { alignSelf: 'flex-start', marginTop: 8, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: 'rgba(0,0,0,0.22)' },
  nameTagTxt: { fontFamily: fonts.interSemi, fontSize: 8.5, color: '#fff8ec', letterSpacing: 0.5 },

  note: { fontFamily: fonts.inter, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 22 },
});
