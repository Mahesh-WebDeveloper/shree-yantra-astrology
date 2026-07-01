import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Page } from '../components/Page';
import { GradientText } from '../components/GradientText';
import { GoldButton } from '../components/GoldButton';
import { TextField } from '../components/TextField';
import { GoldDatePicker } from '../components/GoldDatePicker';
import { UserLine, CalendarIcon } from '../components/icons/ProfileIcons';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';
import { useLang } from '../i18n/LanguageProvider';
import { hTap, hSuccess, hError } from '../lib/haptics';
import { useDialog } from '../components/DialogProvider';
import { useAutoScroll } from '../lib/useAutoScroll';
import {
  getNumerologyProfile, getNumerologyReading, checkNumerologyNumber,
  NumerologyProfile, NumerologyReading, NumberCheck, NumWithPlanet, NumReduced, NumRelation,
} from '../lib/api';

const pad = (n: number) => (n < 10 ? '0' : '') + n;
const toDMY = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
const LOSHU_ROWS = [[4, 9, 2], [3, 5, 7], [8, 1, 6]];

export function NumerologyScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const hi = lang === 'hi';
  const dialog = useDialog();
  const { scrollRef, onResultsLayout, scrollToResults } = useAutoScroll();

  const [name, setName] = useState('');
  const [dob, setDob] = useState<Date | null>(null);
  const [showDate, setShowDate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [profile, setProfile] = useState<NumerologyProfile | null>(null);

  const [reading, setReading] = useState<NumerologyReading | null>(null);
  const [readingBusy, setReadingBusy] = useState(false);

  const [numInput, setNumInput] = useState('');
  const [check, setCheck] = useState<NumberCheck | null>(null);
  const [checkBusy, setCheckBusy] = useState(false);

  const L = (o?: { en: string; hi: string } | null) => (o ? (hi ? o.hi : o.en) : '');
  const LL = (o?: { en: string[]; hi: string[] } | null) => (o ? (hi ? o.hi : o.en) : []);

  const calc = async () => {
    if (!dob) { hError(); dialog(hi ? 'जन्म तिथि' : 'Date of birth', hi ? 'कृपया अपनी जन्म तिथि चुनें।' : 'Please pick your date of birth.'); return; }
    if (busy) return;
    hTap(); setBusy(true); setProfile(null); setReading(null); setCheck(null);
    try {
      const { profile: p } = await getNumerologyProfile({ name: name.trim(), dob: toDMY(dob) });
      setProfile(p); hSuccess(); scrollToResults();
    } catch (e: any) { hError(); dialog(hi ? 'त्रुटि' : 'Error', e?.message || (hi ? 'फिर प्रयास करें।' : 'Please try again.')); }
    finally { setBusy(false); }
  };

  const loadReading = async () => {
    if (!dob || readingBusy) return;
    hTap(); setReadingBusy(true);
    try {
      const r = await getNumerologyReading({ name: name.trim(), dob: toDMY(dob) });
      setReading(r.reading);
    } catch (e: any) { hError(); dialog(hi ? 'त्रुटि' : 'Error', e?.message || (hi ? 'फिर प्रयास करें।' : 'Please try again.')); }
    finally { setReadingBusy(false); }
  };

  const runCheck = async () => {
    if (!profile || checkBusy) return;
    if (!numInput.replace(/\D/g, '')) { hError(); dialog(hi ? 'नंबर' : 'Number', hi ? 'मोबाइल/गाड़ी नंबर लिखें।' : 'Enter a mobile/vehicle number.'); return; }
    hTap(); setCheckBusy(true);
    try {
      const r = await checkNumerologyNumber({ number: numInput, mulank: profile.mulank.final });
      setCheck(r); hSuccess();
    } catch (e: any) { hError(); dialog(hi ? 'त्रुटि' : 'Error', e?.message || 'Try again'); }
    finally { setCheckBusy(false); }
  };

  const relColor = (r?: NumRelation) => (r?.key === 'friend' ? '#3ec77a' : r?.key === 'enemy' ? '#e06a5a' : theme.textMuted);

  return (
    <Page title={hi ? 'अंकशास्त्र' : 'Numerology'} onBack={() => { hTap(); navigation.goBack(); }} scrollRef={scrollRef}>
      {/* ── intro / input ── */}
      <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.85)' }]}>
        <GradientText style={styles.h1}>{hi ? 'अंक ज्योतिष विश्लेषण' : 'Numerology Analysis'}</GradientText>
        <Text style={[styles.sub, { color: theme.textMuted }]}>
          {hi ? 'मूलांक, भाग्यांक, नामांक (चेल्डियन), लो-शु ग्रिड, शुभ अंक और मोबाइल/गाड़ी नंबर मिलान — 100% सटीक गणना।'
              : 'Mulank, Bhagyank, Namank (Chaldean), Lo Shu grid, lucky numbers & mobile/vehicle matching — 100% exact math.'}
        </Text>
        <View style={{ gap: 11, marginTop: 12 }}>
          <TextField icon={<UserLine color={theme.gold2} size={19} />} label={hi ? 'पूरा नाम' : 'Full name'} value={name} onChangeText={setName} placeholder={hi ? 'जैसे: अमित शर्मा (अंग्रेज़ी में)' : 'Eg. Amit Sharma'} autoCapitalize="words" />
          <Pressable onPress={() => { hTap(); setShowDate(true); }} style={[styles.picker, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : '#fff' }]}>
            <CalendarIcon color={theme.gold2} size={19} />
            <View style={{ marginLeft: 12 }}>
              <Text style={[styles.pLabel, { color: theme.goldText }]}>{hi ? 'जन्म तिथि' : 'DATE OF BIRTH'}</Text>
              <Text style={[styles.pVal, { color: dob ? theme.text : theme.textMuted }]}>{dob ? toDMY(dob) : (hi ? 'चुनने के लिए टैप करें' : 'Tap to choose')}</Text>
            </View>
          </Pressable>
        </View>
        <View style={{ marginTop: 15 }}>
          <GoldButton label={busy ? (hi ? 'गणना हो रही है…' : 'Calculating…') : (hi ? 'अंक निकालें' : 'Calculate')} onPress={calc} />
        </View>
        <Text style={[styles.trust, { color: theme.textMuted }]}>
          {hi ? '🔒 चेल्डियन प्रणाली पर आधारित शुद्ध गणित — कोई अनुमान नहीं। व्याख्या केवल मार्गदर्शन हेतु।'
              : '🔒 Pure math on the Chaldean system — nothing guessed. Interpretation is guidance only.'}
        </Text>
        {busy && <ActivityIndicator color={theme.gold1} style={{ marginTop: 12 }} />}
      </View>

      {/* ── results ── */}
      {profile && !busy && (
        <View style={{ gap: 14, marginTop: 14 }} onLayout={onResultsLayout}>
          <Text style={[styles.section, { color: theme.goldText }]}>{hi ? 'मुख्य त्रिमूर्ति' : 'Core Trinity'}</Text>
          <Trinity theme={theme} L={L} label={hi ? 'मूलांक' : 'Mulank'} tag={hi ? 'ड्राइवर · स्वभाव' : 'Driver · Nature'} data={profile.mulank} />
          <Trinity theme={theme} L={L} label={hi ? 'भाग्यांक' : 'Bhagyank'} tag={hi ? 'कंडक्टर · जीवन-पथ' : 'Conductor · Life Path'} data={profile.bhagyank} />
          <Trinity theme={theme} L={L} label={hi ? 'नामांक' : 'Namank'} tag={hi ? 'चेल्डियन · नाम कंपन' : 'Chaldean · Name'} data={profile.namank} />

          <View style={styles.row2}>
            <MiniStat theme={theme} label={hi ? 'सोल अर्ज' : 'Soul Urge'} n={profile.soulUrge.final} />
            <MiniStat theme={theme} label={hi ? 'व्यक्तित्व' : 'Personality'} n={profile.personality.final} />
            <MiniStat theme={theme} label={hi ? 'व्यक्तिगत वर्ष' : 'Personal Year'} n={profile.personalYear.final} highlight />
          </View>

          {/* ── Lo Shu grid ── */}
          <Text style={[styles.section, { color: theme.goldText }]}>{hi ? 'लो-शु ग्रिड' : 'Lo Shu Grid'}</Text>
          <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.04)' : 'rgba(255,253,247,0.85)' }]}>
            <View style={styles.grid}>
              {LOSHU_ROWS.map((r, ri) => (
                <View key={ri} style={{ flexDirection: 'row' }}>
                  {r.map((n) => {
                    const c = profile.loShu.counts[String(n)] || 0;
                    const on = c > 0;
                    return (
                      <View key={n} style={[styles.gCell, { borderColor: theme.cardBorder, backgroundColor: on ? (theme.isDark ? 'rgba(233,184,80,0.14)' : 'rgba(233,184,80,0.16)') : 'transparent' }]}>
                        <Text style={[styles.gNum, { color: on ? theme.gold1 : theme.textMuted, opacity: on ? 1 : 0.35 }]}>{on ? String(n).repeat(c) : n}</Text>
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
            {profile.loShu.missing.length > 0 && (
              <Text style={[styles.gMiss, { color: theme.textMuted }]}>
                {hi ? 'अनुपस्थित अंक: ' : 'Missing numbers: '}<Text style={{ color: '#e06a5a', fontFamily: fonts.interBold }}>{profile.loShu.missing.join(', ')}</Text>
              </Text>
            )}
            {profile.loShu.presentArrows.length > 0 && (
              <View style={styles.chipWrap}>
                {profile.loShu.presentArrows.map((a) => (
                  <View key={a.key} style={[styles.arrow, { borderColor: theme.gold2 + '55', backgroundColor: theme.isDark ? 'rgba(233,184,80,0.08)' : 'rgba(255,247,224,0.9)' }]}>
                    <Text style={[styles.arrowTxt, { color: theme.gold1 }]}>✦ {L(a)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* ── Lucky ── */}
          {profile.lucky && (
            <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.85)' }]}>
              <Text style={[styles.cardH, { color: theme.gold1 }]}>{hi ? '🍀 आपके शुभ तत्व' : '🍀 Your Lucky Elements'}</Text>
              <LuckyRow theme={theme} k={hi ? 'अंक' : 'Numbers'} v={profile.lucky.numbers.join(', ')} />
              <LuckyRow theme={theme} k={hi ? 'रंग' : 'Colours'} v={LL(profile.lucky.colors).join(', ')} />
              <LuckyRow theme={theme} k={hi ? 'दिन' : 'Days'} v={LL(profile.lucky.days).join(', ')} />
              <LuckyRow theme={theme} k={hi ? 'रत्न' : 'Gem'} v={L(profile.lucky.gem)} />
            </View>
          )}

          {/* ── Number checker ── */}
          <Text style={[styles.section, { color: theme.goldText }]}>{hi ? 'मोबाइल / गाड़ी नंबर मिलान' : 'Mobile / Vehicle Number Match'}</Text>
          <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.85)' }]}>
            <Text style={[styles.sub, { color: theme.textMuted, marginBottom: 8 }]}>
              {hi ? `आपके मूलांक ${profile.mulank.final} से नंबर की मित्रता जाँचें।` : `Check a number's friendship with your Mulank ${profile.mulank.final}.`}
            </Text>
            <View style={styles.checkRow}>
              <TextInput
                value={numInput} onChangeText={setNumInput} keyboardType="number-pad"
                placeholder={hi ? 'जैसे: 98765 43210' : 'Eg. 98765 43210'} placeholderTextColor={theme.textMuted}
                style={[styles.numInput, { borderColor: theme.cardBorder, color: theme.text, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.2)' : '#fff' }]}
              />
              <Pressable onPress={runCheck} style={[styles.checkBtn, { backgroundColor: theme.gold1 }]}>
                <Text style={[styles.checkBtnTxt, { color: theme.buttonInk }]}>{checkBusy ? '…' : (hi ? 'जाँचें' : 'Check')}</Text>
              </Pressable>
            </View>
            {check && (
              <View style={[styles.checkOut, { borderColor: relColor(check.relation) + '66' }]}>
                <Text style={[styles.checkTotal, { color: theme.text }]}>{hi ? 'नंबर योग' : 'Total'}: <Text style={{ color: theme.gold1, fontFamily: fonts.interBold }}>{check.numberTotal}</Text> · {L(check.planet)}</Text>
                <Text style={[styles.checkRel, { color: relColor(check.relation) }]}>{check.relation.key === 'friend' ? '✓ ' : check.relation.key === 'enemy' ? '✕ ' : '• '}{L(check.relation)}</Text>
              </View>
            )}
          </View>

          {/* ── Name correction hint ── */}
          {profile.nameCorrection && (
            <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.05)' : 'rgba(255,250,240,0.7)' }]}>
              <Text style={[styles.cardH, { color: theme.gold1 }]}>{hi ? '✍️ नाम सामंजस्य' : '✍️ Name Harmony'}</Text>
              <Text style={[styles.sub, { color: theme.text }]}>{L(profile.nameCorrection.note)}</Text>
              {!profile.nameCorrection.isHarmonious && profile.nameCorrection.suggestedNameNumbers.length > 0 && (
                <Text style={[styles.sub, { color: theme.textMuted, marginTop: 6 }]}>
                  {hi ? 'सुझाए गए नामांक: ' : 'Suggested name numbers: '}<Text style={{ color: theme.gold1 }}>{profile.nameCorrection.suggestedNameNumbers.join(', ')}</Text>
                </Text>
              )}
            </View>
          )}

          {/* ── AI reading ── */}
          {!reading ? (
            <Pressable onPress={loadReading} disabled={readingBusy} style={[styles.aiBtn, { borderColor: theme.gold2 }]}>
              {readingBusy ? <ActivityIndicator color={theme.gold1} /> : <Text style={[styles.aiBtnTxt, { color: theme.gold1 }]}>{hi ? '🔮 विस्तृत व्याख्या पढ़ें (AI)' : '🔮 Read detailed interpretation (AI)'}</Text>}
            </Pressable>
          ) : (
            <View style={[styles.card, { borderColor: theme.gold2 + '55', backgroundColor: theme.isDark ? 'rgba(233,184,80,0.05)' : 'rgba(255,250,240,0.75)' }]}>
              <Text style={[styles.cardH, { color: theme.gold1 }]}>{hi ? '🔮 विस्तृत व्याख्या' : '🔮 Detailed Interpretation'}</Text>
              <AiBlock theme={theme} title={hi ? 'मूलांक' : 'Mulank'} b={reading.mulank} />
              <AiBlock theme={theme} title={hi ? 'भाग्यांक' : 'Bhagyank'} b={reading.bhagyank} list={reading.bhagyank?.career} />
              <AiBlock theme={theme} title={hi ? 'नामांक' : 'Namank'} b={reading.namank} />
              <AiBlock theme={theme} title={hi ? 'व्यक्तिगत वर्ष' : 'Personal Year'} b={reading.personalYear} />
              {reading.loShu && (
                <View style={{ marginTop: 8 }}>
                  <Text style={[styles.aiHead, { color: theme.gold2 }]}>{hi ? 'लो-शु' : 'Lo Shu'}</Text>
                  {!!reading.loShu.strengths && <Text style={[styles.aiTxt, { color: theme.text }]}>{reading.loShu.strengths}</Text>}
                  {!!reading.loShu.gaps && <Text style={[styles.aiTxt, { color: theme.textMuted, marginTop: 3 }]}>{reading.loShu.gaps}</Text>}
                  {Array.isArray(reading.loShu.remedies) && reading.loShu.remedies.map((r, i) => <Text key={i} style={[styles.aiTxt, { color: theme.text, marginTop: 2 }]}>• {r}</Text>)}
                </View>
              )}
              {!!reading.summary && <Text style={[styles.aiTxt, { color: theme.text, marginTop: 10, fontFamily: fonts.interSemi }]}>{reading.summary}</Text>}
              {!!reading.saralVivaran && (
                <View style={[styles.saral, { borderColor: theme.gold2 + '44' }]}>
                  <Text style={[styles.aiHead, { color: theme.gold2 }]}>{hi ? 'सरल विवरण' : 'In simple words'}</Text>
                  <Text style={[styles.aiTxt, { color: theme.text }]}>{reading.saralVivaran}</Text>
                </View>
              )}
            </View>
          )}

          <Text style={[styles.disc, { color: theme.textMuted }]}>{L(profile.disclaimer)}</Text>
          <View style={{ height: 8 }} />
        </View>
      )}

      <GoldDatePicker
        visible={showDate}
        initialDate={dob || new Date(1995, 0, 1)}
        maximumDate={new Date()}
        onConfirm={(d) => { setDob(d); setShowDate(false); }}
        onCancel={() => setShowDate(false)}
        lang={lang}
      />
    </Page>
  );
}

// ── sub-components ──
function Trinity({ theme, L, label, tag, data }: { theme: any; L: any; label: string; tag: string; data: NumWithPlanet }) {
  return (
    <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.85)' }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <LinearGradient colors={['#fce8a8', '#e9b850']} style={styles.numCircle}>
          <Text style={styles.numBig}>{data.final}</Text>
        </LinearGradient>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={[styles.tLabel, { color: theme.text }]}>{label}</Text>
          <Text style={[styles.tTag, { color: theme.textMuted }]}>{tag}</Text>
          <Text style={[styles.tPlanet, { color: theme.gold1 }]}>{L(data.planet)}</Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            {data.compound !== data.final && <Badge theme={theme} txt={`${data.compound} → ${data.final}`} />}
            {data.isMaster && <Badge theme={theme} txt="Master ✦" gold />}
            {data.isKarmic && <Badge theme={theme} txt="Karmic" warn />}
          </View>
        </View>
      </View>
      {data.remedy && <Text style={[styles.remedy, { color: theme.textMuted }]}>🕉 {L(data.remedy)}</Text>}
    </View>
  );
}
function Badge({ theme, txt, gold, warn }: any) {
  const c = warn ? '#e06a5a' : gold ? theme.gold1 : theme.textMuted;
  return <View style={[styles.badge, { borderColor: c + '77' }]}><Text style={[styles.badgeTxt, { color: c }]}>{txt}</Text></View>;
}
function MiniStat({ theme, label, n, highlight }: any) {
  return (
    <View style={[styles.mini, { borderColor: highlight ? theme.gold2 + '88' : theme.cardBorder, backgroundColor: highlight ? (theme.isDark ? 'rgba(233,184,80,0.10)' : 'rgba(255,247,224,0.9)') : (theme.isDark ? 'rgba(255,255,255,0.02)' : '#fff') }]}>
      <Text style={[styles.miniN, { color: theme.gold1 }]}>{n}</Text>
      <Text style={[styles.miniL, { color: theme.textMuted }]}>{label}</Text>
    </View>
  );
}
function LuckyRow({ theme, k, v }: any) {
  return (
    <View style={styles.luckyRow}>
      <Text style={[styles.luckyK, { color: theme.textMuted }]}>{k}</Text>
      <Text style={[styles.luckyV, { color: theme.text }]}>{v}</Text>
    </View>
  );
}
function AiBlock({ theme, title, b, list }: { theme: any; title: string; b?: { title?: string; meaning?: string } | null; list?: string[] }) {
  if (!b || !b.meaning) return null;
  return (
    <View style={{ marginTop: 8 }}>
      <Text style={[styles.aiHead, { color: theme.gold2 }]}>{b.title || title}</Text>
      <Text style={[styles.aiTxt, { color: theme.text }]}>{b.meaning}</Text>
      {Array.isArray(list) && list.length > 0 && <Text style={[styles.aiTxt, { color: theme.textMuted, marginTop: 2 }]}>{list.join(' · ')}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 18, padding: 15 },
  h1: { fontFamily: fonts.playfairBold, fontSize: 22, lineHeight: 28 },
  sub: { fontFamily: fonts.inter, fontSize: 12.5, lineHeight: 18 },
  trust: { fontFamily: fonts.inter, fontSize: 10.5, lineHeight: 15, marginTop: 10 },
  picker: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14 },
  pLabel: { fontFamily: fonts.interSemi, fontSize: 10, letterSpacing: 0.6 },
  pVal: { fontFamily: fonts.interSemi, fontSize: 14.5, marginTop: 2 },
  section: { fontFamily: fonts.cinzelSemi, fontSize: 13, letterSpacing: 1, marginTop: 4 },

  numCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  numBig: { fontFamily: fonts.playfairBold, fontSize: 26, color: '#2a1c00' },
  tLabel: { fontFamily: fonts.interBold, fontSize: 15.5 },
  tTag: { fontFamily: fonts.inter, fontSize: 10.5, marginTop: 1 },
  tPlanet: { fontFamily: fonts.interSemi, fontSize: 12.5, marginTop: 3 },
  remedy: { fontFamily: fonts.inter, fontSize: 11.5, lineHeight: 16, marginTop: 10 },
  badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  badgeTxt: { fontFamily: fonts.interSemi, fontSize: 9.5 },

  row2: { flexDirection: 'row', gap: 10 },
  mini: { flex: 1, borderWidth: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  miniN: { fontFamily: fonts.playfairBold, fontSize: 22 },
  miniL: { fontFamily: fonts.inter, fontSize: 10, marginTop: 2, textAlign: 'center' },

  grid: { alignSelf: 'center' },
  gCell: { width: 60, height: 54, borderWidth: 1, alignItems: 'center', justifyContent: 'center', margin: 2, borderRadius: 8 },
  gNum: { fontFamily: fonts.interBold, fontSize: 16, letterSpacing: 1 },
  gMiss: { fontFamily: fonts.inter, fontSize: 12, textAlign: 'center', marginTop: 12 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 10 },
  arrow: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  arrowTxt: { fontFamily: fonts.interSemi, fontSize: 10.5 },

  cardH: { fontFamily: fonts.interBold, fontSize: 14, marginBottom: 8 },
  luckyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, gap: 12 },
  luckyK: { fontFamily: fonts.interSemi, fontSize: 12.5 },
  luckyV: { fontFamily: fonts.inter, fontSize: 12.5, flex: 1, textAlign: 'right' },

  checkRow: { flexDirection: 'row', gap: 8 },
  numInput: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontFamily: fonts.interSemi, fontSize: 15 },
  checkBtn: { borderRadius: 12, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  checkBtnTxt: { fontFamily: fonts.interBold, fontSize: 14 },
  checkOut: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  checkTotal: { fontFamily: fonts.inter, fontSize: 12.5 },
  checkRel: { fontFamily: fonts.interBold, fontSize: 14 },

  aiBtn: { borderWidth: 1.4, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  aiBtnTxt: { fontFamily: fonts.interBold, fontSize: 13.5 },
  aiHead: { fontFamily: fonts.interBold, fontSize: 12.5, marginBottom: 2 },
  aiTxt: { fontFamily: fonts.inter, fontSize: 12.5, lineHeight: 18 },
  saral: { borderTopWidth: 1, marginTop: 12, paddingTop: 10 },
  disc: { fontFamily: fonts.inter, fontSize: 10.5, lineHeight: 15, textAlign: 'center', marginTop: 6 },
});
