import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Theme, fonts, radii } from '../theme/tokens';
import { useLang } from '../i18n/LanguageProvider';
import { birthFromProfile } from '../lib/birth';
import { getPeriodPrediction, PeriodPrediction, PredPeriod } from '../lib/api';
import { SpeakButton } from './SpeakButton';

const DEFAULT_BIRTH = { dob: '01-01-2000', tob: '06:42', tz: '+05:30', place: 'Jaipur' };
const AREA_HI: Record<string, string> = { Love: 'प्रेम', Career: 'करियर', Finance: 'धन', Health: 'स्वास्थ्य' };
const barColor = (s: number) => (s >= 70 ? '#3ec77a' : s >= 50 ? '#e0a92e' : '#e06a5a');

function AreaCard({ a, theme, lang }: { a: PeriodPrediction['areas'][0]; theme: Theme; lang: 'en' | 'hi' }) {
  const col = barColor(a.score);
  return (
    <View style={[styles.area, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.85)' }]}>
      <View style={styles.areaHead}>
        <Text style={[styles.areaTitle, { color: theme.text }]}>{lang === 'hi' ? (AREA_HI[a.title] || a.title) : a.title}</Text>
        <Text style={[styles.areaScore, { color: col }]}>{a.score}%</Text>
      </View>
      <View style={[styles.barTrack, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }]}>
        <View style={[styles.barFill, { width: `${Math.max(6, a.score)}%`, backgroundColor: col }]} />
      </View>
      <Text style={[styles.areaText, { color: theme.textSoft }]}>{a.text}</Text>
      {!!a.action && <Text style={[styles.areaAction, { color: theme.gold1 }]}>→ {a.action}</Text>}
    </View>
  );
}

export function PeriodForecast({ period }: { period: PredPeriod }) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const [data, setData] = useState<PeriodPrediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let on = true;
    setLoading(true); setErr(false); setData(null);
    (async () => {
      const b = await birthFromProfile().catch(() => null);
      const birth = b || DEFAULT_BIRTH;
      try {
        const r = await getPeriodPrediction({ ...(birth as any), name: (b as any)?.name }, period);
        if (on) setData(r);
      } catch (_) {
        if (on) setErr(true);
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => { on = false; };
  }, [period]);

  const pLabel = period === 'year' ? (lang === 'hi' ? 'इस वर्ष' : 'this year') : period === 'month' ? (lang === 'hi' ? 'इस महीने' : 'this month') : (lang === 'hi' ? 'इस सप्ताह' : 'this week');

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.gold1} />
        <Text style={[styles.loadTxt, { color: theme.textMuted }]}>{lang === 'hi' ? `${pLabel} का राशिफल तैयार हो रहा है…` : `Preparing your ${period}ly forecast…`}</Text>
      </View>
    );
  }
  if (err || !data) {
    return <Text style={[styles.err, { color: theme.textMuted }]}>{lang === 'hi' ? 'लोड नहीं हो पाया — इंटरनेट जाँचें।' : 'Could not load — check internet.'}</Text>;
  }

  const areas = data.areas || [];
  const phases = data.phases || [];
  const highlights = data.highlights || [];
  const bestDays = data.bestDays || [];
  const majorDates = data.majorDates || [];
  const remedies = data.remedies || [];
  const speakText = [
    data.headline, data.overall,
    ...areas.map((a) => `${a.title}. ${a.text}`),
    ...highlights.map((h) => `${h.label}. ${h.text}`),
    data.advice || '',
  ].filter((x): x is string => !!x);

  return (
    <View style={{ gap: 14 }}>
      {/* overall */}
      <View style={[styles.card, { borderColor: theme.gold2 + '55', backgroundColor: theme.isDark ? 'rgba(201,150,46,0.07)' : 'rgba(244,195,74,0.1)' }]}>
        {!!data.headline && <Text style={[styles.headline, { color: theme.goldText }]}>{data.headline}</Text>}
        {!!data.overall && <Text style={[styles.overall, { color: theme.text }]}>{data.overall}</Text>}
        <View style={{ marginTop: 12 }}><SpeakButton text={speakText} /></View>
      </View>

      {/* areas */}
      {!!areas.length && (
        <View style={{ gap: 9 }}>
          {areas.map((a) => <AreaCard key={a.title} a={a} theme={theme} lang={lang} />)}
        </View>
      )}

      {/* phases (month / year) */}
      {!!phases.length && (
        <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.85)' }]}>
          <Text style={[styles.h, { color: theme.gold1 }]}>{lang === 'hi' ? 'अवधि-वार' : 'Phase by phase'}</Text>
          {phases.map((p, i) => (
            <View key={i} style={[styles.phase, { borderTopColor: theme.line }]}>
              <Text style={[styles.phaseTitle, { color: theme.gold2 }]}>{p.title}</Text>
              <Text style={[styles.phaseText, { color: theme.textSoft }]}>{p.text}</Text>
            </View>
          ))}
        </View>
      )}

      {/* highlights */}
      {!!highlights.length && (
        <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.85)' }]}>
          <Text style={[styles.h, { color: theme.gold1 }]}>{lang === 'hi' ? 'मुख्य बातें' : 'Highlights'}</Text>
          {highlights.map((hl, i) => (
            <View key={i} style={styles.hlRow}>
              <Text style={[styles.hlLabel, { color: theme.gold2 }]}>{hl.label}</Text>
              <Text style={[styles.hlText, { color: theme.textSoft }]}>{hl.text}</Text>
            </View>
          ))}
        </View>
      )}

      {/* best days / major dates */}
      {!!(bestDays.length || majorDates.length) && (
        <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.85)' }]}>
          <Text style={[styles.h, { color: theme.gold1 }]}>{lang === 'hi' ? 'शुभ दिन / तिथियाँ' : 'Good Days / Key Dates'}</Text>
          {[...bestDays, ...majorDates].map((d, i) => (
            <Text key={i} style={[styles.dateLine, { color: theme.textSoft }]}>•  {d}</Text>
          ))}
        </View>
      )}

      {/* remedies */}
      {!!remedies.length && (
        <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.85)' }]}>
          <Text style={[styles.h, { color: theme.gold1 }]}>{lang === 'hi' ? 'उपाय' : 'Remedies'}</Text>
          {remedies.map((r, i) => (
            <View key={i} style={styles.remedy}>
              <Text style={[styles.remedyTitle, { color: theme.text }]}>• {r.title}</Text>
              {!!r.body && <Text style={[styles.remedyBody, { color: theme.textMuted }]}>{r.body}</Text>}
            </View>
          ))}
        </View>
      )}

      {!!data.advice && (
        <View style={[styles.adviceBox, { borderColor: theme.gold2 + '55', backgroundColor: theme.isDark ? 'rgba(201,150,46,0.08)' : 'rgba(244,195,74,0.12)' }]}>
          <Text style={[styles.adviceText, { color: theme.text }]}>💛 {data.advice}</Text>
        </View>
      )}

      <Text style={[styles.trust, { color: theme.textMuted }]}>🔒 {lang === 'hi' ? 'आपकी जन्म कुंडली, दशा व गोचर पर आधारित।' : 'Based on your birth chart, dasha & transits.'}</Text>
      <View style={{ height: 8 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { paddingVertical: 50, alignItems: 'center', gap: 12 },
  loadTxt: { fontFamily: fonts.inter, fontSize: 12.5, textAlign: 'center' },
  err: { fontFamily: fonts.inter, fontSize: 13, textAlign: 'center', paddingVertical: 30 },

  card: { borderWidth: 1, borderRadius: 16, padding: 16 },
  h: { fontFamily: fonts.cinzelSemi, fontSize: 13.5, letterSpacing: 0.6, marginBottom: 4 },
  headline: { fontFamily: fonts.playfairBold, fontSize: 18, lineHeight: 24 },
  overall: { fontFamily: fonts.inter, fontSize: 14, lineHeight: 22, marginTop: 8 },

  area: { borderWidth: 1, borderRadius: 12, padding: 13 },
  areaHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  areaTitle: { fontFamily: fonts.cinzelSemi, fontSize: 14.5 },
  areaScore: { fontFamily: fonts.interBold, fontSize: 14 },
  barTrack: { height: 7, borderRadius: 4, marginTop: 8, overflow: 'hidden' },
  barFill: { height: 7, borderRadius: 4 },
  areaText: { fontFamily: fonts.inter, fontSize: 13.5, lineHeight: 21, marginTop: 9 },
  areaAction: { fontFamily: fonts.interSemi, fontSize: 12.5, marginTop: 7 },

  phase: { borderTopWidth: 1, paddingTop: 10, marginTop: 10 },
  phaseTitle: { fontFamily: fonts.interBold, fontSize: 13 },
  phaseText: { fontFamily: fonts.inter, fontSize: 13, lineHeight: 20, marginTop: 4 },

  hlRow: { marginTop: 9 },
  hlLabel: { fontFamily: fonts.interSemi, fontSize: 12.5 },
  hlText: { fontFamily: fonts.inter, fontSize: 13, lineHeight: 19, marginTop: 2 },

  dateLine: { fontFamily: fonts.inter, fontSize: 13, lineHeight: 21, marginTop: 3 },

  remedy: { marginTop: 9 },
  remedyTitle: { fontFamily: fonts.interSemi, fontSize: 13.5 },
  remedyBody: { fontFamily: fonts.inter, fontSize: 12.5, lineHeight: 18, marginTop: 3, marginLeft: 12 },

  adviceBox: { borderWidth: 1, borderRadius: 12, padding: 13 },
  adviceText: { fontFamily: fonts.inter, fontSize: 13.5, lineHeight: 21 },
  trust: { fontFamily: fonts.inter, fontSize: 11, textAlign: 'center', marginTop: 4, lineHeight: 16 },
});
