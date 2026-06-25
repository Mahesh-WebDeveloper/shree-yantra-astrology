import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Animated, Easing, useWindowDimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';
import { GoldButton } from '../components/GoldButton';
import { GradientText } from '../components/GradientText';
import { CosmicBackground } from '../components/CosmicBackground';
import { hTap } from '../lib/haptics';
import { useAppConfig } from '../context/AppConfigProvider';
import { useT } from '../i18n/LanguageProvider';

const SLIDES = [
  {
    title: 'Discover Your Cosmic Path',
    sub: 'Personalised Vedic horoscopes, kundli analysis and divine learning — all guided by your stars.',
    icon: (c: string) => (
      <Svg width={56} height={56} viewBox="0 0 64 64" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <Circle cx={32} cy={32} r={22} />
        <Path d="M32 6v52M6 32h52M14.5 14.5l35 35M49.5 14.5l-35 35" />
        <Circle cx={32} cy={32} r={6} fill={c} opacity={0.25} />
      </Svg>
    ),
  },
  {
    title: 'Daily Divine Guidance',
    sub: 'Wake up to predictions tailored to your moon sign, dasha period and planetary transits.',
    icon: (c: string) => (
      <Svg width={56} height={56} viewBox="0 0 64 64" fill={c}>
        <Path d="M44 12a22 22 0 1 0 8 22 16 16 0 0 1-8-22z" />
        <Circle cx={14} cy={14} r={1.4} /><Circle cx={50} cy={50} r={1.6} /><Circle cx={18} cy={46} r={1.2} />
      </Svg>
    ),
  },
  {
    title: 'Unlock Premium Wisdom',
    sub: 'Unlock detailed predictions, sacred library content and premium guidance for your daily routine.',
    // outline crown (not a solid fill) so it reads as a crown, not a gold blob
    icon: (c: string) => (
      <Svg width={58} height={58} viewBox="0 0 64 64" fill="none" stroke={c} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M8 24 L18 38 L32 16 L46 38 L56 24 L51 50 L13 50 Z" />
        <Circle cx={8} cy={24} r={2.6} fill={c} /><Circle cx={56} cy={24} r={2.6} fill={c} /><Circle cx={32} cy={16} r={2.6} fill={c} />
      </Svg>
    ),
  },
];

function Art({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const a = useRef(new Animated.Value(0)).current;
  const b = useRef(new Animated.Value(0)).current;
  const c = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.timing(a, { toValue: 1, duration: 40000, easing: Easing.linear, useNativeDriver: true })).start();
    Animated.loop(Animated.timing(b, { toValue: 1, duration: 60000, easing: Easing.linear, useNativeDriver: true })).start();
    Animated.loop(Animated.timing(c, { toValue: 1, duration: 80000, easing: Easing.linear, useNativeDriver: true })).start();
  }, [a, b, c]);
  const rot = (v: Animated.Value, rev?: boolean) => v.interpolate({ inputRange: [0, 1], outputRange: rev ? ['0deg', '-360deg'] : ['0deg', '360deg'] });
  const ringClr = (o: number) => (theme.isDark ? `rgba(201,150,46,${o})` : `rgba(151,93,12,${Math.min(0.9, o * 1.7)})`);

  return (
    <View style={styles.art}>
      <Animated.View style={[styles.ring1, { borderColor: ringClr(0.45), transform: [{ rotate: rot(a) }] }]} />
      <Animated.View style={[styles.ring2, { borderColor: ringClr(0.28), transform: [{ rotate: rot(b, true) }] }]} />
      <Animated.View style={[styles.ring3, { borderColor: ringClr(0.18), borderStyle: 'dashed', transform: [{ rotate: rot(c) }] }]} />
      {/* circular plate drawn with SVG (true circle — a styled View was being
          faceted into an octagon by Android's elevation/clip on this device) */}
      <View style={styles.glyph}>
        <Svg width={110} height={110} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <RadialGradient id="glyphPlate" cx="50%" cy="40%" r="68%">
              <Stop offset="0%" stopColor={theme.isDark ? '#1b1726' : '#fffaf0'} />
              <Stop offset="100%" stopColor={theme.isDark ? '#08080f' : '#f3e6cf'} />
            </RadialGradient>
          </Defs>
          <Circle cx={55} cy={55} r={53} fill={theme.isDark ? '#e9b850' : '#b07316'} opacity={0.16} />
          <Circle cx={55} cy={55} r={52} fill="url(#glyphPlate)" stroke={theme.cardBorder} strokeWidth={1} />
        </Svg>
        {children}
      </View>
    </View>
  );
}

export function OnboardingScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { config } = useAppConfig();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scroller = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const [stageH, setStageH] = useState(0);
  const [stageW, setStageW] = useState(0);
  // The pager lives inside a padded shell, so its viewport is narrower than the
  // screen. Slides MUST equal the ScrollView's own width or paging misaligns
  // and adjacent slides bleed in. Use the measured width.
  const slideW = stageW || width;
  const slides = (config.onboardingSlides || [])
    .filter((s) => s.isActive !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((s, i) => ({
      title: s.title || SLIDES[i % SLIDES.length].title,
      sub: s.subtitle || SLIDES[i % SLIDES.length].sub,
      icon: SLIDES[i % SLIDES.length].icon,
    }));
  const activeSlides = slides.length ? slides : SLIDES;

  // mobile + OTP = primary flow (new + existing dono); ye sabse aasan hai
  const goAuth = () => navigation.navigate('PhoneAuth');
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / slideW);
    if (i !== index) setIndex(i);
  };
  const next = () => {
    if (index === activeSlides.length - 1) return goAuth();
    scroller.current?.scrollTo({ x: (index + 1) * slideW, animated: true });
  };

  return (
    <LinearGradient colors={theme.bgGradient} style={styles.fill}>
      <CosmicBackground />
      <View style={[styles.shell, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 18 }]}>
        <Pressable onPress={() => { hTap(); goAuth(); }} style={[styles.skip, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,250,240,0.7)' }]} hitSlop={6}>
          <Text style={[styles.skipText, { color: theme.gold2 }]}>SKIP ›</Text>
        </Pressable>

        <ScrollView
          ref={scroller}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScroll}
          onLayout={(e) => { setStageH(e.nativeEvent.layout.height); setStageW(e.nativeEvent.layout.width); }}
          style={styles.stage}
        >
          {activeSlides.map((s, i) => (
            <View key={i} style={[styles.slide, { width: slideW, height: stageH || undefined }]}>
              <Art>{s.icon(theme.gold1)}</Art>
              <GradientText style={[styles.title, { width: slideW - 48 }]}>{s.title}</GradientText>
              <Text style={[styles.sub, { color: theme.textSoft, width: slideW - 48 }]}>{s.sub}</Text>
            </View>
          ))}
        </ScrollView>

        <Text style={[styles.hint, { color: theme.isDark ? 'rgba(216,203,168,0.72)' : '#7a6130' }]}>‹ SWIPE TO EXPLORE ›</Text>

        <View style={styles.dots}>
          {activeSlides.map((_, i) =>
            i === index ? (
              <LinearGradient key={i} colors={theme.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.dotActive} />
            ) : (
              <View key={i} style={[styles.dot, { backgroundColor: theme.isDark ? 'rgba(201,150,46,0.32)' : 'rgba(151,93,12,0.45)' }]} />
            )
          )}
        </View>

        <View style={{ gap: 10 }}>
          <GoldButton label={index === activeSlides.length - 1 ? t('onboarding.getStarted', 'Get Started') : t('common.continue', 'Continue')} onPress={next} />
          <GoldButton label={t('onboarding.haveAccount', 'I already have an account')} variant="ghost" onPress={goAuth} />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  shell: { flex: 1, paddingHorizontal: 18 },
  skip: { alignSelf: 'flex-end', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  skipText: { fontFamily: fonts.inter, fontSize: 11.5, letterSpacing: 2 },

  stage: { flex: 1 },
  slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  art: { width: 200, height: 200, marginBottom: 22, alignItems: 'center', justifyContent: 'center' },
  ring1: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 100, borderWidth: 1 },
  ring2: { position: 'absolute', top: 18, left: 18, right: 18, bottom: 18, borderRadius: 82, borderWidth: 1 },
  ring3: { position: 'absolute', top: 36, left: 36, right: 36, bottom: 36, borderRadius: 64, borderWidth: 1 },
  glyph: { width: 110, height: 110, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.playfairBold, fontSize: 25, textAlign: 'center', marginBottom: 10 },
  sub: { fontFamily: fonts.inter, fontSize: 14, lineHeight: 22, textAlign: 'center', maxWidth: 320 },

  hint: { fontFamily: fonts.cinzelSemi, fontSize: 11, letterSpacing: 3, textAlign: 'center', marginTop: 20 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 10, marginBottom: 18, alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { width: 22, height: 8, borderRadius: 999 },
});
