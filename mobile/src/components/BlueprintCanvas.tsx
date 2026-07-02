import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import { useLang } from '../i18n/LanguageProvider';
import { Blueprint, BpRoom, Bi } from '../lib/vastuBlueprint';

/**
 * BlueprintCanvas — professional architectural floor-plan renderer.
 *
 * The BUILT area always fills the sheet (the earlier bug scaled the canvas to the PLOT,
 * so a 30×45 house on a 500×500 plot became an unreadable dot). The plot now appears as
 * a small "site plan" inset instead. Drawn like an architect's sheet: warm paper, CAD
 * grid, double outer walls, door swings, window symbols, furniture line-art, compass
 * rose, dimension lines and a scale bar. All geometry is in feet → svg units.
 */

const L = (o: Bi | undefined | null, hi: boolean) => (o ? (hi ? o.hi : o.en) : '');
const ftLbl = (n: number) => `${Math.round(n)}'`;

// sheet palette (same in dark & light — it's a paper blueprint sheet)
const PAPER = '#f7f0e0';
const GRID = '#e3d8bd';
const WALL = '#4a3a20';
const INK = '#3a2a10';
const MUTE = '#8a744d';
const GOLD = '#b8860b';
const SEL = '#e9b850';

export function BlueprintCanvas({ bp, selected, onSelect, height = 380 }: {
  bp: Blueprint; selected: string | null; onSelect?: (id: string) => void; height?: number;
}) {
  const { lang } = useLang();
  const hi = lang === 'hi';

  const PL = 15, PT = 22, PR = 9, PB = 15;           // sheet padding (svg units)
  const VW = 160;
  const s = (VW - PL - PR) / bp.builtW;               // ft → svg
  const IH = bp.builtL * s;                           // inner (built) height
  const VH = PT + IH + PB;
  const X = (v: number) => PL + v * s;
  const Y = (v: number) => PT + v * s;
  const hasPlot = bp.plotW > bp.builtW || bp.plotL > bp.builtL;
  const bcx = bp.builtW / 2, bcy = bp.builtL / 2;     // built centre (ft)

  // grid pitch: a clean 5ft (or larger for big homes)
  const pitch = bp.builtW > 80 || bp.builtL > 80 ? 10 : 5;
  const gridV: number[] = []; for (let g = pitch; g < bp.builtW; g += pitch) gridV.push(g);
  const gridH: number[] = []; for (let g = pitch; g < bp.builtL; g += pitch) gridH.push(g);

  return (
    <View style={[styles.box, { backgroundColor: PAPER }]}>
      <Svg width="100%" height={height} viewBox={`0 0 ${VW} ${VH}`}>
        {/* sheet */}
        <Rect x={0} y={0} width={VW} height={VH} fill={PAPER} />
        <Rect x={1.2} y={1.2} width={VW - 2.4} height={VH - 2.4} fill="none" stroke={GOLD} strokeWidth={0.45} />

        {/* compass rose (top-right) */}
        <G>
          <Circle cx={VW - 13} cy={11} r={7.4} fill="none" stroke={GOLD} strokeWidth={0.5} />
          <Circle cx={VW - 13} cy={11} r={5.4} fill="none" stroke={GOLD} strokeWidth={0.25} opacity={0.6} />
          <Polygon points={`${VW - 13},4.6 ${VW - 14.6},11 ${VW - 13},9.6 ${VW - 11.4},11`} fill="#c0392b" />
          <Polygon points={`${VW - 13},17.4 ${VW - 14.6},11 ${VW - 13},12.4 ${VW - 11.4},11`} fill={WALL} />
          <Line x1={VW - 19.2} y1={11} x2={VW - 6.8} y2={11} stroke={WALL} strokeWidth={0.25} opacity={0.7} />
          <SvgText x={VW - 13} y={3.4} textAnchor="middle" fontSize={2.6} fontWeight="700" fill="#c0392b">{hi ? 'उ' : 'N'}</SvgText>
        </G>

        {/* site inset (top-left) — plot vs footprint */}
        {hasPlot && <SiteInset bp={bp} hi={hi} />}

        {/* sheet title */}
        <SvgText x={VW / 2} y={6.4} textAnchor="middle" fontSize={3.4} fontWeight="700" fill={INK}>
          {hi ? 'भूतल नक्शा (वास्तु अनुसार)' : 'Ground Floor Plan (per Vastu)'}
        </SvgText>
        <SvgText x={VW / 2} y={10.4} textAnchor="middle" fontSize={2.3} fill={MUTE}>
          {hi ? `निर्माण ${ftLbl(bp.builtW)} × ${ftLbl(bp.builtL)}` : `Built ${ftLbl(bp.builtW)} × ${ftLbl(bp.builtL)}`}{hasPlot ? (hi ? `  ·  प्लॉट ${ftLbl(bp.plotW)} × ${ftLbl(bp.plotL)}` : `  ·  Plot ${ftLbl(bp.plotW)} × ${ftLbl(bp.plotL)}`) : ''}
        </SvgText>

        {/* CAD grid inside the built area */}
        {gridV.map((g) => <Line key={`v${g}`} x1={X(g)} y1={Y(0)} x2={X(g)} y2={Y(bp.builtL)} stroke={GRID} strokeWidth={0.18} />)}
        {gridH.map((g) => <Line key={`h${g}`} x1={X(0)} y1={Y(g)} x2={X(bp.builtW)} y2={Y(g)} stroke={GRID} strokeWidth={0.18} />)}

        {/* rooms (fill + inner walls) */}
        {bp.rooms.map((r) => (
          <RoomShape key={r.id} r={r} X={X} Y={Y} s={s} hi={hi} on={selected === r.id} onSelect={onSelect} bcx={bcx} bcy={bcy} builtW={bp.builtW} builtL={bp.builtL} />
        ))}

        {/* outer double wall on top */}
        <Rect x={X(0)} y={Y(0)} width={bp.builtW * s} height={IH} fill="none" stroke={WALL} strokeWidth={1.15} />
        <Rect x={X(0) + 0.85} y={Y(0) + 0.85} width={bp.builtW * s - 1.7} height={IH - 1.7} fill="none" stroke={WALL} strokeWidth={0.3} />

        {/* entrance: wall gap + steps + label */}
        <Entrance bp={bp} X={X} Y={Y} hi={hi} />

        {/* water tank markers */}
        {bp.markers.map((m) => (
          <G key={m.id}>
            {m.kind === 'tank-overhead'
              ? <Rect x={X(m.x) - 2.2} y={Y(m.y) - 2.2} width={4.4} height={4.4} fill="none" stroke="#2980b9" strokeWidth={0.45} strokeDasharray="1 0.6" />
              : <Circle cx={X(m.x)} cy={Y(m.y)} r={2.2} fill="none" stroke="#2980b9" strokeWidth={0.45} strokeDasharray="1 0.6" />}
            <SvgText x={X(m.x)} y={Y(m.y) + 0.9} textAnchor="middle" fontSize={2} fill="#2980b9">💧</SvgText>
          </G>
        ))}

        {/* overall dimension lines */}
        <DimLine x1={X(0)} y1={Y(bp.builtL) + 5} x2={X(bp.builtW)} y2={Y(bp.builtL) + 5} label={ftLbl(bp.builtW)} />
        <DimLine x1={PL - 5} y1={Y(0)} x2={PL - 5} y2={Y(bp.builtL)} label={ftLbl(bp.builtL)} vertical />

        {/* scale bar */}
        <G>
          <Line x1={PL} y1={VH - 5.2} x2={PL + 10 * s} y2={VH - 5.2} stroke={INK} strokeWidth={0.7} />
          <Line x1={PL} y1={VH - 6.4} x2={PL} y2={VH - 4} stroke={INK} strokeWidth={0.35} />
          <Line x1={PL + 10 * s} y1={VH - 6.4} x2={PL + 10 * s} y2={VH - 4} stroke={INK} strokeWidth={0.35} />
          <SvgText x={PL + 5 * s} y={VH - 2.2} textAnchor="middle" fontSize={2.2} fill={MUTE}>10 ft</SvgText>
          <SvgText x={VW - PR} y={VH - 2.2} textAnchor="end" fontSize={2.2} fill={MUTE}>{hi ? `ग्रिड ${pitch} ft` : `grid ${pitch} ft`}</SvgText>
        </G>
      </Svg>
    </View>
  );
}

// ── one room: fill, walls, door swing, windows, labels, furniture ────────────
function RoomShape({ r, X, Y, s, hi, on, onSelect, bcx, bcy, builtW, builtL }: {
  r: BpRoom; X: (v: number) => number; Y: (v: number) => number; s: number; hi: boolean;
  on: boolean; onSelect?: (id: string) => void; bcx: number; bcy: number; builtW: number; builtL: number;
}) {
  const x = X(r.x), y = Y(r.y), w = r.w * s, h = r.h * s;
  const open = r.type === 'brahmasthan' || r.type === 'veranda';
  const minSide = Math.min(w, h);
  const nameF = Math.max(2.05, Math.min(3.1, minSide * 0.16));
  const showDims = minSide > 9.5;
  const showName = minSide > 5;
  const cx = x + w / 2, cy = y + h / 2;

  // door on the edge facing the built centre (skip for open spaces)
  let door: React.ReactNode = null;
  if (!open) {
    const dxc = bcx - (r.x + r.w / 2); const dyc = bcy - (r.y + r.h / 2);
    const horiz = Math.abs(dxc) > Math.abs(dyc);
    const dw = Math.min(3 * s, Math.max(2 * s, minSide * 0.3));
    if (horiz) {
      const ex = dxc > 0 ? x + w : x;                     // door on E or W wall
      const dy0 = cy - dw / 2;
      door = (
        <>
          <Line x1={ex} y1={dy0} x2={ex} y2={dy0 + dw} stroke={PAPER} strokeWidth={1.1} />
          <Path d={`M ${ex} ${dy0} A ${dw} ${dw} 0 0 ${dxc > 0 ? 1 : 0} ${dxc > 0 ? ex + dw : ex - dw} ${dy0 + dw}`} fill="none" stroke={MUTE} strokeWidth={0.28} />
          <Line x1={ex} y1={dy0} x2={dxc > 0 ? ex + dw : ex - dw} y2={dy0 + dw} stroke={WALL} strokeWidth={0.4} />
        </>
      );
    } else {
      const ey = dyc > 0 ? y + h : y;                     // door on S or N wall
      const dx0 = cx - dw / 2;
      door = (
        <>
          <Line x1={dx0} y1={ey} x2={dx0 + dw} y2={ey} stroke={PAPER} strokeWidth={1.1} />
          <Path d={`M ${dx0} ${ey} A ${dw} ${dw} 0 0 ${dyc > 0 ? 0 : 1} ${dx0 + dw} ${dyc > 0 ? ey + dw : ey - dw}`} fill="none" stroke={MUTE} strokeWidth={0.28} />
          <Line x1={dx0} y1={ey} x2={dx0 + dw} y2={dyc > 0 ? ey + dw : ey - dw} stroke={WALL} strokeWidth={0.4} />
        </>
      );
    }
  }

  // window symbols on exterior walls (double tick)
  const wins: React.ReactNode[] = [];
  const winLen = Math.min(4 * s, Math.max(2.4 * s, w * 0.3));
  const eps = 0.15;
  if (!open) {
    if (r.y <= eps) wins.push(<WindowSym key="n" x1={cx - winLen / 2} y1={y} x2={cx + winLen / 2} y2={y} />);
    if (Math.abs(r.y + r.h - builtL) <= eps) wins.push(<WindowSym key="s" x1={cx - winLen / 2} y1={y + h} x2={cx + winLen / 2} y2={y + h} />);
    if (r.x <= eps) wins.push(<WindowSym key="w" x1={x} y1={cy - winLen / 2} x2={x} y2={cy + winLen / 2} vertical />);
    if (Math.abs(r.x + r.w - builtW) <= eps) wins.push(<WindowSym key="e" x1={x + w} y1={cy - winLen / 2} x2={x + w} y2={cy + winLen / 2} vertical />);
  }

  return (
    <G onPress={onSelect ? () => onSelect(r.id) : undefined}>
      <Rect x={x} y={y} width={w} height={h} fill={r.color} fillOpacity={on ? 0.62 : open ? 0.28 : 0.42} stroke={on ? SEL : WALL} strokeWidth={on ? 0.9 : 0.5} strokeDasharray={open ? '1.4 0.9' : undefined} />
      <Furniture r={r} x={x} y={y} w={w} h={h} />
      {door}
      {wins}
      {showName && (
        <SvgText x={cx} y={showDims ? cy - 0.4 : cy + nameF * 0.35} textAnchor="middle" fontSize={nameF} fontWeight="700" fill={INK}>{L(r.name, hi)}</SvgText>
      )}
      {showDims && (
        <SvgText x={cx} y={cy + 3} textAnchor="middle" fontSize={2.15} fill={MUTE}>{ftLbl(r.w)} × {ftLbl(r.h)}</SvgText>
      )}
    </G>
  );
}

function WindowSym({ x1, y1, x2, y2, vertical }: { x1: number; y1: number; x2: number; y2: number; vertical?: boolean }) {
  const o = 0.55;
  return (
    <>
      <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={PAPER} strokeWidth={1.05} />
      {vertical ? (
        <>
          <Line x1={x1 - o} y1={y1} x2={x2 - o} y2={y2} stroke={WALL} strokeWidth={0.28} />
          <Line x1={x1 + o} y1={y1} x2={x2 + o} y2={y2} stroke={WALL} strokeWidth={0.28} />
        </>
      ) : (
        <>
          <Line x1={x1} y1={y1 - o} x2={x2} y2={y2 - o} stroke={WALL} strokeWidth={0.28} />
          <Line x1={x1} y1={y1 + o} x2={x2} y2={y2 + o} stroke={WALL} strokeWidth={0.28} />
        </>
      )}
    </>
  );
}

// ── furniture line-art (drawn only when the room is big enough) ─────────────
function Furniture({ r, x, y, w, h }: { r: BpRoom; x: number; y: number; w: number; h: number }) {
  if (Math.min(w, h) < 7) return null;
  const st = { stroke: INK, strokeWidth: 0.3, fill: 'none' as const, opacity: 0.8 };
  const t = r.type;
  if (t === 'master' || t === 'bedroom' || t === 'guestBedroom') {
    const bw = w * 0.42, bh = h * 0.5, bx = x + 1.2, by = y + h - bh - 1.2;
    return (
      <G opacity={0.85}>
        <Rect x={bx} y={by} width={bw} height={bh} rx={0.6} {...st} />
        <Rect x={bx + 0.7} y={by + 0.7} width={bw * 0.38 - 0.7} height={bh * 0.22} rx={0.4} {...st} />
        <Rect x={bx + bw * 0.45} y={by + 0.7} width={bw * 0.38} height={bh * 0.22} rx={0.4} {...st} />
        <Line x1={bx} y1={by + bh * 0.36} x2={bx + bw} y2={by + bh * 0.36} {...st} />
        <Rect x={x + w - 2.6} y={y + 1.2} width={1.6} height={h * 0.45} {...st} />
        <Line x1={x + w - 2.6} y1={y + 1.2 + h * 0.225} x2={x + w - 1} y2={y + 1.2 + h * 0.225} {...st} />
      </G>
    );
  }
  if (t === 'kitchen') {
    return (
      <G opacity={0.85}>
        <Rect x={x + 0.9} y={y + 0.9} width={w - 1.8} height={2.4} {...st} />
        <Rect x={x + 0.9} y={y + 0.9} width={2.4} height={h * 0.6} {...st} />
        <Circle cx={x + 2.1} cy={y + h * 0.38} r={0.75} {...st} />
        <Circle cx={x + w * 0.38} cy={y + 2.1} r={0.55} {...st} />
        <Circle cx={x + w * 0.52} cy={y + 2.1} r={0.55} {...st} />
      </G>
    );
  }
  if (t === 'living') {
    const sw = w * 0.5, sx = x + (w - sw) / 2, sy = y + h - 3.6;
    return (
      <G opacity={0.85}>
        <Rect x={sx} y={sy} width={sw} height={2.3} rx={0.7} {...st} />
        <Rect x={sx - 2.6} y={sy - 2.8} width={2.1} height={2.3} rx={0.6} {...st} />
        <Rect x={sx + sw + 0.5} y={sy - 2.8} width={2.1} height={2.3} rx={0.6} {...st} />
        <Line x1={sx + sw * 0.2} y1={y + 1.1} x2={sx + sw * 0.8} y2={y + 1.1} stroke={INK} strokeWidth={0.55} opacity={0.8} />
      </G>
    );
  }
  if (t === 'dining') {
    const cx = x + w / 2, cy = y + h / 2;
    return (
      <G opacity={0.85}>
        <Ellipse cx={cx} cy={cy} rx={Math.min(3.4, w * 0.24)} ry={Math.min(2.1, h * 0.16)} {...st} />
        {[[-1, 0], [1, 0], [0, -1], [0, 1]].map(([dx, dy], i) => (
          <Rect key={i} x={cx + dx * (Math.min(3.4, w * 0.24) + 1.2) - 0.7} y={cy + dy * (Math.min(2.1, h * 0.16) + 1.2) - 0.7} width={1.4} height={1.4} rx={0.3} {...st} />
        ))}
      </G>
    );
  }
  if (t === 'bath') {
    return (
      <G opacity={0.85}>
        <Rect x={x + 1} y={y + 1} width={1.9} height={2.6} rx={0.5} {...st} />
        <Ellipse cx={x + 1.95} cy={y + 2} rx={0.65} ry={0.85} {...st} />
        <Circle cx={x + w - 2} cy={y + 1.9} r={0.85} {...st} />
      </G>
    );
  }
  if (t === 'pooja') {
    const cx = x + w / 2;
    return (
      <G opacity={0.9}>
        <Rect x={cx - 1.7} y={y + 1.6} width={3.4} height={2.3} {...st} />
        <Polygon points={`${cx},${y + 0.5} ${cx - 1.9},${y + 1.6} ${cx + 1.9},${y + 1.6}`} {...st} />
        <Line x1={cx} y1={y + 2.3} x2={cx} y2={y + 3.2} {...st} />
      </G>
    );
  }
  if (t === 'stairs') {
    const n = 5, step = (h - 2) / n;
    return (
      <G opacity={0.85}>
        {Array.from({ length: n }).map((_, i) => (
          <Line key={i} x1={x + 1} y1={y + 1 + i * step} x2={x + w - 1} y2={y + 1 + i * step} {...st} />
        ))}
        <Line x1={x + w / 2} y1={y + 1} x2={x + w / 2} y2={y + h - 1.6} stroke={INK} strokeWidth={0.25} opacity={0.7} />
        <Polygon points={`${x + w / 2},${y + h - 1} ${x + w / 2 - 0.7},${y + h - 1.9} ${x + w / 2 + 0.7},${y + h - 1.9}`} fill={INK} opacity={0.7} />
      </G>
    );
  }
  if (t === 'parking') {
    const cw = Math.min(w * 0.55, 6), ch = Math.min(h * 0.42, 3.4), cx0 = x + (w - cw) / 2, cy0 = y + (h - ch) / 2;
    return (
      <G opacity={0.85}>
        <Rect x={cx0} y={cy0} width={cw} height={ch} rx={1} {...st} />
        <Circle cx={cx0 + cw * 0.25} cy={cy0 + ch} r={0.6} {...st} />
        <Circle cx={cx0 + cw * 0.75} cy={cy0 + ch} r={0.6} {...st} />
      </G>
    );
  }
  if (t === 'study') {
    return (
      <G opacity={0.85}>
        <Rect x={x + 1} y={y + 1} width={w * 0.5} height={1.9} {...st} />
        <Rect x={x + w * 0.22} y={y + 3.4} width={1.6} height={1.6} rx={0.4} {...st} />
      </G>
    );
  }
  if (t === 'brahmasthan') {
    const cx = x + w / 2, cy = y + h / 2, rr = Math.min(w, h) * 0.18;
    return (
      <G opacity={0.7}>
        <Circle cx={cx} cy={cy} r={rr} fill="none" stroke={GOLD} strokeWidth={0.3} strokeDasharray="0.9 0.7" />
        <Circle cx={cx} cy={cy} r={rr * 0.55} fill="none" stroke={GOLD} strokeWidth={0.25} strokeDasharray="0.7 0.6" />
      </G>
    );
  }
  return null;
}

// dimension line with end ticks
function DimLine({ x1, y1, x2, y2, label, vertical }: { x1: number; y1: number; x2: number; y2: number; label: string; vertical?: boolean }) {
  const t = 1.1;
  return (
    <G>
      <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={INK} strokeWidth={0.3} />
      {vertical ? (
        <>
          <Line x1={x1 - t} y1={y1} x2={x1 + t} y2={y1} stroke={INK} strokeWidth={0.3} />
          <Line x1={x2 - t} y1={y2} x2={x2 + t} y2={y2} stroke={INK} strokeWidth={0.3} />
          <SvgText x={x1 - 2} y={(y1 + y2) / 2} textAnchor="middle" fontSize={2.5} fill={INK} rotation={-90} origin={`${x1 - 2},${(y1 + y2) / 2}`}>{label}</SvgText>
        </>
      ) : (
        <>
          <Line x1={x1} y1={y1 - t} x2={x1} y2={y1 + t} stroke={INK} strokeWidth={0.3} />
          <Line x1={x2} y1={y2 - t} x2={x2} y2={y2 + t} stroke={INK} strokeWidth={0.3} />
          <SvgText x={(x1 + x2) / 2} y={y1 + 3.1} textAnchor="middle" fontSize={2.5} fill={INK}>{label}</SvgText>
        </>
      )}
    </G>
  );
}

// entrance: gap in outer wall + threshold steps + label
function Entrance({ bp, X, Y, hi }: { bp: Blueprint; X: (v: number) => number; Y: (v: number) => number; hi: boolean }) {
  const e = bp.entrance;
  const vert = e.x1 === e.x2;
  const x1 = X(e.x1), y1 = Y(e.y1), x2 = X(e.x2), y2 = Y(e.y2);
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const outN = e.y1 === 0 && !vert ? -1 : 1;            // which side is outside
  const outW = e.x1 === 0 && vert ? -1 : 1;
  return (
    <G>
      <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={PAPER} strokeWidth={1.5} />
      {vert ? (
        <>
          {[1.1, 2.1].map((o) => <Line key={o} x1={x1 + outW * o} y1={y1 + 0.6} x2={x2 + outW * o} y2={y2 - 0.6} stroke={WALL} strokeWidth={0.28} />)}
          <SvgText x={mx + outW * 4.6} y={my} textAnchor="middle" fontSize={2.4} fontWeight="700" fill={GOLD} rotation={outW > 0 ? 90 : -90} origin={`${mx + outW * 4.6},${my}`}>⌂ {L(e.label, hi)}</SvgText>
        </>
      ) : (
        <>
          {[1.1, 2.1].map((o) => <Line key={o} x1={x1 + 0.6} y1={y1 + outN * o} x2={x2 - 0.6} y2={y2 + outN * o} stroke={WALL} strokeWidth={0.28} />)}
          <SvgText x={mx} y={my + outN * 4.4 + (outN > 0 ? 0 : 0.8)} textAnchor="middle" fontSize={2.4} fontWeight="700" fill={GOLD}>⌂ {L(e.label, hi)}</SvgText>
        </>
      )}
    </G>
  );
}

// small site plan (plot + footprint) — replaces the old broken full-plot scaling
function SiteInset({ bp, hi }: { bp: Blueprint; hi: boolean }) {
  const IW = 26, IX = 5, IY = 4.5;
  const si = IW / Math.max(bp.plotW, bp.plotL);
  const pw = bp.plotW * si, pl = bp.plotL * si;
  const ox = IX + (IW - pw) / 2, oy = IY + (IW - pl) / 2;
  return (
    <G>
      <Rect x={IX - 1.6} y={IY - 2.4} width={IW + 3.2} height={IW + 6.4} fill={PAPER} stroke={GRID} strokeWidth={0.3} />
      <SvgText x={IX + IW / 2} y={IY - 0.5} textAnchor="middle" fontSize={1.9} fill={MUTE}>{hi ? 'साइट प्लान' : 'SITE PLAN'}</SvgText>
      <Rect x={ox} y={oy} width={pw} height={pl} fill="none" stroke={MUTE} strokeWidth={0.3} strokeDasharray="1 0.7" />
      <Rect x={ox + bp.offX * si} y={oy + bp.offY * si} width={bp.builtW * si} height={bp.builtL * si} fill={SEL} fillOpacity={0.5} stroke={GOLD} strokeWidth={0.3} />
      <SvgText x={IX + IW / 2} y={IY + IW + 3.4} textAnchor="middle" fontSize={1.8} fill={MUTE}>
        {hi ? `उ. खुला ${ftLbl(bp.margins.n)} · पू. ${ftLbl(bp.margins.e)}` : `open N ${ftLbl(bp.margins.n)} · E ${ftLbl(bp.margins.e)}`}
      </SvgText>
    </G>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#c9a94e55' },
});
