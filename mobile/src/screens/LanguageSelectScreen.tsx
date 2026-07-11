import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, G } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { useLang } from '../i18n/LanguageProvider';
import { fonts } from '../theme/tokens';
import { CosmicBackground } from '../components/CosmicBackground';
import { GradientText } from '../components/GradientText';
import { GoldButton } from '../components/GoldButton';
import { ShreeYantraLogo } from '../components/icons/WelcomeArt';
import { hTap, hSelect } from '../lib/haptics';

type Choice = 'hi' | 'en';

// A glowing gold mandala medallion with the language's script glyph in the centre.
function ScriptMedallion({ glyph, active, theme }: { glyph: string; active: boolean; theme: any }) {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const a = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 16000, easing: Easing.linear, useNativeDriver: true }));
    a.start();
    return () => a.stop();
  }, [spin]);
  const rot = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const gold = theme.gold1 || '#e9b850';
  return (
    <View style={styles.medallion}>
      <Animated.View style={{ position: 'absolute', transform: [{ rotate: rot }] }}>
        <Svg width={72} height={72} viewBox="0 0 72 72">
          <G opacity={active ? 0.95 : 0.5}>
            <Circle cx={36} cy={36} r={33} fill="none" stroke={gold} strokeWidth={1} strokeDasharray="2 6" />
            {[...Array(8)].map((_, i) => {
              const a = (i * Math.PI) / 4;
              return <Circle key={i} cx={36 + 33 * Math.cos(a)} cy={36 + 33 * Math.sin(a)} r={1.4} fill={gold} />;
            })}
          </G>
        </Svg>
      </Animated.View>
      <LinearGradient
        colors={active ? ['#fce8a8', '#e9b850', '#a8770f'] : (theme.isDark ? ['#241a35', '#0c0818'] : ['#fff5dd', '#f0dcab'])}
        start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
        style={[styles.medallionInner, { borderColor: active ? '#fff0c0' : theme.cardBorder }]}
      >
        <Text style={[styles.glyph, { color: active ? '#2a1800' : theme.gold1 }]}>{glyph}</Text>
      </LinearGradient>
    </View>
  );
}

function LangCard({ choice, active, onPress, theme, anim }: { choice: Choice; active: boolean; onPress: () => void; theme: any; anim: Animated.Value }) {
  const isHi = choice === 'hi';
  const title = isHi ? 'हिंदी' : 'English';
  const native = isHi ? 'Hindi · देवनागरी' : 'English';
  const line = isHi ? 'ऐप हिंदी में देखें' : 'Use the app in English';
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [26, 0] });
  const border = active ? (['#fce8a8', '#e9b850', '#a17613', '#f6d27a'] as const) : ([theme.cardBorder, theme.cardBorder] as const);
  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY }] }}>
      <Pressable onPress={() => { hSelect(); onPress(); }} style={({ pressed }) => [pressed && { transform: [{ scale: 0.98 }] }]}>
        <LinearGradient colors={border} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.cardRing, active && styles.cardRingActive]}>
          <LinearGradient
            colors={active
              ? (theme.isDark ? ['rgba(58,40,12,0.96)', 'rgba(20,12,4,0.98)'] : ['#fff9ec', '#fdeecb'])
              : (theme.isDark ? ['rgba(20,18,30,0.9)', 'rgba(8,7,16,0.94)'] : ['#fffdf7', '#fbf3df'])}
            style={styles.card}
          >
            <ScriptMedallion glyph={isHi ? 'अ' : 'A'} active={active} theme={theme} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.cardTitle, { color: active ? theme.gold1 : theme.text }]}>{title}</Text>
              <Text style={[styles.cardNative, { color: theme.gold2 }]}>{native}</Text>
              <Text style={[styles.cardLine, { color: theme.textMuted }]}>{line}</Text>
            </View>
            <View style={[styles.check, { borderColor: active ? theme.gold1 : theme.cardBorder, backgroundColor: active ? theme.gold1 : 'transparent' }]}>
              {active && (
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#2a1800" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round"><Path d="M20 6L9 17l-5-5" /></Svg>
              )}
            </View>
          </LinearGradient>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

export function LanguageSelectScreen({ navigation, route }: any) {
  const { theme } = useTheme();
  const { lang, setLang } = useLang();
  const insets = useSafeAreaInsets();
  const [choice, setChoice] = useState<Choice>(lang === 'hi' ? 'hi' : 'en');
  // Language is now the FIRST onboarding step (right after Splash), so the next step is login.
  const next: string = route?.params?.next || 'PhoneAuth';

  const fade = useRef(new Animated.Value(0)).current;
  const c1 = useRef(new Animated.Value(0)).current;
  const c2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    Animated.stagger(130, [
      Animated.spring(c1, { toValue: 1, useNativeDriver: true, damping: 14, stiffness: 130 }),
      Animated.spring(c2, { toValue: 1, useNativeDriver: true, damping: 14, stiffness: 130 }),
    ]).start();
  }, [fade, c1, c2]);

  const pick = (c: Choice) => { setChoice(c); setLang(c); };

  const onContinue = () => {
    hTap();
    setLang(choice);
    navigation.replace(next);
  };

  return (
    <View style={[styles.fill, { backgroundColor: theme.bgDeep }]}>
      <CosmicBackground />
      <Animated.View style={[styles.content, { opacity: fade, paddingTop: insets.top + 28, paddingBottom: insets.bottom + 22 }]}>
        <View style={styles.header}>
          <ShreeYantraLogo size={64} dark={theme.isDark} />
          <GradientText style={styles.h1}>{choice === 'hi' ? 'अपनी भाषा चुनें' : 'Choose Your Language'}</GradientText>
          <Text style={[styles.h1Hi, { color: theme.gold2 }]}>{choice === 'hi' ? 'Choose Your Language' : 'अपनी भाषा चुनें'}</Text>
          <Text style={[styles.sub, { color: theme.textMuted }]}>
            You can change this anytime in Settings · इसे आप कभी भी सेटिंग्स में बदल सकते हैं
          </Text>
        </View>

        <View style={styles.cards}>
          <LangCard choice="hi" active={choice === 'hi'} onPress={() => pick('hi')} theme={theme} anim={c1} />
          <LangCard choice="en" active={choice === 'en'} onPress={() => pick('en')} theme={theme} anim={c2} />
        </View>

        <View style={styles.footer}>
          <GoldButton label={choice === 'hi' ? 'आगे बढ़ें' : 'Continue'} onPress={onContinue} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 22 },
  header: { alignItems: 'center', gap: 6 },
  h1: { fontFamily: fonts.cinzel, fontSize: 24, letterSpacing: 1, textAlign: 'center', marginTop: 12 },
  h1Hi: { fontFamily: fonts.devanagari, fontSize: 19, textAlign: 'center', marginTop: 2 },
  sub: { fontFamily: fonts.inter, fontSize: 11.5, textAlign: 'center', lineHeight: 17, marginTop: 8, maxWidth: 320 },
  cards: { flex: 1, justifyContent: 'center', gap: 18 },
  cardRing: { borderRadius: 22, padding: 1.4 },
  cardRingActive: { shadowColor: '#e9b850', shadowOpacity: 0.4, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 16, borderRadius: 21, paddingHorizontal: 18, paddingVertical: 20 },
  medallion: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
  medallionInner: { width: 54, height: 54, borderRadius: 27, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  glyph: { fontFamily: fonts.devanagari, fontSize: 30, lineHeight: 38 },
  cardTitle: { fontFamily: fonts.cinzelSemi, fontSize: 21 },
  cardNative: { fontFamily: fonts.interSemi, fontSize: 12, marginTop: 2 },
  cardLine: { fontFamily: fonts.inter, fontSize: 11.5, marginTop: 3 },
  check: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.6, alignItems: 'center', justifyContent: 'center' },
  footer: { gap: 10 },
});
