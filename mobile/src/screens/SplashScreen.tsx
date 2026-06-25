import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Path, Circle, G, Polygon, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';
import { ShimmerText } from '../components/ShimmerText';
import { CosmicBackground } from '../components/CosmicBackground';
import { bootstrapAuth } from '../lib/auth';

/**
 * Splash — a living Sri Yantra mandala (the app's namesake) that comes alive on
 * launch with a choreographed reveal: soft glow blooms → lotus-petal ring spins
 * in → interlocking yantra triangles → the bindu pops and breathes → the name
 * rises with an iOS-15 gold shimmer. Twinkling stars and three orbiting sparks
 * circle the emblem. All RN Animated (native driver) — buttery in Expo Go.
 */
const PETALS = Array.from({ length: 16 }, (_, i) => i * 22.5);
const DOTS = Array.from({ length: 24 }, (_, i) => i * 15);
// twinkling stars: [xOffset, yOffset, size, baseOpacity]
const STARS = [
  [-92, -70, 2.2, 0.9], [78, -96, 1.8, 0.8], [104, -10, 2.4, 0.85], [-110, 24, 1.6, 0.7],
  [60, 104, 2, 0.8], [-64, 100, 1.7, 0.75], [10, -120, 1.5, 0.7], [-120, -16, 1.4, 0.65],
] as const;

function PetalRing({ stroke, faint }: { stroke: string; faint: string }) {
  return (
    <Svg width={230} height={230} viewBox="0 0 200 200">
      <Circle cx={100} cy={100} r={94} fill="none" stroke={faint} strokeWidth={0.8} strokeDasharray="1 5" />
      {DOTS.map((d) => (
        <G key={d} rotation={d} origin="100, 100"><Circle cx={100} cy={10} r={1.3} fill={faint} /></G>
      ))}
      {PETALS.map((d) => (
        <G key={d} rotation={d} origin="100, 100">
          <Path d="M100,56 C92,46 92,32 100,22 C108,32 108,46 100,56 Z" fill="none" stroke={stroke} strokeWidth={1} strokeLinejoin="round" />
        </G>
      ))}
      <Circle cx={100} cy={100} r={44} fill="none" stroke={stroke} strokeWidth={1} opacity={0.7} />
    </Svg>
  );
}

function YantraStar({ stroke }: { stroke: string }) {
  const tri = { fill: 'none', stroke, strokeWidth: 1.1, strokeLinejoin: 'round' as const };
  return (
    <Svg width={230} height={230} viewBox="0 0 200 200">
      <Polygon points="100,62 132.9,119 67.1,119" {...tri} />
      <Polygon points="100,138 132.9,81 67.1,81" {...tri} />
      <Polygon points="100,76 120,114 80,114" {...tri} opacity={0.85} />
      <Polygon points="100,124 120,86 80,86" {...tri} opacity={0.85} />
      <Circle cx={100} cy={100} r={17} fill="none" stroke={stroke} strokeWidth={0.9} opacity={0.6} />
    </Svg>
  );
}

export function SplashScreen({ navigation }: any) {
  const { theme } = useTheme();
  // entrance (choreographed)
  const bloom = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;
  const tri = useRef(new Animated.Value(0)).current;
  const binduPop = useRef(new Animated.Value(0)).current;
  const name = useRef(new Animated.Value(0)).current;
  // continuous
  const spin = useRef(new Animated.Value(0)).current;
  const spinRev = useRef(new Animated.Value(0)).current;
  const orbit1 = useRef(new Animated.Value(0)).current;
  const orbit2 = useRef(new Animated.Value(0)).current;
  const orbit3 = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const bar = useRef(new Animated.Value(0)).current;
  const twinkle = useRef(STARS.map(() => new Animated.Value(0))).current;
  // saved login? — token storage se load karke api client ko de do (background)
  const authedRef = useRef(false);

  useEffect(() => {
    bootstrapAuth().then((ok) => { authedRef.current = ok; }).catch(() => {});
  }, []);

  useEffect(() => {
    // ── choreographed entrance ──
    Animated.timing(bloom, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    Animated.sequence([Animated.delay(220), Animated.timing(ring, { toValue: 1, duration: 760, easing: Easing.out(Easing.cubic), useNativeDriver: true })]).start();
    Animated.sequence([Animated.delay(480), Animated.timing(tri, { toValue: 1, duration: 760, easing: Easing.out(Easing.cubic), useNativeDriver: true })]).start();
    Animated.sequence([Animated.delay(820), Animated.spring(binduPop, { toValue: 1, friction: 4.5, tension: 90, useNativeDriver: true })]).start();
    Animated.sequence([Animated.delay(1080), Animated.timing(name, { toValue: 1, duration: 560, easing: Easing.out(Easing.cubic), useNativeDriver: true })]).start();

    // ── continuous loops ──
    Animated.loop(Animated.timing(spin, { toValue: 1, duration: 60000, easing: Easing.linear, useNativeDriver: true })).start();
    Animated.loop(Animated.timing(spinRev, { toValue: 1, duration: 44000, easing: Easing.linear, useNativeDriver: true })).start();
    Animated.loop(Animated.timing(orbit1, { toValue: 1, duration: 6500, easing: Easing.linear, useNativeDriver: true })).start();
    Animated.loop(Animated.timing(orbit2, { toValue: 1, duration: 10000, easing: Easing.linear, useNativeDriver: true })).start();
    Animated.loop(Animated.timing(orbit3, { toValue: 1, duration: 15000, easing: Easing.linear, useNativeDriver: true })).start();
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.timing(bar, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true })).start();
    // stars twinkle (each desynced by a different duration/delay)
    twinkle.forEach((v, i) => {
      Animated.loop(Animated.sequence([
        Animated.delay(i * 240),
        Animated.timing(v, { toValue: 1, duration: 900 + i * 130, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 900 + i * 130, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])).start();
    });

    const t = setTimeout(() => navigation.replace(authedRef.current ? 'Main' : 'Onboarding'), 3300);
    return () => clearTimeout(t);
  }, [navigation, bloom, ring, tri, binduPop, name, spin, spinRev, orbit1, orbit2, orbit3, pulse, bar, twinkle]);

  const gold = theme.isDark ? '#e9c873' : '#a9781f';
  const goldFaint = theme.isDark ? 'rgba(233,200,115,0.45)' : 'rgba(169,120,31,0.45)';

  const rot = (v: Animated.Value, rev = false) => v.interpolate({ inputRange: [0, 1], outputRange: rev ? ['0deg', '-360deg'] : ['0deg', '360deg'] });

  // entrance interpolations
  const ringScale = ring.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });
  const triScale = tri.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });
  const nameRise = name.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });
  // glow: bloom in, then breathe
  const glowOp = Animated.multiply(bloom, pulse.interpolate({ inputRange: [0, 1], outputRange: [0.42, 0.72] }));
  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.12] });
  // bindu: pop in then breathe
  const binduScale = Animated.multiply(binduPop, pulse.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.18] }));
  const haloScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] });
  const haloOp = Animated.multiply(binduPop, pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.15] }));
  const slide = bar.interpolate({ inputRange: [0, 1], outputRange: [-50, 200] });

  const Spark = ({ track, orbit, size }: { track: number; orbit: Animated.Value; size: number }) => (
    <Animated.View style={[styles.layer, { opacity: bloom, transform: [{ rotate: rot(orbit) }] }]} pointerEvents="none">
      <View style={[styles.orbitTrack, { width: track, height: track }]}>
        <View style={[styles.spark, { width: size, height: size, borderRadius: size / 2, backgroundColor: gold, shadowColor: gold }]} />
      </View>
    </Animated.View>
  );

  return (
    <View style={[styles.fill, { backgroundColor: theme.bgDeep }]}>
      <CosmicBackground />

      {/* twinkling stars (behind the mandala) */}
      <View style={styles.center} pointerEvents="none">
        <View style={styles.starField}>
          {STARS.map(([x, y, s, o], i) => (
            <Animated.View
              key={i}
              style={[
                styles.star,
                {
                  width: s * 2, height: s * 2, borderRadius: s,
                  backgroundColor: i % 2 ? '#fff' : gold,
                  transform: [{ translateX: x }, { translateY: y }],
                  opacity: twinkle[i].interpolate({ inputRange: [0, 1], outputRange: [0.12, o] }),
                  shadowColor: gold,
                },
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.center}>
        {/* ── Sri Yantra mandala ── */}
        <View style={styles.mandala}>
          {/* soft radial glow (blooms + breathes) */}
          <Animated.View style={[StyleSheet.absoluteFill, styles.layer, { opacity: glowOp, transform: [{ scale: glowScale }] }]} pointerEvents="none">
            <Svg width={260} height={260} viewBox="0 0 260 260">
              <Defs>
                <RadialGradient id="spGlow" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor={theme.isDark ? '#e9c873' : '#d6a23c'} stopOpacity={0.6} />
                  <Stop offset="55%" stopColor={theme.isDark ? '#e9c873' : '#d6a23c'} stopOpacity={0.1} />
                  <Stop offset="100%" stopColor="#000" stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Circle cx={130} cy={130} r={130} fill="url(#spGlow)" />
            </Svg>
          </Animated.View>

          {/* petal ring (reveal + slow CW) */}
          <Animated.View style={[styles.layer, { opacity: ring, transform: [{ rotate: rot(spin) }, { scale: ringScale }] }]}>
            <PetalRing stroke={gold} faint={goldFaint} />
          </Animated.View>
          {/* yantra triangles (reveal + slow CCW) */}
          <Animated.View style={[styles.layer, { opacity: tri, transform: [{ rotate: rot(spinRev, true) }, { scale: triScale }] }]}>
            <YantraStar stroke={gold} />
          </Animated.View>

          {/* three orbiting sparks at different radii/speeds */}
          <Spark track={150} orbit={orbit2} size={4} />
          <Spark track={196} orbit={orbit1} size={6} />
          <Spark track={228} orbit={orbit3} size={3.5} />

          {/* bindu halo + bindu (pop + breathe) */}
          <Animated.View style={[styles.halo, { backgroundColor: gold, opacity: haloOp, transform: [{ scale: haloScale }] }]} pointerEvents="none" />
          <Animated.View style={[styles.bindu, { backgroundColor: gold, shadowColor: gold, transform: [{ scale: binduScale }] }]} />
        </View>

        {/* ── name + tagline ── */}
        <Animated.View style={{ opacity: name, transform: [{ translateY: nameRise }], alignItems: 'center', marginTop: 30 }}>
          <ShimmerText style={styles.title}>SHREE YANTRA</ShimmerText>
          <View style={styles.subRow}>
            <View style={[styles.subLine, { backgroundColor: goldFaint }]} />
            <Text style={[styles.sub, { color: theme.gold2 }]}>ASTROLOGY</Text>
            <View style={[styles.subLine, { backgroundColor: goldFaint }]} />
          </View>
          <Text style={[styles.tag, { color: theme.textSoft }]}>“Aligning your path with the cosmos”</Text>
        </Animated.View>

        {/* ── refined loader ── */}
        <Animated.View style={[styles.progress, { opacity: name, backgroundColor: theme.isDark ? 'rgba(201,150,46,0.14)' : 'rgba(176,115,22,0.16)' }]}>
          <Animated.View style={[styles.barWrap, { transform: [{ translateX: slide }] }]}>
            <View style={[styles.barFill, { backgroundColor: gold }]} />
          </Animated.View>
        </Animated.View>
        <Animated.Text style={[styles.foot, { opacity: name, color: theme.isDark ? 'rgba(216,203,168,0.7)' : '#6d5b38' }]}>PREPARING YOUR DIVINE EXPERIENCE</Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject },
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },

  starField: { width: 260, height: 260, alignItems: 'center', justifyContent: 'center', marginBottom: 120 },
  star: { position: 'absolute', shadowOpacity: 0.9, shadowRadius: 4, shadowOffset: { width: 0, height: 0 }, elevation: 4 },

  mandala: { width: 230, height: 230, alignItems: 'center', justifyContent: 'center' },
  layer: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  orbitTrack: { alignItems: 'center' },
  spark: { shadowOpacity: 0.95, shadowRadius: 7, shadowOffset: { width: 0, height: 0 }, elevation: 6 },
  halo: { position: 'absolute', width: 40, height: 40, borderRadius: 20 },
  bindu: { width: 13, height: 13, borderRadius: 6.5, shadowOpacity: 0.95, shadowRadius: 16, shadowOffset: { width: 0, height: 0 }, elevation: 10 },

  title: { fontFamily: fonts.cinzelXBold, fontSize: 29, letterSpacing: 6, textAlign: 'center' },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 },
  subLine: { width: 26, height: 1 },
  sub: { fontFamily: fonts.cinzelSemi, fontSize: 11, letterSpacing: 5, textAlign: 'center' },
  tag: { fontFamily: fonts.cormorant, fontSize: 17, marginTop: 16, textAlign: 'center', maxWidth: 320 },

  progress: { marginTop: 30, width: 200, height: 3, borderRadius: 999, overflow: 'hidden' },
  barWrap: { width: 50, height: 3 },
  barFill: { flex: 1, borderRadius: 999 },
  foot: { marginTop: 20, fontFamily: fonts.inter, fontSize: 10.5, letterSpacing: 2, textAlign: 'center' },
});
