import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect, Circle } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';

export function CosmicBackground() {
  const { theme } = useTheme();
  if (!theme.isDark) {
    return (
      <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="none">
        <Defs>
          <RadialGradient id="lg1" cx="18%" cy="5%" r="42%">
            <Stop offset="0%" stopColor="#f6c84e" stopOpacity={0.5} />
            <Stop offset="100%" stopColor="#fff8ea" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="lg2" cx="88%" cy="18%" r="38%">
            <Stop offset="0%" stopColor="#eaa83c" stopOpacity={0.28} />
            <Stop offset="100%" stopColor="#fff8ea" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="390" height="844" fill="#fff8ea" />
        <Rect width="390" height="844" fill="url(#lg1)" />
        <Rect width="390" height="844" fill="url(#lg2)" />
      </Svg>
    );
  }

  const stars = [
    [47, 185, 0.9], [117, 118, 0.7], [273, 68, 0.7], [359, 320, 0.75],
    [70, 506, 0.7], [250, 608, 0.55], [343, 726, 0.75], [23, 338, 0.6],
  ] as const;

  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="none">
      <Defs>
        <RadialGradient id="g1" cx="12%" cy="8%" r="32%">
          <Stop offset="0%" stopColor="#e9b850" stopOpacity={0.04} />
          <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="g2" cx="88%" cy="18%" r="34%">
          <Stop offset="0%" stopColor="#e9b850" stopOpacity={0.03} />
          <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="g3" cx="10%" cy="90%" r="36%">
          <Stop offset="0%" stopColor="#ffd278" stopOpacity={0.025} />
          <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width="390" height="844" fill="#000000" />
      <Rect width="390" height="844" fill="url(#g1)" />
      <Rect width="390" height="844" fill="url(#g2)" />
      <Rect width="390" height="844" fill="url(#g3)" />
      {stars.map(([cx, cy, opacity], index) => (
        <Circle key={index} cx={cx} cy={cy} r={1} fill={index % 2 ? '#ffffff' : '#fff0c8'} opacity={opacity} />
      ))}
    </Svg>
  );
}
