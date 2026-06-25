import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Page } from '../components/Page';
import { GradientText } from '../components/GradientText';
import { GoldButton } from '../components/GoldButton';
import { TextField } from '../components/TextField';
import { BirthPlaceField } from '../components/BirthPlaceField';
import { GoldDatePicker } from '../components/GoldDatePicker';
import { GoldTimePicker } from '../components/GoldTimePicker';
import { UserLine, CalendarIcon, ClockIcon } from '../components/icons/ProfileIcons';
import { useTheme } from '../theme/ThemeProvider';
import { Theme, fonts, radii } from '../theme/tokens';
import { hTap, hSelect, hSuccess, hError } from '../lib/haptics';
import { useT, useLang } from '../i18n/LanguageProvider';
import { aSign } from '../i18n/astro';
import { useDialog } from '../components/DialogProvider';
import { getVedicReading, getNameSuggestions, getKundli, getLifeTimeline, getRemedies, getGochar, getVargaCharts, getTransitForecast, VedicReadingResponse, NameSuggestionsResponse, KundliResponse, LifeTimelineResponse, RemediesResponse, GocharResponse, VargaResponse, TransitForecastResponse, LocationSuggestion, resolveLocation } from '../lib/api';
import { buildJanamPatriHtml } from '../lib/janamPatriPdf';
import { VedicChart, ChartStyle } from '../components/VedicChart';

const pad = (n: number) => (n < 10 ? '0' : '') + n;
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtDob = (d: Date) => `${pad(d.getDate())} ${MON[d.getMonth()]} ${d.getFullYear()}`;
const toDDMM = (d: Date) => `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
const to24h = (t: string) => { const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i); if (!m) return t; let h = Number(m[1]); const ap = (m[3] || '').toUpperCase(); if (ap === 'PM' && h < 12) h += 12; if (ap === 'AM' && h === 12) h = 0; return `${pad(h)}:${m[2]}`; };
const GENDERS = ['Male', 'Female'] as const;
const CHART_STYLES: ChartStyle[] = ['north', 'south', 'east'];

function chartStyleLabel(style: ChartStyle, lang: 'en' | 'hi') {
  if (lang === 'hi') return style === 'north' ? 'उत्तर भारतीय' : style === 'south' ? 'दक्षिण भारतीय' : 'पूर्व भारतीय';
  return style === 'north' ? 'North Indian' : style === 'south' ? 'South Indian' : 'East Indian';
}

function PickerRow({ icon, label, value, onPress, theme }: any) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.pf, { backgroundColor: theme.isDark ? 'rgba(0,0,0,0.55)' : '#fffdf7', borderColor: pressed ? theme.gold1 : theme.cardBorder }]}>
      <View style={styles.pfIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.pfLabel, { color: theme.goldText }]}>{label}</Text>
        <Text style={[styles.pfValue, { color: value ? theme.text : theme.textMuted }]}>{value || '—'}</Text>
      </View>
    </Pressable>
  );
}
function Chip({ label, value, theme }: any) {
  if (!value) return null;
  return (<View style={[styles.chip, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }]}>
    <Text style={[styles.chipLbl, { color: theme.textMuted }]}>{label}</Text><Text style={[styles.chipVal, { color: theme.text }]}>{value}</Text></View>);
}

function ChartStyleSelector({ value, onChange, theme, lang }: { value: ChartStyle; onChange: (s: ChartStyle) => void; theme: Theme; lang: 'en' | 'hi' }) {
  return (
    <View style={styles.styleBlock}>
      <Text style={[styles.styleLabel, { color: theme.goldText }]}>{lang === 'hi' ? 'कुंडली चार्ट शैली' : 'KUNDLI CHART STYLE'}</Text>
      <View style={styles.styleRow}>
        {CHART_STYLES.map((style) => {
          const on = value === style;
          const label = chartStyleLabel(style, lang).replace(lang === 'hi' ? ' भारतीय' : ' Indian', '');
          return (
            <Pressable key={style} onPress={() => { hSelect(); onChange(style); }} style={{ flex: 1 }}>
              <View style={[styles.stylePill, on ? { backgroundColor: theme.gold1 } : { borderWidth: 1, borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : '#fffdf7' }]}>
                <Text style={[styles.styleTxt, { color: on ? theme.buttonInk : theme.gold2 }]} numberOfLines={1}>{label}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      <Text style={[styles.styleHint, { color: theme.textMuted }]}>
        {lang === 'hi' ? 'यही शैली स्क्रीन और PDF दोनों में इस्तेमाल होगी।' : 'This style will be used on screen and in the PDF.'}
      </Text>
    </View>
  );
}

function ReportScopeChips({ theme, lang }: { theme: Theme; lang: 'en' | 'hi' }) {
  const items = lang === 'hi'
    ? ['मुख्य कुंडली', 'D9 नवांश', '16 वर्ग', 'दशा-काल', 'गोचर', 'साल-दर-साल', 'उपाय', 'फलादेश', 'नामकरण']
    : ['Main chart', 'D9 Navamsa', '16 Varga', 'Dasha', 'Gochar', 'Year forecast', 'Remedies', 'Reading', 'Names'];
  return (
    <View style={styles.scopeBlock}>
      <Text style={[styles.styleLabel, { color: theme.goldText }]}>{lang === 'hi' ? 'रिपोर्ट में शामिल' : 'REPORT INCLUDES'}</Text>
      <View style={styles.scopeRow}>
        {items.map((item) => (
          <View key={item} style={[styles.scopeChip, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.035)' : '#fffaf0' }]}>
            <Text style={[styles.scopeTxt, { color: theme.textSoft }]} numberOfLines={1}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function JanamPatriScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const t = useT();
  const dialog = useDialog();
  const [name, setName] = useState('');
  const [gender, setGender] = useState<typeof GENDERS[number]>('Male');
  const [dob, setDob] = useState<Date | null>(null);
  const [tob, setTob] = useState('');
  const [place, setPlace] = useState('');
  const [birthLocation, setBirthLocation] = useState<LocationSuggestion | null>(null);
  const [candidate, setCandidate] = useState('');
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [chartStyle, setChartStyle] = useState<ChartStyle>('north');
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [kundli, setKundli] = useState<KundliResponse | null>(null);
  const [reading, setReading] = useState<VedicReadingResponse | null>(null);
  const [names, setNames] = useState<NameSuggestionsResponse | null>(null);
  const [timeline, setTimeline] = useState<LifeTimelineResponse | null>(null);
  const [remedies, setRemedies] = useState<RemediesResponse | null>(null);
  const [gochar, setGochar] = useState<GocharResponse | null>(null);
  const [varga, setVarga] = useState<VargaResponse | null>(null);
  const [transitForecast, setTransitForecast] = useState<TransitForecastResponse | null>(null);

  const L = (o?: { en: string; hi: string } | null) => (o ? (lang === 'hi' ? o.hi : o.en) : '');

  const generate = async () => {
    if (!dob || !tob.trim() || !place.trim()) { hError(); dialog(lang === 'hi' ? 'विवरण अधूरा' : 'Details incomplete', lang === 'hi' ? 'जन्म तिथि, समय व स्थान भरें।' : 'Fill date, time & place of birth.'); return; }
    if (busy) return;
    setBusy(true); setReading(null); setNames(null); setKundli(null); setTimeline(null); setRemedies(null); setGochar(null); setVarga(null); setTransitForecast(null);
    try {
      const resolved = birthLocation || await resolveLocation({ query: place.trim(), lang }).then((r) => r.item).catch(() => null);
      const finalPlace = resolved?.description || place.trim();
      const coords = resolved?.lat != null && resolved?.lng != null ? { lat: resolved.lat, lng: resolved.lng } : {};
      if (resolved?.description && resolved.description !== place) setPlace(resolved.description);
      const birth = { dob: toDDMM(dob), tob: to24h(tob), tz: '+05:30', place: finalPlace, ...coords };
      // pehle kundli (cache warm) — taaki baaki endpoints isi cached chart se chalein (rate-limit safe)
      const k = await getKundli(birth);
      setKundli(k);
      const [rd, nm, tl, rm, gc, vg, tf] = await Promise.all([
        getVedicReading(birth).catch(() => null),
        getNameSuggestions({ ...birth, gender, candidate: candidate.trim() || undefined }).catch(() => null),
        getLifeTimeline(birth).catch(() => null),
        getRemedies(birth).catch(() => null),
        getGochar(birth).catch(() => null),
        getVargaCharts(birth).catch(() => null),
        getTransitForecast(birth).catch(() => null),
      ]);
      setReading(rd); setNames(nm); setTimeline(tl); setRemedies(rm); setGochar(gc); setVarga(vg);
      setTransitForecast(tf);
      hSuccess();
    } catch (e: any) {
      hError(); dialog(lang === 'hi' ? 'त्रुटि' : 'Error', e?.message || (lang === 'hi' ? 'फिर प्रयास करें।' : 'Please try again.'));
    } finally { setBusy(false); }
  };

  const exportPdf = async () => {
    if (exporting || (!kundli && !reading)) return;
    setExporting(true);
    try {
      const html = buildJanamPatriHtml({
        person: { name: name.trim(), gender, dob: dob ? fmtDob(dob) : '', tob, place: place.trim(), lang, chartStyle },
        kundli, reading, names, timeline, remedies, gochar, varga, transitForecast,
      });
      const { uri } = await Print.printToFileAsync({
        html,
        width: 595,
        height: 842,
        margins: { top: 36, right: 32, bottom: 40, left: 32 },
        textZoom: 100,
      });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Janam Patri', UTI: 'com.adobe.pdf' });
    } catch (e: any) {
      hError(); dialog('PDF', e?.message || 'PDF export failed');
    } finally { setExporting(false); }
  };

  const j = reading?.janma;
  const bp = reading?.birthPanchang;
  const nm = reading?.naamakshar || names?.naamakshar;
  const cand = names?.candidate;
  const asc = reading?.ascendant || kundli?.data?.ascendant || null;
  const moonSign = reading?.moonSign || kundli?.data?.moonSign || null;
  const hasReport = !!(kundli || reading);

  return (
    <Page title={t('patri.title', 'Janam Patri')} onBack={() => { hTap(); navigation.goBack(); }}>
      {/* ── input ── */}
      <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.8)' }]}>
        <View style={styles.intro}>
          <GradientText style={styles.introTitle}>{t('patri.heading', lang === 'hi' ? 'जन्म पत्रिका बनाएँ' : 'Create Janam Patri')}</GradientText>
          <Text style={[styles.introSub, { color: theme.textMuted }]}>{lang === 'hi' ? 'बच्चे/किसी के भी जन्म विवरण से पूरी कुंडली, शुभ नाम व PDF' : "Full kundli, lucky names & PDF from anyone's birth details"}</Text>
        </View>
        <View style={{ gap: 11, marginTop: 6 }}>
          <TextField icon={<UserLine color={theme.gold2} size={19} />} label={lang === 'hi' ? 'नाम (वैकल्पिक)' : 'Name (optional)'} value={name} onChangeText={setName} placeholder={lang === 'hi' ? 'बच्चे का नाम' : "Child's name"} autoCapitalize="words" />
          <View>
            <Text style={[styles.gLabel, { color: theme.goldText }]}>{lang === 'hi' ? 'लिंग' : 'GENDER'}</Text>
            <View style={styles.gRow}>
              {GENDERS.map((g) => {
                const on = g === gender;
                return (<Pressable key={g} onPress={() => { hSelect(); setGender(g); }} style={{ flex: 1 }}>
                  <View style={[styles.gChip, on ? { backgroundColor: theme.gold1, borderColor: theme.gold1 } : { borderWidth: 1, borderColor: theme.cardBorder }]}>
                    <Text style={[styles.gTxt, { color: on ? theme.buttonInk : theme.gold1 }]}>{lang === 'hi' ? (g === 'Male' ? 'लड़का' : 'लड़की') : (g === 'Male' ? 'Boy' : 'Girl')}</Text>
                  </View></Pressable>);
              })}
            </View>
          </View>
          <PickerRow icon={<CalendarIcon color={theme.gold2} size={19} />} label={lang === 'hi' ? 'जन्म तिथि' : 'DATE OF BIRTH'} value={dob ? fmtDob(dob) : ''} onPress={() => { hTap(); setShowDate(true); }} theme={theme} />
          <PickerRow icon={<ClockIcon color={theme.gold2} size={19} />} label={lang === 'hi' ? 'जन्म समय' : 'TIME OF BIRTH'} value={tob} onPress={() => { hTap(); setShowTime(true); }} theme={theme} />
          <BirthPlaceField label={lang === 'hi' ? 'जन्म स्थान' : 'Place of Birth'} value={place} onChangeText={setPlace} onSelect={setBirthLocation} placeholder={lang === 'hi' ? 'जैसे: आगोलाई, जोधपुर, राजस्थान' : 'Eg. Agolai, Jodhpur, Rajasthan'} />
          <TextField icon={<UserLine color={theme.gold2} size={19} />} label={lang === 'hi' ? 'कोई नाम सोचा है? (जाँचें)' : 'A name in mind? (check)'} value={candidate} onChangeText={setCandidate} placeholder={lang === 'hi' ? 'वैकल्पिक' : 'optional'} autoCapitalize="words" />
          <ChartStyleSelector value={chartStyle} onChange={setChartStyle} theme={theme} lang={lang} />
          <ReportScopeChips theme={theme} lang={lang} />
        </View>
        <View style={{ marginTop: 16 }}>
          <GoldButton label={busy ? (lang === 'hi' ? 'बन रही है…' : 'Generating…') : t('patri.cta', lang === 'hi' ? 'जन्म पत्रिका बनाएँ' : 'Generate Janam Patri')} onPress={generate} />
        </View>
        <Text style={[styles.trust, { color: theme.textMuted, marginTop: 10 }]}>
          {lang === 'hi'
            ? 'ग्रह, दशा और गोचर की गणना वास्तविक ग्रह-स्थितियों (Lahiri अयनांश) से; AI केवल सरल व्याख्या के लिए।'
            : 'Planet, dasha and transit calculations use real planetary positions (Lahiri ayanamsa); AI is only for plain-language explanation.'}
        </Text>
        {busy && <ActivityIndicator color={theme.gold1} style={{ marginTop: 14 }} />}
      </View>

      {/* ── report ── */}
      {hasReport && !busy && (
        <View style={{ gap: 14, marginTop: 14 }}>
          <View style={styles.center}>
            <Text style={[styles.om, { color: theme.gold2 }]}>॥ श्री गणेशाय नमः ॥</Text>
            <GradientText style={styles.repName}>{name.trim() || (lang === 'hi' ? 'जन्म पत्रिका' : 'Janam Patri')}</GradientText>
            <View style={[styles.omRule, { backgroundColor: theme.gold2 }]} />
            <Text style={[styles.repSub, { color: theme.textMuted }]}>
              {asc ? `${lang === 'hi' ? 'लग्न' : 'Lagna'} ${aSign(asc, lang)}` : ''}{moonSign ? ` · ${lang === 'hi' ? 'चंद्र' : 'Moon'} ${aSign(moonSign, lang)}` : ''}
            </Text>
          </View>

          {/* Birth chart with N/S/E toggle */}
          {!!(kundli?.data?.planets || []).length && (
            <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.8)' }]}>
              <Text style={[styles.h, { color: theme.gold1, textAlign: 'center' }]}>{lang === 'hi' ? 'जन्मांग चक्र' : 'Birth Chart'}</Text>
              <ChartStyleSelector value={chartStyle} onChange={setChartStyle} theme={theme} lang={lang} />
              <View style={{ marginTop: 12, alignItems: 'center' }}>
                <VedicChart planets={kundli!.data.planets} ascendant={kundli!.data.ascendant} style={chartStyle} lang={lang} size={300} />
              </View>
              <Text style={[styles.chartHint, { color: theme.textMuted }]}>{lang === 'hi' ? 'Lahiri अयनांश · ' : 'Lahiri ayanamsa · '}{chartStyleLabel(chartStyle, lang)}</Text>
            </View>
          )}

          {/* Naamkaran — headline */}
          <View style={[styles.card, { borderColor: theme.gold2 + '66', backgroundColor: theme.isDark ? 'rgba(201,150,46,0.08)' : 'rgba(244,195,74,0.12)' }]}>
            <Text style={[styles.h, { color: theme.gold1 }]}>{lang === 'hi' ? 'नामकरण — शुभ नाम' : 'Naamkaran — Lucky Names'}</Text>
            {!!nm && <View style={styles.namRow}><GradientText style={styles.namSyl}>{nm.syllable}</GradientText><Text style={[styles.namNote, { color: theme.textSoft }]}>{lang === 'hi' ? 'नाम इस अक्षर से रखें' : 'Names should begin with this'} · {nm.nakshatra} {lang === 'hi' ? 'चरण' : 'pada'} {nm.pada}</Text></View>}
            {!!names?.rashiNote && <Text style={[styles.rashiNote, { color: theme.textMuted }]}>{names.rashiNote}</Text>}
            {/* candidate check */}
            {!!cand && (
              <View style={[styles.candBox, { borderColor: cand.suitable ? '#3ec77a88' : '#e06a5a88', backgroundColor: (cand.suitable ? '#3ec77a' : '#e06a5a') + '14' }]}>
                <Text style={[styles.candTxt, { color: cand.suitable ? '#3ec77a' : '#e06a5a' }]}>
                  {cand.suitable ? '✓' : '✗'} "{cand.name}" — {cand.reason}
                </Text>
                {!cand.suitable && !!(cand.alternativesIfNo || []).length && <Text style={[styles.candAlt, { color: theme.textSoft }]}>{lang === 'hi' ? 'मिलते-जुलते' : 'Close'}: {cand.alternativesIfNo!.join(', ')}</Text>}
              </View>
            )}
            <View style={styles.nameWrap}>
              {(names?.names || []).map((n, i) => (
                <View key={i} style={[styles.nameChip, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.25)' : '#fffdf7' }]}>
                  <Text style={[styles.nameTxt, { color: theme.text }]}>{n.name}</Text>
                  <Text style={[styles.nameMean, { color: theme.textMuted }]} numberOfLines={1}>{n.meaning}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Birth panchang + janma quick */}
          {!!bp && (
            <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.8)' }]}>
              <Text style={[styles.h, { color: theme.gold1 }]}>{lang === 'hi' ? 'जन्म पंचांग व विवरण' : 'Birth Panchang & Details'}</Text>
              <View style={styles.chipRow}>
                <Chip label={lang === 'hi' ? 'तिथि' : 'Tithi'} value={`${lang === 'hi' ? bp.tithi.hi : bp.tithi.name}`} theme={theme} />
                <Chip label={lang === 'hi' ? 'नक्षत्र' : 'Nakshatra'} value={`${lang === 'hi' ? bp.nakshatra.hi : bp.nakshatra.name} ${bp.nakshatra.pada}`} theme={theme} />
                <Chip label={lang === 'hi' ? 'योग' : 'Yoga'} value={lang === 'hi' ? bp.yoga.hi : bp.yoga.name} theme={theme} />
                <Chip label={lang === 'hi' ? 'करण' : 'Karana'} value={lang === 'hi' ? bp.karana.hi : bp.karana.name} theme={theme} />
                {!!j && <Chip label={lang === 'hi' ? 'गण' : 'Gana'} value={L(j.gana)} theme={theme} />}
                {!!j && <Chip label={lang === 'hi' ? 'योनि' : 'Yoni'} value={L(j.yoni)} theme={theme} />}
                {!!j && <Chip label={lang === 'hi' ? 'नाड़ी' : 'Nadi'} value={L(j.nadi)} theme={theme} />}
              </View>
              {j?.gandmool?.present && <Text style={[styles.flag, { color: '#e0a92e' }]}>⚠ {lang === 'hi' ? 'गण्डमूल' : 'Gandmool'}: {j.gandmool.nakshatra}</Text>}
            </View>
          )}

          {/* Divisional charts (16) — compact */}
          {!!(varga?.data?.charts || []).length && (
            <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.8)' }]}>
              <Text style={[styles.h, { color: theme.gold1 }]}>{lang === 'hi' ? 'विभाजन चक्र (16 वर्ग)' : 'Divisional Charts (16 Varga)'}</Text>
              <View style={styles.chipRow}>
                {varga!.data.charts.map((c) => <Chip key={c.code} label={c.code} value={c.ascendantSign ? aSign(c.ascendantSign, lang) : (c.name || '')} theme={theme} />)}
              </View>
            </View>
          )}

          {/* Vedic Phaladesh */}
          {!!(reading?.predictions || []).length && (
            <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.8)' }]}>
              <Text style={[styles.h, { color: theme.gold1 }]}>{lang === 'hi' ? 'वैदिक फलादेश' : 'Vedic Phaladesh'}</Text>
              {reading!.predictions.slice(0, 8).map((pr) => (
                <Text key={pr.key} style={[styles.predLine, { color: theme.textSoft }]}><Text style={{ color: theme.text, fontFamily: fonts.interSemi }}>{L(pr.title)}: </Text>{L(pr.text)}</Text>
              ))}
            </View>
          )}

          {/* Jeevan Dasha */}
          {!!timeline?.balance && (
            <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.8)' }]}>
              <Text style={[styles.h, { color: theme.gold1 }]}>{lang === 'hi' ? 'जीवन दशा-काल (विंशोत्तरी)' : 'Life Dasha (Vimshottari)'}</Text>
              <Text style={[styles.predLine, { color: theme.textSoft }]}>{lang === 'hi' ? 'जन्म दशा' : 'Birth dasha'}: {timeline.balance.lord} ({timeline.balance.bhuktaYears} {lang === 'hi' ? 'वर्ष भुक्त' : 'yr spent'}, {timeline.balance.bhogyaYears} {lang === 'hi' ? 'वर्ष भोग्य' : 'yr left'})</Text>
              {timeline.periods.filter((pp) => !pp.past).slice(0, 6).map((pp, i) => (
                <View key={i}>
                  <Text style={[styles.predLine, { color: pp.current ? theme.gold1 : theme.textSoft }]}>{pp.lord} · {lang === 'hi' ? 'आयु' : 'age'} {Math.round(pp.fromAge)}–{Math.round(pp.toAge)}{pp.current ? (lang === 'hi' ? ' • अभी' : ' • now') : ''}</Text>
                  {!!pp.phala?.effect && <Text style={[styles.predSubLine, { color: theme.textMuted }]}>{pp.phala.effect}</Text>}
                </View>
              ))}
            </View>
          )}

          {/* Gochar */}
          {!!gochar && (
            <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.8)' }]}>
              <Text style={[styles.h, { color: theme.gold1 }]}>{lang === 'hi' ? 'वर्तमान गोचर' : 'Current Gochar'}</Text>
              <Text style={[styles.predLine, { color: gochar.sadeSati?.active ? '#e06a5a' : gochar.sadeSati?.dhaiya ? '#e0a92e' : '#3ec77a' }]}>
                {lang === 'hi' ? 'शनि साढ़े साती' : 'Sade Sati'}: {gochar.sadeSati?.active ? (lang === 'hi' ? (gochar.sadeSati.phaseHi || 'सक्रिय') : (gochar.sadeSati.phase || 'Active')) : gochar.sadeSati?.dhaiya ? (lang === 'hi' ? 'ढैय्या' : 'Dhaiya') : (lang === 'hi' ? 'नहीं' : 'No')}
              </Text>
              {(gochar.transits || []).filter((tr) => ['Saturn', 'Jupiter', 'Rahu'].includes(tr.planet)).map((tr, i) => (
                <Text key={i} style={[styles.predLine, { color: theme.textSoft }]}>{tr.planet}: {tr.sign} ({lang === 'hi' ? 'चंद्र से' : 'from Moon'} {tr.houseFromMoon})</Text>
              ))}
            </View>
          )}

          {/* Year-by-year Gochar */}
          {!!(transitForecast?.years || []).length && (
            <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.8)' }]}>
              <Text style={[styles.h, { color: theme.gold1 }]}>{lang === 'hi' ? 'साल-दर-साल गोचर' : 'Year-by-Year Gochar'}</Text>
              {!!transitForecast?.summary && <Text style={[styles.predLine, { color: theme.textSoft }]}>{transitForecast.summary}</Text>}
              {transitForecast!.years.slice(0, 6).map((yr) => (
                <Text key={yr.year} style={[styles.predLine, { color: yr.current ? theme.gold1 : theme.textSoft }]}>
                  <Text style={{ color: yr.current ? theme.gold1 : theme.text, fontFamily: fonts.interSemi }}>{yr.year}{yr.current ? (lang === 'hi' ? ' · वर्तमान' : ' · current') : ''}: </Text>
                  {lang === 'hi' ? 'शनि' : 'Saturn'} {lang === 'hi' ? (yr.shani.signHi || yr.shani.sign || '-') : (yr.shani.sign || '-')}
                  {yr.shani.houseFromMoon ? ` (${lang === 'hi' ? 'चंद्र से' : 'from Moon'} ${yr.shani.houseFromMoon})` : ''}
                  {' · '}
                  {lang === 'hi' ? 'गुरु' : 'Jupiter'} {lang === 'hi' ? (yr.guru.signHi || yr.guru.sign || '-') : (yr.guru.sign || '-')}
                  {yr.guru.houseFromMoon ? ` (${lang === 'hi' ? 'चंद्र से' : 'from Moon'} ${yr.guru.houseFromMoon})` : ''}
                </Text>
              ))}
            </View>
          )}

          {/* Upay */}
          {!!remedies?.remedies && (
            <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.8)' }]}>
              <Text style={[styles.h, { color: theme.gold1 }]}>{lang === 'hi' ? 'उपाय' : 'Remedies'}</Text>
              {!!remedies.remedies.lifeGem && <Text style={[styles.predLine, { color: theme.textSoft }]}><Text style={{ color: theme.text, fontFamily: fonts.interSemi }}>{lang === 'hi' ? 'भाग्य रत्न' : 'Life Gem'}: </Text>{lang === 'hi' ? (remedies.remedies.lifeGem.gemstoneHi || remedies.remedies.lifeGem.gemstone) : remedies.remedies.lifeGem.gemstone} ({remedies.remedies.lifeGem.planet})</Text>}
              {(remedies.remedies.doshaRemedies || []).filter((dr) => dr.present).slice(0, 3).map((dr, i) => (
                <Text key={i} style={[styles.predLine, { color: theme.textSoft }]}>• {lang === 'hi' ? (dr.nameHi || dr.name) : dr.name}: {lang === 'hi' ? (dr.mantraHi || dr.mantra || '') : (dr.mantra || '')}</Text>
              ))}
            </View>
          )}

          {/* PDF export */}
          <GoldButton label={exporting ? (lang === 'hi' ? 'PDF बन रही है…' : 'Exporting PDF…') : t('patri.pdf', lang === 'hi' ? '📄 पूरी जन्म पत्रिका PDF' : '📄 Export Full Janam Patri PDF')} onPress={exportPdf} />
          <Text style={[styles.trust, { color: theme.textMuted }]}>{lang === 'hi' ? 'PDF me: लग्न, सभी ग्रह (अंश सहित), पंचांग, गण-योनि-नाड़ी, दशा, फलादेश व शुभ नाम।' : 'PDF includes: lagna, all planets (with degrees), panchang, gana-yoni-nadi, dasha, readings & names.'}</Text>
          <View style={{ height: 8 }} />
        </View>
      )}

      <GoldDatePicker visible={showDate} initialDate={dob || new Date()} maximumDate={new Date()} onConfirm={(d) => { setDob(d); setShowDate(false); hSelect(); }} onCancel={() => setShowDate(false)} lang={lang} />
      <GoldTimePicker visible={showTime} value={tob || '08:00'} onConfirm={(tm) => { setTob(tm); setShowTime(false); hSelect(); }} onCancel={() => setShowTime(false)} lang={lang} />
    </Page>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, padding: 16 },
  intro: { alignItems: 'center' },
  introTitle: { fontFamily: fonts.cinzel, fontSize: 20, letterSpacing: 0.6 },
  introSub: { fontFamily: fonts.inter, fontSize: 12, textAlign: 'center', marginTop: 6, lineHeight: 17 },
  gLabel: { fontFamily: fonts.interSemi, fontSize: 10.5, letterSpacing: 1.5, marginBottom: 7, marginLeft: 2 },
  gRow: { flexDirection: 'row', gap: 8 },
  gChip: { minHeight: 42, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  gTxt: { fontFamily: fonts.interSemi, fontSize: 13 },
  pf: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 13, paddingVertical: 11, borderRadius: radii.md, borderWidth: 1 },
  pfIcon: { width: 19, alignItems: 'center' },
  pfLabel: { fontFamily: fonts.interSemi, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase' },
  pfValue: { fontFamily: fonts.inter, fontSize: 14.5, marginTop: 2 },

  center: { alignItems: 'center' },
  om: { fontFamily: fonts.cinzelSemi, fontSize: 12, letterSpacing: 1, marginBottom: 4 },
  omRule: { width: 60, height: 1.5, borderRadius: 1, marginTop: 6, marginBottom: 8, opacity: 0.7 },
  repName: { fontFamily: fonts.cinzel, fontSize: 22, letterSpacing: 0.5 },
  repSub: { fontFamily: fonts.inter, fontSize: 12.5, marginTop: 5 },
  h: { fontFamily: fonts.cinzelSemi, fontSize: 13.5, letterSpacing: 0.5, marginBottom: 4 },

  namRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 6 },
  namSyl: { fontFamily: fonts.cinzelXBold, fontSize: 34 },
  namNote: { flex: 1, fontFamily: fonts.inter, fontSize: 12, lineHeight: 17 },
  rashiNote: { fontFamily: fonts.inter, fontSize: 12, lineHeight: 17, marginTop: 8 },
  candBox: { borderWidth: 1, borderRadius: 10, padding: 10, marginTop: 11 },
  candTxt: { fontFamily: fonts.interSemi, fontSize: 13, lineHeight: 19 },
  candAlt: { fontFamily: fonts.inter, fontSize: 12, marginTop: 4 },
  nameWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  nameChip: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 7, minWidth: '46%', flexGrow: 1 },
  nameTxt: { fontFamily: fonts.cinzelSemi, fontSize: 15 },
  nameMean: { fontFamily: fonts.inter, fontSize: 11, marginTop: 2 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 6, alignItems: 'center', minWidth: 78 },
  chipLbl: { fontFamily: fonts.interSemi, fontSize: 9.5, letterSpacing: 0.8, textTransform: 'uppercase' },
  chipVal: { fontFamily: fonts.cinzelSemi, fontSize: 12.5, marginTop: 2 },
  flag: { fontFamily: fonts.inter, fontSize: 12, marginTop: 10 },
  predLine: { fontFamily: fonts.inter, fontSize: 13, lineHeight: 20, marginTop: 7 },
  predSubLine: { fontFamily: fonts.inter, fontSize: 12, lineHeight: 17, marginTop: 2 },
  styleBlock: { marginTop: 2 },
  styleLabel: { fontFamily: fonts.interSemi, fontSize: 9.5, letterSpacing: 1.4, textAlign: 'center', marginTop: 10 },
  styleRow: { flexDirection: 'row', gap: 7, marginTop: 8 },
  stylePill: { paddingVertical: 9, borderRadius: 999, alignItems: 'center' },
  styleTxt: { fontFamily: fonts.interSemi, fontSize: 12 },
  styleHint: { fontFamily: fonts.inter, fontSize: 10.5, textAlign: 'center', marginTop: 7, lineHeight: 15 },
  scopeBlock: { marginTop: 2 },
  scopeRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 7, marginTop: 8 },
  scopeChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, maxWidth: '48%' },
  scopeTxt: { fontFamily: fonts.interSemi, fontSize: 10.5 },
  chartHint: { fontFamily: fonts.inter, fontSize: 10.5, textAlign: 'center', marginTop: 8 },
  trust: { fontFamily: fonts.inter, fontSize: 11, textAlign: 'center', lineHeight: 16, marginTop: 2 },
});
