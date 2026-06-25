import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, Pressable, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';
import { CosmicBackground } from '../components/CosmicBackground';
import { GradientText } from '../components/GradientText';
import { Seekbar } from './Seekbar';
import { usePlayer, fmtTime } from './PlayerProvider';
import { PlayIcon, PauseIcon, PrevIcon, NextIcon, Equalizer, BookmarkIcon } from './PlayerIcons';
import { toggleSaved, useLibraryStore } from '../lib/libraryStore';
import { hTap, hPress, hSelect } from '../lib/haptics';

export function FullPlayer() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { track, isPlaying, position, duration, toggle, next, prev, seekFraction, expanded, setExpanded } = usePlayer();
  const { saved } = useLibraryStore();
  const { height: screenH, width } = useWindowDimensions();
  const compact = screenH < 720;
  const artSize = Math.min(width - 118, compact ? 172 : 220);

  const sheetY = useSharedValue(screenH);

  useEffect(() => {
    if (expanded) {
      sheetY.value = screenH;
      sheetY.value = withSpring(0, { damping: 24, stiffness: 230, mass: 0.75 });
    }
  }, [expanded, screenH, sheetY]);

  const minimise = () => {
    hTap();
    sheetY.value = withTiming(screenH, { duration: 220 }, (finished) => {
      if (finished) runOnJS(setExpanded)(false);
    });
  };

  const pan = Gesture.Pan()
    .activeOffsetY([-8, 8])
    .failOffsetX([-34, 34])
    .onUpdate((event) => {
      sheetY.value = event.translationY > 0 ? event.translationY : Math.max(-16, event.translationY * 0.08);
    })
    .onEnd((event) => {
      if (event.translationY > screenH * 0.14 || event.velocityY > 850) {
        sheetY.value = withTiming(screenH, { duration: 210 }, (finished) => {
          if (finished) runOnJS(setExpanded)(false);
        });
      } else {
        sheetY.value = withSpring(0, { damping: 24, stiffness: 230, mass: 0.75, velocity: event.velocityY });
      }
    })
    .onFinalize(() => {
      if (sheetY.value < 0) sheetY.value = withSpring(0, { damping: 24, stiffness: 230, mass: 0.75 });
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(sheetY.value, [0, screenH], [1, 0], Extrapolation.CLAMP),
  }));

  if (!expanded || !track) return null;

  const pct = duration > 0 ? position / duration : 0;
  const isSaved = saved.includes(track.id);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.host, sheetStyle]}>
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
        <LinearGradient colors={theme.bgGradient} style={StyleSheet.absoluteFill} />
        <CosmicBackground />
      </Animated.View>

      <GestureDetector gesture={pan}>
        {/* collapsable={false}: Android par RNGH is View ko collapse na kare, warna drag/pan fire nahi hota */}
        <View style={styles.sheetContent} collapsable={false}>
          <View style={{ paddingTop: insets.top + 8 }}>
            <View style={styles.headerRow}>
              <Pressable onPress={minimise} hitSlop={10} style={({ pressed }) => [styles.iconBtn, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.45)' : 'rgba(176,115,22,0.06)' }, pressed && { transform: [{ scale: 0.92 }] }]}>
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={theme.gold1} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M6 9l6 6 6-6" /></Svg>
              </Pressable>
              <Text style={[styles.eyebrow, { color: theme.isDark ? '#b89a5b' : '#8a6f3a' }]}>NOW PLAYING</Text>
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
              <View style={[styles.artGlow, { width: artSize + 28, height: artSize + 28, borderRadius: artSize, backgroundColor: theme.gold1 }]} />
              <LinearGradient colors={theme.isDark ? ['#1a1530', '#07071a'] : ['#fff7e0', '#f3e3b8']} style={[styles.art, { width: artSize, height: artSize, borderRadius: compact ? 22 : 28, borderColor: theme.cardBorder }]}>
                {isPlaying ? <Equalizer color={theme.gold1} playing /> : <Text style={[styles.artOm, compact && styles.artOmCompact, { color: theme.gold1 }]}>ॐ</Text>}
              </LinearGradient>
            </View>

            <GradientText style={[styles.title, compact && styles.titleCompact]}>{track.title}</GradientText>
            <Text style={[styles.sub, { color: theme.textMuted }]} numberOfLines={2}>{track.sub}</Text>

            <View style={styles.seekWrap}>
              <Seekbar progress={pct} onSeek={seekFraction} showThumb />
              <View style={styles.timeRow}>
                <Text style={[styles.time, { color: theme.textMuted }]}>{fmtTime(position)}</Text>
                <Text style={[styles.time, { color: theme.textMuted }]}>{duration > 0 ? fmtTime(duration) : '--:--'}</Text>
              </View>
            </View>

            <View style={styles.transport}>
              <Pressable onPress={() => { hTap(); prev(); }} hitSlop={10} style={({ pressed }) => [styles.tBtn, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.4)' : 'rgba(176,115,22,0.06)' }, pressed && { transform: [{ scale: 0.92 }] }]}>
                <PrevIcon color={theme.goldText} size={22} />
              </Pressable>
              <Pressable onPress={() => { hPress(); toggle(); }} hitSlop={10} style={({ pressed }) => [pressed && { transform: [{ scale: 0.95 }] }]}>
                <LinearGradient colors={['#fce8a8', '#e9b850', '#b87f1a']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.playBig}>
                  {isPlaying ? <PauseIcon color="#211300" size={28} /> : <PlayIcon color="#211300" size={28} />}
                </LinearGradient>
              </Pressable>
              <Pressable onPress={() => { hTap(); next(); }} hitSlop={10} style={({ pressed }) => [styles.tBtn, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.4)' : 'rgba(176,115,22,0.06)' }, pressed && { transform: [{ scale: 0.92 }] }]}>
                <NextIcon color={theme.goldText} size={22} />
              </Pressable>
            </View>

            <Text style={[styles.hint, compact && styles.hintCompact, { color: theme.textMuted }]}>Swipe down to minimise</Text>
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
  artGlow: { position: 'absolute', opacity: 0.18 },
  art: { borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  artOm: { fontSize: 96, fontFamily: fonts.devanagari, lineHeight: 110 },
  artOmCompact: { fontSize: 78, lineHeight: 90 },
  title: { fontFamily: fonts.cinzel, fontSize: 22, fontWeight: '700', textAlign: 'center', marginTop: 8 },
  titleCompact: { fontSize: 18, lineHeight: 24 },
  sub: { fontFamily: fonts.inter, fontSize: 13, lineHeight: 19, marginTop: 4, marginBottom: 18, textAlign: 'center' },

  seekWrap: { alignSelf: 'stretch', marginTop: 6 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  time: { fontFamily: fonts.inter, fontSize: 11 },

  transport: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28, marginTop: 26 },
  tBtn: { width: 56, height: 56, borderRadius: 28, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  playBig: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', shadowColor: '#e9b850', shadowOpacity: 0.45, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, elevation: 12 },
  hint: { fontFamily: fonts.inter, fontSize: 11, marginTop: 26, opacity: 0.8 },
  hintCompact: { marginTop: 14 },
});
