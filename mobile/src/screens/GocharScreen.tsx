import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Page } from '../components/Page';
import { GradientText } from '../components/GradientText';
import { SpeakButton } from '../components/SpeakButton';
import { useTheme } from '../theme/ThemeProvider';
import { Theme, fonts, radii } from '../theme/tokens';
import { hTap } from '../lib/haptics';
import { useT, useLang } from '../i18n/LanguageProvider';
import { aSign, aPlanet } from '../i18n/astro';
import { birthFromProfile } from '../lib/birth';
import { getGochar, GocharResponse, TransitPlanet } from '../lib/api';

const DEFAULT_BIRTH = { lat: 26.9124, lng: 75.7873, dob: '01-01-2000', tob: '06:42', tz: '+05:30', place: 'Jaipur' };
const GLYPH: Record<string, string> = { Sun: '☉', Moon: '☽', Mars: '♂', Mercury: '☿', Jupiter: '♃', Venus: '♀', Saturn: '♄', Rahu: '☊', Ketu: '☋' };
const MAJOR = ['Saturn', 'Jupiter', 'Rahu', 'Ketu'];

const houseMeaning = (h: number | null | undefined, lang: 'en' | 'hi') => {
  if (!h) return '';
  return lang === 'hi' ? `चंद्र से ${h}वाँ भाव` : `${h}th house from Moon`;
};

function TransitRow({ t, lang, theme, big }: { t: TransitPlanet; lang: 'en' | 'hi'; theme: Theme; big?: boolean }) {
  const retro = t.isRetrograde === 'True';
  return (
    <View style={[styles.tRow, { borderColor: theme.cardBorder }]}>
      <View style={[styles.glyphWrap, { borderColor: theme.gold2 + '66', backgroundColor: theme.isDark ? 'rgba(201,150,46,0.10)' : 'rgba(244,195,74,0.12)' }]}>
        <Text style={[styles.glyph, { color: theme.gold1 }]}>{GLYPH[t.planet] || '✦'}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.tName, { color: theme.text }]}>
          {aPlanet(t.planet, lang)}
          {retro && <Text style={{ color: '#e0a92e' }}>  ℞ {lang === 'hi' ? 'वक्री' : 'Retro'}</Text>}
        </Text>
        <Text style={[styles.tSign, { color: theme.gold2 }]}>{lang === 'hi' ? `अभी ${aSign(t.sign, lang)} में` : `now in ${aSign(t.sign, lang)}`}</Text>
      </View>
      {!!t.houseFromMoon && (
        <View style={[styles.houseChip, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }]}>
          <Text style={[styles.houseNum, { color: theme.gold1 }]}>{t.houseFromMoon}</Text>
          <Text style={[styles.houseLbl, { color: theme.textMuted }]}>{lang === 'hi' ? 'भाव' : 'house'}</Text>
        </View>
      )}
    </View>
  );
}

export function GocharScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const t = useT();
  const [data, setData] = useState<GocharResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let on = true;
    (async () => {
      const birth = (await birthFromProfile()) || DEFAULT_BIRTH;
      try {
        const r = await getGochar(birth as any);
        if (on) setData(r);
      } catch (e: any) {
        if (on) setErr(e?.message || 'load failed');
      }
    })();
    return () => { on = false; };
  }, []);

  const ss = data?.sadeSati;
  const ssColor = ss?.active ? '#e06a5a' : (ss?.dhaiya ? '#e0a92e' : '#3ec77a');
  const major = (data?.transits || []).filter((x) => MAJOR.includes(x.planet));
  const ex = data?.explanation;
  const exText = (planet: string) => (ex?.highlights || []).find((h) => h.planet === planet)?.text;

  return (
    <Page title={t('gochar.title', 'Gochar · Transits')} onBack={() => { hTap(); navigation.goBack(); }}>
      {!data && !err && <View style={styles.center}><ActivityIndicator color={theme.gold1} /><Text style={[styles.loading, { color: theme.textMuted }]}>{lang === 'hi' ? 'ग्रहों की स्थिति लाई जा रही है…' : 'Fetching live planet positions…'}</Text></View>}
      {err && <Text style={[styles.err, { color: theme.textMuted }]}>{lang === 'hi' ? 'लोड नहीं हो पाया — इंटरनेट जाँचें।' : 'Could not load — check internet.'}</Text>}

      {data && (
        <View style={{ gap: 16 }}>
          {/* header */}
          <View style={styles.hero}>
            <GradientText style={styles.heroTitle}>{t('gochar.heading', lang === 'hi' ? 'आज का गोचर' : "Today's Transits")}</GradientText>
            <Text style={[styles.heroSub, { color: theme.textMuted }]}>
              {data.date}{data.natalMoonSign ? ` · ${lang === 'hi' ? 'चंद्र राशि' : 'Moon'}: ${aSign(data.natalMoonSign, lang)}` : ''}
            </Text>
          </View>

          {/* Sade Sati */}
          <View style={[styles.ssCard, { borderColor: ssColor + '77', backgroundColor: ssColor + '14' }]}>
            <Text style={[styles.ssLabel, { color: ssColor }]}>{lang === 'hi' ? 'शनि साढ़े साती' : 'Shani Sade Sati'}</Text>
            <Text style={[styles.ssStatus, { color: theme.text }]}>
              {ss?.active ? (lang === 'hi' ? `सक्रिय — ${ss.phaseHi || ss.phase}` : `Active — ${ss.phase}`)
                : ss?.dhaiya ? (lang === 'hi' ? (ss.phaseHi || 'ढैय्या (छोटी पनौती)') : (ss.phase || 'Dhaiya (Small Panoti)'))
                  : (lang === 'hi' ? 'अभी साढ़े साती नहीं — शनि अनुकूल' : 'No Sade Sati right now — Saturn is clear')}
            </Text>
          </View>

          {/* AI summary */}
          {!!ex?.summary && (
            <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.8)' }]}>
              <View style={styles.cardHeadRow}>
                <Text style={[styles.cardTitle, { color: theme.gold1 }]}>{lang === 'hi' ? 'अभी आपके लिए' : 'For you right now'}</Text>
                <SpeakButton text={[ex.summary, ...(ex.highlights || []).map((h) => h.text), ex.advice || '']} />
              </View>
              <Text style={[styles.summary, { color: theme.text }]}>{ex.summary}</Text>
            </View>
          )}

          {/* major transits */}
          {!!major.length && (
            <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.8)' }]}>
              <Text style={[styles.cardTitle, { color: theme.gold1 }]}>{lang === 'hi' ? 'मुख्य गोचर' : 'Major Transits'}</Text>
              <View style={{ gap: 12, marginTop: 6 }}>
                {major.map((tp) => (
                  <View key={tp.planet}>
                    <TransitRow t={tp} lang={lang} theme={theme} big />
                    {!!exText(tp.planet) && <Text style={[styles.majorNote, { color: theme.textSoft }]}>{exText(tp.planet)}</Text>}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* all planets now */}
          <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.8)' }]}>
            <Text style={[styles.cardTitle, { color: theme.gold1 }]}>{lang === 'hi' ? 'सभी ग्रह अभी' : 'All Planets Now'}</Text>
            <Text style={[styles.cardHint, { color: theme.textMuted }]}>{lang === 'hi' ? 'भाव = आपकी चंद्र राशि से गिनती' : 'house = counted from your Moon sign'}</Text>
            <View style={{ gap: 8, marginTop: 8 }}>
              {(data.transits || []).map((tp) => <TransitRow key={tp.planet} t={tp} lang={lang} theme={theme} />)}
            </View>
          </View>

          {/* advice */}
          {!!ex?.advice && (
            <View style={[styles.adviceBox, { borderColor: theme.gold2 + '55', backgroundColor: theme.isDark ? 'rgba(201,150,46,0.08)' : 'rgba(244,195,74,0.12)' }]}>
              <Text style={[styles.adviceText, { color: theme.text }]}>💛 {ex.advice}</Text>
            </View>
          )}

          <Text style={[styles.trust, { color: theme.textMuted }]}>🔒 {lang === 'hi' ? 'गणना वास्तविक ग्रह-स्थितियों (Lahiri अयनांश) · चंद्र-गोचर विधि।' : 'Calculated from real planetary positions (Lahiri ayanamsa) · Moon-based gochar.'}</Text>
          <View style={{ height: 8 }} />
        </View>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  center: { paddingVertical: 50, alignItems: 'center', gap: 12 },
  loading: { fontFamily: fonts.inter, fontSize: 12.5 },
  err: { fontFamily: fonts.inter, fontSize: 13, textAlign: 'center', paddingVertical: 30 },

  hero: { alignItems: 'center', marginBottom: 2, marginTop: 2 },
  heroTitle: { fontFamily: fonts.cinzel, fontSize: 21, letterSpacing: 0.8 },
  heroSub: { fontFamily: fonts.inter, fontSize: 12.5, marginTop: 6 },

  ssCard: { borderWidth: 1.5, borderRadius: 16, padding: 16, alignItems: 'center' },
  ssLabel: { fontFamily: fonts.interBold, fontSize: 11.5, letterSpacing: 1.5, textTransform: 'uppercase' },
  ssStatus: { fontFamily: fonts.cinzelSemi, fontSize: 16, marginTop: 6, textAlign: 'center' },

  card: { borderWidth: 1, borderRadius: 16, padding: 16 },
  cardHeadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  cardTitle: { fontFamily: fonts.cinzelSemi, fontSize: 13.5, letterSpacing: 0.8 },
  cardHint: { fontFamily: fonts.inter, fontSize: 11, marginTop: 3 },
  summary: { fontFamily: fonts.inter, fontSize: 14, lineHeight: 22, marginTop: 8 },

  tRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 12, padding: 11 },
  glyphWrap: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  glyph: { fontFamily: fonts.inter, fontSize: 19 },
  tName: { fontFamily: fonts.interSemi, fontSize: 14.5 },
  tSign: { fontFamily: fonts.inter, fontSize: 12.5, marginTop: 2 },
  houseChip: { width: 42, height: 42, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  houseNum: { fontFamily: fonts.cinzelXBold, fontSize: 17 },
  houseLbl: { fontFamily: fonts.inter, fontSize: 8.5, marginTop: -1 },
  majorNote: { fontFamily: fonts.inter, fontSize: 13, lineHeight: 20, marginTop: 7, paddingHorizontal: 4 },

  adviceBox: { borderWidth: 1, borderRadius: 12, padding: 13 },
  adviceText: { fontFamily: fonts.inter, fontSize: 13.5, lineHeight: 21 },
  trust: { fontFamily: fonts.inter, fontSize: 11, textAlign: 'center', marginTop: 6, lineHeight: 16 },
});
