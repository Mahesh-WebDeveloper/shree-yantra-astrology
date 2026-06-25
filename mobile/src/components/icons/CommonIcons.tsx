import React from 'react';
import Svg, { Path, Polyline } from 'react-native-svg';

/**
 * Shared one-off SVG icons that were previously redefined in many screens.
 * Adopt these incrementally to remove duplicate local definitions.
 */

const CHEV_POINTS = {
  right: '9 18 15 12 9 6',
  left: '15 18 9 12 15 6',
  down: '6 9 12 15 18 9',
  up: '18 15 12 9 6 15',
} as const;

export const Chevron = React.memo(function Chevron({
  color, size = 16, dir = 'right', width = 2,
}: { color: string; size?: number; dir?: keyof typeof CHEV_POINTS; width?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points={CHEV_POINTS[dir]} />
    </Svg>
  );
});

export const Sparkle = React.memo(function Sparkle({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" />
    </Svg>
  );
});
