import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { Page } from '../components/Page';
import { GradientText } from '../components/GradientText';
import { GoldButton } from '../components/GoldButton';
import { TextField } from '../components/TextField';
import { UserLine } from '../components/icons/ProfileIcons';
import { ServiceIcon } from '../components/icons/ServiceIcons';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';
import { useLang } from '../i18n/LanguageProvider';
import { hError, hSelect, hSuccess, hTap } from '../lib/haptics';
import { useDialog } from '../components/DialogProvider';
import { VastuCompass, CompassDir } from '../components/VastuCompass';
import {
  analyzeVastu,
  askVastu,
  VastuAnalysisResponse,
  VastuAskResponse,
  VastuDirectionKey,
  VastuFinding,
  VastuPlan,
  VastuRoomType,
} from '../lib/api';

type Bi = { en: string; hi: string };
type RoomPick = Partial<Record<VastuRoomType, VastuDirectionKey | ''>>;

const DIRS: { key: VastuDirectionKey; en: string; hi: string }[] = [
  { key: 'N', en: 'N', hi: 'उत्तर' },
  { key: 'NE', en: 'NE', hi: 'ईशान' },
  { key: 'E', en: 'E', hi: 'पूर्व' },
  { key: 'SE', en: 'SE', hi: 'अग्नि' },
  { key: 'S', en: 'S', hi: 'दक्षिण' },
  { key: 'SW', en: 'SW', hi: 'नैऋत्य' },
  { key: 'W', en: 'W', hi: 'पश्चिम' },
  { key: 'NW', en: 'NW', hi: 'वायव्य' },
  { key: 'CENTER', en: 'Center', hi: 'केंद्र' },
];

const ROOM_FIELDS: { key: VastuRoomType; en: string; hi: string; required?: boolean }[] = [
  { key: 'mainEntrance', en: 'Main entrance', hi: 'मुख्य प्रवेश', required: true },
  { key: 'kitchen', en: 'Kitchen', hi: 'रसोई', required: true },
  { key: 'masterBedroom', en: 'Master bedroom', hi: 'मुख्य शयनकक्ष', required: true },
  { key: 'pujaRoom', en: 'Puja room', hi: 'पूजा कक्ष' },
  { key: 'toilet', en: 'Toilet', hi: 'शौचालय' },
  { key: 'staircase', en: 'Staircase', hi: 'सीढ़ियां' },
  { key: 'overheadWaterTank', en: 'Overhead tank', hi: 'ऊपरी टंकी' },
  { key: 'undergroundWater', en: 'Underground water', hi: 'भूमिगत जल' },
];

const ROOM_SHORT: Record<string, Bi> = {
  mainEntrance: { en: 'Door', hi: 'द्वार' },
  kitchen: { en: 'Kitchen', hi: 'रसोई' },
  masterBedroom: { en: 'Master', hi: 'मुख्य' },
  bedroom: { en: 'Bed', hi: 'शयन' },
  pujaRoom: { en: 'Puja', hi: 'पूजा' },
  toilet: { en: 'Toilet', hi: 'शौच' },
  livingRoom: { en: 'Living', hi: 'बैठक' },
  studyRoom: { en: 'Study', hi: 'पढ़ाई' },
  staircase: { en: 'Stairs', hi: 'सीढ़ी' },
  overheadWaterTank: { en: 'Tank', hi: 'टंकी' },
  undergroundWater: { en: 'Water', hi: 'जल' },
  cashLocker: { en: 'Locker', hi: 'तिजोरी' },
  center: { en: 'Open', hi: 'खुला' },
};

const PROPERTY_TYPES = [
  { key: 'home', en: 'Home', hi: 'घर' },
  { key: 'flat', en: 'Flat', hi: 'फ्लैट' },
  { key: 'shop', en: 'Shop', hi: 'दुकान' },
  { key: 'office', en: 'Office', hi: 'ऑफिस' },
];

const L = (o: Bi | undefined | null, hi: boolean) => (o ? (hi ? o.hi : o.en) : '');

function VastuGlyph({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M3.5 11.5 12 4l8.5 7.5" />
        <Path d="M5.5 10.5v9h13v-9" />
        <Path d="M9 19.5v-5h6v5" />
        <Path d="M8 10.5h8M12 7.5v3" />
      </G>
    </Svg>
  );
}

function DirectionPicker({
  value,
  onChange,
  allowCenter = false,
}: {
  value?: VastuDirectionKey | '';
  onChange: (v: VastuDirectionKey | '') => void;
  allowCenter?: boolean;
}) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const hi = lang === 'hi';
  const list = allowCenter ? DIRS : DIRS.filter((d) => d.key !== 'CENTER');
  return (
    <View style={styles.dirWrap}>
      {list.map((d) => {
        const on = value === d.key;
        return (
          <Pressable key={d.key} onPress={() => { hSelect(); onChange(on ? '' : d.key); }}>
            <View style={[
              styles.dirChip,
              {
                borderColor: on ? theme.gold2 : theme.cardBorder,
                backgroundColor: on ? theme.gold1 : (theme.isDark ? 'rgba(255,255,255,0.03)' : '#fff'),
              },
            ]}>
              <Text style={[styles.dirTxt, { color: on ? theme.goldInk : theme.gold1 }]}>{hi ? d.hi : d.en}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function ScoreDial({ score }: { score: number | null }) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const hi = lang === 'hi';
  const pct = score == null ? 0 : Math.max(0, Math.min(100, score));
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <View style={styles.scoreBox}>
      <Svg width={112} height={112} viewBox="0 0 112 112">
        <Circle cx={56} cy={56} r={r} stroke={theme.isDark ? 'rgba(233,184,80,0.18)' : 'rgba(95,56,8,0.14)'} strokeWidth={9} fill="none" />
        <Circle
          cx={56}
          cy={56}
          r={r}
          stroke={pct >= 80 ? '#3ec77a' : pct >= 60 ? theme.gold1 : '#e06a5a'}
          strokeWidth={9}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c - (pct / 100) * c}
          rotation="-90"
          origin="56,56"
        />
        <SvgText x={56} y={52} textAnchor="middle" fontSize={22} fontWeight="700" fill={theme.gold1}>{score == null ? '--' : score}</SvgText>
        <SvgText x={56} y={70} textAnchor="middle" fontSize={8.5} fill={theme.textMuted}>{hi ? 'स्कोर' : 'score'}</SvgText>
      </Svg>
    </View>
  );
}

function PlanDiagram({ plan }: { plan: VastuPlan }) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const hi = lang === 'hi';
  const ink = theme.isDark ? '#fce8a8' : '#26190a';
  const muted = theme.isDark ? 'rgba(252,232,168,0.62)' : '#5f3808';
  const bg = theme.isDark ? '#040404' : '#fffaf0';
  return (
    <View style={[styles.planBox, { borderColor: theme.cardBorder, backgroundColor: bg }]}>
      <Svg width="100%" height={330} viewBox="0 0 100 112">
        <Rect x={0.75} y={8.75} width={98.5} height={98.5} rx={3} fill={bg} stroke={theme.gold2} strokeWidth={0.6} />
        <SvgText x={50} y={5.2} textAnchor="middle" fontSize={4.1} fontWeight="700" fill={theme.gold1}>{hi ? 'उत्तर' : 'NORTH'}</SvgText>
        {[33.33, 66.67].map((p) => (
          <G key={p}>
            <Line x1={p} y1={8.75} x2={p} y2={107.25} stroke={theme.cardBorder} strokeWidth={0.35} />
            <Line x1={0.75} y1={8.75 + p} x2={99.25} y2={8.75 + p} stroke={theme.cardBorder} strokeWidth={0.35} />
          </G>
        ))}
        {plan.rooms.map((room) => {
          const label = ROOM_SHORT[room.type] || room.label;
          return (
            <G key={room.id}>
              <Rect
                x={room.x + 1.5}
                y={room.y + 10.25}
                width={Math.max(1, room.w - 3)}
                height={Math.max(1, room.h - 3)}
                rx={2.4}
                fill={room.color}
                fillOpacity={theme.isDark ? 0.25 : 0.18}
                stroke={room.color}
                strokeOpacity={theme.isDark ? 0.9 : 0.7}
                strokeWidth={0.5}
              />
              <SvgText x={room.x + room.w / 2} y={room.y + 25.5} textAnchor="middle" fontSize={3.25} fontWeight="700" fill={ink}>
                {L(label, hi)}
              </SvgText>
              <SvgText x={room.x + room.w / 2} y={room.y + 31.1} textAnchor="middle" fontSize={2.5} fill={muted}>
                {hi ? room.direction.hi : room.direction.en}
              </SvgText>
            </G>
          );
        })}
        <Line x1={plan.entrance.x1} y1={plan.entrance.y1 + 8.75} x2={plan.entrance.x2} y2={plan.entrance.y2 + 8.75} stroke={theme.gold1} strokeWidth={2.8} strokeLinecap="round" />
        <SvgText x={50} y={111} textAnchor="middle" fontSize={3} fill={muted}>
          {hi ? 'यह जोनिंग मैप है, इंजीनियरिंग ड्राइंग नहीं' : 'Zoning map, not an engineering drawing'}
        </SvgText>
      </Svg>
    </View>
  );
}

// Your CURRENT house drawn on a 3×3 direction grid — each room lands in the zone the
// user picked, coloured by the audit verdict (✓ green good / ~ amber ok / ✕ red problem),
// so anyone can SEE what is right and what needs fixing at a glance.
const GRID_ZONES: { key: VastuDirectionKey; col: number; row: number }[] = [
  { key: 'NW', col: 0, row: 0 }, { key: 'N', col: 1, row: 0 }, { key: 'NE', col: 2, row: 0 },
  { key: 'W', col: 0, row: 1 }, { key: 'CENTER', col: 1, row: 1 }, { key: 'E', col: 2, row: 1 },
  { key: 'SW', col: 0, row: 2 }, { key: 'S', col: 1, row: 2 }, { key: 'SE', col: 2, row: 2 },
];
function HouseGrid({ analysis }: { analysis: VastuAnalysisResponse }) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const hi = lang === 'hi';
  const byDir: Record<string, VastuFinding[]> = {};
  analysis.findings.forEach((f) => {
    const d = (analysis.roomInputs[f.roomType] || {}).direction;
    if (d) (byDir[d] = byDir[d] || []).push(f);
  });
  const statusColor = (s: string) => (s === 'problem' ? '#e06a5a' : s === 'good' ? '#3ec77a' : '#e0a92e');
  const statusMark = (s: string) => (s === 'problem' ? '✕' : s === 'good' ? '✓' : '~');
  const CELL = 32; // svg units per cell
  const dirLbl = (k: VastuDirectionKey) => {
    const d = DIRS.find((x) => x.key === k);
    return d ? (hi ? d.hi : d.en) : k;
  };
  return (
    <View style={[styles.planBox, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? '#040404' : '#fffaf0' }]}>
      <Svg width="100%" height={330} viewBox="0 0 100 110">
        <SvgText x={50} y={5} textAnchor="middle" fontSize={4} fontWeight="700" fill={theme.gold1}>{hi ? '↑ उत्तर' : '↑ NORTH'}</SvgText>
        <Rect x={2} y={8} width={96} height={96} rx={2.5} fill="none" stroke={theme.gold2} strokeWidth={0.7} />
        {GRID_ZONES.map((z) => {
          const x0 = 2 + z.col * CELL; const y0 = 8 + z.row * CELL;
          const items = byDir[z.key] || [];
          const worst = items.some((i) => i.status === 'problem') ? 'problem' : items.some((i) => i.status === 'ok' || i.status === 'neutral' || i.status === 'unknown') && !items.some((i) => i.status === 'good') ? 'ok' : items.length ? 'good' : null;
          return (
            <G key={z.key}>
              <Rect x={x0} y={y0} width={CELL} height={CELL} fill={worst ? statusColor(worst === 'ok' ? 'ok' : worst) + (theme.isDark ? '22' : '1d') : 'transparent'} stroke={theme.cardBorder} strokeWidth={0.35} />
              <SvgText x={x0 + 2} y={y0 + 4.6} fontSize={3} fontWeight="700" fill={theme.isDark ? '#c9a961' : '#5f3808'}>{z.key === 'CENTER' ? (hi ? 'ब्रह्मस्थान' : 'Center') : dirLbl(z.key)}</SvgText>
              {items.slice(0, 3).map((f, i) => (
                <G key={f.id}>
                  <SvgText x={x0 + 2} y={y0 + 11 + i * 6.4} fontSize={3.6} fontWeight="700" fill={statusColor(f.status === 'ok' || f.status === 'neutral' || f.status === 'unknown' ? 'ok' : f.status)}>
                    {statusMark(f.status === 'ok' || f.status === 'neutral' || f.status === 'unknown' ? 'ok' : f.status)} {L(ROOM_SHORT[f.roomType] || f.room, hi)}
                  </SvgText>
                </G>
              ))}
              {z.key === 'CENTER' && items.length === 0 && (
                <SvgText x={x0 + CELL / 2} y={y0 + CELL / 2 + 2} textAnchor="middle" fontSize={3} fill={theme.isDark ? 'rgba(252,232,168,0.5)' : '#8a6a3a'}>{hi ? 'खुला रखें' : 'keep open'}</SvgText>
              )}
            </G>
          );
        })}
        <SvgText x={50} y={109} textAnchor="middle" fontSize={2.9} fill={theme.isDark ? 'rgba(252,232,168,0.62)' : '#5f3808'}>
          {hi ? '✓ सही जगह  ·  ~ ठीक-ठाक  ·  ✕ सुधार चाहिए' : '✓ right place  ·  ~ acceptable  ·  ✕ needs fixing'}
        </SvgText>
      </Svg>
    </View>
  );
}

function FindingCard({ item }: { item: VastuFinding }) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const hi = lang === 'hi';
  const danger = item.status === 'problem';
  const ok = item.status === 'good' || item.status === 'ok';
  const color = danger ? '#e06a5a' : ok ? '#3ec77a' : theme.gold1;
  return (
    <View style={[styles.finding, { borderColor: danger ? '#e06a5a88' : theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.025)' : '#fffdf8' }]}>
      <View style={styles.findingHead}>
        <View style={[styles.statusDot, { backgroundColor: color }]} />
        <Text style={[styles.findingTitle, { color: theme.text }]}>{L(item.title, hi)}</Text>
        <Text style={[styles.severity, { color }]}>{item.severity.toUpperCase()}</Text>
      </View>
      <Text style={[styles.findingText, { color: theme.textSoft }]}>{L(item.finding, hi)}</Text>
      <Text style={[styles.findingWhy, { color: theme.textMuted }]}>{L(item.recommendation, hi)}</Text>
    </View>
  );
}

export function VastuScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const hi = lang === 'hi';
  const dialog = useDialog();

  const [propertyType, setPropertyType] = useState('home');
  const [facing, setFacing] = useState<VastuDirectionKey>('E');
  const [width, setWidth] = useState('30');
  const [length, setLength] = useState('45');
  const [bedrooms, setBedrooms] = useState(2);
  const [rooms, setRooms] = useState<RoomPick>({});
  const [busy, setBusy] = useState(false);
  const [analysis, setAnalysis] = useState<VastuAnalysisResponse | null>(null);
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [ai, setAi] = useState<VastuAskResponse | null>(null);
  // compass target: which field the compass is currently measuring for
  const [compassFor, setCompassFor] = useState<'facing' | VastuRoomType | null>(null);

  const input = useMemo(() => {
    const cleanRooms: any = {};
    Object.entries(rooms).forEach(([k, v]) => { if (v) cleanRooms[k] = v; });
    return {
      propertyType,
      facing,
      plot: { width: Number(width) || 30, length: Number(length) || 45, unit: 'ft' },
      rooms: cleanRooms,
      requirements: { bedrooms, floors: 1, includePujaRoom: true, includeStudy: bedrooms <= 2 },
    };
  }, [propertyType, facing, width, length, rooms, bedrooms]);

  const runAnalyze = async () => {
    if (busy) return;
    hTap();
    setBusy(true);
    setAi(null);
    try {
      const res = await analyzeVastu(input);
      setAnalysis(res);
      hSuccess();
    } catch (e: any) {
      hError();
      dialog(hi ? 'त्रुटि' : 'Error', e?.message || (hi ? 'वास्तु जांच पूरी नहीं हो पाई।' : 'Could not check Vastu.'));
    } finally {
      setBusy(false);
    }
  };

  const sendAsk = async (override?: string) => {
    const q = (override || question).trim();
    if (!q || asking) return;
    hTap();
    setAsking(true);
    try {
      const res = await askVastu({ ...input, question: q, analysis: analysis || undefined });
      setAi(res);
      if (!analysis) setAnalysis(res.analysis);
      setQuestion('');
    } catch (e: any) {
      hError();
      dialog(hi ? 'उत्तर नहीं मिला' : 'No answer', e?.message || (hi ? 'कृपया फिर प्रयास करें।' : 'Please try again.'));
    } finally {
      setAsking(false);
    }
  };

  const setRoomDir = (key: VastuRoomType, value: VastuDirectionKey | '') => {
    setRooms((prev) => ({ ...prev, [key]: value }));
  };

  const quickQuestions = hi
    ? ['मेरे घर की सबसे बड़ी गलती क्या है?', 'बिना तोड़-फोड़ रसोई कैसे ठीक करूं?', 'इस प्लॉट के लिए सही नक्शा समझाएं']
    : ['What is the biggest issue in my home?', 'How do I fix the kitchen without demolition?', 'Explain the best map for this plot'];

  return (
    <Page title={hi ? 'वास्तु शास्त्र' : 'Vastu Shastra'} onBack={() => { hTap(); navigation.goBack(); }}>
      <LinearGradient
        colors={theme.isDark ? ['#171005', '#000000'] : ['#ffffff', '#fff4dc']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { borderColor: theme.cardBorder }]}
      >
        <View style={[styles.heroIcon, { borderColor: theme.gold2 + '66', backgroundColor: theme.isDark ? 'rgba(233,184,80,0.08)' : '#fff' }]}>
          <VastuGlyph color={theme.gold1} size={34} />
        </View>
        <GradientText style={styles.heroTitle}>{hi ? 'घर, दुकान और ऑफिस का वास्तु ऑडिट' : 'Home, Shop and Office Vastu Audit'}</GradientText>
        <Text style={[styles.heroSub, { color: theme.textSoft }]}>
          {hi
            ? 'दिशा, कमरे और प्लॉट साइज से स्रोत-आधारित जांच, सुधार और सुझाया गया सुंदर नक्शा। व्याख्या केवल rule-engine result पर आधारित है।'
            : 'Source-cited checking from directions, rooms and plot size, with corrections and a suggested zoning map. Explanations are based only on the rule-engine result.'}
        </Text>
      </LinearGradient>

      {/* CTA → learn Vastu from zero (chapter-wise course) */}
      <Pressable
        onPress={() => { hTap(); navigation.navigate('VastuLearn'); }}
        style={({ pressed }) => [styles.learnCta, { borderColor: theme.gold1, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.10)' : 'rgba(255,247,224,0.95)', opacity: pressed ? 0.9 : 1 }]}
      >
        <Text style={styles.learnCtaEmoji}>📖</Text>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.learnCtaKicker, { color: theme.gold2 }]}>{hi ? 'बिलकुल शुरुआत से' : 'From the very basics'}</Text>
          <Text style={[styles.learnCtaTitle, { color: theme.text }]}>{hi ? 'वास्तु सीखें — 14 आसान अध्याय' : 'Learn Vastu — 14 easy chapters'}</Text>
          <Text style={[styles.learnCtaSub, { color: theme.textMuted }]}>{hi ? 'दिशाएँ, पंचतत्व, द्वार, रसोई, उपाय — आसान भाषा में' : 'Directions, elements, door, kitchen, remedies — in simple words'}</Text>
        </View>
        <Text style={[styles.learnCtaArrow, { color: theme.gold1 }]}>›</Text>
      </Pressable>

      <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.9)' }]}>
        <Text style={[styles.section, { color: theme.goldText }]}>{hi ? 'मूल जानकारी' : 'Basic Details'}</Text>
        <View style={styles.typeRow}>
          {PROPERTY_TYPES.map((p) => {
            const on = propertyType === p.key;
            return (
              <Pressable key={p.key} onPress={() => { hSelect(); setPropertyType(p.key); }} style={{ flex: 1 }}>
                <View style={[styles.typeChip, { backgroundColor: on ? theme.gold1 : 'transparent', borderColor: on ? theme.gold1 : theme.cardBorder }]}>
                  <Text style={[styles.typeTxt, { color: on ? theme.goldInk : theme.gold1 }]}>{hi ? p.hi : p.en}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: theme.goldText }]}>{hi ? 'घर का मुँह किस दिशा में है?' : 'Which way does the house face?'}</Text>
          <Pressable onPress={() => { hTap(); setCompassFor('facing'); }} style={[styles.compassBtn, { borderColor: theme.gold2, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.10)' : 'rgba(255,247,224,0.95)' }]}>
            <Text style={[styles.compassBtnTxt, { color: theme.gold1 }]}>🧭 {hi ? 'दिशा पता नहीं? कंपास खोलें' : "Don't know? Open compass"}</Text>
          </Pressable>
        </View>
        <DirectionPicker value={facing} onChange={(v) => v && setFacing(v)} />
        <View style={styles.dimRow}>
          <View style={{ flex: 1 }}>
            <TextField icon={<UserLine color={theme.gold2} size={19} />} label={hi ? 'चौड़ाई ft' : 'Width ft'} value={width} onChangeText={setWidth} keyboardType="numeric" placeholder="30" />
          </View>
          <View style={{ flex: 1 }}>
            <TextField icon={<UserLine color={theme.gold2} size={19} />} label={hi ? 'लंबाई ft' : 'Length ft'} value={length} onChangeText={setLength} keyboardType="numeric" placeholder="45" />
          </View>
        </View>
        <Text style={[styles.label, { color: theme.goldText }]}>{hi ? 'बेडरूम' : 'Bedrooms'}</Text>
        <View style={styles.dirWrap}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => { hSelect(); setBedrooms(n); }}>
              <View style={[styles.dirChip, { borderColor: bedrooms === n ? theme.gold2 : theme.cardBorder, backgroundColor: bedrooms === n ? theme.gold1 : 'transparent' }]}>
                <Text style={[styles.dirTxt, { color: bedrooms === n ? theme.goldInk : theme.gold1 }]}>{n}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.9)' }]}>
        <Text style={[styles.section, { color: theme.goldText }]}>{hi ? 'मौजूदा घर की दिशा भरें' : 'Enter Current Room Directions'}</Text>
        <Text style={[styles.helper, { color: theme.textMuted }]}>
          {hi ? 'जो जानकारी पता हो वही भरें। खाली छोड़ने पर वह कमरा audit score में नहीं जोड़ा जाएगा।' : 'Fill only what you know. Blank rooms are not counted in the audit score.'}
        </Text>
        {ROOM_FIELDS.map((r) => (
          <View key={r.key} style={styles.roomBlock}>
            <View style={styles.roomTitleRow}>
              <Text style={[styles.roomTitle, { color: theme.text }]}>{hi ? r.hi : r.en}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {r.required && <Text style={[styles.req, { color: theme.gold2 }]}>{hi ? 'मुख्य' : 'core'}</Text>}
                <Pressable onPress={() => { hTap(); setCompassFor(r.key); }} hitSlop={8}>
                  <Text style={[styles.compassMini, { color: theme.gold1 }]}>🧭</Text>
                </Pressable>
              </View>
            </View>
            <DirectionPicker value={rooms[r.key] || ''} onChange={(v) => setRoomDir(r.key, v)} allowCenter={r.key !== 'mainEntrance'} />
          </View>
        ))}
        <Pressable
          onPress={runAnalyze}
          disabled={busy}
          style={({ pressed }) => [styles.auditCta, { opacity: pressed || busy ? 0.94 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] }]}
        >
          <LinearGradient colors={theme.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.auditCtaInner}>
            {busy ? (
              <ActivityIndicator color={theme.buttonInk} />
            ) : (
              <View style={styles.auditIconWrap}>
                <VastuGlyph color={theme.buttonInk} size={22} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={[styles.auditCtaTitle, { color: theme.buttonInk }]} numberOfLines={1}>
                {busy ? (hi ? 'जांच हो रही है…' : 'Checking…') : (hi ? 'वास्तु ऑडिट बनाएँ' : 'Create Vastu Audit')}
              </Text>
              {!busy && (
                <Text style={[styles.auditCtaSub, { color: theme.buttonInk }]} numberOfLines={1}>
                  {hi ? 'स्कोर, सुधार व आदर्श नक्शा' : 'Score, fixes & ideal map'}
                </Text>
              )}
            </View>
            {!busy && <Text style={[styles.auditCtaArrow, { color: theme.buttonInk }]}>→</Text>}
          </LinearGradient>
        </Pressable>
      </View>

      {analysis && (
        <View style={{ gap: 14, marginTop: 14 }}>
          <View style={[styles.card, styles.resultCard, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.04)' : 'rgba(255,250,236,0.95)' }]}>
            <ScoreDial score={analysis.summary.score} />
            <View style={{ flex: 1 }}>
              <GradientText style={styles.resultTitle}>{L(analysis.summary.title, hi)}</GradientText>
              <Text style={[styles.resultText, { color: theme.textSoft }]}>{L(analysis.summary.text, hi)}</Text>
              <Text style={[styles.resultNote, { color: theme.textMuted }]}>{L(analysis.summary.note, hi)}</Text>
            </View>
          </View>

          {Object.keys(analysis.roomInputs || {}).length > 0 && (
            <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : '#fffdf8' }]}>
              <Text style={[styles.section, { color: theme.goldText, marginTop: 0 }]}>{hi ? 'आपका मौजूदा घर — नक्शे पर' : 'Your Current Home — On The Map'}</Text>
              <Text style={[styles.helper, { color: theme.textMuted }]}>
                {hi ? 'हर कमरा उसी दिशा के खाने में दिखाया गया है जो आपने भरी — हरा ✓ मतलब सही जगह, लाल ✕ मतलब सुधार चाहिए।'
                    : 'Each room is drawn in the direction you entered — green ✓ means right place, red ✕ means it needs fixing.'}
              </Text>
              <HouseGrid analysis={analysis} />
            </View>
          )}

          <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : '#fffdf8' }]}>
            <View style={styles.sectionLine}>
              <ServiceIcon name="vastu" color={theme.gold1} size={24} />
              <Text style={[styles.section, { color: theme.goldText, marginTop: 0 }]}>{hi ? 'आपके लिए आदर्श नक्शा' : 'Ideal Map For You'}</Text>
            </View>
            <Text style={[styles.helper, { color: theme.textMuted }]}>{L(analysis.suggestedPlan.subtitle, hi)}</Text>
            <PlanDiagram plan={analysis.suggestedPlan} />
            {analysis.suggestedPlan.notes.map((n) => (
              <Text key={L(n.title, false)} style={[styles.planNote, { color: theme.textMuted }]}>
                <Text style={{ color: theme.gold1, fontFamily: fonts.interBold }}>{L(n.title, hi)}: </Text>
                {L(n.text, hi)}
              </Text>
            ))}
          </View>

          {analysis.priority.length > 0 && (
            <View style={{ gap: 10 }}>
              <Text style={[styles.section, { color: theme.goldText }]}>{hi ? 'पहले ये सुधार करें' : 'Fix These First'}</Text>
              {analysis.priority.map((f) => <FindingCard key={f.id} item={f} />)}
            </View>
          )}

          {analysis.findings.length > 0 && (
            <View style={{ gap: 10 }}>
              <Text style={[styles.section, { color: theme.goldText }]}>{hi ? 'पूरा ऑडिट' : 'Full Audit'}</Text>
              {analysis.findings.map((f) => <FindingCard key={f.id} item={f} />)}
            </View>
          )}

          <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : '#fffdf8' }]}>
            <Text style={[styles.section, { color: theme.goldText, marginTop: 0 }]}>{hi ? 'वास्तु मार्गदर्शन' : 'Vastu Guide'}</Text>
            <Text style={[styles.helper, { color: theme.textMuted }]}>
              {hi ? 'उत्तर केवल आपके audit result, map और source data के आधार पर दिए जाते हैं।' : 'Answers come only from your audit result, map and source data.'}
            </Text>
            <View style={styles.quickRow}>
              {quickQuestions.map((q) => (
                <Pressable key={q} onPress={() => sendAsk(q)}>
                  <View style={[styles.quickChip, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.06)' : 'rgba(95,56,8,0.06)' }]}>
                    <Text style={[styles.quickTxt, { color: theme.gold1 }]}>{q}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
            <TextInput
              value={question}
              onChangeText={setQuestion}
              placeholder={hi ? 'अपना वास्तु प्रश्न लिखें...' : 'Ask your Vastu question...'}
              placeholderTextColor={theme.textMuted}
              multiline
              style={[styles.askInput, { color: theme.text, borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.45)' : '#fff' }]}
            />
            <GoldButton label={asking ? (hi ? 'उत्तर बन रहा है...' : 'Preparing...') : (hi ? 'मार्गदर्शन से पूछें' : 'Ask the Guide')} onPress={() => sendAsk()} variant="ghost" />
            {asking && <ActivityIndicator color={theme.gold1} style={{ marginTop: 12 }} />}
            {ai && (
              <View style={[styles.aiBox, { borderColor: theme.gold2 + '55', backgroundColor: theme.isDark ? 'rgba(233,184,80,0.05)' : 'rgba(255,247,224,0.75)' }]}>
                <Text style={[styles.aiAnswer, { color: theme.text }]}>{ai.answer}</Text>
                {ai.sections.map((s, idx) => (
                  <Text key={`${s.title || 's'}-${idx}`} style={[styles.aiSection, { color: theme.textSoft }]}>
                    {!!s.title && <Text style={{ color: theme.gold1, fontFamily: fonts.interBold }}>{s.title}: </Text>}
                    {s.text}
                  </Text>
                ))}
                {ai.remedies.map((r, idx) => (
                  <Text key={`${r}-${idx}`} style={[styles.remedy, { color: theme.textMuted }]}>- {r}</Text>
                ))}
                <Text style={[styles.resultNote, { color: theme.textMuted }]}>{ai.sourceNote}</Text>
              </View>
            )}
          </View>

          <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : '#fffdf8' }]}>
            <Text style={[styles.section, { color: theme.goldText, marginTop: 0 }]}>{hi ? 'वास्तु सीखें' : 'Learn Vastu'}</Text>
            {analysis.learn.map((topic) => (
              <View key={topic.id} style={[styles.learnItem, { borderColor: theme.cardBorder }]}>
                <Text style={[styles.learnTitle, { color: theme.gold1 }]}>{L(topic.title, hi)}</Text>
                <Text style={[styles.learnBody, { color: theme.textSoft }]}>{L(topic.body, hi)}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : '#fffdf8' }]}>
            <Text style={[styles.section, { color: theme.goldText, marginTop: 0 }]}>{hi ? 'विश्वसनीय स्रोत' : 'Trusted Sources'}</Text>
            {analysis.sourcesUsed.map((s) => (
              <Text key={s.id} style={[styles.source, { color: theme.textMuted }]}>
                <Text style={{ color: theme.gold1, fontFamily: fonts.interBold }}>{s.title}: </Text>
                {s.note}
              </Text>
            ))}
            <Text style={[styles.safety, { color: theme.textMuted }]}>{L(analysis.safety.text, hi)}</Text>
          </View>
        </View>
      )}

      {/* phone compass — for users who don't know their directions */}
      <VastuCompass
        visible={compassFor != null}
        title={compassFor === 'facing'
          ? (hi ? 'घर की फेसिंग दिशा' : 'House Facing Direction')
          : `${hi ? (ROOM_FIELDS.find((r) => r.key === compassFor)?.hi || '') : (ROOM_FIELDS.find((r) => r.key === compassFor)?.en || '')} ${hi ? 'की दिशा' : 'direction'}`}
        instruction={compassFor === 'facing'
          ? (hi ? 'मुख्य दरवाज़े के अंदर खड़े होकर बाहर (गली/सड़क) की ओर मुँह करें।' : 'Stand inside the main door and face outside (toward the street).')
          : (hi ? 'घर के बीचों-बीच खड़े होकर उस कमरे की ओर मुँह करें।' : 'Stand at the centre of the house and face toward that room.')}
        onPick={(d: CompassDir) => {
          if (compassFor === 'facing') setFacing(d);
          else if (compassFor) setRoomDir(compassFor, d);
          setCompassFor(null);
        }}
        onClose={() => setCompassFor(null)}
      />
    </Page>
  );
}

const styles = StyleSheet.create({
  hero: { borderWidth: 1, borderRadius: 22, padding: 18, overflow: 'hidden', alignItems: 'center' },
  heroIcon: { width: 64, height: 64, borderRadius: 32, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  heroTitle: { fontFamily: fonts.playfairBold, fontSize: 24, lineHeight: 30, textAlign: 'center' },
  heroSub: { fontFamily: fonts.inter, fontSize: 12.8, lineHeight: 19, textAlign: 'center', marginTop: 8 },
  card: { borderWidth: 1, borderRadius: 20, padding: 16, marginTop: 14 },
  section: { fontFamily: fonts.cinzelSemi, fontSize: 13.5, letterSpacing: 1, marginTop: 2, marginBottom: 10 },
  sectionLine: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 6 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  typeChip: { minHeight: 38, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  typeTxt: { fontFamily: fonts.interSemi, fontSize: 12 },
  label: { fontFamily: fonts.interSemi, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 12, marginBottom: 8 },
  labelRow: { flexDirection: 'column', gap: 6 },
  compassBtn: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, marginBottom: 8 },
  compassBtnTxt: { fontFamily: fonts.interBold, fontSize: 11.5 },
  compassMini: { fontSize: 16 },
  learnCta: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.4, borderRadius: 18, padding: 14, marginTop: 14 },
  learnCtaEmoji: { fontSize: 28 },
  learnCtaKicker: { fontFamily: fonts.interSemi, fontSize: 10.5, letterSpacing: 0.6, textTransform: 'uppercase' },
  learnCtaTitle: { fontFamily: fonts.interBold, fontSize: 14, lineHeight: 19, marginTop: 2 },
  learnCtaSub: { fontFamily: fonts.inter, fontSize: 11.3, lineHeight: 15.5, marginTop: 3 },
  learnCtaArrow: { fontFamily: fonts.interBold, fontSize: 26 },
  auditCta: { marginTop: 18, borderRadius: 16, shadowColor: '#3d2809', shadowOpacity: 0.24, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 5 },
  auditCtaInner: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, paddingVertical: 15, paddingHorizontal: 18, minHeight: 62 },
  auditIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.28)' },
  auditCtaTitle: { fontFamily: fonts.cinzelSemi, fontSize: 15, letterSpacing: 0.5 },
  auditCtaSub: { fontFamily: fonts.inter, fontSize: 11.5, opacity: 0.82, marginTop: 2 },
  auditCtaArrow: { fontFamily: fonts.interBold, fontSize: 20 },
  helper: { fontFamily: fonts.inter, fontSize: 12, lineHeight: 17, marginBottom: 10 },
  dimRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  dirWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dirChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 8, minWidth: 45, alignItems: 'center' },
  dirTxt: { fontFamily: fonts.interSemi, fontSize: 11.5 },
  roomBlock: { marginTop: 14 },
  roomTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  roomTitle: { fontFamily: fonts.interSemi, fontSize: 13.2 },
  req: { fontFamily: fonts.interSemi, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8 },
  resultCard: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  scoreBox: { width: 112, height: 112, alignItems: 'center', justifyContent: 'center' },
  resultTitle: { fontFamily: fonts.playfairBold, fontSize: 20, lineHeight: 25 },
  resultText: { fontFamily: fonts.inter, fontSize: 12.8, lineHeight: 18.5, marginTop: 4 },
  resultNote: { fontFamily: fonts.inter, fontSize: 10.8, lineHeight: 15.5, marginTop: 8 },
  planBox: { borderWidth: 1, borderRadius: 18, overflow: 'hidden', marginTop: 8 },
  planNote: { fontFamily: fonts.inter, fontSize: 11.2, lineHeight: 16, marginTop: 8 },
  finding: { borderWidth: 1, borderRadius: 16, padding: 13 },
  findingHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  findingTitle: { flex: 1, fontFamily: fonts.interBold, fontSize: 13.2 },
  severity: { fontFamily: fonts.interBold, fontSize: 9.5, letterSpacing: 0.8 },
  findingText: { fontFamily: fonts.inter, fontSize: 12.4, lineHeight: 18, marginTop: 8 },
  findingWhy: { fontFamily: fonts.inter, fontSize: 11.4, lineHeight: 16.5, marginTop: 6 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  quickChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  quickTxt: { fontFamily: fonts.interSemi, fontSize: 11.4 },
  askInput: { minHeight: 84, borderWidth: 1, borderRadius: 16, padding: 12, fontFamily: fonts.inter, fontSize: 13, textAlignVertical: 'top', marginBottom: 12 },
  aiBox: { borderWidth: 1, borderRadius: 16, padding: 13, marginTop: 12 },
  aiAnswer: { fontFamily: fonts.interSemi, fontSize: 13.2, lineHeight: 19 },
  aiSection: { fontFamily: fonts.inter, fontSize: 12.3, lineHeight: 18, marginTop: 8 },
  remedy: { fontFamily: fonts.inter, fontSize: 11.8, lineHeight: 17, marginTop: 5 },
  learnItem: { borderTopWidth: 1, paddingTop: 10, marginTop: 10 },
  learnTitle: { fontFamily: fonts.playfairBold, fontSize: 15, lineHeight: 19 },
  learnBody: { fontFamily: fonts.inter, fontSize: 12.4, lineHeight: 18, marginTop: 4 },
  source: { fontFamily: fonts.inter, fontSize: 11.3, lineHeight: 16.5, marginBottom: 7 },
  safety: { fontFamily: fonts.interSemi, fontSize: 11.2, lineHeight: 16.5, marginTop: 6 },
});
