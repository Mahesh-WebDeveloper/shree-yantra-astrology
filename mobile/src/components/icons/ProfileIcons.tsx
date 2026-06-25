import React from 'react';
import Svg, { Path, Circle, Rect, Polyline, Polygon, Line } from 'react-native-svg';

interface P {
  color: string;
  size?: number;
}

const line = (color: string, size = 18, sw = 1.7) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: color,
  strokeWidth: sw,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

/* avatar default silhouette (filled) */
export const UserGlyph = ({ color, size = 64 }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Circle cx={12} cy={8} r={4.2} />
    <Path d="M3.6 21c.7-4.4 4.3-7 8.4-7s7.7 2.6 8.4 7z" />
  </Svg>
);

export const UserLine = ({ color, size }: P) => (
  <Svg {...line(color, size)}>
    <Circle cx={12} cy={8} r={4} />
    <Path d="M4 21c.7-4.4 4-7 8-7s7.3 2.6 8 7" />
  </Svg>
);

export const CalendarIcon = ({ color, size }: P) => (
  <Svg {...line(color, size)}>
    <Rect x={3} y={4} width={18} height={18} rx={2} />
    <Path d="M16 2v4M8 2v4M3 10h18" />
  </Svg>
);

export const ClockIcon = ({ color, size }: P) => (
  <Svg {...line(color, size)}>
    <Circle cx={12} cy={12} r={10} />
    <Polyline points="12 6 12 12 16 14" />
  </Svg>
);

export const MapPinIcon = ({ color, size }: P) => (
  <Svg {...line(color, size)}>
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <Circle cx={12} cy={10} r={3} />
  </Svg>
);

export const MailIcon = ({ color, size }: P) => (
  <Svg {...line(color, size)}>
    <Path d="M4 4h16v16H4z" />
    <Polyline points="4 4 12 13 20 4" />
  </Svg>
);

export const EditIcon = ({ color, size }: P) => (
  <Svg {...line(color, size)}>
    <Path d="M12 20h9" />
    <Path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4z" />
  </Svg>
);

export const BellLine = ({ color, size }: P) => (
  <Svg {...line(color, size)}>
    <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <Path d="M13.7 21a2 2 0 0 1-3.4 0" />
  </Svg>
);

export const CrownIcon = ({ color, size }: P) => (
  <Svg width={size ?? 18} height={size ?? 18} viewBox="0 0 24 24" fill={color}>
    <Path d="M2 8l4 6 5-7 5 7 4-4-2 12H4z" />
  </Svg>
);

export const BookmarkIcon = ({ color, size }: P) => (
  <Svg {...line(color, size)}>
    <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Svg>
);

export const GlobeIcon = ({ color, size }: P) => (
  <Svg {...line(color, size)}>
    <Circle cx={12} cy={12} r={10} />
    <Path d="M2 12h20M12 2a14 14 0 0 1 0 20M12 2a14 14 0 0 0 0 20" />
  </Svg>
);

export const LockIcon = ({ color, size }: P) => (
  <Svg {...line(color, size)}>
    <Rect x={4} y={11} width={16} height={10} rx={2} />
    <Path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </Svg>
);

export const HelpIcon = ({ color, size }: P) => (
  <Svg {...line(color, size)}>
    <Circle cx={12} cy={12} r={10} />
    <Path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2-3 4" />
    <Line x1={12} y1={17} x2={12.01} y2={17} />
  </Svg>
);

export const LogoutIcon = ({ color, size }: P) => (
  <Svg {...line(color, size, 2)}>
    <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <Polyline points="16 17 21 12 16 7" />
    <Line x1={21} y1={12} x2={9} y2={12} />
  </Svg>
);

export const CameraIcon = ({ color, size }: P) => (
  <Svg {...line(color, size, 2)}>
    <Path d="M3 7h4l2-3h6l2 3h4v13H3z" />
    <Circle cx={12} cy={13} r={4} />
  </Svg>
);

export const ChevronIcon = ({ color, size }: P) => (
  <Svg {...line(color, size, 2)}>
    <Path d="M9 6l6 6-6 6" />
  </Svg>
);
