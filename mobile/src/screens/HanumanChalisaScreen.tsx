import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Page } from '../components/Page';
import { GradientText } from '../components/GradientText';
import { VerseMeaning } from '../components/VerseMeaning';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radii } from '../theme/tokens';
import { hTap } from '../lib/haptics';
import { useLang } from '../i18n/LanguageProvider';
import { getVedaSection, getVedaExplanation, VedaVerse } from '../lib/api';

const VEDA = 'hanuman-chalisa';

// verse 1-2 = opening dohas, 3-42 = chaupai 1-40, 43 = closing doha
function verseLabel(n: number, hi: boolean): string {
  if (n <= 2) return hi ? `॥ दोहा ${n} ॥` : `Doha ${n}`;
  if (n === 43) return hi ? '॥ दोहा ॥' : 'Closing Doha';
  return hi ? `चौपाई ${n - 2}` : `Chaupai ${n - 2}`;
}

export function HanumanChalisaScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const hi = lang === 'hi';
  const [verses, setVerses] = useState<VedaVerse[] | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let on = true;
    getVedaSection(VEDA, 1, 1)
      .then((r) => { if (on) setVerses(r.section?.verses || []); })
      .catch(() => { if (on) setErr(true); });
    return () => { on = false; };
  }, []);

  const intro = hi
    ? [
        { k: 'क्या है', v: 'हनुमान चालीसा 40 चौपाइयों का भजन है (चालीसा = चालीस), जिसे लगभग 500 वर्ष पहले संत-कवि गोस्वामी तुलसीदास ने रचा। यह बल, साहस, भक्ति और रक्षा के देव श्री हनुमान की स्तुति है।' },
        { k: 'क्यों पढ़ें', v: 'भक्त इसे साहस पाने, भय व संकट दूर करने और हनुमान जी की कृपा के लिए पढ़ते हैं — भारत की सबसे प्रिय प्रार्थनाओं में से एक।' },
        { k: 'कैसे पढ़ें', v: 'हर चौपाई देवनागरी में पढ़ें, नीचे उच्चारण (रोमन) और अर्थ देखें। किसी भी चौपाई के नीचे “सरल अर्थ जानें” दबाएँ — AI उसे सबसे आसान भाषा में, एक जीवन-सीख के साथ समझाएगा।' },
      ]
    : [
        { k: 'What it is', v: 'The Hanuman Chalisa is a 40-verse hymn (chalisa = forty), composed about 500 years ago by the poet-saint Goswami Tulsidas, praising Lord Hanuman — the deity of strength, courage, devotion and protection.' },
        { k: 'Why recite it', v: 'Devotees recite it for courage, to remove fear and troubles, and for Hanuman’s blessings — one of the most-loved prayers in India.' },
        { k: 'How to read here', v: 'Read each verse in Devanagari, see how it sounds (Roman) and its English meaning. Tap “Understand in simple words” under any verse — our AI explains it the easiest way, with a life lesson.' },
      ];

  return (
    <Page title={hi ? 'हनुमान चालीसा' : 'Hanuman Chalisa'} onBack={() => { hTap(); navigation.goBack(); }}>
      {/* Hero */}
      <LinearGradient
        colors={theme.isDark ? ['rgba(233,184,80,0.16)', 'rgba(233,184,80,0.03)'] : ['rgba(255,247,224,0.95)', 'rgba(255,253,247,0.9)']}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        style={[styles.hero, { borderColor: theme.gold3 }]}
      >
        <LinearGradient colors={theme.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.crest}>
          <Text style={styles.crestGlyph}>🚩</Text>
        </LinearGradient>
        <Text style={[styles.heroDeva, { color: theme.text }]}>श्री हनुमान चालीसा</Text>
        <GradientText style={styles.heroTitle}>SHRI HANUMAN CHALISA</GradientText>
        <Text style={[styles.heroAuthor, { color: theme.gold2 }]}>{hi ? 'रचयिता — गोस्वामी तुलसीदास' : 'by Goswami Tulsidas'}</Text>
        <View style={styles.heroTags}>
          {[hi ? '43 पद' : '43 verses', hi ? 'हिंदी + English' : 'Hindi + English', hi ? 'AI अर्थ' : 'AI meaning'].map((tag) => (
            <View key={tag} style={[styles.heroTag, { borderColor: theme.gold3, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.08)' : 'rgba(233,184,80,0.06)' }]}>
              <Text style={[styles.heroTagTxt, { color: theme.gold1 }]} numberOfLines={1}>{tag}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* Beginner intro */}
      <View style={[styles.introCard, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.85)' }]}>
        {intro.map((b) => (
          <View key={b.k} style={styles.introRow}>
            <Text style={[styles.introK, { color: theme.gold1 }]}>{b.k}</Text>
            <Text style={[styles.introV, { color: theme.textSoft }]}>{b.v}</Text>
          </View>
        ))}
      </View>

      {err && <Text style={[styles.err, { color: theme.textMuted }]}>{hi ? 'पाठ लोड नहीं हो पाया — इंटरनेट जाँचें।' : 'Could not load — check your internet.'}</Text>}
      {!verses && !err && <View style={styles.center}><ActivityIndicator color={theme.gold1} /></View>}

      {/* Verses */}
      {verses && (
        <View style={{ gap: 14, marginTop: 4 }}>
          {verses.map((v) => {
            const doha = v.verse <= 2 || v.verse === 43;
            return (
              <View key={v.verse} style={[styles.card, { borderColor: doha ? theme.gold3 : theme.cardBorder, backgroundColor: theme.isDark ? (doha ? 'rgba(233,184,80,0.06)' : 'rgba(255,255,255,0.02)') : (doha ? 'rgba(255,247,224,0.9)' : 'rgba(255,253,247,0.85)') }]}>
                <Text style={[styles.vLabel, { color: theme.gold2 }]}>{verseLabel(v.verse, hi)}</Text>
                <Text style={[styles.deva, { color: theme.text }]}>{v.sanskrit}</Text>
                {!!v.transliteration && <Text style={[styles.roman, { color: theme.textMuted }]}>{v.transliteration}</Text>}
                {!!v.english && (
                  <View style={[styles.enBox, { borderTopColor: theme.cardBorder }]}>
                    <Text style={[styles.enLabel, { color: theme.gold2 }]}>ENGLISH</Text>
                    <Text style={[styles.enText, { color: theme.textSoft }]}>{v.english}</Text>
                  </View>
                )}
                <VerseMeaning fetcher={() => getVedaExplanation(VEDA, 1, 1, v.verse, lang)} />
              </View>
            );
          })}
        </View>
      )}

      <Text style={[styles.footer, { color: theme.textMuted }]}>
        {hi ? '॥ बोलो बजरंगबली की जय ॥' : '॥ Jai Bajrangbali ॥'}
      </Text>
      <View style={{ height: 10 }} />
    </Page>
  );
}

const styles = StyleSheet.create({
  hero: { borderWidth: 1, borderRadius: 20, alignItems: 'center', paddingVertical: 22, paddingHorizontal: 16, marginBottom: 14 },
  crest: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  crestGlyph: { fontSize: 30 },
  heroDeva: { fontFamily: fonts.devanagari, fontSize: 24, textAlign: 'center' },
  heroTitle: { fontFamily: fonts.cinzelSemi, fontSize: 14, letterSpacing: 2, textAlign: 'center', marginTop: 6 },
  heroAuthor: { fontFamily: fonts.interSemi, fontSize: 12, marginTop: 8 },
  heroTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, justifyContent: 'center', alignItems: 'center', marginTop: 14 },
  heroTag: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 5, alignItems: 'center', justifyContent: 'center' },
  heroTagTxt: { fontFamily: fonts.interSemi, fontSize: 10.5, textAlign: 'center' },

  introCard: { borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 16, gap: 12 },
  introRow: { gap: 3 },
  introK: { fontFamily: fonts.cinzelSemi, fontSize: 11.5, letterSpacing: 0.6, textTransform: 'uppercase' },
  introV: { fontFamily: fonts.inter, fontSize: 12.8, lineHeight: 19 },

  center: { paddingVertical: 40, alignItems: 'center' },
  err: { fontFamily: fonts.inter, fontSize: 13, textAlign: 'center', paddingVertical: 24 },

  card: { borderWidth: 1, borderRadius: 16, padding: 16 },
  vLabel: { fontFamily: fonts.cinzelSemi, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 9 },
  deva: { fontFamily: fonts.devanagari, fontSize: 18, lineHeight: 32 },
  roman: { fontFamily: fonts.inter, fontSize: 12.5, lineHeight: 20, fontStyle: 'italic', marginTop: 8 },
  enBox: { borderTopWidth: 1, marginTop: 12, paddingTop: 11 },
  enLabel: { fontFamily: fonts.interSemi, fontSize: 9.5, letterSpacing: 1.2, marginBottom: 4 },
  enText: { fontFamily: fonts.inter, fontSize: 13, lineHeight: 20 },

  footer: { fontFamily: fonts.devanagari, fontSize: 14, textAlign: 'center', marginTop: 18 },
});
