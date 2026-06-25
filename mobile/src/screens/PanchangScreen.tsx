import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, TextInput } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Page } from '../components/Page';
import { GradientText } from '../components/GradientText';
import { useTheme } from '../theme/ThemeProvider';
import { Theme, fonts, radii } from '../theme/tokens';
import { hTap } from '../lib/haptics';
import { useT, useLang } from '../i18n/LanguageProvider';
import { aSign } from '../i18n/astro';
import { birthFromProfile } from '../lib/birth';
import { getPanchang, getPanchangFestivals, searchPanchangFestivals, getPanchangFestivalDetail, PanchangResponse, PanchangPeriod, AngaEnd, PanchangFestivalDay, PanchangFestivalDetail } from '../lib/api';

const DEFAULT_PLACE = 'Jaipur';
type FestivalRow = {
  date: string;
  weekday: string;
  weekdayHi?: string;
  tithi: PanchangFestivalDay['tithi'];
  obs: PanchangFestivalDay['observances'][number];
};
const pad = (n: number) => (n < 10 ? '0' : '') + n;
const toDMY = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MON_HI = ['जन', 'फ़र', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुल', 'अग', 'सित', 'अक्तू', 'नव', 'दिस'];
const DEV = '०१२३४५६७८९';
const toDev = (n: number | string) => String(n).replace(/[0-9]/g, (d) => DEV[+d]);
const safeText = (value: unknown): string => {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(safeText).filter(Boolean).join('\n');
  if (typeof value === 'object') {
    const obj = value as { recommended?: unknown[]; auspicious?: unknown[]; avoid?: unknown[]; inauspicious?: unknown[]; name?: unknown; start?: unknown; end?: unknown; advice?: unknown; note?: unknown };
    const row = [obj.name, [obj.start, obj.end].filter(Boolean).join(' - '), obj.advice || obj.note].map(safeText).filter(Boolean).join(' | ');
    if (row) return row;
    const lines: string[] = [];
    if (Array.isArray(obj.recommended)) lines.push(safeText(obj.recommended));
    if (Array.isArray(obj.auspicious)) lines.push(safeText(obj.auspicious));
    if (Array.isArray(obj.avoid)) lines.push(safeText(obj.avoid));
    if (Array.isArray(obj.inauspicious)) lines.push(safeText(obj.inauspicious));
    return lines.filter(Boolean).join('\n');
  }
  return '';
};

// do's / don'ts per period (compiled from classical convention — bilingual)
const GUIDE: Record<string, { en: string; hi: string; bad?: boolean }> = {
  'Rahu Kaal': { bad: true, en: 'Avoid new beginnings, travel, marriage, housewarming & important work.', hi: 'नया कार्य, यात्रा, विवाह, गृह-प्रवेश व महत्वपूर्ण काम न करें।' },
  'Yamaganda': { bad: true, en: 'Avoid auspicious work — ventures begun now tend to fail.', hi: 'शुभ कार्य न करें — इस समय शुरू किए काम असफल होते हैं।' },
  'Gulika Kaal': { bad: true, en: 'Avoid loans & funerals; buying property is considered favourable.', hi: 'ऋण व अंत्येष्टि से बचें; संपत्ति/घर खरीदना शुभ माना जाता है।' },
  'Abhijit Muhurat': { en: 'Most auspicious window — good for ANY work (except on Wednesday).', hi: 'सबसे शुभ समय — किसी भी कार्य के लिए श्रेष्ठ (बुधवार को छोड़कर)।' },
  'Brahma Muhurat': { en: 'Best for meditation, yoga, prayer, study & spiritual practice.', hi: 'ध्यान, योग, पूजा, अध्ययन व साधना के लिए उत्तम।' },
};

const Arrow = ({ dir, c }: { dir: 'l' | 'r'; c: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
    <Path d={dir === 'l' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
  </Svg>
);

function endLabel(e: AngaEnd | undefined, lang: 'en' | 'hi') {
  if (!e) return '';
  const nd = e.nextDay ? (lang === 'hi' ? ' (अगले दिन)' : ' (next day)') : '';
  return lang === 'hi' ? `${e.hm}${nd} तक` : `upto ${e.hm}${nd}`;
}

function AngCard({ label, value, num, sub, end, theme, lang }: { label: string; value: string; num?: number; sub?: string; end?: AngaEnd; theme: Theme; lang: 'en' | 'hi' }) {
  return (
    <View style={[styles.ang, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.85)' }]}>
      <Text style={[styles.angLabel, { color: theme.gold2 }]}>{label}{num ? `  ${lang === 'hi' ? toDev(num) : num}` : ''}</Text>
      <Text style={[styles.angValue, { color: theme.text }]} numberOfLines={1}>{value || '—'}</Text>
      {!!sub && <Text style={[styles.angSub, { color: theme.textMuted }]} numberOfLines={1}>{sub}</Text>}
      {!!end && <Text style={[styles.angEnd, { color: theme.gold1 }]} numberOfLines={1}>{endLabel(end, lang)}</Text>}
    </View>
  );
}

function PeriodRow({ p, color, theme, lang }: { p: PanchangPeriod; color: string; theme: Theme; lang: 'en' | 'hi' }) {
  const g = GUIDE[p.name];
  return (
    <View style={[styles.period, { borderColor: theme.cardBorder }]}>
      <View style={styles.periodHead}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={[styles.periodName, { color: theme.text }]}>{p.name}</Text>
        <Text style={[styles.periodTime, { color: theme.textSoft }]}>{p.start} – {p.end}</Text>
      </View>
      {!!g && <Text style={[styles.periodGuide, { color: theme.textMuted }]}>{g.bad ? '⛔ ' : '✓ '}{lang === 'hi' ? g.hi : g.en}</Text>}
    </View>
  );
}

function TimingTile({ label, value, sub, theme }: { label: string; value: string; sub?: string; theme: Theme }) {
  return (
    <View style={[styles.timeTile, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.025)' : 'rgba(255,253,247,0.86)' }]}>
      <Text style={[styles.timeLabel, { color: theme.textMuted }]} numberOfLines={1}>{label}</Text>
      <Text style={[styles.timeValue, { color: theme.text }]} numberOfLines={1}>{value}</Text>
      {!!sub && <Text style={[styles.timeSub, { color: theme.gold2 }]} numberOfLines={1}>{sub}</Text>}
    </View>
  );
}

// Extract a clean day + 3-letter month from whatever date format the festival API returns.
function festDateParts(s: string): { day: string; mon: string } {
  const str = String(s || '').trim();
  let m = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);            // YYYY-MM-DD
  if (m) return { day: String(+m[3]), mon: MON[+m[2] - 1] || '' };
  m = str.match(/^(\d{1,2})[\/.](\d{1,2})[\/.](\d{2,4})/);      // DD/MM/YYYY
  if (m) return { day: String(+m[1]), mon: MON[+m[2] - 1] || '' };
  m = str.match(/^(\d{1,2})\s+([A-Za-z]{3,})/);                 // DD Mon YYYY
  if (m) return { day: String(+m[1]), mon: m[2].slice(0, 3) };
  return { day: str.slice(0, 2), mon: '' };
}

// Beautiful gradient thumbnail for each festival card (replaces the blank date badge).
function FestivalThumb({ row, lang }: { row: FestivalRow; lang: 'en' | 'hi' }) {
  const { day, mon } = festDateParts(row.date);
  const caution = row.obs.type === 'caution';
  const major = row.obs.importance === 'major';
  const colors = (caution ? ['#e8836f', '#a8412f'] : major ? ['#eab94f', '#9f6b16'] : ['#c99a52', '#6e5326']) as [string, string];
  return (
    <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.thumb}>
      <Text style={styles.thumbGlyph}>🪔</Text>
      <Text style={styles.thumbDay}>{day}</Text>
      {!!mon && <Text style={styles.thumbMon}>{mon}</Text>}
      <Text style={styles.thumbWeek} numberOfLines={1}>{lang === 'hi' ? (row.weekdayHi || row.weekday) : row.weekday}</Text>
    </LinearGradient>
  );
}

// Festival detail / AI guide — rendered INLINE right below the clicked card.
function FestivalDetail({ detail, selected, mode, error, theme, lang }: { detail: PanchangFestivalDetail | null; selected: FestivalRow; mode: 'details' | 'ai'; error: string | null; theme: Theme; lang: 'en' | 'hi' }) {
  const L = (o?: { en: string; hi: string } | null) => (o ? (lang === 'hi' ? o.hi : o.en) : '');
  return (
    <View style={[styles.detailBox, { borderColor: theme.gold2 + '66', backgroundColor: theme.isDark ? 'rgba(0,0,0,0.16)' : 'rgba(255,255,255,0.55)' }]}>
      <View style={styles.detailHero}>
        <View style={[styles.detailMark, { borderColor: theme.gold2 + '66', backgroundColor: 'rgba(214,160,59,0.12)' }]}>
          <Text style={[styles.detailMarkText, { color: theme.gold1 }]}>{mode === 'ai' && detail?.ai ? 'AI' : 'Om'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.detailKicker, { color: theme.gold2 }]}>{selected.date} · {lang === 'hi' ? (selected.weekdayHi || selected.weekday) : selected.weekday}</Text>
          <Text style={[styles.detailTitle, { color: theme.text }]}>{detail?.title || L(selected.obs.name)}</Text>
        </View>
      </View>
      <Text style={[styles.detailLead, { color: theme.textMuted }]}>{safeText(detail?.ai?.summary) || (detail?.catalog?.guidance ? L(detail.catalog.guidance) : L(selected.obs.guidance))}</Text>
      {!!error && (
        <View style={[styles.detailWarn, { borderColor: '#e0a92e66', backgroundColor: 'rgba(224,169,46,0.11)' }]}>
          <Text style={[styles.detailWarnText, { color: theme.textMuted }]}>{error}</Text>
        </View>
      )}
      {!!detail && (
        <View style={styles.metaGrid}>
          {[
            { label: lang === 'hi' ? 'तिथि' : 'Tithi', value: [detail.panchang?.tithi, detail.panchang?.paksha].filter(Boolean).join(' · ') },
            { label: lang === 'hi' ? 'नक्षत्र' : 'Nakshatra', value: detail.panchang?.nakshatra },
            { label: lang === 'hi' ? 'सूर्योदय' : 'Sunrise', value: detail.panchang?.sunrise },
            { label: lang === 'hi' ? 'सूर्यास्त' : 'Sunset', value: detail.panchang?.sunset },
          ].filter((x) => !!x.value).map((x) => (
            <View key={x.label} style={[styles.metaPill, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.025)' : 'rgba(255,253,247,0.76)' }]}>
              <Text style={[styles.metaLabel, { color: theme.textMuted }]}>{x.label}</Text>
              <Text style={[styles.metaValue, { color: theme.text }]} numberOfLines={1}>{x.value}</Text>
            </View>
          ))}
        </View>
      )}
      {!!detail?.catalog?.why && (
        <View style={styles.detailSection}>
          <Text style={[styles.detailSub, { color: theme.gold1 }]}>{lang === 'hi' ? 'क्यों मनाया जाता है' : 'Why it matters'}</Text>
          <Text style={[styles.obsText, { color: theme.textMuted }]}>{L(detail.catalog.why)}</Text>
        </View>
      )}
      {!!(detail?.recommendedMuhurat || []).length && (
        <View style={styles.detailSection}>
          <Text style={[styles.detailSub, { color: theme.gold1 }]}>{lang === 'hi' ? 'शुभ समय' : 'Muhurat'}</Text>
          <View style={{ gap: 7 }}>
            {detail!.recommendedMuhurat.slice(0, 4).map((m) => (
              <View key={`${m.name}-${m.start}`} style={[styles.muhuratPill, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.018)' : 'rgba(255,255,255,0.44)' }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.periodName, { color: theme.text }]}>{m.name}</Text>
                  {!!m.advice && <Text style={[styles.obsText, { color: theme.textMuted }]} numberOfLines={2}>{m.advice}</Text>}
                </View>
                <Text style={[styles.periodTime, { color: theme.gold2 }]}>{m.start} - {m.end}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      {!!detail?.catalog?.samagri?.length && (
        <View style={styles.detailSection}>
          <Text style={[styles.detailSub, { color: theme.gold1 }]}>{lang === 'hi' ? 'पूजा सामग्री' : 'Puja Samagri'}</Text>
          <View style={styles.chipWrap}>
            {detail.catalog.samagri.slice(0, 10).map((x) => <Text key={x} style={[styles.infoChip, { color: theme.text, borderColor: theme.cardBorder }]}>{x}</Text>)}
          </View>
        </View>
      )}
      {!!(detail?.doList || []).length && (
        <View style={styles.detailCols}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.detailSub, { color: '#3ec77a' }]}>{lang === 'hi' ? 'करें' : 'Do'}</Text>
            {detail!.doList.slice(0, 3).map((x) => <Text key={x} style={[styles.obsText, { color: theme.textMuted }]}>• {x}</Text>)}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.detailSub, { color: '#e06a5a' }]}>{lang === 'hi' ? 'न करें' : 'Avoid'}</Text>
            {detail!.avoidList.slice(0, 3).map((x) => <Text key={x} style={[styles.obsText, { color: theme.textMuted }]}>• {x}</Text>)}
          </View>
        </View>
      )}
      {!!detail?.catalog?.steps?.length && (
        <View style={styles.detailSection}>
          <Text style={[styles.detailSub, { color: theme.gold1 }]}>{lang === 'hi' ? 'कैसे करें' : 'How to Perform'}</Text>
          {detail.catalog.steps.slice(0, 6).map((x, i) => <Text key={x} style={[styles.obsText, { color: theme.textMuted }]}>{i + 1}. {x}</Text>)}
        </View>
      )}
      {!!detail?.ai?.ritualSteps?.length && (
        <View style={styles.detailSection}>
          <Text style={[styles.detailSub, { color: theme.gold1 }]}>{lang === 'hi' ? 'AI पूजा गाइड' : 'AI Puja Guide'}</Text>
          {detail.ai.ritualSteps.slice(0, 5).map((x, i) => <Text key={`${safeText(x)}-${i}`} style={[styles.obsText, { color: theme.textMuted }]}>{i + 1}. {safeText(x)}</Text>)}
        </View>
      )}
      {!!detail?.catalog?.mantras?.length && (
        <View style={styles.detailSection}>
          <Text style={[styles.detailSub, { color: theme.gold1 }]}>{lang === 'hi' ? 'मंत्र' : 'Mantras'}</Text>
          {detail.catalog.mantras.map((m) => <Text key={m.en} style={[styles.mantraText, { color: theme.text }]}>{lang === 'hi' ? m.hi : m.en}</Text>)}
        </View>
      )}
      {!!detail?.catalog?.aarti && (
        <View style={styles.detailSection}>
          <Text style={[styles.detailSub, { color: theme.gold1 }]}>{lang === 'hi' ? 'आरती' : 'Aarti'}</Text>
          <Text style={[styles.obsText, { color: theme.textMuted }]}>{L(detail.catalog.aarti)}</Text>
        </View>
      )}
      {!!safeText(detail?.ai?.muhuratAdvice) && (
        <View style={[styles.detailWarn, { borderColor: theme.gold2 + '55', backgroundColor: 'rgba(214,160,59,0.09)' }]}>
          <Text style={[styles.detailWarnText, { color: theme.textMuted }]}>{safeText(detail?.ai?.muhuratAdvice)}</Text>
        </View>
      )}
      {!!detail?.note && <Text style={[styles.detailNote, { color: theme.textMuted }]}>{detail.note}</Text>}
    </View>
  );
}

export function PanchangScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const t = useT();
  const [place, setPlace] = useState<string>(DEFAULT_PLACE);
  const [date, setDate] = useState<Date>(new Date());
  const [data, setData] = useState<PanchangResponse | null>(null);
  const [festivals, setFestivals] = useState<PanchangFestivalDay[]>([]);
  const [festivalQuery, setFestivalQuery] = useState('');
  const [remoteFestivals, setRemoteFestivals] = useState<PanchangFestivalDay[]>([]);
  const [searchingFestival, setSearchingFestival] = useState(false);
  const [selectedFestival, setSelectedFestival] = useState<FestivalRow | null>(null);
  const [festivalDetail, setFestivalDetail] = useState<PanchangFestivalDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailMode, setDetailMode] = useState<'details' | 'ai'>('details');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(false);
  const detailRequestRef = useRef(0);

  useEffect(() => { birthFromProfile().then((b: any) => { if (b?.place) setPlace(b.place); }).catch(() => {}); }, []);

  const load = useCallback((d: Date, pl: string) => {
    let on = true;
    setLoading(true); setErr(false);
    setFestivals([]);
    setRemoteFestivals([]);
    setSelectedFestival(null);
    setFestivalDetail(null);
    setDetailError(null);
    setDetailMode('details');
    getPanchang({ place: pl, date: toDMY(d), tz: '+05:30' })
      .then((r) => { if (on) { setData(r); setLoading(false); } })
      .catch(() => { if (on) { setErr(true); setLoading(false); } });
    getPanchangFestivals({ place: pl, date: toDMY(d), tz: '+05:30', days: 8 })
      .then((r) => { if (on) setFestivals(r.items || []); })
      .catch(() => {});
    return () => { on = false; };
  }, []);

  useEffect(() => load(date, place), [date, place, load]);

  useEffect(() => {
    const q = festivalQuery.trim();
    if (q.length < 2) {
      setRemoteFestivals([]);
      setSearchingFestival(false);
      return;
    }
    let on = true;
    setSearchingFestival(true);
    const id = setTimeout(() => {
      searchPanchangFestivals({ place, date: toDMY(date), tz: '+05:30', query: q, years: 2 })
        .then((r) => { if (on) setRemoteFestivals(r.items || []); })
        .catch(() => { if (on) setRemoteFestivals([]); })
        .finally(() => { if (on) setSearchingFestival(false); });
    }, 450);
    return () => { on = false; clearTimeout(id); };
  }, [festivalQuery, place, date]);

  const shift = (days: number) => { hTap(); const d = new Date(date); d.setDate(d.getDate() + days); setDate(d); };
  const today = () => { hTap(); setDate(new Date()); };
  const isToday = toDMY(date) === toDMY(new Date());
  // Date is ALWAYS shown in English (English numerals + month) regardless of app language.
  const dLabel = `${date.getDate()} ${MON[date.getMonth()]} ${date.getFullYear()}`;
  const weekday = data ? (lang === 'hi' ? (data.weekdayHi || data.weekday) : data.weekday) : '';
  const L = (o?: { en: string; hi: string } | null) => (o ? (lang === 'hi' ? o.hi : o.en) : '');
  const tm = (p?: { hm12: string; hm24: string } | null, fallback?: string | null) => (p ? (lang === 'hi' ? p.hm24 : p.hm12) : (fallback || '—'));
  const dur = (d?: { text: string; hi: string } | null) => (d ? (lang === 'hi' ? d.hi : d.text) : '—');
  const festivalRows = useMemo<FestivalRow[]>(() => {
    const q = festivalQuery.trim().toLowerCase();
    const source = q.length >= 2 ? remoteFestivals : festivals;
    return source
      .flatMap((f) => (f.observances || []).map((obs) => ({ date: f.date, weekday: f.weekday, weekdayHi: f.weekdayHi, tithi: f.tithi, obs })))
      .filter((r) => {
        if (!q) return true;
        return [r.date, r.weekday, r.weekdayHi, r.tithi?.name, r.tithi?.hi, r.obs.key, r.obs.name.en, r.obs.name.hi, r.obs.type]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
      });
  }, [festivals, remoteFestivals, festivalQuery]);
  const openFestival = async (row: FestivalRow, withAi = false) => {
    hTap();
    const requestId = detailRequestRef.current + 1;
    detailRequestRef.current = requestId;
    setSelectedFestival(row);
    setFestivalDetail(null);
    setDetailError(null);
    setDetailMode(withAi ? 'ai' : 'details');
    setDetailLoading(true);
    try {
      const detail = await getPanchangFestivalDetail({ place, date: row.date, tz: '+05:30', key: row.obs.key, lang, ai: withAi });
      if (detailRequestRef.current !== requestId) return;
      setFestivalDetail(detail);
      if (withAi && detail.aiError) {
        setDetailError(lang === 'hi'
          ? 'AI guide abhi available nahi hai. Neeche verified panchang aur puja details dikh rahi hain.'
          : 'AI guide is unavailable right now. Verified panchang and puja details are shown below.');
      }
    } catch {
      if (detailRequestRef.current !== requestId) return;
      if (withAi) {
        try {
          const detail = await getPanchangFestivalDetail({ place, date: row.date, tz: '+05:30', key: row.obs.key, lang, ai: false });
          if (detailRequestRef.current !== requestId) return;
          setFestivalDetail(detail);
          setDetailError(lang === 'hi'
            ? 'विस्तृत मार्गदर्शन अभी लोड नहीं हो पाया — गणना-आधारित त्योहार विवरण नीचे उपलब्ध हैं।'
            : 'The detailed guide could not load — calculation-based festival details are shown below.');
          return;
        } catch {}
      }
      setDetailError(lang === 'hi'
        ? 'त्योहार विवरण लोड नहीं हो पाया — कृपया इंटरनेट जाँचकर पुनः प्रयास करें।'
        : 'Festival details could not load — please check your internet and try again.');
    } finally {
      if (detailRequestRef.current === requestId) setDetailLoading(false);
    }
  };

  return (
    <Page title={t('panchang.title', 'Panchang')} onBack={() => { hTap(); navigation.goBack(); }}>
      <View style={[styles.nav, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.85)' }]}>
        <Pressable onPress={() => shift(-1)} hitSlop={10} style={styles.navBtn}><Arrow dir="l" c={theme.gold1} /></Pressable>
        <Pressable onPress={today} style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.navDate, { color: theme.text }]}>{dLabel}</Text>
          <Text style={[styles.navWd, { color: theme.gold2 }]}>{weekday}{isToday ? `  ·  ${lang === 'hi' ? 'आज' : 'Today'}` : ''}</Text>
        </Pressable>
        <Pressable onPress={() => shift(1)} hitSlop={10} style={styles.navBtn}><Arrow dir="r" c={theme.gold1} /></Pressable>
      </View>

      {loading && <View style={styles.center}><ActivityIndicator color={theme.gold1} /><Text style={[styles.loadTxt, { color: theme.textMuted }]}>{lang === 'hi' ? 'सटीक पंचांग गणना हो रही है…' : 'Computing precise panchang…'}</Text></View>}
      {err && <Text style={[styles.err, { color: theme.textMuted }]}>{lang === 'hi' ? 'पंचांग लोड नहीं हो पाया — इंटरनेट जाँचें।' : 'Could not load Panchang — check internet.'}</Text>}

      {data && !loading && (
        <View style={{ gap: 14 }}>
          {/* calendar ribbon */}
          <View style={styles.ribbon}>
            {!!data.samvat && <Text style={[styles.ribbonItem, { color: theme.textMuted }]}>{lang === 'hi' ? 'विक्रम सं.' : 'Vikram'} <Text style={{ color: theme.gold1 }}>{lang === 'hi' ? toDev(data.samvat.vikram) : data.samvat.vikram}{data.samvatsara ? ` ${data.samvatsara}` : ''}</Text></Text>}
            {!!data.masa && <Text style={[styles.ribbonItem, { color: theme.textMuted }]}>{lang === 'hi' ? 'मास' : 'Masa'} <Text style={{ color: theme.gold1 }}>{L(data.masa.amanta)}</Text></Text>}
            {!!data.ritu && <Text style={[styles.ribbonItem, { color: theme.textMuted }]}>{lang === 'hi' ? 'ऋतु' : 'Ritu'} <Text style={{ color: theme.gold1 }}>{L(data.ritu)}</Text></Text>}
            {!!data.ayana && <Text style={[styles.ribbonItem, { color: theme.gold1 }]}>{L(data.ayana)}</Text>}
          </View>
          <View style={styles.locRow}>
            <Text style={[styles.loc, { color: theme.textMuted }]} numberOfLines={1}>📍 {data.location}  ·  🌅 {data.sunrise}  ·  🌇 {data.sunset}</Text>
            {/* dev-only source hint — blue = local ephemeris, green = VedAstro (no text) */}
            {!!data.provider && <View style={[styles.provDot, { backgroundColor: data.provider === 'local' ? '#6fa8dc' : '#3ec77a' }]} />}
          </View>

          <View style={styles.timingGrid}>
            <TimingTile label={lang === 'hi' ? 'सूर्योदय' : 'Sunrise'} value={tm(data.timings?.sunrise, data.sunrise)} sub={lang === 'hi' ? 'दिन की शुरुआत' : 'Panchang day starts'} theme={theme} />
            <TimingTile label={lang === 'hi' ? 'सूर्यास्त' : 'Sunset'} value={tm(data.timings?.sunset, data.sunset)} sub={lang === 'hi' ? 'दिन समाप्त' : 'Day closes'} theme={theme} />
            <TimingTile label={lang === 'hi' ? 'दिनमान' : 'Day Length'} value={dur(data.timings?.daylight)} sub={lang === 'hi' ? 'सूर्योदय से सूर्यास्त' : 'Sunrise to sunset'} theme={theme} />
            <TimingTile label={lang === 'hi' ? 'रात्रिमान' : 'Night Length'} value={dur(data.timings?.night)} sub={lang === 'hi' ? 'सूर्यास्त से सूर्योदय' : 'Sunset to sunrise'} theme={theme} />
            {!!(data.timings?.moonrise || data.moonrise) && <TimingTile label={lang === 'hi' ? 'चन्द्रोदय' : 'Moonrise'} value={tm(data.timings?.moonrise, data.moonrise)} sub={lang === 'hi' ? 'चन्द्र समय' : 'Moon timing'} theme={theme} />}
            {!!(data.timings?.moonset || data.moonset) && <TimingTile label={lang === 'hi' ? 'चन्द्रास्त' : 'Moonset'} value={tm(data.timings?.moonset, data.moonset)} sub={lang === 'hi' ? 'चन्द्र समय' : 'Moon timing'} theme={theme} />}
            <TimingTile label={lang === 'hi' ? 'मध्याह्न' : 'Midday'} value={tm(data.timings?.midday)} sub={lang === 'hi' ? 'स्थानीय सौर मध्य' : 'Local solar midpoint'} theme={theme} />
          </View>

          {data.bhadra && (
            <View style={[styles.bhadra, { borderColor: '#e0a92e88', backgroundColor: 'rgba(224,169,46,0.12)' }]}>
              <Text style={[styles.bhadraTxt, { color: '#e0a92e' }]}>⚠ {lang === 'hi' ? 'भद्रा (विष्टि करण) सक्रिय — शुभ कार्य व यात्रा से बचें।' : 'Bhadra (Vishti Karana) active — avoid auspicious work & travel.'}</Text>
            </View>
          )}

          {/* 5 angas with end-times */}
          <Text style={[styles.h, { color: theme.gold1 }]}>{lang === 'hi' ? 'पंचांग — पाँच अंग' : 'Panchang — Five Limbs'}</Text>
          <View style={styles.grid}>
            <AngCard label={lang === 'hi' ? 'तिथि' : 'Tithi'} num={data.tithi?.num} value={lang === 'hi' ? (data.tithi?.hi || data.tithi?.name) : data.tithi?.name} sub={lang === 'hi' ? data.tithi?.pakshaHi : (data.tithi?.paksha ? `${data.tithi.paksha} Paksha` : '')} end={data.tithi?.endsAt} theme={theme} lang={lang} />
            <AngCard label={lang === 'hi' ? 'नक्षत्र' : 'Nakshatra'} num={data.nakshatra?.num} value={lang === 'hi' ? (data.nakshatra?.hi || data.nakshatra?.name) : data.nakshatra?.name} sub={data.nakshatra?.pada ? `${lang === 'hi' ? 'पाद' : 'Pada'} ${lang === 'hi' ? toDev(data.nakshatra.pada) : data.nakshatra.pada}` : ''} end={data.nakshatra?.endsAt} theme={theme} lang={lang} />
            <AngCard label={lang === 'hi' ? 'योग' : 'Yoga'} num={data.yoga?.num} value={lang === 'hi' ? (data.yoga?.hi || data.yoga?.name) : data.yoga?.name} end={data.yoga?.endsAt} theme={theme} lang={lang} />
            <AngCard label={lang === 'hi' ? 'करण' : 'Karana'} value={lang === 'hi' ? (data.karana?.hi || data.karana?.name) : data.karana?.name} end={data.karana?.endsAt} theme={theme} lang={lang} />
            <AngCard label={lang === 'hi' ? 'वार' : 'Vaar'} value={weekday} theme={theme} lang={lang} />
            <AngCard label={lang === 'hi' ? 'चंद्र राशि' : 'Moon Sign'} value={data.moon?.sign ? aSign(data.moon.sign, lang) : '—'} theme={theme} lang={lang} />
          </View>

          {!!(data.observances || []).length && (
            <View style={[styles.card, { borderColor: '#d6a03b66', backgroundColor: theme.isDark ? 'rgba(214,160,59,0.08)' : 'rgba(214,160,59,0.10)' }]}>
              <Text style={[styles.h, { color: theme.gold1 }]}>🪔 {lang === 'hi' ? 'आज के व्रत / उत्सव / सावधानी' : "Today's Vrat / Festival / Caution"}</Text>
              <View style={{ gap: 10, marginTop: 10 }}>
                {data.observances!.map((o) => (
                  <View key={o.key} style={[styles.obsRow, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.45)' }]}>
                    <View style={[styles.obsBadge, { backgroundColor: o.importance === 'major' ? '#d6a03b' : o.type === 'caution' ? '#e06a5a' : '#3ec77a' }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.obsTitle, { color: theme.text }]}>{L(o.name)}</Text>
                      <Text style={[styles.obsText, { color: theme.textMuted }]}>{L(o.guidance)}</Text>
                    </View>
                    <Text style={[styles.obsType, { color: theme.gold2 }]}>{o.type}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {!!festivals.length && (
            <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.025)' : 'rgba(255,253,247,0.78)' }]}>
              <Text style={[styles.h, { color: theme.gold1 }]}>📅 {lang === 'hi' ? 'आने वाले व्रत और उत्सव' : 'Upcoming Vrat & Festivals'}</Text>
              <TextInput
                value={festivalQuery}
                onChangeText={setFestivalQuery}
                placeholder={lang === 'hi' ? 'व्रत या उत्सव खोजें' : 'Search vrat or festival'}
                placeholderTextColor={theme.textMuted}
                style={[styles.searchInput, { borderColor: theme.cardBorder, color: theme.text, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.62)' }]}
              />
              <View style={{ gap: 9, marginTop: 10 }}>
                {searchingFestival && <View style={styles.detailLoading}><ActivityIndicator color={theme.gold1} /><Text style={[styles.obsText, { color: theme.textMuted }]}>{lang === 'hi' ? 'भविष्य के उत्सव खोज रहे हैं' : 'Searching future festivals'}</Text></View>}
                {festivalRows.slice(0, 10).map((f) => {
                  const active = selectedFestival?.date === f.date && selectedFestival?.obs.key === f.obs.key;
                  const tithiText = lang === 'hi'
                    ? [f.tithi?.hi || f.tithi?.name, f.tithi?.pakshaHi || f.tithi?.paksha].filter(Boolean).join(' · ')
                    : [f.tithi?.name, f.tithi?.paksha ? `${f.tithi.paksha} Paksha` : ''].filter(Boolean).join(' · ');
                  return (
                    <View key={`${f.date}-${f.obs.key}`}>
                      <View style={[styles.festivalCard, { borderColor: active ? theme.gold1 : theme.cardBorder, backgroundColor: active ? 'rgba(214,160,59,0.12)' : (theme.isDark ? 'rgba(255,255,255,0.018)' : 'rgba(255,255,255,0.42)') }]}>
                        <Pressable onPress={() => openFestival(f, false)} style={styles.festivalMain}>
                          <FestivalThumb row={f} lang={lang} />
                          <View style={styles.festivalBody}>
                            <Text style={[styles.festivalTitle, { color: theme.text }]} numberOfLines={2}>{L(f.obs.name)}</Text>
                            {!!tithiText && <Text style={[styles.festivalMeta, { color: theme.textMuted }]} numberOfLines={2}>{tithiText}</Text>}
                            <Text style={[styles.festivalHint, { color: theme.textMuted }]} numberOfLines={2}>{L(f.obs.guidance)}</Text>
                          </View>
                        </Pressable>
                        <View style={styles.festivalActions}>
                          <Text style={[styles.obsType, { color: theme.gold2 }]}>{f.obs.importance}</Text>
                          <Pressable onPress={() => openFestival(f, true)} style={[styles.aiChip, { borderColor: theme.gold2 + '88', backgroundColor: active && detailMode === 'ai' ? 'rgba(214,160,59,0.18)' : 'transparent' }]}>
                            <Text style={[styles.aiChipText, { color: theme.gold1 }]}>AI Guide</Text>
                          </Pressable>
                        </View>
                      </View>
                      {active && detailLoading && <View style={styles.detailLoading}><ActivityIndicator color={theme.gold1} /><Text style={[styles.obsText, { color: theme.textMuted }]}>{detailMode === 'ai' ? (lang === 'hi' ? 'AI guide तैयार हो रहा है' : 'Preparing AI guide') : (lang === 'hi' ? 'विस्तार लोड हो रहा है' : 'Loading details')}</Text></View>}
                      {active && !detailLoading && <FestivalDetail detail={festivalDetail} selected={f} mode={detailMode} error={detailError} theme={theme} lang={lang} />}
                    </View>
                  );
                })}
                {!festivalRows.length && <Text style={[styles.emptyTxt, { color: theme.textMuted }]}>{lang === 'hi' ? 'कोई परिणाम नहीं मिला' : 'No results found'}</Text>}
              </View>
            </View>
          )}

          {/* shubh muhurat */}
          {!!(data.auspicious || []).length && (
            <View style={[styles.card, { borderColor: '#3ec77a55', backgroundColor: theme.isDark ? 'rgba(62,199,122,0.07)' : 'rgba(62,199,122,0.08)' }]}>
              <Text style={[styles.h, { color: '#3ec77a' }]}>🟢 {lang === 'hi' ? 'शुभ मुहूर्त — क्या करें' : 'Auspicious Muhurat — what to do'}</Text>
              <View style={{ gap: 9, marginTop: 8 }}>
                {data.auspicious!.map((p) => <PeriodRow key={p.name} p={p} color="#3ec77a" theme={theme} lang={lang} />)}
              </View>
            </View>
          )}

          {/* ashubh kaal */}
          {!!(data.inauspicious || []).length && (
            <View style={[styles.card, { borderColor: '#e06a5a55', backgroundColor: theme.isDark ? 'rgba(224,106,90,0.07)' : 'rgba(224,106,90,0.08)' }]}>
              <Text style={[styles.h, { color: '#e06a5a' }]}>🔴 {lang === 'hi' ? 'अशुभ काल — क्या न करें' : 'Inauspicious Kaal — what to avoid'}</Text>
              <View style={{ gap: 9, marginTop: 8 }}>
                {data.inauspicious.map((p) => <PeriodRow key={p.name} p={p} color="#e06a5a" theme={theme} lang={lang} />)}
              </View>
            </View>
          )}

          <Text style={[styles.trust, { color: theme.textMuted }]}>🔒 {lang === 'hi' ? 'गणना Lahiri अयनांश, स्थान-आधारित सूर्योदय और शास्त्रीय पंचांग नियमों पर आधारित है।' : 'Calculated with Lahiri ayanamsa, location-based sunrise and classical Panchang rules.'}</Text>
          <View style={{ height: 8 }} />
        </View>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, padding: 8, marginBottom: 14 },
  navBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  navDate: { fontFamily: fonts.cinzelSemi, fontSize: 16 },
  navWd: { fontFamily: fonts.interSemi, fontSize: 12, marginTop: 2 },
  center: { paddingVertical: 50, alignItems: 'center', gap: 12 },
  loadTxt: { fontFamily: fonts.inter, fontSize: 12.5 },
  err: { fontFamily: fonts.inter, fontSize: 13, textAlign: 'center', paddingVertical: 30 },

  ribbon: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  ribbonItem: { fontFamily: fonts.inter, fontSize: 12 },
  locRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  loc: { fontFamily: fonts.inter, fontSize: 12, textAlign: 'center' },
  provDot: { width: 8, height: 8, borderRadius: 4, opacity: 0.8 },
  timingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  timeTile: { width: '48.5%', minHeight: 74, borderWidth: 1, borderRadius: 12, padding: 10, justifyContent: 'center' },
  timeLabel: { fontFamily: fonts.interSemi, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.6 },
  timeValue: { fontFamily: fonts.cinzelSemi, fontSize: 17, marginTop: 4 },
  timeSub: { fontFamily: fonts.inter, fontSize: 10.5, marginTop: 3 },

  bhadra: { borderWidth: 1, borderRadius: 12, padding: 11 },
  bhadraTxt: { fontFamily: fonts.interSemi, fontSize: 12.5, lineHeight: 18, textAlign: 'center' },

  h: { fontFamily: fonts.cinzelSemi, fontSize: 13.5, letterSpacing: 0.6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  ang: { width: '31.5%', borderWidth: 1, borderRadius: 12, padding: 10, minHeight: 88, justifyContent: 'flex-start' },
  angLabel: { fontFamily: fonts.interSemi, fontSize: 10, letterSpacing: 0.6, textTransform: 'uppercase' },
  angValue: { fontFamily: fonts.cinzelSemi, fontSize: 14, marginTop: 5 },
  angSub: { fontFamily: fonts.inter, fontSize: 10, marginTop: 2 },
  angEnd: { fontFamily: fonts.interSemi, fontSize: 10, marginTop: 4 },

  card: { borderWidth: 1, borderRadius: 14, padding: 14 },
  period: { borderWidth: 1, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 11 },
  periodHead: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  periodName: { flex: 1, fontFamily: fonts.interSemi, fontSize: 13.5 },
  periodTime: { fontFamily: fonts.inter, fontSize: 12.5 },
  periodGuide: { fontFamily: fonts.inter, fontSize: 11.5, lineHeight: 16, marginTop: 5, marginLeft: 17 },
  obsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderRadius: 11, padding: 10 },
  obsBadge: { width: 7, minHeight: 42, borderRadius: 5 },
  obsTitle: { fontFamily: fonts.interSemi, fontSize: 13.5 },
  obsText: { fontFamily: fonts.inter, fontSize: 11.5, lineHeight: 16, marginTop: 3 },
  obsType: { fontFamily: fonts.interSemi, fontSize: 10, textTransform: 'uppercase' },
  searchInput: { height: 42, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, marginTop: 12, fontFamily: fonts.inter, fontSize: 13 },
  upcomingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 11, padding: 10 },
  festivalCard: { flexDirection: 'row', alignItems: 'stretch', gap: 10, borderWidth: 1, borderRadius: 14, padding: 10 },
  festivalMain: { flex: 1, flexDirection: 'row', alignItems: 'stretch', gap: 10 },
  festivalDateBadge: { width: 78, borderWidth: 1, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 7, justifyContent: 'center' },
  thumb: { width: 64, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
  thumbGlyph: { fontSize: 13, marginBottom: 1 },
  thumbDay: { fontFamily: fonts.cinzelSemi, fontSize: 22, color: '#fff8ec', lineHeight: 24 },
  thumbMon: { fontFamily: fonts.interBold, fontSize: 11, color: '#fff3da', letterSpacing: 1, textTransform: 'uppercase', marginTop: 1 },
  thumbWeek: { fontFamily: fonts.inter, fontSize: 9, color: 'rgba(255,248,236,0.85)', marginTop: 2 },
  festivalBody: { flex: 1, justifyContent: 'center', minWidth: 0 },
  festivalActions: { width: 78, alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 },
  festivalTitle: { fontFamily: fonts.interSemi, fontSize: 14, lineHeight: 19 },
  festivalMeta: { fontFamily: fonts.inter, fontSize: 11.5, lineHeight: 16, marginTop: 4 },
  festivalHint: { fontFamily: fonts.inter, fontSize: 11, lineHeight: 15, marginTop: 4 },
  upDate: { fontFamily: fonts.interSemi, fontSize: 12 },
  upWeek: { fontFamily: fonts.inter, fontSize: 10.5, marginTop: 2 },
  aiChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 6, minWidth: 72, alignItems: 'center' },
  aiChipText: { fontFamily: fonts.interBold, fontSize: 10 },
  emptyTxt: { fontFamily: fonts.inter, fontSize: 12, textAlign: 'center', paddingVertical: 8 },
  detailLoading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 12 },
  detailBox: { borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 12, gap: 12 },
  detailHero: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  detailMark: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  detailMarkText: { fontFamily: fonts.interBold, fontSize: 11 },
  detailKicker: { fontFamily: fonts.interSemi, fontSize: 11, marginBottom: 3 },
  detailTitle: { fontFamily: fonts.cinzelSemi, fontSize: 17, lineHeight: 22 },
  detailLead: { fontFamily: fonts.inter, fontSize: 12.5, lineHeight: 18 },
  detailSub: { fontFamily: fonts.interSemi, fontSize: 12, marginBottom: 3 },
  detailSection: { gap: 5 },
  detailWarn: { borderWidth: 1, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 10 },
  detailWarnText: { fontFamily: fonts.inter, fontSize: 11.5, lineHeight: 16 },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaPill: { width: '48%', borderWidth: 1, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 9 },
  metaLabel: { fontFamily: fonts.inter, fontSize: 10.5 },
  metaValue: { fontFamily: fonts.interSemi, fontSize: 12, marginTop: 2 },
  muhuratPill: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 10 },
  detailCols: { gap: 10, marginTop: 2 },
  detailNote: { fontFamily: fonts.inter, fontSize: 10.5, lineHeight: 15, marginTop: 10 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  infoChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, fontFamily: fonts.inter, fontSize: 11 },
  mantraText: { fontFamily: fonts.cinzelSemi, fontSize: 13.5, lineHeight: 21, marginTop: 4 },

  trust: { fontFamily: fonts.inter, fontSize: 11, textAlign: 'center', marginTop: 4, lineHeight: 16 },
});
