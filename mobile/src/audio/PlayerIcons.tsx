import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Pressable, StyleProp, ViewStyle } from 'react-native';
import Reanimated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path, Polygon, Line, Text as SvgText } from 'react-native-svg';

export const PlayIcon = ({ color, size = 18 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Polygon points="6 4 20 12 6 20 6 4" /></Svg>
);
export const PauseIcon = ({ color, size = 18 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Path d="M6 5h4v14H6zM14 5h4v14h-4z" /></Svg>
);
export const PrevIcon = ({ color, size = 16 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Polygon points="18 5 9 12 18 19 18 5" /><Path d="M7 5h2v14H7z" /></Svg>
);
export const NextIcon = ({ color, size = 16 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}><Polygon points="6 5 15 12 6 19 6 5" /><Path d="M15 5h2v14h-2z" /></Svg>
);
export const CloseIcon = ({ color, size = 14 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round"><Line x1={6} y1={6} x2={18} y2={18} /><Line x1={18} y1={6} x2={6} y2={18} /></Svg>
);
export const BookmarkIcon = ({ color, active, size = 16 }: { color: string; active?: boolean; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={active ? color : 'none'} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
  </Svg>
);

/** Skip ±10s — circular arrow arc with a "10" numeral (lucide rotate-cw/ccw arcs). */
export const SkipIcon = ({ color, size = 22, forward }: { color: string; size?: number; forward?: boolean }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
    {forward ? (
      <>
        <Path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
        <Path d="M21 3v5h-5" />
      </>
    ) : (
      <>
        <Path d="M3 12a9 9 0 1 0 9-9c-2.52 0-4.93 1-6.74 2.74L3 8" />
        <Path d="M3 3v5h5" />
      </>
    )}
    <SvgText x={12} y={15.2} textAnchor="middle" fontSize={8} fontWeight="bold" fill={color} stroke="none">10</SvgText>
  </Svg>
);

/* ── Reanimated eq bars — tiny "now playing" indicator (UI-thread transforms only) ── */
const EQ_BASE = [0.72, 1, 0.58] as const;

function EqBarRe({ color, playing, index, height, barWidth }: { color: string; playing: boolean; index: number; height: number; barWidth: number }) {
  const s = useSharedValue(0.35);
  useEffect(() => {
    if (playing) {
      s.value = withDelay(
        index * 120,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 300 + index * 80, easing: Easing.inOut(Easing.quad) }),
            withTiming(0.28, { duration: 300 + index * 80, easing: Easing.inOut(Easing.quad) })
          ),
          -1,
          false
        )
      );
    } else {
      cancelAnimation(s);
      s.value = withTiming(0.35, { duration: 160 });
    }
    return () => cancelAnimation(s);
  }, [playing, index, s]);
  const st = useAnimatedStyle(() => ({ transform: [{ scaleY: s.value }] }));
  return (
    <Reanimated.View
      style={[{ width: barWidth, height: height * EQ_BASE[index % 3], borderRadius: barWidth / 2, backgroundColor: color }, st]}
    />
  );
}

/** Three staggered gold bars (Reanimated) — freezes softly when paused. */
export function EqBars({ color, playing, height = 14, barWidth = 3, gap = 2.5 }: {
  color: string; playing: boolean; height?: number; barWidth?: number; gap?: number;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap, height }}>
      {[0, 1, 2].map((i) => (
        <EqBarRe key={i} color={color} playing={playing} index={i} height={height} barWidth={barWidth} />
      ))}
    </View>
  );
}

/* ── Spring-press wrapper — scale bounce on press (worklet transform, zero JS/frame) ── */
const AnimatedPressable = Reanimated.createAnimatedComponent(Pressable);

export function SpringPressable({ children, onPress, style, scaleTo = 0.92, hitSlop, disabled }: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  hitSlop?: number;
  disabled?: boolean;
}) {
  const s = useSharedValue(1);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <AnimatedPressable
      disabled={disabled}
      hitSlop={hitSlop}
      onPressIn={() => { s.value = withSpring(scaleTo, { damping: 22, stiffness: 420, mass: 0.6 }); }}
      onPressOut={() => { s.value = withSpring(1, { damping: 14, stiffness: 300, mass: 0.7 }); }}
      onPress={onPress}
      style={[style, a]}
    >
      {children}
    </AnimatedPressable>
  );
}

/** Four animated bars — only visible while playing (RN port of the web EQ). */
export function Equalizer({ color, playing }: { color: string; playing: boolean }) {
  const bars = [useRef(new Animated.Value(0.4)).current, useRef(new Animated.Value(0.8)).current, useRef(new Animated.Value(0.5)).current, useRef(new Animated.Value(0.9)).current];
  useEffect(() => {
    if (!playing) { bars.forEach((b) => b.stopAnimation()); return; }
    const loops = bars.map((b, i) =>
      Animated.loop(
        Animated.sequence([
          // scaleY is a transform → native driver (runs on the UI thread; zero JS work per frame)
          Animated.timing(b, { toValue: 1, duration: 320 + i * 90, useNativeDriver: true }),
          Animated.timing(b, { toValue: 0.3, duration: 320 + i * 90, useNativeDriver: true }),
        ])
      )
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [playing]);

  return (
    <View style={styles.eq}>
      {bars.map((b, i) => (
        <Animated.View
          key={i}
          style={[styles.bar, { backgroundColor: color, transform: [{ scaleY: b }] }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  eq: { flexDirection: 'row', alignItems: 'center', gap: 2, width: 18, height: 16 },
  bar: { width: 3, height: 16, borderRadius: 2 },
});
