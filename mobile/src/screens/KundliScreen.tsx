import React, { useState, useEffect, useRef } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, ViewStyle, StyleProp } from 'react-native';
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Rect, Line, Text as SvgText, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { runOnJS, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { useTheme } from '../theme/ThemeProvider';
import { Theme, fonts, radii } from '../theme/tokens';
import { Screen } from '../components/Screen';
import { BrandHeader } from '../components/BrandHeader';
import { GradientText } from '../components/GradientText';
import { GoldButton } from '../components/GoldButton';
import { openAppDrawer } from '../navigation/AppDrawerHost';
import { hTap } from '../lib/haptics';
import {
  PROFILE, TABS, HOUSES, CHART_PLANETS, KEY_INSIGHT, PLANETS, CURRENT_DASHA,
  DASHA_TIMELINE, YOGAS, DOSHAS, PlanetRow, ChartPlanet,
} from '../data/kundli';
import { getKundli, getDasha, getAiInsights, getVargaCharts, ApiPlanet, KundliInsight, VargaChart } from '../lib/api';
import { birthFromProfile } from '../lib/birth';
import { useScreen } from '../context/AppConfigProvider';
import { useT, useLang } from '../i18n/LanguageProvider';
import { aSign, aPlanet } from '../i18n/astro';

type KundliTab = typeof TABS[number]['key'];

// ── live backend → kundli mapping ──
// (testing default; baad me ye profile/onboarding ke birth details se aayega)
const DEFAULT_BIRTH = { lat: 26.9124, lng: 75.7873, dob: '01-01-2000', tob: '06:42', tz: '+05:30', place: 'Jaipur' };
const ABBR: Record<string, string> = { Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me', Jupiter: 'Ju', Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke' };
const GLYPH: Record<string, string> = { Sun: '☉', Moon: '☽', Mars: '♂', Mercury: '☿', Jupiter: '♃', Venus: '♀', Saturn: '♄', Rahu: '☊', Ketu: '☋' };
const HOUSE_OFF = [0, -13, 13, -25, 25, -36, 36];

// ── chart-style support (sign-based for South/East Indian) ──
const SIGN_IDX: Record<string, number> = { Aries: 0, Taurus: 1, Gemini: 2, Cancer: 3, Leo: 4, Virgo: 5, Libra: 6, Scorpio: 7, Sagittarius: 8, Capricorn: 9, Aquarius: 10, Pisces: 11 };
const SIGN_ABBR = ['Ar', 'Ta', 'Ge', 'Cn', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'];
const SIGN_ABBR_HI = ['मे', 'वृ', 'मि', 'क', 'सिं', 'कन्', 'तु', 'वृश्', 'ध', 'मक', 'कुं', 'मी'];
const ABBR_HI: Record<string, string> = { Sun: 'सू', Moon: 'चं', Mars: 'मं', Mercury: 'बु', Jupiter: 'गु', Venus: 'शु', Saturn: 'श', Rahu: 'रा', Ketu: 'के' };
const DEV_DIGITS = '०१२३४५६७८९';
const toDev = (n: number | string) => String(n).replace(/[0-9]/g, (d) => DEV_DIGITS[+d]);
const planetAbbr = (planet: string, lang: 'en' | 'hi') => (lang === 'hi' ? ABBR_HI[planet] : ABBR[planet]) || ABBR[planet] || planet.slice(0, 2);
const signAbbr = (i: number, lang: 'en' | 'hi') => (lang === 'hi' ? SIGN_ABBR_HI[i] : SIGN_ABBR[i]);
// South Indian: signs fixed in a 4x4 grid (Pisces top-left, clockwise). signIndex -> [row,col]
const SOUTH_CELL: Record<number, [number, number]> = {
  11: [0, 0], 0: [0, 1], 1: [0, 2], 2: [0, 3], 3: [1, 3], 4: [2, 3], 5: [3, 3], 6: [3, 2], 7: [3, 1], 8: [3, 0], 9: [2, 0], 10: [1, 0],
};
type ChartStyle = 'north' | 'south' | 'east';
const CHART_STYLES: ChartStyle[] = ['north', 'south', 'east'];
// raw planets -> { signIndex: [abbr,...] }
function planetsBySign(planets: ApiPlanet[], lang: 'en' | 'hi' = 'en'): Record<number, string[]> {
  const map: Record<number, string[]> = {};
  planets.forEach((p) => {
    if (!p.sign) return;
    const i = SIGN_IDX[p.sign]; if (i == null) return;
    (map[i] = map[i] || []).push(planetAbbr(p.planet, lang));
  });
  return map;
}
const houseNum = (h?: string) => { const m = (h || '').match(/\d+/); return m ? Number(m[0]) : null; };
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtDob = (ddmmyyyy: string) => { const [d, m, y] = ddmmyyyy.split('-'); return `${d} ${MON[(Number(m) || 1) - 1]} ${y}`; }; // 15-06-1990 → 15 Jun 1990
// "00:00 18/06/2026 +05:30" → "Jun 2026"
const fmtMonYr = (std: string) => { const p = String(std).split(' '); const dmy = (p[1] || '').split('/'); return dmy.length === 3 ? `${MON[(Number(dmy[1]) || 1) - 1]} ${dmy[2]}` : std; };
function dashaToRows(dasha: { lord: string; start: string; end: string; durationText: string }[]): PlanetRow[] {
  return dasha.map((d, i) => ({
    glyph: GLYPH[d.lord] || '✦',
    name: d.lord.toUpperCase(),
    detail: `${fmtMonYr(d.start)} – ${fmtMonYr(d.end)} · ${d.durationText}${i === 0 ? ' · running now' : ''}`,
    tag: i === 0 ? 'Active' : 'Upcoming',
    strength: (i === 0 ? 'solid' : 'plain') as PlanetRow['strength'],
  }));
}
// "SunaphaYoga" → "Sunapha Yoga" (trailing digits hata ke)
const prettyName = (n: string) => n.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\d+[A-Z]?$/, '').trim();
function yogaToRows(yogas: { name: string; description: string }[]): PlanetRow[] {
  return yogas.map((y) => ({
    glyph: '✦',
    name: prettyName(y.name),
    detail: y.description || 'Beneficial yoga present in your chart',
    tag: 'Present',
    strength: 'soft' as PlanetRow['strength'],
  }));
}
function doshaToRows(doshas: { name: string; present: boolean; detail: string; tag: string; source?: string }[]): PlanetRow[] {
  const G: Record<string, string> = { 'Mangal Dosha': '♂', 'Kaal Sarp Dosha': '☊', 'Sade Sati': '♄' };
  return doshas.map((d) => ({
    glyph: G[d.name] || '☉',
    name: d.name,
    detail: d.source ? `${d.detail} · ${d.source}` : d.detail,
    tag: d.tag || (d.present ? 'Present' : 'Clear'),
    strength: (d.present ? 'plain' : 'solid') as PlanetRow['strength'],
  }));
}

function toPlanetRows(planets: ApiPlanet[], lang: 'en' | 'hi' = 'en'): PlanetRow[] {
  const hi = lang === 'hi';
  return planets
    .filter((p) => p.sign)
    .map((p) => ({
      glyph: GLYPH[p.planet] || '✦',
      name: hi ? aPlanet(p.planet, lang) : p.planet.toUpperCase(),
      detail: `${(p.house || '').replace('House', hi ? 'भाव ' : 'House ')} · ${hi ? aSign(p.sign, lang) : p.sign} · ${(p.degreeInSign || '').split("'")[0]}`,
      tag: p.isRetrograde === 'True' ? (hi ? 'वक्री' : 'Retrograde') : (p.isCombust === 'True' ? (hi ? 'अस्त' : 'Combust') : ((p.nakshatra || '').split(' - ')[0] || (hi ? 'मार्गी' : 'Direct'))),
      strength: (p.isRetrograde === 'True' ? 'soft' : 'plain') as PlanetRow['strength'],
    }));
}
function toChartPlanets(planets: ApiPlanet[], lang: 'en' | 'hi' = 'en'): ChartPlanet[] {
  const counts: Record<number, number> = {};
  const out: ChartPlanet[] = [];
  planets.forEach((p) => {
    if (!p.sign) return;
    const n = houseNum(p.house); if (!n) return;
    const h = HOUSES.find((x) => x.n === n); if (!h) return;
    const idx = counts[n] || 0; counts[n] = idx + 1;
    out.push({ abbr: planetAbbr(p.planet, lang), x: h.x + (HOUSE_OFF[idx] || 0), y: h.y + 14 });
  });
  return out;
}
function toChartPlanetsBySign(planets: ApiPlanet[], ascendantSign: string | null | undefined, lang: 'en' | 'hi' = 'en'): ChartPlanet[] {
  const lagnaIdx = ascendantSign ? SIGN_IDX[ascendantSign] : null;
  if (lagnaIdx == null) return [];
  const counts: Record<number, number> = {};
  const out: ChartPlanet[] = [];
  planets.forEach((p) => {
    if (!p.sign) return;
    const idx = SIGN_IDX[p.sign]; if (idx == null) return;
    const house = ((idx - lagnaIdx + 12) % 12) + 1;
    const h = HOUSES.find((x) => x.n === house); if (!h) return;
    const used = counts[house] || 0; counts[house] = used + 1;
    out.push({ abbr: planetAbbr(p.planet, lang), x: h.x + (HOUSE_OFF[used] || 0), y: h.y + 14 });
  });
  return out;
}

function PageSparkle({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" />
    </Svg>
  );
}

function TitleOrnament({ color, flip }: { color: string; flip?: boolean }) {
  return (
    <Svg width={34} height={14} viewBox="0 0 60 14" style={flip ? { transform: [{ scaleX: -1 }] } : undefined}>
      <Defs>
        <SvgGradient id="kundliOrn" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={color} stopOpacity={0} />
          <Stop offset="0.6" stopColor={color} stopOpacity={0.9} />
          <Stop offset="1" stopColor="#fce8a8" />
        </SvgGradient>
      </Defs>
      <Path d="M0 7 H44" stroke="url(#kundliOrn)" strokeWidth={1.2} />
      <Path d="M44 7 L52 3 L52 11 Z" fill={color} />
      <Path d="M56 4.8a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4z" fill="none" stroke={color} strokeWidth={1} />
    </Svg>
  );
}

function CrownIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill={color}>
      <Path d="M2 8l4 6 5-7 5 7 4-4-2 12H4z" />
    </Svg>
  );
}

function PageHero() {
  const { theme } = useTheme();
  const k = useScreen('kundli');
  return (
    <View style={styles.pageHero}>
      <TitleOrnament color={theme.gold2} />
      <PageSparkle color={theme.goldText} />
      <GradientText style={styles.pageHeroTitle}>{k.t('pageTitle', 'KUNDLI')}</GradientText>
      <PageSparkle color={theme.goldText} />
      <TitleOrnament color={theme.gold2} flip />
    </View>
  );
}

function KundliCard({
  children,
  style,
  bodyStyle,
  hero,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  bodyStyle?: StyleProp<ViewStyle>;
  hero?: boolean;
}) {
  const { theme } = useTheme();
  const borderColors = theme.isDark
    ? (['#fce8a8', '#e9b850', '#a17613', '#f6d27a'] as const)
    : (['#f8ecd0', '#d49b2e', '#a66f12', '#efd37b'] as const);

  const darkInner = '#000000';

  return (
    <LinearGradient
      colors={borderColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.cardBorder, { shadowColor: theme.isDark ? '#000000' : '#5c3f12' }, style]}
    >
      {theme.isDark ? (
        <View style={[styles.cardBody, { backgroundColor: darkInner }, bodyStyle]}>
          <View style={[styles.cardTopGlow, { backgroundColor: 'rgba(252,232,168,0.45)' }]} />
          {children}
        </View>
      ) : (
        <LinearGradient
          colors={hero ? ['#fff8e6', '#f7e8c2', '#efd9a6'] : ['#ffffff', '#fffdf7']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.cardBody, bodyStyle]}
        >
          <View style={[styles.cardTopGlow, { backgroundColor: 'rgba(176,115,22,0.28)' }]} />
          {children}
        </LinearGradient>
      )}
    </LinearGradient>
  );
}

function Pill({ label, solid }: { label: string; solid?: boolean }) {
  const { theme } = useTheme();
  const textColor = solid ? theme.buttonInk : theme.gold1;

  if (solid) {
    return (
      <LinearGradient
        colors={['#fce8a8', '#b87f1a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.pill}
      >
        <Text style={[styles.pillText, { color: textColor }]} numberOfLines={1}>{label}</Text>
      </LinearGradient>
    );
  }

  return (
    <View
      style={[
        styles.pill,
        {
          borderWidth: 1,
          borderColor: theme.isDark ? 'rgba(201,150,46,0.5)' : 'rgba(176,115,22,0.26)',
          backgroundColor: theme.isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,235,181,0.72)',
        },
      ]}
    >
      <Text style={[styles.pillText, { color: textColor }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

function CardHead({ children }: { children: React.ReactNode }) {
  return <GradientText style={styles.cardHead}>{children}</GradientText>;
}

function Row({ row, theme, last }: { row: PlanetRow; theme: Theme; last?: boolean }) {
  return (
    <View style={[styles.planetRow, { borderBottomColor: theme.isDark ? 'rgba(201,150,46,0.18)' : 'rgba(176,115,22,0.14)' }, last && styles.noBorder]}>
      <View style={[styles.glyph, { backgroundColor: theme.isDark ? 'rgba(233,184,80,0.12)' : 'rgba(176,115,22,0.10)', borderColor: theme.isDark ? 'rgba(201,150,46,0.4)' : 'rgba(176,115,22,0.28)' }]}>
        <Text style={[styles.glyphText, { color: theme.gold1 }]}>{row.glyph}</Text>
      </View>
      <View style={styles.planetInfo}>
        <Text style={[styles.planetName, { color: theme.gold1 }]} numberOfLines={1}>{row.name}</Text>
        <Text style={[styles.planetDetail, { color: theme.isDark ? 'rgba(216,203,168,0.82)' : '#6d5b38' }]} numberOfLines={1}>{row.detail}</Text>
      </View>
      <Pill label={row.tag} solid={row.strength === 'solid'} />
    </View>
  );
}

function RowList({ rows }: { rows: PlanetRow[] }) {
  const { theme } = useTheme();
  return (
    <View>
      {rows.map((r, i) => (
        <Row key={`${r.name}-${r.tag}`} row={r} theme={theme} last={i === rows.length - 1} />
      ))}
    </View>
  );
}


function VargaChartCard({ chart, onAsk, onOpen }: { chart: VargaChart; onAsk: (chart: VargaChart) => void; onOpen: (chart: VargaChart) => void }) {
  const { theme } = useTheme();
  const t = useT();
  const { lang } = useLang();
  const [localStyle, setLocalStyle] = useState<ChartStyle>('north');
  const effectiveStyle = localStyle === 'north' && !chart.ascendantSign ? 'south' : localStyle;
  const important = [
    chart.ascendantSign ? { planet: 'Lagna', sign: chart.ascendantSign } : null,
    ...['Sun', 'Moon', 'Jupiter', 'Venus', 'Saturn', 'Mars']
      .map((name) => chart.planets.find((p) => p.planet === name))
      .filter(Boolean),
  ].filter(Boolean).slice(0, 6) as { planet: string; sign?: string | null }[];
  const northPlanets = toChartPlanetsBySign(chart.planets, chart.ascendantSign, lang);

  return (
    <KundliCard>
      <View style={styles.vargaHeader}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.vargaCode, { color: theme.gold2 }]}>{chart.code}</Text>
          <GradientText style={styles.vargaName}>{chart.name}</GradientText>
          {!!chart.sanskrit && <Text style={[styles.vargaSanskrit, { color: theme.textMuted }]}>{chart.sanskrit}</Text>}
        </View>
      </View>

      <View style={styles.vargaStyleBar}>
        {CHART_STYLES.map((key) => {
          const on = localStyle === key;
          return (
            <Pressable
              key={`${chart.code}-${key}`}
              onPress={() => { hTap(); setLocalStyle(key); }}
              style={[
                styles.vargaStyleBtn,
                { borderColor: on ? theme.gold1 : theme.cardBorder, backgroundColor: on ? (theme.isDark ? 'rgba(233,184,80,0.16)' : 'rgba(176,115,22,0.12)') : 'transparent' },
              ]}
            >
              <Text style={[styles.vargaStyleText, { color: on ? theme.goldText : theme.textMuted }]} numberOfLines={1}>
                {t(`kundli.${key}`, key)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.vargaBody}>
        <Pressable
          onPress={() => { hTap(); onOpen(chart); }}
          style={({ pressed }) => [styles.vargaChartBox, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? '#000000' : '#fffdf7' }, pressed && { opacity: 0.85 }]}
        >
          <BirthChart style={effectiveStyle} rawPlanets={chart.planets} ascendant={chart.ascendantSign || null} northPlanets={northPlanets} lang={lang} bare />
          <View style={[styles.vargaExpand, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(10,9,18,0.85)' : 'rgba(255,249,236,0.92)' }]}>
            <ExpandIcon color={theme.gold1} />
          </View>
        </Pressable>
        <View style={styles.vargaPlanetList}>
          {important.map((p) => (
            <View key={`${chart.code}-${p.planet}`} style={[styles.vargaPlanetChip, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.08)' : 'rgba(176,115,22,0.07)' }]}>
              <Text style={[styles.vargaPlanetName, { color: theme.goldText }]} numberOfLines={1}>
                {p.planet === 'Lagna' ? t('kundli.lagna', 'Lagna') : aPlanet(p.planet, lang)}
              </Text>
              <Text style={[styles.vargaPlanetSign, { color: theme.text }]} numberOfLines={1}>{p.sign ? aSign(p.sign, lang) : '-'}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.vargaInfoBox, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.42)' : 'rgba(176,115,22,0.05)' }]}>
        <Text style={[styles.vargaInfoLabel, { color: theme.goldText }]}>{t('kundli.whatItShows', 'What it shows')}</Text>
        <Text style={[styles.vargaInfoText, { color: theme.text }]}>{chart.area}</Text>
        <Text style={[styles.vargaWhy, { color: theme.textSoft }]}>{chart.why}</Text>
      </View>

      <Pressable
        onPress={() => onAsk(chart)}
        style={({ pressed }) => [
          styles.askChartBtn,
          { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.10)' : 'rgba(176,115,22,0.08)' },
          pressed && { transform: [{ scale: 0.98 }] },
        ]}
      >
        <Text style={[styles.askChartText, { color: theme.goldText }]}>{t('kundli.askChartAi', 'Explain this')}</Text>
      </Pressable>
    </KundliCard>
  );
}

// planet label with a contrast chip behind it → readable over chart lines
function PToken({ x, y, label, fill, bg }: { x: number; y: number; label: string; fill: string; bg: string }) {
  const w = label.length * 4.6 + 4;
  return (
    <>
      <Rect x={x - w / 2} y={y - 7.6} width={w} height={9.8} rx={2.4} fill={bg} opacity={0.92} />
      <SvgText x={x} y={y} fontFamily={fonts.cinzel} fontWeight="700" fontSize={7.8} fill={fill} textAnchor="middle">{label}</SvgText>
    </>
  );
}

function BirthChart({ style = 'north', rawPlanets = null, ascendant = null, northPlanets = CHART_PLANETS, lang = 'en', svgRef, bare = false }: {
  style?: ChartStyle; rawPlanets?: ApiPlanet[] | null; ascendant?: string | null; northPlanets?: ChartPlanet[]; lang?: 'en' | 'hi'; svgRef?: any; bare?: boolean;
}) {
  const { theme } = useTheme();
  const [a, b, c] = theme.isDark ? ['#fce8a8', '#e9b850', '#a17613'] : ['#6a460c', '#b07e1c', '#7a510e'];
  const stroke = 'url(#kg)';
  const planetFill = theme.isDark ? '#f6d27a' : '#7a510e';
  const chip = theme.isDark ? '#0c0c18' : '#fff9ec';
  const numFill = theme.isDark ? '#e9b850' : '#9a6c12';     // house/rashi numbers — clearly visible
  const signFill = theme.isDark ? '#d6b05c' : '#8a6f3a';    // sign labels
  const lagnaIdx = ascendant != null ? SIGN_IDX[ascendant] : -1;
  const num = (n: number) => String(n); // always English numerals in charts (per request)
  // North: each house shows its RASHI (sign) number, computed from Lagna; fallback to house number
  const rashiOf = (houseN: number) => (lagnaIdx >= 0 ? ((lagnaIdx + houseN - 1) % 12) + 1 : houseN);
  const bySign = style !== 'north' && rawPlanets ? planetsBySign(rawPlanets, lang) : {};

  return (
    <View style={[bare ? styles.chartBare : styles.chartWrap, !theme.isDark && !bare && { borderWidth: 1.5, borderColor: 'rgba(176,115,22,0.38)', borderRadius: 14, padding: 10 }]}>
      <Svg ref={svgRef} viewBox="0 0 200 200" width="100%" height="100%">
        <Defs>
          <SvgGradient id="kg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={a} /><Stop offset="60%" stopColor={b} /><Stop offset="100%" stopColor={c} />
          </SvgGradient>
        </Defs>

        {style === 'south' ? (
          <>
            <Rect x={10} y={10} width={180} height={180} stroke={stroke} strokeWidth={1.5} fill="none" />
            {[1, 2, 3].map((i) => <Line key={`v${i}`} x1={10 + i * 45} y1={10} x2={10 + i * 45} y2={190} stroke={stroke} strokeWidth={1.1} />)}
            {[1, 2, 3].map((i) => <Line key={`hl${i}`} x1={10} y1={10 + i * 45} x2={190} y2={10 + i * 45} stroke={stroke} strokeWidth={1.1} />)}
            {Object.keys(SOUTH_CELL).map((si) => {
              const idx = Number(si);
              const [r, col] = SOUTH_CELL[idx];
              const x0 = 10 + col * 45, y0 = 10 + r * 45, cx = x0 + 22.5;
              const isLagna = idx === lagnaIdx;
              const pls = bySign[idx] || [];
              return (
                <React.Fragment key={si}>
                  <SvgText x={x0 + 4} y={y0 + 11} fontFamily={fonts.cinzelSemi} fontWeight="700" fontSize={8} fill={isLagna ? planetFill : signFill} textAnchor="start">{signAbbr(idx, lang)}</SvgText>
                  {isLagna && <Line x1={x0} y1={y0} x2={x0 + 14} y2={y0 + 14} stroke={planetFill} strokeWidth={1.6} />}
                  {pls.map((ab, i) => (
                    <PToken key={`${ab}${i}`} x={pls.length > 1 ? cx + ((i % 2) * 20 - 10) : cx} y={y0 + 27 + Math.floor(i / 2) * 9} label={ab} fill={planetFill} bg={chip} />
                  ))}
                </React.Fragment>
              );
            })}
          </>
        ) : style === 'east' ? (
          <>
            {/* East Indian — same square frame, but SIGNS fixed (Aries top-centre, clockwise) + Lagna marked */}
            <Rect x={10} y={10} width={180} height={180} stroke={stroke} strokeWidth={1.5} fill="none" />
            <Line x1={10} y1={10} x2={190} y2={190} stroke={stroke} strokeWidth={1.1} />
            <Line x1={190} y1={10} x2={10} y2={190} stroke={stroke} strokeWidth={1.1} />
            <Line x1={100} y1={10} x2={190} y2={100} stroke={stroke} strokeWidth={1.1} />
            <Line x1={190} y1={100} x2={100} y2={190} stroke={stroke} strokeWidth={1.1} />
            <Line x1={100} y1={190} x2={10} y2={100} stroke={stroke} strokeWidth={1.1} />
            <Line x1={10} y1={100} x2={100} y2={10} stroke={stroke} strokeWidth={1.1} />
            {HOUSES.map((h) => {
              const signIdx = h.n - 1; // region(house-pos) -> fixed sign
              const isLagna = signIdx === lagnaIdx;
              const pls = bySign[signIdx] || [];
              return (
                <React.Fragment key={`e${h.n}`}>
                  <SvgText x={h.x} y={h.y - 4} fontFamily={fonts.cinzelSemi} fontWeight="700" fontSize={8} fill={isLagna ? planetFill : signFill} textAnchor="middle">{signAbbr(signIdx, lang)}{isLagna ? ' ◹' : ''}</SvgText>
                  {pls.map((ab, i) => (
                    <PToken key={`${ab}${i}`} x={h.x + (pls.length > 1 ? (i % 2) * 18 - 9 : 0)} y={h.y + 8 + Math.floor(i / 2) * 9} label={ab} fill={planetFill} bg={chip} />
                  ))}
                </React.Fragment>
              );
            })}
          </>
        ) : (
          <>
            <Rect x={10} y={10} width={180} height={180} stroke={stroke} strokeWidth={1.5} fill="none" />
            <Line x1={10} y1={10} x2={190} y2={190} stroke={stroke} strokeWidth={1.1} />
            <Line x1={190} y1={10} x2={10} y2={190} stroke={stroke} strokeWidth={1.1} />
            <Line x1={100} y1={10} x2={190} y2={100} stroke={stroke} strokeWidth={1.1} />
            <Line x1={190} y1={100} x2={100} y2={190} stroke={stroke} strokeWidth={1.1} />
            <Line x1={100} y1={190} x2={10} y2={100} stroke={stroke} strokeWidth={1.1} />
            <Line x1={10} y1={100} x2={100} y2={10} stroke={stroke} strokeWidth={1.1} />
            {HOUSES.map((h) => (
              <SvgText key={`h${h.n}`} x={h.x} y={h.y} fontFamily={fonts.cinzelSemi} fontWeight="700" fontSize={10.5} fill={numFill} textAnchor="middle">{num(rashiOf(h.n))}</SvgText>
            ))}
            {northPlanets.map((p) => (
              <PToken key={`${p.abbr}-${p.x}-${p.y}`} x={p.x} y={p.y} label={p.abbr} fill={planetFill} bg={chip} />
            ))}
          </>
        )}
      </Svg>
    </View>
  );
}

function ExpandIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 3h6v6" /><Path d="M9 21H3v-6" /><Path d="M21 3l-7 7" /><Path d="M3 21l7-7" />
    </Svg>
  );
}
function ShareIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" /><Path d="M16 6l-4-4-4 4" /><Line x1={12} y1={2} x2={12} y2={15} />
    </Svg>
  );
}

// Full-screen chart viewer (ANY chart): pinch-zoom + pan + double-tap reset,
// zoom buttons, style toggle, share-as-image. Manages its own style state.
function ChartViewer({ visible, onClose, title, planets, ascendant, northPlanets, initialStyle, lang, t }: {
  visible: boolean; onClose: () => void; title: string;
  planets: ApiPlanet[] | null; ascendant: string | null; northPlanets: ChartPlanet[]; initialStyle?: ChartStyle;
  lang: 'en' | 'hi'; t: (k: string, d?: string) => string;
}) {
  const { theme } = useTheme();
  const svgRef = useRef<any>(null);
  const [busy, setBusy] = useState(false);
  const [chartStyle, setChartStyle] = useState<ChartStyle>(initialStyle || (ascendant ? 'north' : 'south'));
  const scale = useSharedValue(1); const saveS = useSharedValue(1);
  const tx = useSharedValue(0); const ty = useSharedValue(0);
  const sx = useSharedValue(0); const sy = useSharedValue(0);

  const reset = () => { scale.value = withTiming(1); saveS.value = 1; tx.value = withTiming(0); ty.value = withTiming(0); sx.value = 0; sy.value = 0; };
  useEffect(() => { if (visible) { setChartStyle(initialStyle || (ascendant ? 'north' : 'south')); reset(); } }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { reset(); }, [chartStyle]); // eslint-disable-line react-hooks/exhaustive-deps

  const pinch = Gesture.Pinch()
    .onUpdate((e) => { 'worklet'; scale.value = Math.min(4, Math.max(1, saveS.value * e.scale)); })
    .onEnd(() => { 'worklet'; saveS.value = scale.value; if (scale.value <= 1.01) { tx.value = withTiming(0); ty.value = withTiming(0); sx.value = 0; sy.value = 0; } });
  const pan = Gesture.Pan()
    .onUpdate((e) => { 'worklet'; tx.value = sx.value + e.translationX; ty.value = sy.value + e.translationY; })
    .onEnd(() => { 'worklet'; sx.value = tx.value; sy.value = ty.value; });
  const dbl = Gesture.Tap().numberOfTaps(2).onEnd(() => { 'worklet'; runOnJS(reset)(); });
  const gesture = Gesture.Simultaneous(pinch, pan, dbl);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }] }));

  const zoom = (factor: number) => {
    const n = Math.min(4, Math.max(1, saveS.value * factor));
    scale.value = withTiming(n); saveS.value = n;
    if (n <= 1.01) { tx.value = withTiming(0); ty.value = withTiming(0); sx.value = 0; sy.value = 0; }
  };

  const share = () => {
    const node = svgRef.current;
    if (!node || typeof node.toDataURL !== 'function' || busy) return;
    setBusy(true);
    try {
      node.toDataURL(async (b64: string) => {
        try {
          const uri = `${FileSystem.cacheDirectory}kundli-chart.png`;
          await FileSystem.writeAsStringAsync(uri, b64, { encoding: FileSystem.EncodingType.Base64 });
          if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: t('kundli.shareTitle', 'Kundli Chart') });
        } catch { /* ignore */ } finally { setBusy(false); }
      }, { width: 1080, height: 1080 });
    } catch { setBusy(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[fv.root, { backgroundColor: theme.isDark ? 'rgba(5,4,12,0.985)' : 'rgba(22,14,3,0.97)' }]}>
        <View style={fv.header}>
          <Pressable onPress={() => { hTap(); onClose(); }} hitSlop={12} style={fv.iconBtn}><Text style={fv.close}>✕</Text></Pressable>
          <Text style={fv.title} numberOfLines={1}>{title}</Text>
          <Pressable onPress={() => { hTap(); share(); }} hitSlop={12} style={[fv.iconBtn, busy && { opacity: 0.4 }]} disabled={busy}><ShareIcon color="#f4c34a" /></Pressable>
        </View>

        <View style={fv.pills}>
          {([['north', t('kundli.north', 'North')], ['south', t('kundli.south', 'South')], ['east', t('kundli.east', 'East')]] as [ChartStyle, string][]).map(([k, label]) => {
            const on = chartStyle === k;
            return (
              <Pressable key={k} onPress={() => { hTap(); setChartStyle(k); }} style={fv.pillWrap}>
                {on
                  ? <LinearGradient colors={['#fce8a8', '#e9b850', '#b87f1a']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={fv.pill}><Text style={[fv.pillTxt, { color: '#2a1c00' }]}>{label}</Text></LinearGradient>
                  : <View style={[fv.pill, { borderWidth: 1, borderColor: 'rgba(214,162,56,0.5)' }]}><Text style={[fv.pillTxt, { color: '#e9b850' }]}>{label}</Text></View>}
              </Pressable>
            );
          })}
        </View>

        <View style={fv.stage}>
          <GestureDetector gesture={gesture}>
            <Animated.View style={[fv.canvas, aStyle]} collapsable={false}>
              <BirthChart style={chartStyle} rawPlanets={planets} ascendant={ascendant} northPlanets={northPlanets} lang={lang} svgRef={svgRef} bare />
            </Animated.View>
          </GestureDetector>
        </View>

        <View style={fv.zoomBar}>
          <Pressable onPress={() => { hTap(); zoom(1 / 1.4); }} style={fv.zoomBtn}><Text style={fv.zoomTxt}>−</Text></Pressable>
          <Pressable onPress={() => { hTap(); reset(); }} style={[fv.zoomBtn, fv.zoomReset]}><Text style={fv.zoomResetTxt}>{t('kundli.reset', 'RESET')}</Text></Pressable>
          <Pressable onPress={() => { hTap(); zoom(1.4); }} style={fv.zoomBtn}><Text style={fv.zoomTxt}>+</Text></Pressable>
        </View>
        <Text style={fv.hint}>{t('kundli.zoomHint', 'पिंच ज़ूम · खींचकर घुमाएँ · डबल-टैप रीसेट')}</Text>
      </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

function TabButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  const { theme } = useTheme();
  const inner = <Text style={[styles.tabText, { color: active ? theme.buttonInk : theme.gold2 }]}>{label}</Text>;

  if (active) {
    return (
      <Pressable onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected: true }} style={styles.tabHit}>
        {({ pressed }) => (
          <LinearGradient
            colors={['#fce8a8', '#e9b850', '#b87f1a']}
            locations={[0, 0.52, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[styles.tab, styles.tabActive, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}
          >
            <View style={styles.tabActiveShine} pointerEvents="none" />
            {inner}
          </LinearGradient>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: false }}
      style={styles.tabHit}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.tab,
            styles.tabIdle,
            {
              borderColor: theme.isDark ? 'rgba(201,150,46,0.24)' : 'rgba(176,115,22,0.20)',
              backgroundColor: theme.isDark ? 'rgba(0,0,0,0.36)' : 'rgba(255,253,247,0.72)',
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          {inner}
        </View>
      )}
    </Pressable>
  );
}

function KundliTabs({
  tab,
  onChange,
}: {
  tab: KundliTab;
  onChange: (next: KundliTab) => void;
}) {
  const { theme } = useTheme();
  const tr = useT();

  return (
    <View style={styles.tabsShell}>
      <LinearGradient
        colors={theme.isDark ? ['rgba(0,0,0,0)', 'rgba(233,184,80,0.16)', 'rgba(0,0,0,0)'] : ['rgba(255,255,255,0)', 'rgba(176,115,22,0.13)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.tabsRule}
        pointerEvents="none"
      />
      <View
        style={[
          styles.tabsTrack,
          {
            backgroundColor: 'transparent',
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          nestedScrollEnabled
          directionalLockEnabled
          alwaysBounceVertical={false}
          bounces={false}
          overScrollMode="never"
          decelerationRate="fast"
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={false}
          scrollEventThrottle={16}
          style={styles.tabsHost}
          contentContainerStyle={styles.tabs}
        >
          {TABS.map((t) => (
            <TabButton key={t.key} active={t.key === tab} label={tr(`kundli.tab.${t.key}`, t.label)} onPress={() => onChange(t.key)} />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

export function KundliScreen({ navigation }: any) {
  const { theme } = useTheme();
  const t = useT();
  const { lang } = useLang();
  const [tab, setTab] = useState<KundliTab>('charts');
  const openMenu = () => openAppDrawer();

  // ── live data from backend ──
  const [live, setLive] = useState<ApiPlanet[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [birthName, setBirthName] = useState<string | null>(null);
  const [birthPlace, setBirthPlace] = useState<string | null>(null);
  const [birthDob, setBirthDob] = useState<string | null>(null);
  const [birthTob, setBirthTob] = useState<string | null>(null);
  const [ascendant, setAscendant] = useState<string | null>(null);
  const [chartStyle, setChartStyle] = useState<ChartStyle>('north');
  const [showFull, setShowFull] = useState(false);
  const [vargaView, setVargaView] = useState<VargaChart | null>(null);
  const cycleChart = (dir: number) => setChartStyle((cur) => CHART_STYLES[(CHART_STYLES.indexOf(cur) + dir + CHART_STYLES.length) % CHART_STYLES.length]);
  const chartPan = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-18, 18])
    .onEnd((e) => {
      'worklet';
      if (Math.abs(e.translationX) < 36) return;
      runOnJS(cycleChart)(e.translationX < 0 ? 1 : -1); // left → next, right → prev
    });
  // tap chart → open full-screen viewer; swipe still toggles style (pan wins over tap)
  const chartTap = Gesture.Tap().maxDuration(250).onEnd(() => { runOnJS(setShowFull)(true); });
  const chartGesture = Gesture.Exclusive(chartPan, chartTap);
  const [moonSign, setMoonSign] = useState<string | null>(null);
  const [dashaRows, setDashaRows] = useState<PlanetRow[] | null>(null);
  const [currentDasha, setCurrentDasha] = useState<{ title: string; range: string } | null>(null);
  const [yogaRows, setYogaRows] = useState<PlanetRow[] | null>(null);
  const [doshaRowsLive, setDoshaRowsLive] = useState<PlanetRow[] | null>(null);
  const [insightsLive, setInsightsLive] = useState<KundliInsight[] | null>(null);
  const [vargaCharts, setVargaCharts] = useState<VargaChart[] | null>(null);
  const [vargaLoading, setVargaLoading] = useState(false);
  const [vargaErr, setVargaErr] = useState<string | null>(null);

  useEffect(() => {
    let on = true;
    (async () => {
      // pehle saved profile se birth details; warna testing default (Jaipur)
      const fromProfile = await birthFromProfile();
      const birth = fromProfile || DEFAULT_BIRTH;
      if (on) {
        setBirthName(fromProfile?.name || null);
        setBirthPlace(birth.place || null);
        setBirthDob(birth.dob || null);
        setBirthTob(birth.tob || null);
      }
      try {
        const r = await getKundli(birth);
        if (on) {
          setLive(r.data.planets);
          setAscendant(r.data.ascendant || null);
          setMoonSign(r.data.moonSign || null);
          if (r.data.doshas && r.data.doshas.length) setDoshaRowsLive(doshaToRows(r.data.doshas));
          if (r.data.yogas && r.data.yogas.length) setYogaRows(yogaToRows(r.data.yogas));
          if (r.data.insights && r.data.insights.length) setInsightsLive(r.data.insights);
          setLoading(false);
        }
      } catch (e: any) {
        if (on) { setErr(e?.message || 'fetch failed'); setLoading(false); }
      }
      // divisional charts — same birth details, same precise planetary longitudes
      try {
        if (on) { setVargaLoading(true); setVargaErr(null); }
        const vc = await getVargaCharts(birth);
        if (on) setVargaCharts(vc.data.charts || []);
      } catch (e: any) {
        if (on) setVargaErr(e?.message || 'varga charts unavailable');
      } finally {
        if (on) setVargaLoading(false);
      }
      // dasha — alag se (kundli ko block na kare)
      try {
        const dr = await getDasha(birth);
        if (on && dr.dasha && dr.dasha.length) {
          setDashaRows(dashaToRows(dr.dasha));
          const d0 = dr.dasha[0];
          setCurrentDasha({ title: `${d0.lord} Mahadasha`, range: `${fmtMonYr(d0.start)} – ${fmtMonYr(d0.end)}` });
        }
      } catch (_) { /* dasha optional — demo dikhega */ }
      // AI insights (richer prose) — computed insights ko override karta hai
      try {
        const ai = await getAiInsights(birth);
        if (on && ai.insights && ai.insights.length) setInsightsLive(ai.insights);
      } catch (_) { /* AI optional — computed/demo dikhega */ }
    })();
    return () => { on = false; };
  }, []);

  const planetRows = live ? toPlanetRows(live, lang) : PLANETS;
  const chartPlanets = live ? toChartPlanets(live, lang) : CHART_PLANETS;
  const askAboutChart = (chart: VargaChart) => {
    hTap();
    navigation.navigate('AiAstrologer', {
      question: `Explain my ${chart.name} (${chart.code}) in simple language. Focus on ${chart.area}.`,
    });
  };
  const askAboutMainChart = () => {
    hTap();
    navigation.navigate('AiAstrologer', {
      question: lang === 'hi'
        ? 'मेरी जन्म कुंडली का पूरा, सरल भाषा में विश्लेषण दें। अलग-अलग शीर्षकों में बताएँ — स्वभाव व व्यक्तित्व, करियर व धन, रिश्ते व विवाह, स्वास्थ्य, मुख्य शक्तियाँ, और सावधानियाँ — साथ में 1-2 आसान उपाय। मेरा लग्न, राशि, ग्रह-स्थिति और योग के आधार पर।'
        : 'Give a complete, easy-to-understand reading of my birth chart. Use separate sections — personality & nature, career & money, relationships & marriage, health, key strengths, and cautions — plus 1-2 simple remedies. Base it on my ascendant, moon sign, planet placements and yogas.',
    });
  };

  const switchTab = (next: KundliTab) => {
    if (next === tab) return;
    hTap();
    setTab(next);
  };

  return (
    <Screen>
      <BrandHeader onMenu={openMenu} onBell={() => navigation.navigate('Notifications')} />
      <PageHero />

      <KundliCard hero bodyStyle={styles.hero}>
        <View style={styles.heroPill}>
          <Pill label={t('kundli.birthChart', 'YOUR BIRTH CHART')} />
        </View>
        <GradientText style={styles.heroName}>{birthName || PROFILE.name}</GradientText>
        <Text style={[styles.heroSub, { color: theme.isDark ? 'rgba(216,203,168,0.7)' : '#6d5b38' }]}>
          {ascendant && moonSign ? `${aSign(ascendant, lang)} ${t('kundli.ascendant', 'Ascendant')} · ${t('kundli.moonIn', 'Moon in')} ${aSign(moonSign, lang)}` : PROFILE.ascendant}
        </Text>

        <Text style={[styles.liveStatus, { color: err ? '#c0392b' : (live ? theme.green : theme.textMuted) }]}>
          {loading ? `⟳  ${t('kundli.loading', 'Loading live chart…')}` : err ? `●  ${t('kundli.offline', 'Offline — showing demo data')}` : `●  ${t('kundli.live', 'LIVE · real planetary data')}`}
        </Text>

        <View style={styles.metaGrid}>
          {[
            { k: t('kundli.metaDob', 'DOB'), v: birthDob ? fmtDob(birthDob) : PROFILE.dob },
            { k: t('kundli.metaTime', 'Time'), v: birthTob || PROFILE.time },
            { k: t('kundli.metaPlace', 'Place'), v: birthPlace || PROFILE.place },
          ].map((m) => (
            <View
              key={m.k}
              style={[
                styles.metaCell,
                {
                  borderColor: theme.isDark ? 'rgba(201,150,46,0.25)' : 'rgba(176,115,22,0.22)',
                  backgroundColor: theme.isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)',
                },
              ]}
            >
              <Text style={[styles.metaKey, { color: theme.gold1 }]}>{m.k}</Text>
              <Text style={[styles.metaVal, { color: theme.text }]} numberOfLines={1}>{m.v}</Text>
            </View>
          ))}
        </View>

        {/* chart-style toggle — North / South Indian */}
        <View style={styles.chartToggle}>
          {([['north', t('kundli.north', 'North')], ['south', t('kundli.south', 'South')], ['east', t('kundli.east', 'East')]] as [ChartStyle, string][]).map(([key, label]) => {
            const on = chartStyle === key;
            return (
              <Pressable key={key} onPress={() => { hTap(); setChartStyle(key); }} style={styles.chartToggleBtnWrap}>
                {on ? (
                  <LinearGradient colors={['#fce8a8', '#e9b850', '#b87f1a']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.chartToggleBtn}>
                    <Text style={[styles.chartToggleText, { color: theme.buttonInk }]}>{label}</Text>
                  </LinearGradient>
                ) : (
                  <View style={[styles.chartToggleBtn, { borderWidth: 1, borderColor: theme.cardBorder }]}>
                    <Text style={[styles.chartToggleText, { color: theme.gold2 }]}>{label}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
        <GestureDetector gesture={chartGesture}>
          <View collapsable={false} style={{ alignItems: 'center', alignSelf: 'stretch' }}>
            <View style={{ position: 'relative' }}>
              <BirthChart style={chartStyle} rawPlanets={live} ascendant={ascendant} northPlanets={chartPlanets} lang={lang} />
              <Pressable onPress={() => { hTap(); setShowFull(true); }} hitSlop={10} style={[styles.expandBtn, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(10,9,18,0.85)' : 'rgba(255,249,236,0.92)' }]}>
                <ExpandIcon color={theme.gold1} />
              </Pressable>
            </View>
            <Text style={[styles.chartHint, { color: theme.textMuted }]}>{t('kundli.swipeHint', '← स्वाइप करके चार्ट बदलें →')} · {t('kundli.tapHint', 'टैप करके बड़ा करें')}</Text>
          </View>
        </GestureDetector>

        {/* Understand this chart with AI — gold CTA button + tagline */}
        <Pressable onPress={askAboutMainChart} style={({ pressed }) => [{ marginTop: 16 }, pressed && { transform: [{ scale: 0.98 }] }]}>
          <LinearGradient colors={['#fce8a8', '#e9b850', '#b87f1a']} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.aiBtn}>
            <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#2a1c00" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M9.94 14.06A2 2 0 0 0 8.5 12.6L2.4 11a.5.5 0 0 1 0-.96l6.1-1.58A2 2 0 0 0 9.94 7L11.5.9a.5.5 0 0 1 .96 0L14.06 7a2 2 0 0 0 1.44 1.44l6.1 1.58a.5.5 0 0 1 0 .96l-6.1 1.58a2 2 0 0 0-1.44 1.44L12.46 21a.5.5 0 0 1-.96 0z" />
              <Path d="M20 3v4M22 5h-4M4 17v2M5 18H3" />
            </Svg>
            <Text style={styles.aiBtnText}>{lang === 'hi' ? 'AI से कुंडली समझें' : 'Understand Chart with AI'}</Text>
          </LinearGradient>
          <Text style={[styles.aiBtnTag, { color: theme.textMuted }]}>
            {lang === 'hi' ? 'सरल भाषा में — स्वभाव · करियर · रिश्ते · सेहत · उपाय' : 'In simple words — nature · career · relationships · health · remedies'}
          </Text>
        </Pressable>
      </KundliCard>

      {/* main birth chart viewer */}
      <ChartViewer
        visible={showFull}
        onClose={() => setShowFull(false)}
        title={t('kundli.chartTitle', lang === 'hi' ? 'जन्मांग चक्र' : 'Birth Chart')}
        planets={live}
        ascendant={ascendant}
        northPlanets={chartPlanets}
        initialStyle={chartStyle}
        lang={lang}
        t={t}
      />
      {/* divisional chart viewer (opens any varga chart) */}
      <ChartViewer
        visible={!!vargaView}
        onClose={() => setVargaView(null)}
        title={vargaView ? `${vargaView.code} · ${vargaView.name}` : ''}
        planets={vargaView ? vargaView.planets : null}
        ascendant={vargaView ? (vargaView.ascendantSign || null) : null}
        northPlanets={vargaView ? toChartPlanetsBySign(vargaView.planets, vargaView.ascendantSign || null, lang) : []}
        initialStyle={vargaView && vargaView.ascendantSign ? 'north' : 'south'}
        lang={lang}
        t={t}
      />

      <Pressable
        onPress={() => { hTap(); navigation.navigate('BrihatKundli'); }}
        style={({ pressed }) => [styles.milanEntry, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(216,162,58,0.12)' : 'rgba(216,162,58,0.12)' }, pressed && { transform: [{ scale: 0.99 }], borderColor: theme.gold2 }]}
      >
        <View style={[styles.milanIcon, { backgroundColor: 'rgba(216,162,58,0.18)' }]}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#d8a23a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H20v18H7.5A2.5 2.5 0 0 0 5 22V4.5z" />
            <Path d="M5 4.5A2.5 2.5 0 0 1 7.5 7H20" />
            <Path d="M9 11h7M9 15h5" />
          </Svg>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.milanTitle, { color: theme.text }]}>{t('brihat.title', 'Brihat Kundli Report')}</Text>
          <Text style={[styles.milanSub, { color: theme.textMuted }]} numberOfLines={2}>
            {t('brihat.entrySub', lang === 'hi' ? 'Chart, varga, dasha, dosha, gochar aur domain-wise advanced report' : 'Charts, varga, dasha, dosha, transits and domain-wise advanced report')}
          </Text>
        </View>
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.gold2} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M9 18l6-6-6-6" /></Svg>
      </Pressable>

      {/* Kundli Milan (Gun Milan) entry */}
      <Pressable
        onPress={() => { hTap(); navigation.navigate('KundliMatch'); }}
        style={({ pressed }) => [styles.milanEntry, { marginTop: 10, borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(224,122,169,0.10)' : 'rgba(224,122,169,0.10)' }, pressed && { transform: [{ scale: 0.99 }], borderColor: theme.gold2 }]}
      >
        <View style={styles.milanIcon}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="#e07aa9"><Path d="M12 21s-7.5-4.8-10-9.2C.6 9 1.6 5.5 4.8 4.7 7 4.1 9 5.3 12 8c3-2.7 5-3.9 7.2-3.3C22.4 5.5 23.4 9 22 11.8 19.5 16.2 12 21 12 21z" /></Svg>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.milanTitle, { color: theme.text }]}>{t('match.title', 'Kundli Milan')}</Text>
          <Text style={[styles.milanSub, { color: theme.textMuted }]} numberOfLines={2}>{t('match.entrySub', lang === 'hi' ? '36 गुण मिलान — शादी की अनुकूलता जानें' : '36-guna matching — check marriage compatibility')}</Text>
        </View>
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.gold2} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M9 18l6-6-6-6" /></Svg>
      </Pressable>

      {/* Gochar (Transits) entry */}
      <Pressable
        onPress={() => { hTap(); navigation.navigate('Gochar'); }}
        style={({ pressed }) => [styles.milanEntry, { marginTop: 10, borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(90,169,224,0.10)' : 'rgba(90,169,224,0.10)' }, pressed && { transform: [{ scale: 0.99 }], borderColor: theme.gold2 }]}
      >
        <View style={[styles.milanIcon, { backgroundColor: 'rgba(90,169,224,0.16)' }]}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#5aa9e0" strokeWidth={2}><Path d="M12 2v4M12 18v4M2 12h4M18 12h4" strokeLinecap="round" /><Path d="M12 8a4 4 0 100 8 4 4 0 000-8z" /></Svg>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.milanTitle, { color: theme.text }]}>{t('gochar.title', 'Gochar · Transits')}</Text>
          <Text style={[styles.milanSub, { color: theme.textMuted }]} numberOfLines={2}>{t('gochar.entrySub', lang === 'hi' ? 'अभी ग्रह कहाँ — साढ़े साती व मुख्य गोचर' : 'Where planets are now — Sade Sati & key transits')}</Text>
        </View>
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.gold2} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M9 18l6-6-6-6" /></Svg>
      </Pressable>

      {/* Remedies (Upaay) entry */}
      <Pressable
        onPress={() => { hTap(); navigation.navigate('Remedies'); }}
        style={({ pressed }) => [styles.milanEntry, { marginTop: 10, borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(110,200,140,0.10)' : 'rgba(110,200,140,0.10)' }, pressed && { transform: [{ scale: 0.99 }], borderColor: theme.gold2 }]}
      >
        <View style={[styles.milanIcon, { backgroundColor: 'rgba(110,200,140,0.16)' }]}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#3ec77a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 21.6 7.1 18.2l.9-5.5-4-3.9L9.5 8z" /></Svg>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.milanTitle, { color: theme.text }]}>{t('rem.title', 'Remedies · Upaay')}</Text>
          <Text style={[styles.milanSub, { color: theme.textMuted }]} numberOfLines={2}>{t('rem.entrySub', lang === 'hi' ? 'भाग्य रत्न, दोष उपाय व नवग्रह मंत्र' : 'Lucky gemstone, dosha remedies & graha mantras')}</Text>
        </View>
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.gold2} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M9 18l6-6-6-6" /></Svg>
      </Pressable>

      {/* Vedic Reading (classical phala-kathan) entry */}
      <Pressable
        onPress={() => { hTap(); navigation.navigate('VedicReading'); }}
        style={({ pressed }) => [styles.milanEntry, { marginTop: 10, borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(155,140,255,0.10)' : 'rgba(155,140,255,0.10)' }, pressed && { transform: [{ scale: 0.99 }], borderColor: theme.gold2 }]}
      >
        <View style={[styles.milanIcon, { backgroundColor: 'rgba(155,140,255,0.16)' }]}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#9b8cff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M12 2l2.4 7.4H22l-6 4.5 2.3 7.1L12 16.9 5.7 21l2.3-7.1-6-4.5h7.6z" /></Svg>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.milanTitle, { color: theme.text }]}>{t('reading.title', 'Vedic Reading')}</Text>
          <Text style={[styles.milanSub, { color: theme.textMuted }]} numberOfLines={2}>{t('reading.entrySub', lang === 'hi' ? 'गण-योनि-नाड़ी, गण्डमूल, राजयोग व शास्त्रीय फलादेश' : 'Gana-Yoni-Nadi, Gandmool, Rajyogas & classical readings')}</Text>
        </View>
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.gold2} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M9 18l6-6-6-6" /></Svg>
      </Pressable>

      {/* Life Timeline (Vimshottari Dasha — age-wise) entry */}
      <Pressable
        onPress={() => { hTap(); navigation.navigate('LifeTimeline'); }}
        style={({ pressed }) => [styles.milanEntry, { marginTop: 10, borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(110,200,224,0.10)' : 'rgba(110,200,224,0.10)' }, pressed && { transform: [{ scale: 0.99 }], borderColor: theme.gold2 }]}
      >
        <View style={[styles.milanIcon, { backgroundColor: 'rgba(110,200,224,0.16)' }]}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#6ec8e0" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M12 7v5l3 2" /><Path d="M12 3a9 9 0 100 18 9 9 0 000-18z" /></Svg>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.milanTitle, { color: theme.text }]}>{t('timeline.title', 'Life Timeline')}</Text>
          <Text style={[styles.milanSub, { color: theme.textMuted }]} numberOfLines={2}>{t('timeline.entrySub', lang === 'hi' ? 'किस उम्र में कौन सी दशा — कारण, लाभ, सावधानी' : 'Which dasha at which age — why, benefits & cautions')}</Text>
        </View>
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.gold2} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M9 18l6-6-6-6" /></Svg>
      </Pressable>

      {/* Year-by-Year Forecast (gochar) entry */}
      <Pressable
        onPress={() => { hTap(); navigation.navigate('TransitForecast'); }}
        style={({ pressed }) => [styles.milanEntry, { marginTop: 10, borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(224,169,46,0.10)' : 'rgba(224,169,46,0.10)' }, pressed && { transform: [{ scale: 0.99 }], borderColor: theme.gold2 }]}
      >
        <View style={[styles.milanIcon, { backgroundColor: 'rgba(224,169,46,0.16)' }]}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#e0a92e" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M3 17l5-5 4 4 8-8" /><Path d="M17 8h4v4" /></Svg>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.milanTitle, { color: theme.text }]}>{t('forecast.title', 'Year Forecast')}</Text>
          <Text style={[styles.milanSub, { color: theme.textMuted }]} numberOfLines={2}>{t('forecast.entrySub', lang === 'hi' ? 'साल-दर-साल साढ़े साती व गुरु गोचर का फल' : 'Year-by-year Sade Sati & Jupiter transit effects')}</Text>
        </View>
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.gold2} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M9 18l6-6-6-6" /></Svg>
      </Pressable>

      <KundliTabs tab={tab} onChange={switchTab} />

      <View style={styles.tabContent} collapsable={false}>
        {tab === 'overview' && (
          <View style={styles.cardStack}>
            <KundliCard>
              <CardHead>{t('kundli.keyInsights', 'KEY INSIGHTS')}</CardHead>
              {insightsLive ? (
                <View style={{ gap: 12 }}>
                  {insightsLive.map((it, i) => (
                    <View key={i} style={styles.insightRow}>
                      <View style={[styles.insightDot, { backgroundColor: theme.gold1 }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.insightTitle, { color: theme.gold1 }]}>{it.title}</Text>
                        <Text style={[styles.insight, { color: theme.textSoft, marginTop: 2 }]}>{it.text}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={[styles.insight, { color: theme.textSoft }]}>{KEY_INSIGHT}</Text>
              )}
            </KundliCard>
            <KundliCard>
              <CardHead>{t('kundli.planetaryPositions', 'PLANETARY POSITIONS')}</CardHead>
              <RowList rows={planetRows} />
            </KundliCard>
            <KundliCard>
              <CardHead>{t('kundli.currentDasha', 'CURRENT DASHA')}</CardHead>
              <View style={styles.dashaRow}>
                <View style={styles.dashaText}>
                  <Text style={[styles.dashaTitle, { color: theme.text }]}>{currentDasha?.title || 'Jupiter Mahadasha'}</Text>
                  <Text style={[styles.dashaRange, { color: theme.textMuted }]}>{currentDasha?.range || CURRENT_DASHA.range}</Text>
                </View>
                <Pill label={currentDasha ? t('kundli.running', 'Running') : CURRENT_DASHA.tag} solid />
              </View>
            </KundliCard>
          </View>
        )}

        {tab === 'charts' && (
          <View style={styles.cardStack}>
            <KundliCard>
              <CardHead>{t('kundli.divisionalCharts', 'DIVISIONAL CHARTS')}</CardHead>
              <Text style={[styles.insight, { color: theme.textSoft }]}>
                {t('kundli.calculated', 'Calculated from your birth details and precise planetary positions')}.
              </Text>
              {vargaLoading && <Text style={[styles.liveStatus, { color: theme.gold1 }]}>{t('kundli.chartLoading', 'Preparing divisional charts...')}</Text>}
              {!!vargaErr && <Text style={[styles.liveStatus, { color: theme.red }]}>{t('kundli.chartUnavailable', 'Divisional charts are unavailable right now.')}</Text>}
            </KundliCard>

            {(vargaCharts || []).map((chart) => <VargaChartCard key={chart.code} chart={chart} onAsk={askAboutChart} onOpen={setVargaView} />)}
          </View>
        )}

        {tab === 'planets' && (
          <KundliCard>
            <CardHead>{t('kundli.planetaryPositions', 'PLANETARY POSITIONS')}</CardHead>
            <RowList rows={planetRows} />
          </KundliCard>
        )}

        {tab === 'dasha' && (
          <KundliCard>
            <CardHead>{t('kundli.vimshottari', 'VIMSHOTTARI TIMELINE')}</CardHead>
            <RowList rows={dashaRows || DASHA_TIMELINE} />
          </KundliCard>
        )}

        {tab === 'yoga' && (
          <KundliCard>
            <CardHead>{t('kundli.auspiciousYogas', 'AUSPICIOUS YOGAS')}</CardHead>
            <RowList rows={yogaRows || YOGAS} />
          </KundliCard>
        )}

        {tab === 'dosha' && (
          <KundliCard>
            <CardHead>{t('kundli.doshaCheck', 'DOSHA CHECK')}</CardHead>
            <RowList rows={doshaRowsLive || DOSHAS} />
          </KundliCard>
        )}
      </View>

      <GoldButton
        label={t('kundli.unlock', 'Unlock Full Analysis')}
        icon={<CrownIcon color={theme.buttonInk} />}
        onPress={() => navigation.navigate('Subscribe')}
        style={styles.cta}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  pageHero: {
    marginTop: 30,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  pageHeroTitle: {
    fontFamily: fonts.cinzel,
    fontSize: 23,
    letterSpacing: 2.5,
    lineHeight: 28,
    textTransform: 'uppercase',
  },

  cardBorder: {
    borderRadius: radii.lg,
    padding: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 6,
  },
  cardBody: {
    borderRadius: radii.lg - 1,
    padding: 18,
    overflow: 'hidden',
  },
  cardTopGlow: {
    position: 'absolute',
    top: 0,
    left: '14%',
    right: '14%',
    height: 1,
  },
  cardStack: {
    gap: 15,
  },

  hero: {
    alignItems: 'center',
    textAlign: 'center' as any,
  },
  heroPill: {
    marginBottom: 0,
  },
  heroName: {
    fontFamily: fonts.playfairBold,
    fontSize: 22,
    marginTop: 8,
    marginBottom: 2,
    textAlign: 'center',
  },
  heroSub: {
    fontFamily: fonts.inter,
    fontSize: 12.5,
    textAlign: 'center',
  },
  liveStatus: {
    fontFamily: fonts.interSemi,
    fontSize: 10.5,
    letterSpacing: 0.5,
    marginTop: 6,
    textAlign: 'center',
  },
  metaGrid: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
    alignSelf: 'stretch',
  },
  metaCell: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    minWidth: 0,
  },
  metaKey: {
    fontFamily: fonts.interSemi,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'none',
  },
  metaVal: {
    fontFamily: fonts.inter,
    fontSize: 11.5,
    marginTop: 3,
    textAlign: 'center',
  },
  chartWrap: {
    width: 280,
    maxWidth: '90%',
    aspectRatio: 1,
    marginTop: 10,
  },
  chartBare: { width: '100%', height: '100%' },
  milanEntry: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18, padding: 14, borderRadius: radii.lg, borderWidth: 1 },
  milanIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(224,122,169,0.16)' },
  milanTitle: { fontFamily: fonts.cinzelSemi, fontSize: 15, letterSpacing: 0.3 },
  milanSub: { fontFamily: fonts.inter, fontSize: 12, marginTop: 2, lineHeight: 16 },
  expandBtn: { position: 'absolute', top: 14, right: 6, width: 30, height: 30, borderRadius: 9, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chartToggle: { flexDirection: 'row', gap: 6, marginTop: 16, alignSelf: 'center' },
  chartToggleBtnWrap: { borderRadius: radii.pill, overflow: 'hidden' },
  chartToggleBtn: { paddingVertical: 7, paddingHorizontal: 16, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  chartToggleText: { fontFamily: fonts.interSemi, fontSize: 12, letterSpacing: 0.3 },
  chartHint: { fontFamily: fonts.inter, fontSize: 10.5, marginTop: 10, opacity: 0.8 },

  tabsShell: {
    height: 54,
    marginTop: 18,
    marginBottom: 14,
    justifyContent: 'center',
  },
  tabsRule: {
    position: 'absolute',
    left: 44,
    right: 44,
    top: 27,
    height: 1,
    opacity: 0.8,
  },
  tabsTrack: {
    height: 50,
    overflow: 'visible',
    justifyContent: 'center',
  },
  tabsHost: {
    height: 50,
    flexGrow: 0,
    overflow: 'visible',
  },
  tabs: {
    minHeight: 50,
    gap: 8,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  tabHit: {
    minHeight: 44,
    justifyContent: 'center',
  },
  tab: {
    paddingHorizontal: 17,
    paddingVertical: 9,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    overflow: 'hidden',
  },
  tabIdle: {
    borderWidth: 0,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  tabActive: {
    shadowColor: '#e9b850',
    shadowOpacity: 0.42,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  tabActiveShine: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  tabText: {
    fontFamily: fonts.cinzelSemi,
    fontSize: 11.5,
    letterSpacing: 0.92,
  },
  tabContent: {
    minHeight: 162,
  },

  cardHead: {
    fontFamily: fonts.cinzel,
    fontSize: 14,
    letterSpacing: 1.4,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  insight: {
    fontFamily: fonts.inter,
    fontSize: 12.5,
    lineHeight: 19.4,
  },
  insightRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  insightDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  insightTitle: { fontFamily: fonts.interSemi, fontSize: 11.5, letterSpacing: 0.4, textTransform: 'uppercase' },

  planetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    minHeight: 55,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  glyph: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  glyphText: {
    fontSize: 16,
    lineHeight: 20,
  },
  planetInfo: {
    flex: 1,
    marginLeft: 10,
    minWidth: 0,
  },
  planetName: {
    fontFamily: fonts.cinzelSemi,
    fontSize: 12.5,
    letterSpacing: 0.8,
  },
  planetDetail: {
    fontFamily: fonts.inter,
    fontSize: 11,
    marginTop: 2,
  },

  vargaHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  vargaCode: {
    fontFamily: fonts.cinzelSemi,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  vargaName: {
    fontFamily: fonts.playfairBold,
    fontSize: 19,
    lineHeight: 24,
    marginTop: 2,
  },
  vargaSanskrit: {
    fontFamily: fonts.interSemi,
    fontSize: 11.5,
    marginTop: 2,
  },
  vargaStyleBar: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 13,
  },
  vargaStyleBtn: {
    flex: 1,
    minHeight: 38,
    borderWidth: 1,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  vargaStyleText: {
    fontFamily: fonts.interSemi,
    fontSize: 12,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  vargaInfoBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
  },
  vargaInfoLabel: {
    fontFamily: fonts.interBold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  vargaInfoText: {
    fontFamily: fonts.interSemi,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 5,
  },
  vargaWhy: {
    fontFamily: fonts.inter,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 6,
  },
  vargaBody: {
    gap: 12,
    marginTop: 12,
    alignItems: 'stretch',
  },
  vargaChartBox: {
    width: '100%',
    maxWidth: 330,
    aspectRatio: 1,
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: 18,
    padding: 10,
    overflow: 'hidden',
  },
  vargaExpand: { position: 'absolute', top: 10, right: 10, width: 28, height: 28, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  vargaPlanetList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vargaPlanetChip: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 88,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 9,
  },
  vargaPlanetName: {
    fontFamily: fonts.interBold,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  vargaPlanetSign: {
    fontFamily: fonts.interSemi,
    fontSize: 12.5,
    marginTop: 2,
  },
  askChartBtn: {
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 13,
  },
  askChartText: {
    fontFamily: fonts.cinzelSemi,
    fontSize: 11.5,
    letterSpacing: 1,
  },
  aiBtn: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, minHeight: 36, borderRadius: radii.pill, paddingHorizontal: 15 },
  aiBtnText: { fontFamily: fonts.cinzelSemi, fontSize: 11.5, letterSpacing: 0.4, color: '#2a1c00' },
  aiBtnTag: { fontFamily: fonts.inter, fontSize: 10.5, lineHeight: 15, textAlign: 'center', marginTop: 8 },
  vargaSectionLabel: {
    fontFamily: fonts.cinzelSemi,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 2,
    marginLeft: 4,
  },
  advancedToggle: {
    borderWidth: 1,
    borderRadius: radii.pill,
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  advancedToggleText: {
    fontFamily: fonts.cinzelSemi,
    fontSize: 11.5,
    letterSpacing: 1.1,
  },

  dashaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dashaText: {
    flex: 1,
    minWidth: 0,
  },
  dashaTitle: {
    fontFamily: fonts.playfair,
    fontSize: 16,
  },
  dashaRange: {
    fontFamily: fonts.inter,
    fontSize: 11.5,
    marginTop: 2,
  },

  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
    maxWidth: 112,
  },
  pillText: {
    fontFamily: fonts.interSemi,
    fontSize: 10.5,
    letterSpacing: 1.0,
    textTransform: 'uppercase',
  },
  cta: {
    marginTop: 16,
  },
});

const fv = StyleSheet.create({
  root: { flex: 1, paddingTop: 44, paddingHorizontal: 18, paddingBottom: 26 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(214,162,56,0.4)', backgroundColor: 'rgba(0,0,0,0.3)' },
  close: { fontFamily: fonts.inter, fontSize: 18, color: '#f4c34a', lineHeight: 20 },
  title: { fontFamily: fonts.cinzel, fontSize: 15, letterSpacing: 1, color: '#ffe289' },
  pills: { flexDirection: 'row', gap: 7, alignSelf: 'center', marginTop: 18 },
  pillWrap: { borderRadius: 999, overflow: 'hidden' },
  pill: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  pillTxt: { fontFamily: fonts.interSemi, fontSize: 13, letterSpacing: 0.3 },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  canvas: { width: 360, maxWidth: '100%', aspectRatio: 1 },
  zoomBar: { flexDirection: 'row', gap: 12, alignSelf: 'center', alignItems: 'center' },
  zoomBtn: { minWidth: 52, height: 46, paddingHorizontal: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(214,162,56,0.45)', backgroundColor: 'rgba(244,195,74,0.08)' },
  zoomTxt: { fontFamily: fonts.interBold, fontSize: 24, color: '#f4c34a', lineHeight: 28 },
  zoomReset: { minWidth: 96 },
  zoomResetTxt: { fontFamily: fonts.interSemi, fontSize: 12.5, letterSpacing: 1.2, color: '#e9b850' },
  hint: { fontFamily: fonts.inter, fontSize: 11.5, color: 'rgba(214,184,120,0.85)', textAlign: 'center', marginTop: 12 },
});
