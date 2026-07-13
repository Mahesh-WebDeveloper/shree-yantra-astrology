import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radii } from '../theme/tokens';
import { Page } from '../components/Page';
import { GradientText } from '../components/GradientText';
import { VerseMeaning } from '../components/VerseMeaning';
import { hTap } from '../lib/haptics';
import { useT, useLang } from '../i18n/LanguageProvider';
import { vedaCfg } from '../data/vedaConfig';
import { getVedaSection, getVedaExplanation, VedaSectionFull } from '../lib/api';

export function VedaVerseScreen({ navigation, route }: any) {
  const { theme } = useTheme();
  const t = useT();
  const { lang } = useLang();
  const veda: string = route?.params?.veda || 'atharvaveda';
  const book: number = route?.params?.book || 1;
  const section: number = route?.params?.section || 1;
  const cfg = vedaCfg(veda);
  const L = (o: { en: string; hi: string }) => (lang === 'hi' ? o.hi : o.en);
  const [data, setData] = useState<VedaSectionFull | null>(null);
  const [err, setErr] = useState(false);
  // Chapters that carry a story open on it — a newcomer meets the chapter as a story first
  // and can switch to the shlokas whenever they want. Chapters without one skip the toggle.
  const [tab, setTab] = useState<'story' | 'verses'>('story');

  useEffect(() => {
    let on = true;
    getVedaSection(veda, book, section).then((r) => { if (on) setData(r.section); }).catch(() => { if (on) setErr(true); });
    return () => { on = false; };
  }, [veda, book, section]);

  const goldDivider = theme.isDark ? 'rgba(201,150,46,0.45)' : 'rgba(176,115,22,0.35)';
  const title = route?.params?.heading || (cfg.hasSections
    ? `${L(cfg.bookLabel)} ${book} · ${L(cfg.sectionLabel)} ${section}`
    : `${L(cfg.bookLabel)} ${book}`);

  return (
    <Page title={title} onBack={() => { hTap(); navigation.goBack(); }}>
      {!data && !err && <View style={styles.center}><ActivityIndicator color={theme.gold1} /></View>}
      {err && <Text style={[styles.err, { color: theme.textMuted }]}>Load nahi ho paya — internet check karein.</Text>}

      {data && (() => {
        const story = lang === 'hi' ? data.story?.hi : (data.story?.en || data.story?.hi);
        const storyTitle = lang === 'hi' ? data.storyTitle?.hi : (data.storyTitle?.en || data.storyTitle?.hi);
        const hasStory = !!story;
        const showStory = hasStory && tab === 'story';

        return (
        <>
          <View style={styles.hero}>
            <GradientText style={styles.chTitle}>{title}</GradientText>
            {!!storyTitle && <Text style={[styles.chTheme, { color: theme.text }]}>{storyTitle}</Text>}
            <Text style={[styles.chSub, { color: theme.textMuted }]}>{data.verseCount} {L(cfg.verseLabel)}</Text>
          </View>

          {hasStory && (
            <View style={[styles.tabs, { borderColor: theme.cardBorder, backgroundColor: theme.cardBg }]}>
              {([
                { key: 'story' as const, label: lang === 'hi' ? 'कथा' : 'Story' },
                { key: 'verses' as const, label: lang === 'hi' ? 'श्लोक' : 'Shlokas' },
              ]).map((tb) => {
                const on = tab === tb.key;
                return (
                  <Pressable key={tb.key} onPress={() => { hTap(); setTab(tb.key); }} style={styles.tab}>
                    {on && <LinearGradient colors={theme.buttonGradient} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: radii.sm }]} />}
                    <Text style={[styles.tabText, { color: on ? theme.goldInk : theme.textMuted }]}>{tb.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {showStory && (
            <View style={[styles.storyCard, { borderColor: theme.isDark ? 'rgba(201,150,46,0.26)' : 'rgba(176,115,22,0.2)', backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : '#fffdf7' }]}>
              <Text style={[styles.storyText, { color: theme.text }]}>{story}</Text>
            </View>
          )}

          <View style={{ gap: 14, marginTop: 6, display: showStory ? 'none' : 'flex' }}>
            {data.verses.map((v) => (
              <View key={v.verse} style={[styles.verseCard, { borderColor: theme.isDark ? 'rgba(201,150,46,0.26)' : 'rgba(176,115,22,0.2)', backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : '#fffdf7' }]}>
                <View style={styles.verseHead}>
                  <Text style={[styles.verseNo, { color: theme.gold1 }]}>{L(cfg.verseLabel)} {book}.{section}.{v.verse}</Text>
                  <LinearGradient colors={['transparent', goldDivider, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.hr} />
                </View>

                {!!v.sanskrit && <Text style={[styles.sanskrit, { color: theme.isDark ? '#f3e6c2' : theme.text }]}>{v.sanskrit}</Text>}
                {!!v.transliteration && <Text style={[styles.translit, { color: theme.textMuted }]}>{v.transliteration}</Text>}

                {!!v.hindi && (
                  <View style={[styles.transBox, { borderTopColor: theme.isDark ? 'rgba(201,150,46,0.2)' : 'rgba(176,115,22,0.15)' }]}>
                    <Text style={[styles.transLabel, { color: theme.gold2 }]}>हिंदी अनुवाद</Text>
                    <Text style={[styles.hindiText, { color: theme.text }]}>{v.hindi}</Text>
                  </View>
                )}
                {!!v.english && (
                  <View style={[styles.transBox, { borderTopColor: theme.isDark ? 'rgba(201,150,46,0.2)' : 'rgba(176,115,22,0.15)' }]}>
                    <Text style={[styles.transLabel, { color: theme.gold2 }]}>{lang === 'hi' ? 'अंग्रेज़ी अनुवाद' : 'English'}</Text>
                    <Text style={[styles.transText, { color: theme.text }]}>{v.english}</Text>
                  </View>
                )}

                <VerseMeaning fetcher={() => getVedaExplanation(veda, book, section, v.verse)} />
              </View>
            ))}
          </View>
        </>
        );
      })()}
    </Page>
  );
}

const styles = StyleSheet.create({
  center: { paddingVertical: 50, alignItems: 'center' },
  err: { fontFamily: fonts.inter, fontSize: 13, textAlign: 'center', paddingVertical: 30 },
  hero: { alignItems: 'center', marginBottom: 14 },
  chTitle: { fontFamily: fonts.cinzel, fontSize: 19, letterSpacing: 0.5, textAlign: 'center' },
  chTheme: { fontFamily: fonts.devanagari, fontSize: 15, marginTop: 6, textAlign: 'center' },
  chSub: { fontFamily: fonts.inter, fontSize: 12, marginTop: 4 },

  tabs: { flexDirection: 'row', gap: 4, padding: 4, borderWidth: 1, borderRadius: radii.md, marginBottom: 14 },
  tab: { flex: 1, paddingVertical: 9, alignItems: 'center', justifyContent: 'center', borderRadius: radii.sm, overflow: 'hidden' },
  tabText: { fontFamily: fonts.inter, fontSize: 13, fontWeight: '700' },

  storyCard: { borderWidth: 1, borderRadius: radii.lg, padding: 18, marginBottom: 6 },
  storyText: { fontFamily: fonts.devanagari, fontSize: 16, lineHeight: 30 },
  verseCard: { borderWidth: 1, borderRadius: radii.lg, padding: 16 },
  verseHead: { marginBottom: 12 },
  verseNo: { fontFamily: fonts.cinzelSemi, fontSize: 12, letterSpacing: 1 },
  hr: { height: 1, marginTop: 8, borderRadius: 1 },
  sanskrit: { fontFamily: fonts.devanagari, fontSize: 16.5, lineHeight: 29, textAlign: 'center' },
  translit: { fontFamily: fonts.inter, fontStyle: 'italic', fontSize: 11.5, lineHeight: 17, textAlign: 'center', marginTop: 10 },
  transBox: { borderTopWidth: 1, marginTop: 14, paddingTop: 12 },
  transLabel: { fontFamily: fonts.interSemi, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 5 },
  transText: { fontFamily: fonts.inter, fontSize: 13.5, lineHeight: 21 },
  hindiText: { fontFamily: fonts.devanagari, fontSize: 15, lineHeight: 25 },
});
