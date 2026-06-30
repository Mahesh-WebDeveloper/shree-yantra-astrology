import React from 'react';
import Svg, { Circle, Defs, Ellipse, G, Line, Path, Rect, Stop, LinearGradient as SvgGrad, Text as SvgText } from 'react-native-svg';
import type { ArtKey } from '../../data/kundliLearn';

// Beautiful, gold-themed hero illustrations — one per "Kundli Sikhe" chapter.
// viewBox 0 0 200 150. Pure SVG (no images) so they're crisp + theme-aware.
export function LearnArt({ art, dark, width = 150, height = 112 }: { art: ArtKey; dark: boolean; width?: number; height?: number }) {
  const gold = dark ? '#f3c75e' : '#9a6818';
  const ink = dark ? '#fce8a8' : '#5f3808';
  const faint = dark ? 'rgba(243,199,94,0.32)' : 'rgba(95,56,8,0.3)';
  const fill = dark ? 'rgba(0,0,0,0.30)' : 'rgba(255,247,224,0.7)';

  const sign = (cx: number, cy: number, glyph: string, s = 9) => (
    <SvgText x={cx} y={cy} fill={gold} fontSize={s} fontWeight="bold" textAnchor="middle">{glyph}</SvgText>
  );

  return (
    <Svg width={width} height={height} viewBox="0 0 200 150">
      <Defs>
        <SvgGrad id="laGold" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={dark ? '#fce8a8' : '#b07a16'} />
          <Stop offset="1" stopColor={dark ? '#b87f1a' : '#5f3808'} />
        </SvgGrad>
      </Defs>

      {art === 'sky' && (
        <G>
          <Circle cx={100} cy={75} r={64} fill={fill} stroke="url(#laGold)" strokeWidth={2} />
          <Circle cx={100} cy={75} r={44} fill="none" stroke={faint} strokeWidth={1} />
          <Line x1={36} y1={75} x2={164} y2={75} stroke={faint} strokeWidth={1} />
          <Line x1={100} y1={11} x2={100} y2={139} stroke={faint} strokeWidth={1} />
          <Circle cx={70} cy={48} r={6} fill={gold} />
          <Circle cx={132} cy={54} r={3.5} fill={ink} />
          <Circle cx={124} cy={100} r={4.2} fill={ink} />
          <Circle cx={64} cy={104} r={3} fill={ink} />
          {[...Array(10)].map((_, i) => <Circle key={i} cx={30 + i * 15} cy={20 + (i % 3) * 6} r={0.9} fill={gold} opacity={0.6} />)}
        </G>
      )}

      {art === 'solar' && (
        <G>
          {[28, 42, 56].map((r, i) => <Circle key={i} cx={100} cy={75} r={r} fill="none" stroke={faint} strokeWidth={1} />)}
          <Circle cx={100} cy={75} r={14} fill="url(#laGold)" />
          {[...Array(8)].map((_, i) => { const a = (i * Math.PI) / 4; return <Line key={i} x1={100 + 16 * Math.cos(a)} y1={75 + 16 * Math.sin(a)} x2={100 + 22 * Math.cos(a)} y2={75 + 22 * Math.sin(a)} stroke={gold} strokeWidth={1.4} strokeLinecap="round" />; })}
          <Circle cx={128} cy={75} r={3} fill={ink} />
          <Circle cx={72} cy={61} r={4} fill={gold} />
          <Circle cx={100} cy={131} r={3.4} fill={ink} />
          <Circle cx={156} cy={75} r={3.8} fill={gold} />
        </G>
      )}

      {art === 'navagraha' && (
        <G>
          <Circle cx={100} cy={75} r={60} fill="none" stroke={faint} strokeWidth={1} />
          <Circle cx={100} cy={75} r={13} fill="url(#laGold)" />
          {['सू', 'चं', 'मं', 'बु', 'गु', 'शु', 'श', 'रा', 'के'].map((g, i) => {
            const a = (i * 2 * Math.PI) / 9 - Math.PI / 2;
            return <G key={i}>
              <Circle cx={100 + 50 * Math.cos(a)} cy={75 + 50 * Math.sin(a)} r={11} fill={fill} stroke={gold} strokeWidth={1.2} />
              {sign(100 + 50 * Math.cos(a), 78 + 50 * Math.sin(a), g, 8)}
            </G>;
          })}
        </G>
      )}

      {art === 'zodiac' && (
        <G>
          <Circle cx={100} cy={75} r={62} fill={fill} stroke="url(#laGold)" strokeWidth={2} />
          <Circle cx={100} cy={75} r={40} fill="none" stroke={faint} strokeWidth={1} />
          {[...Array(12)].map((_, i) => { const a = (i * Math.PI) / 6; return <Line key={i} x1={100 + 40 * Math.cos(a)} y1={75 + 40 * Math.sin(a)} x2={100 + 62 * Math.cos(a)} y2={75 + 62 * Math.sin(a)} stroke={faint} strokeWidth={1} />; })}
          {['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'].map((g, i) => { const a = (i * Math.PI) / 6 + Math.PI / 12; return sign(100 + 51 * Math.cos(a), 79 + 51 * Math.sin(a), g, 11); })}
        </G>
      )}

      {art === 'nakshatra' && (
        <G>
          <Circle cx={100} cy={75} r={58} fill="none" stroke={faint} strokeWidth={1} strokeDasharray="2 5" />
          <Path d="M108 50a30 30 0 1 0 0 50a24 24 0 0 1 0-50z" fill="url(#laGold)" />
          {[...Array(14)].map((_, i) => { const a = (i * 2 * Math.PI) / 14; const r = 58; return <Circle key={i} cx={100 + r * Math.cos(a)} cy={75 + r * Math.sin(a)} r={i % 2 ? 1.6 : 1} fill={gold} opacity={0.85} />; })}
          {[...Array(13)].map((_, i) => { const a = (i * 2 * Math.PI) / 13 + 0.2; const r = 40; return <Circle key={`b${i}`} cx={100 + r * Math.cos(a)} cy={75 + r * Math.sin(a)} r={1} fill={ink} opacity={0.7} />; })}
        </G>
      )}

      {art === 'lagna' && (
        <G>
          <Line x1={26} y1={104} x2={174} y2={104} stroke="url(#laGold)" strokeWidth={2.4} />
          <Circle cx={100} cy={104} r={20} fill="url(#laGold)" />
          {[...Array(7)].map((_, i) => <Line key={i} x1={100 + 26 * Math.cos(Math.PI + i * Math.PI / 6)} y1={104 + 26 * Math.sin(Math.PI + i * Math.PI / 6)} x2={100 + 33 * Math.cos(Math.PI + i * Math.PI / 6)} y2={104 + 33 * Math.sin(Math.PI + i * Math.PI / 6)} stroke={gold} strokeWidth={1.6} strokeLinecap="round" />)}
          <Path d="M150 104a50 50 0 0 0-100 0" fill="none" stroke={faint} strokeWidth={1} strokeDasharray="3 4" />
          {sign(150, 56, '↑', 14)}
          {[20, 40, 60].map((x, i) => <Circle key={i} cx={x + 110} cy={30 + i * 6} r={1} fill={gold} opacity={0.6} />)}
        </G>
      )}

      {art === 'moon' && (
        <G>
          <Circle cx={100} cy={75} r={60} fill="none" stroke={faint} strokeWidth={1} />
          <Path d="M118 35a45 45 0 1 0 0 80a36 36 0 0 1 0-80z" fill="url(#laGold)" />
          {[[150, 50], [158, 90], [44, 55], [52, 100], [100, 22]].map(([x, y], i) => sign(x, y, '✦', 9))}
        </G>
      )}

      {(art === 'houses' || art === 'readchart') && (
        <G>
          <Rect x={46} y={21} width={108} height={108} fill={fill} stroke="url(#laGold)" strokeWidth={2} />
          <Line x1={46} y1={21} x2={154} y2={129} stroke={faint} strokeWidth={1.2} />
          <Line x1={154} y1={21} x2={46} y2={129} stroke={faint} strokeWidth={1.2} />
          <Line x1={100} y1={21} x2={46} y2={75} stroke={faint} strokeWidth={1.2} />
          <Line x1={100} y1={21} x2={154} y2={75} stroke={faint} strokeWidth={1.2} />
          <Line x1={46} y1={75} x2={100} y2={129} stroke={faint} strokeWidth={1.2} />
          <Line x1={154} y1={75} x2={100} y2={129} stroke={faint} strokeWidth={1.2} />
          {art === 'readchart' && <Path d="M100 21 L127 48 L100 75 L73 48 Z" fill={dark ? 'rgba(243,199,94,0.22)' : 'rgba(176,115,22,0.16)'} />}
          {sign(100, 42, '1', 9)}
          {sign(73, 49, '12', 8)}
          {sign(127, 49, '2', 8)}
          {sign(60, 78, '11', 8)}
          {sign(140, 78, '3', 8)}
          {sign(100, 78, art === 'readchart' ? 'सू' : '★', 9)}
          {sign(100, 116, '7', 9)}
        </G>
      )}

      {art === 'varga' && (
        <G>
          <Rect x={34} y={26} width={82} height={82} fill={fill} stroke="url(#laGold)" strokeWidth={1.8} />
          <Line x1={34} y1={26} x2={116} y2={108} stroke={faint} strokeWidth={1} />
          <Line x1={116} y1={26} x2={34} y2={108} stroke={faint} strokeWidth={1} />
          <Circle cx={130} cy={96} r={26} fill="none" stroke="url(#laGold)" strokeWidth={3} />
          <Line x1={148} y1={114} x2={170} y2={136} stroke={gold} strokeWidth={5} strokeLinecap="round" />
          {sign(130, 100, 'D9', 11)}
        </G>
      )}

      {art === 'dasha' && (
        <G>
          <Line x1={26} y1={75} x2={174} y2={75} stroke={faint} strokeWidth={1.4} />
          {[40, 78, 120, 160].map((x, i) => <G key={i}>
            <Circle cx={x} cy={75} r={i === 1 ? 9 : 6} fill={i === 1 ? 'url(#laGold)' : fill} stroke={gold} strokeWidth={1.4} />
          </G>)}
          {['सू', 'गु', 'श', 'बु'].map((g, i) => sign([40, 78, 120, 160][i], 56, g, 8))}
          {['9y', '16y', '19y', '17y'].map((g, i) => sign([40, 78, 120, 160][i], 100, g, 7))}
        </G>
      )}

      {art === 'history' && (
        <G>
          <Path d="M52 36 q-10 4 -10 14 v60 q0 10 10 14 h96 q10 -4 10 -14 v-60 q0 -10 -10 -14 z" fill={fill} stroke="url(#laGold)" strokeWidth={2} />
          {[54, 66, 78, 90].map((y, i) => <Line key={i} x1={64} y1={y} x2={i % 2 ? 124 : 136} y2={y} stroke={faint} strokeWidth={2} strokeLinecap="round" />)}
          {sign(100, 112, 'ॐ', 13)}
        </G>
      )}

      {art === 'trust' && (
        <G>
          <Ellipse cx={100} cy={112} rx={42} ry={12} fill={fill} stroke="url(#laGold)" strokeWidth={2} />
          <Path d="M100 96 q-12 -2 -22 4 q10 8 22 8 q12 0 22 -8 q-10 -6 -22 -4z" fill="url(#laGold)" />
          <Path d="M100 58 q-9 16 -9 26 a9 9 0 0 0 18 0 q0 -10 -9 -26z" fill={gold} />
          {[[60, 60], [140, 64], [76, 40], [128, 38]].map(([x, y], i) => sign(x, y, '✦', 8))}
        </G>
      )}

      {art === 'generate' && (
        <G>
          <Rect x={60} y={28} width={80} height={94} rx={8} fill={fill} stroke="url(#laGold)" strokeWidth={2} />
          {[44, 58, 72].map((y, i) => <Line key={i} x1={72} y1={y} x2={i === 2 ? 110 : 128} y2={y} stroke={faint} strokeWidth={2.4} strokeLinecap="round" />)}
          <Circle cx={100} cy={98} r={14} fill="none" stroke="url(#laGold)" strokeWidth={2} />
          {[...Array(8)].map((_, i) => { const a = (i * Math.PI) / 4; return <Line key={i} x1={100 + 14 * Math.cos(a)} y1={98 + 14 * Math.sin(a)} x2={100 + 18 * Math.cos(a)} y2={98 + 18 * Math.sin(a)} stroke={gold} strokeWidth={1.4} />; })}
        </G>
      )}
    </Svg>
  );
}
