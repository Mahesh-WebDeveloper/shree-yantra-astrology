import React from 'react';
import Svg, { Path, Circle, Line, Rect, Polyline, Ellipse, G } from 'react-native-svg';

/**
 * ServiceIcons — clean stroke line-icons for the home "All Services" slider.
 * One <ServiceIcon name=... /> switch; each glyph drawn on a 24×24 grid so they
 * share weight and rhythm. Colour is the per-service accent.
 */
export type ServiceIconName =
  | 'zodiac' | 'milan' | 'calendar' | 'clock' | 'name' | 'orbit'
  | 'gem' | 'timeline' | 'book' | 'kundli' | 'scroll' | 'star';

export function ServiceIcon({ name, color, size = 26 }: { name: ServiceIconName; color: string; size?: number }) {
  const p = { stroke: color, strokeWidth: 1.7, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'zodiac' && (
        <G {...p}>
          <Circle cx={12} cy={12} r={4.2} />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
            const r = (a * Math.PI) / 180;
            return <Line key={a} x1={12 + Math.cos(r) * 6.4} y1={12 + Math.sin(r) * 6.4} x2={12 + Math.cos(r) * 9} y2={12 + Math.sin(r) * 9} />;
          })}
        </G>
      )}
      {name === 'milan' && (
        <G {...p}>
          <Circle cx={9} cy={12} r={5} />
          <Circle cx={15} cy={12} r={5} />
        </G>
      )}
      {name === 'calendar' && (
        <G {...p}>
          <Rect x={3.5} y={4.5} width={17} height={16} rx={2.5} />
          <Line x1={3.5} y1={9} x2={20.5} y2={9} />
          <Line x1={8} y1={2.5} x2={8} y2={6} />
          <Line x1={16} y1={2.5} x2={16} y2={6} />
          <Circle cx={12} cy={14.5} r={1.6} fill={color} stroke="none" />
        </G>
      )}
      {name === 'clock' && (
        <G {...p}>
          <Circle cx={12} cy={12} r={8.3} />
          <Polyline points="12 7.5 12 12 15.5 13.8" />
        </G>
      )}
      {name === 'name' && (
        <G {...p}>
          <Path d="M20.6 13.4 13 21a2 2 0 0 1-2.8 0l-6.2-6.2a2 2 0 0 1-.6-1.4V5.4A1.8 1.8 0 0 1 5.2 3.6h7A2 2 0 0 1 13.6 4l7 7a1.9 1.9 0 0 1 0 2.4Z" />
          <Circle cx={8.2} cy={8.2} r={1.4} fill={color} stroke="none" />
        </G>
      )}
      {name === 'orbit' && (
        <G {...p}>
          <Circle cx={12} cy={12} r={3} />
          <Ellipse cx={12} cy={12} rx={9.2} ry={4.2} transform="rotate(-30 12 12)" />
          <Circle cx={20} cy={9} r={1.3} fill={color} stroke="none" />
        </G>
      )}
      {name === 'gem' && (
        <G {...p}>
          <Path d="M6 3.5h12l3.5 5L12 21 2.5 8.5 6 3.5Z" />
          <Path d="M2.8 8.5h18.4M9 3.5 7 8.5 12 21l5-12.5-2-5" />
        </G>
      )}
      {name === 'timeline' && (
        <G {...p}>
          <Line x1={7} y1={3} x2={7} y2={21} />
          <Circle cx={7} cy={6.5} r={2.1} />
          <Circle cx={7} cy={12} r={2.1} />
          <Circle cx={7} cy={17.5} r={2.1} />
          <Line x1={11} y1={6.5} x2={20} y2={6.5} />
          <Line x1={11} y1={12} x2={20} y2={12} />
          <Line x1={11} y1={17.5} x2={17} y2={17.5} />
        </G>
      )}
      {name === 'book' && (
        <G {...p}>
          <Path d="M12 6.2C10.3 5 7.8 4.5 4.5 4.6v12.7c3.3-.1 5.8.4 7.5 1.6 1.7-1.2 4.2-1.7 7.5-1.6V4.6C16.2 4.5 13.7 5 12 6.2Z" />
          <Line x1={12} y1={6.2} x2={12} y2={18.9} />
        </G>
      )}
      {name === 'kundli' && (
        <G {...p}>
          <Rect x={3.5} y={3.5} width={17} height={17} rx={1.5} />
          <Path d="M3.5 3.5 20.5 20.5M20.5 3.5 3.5 20.5M12 3.5 20.5 12 12 20.5 3.5 12 12 3.5Z" />
        </G>
      )}
      {name === 'scroll' && (
        <G {...p}>
          <Path d="M6 3.5h10a2 2 0 0 1 2 2v13a2 2 0 0 0 2 2H8a2 2 0 0 1-2-2V3.5Z" />
          <Line x1={9} y1={8} x2={15} y2={8} />
          <Line x1={9} y1={11.5} x2={15} y2={11.5} />
          <Line x1={9} y1={15} x2={13} y2={15} />
        </G>
      )}
      {name === 'star' && (
        <G {...p}>
          <Path d="M12 3.2l2.5 5.6 6.1.6-4.6 4 1.4 6L12 16.9 6.6 19.4l1.4-6-4.6-4 6.1-.6L12 3.2Z" />
        </G>
      )}
    </Svg>
  );
}
