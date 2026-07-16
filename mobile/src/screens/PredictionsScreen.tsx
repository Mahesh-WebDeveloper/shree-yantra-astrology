import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Image, Animated, Easing } from 'react-native';
// Stack ka horizontal back-gesture RN core ScrollView ka horizontal swipe kha jaata tha
// (राशि rail slide nahi hota tha) — gesture-handler ka ScrollView isse cooperate karta hai.
import { ScrollView } from 'react-native-gesture-handler';
import Svg, { Line, Path, Polyline } from 'react-native-svg';
import { rashiImage } from '../components/icons/rashiImages';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { Theme, fonts, radii } from '../theme/tokens';
import { Page } from '../components/Page';
import { Card } from '../components/Card';
import { GradientText } from '../components/GradientText';
import { GoldButton } from '../components/GoldButton';
import { TextField } from '../components/TextField';
import { BirthPlaceField } from '../components/BirthPlaceField';
import { GoldDatePicker } from '../components/GoldDatePicker';
import { GoldTimePicker } from '../components/GoldTimePicker';
import { CalendarIcon, ClockIcon, UserLine } from '../components/icons/ProfileIcons';
import { hTap, hSelect } from '../lib/haptics';
import { birthFromProfile } from '../lib/birth';
import { naamRashi } from '../lib/naamRashi';
import { getHoroscope, getPersonalizedHoroscope, getSignRashifal, SignRashifal, HoroscopePeriod, HoroscopeSign, DailyPrediction, LocationSuggestion, resolveLocation } from '../lib/api';
import { useLang } from '../i18n/LanguageProvider';
import { Lang } from '../i18n/strings';
import { useReadingPrefs, readingStyle, READING_SCALES, ReadingScale } from '../hooks/useReadingPrefs';
import { ReadingBar } from '../components/ReadingBar';

const PERIODS: HoroscopePeriod[] = ['daily', 'weekly', 'monthly', 'yearly'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/* sign-rail geometry — medallion column width + gap = the snap interval */
const RAIL_ITEM_W = 76;
const RAIL_GAP = 10;
const RAIL_SNAP = RAIL_ITEM_W + RAIL_GAP;

function periodLabel(period: HoroscopePeriod, lang: 'en' | 'hi') {
  const en = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' };
  const hi = { daily: 'दैनिक', weekly: 'साप्ताहिक', monthly: 'मासिक', yearly: 'वार्षिक' };
  return (lang === 'hi' ? hi : en)[period];
}

const toDDMM = (d: Date) => `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
const fmtDob = (d: Date) => `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
function to24h(t: string) {
  const m = String(t || '').trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return null;
  let h = Number(m[1]);
  const min = m[2];
  const ap = (m[3] || '').toUpperCase();
  if (ap === 'PM' && h < 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  if (!ap && h > 23) return null;
  if (h < 0 || h > 23) return null;
  return `${String(h).padStart(2, '0')}:${min}`;
}

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

/* Illustrated rashi (zodiac) PNG icon. `dim` fades unselected signs in the rail. */
function RashiIcon({ signKey, size = 56, dim = false }: { signKey: string; size?: number; dim?: boolean }) {
  const img = rashiImage(signKey);
  if (!img) return null;
  return <Image source={img} style={{ width: size, height: size, opacity: dim ? 0.42 : 1 }} resizeMode="contain" />;
}

/* Defers mounting of below-the-fold sections so the first paint is instant. */
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
   (same treatment as DailyPrediction/Kundli/Choghadiya). */
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

/* Soft shimmer line — loading state (no spinners). Colours are OPAQUE so it can
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

/* ── Sign medallion — one item of the horizontal snap rail. Spring press;
   selected = gold gradient ring. All fills OPAQUE (sits in a scale-animated
   wrapper — Android white-composite bug). ── */
const SignMedallion = React.memo(function SignMedallion({
  sign, on, theme, onPick,
}: {
  sign: HoroscopeSign; on: boolean; theme: Theme; onPick: (key: string) => void;
}) {
  const { sc, pressIn, pressOut } = useSpringPress(0.9);
  return (
    <Animated.View style={{ transform: [{ scale: sc }], width: RAIL_ITEM_W }}>
      <Pressable
        onPress={() => onPick(sign.key)}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={{ alignItems: 'center' }}
        hitSlop={2}
      >
        {on ? (
          <LinearGradient colors={theme.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.medRingOn}>
            <View style={[styles.medInnerOn, { backgroundColor: theme.isDark ? '#000000' : '#ffffff' }]}>
              <RashiIcon signKey={sign.key} size={44} />
            </View>
          </LinearGradient>
        ) : (
          <View style={[styles.medRing, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? '#0b0906' : '#fffdf7' }]}>
            <RashiIcon signKey={sign.key} size={42} dim />
          </View>
        )}
        <Text style={[styles.medName, { color: on ? theme.goldText : theme.textSoft }]} numberOfLines={1}>{sign.displayName}</Text>
        <Text style={[styles.medDates, { color: theme.textMuted }]} numberOfLines={1}>{sign.dates}</Text>
      </Pressable>
    </Animated.View>
  );
});

/* ── Life-area row — thin gold gradient bar + reading text ── */
const AreaRow = React.memo(function AreaRow({
  area, theme, scale, bold,
}: {
  area: { key: string; title: string; score: number; text: string }; theme: Theme; scale: number; bold: number;
}) {
  const pct = Math.max(0, Math.min(100, area.score || 0));
  return (
    <View>
      <View style={styles.areaHead}>
        <Text style={[styles.areaTitle, { color: theme.text }]}>{area.title}</Text>
        <Text style={[styles.areaPct, { color: theme.goldText }]}>{pct}%</Text>
      </View>
      <View style={[styles.track, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(176,115,22,0.16)' }]}>
        <LinearGradient colors={theme.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.fill, { width: `${pct}%` }]} />
      </View>
      <Text style={[readingStyle(scale, bold, 12.8, 19.5), { color: theme.textSoft, marginTop: 7 }]}>{area.text}</Text>
    </View>
  );
});

/* ── Do / Avoid column — ✓ (green) and ✗ (red) one-liners ── */
const ListColumn = React.memo(function ListColumn({
  kind, title, items, theme, scale, bold,
}: {
  kind: 'do' | 'avoid'; title: string; items: string[]; theme: Theme; scale: number; bold: number;
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
          <Text style={[readingStyle(scale, bold, 12.5, 19), { color: theme.text, flex: 1 }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
});

/* ── One rich rashifal section — heading + text + optional "saral" box ── */
const RashifalSection = React.memo(function RashifalSection({
  heading, text, saral, theme, lang, scale, bold,
}: {
  heading?: string; text: string; saral?: string; theme: Theme; lang: Lang; scale: number; bold: number;
}) {
  return (
    <View style={[styles.aiSection, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.7)' }]}>
      {!!heading && <Text style={[styles.aiSecHead, { color: theme.gold1 }]}>{heading}</Text>}
      <Text style={[readingStyle(scale, bold, 13.3, 21), { color: theme.text }]}>{text}</Text>
      {!!saral && (
        <View style={[styles.saralBox, { borderColor: theme.gold2 + '55', backgroundColor: theme.isDark ? 'rgba(233,184,80,0.07)' : 'rgba(244,195,74,0.12)' }]}>
          <View style={styles.saralLabelRow}>
            <MiniSpark color={theme.gold1} size={13} />
            <Text style={[styles.saralLabel, { color: theme.gold1 }]}>{lang === 'hi' ? 'सरल भाषा में समझें' : 'In simple words'}</Text>
          </View>
          <Text style={[readingStyle(scale, bold, 12.8, 20), { color: theme.textSoft }]}>{saral}</Text>
        </View>
      )}
    </View>
  );
});

function PickerField({ icon, label, value, placeholder, onPress, theme }: { icon: React.ReactNode; label: string; value: string; placeholder: string; onPress: () => void; theme: Theme }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pickField,
        { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.62)' : '#fffdf7' },
        pressed && { transform: [{ scale: 0.99 }] },
      ]}
    >
      <View style={styles.pickIcon}>{icon}</View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.pickLabel, { color: theme.goldText }]}>{label.toUpperCase()}</Text>
        <Text style={[styles.pickValue, { color: value ? theme.text : theme.textMuted }]} numberOfLines={1}>{value || placeholder}</Text>
      </View>
    </Pressable>
  );
}

export function PredictionsScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const hi = lang === 'hi';
  const [period, setPeriod] = useState<HoroscopePeriod>('daily');
  const [selectedKey, setSelectedKey] = useState('aries');
  const [signs, setSigns] = useState<HoroscopeSign[]>([]);
  const [basis, setBasis] = useState<any>(null);
  const [sourceNote, setSourceNote] = useState('');
  const [personal, setPersonal] = useState<DailyPrediction | null>(null);
  const [otherName, setOtherName] = useState('');
  const [otherDob, setOtherDob] = useState<Date | null>(null);
  const [otherTime, setOtherTime] = useState('06:42 AM');
  const [otherPlace, setOtherPlace] = useState('');
  const [otherLocation, setOtherLocation] = useState<LocationSuggestion | null>(null);
  const [otherResult, setOtherResult] = useState<DailyPrediction | null>(null);
  const [otherLoading, setOtherLoading] = useState(false);
  const [otherErr, setOtherErr] = useState<string | null>(null);
  const [showOtherDate, setShowOtherDate] = useState(false);
  const [showOtherTime, setShowOtherTime] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const autoSelectedRef = useRef(false);
  // rich, period-scaled rashifal for the selected sign (sections + saral + conclusion)
  const [aiR, setAiR] = useState<SignRashifal | null>(null);
  const [aiRLoading, setAiRLoading] = useState(false);

  // reader prefs — the shared Aa control (persisted; applies only to reading text)
  const { scale, weight: bold, stepScale, stepWeight } = useReadingPrefs(); // bold = weight step (0/1/2)
  const [readerOpen, setReaderOpen] = useState(false);
  const rd = useCallback(
    (size: number, lineHeight: number) => readingStyle(scale, bold, size, lineHeight),
    [scale, bold]
  );

  useEffect(() => {
    let on = true;
    setLoading(true);
    setErr(null);
    getHoroscope({ period })
      .then((r) => {
        if (!on) return;
        setSigns(r.signs || []);
        setBasis(r.basis || null);
        setSourceNote(r.sourceNote || '');
        if (!selectedKey && r.signs && r.signs[0]) setSelectedKey(r.signs[0].key);
      })
      .catch((e) => { if (on) setErr(e?.message || 'Horoscope unavailable'); })
      .finally(() => { if (on) setLoading(false); });
    return () => { on = false; };
  }, [period, lang]);

  useEffect(() => {
    let on = true;
    birthFromProfile()
      .then((birth) => {
        // default the selected rashi to the user's naam-rashi (by name's first syllable)
        if (on && birth && !autoSelectedRef.current) {
          const r = naamRashi((birth as any).name);
          if (r) { autoSelectedRef.current = true; setSelectedKey(r.toLowerCase()); }
        }
        return birth ? getPersonalizedHoroscope(birth) : null;
      })
      .then((r) => { if (on && r?.horoscope) setPersonal(r.horoscope); })
      .catch(() => {});
    return () => { on = false; };
  }, [lang]);

  const selected = useMemo(() => signs.find((s) => s.key === selectedKey) || signs[0], [signs, selectedKey]);

  // Fetch the rich rashifal for the selected sign + period (sections + saral + conclusion).
  const signName = selected?.name;
  useEffect(() => {
    if (!signName) return;
    let on = true;
    setAiR(null); setAiRLoading(true);
    getSignRashifal(signName, period, { moonSign: basis?.moon?.sign, sunSign: basis?.sun?.sign })
      .then((r) => { if (on) setAiR(r); })
      .catch(() => { if (on) setAiR(null); })
      .finally(() => { if (on) setAiRLoading(false); });
    return () => { on = false; };
  }, [signName, period, lang]);

  const changePeriod = (p: HoroscopePeriod) => {
    if (p === period) return;
    hSelect();
    setPeriod(p);
  };

  const pickSign = useCallback((key: string) => { hSelect(); setSelectedKey(key); }, []);

  // hero entrance — hero ONLY (below-the-fold sections mount via Deferred instead)
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enter, { toValue: 1, duration: 560, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [enter]);
  const riseStyle = {
    opacity: enter,
    transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
  };

  // keep the selected medallion in view (naam-rashi auto-select lands mid-rail)
  const railRef = useRef<ScrollView>(null);
  useEffect(() => {
    if (!signs.length) return;
    const idx = signs.findIndex((s) => s.key === (selected?.key || selectedKey));
    if (idx < 0) return;
    const t = setTimeout(() => {
      railRef.current?.scrollTo({ x: Math.max(0, idx * RAIL_SNAP - RAIL_SNAP), animated: true });
    }, 80);
    return () => clearTimeout(t);
  }, [selectedKey, signs.length]);

  const generateOther = async () => {
    if (!otherDob) {
      setOtherErr(hi ? 'जन्म तिथि चुनें।' : 'Select date of birth.');
      return;
    }
    const tob = to24h(otherTime);
    if (!tob) {
      setOtherErr(hi ? 'जन्म समय सही भरें।' : 'Enter a valid birth time.');
      return;
    }
    if (!otherPlace.trim()) {
      setOtherErr(hi ? 'जन्म स्थान भरें।' : 'Enter birth place.');
      return;
    }
    setOtherLoading(true);
    setOtherErr(null);
    try {
      const resolved = otherLocation || await resolveLocation({ query: otherPlace.trim(), lang }).then((r) => r.item).catch(() => null);
      const finalPlace = resolved?.description || otherPlace.trim();
      const coords = resolved?.lat != null && resolved?.lng != null ? { lat: resolved.lat, lng: resolved.lng } : {};
      if (resolved?.description && resolved.description !== otherPlace) setOtherPlace(resolved.description);
      const r = await getPersonalizedHoroscope({
        name: otherName.trim() || (hi ? 'परिवार सदस्य' : 'Family Member'),
        dob: toDDMM(otherDob),
        tob,
        tz: '+05:30',
        place: finalPlace,
        ...coords,
      });
      setOtherResult(r.horoscope);
      hSelect();
    } catch (e: any) {
      setOtherErr(e?.message || (hi ? 'राशिफल नहीं बन पाया।' : 'Could not generate horoscope.'));
    } finally {
      setOtherLoading(false);
    }
  };

  // opaque pill fill — several pills live inside the rise()-animated hero
  const pillBg = theme.isDark ? '#0b0906' : '#ffffff';
  const heroLoading = loading || !selected;
  const confidence = selected ? Math.round((selected.confidence || 0) * 100) : 0;
  const heroScore = selected ? Math.max(0, Math.min(100, selected.score || 0)) : 0;

  return (
    <Page title={hi ? 'राशिफल' : 'Horoscope'} onBack={() => { hTap(); navigation.goBack(); }}>
      {/* Header row — Daily / Weekly / Monthly / Yearly tabs + the Aa reading control */}
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: readerOpen ? 8 : 14, alignItems: 'stretch' }}>
        {PERIODS.map((p) => {
          const on = p === period;
          return (
            <Pressable key={p} onPress={() => changePeriod(p)} style={{ flex: 1 }}>
              {on ? (
                <LinearGradient colors={theme.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.tabOn}>
                  <Text style={[styles.tabText, { color: theme.buttonInk }]} numberOfLines={1}>{periodLabel(p, lang)}</Text>
                </LinearGradient>
              ) : (
                <View style={[styles.tabOff, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.4)' : '#fffdf7' }]}>
                  <Text style={[styles.tabText, { color: theme.gold2 }]} numberOfLines={1}>{periodLabel(p, lang)}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
        <Pressable
          onPress={() => { hTap(); setReaderOpen((o) => !o); }}
          hitSlop={6}
          style={({ pressed }) => [
            styles.aaBtn,
            {
              borderColor: readerOpen ? (theme.isDark ? 'rgba(233,184,80,0.6)' : 'rgba(124,74,3,0.6)') : theme.cardBorder,
              backgroundColor: readerOpen ? (theme.isDark ? '#241b09' : '#faf0da') : (theme.isDark ? 'rgba(0,0,0,0.4)' : '#fffdf7'),
            },
            pressed && { transform: [{ scale: 0.94 }] },
          ]}
        >
          <Text style={[styles.aaText, { color: theme.goldText }]}>Aa</Text>
        </Pressable>
      </View>

      {readerOpen && (
        <ReadingBar scale={scale} weight={bold} stepScale={stepScale} stepWeight={stepWeight} theme={theme} lang={lang} />
      )}

      {/* ── sign picker — horizontal snap rail of medallions ── */}
      <Card contentStyle={{ paddingHorizontal: 0, paddingVertical: 16 }}>
        <SectionTitle label={hi ? 'अपनी राशि चुनें' : 'Choose Your Sign'} style={{ paddingHorizontal: 20 }} />
        {signs.length ? (
          <ScrollView
            ref={railRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={RAIL_SNAP}
            snapToAlignment="start"
            decelerationRate="fast"
            contentContainerStyle={styles.rail}
          >
            {signs.map((s) => (
              <SignMedallion key={s.key} sign={s} on={s.key === selected?.key} theme={theme} onPick={pickSign} />
            ))}
          </ScrollView>
        ) : (
          <View style={[styles.rail, { gap: RAIL_GAP }]}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={{ width: RAIL_ITEM_W, alignItems: 'center' }}>
                <SkelLine theme={theme} width={62} height={62} style={{ borderRadius: 31 }} />
                <SkelLine theme={theme} width={52} height={9} style={{ marginTop: 8 }} />
              </View>
            ))}
          </View>
        )}
      </Card>

      {/* ── HERO — selected sign identity + score bar + reading (rise entrance) ── */}
      <Animated.View style={[riseStyle, { marginTop: 14 }]}>
        <Card solidBlack>
          {heroLoading ? (
            <View>
              <SkelLine theme={theme} width={84} height={84} style={{ borderRadius: 42, alignSelf: 'center' }} />
              <SkelLine theme={theme} width="46%" height={18} style={{ alignSelf: 'center', marginTop: 14 }} />
              <SkelLine theme={theme} width="60%" height={11} style={{ alignSelf: 'center', marginTop: 10 }} />
              <SkelLine theme={theme} width="100%" height={12} style={{ marginTop: 18 }} />
              <SkelLine theme={theme} width="100%" height={12} style={{ marginTop: 8 }} />
              <SkelLine theme={theme} width="82%" height={12} style={{ marginTop: 8 }} />
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
                <SkelLine theme={theme} width={110} height={30} style={{ borderRadius: 999 }} />
                <SkelLine theme={theme} width={110} height={30} style={{ borderRadius: 999 }} />
              </View>
            </View>
          ) : (
            <>
              <View style={{ alignItems: 'center' }}>
                <LinearGradient colors={theme.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroRing}>
                  <View style={[styles.heroRingInner, { backgroundColor: theme.isDark ? '#000000' : '#ffffff' }]}>
                    <RashiIcon signKey={selected!.key} size={62} />
                  </View>
                </LinearGradient>
                <GradientText style={styles.heroName}>{selected!.displayName}</GradientText>
                <Text style={[styles.heroKicker, { color: theme.goldText }]} numberOfLines={1}>
                  {[selected!.lord, selected!.element, selected!.dates].filter(Boolean).join(' | ')}
                </Text>
              </View>

              {!!selected!.headline && (
                <Text style={[styles.heroHeadline, { color: theme.goldText, borderTopColor: theme.line }]}>{selected!.headline}</Text>
              )}
              <Text style={[rd(15, 24), { color: theme.text, marginTop: 12 }]}>{selected!.plainSummary}</Text>
              {!!selected!.summary && <Text style={[rd(13.5, 21.5), { color: theme.textSoft, marginTop: 10 }]}>{selected!.summary}</Text>}

              {/* period score — thin gold bar (OPAQUE track — inside the rise wrapper) */}
              <View style={styles.scoreHead}>
                <Text style={[styles.scoreLbl, { color: theme.text }]}>{hi ? 'कुल स्कोर' : 'Overall Score'}</Text>
                <Text style={[styles.areaPct, { color: theme.goldText }]}>{heroScore}%</Text>
              </View>
              <View style={[styles.track, { backgroundColor: theme.isDark ? '#141414' : '#f2e9da' }]}>
                <LinearGradient colors={theme.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.fill, { width: `${heroScore}%` }]} />
              </View>

              {/* lucky pills + confidence — opaque fills (inside the rise wrapper) */}
              <View style={styles.luckRow}>
                <View style={[styles.luckPill, { borderColor: theme.cardBorder, backgroundColor: pillBg }]}>
                  <MiniSpark color={theme.gold1} size={12} />
                  <Text style={[styles.luckLbl, { color: theme.textSoft }]}>{hi ? 'शुभ रंग' : 'Lucky Colour'} </Text>
                  <Text style={[styles.luckVal, { color: theme.goldText }]}>{selected!.luckyColor}</Text>
                </View>
                <View style={[styles.luckPill, { borderColor: theme.cardBorder, backgroundColor: pillBg }]}>
                  <Text style={[styles.luckStar, { color: theme.gold1 }]}>#</Text>
                  <Text style={[styles.luckLbl, { color: theme.textSoft }]}>{hi ? 'शुभ अंक' : 'Lucky Number'} </Text>
                  <Text style={[styles.luckVal, { color: theme.goldText }]}>{selected!.luckyNumber}</Text>
                </View>
                {confidence > 0 && (
                  <View style={[styles.luckPill, { borderColor: theme.cardBorder, backgroundColor: pillBg }]}>
                    <Text style={[styles.luckLbl, { color: theme.textSoft }]}>{hi ? 'विश्वास' : 'Confidence'} </Text>
                    <Text style={[styles.luckVal, { color: theme.goldText }]}>{confidence}%</Text>
                  </View>
                )}
              </View>

              {/* today's transit context — the real sky the readings are computed from */}
              {!!basis && (
                <View style={styles.basisStrip}>
                  {[basis.moon?.sign, basis.sun?.sign, basis.nakshatra?.name].filter(Boolean).slice(0, 3).map((x: string) => (
                    <View key={x} style={[styles.basisChip, { borderColor: theme.cardBorder, backgroundColor: pillBg }]}>
                      <Text style={[styles.basisChipText, { color: theme.goldText }]}>{x}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </Card>
      </Animated.View>

      {!!err && !loading && <Text style={[styles.error, { color: theme.red }]}>{err}</Text>}

      {!heroLoading && (
        <>
          {/* ── detailed period rashifal — sections + saral + conclusion ── */}
          <Deferred delay={80}>
            {(aiRLoading || !!(aiR && aiR.sections.length)) && (
              <Card style={{ marginTop: 14 }}>
                <SectionTitle label={hi ? 'विस्तृत राशिफल' : 'Detailed Rashifal'} />
                {aiRLoading ? (
                  <View>
                    <SkelLine theme={theme} width="72%" height={15} />
                    <SkelLine theme={theme} width="100%" height={11} style={{ marginTop: 14 }} />
                    <SkelLine theme={theme} width="100%" height={11} style={{ marginTop: 8 }} />
                    <SkelLine theme={theme} width="88%" height={11} style={{ marginTop: 8 }} />
                    <SkelLine theme={theme} width="100%" height={11} style={{ marginTop: 16 }} />
                    <SkelLine theme={theme} width="64%" height={11} style={{ marginTop: 8 }} />
                    <Text style={[styles.aiLoadingText, { color: theme.textMuted }]}>
                      {period === 'yearly'
                        ? (hi ? 'पूरे वर्ष का गहन राशिफल तैयार हो रहा है…' : 'Preparing your deep year-long rashifal…')
                        : (hi ? 'आपका विस्तृत राशिफल तैयार हो रहा है…' : 'Preparing your detailed rashifal…')}
                    </Text>
                  </View>
                ) : (
                  <View style={{ gap: 12 }}>
                    {!!aiR!.headline && <GradientText style={styles.aiHeadline}>{aiR!.headline}</GradientText>}
                    {aiR!.sections.map((sec, i) => (
                      <RashifalSection
                        key={i}
                        heading={sec.heading}
                        text={sec.text}
                        saral={sec.saral}
                        theme={theme}
                        lang={lang}
                        scale={scale}
                        bold={bold}
                      />
                    ))}
                    {!!(aiR!.conclusion?.text || aiR!.conclusion?.saral) && (
                      <View style={[styles.conclusionBox, { borderColor: theme.gold2 + '66', backgroundColor: theme.isDark ? 'rgba(201,150,46,0.1)' : 'rgba(244,195,74,0.16)' }]}>
                        <Text style={[styles.aiSecHead, { color: theme.gold1 }]}>{hi ? 'निष्कर्ष (सारांश)' : 'Conclusion'}</Text>
                        {!!aiR!.conclusion.text && <Text style={[rd(13.3, 21), { color: theme.text }]}>{aiR!.conclusion.text}</Text>}
                        {!!aiR!.conclusion.saral && <Text style={[rd(12.8, 20), { color: theme.textSoft, marginTop: 8 }]}>{aiR!.conclusion.saral}</Text>}
                      </View>
                    )}
                  </View>
                )}
              </Card>
            )}
          </Deferred>

          {/* ── life areas + do/avoid ── */}
          <Deferred delay={160}>
            {!!selected!.areas?.length && (
              <Card style={{ marginTop: 14 }}>
                <SectionTitle label={hi ? 'जीवन क्षेत्र' : 'Life Areas'} />
                <View style={{ gap: 14 }}>
                  {selected!.areas.map((area) => (
                    <AreaRow key={area.key} area={area} theme={theme} scale={scale} bold={bold} />
                  ))}
                </View>
              </Card>
            )}

            {!!(selected!.doList?.length || selected!.avoidList?.length) && (
              <Card style={{ marginTop: 14 }}>
                <SectionTitle label={hi ? 'करें और बचें' : 'Do And Avoid'} />
                <View style={styles.doAvoidGrid}>
                  <ListColumn kind="do" title={hi ? 'करें' : 'Do'} items={selected!.doList || []} theme={theme} scale={scale} bold={bold} />
                  <ListColumn kind="avoid" title={hi ? 'बचें' : 'Avoid'} items={selected!.avoidList || []} theme={theme} scale={scale} bold={bold} />
                </View>
              </Card>
            )}
          </Deferred>

          {/* ── remedy + calculation basis ── */}
          <Deferred delay={240}>
            {!!selected!.remedy && (
              <Card style={{ marginTop: 14 }}>
                <SectionTitle label={hi ? 'सरल उपाय' : 'Simple Remedy'} />
                <View style={[styles.remedyBox, { borderColor: theme.gold2 + '55', backgroundColor: theme.isDark ? 'rgba(233,184,80,0.07)' : 'rgba(244,195,74,0.12)' }]}>
                  <View style={{ marginTop: 2 }}><CheckGlyph color={theme.green} /></View>
                  <Text style={[rd(13, 20), { color: theme.text, flex: 1 }]}>{selected!.remedy}</Text>
                </View>
              </Card>
            )}

            {!!selected!.basisBullets?.length && (
              <Card style={{ marginTop: 14 }}>
                <SectionTitle label={hi ? 'गणना आधार' : 'Calculation Basis'} />
                {selected!.basisBullets.map((x) => (
                  <View key={x} style={styles.basisLineRow}>
                    <View style={[styles.basisDot, { backgroundColor: theme.gold2 }]} />
                    <Text style={[styles.basisLine, { color: theme.textMuted, flex: 1 }]}>{x}</Text>
                  </View>
                ))}
                {!!sourceNote && <Text style={[styles.sourceNote, { color: theme.textMuted }]}>{sourceNote}</Text>}
              </Card>
            )}
          </Deferred>
        </>
      )}

      {/* ── personal cross-link + family/other person (logic unchanged) ── */}
      <Deferred delay={320}>
        {!!personal && (
          <Card style={{ marginTop: 14 }} contentStyle={styles.personalCard}>
            <Text style={[styles.kicker, { color: theme.gold1 }]}>{hi ? 'आपकी व्यक्तिगत कुंडली' : 'Your Personalized Horoscope'}</Text>
            <Text style={[styles.personalTitle, { color: theme.text }]}>{personal.headline || (hi ? 'आज का मार्गदर्शन' : 'Today’s guidance')}</Text>
            <Text style={[rd(12.5, 19), { color: theme.textSoft, marginTop: 6 }]} numberOfLines={4}>{personal.overall}</Text>
            <GoldButton label={hi ? 'पूरा व्यक्तिगत राशिफल देखें' : 'Open Full Personal Reading'} compact onPress={() => { hTap(); navigation.navigate('DailyPrediction'); }} style={{ marginTop: 12 }} />
          </Card>
        )}

        <Card style={{ marginTop: 14 }} contentStyle={styles.familyCard}>
          <SectionTitle label={hi ? 'परिवार / अन्य व्यक्ति' : 'Family / Other Person'} />
          <Text style={[styles.familyTitle, { color: theme.text }]}>{hi ? 'किसी और का व्यक्तिगत राशिफल देखें' : 'Check someone else’s personalized horoscope'}</Text>
          <Text style={[rd(12.5, 19), { color: theme.textSoft, marginTop: 6 }]}>
            {hi
              ? 'जन्म तिथि, समय और स्थान भरें। परिणाम उसी व्यक्ति की कुंडली, ग्रह स्थिति और पंचांग से बनेगा।'
              : 'Enter birth date, time, and place. The result uses that person’s chart, planetary positions, and panchang.'}
          </Text>

          <View style={styles.familyForm}>
            <TextField
              icon={<UserLine color={theme.gold2} size={20} />}
              label={hi ? 'नाम' : 'Name'}
              value={otherName}
              onChangeText={setOtherName}
              placeholder={hi ? 'जैसे: Rahul Sharma' : 'Eg. Rahul Sharma'}
              autoCapitalize="words"
            />
            <PickerField
              icon={<CalendarIcon color={theme.gold2} size={20} />}
              label={hi ? 'जन्म तिथि' : 'Date of Birth'}
              value={otherDob ? fmtDob(otherDob) : ''}
              placeholder={hi ? 'जन्म तिथि चुनें' : 'Select DOB'}
              onPress={() => { hTap(); setShowOtherDate(true); }}
              theme={theme}
            />
            <PickerField
              icon={<ClockIcon color={theme.gold2} size={20} />}
              label={hi ? 'जन्म समय' : 'Time of Birth'}
              value={otherTime}
              placeholder="06:42 AM"
              onPress={() => { hTap(); setShowOtherTime(true); }}
              theme={theme}
            />
            <BirthPlaceField
              label={hi ? 'जन्म स्थान' : 'Birth Place'}
              value={otherPlace}
              onChangeText={setOtherPlace}
              onSelect={setOtherLocation}
              placeholder={hi ? 'जैसे: आगोलाई, जोधपुर, राजस्थान' : 'Eg. Agolai, Jodhpur, Rajasthan'}
            />
          </View>

          {!!otherErr && <Text style={[styles.error, { color: theme.red, marginTop: 10 }]}>{otherErr}</Text>}
          <GoldButton
            label={otherLoading ? (hi ? 'बना रहे हैं...' : 'Generating...') : (hi ? 'व्यक्तिगत राशिफल बनाएं' : 'Generate Personal Horoscope')}
            onPress={generateOther}
            style={{ marginTop: 13 }}
          />
          {otherLoading && (
            <View style={styles.otherLoadingRow}>
              <ActivityIndicator color={theme.gold1} size="small" />
              <Text style={[styles.aiLoadingText, { color: theme.textMuted, marginTop: 0 }]}>
                {hi ? 'कुंडली और पंचांग से गणना हो रही है…' : 'Calculating from the chart and panchang…'}
              </Text>
            </View>
          )}

          {!!otherResult && (
            <View style={[styles.otherResult, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.08)' : 'rgba(176,115,22,0.07)' }]}>
              <Text style={[styles.kicker, { color: theme.gold1 }]}>{otherName.trim() || (hi ? 'व्यक्ति' : 'Person')}</Text>
              <Text style={[styles.personalTitle, { color: theme.text }]}>{otherResult.headline || (hi ? 'व्यक्तिगत मार्गदर्शन' : 'Personal Guidance')}</Text>
              <Text style={[rd(12.5, 19), { color: theme.textSoft, marginTop: 6 }]}>{otherResult.overall}</Text>
              {!!otherResult.detailedSummary && <Text style={[rd(12.5, 19), { color: theme.textSoft, marginTop: 8 }]}>{otherResult.detailedSummary}</Text>}
              <View style={styles.metaGrid}>
                {[
                  otherResult.basis?.moonSign ? `${hi ? 'चंद्र' : 'Moon'}: ${otherResult.basis.moonSign}` : '',
                  otherResult.basis?.ascendant ? `${hi ? 'लग्न' : 'Lagna'}: ${otherResult.basis.ascendant}` : '',
                  otherResult.luckyColour ? `${hi ? 'रंग' : 'Color'}: ${otherResult.luckyColour}` : '',
                ].filter(Boolean).map((m) => (
                  <View key={m} style={[styles.metaChip, { borderColor: theme.cardBorder }]}>
                    <Text style={[styles.metaText, { color: theme.goldText }]}>{m}</Text>
                  </View>
                ))}
              </View>
              {!!otherResult.advice && (
                <View style={[styles.adviceRow, { backgroundColor: theme.isDark ? 'rgba(50,205,50,0.10)' : 'rgba(22,101,52,0.08)' }]}>
                  <View style={{ marginTop: 2 }}><CheckGlyph color={theme.green} /></View>
                  <Text style={[rd(12.5, 19), { color: theme.text, flex: 1 }]}>{otherResult.advice}</Text>
                </View>
              )}
            </View>
          )}
        </Card>

        <GoldButton
          label={hi ? 'ज्योतिषी से पूछें' : 'Ask the Astrologer'}
          onPress={() => {
            hTap();
            navigation.navigate('AiAstrologer', {
              question: hi
                ? `${selected?.displayName || ''} राशि और मेरी कुंडली के आधार पर आज मेरे लिए सबसे महत्वपूर्ण सलाह क्या है?`
                : `Based on ${selected?.displayName || 'my sign'} and my birth chart, what is the most important guidance for me today?`,
            });
          }}
          style={{ marginTop: 16 }}
        />
      </Deferred>

      <GoldDatePicker
        visible={showOtherDate}
        initialDate={otherDob || new Date(2000, 0, 1)}
        maximumDate={new Date()}
        onConfirm={(d) => { setOtherDob(d); setShowOtherDate(false); hSelect(); }}
        onCancel={() => setShowOtherDate(false)}
        lang={lang}
      />
      <GoldTimePicker
        visible={showOtherTime}
        value={otherTime}
        onConfirm={(t) => { setOtherTime(t); setShowOtherTime(false); hSelect(); }}
        onCancel={() => setShowOtherTime(false)}
        lang={lang}
      />
    </Page>
  );
}

const styles = StyleSheet.create({
  /* header controls */
  tabOn: { paddingVertical: 8, borderRadius: 999, alignItems: 'center' },
  tabOff: { paddingVertical: 8, borderRadius: 999, alignItems: 'center', borderWidth: 1 },
  tabText: { fontFamily: fonts.interSemi, fontSize: 12 },
  aaBtn: { width: 40, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  aaText: { fontFamily: fonts.interBold, fontSize: 13 },
  readBar: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 14 },
  readLbl: { flex: 1, fontFamily: fonts.interSemi, fontSize: 11 },
  readBtns: { flexDirection: 'row', gap: 6 },
  readBtnWrap: { borderRadius: 10, overflow: 'hidden' },
  readBtn: { width: 34, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  boldBtn: { height: 32, paddingHorizontal: 11, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  boldBtnText: { fontFamily: fonts.interBold, fontSize: 11 },

  /* section titles */
  secTitleWrap: { marginBottom: 12 },
  secTitleText: { fontFamily: fonts.cinzel, fontSize: 13, letterSpacing: 1.8, textTransform: 'uppercase' },
  secTitleRule: { height: 1, marginTop: 7 },

  /* sign rail */
  rail: { flexDirection: 'row', gap: RAIL_GAP, paddingHorizontal: 20, paddingBottom: 2 },
  medRingOn: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center' },
  medInnerOn: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  medRing: { width: 62, height: 62, borderRadius: 31, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  medName: { fontFamily: fonts.cinzelSemi, fontSize: 10.5, letterSpacing: 0.3, marginTop: 7, maxWidth: RAIL_ITEM_W },
  medDates: { fontFamily: fonts.inter, fontSize: 8.5, marginTop: 2, maxWidth: RAIL_ITEM_W },

  /* hero */
  heroRing: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center' },
  heroRingInner: { width: 78, height: 78, borderRadius: 39, alignItems: 'center', justifyContent: 'center' },
  heroName: { fontFamily: fonts.playfairBold, fontSize: 24, marginTop: 10, textAlign: 'center' },
  heroKicker: { fontFamily: fonts.interSemi, fontSize: 11.5, letterSpacing: 0.4, marginTop: 4 },
  heroHeadline: { fontFamily: fonts.playfairBold, fontSize: 18, lineHeight: 24, textAlign: 'center', marginTop: 16, paddingTop: 14, borderTopWidth: 1 },
  scoreHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 7 },
  scoreLbl: { fontFamily: fonts.interSemi, fontSize: 13 },
  luckRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  luckPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radii.pill, borderWidth: 1 },
  luckStar: { fontFamily: fonts.interBold, fontSize: 12 },
  luckLbl: { fontFamily: fonts.inter, fontSize: 11.5 },
  luckVal: { fontFamily: fonts.interBold, fontSize: 11.5 },
  basisStrip: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, justifyContent: 'center' },
  basisChip: { borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 5 },
  basisChipText: { fontFamily: fonts.interSemi, fontSize: 11 },

  /* gold bars */
  track: { height: 7, borderRadius: 999, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999 },

  /* life areas */
  areaHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 },
  areaTitle: { fontFamily: fonts.interSemi, fontSize: 13 },
  areaPct: { fontFamily: fonts.interBold, fontSize: 12.5 },

  /* do / avoid */
  doAvoidGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  doAvoidBox: { width: '47.8%', flexGrow: 1, borderWidth: 1, borderRadius: 14, padding: 12, gap: 8 },
  doAvoidTitle: { fontFamily: fonts.interBold, fontSize: 13 },
  listRow: { flexDirection: 'row', gap: 7 },

  /* detailed rashifal sections */
  aiLoadingText: { fontFamily: fonts.inter, fontSize: 12.5, lineHeight: 18, marginTop: 14 },
  aiHeadline: { fontFamily: fonts.playfairBold, fontSize: 17, lineHeight: 23, marginBottom: 2 },
  aiSection: { borderWidth: 1, borderRadius: 14, padding: 13 },
  aiSecHead: { fontFamily: fonts.cinzelSemi, fontSize: 13, letterSpacing: 0.4, marginBottom: 6 },
  saralBox: { borderWidth: 1, borderRadius: 12, padding: 11, marginTop: 11 },
  saralLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  saralLabel: { fontFamily: fonts.interSemi, fontSize: 11.5, letterSpacing: 0.3 },
  conclusionBox: { borderWidth: 1, borderRadius: 14, padding: 14 },

  /* remedy + basis */
  remedyBox: { flexDirection: 'row', gap: 9, borderWidth: 1, borderRadius: 12, padding: 12 },
  basisLineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 4 },
  basisDot: { width: 4, height: 4, borderRadius: 2, marginTop: 7 },
  basisLine: { fontFamily: fonts.inter, fontSize: 11.8, lineHeight: 18 },
  sourceNote: { fontFamily: fonts.inter, fontSize: 11.5, lineHeight: 17, marginTop: 12 },

  /* personal + family (logic unchanged — visuals refreshed) */
  personalCard: { padding: 16 },
  kicker: { fontFamily: fonts.interBold, fontSize: 10.5, letterSpacing: 1.2, textTransform: 'uppercase' },
  personalTitle: { fontFamily: fonts.playfairBold, fontSize: 18, marginTop: 4 },
  familyCard: { padding: 16 },
  familyTitle: { fontFamily: fonts.playfairBold, fontSize: 18, marginTop: 2 },
  familyForm: { gap: 12, marginTop: 14 },
  pickField: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: radii.md, paddingHorizontal: 14, paddingVertical: 12 },
  pickIcon: { width: 20, alignItems: 'center' },
  pickLabel: { fontFamily: fonts.interSemi, fontSize: 10.5, letterSpacing: 1.8 },
  pickValue: { fontFamily: fonts.inter, fontSize: 15, marginTop: 3 },
  otherLoadingRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 12 },
  otherResult: { borderWidth: 1, borderRadius: 16, padding: 13, marginTop: 14 },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 13 },
  metaChip: { borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 5 },
  metaText: { fontFamily: fonts.interSemi, fontSize: 10.5 },
  adviceRow: { flexDirection: 'row', gap: 8, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, marginTop: 10 },

  error: { fontFamily: fonts.interSemi, fontSize: 12.5, textAlign: 'center', marginTop: 12 },
});
