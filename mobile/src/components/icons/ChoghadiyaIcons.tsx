import React from 'react';
import Svg, { Path, Polygon, Polyline, Circle, Line } from 'react-native-svg';

const props = (c: string, size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: c,
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export function ChoghadiyaSymbol({ name, color, size = 18 }: { name: string; color: string; size?: number }) {
  switch (name) {
    case 'Amrit':
      return <Svg {...props(color, size)}><Path d="M12 2s6 7 6 12a6 6 0 0 1-12 0c0-5 6-12 6-12z" /></Svg>;
    case 'Shubh':
      return <Svg {...props(color, size)}><Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></Svg>;
    case 'Labh':
      return <Svg {...props(color, size)}><Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><Polyline points="22 4 12 14.01 9 11.01" /></Svg>;
    case 'Char':
      return <Svg {...props(color, size)}><Path d="M22 2L11 13" /><Path d="M22 2l-7 20-4-9-9-4 20-7z" /></Svg>;
    case 'Udveg':
      return <Svg {...props(color, size)}><Polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></Svg>;
    case 'Kaal':
      return <Svg {...props(color, size)}><Circle cx={12} cy={12} r={10} /><Line x1={15} y1={9} x2={9} y2={15} /><Line x1={9} y1={9} x2={15} y2={15} /></Svg>;
    case 'Rog':
      return <Svg {...props(color, size)}><Path d="M22 12h-4l-3 9L9 3l-3 9H2" /></Svg>;
    default:
      return <Svg {...props(color, size)}><Circle cx={12} cy={12} r={9} /></Svg>;
  }
}
