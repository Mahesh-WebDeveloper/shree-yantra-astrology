import React from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';
import { usePlayer } from './PlayerProvider';
import { PlayIcon, PauseIcon, PrevIcon, NextIcon, CloseIcon, Equalizer, BookmarkIcon } from './PlayerIcons';
import { toggleSaved, useLibraryStore } from '../lib/libraryStore';
import { hSelect } from '../lib/haptics';

export function NowPlayingBar({ hasBottomNav = true }: { hasBottomNav?: boolean }) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { track, isPlaying, position, duration, toggle, next, prev, stop, setExpanded } = usePlayer();
  const { width } = useWindowDimensions();
  const { saved } = useLibraryStore();
  const compact = width < 380;

  // Big-music-player style: bar docked rehti hai; swipe UP => full player khulta hai.
  // Drag karne par sirf halka follow (feedback), bar idhar-udhar float NAHI hoti.
  const dragFeedback = useSharedValue(0);

  const pan = Gesture.Pan()
    .activeOffsetY([-10, 10])
    .failOffsetX([-28, 28])
    .onUpdate((event) => {
      // upar drag -> bar thoda follow kare (max 56px); neeche drag -> halka resist
      dragFeedback.value = event.translationY < 0
        ? Math.max(-56, event.translationY * 0.6)
        : Math.min(8, event.translationY * 0.1);
    })
    .onEnd((event) => {
      const open = event.translationY < -56 || event.velocityY < -650;
      dragFeedback.value = withTiming(0, { duration: 180 });
      if (open) runOnJS(setExpanded)(true);
    })
    .onFinalize(() => {
      dragFeedback.value = withTiming(0, { duration: 180 });
    });

  const barAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: dragFeedback.value }],
  }));

  if (!track) return null;

  const pct = duration > 0 ? Math.min(100, (position / duration) * 100) : 0;
  const dockBottom = insets.bottom + (hasBottomNav ? 92 : 14);
  const isSaved = saved.includes(track.id);

  return (
    <View style={[styles.wrap, { bottom: dockBottom }]} pointerEvents="box-none">
      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            styles.bar,
            compact && styles.barCompact,
            {
              backgroundColor: theme.isDark ? 'rgba(14,14,22,0.97)' : 'rgba(255,251,243,0.98)',
              borderColor: theme.cardBorder,
            },
            barAnimStyle,
          ]}
        >
          <View style={[styles.handle, { backgroundColor: theme.cardBorder }]} />
          <View style={[styles.progress, { backgroundColor: theme.line }]}>
            <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: theme.gold1 }]} />
          </View>

          <Pressable style={styles.expandZone} onPress={() => setExpanded(true)} hitSlop={4}>
            <View style={[styles.art, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.12)' : 'rgba(176,115,22,0.10)' }]}>
              {isPlaying ? <Equalizer color={theme.gold1} playing /> : <Text style={[styles.om, { color: theme.gold1 }]}>ॐ</Text>}
            </View>
            <View style={styles.info}>
              <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{track.title}</Text>
              <Text style={[styles.sub, { color: theme.textMuted }]} numberOfLines={1}>{track.sub}</Text>
            </View>
          </Pressable>

          {!compact ? <Pressable onPress={prev} hitSlop={8} style={styles.btn}><PrevIcon color={theme.goldText} /></Pressable> : null}
          <Pressable onPress={toggle} hitSlop={8} style={styles.playBtn}>
            <View style={[styles.playInner, { backgroundColor: theme.gold1 }]}>
              {isPlaying ? <PauseIcon color={theme.buttonInk} size={16} /> : <PlayIcon color={theme.buttonInk} size={16} />}
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
  wrap: { position: 'absolute', left: 12, right: 12 },
  bar: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingTop: 14, paddingBottom: 8,
    borderRadius: 16, borderWidth: 1, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 10,
  },
  barCompact: { gap: 6, paddingHorizontal: 8 },
  handle: { position: 'absolute', top: 5, alignSelf: 'center', width: 36, height: 3, borderRadius: 2, opacity: 0.9 },
  progress: { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },
  progressFill: { height: 2 },
  expandZone: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 0 },
  art: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  om: { fontSize: 18, fontFamily: fonts.devanagari },
  info: { flex: 1, minWidth: 0 },
  title: { fontFamily: fonts.interSemi, fontSize: 13 },
  sub: { fontFamily: fonts.inter, fontSize: 10.5, marginTop: 1 },
  btn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  playBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  playInner: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});
