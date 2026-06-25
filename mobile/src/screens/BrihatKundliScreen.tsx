import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { buildBrihatHtml } from '../lib/brihatPdf';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { Page } from '../components/Page';
import { GradientText } from '../components/GradientText';
import { GoldButton } from '../components/GoldButton';
import { TextField } from '../components/TextField';
import { BirthPlaceField } from '../components/BirthPlaceField';
import { CalendarIcon, ClockIcon, UserLine } from '../components/icons/ProfileIcons';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radii } from '../theme/tokens';
import { hError, hSelect, hSuccess, hTap } from '../lib/haptics';
import { birthFromProfile } from '../lib/birth';
import { ApiDosha, ApiPlanet, BrihatAshtakavarga, BrihatAvakhada, BrihatDomain, BrihatJaimini, BrihatKp, BrihatKundliResponse, BrihatLalKitab, BrihatNumerology, BrihatSection, BrihatShadbala, BrihatVarshphal, DashaResponse, getBrihatKundli, LifeTimelineResponse, LocationSuggestion, NumberCard, RemediesResponse, resolveLocation, YogaItem } from '../lib/api';
import { useDialog } from '../components/DialogProvider';
import { useLang, useT } from '../i18n/LanguageProvider';
import { aSign } from '../i18n/astro';

function BookIcon({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H20v18H7.5A2.5 2.5 0 0 0 5 22V4.5z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
      <Path d="M5 4.5A2.5 2.5 0 0 1 7.5 7H20" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M9 11h7M9 15h5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function ShieldIcon({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3l7 3v5c0 4.8-2.8 8.6-7 10-4.2-1.4-7-5.2-7-10V6z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
      <Path d="M8.5 12l2.2 2.2 4.8-5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChartIcon({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={4} y={4} width={16} height={16} stroke={color} strokeWidth={1.7} />
      <Path d="M4 4l16 16M20 4L4 20M12 4v16M4 12h16" stroke={color} strokeWidth={1.2} />
      <Circle cx={12} cy={12} r={1.8} fill={color} />
    </Svg>
  );
}

const pad = (n: number) => (n < 10 ? '0' : '') + n;
const todayDob = () => {
  const d = new Date();
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
};
const validDob = (value: string) => /^\d{2}-\d{2}-\d{4}$/.test(value.trim());
const validTime = (value: string) => /^\d{2}:\d{2}$/.test(value.trim());
const tx = (text: { en: string; hi: string } | null | undefined, lang: 'en' | 'hi') => (text ? (lang === 'hi' ? text.hi : text.en) : '');
const safeSign = (sign: string | null | undefined, lang: 'en' | 'hi') => (sign ? aSign(sign, lang) : '-');

function ShellCard({ children, glow = false }: { children: React.ReactNode; glow?: boolean }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.card, { borderColor: glow ? theme.gold2 + '88' : theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.72)' : '#fffdf7' }]}>
      {children}
    </View>
  );
}

function Metric({ label, value }: { label: string; value?: string | number | null }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.metric, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.06)' : 'rgba(176,115,22,0.07)' }]}>
      <Text style={[styles.metricLabel, { color: theme.textMuted }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: theme.text }]} numberOfLines={1}>{value || '-'}</Text>
    </View>
  );
}

function StatusPill({ status }: { status: string }) {
  const { theme } = useTheme();
  const ready = status === 'ready';
  const color = ready ? '#3ec77a' : status === 'unavailable' ? '#e06a5a' : theme.gold1;
  return (
    <View style={[styles.statusPill, { borderColor: color + '88', backgroundColor: color + '16' }]}>
      <Text style={[styles.statusText, { color }]}>{ready ? 'READY' : status.toUpperCase()}</Text>
    </View>
  );
}

function SectionRow({ item }: { item: BrihatSection }) {
  const { theme } = useTheme();
  const { lang } = useLang();
  return (
    <View style={[styles.sectionRow, { borderBottomColor: theme.isDark ? 'rgba(201,150,46,0.16)' : 'rgba(176,115,22,0.14)' }]}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.sectionTitle, { color: theme.gold1 }]}>{tx(item.title, lang)}</Text>
        <Text style={[styles.sectionSub, { color: theme.textMuted }]} numberOfLines={1}>
          {item.count || 0} items {item.source ? `- ${item.source}` : ''}
        </Text>
      </View>
      <StatusPill status={item.status} />
    </View>
  );
}

function DomainCard({ item }: { item: BrihatDomain }) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const summary = tx(item.summary as any, lang);
  const years = item.timing?.favorableYears || [];
  return (
    <View style={[styles.domain, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.025)' : 'rgba(176,115,22,0.045)' }]}>
      <View style={styles.domainTop}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.domainTitle, { color: theme.gold1 }]}>{tx(item.title, lang)}</Text>
          <Text style={[styles.domainMeta, { color: theme.textMuted }]}>{item.charts.join(', ')} - {item.focus.slice(0, 3).join(', ')}</Text>
        </View>
        <StatusPill status={item.confidence === 'calculated' ? 'ready' : 'partial'} />
      </View>
      <Text style={[styles.domainText, { color: theme.textSoft }]} numberOfLines={4}>
        {summary || (lang === 'hi' ? 'Is area ke liye deeper verified rules next phase me add honge.' : 'Deeper verified rules for this area will be added in the next phase.')}
      </Text>
      <View style={styles.domainChips}>
        {!!item.timing?.currentDashaLord && <SmallChip label={`Dasha: ${item.timing.currentDashaLord}`} />}
        {!!years.length && <SmallChip label={`Good years: ${years.join(', ')}`} />}
      </View>
    </View>
  );
}

function SmallChip({ label }: { label: string }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.smallChip, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.07)' : '#fff7e2' }]}>
      <Text style={[styles.smallChipText, { color: theme.goldText }]}>{label}</Text>
    </View>
  );
}

const ROADMAP_REASON: Record<string, { en: string; hi: string }> = {
  'in-calibration': { en: 'Being calibrated', hi: 'सत्यापन जारी' },
  'needs-placidus-cusps': { en: 'Needs Placidus cusps', hi: 'Placidus cusp आवश्यक' },
  'source-verification': { en: 'Verifying sources', hi: 'स्रोत सत्यापन' },
  'expert-module': { en: 'Expert module', hi: 'विशेषज्ञ मॉड्यूल' },
  planned: { en: 'Planned', hi: 'योजनाबद्ध' },
};
function RoadmapItem({ title, status }: { title: string; status: string }) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const reason = ROADMAP_REASON[status] || { en: status.replace(/-/g, ' '), hi: status.replace(/-/g, ' ') };
  return (
    <View style={[styles.roadmap, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(176,115,22,0.03)' }]}>
      <View style={styles.roadmapTop}>
        <View style={[styles.roadmapDot, { backgroundColor: theme.gold2 }]} />
        <Text style={[styles.roadmapTitle, { color: theme.text }]} numberOfLines={2}>{title}</Text>
      </View>
      <View style={[styles.roadmapBadge, { borderColor: theme.gold2 + '66', backgroundColor: theme.gold2 + '12' }]}>
        <Text style={[styles.roadmapStatus, { color: theme.goldText }]}>{lang === 'hi' ? reason.hi : reason.en}</Text>
      </View>
    </View>
  );
}

const PLANET_HI: Record<string, string> = { Sun: 'सूर्य', Moon: 'चंद्र', Mars: 'मंगल', Mercury: 'बुध', Jupiter: 'गुरु', Venus: 'शुक्र', Saturn: 'शनि', Rahu: 'राहु', Ketu: 'केतु' };
const nakName = (n: any): string => (!n ? '-' : typeof n === 'string' ? n : n.Name || '-');
const houseNum = (h: any): string => { const m = String(h ?? '').match(/\d+/); return m ? m[0] : '-'; };
const degShort = (d: any): string => { const n = String(d ?? '').match(/\d+/g); return n && n.length >= 2 ? `${n[0]}°${n[1]}'` : (n && n[0] ? `${n[0]}°` : '-'); };

function AvakhadaCard({ a }: { a: BrihatAvakhada }) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const L = (en: string, hi: string) => (lang === 'hi' ? hi : en);
  const rows: [string, string][] = [
    [L('Varna', 'वर्ण'), tx(a.varna, lang)],
    [L('Vashya', 'वश्य'), tx(a.vashya, lang)],
    [L('Yoni', 'योनि'), tx(a.yoni, lang)],
    [L('Gana', 'गण'), tx(a.gana, lang)],
    [L('Nadi', 'नाड़ी'), tx(a.nadi, lang)],
    [L('Tatva', 'तत्व'), tx(a.tatva, lang)],
    [L('Paya', 'पाया'), a.paya ? tx(a.paya, lang) : '-'],
    [L('Nakshatra', 'नक्षत्र'), `${a.nakshatra.name}${a.nakshatra.pada ? ' • ' + a.nakshatra.pada : ''}`],
    [L('Nakshatra Lord', 'नक्षत्र स्वामी'), tx(a.nakshatra.lord, lang)],
    [L('Rashi', 'राशि'), safeSign(a.rashi.name, lang)],
    [L('Rashi Lord', 'राशि स्वामी'), tx(a.rashi.lord, lang)],
    [L('Lagna', 'लग्न'), a.lagna ? safeSign(a.lagna.name, lang) : '-'],
    [L('Lagna Lord', 'लग्न स्वामी'), a.lagna ? tx(a.lagna.lord, lang) : '-'],
    [L('Dasha Balance', 'दशा शेष'), a.dashaBalance || '-'],
  ];
  return (
    <ShellCard>
      <Text style={[styles.blockTitle, { color: theme.text }]}>{L('Avakhada Chakra', 'अवकहड़ा चक्र')}</Text>
      <Text style={[styles.sourceNote, { color: theme.textMuted, marginTop: 1, marginBottom: 4 }]}>
        {L('Classical birth attributes derived from Moon & Lagna.', 'चंद्र व लग्न से शास्त्रीय जन्म-विशेषताएँ।')}
      </Text>
      <View style={styles.metrics}>
        {rows.map(([k, v]) => <Metric key={k} label={k} value={v} />)}
      </View>
    </ShellCard>
  );
}

function PlanetTable({ planets }: { planets: ApiPlanet[] }) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const L = (en: string, hi: string) => (lang === 'hi' ? hi : en);
  const head = theme.goldText;
  return (
    <ShellCard>
      <Text style={[styles.blockTitle, { color: theme.text }]}>{L('Planetary Positions', 'ग्रह स्थिति')}</Text>
      <View style={[styles.trHead, { borderBottomColor: theme.gold2 + '55' }]}>
        <Text style={[styles.cP, styles.thTxt, { color: head }]}>{L('Planet', 'ग्रह')}</Text>
        <Text style={[styles.cS, styles.thTxt, { color: head }]}>{L('Sign', 'राशि')}</Text>
        <Text style={[styles.cD, styles.thTxt, { color: head }]}>{L('Deg', 'अंश')}</Text>
        <Text style={[styles.cN, styles.thTxt, { color: head }]}>{L('Nakshatra', 'नक्षत्र')}</Text>
        <Text style={[styles.cH, styles.thTxt, { color: head }]}>{L('Hse', 'भाव')}</Text>
      </View>
      {planets.map((p) => {
        const retro = !!p.isRetrograde && String(p.isRetrograde).toLowerCase() !== 'false';
        return (
          <View key={p.planet} style={[styles.tr, { borderBottomColor: theme.isDark ? 'rgba(201,150,46,0.12)' : 'rgba(176,115,22,0.12)' }]}>
            <Text style={[styles.cP, styles.tdTxt, { color: theme.text }]} numberOfLines={1}>{(lang === 'hi' ? PLANET_HI[p.planet] : null) || p.planet}{retro ? ' (R)' : ''}</Text>
            <Text style={[styles.cS, styles.tdTxt, { color: theme.textSoft }]} numberOfLines={1}>{p.sign ? safeSign(p.sign, lang) : '-'}</Text>
            <Text style={[styles.cD, styles.tdTxt, { color: theme.textSoft }]} numberOfLines={1}>{degShort(p.degreeInSign)}</Text>
            <Text style={[styles.cN, styles.tdTxt, { color: theme.textSoft }]} numberOfLines={1}>{nakName(p.nakshatra)}</Text>
            <Text style={[styles.cH, styles.tdTxt, { color: theme.textSoft }]} numberOfLines={1}>{houseNum(p.house)}</Text>
          </View>
        );
      })}
    </ShellCard>
  );
}

function AshtakavargaCard({ av }: { av: BrihatAshtakavarga }) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const L = (en: string, hi: string) => (lang === 'hi' ? hi : en);
  const abbr = (s: string) => s.slice(0, 3);
  const planets = Object.keys(av.bhinna);
  const cell = (v: number) => (v >= 30 ? '#3ec77a' : v <= 24 ? '#e0865a' : theme.textSoft);
  return (
    <ShellCard>
      <Text style={[styles.blockTitle, { color: theme.text }]}>{L('Ashtakavarga', 'अष्टकवर्ग')}</Text>
      <Text style={[styles.sourceNote, { color: theme.textMuted, marginTop: 1, marginBottom: 8 }]}>
        {L(`Sarvashtakavarga — bindus per sign (total ${av.sarvaTotal}). More bindus = stronger sign.`, `सर्वाष्टकवर्ग — प्रति राशि बिंदु (कुल ${av.sarvaTotal})। अधिक बिंदु = बलवान राशि।`)}
      </Text>
      <View style={styles.savGrid}>
        {av.sarva.map((v, i) => (
          <View key={i} style={[styles.savCell, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.05)' : 'rgba(176,115,22,0.05)' }]}>
            <Text style={[styles.savSign, { color: theme.textMuted }]}>{abbr(av.signs[i])}</Text>
            <Text style={[styles.savNum, { color: cell(v) }]}>{v}</Text>
          </View>
        ))}
      </View>
      <Text style={[styles.sourceNote, { color: theme.textMuted, marginTop: 13, marginBottom: 6 }]}>{L('Bhinnashtakavarga (per planet) — swipe →', 'भिन्नाष्टकवर्ग (प्रति ग्रह) — स्वाइप →')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={styles.bavRow}>
            <Text style={[styles.bavCell, styles.bavLabel, styles.bavHead, { color: theme.goldText }]}>{L('Planet', 'ग्रह')}</Text>
            {av.signs.map((s, i) => <Text key={i} style={[styles.bavCell, styles.bavHead, { color: theme.goldText }]}>{abbr(s)}</Text>)}
            <Text style={[styles.bavCell, styles.bavHead, { color: theme.goldText }]}>{L('Tot', 'कुल')}</Text>
          </View>
          {planets.map((p) => (
            <View key={p} style={[styles.bavRow, { borderTopColor: theme.isDark ? 'rgba(201,150,46,0.12)' : 'rgba(176,115,22,0.12)', borderTopWidth: StyleSheet.hairlineWidth }]}>
              <Text style={[styles.bavCell, styles.bavLabel, { color: theme.text }]}>{(lang === 'hi' ? PLANET_HI[p] : null) || p}</Text>
              {av.bhinna[p].bindus.map((v, i) => <Text key={i} style={[styles.bavCell, { color: theme.textSoft }]}>{v}</Text>)}
              <Text style={[styles.bavCell, { color: theme.gold1, fontFamily: fonts.interBold }]}>{av.bhinna[p].total}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </ShellCard>
  );
}

function NumCard({ label, c }: { label: string; c: NumberCard }) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const tr = (en: string, hi: string) => (lang === 'hi' ? hi : en);
  return (
    <View style={[styles.numCard, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.05)' : 'rgba(176,115,22,0.05)' }]}>
      <View style={styles.numTop}>
        <View style={[styles.numCircle, { borderColor: theme.gold2 + 'aa' }]}><Text style={[styles.numBig, { color: theme.gold1 }]}>{c.number}</Text></View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.numLabel, { color: theme.goldText }]}>{label}</Text>
          <Text style={[styles.numPlanet, { color: theme.text }]}>{lang === 'hi' ? c.planetHi : c.planet}</Text>
        </View>
      </View>
      <Text style={[styles.numAttrs, { color: theme.textMuted }]}>
        {tr('Day', 'दिन')}: {lang === 'hi' ? c.dayHi : c.day} · {tr('Color', 'रंग')}: {lang === 'hi' ? c.colorHi : c.color} · {tr('Stone', 'रत्न')}: {lang === 'hi' ? c.stoneHi : c.stone} · {tr('Metal', 'धातु')}: {lang === 'hi' ? c.metalHi : c.metal}
      </Text>
    </View>
  );
}

function NumerologyCard({ nu }: { nu: BrihatNumerology }) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const L = (en: string, hi: string) => (lang === 'hi' ? hi : en);
  return (
    <ShellCard>
      <Text style={[styles.blockTitle, { color: theme.text }]}>{L('Numerology', 'अंक ज्योतिष')}</Text>
      <Text style={[styles.sourceNote, { color: theme.textMuted, marginTop: 1, marginBottom: 10 }]}>
        {L('Moolank (from birth day) & Bhagyank (from full date) — Chaldean.', 'मूलांक (जन्म-दिन से) व भाग्यांक (पूर्ण तिथि से) — कैल्डियन।')}
      </Text>
      <NumCard label={L('Moolank (Psychic)', 'मूलांक')} c={nu.psychic} />
      <View style={{ height: 10 }} />
      <NumCard label={L('Bhagyank (Destiny)', 'भाग्यांक')} c={nu.destiny} />
      {!!nu.name && (<><View style={{ height: 10 }} /><NumCard label={L('Name Number', 'नाम अंक')} c={nu.name} /></>)}
    </ShellCard>
  );
}

const yearOf = (s?: string) => { const m = String(s ?? '').match(/(\d{4})/); return m ? m[1] : ''; };

function DashaCard({ timeline, dasha }: { timeline?: LifeTimelineResponse | null; dasha?: DashaResponse | null }) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const L = (en: string, hi: string) => (lang === 'hi' ? hi : en);
  let rows: { lord: string; range: string; current: boolean }[] = [];
  if (timeline?.periods?.length) {
    rows = timeline.periods.filter((p) => !p.past).slice(0, 10).map((p) => ({ lord: p.lord, range: `${p.fromYear} – ${p.toYear}`, current: !!p.current }));
  } else if (dasha?.dasha?.length) {
    rows = dasha.dasha.slice(0, 10).map((d) => ({ lord: d.lord, range: `${yearOf(d.start)} – ${yearOf(d.end)}`, current: false }));
  }
  if (!rows.length) return null;
  const bal = timeline?.balance;
  return (
    <ShellCard>
      <Text style={[styles.blockTitle, { color: theme.text }]}>{L('Vimshottari Dasha', 'विंशोत्तरी दशा')}</Text>
      {!!bal && <Text style={[styles.sourceNote, { color: theme.textMuted, marginTop: 1, marginBottom: 8 }]}>{L(`Balance at birth: ${bal.lord} ${bal.bhogyaYears}y`, `जन्म-शेष दशा: ${bal.lord} ${bal.bhogyaYears} वर्ष`)}</Text>}
      {rows.map((r, i) => (
        <View key={i} style={[styles.dashaRow, { borderBottomColor: theme.isDark ? 'rgba(201,150,46,0.12)' : 'rgba(176,115,22,0.12)' }, r.current && { backgroundColor: theme.gold2 + '1c', borderRadius: 8, paddingHorizontal: 8 }]}>
          <Text style={[styles.dashaLord, { color: r.current ? theme.gold1 : theme.text }]}>{(lang === 'hi' ? PLANET_HI[r.lord] : null) || r.lord}{r.current ? `  • ${L('Current', 'वर्तमान')}` : ''}</Text>
          <Text style={[styles.dashaRange, { color: theme.textMuted }]}>{r.range}</Text>
        </View>
      ))}
    </ShellCard>
  );
}

function YogaDoshaCard({ yogas, doshas }: { yogas?: YogaItem[]; doshas?: ApiDosha[] }) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const L = (en: string, hi: string) => (lang === 'hi' ? hi : en);
  const yg = yogas || [];
  const ds = doshas || [];
  if (!yg.length && !ds.length) return null;
  return (
    <ShellCard>
      <Text style={[styles.blockTitle, { color: theme.text }]}>{L('Yogas & Doshas', 'योग व दोष')}</Text>
      {!!ds.length && (
        <View style={styles.doshaChips}>
          {ds.map((d, i) => (
            <View key={i} style={[styles.doshaChip, { borderColor: (d.present ? '#e0865a' : '#3ec77a') + '88', backgroundColor: (d.present ? '#e0865a' : '#3ec77a') + '14' }]}>
              <Text style={[styles.doshaChipTxt, { color: d.present ? '#e0865a' : '#3ec77a' }]}>{d.name}: {d.present ? L('Present', 'है') : L('Clear', 'नहीं')}</Text>
            </View>
          ))}
        </View>
      )}
      {yg.slice(0, 12).map((y, i) => (
        <View key={i} style={[styles.yogaRow, { borderBottomColor: theme.isDark ? 'rgba(201,150,46,0.12)' : 'rgba(176,115,22,0.12)' }]}>
          <Text style={[styles.yogaName, { color: theme.gold1 }]}>{y.name}</Text>
          {!!y.description && <Text style={[styles.yogaDesc, { color: theme.textSoft }]} numberOfLines={2}>{y.description}</Text>}
        </View>
      ))}
      {!yg.length && <Text style={[styles.sourceNote, { color: theme.textMuted, marginTop: 8 }]}>{L('No special yogas in the primary set.', 'मुख्य सूची में कोई विशेष योग नहीं।')}</Text>}
    </ShellCard>
  );
}

function RemediesCard({ rem }: { rem: RemediesResponse }) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const L = (en: string, hi: string) => (lang === 'hi' ? hi : en);
  const gem = rem.remedies?.lifeGem;
  const mantras = rem.remedies?.planetMantras || [];
  const sade = rem.sadeSati;
  return (
    <ShellCard>
      <Text style={[styles.blockTitle, { color: theme.text }]}>{L('Gemstone & Remedies', 'रत्न व उपाय')}</Text>
      {!!sade && (sade.active || sade.dhaiya) && (
        <View style={[styles.doshaChip, { alignSelf: 'flex-start', marginTop: 4, marginBottom: 4, borderColor: '#e0865a88', backgroundColor: '#e0865a14' }]}>
          <Text style={[styles.doshaChipTxt, { color: '#e0865a' }]}>{sade.active ? L('Sade Sati active', 'साढ़े साती सक्रिय') : L('Dhaiya active', 'ढैय्या सक्रिय')}{sade.phase ? ` — ${lang === 'hi' ? (sade.phaseHi || sade.phase) : sade.phase}` : ''}</Text>
        </View>
      )}
      {!!gem && (
        <View style={[styles.metrics, { marginTop: 8 }]}>
          <Metric label={L('Life Gem', 'जीवन रत्न')} value={lang === 'hi' ? (gem.gemstoneHi || gem.gemstone) : gem.gemstone} />
          <Metric label={L('Metal', 'धातु')} value={lang === 'hi' ? (gem.metalHi || gem.metal) : gem.metal} />
          <Metric label={L('Finger', 'उँगली')} value={lang === 'hi' ? (gem.fingerHi || gem.finger) : gem.finger} />
          <Metric label={L('Day', 'दिन')} value={lang === 'hi' ? (gem.dayHi || gem.day) : gem.day} />
        </View>
      )}
      {!!mantras.length && (
        <>
          <Text style={[styles.sourceNote, { color: theme.textMuted, marginTop: 12, marginBottom: 5 }]}>{L('Key planetary mantras', 'मुख्य ग्रह मंत्र')}</Text>
          {mantras.slice(0, 4).map((m, i) => (
            <Text key={i} style={[styles.mantraTxt, { color: theme.textSoft }]} numberOfLines={2}>•  {(lang === 'hi' ? m.planetHi : null) || m.planet}: {m.mantra}</Text>
          ))}
        </>
      )}
    </ShellCard>
  );
}

function JaiminiCard({ j }: { j: BrihatJaimini }) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const L = (en: string, hi: string) => (lang === 'hi' ? hi : en);
  return (
    <ShellCard>
      <Text style={[styles.blockTitle, { color: theme.text }]}>{L('Jaimini — Chara Karakas', 'जैमिनी — चर कारक')}</Text>
      <Text style={[styles.sourceNote, { color: theme.textMuted, marginTop: 1, marginBottom: 8 }]}>
        {L('Planets ranked by degree — each signifies a life area.', 'अंश अनुसार ग्रह क्रम — प्रत्येक एक जीवन-क्षेत्र दर्शाता है।')}
      </Text>
      {!!j.arudhaLagna && (
        <View style={[styles.alBox, { borderColor: theme.gold2 + '66', backgroundColor: theme.gold2 + '12' }]}>
          <Text style={[styles.alLabel, { color: theme.goldText }]}>{L('Arudha Lagna (AL)', 'आरूढ़ लग्न')}</Text>
          <Text style={[styles.alValue, { color: theme.gold1 }]}>{safeSign(j.arudhaLagna.sign, lang)}</Text>
        </View>
      )}
      {j.charaKarakas.map((k) => (
        <View key={k.key} style={[styles.karakaRow, { borderBottomColor: theme.isDark ? 'rgba(201,150,46,0.12)' : 'rgba(176,115,22,0.12)' }]}>
          <View style={[styles.karakaTag, { borderColor: theme.gold2 + '88' }]}><Text style={[styles.karakaTagTxt, { color: theme.gold1 }]}>{k.key}</Text></View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.karakaName, { color: theme.text }]} numberOfLines={1}>{lang === 'hi' ? k.hi : k.en} · {(lang === 'hi' ? PLANET_HI[k.planet] : null) || k.planet}</Text>
            <Text style={[styles.karakaSig, { color: theme.textMuted }]} numberOfLines={1}>{k.sig} · {k.degree}° {safeSign(k.sign, lang)}</Text>
          </View>
        </View>
      ))}
    </ShellCard>
  );
}

function VarshphalCard({ v }: { v: BrihatVarshphal }) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const L = (en: string, hi: string) => (lang === 'hi' ? hi : en);
  if (!v.years?.length) return null;
  return (
    <ShellCard>
      <Text style={[styles.blockTitle, { color: theme.text }]}>{L('Varshphal — 5 Year Muntha', 'वर्षफल — 5 वर्ष मुन्था')}</Text>
      <Text style={[styles.sourceNote, { color: theme.textMuted, marginTop: 1, marginBottom: 8 }]}>
        {L('Muntha advances one sign per year and flags each year’s theme.', 'मुन्था हर वर्ष एक राशि आगे बढ़कर वर्ष का भाव दर्शाती है।')}
      </Text>
      {v.years.map((y) => {
        const good = y.kind === 'good';
        return (
          <View key={y.year} style={[styles.vYear, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.025)' : 'rgba(176,115,22,0.04)' }]}>
            <View style={[styles.vYearBadge, { borderColor: (good ? '#3ec77a' : theme.gold2) + '88', backgroundColor: (good ? '#3ec77a' : theme.gold2) + '14' }]}>
              <Text style={[styles.vYearNum, { color: good ? '#3ec77a' : theme.gold1 }]}>{y.year}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.vYearSign, { color: theme.text }]} numberOfLines={1}>{safeSign(y.munthaSign, lang)} · {L('House', 'भाव')} {y.houseFromLagna}</Text>
              <Text style={[styles.vYearTheme, { color: theme.textMuted }]} numberOfLines={1}>{tx(y.theme, lang)}</Text>
            </View>
          </View>
        );
      })}
    </ShellCard>
  );
}

function KpCard({ kp }: { kp: BrihatKp }) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const L = (en: string, hi: string) => (lang === 'hi' ? hi : en);
  const head = theme.goldText;
  const rows = [...(kp.ascendant ? [{ ...kp.ascendant, planet: 'Asc' }] : []), ...kp.planets];
  const pl = (p: string, hiName?: string) => (lang === 'hi' ? (PLANET_HI[p] || hiName || p) : p);
  return (
    <ShellCard>
      <Text style={[styles.blockTitle, { color: theme.text }]}>{L('KP Significators', 'KP कारक')}</Text>
      <Text style={[styles.sourceNote, { color: theme.textMuted, marginTop: 1, marginBottom: 8 }]}>
        {L('Krishnamurti Paddhati — Sign / Star / Sub lord of each planet.', 'कृष्णमूर्ति पद्धति — हर ग्रह का राशि / नक्षत्र / उप स्वामी।')}
      </Text>
      <View style={[styles.trHead, { borderBottomColor: theme.gold2 + '55' }]}>
        <Text style={[styles.kP, styles.thTxt, { color: head }]}>{L('Planet', 'ग्रह')}</Text>
        <Text style={[styles.kL, styles.thTxt, { color: head }]}>{L('Sign L', 'राशि')}</Text>
        <Text style={[styles.kL, styles.thTxt, { color: head }]}>{L('Star L', 'नक्षत्र')}</Text>
        <Text style={[styles.kL, styles.thTxt, { color: head }]}>{L('Sub L', 'उप')}</Text>
      </View>
      {rows.map((r, i) => (
        <View key={i} style={[styles.tr, { borderBottomColor: theme.isDark ? 'rgba(201,150,46,0.12)' : 'rgba(176,115,22,0.12)' }]}>
          <Text style={[styles.kP, styles.tdTxt, { color: r.planet === 'Asc' ? theme.gold1 : theme.text }]} numberOfLines={1}>{r.planet === 'Asc' ? L('Asc', 'लग्न') : pl(r.planet)}</Text>
          <Text style={[styles.kL, styles.tdTxt, { color: theme.textSoft }]} numberOfLines={1}>{pl(r.signLord, r.signLordHi)}</Text>
          <Text style={[styles.kL, styles.tdTxt, { color: theme.textSoft }]} numberOfLines={1}>{pl(r.starLord, r.starLordHi)}</Text>
          <Text style={[styles.kL, styles.tdTxt, { color: theme.gold1 }]} numberOfLines={1}>{pl(r.subLord, r.subLordHi)}</Text>
        </View>
      ))}
    </ShellCard>
  );
}

function ShadbalaCard({ sb }: { sb: BrihatShadbala }) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const L = (en: string, hi: string) => (lang === 'hi' ? hi : en);
  const rows = Object.entries(sb.planets).sort((a, b) => a[1].rank - b[1].rank);
  const maxR = Math.max(...rows.map(([, v]) => v.rupas), 1);
  return (
    <ShellCard>
      <Text style={[styles.blockTitle, { color: theme.text }]}>{L('Shadbala — Planetary Strength', 'षड्बल — ग्रह बल')}</Text>
      <Text style={[styles.sourceNote, { color: theme.textMuted, marginTop: 1, marginBottom: 10 }]}>
        {L('Six-fold strength in Rupas (classical BPHS). Green = above required minimum.', 'षड्विध बल (रूप में, BPHS)। हरा = आवश्यक न्यूनतम से अधिक।')}
      </Text>
      {rows.map(([pl, v]) => (
        <View key={pl} style={styles.sbRow}>
          <Text style={[styles.sbName, { color: theme.text }]} numberOfLines={1}>{(lang === 'hi' ? PLANET_HI[pl] : null) || pl}</Text>
          <View style={[styles.sbTrack, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
            <View style={[styles.sbFill, { width: `${Math.round((v.rupas / maxR) * 100)}%`, backgroundColor: v.strong ? '#3ec77a' : theme.gold2 }]} />
          </View>
          <Text style={[styles.sbVal, { color: v.strong ? '#3ec77a' : theme.textMuted }]}>{v.rupas}</Text>
        </View>
      ))}
      <Text style={[styles.sourceNote, { color: theme.textMuted, marginTop: 8, fontSize: 10.5 }]}>
        {L('Components per planet: Sthana · Dig · Kala · Cheshta · Naisargika · Drik (in the PDF).', 'प्रति ग्रह घटक: स्थान · दिग · काल · चेष्टा · नैसर्गिक · दृक् (PDF में)।')}
      </Text>
    </ShellCard>
  );
}

function LalKitabCard({ lk }: { lk: BrihatLalKitab }) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const L = (en: string, hi: string) => (lang === 'hi' ? hi : en);
  return (
    <ShellCard>
      <Text style={[styles.blockTitle, { color: theme.text }]}>{L('Lal Kitab Chart', 'लाल किताब कुंडली')}</Text>
      <Text style={[styles.sourceNote, { color: theme.textMuted, marginTop: 1, marginBottom: 10 }]}>
        {L('House-wise planet placement (Teva). Lagna: ', 'भाव अनुसार ग्रह स्थिति (टेवा)। लग्न: ')}{lk.lagna ? safeSign(lk.lagna, lang) : '-'}
      </Text>
      <View style={styles.lkGrid}>
        {lk.houses.map((h) => (
          <View key={h.house} style={[styles.lkCell, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.05)' : 'rgba(176,115,22,0.05)' }]}>
            <Text style={[styles.lkHouse, { color: theme.goldText }]}>{h.house} · {safeSign(h.sign, lang).slice(0, 3)}</Text>
            <Text style={[styles.lkPlanets, { color: h.planets.length ? theme.text : theme.textMuted }]} numberOfLines={2}>
              {h.planets.length ? h.planets.map((p) => (lang === 'hi' ? p.hi : p.en)).join(', ') : '—'}
            </Text>
          </View>
        ))}
      </View>
    </ShellCard>
  );
}

export function BrihatKundliScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const t = useT();
  const dialog = useDialog();
  const [dob, setDob] = useState(todayDob());
  const [tob, setTob] = useState('06:00');
  const [place, setPlace] = useState('');
  const [birthLocation, setBirthLocation] = useState<LocationSuggestion | null>(null);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [personName, setPersonName] = useState('');
  const [report, setReport] = useState<BrihatKundliResponse | null>(null);

  useEffect(() => {
    birthFromProfile().then((birth) => {
      if (!birth) return;
      if (birth.dob) setDob(birth.dob);
      if (birth.tob) setTob(birth.tob);
      if (birth.place) setPlace(birth.place);
      if (birth.name) setPersonName(birth.name);
      if (birth.lat != null && birth.lng != null) {
        setBirthLocation({
          id: 'profile',
          provider: 'manual',
          mainText: birth.place || 'Saved birth place',
          description: birth.place || 'Saved birth place',
          lat: birth.lat,
          lng: birth.lng,
        });
      }
    }).catch(() => {});
  }, []);

  const readyCount = useMemo(() => (report?.sections || []).filter((s) => s.status === 'ready').length, [report]);

  const generate = async () => {
    if (busy) return;
    if (!validDob(dob) || !validTime(tob) || !place.trim()) {
      hError();
      dialog(
        lang === 'hi' ? 'विवरण अधूरा' : 'Details incomplete',
        lang === 'hi' ? 'जन्म तिथि (DD-MM-YYYY), समय (HH:MM) और सही जन्म स्थान भरें।' : 'Fill DOB as DD-MM-YYYY, time as HH:MM, and exact birth place.',
      );
      return;
    }
    setBusy(true);
    setReport(null);
    try {
      const resolved = birthLocation || await resolveLocation({ query: place.trim(), lang }).then((r) => r.item).catch(() => null);
      const finalPlace = resolved?.description || place.trim();
      const coords = resolved?.lat != null && resolved?.lng != null ? { lat: resolved.lat, lng: resolved.lng } : {};
      if (resolved?.description && resolved.description !== place) setPlace(resolved.description);
      const result = await getBrihatKundli({ dob: dob.trim(), tob: tob.trim(), tz: '+05:30', place: finalPlace, ...coords });
      setReport(result);
      hSuccess();
    } catch (e: any) {
      hError();
      dialog('Brihat Kundli', e?.message || (lang === 'hi' ? 'रिपोर्ट नहीं बन पाई — कृपया पुनः प्रयास करें।' : 'Could not generate the report — please try again.'));
    } finally {
      setBusy(false);
    }
  };

  const exportPdf = async () => {
    if (exporting || !report) return;
    setExporting(true);
    try {
      const html = buildBrihatHtml({ name: personName.trim(), dob: dob.trim(), tob: tob.trim(), place: place.trim(), lang }, report);
      const { uri } = await Print.printToFileAsync({ html, width: 595, height: 842, margins: { top: 36, right: 32, bottom: 40, left: 32 }, textZoom: 100 });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Brihat Kundli', UTI: 'com.adobe.pdf' });
      hSuccess();
    } catch (e: any) {
      hError();
      dialog('PDF', e?.message || (lang === 'hi' ? 'PDF नहीं बन पाई।' : 'PDF export failed.'));
    } finally {
      setExporting(false);
    }
  };

  const title = lang === 'hi' ? 'Brihat Kundli' : 'Brihat Kundli';
  const s = report?.summary;

  return (
    <Page title={title} onBack={() => { hTap(); navigation.goBack(); }}>
      <LinearGradient
        colors={theme.isDark ? ['#251404', '#080604', '#000000'] : ['#fff4d6', '#fffaf0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { borderColor: theme.cardBorder }]}
      >
        <View style={[styles.heroIcon, { borderColor: theme.gold2 + '88', backgroundColor: theme.isDark ? 'rgba(0,0,0,0.42)' : '#fff8e8' }]}>
          <BookIcon color={theme.gold1} size={30} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <GradientText style={styles.heroTitle}>BRIHAT KUNDLI</GradientText>
          <Text style={[styles.heroText, { color: theme.textSoft }]}>
            {lang === 'hi'
              ? 'Advanced report: chart, varga, dasha, dosha, gochar, remedies aur domain-wise reading.'
              : 'Advanced report with charts, varga, dasha, dosha, transits, remedies and domain-wise reading.'}
          </Text>
        </View>
      </LinearGradient>

      <ShellCard>
        <View style={styles.formHead}>
          <ChartIcon color={theme.gold1} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.formTitle, { color: theme.text }]}>{lang === 'hi' ? 'सटीक जन्म विवरण' : 'Exact birth data'}</Text>
            <Text style={[styles.formHint, { color: theme.textMuted }]}>{lang === 'hi' ? 'सटीक निर्देशांक के लिए गाँव/तहसील/ज़िला वाला सुझाव चुनें।' : 'Select village/tehsil/district suggestion for accurate coordinates.'}</Text>
          </View>
        </View>
        <View style={styles.form}>
          <TextField icon={<CalendarIcon color={theme.gold2} size={19} />} label="Date of birth" value={dob} onChangeText={setDob} placeholder="DD-MM-YYYY" />
          <TextField icon={<ClockIcon color={theme.gold2} size={19} />} label="Time of birth" value={tob} onChangeText={setTob} placeholder="HH:MM" />
          <BirthPlaceField label="Place of birth" value={place} onChangeText={setPlace} onSelect={setBirthLocation} placeholder="Eg. Agolai, Jodhpur, Rajasthan" />
        </View>
        <GoldButton label={busy ? 'Generating...' : 'Generate Brihat Kundli'} onPress={generate} />
        {busy && <ActivityIndicator color={theme.gold1} style={{ marginTop: 14 }} />}
      </ShellCard>

      <ShellCard glow>
        <View style={styles.accuracyHead}>
          <ShieldIcon color={theme.gold1} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.formTitle, { color: theme.text }]}>{lang === 'hi' ? 'Trust & accuracy layer' : 'Trust & accuracy layer'}</Text>
            <Text style={[styles.formHint, { color: theme.textMuted }]}>
              {report?.accuracy.engine || 'Real planetary positions + Lahiri ayanamsa + exact coordinates. AI only explains calculated data.'}
            </Text>
          </View>
        </View>
        <View style={styles.checks}>
          {['Exact birth time', 'Precise lat/lng', 'Lahiri ayanamsa', 'Section-wise source'].map((item) => <SmallChip key={item} label={item} />)}
        </View>
      </ShellCard>

      {!!report && (
        <View style={styles.report}>
          <ShellCard glow>
            <Text style={[styles.kicker, { color: theme.goldText }]}>REPORT SUMMARY</Text>
            <GradientText style={styles.reportTitle}>{tx(report.title, lang)}</GradientText>
            <View style={styles.metrics}>
              <Metric label="Lagna" value={safeSign(s?.ascendant, lang)} />
              <Metric label="Moon" value={safeSign(s?.moonSign, lang)} />
              <Metric label="Sun" value={safeSign(s?.sunSign, lang)} />
              <Metric label="Dasha" value={s?.activeDasha?.lord || '-'} />
            </View>
            <Text style={[styles.sourceNote, { color: theme.textMuted }]}>
              {readyCount}/{report.sections.length} sections ready - {report.accuracy.note}
            </Text>
          </ShellCard>

          {!!report.avakhada && <AvakhadaCard a={report.avakhada} />}

          {!!report.data?.kundli?.data?.planets?.length && <PlanetTable planets={report.data.kundli.data.planets} />}

          {(!!report.data?.timeline?.periods?.length || !!report.data?.dasha?.dasha?.length) && <DashaCard timeline={report.data?.timeline} dasha={report.data?.dasha} />}

          {(!!report.data?.yoga?.yogas?.length || !!report.summary?.doshas?.length) && <YogaDoshaCard yogas={report.data?.yoga?.yogas} doshas={report.summary?.doshas} />}

          {!!report.ashtakavarga && <AshtakavargaCard av={report.ashtakavarga} />}

          {!!report.numerology && <NumerologyCard nu={report.numerology} />}

          {!!report.data?.remedies && <RemediesCard rem={report.data.remedies} />}

          {!!report.jaimini?.charaKarakas?.length && <JaiminiCard j={report.jaimini} />}

          {!!report.varshphal?.years?.length && <VarshphalCard v={report.varshphal} />}

          {!!report.kp?.planets?.length && <KpCard kp={report.kp} />}

          {!!report.shadbala?.planets && Object.keys(report.shadbala.planets).length > 0 && <ShadbalaCard sb={report.shadbala} />}

          {!!report.lalKitab?.houses?.length && <LalKitabCard lk={report.lalKitab} />}

          {(report.domains || []).some((d) => !!d.summary) && (
            <View>
              <Text style={[styles.outsideTitle, { color: theme.gold1 }]}>{lang === 'hi' ? 'Life areas' : 'Life areas'}</Text>
              {(report.domains || []).filter((d) => !!d.summary).map((item) => <DomainCard key={item.key} item={item} />)}
            </View>
          )}

          <View style={{ marginTop: 16 }}>
            <GoldButton label={exporting ? (lang === 'hi' ? 'PDF बन रही है…' : 'Generating PDF…') : (lang === 'hi' ? '📄 बृहत कुंडली PDF डाउनलोड करें' : '📄 Export Brihat Kundli PDF')} onPress={exportPdf} />
            {exporting && <ActivityIndicator color={theme.gold1} style={{ marginTop: 12 }} />}
          </View>
        </View>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  hero: { borderWidth: 1, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, overflow: 'hidden' },
  heroIcon: { width: 58, height: 58, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontFamily: fonts.cinzel, fontSize: 19, letterSpacing: 2.1 },
  heroText: { fontFamily: fonts.inter, fontSize: 12.5, lineHeight: 18, marginTop: 4 },
  card: { borderWidth: 1, borderRadius: radii.lg, padding: 15, marginTop: 14 },
  formHead: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 13 },
  accuracyHead: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  formTitle: { fontFamily: fonts.playfairBold, fontSize: 16 },
  formHint: { fontFamily: fonts.inter, fontSize: 12, lineHeight: 17, marginTop: 2 },
  form: { gap: 11, marginBottom: 14 },
  checks: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  report: { marginTop: 2 },
  kicker: { fontFamily: fonts.interBold, fontSize: 10.5, letterSpacing: 1.5 },
  reportTitle: { fontFamily: fonts.playfairBold, fontSize: 22, marginTop: 4 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 14 },
  metric: { width: '47.8%', borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10 },
  metricLabel: { fontFamily: fonts.interSemi, fontSize: 10.5, letterSpacing: 1 },
  metricValue: { fontFamily: fonts.playfairBold, fontSize: 15, marginTop: 3 },
  sourceNote: { fontFamily: fonts.inter, fontSize: 12, lineHeight: 18, marginTop: 12 },
  blockTitle: { fontFamily: fonts.playfairBold, fontSize: 17, marginBottom: 4 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  sectionTitle: { fontFamily: fonts.interSemi, fontSize: 13.5 },
  sectionSub: { fontFamily: fonts.inter, fontSize: 11.5, marginTop: 3 },
  statusPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontFamily: fonts.interBold, fontSize: 9.5, letterSpacing: 0.8 },
  outsideTitle: { fontFamily: fonts.playfairBold, fontSize: 18, marginTop: 16, marginBottom: 2 },
  domain: { borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 10 },
  domainTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  domainTitle: { fontFamily: fonts.playfairBold, fontSize: 16 },
  domainMeta: { fontFamily: fonts.inter, fontSize: 11.5, marginTop: 3 },
  domainText: { fontFamily: fonts.inter, fontSize: 12.5, lineHeight: 18.5, marginTop: 10 },
  domainChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 10 },
  smallChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  smallChipText: { fontFamily: fonts.interSemi, fontSize: 10.5 },
  roadmapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  roadmap: { width: '48%', borderWidth: 1, borderRadius: 13, padding: 10 },
  roadmapTitle: { flex: 1, minWidth: 0, fontFamily: fonts.interSemi, fontSize: 12 },
  roadmapStatus: { fontFamily: fonts.interSemi, fontSize: 9.5, letterSpacing: 0.3 },
  pdfLink: { marginTop: 14, borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  pdfText: { fontFamily: fonts.interBold, fontSize: 12.5, letterSpacing: 0.4 },
  trHead: { flexDirection: 'row', alignItems: 'center', paddingBottom: 7, marginTop: 8, borderBottomWidth: 1 },
  tr: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  thTxt: { fontFamily: fonts.interBold, fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
  tdTxt: { fontFamily: fonts.interSemi, fontSize: 12 },
  cP: { flex: 1.5 },
  cS: { flex: 1.25 },
  cD: { flex: 1 },
  cN: { flex: 1.7 },
  cH: { flex: 0.6, textAlign: 'right' },
  savGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  savCell: { width: '14.7%', borderWidth: 1, borderRadius: 9, paddingVertical: 7, alignItems: 'center' },
  savSign: { fontFamily: fonts.interSemi, fontSize: 9, letterSpacing: 0.3 },
  savNum: { fontFamily: fonts.playfairBold, fontSize: 16, marginTop: 1 },
  bavRow: { flexDirection: 'row', alignItems: 'center' },
  bavCell: { width: 30, textAlign: 'center', fontFamily: fonts.interSemi, fontSize: 11.5, paddingVertical: 6 },
  bavHead: { fontFamily: fonts.interBold, fontSize: 9.5, letterSpacing: 0.3, textTransform: 'uppercase' },
  bavLabel: { width: 52, textAlign: 'left', fontFamily: fonts.interSemi },
  numCard: { borderWidth: 1, borderRadius: 14, padding: 12 },
  numTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  numCircle: { width: 42, height: 42, borderRadius: 21, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  numBig: { fontFamily: fonts.playfairBold, fontSize: 20 },
  numLabel: { fontFamily: fonts.interBold, fontSize: 10.5, letterSpacing: 0.8, textTransform: 'uppercase' },
  numPlanet: { fontFamily: fonts.playfairBold, fontSize: 16, marginTop: 1 },
  numAttrs: { fontFamily: fonts.inter, fontSize: 11.5, lineHeight: 17, marginTop: 9 },
  dashaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth },
  dashaLord: { fontFamily: fonts.interSemi, fontSize: 13.5 },
  dashaRange: { fontFamily: fonts.inter, fontSize: 12 },
  doshaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 4, marginBottom: 6 },
  doshaChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  doshaChipTxt: { fontFamily: fonts.interSemi, fontSize: 11 },
  yogaRow: { paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth },
  yogaName: { fontFamily: fonts.interSemi, fontSize: 13 },
  yogaDesc: { fontFamily: fonts.inter, fontSize: 11.5, lineHeight: 16.5, marginTop: 2 },
  mantraTxt: { fontFamily: fonts.inter, fontSize: 12, lineHeight: 18 },
  modHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modCount: { fontFamily: fonts.interBold, fontSize: 11, letterSpacing: 0.5 },
  progressTrack: { height: 6, borderRadius: 999, marginTop: 8, marginBottom: 6, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 999 },
  alBox: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  alLabel: { fontFamily: fonts.interBold, fontSize: 10.5, letterSpacing: 0.8, textTransform: 'uppercase' },
  alValue: { fontFamily: fonts.playfairBold, fontSize: 16 },
  karakaRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth },
  karakaTag: { width: 40, borderWidth: 1, borderRadius: 8, paddingVertical: 4, alignItems: 'center' },
  karakaTagTxt: { fontFamily: fonts.interBold, fontSize: 11, letterSpacing: 0.5 },
  karakaName: { fontFamily: fonts.interSemi, fontSize: 13 },
  karakaSig: { fontFamily: fonts.inter, fontSize: 11, marginTop: 2 },
  vYear: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 13, padding: 10, marginTop: 8 },
  vYearBadge: { borderWidth: 1, borderRadius: 9, paddingHorizontal: 9, paddingVertical: 6, minWidth: 56, alignItems: 'center' },
  vYearNum: { fontFamily: fonts.playfairBold, fontSize: 15 },
  vYearSign: { fontFamily: fonts.interSemi, fontSize: 13.5 },
  vYearTheme: { fontFamily: fonts.inter, fontSize: 11.5, marginTop: 2 },
  kP: { flex: 1.1, fontFamily: fonts.interSemi },
  kL: { flex: 1, textAlign: 'left' },
  sbRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 9 },
  sbName: { width: 58, fontFamily: fonts.interSemi, fontSize: 12.5 },
  sbTrack: { flex: 1, height: 8, borderRadius: 999, overflow: 'hidden' },
  sbFill: { height: 8, borderRadius: 999 },
  sbVal: { width: 34, textAlign: 'right', fontFamily: fonts.interBold, fontSize: 12 },
  lkGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  lkCell: { width: '31.5%', borderWidth: 1, borderRadius: 9, padding: 7, minHeight: 52 },
  lkHouse: { fontFamily: fonts.interBold, fontSize: 9.5, letterSpacing: 0.3 },
  lkPlanets: { fontFamily: fonts.interSemi, fontSize: 11, marginTop: 3 },
  roadmapTop: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  roadmapDot: { width: 7, height: 7, borderRadius: 4 },
  roadmapBadge: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, marginTop: 8 },
});
