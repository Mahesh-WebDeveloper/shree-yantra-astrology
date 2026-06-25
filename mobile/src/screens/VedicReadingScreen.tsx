import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Page } from '../components/Page';
import { GradientText } from '../components/GradientText';
import { SpeakButton } from '../components/SpeakButton';
import { useTheme } from '../theme/ThemeProvider';
import { Theme, fonts, radii } from '../theme/tokens';
import { hTap } from '../lib/haptics';
import { useT, useLang } from '../i18n/LanguageProvider';
import { aSign } from '../i18n/astro';
import { birthFromProfile } from '../lib/birth';
import { getVedicReading, VedicReadingResponse, ReadingPrediction } from '../lib/api';

const DEFAULT_BIRTH = { dob: '01-01-2000', tob: '06:42', tz: '+05:30', place: 'Jaipur' };

// category → icon + accent + bilingual label
const CAT: Record<string, { icon: string; color: string; en: string; hi: string }> = {
  personality: { icon: '🧬', color: '#9b8cff', en: 'Personality', hi: 'व्यक्तित्व' },
  nature: { icon: '🌿', color: '#6ec88c', en: 'Nature', hi: 'स्वभाव' },
  career: { icon: '💼', color: '#e0a92e', en: 'Career', hi: 'करियर' },
  wealth: { icon: '💰', color: '#3ec77a', en: 'Wealth', hi: 'धन' },
  education: { icon: '📚', color: '#5aa9e0', en: 'Education', hi: 'शिक्षा' },
  yoga: { icon: '✨', color: '#f4c34a', en: 'Special Yogas', hi: 'विशेष योग' },
  health: { icon: '🩺', color: '#e07aa9', en: 'Health', hi: 'स्वास्थ्य' },
  precaution: { icon: '⚠️', color: '#e06a5a', en: 'Precautions', hi: 'सावधानियाँ' },
};
const CAT_ORDER = ['yoga', 'personality', 'career', 'wealth', 'education', 'nature', 'health', 'precaution'];

function Chip({ label, value, theme }: { label: string; value?: string; theme: Theme }) {
  if (!value) return null;
  return (
    <View style={[styles.chip, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]}>
      <Text style={[styles.chipLbl, { color: theme.textMuted }]}>{label}</Text>
      <Text style={[styles.chipVal, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

export function VedicReadingScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const t = useT();
  const [data, setData] = useState<VedicReadingResponse | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let on = true;
    (async () => {
      const b = await birthFromProfile().catch(() => null);
      try { const r = await getVedicReading((b || DEFAULT_BIRTH) as any); if (on) setData(r); }
      catch (_) { if (on) setErr(true); }
    })();
    return () => { on = false; };
  }, []);

  const L = (o?: { en: string; hi: string } | null) => (o ? (lang === 'hi' ? o.hi : o.en) : '');
  const ex = data?.explanation;
  const j = data?.janma;

  const grouped = CAT_ORDER
    .map((c) => ({ cat: c, items: (data?.predictions || []).filter((p) => p.category === c) }))
    .filter((g) => g.items.length);
  // any predictions in categories not in CAT_ORDER
  const others = (data?.predictions || []).filter((p) => !CAT_ORDER.includes(p.category));
  if (others.length) grouped.push({ cat: 'personality', items: others });

  const speakAll = [
    ex?.summary || '',
    ...(data?.predictions || []).map((p) => `${L(p.title)}. ${L(p.text)}`),
    ex?.advice || '',
  ];

  return (
    <Page title={t('reading.title', 'Vedic Reading')} onBack={() => { hTap(); navigation.goBack(); }}>
      {!data && !err && <View style={styles.center}><ActivityIndicator color={theme.gold1} /><Text style={[styles.load, { color: theme.textMuted }]}>{lang === 'hi' ? 'शास्त्रीय फलादेश तैयार हो रहा है…' : 'Preparing your classical reading…'}</Text></View>}
      {err && <Text style={[styles.err, { color: theme.textMuted }]}>{lang === 'hi' ? 'लोड नहीं हो पाया — इंटरनेट जाँचें।' : 'Could not load — check internet.'}</Text>}

      {data && (
        <View style={{ gap: 14 }}>
          {/* header */}
          <View style={styles.hero}>
            <GradientText style={styles.heroTitle}>{t('reading.heading', lang === 'hi' ? 'पारंपरिक फलादेश' : 'Traditional Reading')}</GradientText>
            <Text style={[styles.heroSub, { color: theme.textMuted }]}>
              {data.ascendant ? `${lang === 'hi' ? 'लग्न' : 'Lagna'} ${aSign(data.ascendant, lang)}` : ''}{data.moonSign ? `  ·  ${lang === 'hi' ? 'चंद्र' : 'Moon'} ${aSign(data.moonSign, lang)}` : ''}
            </Text>
          </View>

          {/* janma details */}
          {!!j && (
            <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.85)' }]}>
              <Text style={[styles.h, { color: theme.gold1 }]}>{lang === 'hi' ? 'जन्म विवरण' : 'Birth Profile'}</Text>
              <View style={styles.chipRow}>
                <Chip label={lang === 'hi' ? 'गण' : 'Gana'} value={L(j.gana)} theme={theme} />
                <Chip label={lang === 'hi' ? 'योनि' : 'Yoni'} value={L(j.yoni)} theme={theme} />
                <Chip label={lang === 'hi' ? 'नाड़ी' : 'Nadi'} value={L(j.nadi)} theme={theme} />
                <Chip label={lang === 'hi' ? 'वर्ण' : 'Varna'} value={L(j.varna)} theme={theme} />
              </View>
              {j.gandmool?.present && (
                <Text style={[styles.flag, { color: '#e0a92e' }]}>⚠ {lang === 'hi' ? 'गण्डमूल नक्षत्र' : 'Gandmool Nakshatra'}{j.gandmool.nakshatra ? ` (${j.gandmool.nakshatra})` : ''} — {L(j.gandmool.note)}</Text>
              )}
              {j.lagnaSandhi && <Text style={[styles.flag, { color: '#e0a92e' }]}>⚠ {lang === 'hi' ? 'लग्न संधि (सीमा-जन्म)' : 'Lagna Sandhi (borderline birth)'}</Text>}
            </View>
          )}

          {/* Naamakshar (naming syllable) */}
          {!!data.naamakshar && (
            <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.85)' }]}>
              <Text style={[styles.h, { color: theme.gold1 }]}>{lang === 'hi' ? 'नामाक्षर' : 'Naming Syllable (Naamakshar)'}</Text>
              <View style={styles.namRow}>
                <GradientText style={styles.namSyl}>{data.naamakshar.syllable}</GradientText>
                <Text style={[styles.namNote, { color: theme.textSoft }]}>{L(data.naamakshar.note)} — {data.naamakshar.nakshatra} {lang === 'hi' ? 'चरण' : 'pada'} {data.naamakshar.pada}</Text>
              </View>
            </View>
          )}

          {/* Birth Panchang */}
          {!!data.birthPanchang && (
            <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.85)' }]}>
              <Text style={[styles.h, { color: theme.gold1 }]}>{lang === 'hi' ? 'जन्म पंचांग' : 'Birth Panchang'}</Text>
              <View style={styles.chipRow}>
                <Chip label={lang === 'hi' ? 'तिथि' : 'Tithi'} value={`${lang === 'hi' ? (data.birthPanchang.tithi.hi || data.birthPanchang.tithi.name) : data.birthPanchang.tithi.name} (${lang === 'hi' ? data.birthPanchang.tithi.pakshaHi : data.birthPanchang.tithi.paksha})`} theme={theme} />
                <Chip label={lang === 'hi' ? 'नक्षत्र' : 'Nakshatra'} value={`${lang === 'hi' ? (data.birthPanchang.nakshatra.hi || data.birthPanchang.nakshatra.name) : data.birthPanchang.nakshatra.name} ${lang === 'hi' ? 'चरण' : 'p'}${data.birthPanchang.nakshatra.pada}`} theme={theme} />
                <Chip label={lang === 'hi' ? 'योग' : 'Yoga'} value={lang === 'hi' ? (data.birthPanchang.yoga.hi || data.birthPanchang.yoga.name) : data.birthPanchang.yoga.name} theme={theme} />
                <Chip label={lang === 'hi' ? 'करण' : 'Karana'} value={lang === 'hi' ? (data.birthPanchang.karana.hi || data.birthPanchang.karana.name) : data.birthPanchang.karana.name} theme={theme} />
                {!!data.birthPanchang.masa && <Chip label={lang === 'hi' ? 'मास' : 'Masa'} value={L(data.birthPanchang.masa.amanta)} theme={theme} />}
                {!!data.birthPanchang.samvat && <Chip label={lang === 'hi' ? 'विक्रम सं.' : 'Vikram Samvat'} value={`${data.birthPanchang.samvat.vikram}${data.birthPanchang.samvatsara ? ' ' + data.birthPanchang.samvatsara : ''}`} theme={theme} />}
              </View>
            </View>
          )}

          {/* AI summary */}
          {!!ex?.summary && (
            <View style={[styles.card, { borderColor: theme.gold2 + '55', backgroundColor: theme.isDark ? 'rgba(201,150,46,0.07)' : 'rgba(244,195,74,0.1)' }]}>
              <Text style={[styles.summary, { color: theme.text }]}>{ex.summary}</Text>
              <View style={{ marginTop: 12 }}><SpeakButton text={speakAll} /></View>
            </View>
          )}

          {/* predictions by category */}
          {grouped.map((g) => {
            const c = CAT[g.cat] || CAT.personality;
            return (
              <View key={g.cat} style={[styles.card, { borderColor: c.color + '55', backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.85)' }]}>
                <Text style={[styles.h, { color: c.color }]}>{c.icon}  {lang === 'hi' ? c.hi : c.en}</Text>
                <View style={{ gap: 11, marginTop: 8 }}>
                  {g.items.map((p) => <PredCard key={p.key} p={p} lang={lang} theme={theme} />)}
                </View>
              </View>
            );
          })}

          {!!ex?.advice && (
            <View style={[styles.adviceBox, { borderColor: theme.gold2 + '55', backgroundColor: theme.isDark ? 'rgba(201,150,46,0.08)' : 'rgba(244,195,74,0.12)' }]}>
              <Text style={[styles.adviceText, { color: theme.text }]}>💛 {ex.advice}</Text>
            </View>
          )}

          <Text style={[styles.trust, { color: theme.textMuted }]}>🔒 {lang === 'hi' ? 'गणना VedAstro (Lahiri) · फलादेश शास्त्र-आधारित (BPHS/फलदीपिका/मानसागरी)।' : 'Chart by VedAstro (Lahiri) · readings from classical texts (BPHS/Phaldeepika/Mansagari).'}</Text>
          <View style={{ height: 8 }} />
        </View>
      )}
    </Page>
  );
}

function PredCard({ p, lang, theme }: { p: ReadingPrediction; lang: 'en' | 'hi'; theme: Theme }) {
  const dot = p.strength === 'good' ? '#3ec77a' : p.strength === 'caution' ? '#e06a5a' : theme.gold2;
  const title = lang === 'hi' ? p.title.hi : p.title.en;
  const text = lang === 'hi' ? p.text.hi : p.text.en;
  return (
    <View style={[styles.pred, { borderColor: theme.cardBorder }]}>
      <View style={styles.predHead}>
        <View style={[styles.pdot, { backgroundColor: dot }]} />
        <Text style={[styles.predTitle, { color: theme.text }]}>{title}</Text>
        {!!p.source && <Text style={[styles.src, { color: theme.textMuted, borderColor: theme.cardBorder }]}>{p.source}</Text>}
      </View>
      <Text style={[styles.predText, { color: theme.textSoft }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { paddingVertical: 50, alignItems: 'center', gap: 12 },
  load: { fontFamily: fonts.inter, fontSize: 12.5 },
  err: { fontFamily: fonts.inter, fontSize: 13, textAlign: 'center', paddingVertical: 30 },

  hero: { alignItems: 'center', marginTop: 2 },
  heroTitle: { fontFamily: fonts.cinzel, fontSize: 21, letterSpacing: 0.8 },
  heroSub: { fontFamily: fonts.inter, fontSize: 12.5, marginTop: 6 },

  card: { borderWidth: 1, borderRadius: 16, padding: 16 },
  h: { fontFamily: fonts.cinzelSemi, fontSize: 13.5, letterSpacing: 0.5 },
  summary: { fontFamily: fonts.inter, fontSize: 14, lineHeight: 22 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 6, alignItems: 'center', minWidth: 72 },
  chipLbl: { fontFamily: fonts.interSemi, fontSize: 9.5, letterSpacing: 0.8, textTransform: 'uppercase' },
  chipVal: { fontFamily: fonts.cinzelSemi, fontSize: 13, marginTop: 2 },
  flag: { fontFamily: fonts.inter, fontSize: 12.5, lineHeight: 18, marginTop: 11 },
  namRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8 },
  namSyl: { fontFamily: fonts.cinzelXBold, fontSize: 34 },
  namNote: { flex: 1, fontFamily: fonts.inter, fontSize: 12.5, lineHeight: 18 },

  pred: { borderWidth: 1, borderRadius: 12, padding: 12 },
  predHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pdot: { width: 8, height: 8, borderRadius: 4 },
  predTitle: { flex: 1, fontFamily: fonts.interSemi, fontSize: 14 },
  src: { fontFamily: fonts.inter, fontSize: 9.5, borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  predText: { fontFamily: fonts.inter, fontSize: 13.5, lineHeight: 21, marginTop: 7 },

  adviceBox: { borderWidth: 1, borderRadius: 12, padding: 13 },
  adviceText: { fontFamily: fonts.inter, fontSize: 13.5, lineHeight: 21 },
  trust: { fontFamily: fonts.inter, fontSize: 11, textAlign: 'center', marginTop: 4, lineHeight: 16 },
});
