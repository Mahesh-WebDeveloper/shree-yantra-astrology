import React from 'react';
import Svg, { Circle, G, Line, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import { VArtKey } from '../../data/vastuLearn';

/** Simple, theme-aware line illustrations for each Vastu learn chapter. */
export function VastuArt({ art, dark, width = 150, height = 112 }: { art: VArtKey; dark: boolean; width?: number; height?: number }) {
  const gold = dark ? '#f3c75e' : '#b07316';
  const ink = dark ? '#fce8a8' : '#6b4a12';
  const soft = dark ? 'rgba(243,199,94,0.22)' : 'rgba(176,115,22,0.14)';
  const line = dark ? 'rgba(243,199,94,0.55)' : 'rgba(176,115,22,0.45)';
  const red = '#d9694f';
  const S = { fill: 'none', stroke: gold, strokeWidth: 2.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const T = { fill: 'none', stroke: line, strokeWidth: 1.4 };

  return (
    <Svg width={width} height={height} viewBox="0 0 200 150">
      {art === 'house' && (
        <G>
          <Path d="M40 78 L100 34 L160 78" {...S} />
          <Path d="M52 72 v52 h96 v-52" {...S} />
          <Rect x={86} y={98} width={28} height={26} fill={soft} stroke={gold} strokeWidth={2} />
          <Path d="M70 84 h20 v18 h-20 z" {...T} />
          <Circle cx={100} cy={30} r={9} fill={soft} stroke={gold} strokeWidth={2} />
        </G>
      )}
      {(art === 'compass' || art === 'plot') && (
        <G>
          <Rect x={44} y={24} width={112} height={112} rx={6} fill={soft} stroke={gold} strokeWidth={2} strokeDasharray={art === 'plot' ? '5 4' : undefined} />
          {[74.7, 105.3].map((p) => (
            <G key={p}>
              <Line x1={p} y1={24} x2={p} y2={136} {...T} />
              <Line x1={44} y1={p - 4} x2={156} y2={p - 4} {...T} />
            </G>
          ))}
          <Circle cx={100} cy={80} r={30} fill="none" stroke={gold} strokeWidth={2} />
          <Polygon points="100,54 92,84 100,76 108,84" fill={red} />
          <Polygon points="100,106 92,76 100,84 108,76" fill={gold} />
          <SvgText x={100} y={20} textAnchor="middle" fontSize={13} fontWeight="700" fill={red}>N</SvgText>
        </G>
      )}
      {art === 'panch' && (
        <G>
          {[
            { x: 100, y: 40, c: '#4aa3c9', t: '💧' },
            { x: 150, y: 78, c: red, t: '🔥' },
            { x: 128, y: 122, c: '#a98a5a', t: '🌍' },
            { x: 72, y: 122, c: '#6fc27a', t: '🌬' },
            { x: 50, y: 78, c: gold, t: '🌌' },
          ].map((e, i) => (
            <G key={i}>
              <Line x1={100} y1={80} x2={e.x} y2={e.y} {...T} />
              <Circle cx={e.x} cy={e.y} r={15} fill={soft} stroke={e.c} strokeWidth={2.2} />
              <SvgText x={e.x} y={e.y + 5} textAnchor="middle" fontSize={13}>{e.t}</SvgText>
            </G>
          ))}
          <Circle cx={100} cy={80} r={9} fill={gold} />
        </G>
      )}
      {art === 'brahma' && (
        <G>
          <Rect x={46} y={30} width={108} height={108} rx={6} fill="none" stroke={gold} strokeWidth={2} />
          {[82, 118].map((p) => (
            <G key={p}>
              <Line x1={p} y1={30} x2={p} y2={138} {...T} />
              <Line x1={46} y1={p - 12} x2={154} y2={p - 12} {...T} />
            </G>
          ))}
          <Circle cx={100} cy={84} r={22} fill={soft} stroke={gold} strokeWidth={2.4} strokeDasharray="4 3" />
          <Circle cx={100} cy={84} r={10} fill="none" stroke={gold} strokeWidth={1.6} strokeDasharray="3 3" />
          <SvgText x={100} y={22} textAnchor="middle" fontSize={11} fontWeight="700" fill={ink}>ॐ</SvgText>
        </G>
      )}
      {art === 'door' && (
        <G>
          <Rect x={70} y={34} width={60} height={104} rx={3} fill={soft} stroke={gold} strokeWidth={2.4} />
          <Rect x={78} y={44} width={44} height={86} fill="none" stroke={line} strokeWidth={1.4} />
          <Circle cx={114} cy={88} r={3.5} fill={gold} />
          <Path d="M70 138 A60 60 0 0 1 128 96" fill="none" stroke={line} strokeWidth={1.6} strokeDasharray="4 3" />
          <Path d="M100 24 v-8 M84 18 l4 6 M116 18 l-4 6" stroke={gold} strokeWidth={2} strokeLinecap="round" />
        </G>
      )}
      {art === 'kitchen' && (
        <G>
          <Rect x={40} y={70} width={120} height={20} fill={soft} stroke={gold} strokeWidth={2} />
          <Rect x={40} y={70} width={20} height={64} fill={soft} stroke={gold} strokeWidth={2} />
          <Circle cx={92} cy={80} r={6} fill="none" stroke={red} strokeWidth={2} />
          <Circle cx={112} cy={80} r={6} fill="none" stroke={red} strokeWidth={2} />
          <Path d="M92 62 q4 -8 0 -14 M112 62 q4 -8 0 -14" stroke={red} strokeWidth={2} fill="none" strokeLinecap="round" />
          <Circle cx={50} cy={104} r={5} fill="none" stroke="#4aa3c9" strokeWidth={2} />
          <Rect x={130} y={96} width={22} height={34} fill="none" stroke={line} strokeWidth={1.6} />
        </G>
      )}
      {art === 'bed' && (
        <G>
          <Rect x={44} y={64} width={112} height={62} rx={5} fill={soft} stroke={gold} strokeWidth={2.4} />
          <Rect x={44} y={64} width={112} height={16} fill="none" stroke={gold} strokeWidth={2} />
          <Rect x={54} y={68} width={38} height={9} rx={3} fill="none" stroke={line} strokeWidth={1.4} />
          <Rect x={108} y={68} width={38} height={9} rx={3} fill="none" stroke={line} strokeWidth={1.4} />
          <Path d="M44 100 q56 -12 112 0" fill="none" stroke={line} strokeWidth={1.6} />
          <SvgText x={100} y={44} textAnchor="middle" fontSize={12} fontWeight="700" fill={ink}>S ↓</SvgText>
        </G>
      )}
      {art === 'pooja' && (
        <G>
          <Polygon points="100,30 60,80 140,80" fill={soft} stroke={gold} strokeWidth={2.4} />
          <Rect x={66} y={80} width={68} height={44} fill={soft} stroke={gold} strokeWidth={2.2} />
          <Line x1={100} y1={80} x2={100} y2={124} stroke={line} strokeWidth={1.4} />
          <Path d="M84 108 q6 -14 0 -20 M116 108 q6 -14 0 -20" stroke={red} strokeWidth={2} fill="none" strokeLinecap="round" />
          <Circle cx={84} cy={110} r={4} fill={red} opacity={0.8} />
          <Circle cx={116} cy={110} r={4} fill={red} opacity={0.8} />
        </G>
      )}
      {art === 'toilet' && (
        <G>
          <Rect x={54} y={34} width={92} height={104} rx={6} fill={soft} stroke={gold} strokeWidth={2} />
          <Rect x={66} y={50} width={26} height={20} rx={3} fill="none" stroke={line} strokeWidth={1.6} />
          <Circle cx={79} cy={60} r={5} fill="none" stroke="#4aa3c9" strokeWidth={1.6} />
          <Rect x={104} y={92} width={26} height={34} rx={8} fill="none" stroke={gold} strokeWidth={2} />
          <Path d="M104 92 h26" stroke={gold} strokeWidth={2} />
          <Path d="M120 44 q10 8 0 18" stroke="#4aa3c9" strokeWidth={2} fill="none" strokeLinecap="round" />
        </G>
      )}
      {art === 'water' && (
        <G>
          <Rect x={48} y={40} width={104} height={92} rx={6} fill="none" stroke={gold} strokeWidth={2} />
          <Line x1={100} y1={40} x2={100} y2={132} {...T} />
          <Line x1={48} y1={86} x2={152} y2={86} {...T} />
          <Path d="M124 52 q8 12 0 20 q-8 -8 0 -20" fill={soft} stroke="#4aa3c9" strokeWidth={2} />
          <Rect x={58} y={98} width={30} height={24} fill={soft} stroke="#4aa3c9" strokeWidth={2} />
          <Path d="M58 104 q15 -6 30 0" stroke="#4aa3c9" strokeWidth={1.4} fill="none" />
        </G>
      )}
      {art === 'colors' && (
        <G>
          <Path d="M100 36 a44 44 0 1 0 0 88 a20 20 0 0 1 0 -40 a4 4 0 0 0 0 -8 a20 20 0 0 1 0 -40 z" fill={soft} stroke={gold} strokeWidth={2} />
          {[['#4aa3c9', 78, 58], [red, 122, 58], ['#6fc27a', 132, 90], [gold, 78, 100]].map((c, i) => (
            <Circle key={i} cx={c[1] as number} cy={c[2] as number} r={7} fill={c[0] as string} opacity={0.75} />
          ))}
          <Circle cx={100} cy={132} r={6} fill="none" stroke={gold} strokeWidth={2} />
        </G>
      )}
      {art === 'remedy' && (
        <G>
          <Path d="M64 118 L120 62" stroke={gold} strokeWidth={5} strokeLinecap="round" />
          <Polygon points="120,62 132,44 138,50 124,68" fill={soft} stroke={gold} strokeWidth={2.2} />
          <Path d="M128 40 l3 -8 M140 52 l8 -3 M120 36 l-2 -7 M150 62 l7 2" stroke={gold} strokeWidth={2} strokeLinecap="round" />
          <Circle cx={60} cy={112} r={8} fill={soft} stroke={gold} strokeWidth={2} />
        </G>
      )}
      {art === 'tips' && (
        <G>
          <Circle cx={100} cy={82} r={22} fill={soft} stroke={gold} strokeWidth={2.4} />
          {Array.from({ length: 8 }).map((_, i) => {
            const a = (i * 45) * (Math.PI / 180);
            return <Line key={i} x1={100 + 30 * Math.cos(a)} y1={82 + 30 * Math.sin(a)} x2={100 + 40 * Math.cos(a)} y2={82 + 40 * Math.sin(a)} stroke={gold} strokeWidth={2.4} strokeLinecap="round" />;
          })}
          <SvgText x={100} y={88} textAnchor="middle" fontSize={16}>✨</SvgText>
        </G>
      )}
    </Svg>
  );
}
