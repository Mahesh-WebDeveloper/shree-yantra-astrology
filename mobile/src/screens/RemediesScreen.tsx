import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { Page } from '../components/Page';
import { GradientText } from '../components/GradientText';
import { SpeakButton } from '../components/SpeakButton';
import { useTheme } from '../theme/ThemeProvider';
import { Theme, fonts, radii } from '../theme/tokens';
import { hTap } from '../lib/haptics';
import { useT, useLang } from '../i18n/LanguageProvider';
import { aSign, aPlanet } from '../i18n/astro';
import { birthFromProfile } from '../lib/birth';
import { getRemedies, RemediesResponse, DoshaRemedy } from '../lib/api';

const DEFAULT_BIRTH = { lat: 26.9124, lng: 75.7873, dob: '01-01-2000', tob: '06:42', tz: '+05:30', place: 'Jaipur' };

function Chip({ label, value, theme }: { label: string; value?: string; theme: Theme }) {
  if (!value) return null;
  return (
    <View style={[styles.chip, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]}>
      <Text style={[styles.chipLbl, { color: theme.textMuted }]}>{label}</Text>
      <Text style={[styles.chipVal, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

function DoshaCard({ d, lang, theme }: { d: DoshaRemedy; lang: 'en' | 'hi'; theme: Theme }) {
  const col = d.present ? '#e0a92e' : '#3ec77a';
  const name = lang === 'hi' && d.nameHi ? d.nameHi : d.name;
  return (
    <View style={[styles.doshaCard, { borderColor: d.present ? col + '66' : theme.cardBorder, backgroundColor: d.present ? col + '12' : (theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.7)') }]}>
      <View style={styles.doshaHead}>
        <Text style={[styles.doshaName, { color: theme.text }]}>{name}</Text>
        <View style={[styles.statusPill, { backgroundColor: col + '22', borderColor: col + '88' }]}>
          <Text style={[styles.statusTxt, { color: col }]}>{d.present ? (lang === 'hi' ? 'विद्यमान' : 'Present') : (lang === 'hi' ? 'नहीं' : 'Clear')}</Text>
        </View>
      </View>
      {d.present && (
        <>
          {d.remedies.map((r, i) => (
            <Text key={i} style={[styles.remPoint, { color: theme.textSoft }]}>•  {lang === 'hi' && r.titleHi ? r.titleHi : r.title}</Text>
          ))}
          {!!(lang === 'hi' ? d.mantraHi : d.mantra) && (
            <View style={[styles.mantraBox, { borderColor: theme.gold2 + '44', backgroundColor: theme.isDark ? 'rgba(201,150,46,0.08)' : 'rgba(244,195,74,0.10)' }]}>
              <Text style={[styles.mantraText, { color: theme.text }]}>🕉  {lang === 'hi' ? (d.mantraHi || d.mantra) : d.mantra}</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

export function RemediesScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const t = useT();
  const [data, setData] = useState<RemediesResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [showMantras, setShowMantras] = useState(false);

  useEffect(() => {
    let on = true;
    (async () => {
      const birth = (await birthFromProfile()) || DEFAULT_BIRTH;
      try { const r = await getRemedies(birth as any); if (on) setData(r); }
      catch (e: any) { if (on) setErr(e?.message || 'load failed'); }
    })();
    return () => { on = false; };
  }, []);

  const gem = data?.remedies?.lifeGem;
  const ex = data?.explanation;

  return (
    <Page title={t('rem.title', 'Remedies · Upaay')} onBack={() => { hTap(); navigation.goBack(); }}>
      {!data && !err && <View style={styles.center}><ActivityIndicator color={theme.gold1} /><Text style={[styles.loading, { color: theme.textMuted }]}>{lang === 'hi' ? 'आपके उपाय तैयार हो रहे हैं…' : 'Preparing your remedies…'}</Text></View>}
      {err && <Text style={[styles.err, { color: theme.textMuted }]}>{lang === 'hi' ? 'लोड नहीं हो पाया — इंटरनेट जाँचें।' : 'Could not load — check internet.'}</Text>}

      {data && (
        <View style={{ gap: 16 }}>
          <View style={styles.hero}>
            <GradientText style={styles.heroTitle}>{t('rem.heading', lang === 'hi' ? 'आपके उपाय' : 'Your Remedies')}</GradientText>
            <Text style={[styles.heroSub, { color: theme.textMuted }]}>{data.ascendant ? `${lang === 'hi' ? 'लग्न' : 'Ascendant'}: ${aSign(data.ascendant, lang)}` : ''}</Text>
          </View>

          {!!ex?.summary && (
            <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.8)' }]}>
              <Text style={[styles.summary, { color: theme.text }]}>{ex.summary}</Text>
              <View style={{ marginTop: 12 }}>
                <SpeakButton text={[ex.summary, ex.gemWhy || '', ex.scriptureNote || '', ex.advice || '']} />
              </View>
            </View>
          )}

          {/* Life gemstone */}
          {gem && (
            <View style={[styles.gemCard, { borderColor: theme.gold2 + '66', backgroundColor: theme.isDark ? 'rgba(201,150,46,0.08)' : 'rgba(244,195,74,0.10)' }]}>
              <Text style={[styles.gemLabel, { color: theme.gold1 }]}>💎 {lang === 'hi' ? 'आपका भाग्य रत्न' : 'Your Life Gemstone'}</Text>
              <GradientText style={styles.gemName}>{lang === 'hi' && gem.gemstoneHi ? gem.gemstoneHi : gem.gemstone}</GradientText>
              <Text style={[styles.gemPlanet, { color: theme.textMuted }]}>{lang === 'hi' ? 'स्वामी ग्रह' : 'Ruling planet'}: {aPlanet(gem.planet, lang)}</Text>
              <View style={styles.chipRow}>
                <Chip label={lang === 'hi' ? 'धातु' : 'Metal'} value={lang === 'hi' ? gem.metalHi : gem.metal} theme={theme} />
                <Chip label={lang === 'hi' ? 'उंगली' : 'Finger'} value={lang === 'hi' ? gem.fingerHi : gem.finger} theme={theme} />
                <Chip label={lang === 'hi' ? 'दिन' : 'Day'} value={lang === 'hi' ? gem.dayHi : gem.day} theme={theme} />
              </View>
              {!!ex?.gemWhy && <Text style={[styles.gemWhy, { color: theme.textSoft }]}>{ex.gemWhy}</Text>}
              {!!gem.mantra && (
                <View style={[styles.mantraBox, { borderColor: theme.gold2 + '44', backgroundColor: theme.isDark ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.5)' }]}>
                  <Text style={[styles.mantraText, { color: theme.text }]}>🕉  {gem.mantra}</Text>
                </View>
              )}
              <Text style={[styles.gemWarn, { color: theme.textMuted }]}>⚠ {lang === 'hi' ? 'रत्न ज्योतिषी से सलाह के बाद ही धारण करें।' : 'Wear a gemstone only after consulting an astrologer.'}</Text>
            </View>
          )}

          {/* Dosha remedies */}
          {!!(data.remedies?.doshaRemedies || []).length && (
            <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.8)' }]}>
              <Text style={[styles.cardTitle, { color: theme.gold1 }]}>{lang === 'hi' ? 'दोष व उनके उपाय' : 'Doshas & their Remedies'}</Text>
              <View style={{ gap: 11, marginTop: 8 }}>
                {data.remedies.doshaRemedies.map((d) => <DoshaCard key={d.key} d={d} lang={lang} theme={theme} />)}
              </View>
            </View>
          )}

          {/* Navagraha mantras (collapsible) */}
          {!!(data.remedies?.planetMantras || []).length && (
            <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.8)' }]}>
              <Pressable onPress={() => { hTap(); setShowMantras((s) => !s); }} style={styles.collapseHead}>
                <Text style={[styles.cardTitle, { color: theme.gold1 }]}>{lang === 'hi' ? 'नवग्रह बीज मंत्र' : 'Navagraha Beej Mantras'}</Text>
                <Text style={[styles.collapseToggle, { color: theme.gold2 }]}>{showMantras ? (lang === 'hi' ? 'छिपाएँ' : 'Hide') : (lang === 'hi' ? 'देखें' : 'Show')}</Text>
              </Pressable>
              {showMantras && (
                <View style={{ gap: 9, marginTop: 10 }}>
                  {data.remedies.planetMantras.map((m) => (
                    <View key={m.planet} style={[styles.mantraRow, { borderColor: theme.cardBorder }]}>
                      <Text style={[styles.mantraPlanet, { color: theme.gold2 }]}>{aPlanet(m.planet, lang)}{m.count ? `  ·  ${m.count}` : ''}</Text>
                      <Text style={[styles.mantraLine, { color: theme.text }]}>{m.mantra}</Text>
                      {!!(lang === 'hi' ? m.forWhatHi : m.forWhat) && <Text style={[styles.mantraFor, { color: theme.textMuted }]}>{lang === 'hi' ? m.forWhatHi : m.forWhat}</Text>}
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* scripture-grounded note (unique) */}
          {!!ex?.scriptureNote && (
            <View style={[styles.scriptureBox, { borderColor: theme.gold2 + '55', backgroundColor: theme.isDark ? 'rgba(201,150,46,0.07)' : 'rgba(244,195,74,0.1)' }]}>
              <Text style={[styles.scriptureLabel, { color: theme.gold1 }]}>📿 {lang === 'hi' ? 'शास्त्रों से' : 'From the Scriptures'}</Text>
              <Text style={[styles.scriptureText, { color: theme.text }]}>{ex.scriptureNote}</Text>
            </View>
          )}

          {!!ex?.advice && (
            <View style={[styles.adviceBox, { borderColor: theme.gold2 + '55', backgroundColor: theme.isDark ? 'rgba(201,150,46,0.08)' : 'rgba(244,195,74,0.12)' }]}>
              <Text style={[styles.adviceText, { color: theme.text }]}>💛 {ex.advice}</Text>
            </View>
          )}

          <Text style={[styles.trust, { color: theme.textMuted }]}>🔒 {lang === 'hi' ? 'उपाय शास्त्र-आधारित · गणना VedAstro से।' : 'Remedies are scripture-based · calculated via VedAstro.'}</Text>
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

  hero: { alignItems: 'center', marginTop: 2 },
  heroTitle: { fontFamily: fonts.cinzel, fontSize: 21, letterSpacing: 0.8 },
  heroSub: { fontFamily: fonts.inter, fontSize: 12.5, marginTop: 6 },

  card: { borderWidth: 1, borderRadius: 16, padding: 16 },
  cardTitle: { fontFamily: fonts.cinzelSemi, fontSize: 13.5, letterSpacing: 0.8 },
  summary: { fontFamily: fonts.inter, fontSize: 14, lineHeight: 22 },

  gemCard: { borderWidth: 1.5, borderRadius: 18, padding: 18, alignItems: 'center' },
  gemLabel: { fontFamily: fonts.interBold, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' },
  gemName: { fontFamily: fonts.cinzelXBold, fontSize: 26, marginTop: 6, textAlign: 'center' },
  gemPlanet: { fontFamily: fonts.inter, fontSize: 12.5, marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 14 },
  chip: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, alignItems: 'center', minWidth: 80 },
  chipLbl: { fontFamily: fonts.interSemi, fontSize: 9.5, letterSpacing: 1, textTransform: 'uppercase' },
  chipVal: { fontFamily: fonts.inter, fontSize: 13, marginTop: 3 },
  gemWhy: { fontFamily: fonts.inter, fontSize: 13.5, lineHeight: 21, marginTop: 14, textAlign: 'center' },
  gemWarn: { fontFamily: fonts.inter, fontSize: 11, lineHeight: 16, marginTop: 12, textAlign: 'center' },

  doshaCard: { borderWidth: 1, borderRadius: 12, padding: 13 },
  doshaHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  doshaName: { fontFamily: fonts.cinzelSemi, fontSize: 14.5 },
  statusPill: { paddingHorizontal: 11, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  statusTxt: { fontFamily: fonts.interBold, fontSize: 10.5, letterSpacing: 0.4 },
  remPoint: { fontFamily: fonts.inter, fontSize: 13.5, lineHeight: 21, marginTop: 4 },

  mantraBox: { borderWidth: 1, borderRadius: 10, padding: 11, marginTop: 11 },
  mantraText: { fontFamily: fonts.devanagari, fontSize: 15, lineHeight: 24 },

  collapseHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  collapseToggle: { fontFamily: fonts.interSemi, fontSize: 12.5 },
  mantraRow: { borderWidth: 1, borderRadius: 10, padding: 11 },
  mantraPlanet: { fontFamily: fonts.interSemi, fontSize: 12.5, letterSpacing: 0.3 },
  mantraLine: { fontFamily: fonts.devanagari, fontSize: 15, lineHeight: 24, marginTop: 4 },
  mantraFor: { fontFamily: fonts.inter, fontSize: 11.5, marginTop: 4 },

  scriptureBox: { borderWidth: 1, borderRadius: 14, padding: 15 },
  scriptureLabel: { fontFamily: fonts.cinzelSemi, fontSize: 12.5, letterSpacing: 0.6, marginBottom: 7 },
  scriptureText: { fontFamily: fonts.inter, fontSize: 13.5, lineHeight: 22, fontStyle: 'italic' },

  adviceBox: { borderWidth: 1, borderRadius: 12, padding: 13 },
  adviceText: { fontFamily: fonts.inter, fontSize: 13.5, lineHeight: 21 },
  trust: { fontFamily: fonts.inter, fontSize: 11, textAlign: 'center', marginTop: 6, lineHeight: 16 },
});
