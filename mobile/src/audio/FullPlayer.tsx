import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, Theme } from '../theme/tokens';
import { CosmicBackground } from '../components/CosmicBackground';
import { GradientText } from '../components/GradientText';
import { Seekbar } from './Seekbar';
import { usePlayer, usePlayerTime, fmtTime, SHEET_SPRING } from './PlayerProvider';
import { PlayIcon, PauseIcon, PrevIcon, NextIcon, BookmarkIcon, SkipIcon, EqBars, SpringPressable } from './PlayerIcons';
import { toggleSaved, useLibraryStore } from '../lib/libraryStore';
import { TrackColor } from '../data/library';
import { useLang } from '../i18n/LanguageProvider';
import { hTap, hPress, hSelect } from '../lib/haptics';

/* track accent → theme hex (same mapping as the Library's colorFor) */
const tintFor = (theme: Theme, c: TrackColor) =>
  c === 'purple' ? theme.purple : c === 'green' ? theme.green : c === 'blue' ? theme.blue : c === 'rose' ? theme.red : theme.gold1;

/* ── Rotating sacred disc — gold mandala medallion, spins while playing ──
 * Transform-only (rotate + opacity) → runs entirely on the UI thread. */
function RotatingDisc({ size, playing, theme, compact }: { size: number; playing: boolean; theme: Theme; compact: boolean }) {
  const rot = useSharedValue(0);
  const glow = useSharedValue(0.16);

  useEffect(() => {
    if (playing) {
      // 360° / 12s, seamless loop (repeat snaps back exactly one revolution)
      rot.value = rot.value % 360;
      rot.value = withRepeat(withTiming(rot.value + 360, { duration: 12000, easing: Easing.linear }), -1, false);
      glow.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.15, { duration: 1500, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      );
    } else {
      cancelAnimation(rot);
      rot.value = rot.value % 360; // freeze where it is
      cancelAnimation(glow);
      glow.value = withTiming(0.16, { duration: 420 });
    }
    return () => { cancelAnimation(rot); cancelAnimation(glow); };
  }, [playing, rot, glow]);

  const discStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rot.value}deg` }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  const ring = theme.gold1;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        pointerEvents="none"
        style={[
          { position: 'absolute', width: size + 34, height: size + 34, borderRadius: (size + 34) / 2, backgroundColor: theme.gold1 },
          glowStyle,
        ]}
      />
      <Animated.View style={[{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }, discStyle]}>
        <LinearGradient
          colors={theme.isDark ? ['#1a1530', '#07071a'] : ['#fff7e0', '#f3e3b8']}
          style={[StyleSheet.absoluteFill, { borderRadius: size / 2, borderWidth: 1, borderColor: theme.cardBorder }]}
        />
        <Svg width={size} height={size} viewBox="0 0 200 200">
          {/* concentric mandala rings */}
          <Circle cx={100} cy={100} r={95} stroke={ring} strokeOpacity={0.5} strokeWidth={1.6} fill="none" />
          <Circle cx={100} cy={100} r={86} stroke={ring} strokeOpacity={0.35} strokeWidth={1.2} strokeDasharray="2 6" fill="none" />
          <Circle cx={100} cy={100} r={74} stroke={ring} strokeOpacity={0.28} strokeWidth={4} strokeDasharray="1 11" fill="none" />
          <Circle cx={100} cy={100} r={62} stroke={ring} strokeOpacity={0.4} strokeWidth={1} strokeDasharray="12 7" fill="none" />
          <Circle cx={100} cy={100} r={50} stroke={ring} strokeOpacity={0.5} strokeWidth={1.2} strokeDasharray="2 4" fill="none" />
          <Circle cx={100} cy={100} r={38} stroke={ring} strokeOpacity={0.3} strokeWidth={1} fill="none" />
          <Circle cx={100} cy={100} r={3} fill={ring} fillOpacity={0.7} />
        </Svg>
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]} pointerEvents="none">
          <Text style={{ color: theme.gold1, fontFamily: fonts.devanagari, fontSize: compact ? 54 : 68, lineHeight: compact ? 66 : 82 }}>ॐ</Text>
        </View>
      </Animated.View>
    </View>
  );
}

/* ── HOT leaf: seekbar + time labels — the ONLY sheet part re-rendering per tick ── */
function SeekSection() {
  const { theme } = useTheme();
  const { seekFraction } = usePlayer();
  const { position, duration } = usePlayerTime();
  const pct = duration > 0 ? position / duration : 0;
  return (
    <View style={styles.seekWrap}>
      <Seekbar progress={pct} onSeek={seekFraction} showThumb />
      <View style={styles.timeRow}>
        <Text style={[styles.time, { color: theme.textMuted }]}>{fmtTime(position)}</Text>
        <Text style={[styles.time, { color: theme.textMuted }]}>{duration > 0 ? fmtTime(duration) : '--:--'}</Text>
      </View>
    </View>
  );
}

/* ── HOT leaf: ±10s — subscribes to time itself so the sheet body never ticks ── */
function SkipButton({ dir }: { dir: -1 | 1 }) {
  const { theme } = useTheme();
  const { seekTo } = usePlayer();
  const { position, duration } = usePlayerTime();
  const onPress = () => {
    hTap();
    const target = dir === -1 ? Math.max(0, position - 10) : position + 10;
    seekTo(duration > 0 ? Math.min(duration, target) : target);
  };
  return (
    <SpringPressable
      onPress={onPress}
      hitSlop={8}
      scaleTo={0.86}
      style={[styles.skipBtn, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.35)' : '#ffffff' }]}
    >
      <SkipIcon color={theme.goldText} size={21} forward={dir === 1} />
    </SpringPressable>
  );
}

export function FullPlayer() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { lang } = useLang();
  const hi = lang === 'hi';
  const { track, isPlaying, toggle, next, prev, expanded, setExpanded, sheetY, screenH, closeSheet } = usePlayer();
  const { saved } = useLibraryStore();
  const { width } = useWindowDimensions();
  const compact = screenH < 720;
  const artSize = Math.min(width - 118, compact ? 172 : 220);

  const minimise = () => { hTap(); closeSheet(); };

  const pan = Gesture.Pan()
    .activeOffsetY([-8, 8])
    .failOffsetX([-34, 34])
    .onUpdate((event) => {
      // drag DOWN follows the finger; tiny rubber-band on up
      sheetY.value = event.translationY > 0 ? event.translationY : Math.max(-16, event.translationY * 0.08);
    })
    .onEnd((event) => {
      if (event.translationY > screenH * 0.14 || event.velocityY > 850) {
        sheetY.value = withTiming(screenH, { duration: 210 }, (finished) => {
          if (finished) runOnJS(setExpanded)(false);
        });
      } else {
        sheetY.value = withSpring(0, { ...SHEET_SPRING, velocity: event.velocityY });
      }
    })
    .onFinalize(() => {
      if (sheetY.value < 0) sheetY.value = withSpring(0, SHEET_SPRING);
    });

  // The player GROWS out of the docked mini-bar (≈120px above the bottom inset) instead of
  // sliding up from the very bottom — a container-transform feel. Uniform scale keeps the
  // content undistorted; opacity + backdrop fade in as it expands. Drives off the shared
  // sheetY so it follows the finger during the drag.
  const originY = Math.max(0, screenH - insets.bottom - 120);

  const sheetStyle = useAnimatedStyle(() => {
    const p = interpolate(sheetY.value, [0, screenH], [1, 0], Extrapolation.CLAMP); // 1 open, 0 collapsed
    return {
      opacity: interpolate(p, [0, 0.35], [0, 1], Extrapolation.CLAMP),
      transform: [
        { translateY: interpolate(p, [0, 1], [34, 0], Extrapolation.CLAMP) },
        { scale: interpolate(p, [0, 1], [0.46, 1], Extrapolation.CLAMP) },
      ],
    };
  });

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(sheetY.value, [0, screenH], [1, 0], Extrapolation.CLAMP),
  }));

  if (!expanded || !track) return null;

  const isSaved = saved.includes(track.id);
  const tint = tintFor(theme, track.color);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.host, { transformOrigin: ['50%', originY, 0] }, sheetStyle]}>
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
        <LinearGradient colors={theme.bgGradient} style={StyleSheet.absoluteFill} />
        <CosmicBackground />
        {/* subtle track-colour tint washing down from the top */}
        <LinearGradient
          colors={[tint + (theme.isDark ? '3a' : '1f'), tint + '00']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.75 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      </Animated.View>

      <GestureDetector gesture={pan}>
        {/* collapsable={false}: Android par RNGH is View ko collapse na kare, warna drag/pan fire nahi hota */}
        <View style={styles.sheetContent} collapsable={false}>
          <View style={{ paddingTop: insets.top + 8 }}>
            <View style={styles.headerRow}>
              <Pressable onPress={minimise} hitSlop={10} style={({ pressed }) => [styles.iconBtn, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.45)' : '#ffffff' }, pressed && { transform: [{ scale: 0.92 }] }]}>
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={theme.gold1} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M6 9l6 6 6-6" /></Svg>
              </Pressable>
              <Text style={[styles.eyebrow, { color: theme.isDark ? '#b89a5b' : theme.textMuted }]}>{hi ? 'अभी बज रहा है' : 'NOW PLAYING'}</Text>
              <Pressable
                onPress={() => { hSelect(); toggleSaved(track.id); }}
                hitSlop={10}
                style={({ pressed }) => [
                  styles.iconBtn,
                  {
                    borderColor: isSaved ? theme.gold1 : theme.cardBorder,
                    backgroundColor: isSaved ? 'rgba(233,184,80,0.16)' : (theme.isDark ? 'rgba(0,0,0,0.45)' : 'rgba(176,115,22,0.06)'),
                  },
                  pressed && { transform: [{ scale: 0.92 }] },
                ]}
              >
                <BookmarkIcon color={isSaved ? theme.gold1 : theme.goldText} active={isSaved} size={18} />
              </Pressable>
            </View>
            <View style={[styles.handle, { backgroundColor: theme.cardBorder }]} />
          </View>

          <View style={[styles.body, compact && styles.bodyCompact]}>
            <View style={[styles.artWrap, compact && styles.artWrapCompact]}>
              <RotatingDisc size={artSize} playing={isPlaying} theme={theme} compact={compact} />
            </View>

            <View style={styles.titleRow}>
              <EqBars color={theme.gold1} playing={isPlaying} height={compact ? 14 : 16} />
              <View style={styles.titleClamp}>
                <GradientText numberOfLines={2} style={[styles.title, compact && styles.titleCompact]}>{track.title}</GradientText>
              </View>
            </View>
            <Text style={[styles.sub, { color: theme.textMuted }]} numberOfLines={2}>{track.sub}</Text>

            <SeekSection />

            <View style={styles.transport}>
              <SkipButton dir={-1} />
              <SpringPressable
                onPress={() => { hTap(); prev(); }}
                hitSlop={8}
                scaleTo={0.88}
                style={[styles.tBtn, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.4)' : '#ffffff' }]}
              >
                <PrevIcon color={theme.goldText} size={22} />
              </SpringPressable>
              <SpringPressable onPress={() => { hPress(); toggle(); }} hitSlop={8} scaleTo={0.9}>
                <LinearGradient colors={theme.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.playBig}>
                  {isPlaying ? <PauseIcon color={theme.goldInk} size={28} /> : <PlayIcon color={theme.goldInk} size={28} />}
                </LinearGradient>
              </SpringPressable>
              <SpringPressable
                onPress={() => { hTap(); next(); }}
                hitSlop={8}
                scaleTo={0.88}
                style={[styles.tBtn, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.4)' : '#ffffff' }]}
              >
                <NextIcon color={theme.goldText} size={22} />
              </SpringPressable>
              <SkipButton dir={1} />
            </View>

            <Text style={[styles.hint, compact && styles.hintCompact, { color: theme.textMuted }]}>
              {hi ? 'छोटा करने के लिए नीचे स्वाइप करें' : 'Swipe down to minimise'}
            </Text>
          </View>
        </View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  host: { zIndex: 50 },
  sheetContent: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18 },
  iconBtn: { width: 42, height: 42, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontFamily: fonts.cinzelSemi, fontSize: 11, letterSpacing: 2.4 },
  handle: { width: 44, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12 },

  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, paddingBottom: 30, gap: 6 },
  bodyCompact: { justifyContent: 'flex-start', paddingTop: 18, paddingBottom: 16 },
  artWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 26 },
  artWrapCompact: { marginBottom: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, maxWidth: '100%', marginTop: 8 },
  titleClamp: { flexShrink: 1 },
  title: { fontFamily: fonts.cinzel, fontSize: 22, fontWeight: '700', textAlign: 'center' },
  titleCompact: { fontSize: 18, lineHeight: 24 },
  sub: { fontFamily: fonts.inter, fontSize: 13, lineHeight: 19, marginTop: 4, marginBottom: 18, textAlign: 'center' },

  seekWrap: { alignSelf: 'stretch', marginTop: 6 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  time: { fontFamily: fonts.inter, fontSize: 11 },

  transport: { alignSelf: 'stretch', marginHorizontal: -14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 26 },
  tBtn: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  skipBtn: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  playBig: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', shadowColor: '#e9b850', shadowOpacity: 0.45, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, elevation: 12 },
  hint: { fontFamily: fonts.inter, fontSize: 11, marginTop: 26, opacity: 0.8 },
  hintCompact: { marginTop: 14 },
});
