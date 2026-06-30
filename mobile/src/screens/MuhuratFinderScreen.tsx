import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator, ScrollView, LayoutAnimation, Platform, UIManager } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Page } from '../components/Page';
import { GradientText } from '../components/GradientText';
import { BirthPlaceField } from '../components/BirthPlaceField';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radii } from '../theme/tokens';
import { useLang } from '../i18n/LanguageProvider';
import { hTap } from '../lib/haptics';
import { aSign } from '../i18n/astro';
import { naamRashi } from '../lib/naamRashi';
import { birthFromProfile } from '../lib/birth';
import { muhuratCatByKey } from '../data/muhuratCategories';
import { findMuhurat, MuhuratItem, MuhuratResult, MuhuratBirthInput, LocationSuggestion } from '../lib/api';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) UIManager.setLayoutAnimationEnabledExperimental(true);
const ease = () => LayoutAnimation.configureNext(LayoutAnimation.create(220, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity));

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MON_HI = ['जन', 'फ़र', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुल', 'अग', 'सित', 'अक्तू', 'नव', 'दिस'];
const WD_HI: Record<string, string> = { Sunday: 'रविवार', Monday: 'सोमवार', Tuesday: 'मंगलवार', Wednesday: 'बुधवार', Thursday: 'गुरुवार', Friday: 'शुक्रवार', Saturday: 'शनिवार' };
const dmyParts = (dmy: string) => { const [d, m, y] = String(dmy).split('/').map(Number); return { d, m, y }; };
const stars = (score: number) => Math.max(1, Math.min(5, Math.round(score / 20)));

function Stars({ score, size = 13, color = '#e9b850' }: { score: number; size?: number; color?: string }) {
  const n = stars(score);
  return <Text style={{ fontSize: size, color, letterSpacing: 1 }}>{'★'.repeat(n)}<Text style={{ color: color + '55' }}>{'★'.repeat(5 - n)}</Text></Text>;
}

// expandable detail block shared by hero + rank cards
function Detail({ item, lang, theme }: { item: MuhuratItem; lang: 'en' | 'hi'; theme: any }) {
  const L = (o?: { en: string; hi: string } | null) => (o ? (lang === 'hi' ? o.hi : o.en) : '—');
  const rows: { k: string; v: string; good?: boolean }[] = [
    { k: lang === 'hi' ? 'तिथि' : 'Tithi', v: lang === 'hi' ? (item.tithi.hi || item.tithi.name) : item.tithi.name },
    { k: lang === 'hi' ? 'नक्षत्र' : 'Nakshatra', v: lang === 'hi' ? (item.nakshatra.hi || item.nakshatra.name) : item.nakshatra.name },
    { k: lang === 'hi' ? 'योग' : 'Yoga', v: item.yoga ? (lang === 'hi' ? (item.yoga.hi || item.yoga.name) : item.yoga.name) : '—' },
    { k: lang === 'hi' ? 'करण' : 'Karana', v: item.karana ? (lang === 'hi' ? (item.karana.hi || item.karana.name) : item.karana.name) : '—' },
    { k: lang === 'hi' ? 'चंद्र राशि' : 'Moon Sign', v: L(item.moonSign) },
    ...(item.chandra ? [{ k: lang === 'hi' ? 'चंद्रबल' : 'Chandrabal', v: L(item.chandra.label), good: true }] : []),
    ...(item.tara ? [{ k: lang === 'hi' ? 'ताराबल' : 'Tara Bal', v: `${lang === 'hi' ? item.tara.hi : item.tara.en} · ${L(item.tara.label)}`, good: true }] : []),
    { k: lang === 'hi' ? 'चौघड़िया' : 'Choghadiya', v: item.flags.choghadiya || '—' },
    { k: lang === 'hi' ? 'अभिजीत' : 'Abhijit', v: item.time.abhijit ? `${item.time.abhijit.start}–${item.time.abhijit.end}` : '—', good: !!item.time.abhijit },
    { k: lang === 'hi' ? 'राहुकाल' : 'Rahu Kaal', v: lang === 'hi' ? 'हटाया ✓' : 'Removed ✓', good: true },
    { k: lang === 'hi' ? 'भद्रा' : 'Bhadra', v: lang === 'hi' ? 'नहीं ✓' : 'No ✓', good: true },
    { k: lang === 'hi' ? 'पंचक' : 'Panchak', v: lang === 'hi' ? 'नहीं ✓' : 'No ✓', good: true },
  ];
  return (
    <View style={styles.detailWrap}>
      <Text style={[styles.detailHead, { color: theme.gold1 }]}>{lang === 'hi' ? 'पंचांग विवरण' : 'Panchang Details'}</Text>
      <View style={styles.pGrid}>
        {rows.map((r) => (
          <View key={r.k} style={[styles.pCell, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,253,247,0.85)' }]}>
            <Text style={[styles.pLabel, { color: theme.textMuted }]}>{r.k}</Text>
            <Text style={[styles.pValue, { color: r.good ? (theme.isDark ? '#8fe0ad' : '#2c8a52') : theme.text }]} numberOfLines={1}>{r.v}</Text>
          </View>
        ))}
      </View>
      <Text style={[styles.detailHead, { color: theme.gold1, marginTop: 14 }]}>{lang === 'hi' ? 'यह मुहूर्त क्यों?' : 'Why this Muhurat?'}</Text>
      <View style={{ gap: 6, marginTop: 6 }}>
        {item.breakdown.map((bk) => (
          <View key={bk.key} style={styles.whyRow}>
            <Text style={[styles.whyTxt, { color: bk.ok ? theme.text : theme.textMuted }]}>{bk.ok ? '✓' : '•'} {lang === 'hi' ? bk.hi : bk.en}</Text>
            <Text style={[styles.whyPts, { color: bk.ok ? (theme.isDark ? '#8fe0ad' : '#2c8a52') : theme.textMuted }]}>+{bk.pts}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function HeroBest({ item, lang, theme, expanded, onToggle, place }: { item: MuhuratItem; lang: 'en' | 'hi'; theme: any; expanded: boolean; onToggle: () => void; place: string }) {
  const { d, m, y } = dmyParts(item.dmy);
  const wd = lang === 'hi' ? (item.weekdayHi || WD_HI[item.weekday] || item.weekday) : item.weekday;
  const top = item.breakdown.filter((b) => b.ok).slice(0, 6);
  return (
    <LinearGradient colors={['#fce8a8', '#e9b850', '#b87f1a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
      <Text style={styles.heroCrown}>🏆 {lang === 'hi' ? 'सर्वश्रेष्ठ मुहूर्त' : 'Best Muhurat'}</Text>
      <View style={styles.heroScoreRow}>
        <Text style={styles.heroScore}>{item.score}</Text>
        <View>
          <Text style={styles.heroScoreMax}>/ 100</Text>
          <Text style={styles.heroRating}>{lang === 'hi' ? item.rating.hi : item.rating.en}</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'flex-end' }}><Stars score={item.score} size={16} color="#3a2602" /></View>
      </View>
      <Text style={styles.heroDate}>📅 {d} {(lang === 'hi' ? MON_HI : MON)[(m - 1) % 12]} {y} · {wd}</Text>
      {!!item.time.abhijit && <Text style={styles.heroTime}>🕐 {item.time.abhijit.start} – {item.time.abhijit.end}</Text>}
      {!!place && <Text style={styles.heroPlace} numberOfLines={1}>📍 {place}</Text>}
      <View style={styles.heroWhy}>
        {top.map((b) => <Text key={b.key} style={styles.heroChk} numberOfLines={1}>✔ {lang === 'hi' ? b.hi : b.en}</Text>)}
      </View>
      <Pressable onPress={() => { hTap(); ease(); onToggle(); }} style={styles.heroBtn}>
        <Text style={styles.heroBtnTxt}>{expanded ? (lang === 'hi' ? 'बंद करें ▲' : 'Close ▲') : (lang === 'hi' ? 'पूरी जानकारी देखें ▼' : 'View full details ▼')}</Text>
      </Pressable>
      {expanded && <View style={styles.heroDetail}><Detail item={item} lang={lang} theme={{ ...theme, isDark: false, text: '#3a2602', textMuted: '#6b4e16', cardBorder: 'rgba(58,38,2,0.18)', gold1: '#7a4e08' }} /></View>}
    </LinearGradient>
  );
}

function RankCard({ item, rank, lang, theme, expanded, onToggle }: { item: MuhuratItem; rank: number; lang: 'en' | 'hi'; theme: any; expanded: boolean; onToggle: () => void }) {
  const { d, m, y } = dmyParts(item.dmy);
  const wd = lang === 'hi' ? (item.weekdayHi || WD_HI[item.weekday] || item.weekday) : item.weekday;
  const nak = lang === 'hi' ? (item.nakshatra.hi || item.nakshatra.name) : item.nakshatra.name;
  const tithi = lang === 'hi' ? (item.tithi.hi || item.tithi.name) : item.tithi.name;
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
  return (
    <View style={[styles.rankCard, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.92)' }]}>
      <Pressable onPress={() => { hTap(); ease(); onToggle(); }} style={styles.rankTop}>
        <View style={styles.rankMedal}><Text style={styles.rankMedalTxt}>{medal}</Text></View>
        <View style={[styles.dateBox, { backgroundColor: theme.isDark ? 'rgba(233,184,80,0.12)' : '#fff7e6', borderColor: theme.cardBorder }]}>
          <Text style={[styles.dateDay, { color: theme.goldText }]}>{d}</Text>
          <Text style={[styles.dateMon, { color: theme.gold2 }]}>{(lang === 'hi' ? MON_HI : MON)[(m - 1) % 12]}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.rankHeadRow}>
            <Text style={[styles.rankWd, { color: theme.text }]}>{wd}</Text>
            <Text style={[styles.rankScore, { color: theme.gold1 }]}>{item.score}</Text>
          </View>
          <Stars score={item.score} size={12} />
          <View style={styles.chipRow}>
            <View style={[styles.miniChip, { borderColor: theme.cardBorder }]}><Text style={[styles.miniChipTxt, { color: theme.gold2 }]}>{nak}</Text></View>
            <View style={[styles.miniChip, { borderColor: theme.cardBorder }]}><Text style={[styles.miniChipTxt, { color: theme.gold2 }]}>{tithi}</Text></View>
            {!!item.time.abhijit && <Text style={[styles.rankTime, { color: theme.gold1 }]}>🕐 {item.time.abhijit.start}</Text>}
          </View>
        </View>
        <Text style={[styles.rankChevron, { color: theme.gold2 }]}>{expanded ? '▲' : '▼'}</Text>
      </Pressable>
      {expanded && <Detail item={item} lang={lang} theme={theme} />}
    </View>
  );
}

// reusable birth inputs (DOB / time / place)
function BirthInputs({ titleEn, titleHi, val, onChange, theme, lang }: any) {
  return (
    <View style={[styles.birthBox, { borderColor: theme.cardBorder }]}>
      <Text style={[styles.birthTitle, { color: theme.gold2 }]}>{lang === 'hi' ? titleHi : titleEn}</Text>
      <View style={styles.birthRow}>
        <TextInput value={val.dob} onChangeText={(t: string) => onChange({ ...val, dob: t })} placeholder={lang === 'hi' ? 'जन्म तिथि DD/MM/YYYY' : 'DOB DD/MM/YYYY'} placeholderTextColor={theme.textMuted} keyboardType="numbers-and-punctuation" style={[styles.smInput, { flex: 1.4, borderColor: theme.cardBorder, color: theme.text, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.4)' : '#fff' }]} />
        <TextInput value={val.time} onChangeText={(t: string) => onChange({ ...val, time: t })} placeholder={lang === 'hi' ? 'समय HH:MM' : 'Time HH:MM'} placeholderTextColor={theme.textMuted} keyboardType="numbers-and-punctuation" style={[styles.smInput, { flex: 1, borderColor: theme.cardBorder, color: theme.text, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.4)' : '#fff' }]} />
      </View>
      <BirthPlaceField label={lang === 'hi' ? 'जन्म स्थान' : 'Birth place'} value={val.placeText || ''} onChangeText={(t: string) => onChange({ ...val, placeText: t })} onSelect={(it: LocationSuggestion | null) => onChange({ ...val, loc: it ? { place: it.description, lat: it.lat ?? undefined, lng: it.lng ?? undefined } : null })} placeholder={lang === 'hi' ? 'शहर / गाँव' : 'City / village'} />
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
  const [monthIdx, setMonthIdx] = useState(0);
  const [scope, setScope] = useState<3 | 6>(3);
  const [advOpen, setAdvOpen] = useState(false);
  const [birth1, setBirth1] = useState<any>({ dob: '', time: '', placeText: '', loc: null });
  const [birth2, setBirth2] = useState<any>({ dob: '', time: '', placeText: '', loc: null });
  const [result, setResult] = useState<MuhuratResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    birthFromProfile().then((b: any) => {
      if (b?.place) { setPlaceText(b.place); setLoc({ place: b.place, lat: b.lat, lng: b.lng }); }
      if (b?.dob && b?.place) setBirth1({ dob: String(b.dob).replace(/-/g, '/'), time: b.tob || '', placeText: b.place, loc: { place: b.place, lat: b.lat, lng: b.lng } });
    }).catch(() => {});
    if (req.birth === 'required') setAdvOpen(true);
  }, []);

  const rashi = useMemo(() => naamRashi(name), [name]);
  const months = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 10 }).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      return { idx: i, month: d.getMonth() + 1, year: d.getFullYear(), label: `${(lang === 'hi' ? MON_HI : MON)[d.getMonth()]} ${d.getFullYear()}` };
    });
  }, [lang]);

  const birthPayload = (bv: any): MuhuratBirthInput | null => {
    if (!bv?.dob) return null;
    return { date: bv.dob, time: bv.time || undefined, place: bv.loc?.place || bv.placeText || undefined, lat: bv.loc?.lat, lng: bv.loc?.lng };
  };

  const onFind = async () => {
    hTap(); setError(null); setResult(null); setOpen(null); setLoading(true);
    const sel = months[monthIdx];
    try {
      const res = await findMuhurat({
        category: categoryKey, month: sel.month, year: sel.year, months: scope,
        place: loc?.place || placeText || undefined, lat: loc?.lat, lng: loc?.lng,
        nameRashi: req.name !== 'none' ? rashi : null,
        birth: birthPayload(birth1),
        birth2: req.couple ? birthPayload(birth2) : null,
      });
      setResult(res);
      if (!res.items.length) setError(lang === 'hi' ? 'इस अवधि में कोई शुभ मुहूर्त नहीं मिला — आगे का महीना या “पूरे साल” चुनें।' : 'No auspicious muhurat in this window — try a later month or “whole year”.');
    } catch {
      setError(lang === 'hi' ? 'मुहूर्त गणना अभी नहीं हो पाई — इंटरनेट जाँचकर पुनः प्रयास करें।' : 'Could not compute muhurat — check internet and retry.');
    } finally { setLoading(false); }
  };

  return (
    <Page title={lang === 'hi' ? (cat?.name.hi || 'मुहूर्त') : (cat?.name.en || 'Muhurat')} onBack={() => { hTap(); navigation.goBack(); }}>
      <LinearGradient colors={cat?.colors || ['#eab94f', '#9f6b16']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.catHero}>
        <Text style={styles.catEmoji}>{cat?.emoji || '🕉'}</Text>
        <Text style={styles.catName}>{lang === 'hi' ? cat?.name.hi : cat?.name.en}</Text>
        <Text style={styles.catBlurb}>{lang === 'hi' ? cat?.blurb.hi : cat?.blurb.en}</Text>
      </LinearGradient>

      {/* ── BASIC form ── */}
      <View style={styles.form}>
        <View>
          <BirthPlaceField label={lang === 'hi' ? 'स्थान (कहाँ कार्य होगा) *' : 'Location (where the event is) *'} value={placeText} onChangeText={setPlaceText}
            onSelect={(it: LocationSuggestion | null) => setLoc(it ? { place: it.description, lat: it.lat ?? undefined, lng: it.lng ?? undefined } : null)}
            placeholder={lang === 'hi' ? 'शहर / गाँव' : 'City / village'} />
        </View>

        <View>
          <Text style={[styles.label, { color: theme.gold2 }]}>{lang === 'hi' ? 'किस महीने से *' : 'Starting month *'}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
            {months.map((mo) => {
              const on = monthIdx === mo.idx;
              return (
                <Pressable key={mo.idx} onPress={() => { hTap(); setMonthIdx(mo.idx); }} style={[styles.chip, { borderColor: on ? theme.gold1 : theme.cardBorder, backgroundColor: on ? theme.gold1 : (theme.isDark ? 'rgba(233,184,80,0.08)' : '#fff') }]}>
                  <Text style={[styles.chipTxt, { color: on ? '#1a1206' : theme.gold1 }]}>{mo.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View>
          <Text style={[styles.label, { color: theme.gold2 }]}>{lang === 'hi' ? 'खोज सीमा' : 'Search range'}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {([[3, lang === 'hi' ? '3 महीने' : '3 months'], [6, lang === 'hi' ? 'पूरे साल (6 माह)' : 'Whole year (6 mo)']] as [3 | 6, string][]).map(([v, lbl]) => {
              const on = scope === v;
              return (
                <Pressable key={v} onPress={() => { hTap(); setScope(v); }} style={[styles.scopeChip, { borderColor: on ? theme.gold1 : theme.cardBorder, backgroundColor: on ? (theme.isDark ? 'rgba(233,184,80,0.16)' : 'rgba(255,247,224,0.95)') : 'transparent' }]}>
                  <Text style={[styles.scopeTxt, { color: on ? theme.gold1 : theme.textMuted }]}>{lbl}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── ADVANCED (collapsible) ── */}
        {(req.name !== 'none' || req.birth !== 'none') && (
          <View style={[styles.advBox, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.05)' : 'rgba(255,250,240,0.7)' }]}>
            <Pressable onPress={() => { hTap(); ease(); setAdvOpen((v) => !v); }} style={styles.advHead}>
              <Text style={[styles.advTitle, { color: theme.gold1 }]}>⚙ {lang === 'hi' ? 'अधिक सटीकता (वैकल्पिक)' : 'Advanced accuracy (optional)'}</Text>
              <Text style={[styles.advChevron, { color: theme.gold2 }]}>{advOpen ? '▲' : '▼'}</Text>
            </Pressable>
            {advOpen && (
              <View style={{ gap: 14, marginTop: 12 }}>
                {req.name !== 'none' && (
                  <View>
                    <Text style={[styles.label, { color: theme.gold2 }]}>{lang === 'hi' ? 'नाम (चंद्रबल हेतु)' : 'Name (for Chandrabal)'}</Text>
                    <TextInput value={name} onChangeText={setName} placeholder={lang === 'hi' ? 'मुखिया / सदस्य का नाम' : 'Head / member name'} placeholderTextColor={theme.textMuted} style={[styles.input, { borderColor: theme.cardBorder, color: theme.text, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.4)' : '#fff' }]} />
                    {!!name.trim() && <Text style={[styles.hint, { color: rashi ? theme.gold1 : theme.textMuted }]}>{rashi ? `${lang === 'hi' ? 'नाम राशि' : 'Naam Rashi'}: ${aSign(rashi, lang)} 🌙` : (lang === 'hi' ? 'इस अक्षर की राशि नहीं मिली' : 'Could not map this letter')}</Text>}
                  </View>
                )}
                {req.birth !== 'none' && (
                  <BirthInputs titleEn={req.couple ? 'Groom / Person 1 birth' : (req.birth === 'required' ? 'Birth details (required for best accuracy)' : 'Birth details (optional)')} titleHi={req.couple ? 'वर / व्यक्ति 1 जन्म' : (req.birth === 'required' ? 'जन्म विवरण (सटीकता हेतु)' : 'जन्म विवरण (वैकल्पिक)')} val={birth1} onChange={setBirth1} theme={theme} lang={lang} />
                )}
                {req.couple && (
                  <BirthInputs titleEn="Bride / Person 2 birth" titleHi="वधू / व्यक्ति 2 जन्म" val={birth2} onChange={setBirth2} theme={theme} lang={lang} />
                )}
              </View>
            )}
          </View>
        )}

        <Pressable onPress={loading ? undefined : onFind} style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1, marginTop: 2 }]}>
          <LinearGradient colors={['#fce8a8', '#e9b850', '#b87f1a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.findBtn}>
            <Text style={styles.findBtnTxt}>{loading ? (lang === 'hi' ? 'गणना हो रही है…' : 'Calculating…') : (lang === 'hi' ? '🔍 शुभ मुहूर्त खोजें' : '🔍 Find Best Muhurat')}</Text>
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

      {!!result && !loading && !!result.best && (
        <View style={{ marginTop: 18 }}>
          <HeroBest item={result.best} lang={lang} theme={theme} place={loc?.place || placeText} expanded={open === result.best.dmy} onToggle={() => setOpen(open === result.best!.dmy ? null : result.best!.dmy)} />

          {result.items.length > 1 && (
            <>
              <Text style={[styles.sectionH, { color: theme.goldText }]}>{lang === 'hi' ? '🏅 अन्य शुभ मुहूर्त' : '🏅 Top Recommended'}</Text>
              <View style={{ gap: 11 }}>
                {result.items.slice(1).map((it, i) => (
                  <RankCard key={it.dmy} item={it} rank={i + 2} lang={lang} theme={theme} expanded={open === it.dmy} onToggle={() => setOpen(open === it.dmy ? null : it.dmy)} />
                ))}
              </View>
            </>
          )}

          <Text style={[styles.method, { color: theme.textMuted }]}>{lang === 'hi' ? result.method.hi : result.method.en}</Text>
          <Text style={[styles.disclaimer, { color: theme.textMuted }]}>
            {lang === 'hi' ? '🔒 स्कोर चुने गए शास्त्रीय नियमों पर आधारित है। बड़े कार्य हेतु किसी विद्वान से लग्न-शुद्धि भी करा लें।' : '🔒 The score follows classical rules. For major events, also confirm the lagna with a learned pandit.'}
          </Text>
        </View>
      )}
      <View style={{ height: 18 }} />
    </Page>
  );
}

const styles = StyleSheet.create({
  catHero: { borderRadius: 20, padding: 16, overflow: 'hidden', alignItems: 'center' },
  catEmoji: { fontSize: 38 },
  catName: { fontFamily: fonts.playfairBold, fontSize: 21, color: '#fff8ec', marginTop: 5, textAlign: 'center' },
  catBlurb: { fontFamily: fonts.inter, fontSize: 12, color: 'rgba(255,248,236,0.9)', marginTop: 2, textAlign: 'center' },

  form: { marginTop: 16, gap: 15 },
  label: { fontFamily: fonts.interSemi, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 },
  input: { height: 46, borderWidth: 1, borderRadius: radii.md, paddingHorizontal: 14, fontFamily: fonts.inter, fontSize: 15 },
  smInput: { height: 44, borderWidth: 1, borderRadius: radii.md, paddingHorizontal: 11, fontFamily: fonts.inter, fontSize: 13.5 },
  hint: { fontFamily: fonts.interSemi, fontSize: 12, marginTop: 7 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8 },
  chipTxt: { fontFamily: fonts.interSemi, fontSize: 12 },
  scopeChip: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  scopeTxt: { fontFamily: fonts.interSemi, fontSize: 12 },

  advBox: { borderWidth: 1, borderRadius: 16, padding: 13 },
  advHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  advTitle: { fontFamily: fonts.interSemi, fontSize: 13 },
  advChevron: { fontFamily: fonts.interSemi, fontSize: 12 },
  birthBox: { borderWidth: 1, borderRadius: 14, padding: 11, gap: 9 },
  birthTitle: { fontFamily: fonts.interSemi, fontSize: 11, letterSpacing: 0.4 },
  birthRow: { flexDirection: 'row', gap: 8 },

  findBtn: { borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  findBtnTxt: { fontFamily: fonts.interBold, fontSize: 15, color: '#2a1c00', letterSpacing: 0.3 },

  loadBox: { alignItems: 'center', gap: 14, paddingVertical: 36 },
  loadTxt: { fontFamily: fonts.inter, fontSize: 12.5, textAlign: 'center', paddingHorizontal: 30, lineHeight: 18 },
  err: { fontFamily: fonts.inter, fontSize: 13, textAlign: 'center', paddingVertical: 26, lineHeight: 19 },

  // hero best
  hero: { borderRadius: 22, padding: 18, overflow: 'hidden' },
  heroCrown: { fontFamily: fonts.interBold, fontSize: 13, color: '#3a2602', letterSpacing: 0.5 },
  heroScoreRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: 8 },
  heroScore: { fontFamily: fonts.cinzelSemi, fontSize: 46, lineHeight: 48, color: '#2a1c00' },
  heroScoreMax: { fontFamily: fonts.interSemi, fontSize: 12, color: '#5a3e0a' },
  heroRating: { fontFamily: fonts.interBold, fontSize: 13, color: '#3a2602' },
  heroDate: { fontFamily: fonts.playfairBold, fontSize: 17, color: '#2a1c00', marginTop: 10 },
  heroTime: { fontFamily: fonts.interBold, fontSize: 15, color: '#3a2602', marginTop: 4 },
  heroPlace: { fontFamily: fonts.inter, fontSize: 12, color: '#5a3e0a', marginTop: 3 },
  heroWhy: { marginTop: 11, gap: 3 },
  heroChk: { fontFamily: fonts.interSemi, fontSize: 12, color: '#3a2602' },
  heroBtn: { marginTop: 13, backgroundColor: 'rgba(58,38,2,0.14)', borderRadius: 999, paddingVertical: 9, alignItems: 'center' },
  heroBtnTxt: { fontFamily: fonts.interBold, fontSize: 12.5, color: '#2a1c00' },
  heroDetail: { marginTop: 12, backgroundColor: 'rgba(255,250,235,0.55)', borderRadius: 14, padding: 12 },

  sectionH: { fontFamily: fonts.cinzelSemi, fontSize: 13.5, letterSpacing: 0.8, marginTop: 22, marginBottom: 12 },
  rankCard: { borderWidth: 1, borderRadius: 16, padding: 11, overflow: 'hidden' },
  rankTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rankMedal: { width: 26, alignItems: 'center' },
  rankMedalTxt: { fontSize: 16, fontFamily: fonts.interBold, color: '#9a7016' },
  dateBox: { width: 50, borderWidth: 1, borderRadius: 12, paddingVertical: 6, alignItems: 'center' },
  dateDay: { fontFamily: fonts.cinzelSemi, fontSize: 20, lineHeight: 22 },
  dateMon: { fontFamily: fonts.interBold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8 },
  rankHeadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rankWd: { fontFamily: fonts.playfairBold, fontSize: 15 },
  rankScore: { fontFamily: fonts.cinzelSemi, fontSize: 18 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 5 },
  miniChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2.5 },
  miniChipTxt: { fontFamily: fonts.interSemi, fontSize: 10 },
  rankTime: { fontFamily: fonts.interSemi, fontSize: 11 },
  rankChevron: { fontFamily: fonts.interSemi, fontSize: 12, paddingHorizontal: 2 },

  detailWrap: { marginTop: 12 },
  detailHead: { fontFamily: fonts.cinzelSemi, fontSize: 12, letterSpacing: 0.6, marginBottom: 8 },
  pGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  pCell: { width: '31.5%', borderWidth: 1, borderRadius: 10, paddingVertical: 7, paddingHorizontal: 8 },
  pLabel: { fontFamily: fonts.inter, fontSize: 9.5 },
  pValue: { fontFamily: fonts.interSemi, fontSize: 11.5, marginTop: 2 },
  whyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  whyTxt: { flex: 1, fontFamily: fonts.inter, fontSize: 11.5, lineHeight: 16 },
  whyPts: { fontFamily: fonts.interBold, fontSize: 11 },

  method: { fontFamily: fonts.inter, fontSize: 11, lineHeight: 16, fontStyle: 'italic', marginTop: 16 },
  disclaimer: { fontFamily: fonts.inter, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 12 },
});
