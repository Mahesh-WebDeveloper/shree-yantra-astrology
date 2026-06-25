import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Defs, RadialGradient, LinearGradient as SvgLinearGradient, Stop, Circle, Path, Ellipse, Rect, G } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';
import { useT } from '../i18n/LanguageProvider';

/* Animate ONLY the flame group — a real SVG <G>, so it renders correctly
   (the old version nested an RN <Animated.View>+<Svg> inside <Svg>, which
   react-native-svg can't paint → the flame showed as a black blob). */
const AnimatedG = Animated.createAnimatedComponent(G);

function DiyaIcon() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        // SVG props can't use the native driver — JS driver is fine for one tiny group
        Animated.timing(anim, { toValue: 1, duration: 1200, useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0, duration: 1200, useNativeDriver: false }),
      ])
    ).start();
  }, [anim]);

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const rotation = anim.interpolate({ inputRange: [0, 1], outputRange: [-2, 2] });

  return (
    <View style={styles.iconWrap}>
      <Svg viewBox="0 0 64 64" width={56} height={56}>
        <Defs>
          <RadialGradient id="cgFlameG" cx="50%" cy="68%" r="62%">
            <Stop offset="0%" stopColor="#fff7d6" />
            <Stop offset="42%" stopColor="#ffcf4a" />
            <Stop offset="100%" stopColor="#ff6a00" />
          </RadialGradient>
          <SvgLinearGradient id="cgBowlG" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#fce8a8" />
            <Stop offset="45%" stopColor="#e9b850" />
            <Stop offset="100%" stopColor="#7e5a14" />
          </SvgLinearGradient>
          <SvgLinearGradient id="cgOilG" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#c69e3a" />
            <Stop offset="50%" stopColor="#f6d585" />
            <Stop offset="100%" stopColor="#c69e3a" />
          </SvgLinearGradient>
          <RadialGradient id="cgHaloG" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#ffb43c" stopOpacity={0.55} />
            <Stop offset="100%" stopColor="#ffb43c" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        {/* warm halo behind the flame */}
        <Circle cx={32} cy={23} r={22} fill="url(#cgHaloG)" />
        {/* flame group — flickers gently around its base (32, 36) */}
        <AnimatedG originX={32} originY={36} scale={scale} rotation={rotation}>
          <Path d="M32 6C37.5 15 42 20.5 42 28a10 10 0 0 1-20 0c0-7.5 4.5-13 10-22Z" fill="url(#cgFlameG)" />
          <Path d="M32 16c3 5.5 5.5 9 5.5 12.5a5.5 5.5 0 0 1-11 0c0-3.5 2.5-7 5.5-12.5Z" fill="#fff7d6" />
          <Ellipse cx={32} cy={30} rx={2.3} ry={3.6} fill="#ffffff" />
        </AnimatedG>
        {/* wick */}
        <Rect x={31} y={33} width={2} height={6} rx={1} fill="#5e3f10" />
        {/* golden oil surface */}
        <Ellipse cx={32} cy={40.5} rx={20.5} ry={4} fill="url(#cgOilG)" />
        {/* earthen bowl */}
        <Path d="M11.5 40.5C13 49.5 21.5 54.5 32 54.5s19-5 20.5-14c-6.5 2.9-13.3 3.9-20.5 3.9s-14-1-20.5-3.9Z" fill="url(#cgBowlG)" stroke="#6e4e12" strokeWidth={0.6} />
        {/* rim highlight */}
        <Path d="M13 40.6C19 43 25.4 44 32 44s13-1 19-3.4" fill="none" stroke="#fff3c8" strokeWidth={1.3} strokeLinecap="round" opacity={0.75} />
        {/* base foot */}
        <Path d="M27 54.2h10l-1.6 4h-6.8z" fill="url(#cgBowlG)" stroke="#6e4e12" strokeWidth={0.4} />
      </Svg>
    </View>
  );
}

export const ChoghadiyaSpecialMessage = React.memo(function ChoghadiyaSpecialMessage({
  activeName, desc, timeRange, today = true,
}: {
  activeName: string;
  desc: string;
  timeRange: string;
  /** false when showing a non-today date — switches to the web's "On this day…" copy */
  today?: boolean;
}) {
  const { theme } = useTheme();
  const t = useT();
  const borderColor = theme.isDark ? 'rgba(238,203,122,0.36)' : theme.cardBorder;
  return (
    <View style={[styles.container, { backgroundColor: theme.isDark ? '#000000' : '#fffdf6', borderColor }]}>
      {/* web: radial-gradient(circle at 80% 50%, rgba(220,180,80,0.2), …) */}
      {theme.isDark && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg width="100%" height="100%">
            <Defs>
              <RadialGradient id="spGlow" cx="82%" cy="50%" r="60%">
                <Stop offset="0%" stopColor="#dcb450" stopOpacity={0.2} />
                <Stop offset="100%" stopColor="#dcb450" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx="82%" cy="50%" r="65%" fill="url(#spGlow)" />
          </Svg>
        </View>
      )}
      <View style={styles.content}>
        <Text style={[styles.h4, { color: theme.goldDim }]}>{t('cg.special', "TODAY'S SPECIAL MESSAGE")}</Text>
        {today ? (
          <Text style={[styles.p, { color: theme.isDark ? '#cccccc' : theme.textSoft }]}>
            From {timeRange} is <Text style={{ color: '#32cd32', fontFamily: fonts.interBold }}>{activeName} Choghadiya</Text>. {desc}
          </Text>
        ) : (
          <Text style={[styles.p, { color: theme.isDark ? '#cccccc' : theme.textSoft }]}>
            On this day, <Text style={{ color: '#32cd32', fontFamily: fonts.interBold }}>{activeName}</Text> runs {timeRange}. {desc}
          </Text>
        )}
      </View>
      <DiyaIcon />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.24,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  content: { flex: 1 },
  h4: { fontFamily: fonts.interSemi, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  p: { fontFamily: fonts.inter, fontSize: 12, lineHeight: 18 },
  /* no solid bg — the diya SVG carries its own soft halo gradient (web look) */
  iconWrap: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
