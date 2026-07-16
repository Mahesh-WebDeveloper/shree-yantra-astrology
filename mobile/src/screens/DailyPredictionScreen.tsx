import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Share, Animated, Easing } from 'react-native';
// Stack screens par edge-swipe-back (gestureEnabled horizontal) RN core ScrollView ke
// horizontal pan ko kha jaata hai — gesture-handler ka ScrollView stack ke gesture ke
// saath cooperate karta hai, isliye rails yahi use karte hai.
import { ScrollView } from 'react-native-gesture-handler';
import Svg, { Path, Circle, Line, Polyline } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { Theme, fonts, radii } from '../theme/tokens';
import { Page } from '../components/Page';
import { Card } from '../components/Card';
import { GradientText } from '../components/GradientText';
import { CrownIcon, CalendarIcon, ClockIcon } from '../components/icons/ProfileIcons';
import { ZodiacIcon } from '../components/icons/ZodiacIcon';
import { SaralVivaran } from '../components/SaralVivaran';
import { hTap, hSelect } from '../lib/haptics';
import { getPanchang, PanchangResponse, getDailyPrediction, DailyPrediction, PredPeriod } from '../lib/api';
import { PeriodForecast } from '../components/PeriodForecast';
import { birthFromProfile } from '../lib/birth';
import { naamRashi } from '../lib/naamRashi';
import { useScreen } from '../context/AppConfigProvider';
import { useT, useLang } from '../i18n/LanguageProvider';
import { Lang } from '../i18n/strings';
import { aArea, aAstroText, aColor, aMood, aPanchangLabel, aPanchangTerm, aSign } from '../i18n/astro';
import { useReadingPrefs, readingStyle, READING_SCALES, ReadingScale } from '../hooks/useReadingPrefs';
import { ReadingBar } from '../components/ReadingBar';

const DEFAULT_BIRTH = { dob: '01-01-2000', tob: '06:42', tz: '+05:30', place: 'Jaipur' };

const FALLBACK_TEXT =
  'Today favours calm planning, balanced speech, and practical decisions. Keep your routine clean and avoid rushed reactions before important work.';

const sw = (c: string, n = 1.8) => ({ width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none' as const, stroke: c, strokeWidth: n, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const });
const fl = (c: string) => ({ width: 22, height: 22, viewBox: '0 0 24 24', fill: c });

const MOODS = [
  { label: 'Energy', pct: 76, icon: (c: string) => <Svg {...fl(c)}><Path d="M13 2L3 14h7l-1 8 10-12h-7z" /></Svg> },
  { label: 'Love', pct: 70, icon: (c: string) => <Svg {...fl(c)}><Path d="M12 21s-7-4.4-7-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.6-7 11-7 11z" /></Svg> },
  { label: 'Career', pct: 68, icon: (c: string) => <Svg {...sw(c)}><Path d="M3 7h18v13H3z" /><Path d="M8 7V5a4 4 0 0 1 8 0v2" /></Svg> },
  { label: 'Health', pct: 72, icon: (c: string) => <Svg {...fl(c)}><Path d="M12 2C9 6 7 8 7 12a5 5 0 0 0 10 0c0-2-1-4-3-6-1 2-2 2-2 0z" /></Svg> },
];

const AREA_ICONS: Record<string, (c: string) => React.ReactNode> = {
  Love: (c) => <Svg {...fl(c)}><Path d="M12 21s-7-4.4-7-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.6-7 11-7 11z" /></Svg>,
  Career: (c) => <Svg {...sw(c)}><Path d="M3 7h18v13H3z" /><Path d="M8 7V5a4 4 0 0 1 8 0v2" /></Svg>,
  Finance: (c) => <Svg {...sw(c)}><Circle cx={12} cy={12} r={9} /><Path d="M8 14a4 4 0 0 0 8 0c0-2-1.5-3-4-3s-4-1-4-3a4 4 0 0 1 8 0M12 6v12" /></Svg>,
  Health: (c) => <Svg {...sw(c)}><Path d="M12 21s-8-4.5-8-12a4 4 0 0 1 8 0 4 4 0 0 1 8 0c0 7.5-8 12-8 12z" /></Svg>,
};

const FALLBACK_AREAS = [
  { title: 'Love', text: 'Keep warmth in relationships and avoid stretching small issues.', action: 'Listen first, reply slowly.', score: 70 },
  { title: 'Career', text: 'Pending work can move when priorities are clear.', action: 'Finish one important task before multitasking.', score: 68 },
  { title: 'Finance', text: 'Review spending and avoid impulsive commitments.', action: 'Delay non-essential purchases.', score: 64 },
  { title: 'Health', text: 'Energy improves with routine and hydration.', action: 'Eat on time and rest well.', score: 72 },
];

const FALLBACK_REMEDIES = [
  { title: 'Morning Prayer', body: 'Begin the day with a short prayer or gratitude practice to steady the mind.', timing: 'Morning' },
  { title: 'Simple Donation', body: 'Offer food, fruit, or water to someone in need.', timing: 'Daytime' },
  { title: 'Mindful Speech', body: 'Avoid arguments and choose calm words throughout the day.', timing: 'All day' },
];

type Tone = 'good' | 'bad' | 'plain' | 'neutral' | 'caution';

/* ── tiny SVG glyphs (never emoji — ink colour must follow the theme) ── */
const MiniSpark = ({ color, size = 16 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9z" />
  </Svg>
);
const CheckGlyph = ({ color, size = 13 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="20 6 9 17 4 12" />
  </Svg>
);
const CrossGlyph = ({ color, size = 12 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round">
    <Line x1={18} y1={6} x2={6} y2={18} /><Line x1={6} y1={6} x2={18} y2={18} />
  </Svg>
);
const Chev = ({ color, size = 13 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="6 9 12 15 18 9" />
  </Svg>
);

/* Medallion glyphs for the आधार (basis) trust strip. */
const BASIS_GLYPHS: Record<string, (c: string) => React.ReactNode> = {
  moon: (c) => <Svg width={15} height={15} viewBox="0 0 24 24" fill={c}><Path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></Svg>,
  lagna: (c) => <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M12 19V5M5 12l7-7 7 7" /></Svg>,
  dasha: (c) => <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round"><Circle cx={12} cy={12} r={9} /><Path d="M12 7v5l3.5 2" /></Svg>,
  tithi: (c) => <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round"><Circle cx={12} cy={12} r={4.2} /><Path d="M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7" /></Svg>,
  nakshatra: (c) => <Svg width={15} height={15} viewBox="0 0 24 24" fill={c}><Path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" /></Svg>,
};

const asText = (v: any) => {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object') return v.name || v.sign || v.title || '';
  return String(v);
};

const clampPct = (n: any, fallback: number) => Math.max(0, Math.min(100, Number(n) || fallback));
const panchangName = (v: any, lang: 'en' | 'hi') => {
  if (!v) return '';
  if (lang === 'hi' && typeof v === 'object' && v.hi) return v.hi;
  return aPanchangTerm(asText(v), lang);
};

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

/* Consistent gold section header — GradientText + thin fading rule
   (same treatment as the Kundli/Choghadiya SectionTitle). */
function SectionTitle({ label, style }: { label: string; style?: any }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.secTitleWrap, style]}>
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

/* Soft shimmer line — loading state (no spinners). Colors are OPAQUE so it can
   sit inside the rise()-animated hero (Android white-composite bug). */
function SkelLine({ theme, width, height = 12, style }: { theme: Theme; width: number | `${number}%`; height?: number; style?: any }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(a, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [a]);
  const opacity = a.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.9] });
  return (
    <Animated.View
      style={[{ width, height, borderRadius: 6, backgroundColor: theme.isDark ? '#52401c' : '#ebdcc5', opacity }, style]}
    />
  );
}

/* Spring press-scale — the app's shared press feel (native-driver transform only). */
function useSpringPress(to = 0.97) {
  const sc = useRef(new Animated.Value(1)).current;
  const pressIn = useCallback(() => { Animated.spring(sc, { toValue: to, speed: 40, bounciness: 5, useNativeDriver: true }).start(); }, [sc, to]);
  const pressOut = useCallback(() => { Animated.spring(sc, { toValue: 1, speed: 22, bounciness: 9, useNativeDriver: true }).start(); }, [sc]);
  return { sc, pressIn, pressOut };
}


/* ── Mood meter — thin gold progress bar (Choghadiya hero bar look) ── */
const MoodBar = React.memo(function MoodBar({
  label, pct, icon, theme, lang,
}: {
  label: string; pct: number; icon: (c: string) => React.ReactNode; theme: Theme; lang: Lang;
}) {
  return (
    <View>
      <View style={styles.moodHead}>
        <View style={[styles.moodIc, { backgroundColor: theme.isDark ? 'rgba(233,184,80,0.12)' : 'rgba(176,115,22,0.10)' }]}>
          {icon(theme.gold1)}
        </View>
        <Text style={[styles.moodLbl, { color: theme.text }]}>{aMood(label, lang)}</Text>
        <Text style={[styles.moodPct, { color: theme.goldText }]}>{pct}%</Text>
      </View>
      <View style={[styles.track, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(176,115,22,0.16)' }]}>
        <LinearGradient colors={theme.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.fill, { width: `${pct}%` }]} />
      </View>
    </View>
  );
});

/* ── आधार trust chip — gold medallion + the real chart fact ── */
const BasisChip = React.memo(function BasisChip({
  glyph, label, value, theme,
}: {
  glyph: string; label: string; value: string; theme: Theme;
}) {
  const g = BASIS_GLYPHS[glyph] || BASIS_GLYPHS.nakshatra;
  return (
    <View style={[styles.basisChip, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.44)' : 'rgba(176,115,22,0.05)' }]}>
      <View style={[styles.basisMedallion, { borderColor: theme.isDark ? 'rgba(233,184,80,0.45)' : 'rgba(124,74,3,0.45)', backgroundColor: theme.isDark ? 'rgba(233,184,80,0.10)' : 'rgba(176,115,22,0.08)' }]}>
        {g(theme.gold1)}
      </View>
      <View style={{ minWidth: 0, flexShrink: 1 }}>
        <Text style={[styles.basisLabel, { color: theme.textMuted }]} numberOfLines={1}>{label}</Text>
        <Text style={[styles.basisValue, { color: theme.text }]} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
});

/* ── Area card — Love/Career/Finance/Health with score bar + ✓ action ── */
const AreaCard = React.memo(function AreaCard({
  title, text, action, score, theme, lang, scale, bold,
}: {
  title: string; text: string; action?: string; score?: number;
  theme: Theme; lang: Lang; scale: number; bold: number;
}) {
  const icon = AREA_ICONS[title] || AREA_ICONS.Career;
  const pct = clampPct(score, 70);
  return (
    <View style={[styles.areaCard, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.45)' : 'rgba(176,115,22,0.05)' }]}>
      <View style={styles.areaTop}>
        <View style={[styles.moodIc, { backgroundColor: theme.isDark ? 'rgba(233,184,80,0.12)' : 'rgba(176,115,22,0.10)' }]}>
          {icon(theme.gold1)}
        </View>
        <Text style={[styles.areaTitle, { color: theme.goldText }]}>{aArea(title, lang)}</Text>
        <Text style={[styles.moodPct, { color: theme.goldText }]}>{pct}%</Text>
      </View>
      <View style={[styles.track, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(176,115,22,0.16)', marginTop: 8 }]}>
        <LinearGradient colors={theme.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.fill, { width: `${pct}%` }]} />
      </View>
      <Text style={[readingStyle(scale, bold, 12.8, 19.5), { color: theme.textSoft, marginTop: 9 }]}>{aAstroText(text, lang)}</Text>
      {!!action && (
        <View style={[styles.areaAction, { backgroundColor: theme.isDark ? 'rgba(50,205,50,0.10)' : 'rgba(22,101,52,0.08)' }]}>
          <View style={{ marginTop: 2 }}><CheckGlyph color={theme.green} /></View>
          <Text style={[styles.areaActionText, { color: theme.text, fontSize: 12 * scale, lineHeight: 17.5 * scale }]}>{aAstroText(action, lang)}</Text>
        </View>
      )}
    </View>
  );
});

/* ── Time-window chip — horizontal rail, accent edge (good=green, caution=orange) ── */
const TimeChip = React.memo(function TimeChip({
  label, time, quality, advice, theme, lang,
}: {
  label: string; time: string; quality?: string; advice?: string; theme: Theme; lang: Lang;
}) {
  const accent = quality === 'good' ? theme.green : quality === 'caution' ? theme.saffron : theme.gold2;
  return (
    <View style={[styles.timeChip, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? '#0b0906' : '#fffdf7' }]}>
      <View style={[styles.timeChipEdge, { backgroundColor: accent }]} pointerEvents="none" />
      <Text style={[styles.timeChipLabel, { color: theme.text }]} numberOfLines={1}>{aAstroText(label, lang)}</Text>
      <View style={styles.timeChipTimeRow}>
        <ClockIcon color={accent} size={11} />
        <Text style={[styles.timeChipTime, { color: accent }]} numberOfLines={1}>{time}</Text>
      </View>
      {!!advice && <Text style={[styles.timeChipAdvice, { color: theme.textSoft }]} numberOfLines={3}>{aAstroText(advice, lang)}</Text>}
    </View>
  );
});

/* ── Remedy — collapsible card with priority badge; mantra + body inside ── */
const RemedyCard = React.memo(function RemedyCard({
  title, body, timing, mantra, priority, defaultOpen, theme, lang, scale, bold,
}: {
  title: string; body?: string; timing?: string; mantra?: string; priority?: string;
  defaultOpen?: boolean; theme: Theme; lang: Lang; scale: number; bold: number;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  const { sc, pressIn, pressOut } = useSpringPress(0.98);
  const pr = (priority || '').toLowerCase();
  const prColor = pr === 'high' ? theme.saffron : pr === 'low' ? theme.green : theme.gold2;
  const prLabel = pr === 'high'
    ? (lang === 'hi' ? 'ज़रूरी' : 'HIGH')
    : pr === 'low'
      ? (lang === 'hi' ? 'सरल' : 'LOW')
      : pr === 'medium'
        ? (lang === 'hi' ? 'मध्यम' : 'MEDIUM')
        : '';
  return (
    <Animated.View style={{ transform: [{ scale: sc }] }}>
      {/* opaque fill — sits inside a transform-animated wrapper (Android white-composite bug) */}
      <Pressable
        onPress={() => { hSelect(); setOpen((o) => !o); }}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={[styles.remedy, { borderColor: open ? (theme.isDark ? 'rgba(233,184,80,0.45)' : 'rgba(124,74,3,0.45)') : theme.cardBorder, backgroundColor: theme.isDark ? '#0a0805' : '#fffdf7' }]}
      >
        <View style={styles.remedyHead}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.remedyTitle, { color: theme.text }]} numberOfLines={2}>{aAstroText(title, lang)}</Text>
            {!!timing && (
              <View style={styles.remedyTimingRow}>
                <ClockIcon color={theme.gold2} size={10} />
                <Text style={[styles.remedyTag, { color: theme.gold2 }]} numberOfLines={1}>{aAstroText(timing, lang)}</Text>
              </View>
            )}
          </View>
          {!!prLabel && (
            <View style={[styles.prBadge, { borderColor: prColor }]}>
              <Text style={[styles.prText, { color: prColor }]}>{prLabel}</Text>
            </View>
          )}
          <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
            <Chev color={theme.goldText} />
          </View>
        </View>
        {open && (
          <View style={styles.remedyBodyWrap}>
            {!!body && <Text style={[readingStyle(scale, bold, 13, 20), { color: theme.textSoft }]}>{aAstroText(body, lang)}</Text>}
            {!!mantra && <Text style={[styles.mantraSmall, { color: theme.goldText }]}>{mantra}</Text>}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
});

/* ── Do / Avoid column — ✓ (green) and ✗ (red) rows ── */
const ListColumn = React.memo(function ListColumn({
  kind, title, items, theme, lang, scale, bold,
}: {
  kind: 'do' | 'avoid'; title: string; items: string[]; theme: Theme; lang: Lang; scale: number; bold: number;
}) {
  const good = kind === 'do';
  const color = good ? theme.green : theme.red;
  return (
    <View
      style={[
        styles.doAvoidBox,
        {
          borderColor: theme.cardBorder,
          backgroundColor: good
            ? (theme.isDark ? 'rgba(39,119,56,0.12)' : 'rgba(31,143,79,0.08)')
            : (theme.isDark ? 'rgba(160,48,48,0.12)' : 'rgba(192,57,43,0.08)'),
        },
      ]}
    >
      <Text style={[styles.doAvoidTitle, { color }]}>{title}</Text>
      {items.map((item) => (
        <View key={item} style={styles.listRow}>
          <View style={{ marginTop: 3.5 }}>{good ? <CheckGlyph color={color} size={12} /> : <CrossGlyph color={color} size={11} />}</View>
          <Text style={[readingStyle(scale, bold, 12.5, 19), { color: theme.text, flex: 1 }]}>{aAstroText(item, lang)}</Text>
        </View>
      ))}
    </View>
  );
});

/* ── "आगे पूछें" chip — navigates to the astrologer chat prefilled ── */
const AskChip = React.memo(function AskChip({
  q, theme, lang, onPress,
}: {
  q: string; theme: Theme; lang: Lang; onPress: (q: string) => void;
}) {
  const { sc, pressIn, pressOut } = useSpringPress(0.97);
  return (
    <Animated.View style={{ transform: [{ scale: sc }] }}>
      {/* opaque fill — inside the spring-scale wrapper */}
      <Pressable
        onPress={() => onPress(q)}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={[styles.questionChip, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? '#0e0b05' : '#fdf7ea' }]}
      >
        <MiniSpark color={theme.gold1} size={13} />
        <Text style={[styles.questionText, { color: theme.text }]}>{aAstroText(q, lang)}</Text>
      </Pressable>
    </Animated.View>
  );
});

export function DailyPredictionScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const hi = lang === 'hi';
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<'daily' | PredPeriod>('daily');
  const dp = useScreen('dailyPrediction');
  const t = useT();
  const accent = (tone: Tone) => (tone === 'good' ? theme.green : tone === 'bad' || tone === 'caution' ? theme.red : theme.gold1);

  // reader prefs — the Aa control (persisted; applies only to reading text)
  const { scale, weight: bold, stepScale, stepWeight } = useReadingPrefs(); // bold = weight step (0/1/2)
  const rd = useCallback(
    (size: number, lineHeight: number) => readingStyle(scale, bold, size, lineHeight),
    [scale, bold]
  );

  const [pred, setPred] = useState<DailyPrediction | null>(null);
  const [predLoading, setPredLoading] = useState(true);
  const [predError, setPredError] = useState<string | null>(null);
  const [panch, setPanch] = useState<PanchangResponse | null>(null);
  const [birthName, setBirthName] = useState<string | null>(null);

  useEffect(() => {
    let on = true;
    (async () => {
      const b = await birthFromProfile().catch(() => null);
      const birth = b || DEFAULT_BIRTH;
      if (on) setBirthName((b as any)?.name || null);
      try {
        const p = await getDailyPrediction({ ...birth, name: (b as any)?.name });
        if (on) setPred(p);
      } catch (e: any) {
        if (on) setPredError(e?.message || 'Prediction unavailable');
      } finally {
        if (on) setPredLoading(false);
      }

      try {
        const p = await getPanchang({ place: b?.place || birth.place || 'Jaipur' });
        if (on) setPanch(p);
      } catch (_) {
        // daily AI response already includes compact panchang context when available
      }
    })();
    return () => { on = false; };
    // refetch when language switches so the rashifal text re-renders in the chosen language
  }, [lang]);

  // hero entrance — hero ONLY (below-the-fold sections mount via Deferred instead)
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enter, { toValue: 1, duration: 560, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [enter]);
  const riseStyle = {
    opacity: enter,
    transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
  };

  const today = pred?.basis?.today;
  const predText = aAstroText(pred?.overall || FALLBACK_TEXT, lang);
  const detailText = aAstroText(pred?.detailedSummary || pred?.transitSummary || '', lang);
  const moonSign = pred?.basis?.moonSign || panch?.moon.sign || 'Moon Sign';
  // user's rashi identity shown prominently = naam-rashi (by name) when known, else moon sign
  const displayRashi = naamRashi(birthName) || (pred?.basis?.moonSign || panch?.moon.sign || null);
  const ascendant = pred?.basis?.ascendant || 'Lagna';
  const dasha = pred?.basis?.dasha || 'Dasha';
  const luckyColour = aColor(pred?.luckyColour || 'Gold', lang);
  const luckyNumber = pred ? String(pred.luckyNumber) : '7';
  const confidence = pred?.confidence ? Math.round(pred.confidence * 100) : null;
  const displayRashiText = hi
    ? aSign(displayRashi || moonSign, lang)
    : String(displayRashi || moonSign).toUpperCase();

  // आधार trust strip — the REAL chart facts the prediction was computed from
  const basisChips = useMemo(() => {
    const tithiVal = panchangName(today?.tithi, lang) || (panch ? (hi ? (panch.tithi.hi || aPanchangTerm(panch.tithi.name, lang)) : panch.tithi.name) : '');
    const nakVal = panchangName(today?.nakshatra, lang) || panchangName(panch?.nakshatra, lang);
    const items = [
      { key: 'moon', label: aAstroText(t('dp.moonSign', 'Moon Sign'), lang), value: aAstroText(aSign(moonSign, lang), lang) },
      { key: 'lagna', label: aAstroText(t('dp.lagna', 'Lagna'), lang), value: aAstroText(aSign(ascendant, lang), lang) },
      { key: 'dasha', label: aAstroText(t('dp.dasha', 'Dasha'), lang), value: aAstroText(dasha, lang) },
      { key: 'tithi', label: aPanchangLabel('Tithi', lang), value: tithiVal },
      { key: 'nakshatra', label: aAstroText(t('dp.nakshatra', 'Nakshatra'), lang), value: nakVal },
    ];
    return items.filter((i) => !!i.value);
  }, [moonSign, ascendant, dasha, today, panch, t, lang, hi]);

  const panchCells = useMemo(() => {
    if (panch) {
      return [
        { lbl: aPanchangLabel('Tithi', lang), val: hi ? (panch.tithi.hi || aPanchangTerm(panch.tithi.name, lang)) : panch.tithi.name, tone: 'plain' as Tone },
        { lbl: aPanchangLabel('Paksha', lang), val: hi ? (panch.tithi.pakshaHi || aPanchangTerm(panch.tithi.paksha, lang)) : panch.tithi.paksha, tone: 'plain' as Tone },
        { lbl: aPanchangLabel('Nakshatra', lang), val: `${hi ? (panch.nakshatra.hi || aPanchangTerm(panch.nakshatra.name, lang)) : panch.nakshatra.name} ${hi ? 'चरण' : 'Pada'} ${panch.nakshatra.pada}`, tone: 'good' as Tone },
        { lbl: aPanchangLabel('Yoga', lang), val: hi ? (panch.yoga.hi || aPanchangTerm(panch.yoga.name, lang)) : panch.yoga.name, tone: 'plain' as Tone },
        { lbl: aPanchangLabel('Karana', lang), val: hi ? (panch.karana.hi || aPanchangTerm(panch.karana.name, lang)) : panch.karana.name, tone: 'plain' as Tone },
        { lbl: aPanchangLabel('Moon', lang), val: aSign(panch.moon.sign || '-', lang), tone: 'good' as Tone },
        { lbl: aPanchangLabel('Sunrise', lang), val: panch.sunrise, tone: 'plain' as Tone },
        { lbl: aPanchangLabel('Sunset', lang), val: panch.sunset, tone: 'plain' as Tone },
        ...panch.inauspicious.map((p) => ({ lbl: aPanchangLabel(p.name, lang), val: `${p.start} - ${p.end}`, tone: 'caution' as Tone })),
      ];
    }
    if (today) {
      return [
        { lbl: aPanchangLabel('Tithi', lang), val: panchangName(today.tithi, lang) || '-', tone: 'plain' as Tone },
        { lbl: aPanchangLabel('Paksha', lang), val: aPanchangTerm(today.paksha, lang) || '-', tone: 'plain' as Tone },
        { lbl: aPanchangLabel('Nakshatra', lang), val: panchangName(today.nakshatra, lang) || '-', tone: 'good' as Tone },
        { lbl: aPanchangLabel('Yoga', lang), val: panchangName(today.yoga, lang) || '-', tone: 'plain' as Tone },
        { lbl: aPanchangLabel('Moon', lang), val: aSign(today.transitMoon || '-', lang), tone: 'good' as Tone },
        { lbl: aPanchangLabel('Sunrise', lang), val: today.sunrise || '-', tone: 'plain' as Tone },
        ...(today.inauspicious || []).map((p) => ({ lbl: aPanchangLabel(p.name, lang), val: `${p.start} - ${p.end}`, tone: 'caution' as Tone })),
      ];
    }
    return null;
  }, [panch, today, lang, hi]);

  const timeWindows = useMemo(() => {
    const fromAi = pred?.timeWindows || [];
    if (fromAi.length) return fromAi;
    const fallback = pred?.luckyTime ? [{ label: 'Lucky Time', time: pred.luckyTime, quality: 'good' as const, advice: pred.advice }] : [];
    return [
      ...fallback,
      ...((today?.inauspicious || panch?.inauspicious || []).slice(0, 2).map((p) => ({
        label: p.name,
        time: `${p.start} - ${p.end}`,
        quality: 'caution' as const,
        advice: p.note,
      }))),
    ];
  }, [pred, today, panch]);

  const fallbackAreas = hi ? [
    { title: 'Love', text: 'रिश्तों में गर्मजोशी रखें और छोटी बातों को बड़ा न बनाएं।', action: 'पहले सुनें, फिर शांत होकर जवाब दें।', score: 70 },
    { title: 'Career', text: 'काम में प्राथमिकता साफ रखें, अधूरे काम आगे बढ़ सकते हैं।', action: 'मल्टीटास्किंग से पहले एक जरूरी काम पूरा करें।', score: 68 },
    { title: 'Finance', text: 'खर्च और निवेश में सोच-समझकर निर्णय लें।', action: 'गैर-जरूरी खरीदारी आज टालें।', score: 64 },
    { title: 'Health', text: 'दिनचर्या, पानी और आराम से ऊर्जा बेहतर रहेगी।', action: 'समय पर भोजन करें और पर्याप्त आराम लें।', score: 72 },
  ] : FALLBACK_AREAS;
  const fallbackRemedies = hi ? FALLBACK_REMEDIES.map((r, i) => ({
    ...r,
    title: ['सुबह की प्रार्थना', 'सरल दान', 'शांत वाणी'][i] || r.title,
    body: ['दिन की शुरुआत छोटी प्रार्थना या कृतज्ञता से करें।', 'जरूरतमंद को भोजन, फल या पानी दें।', 'वाद-विवाद से बचें और पूरे दिन शांत शब्द चुनें।'][i] || r.body,
    timing: ['सुबह', 'दिन में', 'पूरे दिन'][i] || r.timing,
  })) : FALLBACK_REMEDIES;
  const areas = pred?.areas?.length ? pred.areas : fallbackAreas;
  const remedies = pred?.remedies?.length ? pred.remedies : fallbackRemedies;
  const doList = pred?.doList?.length ? pred.doList : (hi
    ? ['पहले जरूरी काम पूरा करें', 'बातचीत शांत रखें', 'नए काम के लिए सही समय चुनें']
    : ['Complete priority work first', 'Keep communication calm', 'Use the right timing for new work']);
  const avoidList = pred?.avoidList?.length ? pred.avoidList : (hi
    ? ['जल्दबाजी में निर्णय', 'अनावश्यक बहस', 'अचानक खर्च']
    : ['Rushed decisions', 'Unnecessary arguments', 'Impulsive spending']);
  const focus = pred?.focus?.length ? pred.focus : (hi ? ['स्पष्टता', 'धैर्य', 'दिनचर्या'] : ['Clarity', 'Patience', 'Routine']);
  const aiQuestions = pred?.aiQuestions?.length ? pred.aiQuestions : (hi ? [
    'आज करियर में मुझे किस बात पर ध्यान देना चाहिए?',
    'महत्वपूर्ण काम के लिए कौन सा समय बेहतर है?',
    'आज मुझे कौन सा सरल उपाय करना चाहिए?',
  ] : [
    'What should I focus on in career today?',
    'Which time is best for important work?',
    'What simple remedy should I follow today?',
  ]);

  const toggleSave = () => { setSaved((s) => { hSelect(); return !s; }); };
  const openAiQuestion = useCallback((question?: string) => {
    hTap();
    navigation.navigate('AiAstrologer', question ? { question } : undefined);
  }, [navigation]);
  const askChipPress = useCallback((q: string) => openAiQuestion(q), [openAiQuestion]);
  const sharePrediction = async () => {
    hTap();
    try {
      await Share.share({
        message:
          'Daily Prediction - Shree Yantra Astrology\n\n' +
          `${pred?.headline ? `${pred.headline}\n` : ''}${predText}` +
          `\n\nAdvice: ${pred?.advice || 'Stay calm and act with clarity.'}` +
          `\nLucky Colour: ${luckyColour} | Lucky Number: ${luckyNumber}`,
      });
    } catch (_) {
      // user dismissed
    }
  };

  // opaque pill fills (several live inside the animated hero / spring wrappers)
  const pillBg = theme.isDark ? '#0b0906' : '#ffffff';

  return (
    <Page
      title={t('home.feat.pred.title', 'My Rashifal')}
      onBack={() => navigation.goBack()}
      right={<CrownIcon color={theme.gold1} size={16} />}
      onRight={() => navigation.navigate('ManageSubscription')}
    >
      {/* Header row — Daily / Weekly / Monthly / Yearly tabs + the Aa reading control */}
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8, alignItems: 'stretch' }}>
        {(([['daily', hi ? 'दैनिक' : 'Daily'], ['week', hi ? 'साप्ताहिक' : 'Weekly'], ['month', hi ? 'मासिक' : 'Monthly'], ['year', hi ? 'वार्षिक' : 'Yearly']]) as [('daily' | PredPeriod), string][]).map(([k, lbl]) => {
          const on = tab === k;
          return (
            <Pressable key={k} onPress={() => { hSelect(); setTab(k); }} style={{ flex: 1 }}>
              {on ? (
                <LinearGradient colors={theme.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ paddingVertical: 8, borderRadius: 999, alignItems: 'center' }}>
                  <Text style={{ fontFamily: fonts.interSemi, fontSize: 12, color: theme.buttonInk }}>{lbl}</Text>
                </LinearGradient>
              ) : (
                <View style={{ paddingVertical: 8, borderRadius: 999, alignItems: 'center', borderWidth: 1, borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.4)' : '#fffdf7' }}>
                  <Text style={{ fontFamily: fonts.interSemi, fontSize: 12, color: theme.gold2 }}>{lbl}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* reading controls — hamesha dikhte hai (user ki pasand: koi Aa toggle nahi) */}
      <ReadingBar scale={scale} weight={bold} stepScale={stepScale} stepWeight={stepWeight} theme={theme} lang={lang} />

      {tab !== 'daily' ? (
        <PeriodForecast period={tab as PredPeriod} />
      ) : (
      <>
      {/* ── HERO — rashi + date + headline + reading + lucky trio (rise entrance) ── */}
      <Animated.View style={riseStyle}>
        <Card solidBlack>
          <View style={{ alignItems: 'center' }}>
            <ZodiacIcon sign={displayRashi || moonSign} size={96} theme={theme} />
            <Text style={[styles.sign, { color: theme.goldText }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{displayRashiText}</Text>
            <Text style={[styles.hindi, { color: theme.textSoft }]}>{t('dp.moonBased', 'Moon sign based guidance')}</Text>
          </View>
          <View style={[styles.dateRow, { borderTopColor: theme.line }]}>
            <CalendarIcon color={theme.gold1} size={15} />
            <Text style={[styles.dateText, { color: theme.gold1 }]}>
              {predLoading ? t('dp.personalising', 'Personalising your day...') : pred ? `${aAstroText(t('dp.sourceTag', 'Chart Data'), lang)} | ${pred.generatedFor || aAstroText('Today', lang)}` : aAstroText('Today', lang)}
            </Text>
          </View>

          {predLoading ? (
            <View style={{ marginTop: 16 }}>
              <SkelLine theme={theme} width="64%" height={16} style={{ alignSelf: 'center' }} />
              <SkelLine theme={theme} width="100%" height={12} style={{ marginTop: 16 }} />
              <SkelLine theme={theme} width="100%" height={12} style={{ marginTop: 8 }} />
              <SkelLine theme={theme} width="88%" height={12} style={{ marginTop: 8 }} />
              <SkelLine theme={theme} width="54%" height={12} style={{ marginTop: 8 }} />
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
                <SkelLine theme={theme} width={104} height={30} style={{ borderRadius: 999 }} />
                <SkelLine theme={theme} width={104} height={30} style={{ borderRadius: 999 }} />
                <SkelLine theme={theme} width={72} height={30} style={{ borderRadius: 999 }} />
              </View>
            </View>
          ) : (
            <>
              {!!pred?.headline && <Text style={[styles.headline, { color: theme.goldText }]}>{aAstroText(pred.headline, lang)}</Text>}
              <Text style={[rd(15, 24), { color: theme.text, marginTop: 12 }]}>{predText}</Text>
              {!!detailText && <Text style={[rd(13.5, 21.5), { color: theme.textSoft, marginTop: 10 }]}>{detailText}</Text>}
              {!!predError && <Text style={[styles.errorText, { color: theme.red }]}>{t('dp.aiFallback', 'Estimated guidance')}: {predError}</Text>}

              <View style={styles.focusRow}>
                {focus.map((item) => (
                  <View key={item} style={[styles.focusChip, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? '#181205' : '#ffffff' }]}>
                    <MiniSpark color={theme.gold1} />
                    <Text style={[styles.focusText, { color: theme.goldText }]} numberOfLines={1}>{aAstroText(item, lang)}</Text>
                  </View>
                ))}
              </View>

              {/* lucky trio + confidence — compact chips */}
              <View style={styles.luckRow}>
                <View style={[styles.luckPill, { borderColor: theme.cardBorder, backgroundColor: pillBg }]}>
                  <Text style={[styles.luckStar, { color: theme.gold1 }]}>#</Text>
                  <Text style={[styles.luckLbl, { color: theme.textSoft }]}>{t('dp.luckyNumber', 'Lucky Number')} </Text>
                  <Text style={[styles.luckVal, { color: theme.goldText }]}>{luckyNumber}</Text>
                </View>
                <View style={[styles.luckPill, { borderColor: theme.cardBorder, backgroundColor: pillBg }]}>
                  <MiniSpark color={theme.gold1} />
                  <Text style={[styles.luckLbl, { color: theme.textSoft }]}>{t('dp.luckyColour', 'Lucky Colour')} </Text>
                  <Text style={[styles.luckVal, { color: theme.goldText }]}>{luckyColour}</Text>
                </View>
                {!!pred?.luckyTime && (
                  <View style={[styles.luckPill, { borderColor: theme.cardBorder, backgroundColor: pillBg }]}>
                    <ClockIcon color={theme.gold1} size={12} />
                    <Text style={[styles.luckLbl, { color: theme.textSoft }]}>{hi ? 'शुभ समय' : 'Lucky Time'} </Text>
                    <Text style={[styles.luckVal, { color: theme.goldText }]}>{pred.luckyTime}</Text>
                  </View>
                )}
                {!!confidence && (
                  <View style={[styles.luckPill, { borderColor: theme.cardBorder, backgroundColor: pillBg }]}>
                    <Text style={[styles.luckLbl, { color: theme.textSoft }]}>{t('dp.confidence', 'Confidence')} </Text>
                    <Text style={[styles.luckVal, { color: theme.goldText }]}>{confidence}%</Text>
                  </View>
                )}
              </View>
            </>
          )}
        </Card>
      </Animated.View>

      {predLoading ? (
        /* below-the-fold skeleton while the reading is computed — no fake content */
        <Deferred delay={80}>
          <Card style={{ marginTop: 14 }}>
            <SkelLine theme={theme} width="44%" height={13} />
            <SkelLine theme={theme} width="100%" height={11} style={{ marginTop: 14 }} />
            <SkelLine theme={theme} width="100%" height={11} style={{ marginTop: 8 }} />
            <SkelLine theme={theme} width="70%" height={11} style={{ marginTop: 8 }} />
          </Card>
          <Card style={{ marginTop: 14 }}>
            <SkelLine theme={theme} width="38%" height={13} />
            <SkelLine theme={theme} width="100%" height={11} style={{ marginTop: 14 }} />
            <SkelLine theme={theme} width="82%" height={11} style={{ marginTop: 8 }} />
          </Card>
        </Deferred>
      ) : (
      <>
      {/* ── आधार — trust strip of the real chart facts behind this reading ── */}
      <Deferred delay={80}>
        <Card style={{ marginTop: 14 }}>
          <SectionTitle label={aAstroText(t('dp.astroBasis', 'Astro Basis'), lang)} />
          <View style={styles.basisWrap}>
            {basisChips.map((b) => (
              <BasisChip key={b.key} glyph={b.key} label={b.label} value={b.value} theme={theme} />
            ))}
          </View>
          {!!pred?.transitSummary && <Text style={[rd(13, 20), { color: theme.textSoft, marginTop: 12 }]}>{aAstroText(pred.transitSummary, lang)}</Text>}
        </Card>

        {/* mood meters — thin gold bars */}
        <Card style={{ marginTop: 14 }}>
          <SectionTitle label={aAstroText(t('dp.cosmicMood', "Today's Cosmic Mood"), lang)} />
          <View style={{ gap: 14 }}>
            {MOODS.map((m) => (
              <MoodBar
                key={m.label}
                label={m.label}
                pct={clampPct(pred?.moods?.find((x) => x.label === m.label)?.pct, m.pct)}
                icon={m.icon}
                theme={theme}
                lang={lang}
              />
            ))}
          </View>
        </Card>
      </Deferred>

      {/* ── areas — Love / Career / Finance / Health cards ── */}
      <Deferred delay={160}>
        <Card style={{ marginTop: 14 }}>
          <SectionTitle label={aAstroText(t('dp.moreInsights', 'More Insights'), lang)} />
          <View style={{ gap: 10 }}>
            {areas.map((it) => (
              <AreaCard
                key={it.title}
                title={it.title}
                text={it.text}
                action={it.action}
                score={it.score}
                theme={theme}
                lang={lang}
                scale={scale}
                bold={bold}
              />
            ))}
          </View>
        </Card>
      </Deferred>

      <Deferred delay={240}>
        {/* time windows — horizontal chips (good=green edge, caution=orange) */}
        {!!timeWindows.length && (
          <Card style={{ marginTop: 14 }} contentStyle={{ paddingHorizontal: 0 }}>
            <SectionTitle label={aAstroText(t('dp.bestTiming', 'Best Timing Today'), lang)} style={{ paddingHorizontal: 20 }} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeChipRail}>
              {timeWindows.map((item, index) => (
                <TimeChip
                  key={`${item.label}-${index}`}
                  label={item.label}
                  time={item.time}
                  quality={item.quality}
                  advice={item.advice}
                  theme={theme}
                  lang={lang}
                />
              ))}
            </ScrollView>
          </Card>
        )}

        {/* panchang grid */}
        <Card style={{ marginTop: 14 }}>
          <SectionTitle label={aAstroText(t('dp.panchang', "Today's Panchang"), lang)} />
          {(panch || today) && (
            <View style={styles.panchDateRow}>
              <Text style={[styles.panchDate, { color: theme.gold1 }]}>
                {panch ? `${aAstroText(panch.weekday, lang)} | ${panch.date}` : `${aAstroText(today?.weekday || 'Today', lang)} | ${today?.date || pred?.generatedFor || ''}`}
              </Text>
              <Text style={[styles.panchLive, { color: theme.green }]}>{aAstroText('LIVE DATA', lang)}</Text>
            </View>
          )}
          {panchCells ? (
            <View style={styles.timeGrid}>
              {panchCells.map((c, i) => (
                <View key={`${c.lbl}-${i}`} style={[styles.timeCell, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.5)' : '#ffffff' }]}>
                  <Text style={[styles.timeLbl, { color: accent(c.tone) }]}>{c.lbl}</Text>
                  <Text style={[styles.timeVal, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{c.val}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[rd(13, 20), { color: theme.textSoft, marginTop: 10 }]}>{t('dp.panchangEmpty', 'Panchang will appear after your birth place and network data are available.')}</Text>
          )}
          {!!pred?.panchangSummary && <Text style={[rd(13, 20), { color: theme.textSoft, marginTop: 12 }]}>{aAstroText(pred.panchangSummary, lang)}</Text>}
        </Card>

        {/* do / avoid — two-column ✓ / ✗ lists */}
        <Card style={{ marginTop: 14 }}>
          <SectionTitle label={aAstroText(t('dp.doAvoid', 'Do And Avoid'), lang)} />
          <View style={styles.doAvoidGrid}>
            <ListColumn kind="do" title={aAstroText(t('dp.do', 'Do'), lang)} items={doList} theme={theme} lang={lang} scale={scale} bold={bold} />
            <ListColumn kind="avoid" title={aAstroText(t('dp.avoid', 'Avoid'), lang)} items={avoidList} theme={theme} lang={lang} scale={scale} bold={bold} />
          </View>
        </Card>
      </Deferred>

      <Deferred delay={320}>
        {/* remedies — collapsible cards with priority badges */}
        <Card style={{ marginTop: 14 }}>
          <SectionTitle label={aAstroText(t('dp.remedies', 'Suggested Remedies'), lang)} />
          <View style={{ gap: 10 }}>
            {remedies.map((r, index) => {
              const rr = r as any;
              return (
                <RemedyCard
                  key={`${r.title}-${index}`}
                  title={r.title}
                  body={rr.body || rr.text || ''}
                  timing={rr.timing || rr.tag || ''}
                  mantra={rr.mantra}
                  priority={rr.priority}
                  defaultOpen={index === 0}
                  theme={theme}
                  lang={lang}
                  scale={scale}
                  bold={bold}
                />
              );
            })}
          </View>
        </Card>

        {!!pred?.mantra?.text && (
          <Card style={{ marginTop: 14 }}>
            <SectionTitle label={aAstroText(pred.mantra.title || (hi ? 'आज का मंत्र' : "Today's Mantra"), lang)} />
            <Text style={[styles.mantraText, { color: theme.goldText }]}>{pred.mantra.text}</Text>
            {!!(pred.mantra.count || pred.mantra.bestTime) && (
              <Text style={[rd(13, 20), { color: theme.textSoft, marginTop: 10, textAlign: 'center' }]}>
                {aAstroText([pred.mantra.count, pred.mantra.bestTime].filter(Boolean).join(' | '), lang)}
              </Text>
            )}
          </Card>
        )}

        <SaralVivaran text={pred?.saralVivaran} scale={scale} bold={bold} />

        {/* आगे पूछें — question chips prefill the astrologer chat */}
        <Card style={{ marginTop: 14 }}>
          <SectionTitle label={hi ? 'आगे पूछें' : 'Ask Further'} />
          <Text style={[rd(12.5, 19), { color: theme.textSoft }]}>{t('dp.askAiLead', "These questions will use your saved birth details, today's precise astrology data, and the current language mode.")}</Text>
          <View style={styles.questionWrap}>
            {aiQuestions.map((q) => (
              <AskChip key={q} q={q} theme={theme} lang={lang} onPress={askChipPress} />
            ))}
          </View>
          <Pressable onPress={() => openAiQuestion(aiQuestions[0])} style={({ pressed }) => [styles.askPrimaryWrap, pressed && { transform: [{ scale: 0.98 }] }]}>
            <LinearGradient colors={theme.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.askPrimary}>
              <MiniSpark color={theme.buttonInk} />
              <Text style={[styles.actionText, { color: theme.buttonInk }]}>{t('dp.openAi', 'OPEN ASTROLOGER')}</Text>
            </LinearGradient>
          </Pressable>
        </Card>

        {/* source note */}
        <LinearGradient
          colors={theme.isDark ? ['rgba(233,184,80,0.12)', 'rgba(20,16,8,0.55)'] : ['rgba(176,115,22,0.10)', 'rgba(255,250,240,0.6)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.note, { borderColor: theme.cardBorder }]}
        >
          <View style={[styles.noteIc, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.14)' : 'rgba(176,115,22,0.10)' }]}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.gold1} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <Circle cx={12} cy={12} r={10} />
              <Line x1={12} y1={11} x2={12} y2={16} />
              <Line x1={12} y1={8} x2={12.01} y2={8} />
            </Svg>
          </View>
          <Text style={[styles.noteText, { color: theme.textSoft }]}>
            <Text style={{ color: theme.goldText, fontFamily: fonts.interBold }}>{aAstroText(t('dp.source', 'Source | '), lang)}</Text>
            {aAstroText(pred?.sourceNote || dp.t('noteText', hi ? 'भविष्यवाणियाँ आपकी सटीक कुंडली व पंचांग डेटा पर आधारित हैं।' : 'Predictions are based on your precise chart and Panchang data.'), lang)}
          </Text>
        </LinearGradient>

        {/* save / share */}
        <View style={styles.actions}>
          <Pressable
            onPress={toggleSave}
            style={({ pressed }) => [
              styles.action,
              { borderColor: saved ? theme.gold2 : theme.cardBorder, backgroundColor: saved ? (theme.isDark ? 'rgba(233,184,80,0.16)' : 'rgba(176,115,22,0.12)') : (theme.isDark ? 'rgba(0,0,0,0.5)' : '#fffdf7') },
              pressed && { transform: [{ scale: 0.97 }] },
            ]}
          >
            <Svg width={15} height={15} viewBox="0 0 24 24" fill={saved ? theme.gold1 : 'none'} stroke={theme.goldText} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </Svg>
            <Text style={[styles.actionText, { color: theme.goldText }]}>{saved ? t('dp.saved', 'SAVED') : t('dp.save', 'SAVE')}</Text>
          </Pressable>
          <Pressable onPress={sharePrediction} style={({ pressed }) => [styles.actionPrimaryWrap, pressed && { transform: [{ scale: 0.98 }] }]}>
            <LinearGradient colors={theme.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.actionPrimary}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={theme.buttonInk} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                <Circle cx={18} cy={5} r={3} /><Circle cx={6} cy={12} r={3} /><Circle cx={18} cy={19} r={3} />
                <Line x1={8.6} y1={13.5} x2={15.4} y2={17.5} /><Line x1={15.4} y1={6.5} x2={8.6} y2={10.5} />
              </Svg>
              <Text style={[styles.actionText, { color: theme.buttonInk }]}>{t('dp.share', 'SHARE PREDICTION')}</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </Deferred>
      </>
      )}
      </>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  /* header controls */
  readBar: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 14 },
  readLbl: { flex: 1, fontFamily: fonts.interSemi, fontSize: 11 },
  readBtns: { flexDirection: 'row', gap: 6 },
  readBtnWrap: { borderRadius: 10, overflow: 'hidden' },
  readBtn: { width: 34, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  boldBtn: { height: 32, paddingHorizontal: 11, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  boldBtnText: { fontFamily: fonts.interBold, fontSize: 11 },

  /* hero */
  sign: { fontFamily: fonts.playfairBold, fontSize: 22, marginTop: 6 },
  hindi: { fontFamily: fonts.interSemi, fontSize: 12, marginTop: 2 },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, paddingTop: 14, borderTopWidth: 1 },
  dateText: { fontFamily: fonts.interSemi, fontSize: 12 },
  headline: { fontFamily: fonts.playfairBold, fontSize: 20, lineHeight: 26, textAlign: 'center', marginTop: 12 },
  errorText: { fontFamily: fonts.interSemi, fontSize: 11.5, lineHeight: 16, marginTop: 8 },
  focusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  focusChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 7, maxWidth: '100%' },
  focusText: { fontFamily: fonts.interSemi, fontSize: 11.5, maxWidth: 170 },
  luckRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  luckPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radii.pill, borderWidth: 1 },
  luckStar: { fontFamily: fonts.interBold, fontSize: 12 },
  luckLbl: { fontFamily: fonts.inter, fontSize: 11.5 },
  luckVal: { fontFamily: fonts.interBold, fontSize: 11.5 },

  /* section titles */
  secTitleWrap: { marginBottom: 12 },
  secTitleText: { fontFamily: fonts.cinzel, fontSize: 13, letterSpacing: 1.8, textTransform: 'uppercase' },
  secTitleRule: { height: 1, marginTop: 7 },

  /* आधार trust strip */
  basisWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  basisChip: { flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderRadius: radii.pill, paddingVertical: 6, paddingLeft: 6, paddingRight: 13, maxWidth: '100%' },
  basisMedallion: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  basisLabel: { fontFamily: fonts.interBold, fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.4 },
  basisValue: { fontFamily: fonts.interSemi, fontSize: 12.5, marginTop: 1 },

  /* mood meters */
  moodHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 7 },
  moodIc: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  moodLbl: { flex: 1, fontFamily: fonts.interSemi, fontSize: 13 },
  moodPct: { fontFamily: fonts.interBold, fontSize: 12.5 },
  track: { height: 7, borderRadius: 999, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999 },

  /* areas */
  areaCard: { borderWidth: 1, borderRadius: 14, padding: 12 },
  areaTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  areaTitle: { flex: 1, fontFamily: fonts.playfair, fontSize: 15 },
  areaAction: { flexDirection: 'row', gap: 8, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, marginTop: 10 },
  areaActionText: { flex: 1, fontFamily: fonts.interSemi },

  /* panchang */
  panchDateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2, gap: 8 },
  panchDate: { fontFamily: fonts.interSemi, fontSize: 11.5, flex: 1 },
  panchLive: { fontFamily: fonts.interBold, fontSize: 9.5 },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  timeCell: { width: '47.8%', flexGrow: 1, paddingVertical: 13, paddingHorizontal: 10, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
  timeLbl: { fontFamily: fonts.interSemi, fontSize: 11.5, textAlign: 'center' },
  timeVal: { fontFamily: fonts.interBold, fontSize: 13, marginTop: 4, textAlign: 'center' },

  /* time-window chips */
  timeChipRail: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingBottom: 2 },
  timeChip: { width: 200, borderWidth: 1, borderRadius: 14, paddingVertical: 11, paddingLeft: 15, paddingRight: 12, overflow: 'hidden' },
  timeChipEdge: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  timeChipLabel: { fontFamily: fonts.interBold, fontSize: 12.5 },
  timeChipTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  timeChipTime: { fontFamily: fonts.interBold, fontSize: 11.5 },
  timeChipAdvice: { fontFamily: fonts.inter, fontSize: 11, lineHeight: 15.5, marginTop: 6 },

  /* do / avoid */
  doAvoidGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  doAvoidBox: { width: '47.8%', flexGrow: 1, borderWidth: 1, borderRadius: 14, padding: 12, gap: 8 },
  doAvoidTitle: { fontFamily: fonts.interBold, fontSize: 13 },
  listRow: { flexDirection: 'row', gap: 7 },

  /* remedies */
  remedy: { borderWidth: 1, borderRadius: 14, padding: 12 },
  remedyHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  remedyTitle: { fontFamily: fonts.playfair, fontSize: 14.5 },
  remedyTimingRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  remedyTag: { fontFamily: fonts.interBold, fontSize: 9.5, textTransform: 'uppercase', letterSpacing: 0.4 },
  prBadge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  prText: { fontFamily: fonts.interBold, fontSize: 9 },
  remedyBodyWrap: { marginTop: 10, gap: 7 },
  mantraSmall: { fontFamily: fonts.devanagariBold, fontSize: 12.5, lineHeight: 19 },
  mantraText: { fontFamily: fonts.devanagariBold, fontSize: 17, lineHeight: 26, textAlign: 'center', marginTop: 4 },

  /* ask further */
  questionWrap: { gap: 8, marginTop: 10 },
  questionChip: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 11 },
  questionText: { flex: 1, fontFamily: fonts.interSemi, fontSize: 12.5, lineHeight: 18 },
  askPrimaryWrap: { marginTop: 12, borderRadius: radii.pill, overflow: 'hidden' },
  askPrimary: { flexDirection: 'row', gap: 8, paddingVertical: 13, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },

  /* note + actions */
  note: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14, padding: 14, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  noteIc: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  noteText: { flex: 1, fontFamily: fonts.inter, fontSize: 12, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  action: { flex: 1, flexDirection: 'row', gap: 7, paddingVertical: 14, borderRadius: radii.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  actionPrimaryWrap: { flex: 2, borderRadius: radii.pill, overflow: 'hidden' },
  actionPrimary: { flexDirection: 'row', gap: 8, paddingVertical: 14, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontFamily: fonts.cinzelSemi, fontSize: 12, letterSpacing: 1.1 },
});
