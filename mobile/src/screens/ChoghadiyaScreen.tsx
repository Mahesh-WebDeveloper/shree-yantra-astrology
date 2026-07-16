import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Animated, Easing } from 'react-native';
import Svg, { Circle, Path, Polyline, Defs, RadialGradient, Stop, LinearGradient as SvgGrad } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { Theme, fonts } from '../theme/tokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { locationForPanchang } from '../lib/deviceLocation';
import { useScreen } from '../context/AppConfigProvider';
import { useT, useLang } from '../i18n/LanguageProvider';
import { Lang } from '../i18n/strings';
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
const YantraArt = React.memo(({ size = 64, dark = true }: { size?: number; dark?: boolean }) => (
  <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
    <Defs>
      <SvgGrad id="cgGold" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor={dark ? '#fce8a8' : '#70420a'} />
        <Stop offset="0.5" stopColor={dark ? '#e9b850' : '#5f3808'} />
        <Stop offset="1" stopColor={dark ? '#a17613' : '#332006'} />
      </SvgGrad>
    </Defs>
    {!dark && <Circle cx={60} cy={60} r={57} fill="#ffffff" opacity={0.86} />}
    <Circle cx={60} cy={60} r={56} stroke="url(#cgGold)" strokeWidth={dark ? 1.5 : 2.3} strokeDasharray="2 4" />
    <Circle cx={60} cy={60} r={48} stroke="url(#cgGold)" strokeWidth={dark ? 1 : 1.7} />
    <Circle cx={60} cy={60} r={32} stroke="url(#cgGold)" strokeWidth={dark ? 1 : 1.7} opacity={dark ? 0.6 : 0.95} />
    <Path d="M60 12 L96 78 H24 Z" stroke="url(#cgGold)" strokeWidth={dark ? 1.5 : 2.4} />
    <Path d="M60 108 L24 42 H96 Z" stroke="url(#cgGold)" strokeWidth={dark ? 1.5 : 2.4} />
    <Path d="M60 28 L80 64 H40 Z" stroke="url(#cgGold)" strokeWidth={dark ? 1 : 1.7} />
    <Path d="M60 92 L40 56 H80 Z" stroke="url(#cgGold)" strokeWidth={dark ? 1 : 1.7} />
    <Circle cx={60} cy={60} r={dark ? 4 : 5} fill="url(#cgGold)" />
  </Svg>
));

/** Pulsing gold radial glow behind the yantra (web .cg-yantra::before, 3s alternate). */
function YantraGlow({ size, dark = true }: { size: number; dark?: boolean }) {
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
            <Stop offset="0%" stopColor={dark ? '#eecb7a' : '#5f3808'} stopOpacity={dark ? 0.4 : 0.16} />
            <Stop offset="70%" stopColor={dark ? '#eecb7a' : '#5f3808'} stopOpacity={0} />
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

/* Defers mounting of below-the-fold sections so the first paint is instant.
   Children stay unmounted until `delay` ms after this component appears. */
function Deferred({ delay = 60, children }: { delay?: number; children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  if (!ready) return null;
  return <>{children}</>;
}

/* Consistent gold section header between blocks — label + thin gradient divider
   (same treatment as the Kundli screen's SectionTitle). */
function SectionTitle({ label }: { label: string }) {
  const { theme } = useTheme();
  return (
    <View style={styles.secTitleWrap}>
      <GradientText style={styles.secTitleText}>{label}</GradientText>
      <LinearGradient
        colors={theme.isDark ? ['rgba(233,184,80,0.55)', 'rgba(233,184,80,0.14)', 'rgba(0,0,0,0)'] : ['rgba(176,115,22,0.45)', 'rgba(176,115,22,0.12)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.secTitleRule}
        pointerEvents="none"
      />
    </View>
  );
}

/* ☀️/🌙 emoji ka rang badla nahi ja sakta — active gold gradient par gold emoji gayab ho
   jaata tha (dono themes me). SVG glyphs stroke/fill lete hai, to ink color hamesha padhne
   laayak contrast me rehta hai. */
const SunGlyph = ({ color }: { color: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round">
    <Circle cx={12} cy={12} r={4.2} />
    <Path d="M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7" />
  </Svg>
);
const MoonGlyph = ({ color }: { color: string }) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill={color}>
    <Path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </Svg>
);

/* ‹ › day-hop arrow with spring-press scale (matches the app's press feel).
   Opaque bg — this sits inside the rise()-animated header (Android composite bug). */
const DateArrow = React.memo(function DateArrow({ dir, onPress, theme }: { dir: 'left' | 'right'; onPress: () => void; theme: Theme }) {
  const sc = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(sc, { toValue: 0.88, speed: 40, bounciness: 5, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(sc, { toValue: 1, speed: 22, bounciness: 9, useNativeDriver: true }).start();
  return (
    <Animated.View style={{ transform: [{ scale: sc }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        hitSlop={8}
        style={[styles.dateArrow, { borderColor: 'rgba(238,203,122,0.25)', backgroundColor: theme.isDark ? '#141414' : '#f9f4ec' }]}
      >
        <View style={{ transform: [{ rotate: dir === 'left' ? '90deg' : '-90deg' }] }}><Chev color={theme.goldText} /></View>
      </Pressable>
    </Animated.View>
  );
});

/** Very subtle breathing glow behind the yantra — opacity 0.12↔0.22 over 4s,
    transform/opacity only (native driver), pointerEvents none. */
function BreathGlow({ size, color }: { size: number; color: string }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(a, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(a, { toValue: 0, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [a]);
  const opacity = a.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.22] });
  const scale = a.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: 'absolute', left: -(size - 64) / 2, top: -(size - 64) / 2, width: size, height: size, opacity, transform: [{ scale }] }}
    >
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id="cgBreath" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity={1} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#cgBreath)" />
      </Svg>
    </Animated.View>
  );
}

/** One row of the 8-period table — memoized with primitive/stable props so the
    15s clock tick re-renders ONLY the active row (its `pct` prop changes).
    Left accent strip = nature at a glance; past rows fade to 45%. */
const PeriodRow = React.memo(function PeriodRow({
  idx, name, time, tag, accent, isActive, isPast, pct, theme, lang,
}: {
  idx: number; name: string; time: string; tag: string; accent: string;
  isActive: boolean; isPast: boolean; pct: number; theme: Theme; lang: Lang;
}) {
  return (
    <View
      style={[
        styles.row,
        {
          // keep the SAME background for all rows — only the border highlights the active one (no inner fill/shadow)
          backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(176,115,22,0.04)',
          borderColor: isActive ? accent : (theme.isDark ? 'rgba(238,203,122,0.18)' : 'rgba(176,115,22,0.18)'),
          borderWidth: isActive ? 1.5 : 1,
          opacity: isPast ? 0.45 : 1,
        },
      ]}
    >
      {/* 4px left-edge strip in the period's accent — nature readable without reading */}
      <View style={[styles.rowEdge, { backgroundColor: accent }]} pointerEvents="none" />
      <View style={[styles.num, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(176,115,22,0.12)' }]}>
        <Text style={[styles.numText, { color: theme.isDark ? '#cccccc' : theme.textMuted }]}>{idx + 1}</Text>
      </View>
      <View style={[styles.rowIcon, { backgroundColor: accent + '26' }]}>
        <ChoghadiyaSymbol name={name} color={accent} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.rowName, { color: theme.isDark ? '#ffffff' : theme.text }]} numberOfLines={1}>
          {aPeriod(name, lang).toUpperCase()}{isActive ? (lang === 'hi' ? ' (वर्तमान)' : ' (VARTMAN)') : ''}
        </Text>
        <Text style={[styles.rowTime, { color: theme.isDark ? '#999999' : theme.textMuted }]}>{time}</Text>
      </View>
      <Text style={[styles.rowTag, { color: accent }]}>{tag}</Text>
      {/* live progress along the bottom edge of the running period (same fraction as the hero bar) */}
      {isActive && (
        <View style={[styles.rowFill, { backgroundColor: accent, width: `${Math.min(100, Math.max(0, pct))}%` }]} pointerEvents="none" />
      )}
    </View>
  );
});

/** Upcoming auspicious card — memoized so the 15s tick doesn't re-render the grid. */
const UpcomingCard = React.memo(function UpcomingCard({ name, time, theme, lang }: { name: string; time: string; theme: Theme; lang: Lang }) {
  const isAmrit = name === 'Amrit';
  // all-side gradient border — gold by default, green-gold for the
  // most-auspicious Amrit card. Matches the app's premium gold cards.
  const borderColors = isAmrit
    ? (['#bdf0bd', '#32cd32', '#1f7a35', '#7ee07e'] as const)
    : (['#fce8a8', '#e9b850', '#a17613', '#f6d27a'] as const);
  return (
    <LinearGradient colors={borderColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.upBorder}>
      <LinearGradient
        colors={theme.isDark ? ['rgba(36,28,12,0.85)', 'rgba(8,6,3,0.96)'] : ['#fffdf7', '#fff6e6']}
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
          <ChoghadiyaSymbol name={name} color={isAmrit ? '#5fe07f' : theme.goldText} size={19} />
        </LinearGradient>

        <Text style={[styles.upName, { color: isAmrit ? '#7be89a' : theme.goldText }]}>{aPeriod(name, lang).toUpperCase()}</Text>

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
          {time}
        </Text>

        <Text style={[styles.upBlurb, { color: theme.green }]}>{lang === 'hi' ? (aBlurb(name, lang) || 'शुभ') : (UPCOMING_BLURB[name] || 'AUSPICIOUS')}</Text>
      </LinearGradient>
    </LinearGradient>
  );
});

export function ChoghadiyaScreen({ navigation }: any) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
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

  // Location for sunrise/sunset — the user's CURRENT place (device GPS). Choghadiya is
  // driven entirely by sunrise/sunset, so it must follow where the user actually IS, not
  // where they were born. (Birth place is for the kundli.) No GPS permission → fall back
  // to the profile place, then Jaipur — exactly the old behaviour.
  const [placeName, setPlaceName] = useState('Jaipur');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  // Real sunrise/sunset (VedAstro / Swiss Ephemeris) for the selected date.
  // null until the first fetch lands → buildPeriods falls back to demo constants.
  const [sun, setSun] = useState<SunTimes | null>(null);
  // Next day's sunrise — the night choghadiya's true end (dawn drifts ~1 min/day).
  const [nextSunrise, setNextSunrise] = useState<{ h: number; m: number } | null>(null);

  useEffect(() => {
    let on = true;
    (async () => {
      const b: any = await birthFromProfile().catch(() => null);
      const fallback = b?.place || 'Jaipur';
      const loc = await locationForPanchang(fallback);
      if (!on) return;
      setPlaceName(loc.city);
      setCoords(loc.fromGps && loc.lat != null && loc.lng != null ? { lat: loc.lat, lng: loc.lng } : null);
    })();
    return () => { on = false; };
  }, []);

  // Fetch real sunrise/sunset whenever the date or place changes — selected date AND the
  // next day (its sunrise closes tonight's choghadiya), in parallel.
  useEffect(() => {
    let cancelled = false;
    setSun(null); // avoid showing stale times for the previous date
    setNextSunrise(null);
    const where = coords ? { lat: coords.lat, lng: coords.lng } : { place: placeName };
    const tomorrow = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + 1);
    getSunTimes({ ...where, date: apiDate(selectedDate) })
      .then((r) => { if (!cancelled) setSun({ sunrise: r.sunrise, sunset: r.sunset }); })
      .catch(() => { /* network down → buildPeriods uses demo fallback */ });
    getSunTimes({ ...where, date: apiDate(tomorrow) })
      .then((r) => { if (!cancelled) setNextSunrise(r.sunrise); })
      .catch(() => { /* fallback: same-day sunrise (≤1 min off) */ });
    return () => { cancelled = true; };
  }, [selectedDate, placeName, coords]);

  const isToday = sameDay(selectedDate, now);
  const periods = useMemo(
    () => buildPeriods(selectedDate, sun ?? undefined, nextSunrise ?? undefined),
    [selectedDate, sun, nextSunrise]
  );
  const dayList = useMemo(() => periods.slice(0, 8), [periods]);
  const nightList = useMemo(() => periods.slice(8, 16), [periods]);

  // Before dawn, the running choghadiya belongs to YESTERDAY's night table — today's
  // periods only start at today's sunrise, so findActive(today) has a pre-dawn hole.
  const yesterdayPeriods = useMemo(() => {
    if (!isToday || !sun || now >= periods[0].start) return null;
    const y = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() - 1);
    return buildPeriods(y, sun ?? undefined, sun?.sunrise);
  }, [isToday, sun, now, periods, selectedDate]);

  // active period (today only); for other dates highlight the first auspicious daytime one
  const active = isToday ? (findActive(periods, now) ?? (yesterdayPeriods ? findActive(yesterdayPeriods, now) : undefined)) : undefined;

  // ☀️/🌙 list toggle — opens on the phase that is live right now (night after sunset
  // and before dawn), so the user lands on the table that answers "अभी कौनसा?"
  const [phaseTab, setPhaseTab] = useState<'day' | 'night'>('day');
  const autoPhased = useRef('');
  useEffect(() => {
    const key = `${selectedDate.toDateString()}|${sun ? 'live' : 'demo'}`;
    if (autoPhased.current === key) return;
    autoPhased.current = key;
    if (isToday && (active?.phase === 'night' || (sun && now < periods[0].start))) setPhaseTab('night');
    else setPhaseTab('day');
  }, [selectedDate, sun, isToday, active, now, periods]);
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

  // how far through the CURRENT period we are — rides the existing 15s clock
  // tick (no extra timer). Rounded to whole % so the active row's memo only
  // breaks when the value actually moves.
  const progressPct = isToday && active
    ? Math.min(100, Math.max(0, Math.round(((now.getTime() - active.start.getTime()) / (active.end.getTime() - active.start.getTime())) * 100)))
    : 0;

  // if RIGHT NOW is inauspicious → the very next auspicious window (answers
  // the page's #1 question instantly). Pre-dawn the active period lives in
  // yesterday's table, so search both pools.
  const nextGood = useMemo(() => {
    if (!isToday || !active || active.meta.nature !== 'bad') return null;
    const pool = [...(yesterdayPeriods ?? []), ...periods]
      .filter((p) => p.meta.nature === 'good' && p.start > now)
      .sort((a, b) => a.start.getTime() - b.start.getTime());
    return pool[0] ?? null;
  }, [isToday, active, periods, yesterdayPeriods, now]);

  // which phase table contains the period running right now (today only) —
  // drives the tiny live dot on the day/night toggle
  const livePhase: 'day' | 'night' | null = isToday && active ? active.phase : null;

  // ‹ › one-day hops (stable refs for the memoized spring-press arrows)
  const goPrev = useCallback(() => { hTap(); setSelectedDate((d) => stripTime(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1))); }, []);
  const goNext = useCallback(() => { hTap(); setSelectedDate((d) => stripTime(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1))); }, []);

  // entrance — light fade+rise on the header + active card only (first paint stays instant)
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enter, { toValue: 1, duration: 620, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [enter]);
  const rise = (start: number) => ({
    opacity: enter.interpolate({ inputRange: [start, Math.min(1, start + 0.45)], outputRange: [0, 1], extrapolate: 'clamp' as const }),
    transform: [{ translateY: enter.interpolate({ inputRange: [start, Math.min(1, start + 0.45)], outputRange: [18, 0], extrapolate: 'clamp' as const }) }],
  });

  // 8-row list — rows are memoized (<PeriodRow/>) with primitive props, so the
  // 15s clock tick re-renders only the active row (its pct prop moves)
  const phaseList = phaseTab === 'night' ? nightList : dayList;

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
    <Screen header={<BrandHeader onMenu={openMenu} onBell={() => navigation.navigate('Notifications')} />}>

      {/* cg-header: ornament ✦ CHOGHADIYA ✦ ornament + subtitle + date pill.
          rise() entrance — every surface inside is opaque (Android hardware-layer
          white-composite bug with translucent fills in animated wrappers). */}
      <Animated.View style={[styles.cgHeader, rise(0)]}>
        <View style={styles.cgTitle}>
          <TitleOrnament color={theme.gold2} />
          <Sparkle color={theme.goldText} size={13} />
          <GradientText style={styles.cgTitleText}>{lang === 'hi' ? 'चौघड़िया' : 'CHOGHADIYA'}</GradientText>
          <Sparkle color={theme.goldText} size={13} />
          <TitleOrnament color={theme.gold2} flip />
        </View>
        <Text style={[styles.subtitle, { color: theme.isDark ? '#aaaaaa' : theme.textMuted }]}>{cg.t('subtitle', lang === 'hi' ? 'आज के शुभ व अशुभ समय जानें' : "Know Today's Auspicious & Inauspicious Timings")}</Text>

        {/* Drik-style date row: ‹ › hop one day (the common planning move), the pill opens
            the calendar for far dates, and today itself needs no navigation at all. */}
        <View style={styles.dateRow}>
          <DateArrow dir="left" onPress={goPrev} theme={theme} />

          <Pressable
            onPress={() => { hTap(); setCalOpen(true); }}
            style={({ pressed }) => [
              styles.datePill,
              {
                // opaque fills — inside the rise() wrapper
                backgroundColor: calOpen
                  ? (theme.isDark ? '#2b2516' : '#fcf6e7')
                  : theme.isDark ? '#141414' : '#f9f4ec',
                borderColor: calOpen ? 'rgba(238,203,122,0.6)' : 'rgba(238,203,122,0.25)',
              },
              pressed && { transform: [{ scale: 0.97 }] },
            ]}
          >
            <CalendarIcon color={theme.goldText} size={14} />
            <Text style={[styles.dateText, { color: theme.isDark ? '#eeeeee' : theme.text }]}>
              {isToday ? (lang === 'hi' ? 'आज · ' : 'Today · ') : ''}{lang === 'hi' ? aDateHi(selectedDate) : fmtDate(selectedDate)}
            </Text>
            <View style={{ transform: [{ rotate: calOpen ? '180deg' : '0deg' }] }}>
              <Chev color={theme.goldText} />
            </View>
          </Pressable>

          <DateArrow dir="right" onPress={goNext} theme={theme} />
        </View>

        {/* one tap back to the live view when browsing another date */}
        {!isToday && (
          <Pressable
            onPress={() => { hTap(); setSelectedDate(stripTime(new Date())); }}
            style={({ pressed }) => [styles.todayChip, { borderColor: theme.gold2 + '66', backgroundColor: theme.isDark ? '#1c160a' : '#fcf4e5' }, pressed && { transform: [{ scale: 0.95 }] }]}
          >
            <Text style={[styles.todayChipText, { color: theme.goldText }]}>{lang === 'hi' ? '↩ आज पर लौटें' : '↩ Back to Today'}</Text>
          </Pressable>
        )}
      </Animated.View>

      {/* Active card — web: black bg + subtle gold radial at 30% 50%.
          rise() entrance → bg must be a solid hex (translucent fills inside
          transform-animated views composite white on Android). */}
      <Animated.View
        style={[
          styles.activeCard,
          rise(0.18),
          {
            backgroundColor: theme.isDark ? '#020204' : '#ffffff',
            borderColor: theme.isDark ? 'rgba(238,203,122,0.42)' : theme.cardBorder,
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
          colors={theme.isDark ? ['transparent', 'rgba(252,232,168,0.72)', 'transparent'] : ['transparent', 'rgba(95,56,8,0.28)', 'transparent']}
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
              <View style={{ width: 64, height: 64 }}>
                {/* subtle breathing halo behind the yantra (0.12↔0.22, 4s) */}
                <BreathGlow size={120} color={theme.isDark ? '#e9b850' : '#f0b429'} />
                <View style={[styles.yantraWrap, { backgroundColor: theme.isDark ? 'transparent' : '#ffffff', borderColor: theme.isDark ? 'transparent' : theme.cardBorder, borderWidth: theme.isDark ? 0 : 1 }]}>
                  <YantraGlow size={90} dark={theme.isDark} />
                  <YantraArt size={62} dark={theme.isDark} />
                </View>
              </View>
              <View style={styles.activeInfo}>
                <View style={styles.activeNameRow}>
                  <Text style={[styles.activeName, { color: hAccent, textShadowColor: hAccent, textShadowRadius: 14, textShadowOffset: { width: 0, height: 0 } }]}>{aPeriod(highlight.name, lang).toUpperCase()}</Text>
                  <CheckIcon color={hAccent} />
                </View>
                <View style={[styles.timeRow, { backgroundColor: theme.isDark ? '#010102' : '#f4f1ee' }]}>
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
            track={theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(95,56,8,0.18)'}
            textColor={theme.text}
            mutedColor={theme.textMuted}
          />
        </View>
        {/* live progress — how far through the current period we are (15s tick) */}
        {isToday && !!active && (
          <View style={[styles.heroTrack, { backgroundColor: theme.isDark ? '#1f1b12' : '#efe7d8' }]}>
            <LinearGradient
              colors={theme.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.heroFill, { width: `${progressPct}%` }]}
            />
          </View>
        )}
        {/* inauspicious right now → answer the #1 question: when is the next good window? */}
        {isToday && !!active && active.meta.nature === 'bad' && !!nextGood && (
          <View style={styles.nextGoodRow}>
            <Sparkle color={theme.isDark ? '#7be89a' : theme.green} size={11} />
            <Text style={[styles.nextGoodText, { color: theme.isDark ? '#7be89a' : theme.green }]} numberOfLines={1}>
              {lang === 'hi'
                ? `अगला शुभ समय: ${aPeriod(nextGood.name, lang)} · ${fmtTime(nextGood.start)}`
                : `Next auspicious: ${aPeriod(nextGood.name, lang)} · ${fmtTime(nextGood.start)}`}
            </Text>
          </View>
        )}
        {/* description — separated by a soft gold rule (web ≤480 layout) */}
        <Text style={[styles.activeDesc, { color: theme.isDark ? '#b8b8b8' : theme.textSoft, borderTopColor: 'rgba(238,203,122,0.28)' }]}>
          {aPeriodDesc(highlight.name, lang) || highlight.meta.desc}
        </Text>
      </Animated.View>

      {/* AI Muhurat Finder — best window for the user's activity */}
      <Pressable
        onPress={() => { hTap(); setMuhuratOpen(true); }}
        style={({ pressed }) => [pressed && { transform: [{ scale: 0.99 }] }]}
      >
        <LinearGradient
          colors={theme.isDark ? ['rgba(238,203,122,0.18)', 'rgba(20,15,6,0.5)'] : ['#fdf2d4', '#fffaf0']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.muhuratCta, { borderColor: theme.isDark ? 'rgba(238,203,122,0.4)' : theme.cardBorder }]}
        >
          <View style={[styles.muhuratIcon, { borderColor: theme.isDark ? 'rgba(238,203,122,0.55)' : theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.4)' : '#ffffff' }]}>
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
      <SectionTitle
        label={isToday
          ? tr('cg.todays', lang === 'hi' ? 'आज का चौघड़िया' : "TODAY'S CHOGHADIYA")
          : (lang === 'hi'
            ? `चौघड़िया · ${selectedDate.getDate()} ${MONTHS_FULL[selectedDate.getMonth()].substring(0, 3).toUpperCase()}`
            : `CHOGHADIYA · ${selectedDate.getDate()} ${MONTHS_FULL[selectedDate.getMonth()].substring(0, 3).toUpperCase()}`)}
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
        {/* ☀️ दिन | 🌙 रात — full 24-hour choghadiya, 8 periods per phase */}
        <View style={[styles.phaseWrap, { borderColor: theme.cardBorder, backgroundColor: theme.cardBg }]}>
          {([['day', lang === 'hi' ? 'दिन' : 'Day'], ['night', lang === 'hi' ? 'रात' : 'Night']] as ['day' | 'night', string][]).map(([key, label]) => {
            const on = phaseTab === key;
            const live = livePhase === key; // this side holds the period running RIGHT NOW
            const ink = on ? theme.goldInk : theme.textMuted;
            return (
              <Pressable key={key} onPress={() => { hTap(); setPhaseTab(key); }} style={styles.phaseBtn}>
                {on && <LinearGradient colors={theme.buttonGradient} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />}
                <View style={styles.phaseLabelRow}>
                  {key === 'day' ? <SunGlyph color={ink} /> : <MoonGlyph color={ink} />}
                  <Text style={[styles.phaseBtnText, { color: ink }]}>{label}</Text>
                  {live && <View style={[styles.phaseLiveDot, { backgroundColor: on ? theme.goldInk : theme.green }]} />}
                </View>
              </Pressable>
            );
          })}
        </View>
        <Text style={[styles.phaseHint, { color: theme.textMuted }]}>
          {phaseTab === 'day'
            ? (lang === 'hi' ? 'सूर्योदय से सूर्यास्त तक' : 'Sunrise to sunset')
            : (lang === 'hi' ? 'सूर्यास्त से अगले सूर्योदय तक' : 'Sunset to next sunrise')}
        </Text>
        <View style={{ gap: 8 }}>
          {phaseList.map((p, i) => (
            <PeriodRow
              key={`${p.name}-${i}`}
              idx={i}
              name={p.name}
              time={`${fmtTime(p.start)} - ${fmtTime(p.end)}`}
              tag={aTag(p.meta.tag, lang)}
              accent={accentFor(theme, p.meta.color)}
              isActive={active === p}
              isPast={isToday && p.end.getTime() <= now.getTime()}
              pct={active === p ? progressPct : 0}
              theme={theme}
              lang={lang}
            />
          ))}
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

      {/* Everything below the list card mounts staggered — first paint stays instant */}
      <Deferred delay={80}>
        <ChoghadiyaActivities activeChoghadiya={isToday && active ? active.name : undefined} />
      </Deferred>

      <Deferred delay={160}>
        <ChoghadiyaSpecialMessage
          activeName={aPeriod(highlight.name, lang)}
          desc={aiMsg || aPeriodDesc(highlight.name, lang) || highlight.meta.desc}
          timeRange={lang === 'hi'
            ? `${fmtTime(highlight.start)} से ${fmtTime(highlight.end)} तक`
            : `${fmtTime(highlight.start)} to ${fmtTime(highlight.end)}`}
          today={isToday && !!active}
        />
      </Deferred>

      {/* Upcoming — gold SectionTitle + memoized cards */}
      <Deferred delay={240}>
        <SectionTitle label={tr('cg.upcoming', lang === 'hi' ? 'आगामी शुभ समय' : 'UPCOMING AUSPICIOUS TIMINGS')} />
        <View style={styles.upGrid}>
          {upcoming.map((p, i) => (
            <UpcomingCard
              key={`${p.name}-${i}`}
              name={p.name}
              time={`${fmtTime(p.start)} - ${fmtTime(p.end)}`}
              theme={theme}
              lang={lang}
            />
          ))}
        </View>
      </Deferred>

      <Deferred delay={320}>
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
          <Pressable style={[mh.sheet, { backgroundColor: theme.isDark ? '#0b0913' : '#fffdf6', borderColor: 'rgba(238,203,122,0.45)', paddingBottom: insets.bottom + 24 }]} onPress={(e) => e.stopPropagation()}>
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
      </Deferred>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cgHeader: { alignItems: 'center', marginTop: 30, marginBottom: 26 },
  cgTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  cgTitleText: { fontFamily: fonts.cinzel, fontSize: 23, letterSpacing: 2.5, fontWeight: '700', lineHeight: 28 },
  subtitle: { textAlign: 'center', fontFamily: fonts.inter, fontSize: 13, marginTop: 12, marginBottom: 16 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateArrow: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  todayChip: { marginTop: 8, borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  todayChipText: { fontFamily: fonts.interSemi, fontSize: 11.5 },
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
  yantraWrap: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
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
  // live progress through the current period (hero bar)
  heroTrack: { height: 4, borderRadius: 2, marginTop: 14, overflow: 'hidden' },
  heroFill: { height: 4, borderRadius: 2 },
  nextGoodRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 9 },
  nextGoodText: { fontFamily: fonts.interSemi, fontSize: 11.5, flexShrink: 1 },

  // gold section header between blocks (Kundli SectionTitle treatment)
  secTitleWrap: { marginBottom: 14 },
  secTitleText: { fontFamily: fonts.cinzel, fontSize: 13, letterSpacing: 1.8, textTransform: 'uppercase' },
  secTitleRule: { height: 1, marginTop: 7 },

  phaseWrap: { flexDirection: 'row', gap: 4, padding: 4, borderWidth: 1, borderRadius: 12, marginBottom: 6 },
  phaseBtn: { flex: 1, paddingVertical: 9, alignItems: 'center', justifyContent: 'center', borderRadius: 9, overflow: 'hidden' },
  phaseLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  phaseBtnText: { fontFamily: fonts.interBold, fontSize: 13 },
  phaseLiveDot: { width: 5, height: 5, borderRadius: 2.5 },
  phaseHint: { fontFamily: fonts.inter, fontSize: 11, textAlign: 'center', marginBottom: 10 },
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, paddingRight: 10, paddingLeft: 14, borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  // 4px accent strip on the left edge — nature visible at a glance
  rowEdge: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderTopRightRadius: 2, borderBottomRightRadius: 2 },
  // active row's live progress along the bottom edge
  rowFill: { position: 'absolute', left: 0, bottom: 0, height: 3, borderRadius: 1.5, opacity: 0.6 },
  num: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  numText: { fontFamily: fonts.interBold, fontSize: 10 },
  rowIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowName: { fontFamily: fonts.interSemi, fontSize: 12.5, letterSpacing: 0.3 },
  rowTime: { fontFamily: fonts.inter, fontSize: 10.5, marginTop: 2, fontVariant: ['tabular-nums'] },
  rowTag: { fontFamily: fonts.interBold, fontSize: 9, letterSpacing: 0.5, textTransform: 'uppercase' },
  locationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16, marginBottom: 4 },
  locationText: { fontFamily: fonts.inter, fontSize: 10 },

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
