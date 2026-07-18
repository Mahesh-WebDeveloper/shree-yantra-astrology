import React from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NAV_CONTENT_HEIGHT, NAV_TOP_RADIUS } from '../navigation/CustomTabBar';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';
import { usePlayer, usePlayerTime, SHEET_SPRING } from './PlayerProvider';
import { PlayIcon, PauseIcon, PrevIcon, NextIcon, CloseIcon, EqBars, BookmarkIcon } from './PlayerIcons';
import { toggleSaved, useLibraryStore } from '../lib/libraryStore';
import { hSelect } from '../lib/haptics';

// Isolated progress line — the ONLY part that re-renders on playback ticks.
// The rest of the bar (title, buttons, gesture) stays still → no per-tick work.
function ProgressLine({ trackColor, fillColor }: { trackColor: string; fillColor: string }) {
  const { position, duration } = usePlayerTime();
  const pct = duration > 0 ? Math.min(100, (position / duration) * 100) : 0;
  return (
    <View style={[styles.progress, { backgroundColor: trackColor }]}>
      <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: fillColor }]} />
    </View>
  );
}

export function NowPlayingBar({ hasBottomNav = true }: { hasBottomNav?: boolean }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { track, isPlaying, toggle, next, prev, stop, setExpanded, openSheet, sheetY, screenH } = usePlayer();
  const { width } = useWindowDimensions();
  const { saved } = useLibraryStore();
  const compact = width < 380;

  // whole-bar spring press feedback (UI-thread transform only)
  const barScale = useSharedValue(1);
  const barPressStyle = useAnimatedStyle(() => ({ transform: [{ scale: barScale.value }] }));

  // Big-music-player style: bar docked rehti hai; swipe UP par PURA full player finger ke
  // saath upar uthta (height grow) hai aur release par smooth spring se khulta hai.
  const pan = Gesture.Pan()
    .activeOffsetY([-10, 10])
    .failOffsetX([-28, 28])
    .onStart(() => {
      // mount the full player just off-screen so it can follow the finger up
      sheetY.value = screenH;
      runOnJS(setExpanded)(true);
    })
    .onUpdate((event) => {
      // drag up (translationY < 0) raises the sheet from the bottom, interactively
      sheetY.value = Math.max(0, Math.min(screenH, screenH + event.translationY));
    })
    .onEnd((event) => {
      const open = event.translationY < -screenH * 0.16 || event.velocityY < -650;
      if (open) {
        sheetY.value = withSpring(0, { ...SHEET_SPRING, velocity: event.velocityY });
      } else {
        sheetY.value = withTiming(screenH, { duration: 200 }, (finished) => {
          if (finished) runOnJS(setExpanded)(false);
        });
      }
    });

  if (!track) return null;

  // DOCKED (tab screens): the bar sits DIRECTLY on the nav bar — same edge-to-edge
  // width, rounded top corners + gold hairline (taken over from the nav bar, whose
  // top squares off underneath) → the two read as one continuous card.
  // FLOATING (screens without the bottom nav): the classic bordered pill.
  const docked = hasBottomNav;
  const dockBottom = insets.bottom + (docked ? NAV_CONTENT_HEIGHT : 14);
  const isSaved = saved.includes(track.id);

  return (
    <View
      style={[styles.wrap, docked ? styles.wrapDocked : styles.wrapFloating, { bottom: dockBottom }]}
      pointerEvents="box-none"
    >
      <GestureDetector gesture={pan}>
        <Animated.View
          collapsable={false}
          style={[
            styles.bar,
            docked ? styles.barDocked : styles.barFloating,
            compact && styles.barCompact,
            {
              // fully opaque: this surface lives inside a transform-animated wrapper
              // (press scale) — translucency would white-composite on Android
              backgroundColor: theme.isDark ? '#0e0e16' : '#fffbf3',
              borderColor: theme.cardBorder,
            },
            barPressStyle,
          ]}
        >
          {docked ? (
            // gold top hairline — the unified card's top-edge accent while music plays
            <LinearGradient
              colors={theme.isDark
                ? ['rgba(252,232,168,0)', 'rgba(252,232,168,0.85)', 'rgba(233,184,80,0.55)', 'rgba(252,232,168,0)']
                : ['rgba(146,64,14,0)', 'rgba(146,64,14,0.55)', 'rgba(146,64,14,0.32)', 'rgba(146,64,14,0)']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.topHairline}
              pointerEvents="none"
            />
          ) : null}
          <View style={[styles.handle, { backgroundColor: theme.cardBorder }]} />
          <ProgressLine trackColor={theme.line} fillColor={theme.gold1} />

          <Pressable
            style={styles.expandZone}
            onPress={openSheet}
            onPressIn={() => { barScale.value = withSpring(0.985, { damping: 22, stiffness: 420, mass: 0.6 }); }}
            onPressOut={() => { barScale.value = withSpring(1, { damping: 15, stiffness: 300, mass: 0.7 }); }}
            hitSlop={4}
          >
            <View style={[styles.art, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.12)' : 'rgba(176,115,22,0.10)' }]}>
              <Text style={[styles.om, { color: theme.gold1, opacity: isPlaying ? 0.28 : 1 }]}>ॐ</Text>
              {isPlaying ? (
                <View style={styles.artEq} pointerEvents="none">
                  <EqBars color={theme.gold1} playing height={13} barWidth={2.5} gap={2} />
                </View>
              ) : null}
            </View>
            <View style={styles.info}>
              <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{track.title}</Text>
              <Text style={[styles.sub, { color: theme.textMuted }]} numberOfLines={1}>{track.sub}</Text>
            </View>
          </Pressable>

          {!compact ? <Pressable onPress={prev} hitSlop={8} style={styles.btn}><PrevIcon color={theme.goldText} /></Pressable> : null}
          <Pressable onPress={toggle} hitSlop={8} style={styles.playBtn}>
            <View style={[styles.playInner, { backgroundColor: theme.gold1 }]}>
              {isPlaying ? <PauseIcon color={theme.goldInk} size={16} /> : <PlayIcon color={theme.goldInk} size={16} />}
            </View>
          </Pressable>
          {!compact ? <Pressable onPress={next} hitSlop={8} style={styles.btn}><NextIcon color={theme.goldText} /></Pressable> : null}
          <Pressable
            onPress={() => { hSelect(); toggleSaved(track.id); }}
            hitSlop={8}
            style={[styles.btn, isSaved && { backgroundColor: 'rgba(233,184,80,0.16)', borderRadius: 15 }]}
          >
            <BookmarkIcon color={isSaved ? theme.gold1 : theme.textMuted} active={isSaved} />
          </Pressable>
          <Pressable onPress={stop} hitSlop={8} style={styles.btn}><CloseIcon color={theme.textMuted} /></Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute' },
  wrapFloating: { left: 12, right: 12 },
  wrapDocked: { left: 0, right: 0 },
  bar: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingTop: 14, paddingBottom: 9,
    overflow: 'hidden',
  },
  /* classic pill on screens without the bottom nav */
  barFloating: {
    borderRadius: 16, borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 10,
  },
  /* docked on the nav bar: takes the unified card's rounded top; square bottom sits
     flush on the nav bar. elevation 0 → no Android shadow smudge on the seam. */
  barDocked: {
    borderTopLeftRadius: NAV_TOP_RADIUS, borderTopRightRadius: NAV_TOP_RADIUS,
    paddingHorizontal: 14,
    shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: -8 },
    elevation: 0,
  },
  barCompact: { gap: 6, paddingHorizontal: 8 },
  topHairline: { position: 'absolute', top: 0, left: 0, right: 0, height: 1.5 },
  handle: { position: 'absolute', top: 5, alignSelf: 'center', width: 36, height: 3, borderRadius: 2, opacity: 0.9 },
  /* progress line lives at the BOTTOM edge — in docked mode it doubles as the fine
     seam between player and nav bar within the unified card */
  progress: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2 },
  progressFill: { height: 2 },
  expandZone: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 0 },
  art: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  om: { fontSize: 18, fontFamily: fonts.devanagari },
  artEq: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, minWidth: 0 },
  title: { fontFamily: fonts.interSemi, fontSize: 13 },
  sub: { fontFamily: fonts.inter, fontSize: 10.5, marginTop: 1 },
  btn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  playBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  playInner: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});
