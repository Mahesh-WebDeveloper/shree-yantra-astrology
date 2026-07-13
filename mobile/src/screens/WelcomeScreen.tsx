import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing, Image, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, Line, Polyline, Defs, RadialGradient, Stop, LinearGradient as SvgGrad, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { Theme, fonts, radii } from '../theme/tokens';
import { Screen } from '../components/Screen';
import { BrandHeader } from '../components/BrandHeader';
import { GradientText } from '../components/GradientText';
import { Card } from '../components/Card';
import { hTap } from '../lib/haptics';
import { useCurrentUser } from '../lib/auth';
import { getDailyPrediction, getPanchang, DailyPrediction, PanchangResponse, avatarUrl } from '../lib/api';
import { birthFromProfile } from '../lib/birth';
import { useAppConfig, useScreen, useBranding } from '../context/AppConfigProvider';
import { useT, useLang } from '../i18n/LanguageProvider';

const MON_HI = ['जन', 'फ़र', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुल', 'अग', 'सित', 'अक्तू', 'नव', 'दिस'];
import { openAppDrawer } from '../navigation/AppDrawerHost';

const WELCOME_DEFAULT_BIRTH = { dob: '01-01-2000', tob: '06:42', tz: '+05:30', place: 'Jaipur' };
const MON3 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
import {
  ShreeYantraLogo, ZodiacWheel, SunArt, KundliArt, StarOrb, Ornament,
} from '../components/icons/WelcomeArt';
import { ServiceIcon, ServiceIconName } from '../components/icons/ServiceIcons';
import { ZodiacIcon } from '../components/icons/ZodiacIcon';
import { rashiImage } from '../components/icons/rashiImages';
import { naamRashi } from '../lib/naamRashi';

/* ── web background decorations: planets, gold glow, twinkle stars ──
   All are static SVG art — memoized so screen re-renders skip them. */
const Planet = React.memo(function Planet({ size, colors, style, opacity }: { size: number; colors: [string, string, string]; style: any; opacity: number }) {
  return (
    <Svg width={size} height={size} style={[{ position: 'absolute' }, style, { opacity }]} pointerEvents="none">
      <Defs>
        <RadialGradient id="pl" cx="30%" cy="30%" r="75%">
          <Stop offset="0%" stopColor={colors[0]} />
          <Stop offset="45%" stopColor={colors[1]} />
          <Stop offset="100%" stopColor={colors[2]} />
        </RadialGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#pl)" />
    </Svg>
  );
});

const GoldGlow = React.memo(function GoldGlow({ size, style, opacity = 0.16, dark = true }: { size: number; style: any; opacity?: number; dark?: boolean }) {
  return (
    <Svg width={size} height={size} style={[{ position: 'absolute' }, style, { opacity }]} pointerEvents="none">
      <Defs>
        <RadialGradient id="gg" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={dark ? '#e9b850' : '#111827'} stopOpacity={dark ? 0.6 : 0.18} />
          <Stop offset="65%" stopColor={dark ? '#e9b850' : '#111827'} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#gg)" />
    </Svg>
  );
});

/* fixed star positions from the web script.js */
const STARS = [
  { top: '8%', left: '32%' }, { top: '12%', left: '62%' }, { top: '18%', left: '82%' },
  { top: '26%', left: '48%' }, { top: '44%', left: '92%' }, { top: '52%', left: '6%' },
  { top: '62%', left: '70%' }, { top: '72%', left: '22%' },
] as const;

const ZODIAC = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];

/** Exact port of the web `.bg-zodiac-left` — 3 rings + 12 spokes + 12 glyphs
    (gradient #e9b850→#6b4d10) spinning continuously (140s linear, like the web). */
const BgZodiac = React.memo(function BgZodiac({ size, dark = true }: { size: number; dark?: boolean }) {
  const spin = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 22000, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const spokes = ZODIAC.map((_, i) => {
    const a = (i * Math.PI) / 6;
    return (
      <Line
        key={`s${i}`}
        x1={100 + Math.cos(a) * 54} y1={100 + Math.sin(a) * 54}
        x2={100 + Math.cos(a) * 96} y2={100 + Math.sin(a) * 96}
        stroke="url(#bgz)" strokeWidth={dark ? 1.1 : 1.8}
      />
    );
  });
  const glyphs = ZODIAC.map((g, i) => {
    const a = (i * Math.PI) / 6 + Math.PI / 12;
    return (
      <SvgText
        key={`g${i}`}
        x={100 + Math.cos(a) * 86} y={100 + Math.sin(a) * 86}
        textAnchor="middle" alignmentBaseline="central"
        fontSize={11} fontWeight="bold" fill={dark ? '#f3c75e' : '#111827'}
      >
        {g}
      </SvgText>
    );
  });

  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Svg width={size} height={size} viewBox="0 0 200 200">
        <Defs>
          <SvgGrad id="bgz" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={dark ? '#e9b850' : '#111827'} />
            <Stop offset="100%" stopColor={dark ? '#6b4d10' : '#7c2d12'} />
          </SvgGrad>
        </Defs>
        <Circle cx={100} cy={100} r={96} fill="none" stroke="url(#bgz)" strokeWidth={dark ? 1.4 : 2.2} />
        <Circle cx={100} cy={100} r={74} fill="none" stroke="url(#bgz)" strokeWidth={dark ? 1.2 : 1.8} />
        <Circle cx={100} cy={100} r={54} fill="none" stroke="url(#bgz)" strokeWidth={dark ? 1.2 : 1.8} />
        {spokes}
        {glyphs}
      </Svg>
    </Animated.View>
  );
});

// Janam Patri + Naamkaran service poster (user-supplied) — shown as that card's icon.
const PATRI_IMG = require('../../assets/janampatri-namkaran.png');
function PatriArt({ size = 60 }: { size?: number }) {
  return (
    <Image
      source={PATRI_IMG}
      style={{ width: size, height: size, borderRadius: 10 }}
      resizeMode="contain"
    />
  );
}

// Jyothishi ji (Vedic Astrologer) service poster (user-supplied) — that card's icon.
const JYOTHISHI_IMG = require('../../assets/jyothishi.png');
function JyothishiArt({ size = 60 }: { size?: number }) {
  return (
    <Image
      source={JYOTHISHI_IMG}
      style={{ width: size, height: size, borderRadius: 10 }}
      resizeMode="contain"
    />
  );
}

// Kundli / Birth Chart card icon (user-supplied scroll + quill image).
const KUNDLI_IMG = require('../../assets/kundli-card.png');
function KundliPng({ size = 60 }: { size?: number }) {
  return (
    <Image
      source={KUNDLI_IMG}
      style={{ width: size, height: size, borderRadius: 10 }}
      resizeMode="contain"
    />
  );
}

// HERO — 3-4 big vertical cards (existing design, untouched). The most-used services.
const FEATURES = [
  { key: 'pred', title: 'My Rashifal', desc: 'YOUR personal horoscope — daily, weekly, monthly & yearly from your birth chart', tint: ['#3d2378', '#241452', '#1a0f3c'] as const, Art: SunArt, route: 'DailyPrediction' },
  { key: 'kundli', title: 'Kundli / Birth Chart', desc: 'View your detailed birth chart and planetary positions', tint: ['#1f3d82', '#142a5c', '#0e1c44'] as const, Art: KundliPng, route: 'Kundli' },
  { key: 'ai', title: 'Ask the Astrologer', desc: 'Ask personal questions using your chart and precise planetary data', tint: ['#4b2d73', '#2c194c', '#160c2b'] as const, Art: JyothishiArt, route: 'AiAstrologer' },
  { key: 'patri', title: 'Naamkaran — Baby Names', desc: 'Naming ceremony help: lucky baby names by nakshatra + full kundli & Vedic PDF', tint: ['#6a1f3a', '#431229', '#250a17'] as const, Art: PatriArt, route: 'JanamPatri' },
];

// ALL SERVICES — horizontal slider. Each card uses the SAME solid gradient
// language as the hero cards (opaque tint + gold ring) so text stays readable.
type SvcTint = readonly [string, string, string];
const SERVICES: { key: string; en: string; hi: string; subEn: string; subHi: string; icon: ServiceIconName; accent: string; route: string; tint: SvcTint; lightTint: SvcTint }[] = [
  { key: 'horoscope', en: 'Rashifal · 12 Signs', hi: '12 राशियाँ', subEn: "Today's horoscope for every zodiac sign", subHi: 'हर राशि का आज का राशिफल', icon: 'zodiac', accent: '#e3b6f7', route: 'Predictions', tint: ['#6d3b8f', '#3a1f5e', '#1d0f38'], lightTint: ['#efdcff', '#f6ecff', '#fdf8ff'] },
  { key: 'milan', en: 'Kundli Milan', hi: 'कुंडली मिलान', subEn: 'Match two kundlis for marriage (36 guna)', subHi: 'विवाह हेतु दो कुंडली मिलान (36 गुण)', icon: 'milan', accent: '#f5a3ba', route: 'KundliMatch', tint: ['#9c2f54', '#5e1c38', '#2c0e1f'], lightTint: ['#fbe1ec', '#fdeef4', '#fff8fb'] },
  { key: 'panchang', en: 'Panchang', hi: 'पंचांग', subEn: 'Tithi, nakshatra & shubh muhurat', subHi: 'तिथि, नक्षत्र व शुभ मुहूर्त', icon: 'calendar', accent: '#f3cd7e', route: 'Panchang', tint: ['#9a6418', '#5c3a10', '#2e1d08'], lightTint: ['#fbeccf', '#fef5e2', '#fffbf2'] },
  { key: 'chog', en: 'Choghadiya', hi: 'चौघड़िया', subEn: 'Find the good time for any work', subHi: 'किसी भी काम का शुभ समय', icon: 'clock', accent: '#84e8b4', route: 'Choghadiya', tint: ['#1e7a54', '#11543a', '#0a2c20'], lightTint: ['#daf2e4', '#ebfaf1', '#f5fdf9'] },
  { key: 'muhurat', en: 'Shubh Muhurat', hi: 'शुभ मुहूर्त', subEn: 'Best day & time for griha pravesh, vivah…', subHi: 'गृह प्रवेश, विवाह आदि का शुभ दिन व समय', icon: 'calendar', accent: '#f3cd7e', route: 'Muhurat', tint: ['#9a6418', '#5c3a10', '#2e1d08'], lightTint: ['#fbeccf', '#fef5e2', '#fffbf2'] },
  { key: 'baby', en: 'Child Name Finder', hi: 'शिशु के शुभ नाम', subEn: 'Lucky names with meaning for your child', subHi: 'अर्थ सहित बच्चे के सुंदर व शुभ नाम', icon: 'name', accent: '#8ce0e0', route: 'BabyNames', tint: ['#1f7373', '#114a4a', '#0a2626'], lightTint: ['#d8f0f0', '#e8f9f9', '#f4fdfd'] },
  { key: 'numerology', en: 'Numerology', hi: 'अंकशास्त्र', subEn: 'Mulank, Bhagyank, Lo Shu grid & lucky numbers', subHi: 'मूलांक, भाग्यांक, लो-शु ग्रिड व शुभ अंक', icon: 'name', accent: '#cbb1f2', route: 'Numerology', tint: ['#4a2f7a', '#2f1d54', '#160d2c'], lightTint: ['#ebe1fb', '#f4eefe', '#faf7ff'] },
  { key: 'vastu', en: 'Vastu Shastra', hi: 'वास्तु शास्त्र', subEn: 'Home audit, corrections and Vastu map', subHi: 'घर का ऑडिट, सुधार और वास्तु नक्शा', icon: 'vastu', accent: '#f0c65e', route: 'Vastu', tint: ['#7a4b14', '#4d2d0d', '#241406'], lightTint: ['#f6ecd8', '#fff4dc', '#fffaf0'] },
];

const SERVICE_LIGHT_ACCENT: Record<string, string> = {
  horoscope: '#6b3192',
  milan: '#9b244b',
  panchang: '#70420a',
  chog: '#146b43',
  muhurat: '#70420a',
  baby: '#176c70',
  numerology: '#5b2f92',
  vastu: '#70420a',
};

const LIGHT_TINT: Record<string, readonly [string, string, string]> = {
  pred: ['#efe6fb', '#f4eeff', '#fbf7ff'],
  horoscope: ['#f2e5fb', '#f8efff', '#fff8ff'],
  ai: ['#efe6fb', '#f7efff', '#fff9ff'],
  kundli: ['#e3eefb', '#eef5ff', '#f7fbff'],
  chog: ['#e3f3e9', '#eefaf2', '#f6fdf9'],
  panchang: ['#f6ecd8', '#fbf4e3', '#fffaf0'],
  patri: ['#f7e6ee', '#fbeef4', '#fff7fb'],
  babynames: ['#dff0ef', '#ecf8f7', '#f6fdfc'],
  vastu: ['#f6ecd8', '#fff4dc', '#fffaf0'],
};

const Chevron = ({ c, size = 16 }: { c: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Polyline points="9 18 15 12 9 6" /></Svg>
);

function GoldBorderCard({ children, style, solidBlack }: { children: React.ReactNode; style?: any; solidBlack?: boolean }) {
  return <Card padded={false} radius={22} solidBlack={solidBlack} style={style}>{children}</Card>;
}

const SVC_SNAP = 156 + 13; // card width + row gap → clean snap on swipe

/** A single service card with a staggered fade-rise entrance. */
function ServiceCard({ s, index, theme, lang, onPress }: { s: typeof SERVICES[number]; index: number; theme: Theme; lang: 'en' | 'hi'; onPress: () => void }) {
  const a = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const anim = Animated.timing(a, { toValue: 1, duration: 430, delay: 70 + index * 72, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, [a, index]);
  const hi = lang === 'hi';
  const ringColors = theme.isDark
    ? (['#fce8a8', '#e9b850', '#a17613', '#f6d27a'] as const)
    : (['#e2e8f0', '#cbd5e1', '#d97706', '#f59e0b'] as const);
  const innerTint = theme.isDark ? s.tint : s.lightTint;
  const accent = theme.isDark ? s.accent : (SERVICE_LIGHT_ACCENT[s.key] || theme.gold1);
  return (
    <Animated.View style={{ opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [22, 0] }) }] }}>
      <Pressable onPress={onPress} style={({ pressed }) => [pressed && { transform: [{ scale: 0.95 }] }]}>
        <LinearGradient colors={ringColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.svcBorder}>
          <LinearGradient colors={innerTint} start={{ x: 0.1, y: 0 }} end={{ x: 0.6, y: 1 }} style={styles.svcInner}>
            <View style={styles.svcTopLine} />
            <View style={[styles.svcIconRing, { borderColor: accent + '99', backgroundColor: theme.isDark ? 'rgba(0,0,0,0.32)' : accent + '14', shadowColor: accent }]}>
              <ServiceIcon name={s.icon} color={accent} size={26} />
            </View>
            <Text style={[styles.svcTitle, { color: theme.gold1 }]} numberOfLines={2}>{hi ? s.hi : s.en}</Text>
            <Text style={[styles.svcDesc, { color: theme.isDark ? 'rgba(239,224,168,0.78)' : theme.textMuted }]} numberOfLines={3}>{hi ? s.subHi : s.subEn}</Text>
          </LinearGradient>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export function WelcomeScreen({ navigation }: any) {
  const { theme } = useTheme();
  const openMenu = () => openAppDrawer();
  const user = useCurrentUser();
  const firstName = (user?.name || 'Guest').trim().split(/\s+/)[0];
  const { config } = useAppConfig();
  // Admin-controlled hero zodiac wheel: show/hide + vertical position (App Config → Welcome screen)
  const wheelFlags = (config.featureFlags || {}) as Record<string, any>;
  const showWheel = wheelFlags.showZodiacWheel !== false; // default ON
  const wheelOffsetY = Math.max(-120, Math.min(120, Number(wheelFlags.zodiacWheelOffsetY) || 0));
  const home = useScreen('home');        // admin-managed home content (override)
  const brand = useBranding();           // logo / app name / tagline
  const t = useT();
  const { lang } = useLang();
  // CMS field naam (admin override); fallback i18n translation (language ke hisaab se)
  const featTitle: Record<string, string> = { pred: 'featurePredTitle', horoscope: 'featureHoroscopeTitle', ai: 'featureAiTitle', kundli: 'featureKundliTitle', chog: 'featureChogTitle' };
  const featDesc: Record<string, string> = { pred: 'featurePredDesc', horoscope: 'featureHoroscopeDesc', ai: 'featureAiDesc', kundli: 'featureKundliDesc', chog: 'featureChogDesc' };
  const activeHomeBanner = [...(config.homeBanners || [])]
    .filter((banner) => banner.isActive !== false && banner.imageUrl)
    .sort((a, b) => (a.order || 0) - (b.order || 0))[0];
  const bannerImage = home.img('bannerImage') || activeHomeBanner?.imageUrl || '';

  // AI daily prediction — Daily Prediction page jaisa hi (same cache, consistent)
  const [pred, setPred] = useState<DailyPrediction | null>(null);
  const [panch, setPanch] = useState<PanchangResponse | null>(null);
  useEffect(() => {
    let on = true;
    (async () => {
      const b = await birthFromProfile().catch(() => null);
      const birth = b || WELCOME_DEFAULT_BIRTH;
      try {
        const p = await getDailyPrediction({ ...birth, name: (b as any)?.name });
        if (on) setPred(p);
      } catch (_) { /* offline → static dikhega */ }
      // today's panchang (local ephemeris → fast + reliable) for the home glance card
      try {
        const pc = await getPanchang({ place: (b as any)?.place || birth.place || 'Jaipur', tz: '+05:30' });
        if (on) setPanch(pc);
      } catch (_) { /* card stays compact */ }
    })();
    return () => { on = false; };
    // refetch when language switches so the AI rashifal text re-renders in the new language
  }, [lang]);
  const d = new Date();
  const todayLabel = `${t('home.today', 'Today')}, ${d.getDate()} ${(lang === 'hi' ? MON_HI : MON3)[d.getMonth()]} ${d.getFullYear()}`;
  // "till 3:30 PM" / "3:30 PM तक" — when this tithi/anga ends (nextDay marked)
  const angaEnd = (e?: { hm: string; nextDay: boolean }) =>
    !e ? '' : (lang === 'hi'
      ? `${e.hm}${e.nextDay ? ' (अगले दिन)' : ''} तक`
      : `till ${e.hm}${e.nextDay ? ' (next day)' : ''}`);
  // hasPred = real AI rashifal loaded. _fallback / null → show honest state, NOT fabricated lucky numbers.
  const hasPred = !!(pred && !pred._fallback);
  // user's moon-sign (rashi) → dynamic rashi PNG icon used across the home cards
  // Rashi shown to the user = naam-rashi (from the name's first syllable, the Dainik-Bhaskar
  // "rashi by name" method) when a name is known; else the birth-chart moon sign.
  const rashiSign = naamRashi(user?.name) || (pred as any)?.basis?.moonSign || (panch as any)?.moon?.sign || null;
  const rashiImg = rashiImage(rashiSign);
  const rashiLabel = rashiSign ? String(rashiSign).toUpperCase() : '';
  // lucky chips only when we have a real prediction (no fake "7 / Gold")
  const bannerChips = hasPred
    ? [
        `${t('home.lucky', 'Lucky')}: ${pred!.luckyNumber}`,
        pred!.luckyColour,
        `${pred!.luckyTime || ''} ${t('home.goodTime', 'good time')}`.trim(),
      ].filter(Boolean)
    : [];

  return (
    <Screen header={<BrandHeader showEmblem={false} onMenu={openMenu} onBell={() => navigation.navigate('Notifications')} />}>

      {/* deep-black cosmic backdrop: twinkle stars only (planet blobs removed so the
          background stays pure black and the spinning zodiac wheel reads clearly) */}
      {theme.isDark && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {STARS.map((s, i) => (
            <View key={i} style={[styles.twinkle, { top: s.top as any, left: s.left as any }]} />
          ))}
        </View>
      )}

      {/* gold glow + spinning zodiac-wheel watermark behind the brand (web .bg-zodiac-left).
          Admin can hide it and shift it up/down via App Config → Welcome screen. */}
      {showWheel && (
        <View style={[styles.watermark, { transform: [{ translateY: wheelOffsetY }] }]} pointerEvents="none">
          <GoldGlow size={320} style={{ top: -10 }} dark={theme.isDark} opacity={theme.isDark ? 0.16 : 0.12} />
          <View style={{ opacity: theme.isDark ? 0.6 : 0.88 }}>
            <BgZodiac size={262} dark={theme.isDark} />
          </View>
        </View>
      )}

      {/* Logo block */}
      <View style={styles.logoBlock}>
        {brand.logoImage ? (
          <Image source={{ uri: avatarUrl(brand.logoImage) || undefined }} style={styles.logoImg} resizeMode="contain" />
        ) : (
          <ShreeYantraLogo size={72} dark={theme.isDark} />
        )}
        <GradientText style={styles.brandTitle}>{(brand.appName || 'Shree Yantra').toUpperCase()}</GradientText>
        <View style={styles.brandSubRow}>
          <Ornament />
          <GradientText style={styles.astrology}>{(brand.tagline || 'Astrology').toUpperCase()}</GradientText>
          <Ornament flip />
        </View>
      </View>

      {/* Welcome block */}
      <View style={[styles.welcomeBlock, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.025)' : '#ffffff', borderColor: theme.isDark ? 'rgba(201,150,46,0.12)' : theme.cardBorder }]}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.welcomeTitleRow}>
            <GradientText style={styles.welcomeTitle}>{home.t('greeting', t('home.greeting', 'Welcome'))}, {firstName} </GradientText>
            <Text style={{ fontSize: 20 }}>🙏</Text>
          </View>
          <Text style={[styles.welcomeSub, { color: theme.textSoft }]}>{home.t('subtitle', t('home.dailyHoroscope', 'Your Daily Horoscope'))}</Text>
        </View>
        <View style={styles.zodiacBadge}>
          <View style={[styles.wzIcon, { borderColor: theme.isDark ? 'rgba(233,184,80,0.38)' : theme.cardBorder, backgroundColor: theme.isDark ? '#000000' : '#ffffff' }]}>
            {rashiImg
              ? <Image source={rashiImg} style={{ width: 30, height: 30 }} resizeMode="contain" />
              : <Text style={{ fontSize: 26, color: theme.gold1, lineHeight: 30 }}>♌</Text>}
          </View>
          {!!rashiLabel && <Text style={[styles.wzLabel, { color: theme.gold2 }]}>{rashiLabel}</Text>}
        </View>
      </View>

      {/* Today's Panchang — daily glance card (tap → full Panchang) */}
      <Pressable
        onPress={() => { hTap(); navigation.navigate('Panchang'); }}
        style={({ pressed }) => [pressed && { transform: [{ scale: 0.99 }] }]}
      >
        <LinearGradient
          colors={theme.isDark ? ['rgba(122,82,20,0.34)', 'rgba(28,20,10,0.5)'] : ['#ffffff', '#f8fafc']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.panchCard, { borderColor: theme.isDark ? 'rgba(201,150,46,0.3)' : theme.cardBorder }]}
        >
          <View style={[styles.panchIcon, { borderColor: theme.isDark ? 'rgba(243,205,126,0.55)' : theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.4)' : '#f8fafc' }]}>
            <ServiceIcon name="calendar" color={theme.gold1} size={26} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.panchKicker, { color: theme.gold2 }]}>{lang === 'hi' ? 'आज का पंचांग' : "TODAY'S PANCHANG"} · {todayLabel.replace(/^.*?,\s*/, '')}</Text>
            <Text style={[styles.panchMain, { color: theme.isDark ? '#f3e7c8' : theme.text }]} numberOfLines={1}>
              {panch
                ? `${lang === 'hi' ? (panch.tithi.hi || panch.tithi.name) : panch.tithi.name} · ${lang === 'hi' ? (panch.nakshatra.hi || panch.nakshatra.name) : panch.nakshatra.name}`
                : (lang === 'hi' ? 'तिथि व नक्षत्र देखें' : 'View tithi & nakshatra')}
            </Text>
            <Text style={[styles.panchSub, { color: theme.isDark ? 'rgba(239,224,168,0.7)' : theme.textMuted }]} numberOfLines={1}>
              {panch ? (
                <>
                  <Text style={{ color: theme.gold1, fontFamily: fonts.interSemi }}>
                    {panch.tithi?.endsAt
                      ? `⏳ ${lang === 'hi' ? 'तिथि' : 'Tithi'} ${angaEnd(panch.tithi.endsAt)}`
                      : (lang === 'hi' ? 'तिथि व नक्षत्र' : 'Tithi & Nakshatra')}
                  </Text>
                  {panch.masa ? `   ·   ${lang === 'hi' ? panch.masa.amanta.hi : panch.masa.amanta.en}` : ''}
                </>
              ) : (lang === 'hi' ? 'शुभ मुहूर्त · राहु काल · व्रत-त्योहार' : 'Shubh muhurat · Rahu Kaal · vrat & festivals')}
            </Text>
          </View>
          <Chevron c={theme.gold1} size={18} />
        </LinearGradient>
      </Pressable>

      {/* admin-managed home banner (image set ho to dikhega) */}
      {bannerImage ? (
        <Image source={{ uri: avatarUrl(bannerImage) || undefined }} style={styles.banner} resizeMode="cover" />
      ) : null}

      {/* Horoscope card — fully black background */}
      <GoldBorderCard solidBlack style={{ marginTop: 14, overflow: 'hidden' }}>
        <View style={styles.horoInner}>
          <View style={styles.horoRow}>
            {rashiImg
              ? <ZodiacIcon sign={rashiSign} size={112} theme={theme} />
              : <ZodiacWheel size={120} dark={theme.isDark} />}
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={styles.dateRow}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={theme.gold2} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                  <Rect x={3} y={4} width={18} height={18} rx={2} /><Line x1={16} y1={2} x2={16} y2={6} /><Line x1={8} y1={2} x2={8} y2={6} /><Line x1={3} y1={10} x2={21} y2={10} />
                </Svg>
                <Text style={[styles.dateText, { color: theme.textSoft }]}>{todayLabel}</Text>
              </View>
              <Text style={[styles.horoDesc, { color: theme.isDark ? 'rgba(239,224,168,0.9)' : theme.text }]}>
                {hasPred
                  ? pred!.overall
                  : (lang === 'hi'
                    ? 'आज का राशिफल तैयार हो रहा है — पूरा व्यक्तिगत फलादेश पढ़ने के लिए नीचे टैप करें।'
                    : "Your rashifal is being prepared — tap below to read today's full personal reading.")}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.horoBtnRow}>
          <Pressable
            onPress={() => { hTap(); navigation.navigate('DailyPrediction'); }}
            android_ripple={{ color: theme.ripple }}
            style={({ pressed }) => [styles.horoBtn, { borderColor: theme.isDark ? 'rgba(246,210,122,0.5)' : theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.12)' : '#f8fafc' }, pressed && { transform: [{ scale: 0.98 }] }]}
          >
            <Text style={[styles.horoBtnText, { color: theme.gold1 }]}>{t('home.readFull', 'Read Full Prediction')}</Text>
            <Chevron c={theme.gold1} size={15} />
          </Pressable>
        </View>
      </GoldBorderCard>

      {/* Section title */}
      <View style={styles.sectionTitle}>
        <GradientText style={styles.sectionHeading}>{home.t('sectionTitle', t('home.exploreFeatures', 'Explore Premium Features'))}</GradientText>
        <LinearGradient colors={['transparent', theme.gold2, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.sectionRule} />
      </View>

      {/* Features — vertical stack of row cards (icon | title+desc | chevron), like the web */}
      <View style={styles.featuresGrid}>
        {FEATURES.map((f) => {
          const tint = theme.isDark ? f.tint : LIGHT_TINT[f.key];
          // Gold gradient border — brighter golds bracket all four corners so
          // the ring stays visible the whole way around (no dark dead-corner).
          const borderColors = theme.isDark
            ? (['#fce8a8', '#e9b850', '#a17613', '#f6d27a'] as const)
            : (['#e2e8f0', '#cbd5e1', '#d97706', '#f59e0b'] as const);
          return (
            <Pressable
              key={f.key}
              style={({ pressed }) => [pressed && { transform: [{ scale: 0.98 }] }]}
              onPress={() => { hTap(); navigation.navigate(f.route); }}
            >
              {/* Outer LinearGradient = gradient border ring (web .ring-border).
                  1.5px padding forms the visible border on all four sides. */}
              <LinearGradient
                colors={borderColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.featureCardBorder}
              >
                {/* Inner = tinted content area */}
                <LinearGradient colors={tint} start={{ x: 0.1, y: 0 }} end={{ x: 0.6, y: 1 }} style={styles.featureCardInner}>
                  <View style={styles.featureTop} />
                  <View style={styles.featureIconBox}>
                    {f.key === 'pred' && rashiImg
                      ? <Image source={rashiImg} style={{ width: 60, height: 60, borderRadius: 10 }} resizeMode="contain" />
                      : f.key === 'pred'
                        ? <SunArt size={60} dark={theme.isDark} />
                        : <f.Art size={60} />}
                  </View>
                  <View style={styles.featureTextCol}>
                    <Text style={[styles.featureTitle, { color: theme.gold1 }]}>{home.t(featTitle[f.key], t(`home.feat.${f.key}.title`, f.title))}</Text>
                    <Text style={[styles.featureDesc, { color: theme.isDark ? 'rgba(216,203,168,0.75)' : theme.textMuted }]}>{home.t(featDesc[f.key], t(`home.feat.${f.key}.desc`, f.desc))}</Text>
                  </View>
                  <View style={[styles.chevronCircle, { borderColor: theme.isDark ? 'rgba(246,210,122,0.5)' : theme.cardBorder }]}>
                    <Chevron c={theme.gold1} size={14} />
                  </View>
                </LinearGradient>
              </LinearGradient>
            </Pressable>
          );
        })}
      </View>

      {/* All Services — horizontal slider (swipe; no dots/arrows) */}
      <View style={[styles.sectionTitle, { marginTop: 22, marginBottom: 14 }]}>
        <GradientText style={styles.sectionHeading}>{lang === 'hi' ? 'सभी सेवाएँ' : 'All Services'}</GradientText>
        <LinearGradient colors={['transparent', theme.gold2, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.sectionRule} />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.svcScroll}
        decelerationRate="fast"
        snapToInterval={SVC_SNAP}
        snapToAlignment="start"
        disableIntervalMomentum
      >
        {SERVICES.map((s, i) => (
          <ServiceCard key={s.key} s={s} index={i} theme={theme} lang={lang} onPress={() => { hTap(); navigation.navigate(s.route); }} />
        ))}
      </ScrollView>

      {/* Prediction banner */}
      <GoldBorderCard style={{ marginTop: 20, overflow: 'hidden' }}>
        <View style={styles.predBanner}>
          <View style={[styles.predOrb, { borderColor: theme.isDark ? 'rgba(201,150,46,0.45)' : theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.7)' : '#ffffff' }]}>
            <StarOrb size={46} dark={theme.isDark} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.predKicker, { color: theme.isDark ? 'rgba(233,184,80,0.72)' : theme.gold3 }]}>{t('home.todaysPrediction', "TODAY'S PREDICTION")}</Text>
            <GradientText style={styles.predTitle}>{hasPred ? (pred!.headline || pred!.overall) : (lang === 'hi' ? 'आज का फलादेश देखें' : "See today's reading")}</GradientText>
            <View style={styles.predMeta}>
              {bannerChips.map((m) => (
                <View key={m} style={[styles.predChip, { borderColor: theme.isDark ? 'rgba(201,150,46,0.25)' : theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.07)' : '#f8fafc' }]}>
                  <Text style={[styles.predChipText, { color: theme.gold2 }]}>{m}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.predDesc, { color: theme.isDark ? 'rgba(239,224,168,0.75)' : theme.textMuted }]}>
              {hasPred ? pred!.advice : (lang === 'hi' ? 'अपनी कुंडली पर आधारित आज का विस्तृत मार्गदर्शन यहाँ से खोलें।' : 'Open your detailed, chart-based guidance for today here.')}
            </Text>
            <Pressable
              onPress={() => { hTap(); navigation.navigate('DailyPrediction'); }}
              style={[styles.predBtn, { borderColor: theme.isDark ? 'rgba(246,210,122,0.5)' : theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.7)' : '#f8fafc' }]}
            >
              <Text style={[styles.predBtnText, { color: theme.gold1 }]}>{t('home.viewDetails', 'View Details')}</Text>
              <Chevron c={theme.gold1} size={13} />
            </Pressable>
          </View>
        </View>
      </GoldBorderCard>

    </Screen>
  );
}

const styles = StyleSheet.create({
  watermark: { position: 'absolute', top: 13, left: 0, right: 0, alignItems: 'center', zIndex: -1 },
  twinkle: { position: 'absolute', width: 2, height: 2, borderRadius: 1, backgroundColor: '#ffe9b5', shadowColor: '#ffe9b5', shadowOpacity: 0.8, shadowRadius: 3, elevation: 2 },

  logoBlock: { alignItems: 'center', gap: 10, marginTop: 14, paddingVertical: 4 },
  logoImg: { width: 72, height: 72, borderRadius: 16 },
  banner: { width: '100%', height: 150, borderRadius: 16, marginTop: 14 },
  brandTitle: { fontFamily: fonts.cinzelXBold, fontSize: 24, letterSpacing: 3.84, lineHeight: 28 },
  brandSubRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  astrology: { fontFamily: fonts.cinzelSemi, fontSize: 11.5, letterSpacing: 4.6 },

  welcomeBlock: { marginTop: 20, padding: 16, borderRadius: 18, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  welcomeTitleRow: { flexDirection: 'row', alignItems: 'center' },
  welcomeTitle: { fontFamily: fonts.playfairBold, fontSize: 20 },
  welcomeSub: { fontFamily: fonts.inter, fontSize: 13, marginTop: 3 },
  zodiacBadge: { alignItems: 'center', gap: 4 },
  wzIcon: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  wzLabel: { fontFamily: fonts.cinzelSemi, fontSize: 10, letterSpacing: 1.4 },

  horoInner: { paddingTop: 24, paddingHorizontal: 24, paddingBottom: 12 },
  horoRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { fontFamily: fonts.interMed, fontSize: 13 },
  horoDesc: { fontFamily: fonts.inter, fontSize: 14, lineHeight: 22, marginTop: 10 },
  horoBtnRow: { paddingHorizontal: 18, paddingBottom: 18, paddingTop: 14 },
  horoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: 999, paddingVertical: 13, paddingHorizontal: 28 },
  horoBtnText: { fontFamily: fonts.cinzel, fontSize: 12.5, letterSpacing: 1.6 },

  sectionTitle: { alignItems: 'center', gap: 8, marginTop: 28, marginBottom: 4 },
  sectionHeading: { fontFamily: fonts.playfairBold, fontSize: 16, textAlign: 'center' },
  sectionRule: { width: 56, height: 2, borderRadius: 999 },

  featuresGrid: { gap: 12, marginTop: 24 },
  featureCardBorder: { borderRadius: 18, padding: 1 },
  featureCardInner: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 17, paddingVertical: 14, paddingHorizontal: 16, minHeight: 96, overflow: 'hidden' },
  featureTop: { position: 'absolute', top: 0, left: '18%', right: '18%', height: 1, backgroundColor: 'rgba(252,232,168,0.55)' },
  featureIconBox: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  featureTextCol: { flex: 1, minWidth: 0 },
  featureTitle: { fontFamily: fonts.playfairBold, fontSize: 16, lineHeight: 19 },
  featureDesc: { fontFamily: fonts.inter, fontSize: 12, lineHeight: 16.8, marginTop: 2 },
  chevronCircle: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  // Today's Panchang glance card
  panchCard: { flexDirection: 'row', alignItems: 'center', gap: 13, marginTop: 14, borderWidth: 1, borderRadius: 16, paddingVertical: 13, paddingHorizontal: 15 },
  panchIcon: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  panchKicker: { fontFamily: fonts.interSemi, fontSize: 10, letterSpacing: 1.1, textTransform: 'uppercase' },
  panchMain: { fontFamily: fonts.playfairBold, fontSize: 16, marginTop: 3 },
  panchSub: { fontFamily: fonts.inter, fontSize: 11.5, marginTop: 3 },

  // All-services horizontal slider — gold-ring tinted cards (matches hero feel)
  svcScroll: { gap: 13, paddingVertical: 8, paddingHorizontal: 2, paddingRight: 16 },
  svcBorder: { width: 156, borderRadius: 20, padding: 1.5 },
  svcInner: { flex: 1, borderRadius: 18.5, alignItems: 'center', paddingVertical: 15, paddingHorizontal: 13, gap: 8, minHeight: 172, overflow: 'hidden' },
  svcTopLine: { position: 'absolute', top: 0, left: '22%', right: '22%', height: 1, backgroundColor: 'rgba(252,232,168,0.5)' },
  svcIconRing: { width: 50, height: 50, borderRadius: 25, borderWidth: 1.2, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.5, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 4, marginTop: 2 },
  svcTitle: { fontFamily: fonts.playfairBold, fontSize: 14, textAlign: 'center', lineHeight: 18 },
  svcDesc: { fontFamily: fonts.inter, fontSize: 11, textAlign: 'center', lineHeight: 15 },

  predBanner: { flexDirection: 'row', gap: 14, alignItems: 'center', padding: 16 },
  predOrb: { width: 52, height: 52, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', shadowColor: '#e9b850', shadowOpacity: 0.16, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
  predBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, borderWidth: 1, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 12, marginTop: 10 },
  predBtnText: { fontFamily: fonts.interMed, fontSize: 11 },
  predKicker: { fontFamily: fonts.cinzelSemi, fontSize: 10.5, letterSpacing: 1.8 },
  predTitle: { fontFamily: fonts.playfairBold, fontSize: 15.5, marginTop: 2 },
  predMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 6 },
  predChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, borderWidth: 1 },
  predChipText: { fontFamily: fonts.interSemi, fontSize: 10 },
  predDesc: { fontFamily: fonts.inter, fontSize: 12, lineHeight: 18, marginTop: 6 },

  listRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1 },
  listLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  listIc: { width: 40, height: 40, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  listLabel: { fontFamily: fonts.interMed, fontSize: 14.5 },
});
