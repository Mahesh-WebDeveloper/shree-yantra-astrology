import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import Animated, {
  Extrapolation, interpolate, useAnimatedStyle, useSharedValue, withSpring, withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Path, Circle, Rect, Line, Polyline, Polygon, Defs, RadialGradient, Stop, G,
} from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';
import { GradientText } from '../components/GradientText';
import { hTap, hSelect } from '../lib/haptics';
import { clearAuth, getStoredUser } from '../lib/auth';
import { logoutServer } from '../lib/api';
import { useLang } from '../i18n/LanguageProvider';

const NAV_KEY: Record<string, string> = {
  Home: 'nav.home', DailyPrediction: 'nav.dailyPrediction', Choghadiya: 'nav.choghadiya',
  Predictions: 'nav.predictions', Panchang: 'nav.panchang', JanamPatri: 'nav.janamPatri', BrihatKundli: 'nav.brihatKundli', BabyNames: 'nav.babyNames', Numerology: 'nav.numerology', Vastu: 'nav.vastu',
  AiAstrologer: 'nav.aiAstrologer', Library: 'nav.library', Kundli: 'nav.kundli', Profile: 'nav.profile',
  Notifications: 'nav.notifications', ManageSubscription: 'nav.subscription',
  Help: 'nav.help', SignIn: 'common.logout',
};
import { useDialog } from '../components/DialogProvider';
import { navTo, resetTo, currentRouteName } from './navigationRef';

/* ── 22px nav icons — same paths as the web drawer (stroke 1.7) ── */
type IC = { c: string };
const I = {
  home: ({ c }: IC) => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><Polyline points="9 22 9 12 15 12 15 22" />
    </Svg>
  ),
  star: ({ c }: IC) => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </Svg>
  ),
  spark: ({ c }: IC) => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9z" />
      <Path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" />
    </Svg>
  ),
  clock: ({ c }: IC) => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={12} r={9} /><Path d="M12 7v5l3 2" /><Path d="M7 2.8 4.8 5M17 2.8 19.2 5" />
    </Svg>
  ),
  book: ({ c }: IC) => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><Path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z" /><Path d="M8 6h8" />
    </Svg>
  ),
  chart: ({ c }: IC) => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <Rect x={3} y={3} width={18} height={18} /><Line x1={3} y1={3} x2={21} y2={21} /><Line x1={21} y1={3} x2={3} y2={21} />
      <Line x1={12} y1={3} x2={12} y2={21} /><Line x1={3} y1={12} x2={21} y2={12} />
    </Svg>
  ),
  user: ({ c }: IC) => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><Circle cx={12} cy={7} r={4} />
    </Svg>
  ),
  bell: ({ c }: IC) => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><Path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </Svg>
  ),
  crown: ({ c }: IC) => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M2 8l4 6 5-8 5 8 4-6-2 12H4z" />
    </Svg>
  ),
  help: ({ c }: IC) => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={12} r={10} /><Path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2-3 4" /><Line x1={12} y1={17} x2={12.01} y2={17} />
    </Svg>
  ),
  logout: ({ c }: IC) => (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><Polyline points="16 17 21 12 16 7" /><Line x1={21} y1={12} x2={9} y2={12} />
    </Svg>
  ),
};

/* small section-label icons */
const GlobeIcon = ({ c }: IC) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx={12} cy={12} r={9} /><Path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
  </Svg>
);
const SunSm = ({ c }: IC) => (
  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.7} strokeLinecap="round">
    <Circle cx={12} cy={12} r={4} /><Path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </Svg>
);
const SunIcon = ({ c }: IC) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round">
    <Circle cx={12} cy={12} r={4.2} />
    <Path d="M12 2.5v2.4M12 19.1v2.4M4.3 4.3l1.7 1.7M18 18l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.3 19.7l1.7-1.7M18 6l1.7-1.7" />
  </Svg>
);
const MoonIcon = ({ c }: IC) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20.5 13.2A8.2 8.2 0 1 1 10.8 3.5a6.4 6.4 0 0 0 9.7 9.7z" />
  </Svg>
);
const CloseIcon = ({ c }: IC) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2.4} strokeLinecap="round">
    <Line x1={6} y1={6} x2={18} y2={18} /><Line x1={6} y1={18} x2={18} y2={6} />
  </Svg>
);

/* Om glyph inside the gold medallion — dark strokes on gold, like the web logo */
const OmLogo = () => (
  <Svg width={30} height={30} viewBox="0 0 100 100">
    <G fill="#2a1c00">
      <Path d="M48 38c-9 0-15 5-15 13 0 7 5 12 12 12 4 0 7-2 8-5l-3-2c-1 2-3 3-5 3-3 0-6-3-6-7s3-7 8-7c7 0 12 6 12 13s-6 14-15 14-16-7-16-16c0-3 .6-6 2-9l-4-2c-1.6 3.6-2.5 7.2-2.5 11 0 12 8.6 21 20.5 21 11.6 0 20-9 20-20 0-11-7.5-19-16-19z" />
      <Path d="M68 38c-2 0-4 1-5 3l3 2c.5-1 1.5-1.5 2.5-1.5 2 0 3 1.5 3 4 0 3-2 5-5 5l1 4c5 0 9-3 9-9 0-4.5-3-7.5-8.5-7.5z" />
      <Path d="M50 22c5 0 9 1 12 4l-2 2c-2-2-6-3-10-3z" />
      <Circle cx={50} cy={16} r={3.2} />
    </G>
  </Svg>
);

/* nav model — same order & labels as the web drawer */
// Drawer ke language buttons — nayi bhasha yaha jodo; 2 tak barabar-width row,
// 3+ par UI khud horizontal slide rail me badal jaata hai.
const DRAWER_LANGS: ReadonlyArray<readonly ['en' | 'hi', string, string]> = [
  ['en', 'EN', 'English'],
  ['hi', 'हि', 'हिंदी'],
];

type NavEntry = { label: string; icon: keyof typeof I; route: string; tab?: string; stack?: boolean; logout?: boolean };

const NAV: Array<{ divider: true } | NavEntry> = [
  { label: 'Home', icon: 'home', route: 'Home', tab: 'Home' },
  { label: 'My Rashifal', icon: 'star', route: 'DailyPrediction', stack: true },
  { label: 'Rashifal · 12 Signs', icon: 'spark', route: 'Predictions', stack: true },
  { label: 'Vedic Astrologer', icon: 'spark', route: 'AiAstrologer', stack: true },
  { label: 'Janam Patri + Naamkaran', icon: 'chart', route: 'JanamPatri', stack: true },
  { label: 'Brihat Kundli Report', icon: 'book', route: 'BrihatKundli', stack: true },
  { label: 'Child Name Finder', icon: 'spark', route: 'BabyNames', stack: true },
  { label: 'Numerology · Ank Jyotish', icon: 'star', route: 'Numerology', stack: true },
  { label: 'Vastu Shastra', icon: 'home', route: 'Vastu', stack: true },
  { label: 'Panchang', icon: 'star', route: 'Panchang', stack: true },
  { label: 'Choghadiya', icon: 'clock', route: 'Choghadiya', tab: 'Choghadiya' },
  { label: 'Divine Library', icon: 'book', route: 'Library', tab: 'Library' },
  { label: 'Kundli / Birth Chart', icon: 'chart', route: 'Kundli', tab: 'Kundli' },
  { divider: true },
  { label: 'My Profile', icon: 'user', route: 'Profile', tab: 'Profile' },
  { label: 'Notifications', icon: 'bell', route: 'Notifications', stack: true },
  { label: 'Help & Support', icon: 'help', route: 'Help', stack: true },
  { label: 'Logout', icon: 'logout', route: 'PhoneAuth', stack: true, logout: true },
];

/* ── UI-thread press scale (same worklet approach as CustomTabBar) ── */
function usePressScale() {
  const press = useSharedValue(0);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - press.value * 0.03 }],
  }));
  const onIn = () => { press.value = withTiming(1, { duration: 70 }); };
  const onOut = () => { press.value = withSpring(0, { damping: 14, stiffness: 260 }); };
  return { style, onIn, onOut };
}

/* ── staggered cascade — sections/rows slide+fade in as the drawer opens.
   Start offsets are CAPPED at 0.62 (window 0.35 → fully visible by 0.97) so the
   bottom rows always reach full opacity — the old uncapped math left rows 13+
   permanently semi-transparent. Runs entirely on the UI thread. ── */
function Cascade({ index, progress, children }: {
  index: number;
  progress?: SharedValue<number>;
  children: React.ReactNode;
}) {
  const style = useAnimatedStyle(() => {
    if (!progress) return {};
    const start = Math.min(0.1 + index * 0.045, 0.62);
    return {
      opacity: interpolate(progress.value, [0, start, start + 0.35], [0, 0, 1], Extrapolation.CLAMP),
      transform: [{ translateX: interpolate(progress.value, [0, start + 0.35], [-24, 0], Extrapolation.CLAMP) }],
    };
  });
  if (!progress) return <View>{children}</View>;
  return <Animated.View style={style}>{children}</Animated.View>;
}

/* ── memoized selector chip (language / theme) — all props are primitives except
   the stable onSelect, so chips skip re-rendering unless THEIR visuals change ── */
const SelChip = React.memo(function SelChip({
  ck, bg, border, fg, fgIcon, label, glyph, icon, rail, onSelect,
}: {
  ck: string; bg: string; border: string; fg: string; fgIcon?: string;
  label: string; glyph?: string; icon?: 'sun' | 'moon'; rail?: boolean;
  onSelect: (ck: string) => void;
}) {
  const { style, onIn, onOut } = usePressScale();
  const ic = fgIcon ?? fg;
  return (
    <Pressable
      onPressIn={onIn}
      onPressOut={onOut}
      onPress={() => onSelect(ck)}
      style={rail ? styles.langChip : styles.selPress}
    >
      <Animated.View style={[styles.selBtn, { backgroundColor: bg, borderColor: border }, style]}>
        {glyph != null && <Text style={[styles.selGlyph, { color: ic }]}>{glyph}</Text>}
        {icon === 'sun' && <SunIcon c={ic} />}
        {icon === 'moon' && <MoonIcon c={ic} />}
        <Text style={[styles.selText, { color: fg }]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
});

/* ── memoized nav row — gold medallion icon, spring-press (UI thread), active
   gold left-edge strip. `item` is a module constant (stable reference) and every
   other prop is a primitive, so rows DON'T re-render on the instant-feedback
   local state flips — only when theme/language actually land. ── */
const NavRow = React.memo(function NavRow({
  item, label, active, edge, activeBg, pressBg, iconC, textC, medBg, medBorder, onGo,
}: {
  item: NavEntry; label: string; active: boolean;
  edge: string; activeBg: string; pressBg: string;
  iconC: string; textC: string; medBg: string; medBorder: string;
  onGo: (item: NavEntry) => void;
}) {
  const { style, onIn, onOut } = usePressScale();
  const Icon = I[item.icon];
  return (
    <Pressable
      onPressIn={onIn}
      onPressOut={onOut}
      onPress={() => onGo(item)}
      style={({ pressed }) => [
        styles.navItem,
        {
          borderLeftColor: active ? edge : 'transparent',
          backgroundColor: active ? activeBg : pressed ? pressBg : 'transparent',
        },
      ]}
    >
      <Animated.View style={[styles.navInner, style]}>
        <View style={[styles.medallion, { backgroundColor: medBg, borderColor: medBorder }]}>
          <Icon c={iconC} />
        </View>
        <Text style={[styles.navText, { color: textC }]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
});

/** Side drawer — exact port of the web `.sy-drawer`:
    deep indigo gradient panel, gold-glow head with Om medallion + close button,
    Namaste + PREMIUM badge, Language & Theme selector rows, icon nav list with
    gold left-edge active state, gradient dividers, footer version line. */
export function DrawerContent({ close, progress }: { close: () => void; progress?: SharedValue<number> }) {
  const { theme, name, setTheme } = useTheme();
  const dialog = useDialog();
  const insets = useSafeAreaInsets();
  const isDark = theme.isDark;
  const { lang, setLang, t: tr } = useLang();
  const hi = lang === 'hi';

  // logged-in user (drawer har open par remount hota hai → mount par fresh load)
  const [firstName, setFirstName] = useState('Guest');
  const [planPremium, setPlanPremium] = useState(false);
  const isPremium = planPremium;
  useEffect(() => {
    getStoredUser().then((u) => {
      if (u?.name) setFirstName(u.name.trim().split(/\s+/)[0]);
      setPlanPremium(u?.plan === 'premium');
    });
  }, []);

  /* which route is focused (for active highlight) — read once at mount */
  const activeTab = currentRouteName() ?? 'Home';

  /* ── INSTANT-feedback theme/language switch.
     Root cause of the old lag: setTheme/setLang update app-wide context, which
     synchronously re-renders EVERY mounted screen while the drawer overlay is
     alive — the tapped chip's highlight waited behind that flood. Now the chip
     flips instantly from LOCAL state (memoized rows skip this render), and the
     heavy context switch is deferred two frames (double rAF, so the feedback
     paints first). Deliberately NO startTransition here: react-freeze's frozen
     screens (freezeOnBlur) suspend with a never-resolving thenable, and a
     TRANSITION update that suspends can be withheld by React indefinitely
     (partial/never-landing theme commits), whereas a default-priority update
     always commits atomically — frozen screens simply catch up on unfreeze.
     The double rAF alone already keeps the tap feedback jank-free. ── */
  const [pendingLang, setPendingLang] = useState<'en' | 'hi' | null>(null);
  const [pendingTheme, setPendingTheme] = useState<'light' | 'dark' | null>(null);
  const shownLang = pendingLang ?? lang;
  const shownTheme = pendingTheme ?? name;
  useEffect(() => { if (pendingLang !== null && lang === pendingLang) setPendingLang(null); }, [lang, pendingLang]);
  useEffect(() => { if (pendingTheme !== null && name === pendingTheme) setPendingTheme(null); }, [name, pendingTheme]);

  const chooseLang = useCallback((ck: string) => {
    const k = ck as 'en' | 'hi';
    hSelect();
    setPendingLang(k);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setLang(k);
    }));
  }, [setLang]);

  const chooseTheme = useCallback((ck: string) => {
    const k = ck as 'light' | 'dark';
    hSelect();
    setPendingTheme(k);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setTheme(k);
    }));
  }, [setTheme]);

  /* stable nav handler so memoized rows never re-render because of it */
  const goRef = useRef<(item: NavEntry) => void>(() => {});
  goRef.current = (item: NavEntry) => {
    hTap();
    // Logout → ask for confirmation first (keep drawer open behind the dialog)
    if (item.logout) {
      dialog(
        hi ? 'लॉग आउट करें?' : 'Log out?',
        hi
          ? 'अपनी प्रोफ़ाइल फिर से देखने के लिए आपको दोबारा साइन इन करना होगा।'
          : 'You will need to sign in again to access your profile.',
        [
          { text: hi ? 'रद्द करें' : 'Cancel', style: 'cancel' },
          {
            text: hi ? 'लॉग आउट' : 'Log Out',
            style: 'destructive',
            onPress: () => {
              logoutServer().catch(() => {}); // kill the server session (best-effort, uses current token)
              clearAuth();
              close();
              // logout → Phone+OTP entry (NOT the old email/password SignIn page)
              requestAnimationFrame(() => resetTo('PhoneAuth'));
            },
          },
        ],
      );
      return;
    }
    close();
    // defer navigation one frame so the close animation starts unblocked
    requestAnimationFrame(() => {
      if (item.stack) navTo(item.route);
      else navTo('Main', { screen: item.route });
    });
  };
  const onGo = useCallback((item: NavEntry) => { goRef.current(item); }, []);

  /* palette — solid hex fills inside transform-animated views (Android composite) */
  const line = isDark ? 'rgba(201,150,46,0.25)' : theme.line;
  const sectionBg = isDark ? '#0c0a06' : '#f2efeb';
  const btnBg = isDark ? '#0b0a07' : '#ffffff';
  const btnBorder = isDark ? 'rgba(201,150,46,0.3)' : theme.cardBorder;
  const chipActiveBg = isDark ? '#302a19' : '#ffe9b8';
  const rowActiveBg = isDark ? 'rgba(233,184,80,0.12)' : 'rgba(95,56,8,0.14)';
  const rowPressBg = isDark ? 'rgba(233,184,80,0.08)' : 'rgba(95,56,8,0.08)';
  const medBg = isDark ? '#100d06' : '#f5f3f0';
  const medBgActive = isDark ? '#251d0d' : '#ffe9b8';
  const medBorder = isDark ? 'rgba(201,150,46,0.28)' : theme.cardBorder;
  const medBorderActive = isDark ? 'rgba(233,184,80,0.55)' : theme.gold2;
  const logoutC = isDark ? '#ef8c8c' : '#b83232';
  const logoutBorder = isDark ? 'rgba(226,91,91,0.4)' : 'rgba(184,50,50,0.3)';

  return (
    <View
      style={[
        styles.panel,
        {
          backgroundColor: isDark ? '#000000' : '#ffffff',
          borderRightColor: isDark ? 'rgba(201,150,46,0.35)' : theme.cardBorder,
        },
      ]}
    >
      {/* ── FIXED: Head (gold radial glow + brand + user) ── */}
      <Cascade index={0} progress={progress}>
        <View style={[styles.head, { paddingTop: insets.top + 22 }]}>
          {/* radial gold glow at top-left — fixed-size (cheap to composite) */}
          <View style={styles.headGlow} pointerEvents="none">
            <Svg width={300} height={150}>
              <Defs>
                <RadialGradient id="dhGlow" cx="25%" cy="10%" r="70%">
                  <Stop offset="0%" stopColor="#e9b850" stopOpacity={isDark ? 0.18 : 0.14} />
                  <Stop offset="100%" stopColor="#e9b850" stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Rect width={300} height={150} fill="url(#dhGlow)" />
            </Svg>
          </View>

          {/* close button — top right */}
          <Pressable
            onPress={() => { hTap(); close(); }}
            hitSlop={8}
            style={({ pressed }) => [
              styles.close,
              {
                top: insets.top + 12,
                backgroundColor: pressed
                  ? (isDark ? 'rgba(233,184,80,0.22)' : 'rgba(95,56,8,0.14)')
                  : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(95,56,8,0.06)'),
                borderColor: pressed
                  ? (isDark ? 'rgba(233,184,80,0.7)' : theme.gold2)
                  : btnBorder,
              },
            ]}
          >
            <CloseIcon c={theme.gold1} />
          </Pressable>

          {/* brand row: gold Om medallion in a gold hairline ring + title */}
          <View style={styles.brandRow}>
            <LinearGradient
              colors={isDark
                ? ['#fce8a8', '#c9962e', '#7a5514']
                : ['#e9c76a', '#c9962e', '#8a6418']}
              start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }}
              style={styles.logoRing}
            >
              <View style={[styles.logoWrap, { backgroundColor: isDark ? '#000000' : '#ffffff' }]}>
                <Svg width={44} height={44} style={StyleSheet.absoluteFill}>
                  <Defs>
                    <RadialGradient id="dLogo" cx="30%" cy="30%" r="80%">
                      <Stop offset="0%" stopColor="#fce8a8" />
                      <Stop offset="70%" stopColor="#8a6418" />
                      <Stop offset="100%" stopColor="#8a6418" />
                    </RadialGradient>
                  </Defs>
                  <Circle cx={22} cy={22} r={22} fill="url(#dLogo)" />
                </Svg>
                <OmLogo />
              </View>
            </LinearGradient>
            <View>
              <GradientText style={styles.title}>SHREE YANTRA</GradientText>
              <Text style={[styles.titleSub, { color: theme.gold2 }]}>ASTROLOGY</Text>
            </View>
          </View>

          {/* user line */}
          <View style={styles.userRow}>
            <Text style={[styles.namaste, { color: theme.textSoft }]}>
              {tr('drawer.namaste', 'Namaste')}, <Text style={{ color: theme.gold1, fontFamily: fonts.interSemi }}>{firstName}</Text>
            </Text>
            {isPremium && (
              <View style={[styles.badge, { borderColor: isDark ? 'rgba(201,150,46,0.5)' : theme.cardBorder }]}>
                <Text style={[styles.badgeText, { color: theme.gold1 }]}>PREMIUM</Text>
              </View>
            )}
          </View>

          {/* fading gold rule under the head (SectionTitle-style) */}
          <LinearGradient
            colors={['transparent', isDark ? 'rgba(233,184,80,0.55)' : theme.gold2, 'transparent']}
            start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
            style={styles.headRule}
            pointerEvents="none"
          />
        </View>
      </Cascade>

      {/* ── Language ── (nayi bhasha = DRAWER_LANGS me ek entry) */}
      <Cascade index={1} progress={progress}>
        <View style={[styles.section, { borderBottomColor: line, backgroundColor: sectionBg }]}>
          <View style={styles.sectionLabelRow}>
            <GlobeIcon c={theme.gold2} />
            <Text style={[styles.sectionLabel, { color: theme.gold2 }]}>LANGUAGE / भाषा</Text>
          </View>
          {/* ≤2 bhashayein: barabar-width buttons (jaise pehle). 3+ hote hi ye khud
              horizontal slide rail ban jaata hai — bas DRAWER_LANGS me entry jodo. */}
          {DRAWER_LANGS.length <= 2 ? (
            <View style={styles.btnRow}>
              {DRAWER_LANGS.map(([key, glyph, lbl]) => {
                const active = shownLang === key;
                return (
                  <SelChip
                    key={key} ck={key}
                    bg={active ? chipActiveBg : btnBg}
                    border={active ? theme.gold2 : btnBorder}
                    fg={active ? theme.gold1 : theme.textSoft}
                    label={lbl} glyph={glyph}
                    onSelect={chooseLang}
                  />
                );
              })}
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.langRail}>
              {DRAWER_LANGS.map(([key, glyph, lbl]) => {
                const active = shownLang === key;
                return (
                  <SelChip
                    key={key} ck={key} rail
                    bg={active ? chipActiveBg : btnBg}
                    border={active ? theme.gold2 : btnBorder}
                    fg={active ? theme.gold1 : theme.textSoft}
                    label={lbl} glyph={glyph}
                    onSelect={chooseLang}
                  />
                );
              })}
            </ScrollView>
          )}
        </View>
      </Cascade>

      {/* ── Theme ── */}
      <Cascade index={2} progress={progress}>
        <View style={[styles.section, { borderBottomColor: line, backgroundColor: sectionBg }]}>
          <View style={styles.sectionLabelRow}>
            <SunSm c={theme.gold2} />
            <Text style={[styles.sectionLabel, { color: theme.gold2 }]}>THEME / थीम</Text>
          </View>
          <View style={styles.btnRow}>
            {(['light', 'dark'] as const).map((t) => {
              const active = shownTheme === t;
              return (
                <SelChip
                  key={t} ck={t}
                  bg={active ? chipActiveBg : btnBg}
                  border={active ? theme.gold2 : btnBorder}
                  fg={active ? theme.gold1 : theme.textSoft}
                  fgIcon={active ? theme.gold1 : theme.goldDim}
                  icon={t === 'light' ? 'sun' : 'moon'}
                  label={t === 'light' ? (hi ? 'लाइट' : 'Light') : (hi ? 'डार्क' : 'Dark')}
                  onSelect={chooseTheme}
                />
              );
            })}
          </View>
        </View>
      </Cascade>

      {/* ── SCROLLABLE: nav list only (like web .sy-drawer__list) ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingVertical: 8 }}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
      >
        {NAV.map((item, i) => {
          if ('divider' in item) {
            return (
              <Cascade key={`d${i}`} index={3 + i} progress={progress}>
                <LinearGradient
                  colors={['transparent', isDark ? 'rgba(201,150,46,0.5)' : theme.line, 'transparent']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.divider}
                />
              </Cascade>
            );
          }
          const active = !item.stack && item.tab === activeTab;
          const label = hi ? tr(NAV_KEY[item.route] || '', item.label) : item.label;
          return (
            <Cascade key={item.label} index={3 + i} progress={progress}>
              <NavRow
                item={item}
                label={label}
                active={active}
                edge={theme.gold1}
                activeBg={rowActiveBg}
                pressBg={rowPressBg}
                iconC={item.logout ? logoutC : active ? theme.gold1 : theme.gold2}
                textC={item.logout ? logoutC : active ? theme.gold1 : theme.text}
                medBg={active ? medBgActive : medBg}
                medBorder={item.logout ? logoutBorder : active ? medBorderActive : medBorder}
                onGo={onGo}
              />
            </Cascade>
          );
        })}
      </ScrollView>

      {/* ── FIXED: Footer ── */}
      <Text style={[styles.foot, { color: isDark ? 'rgba(216,203,168,0.82)' : theme.textMuted, paddingBottom: insets.bottom + 14 }]}>
        SHREE YANTRA · ASTROLOGY v1.0
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { flex: 1, borderRightWidth: 1, overflow: 'hidden' },

  /* head */
  head: { paddingHorizontal: 20, paddingBottom: 18, overflow: 'hidden' },
  headGlow: { position: 'absolute', top: 0, left: 0 },
  headRule: { position: 'absolute', bottom: 0, left: 14, right: 14, height: 1 },
  close: {
    position: 'absolute', right: 12, width: 40, height: 40, borderRadius: 20,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center', zIndex: 5,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoRing: {
    width: 50, height: 50, borderRadius: 25, padding: 2,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#e9b850', shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  logoWrap: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  title: { fontFamily: fonts.cinzel, fontSize: 16, letterSpacing: 2.56, fontWeight: '700' },
  titleSub: { fontSize: 11, letterSpacing: 3.3, marginTop: 2, fontFamily: fonts.inter },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  namaste: { fontFamily: fonts.inter, fontSize: 13 },
  badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, letterSpacing: 1.5, fontFamily: fonts.interSemi },

  /* language / theme sections */
  section: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16, borderBottomWidth: 1 },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionLabel: { fontSize: 10.5, letterSpacing: 2.3, fontFamily: fonts.interSemi },
  btnRow: { flexDirection: 'row', gap: 8 },
  // language chips ride a horizontal rail — chip apni width rakhta hai, stretch nahi hota
  langRail: { gap: 8, paddingRight: 4 },
  langChip: { flex: 0, minWidth: 118 },
  selPress: { flex: 1 },
  selBtn: {
    minHeight: 42, borderRadius: 10, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  selGlyph: { fontFamily: fonts.interBold, fontSize: 14, lineHeight: 17 },
  selText: { fontFamily: fonts.interSemi, fontSize: 13 },

  /* nav list */
  navItem: { paddingVertical: 7, paddingHorizontal: 16, borderLeftWidth: 3 },
  navInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  medallion: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  navText: { fontFamily: fonts.interMed, fontSize: 15 },
  divider: { height: 1, marginVertical: 8, marginHorizontal: 20 },

  /* footer */
  foot: { textAlign: 'center', paddingTop: 14, fontFamily: fonts.inter, fontSize: 11, letterSpacing: 1.3 },
});
