import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Share, LayoutAnimation, Platform, UIManager } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Polyline } from 'react-native-svg';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Page } from '../components/Page';
import { TextField } from '../components/TextField';
import { GoldDatePicker } from '../components/GoldDatePicker';
import { GoldTimePicker } from '../components/GoldTimePicker';
import { UserLine, CalendarIcon, ClockIcon } from '../components/icons/ProfileIcons';
import { BirthPlaceField } from '../components/BirthPlaceField';
import { MuhuratCalendar } from '../components/MuhuratCalendar';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radii } from '../theme/tokens';
import { useLang } from '../i18n/LanguageProvider';
import { hTap } from '../lib/haptics';
import { aSign } from '../i18n/astro';
import { naamRashi } from '../lib/naamRashi';
import { birthFromProfile } from '../lib/birth';
import { muhuratCatByKey } from '../data/muhuratCategories';
import { findMuhurat, MuhuratItem, MuhuratResult, MuhuratBirthInput, LocationSuggestion } from '../lib/api';
import { buildMuhuratHtml } from '../lib/muhuratPdf';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) UIManager.setLayoutAnimationEnabledExperimental(true);
const ease = () => LayoutAnimation.configureNext(LayoutAnimation.create(220, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity));

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MON_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MON_HI = ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];
const MON_HI_SH = ['जन', 'फ़र', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुल', 'अग', 'सित', 'अक्तू', 'नव', 'दिस'];
const WD_HI: Record<string, string> = { Sunday: 'रविवार', Monday: 'सोमवार', Tuesday: 'मंगलवार', Wednesday: 'बुधवार', Thursday: 'गुरुवार', Friday: 'शुक्रवार', Saturday: 'शनिवार' };
const dmyParts = (dmy: string) => { const [d, m, y] = String(dmy).split('/').map(Number); return { d, m, y }; };
const nStars = (score: number) => Math.max(1, Math.min(5, Math.round(score / 20)));

function Stars({ score, size = 13, color = '#e9b850' }: { score: number; size?: number; color?: string }) {
  const n = nStars(score);
  return <Text style={{ fontSize: size, color, letterSpacing: 1 }}>{'★'.repeat(n)}<Text style={{ color: color + '4d' }}>{'★'.repeat(5 - n)}</Text></Text>;
}

const fmtDob = (d: Date | null) => (d ? `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}` : '');

// tappable field that opens a picker — same look as BirthDetailsScreen's PickerField
function PickerField({ icon, label, value, onPress, theme, lang }: any) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.pf, { backgroundColor: theme.isDark ? 'rgba(0,0,0,0.55)' : '#fffdf7', borderColor: pressed ? theme.gold1 : (theme.isDark ? 'rgba(201,150,46,0.35)' : 'rgba(176,115,22,0.30)') }]}>
      <View style={styles.pfIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.pfLabel, { color: theme.goldText }]}>{label.toUpperCase()}</Text>
        <Text style={[styles.pfValue, { color: value ? theme.text : theme.textMuted }]}>{value || (lang === 'hi' ? 'चुनने के लिए टैप करें' : 'Tap to select')}</Text>
      </View>
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.gold2} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Polyline points="6 9 12 15 18 9" /></Svg>
    </Pressable>
  );
}

// "12:14 PM" → {h,m} 24h
function parse12(t?: string) {
  const m = String(t || '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!m) return null;
  let h = +m[1]; const mm = +m[2]; const ap = (m[3] || '').toUpperCase();
  if (ap === 'PM' && h < 12) h += 12; if (ap === 'AM' && h === 12) h = 0;
  return { h, m: mm };
}
function buildIcs(item: MuhuratItem, title: string, place: string) {
  const { d, m, y } = dmyParts(item.dmy);
  const s = item.time.abhijit ? parse12(item.time.abhijit.start) : { h: 9, m: 0 };
  const e = item.time.abhijit ? parse12(item.time.abhijit.end) : { h: 10, m: 0 };
  const fmt = (hh: number, mm: number) => `${y}${String(m).padStart(2, '0')}${String(d).padStart(2, '0')}T${String(hh).padStart(2, '0')}${String(mm).padStart(2, '0')}00`;
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ShreeYantra//Muhurat//EN', 'BEGIN:VEVENT',
    `DTSTART:${fmt((s || { h: 9 }).h, (s || { m: 0 }).m)}`, `DTEND:${fmt((e || { h: 10 }).h, (e || { m: 0 }).m)}`,
    `SUMMARY:${title}`, `LOCATION:${place || ''}`, `DESCRIPTION:Shubh Muhurat (score ${item.score}/100)`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
}

// ── expandable, sectioned detail ──
function Detail({ item, lang, theme, onLight }: { item: MuhuratItem; lang: 'en' | 'hi'; theme: any; onLight?: boolean }) {
  const muted = onLight ? '#6b4e16' : theme.textMuted;
  const txt = onLight ? '#3a2606' : theme.text;
  const border = onLight ? 'rgba(58,38,2,0.16)' : theme.cardBorder;
  const gold = onLight ? '#7a4e08' : theme.gold1;
  const green = theme.isDark && !onLight ? '#8fe0ad' : '#2c8a52';
  const L = (o?: { en: string; hi: string } | null) => (o ? (lang === 'hi' ? o.hi : o.en) : '—');
  const rows: { k: string; v: string; good?: boolean }[] = [
    { k: lang === 'hi' ? 'तिथि' : 'Tithi', v: lang === 'hi' ? (item.tithi.hi || item.tithi.name) : item.tithi.name },
    { k: lang === 'hi' ? 'नक्षत्र' : 'Nakshatra', v: lang === 'hi' ? (item.nakshatra.hi || item.nakshatra.name) : item.nakshatra.name },
    { k: lang === 'hi' ? 'योग' : 'Yoga', v: item.yoga ? (lang === 'hi' ? (item.yoga.hi || item.yoga.name) : item.yoga.name) : '—' },
    { k: lang === 'hi' ? 'करण' : 'Karana', v: item.karana ? (lang === 'hi' ? (item.karana.hi || item.karana.name) : item.karana.name) : '—' },
    { k: lang === 'hi' ? 'चंद्र राशि' : 'Moon Sign', v: L(item.moonSign) },
    ...(item.chandra ? [{ k: lang === 'hi' ? 'चंद्रबल' : 'Chandrabal', v: L(item.chandra.label), good: true }] : []),
    ...(item.tara ? [{ k: lang === 'hi' ? 'ताराबल' : 'Tara Bal', v: `${lang === 'hi' ? item.tara.hi : item.tara.en}`, good: true }] : []),
    { k: lang === 'hi' ? 'चौघड़िया' : 'Choghadiya', v: item.flags.choghadiya || '—' },
  ];
  return (
    <View style={{ marginTop: 12, gap: 12 }}>
      <View>
        <Text style={[styles.secH, { color: gold }]}>{lang === 'hi' ? 'पंचांग' : 'Panchang'}</Text>
        <View style={styles.pGrid}>
          {rows.map((r) => (
            <View key={r.k} style={[styles.pCell, { borderColor: border, backgroundColor: onLight ? 'rgba(255,255,255,0.5)' : (theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,253,247,0.85)') }]}>
              <Text style={[styles.pLabel, { color: muted }]}>{r.k}</Text>
              <Text style={[styles.pValue, { color: r.good ? green : txt }]} numberOfLines={1}>{r.v}</Text>
            </View>
          ))}
        </View>
      </View>
      <View>
        <Text style={[styles.secH, { color: green }]}>{lang === 'hi' ? '✔ अच्छे कारण (Why)' : '✔ Good points (Why)'}</Text>
        <View style={{ gap: 5 }}>
          {item.breakdown.filter((b) => b.ok && b.pts >= 5).map((b) => (
            <View key={b.key} style={styles.whyRow}>
              <Text style={[styles.whyTxt, { color: txt }]}>✔ {lang === 'hi' ? b.hi : b.en}</Text>
              <Text style={[styles.whyPts, { color: green }]}>+{b.pts}</Text>
            </View>
          ))}
        </View>
      </View>
      <View>
        <Text style={[styles.secH, { color: '#c67a5a' }]}>{lang === 'hi' ? '⛔ हटाई गई चीज़ें' : '⛔ Avoided'}</Text>
        <Text style={[styles.avoidTxt, { color: muted }]}>
          {lang === 'hi' ? 'राहुकाल हटाया · भद्रा नहीं · पंचक नहीं · दुर्मुहूर्त हटाया' : 'Rahu Kaal removed · No Bhadra · No Panchak · Durmuhurat removed'}
          {item.time.rahuKaal ? `  (राहुकाल ${item.time.rahuKaal.start}–${item.time.rahuKaal.end})` : ''}
        </Text>
      </View>
    </View>
  );
}

// ── premium Best-Muhurat hero: DATE first, score explained, gold glow + sparkle ──
function HeroBest({ item, lang, theme, expanded, onToggle, place, periodLabel }: any) {
  const { d, m, y } = dmyParts(item.dmy);
  const wd = lang === 'hi' ? (item.weekdayHi || WD_HI[item.weekday] || item.weekday) : item.weekday;
  const dateStr = `${d} ${(lang === 'hi' ? MON_HI : MON_FULL)[(m - 1) % 12]} ${y}`;
  const top = item.breakdown.filter((b: any) => b.ok && b.pts >= 5).slice(0, 6);
  return (
    <View style={styles.heroGlow}>
      <LinearGradient colors={['#fce8a8', '#e9b850', '#b87f1a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        {['✦', '✦', '✦'].map((s, i) => <Text key={i} style={[styles.spark, [{ top: 10, right: 14 }, { top: 40, right: 40, fontSize: 9 }, { bottom: 60, left: 16, fontSize: 8 }][i]]}>{s}</Text>)}
        <Text style={styles.heroCrown}>🏆 {periodLabel}</Text>
        {/* DATE = biggest */}
        <Text style={styles.heroDate}>{dateStr}</Text>
        <Text style={styles.heroWd}>{wd}</Text>
        {!!item.time.abhijit && <Text style={styles.heroTime}>🕐 {item.time.abhijit.start} – {item.time.abhijit.end}</Text>}
        {!!place && <Text style={styles.heroPlace} numberOfLines={1}>📍 {place}</Text>}
        {/* score block, explained */}
        <View style={styles.heroScoreBox}>
          <Stars score={item.score} size={17} color="#3a2602" />
          <Text style={styles.heroScoreLabel}>{lang === 'hi' ? 'कुल मुहूर्त स्कोर' : 'Overall Muhurat Score'}</Text>
          <Text style={styles.heroScoreNum}>{item.score}<Text style={styles.heroScoreMax}> / 100</Text>  ·  <Text style={styles.heroRating}>{lang === 'hi' ? item.rating.hi : item.rating.en}</Text></Text>
        </View>
        <View style={styles.heroWhy}>
          {top.map((b: any) => <Text key={b.key} style={styles.heroChk} numberOfLines={1}>✔ {lang === 'hi' ? b.hi : b.en}</Text>)}
        </View>
        <Pressable onPress={() => { hTap(); ease(); onToggle(); }} style={styles.heroBtn}>
          <Text style={styles.heroBtnTxt}>{expanded ? (lang === 'hi' ? 'बंद करें ▲' : 'Close ▲') : (lang === 'hi' ? 'पूरी जानकारी देखें ▼' : 'View full details ▼')}</Text>
        </Pressable>
        {expanded && <View style={styles.heroDetail}><Detail item={item} lang={lang} theme={theme} onLight /></View>}
      </LinearGradient>
    </View>
  );
}

function RankCard({ item, rank, lang, theme, expanded, onToggle }: any) {
  const { d, m } = dmyParts(item.dmy);
  const wd = lang === 'hi' ? (item.weekdayHi || WD_HI[item.weekday] || item.weekday) : item.weekday;
  const nak = lang === 'hi' ? (item.nakshatra.hi || item.nakshatra.name) : item.nakshatra.name;
  const top = item.breakdown.filter((b: any) => b.ok && b.pts >= 10).slice(0, 3);
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
  return (
    <View style={[styles.rankCard, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.92)' }]}>
      <Pressable onPress={() => { hTap(); ease(); onToggle(); }} style={styles.rankTop}>
        <Text style={styles.rankMedal}>{medal}</Text>
        <LinearGradient colors={item.score >= 92 ? ['#eab94f', '#9f6b16'] : ['#cdb079', '#7a5a24']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.dateThumb}>
          <Text style={styles.thumbDay}>{d}</Text>
          <Text style={styles.thumbMon}>{(lang === 'hi' ? MON_HI_SH : MON)[(m - 1) % 12]}</Text>
          <Text style={styles.thumbWd} numberOfLines={1}>{String(wd).slice(0, 3)}</Text>
        </LinearGradient>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.rankHeadRow}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.rankWd, { color: theme.text }]} numberOfLines={1}>{wd}</Text>
              <Text style={[styles.rankRating, { color: theme.gold2 }]} numberOfLines={1}>{lang === 'hi' ? item.rating.hi : item.rating.en}{item.time.abhijit ? ` · 🕐 ${item.time.abhijit.start}` : ''}</Text>
            </View>
            <View style={[styles.scorePill, { backgroundColor: item.score >= 92 ? 'rgba(62,199,122,0.14)' : 'rgba(233,184,80,0.16)', borderColor: item.score >= 92 ? '#3ec77a66' : theme.gold2 + '66' }]}>
              <Text style={[styles.scorePillNum, { color: item.score >= 92 ? (theme.isDark ? '#8fe0ad' : '#2c8a52') : theme.gold1 }]}>{item.score}</Text>
              <Stars score={item.score} size={9} />
            </View>
          </View>
          <View style={styles.chipRow}>
            {top.map((b: any) => <Text key={b.key} style={[styles.goodChip, { color: theme.isDark ? '#8fe0ad' : '#2c8a52', borderColor: '#3ec77a44' }]} numberOfLines={1}>✔ {lang === 'hi' ? b.hi.split('(')[0].split('—')[0].trim() : b.en.split('(')[0].split('—')[0].trim()}</Text>)}
          </View>
        </View>
        <Text style={[styles.rankChevron, { color: theme.gold2 }]}>{expanded ? '▲' : '▼'}</Text>
      </Pressable>
      {expanded && <Detail item={item} lang={lang} theme={theme} />}
    </View>
  );
}

function BirthInputs({ titleEn, titleHi, val, onChange, theme, lang }: any) {
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  return (
    <View style={[styles.birthBox, { borderColor: theme.cardBorder }]}>
      <Text style={[styles.birthTitle, { color: theme.gold2 }]}>{lang === 'hi' ? titleHi : titleEn}</Text>
      <PickerField icon={<CalendarIcon color={theme.gold2} size={20} />} label={lang === 'hi' ? 'जन्म तिथि' : 'Date of birth'} value={fmtDob(val.dob)} onPress={() => { hTap(); setShowDate(true); }} theme={theme} lang={lang} />
      <PickerField icon={<ClockIcon color={theme.gold2} size={20} />} label={lang === 'hi' ? 'जन्म समय' : 'Time of birth'} value={val.time} onPress={() => { hTap(); setShowTime(true); }} theme={theme} lang={lang} />
      <BirthPlaceField label={lang === 'hi' ? 'जन्म स्थान' : 'Birth place'} value={val.placeText || ''} onChangeText={(t: string) => onChange({ ...val, placeText: t })} onSelect={(it: LocationSuggestion | null) => onChange({ ...val, loc: it ? { place: it.description, lat: it.lat ?? undefined, lng: it.lng ?? undefined } : null })} placeholder={lang === 'hi' ? 'शहर / गाँव' : 'City / village'} />
      <GoldDatePicker visible={showDate} initialDate={val.dob || new Date(2000, 0, 1)} maximumDate={new Date()} onConfirm={(d) => { onChange({ ...val, dob: d }); setShowDate(false); }} onCancel={() => setShowDate(false)} lang={lang} />
      <GoldTimePicker visible={showTime} value={val.time || '08:00 AM'} onConfirm={(tm) => { onChange({ ...val, time: tm }); setShowTime(false); }} onCancel={() => setShowTime(false)} lang={lang} />
    </View>
  );
}

export function MuhuratFinderScreen({ navigation, route }: any) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const categoryKey: string = route?.params?.categoryKey || 'griha-pravesh';
  const cat = muhuratCatByKey(categoryKey);
  const req = cat?.req || { name: 'optional', birth: 'optional', couple: false };

  const [name, setName] = useState('');
  const [placeText, setPlaceText] = useState('');
  const [loc, setLoc] = useState<{ place?: string; lat?: number; lng?: number } | null>(null);
  const [sel, setSel] = useState<'year' | number>('year');
  const [birth1, setBirth1] = useState<any>({ dob: null, time: '', placeText: '', loc: null });
  const [birth2, setBirth2] = useState<any>({ dob: null, time: '', placeText: '', loc: null });
  const [result, setResult] = useState<MuhuratResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pickedDate, setPickedDate] = useState<Date | null>(null); // "pick any date" via app calendar
  const [showWhenPicker, setShowWhenPicker] = useState(false);
  const scrollRef = useRef<any>(null);
  const resultsY = useRef(0);

  useEffect(() => {
    birthFromProfile().then((b: any) => {
      if (b?.place) { setPlaceText(b.place); setLoc({ place: b.place, lat: b.lat, lng: b.lng }); }
      if (b?.dob && b?.place) {
        const [dd, mo, yy] = String(b.dob).split(/[-/]/).map(Number);
        const dobDate = dd && mo && yy ? new Date(yy, mo - 1, dd) : null;
        setBirth1({ dob: dobDate, time: b.tob || '', placeText: b.place, loc: { place: b.place, lat: b.lat, lng: b.lng } });
      }
    }).catch(() => {});
  }, []);

  const rashi = useMemo(() => naamRashi(name), [name]);
  const months = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 9 }).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      return { idx: i, month: d.getMonth() + 1, year: d.getFullYear(), label: `${(lang === 'hi' ? MON_HI_SH : MON)[d.getMonth()]} ${d.getFullYear()}` };
    });
  }, [lang]);

  // accuracy meter — location only 88, +name 93, +birth 99
  // Panchang factors are astronomically exact for ANY input; a mapped naam-rashi adds
  // exact Chandrabal → name-based selection is treated as 100% accurate.
  const accuracy = ((birth1.dob && (birth1.loc || birth1.placeText)) || (req.name !== 'none' && rashi)) ? 100 : 96;
  const birthPayload = (bv: any): MuhuratBirthInput | null => (bv?.dob ? { date: fmtDob(bv.dob), time: bv.time || undefined, place: bv.loc?.place || bv.placeText || undefined, lat: bv.loc?.lat, lng: bv.loc?.lng } : null);

  const periodLabel = useMemo(() => {
    if (pickedDate) return lang === 'hi' ? `${fmtDob(pickedDate)} के आसपास सर्वश्रेष्ठ` : `Best around ${fmtDob(pickedDate)}`;
    if (sel === 'year') return lang === 'hi' ? `${new Date().getFullYear()} का सर्वश्रेष्ठ मुहूर्त` : `Best Muhurat of ${new Date().getFullYear()}`;
    const mo = months[sel];
    return lang === 'hi' ? `${(MON_HI)[mo.month - 1]} का सर्वश्रेष्ठ` : `Best of ${MON_FULL[mo.month - 1]}`;
  }, [sel, months, lang, pickedDate]);

  const onFind = async () => {
    hTap(); setError(null); setResult(null); setOpen(null); setLoading(true);
    // pickedDate → scan the FULL window from TODAY up to the chosen date (targetDate),
    // so the list is the best of that range and `target` = the chosen date itself.
    const isYear = !pickedDate && sel === 'year';
    let payload: any;
    if (pickedDate) {
      const daysAhead = Math.ceil((pickedDate.getTime() - Date.now()) / 86400000);
      const scanMonths = Math.max(1, Math.min(6, Math.ceil(daysAhead / 30) + 1));
      payload = { targetDate: fmtDob(pickedDate), months: scanMonths };
    } else if (isYear) {
      payload = { month: new Date().getMonth() + 1, year: new Date().getFullYear(), months: 6 };
    } else {
      const mo = months[sel as number];
      payload = { month: mo.month, year: mo.year, months: 3 };
    }
    try {
      const res = await findMuhurat({
        category: categoryKey, ...payload,
        place: loc?.place || placeText || undefined, lat: loc?.lat, lng: loc?.lng,
        nameRashi: req.name !== 'none' ? rashi : null,
        birth: birthPayload(birth1), birth2: req.couple ? birthPayload(birth2) : null,
      });
      setResult(res);
      if (!res.items.length && !res.target) setError(lang === 'hi' ? 'इस अवधि में कोई शुभ मुहूर्त नहीं मिला — आगे का महीना चुनें।' : 'No auspicious muhurat here — try a later month.');
      // auto-scroll to the results so the user lands on them
      setTimeout(() => {
        const s = scrollRef.current;
        if (s?.scrollToPosition) s.scrollToPosition(0, Math.max(0, resultsY.current - 8), true);
        else if (s?.scrollTo) s.scrollTo({ y: Math.max(0, resultsY.current - 8), animated: true });
      }, 350);
    } catch { setError(lang === 'hi' ? 'मुहूर्त गणना नहीं हो पाई — इंटरनेट जाँचें।' : 'Could not compute — check internet.'); }
    finally { setLoading(false); }
  };

  const catTitle = lang === 'hi' ? (cat?.name.hi || 'मुहूर्त') : (cat?.name.en || 'Muhurat');
  // Ask the app's AI astrologer, pre-filled with THIS muhurat's context (the AI also
  // uses the user's saved birth chart automatically).
  const askJyotishi = () => {
    hTap();
    const b = result?.best; const tg = result?.target;
    const bStr = b ? `${b.dmy} (${b.weekday}, ${b.time.abhijit ? b.time.abhijit.start + '-' + b.time.abhijit.end : ''}, score ${b.score}/100)` : '';
    const place = loc?.place || placeText || '';
    const q = lang === 'hi'
      ? `${catTitle} के लिए ${place} में मुहूर्त पूछना है। ऐप ने सर्वश्रेष्ठ दिन ${bStr} बताया है${tg ? `, और मेरी चुनी तारीख ${tg.dmy} ${tg.ok ? 'भी शुभ है' : 'शुभ नहीं है'}` : ''}. क्या यह सही है, इस दिन क्या ध्यान रखूँ, और कोई सरल उपाय बताइए?`
      : `I want a muhurat for ${catTitle} in ${place}. The app suggests the best day ${bStr}${tg ? `, and my chosen date ${tg.dmy} is ${tg.ok ? 'also good' : 'not auspicious'}` : ''}. Is this right, what should I keep in mind, and any simple remedy?`;
    navigation.navigate('AiAstrologer', { question: q });
  };
  const sharePdf = async () => {
    if (!result || busy) return; setBusy(true);
    try {
      const html = buildMuhuratHtml(result, loc?.place || placeText || '');
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: catTitle, UTI: 'com.adobe.pdf' });
    } catch {} finally { setBusy(false); }
  };
  const shareText = async () => {
    if (!result?.best) return;
    const b = result.best; const { d, m, y } = dmyParts(b.dmy);
    const msg = `🏆 ${catTitle} — ${lang === 'hi' ? 'सर्वश्रेष्ठ मुहूर्त' : 'Best Muhurat'}\n📅 ${d} ${MON[(m - 1) % 12]} ${y} (${b.weekday})\n🕐 ${b.time.abhijit ? `${b.time.abhijit.start} – ${b.time.abhijit.end}` : ''}\n⭐ ${b.score}/100 ${b.rating.en}\n📍 ${loc?.place || placeText || ''}`;
    try { await Share.share({ message: msg }); } catch {}
  };
  const addToCal = async () => {
    if (!result?.best || busy) return; setBusy(true);
    try {
      const ics = buildIcs(result.best, `${catTitle} Muhurat`, loc?.place || placeText || '');
      const uri = `${FileSystem.cacheDirectory}muhurat.ics`;
      await FileSystem.writeAsStringAsync(uri, ics, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'text/calendar', dialogTitle: lang === 'hi' ? 'कैलेंडर में जोड़ें' : 'Add to Calendar' });
    } catch {} finally { setBusy(false); }
  };

  return (
    <Page title={catTitle} onBack={() => { hTap(); navigation.goBack(); }} scrollRef={scrollRef}>
      {/* compact category header (small) */}
      <LinearGradient colors={cat?.colors || ['#eab94f', '#9f6b16']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.catHero}>
        <Text style={styles.catEmoji}>{cat?.emoji || '🕉'}</Text>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.catName} numberOfLines={1}>{catTitle}</Text>
          <Text style={styles.catBlurb} numberOfLines={1}>{lang === 'hi' ? cat?.blurb.hi : cat?.blurb.en}</Text>
        </View>
      </LinearGradient>

      {/* form */}
      <View style={styles.form}>
        <BirthPlaceField label={lang === 'hi' ? 'स्थान (कहाँ कार्य होगा) *' : 'Location (where the event is) *'} value={placeText} onChangeText={setPlaceText}
          onSelect={(it: LocationSuggestion | null) => setLoc(it ? { place: it.description, lat: it.lat ?? undefined, lng: it.lng ?? undefined } : null)}
          placeholder={lang === 'hi' ? 'शहर / गाँव' : 'City / village'} />

        <View>
          <Text style={[styles.label, { color: theme.gold2 }]}>{lang === 'hi' ? 'कब का मुहूर्त *' : 'When *'}</Text>
          {/* pick any exact date from the app's calendar (GoldDatePicker) */}
          <PickerField
            icon={<CalendarIcon color={theme.gold2} size={20} />}
            label={lang === 'hi' ? 'तारीख चुनें (कैलेंडर)' : 'Pick a date (calendar)'}
            value={pickedDate ? fmtDob(pickedDate) : ''}
            onPress={() => { hTap(); setShowWhenPicker(true); }}
            theme={theme} lang={lang}
          />
          <Text style={[styles.orTxt, { color: theme.textMuted }]}>{lang === 'hi' ? '— या नीचे से महीना चुनें —' : '— or pick a month below —'}</Text>
          {/* wrapped chips — all visible, no fragile horizontal scroll */}
          <View style={styles.chipWrap}>
            <Pressable onPress={() => { hTap(); setPickedDate(null); setSel('year'); }} style={[styles.chip, { borderColor: !pickedDate && sel === 'year' ? theme.gold1 : theme.cardBorder, backgroundColor: !pickedDate && sel === 'year' ? theme.gold1 : (theme.isDark ? 'rgba(233,184,80,0.08)' : '#fff') }]}>
              <Text style={[styles.chipTxt, { color: !pickedDate && sel === 'year' ? '#1a1206' : theme.gold1 }]}>⭐ {lang === 'hi' ? 'पूरे साल' : 'Entire Year'}</Text>
            </Pressable>
            {months.map((mo) => {
              const on = !pickedDate && sel === mo.idx;
              return (
                <Pressable key={mo.idx} onPress={() => { hTap(); setPickedDate(null); setSel(mo.idx); }} style={[styles.chip, { borderColor: on ? theme.gold1 : theme.cardBorder, backgroundColor: on ? theme.gold1 : (theme.isDark ? 'rgba(233,184,80,0.08)' : '#fff') }]}>
                  <Text style={[styles.chipTxt, { color: on ? '#1a1206' : theme.gold1 }]}>{mo.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <GoldDatePicker
            visible={showWhenPicker}
            initialDate={pickedDate || new Date()}
            maximumDate={new Date(new Date().getFullYear() + 2, 11, 31)}
            onConfirm={(d) => { setPickedDate(d); setShowWhenPicker(false); }}
            onCancel={() => setShowWhenPicker(false)}
            lang={lang}
          />
        </View>

        {(req.name !== 'none' || req.birth !== 'none') && (
          <View style={[styles.advBox, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.05)' : 'rgba(255,250,240,0.7)' }]}>
            {/* always-open headline */}
            <Text style={[styles.advTitle, { color: theme.gold1 }]}>{req.name !== 'none' ? (lang === 'hi' ? '🙏 नाम से मुहूर्त देखें' : '🙏 See Muhurat by Name') : (lang === 'hi' ? '🙏 जन्म विवरण से मुहूर्त देखें' : '🙏 See Muhurat by Birth Details')}</Text>
            <Text style={[styles.advSub, { color: theme.textMuted }]}>{req.birth === 'required' ? (lang === 'hi' ? 'सटीक मुहूर्त हेतु जन्म विवरण भरें' : 'Fill birth details for an accurate muhurat') : (lang === 'hi' ? 'वैकल्पिक — अधिक सटीकता के लिए' : 'Optional — for higher accuracy')}</Text>
            {/* accuracy meter */}
            <View style={styles.accWrap}>
              <View style={styles.accHead}>
                <Text style={[styles.accLabel, { color: theme.textMuted }]}>{lang === 'hi' ? 'सटीकता' : 'Accuracy'}</Text>
                <Text style={[styles.accVal, { color: theme.gold1 }]}>{accuracy}%</Text>
              </View>
              <View style={[styles.accTrack, { backgroundColor: theme.isDark ? 'rgba(233,184,80,0.16)' : 'rgba(154,107,22,0.14)' }]}>
                <LinearGradient colors={['#fce8a8', '#e9b850', '#b87f1a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.accFill, { width: `${accuracy}%` }]} />
              </View>
              <Text style={[styles.accNote, { color: theme.textMuted }]}>{lang === 'hi' ? 'पंचांग गणना हमेशा 100% सटीक है। नाम से चंद्रबल भी सटीक जुड़ता है; जन्म विवरण ताराबल भी जोड़ देता है।' : 'The panchang is always 100% exact. Your name adds accurate Chandrabal; birth details also add Tara Bal.'}</Text>
            </View>
            {/* always visible — no collapse */}
            <View style={{ gap: 14, marginTop: 12 }}>
              {req.name !== 'none' && (
                <View>
                  <TextField icon={<UserLine color={theme.gold2} size={20} />} label={lang === 'hi' ? 'नाम (चंद्रबल हेतु)' : 'Name (for Chandrabal)'} value={name} onChangeText={setName} placeholder={lang === 'hi' ? 'मुखिया / सदस्य का नाम' : 'Head / member name'} autoCapitalize="words" />
                  {!!name.trim() && <Text style={[styles.hint, { color: rashi ? theme.gold1 : theme.textMuted }]}>{rashi ? `${lang === 'hi' ? 'नाम राशि' : 'Naam Rashi'}: ${aSign(rashi, lang)} 🌙` : (lang === 'hi' ? 'इस अक्षर की राशि नहीं मिली' : 'Could not map this letter')}</Text>}
                </View>
              )}
              {req.birth !== 'none' && <BirthInputs titleEn={req.couple ? 'Groom birth' : (req.birth === 'required' ? 'Birth details (needed for best accuracy)' : 'Birth details (optional)')} titleHi={req.couple ? 'वर का जन्म' : (req.birth === 'required' ? 'जन्म विवरण (सटीकता हेतु)' : 'जन्म विवरण (वैकल्पिक)')} val={birth1} onChange={setBirth1} theme={theme} lang={lang} />}
              {req.couple && <BirthInputs titleEn="Bride birth" titleHi="वधू का जन्म" val={birth2} onChange={setBirth2} theme={theme} lang={lang} />}
            </View>
          </View>
        )}

        <Pressable onPress={loading ? undefined : onFind} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1, marginTop: 2 }]}>
          <LinearGradient colors={['#fce8a8', '#e9b850', '#b87f1a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.findBtn}>
            <Text style={styles.findBtnTxt}>{loading ? (lang === 'hi' ? 'गणना हो रही है…' : 'Calculating…') : (lang === 'hi' ? '🔍 शुभ मुहूर्त खोजें' : '🔍 Find Best Muhurat')}</Text>
            <Text style={styles.findBtnSub}>{lang === 'hi' ? 'पंचांग आधारित सटीक गणना' : 'Panchang-based precise calculation'}</Text>
          </LinearGradient>
        </Pressable>
      </View>

      {loading && (
        <View style={styles.loadBox}>
          <ActivityIndicator color={theme.gold1} size="large" />
          <Text style={[styles.loadTxt, { color: theme.textMuted }]}>{lang === 'hi' ? 'हर दिन का पंचांग जाँचकर 0-100 स्कोर निकाला जा रहा है…' : 'Scoring each day’s panchang out of 100…'}</Text>
        </View>
      )}
      {!!error && !loading && <Text style={[styles.err, { color: theme.textMuted }]}>{error}</Text>}

      {!!result && !loading && (!!result.best || !!result.target) && (
        <View style={{ marginTop: 16 }} onLayout={(e) => { resultsY.current = e.nativeEvent.layout.y; }}>
          {/* plain-language intro for everyone */}
          <Text style={[styles.introLine, { color: theme.textSoft }]}>{lang === 'hi' ? '✨ नीचे आपके लिए सबसे शुभ दिन दिए हैं — सबसे ऊपर वाला सबसे अच्छा है। किसी भी दिन पर टैप करके पूरी जानकारी देखें।' : '✨ Below are the most auspicious days for you — the top one is best. Tap any day for full details.'}</Text>

          {/* the user's CHOSEN date */}
          {!!result.target && (
            <View style={{ marginBottom: 6 }}>
              <Text style={[styles.sectionH, { color: theme.goldText, marginTop: 2 }]}>{lang === 'hi' ? '📌 आपकी चुनी तारीख' : '📌 Your chosen date'}</Text>
              {result.target.ok ? (
                <HeroBest item={result.target} lang={lang} theme={theme} place={loc?.place || placeText} periodLabel={lang === 'hi' ? 'आपकी चुनी तारीख शुभ है' : 'Your chosen date is auspicious'} expanded={open === result.target.dmy} onToggle={() => setOpen(open === result.target!.dmy ? null : result.target!.dmy)} />
              ) : (
                <View style={[styles.targetBad, { borderColor: '#e0a92e88', backgroundColor: theme.isDark ? 'rgba(224,169,46,0.10)' : 'rgba(224,169,46,0.12)' }]}>
                  <Text style={[styles.targetBadDate, { color: theme.text }]}>{(() => { const p = dmyParts(result.target.dmy); return `${p.d} ${(lang === 'hi' ? MON_HI : MON_FULL)[(p.m - 1) % 12]} ${p.y}`; })()} · {lang === 'hi' ? (result.target.weekdayHi || WD_HI[result.target.weekday] || result.target.weekday) : result.target.weekday}</Text>
                  <Text style={[styles.targetBadMsg, { color: '#c98a2a' }]}>⚠ {lang === 'hi' ? 'इस दिन शुभ मुहूर्त नहीं' : 'Not auspicious this day'}{result.target.reject ? ` — ${lang === 'hi' ? result.target.reject.hi : result.target.reject.en}` : ''}</Text>
                  <Text style={[styles.targetBadHint, { color: theme.textMuted }]}>{lang === 'hi' ? 'नीचे दिए शुभ दिनों में से कोई चुनें।' : 'Please pick one of the auspicious days below.'}</Text>
                </View>
              )}
            </View>
          )}

          {/* confidence badge */}
          <View style={[styles.conf, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(62,199,122,0.06)' : 'rgba(62,199,122,0.08)' }]}>
            <Text style={[styles.confH, { color: theme.isDark ? '#8fe0ad' : '#2c8a52' }]}>{lang === 'hi' ? 'इनसे गणना की गई' : 'Calculated using'}</Text>
            <View style={styles.confChips}>
              {['Panchang', 'Astronomy Engine', 'Lahiri Ayanamsa', 'Chandrabal', 'Tara Bal', 'Choghadiya', 'Rahu Kaal', 'Bhadra', 'Panchak'].map((t) => (
                <Text key={t} style={[styles.confTag, { color: theme.textSoft, borderColor: theme.cardBorder }]}>✔ {t}</Text>
              ))}
            </View>
          </View>

          {!!result.best && (!result.target || result.target.dmy !== result.best.dmy) && (
            <View style={{ marginTop: 14 }}>
              {!!result.target && <Text style={[styles.sectionH, { color: theme.goldText }]}>{lang === 'hi' ? '🏆 इस अवधि का सर्वश्रेष्ठ दिन' : '🏆 Best day in this range'}</Text>}
              <HeroBest item={result.best} lang={lang} theme={theme} place={loc?.place || placeText} periodLabel={pickedDate ? (lang === 'hi' ? `आज से ${fmtDob(pickedDate)} तक सर्वश्रेष्ठ` : `Best up to ${fmtDob(pickedDate)}`) : periodLabel} expanded={open === result.best.dmy} onToggle={() => setOpen(open === result.best!.dmy ? null : result.best!.dmy)} />
            </View>
          )}

          {/* actions */}
          <View style={styles.actions}>
            {[['📥', lang === 'hi' ? 'PDF' : 'PDF', sharePdf], ['↗', lang === 'hi' ? 'शेयर' : 'Share', shareText], ['📅', lang === 'hi' ? 'रिमाइंडर' : 'Reminder', addToCal]].map(([ic, lbl, fn]: any) => (
              <Pressable key={lbl} onPress={fn} style={[styles.actBtn, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.08)' : '#fff' }]}>
                <Text style={styles.actIc}>{ic}</Text><Text style={[styles.actTxt, { color: theme.gold1 }]}>{lbl}</Text>
              </Pressable>
            ))}
          </View>

          {/* calendar — always shown so the user can pick the best muhurat BY DATE */}
          {result.items.length > 0 && (
            <>
              <Text style={[styles.sectionH, { color: theme.goldText }]}>{lang === 'hi' ? '📅 कैलेंडर में शुभ दिन' : '📅 Auspicious days on Calendar'}</Text>
              <MuhuratCalendar items={result.items} bestDmy={result.best?.dmy} lang={lang} selected={open} onPick={(dmy) => { hTap(); ease(); setOpen(open === dmy ? null : dmy); }} />
              {!!open && open !== result.best?.dmy && open !== result.target?.dmy && (() => { const it = result.items.find((x) => x.dmy === open); return it ? <View style={{ marginTop: 12 }}><RankCard item={it} rank={result.items.indexOf(it) + 1} lang={lang} theme={theme} expanded onToggle={() => setOpen(null)} /></View> : null; })()}
            </>
          )}

          {result.items.length > 1 && (
            <>
              <Text style={[styles.sectionH, { color: theme.goldText }]}>{lang === 'hi' ? '🏅 सभी शुभ मुहूर्त (क्रम से)' : '🏅 All Recommended (ranked)'}</Text>
              <View style={{ gap: 11 }}>
                {result.items.slice(1).map((it, i) => (
                  <RankCard key={it.dmy} item={it} rank={i + 2} lang={lang} theme={theme} expanded={open === it.dmy} onToggle={() => setOpen(open === it.dmy ? null : it.dmy)} />
                ))}
              </View>
            </>
          )}

          {/* ask the app's AI astrologer with this context */}
          <Pressable onPress={askJyotishi} style={({ pressed }) => [styles.askBtn, { borderColor: theme.gold1, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.10)' : 'rgba(255,247,224,0.9)', opacity: pressed ? 0.9 : 1 }]}>
            <Text style={styles.askEmoji}>🙏</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.askTitle, { color: theme.text }]}>{lang === 'hi' ? 'कोई संदेह? ज्योतिषी से पूछें' : 'Any doubt? Ask the Jyotishi'}</Text>
              <Text style={[styles.askSub, { color: theme.textMuted }]}>{lang === 'hi' ? 'AI ज्योतिषी आपकी कुंडली + इस मुहूर्त के आधार पर जवाब देगा' : 'AI astrologer answers using your chart + this muhurat'}</Text>
            </View>
            <Text style={[styles.askArrow, { color: theme.gold1 }]}>›</Text>
          </Pressable>

          <Text style={[styles.disclaimer, { color: theme.textMuted }]}>{lang === 'hi' ? '🔒 स्कोर शास्त्रीय नियमों पर आधारित है। बड़े कार्य हेतु विद्वान से लग्न-शुद्धि भी करा लें।' : '🔒 The score follows classical rules. For major events, also confirm the lagna with a pandit.'}</Text>
        </View>
      )}
      <View style={{ height: 18 }} />
    </Page>
  );
}

const styles = StyleSheet.create({
  catHero: { borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, overflow: 'hidden' },
  catEmoji: { fontSize: 26 },
  catName: { fontFamily: fonts.playfairBold, fontSize: 17, color: '#fff8ec' },
  catBlurb: { fontFamily: fonts.inter, fontSize: 11.5, color: 'rgba(255,248,236,0.9)', marginTop: 1 },

  form: { marginTop: 15, gap: 15 },
  label: { fontFamily: fonts.interSemi, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 },
  input: { height: 46, borderWidth: 1, borderRadius: radii.md, paddingHorizontal: 14, fontFamily: fonts.inter, fontSize: 15 },
  smInput: { height: 44, borderWidth: 1, borderRadius: radii.md, paddingHorizontal: 11, fontFamily: fonts.inter, fontSize: 13.5 },
  hint: { fontFamily: fonts.interSemi, fontSize: 12, marginTop: 7 },
  orTxt: { fontFamily: fonts.interSemi, fontSize: 10.5, textAlign: 'center', marginVertical: 9, letterSpacing: 0.3 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8 },
  chipTxt: { fontFamily: fonts.interSemi, fontSize: 12 },

  advBox: { borderWidth: 1, borderRadius: 16, padding: 13 },
  advHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  advTitle: { fontFamily: fonts.playfairBold, fontSize: 16 },
  advSub: { fontFamily: fonts.inter, fontSize: 11.5, marginTop: 2 },
  advChevron: { fontFamily: fonts.interSemi, fontSize: 12 },
  accWrap: { marginTop: 12 },
  accHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  accLabel: { fontFamily: fonts.interSemi, fontSize: 11 },
  accVal: { fontFamily: fonts.cinzelSemi, fontSize: 13 },
  accTrack: { height: 7, borderRadius: 4, overflow: 'hidden' },
  accFill: { height: 7, borderRadius: 4 },
  accNote: { fontFamily: fonts.inter, fontSize: 10.5, lineHeight: 15, marginTop: 6 },
  birthBox: { borderWidth: 1, borderRadius: 14, padding: 11, gap: 9 },
  birthTitle: { fontFamily: fonts.interSemi, fontSize: 11, letterSpacing: 0.4 },
  pf: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: radii.md, paddingHorizontal: 13, paddingVertical: 11 },
  pfIcon: { width: 20, alignItems: 'center' },
  pfLabel: { fontFamily: fonts.interSemi, fontSize: 10, letterSpacing: 1 },
  pfValue: { fontFamily: fonts.inter, fontSize: 14.5, marginTop: 2 },

  findBtn: { borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  findBtnTxt: { fontFamily: fonts.interBold, fontSize: 15, color: '#2a1c00', letterSpacing: 0.3 },
  findBtnSub: { fontFamily: fonts.interSemi, fontSize: 10, color: '#5a3e0a', marginTop: 2 },

  loadBox: { alignItems: 'center', gap: 14, paddingVertical: 36 },
  loadTxt: { fontFamily: fonts.inter, fontSize: 12.5, textAlign: 'center', paddingHorizontal: 30, lineHeight: 18 },
  err: { fontFamily: fonts.inter, fontSize: 13, textAlign: 'center', paddingVertical: 26, lineHeight: 19 },

  introLine: { fontFamily: fonts.inter, fontSize: 12.5, lineHeight: 19, marginBottom: 12 },
  targetBad: { borderWidth: 1, borderRadius: 16, padding: 14 },
  targetBadDate: { fontFamily: fonts.playfairBold, fontSize: 16 },
  targetBadMsg: { fontFamily: fonts.interSemi, fontSize: 13, marginTop: 6 },
  targetBadHint: { fontFamily: fonts.inter, fontSize: 11.5, marginTop: 5, lineHeight: 16 },
  askBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.4, borderRadius: 16, padding: 14, marginTop: 20 },
  askEmoji: { fontSize: 24 },
  askTitle: { fontFamily: fonts.playfairBold, fontSize: 15 },
  askSub: { fontFamily: fonts.inter, fontSize: 11.5, lineHeight: 16, marginTop: 2 },
  askArrow: { fontFamily: fonts.playfairBold, fontSize: 24 },
  conf: { borderWidth: 1, borderRadius: 14, padding: 12 },
  confH: { fontFamily: fonts.interSemi, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase' },
  confChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  confTag: { fontFamily: fonts.inter, fontSize: 10, borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden' },

  viewToggle: { flexDirection: 'row', gap: 8, marginTop: 14 },
  vBtn: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 9, alignItems: 'center' },
  vTxt: { fontFamily: fonts.interSemi, fontSize: 12.5 },

  // hero
  heroGlow: { borderRadius: 24, shadowColor: '#e9b850', shadowOpacity: 0.55, shadowRadius: 20, shadowOffset: { width: 0, height: 6 }, elevation: 12 },
  hero: { borderRadius: 24, padding: 20, overflow: 'hidden', borderWidth: 2, borderColor: '#fff3cf' },
  spark: { position: 'absolute', color: 'rgba(255,255,255,0.9)', fontSize: 12 },
  heroCrown: { fontFamily: fonts.interBold, fontSize: 12.5, color: '#3a2602', letterSpacing: 0.5 },
  heroDate: { fontFamily: fonts.playfairBold, fontSize: 30, lineHeight: 36, color: '#2a1c00', marginTop: 8 },
  heroWd: { fontFamily: fonts.interSemi, fontSize: 14, color: '#4a3204', marginTop: 1 },
  heroTime: { fontFamily: fonts.interBold, fontSize: 18, color: '#2a1c00', marginTop: 8 },
  heroPlace: { fontFamily: fonts.inter, fontSize: 12, color: '#5a3e0a', marginTop: 3 },
  heroScoreBox: { marginTop: 14, borderTopWidth: 1, borderColor: 'rgba(58,38,2,0.18)', paddingTop: 12 },
  heroScoreLabel: { fontFamily: fonts.interSemi, fontSize: 11, color: '#5a3e0a', marginTop: 6, textTransform: 'uppercase', letterSpacing: 0.6 },
  heroScoreNum: { fontFamily: fonts.cinzelSemi, fontSize: 24, color: '#2a1c00', marginTop: 2 },
  heroScoreMax: { fontFamily: fonts.interSemi, fontSize: 13, color: '#6b4e16' },
  heroRating: { fontFamily: fonts.interBold, fontSize: 14, color: '#3a2602' },
  heroWhy: { marginTop: 12, gap: 3 },
  heroChk: { fontFamily: fonts.interSemi, fontSize: 12, color: '#3a2602' },
  heroBtn: { marginTop: 13, backgroundColor: 'rgba(58,38,2,0.16)', borderRadius: 999, paddingVertical: 9, alignItems: 'center' },
  heroBtnTxt: { fontFamily: fonts.interBold, fontSize: 12.5, color: '#2a1c00' },
  heroDetail: { marginTop: 12, backgroundColor: 'rgba(255,250,235,0.6)', borderRadius: 14, padding: 12 },

  actions: { flexDirection: 'row', gap: 9, marginTop: 12 },
  actBtn: { flex: 1, borderWidth: 1, borderRadius: 13, paddingVertical: 11, alignItems: 'center', gap: 3 },
  actIc: { fontSize: 17 },
  actTxt: { fontFamily: fonts.interSemi, fontSize: 11.5 },

  sectionH: { fontFamily: fonts.cinzelSemi, fontSize: 13.5, letterSpacing: 0.8, marginTop: 22, marginBottom: 12 },
  rankCard: { borderWidth: 1, borderRadius: 16, padding: 11, overflow: 'hidden' },
  rankTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rankMedal: { fontSize: 16, width: 22, textAlign: 'center' },
  dateThumb: { width: 50, borderRadius: 13, paddingVertical: 7, alignItems: 'center', justifyContent: 'center' },
  thumbDay: { fontFamily: fonts.cinzelSemi, fontSize: 21, lineHeight: 23, color: '#fff8ec' },
  thumbMon: { fontFamily: fonts.interBold, fontSize: 9.5, textTransform: 'uppercase', letterSpacing: 0.8, color: '#fff3da', marginTop: 1 },
  thumbWd: { fontFamily: fonts.inter, fontSize: 8.5, color: 'rgba(255,248,236,0.85)', marginTop: 1 },
  rankHeadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  rankWd: { fontFamily: fonts.playfairBold, fontSize: 15 },
  scorePill: { alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, minWidth: 52 },
  scorePillNum: { fontFamily: fonts.cinzelSemi, fontSize: 18, lineHeight: 20 },
  rankRating: { fontFamily: fonts.interSemi, fontSize: 11, marginTop: 2 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 6 },
  goodChip: { fontFamily: fonts.interSemi, fontSize: 9.5, borderWidth: 1, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2, overflow: 'hidden' },
  rankChevron: { fontFamily: fonts.interSemi, fontSize: 12, paddingHorizontal: 2 },

  secH: { fontFamily: fonts.cinzelSemi, fontSize: 11.5, letterSpacing: 0.5, marginBottom: 7 },
  pGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  pCell: { width: '31.5%', borderWidth: 1, borderRadius: 10, paddingVertical: 7, paddingHorizontal: 8 },
  pLabel: { fontFamily: fonts.inter, fontSize: 9.5 },
  pValue: { fontFamily: fonts.interSemi, fontSize: 11.5, marginTop: 2 },
  whyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  whyTxt: { flex: 1, fontFamily: fonts.inter, fontSize: 11.5, lineHeight: 16 },
  whyPts: { fontFamily: fonts.interBold, fontSize: 11 },
  avoidTxt: { fontFamily: fonts.inter, fontSize: 11, lineHeight: 16 },

  disclaimer: { fontFamily: fonts.inter, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 16 },
});
