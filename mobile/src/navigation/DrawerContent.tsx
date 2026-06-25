import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Animated } from 'react-native';
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
import { useLang } from '../i18n/LanguageProvider';

const NAV_KEY: Record<string, string> = {
  Home: 'nav.home', DailyPrediction: 'nav.dailyPrediction', Choghadiya: 'nav.choghadiya',
  Predictions: 'nav.predictions', Panchang: 'nav.panchang', JanamPatri: 'nav.janamPatri', BrihatKundli: 'nav.brihatKundli', BabyNames: 'nav.babyNames',
  AiAstrologer: 'nav.aiAstrologer', Library: 'nav.library', Kundli: 'nav.kundli', Profile: 'nav.profile',
  Notifications: 'nav.notifications', ManageSubscription: 'nav.subscription',
  Help: 'nav.help', SignIn: 'common.logout',
};
import { useDialog } from '../components/DialogProvider';
import { navTo, currentRouteName } from './navigationRef';

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
const NAV: Array<
  | { divider: true }
  | { label: string; icon: keyof typeof I; route: string; tab?: string; stack?: boolean; logout?: boolean }
> = [
  { label: 'Home', icon: 'home', route: 'Home', tab: 'Home' },
  { label: 'My Rashifal', icon: 'star', route: 'DailyPrediction', stack: true },
  { label: 'Rashifal · 12 Signs', icon: 'spark', route: 'Predictions', stack: true },
  { label: 'Vedic Astrologer', icon: 'spark', route: 'AiAstrologer', stack: true },
  { label: 'Janam Patri + Naamkaran', icon: 'chart', route: 'JanamPatri', stack: true },
  { label: 'Brihat Kundli Report', icon: 'book', route: 'BrihatKundli', stack: true },
  { label: 'Baby Names', icon: 'spark', route: 'BabyNames', stack: true },
  { label: 'Panchang', icon: 'star', route: 'Panchang', stack: true },
  { label: 'Choghadiya', icon: 'clock', route: 'Choghadiya', tab: 'Choghadiya' },
  { label: 'Divine Library', icon: 'book', route: 'Library', tab: 'Library' },
  { label: 'Kundli / Birth Chart', icon: 'chart', route: 'Kundli', tab: 'Kundli' },
  { divider: true },
  { label: 'My Profile', icon: 'user', route: 'Profile', tab: 'Profile' },
  { label: 'Notifications', icon: 'bell', route: 'Notifications', stack: true },
  { label: 'Manage Subscription', icon: 'crown', route: 'ManageSubscription', stack: true },
  { label: 'Help & Support', icon: 'help', route: 'Help', stack: true },
  { label: 'Logout', icon: 'logout', route: 'SignIn', stack: true, logout: true },
];

/** Side drawer — exact port of the web `.sy-drawer`:
    deep indigo gradient panel, gold-glow head with Om medallion + close button,
    Namaste + PREMIUM badge, Language & Theme selector rows, icon nav list with
    gold left-edge active state, gradient dividers, footer version line. */
export function DrawerContent({ close, progress }: { close: () => void; progress?: Animated.Value }) {
  const { theme, name, setTheme } = useTheme();
  const dialog = useDialog();
  const insets = useSafeAreaInsets();
  const isDark = theme.isDark;
  const { lang, setLang, t: tr } = useLang();

  // logged-in user (drawer har open par remount hota hai → mount par fresh load)
  const [firstName, setFirstName] = useState('Guest');
  const [isPremium, setIsPremium] = useState(false);
  useEffect(() => {
    getStoredUser().then((u) => {
      if (u?.name) setFirstName(u.name.trim().split(/\s+/)[0]);
      setIsPremium(u?.plan === 'premium');
    });
  }, []);

  /* which route is focused (for active highlight) — read once at mount */
  const activeTab = currentRouteName() ?? 'Home';

  /* staggered reveal for each nav row — items cascade in as the drawer opens */
  const itemAnim = (i: number) => {
    if (!progress) return undefined;
    const start = 0.12 + i * 0.045;
    return {
      opacity: progress.interpolate({ inputRange: [0, start, start + 0.32], outputRange: [0, 0, 1], extrapolate: 'clamp' }),
      transform: [{ translateX: progress.interpolate({ inputRange: [0, start + 0.32], outputRange: [-26, 0], extrapolate: 'clamp' }) }],
    };
  };

  const go = (item: { route: string; tab?: string; stack?: boolean; logout?: boolean }) => {
    hTap();
    // Logout → ask for confirmation first (keep drawer open behind the dialog)
    if (item.logout) {
      dialog(
        'Log out?',
        'You will need to sign in again to access your profile.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Log Out',
            style: 'destructive',
            onPress: () => {
              clearAuth();
              close();
              requestAnimationFrame(() => navTo(item.route));
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

  /* palette */
  const line = isDark ? 'rgba(201,150,46,0.25)' : 'rgba(176,115,22,0.18)';
  const sectionBg = isDark ? 'rgba(238,203,122,0.05)' : 'rgba(151,93,12,0.11)';
  const btnBg = isDark ? 'rgba(0,0,0,0.5)' : '#fffdf7';
  const btnBorder = isDark ? 'rgba(201,150,46,0.3)' : 'rgba(176,115,22,0.3)';

  return (
    <View
      style={[
        styles.panel,
        {
          backgroundColor: isDark ? '#000000' : '#fffdf6',
          borderRightColor: isDark ? 'rgba(201,150,46,0.35)' : theme.cardBorder,
        },
      ]}
    >
      {/* ── FIXED: Head (gold radial glow + brand + user) ── */}
      <View style={[styles.head, { paddingTop: insets.top + 22, borderBottomColor: line }]}>
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
                  ? (isDark ? 'rgba(233,184,80,0.22)' : 'rgba(176,115,22,0.18)')
                  : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(176,115,22,0.06)'),
                borderColor: pressed
                  ? (isDark ? 'rgba(233,184,80,0.7)' : 'rgba(176,115,22,0.6)')
                  : btnBorder,
              },
            ]}
          >
            <CloseIcon c={theme.gold1} />
          </Pressable>

          {/* brand row: gold Om medallion + title */}
          <View style={styles.brandRow}>
            <View style={styles.logoWrap}>
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
            <View style={[styles.badge, { borderColor: isDark ? 'rgba(201,150,46,0.5)' : 'rgba(176,115,22,0.5)' }]}>
              <Text style={[styles.badgeText, { color: theme.gold1 }]}>{isPremium ? 'PREMIUM' : 'FREE'}</Text>
            </View>
          </View>
        </View>

        {/* ── Language ── */}
        <View style={[styles.section, { borderBottomColor: line, backgroundColor: sectionBg }]}>
          <View style={styles.sectionLabelRow}>
            <GlobeIcon c={theme.gold2} />
            <Text style={[styles.sectionLabel, { color: theme.gold2 }]}>LANGUAGE / भाषा</Text>
          </View>
          <View style={styles.btnRow}>
            {([['en', 'EN', 'English'], ['hi', 'हि', 'हिंदी']] as const).map(([key, glyph, lbl]) => {
              const active = lang === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => { hSelect(); setLang(key); }}
                  style={({ pressed }) => [
                    styles.selBtn,
                    {
                      backgroundColor: active ? (isDark ? 'rgba(238,203,122,0.20)' : '#ffe9b8') : btnBg,
                      borderColor: active ? theme.gold2 : btnBorder,
                    },
                    pressed && { transform: [{ scale: 0.97 }] },
                  ]}
                >
                  <Text style={[styles.selGlyph, { color: active ? theme.gold1 : theme.textSoft }]}>{glyph}</Text>
                  <Text style={[styles.selText, { color: active ? theme.gold1 : theme.textSoft }]}>{lbl}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Theme ── */}
        <View style={[styles.section, { borderBottomColor: line, backgroundColor: sectionBg }]}>
          <View style={styles.sectionLabelRow}>
            <SunSm c={theme.gold2} />
            <Text style={[styles.sectionLabel, { color: theme.gold2 }]}>THEME</Text>
          </View>
          <View style={styles.btnRow}>
            {(['light', 'dark'] as const).map((t) => {
              const active = name === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => { hSelect(); setTheme(t); }}
                  style={({ pressed }) => [
                    styles.selBtn,
                    {
                      backgroundColor: active ? (isDark ? 'rgba(238,203,122,0.20)' : '#ffe9b8') : btnBg,
                      borderColor: active ? theme.gold2 : btnBorder,
                    },
                    pressed && { transform: [{ scale: 0.97 }] },
                  ]}
                >
                  {t === 'light'
                    ? <SunIcon c={active ? theme.gold1 : theme.goldDim} />
                    : <MoonIcon c={active ? theme.gold1 : theme.goldDim} />}
                  <Text style={[styles.selText, { color: active ? theme.gold1 : theme.textSoft }]}>
                    {t === 'light' ? 'Light' : 'Dark'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

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
                <Animated.View key={`d${i}`} style={itemAnim(i)}>
                  <LinearGradient
                    colors={['transparent', isDark ? 'rgba(201,150,46,0.5)' : 'rgba(176,115,22,0.4)', 'transparent']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.divider}
                  />
                </Animated.View>
              );
            }
            const Icon = I[item.icon];
            const active = !item.stack && item.tab === activeTab;
            return (
              <Animated.View key={item.label} style={itemAnim(i)}>
                <Pressable
                  onPress={() => go(item)}
                  style={({ pressed }) => [
                    styles.navItem,
                    {
                      borderLeftColor: active ? theme.gold1 : 'transparent',
                      backgroundColor: active
                        ? (isDark ? 'rgba(233,184,80,0.12)' : 'rgba(151,93,12,0.20)')
                        : pressed
                          ? (isDark ? 'rgba(233,184,80,0.08)' : 'rgba(176,115,22,0.08)')
                          : 'transparent',
                    },
                  ]}
                >
                  <Icon c={active ? theme.gold1 : theme.gold2} />
                  <Text style={[styles.navText, { color: active ? theme.gold1 : theme.text }]}>{lang === 'hi' ? tr(NAV_KEY[item.route] || '', item.label) : item.label}</Text>
                </Pressable>
              </Animated.View>
            );
          })}
        </ScrollView>

      {/* ── FIXED: Footer ── */}
      <Text style={[styles.foot, { color: isDark ? 'rgba(216,203,168,0.82)' : '#8a6f3a', paddingBottom: insets.bottom + 14 }]}>
        SHREE YANTRA · ASTROLOGY v1.0
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { flex: 1, borderRightWidth: 1, overflow: 'hidden' },

  /* head */
  head: { paddingHorizontal: 20, paddingBottom: 18, borderBottomWidth: 1, overflow: 'hidden' },
  headGlow: { position: 'absolute', top: 0, left: 0 },
  close: {
    position: 'absolute', right: 12, width: 40, height: 40, borderRadius: 20,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center', zIndex: 5,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoWrap: {
    width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#e9b850', shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 0 },
    elevation: 8,
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
  selBtn: {
    flex: 1, minHeight: 42, borderRadius: 10, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  selGlyph: { fontFamily: fonts.interBold, fontSize: 14, lineHeight: 17 },
  selText: { fontFamily: fonts.interSemi, fontSize: 13 },

  /* nav list */
  navItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, paddingHorizontal: 20,
    borderLeftWidth: 3,
  },
  navText: { fontFamily: fonts.interMed, fontSize: 15 },
  divider: { height: 1, marginVertical: 8, marginHorizontal: 20 },

  /* footer */
  foot: { textAlign: 'center', paddingTop: 14, fontFamily: fonts.inter, fontSize: 11, letterSpacing: 1.3 },
});
