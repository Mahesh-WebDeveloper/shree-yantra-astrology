import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radii } from '../theme/tokens';
import { Page } from '../components/Page';
import { GradientText } from '../components/GradientText';
import { hTap } from '../lib/haptics';
import { useLang } from '../i18n/LanguageProvider';
import { vedaCfg } from '../data/vedaConfig';
import { getVedaSections, VedaSectionInfo } from '../lib/api';

const Chevron = ({ c }: { c: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Polyline points="9 18 15 12 9 6" /></Svg>
);

export function VedaBookScreen({ navigation, route }: any) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const veda: string = route?.params?.veda || 'atharvaveda';
  const book: number = route?.params?.book || 1;
  const bookName: string = route?.params?.bookName || '';
  const cfg = vedaCfg(veda);
  const L = (o: { en: string; hi: string }) => (lang === 'hi' ? o.hi : o.en);
  const heading = bookName || `${L(cfg.bookLabel)} ${book}`;
  const [sections, setSections] = useState<VedaSectionInfo[] | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let on = true;
    getVedaSections(veda, book).then((r) => { if (on) setSections(r.sections); }).catch(() => { if (on) setErr(true); });
    return () => { on = false; };
  }, [veda, book]);

  const open = (s: VedaSectionInfo) => {
    hTap();
    const secName = s.sectionName || `${L(cfg.sectionLabel)} ${s.section}`;
    navigation.navigate('VedaVerse', { veda, book, section: s.section, heading: `${heading} · ${secName}` });
  };

  return (
    <Page title={heading} onBack={() => { hTap(); navigation.goBack(); }}>
      <View style={styles.hero}>
        <GradientText style={styles.heroTitle}>{heading}</GradientText>
        {sections && <Text style={[styles.heroSub, { color: theme.gold2 }]}>{sections.length} {L(cfg.sectionLabel)}</Text>}
      </View>

      {!sections && !err && <View style={styles.center}><ActivityIndicator color={theme.gold1} /></View>}
      {err && <Text style={[styles.err, { color: theme.textMuted }]}>Load nahi ho paya.</Text>}

      <View style={{ gap: 10 }}>
        {sections?.map((s) => (
          <Pressable
            key={s.section}
            onPress={() => open(s)}
            style={({ pressed }) => [
              styles.card,
              { borderColor: theme.isDark ? 'rgba(201,150,46,0.28)' : 'rgba(176,115,22,0.22)', backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : '#fffdf7' },
              pressed && { transform: [{ scale: 0.99 }], borderColor: theme.gold2 },
            ]}
          >
            <LinearGradient colors={['#fce8a8', '#e9b850', '#c9962e']} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.num}>
              <Text style={styles.numText}>{s.section}</Text>
            </LinearGradient>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{s.sectionName || `${L(cfg.sectionLabel)} ${s.section}`}</Text>
              <Text style={[styles.sub, { color: theme.textMuted }]} numberOfLines={1}>{s.verseCount} {L(cfg.verseLabel)}</Text>
            </View>
            <Chevron c={theme.gold2} />
          </Pressable>
        ))}
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginBottom: 16, marginTop: 2 },
  heroTitle: { fontFamily: fonts.cinzel, fontSize: 20, letterSpacing: 0.5, textAlign: 'center' },
  heroSub: { fontFamily: fonts.interSemi, fontSize: 12, letterSpacing: 1, marginTop: 6 },
  center: { paddingVertical: 40, alignItems: 'center' },
  err: { fontFamily: fonts.inter, fontSize: 13, textAlign: 'center', paddingVertical: 30 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: radii.lg, borderWidth: 1 },
  num: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  numText: { fontFamily: fonts.cinzelXBold, fontSize: 17, color: '#2a1c00' },
  name: { fontFamily: fonts.devanagari, fontSize: 17 },
  sub: { fontFamily: fonts.inter, fontSize: 11.5, marginTop: 3 },
});
