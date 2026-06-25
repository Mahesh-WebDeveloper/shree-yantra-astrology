import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, ScrollView } from 'react-native';
import Svg, {
  Polygon, Path, Line, Circle, Ellipse, Rect, Polyline, Defs,
  LinearGradient as SvgGrad, RadialGradient, Stop, G,
} from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { Theme, fonts, radii } from '../theme/tokens';
import { Card } from '../components/Card';
import { GradientText } from '../components/GradientText';
import { CosmicBackground } from '../components/CosmicBackground';
import { hSuccess } from '../lib/haptics';
import { useCurrentUser } from '../lib/auth';

const AnimatedPath = Animated.createAnimatedComponent(Path);

/* gold + core gradient defs (web #sa-gold / #sa-core) */
function GoldDefs({ id }: { id: string }) {
  return (
    <Defs>
      <SvgGrad id={`${id}-gold`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0%" stopColor="#fff4cc" />
        <Stop offset="55%" stopColor="#f6c64a" />
        <Stop offset="100%" stopColor="#8a6418" />
      </SvgGrad>
      <RadialGradient id={`${id}-core`} cx="50%" cy="50%" r="50%">
        <Stop offset="0%" stopColor="#1a1530" />
        <Stop offset="100%" stopColor="#07071a" />
      </RadialGradient>
    </Defs>
  );
}

/* ── Brand yantra emblem (web .brand__emblem) ── */
function BrandEmblem() {
  return (
    <Svg width={68} height={68} viewBox="0 0 100 100">
      <GoldDefs id="be" />
      <Circle cx={50} cy={50} r={46} fill="url(#be-core)" stroke="url(#be-gold)" strokeWidth={1.2} />
      <Circle cx={50} cy={50} r={38} fill="none" stroke="url(#be-gold)" strokeWidth={0.7} opacity={0.65} />
      <G fill="none" stroke="url(#be-gold)" strokeWidth={1.6} strokeLinejoin="round">
        <Polygon points="50,18 76,62 24,62" />
        <Polygon points="50,82 24,38 76,38" />
      </G>
      <Circle cx={50} cy={50} r={4} fill="url(#be-gold)" />
    </Svg>
  );
}

/* ── Decorative planets (web .planet--saturn / --mars) ── */
function SaturnPlanet() {
  return (
    <Svg width={210} height={105} viewBox="0 0 120 60">
      <Defs>
        <SvgGrad id="sat-gold" x1="0" y1="0" x2="0" y2="1"><Stop offset="0%" stopColor="#fff4cc" /><Stop offset="55%" stopColor="#f6c64a" /><Stop offset="100%" stopColor="#8a6418" /></SvgGrad>
        <RadialGradient id="sat-body" cx="35%" cy="35%" r="65%"><Stop offset="0%" stopColor="#f1c97a" /><Stop offset="60%" stopColor="#a17613" /><Stop offset="100%" stopColor="#3a2300" /></RadialGradient>
      </Defs>
      <Ellipse cx={60} cy={30} rx={58} ry={9} fill="none" stroke="url(#sat-gold)" strokeWidth={1.2} opacity={0.5} />
      <Ellipse cx={60} cy={30} rx={42} ry={6} fill="none" stroke="url(#sat-gold)" strokeWidth={0.7} opacity={0.4} />
      <Circle cx={60} cy={30} r={22} fill="url(#sat-body)" />
      <Ellipse cx={60} cy={30} rx={58} ry={9} fill="none" stroke="url(#sat-gold)" strokeWidth={1.2} opacity={0.7} strokeDasharray="3 4" />
    </Svg>
  );
}
function MarsPlanet() {
  return (
    <Svg width={140} height={140} viewBox="0 0 80 80">
      <Defs>
        <SvgGrad id="mars-gold" x1="0" y1="0" x2="0" y2="1"><Stop offset="0%" stopColor="#fff4cc" /><Stop offset="55%" stopColor="#f6c64a" /><Stop offset="100%" stopColor="#8a6418" /></SvgGrad>
        <RadialGradient id="mars-body" cx="35%" cy="35%" r="65%"><Stop offset="0%" stopColor="#c46f3a" /><Stop offset="60%" stopColor="#5b2f15" /><Stop offset="100%" stopColor="#1d0a04" /></RadialGradient>
      </Defs>
      <Circle cx={40} cy={40} r={34} fill="url(#mars-body)" />
      <Circle cx={40} cy={40} r={34} fill="none" stroke="url(#mars-gold)" strokeWidth={0.8} opacity={0.55} />
      <Circle cx={28} cy={34} r={4} fill="#3a1d0e" opacity={0.55} />
      <Circle cx={50} cy={48} r={6} fill="#3a1d0e" opacity={0.45} />
    </Svg>
  );
}

/* ── Activation badge — spinning ring + draw-on check + starburst + halo ── */
const CHECK_LEN = 90; // approx path length of the checkmark

function ActivationBadge() {
  const spin = useRef(new Animated.Value(0)).current;
  const halo = useRef(new Animated.Value(0)).current;
  const draw = useRef(new Animated.Value(CHECK_LEN)).current; // dashoffset → 0
  const pop = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    // entrance pop
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
    // slow ring spin (web sa-spin 60s)
    Animated.loop(Animated.timing(spin, { toValue: 1, duration: 60000, easing: Easing.linear, useNativeDriver: true })).start();
    // halo breathe
    Animated.loop(Animated.sequence([
      Animated.timing(halo, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(halo, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ])).start();
    // draw-on check (web sa-check, after 360ms)
    Animated.timing(draw, { toValue: 0, duration: 720, delay: 380, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [spin, halo, draw, pop]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const haloOpacity = halo.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.9] });
  const haloScale = halo.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.08] });

  return (
    <View style={styles.badgeWrap}>
      {/* animated halo glow */}
      <Animated.View style={[styles.halo, { opacity: haloOpacity, transform: [{ scale: haloScale }] }]} pointerEvents="none">
        <Svg width={200} height={200}>
          <Defs>
            <RadialGradient id="haloG" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#ffc450" stopOpacity={0.5} />
              <Stop offset="70%" stopColor="#ffc450" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={100} cy={100} r={100} fill="url(#haloG)" />
        </Svg>
      </Animated.View>

      {/* spinning dashed outer ring */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.badgeCenter, { transform: [{ rotate }] }]} pointerEvents="none">
        <Svg width={150} height={150} viewBox="0 0 140 140">
          <GoldDefs id="ring" />
          <Circle cx={70} cy={70} r={66} fill="none" stroke="url(#ring-gold)" strokeWidth={1} opacity={0.55} strokeDasharray="2 6" />
        </Svg>
      </Animated.View>

      {/* static badge core + spokes + check + sparkles */}
      <Animated.View style={{ transform: [{ scale: pop }] }}>
        <Svg width={150} height={150} viewBox="0 0 140 140">
          <GoldDefs id="bd" />
          <Circle cx={70} cy={70} r={60} fill="none" stroke="url(#bd-gold)" strokeWidth={0.9} opacity={0.75} />
          <Circle cx={70} cy={70} r={50} fill="url(#bd-core)" stroke="url(#bd-gold)" strokeWidth={3} />
          {/* 8 starburst spokes */}
          <G stroke="url(#bd-gold)" strokeLinecap="round" opacity={0.9}>
            <Line x1={70} y1={6} x2={70} y2={14} strokeWidth={2} />
            <Line x1={70} y1={126} x2={70} y2={134} strokeWidth={2} />
            <Line x1={6} y1={70} x2={14} y2={70} strokeWidth={2} />
            <Line x1={126} y1={70} x2={134} y2={70} strokeWidth={2} />
            <Line x1={22} y1={22} x2={28} y2={28} strokeWidth={1.6} />
            <Line x1={112} y1={112} x2={118} y2={118} strokeWidth={1.6} />
            <Line x1={22} y1={118} x2={28} y2={112} strokeWidth={1.6} />
            <Line x1={112} y1={22} x2={118} y2={28} strokeWidth={1.6} />
          </G>
          {/* draw-on checkmark */}
          <AnimatedPath
            d="M44 72 L62 90 L96 50"
            fill="none" stroke="url(#bd-gold)" strokeWidth={6}
            strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={CHECK_LEN} strokeDashoffset={draw}
          />
          {/* sparkles */}
          <G fill="url(#bd-gold)">
            <Circle cx={34} cy={44} r={1.2} />
            <Circle cx={106} cy={56} r={1.5} />
            <Circle cx={50} cy={104} r={1.3} />
            <Circle cx={100} cy={100} r={1} />
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
}

/* trial-detail row icons (web row__icon) */
const ri = (c: string) => ({ width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none' as const, stroke: c, strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const });
function RowIcon({ kind, color }: { kind: string; color: string }) {
  switch (kind) {
    case 'plan': return <Svg {...ri(color)}><Path d="M3 8l4 5 5-9 5 9 4-5-2 13H5z" fill={color} fillOpacity={0.2} /></Svg>;
    case 'amount': return <Svg {...ri(color)}><Circle cx={12} cy={12} r={9} fill={color} fillOpacity={0.12} /><Path d="M8 14a4 4 0 0 0 8 0c0-2-1.5-3-4-3s-4-1-4-3a4 4 0 0 1 8 0" /></Svg>;
    case 'duration': return <Svg {...ri(color)}><Circle cx={12} cy={12} r={10} fill={color} fillOpacity={0.12} /><Polyline points="12 6 12 12 16 14" /></Svg>;
    case 'ends': return <Svg {...ri(color)}><Rect x={3} y={4} width={18} height={18} rx={2} fill={color} fillOpacity={0.12} /><Line x1={16} y1={2} x2={16} y2={6} /><Line x1={8} y1={2} x2={8} y2={6} /><Line x1={3} y1={10} x2={21} y2={10} /></Svg>;
    default: return null;
  }
}

const sw = (c: string) => ({ width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none' as const, stroke: c, strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const });
const PERKS = [
  { label: 'Unlimited\npredictions', icon: (c: string) => <Svg {...sw(c)}><Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></Svg> },
  { label: 'Full kundli\nanalysis', icon: (c: string) => <Svg {...sw(c)}><Rect x={3} y={3} width={18} height={18} /><Line x1={3} y1={3} x2={21} y2={21} /><Line x1={21} y1={3} x2={3} y2={21} /></Svg> },
  { label: 'Divine library\naudio & books', icon: (c: string) => <Svg {...sw(c)}><Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></Svg> },
];

const TRIAL: { k: string; v: string; icon: string; green?: boolean }[] = [
  { k: 'Plan', v: 'Premium Astrology', icon: 'plan' },
  { k: 'Trial Amount', v: '₹1 (Today)', icon: 'amount', green: true },
  { k: 'Trial Duration', v: '7 Days', icon: 'duration' },
  { k: 'Trial Ends', v: '28 May 2025', icon: 'ends' },
];

export function SubscriptionActivatedScreen({ navigation }: any) {
  const { theme } = useTheme();
  const user = useCurrentUser();
  const firstName = (user?.name || 'Friend').trim().split(/\s+/)[0];
  const insets = useSafeAreaInsets();

  const goHome = () => navigation.reset({ index: 0, routes: [{ name: 'Main' }] });

  // celebratory haptic + content reveal on mount, then auto-redirect to home
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    hSuccess();
    Animated.timing(enter, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    // auto-redirect to the welcome/home screen after the celebration
    const t = setTimeout(goHome, 5000);
    return () => clearTimeout(t);
  }, [enter]);
  const entranceStyle = {
    opacity: enter,
    transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
  };

  const dim = theme.isDark ? '#b89a5b' : '#8a6f3a';

  return (
    <LinearGradient colors={theme.bgGradient} style={styles.fill}>
      <CosmicBackground />

      {/* decorative planets */}
      {theme.isDark && (
        <>
          <View style={styles.saturn} pointerEvents="none"><SaturnPlanet /></View>
          <View style={styles.mars} pointerEvents="none"><MarsPlanet /></View>
        </>
      )}

      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 28, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, entranceStyle]}>
        {/* Brand */}
        <View style={styles.brand}>
          <View style={styles.emblem}><BrandEmblem /></View>
          <GradientText style={styles.brandName}>SHREE YANTRA</GradientText>
          <View style={styles.divider}>
            <View style={[styles.line, { backgroundColor: theme.line }]} />
            <Text style={[styles.diamond, { color: theme.gold2 }]}>◆</Text>
            <Text style={[styles.brandSub, { color: theme.text }]}>ASTROLOGY</Text>
            <Text style={[styles.diamond, { color: theme.gold2 }]}>◆</Text>
            <View style={[styles.line, { backgroundColor: theme.line }]} />
          </View>
        </View>

        {/* Badge */}
        <ActivationBadge />

        {/* Headline */}
        <View style={[styles.pill, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.10)' : 'rgba(176,115,22,0.08)' }]}>
          <Text style={[styles.pillText, { color: theme.goldText }]}>PREMIUM · ACTIVE</Text>
        </View>
        <View style={styles.titleRow}>
          <Text style={[styles.spark, { color: theme.gold2 }]}>✦</Text>
          <GradientText style={styles.title}>Subscription Activated</GradientText>
          <Text style={[styles.spark, { color: theme.gold2 }]}>✦</Text>
        </View>
        {/* ornament */}
        <View style={styles.ornament}>
          <View style={[styles.ornLine, { backgroundColor: theme.line }]} />
          <Text style={[styles.diamond, { color: theme.gold2 }]}>◆</Text>
          <View style={[styles.ornLine, { backgroundColor: theme.line }]} />
        </View>
        <Text style={[styles.lead, { color: theme.text }]}>
          Congratulations <Text style={{ fontFamily: fonts.interSemi, color: theme.goldText }}>{firstName}</Text> — your divine guidance journey begins today.
        </Text>
        <Text style={[styles.leadAccent, { color: theme.green }]}>
          Enjoy your <Text style={{ fontFamily: fonts.interBold }}>₹1 for 7 Days</Text> trial access.
        </Text>

        {/* Trial details */}
        <Card style={styles.trialCard} contentStyle={styles.cardInner}>
          <View style={styles.cardTitleRow}>
            <View style={[styles.ornLineShort, { backgroundColor: theme.line }]} />
            <Text style={[styles.diamondSm, { color: theme.gold2 }]}>◆</Text>
            <Text style={[styles.cardTitle, { color: dim }]}>TRIAL DETAILS</Text>
            <Text style={[styles.diamondSm, { color: theme.gold2 }]}>◆</Text>
            <View style={[styles.ornLineShort, { backgroundColor: theme.line }]} />
          </View>
          {TRIAL.map((it, i) => (
            <View key={it.k} style={[styles.row, { borderBottomColor: theme.line }, i === TRIAL.length - 1 && styles.noBorder]}>
              <View style={[styles.rowIc, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.4)' : 'rgba(176,115,22,0.06)' }]}>
                <RowIcon kind={it.icon} color={theme.gold1} />
              </View>
              <Text style={[styles.rowK, { color: theme.text }]} numberOfLines={1}>{it.k}</Text>
              <Text style={[styles.rowV, { color: it.green ? theme.green : theme.goldText }]} numberOfLines={1}>{it.v}</Text>
            </View>
          ))}
        </Card>

        {/* Perks */}
        <View style={styles.perks}>
          {PERKS.map((p) => (
            <View key={p.label} style={styles.perk}>
              <View style={[styles.perkIc, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.10)' : 'rgba(176,115,22,0.08)' }]}>
                {p.icon(theme.gold1)}
              </View>
              <Text style={[styles.perkText, { color: theme.textSoft }]}>{p.label}</Text>
            </View>
          ))}
        </View>

        {/* auto-redirect hint — buttons removed since we navigate home automatically */}
        <View style={styles.redirectRow}>
          <Text style={[styles.dot, { color: theme.gold2 }]}>◆</Text>
          <Text style={[styles.redirectText, { color: dim }]}>Taking you home…</Text>
          <Text style={[styles.dot, { color: theme.gold2 }]}>◆</Text>
        </View>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingHorizontal: 22, alignItems: 'center' },
  saturn: { position: 'absolute', top: 70, right: -56, opacity: 0.55, transform: [{ rotate: '-14deg' }] },
  mars: { position: 'absolute', bottom: 150, left: -46, opacity: 0.42 },

  brand: { alignItems: 'center' },
  emblem: { marginBottom: 12, shadowColor: '#e9b850', shadowOpacity: 0.32, shadowRadius: 20, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
  brandName: { fontFamily: fonts.cinzel, fontSize: 26, letterSpacing: 3.5 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 8 },
  line: { width: 32, height: 1 },
  diamond: { fontSize: 9 },
  brandSub: { fontFamily: fonts.cinzelSemi, fontSize: 10.5, letterSpacing: 4.5 },

  badgeWrap: { width: 188, height: 188, alignItems: 'center', justifyContent: 'center', marginTop: 10, marginBottom: 4 },
  badgeCenter: { alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', width: 200, height: 200, alignItems: 'center', justifyContent: 'center' },

  pill: { paddingHorizontal: 13, paddingVertical: 6, borderRadius: radii.pill, borderWidth: 1, marginTop: 6 },
  pillText: { fontFamily: fonts.interSemi, fontSize: 10.5, letterSpacing: 2.2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  spark: { fontSize: 14 },
  title: { fontFamily: fonts.cinzel, fontSize: 25, textAlign: 'center', lineHeight: 30 },
  ornament: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  ornLine: { width: 40, height: 1 },
  lead: { fontFamily: fonts.inter, fontSize: 14.5, lineHeight: 22, textAlign: 'center', marginTop: 14, paddingHorizontal: 6 },
  leadAccent: { fontFamily: fonts.interMed, fontSize: 14.5, textAlign: 'center', marginTop: 12 },

  trialCard: { marginTop: 22, alignSelf: 'stretch' },
  cardInner: { paddingHorizontal: 18, paddingVertical: 16 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 },
  ornLineShort: { width: 22, height: 1 },
  diamondSm: { fontSize: 8 },
  cardTitle: { fontFamily: fonts.cinzelSemi, fontSize: 12, letterSpacing: 2.2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  noBorder: { borderBottomWidth: 0 },
  rowIc: { width: 34, height: 34, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  rowK: { flex: 1, fontFamily: fonts.interMed, fontSize: 13.5 },
  rowV: { fontFamily: fonts.interSemi, fontSize: 13.5 },

  perks: { flexDirection: 'row', gap: 10, marginTop: 18, alignSelf: 'stretch' },
  perk: { flex: 1, alignItems: 'center', gap: 8 },
  perkIc: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  perkText: { fontFamily: fonts.inter, fontSize: 11, textAlign: 'center', lineHeight: 15 },

  redirectRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 26 },
  redirectText: { fontFamily: fonts.interMed, fontSize: 12.5, letterSpacing: 0.6 },
  dot: { fontSize: 8 },
});
