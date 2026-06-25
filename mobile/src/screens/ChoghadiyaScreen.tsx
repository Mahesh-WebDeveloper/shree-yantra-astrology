import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Animated, Easing } from 'react-native';
import Svg, { Circle, Path, Polyline, Defs, RadialGradient, Stop, LinearGradient as SvgGrad } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { Theme, fonts } from '../theme/tokens';
import { Screen } from '../components/Screen';
import { BrandHeader } from '../components/BrandHeader';
import { GradientText } from '../components/GradientText';
import { ChoghadiyaSymbol } from '../components/icons/ChoghadiyaIcons';
import { CalendarIcon, ClockIcon } from '../components/icons/ProfileIcons';
import {
  buildPeriods, findActive, fmtTime, fmtDate, UPCOMING_BLURB, ColorKey, Period, SunTimes,
} from '../data/choghadiya';
import { ChoghadiyaActivities } from '../components/ChoghadiyaActivities';
import { ChoghadiyaSpecialMessage } from '../components/ChoghadiyaSpecialMessage';
import { hTap, hSelect, hPress, hSuccess } from '../lib/haptics';
import { openAppDrawer } from '../navigation/AppDrawerHost';
import { getSunTimes, getChoghadiyaMessage, getMuhuratPick, MuhuratPick } from '../lib/api';
import { birthFromProfile } from '../lib/birth';
import { useScreen } from '../context/AppConfigProvider';
import { useT, useLang } from '../i18n/LanguageProvider';
import { aPeriod, aTag, aPeriodDesc, aBlurb, aDateHi } from '../i18n/astro';

const pad2 = (n: number) => (n < 10 ? '0' : '') + n;
const apiDate = (d: Date) => `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;

const accentFor = (theme: Theme, c: ColorKey) =>
  c === 'green' ? theme.green : c === 'blue' ? theme.blue : c === 'orange' ? theme.saffron : theme.red;

const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

// Common activities for the AI Muhurat Finder (en sent to AI, label shown by lang)
const MUHURAT_ACTIVITIES = [
  { en: 'Marriage', hi: 'विवाह' },
  { en: 'Travel / Journey', hi: 'यात्रा' },
  { en: 'New Business / Shop opening', hi: 'नया व्यापार' },
  { en: 'Buying a Vehicle', hi: 'वाहन खरीद' },
  { en: 'Griha Pravesh', hi: 'गृह-प्रवेश' },
  { en: 'Puja / Ritual', hi: 'पूजा' },
  { en: 'Important Meeting / Deal', hi: 'मीटिंग / डील' },
  { en: 'Interview / Exam', hi: 'इंटरव्यू / परीक्षा' },
];

const stripTime = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const sameDay = (a: Date, b: Date) => stripTime(a).getTime() === stripTime(b).getTime();

/** 4-point sparkle used in the Choghadiya titles (web cg-title svg). */
const Sparkle = ({ color, size = 15 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" />
  </Svg>
);

/** Gold ornament (fading line → arrow → ring) that flanks the title — mirrors
    the Welcome brand ornament so the heading feels part of the same system. */
const TitleOrnament = ({ color, flip }: { color: string; flip?: boolean }) => (
  <Svg width={34} height={14} viewBox="0 0 60 14" style={flip ? { transform: [{ scaleX: -1 }] } : undefined}>
    <Defs>
      <SvgGrad id="cgOrn" x1="0" y1="0" x2="1" y2="0">
        <Stop offset="0" stopColor={color} stopOpacity={0} />
        <Stop offset="0.6" stopColor={color} stopOpacity={0.9} />
        <Stop offset="1" stopColor="#fce8a8" />
      </SvgGrad>
    </Defs>
    <Path d="M0 7 H44" stroke="url(#cgOrn)" strokeWidth={1.2} />
    <Path d="M44 7 L52 3 L52 11 Z" fill={color} />
    <Circle cx={56} cy={7} r={2.2} fill="none" stroke={color} strokeWidth={1} />
  </Svg>
);

const Chev = ({ color, dir = 'down', size = 12 }: { color: string; dir?: 'down' | 'left' | 'right'; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points={dir === 'down' ? '6 9 12 15 18 9' : dir === 'left' ? '15 18 9 12 15 6' : '9 18 15 12 9 6'} />
  </Svg>
);

const CheckIcon = ({ color, size = 17 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="20 6 9 17 4 12" />
  </Svg>
);

const PinIcon = ({ color, size = 12 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><Circle cx={12} cy={10} r={3} />
  </Svg>
);

/** Exact port of the web active-card yantra SVG (gold gradient rings + triangles). */
const YantraArt = React.memo(({ size = 64 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
    <Defs>
      <SvgGrad id="cgGold" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#fce8a8" />
        <Stop offset="0.5" stopColor="#e9b850" />
        <Stop offset="1" stopColor="#a17613" />
      </SvgGrad>
    </Defs>
    <Circle cx={60} cy={60} r={56} stroke="url(#cgGold)" strokeWidth={1.5} strokeDasharray="2 4" />
    <Circle cx={60} cy={60} r={48} stroke="url(#cgGold)" strokeWidth={1} />
    <Circle cx={60} cy={60} r={32} stroke="url(#cgGold)" strokeWidth={1} opacity={0.6} />
    <Path d="M60 12 L96 78 H24 Z" stroke="url(#cgGold)" strokeWidth={1.5} />
    <Path d="M60 108 L24 42 H96 Z" stroke="url(#cgGold)" strokeWidth={1.5} />
    <Path d="M60 28 L80 64 H40 Z" stroke="url(#cgGold)" strokeWidth={1} />
    <Path d="M60 92 L40 56 H80 Z" stroke="url(#cgGold)" strokeWidth={1} />
    <Circle cx={60} cy={60} r={4} fill="url(#cgGold)" />
  </Svg>
));

/** Pulsing gold radial glow behind the yantra (web .cg-yantra::before, 3s alternate). */
function YantraGlow({ size }: { size: number }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(a, { toValue: 1, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(a, { toValue: 0, duration: 3000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [a]);
  const opacity = a.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity, alignItems: 'center', justifyContent: 'center' }]} pointerEvents="none">
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id="ygl" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#eecb7a" stopOpacity={0.4} />
            <Stop offset="70%" stopColor="#eecb7a" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#ygl)" />
      </Svg>
    </Animated.View>
  );
}

/** Pulsing live dot before "CURRENTLY ACTIVE" (web cg-pulse-dot, 1.6s). */
function LiveDot({ color }: { color: string }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(a, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(a, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [a]);
  const opacity = a.interpolate({ inputRange: [0, 1], outputRange: [1, 0.4] });
  const scale = a.interpolate({ inputRange: [0, 1], outputRange: [1, 0.7] });
  return (
    <Animated.View
      style={{
        width: 6, height: 6, borderRadius: 3, backgroundColor: color,
        opacity, transform: [{ scale }],
        shadowColor: color, shadowOpacity: 1, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 6,
      }}
    />
  );
}

function fmtCountdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const p = (n: number) => (n < 10 ? '0' : '') + n;
  return `${p(h)}:${p(m)}:${p(sec)}`;
}

function CountdownRing({ pct, color, track }: { pct: number; color: string; track: string }) {
  const r = 31;
  const c = 2 * Math.PI * r;
  return (
    <Svg width={70} height={70} viewBox="0 0 70 70">
      <Circle cx={35} cy={35} r={r} stroke={track} strokeWidth={4} fill="none" />
      <Circle
        cx={35} cy={35} r={r} stroke={color} strokeWidth={4} fill="none"
        strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, Math.max(0, pct)))} strokeLinecap="round"
        transform="rotate(-90 35 35)"
      />
    </Svg>
  );
}

/** Isolated 1-second countdown ring — keeps the heavy parent screen (list,
    activities, cards) from re-rendering every second. Only this tiny tree ticks. */
function ActiveTimer({
  active, durMin, accent, track, textColor, mutedColor,
}: {
  active: Period | undefined;
  durMin: number;
  accent: string;
  track: string;
  textColor: string;
  mutedColor: string;
}) {
  const t = useT();
  const [, force] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [active]);

  const pad = (n: number) => (n < 10 ? '0' : '') + n;

  if (active) {
    const nowMs = Date.now();
    const pct = (nowMs - active.start.getTime()) / (active.end.getTime() - active.start.getTime());
    return (
      <View style={styles.ring}>
        <CountdownRing pct={pct} color={accent} track={track} />
        <View style={styles.ringLabel}>
          <Text style={[styles.ringTime, { color: textColor }]}>{fmtCountdown(active.end.getTime() - nowMs)}</Text>
          <Text style={[styles.ringLeft, { color: mutedColor }]}>{t('cg.left', 'LEFT')}</Text>
        </View>
      </View>
    );
  }
  return (
    <View style={styles.ring}>
      <CountdownRing pct={1} color={accent} track={track} />
      <View style={styles.ringLabel}>
        <Text style={[styles.ringTime, { color: textColor }]}>{pad(Math.floor(durMin / 60))}:{pad(durMin % 60)}</Text>
        <Text style={[styles.ringLeft, { color: mutedColor }]}>{t('cg.duration', 'DURATION')}</Text>
      </View>
    </View>
  );
}

/* ── Gold calendar modal — exact port of the web .cg-cal popup ── */
function CgCalendar({
  visible, initial, onConfirm, onClose,
}: {
  visible: boolean;
  initial: Date;
  onConfirm: (d: Date) => void;
  onClose: () => void;
}) {
  const t = useT();
  const today = useMemo(() => stripTime(new Date()), []);
  const [sel, setSel] = useState<Date>(initial);
  const [view, setView] = useState({ y: initial.getFullYear(), m: initial.getMonth() });

  useEffect(() => {
    if (visible) {
      setSel(initial);
      setView({ y: initial.getFullYear(), m: initial.getMonth() });
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const cells = useMemo(() => {
    const first = new Date(view.y, view.m, 1).getDay();
    const days = new Date(view.y, view.m + 1, 0).getDate();
    const prevDays = new Date(view.y, view.m, 0).getDate();
    const arr: { d: number; muted: boolean }[] = [];
    for (let i = first - 1; i >= 0; i--) arr.push({ d: prevDays - i, muted: true });
    for (let d = 1; d <= days; d++) arr.push({ d, muted: false });
    const trailing = (7 - (arr.length % 7)) % 7;
    for (let t = 1; t <= trailing; t++) arr.push({ d: t, muted: true });
    return arr;
  }, [view]);

  const nav = (delta: number) => {
    hSelect();
    let m = view.m + delta;
    let y = view.y;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setView({ y, m });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={cgCal.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        {/* gold gradient border ring (web .cg-cal::before) */}
        <LinearGradient colors={['#f6d27a', '#8a6418', '#c9962e']} start={{ x: 0, y: 0 }} end={{ x: 0.9, y: 1 }} style={cgCal.borderRing}>
          <View style={cgCal.card}>
            {/* head */}
            <View style={cgCal.head}>
              <Pressable onPress={() => nav(-1)} hitSlop={8} style={({ pressed }) => [cgCal.navBtn, pressed && { backgroundColor: 'rgba(238,203,122,0.22)', transform: [{ scale: 0.92 }] }]}>
                <Chev color="#e6c277" dir="left" size={14} />
              </Pressable>
              <Text style={cgCal.title}>{MONTHS_FULL[view.m]} {view.y}</Text>
              <Pressable onPress={() => nav(1)} hitSlop={8} style={({ pressed }) => [cgCal.navBtn, pressed && { backgroundColor: 'rgba(238,203,122,0.22)', transform: [{ scale: 0.92 }] }]}>
                <Chev color="#e6c277" dir="right" size={14} />
              </Pressable>
            </View>

              {/* weekday row */}
            <View style={cgCal.dowRow}>
              {DOW.map((d) => <Text key={d} style={cgCal.dow}>{d}</Text>)}
            </View>

              {/* day grid */}
            <View style={cgCal.grid}>
              {cells.map((c, i) => {
                if (c.muted) {
                  return <View key={i} style={cgCal.cell}><Text style={cgCal.dayMuted}>{c.d}</Text></View>;
                }
                const cur = new Date(view.y, view.m, c.d);
                const isToday = sameDay(cur, today);
                const isSel = sameDay(cur, sel);
                return (
                  <View key={i} style={cgCal.cell}>
                    <Pressable
                      onPress={() => { hSelect(); setSel(cur); }}
                      style={({ pressed }) => [
                        cgCal.day,
                        isToday && !isSel && cgCal.dayToday,
                        pressed && { transform: [{ scale: 0.92 }] },
                      ]}
                    >
                      {isSel ? (
                        <LinearGradient colors={['#fce8a8', '#b87f1a']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={cgCal.daySel}>
                          <Text style={cgCal.daySelText}>{c.d}</Text>
                        </LinearGradient>
                      ) : (
                        <Text style={[cgCal.dayText, isToday && { color: '#e6c277', fontFamily: fonts.interBold }]}>{c.d}</Text>
                      )}
                    </Pressable>
                  </View>
                );
              })}
            </View>

              {/* footer: TODAY / CONFIRM */}
            <View style={cgCal.foot}>
              <Pressable
                onPress={() => { hTap(); setSel(today); setView({ y: today.getFullYear(), m: today.getMonth() }); }}
                style={({ pressed }) => [cgCal.btn, pressed && { backgroundColor: 'rgba(238,203,122,0.12)', transform: [{ scale: 0.96 }] }]}
              >
                <Text style={cgCal.btnText}>{t('cg.calToday', 'TODAY')}</Text>
              </Pressable>
              <Pressable
                onPress={() => { hPress(); onConfirm(sel); }}
                style={({ pressed }) => [cgCal.btnPrimaryWrap, pressed && { transform: [{ scale: 0.96 }] }]}
              >
                <LinearGradient colors={['#fce8a8', '#e9b850', '#b87f1a']} locations={[0, 0.45, 1]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={cgCal.btnPrimary}>
                  <Text style={cgCal.btnPrimaryText}>{t('cg.calConfirm', 'CONFIRM')}</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

/** Section header — web .cg-section-header (icon + dim-gold uppercase label). */
function SectionHeader({ icon, label, color, rule }: { icon: React.ReactNode; label: string; color: string; rule: string }) {
  return (
    <View style={styles.listHeadRow}>
      {icon}
      <Text style={[styles.listHead, { color }]}>{label}</Text>
      {/* trailing hairline that fades out — premium section divider */}
      <LinearGradient
        colors={[rule, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headRule}
      />
    </View>
  );
}

export function ChoghadiyaScreen({ navigation }: any) {
  const { theme } = useTheme();
  const cg = useScreen('choghadiya'); // admin-managed content
  const tr = useT();
  const { lang } = useLang();
  const openMenu = () => openAppDrawer();

  // coarse clock — only drives which period is "active" (boundaries are ~100min
  // apart, so 15s is plenty). The per-second countdown lives in <ActiveTimer>.
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(id);
  }, []);

  const [selectedDate, setSelectedDate] = useState<Date>(() => stripTime(new Date()));
  const [calOpen, setCalOpen] = useState(false);

  // Location for sunrise/sunset — user's birth place (best available proxy),
  // else Jaipur. Choghadiya is location-dependent, so this drives accuracy.
  const [placeName, setPlaceName] = useState('Jaipur');
  // Real sunrise/sunset (VedAstro / Swiss Ephemeris) for the selected date.
  // null until the first fetch lands → buildPeriods falls back to demo constants.
  const [sun, setSun] = useState<SunTimes | null>(null);

  useEffect(() => {
    birthFromProfile()
      .then((b) => { if (b?.place) setPlaceName(b.place); })
      .catch(() => {});
  }, []);

  // Fetch real sunrise/sunset whenever the date or place changes.
  useEffect(() => {
    let cancelled = false;
    setSun(null); // avoid showing stale times for the previous date
    getSunTimes({ place: placeName, date: apiDate(selectedDate) })
      .then((r) => { if (!cancelled) setSun({ sunrise: r.sunrise, sunset: r.sunset }); })
      .catch(() => { /* network down → buildPeriods uses demo fallback */ });
    return () => { cancelled = true; };
  }, [selectedDate, placeName]);

  const isToday = sameDay(selectedDate, now);
  const periods = useMemo(() => buildPeriods(selectedDate, sun ?? undefined), [selectedDate, sun]);
  const dayList = useMemo(() => periods.slice(0, 8), [periods]);

  // active period (today only); for other dates highlight the first auspicious daytime one
  const active = isToday ? findActive(periods, now) : undefined;
  const highlight: Period = active ?? dayList.find((p) => p.meta.nature === 'good') ?? periods[0];
  const hAccent = accentFor(theme, highlight.meta.color);

  // AI special message — current period ke hisaab se (time ke saath badalta hai)
  const [aiMsg, setAiMsg] = useState<string | null>(null);
  useEffect(() => {
    let on = true;
    setAiMsg(null);
    (async () => {
      const b = await birthFromProfile().catch(() => null);
      if (!b) return; // birth details nahi → static desc dikhega
      try {
        const r = await getChoghadiyaMessage({ ...b, period: highlight.name, quality: highlight.meta.nature });
        if (on) setAiMsg(r.message);
      } catch (_) { /* AI optional */ }
    })();
    return () => { on = false; };
  }, [highlight.name, isToday]);

  // upcoming — next 3 good from now (today) or from day start (other dates)
  const upcoming = useMemo(() => {
    let pool = periods.filter((p) => p.meta.nature === 'good' && (!isToday || p.end > now));
    if (!pool.length) pool = periods.filter((p) => p.meta.nature === 'good');
    return pool.slice(0, 3);
  }, [periods, isToday, now]);

  // duration (minutes) of the highlighted period — used by the timer ring
  const durMin = Math.floor((highlight.end.getTime() - highlight.start.getTime()) / 60000);

  // 8-row list — memoized so the 15s clock tick doesn't re-render it (dayList &
  // active are stable references until the date or active period actually changes)
  const listRows = useMemo(() => dayList.map((p, i) => {
    const ac = accentFor(theme, p.meta.color);
    const isActive = active === p;
    return (
      <View
        key={i}
        style={[
          styles.row,
          {
            // keep the SAME background for all rows — only the border highlights the active one (no inner fill/shadow)
            backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(176,115,22,0.04)',
            borderColor: isActive ? ac : (theme.isDark ? 'rgba(238,203,122,0.18)' : 'rgba(176,115,22,0.18)'),
            borderWidth: isActive ? 1.5 : 1,
          },
        ]}
      >
        <View style={[styles.num, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(176,115,22,0.12)' }]}>
          <Text style={[styles.numText, { color: theme.isDark ? '#cccccc' : theme.textMuted }]}>{i + 1}</Text>
        </View>
        <View style={[styles.rowIcon, { backgroundColor: ac + '26' }]}>
          <ChoghadiyaSymbol name={p.name} color={ac} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.rowName, { color: theme.isDark ? '#ffffff' : theme.text }]}>{aPeriod(p.name, lang).toUpperCase()}{isActive ? (lang === 'hi' ? ' (वर्तमान)' : ' (VARTMAN)') : ''}</Text>
          <Text style={[styles.rowTime, { color: theme.isDark ? '#999999' : theme.textMuted }]}>{fmtTime(p.start)} - {fmtTime(p.end)}</Text>
        </View>
        <Text style={[styles.rowTag, { color: ac }]}>{aTag(p.meta.tag, lang)}</Text>
      </View>
    );
  }), [dayList, active, theme]);

  // ── Muhurat Finder (AI): best upcoming Choghadiya window for the user's activity ──
  const [muhuratOpen, setMuhuratOpen] = useState(false);
  const [muhuratBusy, setMuhuratBusy] = useState(false);
  const [muhuratResult, setMuhuratResult] = useState<{ label: string; pick: MuhuratPick } | null>(null);
  const muhuratPeriods = useMemo(() => {
    let pool = periods.filter((p) => !isToday || p.end > now);
    if (pool.length < 3) pool = periods;
    return pool.slice(0, 12).map((p) => ({ name: p.name, time: `${fmtTime(p.start)} - ${fmtTime(p.end)}`, nature: p.meta.nature }));
  }, [periods, isToday, now]);
  const askMuhurat = async (activityEn: string, label: string) => {
    if (muhuratBusy) return;
    hTap(); setMuhuratBusy(true); setMuhuratResult(null);
    try {
      const pick = await getMuhuratPick({ activity: activityEn, periods: muhuratPeriods });
      setMuhuratResult({ label, pick });
    } catch { setMuhuratResult(null); }
    finally { setMuhuratBusy(false); }
  };
  const muhuratMatched = muhuratResult ? periods.find((p) => p.name === muhuratResult.pick.period) : null;

  const confirmDate = (d: Date) => {
    setSelectedDate(stripTime(d));
    setCalOpen(false);
    hSuccess();
  };

  const goldDim = theme.goldDim;

  return (
    <Screen>
      <BrandHeader onMenu={openMenu} onBell={() => navigation.navigate('Notifications')} />

      {/* cg-header: ornament ✦ CHOGHADIYA ✦ ornament + subtitle + date pill */}
      <View style={styles.cgHeader}>
        <View style={styles.cgTitle}>
          <TitleOrnament color={theme.gold2} />
          <Sparkle color={theme.goldText} size={13} />
          <GradientText style={styles.cgTitleText}>CHOGHADIYA</GradientText>
          <Sparkle color={theme.goldText} size={13} />
          <TitleOrnament color={theme.gold2} flip />
        </View>
        <Text style={[styles.subtitle, { color: theme.isDark ? '#aaaaaa' : theme.textMuted }]}>{cg.t('subtitle', "Know Today's Auspicious & Inauspicious Timings")}</Text>

        <Pressable
          onPress={() => { hTap(); setCalOpen(true); }}
          style={({ pressed }) => [
            styles.datePill,
            {
              backgroundColor: calOpen
                ? 'rgba(238,203,122,0.18)'
                : theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(176,115,22,0.08)',
              borderColor: calOpen ? 'rgba(238,203,122,0.6)' : 'rgba(238,203,122,0.25)',
            },
            pressed && { transform: [{ scale: 0.97 }] },
          ]}
        >
          <CalendarIcon color={theme.goldText} size={14} />
          <Text style={[styles.dateText, { color: theme.isDark ? '#eeeeee' : theme.text }]}>{lang === 'hi' ? aDateHi(selectedDate) : fmtDate(selectedDate)}</Text>
          <View style={{ transform: [{ rotate: calOpen ? '180deg' : '0deg' }] }}>
            <Chev color={theme.goldText} />
          </View>
        </Pressable>
      </View>

      {/* Active card — web: black bg + subtle gold radial at 30% 50% */}
      <View
        style={[
          styles.activeCard,
          {
            backgroundColor: theme.isDark ? 'rgba(2,2,4,0.96)' : '#fffdf6',
            borderColor: theme.isDark ? 'rgba(238,203,122,0.42)' : 'rgba(176,115,22,0.34)',
          },
        ]}
      >
        {theme.isDark && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Svg width="100%" height="100%">
              <Defs>
                <RadialGradient id="acGlow" cx="28%" cy="50%" r="65%">
                  <Stop offset="0%" stopColor="#dcb450" stopOpacity={0.18} />
                  <Stop offset="100%" stopColor="#dcb450" stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Circle cx="28%" cy="50%" r="70%" fill="url(#acGlow)" />
            </Svg>
          </View>
        )}
        <LinearGradient
          pointerEvents="none"
          colors={['transparent', 'rgba(252,232,168,0.72)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.activeTopLine}
        />
        {/* web ≤480 grid: label top-left, timer right, yantra | name+time below */}
        <View style={styles.activeBody}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.activeLabelRow}>
              <LiveDot color={hAccent} />
              <Text style={[styles.activeLabel, { color: goldDim }]}>{isToday && active ? tr('cg.currentlyActive', 'CURRENTLY ACTIVE') : tr('cg.dayBegins', 'DAY BEGINS WITH')}</Text>
            </View>
            <View style={styles.activeRow}>
              <View style={styles.yantraWrap}>
                <YantraGlow size={90} />
                <YantraArt size={62} />
              </View>
              <View style={styles.activeInfo}>
                <View style={styles.activeNameRow}>
                  <Text style={[styles.activeName, { color: hAccent, textShadowColor: hAccent, textShadowRadius: 14, textShadowOffset: { width: 0, height: 0 } }]}>{aPeriod(highlight.name, lang).toUpperCase()}</Text>
                  <CheckIcon color={hAccent} />
                </View>
                <View style={[styles.timeRow, { backgroundColor: theme.isDark ? 'rgba(0,0,0,0.4)' : 'rgba(176,115,22,0.07)' }]}>
                  <ClockIcon color={theme.goldText} size={12} />
                  <Text style={[styles.activeTime, { color: theme.goldText }]}>{fmtTime(highlight.start)} - {fmtTime(highlight.end)}</Text>
                </View>
              </View>
            </View>
          </View>
          <ActiveTimer
            active={isToday ? active : undefined}
            durMin={durMin}
            accent={hAccent}
            track={theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(176,115,22,0.18)'}
            textColor={theme.text}
            mutedColor={theme.textMuted}
          />
        </View>
        {/* description — separated by a soft gold rule (web ≤480 layout) */}
        <Text style={[styles.activeDesc, { color: theme.isDark ? '#b8b8b8' : theme.textSoft, borderTopColor: 'rgba(238,203,122,0.28)' }]}>
          {aPeriodDesc(highlight.name, lang) || highlight.meta.desc}
        </Text>
      </View>

      {/* AI Muhurat Finder — best window for the user's activity */}
      <Pressable
        onPress={() => { hTap(); setMuhuratOpen(true); }}
        style={({ pressed }) => [pressed && { transform: [{ scale: 0.99 }] }]}
      >
        <LinearGradient
          colors={theme.isDark ? ['rgba(238,203,122,0.18)', 'rgba(20,15,6,0.5)'] : ['#fdf2d4', '#fffaf0']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.muhuratCta, { borderColor: theme.isDark ? 'rgba(238,203,122,0.4)' : 'rgba(176,115,22,0.3)' }]}
        >
          <View style={[styles.muhuratIcon, { borderColor: 'rgba(238,203,122,0.55)', backgroundColor: theme.isDark ? 'rgba(0,0,0,0.4)' : 'rgba(176,115,22,0.07)' }]}>
            <Sparkle color={theme.goldText} size={18} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <GradientText style={styles.muhuratTitle}>{lang === 'hi' ? 'शुभ मुहूर्त खोजें' : 'Find Your Muhurat'}</GradientText>
            <Text style={[styles.muhuratSub, { color: theme.isDark ? '#b8b8b8' : theme.textSoft }]} numberOfLines={2}>
              {lang === 'hi' ? 'अपने काम के लिए आज का सबसे शुभ समय जानें' : "Find today's best auspicious time for your work"}
            </Text>
          </View>
          <Chev color={theme.goldText} dir="right" size={16} />
        </LinearGradient>
      </Pressable>

      {/* Today's list */}
      <SectionHeader
        icon={<ClockIcon color={goldDim} size={15} />}
        label={isToday ? tr('cg.todays', "TODAY'S CHOGHADIYA") : `CHOGHADIYA · ${selectedDate.getDate()} ${MONTHS_FULL[selectedDate.getMonth()].substring(0, 3).toUpperCase()}`}
        color={goldDim}
        rule={theme.isDark ? 'rgba(201,150,46,0.45)' : 'rgba(176,115,22,0.35)'}
      />
      <View
        style={[
          styles.listCard,
          {
            backgroundColor: theme.isDark ? 'rgba(0,0,0,0.88)' : '#ffffff',
            borderColor: theme.isDark ? 'rgba(238,203,122,0.34)' : 'rgba(176,115,22,0.28)',
          },
        ]}
      >
        <View style={{ gap: 8 }}>
          {listRows}
        </View>
        {/* location line (web .cg-location) */}
        <View style={styles.locationRow}>
          <PinIcon color={theme.isDark ? '#777777' : theme.textMuted} />
          <Text style={[styles.locationText, { color: theme.isDark ? '#777777' : theme.textMuted }]}>
            {sun
              ? `${lang === 'hi' ? 'वास्तविक सूर्योदय/सूर्यास्त' : 'Real sunrise/sunset'} · ${placeName}`
              : `${lang === 'hi' ? 'आपके स्थान के अनुसार समय' : 'Timings based on your location'} (${placeName})`}
          </Text>
        </View>
      </View>

      <ChoghadiyaActivities activeChoghadiya={isToday && active ? active.name : undefined} />

      <ChoghadiyaSpecialMessage
        activeName={highlight.name}
        desc={aiMsg || highlight.meta.desc}
        timeRange={`${fmtTime(highlight.start)} to ${fmtTime(highlight.end)}`}
        today={isToday && !!active}
      />

      {/* Upcoming — ✦ sparkle title (web cg-title small variant) */}
      <View style={styles.upTitleRow}>
        <Sparkle color={theme.goldText} size={13} />
        <GradientText style={styles.upTitleText}>{tr('cg.upcoming', 'UPCOMING AUSPICIOUS TIMINGS')}</GradientText>
        <Sparkle color={theme.goldText} size={13} />
      </View>
      <View style={styles.upGrid}>
        {upcoming.map((p, i) => {
          const isAmrit = p.name === 'Amrit';
          // all-side gradient border — gold by default, green-gold for the
          // most-auspicious Amrit card. Matches the app's premium gold cards.
          const borderColors = isAmrit
            ? (['#bdf0bd', '#32cd32', '#1f7a35', '#7ee07e'] as const)
            : (['#fce8a8', '#e9b850', '#a17613', '#f6d27a'] as const);
          return (
            <LinearGradient
              key={i}
              colors={borderColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.upBorder}
            >
              <LinearGradient
                colors={theme.isDark
                  ? ['rgba(36,28,12,0.85)', 'rgba(8,6,3,0.96)']
                  : ['#fffdf7', '#fff6e6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.upInner}
              >
                {/* gold medallion icon */}
                <LinearGradient
                  colors={isAmrit ? ['rgba(50,205,50,0.22)', 'rgba(50,205,50,0.05)'] : ['rgba(252,232,168,0.26)', 'rgba(238,203,122,0.06)']}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={[styles.upIcon, { borderColor: isAmrit ? 'rgba(50,205,50,0.5)' : 'rgba(238,203,122,0.5)' }]}
                >
                  <ChoghadiyaSymbol name={p.name} color={isAmrit ? '#5fe07f' : theme.goldText} size={19} />
                </LinearGradient>

                <Text style={[styles.upName, { color: isAmrit ? '#7be89a' : theme.goldText }]}>{aPeriod(p.name, lang).toUpperCase()}</Text>

                {/* tiny gold divider under the name */}
                <LinearGradient
                  colors={['transparent', isAmrit ? 'rgba(50,205,50,0.7)' : theme.goldText, 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.upDivider}
                />

                <Text
                  style={[styles.upTime, { color: theme.isDark ? '#e7d8b4' : theme.textMuted }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                >
                  {fmtTime(p.start)} - {fmtTime(p.end)}
                </Text>

                <Text style={[styles.upBlurb, { color: theme.green }]}>{lang === 'hi' ? (aBlurb(p.name, lang) || 'शुभ') : (UPCOMING_BLURB[p.name] || 'AUSPICIOUS')}</Text>
              </LinearGradient>
            </LinearGradient>
          );
        })}
      </View>

      {/* Gold calendar (web .cg-cal) */}
      <CgCalendar
        visible={calOpen}
        initial={selectedDate}
        onConfirm={confirmDate}
        onClose={() => setCalOpen(false)}
      />

      {/* Muhurat Finder bottom-sheet */}
      <Modal visible={muhuratOpen} transparent animationType="slide" onRequestClose={() => setMuhuratOpen(false)}>
        <Pressable style={mh.backdrop} onPress={() => setMuhuratOpen(false)}>
          <Pressable style={[mh.sheet, { backgroundColor: theme.isDark ? '#0b0913' : '#fffdf6', borderColor: 'rgba(238,203,122,0.45)' }]} onPress={(e) => e.stopPropagation()}>
            <View style={mh.handle} />
            <View style={mh.headRow}>
              <Sparkle color={theme.goldText} size={17} />
              <GradientText style={mh.title}>{lang === 'hi' ? 'शुभ मुहूर्त खोजें' : 'Find Your Muhurat'}</GradientText>
            </View>
            <Text style={[mh.sub, { color: theme.textMuted }]}>{lang === 'hi' ? 'काम चुनें — आज के चौघड़िया से सबसे अच्छा समय बताएँगे' : "Pick a task — we'll suggest today's best window from the Choghadiya"}</Text>

            <View style={mh.chips}>
              {MUHURAT_ACTIVITIES.map((a) => {
                const label = lang === 'hi' ? a.hi : a.en;
                const on = muhuratResult?.label === label;
                return (
                  <Pressable key={a.en} onPress={() => askMuhurat(a.en, label)} disabled={muhuratBusy}
                    style={({ pressed }) => [mh.chip, { borderColor: on ? theme.goldText : (theme.isDark ? 'rgba(238,203,122,0.3)' : 'rgba(176,115,22,0.28)'), backgroundColor: on ? 'rgba(238,203,122,0.16)' : 'transparent' }, pressed && { transform: [{ scale: 0.96 }] }]}>
                    <Text style={[mh.chipTxt, { color: theme.isDark ? '#eee' : theme.text }]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>

            {muhuratBusy && <View style={mh.loading}><Text style={[mh.loadingTxt, { color: theme.goldText }]}>{lang === 'hi' ? 'सबसे शुभ समय खोज रहे हैं…' : 'Finding the best window…'}</Text></View>}

            {!!muhuratResult && !muhuratBusy && (
              <LinearGradient colors={['#fce8a8', '#e9b850', '#a17613']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={mh.resultBorder}>
                <View style={[mh.result, { backgroundColor: theme.isDark ? '#0e0b16' : '#fffdf7' }]}>
                  <Text style={[mh.resultLabel, { color: theme.textMuted }]}>{(lang === 'hi' ? 'के लिए शुभ समय' : 'BEST TIME FOR').toUpperCase()} · {muhuratResult.label}</Text>
                  <View style={mh.resultNameRow}>
                    {!!muhuratMatched && <ChoghadiyaSymbol name={muhuratMatched.name} color={accentFor(theme, muhuratMatched.meta.color)} size={20} />}
                    <Text style={[mh.resultName, { color: muhuratMatched ? accentFor(theme, muhuratMatched.meta.color) : theme.goldText }]}>
                      {aPeriod(muhuratResult.pick.period, lang).toUpperCase()}
                    </Text>
                  </View>
                  {!!muhuratMatched && <Text style={[mh.resultTime, { color: theme.text }]}>{fmtTime(muhuratMatched.start)} - {fmtTime(muhuratMatched.end)}</Text>}
                  <Text style={[mh.resultReason, { color: theme.isDark ? '#cfcfcf' : theme.textSoft }]}>{muhuratResult.pick.reason}</Text>
                </View>
              </LinearGradient>
            )}

            <Pressable onPress={() => setMuhuratOpen(false)} style={mh.close}><Text style={[mh.closeTxt, { color: theme.textMuted }]}>{lang === 'hi' ? 'बंद करें' : 'Close'}</Text></Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cgHeader: { alignItems: 'center', marginTop: 30, marginBottom: 26 },
  cgTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  cgTitleText: { fontFamily: fonts.cinzel, fontSize: 23, letterSpacing: 2.5, fontWeight: '700', lineHeight: 28 },
  subtitle: { textAlign: 'center', fontFamily: fonts.inter, fontSize: 13, marginTop: 12, marginBottom: 16 },
  datePill: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 30, paddingHorizontal: 16, paddingVertical: 9 },
  dateText: { fontFamily: fonts.interMed, fontSize: 12 },

  activeCard: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.48,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
  },
  activeTopLine: { position: 'absolute', top: 0, left: '12%', right: '12%', height: 1 },
  activeBody: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  activeRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 4 },
  yantraWrap: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  activeInfo: { flex: 1, minWidth: 0 },
  activeLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  activeLabel: { fontFamily: fonts.interSemi, fontSize: 10, letterSpacing: 1.4 },
  activeNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  activeName: { fontFamily: fonts.interBold, fontSize: 24, lineHeight: 26 },
  timeRow: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(238,203,122,0.34)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeTime: { fontFamily: fonts.inter, fontSize: 10.5 },
  ring: { width: 70, height: 70, alignItems: 'center', justifyContent: 'center' },
  ringLabel: { position: 'absolute', alignItems: 'center' },
  ringTime: { fontFamily: fonts.interBold, fontSize: 10.5 },
  ringLeft: { fontFamily: fonts.inter, fontSize: 7.5, letterSpacing: 0.4, marginTop: 2 },
  activeDesc: { fontFamily: fonts.inter, fontSize: 11, lineHeight: 16.5, marginTop: 12, paddingTop: 12, borderTopWidth: 1 },

  listHeadRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  listHead: { fontFamily: fonts.interMed, fontSize: 13, letterSpacing: 1 },
  headRule: { flex: 1, height: 1, borderRadius: 1, marginLeft: 4 },
  listCard: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.26,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 12, borderWidth: 1 },
  num: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  numText: { fontFamily: fonts.interBold, fontSize: 10 },
  rowIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowName: { fontFamily: fonts.interSemi, fontSize: 13 },
  rowTime: { fontFamily: fonts.inter, fontSize: 11, marginTop: 2 },
  rowTag: { fontFamily: fonts.interBold, fontSize: 9, letterSpacing: 0.5, textTransform: 'uppercase' },
  locationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16, marginBottom: 4 },
  locationText: { fontFamily: fonts.inter, fontSize: 10 },

  upTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 },
  upTitleText: { fontFamily: fonts.interSemi, fontSize: 13, letterSpacing: 1.3 },
  upGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  /* outer = all-side gold gradient border ring */
  upBorder: {
    flexGrow: 1, flexBasis: 100, minWidth: 100,
    borderRadius: 18, padding: 1.5, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  /* inner = premium dark-gold content area */
  upInner: {
    flex: 1, borderRadius: 16.5, alignItems: 'center',
    paddingTop: 16, paddingHorizontal: 8, paddingBottom: 14,
  },
  upIcon: {
    width: 44, height: 44, borderRadius: 22, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  upName: { fontFamily: fonts.interBold, fontSize: 13.5, letterSpacing: 1 },
  upDivider: { width: 26, height: 1.5, borderRadius: 1, marginTop: 6, marginBottom: 1, opacity: 0.7 },
  upTime: { fontFamily: fonts.interMed, fontSize: 10, marginTop: 5, alignSelf: 'stretch', textAlign: 'center' },
  upBlurb: { fontFamily: fonts.interBold, fontSize: 9, letterSpacing: 0.4, textAlign: 'center', marginTop: 7, lineHeight: 13, minHeight: 26 },

  // AI Muhurat Finder CTA
  muhuratCta: { flexDirection: 'row', alignItems: 'center', gap: 13, borderWidth: 1, borderRadius: 16, paddingVertical: 13, paddingHorizontal: 15, marginBottom: 24 },
  muhuratIcon: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  muhuratTitle: { fontFamily: fonts.cinzelSemi, fontSize: 15, letterSpacing: 0.4 },
  muhuratSub: { fontFamily: fonts.inter, fontSize: 11.5, lineHeight: 16, marginTop: 3 },
});

/* Muhurat Finder bottom-sheet styles */
const mh = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(2,3,10,0.6)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, borderWidth: 1, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 24 },
  handle: { alignSelf: 'center', width: 42, height: 4, borderRadius: 2, backgroundColor: 'rgba(238,203,122,0.4)', marginBottom: 14 },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { fontFamily: fonts.cinzel, fontSize: 19, letterSpacing: 1 },
  sub: { fontFamily: fonts.inter, fontSize: 12, textAlign: 'center', marginTop: 6, lineHeight: 17 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 16 },
  chip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9 },
  chipTxt: { fontFamily: fonts.interSemi, fontSize: 12.5 },
  loading: { alignItems: 'center', paddingVertical: 18 },
  loadingTxt: { fontFamily: fonts.interSemi, fontSize: 12.5 },
  resultBorder: { borderRadius: 16, padding: 1.5, marginTop: 16 },
  result: { borderRadius: 14.5, padding: 14, alignItems: 'center' },
  resultLabel: { fontFamily: fonts.interSemi, fontSize: 9.5, letterSpacing: 0.8 },
  resultNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 7 },
  resultName: { fontFamily: fonts.interBold, fontSize: 21, letterSpacing: 0.5 },
  resultTime: { fontFamily: fonts.interSemi, fontSize: 13, marginTop: 4 },
  resultReason: { fontFamily: fonts.inter, fontSize: 12.5, lineHeight: 19, textAlign: 'center', marginTop: 9 },
  close: { alignSelf: 'center', marginTop: 16, paddingVertical: 6 },
  closeTxt: { fontFamily: fonts.interSemi, fontSize: 13 },
});

/* calendar modal styles — web .cg-cal values */
const cgCal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(2,3,10,0.66)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  borderRing: { borderRadius: 20, padding: 1, width: 320, maxWidth: '100%' },
  card: { backgroundColor: '#030308', borderRadius: 19, paddingHorizontal: 14, paddingTop: 16, paddingBottom: 18 },

  head: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4, paddingBottom: 12 },
  title: { flex: 1, textAlign: 'center', fontFamily: fonts.cinzel, fontSize: 14, letterSpacing: 1.7, color: '#e6c277', textTransform: 'uppercase' },
  navBtn: {
    width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(238,203,122,0.08)', borderWidth: 1, borderColor: 'rgba(238,203,122,0.35)',
  },

  dowRow: { flexDirection: 'row', marginBottom: 6 },
  dow: { flex: 1, textAlign: 'center', fontFamily: fonts.cinzel, fontSize: 9.5, letterSpacing: 1, color: '#b89a5b', paddingVertical: 4 },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 2 },
  day: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: 'transparent' },
  dayToday: { borderColor: 'rgba(238,203,122,0.55)' },
  dayText: { fontFamily: fonts.interMed, fontSize: 13, color: '#eeeeee' },
  dayMuted: { flex: 1, textAlign: 'center', textAlignVertical: 'center', fontFamily: fonts.interMed, fontSize: 13, color: '#555555' },
  daySel: { alignSelf: 'stretch', flex: 1, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  daySelText: { fontFamily: fonts.interBold, fontSize: 13, color: '#2a1c00' },

  foot: { flexDirection: 'row', gap: 8, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(238,203,122,0.15)' },
  btn: {
    flex: 1, minHeight: 38, borderRadius: 999, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(238,203,122,0.4)', backgroundColor: 'rgba(0,0,0,0.5)',
  },
  btnText: { fontFamily: fonts.cinzel, fontSize: 11, letterSpacing: 1.3, color: '#e6c277', fontWeight: '700' },
  btnPrimaryWrap: { flex: 1, borderRadius: 999, overflow: 'hidden' },
  btnPrimary: { minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 999 },
  btnPrimaryText: { fontFamily: fonts.cinzel, fontSize: 11, letterSpacing: 1.3, color: '#2a1c00', fontWeight: '700' },
});
