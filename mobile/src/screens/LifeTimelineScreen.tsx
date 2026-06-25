import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { Page } from '../components/Page';
import { GradientText } from '../components/GradientText';
import { useTheme } from '../theme/ThemeProvider';
import { Theme, fonts } from '../theme/tokens';
import { hTap } from '../lib/haptics';
import { useT, useLang } from '../i18n/LanguageProvider';
import { aPlanet } from '../i18n/astro';
import { birthFromProfile } from '../lib/birth';
import { getLifeTimeline, LifeTimelineResponse, DashaPeriod } from '../lib/api';

const DEFAULT_BIRTH = { dob: '01-01-2000', tob: '06:42', tz: '+05:30', place: 'Jaipur' };
const GLYPH: Record<string, string> = { Sun: '☉', Moon: '☽', Mars: '♂', Mercury: '☿', Jupiter: '♃', Venus: '♀', Saturn: '♄', Rahu: '☊', Ketu: '☋' };
const DIGNITY: Record<string, { en: string; hi: string }> = {
  exalted: { en: 'exalted', hi: 'उच्च' }, own: { en: 'own sign', hi: 'स्वगृही' },
  debilitated: { en: 'debilitated', hi: 'नीच' }, neutral: { en: 'neutral', hi: 'सम' },
};
const natureColor = (n?: string) => (n === 'favorable' ? '#3ec77a' : n === 'challenging' ? '#e06a5a' : '#e0a92e');
const natureLabel = (n: string | undefined, lang: 'en' | 'hi') =>
  lang === 'hi' ? (n === 'favorable' ? 'अनुकूल' : n === 'challenging' ? 'चुनौतीपूर्ण' : 'मिश्रित')
    : (n === 'favorable' ? 'Favorable' : n === 'challenging' ? 'Challenging' : 'Mixed');

function PeriodCard({ p, lang, theme }: { p: DashaPeriod; lang: 'en' | 'hi'; theme: Theme }) {
  const [open, setOpen] = useState(false);
  const col = natureColor(p.nature);
  const planet = aPlanet(p.lord, lang);
  const dig = p.dignity ? (lang === 'hi' ? DIGNITY[p.dignity]?.hi : DIGNITY[p.dignity]?.en) : '';
  const why = p.house
    ? (lang === 'hi' ? `${p.house}वें भाव में (${dig})` : `in house ${p.house} (${dig})`)
    : '';
  return (
    <View style={styles.row}>
      {/* timeline rail */}
      <View style={styles.rail}>
        <View style={[styles.node, { borderColor: col, backgroundColor: p.current ? col : 'transparent' }]} />
        <View style={[styles.line, { backgroundColor: theme.cardBorder }]} />
      </View>
      <View style={[styles.card, {
        borderColor: p.current ? col : theme.cardBorder,
        backgroundColor: p.current ? col + '14' : (theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.85)'),
        opacity: p.past ? 0.7 : 1,
      }]}>
        <View style={styles.head}>
          <Text style={[styles.glyph, { color: col }]}>{GLYPH[p.lord] || '✦'}</Text>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.lord, { color: theme.text }]}>{planet} {lang === 'hi' ? 'महादशा' : 'Mahadasha'}</Text>
            <Text style={[styles.age, { color: theme.gold2 }]}>
              {lang === 'hi' ? 'आयु' : 'Age'} {Math.round(p.fromAge)}–{Math.round(p.toAge)}  ·  {p.fromYear}–{p.toYear}  ·  {Math.round(p.years)}{lang === 'hi' ? ' वर्ष' : ' yr'}
            </Text>
          </View>
          {p.current && <View style={[styles.nowPill, { backgroundColor: col }]}><Text style={styles.nowTxt}>{lang === 'hi' ? 'अभी' : 'NOW'}</Text></View>}
        </View>
        {!!why && <Text style={[styles.why, { color: col }]}>{lang === 'hi' ? 'कारण: ' : 'Why: '}{planet} {why} · {natureLabel(p.nature, lang)}</Text>}
        {!!p.phala?.effect && <Text style={[styles.body, { color: theme.textSoft }]}>{p.phala.effect}</Text>}
        {!!p.phala?.good && <Text style={[styles.line2, { color: '#3ec77a' }]}>✓ {p.phala.good}</Text>}
        {!!p.phala?.caution && <Text style={[styles.line2, { color: '#e0a92e' }]}>⚠ {p.phala.caution}</Text>}
        {!!p.phala?.remedy && <Text style={[styles.line2, { color: theme.gold1 }]}>🕉 {p.phala.remedy}</Text>}

        {/* Antardasha (sub-periods) */}
        {!!(p.antardashas && p.antardashas.length) && (
          <View style={{ marginTop: 10 }}>
            <Pressable onPress={() => { hTap(); setOpen((s) => !s); }} style={[styles.antToggle, { borderColor: theme.cardBorder }]}>
              <Text style={[styles.antToggleTxt, { color: theme.gold2 }]}>
                {open ? (lang === 'hi' ? 'अंतर्दशा छिपाएँ ▲' : 'Hide Antardasha ▲') : (lang === 'hi' ? `अंतर्दशा देखें (${p.antardashas!.length}) ▾` : `Show Antardasha (${p.antardashas!.length}) ▾`)}
              </Text>
            </Pressable>
            {open && (
              <View style={{ marginTop: 8, gap: 5 }}>
                {p.antardashas!.map((a, i) => (
                  <View key={i} style={[styles.antRow, a.current && { backgroundColor: col + '18', borderRadius: 6 }]}>
                    <Text style={[styles.antLord, { color: a.current ? col : theme.text }]}>{aPlanet(a.lord, lang)}{a.current ? (lang === 'hi' ? ' • अभी' : ' • now') : ''}</Text>
                    <Text style={[styles.antAge, { color: theme.textMuted }]}>{lang === 'hi' ? 'आयु' : 'age'} {Math.round(a.fromAge)}–{Math.round(a.toAge)} · {a.fromYear}–{a.toYear}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

export function LifeTimelineScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const t = useT();
  const [data, setData] = useState<LifeTimelineResponse | null>(null);
  const [err, setErr] = useState(false);
  const [showPast, setShowPast] = useState(false);

  useEffect(() => {
    let on = true;
    (async () => {
      const b = await birthFromProfile().catch(() => null);
      try { const r = await getLifeTimeline((b || DEFAULT_BIRTH) as any); if (on) setData(r); }
      catch (_) { if (on) setErr(true); }
    })();
    return () => { on = false; };
  }, []);

  const periods = data?.periods || [];
  const visible = showPast ? periods : periods.filter((p) => !p.past);
  const pastCount = periods.filter((p) => p.past).length;

  return (
    <Page title={t('timeline.title', 'Life Timeline')} onBack={() => { hTap(); navigation.goBack(); }}>
      {!data && !err && <View style={styles.center}><ActivityIndicator color={theme.gold1} /><Text style={[styles.load, { color: theme.textMuted }]}>{lang === 'hi' ? 'दशा-काल गणना हो रही है…' : 'Computing your dasha periods…'}</Text></View>}
      {err && <Text style={[styles.err, { color: theme.textMuted }]}>{lang === 'hi' ? 'लोड नहीं हो पाया — इंटरनेट जाँचें।' : 'Could not load — check internet.'}</Text>}

      {data && (
        <View style={{ gap: 14 }}>
          <View style={styles.hero}>
            <GradientText style={styles.heroTitle}>{t('timeline.heading', lang === 'hi' ? 'जीवन दशा-काल' : 'Vimshottari Dasha')}</GradientText>
            <Text style={[styles.heroSub, { color: theme.textMuted }]}>{lang === 'hi' ? 'वर्तमान आयु' : 'Current age'} ~{data.currentAge}</Text>
          </View>

          {/* balance at birth — exactly the "X consumed, Y remaining" the user wanted */}
          <View style={[styles.balCard, { borderColor: theme.gold2 + '55', backgroundColor: theme.isDark ? 'rgba(201,150,46,0.07)' : 'rgba(244,195,74,0.1)' }]}>
            <Text style={[styles.balTitle, { color: theme.gold1 }]}>{lang === 'hi' ? 'जन्म के समय दशा-शेष' : 'Dasha Balance at Birth'}</Text>
            <Text style={[styles.balBody, { color: theme.text }]}>
              {lang === 'hi'
                ? `जन्म ${aPlanet(data.balance.lord, lang)} महादशा (${data.balance.totalYears} वर्ष) में हुआ — ${data.balance.bhuktaYears} वर्ष जन्म से पहले बीत चुके (भुक्त), ${data.balance.bhogyaYears} वर्ष जन्म के बाद शेष (भोग्य)।`
                : `Born in ${aPlanet(data.balance.lord, lang)} Mahadasha (${data.balance.totalYears} yr) — ${data.balance.bhuktaYears} yr elapsed before birth (Bhukta), ${data.balance.bhogyaYears} yr remained after birth (Bhogya).`}
            </Text>
          </View>

          {pastCount > 0 && (
            <Pressable onPress={() => { hTap(); setShowPast((s) => !s); }} style={[styles.toggle, { borderColor: theme.cardBorder }]}>
              <Text style={[styles.toggleTxt, { color: theme.gold2 }]}>{showPast ? (lang === 'hi' ? 'बीते काल छिपाएँ' : 'Hide past periods') : (lang === 'hi' ? `बीते ${pastCount} काल दिखाएँ` : `Show ${pastCount} past periods`)}</Text>
            </Pressable>
          )}

          <View>
            {visible.map((p, i) => <PeriodCard key={`${p.lord}-${p.fromAge}-${i}`} p={p} lang={lang} theme={theme} />)}
          </View>

          <Text style={[styles.trust, { color: theme.textMuted }]}>🔒 {lang === 'hi' ? 'गणना वास्तविक ग्रह-स्थितियों (Lahiri) + शास्त्रीय विंशोत्तरी दशा — हर काल का फल ग्रह की वास्तविक स्थिति पर आधारित।' : 'Real planetary positions (Lahiri) + classical Vimshottari — each period reasoned from the planet\'s real placement.'}</Text>
          <View style={{ height: 8 }} />
        </View>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  center: { paddingVertical: 50, alignItems: 'center', gap: 12 },
  load: { fontFamily: fonts.inter, fontSize: 12.5 },
  err: { fontFamily: fonts.inter, fontSize: 13, textAlign: 'center', paddingVertical: 30 },
  hero: { alignItems: 'center', marginTop: 2 },
  heroTitle: { fontFamily: fonts.cinzel, fontSize: 21, letterSpacing: 0.8 },
  heroSub: { fontFamily: fonts.inter, fontSize: 12.5, marginTop: 6 },

  balCard: { borderWidth: 1, borderRadius: 16, padding: 15 },
  balTitle: { fontFamily: fonts.cinzelSemi, fontSize: 13, letterSpacing: 0.5, marginBottom: 6 },
  balBody: { fontFamily: fonts.inter, fontSize: 13.5, lineHeight: 21 },

  toggle: { borderWidth: 1, borderRadius: 999, paddingVertical: 8, alignItems: 'center' },
  toggleTxt: { fontFamily: fonts.interSemi, fontSize: 12.5 },

  row: { flexDirection: 'row', gap: 10 },
  rail: { width: 16, alignItems: 'center' },
  node: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, marginTop: 16 },
  line: { width: 2, flex: 1, marginTop: 2 },
  card: { flex: 1, borderWidth: 1, borderRadius: 14, padding: 13, marginBottom: 12 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  glyph: { fontFamily: fonts.inter, fontSize: 22 },
  lord: { fontFamily: fonts.cinzelSemi, fontSize: 15 },
  age: { fontFamily: fonts.interSemi, fontSize: 11.5, marginTop: 2 },
  nowPill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 },
  nowTxt: { fontFamily: fonts.interBold, fontSize: 10, color: '#1a1200', letterSpacing: 0.5 },
  why: { fontFamily: fonts.interSemi, fontSize: 12, lineHeight: 18, marginTop: 9 },
  body: { fontFamily: fonts.inter, fontSize: 13.5, lineHeight: 21, marginTop: 7 },
  line2: { fontFamily: fonts.inter, fontSize: 12.5, lineHeight: 19, marginTop: 5 },
  antToggle: { borderWidth: 1, borderRadius: 999, paddingVertical: 6, alignItems: 'center' },
  antToggleTxt: { fontFamily: fonts.interSemi, fontSize: 11.5 },
  antRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 6 },
  antLord: { fontFamily: fonts.interSemi, fontSize: 12.5 },
  antAge: { fontFamily: fonts.inter, fontSize: 11 },
  trust: { fontFamily: fonts.inter, fontSize: 11, textAlign: 'center', marginTop: 4, lineHeight: 16 },
});
