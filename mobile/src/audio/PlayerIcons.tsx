import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, { Path, Polygon, Line } from 'react-native-svg';

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

/** Four animated bars — only visible while playing (RN port of the web EQ). */
export function Equalizer({ color, playing }: { color: string; playing: boolean }) {
  const bars = [useRef(new Animated.Value(0.4)).current, useRef(new Animated.Value(0.8)).current, useRef(new Animated.Value(0.5)).current, useRef(new Animated.Value(0.9)).current];
  useEffect(() => {
    if (!playing) { bars.forEach((b) => b.stopAnimation()); return; }
    const loops = bars.map((b, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(b, { toValue: 1, duration: 320 + i * 90, useNativeDriver: false }),
          Animated.timing(b, { toValue: 0.3, duration: 320 + i * 90, useNativeDriver: false }),
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
