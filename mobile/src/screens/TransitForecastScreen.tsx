import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Page } from '../components/Page';
import { GradientText } from '../components/GradientText';
import { SpeakButton } from '../components/SpeakButton';
import { useTheme } from '../theme/ThemeProvider';
import { Theme, fonts } from '../theme/tokens';
import { hTap } from '../lib/haptics';
import { useT, useLang } from '../i18n/LanguageProvider';
import { aSign } from '../i18n/astro';
import { birthFromProfile } from '../lib/birth';
import { getTransitForecast, TransitForecastResponse, TransitYear } from '../lib/api';

const DEFAULT_BIRTH = { dob: '01-01-2000', tob: '06:42', tz: '+05:30', place: 'Jaipur' };
const kindColor = (k?: string) => (k === 'good' ? '#3ec77a' : k === 'caution' ? '#e06a5a' : '#e0a92e');

function YearRow({ y, lang, theme }: { y: TransitYear; lang: 'en' | 'hi'; theme: Theme }) {
  const sat = y.shani; const jup = y.guru;
  const satEvent = lang === 'hi' ? sat.eventHi : sat.event;
  const jupEvent = lang === 'hi' ? jup.eventHi : jup.event;
  const satSign = lang === 'hi' ? sat.signHi : sat.sign;
  const jupSign = lang === 'hi' ? jup.signHi : jup.sign;
  const accent = y.current ? theme.gold1 : theme.cardBorder;
  return (
    <View style={styles.row}>
      <View style={styles.rail}>
        <View style={[styles.node, { borderColor: y.current ? theme.gold1 : theme.gold2, backgroundColor: y.current ? theme.gold1 : 'transparent' }]} />
        <View style={[styles.line, { backgroundColor: theme.cardBorder }]} />
      </View>
      <View style={[styles.card, { borderColor: accent, backgroundColor: y.current ? theme.gold1 + '14' : (theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.85)') }]}>
        <View style={styles.head}>
          <Text style={[styles.year, { color: theme.text }]}>{y.year}</Text>
          {y.current && <View style={[styles.nowPill, { backgroundColor: theme.gold1 }]}><Text style={styles.nowTxt}>{lang === 'hi' ? 'अभी' : 'NOW'}</Text></View>}
        </View>
        <View style={styles.planRow}>
          <Text style={[styles.pl, { color: kindColor(sat.kind) }]}>♄ {lang === 'hi' ? 'शनि' : 'Saturn'}: <Text style={{ color: theme.textSoft }}>{satSign}</Text>{satEvent ? `  · ${satEvent}` : ''}</Text>
        </View>
        <View style={styles.planRow}>
          <Text style={[styles.pl, { color: kindColor(jup.kind) }]}>♃ {lang === 'hi' ? 'गुरु' : 'Jupiter'}: <Text style={{ color: theme.textSoft }}>{jupSign}</Text>{jupEvent ? `  · ${jupEvent}` : ''}</Text>
        </View>
        {!!y.note && <Text style={[styles.note, { color: theme.textSoft }]}>{y.note}</Text>}
      </View>
    </View>
  );
}

export function TransitForecastScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const t = useT();
  const [data, setData] = useState<TransitForecastResponse | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let on = true;
    (async () => {
      const b = await birthFromProfile().catch(() => null);
      try { const r = await getTransitForecast((b || DEFAULT_BIRTH) as any); if (on) setData(r); }
      catch (_) { if (on) setErr(true); }
    })();
    return () => { on = false; };
  }, []);

  return (
    <Page title={t('forecast.title', 'Year Forecast')} onBack={() => { hTap(); navigation.goBack(); }}>
      {!data && !err && <View style={styles.center}><ActivityIndicator color={theme.gold1} /><Text style={[styles.load, { color: theme.textMuted }]}>{lang === 'hi' ? 'साल-दर-साल गोचर गणना हो रही है…' : 'Computing year-by-year transits…'}</Text></View>}
      {err && <Text style={[styles.err, { color: theme.textMuted }]}>{lang === 'hi' ? 'लोड नहीं हो पाया — इंटरनेट जाँचें।' : 'Could not load — check internet.'}</Text>}

      {data && (
        <View style={{ gap: 14 }}>
          <View style={styles.hero}>
            <GradientText style={styles.heroTitle}>{t('forecast.heading', lang === 'hi' ? 'साल-दर-साल गोचर-फल' : 'Year-by-Year Forecast')}</GradientText>
            <Text style={[styles.heroSub, { color: theme.textMuted }]}>{data.fromYear}–{data.toYear}{data.moonSign ? ` · ${lang === 'hi' ? 'चंद्र' : 'Moon'} ${aSign(data.moonSign, lang)}` : ''}</Text>
          </View>

          {!!data.summary && (
            <View style={[styles.card2, { borderColor: theme.gold2 + '55', backgroundColor: theme.isDark ? 'rgba(201,150,46,0.07)' : 'rgba(244,195,74,0.1)' }]}>
              <Text style={[styles.summary, { color: theme.text }]}>{data.summary}</Text>
              <View style={{ marginTop: 10 }}><SpeakButton text={[data.summary, ...(data.years || []).filter((y) => y.note).map((y) => `${y.year}: ${y.note}`)]} /></View>
            </View>
          )}

          <View>
            {(data.years || []).map((y) => <YearRow key={y.year} y={y} lang={lang} theme={theme} />)}
          </View>

          <Text style={[styles.trust, { color: theme.textMuted }]}>🔒 {lang === 'hi' ? 'गणना VedAstro (Lahiri) गोचर + चंद्र-आधारित शनि/गुरु फल।' : 'VedAstro (Lahiri) transits + Moon-based Saturn/Jupiter gochar.'}</Text>
          <View style={{ height: 8 }} />
        </View>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  center: { paddingVertical: 50, alignItems: 'center', gap: 12 },
  load: { fontFamily: fonts.inter, fontSize: 12.5, textAlign: 'center' },
  err: { fontFamily: fonts.inter, fontSize: 13, textAlign: 'center', paddingVertical: 30 },
  hero: { alignItems: 'center', marginTop: 2 },
  heroTitle: { fontFamily: fonts.cinzel, fontSize: 20, letterSpacing: 0.6 },
  heroSub: { fontFamily: fonts.inter, fontSize: 12.5, marginTop: 6 },
  card2: { borderWidth: 1, borderRadius: 16, padding: 15 },
  summary: { fontFamily: fonts.inter, fontSize: 14, lineHeight: 22 },

  row: { flexDirection: 'row', gap: 10 },
  rail: { width: 16, alignItems: 'center' },
  node: { width: 13, height: 13, borderRadius: 7, borderWidth: 2, marginTop: 15 },
  line: { width: 2, flex: 1, marginTop: 2 },
  card: { flex: 1, borderWidth: 1, borderRadius: 13, padding: 12, marginBottom: 11 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  year: { fontFamily: fonts.cinzelXBold, fontSize: 18 },
  nowPill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 },
  nowTxt: { fontFamily: fonts.interBold, fontSize: 10, color: '#1a1200', letterSpacing: 0.5 },
  planRow: { marginTop: 6 },
  pl: { fontFamily: fonts.interSemi, fontSize: 12.5, lineHeight: 18 },
  note: { fontFamily: fonts.inter, fontSize: 12.5, lineHeight: 19, marginTop: 8 },
  trust: { fontFamily: fonts.inter, fontSize: 11, textAlign: 'center', marginTop: 4, lineHeight: 16 },
});
