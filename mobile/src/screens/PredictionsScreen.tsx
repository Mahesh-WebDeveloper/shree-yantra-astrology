import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import Svg, { Circle, Line, Path, Polyline, Rect, G } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { Theme, fonts, radii } from '../theme/tokens';
import { Page } from '../components/Page';
import { Card } from '../components/Card';
import { GradientText } from '../components/GradientText';
import { GoldButton } from '../components/GoldButton';
import { TextField } from '../components/TextField';
import { BirthPlaceField } from '../components/BirthPlaceField';
import { GoldDatePicker } from '../components/GoldDatePicker';
import { GoldTimePicker } from '../components/GoldTimePicker';
import { CalendarIcon, ClockIcon, UserLine } from '../components/icons/ProfileIcons';
import { hTap, hSelect } from '../lib/haptics';
import { birthFromProfile } from '../lib/birth';
import { getHoroscope, getPersonalizedHoroscope, HoroscopePeriod, HoroscopeSign, DailyPrediction, LocationSuggestion, resolveLocation } from '../lib/api';
import { useLang, useT } from '../i18n/LanguageProvider';

const PERIODS: HoroscopePeriod[] = ['daily', 'weekly', 'monthly', 'yearly'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function periodLabel(period: HoroscopePeriod, lang: 'en' | 'hi') {
  const en = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' };
  const hi = { daily: 'दैनिक', weekly: 'साप्ताहिक', monthly: 'मासिक', yearly: 'वार्षिक' };
  return (lang === 'hi' ? hi : en)[period];
}

const toDDMM = (d: Date) => `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
const fmtDob = (d: Date) => `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
function to24h(t: string) {
  const m = String(t || '').trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return null;
  let h = Number(m[1]);
  const min = m[2];
  const ap = (m[3] || '').toUpperCase();
  if (ap === 'PM' && h < 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  if (!ap && h > 23) return null;
  if (h < 0 || h > 23) return null;
  return `${String(h).padStart(2, '0')}:${min}`;
}

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score || 0));
  return (
    <View style={styles.scoreWrap}>
      <Svg width={58} height={58} viewBox="0 0 58 58">
        <Circle cx={29} cy={29} r={r} stroke="rgba(201,150,46,0.18)" strokeWidth={6} fill="none" />
        <Circle
          cx={29}
          cy={29}
          r={r}
          stroke={color}
          strokeWidth={6}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * c} ${c}`}
          transform="rotate(-90 29 29)"
        />
      </Svg>
      <Text style={[styles.scoreText, { color }]}>{pct}</Text>
    </View>
  );
}

function RashiIcon({ signKey, color, size = 56 }: { signKey: string; color: string; size?: number }) {
  const sw = { stroke: color, strokeWidth: 2.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' as const };
  const common = <Circle cx={32} cy={32} r={28} stroke={color} strokeWidth={1.1} opacity={0.22} fill="none" />;
  let mark: React.ReactNode;
  switch (signKey) {
    case 'aries':
      mark = <Path {...sw} d="M18 44C18 26 29 19 32 34C35 19 46 26 46 44M32 34v13" />;
      break;
    case 'taurus':
      mark = <><Path {...sw} d="M18 18c4 10 10 12 14 12s10-2 14-12" /><Circle {...sw} cx={32} cy={39} r={12} /></>;
      break;
    case 'gemini':
      mark = <><Path {...sw} d="M20 18c8 4 16 4 24 0M20 46c8-4 16-4 24 0" /><Line {...sw} x1={24} y1={20} x2={24} y2={44} /><Line {...sw} x1={40} y1={20} x2={40} y2={44} /></>;
      break;
    case 'cancer':
      mark = <><Path {...sw} d="M17 27c7-8 22-8 30-1" /><Path {...sw} d="M47 37c-7 8-22 8-30 1" /><Circle {...sw} cx={24} cy={27} r={5} /><Circle {...sw} cx={40} cy={37} r={5} /></>;
      break;
    case 'leo':
      mark = <><Path {...sw} d="M25 44c11-8 20-19 8-25c-8-4-15 4-11 11" /><Path {...sw} d="M38 35c10 0 9 12 1 12" /><Circle cx={27} cy={28} r={3} fill={color} /></>;
      break;
    case 'virgo':
      mark = <><Path {...sw} d="M18 20v25M28 20v25M38 20v25" /><Path {...sw} d="M18 24c4-5 10-5 10 3M28 24c4-5 10-5 10 3M38 43c10-2 10-15 0-18" /></>;
      break;
    case 'libra':
      mark = <><Path {...sw} d="M18 42h28M16 49h32" /><Path {...sw} d="M23 35c0-8 18-8 18 0" /></>;
      break;
    case 'scorpio':
      mark = <><Path {...sw} d="M17 20v24M27 20v24M37 20v18c0 7 7 8 10 3" /><Path {...sw} d="M44 41l4 1l-2 4" /><Path {...sw} d="M17 24c4-5 10-5 10 3M27 24c4-5 10-5 10 3" /></>;
      break;
    case 'sagittarius':
      mark = <><Line {...sw} x1={19} y1={45} x2={45} y2={19} /><Polyline {...sw} points="34 18 45 19 46 30" /><Line {...sw} x1={24} y1={26} x2={38} y2={40} /></>;
      break;
    case 'capricorn':
      mark = <><Path {...sw} d="M17 21c7-5 14-1 14 7v18" /><Path {...sw} d="M31 32c8-8 18-1 14 8c-3 8-16 7-16-2" /></>;
      break;
    case 'aquarius':
      mark = <><Path {...sw} d="M16 25c4-4 8-4 12 0s8 4 12 0s6-4 8-2" /><Path {...sw} d="M16 39c4-4 8-4 12 0s8 4 12 0s6-4 8-2" /></>;
      break;
    case 'pisces':
      mark = <><Path {...sw} d="M23 18c-9 9-9 19 0 28M41 18c9 9 9 19 0 28" /><Line {...sw} x1={18} y1={32} x2={46} y2={32} /></>;
      break;
    default:
      mark = <Circle {...sw} cx={32} cy={32} r={14} />;
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {common}
      <G>{mark}</G>
    </Svg>
  );
}

function AreaBar({ area, color, track }: { area: { title: string; score: number; text: string }; color: string; track: string }) {
  return (
    <View style={styles.areaRow}>
      <View style={styles.areaHead}>
        <Text style={[styles.areaTitle, { color }]}>{area.title}</Text>
        <Text style={[styles.areaScore, { color }]}>{area.score}%</Text>
      </View>
      <View style={[styles.barTrack, { backgroundColor: track }]}>
        <View style={[styles.barFill, { width: `${Math.max(12, Math.min(100, area.score))}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.areaText}>{area.text}</Text>
    </View>
  );
}

function EmptyState({ color, text }: { color: string; text: string }) {
  return (
    <Card contentStyle={styles.emptyCard}>
      <ActivityIndicator color={color} />
      <Text style={[styles.emptyText, { color }]}>{text}</Text>
    </Card>
  );
}

function PickerField({ icon, label, value, placeholder, onPress, theme }: { icon: React.ReactNode; label: string; value: string; placeholder: string; onPress: () => void; theme: Theme }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pickField,
        { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.62)' : '#fffdf7' },
        pressed && { transform: [{ scale: 0.99 }] },
      ]}
    >
      <View style={styles.pickIcon}>{icon}</View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.pickLabel, { color: theme.goldText }]}>{label.toUpperCase()}</Text>
        <Text style={[styles.pickValue, { color: value ? theme.text : theme.textMuted }]} numberOfLines={1}>{value || placeholder}</Text>
      </View>
    </Pressable>
  );
}

export function PredictionsScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const t = useT();
  const [period, setPeriod] = useState<HoroscopePeriod>('daily');
  const [selectedKey, setSelectedKey] = useState('aries');
  const [signs, setSigns] = useState<HoroscopeSign[]>([]);
  const [basis, setBasis] = useState<any>(null);
  const [sourceNote, setSourceNote] = useState('');
  const [personal, setPersonal] = useState<DailyPrediction | null>(null);
  const [otherName, setOtherName] = useState('');
  const [otherDob, setOtherDob] = useState<Date | null>(null);
  const [otherTime, setOtherTime] = useState('06:42 AM');
  const [otherPlace, setOtherPlace] = useState('');
  const [otherLocation, setOtherLocation] = useState<LocationSuggestion | null>(null);
  const [otherResult, setOtherResult] = useState<DailyPrediction | null>(null);
  const [otherLoading, setOtherLoading] = useState(false);
  const [otherErr, setOtherErr] = useState<string | null>(null);
  const [showOtherDate, setShowOtherDate] = useState(false);
  const [showOtherTime, setShowOtherTime] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let on = true;
    setLoading(true);
    setErr(null);
    getHoroscope({ period })
      .then((r) => {
        if (!on) return;
        setSigns(r.signs || []);
        setBasis(r.basis || null);
        setSourceNote(r.sourceNote || '');
        if (!selectedKey && r.signs && r.signs[0]) setSelectedKey(r.signs[0].key);
      })
      .catch((e) => { if (on) setErr(e?.message || 'Horoscope unavailable'); })
      .finally(() => { if (on) setLoading(false); });
    return () => { on = false; };
  }, [period, lang]);

  useEffect(() => {
    let on = true;
    birthFromProfile()
      .then((birth) => birth ? getPersonalizedHoroscope(birth) : null)
      .then((r) => { if (on && r?.horoscope) setPersonal(r.horoscope); })
      .catch(() => {});
    return () => { on = false; };
  }, [lang]);

  const selected = useMemo(() => signs.find((s) => s.key === selectedKey) || signs[0], [signs, selectedKey]);
  const track = theme.isDark ? 'rgba(233,184,80,0.13)' : 'rgba(176,115,22,0.12)';

  const changePeriod = (p: HoroscopePeriod) => {
    if (p === period) return;
    hSelect();
    setPeriod(p);
  };

  const generateOther = async () => {
    if (!otherDob) {
      setOtherErr(lang === 'hi' ? 'जन्म तिथि चुनें।' : 'Select date of birth.');
      return;
    }
    const tob = to24h(otherTime);
    if (!tob) {
      setOtherErr(lang === 'hi' ? 'जन्म समय सही भरें।' : 'Enter a valid birth time.');
      return;
    }
    if (!otherPlace.trim()) {
      setOtherErr(lang === 'hi' ? 'जन्म स्थान भरें।' : 'Enter birth place.');
      return;
    }
    setOtherLoading(true);
    setOtherErr(null);
    try {
      const resolved = otherLocation || await resolveLocation({ query: otherPlace.trim(), lang }).then((r) => r.item).catch(() => null);
      const finalPlace = resolved?.description || otherPlace.trim();
      const coords = resolved?.lat != null && resolved?.lng != null ? { lat: resolved.lat, lng: resolved.lng } : {};
      if (resolved?.description && resolved.description !== otherPlace) setOtherPlace(resolved.description);
      const r = await getPersonalizedHoroscope({
        name: otherName.trim() || (lang === 'hi' ? 'परिवार सदस्य' : 'Family Member'),
        dob: toDDMM(otherDob),
        tob,
        tz: '+05:30',
        place: finalPlace,
        ...coords,
      });
      setOtherResult(r.horoscope);
      hSelect();
    } catch (e: any) {
      setOtherErr(e?.message || (lang === 'hi' ? 'राशिफल नहीं बन पाया।' : 'Could not generate horoscope.'));
    } finally {
      setOtherLoading(false);
    }
  };

  return (
    <Page title={lang === 'hi' ? 'राशिफल' : 'Horoscope'} onBack={() => { hTap(); navigation.goBack(); }}>
      <Card contentStyle={styles.hero}>
        <LinearGradient colors={theme.buttonGradient} style={styles.heroIcon}>
          <RashiIcon signKey={selected?.key || 'aries'} color={theme.buttonInk} size={66} />
        </LinearGradient>
        <GradientText style={styles.heroTitle}>{lang === 'hi' ? 'सटीक राशिफल' : 'Chart-Grounded Horoscope'}</GradientText>
        <Text style={[styles.heroSub, { color: theme.textSoft }]}>
          {lang === 'hi'
            ? 'आज के पंचांग, ग्रह गोचर और आपकी जन्म-कुंडली के आधार पर आसान भाषा में मार्गदर्शन।'
            : 'Simple guidance from panchang, planetary transits, and your birth-chart context.'}
        </Text>
        {!!basis && (
          <View style={styles.basisStrip}>
            {[basis.moon?.sign, basis.sun?.sign, basis.nakshatra?.name].filter(Boolean).slice(0, 3).map((x: string) => (
              <View key={x} style={[styles.basisChip, { borderColor: theme.cardBorder }]}>
                <Text style={[styles.basisChipText, { color: theme.gold1 }]}>{x}</Text>
              </View>
            ))}
          </View>
        )}
      </Card>

      {!!personal && (
        <Card contentStyle={styles.personalCard}>
          <Text style={[styles.kicker, { color: theme.gold1 }]}>{lang === 'hi' ? 'आपकी व्यक्तिगत कुंडली' : 'Your Personalized Horoscope'}</Text>
          <Text style={[styles.personalTitle, { color: theme.text }]}>{personal.headline || (lang === 'hi' ? 'आज का मार्गदर्शन' : 'Today’s guidance')}</Text>
          <Text style={[styles.personalText, { color: theme.textSoft }]} numberOfLines={4}>{personal.overall}</Text>
          <GoldButton label={lang === 'hi' ? 'पूरा व्यक्तिगत राशिफल देखें' : 'Open Full Personal Reading'} compact onPress={() => { hTap(); navigation.navigate('DailyPrediction'); }} style={{ marginTop: 12 }} />
        </Card>
      )}

      <Card contentStyle={styles.familyCard}>
        <Text style={[styles.kicker, { color: theme.gold1 }]}>{lang === 'hi' ? 'परिवार / अन्य व्यक्ति' : 'Family / Other Person'}</Text>
        <Text style={[styles.familyTitle, { color: theme.text }]}>{lang === 'hi' ? 'किसी और का व्यक्तिगत राशिफल देखें' : 'Check someone else’s personalized horoscope'}</Text>
        <Text style={[styles.familyLead, { color: theme.textSoft }]}>
          {lang === 'hi'
            ? 'जन्म तिथि, समय और स्थान भरें। परिणाम उसी व्यक्ति की कुंडली, ग्रह स्थिति और पंचांग से बनेगा।'
            : 'Enter birth date, time, and place. The result uses that person’s chart, planetary positions, and panchang.'}
        </Text>

        <View style={styles.familyForm}>
          <TextField
            icon={<UserLine color={theme.gold2} size={20} />}
            label={lang === 'hi' ? 'नाम' : 'Name'}
            value={otherName}
            onChangeText={setOtherName}
            placeholder={lang === 'hi' ? 'जैसे: Rahul Sharma' : 'Eg. Rahul Sharma'}
            autoCapitalize="words"
          />
          <PickerField
            icon={<CalendarIcon color={theme.gold2} size={20} />}
            label={lang === 'hi' ? 'जन्म तिथि' : 'Date of Birth'}
            value={otherDob ? fmtDob(otherDob) : ''}
            placeholder={lang === 'hi' ? 'जन्म तिथि चुनें' : 'Select DOB'}
            onPress={() => { hTap(); setShowOtherDate(true); }}
            theme={theme}
          />
          <PickerField
            icon={<ClockIcon color={theme.gold2} size={20} />}
            label={lang === 'hi' ? 'जन्म समय' : 'Time of Birth'}
            value={otherTime}
            placeholder="06:42 AM"
            onPress={() => { hTap(); setShowOtherTime(true); }}
            theme={theme}
          />
          <BirthPlaceField
            label={lang === 'hi' ? 'जन्म स्थान' : 'Birth Place'}
            value={otherPlace}
            onChangeText={setOtherPlace}
            onSelect={setOtherLocation}
            placeholder={lang === 'hi' ? 'जैसे: आगोलाई, जोधपुर, राजस्थान' : 'Eg. Agolai, Jodhpur, Rajasthan'}
          />
        </View>

        {!!otherErr && <Text style={[styles.error, { color: theme.red, marginTop: 10 }]}>{otherErr}</Text>}
        <GoldButton
          label={otherLoading ? (lang === 'hi' ? 'बना रहे हैं...' : 'Generating...') : (lang === 'hi' ? 'व्यक्तिगत राशिफल बनाएं' : 'Generate Personal Horoscope')}
          onPress={generateOther}
          style={{ marginTop: 13 }}
        />

        {!!otherResult && (
          <View style={[styles.otherResult, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.08)' : 'rgba(176,115,22,0.07)' }]}>
            <Text style={[styles.kicker, { color: theme.gold1 }]}>{otherName.trim() || (lang === 'hi' ? 'व्यक्ति' : 'Person')}</Text>
            <Text style={[styles.personalTitle, { color: theme.text }]}>{otherResult.headline || (lang === 'hi' ? 'व्यक्तिगत मार्गदर्शन' : 'Personal Guidance')}</Text>
            <Text style={[styles.personalText, { color: theme.textSoft }]}>{otherResult.overall}</Text>
            {!!otherResult.detailedSummary && <Text style={[styles.personalText, { color: theme.textSoft, marginTop: 8 }]}>{otherResult.detailedSummary}</Text>}
            <View style={styles.metaGrid}>
              {[
                otherResult.basis?.moonSign ? `${lang === 'hi' ? 'चंद्र' : 'Moon'}: ${otherResult.basis.moonSign}` : '',
                otherResult.basis?.ascendant ? `${lang === 'hi' ? 'लग्न' : 'Lagna'}: ${otherResult.basis.ascendant}` : '',
                otherResult.luckyColour ? `${lang === 'hi' ? 'रंग' : 'Color'}: ${otherResult.luckyColour}` : '',
              ].filter(Boolean).map((m) => (
                <View key={m} style={[styles.metaChip, { borderColor: theme.cardBorder }]}>
                  <Text style={[styles.metaText, { color: theme.goldText }]}>{m}</Text>
                </View>
              ))}
            </View>
            {!!otherResult.advice && <Text style={[styles.remedyText, { color: theme.text, marginTop: 10 }]}>{otherResult.advice}</Text>}
          </View>
        )}
      </Card>

      <View style={styles.tabs}>
        {PERIODS.map((p) => {
          const on = p === period;
          return (
            <Pressable
              key={p}
              onPress={() => changePeriod(p)}
              style={({ pressed }) => [
                styles.tab,
                { borderColor: on ? theme.gold1 : theme.cardBorder, backgroundColor: on ? 'transparent' : (theme.isDark ? 'rgba(0,0,0,0.55)' : '#fffdf7') },
                pressed && { transform: [{ scale: 0.96 }] },
              ]}
            >
              {on && <LinearGradient colors={theme.buttonGradient} style={StyleSheet.absoluteFill} />}
              <Text style={[styles.tabText, { color: on ? theme.buttonInk : theme.gold2 }]}>{periodLabel(p, lang)}</Text>
            </Pressable>
          );
        })}
      </View>

      {loading && <EmptyState color={theme.gold1} text={lang === 'hi' ? 'राशिफल तैयार हो रहा है...' : 'Preparing horoscope...'} />}
      {!!err && !loading && <Text style={[styles.error, { color: theme.red }]}>{err}</Text>}

      {!!signs.length && (
        <>
          <Text style={[styles.section, { color: theme.goldText }]}>{lang === 'hi' ? '१२ राशियां' : 'All 12 Signs'}</Text>
          <Card contentStyle={styles.gridCard}>
            <View style={styles.grid}>
              {signs.map((s) => {
                const on = s.key === selected?.key;
                return (
                  <Pressable
                    key={s.key}
                    onPress={() => { hSelect(); setSelectedKey(s.key); }}
                    style={({ pressed }) => [
                      styles.signTile,
                      {
                        borderColor: on ? theme.gold1 : theme.cardBorder,
                        backgroundColor: on ? (theme.isDark ? 'rgba(233,184,80,0.12)' : 'rgba(176,115,22,0.08)') : (theme.isDark ? 'rgba(0,0,0,0.48)' : '#fffdf7'),
                      },
                      pressed && { transform: [{ scale: 0.96 }] },
                    ]}
                  >
                    <RashiIcon signKey={s.key} color={on ? theme.gold1 : theme.goldDim} size={48} />
                    <Text style={[styles.signName, { color: on ? theme.gold1 : theme.text }]} numberOfLines={1}>{s.displayName}</Text>
                    <Text style={[styles.signDates, { color: theme.textMuted }]} numberOfLines={1}>{s.dates}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>
        </>
      )}

      {!!selected && (
        <Card contentStyle={styles.detailCard}>
          <View style={styles.detailHead}>
            <View style={[styles.detailIcon, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? '#000' : '#fffdf7' }]}>
              <RashiIcon signKey={selected.key} color={theme.gold1} size={72} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.kicker, { color: theme.gold1 }]}>{selected.lord} • {selected.element}</Text>
              <GradientText style={styles.detailTitle}>{selected.displayName}</GradientText>
              <Text style={[styles.detailHeadline, { color: theme.textSoft }]}>{selected.headline}</Text>
            </View>
            <ScoreRing score={selected.score} color={theme.gold1} />
          </View>

          <Text style={[styles.summary, { color: theme.textSoft }]}>{selected.plainSummary}</Text>
          <Text style={[styles.summaryStrong, { color: theme.text }]}>{selected.summary}</Text>

          <View style={styles.metaGrid}>
            {[
              `${lang === 'hi' ? 'शुभ रंग' : 'Lucky color'}: ${selected.luckyColor}`,
              `${lang === 'hi' ? 'शुभ अंक' : 'Lucky number'}: ${selected.luckyNumber}`,
              `${lang === 'hi' ? 'विश्वास' : 'Confidence'}: ${Math.round((selected.confidence || 0) * 100)}%`,
            ].map((m) => (
              <View key={m} style={[styles.metaChip, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.55)' : 'rgba(176,115,22,0.06)' }]}>
                <Text style={[styles.metaText, { color: theme.goldText }]}>{m}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.subHead, { color: theme.goldText }]}>{lang === 'hi' ? 'जीवन क्षेत्र' : 'Life Areas'}</Text>
          {selected.areas.map((area) => <AreaBar key={area.key} area={area} color={theme.gold1} track={track} />)}

          <View style={styles.doAvoid}>
            <View style={styles.listCol}>
              <Text style={[styles.subHead, { color: theme.green }]}>{lang === 'hi' ? 'करें' : 'Do'}</Text>
              {selected.doList.map((x) => <Text key={x} style={[styles.bullet, { color: theme.textSoft }]}>• {x}</Text>)}
            </View>
            <View style={styles.listCol}>
              <Text style={[styles.subHead, { color: theme.red }]}>{lang === 'hi' ? 'बचें' : 'Avoid'}</Text>
              {selected.avoidList.map((x) => <Text key={x} style={[styles.bullet, { color: theme.textSoft }]}>• {x}</Text>)}
            </View>
          </View>

          <View style={[styles.remedyBox, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.08)' : 'rgba(176,115,22,0.07)' }]}>
            <Text style={[styles.subHead, { color: theme.gold1 }]}>{lang === 'hi' ? 'सरल उपाय' : 'Simple Remedy'}</Text>
            <Text style={[styles.remedyText, { color: theme.textSoft }]}>{selected.remedy}</Text>
          </View>

          <Text style={[styles.subHead, { color: theme.goldText }]}>{lang === 'hi' ? 'गणना आधार' : 'Calculation Basis'}</Text>
          {selected.basisBullets.map((x) => <Text key={x} style={[styles.basisLine, { color: theme.textMuted }]}>• {x}</Text>)}
          {!!sourceNote && <Text style={[styles.sourceNote, { color: theme.textMuted }]}>{sourceNote}</Text>}
        </Card>
      )}

      <GoldButton
        label={lang === 'hi' ? 'ज्योतिषी से पूछें' : 'Ask the Astrologer'}
        onPress={() => {
          hTap();
          navigation.navigate('AiAstrologer', {
            question: lang === 'hi'
              ? `${selected?.displayName || ''} राशि और मेरी कुंडली के आधार पर आज मेरे लिए सबसे महत्वपूर्ण सलाह क्या है?`
              : `Based on ${selected?.displayName || 'my sign'} and my birth chart, what is the most important guidance for me today?`,
          });
        }}
        style={{ marginTop: 16 }}
      />

      <GoldDatePicker
        visible={showOtherDate}
        initialDate={otherDob || new Date(2000, 0, 1)}
        maximumDate={new Date()}
        onConfirm={(d) => { setOtherDob(d); setShowOtherDate(false); hSelect(); }}
        onCancel={() => setShowOtherDate(false)}
        lang={lang}
      />
      <GoldTimePicker
        visible={showOtherTime}
        value={otherTime}
        onConfirm={(t) => { setOtherTime(t); setShowOtherTime(false); hSelect(); }}
        onCancel={() => setShowOtherTime(false)}
        lang={lang}
      />
    </Page>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 18 },
  heroIcon: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  heroTitle: { fontFamily: fonts.playfairBold, fontSize: 24, textAlign: 'center' },
  heroSub: { fontFamily: fonts.inter, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 6 },
  basisStrip: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, justifyContent: 'center' },
  basisChip: { borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 5 },
  basisChipText: { fontFamily: fonts.interSemi, fontSize: 11 },

  personalCard: { padding: 16 },
  kicker: { fontFamily: fonts.interBold, fontSize: 10.5, letterSpacing: 1.2, textTransform: 'uppercase' },
  personalTitle: { fontFamily: fonts.playfairBold, fontSize: 18, marginTop: 4 },
  personalText: { fontFamily: fonts.inter, fontSize: 12.5, lineHeight: 19, marginTop: 6 },
  familyCard: { padding: 16 },
  familyTitle: { fontFamily: fonts.playfairBold, fontSize: 18, marginTop: 4 },
  familyLead: { fontFamily: fonts.inter, fontSize: 12.5, lineHeight: 19, marginTop: 6 },
  familyForm: { gap: 12, marginTop: 14 },
  pickField: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: radii.md, paddingHorizontal: 14, paddingVertical: 12 },
  pickIcon: { width: 20, alignItems: 'center' },
  pickLabel: { fontFamily: fonts.interSemi, fontSize: 10.5, letterSpacing: 1.8 },
  pickValue: { fontFamily: fonts.inter, fontSize: 15, marginTop: 3 },
  otherResult: { borderWidth: 1, borderRadius: 16, padding: 13, marginTop: 14 },

  tabs: { flexDirection: 'row', gap: 7, marginTop: 14 },
  tab: { flex: 1, minHeight: 38, borderRadius: radii.pill, borderWidth: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  tabText: { fontFamily: fonts.cinzelSemi, fontSize: 10.5, letterSpacing: 0.6 },
  emptyCard: { alignItems: 'center', gap: 10, padding: 18 },
  emptyText: { fontFamily: fonts.interSemi, fontSize: 12 },
  error: { fontFamily: fonts.interSemi, fontSize: 12.5, textAlign: 'center', marginTop: 12 },

  section: { fontFamily: fonts.cinzelSemi, fontSize: 13, letterSpacing: 1.3, marginTop: 20, marginBottom: 10, marginLeft: 2 },
  gridCard: { padding: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  signTile: { width: '30.9%', flexGrow: 1, borderRadius: 16, borderWidth: 1, paddingVertical: 11, paddingHorizontal: 6, alignItems: 'center' },
  signName: { fontFamily: fonts.cinzelSemi, fontSize: 11, letterSpacing: 0.4, marginTop: 4 },
  signDates: { fontFamily: fonts.inter, fontSize: 9, marginTop: 2, textAlign: 'center' },

  detailCard: { padding: 16 },
  detailHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  detailIcon: { width: 82, height: 82, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  detailTitle: { fontFamily: fonts.playfairBold, fontSize: 24, marginTop: 2 },
  detailHeadline: { fontFamily: fonts.interSemi, fontSize: 12.5, marginTop: 3 },
  scoreWrap: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center' },
  scoreText: { position: 'absolute', fontFamily: fonts.interBold, fontSize: 13 },
  summary: { fontFamily: fonts.interSemi, fontSize: 13, lineHeight: 20, marginTop: 15 },
  summaryStrong: { fontFamily: fonts.inter, fontSize: 12.8, lineHeight: 20, marginTop: 8 },

  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 13 },
  metaChip: { borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 5 },
  metaText: { fontFamily: fonts.interSemi, fontSize: 10.5 },
  subHead: { fontFamily: fonts.cinzelSemi, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', marginTop: 15, marginBottom: 8 },

  areaRow: { marginTop: 9 },
  areaHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  areaTitle: { fontFamily: fonts.interBold, fontSize: 12 },
  areaScore: { fontFamily: fonts.interBold, fontSize: 11 },
  barTrack: { height: 7, borderRadius: 999, marginTop: 6, overflow: 'hidden' },
  barFill: { height: 7, borderRadius: 999 },
  areaText: { fontFamily: fonts.inter, fontSize: 12, lineHeight: 18, color: '#bfb08b', marginTop: 5 },

  doAvoid: { flexDirection: 'row', gap: 12, marginTop: 4 },
  listCol: { flex: 1, minWidth: 0 },
  bullet: { fontFamily: fonts.inter, fontSize: 12.2, lineHeight: 19, marginTop: 3 },
  remedyBox: { borderWidth: 1, borderRadius: 16, padding: 12, marginTop: 14 },
  remedyText: { fontFamily: fonts.inter, fontSize: 12.5, lineHeight: 19 },
  basisLine: { fontFamily: fonts.inter, fontSize: 11.8, lineHeight: 18, marginTop: 2 },
  sourceNote: { fontFamily: fonts.inter, fontSize: 11.5, lineHeight: 17, marginTop: 10 },
});
