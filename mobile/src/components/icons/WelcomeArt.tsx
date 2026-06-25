import React from 'react';
import Svg, {
  Defs, LinearGradient, RadialGradient, Stop, Rect, Circle, Line, Path, Polygon, G, Text as SvgText,
} from 'react-native-svg';

/** Shared gold vertical gradient used by all welcome art (matches web #gold). */
const Gold = ({ id }: { id: string }) => (
  <Defs>
    <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <Stop offset="0%" stopColor="#fce8a8" />
      <Stop offset="60%" stopColor="#e9b850" />
      <Stop offset="100%" stopColor="#a17613" />
    </LinearGradient>
  </Defs>
);

/* ───── Shree Yantra logo (pages/welcome-page lines 70-104) ───── */
export function ShreeYantraLogo({ size = 80 }: { size?: number }) {
  const s = 'url(#syg)';
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200" fill="none">
      <Gold id="syg" />
      <Rect x={14} y={14} width={172} height={172} stroke={s} strokeWidth={2} fill="none" />
      <Rect x={20} y={20} width={160} height={160} stroke={s} strokeWidth={1} fill="none" opacity={0.7} />
      <G stroke={s} strokeWidth={1.5}>
        <Line x1={14} y1={20} x2={26} y2={20} /><Line x1={20} y1={14} x2={20} y2={26} />
        <Line x1={174} y1={20} x2={186} y2={20} /><Line x1={180} y1={14} x2={180} y2={26} />
        <Line x1={14} y1={180} x2={26} y2={180} /><Line x1={20} y1={174} x2={20} y2={186} />
        <Line x1={174} y1={180} x2={186} y2={180} /><Line x1={180} y1={174} x2={180} y2={186} />
      </G>
      <Path d="M85 14 L100 2 L115 14" stroke={s} strokeWidth={2} fill="none" />
      <Path d="M85 186 L100 198 L115 186" stroke={s} strokeWidth={2} fill="none" />
      <Path d="M14 85 L2 100 L14 115" stroke={s} strokeWidth={2} fill="none" />
      <Path d="M186 85 L198 100 L186 115" stroke={s} strokeWidth={2} fill="none" />
      <Circle cx={100} cy={100} r={74} stroke={s} strokeWidth={1.2} fill="none" />
      <Circle cx={100} cy={100} r={60} stroke={s} strokeWidth={1.2} fill="none" />
      <G stroke={s} strokeWidth={1.4} fill="none">
        <Polygon points="100,42 144,128 56,128" />
        <Polygon points="100,40 148,124 52,124" opacity={0.5} />
        <Polygon points="100,158 56,72 144,72" />
        <Polygon points="100,160 52,76 148,76" opacity={0.5} />
        <Polygon points="100,58 134,116 66,116" />
        <Polygon points="100,142 66,84 134,84" />
        <Polygon points="100,72 124,108 76,108" />
        <Polygon points="100,128 76,92 124,92" />
      </G>
      <Circle cx={100} cy={100} r={3} fill={s} />
    </Svg>
  );
}

/* ───── Zodiac wheel with Leo centre (lines 148-166) ───── */
export function ZodiacWheel({ size = 120, dark = true }: { size?: number; dark?: boolean }) {
  const s = 'url(#zwg)';
  const spokes = Array.from({ length: 12 }).map((_, i) => {
    const a = (i * Math.PI) / 6;
    const x1 = 100 + 58 * Math.cos(a), y1 = 100 + 58 * Math.sin(a);
    const x2 = 100 + 86 * Math.cos(a), y2 = 100 + 86 * Math.sin(a);
    return <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={s} strokeWidth={0.7} opacity={0.6} />;
  });
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Gold id="zwg" />
      <RadialGradient id="zwbg" cx="50%" cy="50%" r="50%">
        <Stop offset="0%" stopColor={dark ? '#0d0d28' : '#fff6da'} />
        <Stop offset="100%" stopColor={dark ? '#000000' : '#f3e6c2'} />
      </RadialGradient>
      <Circle cx={100} cy={100} r={96} fill="url(#zwbg)" stroke={s} strokeWidth={1.5} />
      <Circle cx={100} cy={100} r={86} fill="none" stroke={s} strokeWidth={0.8} opacity={0.7} />
      <Circle cx={100} cy={100} r={58} fill="none" stroke={s} strokeWidth={0.8} opacity={0.7} />
      {spokes}
      <SvgText x={100} y={128} textAnchor="middle" fontSize={78} fill={s}>♌</SvgText>
    </Svg>
  );
}

/* ───── Feature: Daily Prediction (sun) ───── */
export function SunArt({ size = 80 }: { size?: number }) {
  const s = 'url(#sg)';
  const rays = Array.from({ length: 12 }).map((_, i) => {
    const a = (i * Math.PI) / 6;
    const x1 = 100 + 30 * Math.cos(a), y1 = 100 + 30 * Math.sin(a);
    const x2 = 100 + 48 * Math.cos(a), y2 = 100 + 48 * Math.sin(a);
    return <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={s} strokeWidth={2} strokeLinecap="round" />;
  });
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Gold id="sg" />
      <Circle cx={100} cy={100} r={96} fill="none" stroke={s} strokeWidth={1.5} />
      <Circle cx={100} cy={100} r={80} fill="none" stroke={s} strokeWidth={0.8} opacity={0.7} />
      <Circle cx={100} cy={100} r={56} fill="none" stroke={s} strokeWidth={0.8} opacity={0.7} />
      {rays}
      <Circle cx={100} cy={100} r={20} fill={s} />
    </Svg>
  );
}

/* ───── Feature: Kundli chart (lines 255-275) ───── */
export function KundliArt({ size = 80 }: { size?: number }) {
  const s = 'url(#kg)';
  const houses: [number, number, string][] = [
    [100, 53, '1'], [60, 63, '2'], [50, 103, '3'], [60, 143, '4'], [100, 155, '5'], [140, 143, '6'],
    [150, 103, '7'], [140, 63, '8'], [100, 103, '9'], [80, 88, '10'], [120, 88, '11'], [100, 121, '12'],
  ];
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Gold id="kg" />
      <Rect x={20} y={20} width={160} height={160} stroke={s} strokeWidth={1.8} fill="none" />
      <Line x1={20} y1={20} x2={180} y2={180} stroke={s} strokeWidth={1.4} />
      <Line x1={180} y1={20} x2={20} y2={180} stroke={s} strokeWidth={1.4} />
      <Line x1={100} y1={20} x2={180} y2={100} stroke={s} strokeWidth={1.4} />
      <Line x1={180} y1={100} x2={100} y2={180} stroke={s} strokeWidth={1.4} />
      <Line x1={100} y1={180} x2={20} y2={100} stroke={s} strokeWidth={1.4} />
      <Line x1={20} y1={100} x2={100} y2={20} stroke={s} strokeWidth={1.4} />
      {houses.map(([x, y, n]) => (
        <SvgText key={n} x={x} y={y} fontSize={11} fill={s} textAnchor="middle">{n}</SvgText>
      ))}
    </Svg>
  );
}

/* ───── Feature: Choghadiya diya (lines 304-307) ───── */
export function DiyaArt({ size = 80 }: { size?: number }) {
  const s = 'url(#dg)';
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Gold id="dg" />
      <RadialGradient id="flame" cx="50%" cy="50%" r="50%">
        <Stop offset="0%" stopColor="#fff4c2" /><Stop offset="50%" stopColor="#e9b850" /><Stop offset="100%" stopColor="#a17613" />
      </RadialGradient>
      <Path d="M100 30 C 88 60, 88 78, 100 96 C 112 78, 112 60, 100 30 Z" fill="url(#flame)" stroke={s} strokeWidth={1.2} />
      <Line x1={100} y1={96} x2={100} y2={110} stroke={s} strokeWidth={2} />
      <Path d="M40 120 Q 100 90, 160 120 Q 150 160, 100 168 Q 50 160, 40 120 Z" fill="none" stroke={s} strokeWidth={2} />
      <Path d="M52 124 Q 100 102, 148 124" fill="none" stroke={s} strokeWidth={1} opacity={0.7} />
    </Svg>
  );
}

/* ───── Prediction orb star (lines 331-333) ───── */
export function StarOrb({ size = 50 }: { size?: number }) {
  const s = 'url(#pbg)';
  return (
    <Svg width={size} height={size} viewBox="0 0 72 72">
      <Gold id="pbg" />
      <Circle cx={36} cy={36} r={31} fill="none" stroke={s} strokeWidth={1.3} />
      <Circle cx={36} cy={36} r={21} fill="none" stroke={s} strokeWidth={1} opacity={0.65} />
      <Path d="M36 12l5.2 15.4h16.2L44.3 37l5.1 15.4L36 43l-13.4 9.4L27.7 37 14.6 27.4h16.2z" fill={s} opacity={0.9} />
    </Svg>
  );
}

/* ───── Subtitle ornament (line + arrow + ring) ───── */
export function Ornament({ flip = false }: { flip?: boolean }) {
  return (
    <Svg width={56} height={14} viewBox="0 0 60 14" fill="none" style={flip ? { transform: [{ scaleX: -1 }] } : undefined}>
      <Defs>
        <LinearGradient id="orn" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor="#e9b850" stopOpacity={0} />
          <Stop offset="60%" stopColor="#e9b850" />
          <Stop offset="100%" stopColor="#fce8a8" />
        </LinearGradient>
      </Defs>
      <Line x1={0} y1={7} x2={44} y2={7} stroke="url(#orn)" strokeWidth={1.2} />
      <Path d="M44 7 L52 3 L52 11 Z" fill="#e9b850" />
      <Circle cx={56} cy={7} r={2.4} fill="none" stroke="#e9b850" strokeWidth={1} />
    </Svg>
  );
}
