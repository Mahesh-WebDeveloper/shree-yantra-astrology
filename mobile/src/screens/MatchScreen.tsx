import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Page } from '../components/Page';
import { GradientText } from '../components/GradientText';
import { GoldButton } from '../components/GoldButton';
import { TextField } from '../components/TextField';
import { BirthPlaceField } from '../components/BirthPlaceField';
import { GoldDatePicker } from '../components/GoldDatePicker';
import { GoldTimePicker } from '../components/GoldTimePicker';
import { UserLine, CalendarIcon, ClockIcon } from '../components/icons/ProfileIcons';
import { useTheme } from '../theme/ThemeProvider';
import { Theme, fonts, radii } from '../theme/tokens';
import { hTap, hSelect, hSuccess, hError } from '../lib/haptics';
import { useT, useLang } from '../i18n/LanguageProvider';
import { useDialog } from '../components/DialogProvider';
import { getKundliMatch, LocationSuggestion, MatchResponse, MatchKoota, resolveLocation } from '../lib/api';

const pad = (n: number) => (n < 10 ? '0' : '') + n;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtDob = (d: Date) => `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
const toDDMM = (d: Date) => `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
const to24h = (t: string): string => {
  const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return t;
  let h = Number(m[1]); const ap = (m[3] || '').toUpperCase();
  if (ap === 'PM' && h < 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return `${pad(h)}:${m[2]}`;
};

interface PersonState { name: string; dob: Date | null; tob: string; place: string; location: LocationSuggestion | null; }
const EMPTY: PersonState = { name: '', dob: null, tob: '', place: '', location: null };

const HeartIcon = ({ color, size = 20 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M12 21s-7.5-4.8-10-9.2C.6 9 1.6 5.5 4.8 4.7 7 4.1 9 5.3 12 8c3-2.7 5-3.9 7.2-3.3C22.4 5.5 23.4 9 22 11.8 19.5 16.2 12 21 12 21z" />
  </Svg>
);

function PickerRow({ icon, label, value, onPress, theme }: { icon: React.ReactNode; label: string; value: string; onPress: () => void; theme: Theme }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.pf, { backgroundColor: theme.isDark ? 'rgba(0,0,0,0.55)' : '#fffdf7', borderColor: pressed ? theme.gold1 : theme.cardBorder }]}>
      <View style={styles.pfIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.pfLabel, { color: theme.goldText }]}>{label.toUpperCase()}</Text>
        <Text style={[styles.pfValue, { color: value ? theme.text : theme.textMuted }]}>{value || (theme.isDark ? 'चुनने के लिए टैप करें' : 'Tap to select')}</Text>
      </View>
    </Pressable>
  );
}

function PersonForm({ role, value, onChange }: { role: 'boy' | 'girl'; value: PersonState; onChange: (v: PersonState) => void }) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const t = useT();
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const accent = role === 'boy' ? '#5aa9e0' : '#e07aa9';
  const title = role === 'boy' ? t('match.boy', lang === 'hi' ? 'वर (लड़का)' : 'Groom (Boy)') : t('match.girl', lang === 'hi' ? 'वधू (लड़की)' : 'Bride (Girl)');
  const setPlaceText = (place: string) => onChange({ ...value, place, location: null });
  const setPlaceLocation = (location: LocationSuggestion | null) => {
    if (!location) return;
    onChange({ ...value, place: location.description || value.place, location });
  };

  return (
    <View style={[styles.personCard, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.7)' }]}>
      <View style={styles.personHead}>
        <View style={[styles.personDot, { backgroundColor: accent }]} />
        <Text style={[styles.personTitle, { color: theme.text }]}>{title}</Text>
      </View>
      <View style={{ gap: 11 }}>
        <TextField icon={<UserLine color={theme.gold2} size={19} />} label={t('profile.fullName', 'Name')} value={value.name} onChangeText={(name) => onChange({ ...value, name })} placeholder={lang === 'hi' ? 'नाम' : 'Name'} autoCapitalize="words" />
        <PickerRow icon={<CalendarIcon color={theme.gold2} size={19} />} label={t('profile.dob', 'Date of Birth')} value={value.dob ? fmtDob(value.dob) : ''} onPress={() => { hTap(); setShowDate(true); }} theme={theme} />
        <PickerRow icon={<ClockIcon color={theme.gold2} size={19} />} label={t('profile.tob', 'Time of Birth')} value={value.tob} onPress={() => { hTap(); setShowTime(true); }} theme={theme} />
        <BirthPlaceField
          label={t('profile.place', 'Place of Birth')}
          value={value.place}
          onChangeText={setPlaceText}
          onSelect={setPlaceLocation}
          placeholder={lang === 'hi' ? 'जैसे: आगोलाई, जोधपुर' : 'Eg. Agolai, Jodhpur'}
        />
      </View>

      <GoldDatePicker visible={showDate} initialDate={value.dob || new Date(1998, 0, 1)} maximumDate={new Date()} onConfirm={(d) => { onChange({ ...value, dob: d }); setShowDate(false); hSelect(); }} onCancel={() => setShowDate(false)} lang={lang} />
      <GoldTimePicker visible={showTime} value={value.tob || '08:00'} onConfirm={(tm) => { onChange({ ...value, tob: tm }); setShowTime(false); hSelect(); }} onCancel={() => setShowTime(false)} lang={lang} />
    </View>
  );
}

// verdict → colour + label
function verdictColor(v: string) {
  if (v === 'excellent') return '#3ec77a';
  if (v === 'good') return '#9ed36a';
  if (v === 'average') return '#e0a92e';
  return '#e06a5a';
}
function verdictLabel(v: string, lang: 'en' | 'hi') {
  const en: any = { excellent: 'Excellent Match', good: 'Good Match', average: 'Average Match', poor: 'Weak Match' };
  const hi: any = { excellent: 'उत्तम मेल', good: 'अच्छा मेल', average: 'सामान्य मेल', poor: 'कमज़ोर मेल' };
  return (lang === 'hi' ? hi : en)[v] || v;
}
function barColor(ratio: number) {
  if (ratio >= 0.66) return '#3ec77a';
  if (ratio >= 0.34) return '#e0a92e';
  return '#e06a5a';
}

// circular score gauge
function ScoreGauge({ total, max, percent, color }: { total: number; max: number; percent: number; color: string }) {
  const { theme } = useTheme();
  const R = 58; const SW = 11; const C = 2 * Math.PI * R;
  const frac = Math.max(0, Math.min(1, total / max));
  const track = theme.isDark ? 'rgba(201,150,46,0.18)' : 'rgba(176,115,22,0.16)';
  return (
    <View style={{ width: 150, height: 150, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={150} height={150} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={75} cy={75} r={R} stroke={track} strokeWidth={SW} fill="none" />
        <Circle cx={75} cy={75} r={R} stroke={color} strokeWidth={SW} fill="none" strokeLinecap="round" strokeDasharray={`${C}`} strokeDashoffset={C * (1 - frac)} />
      </Svg>
      <Text style={[styles.gaugeTotal, { color: theme.text }]}>{total}</Text>
      <Text style={[styles.gaugeMax, { color: theme.textMuted }]}>/ {max}</Text>
      <Text style={[styles.gaugePct, { color }]}>{percent}%</Text>
    </View>
  );
}

function KootaRow({ k, lang, theme }: { k: MatchKoota; lang: 'en' | 'hi'; theme: Theme }) {
  const ratio = k.max ? k.got / k.max : 0;
  const col = barColor(ratio);
  const label = lang === 'hi' && k.labelHi ? k.labelHi : k.label;
  const note = lang === 'hi' && k.noteHi ? k.noteHi : k.note;
  return (
    <View style={[styles.koota, { borderColor: theme.cardBorder }]}>
      <View style={styles.kootaTop}>
        <Text style={[styles.kootaName, { color: theme.text }]}>{label}</Text>
        <Text style={[styles.kootaScore, { color: col }]}>{k.got}<Text style={{ color: theme.textMuted }}>/{k.max}</Text></Text>
      </View>
      <View style={[styles.barTrack, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)' }]}>
        <View style={[styles.barFill, { width: `${Math.max(6, ratio * 100)}%`, backgroundColor: col }]} />
      </View>
      <View style={styles.kootaMeta}>
        {!!(k.boy || k.girl) && (
          <Text style={[styles.kootaPair, { color: theme.textMuted }]} numberOfLines={1}>
            {lang === 'hi' ? 'वर' : 'Boy'}: <Text style={{ color: theme.gold2 }}>{k.boy || '—'}</Text>   {lang === 'hi' ? 'वधू' : 'Girl'}: <Text style={{ color: theme.gold2 }}>{k.girl || '—'}</Text>
          </Text>
        )}
        {!!note && <Text style={[styles.kootaNote, { color: theme.textMuted }]}>{note}</Text>}
      </View>
    </View>
  );
}

export function MatchScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const t = useT();
  const dialog = useDialog();
  const [boy, setBoy] = useState<PersonState>(EMPTY);
  const [girl, setGirl] = useState<PersonState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<MatchResponse | null>(null);

  const valid = (p: PersonState) => p.dob && p.tob.trim() && p.place.trim();

  const run = async () => {
    if (!valid(boy) || !valid(girl)) {
      hError();
      dialog(lang === 'hi' ? 'विवरण अधूरा' : 'Details incomplete', lang === 'hi' ? 'दोनों के जन्म तिथि, समय और स्थान भरें।' : 'Please fill date, time & place of birth for both.');
      return;
    }
    if (busy) return;
    setBusy(true); setResult(null);
    try {
      const mk = async (p: PersonState) => {
        const location = p.location || await resolveLocation({ query: p.place.trim(), lang }).then((r) => r.item).catch(() => null);
        const coords = location?.lat != null && location?.lng != null ? { lat: location.lat, lng: location.lng } : {};
        return { name: p.name.trim() || undefined, dob: toDDMM(p.dob as Date), tob: to24h(p.tob), tz: '+05:30', place: location?.description || p.place.trim(), ...coords };
      };
      const [boyBirth, girlBirth] = await Promise.all([mk(boy), mk(girl)]);
      const res = await getKundliMatch(boyBirth, girlBirth);
      hSuccess();
      setResult(res);
    } catch (e: any) {
      hError();
      dialog(lang === 'hi' ? 'मिलान विफल' : 'Match failed', e?.message || (lang === 'hi' ? 'कृपया दोबारा प्रयास करें।' : 'Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  const reset = () => { hTap(); setResult(null); };

  const ex = result?.explanation;
  const vColor = result ? verdictColor(result.milan.verdict) : theme.gold1;

  return (
    <Page title={t('match.title', 'Kundli Milan')} onBack={() => { hTap(); navigation.goBack(); }}>
      {!result && (
        <>
          <View style={styles.intro}>
            <View style={styles.heartWrap}><HeartIcon color={theme.gold1} size={26} /></View>
            <GradientText style={styles.introTitle}>{t('match.heading', lang === 'hi' ? 'गुण मिलान' : 'Gun Milan')}</GradientText>
            <Text style={[styles.introSub, { color: theme.textMuted }]}>
              {t('match.sub', lang === 'hi' ? '36 गुण अष्टकूट विधि से शादी की अनुकूलता जानें — असली कुंडली गणना के साथ सरल व्याख्या।' : 'Marriage compatibility by the 36-guna Ashtakoot method — real chart calculation with simple explanation.')}
            </Text>
          </View>

          <PersonForm role="boy" value={boy} onChange={setBoy} />
          <View style={styles.heartDivider}><View style={[styles.dLine, { backgroundColor: theme.cardBorder }]} /><HeartIcon color={theme.gold2} size={18} /><View style={[styles.dLine, { backgroundColor: theme.cardBorder }]} /></View>
          <PersonForm role="girl" value={girl} onChange={setGirl} />

          <View style={{ marginTop: 18 }}>
            <GoldButton label={busy ? (lang === 'hi' ? 'मिलान हो रहा है…' : 'Matching…') : t('match.cta', lang === 'hi' ? 'कुंडली मिलाएँ' : 'Match Kundli')} onPress={run} />
          </View>
          {busy && <ActivityIndicator color={theme.gold1} style={{ marginTop: 16 }} />}
          <Text style={[styles.trust, { color: theme.textMuted }]}>🔒 {lang === 'hi' ? 'गणना वास्तविक ग्रह-स्थितियों (Lahiri अयनांश) से · विवरण सुरक्षित।' : 'Calculated from real planetary positions (Lahiri ayanamsa) · details kept private.'}</Text>
        </>
      )}

      {result && (
        <View style={{ gap: 16 }}>
          {/* score hero */}
          <View style={[styles.hero, { borderColor: vColor + '66', backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.8)' }]}>
            <Text style={[styles.heroNames, { color: theme.text }]} numberOfLines={1}>
              {(result.people.boy.name || (lang === 'hi' ? 'वर' : 'Boy'))} <Text style={{ color: theme.gold2 }}>×</Text> {(result.people.girl.name || (lang === 'hi' ? 'वधू' : 'Girl'))}
            </Text>
            <ScoreGauge total={result.milan.total} max={result.milan.max} percent={result.milan.percent} color={vColor} />
            <View style={[styles.verdictPill, { backgroundColor: vColor + '22', borderColor: vColor + '88' }]}>
              <Text style={[styles.verdictText, { color: vColor }]}>{verdictLabel(result.milan.verdict, lang)}</Text>
            </View>
            {!!ex?.verdict && <Text style={[styles.heroVerdict, { color: theme.textSoft }]}>{ex.verdict}</Text>}
          </View>

          {/* Mangal dosha */}
          <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.8)' }]}>
            <Text style={[styles.cardTitle, { color: theme.gold1 }]}>{lang === 'hi' ? 'मंगल दोष' : 'Mangal (Manglik) Dosha'}</Text>
            <View style={styles.mangalRow}>
              <View style={styles.mangalCol}>
                <Text style={[styles.mangalWho, { color: theme.textMuted }]}>{lang === 'hi' ? 'वर' : 'Boy'}</Text>
                <Text style={[styles.mangalVal, { color: result.mangal.boy ? '#e0a92e' : '#3ec77a' }]}>{result.mangal.boy ? (lang === 'hi' ? 'मांगलिक' : 'Manglik') : (lang === 'hi' ? 'नहीं' : 'No')}</Text>
              </View>
              <View style={styles.mangalCol}>
                <Text style={[styles.mangalWho, { color: theme.textMuted }]}>{lang === 'hi' ? 'वधू' : 'Girl'}</Text>
                <Text style={[styles.mangalVal, { color: result.mangal.girl ? '#e0a92e' : '#3ec77a' }]}>{result.mangal.girl ? (lang === 'hi' ? 'मांगलिक' : 'Manglik') : (lang === 'hi' ? 'नहीं' : 'No')}</Text>
              </View>
              <View style={styles.mangalCol}>
                <Text style={[styles.mangalWho, { color: theme.textMuted }]}>{lang === 'hi' ? 'मेल' : 'Match'}</Text>
                <Text style={[styles.mangalVal, { color: result.mangal.compatible ? '#3ec77a' : '#e06a5a' }]}>{result.mangal.compatible ? (lang === 'hi' ? '✓ ठीक' : '✓ OK') : (lang === 'hi' ? '⚠ ध्यान' : '⚠ Note')}</Text>
              </View>
            </View>
            {!!(lang === 'hi' ? result.mangal.noteHi : result.mangal.note) && (
              <Text style={[styles.mangalNote, { color: theme.textMuted }]}>{lang === 'hi' ? result.mangal.noteHi : result.mangal.note}</Text>
            )}
          </View>

          {/* 8 koota breakdown */}
          <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.8)' }]}>
            <Text style={[styles.cardTitle, { color: theme.gold1 }]}>{lang === 'hi' ? 'अष्टकूट विवरण (8 गुण)' : 'Ashtakoot Breakdown (8 Kootas)'}</Text>
            <View style={{ gap: 12, marginTop: 6 }}>
              {result.milan.kootas.map((k) => <KootaRow key={k.key} k={k} lang={lang} theme={theme} />)}
            </View>
          </View>

          {/* AI explanation */}
          {ex && (ex.summary || (ex.strengths || []).length) && (
            <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.8)' }]}>
              <Text style={[styles.cardTitle, { color: theme.gold1 }]}>{lang === 'hi' ? 'सरल व्याख्या' : 'Simple Explanation'}</Text>
              {!!ex.summary && <Text style={[styles.exBody, { color: theme.text }]}>{ex.summary}</Text>}

              {!!(ex.strengths || []).length && (
                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.exLabel, { color: '#3ec77a' }]}>{lang === 'hi' ? '✓ मज़बूत पक्ष' : '✓ Strengths'}</Text>
                  {ex.strengths!.map((s, i) => <Text key={i} style={[styles.exPoint, { color: theme.textSoft }]}>•  {s}</Text>)}
                </View>
              )}
              {!!(ex.cautions || []).length && (
                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.exLabel, { color: '#e0a92e' }]}>{lang === 'hi' ? '⚠ ध्यान देने योग्य' : '⚠ Things to note'}</Text>
                  {ex.cautions!.map((s, i) => <Text key={i} style={[styles.exPoint, { color: theme.textSoft }]}>•  {s}</Text>)}
                </View>
              )}
              {!!ex.advice && (
                <View style={[styles.adviceBox, { borderColor: theme.gold2 + '55', backgroundColor: theme.isDark ? 'rgba(201,150,46,0.08)' : 'rgba(244,195,74,0.12)' }]}>
                  <Text style={[styles.adviceText, { color: theme.text }]}>💛 {ex.advice}</Text>
                </View>
              )}
              {ex.aiAssisted && <Text style={[styles.aiTag, { color: theme.textMuted }]}>{lang === 'hi' ? 'गणना वास्तविक ग्रह-स्थितियों (Lahiri अयनांश) से' : 'Calculated from real planetary positions (Lahiri ayanamsa)'}</Text>}
            </View>
          )}

          <GoldButton variant="ghost" label={t('match.again', lang === 'hi' ? 'दूसरा मिलान करें' : 'Match Another')} onPress={reset} />
          <View style={{ height: 8 }} />
        </View>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  intro: { alignItems: 'center', marginBottom: 16, marginTop: 2 },
  heartWrap: { marginBottom: 8 },
  introTitle: { fontFamily: fonts.cinzel, fontSize: 22, letterSpacing: 1 },
  introSub: { fontFamily: fonts.inter, fontSize: 12.5, textAlign: 'center', lineHeight: 19, marginTop: 8, maxWidth: 330 },

  personCard: { borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 4 },
  personHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  personDot: { width: 10, height: 10, borderRadius: 5 },
  personTitle: { fontFamily: fonts.cinzelSemi, fontSize: 15, letterSpacing: 0.5 },

  heartDivider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 12, paddingHorizontal: 20 },
  dLine: { flex: 1, height: 1 },

  pf: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 13, paddingVertical: 11, borderRadius: radii.md, borderWidth: 1 },
  pfIcon: { width: 19, alignItems: 'center' },
  pfLabel: { fontFamily: fonts.interSemi, fontSize: 10, letterSpacing: 1.6 },
  pfValue: { fontFamily: fonts.inter, fontSize: 14.5, marginTop: 2 },

  trust: { fontFamily: fonts.inter, fontSize: 11, textAlign: 'center', marginTop: 14, lineHeight: 16 },

  hero: { alignItems: 'center', borderWidth: 1.5, borderRadius: 20, paddingVertical: 20, paddingHorizontal: 16 },
  heroNames: { fontFamily: fonts.cinzelSemi, fontSize: 16, marginBottom: 12, textAlign: 'center' },
  gaugeTotal: { fontFamily: fonts.cinzelXBold, fontSize: 42, lineHeight: 46, marginTop: 6 },
  gaugeMax: { fontFamily: fonts.inter, fontSize: 13, marginTop: -4 },
  gaugePct: { fontFamily: fonts.interBold, fontSize: 13, marginTop: 2 },
  verdictPill: { marginTop: 14, paddingHorizontal: 18, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
  verdictText: { fontFamily: fonts.interBold, fontSize: 13.5, letterSpacing: 0.5 },
  heroVerdict: { fontFamily: fonts.inter, fontSize: 13.5, textAlign: 'center', lineHeight: 20, marginTop: 12 },

  card: { borderWidth: 1, borderRadius: 16, padding: 16 },
  cardTitle: { fontFamily: fonts.cinzelSemi, fontSize: 13.5, letterSpacing: 0.8, marginBottom: 4 },

  mangalRow: { flexDirection: 'row', marginTop: 10 },
  mangalCol: { flex: 1, alignItems: 'center' },
  mangalWho: { fontFamily: fonts.interSemi, fontSize: 10.5, letterSpacing: 1, textTransform: 'uppercase' },
  mangalVal: { fontFamily: fonts.interBold, fontSize: 15, marginTop: 5 },
  mangalNote: { fontFamily: fonts.inter, fontSize: 12.5, lineHeight: 19, marginTop: 12, textAlign: 'center' },

  koota: { borderWidth: 1, borderRadius: 12, padding: 12 },
  kootaTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kootaName: { fontFamily: fonts.interSemi, fontSize: 14 },
  kootaScore: { fontFamily: fonts.cinzelXBold, fontSize: 16 },
  barTrack: { height: 7, borderRadius: 4, marginTop: 8, overflow: 'hidden' },
  barFill: { height: 7, borderRadius: 4 },
  kootaMeta: { marginTop: 8, gap: 3 },
  kootaPair: { fontFamily: fonts.inter, fontSize: 11.5 },
  kootaNote: { fontFamily: fonts.inter, fontSize: 11.5, lineHeight: 16 },

  exBody: { fontFamily: fonts.inter, fontSize: 14, lineHeight: 22, marginTop: 6 },
  exLabel: { fontFamily: fonts.interBold, fontSize: 12.5, letterSpacing: 0.4, marginBottom: 5 },
  exPoint: { fontFamily: fonts.inter, fontSize: 13.5, lineHeight: 21, marginTop: 2 },
  adviceBox: { borderWidth: 1, borderRadius: 12, padding: 13, marginTop: 14 },
  adviceText: { fontFamily: fonts.inter, fontSize: 13.5, lineHeight: 21 },
  aiTag: { fontFamily: fonts.inter, fontSize: 10.5, marginTop: 12, textAlign: 'center' },
});
