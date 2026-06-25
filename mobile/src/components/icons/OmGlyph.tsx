import React from 'react';
import Svg, { Defs, LinearGradient, Stop, G, Path, Circle } from 'react-native-svg';

/**
 * Stylised Om — ported 1:1 from the web auth hero
 * (pages/signin/index.html #syOm). Gold vertical gradient.
 */
export function OmGlyph({ size = 64, colors }: { size?: number; colors?: [string, string, string] }) {
  const [a, b, c] = colors ?? ['#fff4cc', '#f6c64a', '#a17613'];
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="syOm" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={a} />
          <Stop offset="55%" stopColor={b} />
          <Stop offset="100%" stopColor={c} />
        </LinearGradient>
      </Defs>
      <G fill="url(#syOm)">
        <Path d="M48 38c-9 0-15 5-15 13 0 7 5 12 12 12 4 0 7-2 8-5l-3-2c-1 2-3 3-5 3-3 0-6-3-6-7s3-7 8-7c7 0 12 6 12 13s-6 14-15 14-16-7-16-16c0-3 .6-6 2-9l-4-2c-1.6 3.6-2.5 7.2-2.5 11 0 12 8.6 21 20.5 21 11.6 0 20-9 20-20 0-11-7.5-19-16-19z" />
        <Path d="M68 38c-2 0-4 1-5 3l3 2c.5-1 1.5-1.5 2.5-1.5 2 0 3 1.5 3 4 0 3-2 5-5 5l1 4c5 0 9-3 9-9 0-4.5-3-7.5-8.5-7.5z" />
        <Path d="M50 22c5 0 9 1 12 4l-2 2c-2-2-6-3-10-3z" opacity={0.95} />
        <Circle cx={50} cy={16} r={3.2} />
      </G>
    </Svg>
  );
}
