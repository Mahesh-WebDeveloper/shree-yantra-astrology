import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect, Line, G, Text as SvgText } from 'react-native-svg';
import { fonts } from '../theme/tokens';
import { useTheme } from '../theme/ThemeProvider';
import { ApiPlanet } from '../lib/api';
import { ChartExplainModal } from './ChartExplainModal';
import { ExplainView, explainHouse, explainPlanet } from '../data/jyotish';

export type ChartStyle = 'north' | 'south' | 'east';
const SIGN = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const SIGN_ABBR = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'];
const SIGN_ABBR_HI = ['मे', 'वृ', 'मि', 'क', 'सिं', 'कन्', 'तु', 'वृश्', 'ध', 'मक', 'कुं', 'मी'];
const AB: Record<string, string> = { Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me', Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke' };
const AB_HI: Record<string, string> = { Sun: 'सू', Moon: 'चं', Mars: 'मं', Mercury: 'बु', Jupiter: 'गु', Venus: 'शु', Saturn: 'श', Rahu: 'रा', Ketu: 'के' };
const hnum = (h?: string) => { const m = String(h || '').match(/\d+/); return m ? Number(m[0]) : null; };
const planetAb = (p: string, hi: boolean) => (hi ? AB_HI[p] : AB[p]) || p.slice(0, 2);

// North-Indian 12-house label/planet anchor positions (viewBox 200) — 4 diamonds + 8 corners
const HPOS: Record<number, [number, number]> = {
  1: [100, 38], 2: [52, 22], 3: [25, 52], 4: [52, 100], 5: [25, 150], 6: [52, 178],
  7: [100, 150], 8: [148, 178], 9: [175, 150], 10: [148, 100], 11: [175, 52], 12: [148, 22],
};
// South-Indian fixed 4x4 sign cells
const SCELL: Record<number, [number, number]> = { 11: [0, 0], 0: [0, 1], 1: [0, 2], 2: [0, 3], 3: [1, 3], 4: [2, 3], 5: [3, 3], 6: [3, 2], 7: [3, 1], 8: [3, 0], 9: [2, 0], 10: [1, 0] };

export function VedicChart({ planets, ascendant, style, lang = 'en', size = 300, interactive = true }: {
  planets: ApiPlanet[]; ascendant?: string | null; style: ChartStyle; lang?: 'en' | 'hi'; size?: number; interactive?: boolean;
}) {
  const { theme } = useTheme();
  const [view, setView] = useState<ExplainView | null>(null);
  const stroke = theme.gold2;
  const numFill = theme.isDark ? '#e9b850' : theme.gold1;
  const chipBg = theme.isDark ? '#0c0c18' : '#ffffff';
  const pFill = theme.isDark ? '#f6d27a' : theme.goldText;
  const sFill = theme.isDark ? '#d6b05c' : theme.textSoft;
  const hi = lang === 'hi';
  const lagnaIdx = ascendant != null ? SIGN.indexOf(ascendant) : -1;
  const num = (n: number) => String(n); // chart numerals always English (both languages)

  const openHouse = (h: number) => interactive && setView(explainHouse(planets, ascendant, h, lang));
  const openPlanet = (p: string) => interactive && setView(explainPlanet(planets, ascendant, p, lang));
  const houseOfSignIdx = (si: number) => (lagnaIdx >= 0 ? ((si - lagnaIdx + 12) % 12) + 1 : si + 1);

  // group FULL planet names by house (north) and by sign-index (south/east)
  const byHouse: Record<number, string[]> = {};
  const bySign: Record<number, string[]> = {};
  (planets || []).forEach((p) => {
    if (!p.sign) return;
    const si = SIGN.indexOf(p.sign); if (si >= 0) (bySign[si] = bySign[si] || []).push(p.planet);
    const h = hnum(p.house); if (h) (byHouse[h] = byHouse[h] || []).push(p.planet);
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

  // planet tokens — each tappable (full name → explain)
  const tokens = (names: string[], cx: number, cy: number) =>
    names.map((name, i) => {
      const ab = planetAb(name, hi);
      const tx = cx + ((i % 2) * 18 - (names.length > 1 ? 9 : 0));
      const ty = cy + 12 + Math.floor(i / 2) * 9;
      const w = ab.length * 4.6 + 4;
      return (
        <G key={`${name}${i}`} onPress={() => openPlanet(name)}>
          <Rect x={tx - w / 2 - 3} y={ty - 9} width={w + 6} height={13} rx={2.2} fill="transparent" />
          <Rect x={tx - w / 2} y={ty - 7} width={w} height={9} rx={2.2} fill={chipBg} opacity={0.9} />
          <SvgText x={tx} y={ty} fontFamily={fonts.cinzel} fontWeight="700" fontSize={8} fill={pFill} textAnchor="middle">{ab}</SvgText>
        </G>
      );
    });

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
                  <G onPress={() => openHouse(houseOfSignIdx(idx))}>
                    <Rect x={x0} y={y0} width={45} height={18} fill="transparent" />
                    <SvgText x={x0 + 4} y={y0 + 11} fontFamily={fonts.cinzelSemi} fontWeight="700" fontSize={8} fill={isLag ? pFill : sFill} textAnchor="start">{(hi ? SIGN_ABBR_HI : SIGN_ABBR)[idx]}{isLag ? ' ◹' : ''}</SvgText>
                  </G>
                  {tokens(bySign[idx] || [], x0 + 22, y0 + 16)}
                </React.Fragment>
              );
            })}
          </>
        ) : style === 'east' ? (
          <>
            {diamondLines}
            {Array.from({ length: 12 }).map((_, h) => {
              const si = h; const [x, y] = HPOS[h + 1]; const isLag = si === lagnaIdx;
              return (
                <React.Fragment key={`e${h}`}>
                  <G onPress={() => openHouse(houseOfSignIdx(si))}>
                    <Rect x={x - 14} y={y - 9} width={28} height={16} fill="transparent" />
                    <SvgText x={x} y={y} fontFamily={fonts.cinzelSemi} fontWeight="700" fontSize={8} fill={isLag ? pFill : sFill} textAnchor="middle">{(hi ? SIGN_ABBR_HI : SIGN_ABBR)[si]}{isLag ? ' ◹' : ''}</SvgText>
                  </G>
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
              const lbl = num(rashi); const nw = lbl.length * 6 + 5;
              return (
                <React.Fragment key={`n${h}`}>
                  {tokens(byHouse[h] || [], x, y)}
                  <G onPress={() => openHouse(h)}>
                    <Rect x={x - nw / 2 - 4} y={y - 11} width={nw + 8} height={15} rx={2.4} fill="transparent" />
                    <Rect x={x - nw / 2} y={y - 8} width={nw} height={11} rx={2.4} fill={chipBg} opacity={0.95} />
                    <SvgText x={x} y={y} fontFamily={fonts.cinzelSemi} fontWeight="700" fontSize={9} fill={numFill} textAnchor="middle">{lbl}</SvgText>
                  </G>
                </React.Fragment>
              );
            })}
          </>
        )}
      </Svg>
      <ChartExplainModal view={view} lang={lang} onClose={() => setView(null)} />
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { alignSelf: 'center' } });
