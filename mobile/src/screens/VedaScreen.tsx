import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radii } from '../theme/tokens';
import { Page } from '../components/Page';
import { GradientText } from '../components/GradientText';
import { OmGlyph } from '../components/icons/OmGlyph';
import { hTap } from '../lib/haptics';
import { useLang } from '../i18n/LanguageProvider';
import { vedaCfg } from '../data/vedaConfig';
import { getVedaBooks, VedaBook } from '../lib/api';

const Chevron = ({ c }: { c: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Polyline points="9 18 15 12 9 6" /></Svg>
);

export function VedaScreen({ navigation, route }: any) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const veda: string = route?.params?.veda || 'atharvaveda';
  const cfg = vedaCfg(veda);
  const L = (o: { en: string; hi: string }) => (lang === 'hi' ? o.hi : o.en);
  const [books, setBooks] = useState<VedaBook[] | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let on = true;
    getVedaBooks(veda).then((r) => { if (on) setBooks(r.books); }).catch(() => { if (on) setErr(true); });
    return () => { on = false; };
  }, [veda]);

  const openBook = (b: VedaBook) => {
    hTap();
    // single-section book (e.g. Ishavasya/Mandukya Upanishad) → seedha content, beech ka grid skip
    if (cfg.hasSections && b.sections > 1) navigation.navigate('VedaBook', { veda, book: b.book, bookName: b.bookName });
    else navigation.navigate('VedaVerse', { veda, book: b.book, section: 1, heading: b.bookName });
  };

  return (
    <Page title={L(cfg.title)} onBack={() => { hTap(); navigation.goBack(); }}>
      <View style={styles.hero}>
        <View style={[styles.omCircle, { borderColor: 'rgba(201,150,46,0.5)', backgroundColor: theme.isDark ? 'rgba(0,0,0,0.5)' : 'rgba(176,115,22,0.05)' }]}>
          <OmGlyph size={40} />
        </View>
        <GradientText style={styles.heroTitle}>{L(cfg.title)}</GradientText>
        <Text style={[styles.heroSub, { color: theme.gold2 }]}>{L(cfg.subtitle)}</Text>
      </View>

      {/* 🎧 Mahabharat audio katha (Hindi) playlist */}
      {veda === 'mahabharata' && (
        <Pressable
          onPress={() => { hTap(); navigation.navigate('AudioPlaylist', { subCategory: 'mahabharat_audio', title: lang === 'hi' ? 'महाभारत ऑडियो' : 'Mahabharat Audio', attribution: 'Mahabharat · Fever FM / HT Smartcast (Vijay Raaz)' }); }}
          style={({ pressed }) => [
            styles.audioBtn,
            { borderColor: theme.gold2, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.12)' : 'rgba(176,115,22,0.07)' },
            pressed && { opacity: 0.9 },
          ]}
        >
          <Text style={styles.audioIcon}>🎧</Text>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.audioTitle, { color: theme.goldText }]} numberOfLines={1}>{lang === 'hi' ? 'महाभारत ऑडियो कथा' : 'Mahabharat Audio Katha'}</Text>
            <Text style={[styles.audioSub, { color: theme.textMuted }]} numberOfLines={1}>{lang === 'hi' ? 'हिंदी · सुनें (100 episodes)' : 'Hindi · Listen (100 episodes)'}</Text>
          </View>
          <Chevron c={theme.gold2} />
        </Pressable>
      )}

      {!books && !err && <View style={styles.center}><ActivityIndicator color={theme.gold1} /></View>}
      {err && <Text style={[styles.err, { color: theme.textMuted }]}>Content load nahi ho paya — internet check karein.</Text>}

      <View style={{ gap: 10 }}>
        {books?.map((b) => (
          <Pressable
            key={b.book}
            onPress={() => openBook(b)}
            style={({ pressed }) => [
              styles.card,
              { borderColor: theme.isDark ? 'rgba(201,150,46,0.28)' : 'rgba(176,115,22,0.22)', backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : '#fffdf7' },
              pressed && { transform: [{ scale: 0.99 }], borderColor: theme.gold2 },
            ]}
          >
            <LinearGradient colors={['#fce8a8', '#e9b850', '#c9962e']} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.num}>
              <Text style={styles.numText}>{b.book}</Text>
            </LinearGradient>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.kName, { color: theme.text }]} numberOfLines={1}>{b.bookName || `${L(cfg.bookLabel)} ${b.book}`}</Text>
              <Text style={[styles.kSub, { color: theme.textMuted }]} numberOfLines={1}>
                {cfg.hasSections ? `${b.sections} ${L(cfg.sectionLabel)} · ` : ''}{b.verses} {L(cfg.verseLabel)}
              </Text>
            </View>
            <Chevron c={theme.gold2} />
          </Pressable>
        ))}
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginBottom: 18, marginTop: 4 },
  omCircle: { width: 72, height: 72, borderRadius: 36, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  heroTitle: { fontFamily: fonts.cinzel, fontSize: 24, letterSpacing: 1.5 },
  heroSub: { fontFamily: fonts.interSemi, fontSize: 12, letterSpacing: 1, marginTop: 6 },
  center: { paddingVertical: 40, alignItems: 'center' },
  err: { fontFamily: fonts.inter, fontSize: 13, textAlign: 'center', paddingVertical: 30 },
  audioBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radii.lg, borderWidth: 1, marginBottom: 16 },
  audioIcon: { fontSize: 22 },
  audioTitle: { fontFamily: fonts.interSemi, fontSize: 14 },
  audioSub: { fontFamily: fonts.inter, fontSize: 11.5, marginTop: 2 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: radii.lg, borderWidth: 1 },
  num: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  numText: { fontFamily: fonts.cinzelXBold, fontSize: 17, color: '#2a1c00' },
  kName: { fontFamily: fonts.devanagari, fontSize: 17 },
  kSub: { fontFamily: fonts.inter, fontSize: 11.5, marginTop: 3 },
});
