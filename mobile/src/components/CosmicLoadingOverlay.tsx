import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, BackHandler, Dimensions, Easing, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLang } from '../i18n/LanguageProvider';
import { subscribeNetworkActivity, NetworkActivityItem, NetworkActivitySnapshot } from '../lib/networkActivity';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';

const EMPTY: NetworkActivitySnapshot = { active: false, count: 0, primaryActive: false, items: [], latest: null };

const baseSteps = {
  en: [
    'Connecting to the calculation engine',
    'Reading saved birth details',
    'Preparing the result screen',
  ],
  hi: [
    'गणना इंजन से जुड़ रहे हैं',
    'सहेजे हुए जन्म विवरण पढ़े जा रहे हैं',
    'परिणाम स्क्रीन तैयार हो रही है',
  ],
};

function stepsFor(items: NetworkActivityItem[], lang: 'en' | 'hi') {
  const keys = new Set(items.map((item) => item.key));
  if (keys.has('brihat')) {
    return lang === 'hi'
      ? [
          'जन्म कुंडली और ग्रह-स्थिति की गणना हो रही है',
          'वर्ग, दशा, योग और दोष मॉड्यूल जोड़े जा रहे हैं',
          'जीवन क्षेत्रों और उपायों को स्रोत के साथ मिलाया जा रहा है',
          'बृहत कुंडली रिपोर्ट तैयार हो रही है',
        ]
      : [
          'Calculating birth chart and planetary positions',
          'Assembling varga, dasha, yoga and dosha modules',
          'Mapping life areas and remedies with sources',
          'Polishing the Brihat Kundli report',
        ];
  }
  if (keys.has('kundli') || keys.has('varga') || keys.has('dasha')) {
    return lang === 'hi'
      ? [
          'सटीक जन्म स्थान और समय क्षेत्र लागू हो रहा है',
          'लाहिरी अयनांश से ग्रह-स्थिति की गणना हो रही है',
          'कुंडली, दशा और वर्ग डेटा स्क्रीन पर सेट हो रहा है',
        ]
      : [
          'Applying exact birth place and timezone',
          'Calculating planetary positions with Lahiri ayanamsa',
          'Setting chart, dasha and varga data on screen',
        ];
  }
  if (keys.has('ai')) {
    return lang === 'hi'
      ? ['कुंडली संदर्भ तैयार हो रहा है', 'AI व्याख्या तैयार हो रही है', 'उत्तर को सरल भाषा में व्यवस्थित किया जा रहा है']
      : ['Preparing chart context', 'Generating the AI explanation', 'Formatting the answer in simple language'];
  }
  if (keys.has('panchang')) {
    return lang === 'hi'
      ? ['सूर्योदय और स्थानीय समय लागू हो रहा है', 'तिथि, नक्षत्र और योग की गणना हो रही है', 'आज का पंचांग तैयार हो रहा है']
      : ['Applying sunrise and local time', 'Computing tithi, nakshatra and yog', 'Preparing today panchang'];
  }
  if (keys.has('content')) {
    return lang === 'hi'
      ? ['सामग्री पुस्तकालय खुल रहा है', 'अध्याय और ऑडियो डेटा लोड हो रहा है', 'पठन स्क्रीन तैयार हो रही है']
      : ['Opening the content library', 'Loading chapters and audio data', 'Preparing the reading screen'];
  }
  return baseSteps[lang];
}

function LoaderTitle({ latest }: { latest: NetworkActivityItem | null }) {
  const { lang } = useLang();
  const { theme } = useTheme();
  const title = latest ? (lang === 'hi' ? latest.titleHi : latest.titleEn) : (lang === 'hi' ? 'डेटा लोड हो रहा है' : 'Loading your data');
  const detail = latest ? (lang === 'hi' ? latest.detailHi : latest.detailEn) : null;
  return (
    <View style={styles.titleBlock}>
      <Text style={[styles.kicker, { color: theme.goldText }]}>{lang === 'hi' ? 'कृपया प्रतीक्षा करें' : 'PLEASE WAIT'}</Text>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      {!!detail && <Text style={[styles.detail, { color: theme.textMuted }]}>{detail}</Text>}
    </View>
  );
}

function SolarLoader() {
  const { theme } = useTheme();
  const spin = useRef(new Animated.Value(0)).current;
  const spinSlow = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const a = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 3200, easing: Easing.linear, useNativeDriver: true }));
    const b = Animated.loop(Animated.timing(spinSlow, { toValue: 1, duration: 5600, easing: Easing.linear, useNativeDriver: true }));
    const c = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    a.start();
    b.start();
    c.start();
    return () => {
      a.stop();
      b.stop();
      c.stop();
    };
  }, [pulse, spin, spinSlow]);

  const r1 = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const r2 = spinSlow.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.08] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });

  return (
    <View style={styles.loaderWrap}>
      <View style={[styles.orbit, styles.orbitOuter, { borderColor: theme.isDark ? 'rgba(233,184,80,0.28)' : 'rgba(143,94,15,0.26)' }]} />
      <View style={[styles.orbit, styles.orbitInner, { borderColor: theme.isDark ? 'rgba(233,184,80,0.20)' : 'rgba(143,94,15,0.20)' }]} />
      <Animated.View style={[styles.orbitArmOuter, { transform: [{ rotate: r1 }] }]}>
        <View style={[styles.planet, styles.planetGold]} />
      </Animated.View>
      <Animated.View style={[styles.orbitArmInner, { transform: [{ rotate: r2 }] }]}>
        <View style={[styles.planet, styles.planetBlue]} />
      </Animated.View>
      <Animated.View style={[styles.sun, { opacity, transform: [{ scale }], backgroundColor: theme.gold1, shadowColor: theme.gold1 }]} />
    </View>
  );
}

// Subtle, NON-BLOCKING indeterminate progress line at the very top — shown for background
// fetches (varga / dasha / AI insights etc.) so the user gets "working…" feedback without
// the full overlay ever covering content or blocking scroll.
function TopProgressBar({ theme }: { theme: ReturnType<typeof useTheme>['theme'] }) {
  const insets = useSafeAreaInsets();
  const x = useRef(new Animated.Value(0)).current;
  const W = Dimensions.get('window').width;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(x, { toValue: 1, duration: 1050, easing: Easing.inOut(Easing.quad), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [x]);
  const translateX = x.interpolate({ inputRange: [0, 1], outputRange: [-150, W] });
  return (
    <View pointerEvents="none" style={[styles.topBarWrap, { top: insets.top }]}>
      <View style={[styles.topBarTrack, { backgroundColor: theme.isDark ? 'rgba(233,184,80,0.10)' : 'rgba(176,115,22,0.10)' }]}>
        <Animated.View style={[styles.topBarFill, { backgroundColor: theme.gold1, shadowColor: theme.gold1, transform: [{ translateX }] }]} />
      </View>
    </View>
  );
}

// Vertical step checklist — completed steps get a check, the current step glows, pending
// stay faint. Gives the live "process / Google-AI-Studio" feel.
function StepList({ steps, current, theme }: { steps: string[]; current: number; theme: ReturnType<typeof useTheme>['theme'] }) {
  return (
    <View style={styles.stepList}>
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <View key={i} style={styles.stepRow}>
            <View
              style={[styles.stepDot, {
                borderColor: active ? theme.gold1 : done ? 'transparent' : theme.cardBorder,
                backgroundColor: done ? theme.gold1 : active ? 'rgba(233,184,80,0.16)' : 'transparent',
              }]}
            >
              {done
                ? <Text style={[styles.stepCheck, { color: theme.buttonInk }]}>✓</Text>
                : <View style={[styles.stepInner, { backgroundColor: active ? theme.gold1 : (theme.isDark ? 'rgba(233,184,80,0.32)' : 'rgba(143,94,15,0.32)') }]} />}
            </View>
            <Text
              style={[styles.stepRowText, {
                color: active ? theme.text : done ? theme.textSoft : theme.textMuted,
                fontFamily: active ? fonts.interSemi : fonts.inter,
              }]}
              numberOfLines={2}
            >{s}</Text>
          </View>
        );
      })}
    </View>
  );
}

// Slim indeterminate gold shimmer under the steps — quiet "still working" motion.
function ProgressShimmer({ theme }: { theme: ReturnType<typeof useTheme>['theme'] }) {
  const x = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(x, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [x]);
  const translateX = x.interpolate({ inputRange: [0, 1], outputRange: [-96, 300] });
  return (
    <View style={[styles.shimmerTrack, { backgroundColor: theme.isDark ? 'rgba(233,184,80,0.12)' : 'rgba(143,94,15,0.12)' }]}>
      <Animated.View style={[styles.shimmerFill, { backgroundColor: theme.gold1, transform: [{ translateX }] }]} />
    </View>
  );
}

export function CosmicLoadingOverlay() {
  const { theme } = useTheme();
  const { lang } = useLang();
  const insets = useSafeAreaInsets();
  const { width: W, height: H } = useWindowDimensions();
  const [snapshot, setSnapshot] = useState<NetworkActivitySnapshot>(EMPTY);
  const [shown, setShown] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => subscribeNetworkActivity(setSnapshot), []);

  useEffect(() => {
    // the full cosmic loader is gated on PRIMARY activity only (heavy initial loads);
    // background fetches get the non-blocking top bar instead.
    if (!snapshot.primaryActive) {
      setShown(false);
      setStepIndex(0);
      fade.setValue(0);
      return;
    }
    // only reveal the full steps-loader if the load is actually SLOW (≥ 600ms) — quick
    // loads finish before this and never flash the overlay.
    const delay = setTimeout(() => setShown(true), 600);
    return () => clearTimeout(delay);
  }, [fade, snapshot.primaryActive]);

  useEffect(() => {
    if (!shown) return;
    Animated.timing(fade, { toValue: 1, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [fade, shown]);

  const steps = useMemo(() => stepsFor(snapshot.items, lang), [lang, snapshot.items]);
  useEffect(() => {
    if (!shown) return;
    // advance forward and HOLD on the last step (process feel — not a cycling carousel)
    const timer = setInterval(() => setStepIndex((i) => Math.min(i + 1, steps.length - 1)), 1250);
    return () => clearInterval(timer);
  }, [shown, steps.length]);

  // While the blocking loader is visible, swallow the Android hardware back button so the
  // user can't navigate away mid-load (they'd land on a half-loaded / wrong screen).
  const blocking = snapshot.primaryActive && shown;
  useEffect(() => {
    if (!blocking) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [blocking]);

  if (!snapshot.active) return null;
  // background/secondary fetch → subtle non-blocking top bar (never covers content or blocks scroll)
  if (!snapshot.primaryActive) return <TopProgressBar theme={theme} />;
  if (!shown) return null;

  const goldRing = theme.isDark
    ? (['#fce8a8', '#e9b850', '#a17613', '#f6d27a'] as const)
    : (['#f8ecd0', '#d49b2e', '#a66f12', '#efd37b'] as const);

  return (
    // BLOCKING scrim: while the full steps-loader is visible (heavy PRIMARY load) it must
    // capture ALL touches so the user can't tap/navigate/interact with the screen behind it.
    // (Background/secondary fetches never reach here — they use the non-blocking TopProgressBar.)
    <Animated.View pointerEvents="auto" style={[StyleSheet.absoluteFillObject, styles.overlay, { opacity: fade }]}>
      {/* real frosted-glass blur of the screen behind — full screen, guaranteed */}
      <BlurView intensity={theme.isDark ? 36 : 58} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      {/* brand tint to deepen the blur (covers the WHOLE screen, fixes the right-side cut) */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.isDark ? 'rgba(6,4,12,0.78)' : 'rgba(255,248,234,0.72)' }]} />
      {/* decorative gold glow + faint stars — explicit numeric size so it always fills */}
      <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <RadialGradient id="loadGlow1" cx="50%" cy="32%" r="55%">
            <Stop offset="0%" stopColor={theme.isDark ? '#e9b850' : '#f2c96b'} stopOpacity={theme.isDark ? 0.22 : 0.24} />
            <Stop offset="100%" stopColor={theme.isDark ? '#000000' : '#ffffff'} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="loadGlow2" cx="84%" cy="88%" r="46%">
            <Stop offset="0%" stopColor={theme.isDark ? '#7a52ff' : '#caa6ff'} stopOpacity={theme.isDark ? 0.12 : 0.16} />
            <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width={W} height={H} fill="url(#loadGlow1)" />
        <Rect width={W} height={H} fill="url(#loadGlow2)" />
        {[0.12, 0.34, 0.72, 0.88, 0.55, 0.07].map((fx, index) => (
          <Circle
            key={index}
            cx={fx * W}
            cy={(index % 2 ? 0.18 : 0.13) * H + index * 0.11 * H}
            r={index % 2 ? 1.3 : 0.9}
            fill={theme.isDark ? '#fff0c8' : '#9a6818'}
            opacity={theme.isDark ? 0.6 : 0.34}
          />
        ))}
      </Svg>

      <LinearGradient colors={goldRing} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.panelRing}>
        <LinearGradient
          colors={theme.isDark ? ['rgba(26,18,6,0.97)', 'rgba(4,3,8,0.98)'] : ['rgba(255,253,247,0.99)', 'rgba(255,245,224,0.99)']}
          style={styles.panel}
        >
          <SolarLoader />
          <LoaderTitle latest={snapshot.latest} />
          <StepList steps={steps} current={stepIndex} theme={theme} />
          <ProgressShimmer theme={theme} />
        </LinearGradient>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  topBarWrap: { position: 'absolute', left: 0, right: 0, height: 3, zIndex: 9999, elevation: 9999 },
  topBarTrack: { height: 2.5, overflow: 'hidden' },
  topBarFill: { width: 150, height: 2.5, borderRadius: 2, opacity: 0.92, shadowOpacity: 0.5, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } },
  // step checklist (process view)
  stepList: { width: '100%', marginTop: 18, gap: 11 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  stepDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.4, alignItems: 'center', justifyContent: 'center' },
  stepInner: { width: 6, height: 6, borderRadius: 3 },
  stepCheck: { fontFamily: fonts.interSemi, fontSize: 11, lineHeight: 13 },
  stepRowText: { flex: 1, fontSize: 12.5, lineHeight: 17 },
  shimmerTrack: { width: '100%', height: 3, borderRadius: 2, marginTop: 20, overflow: 'hidden' },
  shimmerFill: { width: 96, height: 3, borderRadius: 2, opacity: 0.95 },
  overlay: {
    zIndex: 9999,
    elevation: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
  },
  panelRing: {
    width: '100%',
    maxWidth: 392,
    borderRadius: 26,
    padding: 1.6,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },
  panel: {
    borderRadius: 24.6,
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
    overflow: 'hidden',
  },
  loaderWrap: {
    width: 132,
    height: 132,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  orbit: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: 999,
  },
  orbitOuter: {
    width: 126,
    height: 126,
  },
  orbitInner: {
    width: 84,
    height: 84,
  },
  orbitArmOuter: {
    position: 'absolute',
    width: 126,
    height: 126,
  },
  orbitArmInner: {
    position: 'absolute',
    width: 84,
    height: 84,
  },
  planet: {
    position: 'absolute',
    borderRadius: 999,
  },
  planetGold: {
    width: 13,
    height: 13,
    right: -2,
    top: 56,
    backgroundColor: '#f6d27a',
  },
  planetBlue: {
    width: 9,
    height: 9,
    left: 2,
    top: 38,
    backgroundColor: '#5aa9e0',
  },
  sun: {
    width: 42,
    height: 42,
    borderRadius: 999,
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  titleBlock: {
    alignItems: 'center',
    gap: 5,
  },
  kicker: {
    fontFamily: fonts.interBold,
    fontSize: 10,
    letterSpacing: 2.2,
  },
  title: {
    fontFamily: fonts.playfairBold,
    fontSize: 22,
    textAlign: 'center',
  },
  detail: {
    fontFamily: fonts.inter,
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 310,
  },
  stepBox: {
    width: '100%',
    borderRadius: 17,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginTop: 18,
    backgroundColor: 'rgba(233,184,80,0.08)',
  },
  stepLabel: {
    fontFamily: fonts.interSemi,
    fontSize: 10.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  stepText: {
    fontFamily: fonts.interSemi,
    fontSize: 13.2,
    lineHeight: 19,
    marginTop: 5,
  },
  dots: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 11,
  },
  dot: {
    width: 18,
    height: 3,
    borderRadius: 999,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 7,
    marginTop: 14,
  },
  chip: {
    maxWidth: 160,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipText: {
    fontFamily: fonts.interSemi,
    fontSize: 10.5,
  },
});
