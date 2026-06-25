import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { fonts } from '../theme/tokens';
import { useTheme } from '../theme/ThemeProvider';
import { ApiPlanet } from '../lib/api';

export type ChartStyle = 'north' | 'south' | 'east';
const SIGN = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const SIGN_ABBR = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'];
const SIGN_ABBR_HI = ['मे', 'वृ', 'मि', 'क', 'सिं', 'कन्', 'तु', 'वृश्', 'ध', 'मक', 'कुं', 'मी'];
const AB: Record<string, string> = { Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me', Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke' };
const AB_HI: Record<string, string> = { Sun: 'सू', Moon: 'चं', Mars: 'मं', Mercury: 'बु', Jupiter: 'गु', Venus: 'शु', Saturn: 'श', Rahu: 'रा', Ketu: 'के' };
const DEV = '०१२३४५६७८९';
const toDev = (n: number) => String(n).replace(/[0-9]/g, (x) => DEV[+x]);
const hnum = (h?: string) => { const m = String(h || '').match(/\d+/); return m ? Number(m[0]) : null; };
const planetAb = (p: string, hi: boolean) => (hi ? AB_HI[p] : AB[p]) || p.slice(0, 2);

// North-Indian 12-house label/planet anchor positions (viewBox 200) — 4 diamonds + 8 corners
const HPOS: Record<number, [number, number]> = {
  1: [100, 38], 2: [52, 22], 3: [25, 52], 4: [52, 100], 5: [25, 150], 6: [52, 178],
  7: [100, 150], 8: [148, 178], 9: [175, 150], 10: [148, 100], 11: [175, 52], 12: [148, 22],
};
// South-Indian fixed 4x4 sign cells
const SCELL: Record<number, [number, number]> = { 11: [0, 0], 0: [0, 1], 1: [0, 2], 2: [0, 3], 3: [1, 3], 4: [2, 3], 5: [3, 3], 6: [3, 2], 7: [3, 1], 8: [3, 0], 9: [2, 0], 10: [1, 0] };

export function VedicChart({ planets, ascendant, style, lang = 'en', size = 300 }: {
  planets: ApiPlanet[]; ascendant?: string | null; style: ChartStyle; lang?: 'en' | 'hi'; size?: number;
}) {
  const { theme } = useTheme();
  const stroke = theme.gold2;
  const numFill = theme.isDark ? '#e9b850' : '#9a6c12';
  const pFill = theme.isDark ? '#f6d27a' : '#7a510e';
  const sFill = theme.isDark ? '#d6b05c' : '#8a6f3a';
  const hi = lang === 'hi';
  const lagnaIdx = ascendant != null ? SIGN.indexOf(ascendant) : -1;
  const num = (n: number) => (hi ? toDev(n) : String(n));

  // group planets by house (north) and by sign-index (south/east)
  const byHouse: Record<number, string[]> = {};
  const bySign: Record<number, string[]> = {};
  (planets || []).forEach((p) => {
    if (!p.sign) return;
    const si = SIGN.indexOf(p.sign); if (si >= 0) (bySign[si] = bySign[si] || []).push(planetAb(p.planet, hi));
    const h = hnum(p.house); if (h) (byHouse[h] = byHouse[h] || []).push(planetAb(p.planet, hi));
  });

  const diamondLines = (
    <>
      <Rect x={10} y={10} width={180} height={180} stroke={stroke} strokeWidth={1.4} fill="none" />
      <Line x1={10} y1={10} x2={190} y2={190} stroke={stroke} strokeWidth={1} />
      <Line x1={190} y1={10} x2={10} y2={190} stroke={stroke} strokeWidth={1} />
      <Line x1={100} y1={10} x2={190} y2={100} stroke={stroke} strokeWidth={1} />
      <Line x1={190} y1={100} x2={100} y2={190} stroke={stroke} strokeWidth={1} />
      <Line x1={100} y1={190} x2={10} y2={100} stroke={stroke} strokeWidth={1} />
      <Line x1={10} y1={100} x2={100} y2={10} stroke={stroke} strokeWidth={1} />
    </>
  );
  const tokens = (arr: string[], cx: number, cy: number) =>
    arr.map((ab, i) => (
      <SvgText key={`${ab}${i}`} x={cx + ((i % 2) * 18 - (arr.length > 1 ? 9 : 0))} y={cy + 9 + Math.floor(i / 2) * 9}
        fontFamily={fonts.cinzel} fontWeight="700" fontSize={8} fill={pFill} textAnchor="middle">{ab}</SvgText>
    ));

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg viewBox="0 0 200 200" width="100%" height="100%">
        {style === 'south' ? (
          <>
            <Rect x={10} y={10} width={180} height={180} stroke={stroke} strokeWidth={1.4} fill="none" />
            {[1, 2, 3].map((i) => <Line key={`v${i}`} x1={10 + i * 45} y1={10} x2={10 + i * 45} y2={190} stroke={stroke} strokeWidth={0.9} />)}
            {[1, 2, 3].map((i) => <Line key={`h${i}`} x1={10} y1={10 + i * 45} x2={190} y2={10 + i * 45} stroke={stroke} strokeWidth={0.9} />)}
            {Object.keys(SCELL).map((si) => {
              const idx = Number(si); const [r, c] = SCELL[idx]; const x0 = 10 + c * 45; const y0 = 10 + r * 45;
              const isLag = idx === lagnaIdx;
              return (
                <React.Fragment key={si}>
                  <SvgText x={x0 + 4} y={y0 + 11} fontFamily={fonts.cinzelSemi} fontWeight="700" fontSize={8} fill={isLag ? pFill : sFill} textAnchor="start">{(hi ? SIGN_ABBR_HI : SIGN_ABBR)[idx]}{isLag ? ' ◹' : ''}</SvgText>
                  {tokens(bySign[idx] || [], x0 + 22, y0 + 16)}
                </React.Fragment>
              );
            })}
          </>
        ) : style === 'east' ? (
          <>
            {diamondLines}
            {Array.from({ length: 12 }).map((_, h) => {
              const si = h; // east: fixed signs by region (Aries top)
              const [x, y] = HPOS[h + 1]; const isLag = si === lagnaIdx;
              return (
                <React.Fragment key={`e${h}`}>
                  <SvgText x={x} y={y} fontFamily={fonts.cinzelSemi} fontWeight="700" fontSize={8} fill={isLag ? pFill : sFill} textAnchor="middle">{(hi ? SIGN_ABBR_HI : SIGN_ABBR)[si]}{isLag ? ' ◹' : ''}</SvgText>
                  {tokens(bySign[si] || [], x, y)}
                </React.Fragment>
              );
            })}
          </>
        ) : (
          <>
            {diamondLines}
            {Array.from({ length: 12 }).map((_, k) => {
              const h = k + 1; const [x, y] = HPOS[h];
              const rashi = lagnaIdx >= 0 ? ((lagnaIdx + h - 1) % 12) + 1 : h;
              return (
                <React.Fragment key={`n${h}`}>
                  <SvgText x={x} y={y} fontFamily={fonts.cinzelSemi} fontWeight="700" fontSize={9} fill={numFill} textAnchor="middle">{num(rashi)}</SvgText>
                  {tokens(byHouse[h] || [], x, y)}
                </React.Fragment>
              );
            })}
          </>
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { alignSelf: 'center' } });
