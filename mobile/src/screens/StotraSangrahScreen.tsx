import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Page } from '../components/Page';
import { GradientText } from '../components/GradientText';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';
import { hTap } from '../lib/haptics';
import { useLang } from '../i18n/LanguageProvider';
import { STOTRA_LIST, STOTRA_CATEGORIES, Stotra } from '../data/stotras';

const RightChevron = ({ c }: { c: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><Path d="M9 18l6-6-6-6" /></Svg>
);

function Row({ theme, hi, s, onOpen }: { theme: any; hi: boolean; s: Stotra; onOpen: () => void }) {
  return (
    <Pressable onPress={() => { hTap(); onOpen(); }} style={({ pressed }) => [styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? '#000000' : 'rgba(255,253,247,0.92)' }, pressed && { borderColor: theme.gold2, transform: [{ scale: 0.99 }] }]}>
      <View style={styles.head}>
        <View style={[styles.dot, { borderColor: theme.gold3, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.12)' : '#fff' }]}><Text style={{ fontSize: 18 }}>📜</Text></View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{hi ? s.titleHi : s.titleEn}</Text>
          <Text style={[styles.deity, { color: theme.textMuted }]} numberOfLines={1}>{s.deity}</Text>
        </View>
        <RightChevron c={theme.gold2} />
      </View>
    </Pressable>
  );
}

export function StotraSangrahScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const hi = lang === 'hi';
  const dim = theme.isDark ? '#b89a5b' : theme.textMuted;

  return (
    <Page title={hi ? 'स्तोत्र संग्रह' : 'Stotra Sangrah'} onBack={() => { hTap(); navigation.goBack(); }}>
      <LinearGradient colors={theme.isDark ? ['rgba(233,184,80,0.16)', 'rgba(233,184,80,0.03)'] : ['rgba(255,247,224,0.95)', 'rgba(255,253,247,0.9)']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={[styles.hero, { borderColor: theme.gold3 }]}>
        <LinearGradient colors={theme.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.crest}><Text style={{ fontSize: 30 }}>📜</Text></LinearGradient>
        <Text style={[styles.heroDeva, { color: theme.text }]}>स्तोत्र संग्रह</Text>
        <GradientText style={styles.heroTitle}>{hi ? 'स्तोत्र संग्रह' : 'STOTRA SANGRAH'}</GradientText>
        <Text style={[styles.heroSub, { color: theme.gold2 }]}>{hi ? 'प्रामाणिक संस्कृत स्तोत्र' : 'Authentic Sanskrit stotras'}</Text>
      </LinearGradient>

      {STOTRA_CATEGORIES.map((cat) => {
        const items = STOTRA_LIST.filter((s) => s.category === cat.key);
        if (!items.length) return null;
        return (
          <View key={cat.key} style={{ marginTop: 8 }}>
            <View style={styles.catHead}><View style={[styles.catLine, { backgroundColor: theme.gold3 }]} /><Text style={[styles.catTitle, { color: theme.gold1 }]}>{hi ? cat.hi : cat.en}</Text><View style={[styles.catLine, { backgroundColor: theme.gold3 }]} /></View>
            <View style={{ gap: 10, marginTop: 10 }}>{items.map((s) => <Row key={s.id} theme={theme} hi={hi} s={s} onOpen={() => navigation.navigate('DevReader', { kind: 'stotra', id: s.id })} />)}</View>
          </View>
        );
      })}

      <Text style={[styles.note, { color: dim }]}>{hi ? '✦ और स्तोत्र (शिव तांडव, राम रक्षा, बजरंग बाण, आदित्य हृदय…) स्रोत-सत्यापन के साथ जोड़े जा रहे हैं।' : '✦ More stotras are being added with source verification.'}</Text>
      <View style={{ height: 14 }} />
    </Page>
  );
}

const styles = StyleSheet.create({
  hero: { borderWidth: 1, borderRadius: 20, alignItems: 'center', paddingVertical: 22, paddingHorizontal: 16, marginBottom: 6 },
  crest: { width: 62, height: 62, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  heroDeva: { fontFamily: fonts.devanagari, fontSize: 24, textAlign: 'center' },
  heroTitle: { fontFamily: fonts.cinzelSemi, fontSize: 14, letterSpacing: 2, textAlign: 'center', marginTop: 6 },
  heroSub: { fontFamily: fonts.interSemi, fontSize: 12, marginTop: 8, textAlign: 'center' },
  catHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  catLine: { flex: 1, height: 1, opacity: 0.5 },
  catTitle: { fontFamily: fonts.cinzelSemi, fontSize: 12.5, letterSpacing: 1.5, textAlign: 'center' },
  card: { borderWidth: 1, borderRadius: 14, padding: 14 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  dot: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.playfair, fontSize: 16, lineHeight: 22 },
  deity: { fontFamily: fonts.inter, fontSize: 11.5, marginTop: 2 },
  note: { fontFamily: fonts.inter, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 18 },
});
