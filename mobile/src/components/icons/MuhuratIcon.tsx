import React from 'react';
import Svg, { Path, Circle, Line, Rect, Polyline, Polygon } from 'react-native-svg';

// Elegant gold line-art icons for each Shubh Muhurat category (keyed by category key).
export function MuhuratIcon({ k, color = '#e9b850', size = 30 }: { k: string; color?: string; size?: number }) {
  const p = { fill: 'none', stroke: color, strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const S = (children: React.ReactNode) => <Svg width={size} height={size} viewBox="0 0 24 24">{children}</Svg>;
  switch (k) {
    case 'griha-pravesh': return S(<><Path {...p} d="M3 11l9-7 9 7" /><Path {...p} d="M5 10v9h14v-9" /><Rect {...p} x={10} y={13} width={4} height={6} /></>);
    case 'bhoomi-pujan': return S(<><Rect {...p} x={3} y={14} width={6} height={4} /><Rect {...p} x={10} y={14} width={6} height={4} /><Rect {...p} x={6.5} y={9.5} width={6} height={4} /><Rect {...p} x={13} y={9.5} width={6} height={4} /><Path {...p} d="M12 9.5V5" /><Circle {...p} cx={12} cy={4} r={1.4} /></>);
    case 'property-buy': return S(<><Path {...p} d="M6 3h8l4 4v14H6z" /><Path {...p} d="M14 3v4h4" /><Line {...p} x1={9} y1={11} x2={15} y2={11} /><Line {...p} x1={9} y1={15} x2={15} y2={15} /></>);
    case 'vehicle': return S(<><Path {...p} d="M3 13l2-5h11l3 5" /><Path {...p} d="M2 13h20v4H2z" /><Circle {...p} cx={7} cy={18} r={1.8} /><Circle {...p} cx={17} cy={18} r={1.8} /></>);
    case 'vivah': return S(<><Circle {...p} cx={9} cy={14} r={4} /><Circle {...p} cx={15} cy={14} r={4} /><Path {...p} d="M9 5l1.5 2h-3z" /><Path {...p} d="M15 5l1.5 2h-3z" /></>);
    case 'sagai': return S(<><Circle {...p} cx={12} cy={15} r={4.5} /><Path {...p} d="M9.5 8l2.5-3 2.5 3-2.5 2z" /></>);
    case 'namkaran': case 'annaprashan': return S(<><Circle {...p} cx={12} cy={8} r={3.5} /><Path {...p} d="M6 20c0-4 12-4 12 0" /><Path {...p} d="M12 11.5v3" /></>);
    case 'mundan': return S(<><Circle {...p} cx={6} cy={7} r={2.5} /><Circle {...p} cx={6} cy={17} r={2.5} /><Line {...p} x1={8} y1={8.5} x2={20} y2={15} /><Line {...p} x1={8} y1={15.5} x2={20} y2={9} /></>);
    case 'vyapar': return S(<><Path {...p} d="M4 9l1-4h14l1 4" /><Path {...p} d="M4 9a2 2 0 004 0 2 2 0 004 0 2 2 0 004 0 2 2 0 004 0" /><Path {...p} d="M5 11v9h14v-9" /><Rect {...p} x={9} y={14} width={4} height={6} /></>);
    case 'office': return S(<><Rect {...p} x={5} y={3} width={14} height={18} /><Line {...p} x1={9} y1={7} x2={9} y2={7} /><Line {...p} x1={12} y1={7} x2={12} y2={7} /><Path {...p} d="M8 7h1M11 7h1M14 7h1M8 11h1M11 11h1M14 11h1M8 15h1M11 15h1M14 15h1" /></>);
    case 'new-business': return S(<><Path {...p} d="M12 2c3 2 5 6 5 10l-5 4-5-4c0-4 2-8 5-10z" /><Circle {...p} cx={12} cy={9} r={1.8} /><Path {...p} d="M8 16l-2 4 4-1M16 16l2 4-4-1" /></>);
    case 'naukari': return S(<><Rect {...p} x={3} y={8} width={18} height={11} rx={1.5} /><Path {...p} d="M9 8V6a2 2 0 012-2h2a2 2 0 012 2v2" /><Line {...p} x1={3} y1={13} x2={21} y2={13} /></>);
    case 'dhan-nivesh': return S(<><Circle {...p} cx={12} cy={12} r={8} /><Path {...p} d="M9.5 9h5M9.5 9c2.5 0 2.5 3 0 3h1l2.5 3M9.5 12h4" /></>);
    case 'electronics': return S(<><Rect {...p} x={7} y={2.5} width={10} height={19} rx={2} /><Line {...p} x1={7} y1={6} x2={17} y2={6} /><Line {...p} x1={7} y1={18} x2={17} y2={18} /><Circle {...p} cx={12} cy={19.7} r={0.6} /></>);
    case 'puja': return S(<><Path {...p} d="M6 15c0 2 3 3 6 3s6-1 6-3c0-1-6-2-6-2s-6 1-6 2z" /><Path {...p} d="M12 13c-2 0-3-1-3-2s3-3 3-3 3 2 3 3-1 2-3 2z" /><Path {...p} d="M12 5c0 2-1 2-1 3a1 1 0 002 0c0-1-1-1-1-3z" /></>);
    case 'murti-sthapana': return S(<><Path {...p} d="M12 3l4 4H8z" /><Path {...p} d="M8 7v10M16 7v10" /><Path {...p} d="M6 17h12v3H6z" /><Path {...p} d="M11 11h2v6h-2z" /></>);
    case 'yagya': return S(<><Path {...p} d="M12 3c2 3-1 4-1 6a1.5 1.5 0 003 0c0-1-.5-1.5-.5-2 1.5 1 2 2.5 2 4a3.5 3.5 0 01-7 0c0-3 2.5-5 3.5-8z" /><Path {...p} d="M6 18h12l-1.5 3H7.5z" /></>);
    default: return S(<><Circle {...p} cx={12} cy={12} r={9} /><Path {...p} d="M12 7v5l3 2" /></>);
  }
}
