import React from 'react';
import Svg, { Path, Circle, Rect, Polyline, Polygon, Line, G } from 'react-native-svg';

export interface IconProps {
  color: string;
  size?: number;
  /** subtle fill behind line icons when active (matches web fill-opacity) */
  fillOpacity?: number;
}

const base = (size = 24) => ({ width: size, height: size, viewBox: '0 0 24 24' });

export const HomeIcon = ({ color, size }: IconProps) => (
  <Svg {...base(size)} fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <Polyline points="9 22 9 12 15 12 15 22" />
  </Svg>
);

export const ChoghadiyaIcon = ({ color, size, fillOpacity = 0.12 }: IconProps) => (
  <Svg {...base(size)} fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx={12} cy={12} r={8.5} fill={color} fillOpacity={fillOpacity} />
    <Path d="M12 6.5v5.5l3.4 2" />
    <Path d="M5.5 4.5 3.8 6.2M18.5 4.5l1.7 1.7" />
    <Circle cx={12} cy={12} r={1.2} fill={color} />
  </Svg>
);

export const KundliIcon = ({ color, size }: IconProps) => (
  <Svg {...base(size)} fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
    <Rect x={3.5} y={3.5} width={17} height={17} rx={1.2} />
    <Path d="M3.5 12h17M12 3.5v17M3.5 3.5l17 17M20.5 3.5l-17 17" />
    <Circle cx={12} cy={12} r={1.6} fill={color} />
  </Svg>
);

export const LibraryIcon = ({ color, size, fillOpacity = 0.12 }: IconProps) => (
  <Svg {...base(size)} fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
    <Path
      d="M5 4.5c0-1 1-1.8 2.2-1.3L12 5.2l4.8-2c1.2-.5 2.2.3 2.2 1.3v14c0 .8-.8 1.3-1.5 1L12 17.3l-5.5 2.2c-.7.3-1.5-.2-1.5-1z"
      fill={color}
      fillOpacity={fillOpacity}
    />
    <Path d="M12 5.2v12.1M8 7.5h1.8M14.2 7.5H16" />
  </Svg>
);

export const ProfileIcon = ({ color, size }: IconProps) => (
  <Svg {...base(size)} fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <Circle cx={12} cy={7} r={4} />
  </Svg>
);

export const StarIcon = ({ color, size }: IconProps) => (
  <Svg {...base(size)} fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </Svg>
);

export const BellIcon = ({ color, size }: IconProps) => (
  <Svg {...base(size)} fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <Path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </Svg>
);

export const MenuIcon = ({ color, size }: IconProps) => (
  <Svg {...base(size)} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Line x1={4} y1={7} x2={20} y2={7} />
    <Line x1={4} y1={12} x2={20} y2={12} />
    <Line x1={4} y1={17} x2={20} y2={17} />
  </Svg>
);

/** Sri-Yantra style brand emblem used in the header / brand stack. */
export const BrandEmblem = ({ color, size = 34 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke={color} strokeWidth={1.2} strokeLinejoin="round">
    <Circle cx={24} cy={24} r={21} opacity={0.55} />
    <Polygon points="24 7 38 32 10 32" />
    <Polygon points="24 41 10 16 38 16" />
    <Circle cx={24} cy={24} r={3.4} fill={color} opacity={0.85} />
  </Svg>
);
