import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Page } from '../components/Page';
import { BlueprintCanvas } from '../components/BlueprintCanvas';
import { BlueprintViewer } from '../components/BlueprintViewer';
import { GradientText } from '../components/GradientText';
import { GoldButton } from '../components/GoldButton';
import { VastuCompass, CompassDir } from '../components/VastuCompass';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';
import { useLang } from '../i18n/LanguageProvider';
import { hError, hSelect, hSuccess, hTap } from '../lib/haptics';
import { useDialog } from '../components/DialogProvider';
import { useAutoScroll } from '../lib/useAutoScroll';
import { askVastu, VastuAskResponse, VastuDirectionKey } from '../lib/api';
import { Blueprint, BlueprintInput, BpRoom, buildBlueprint, Facing, resizeRoom, Bi } from '../lib/vastuBlueprint';

const L = (o: Bi | undefined | null, hi: boolean) => (o ? (hi ? o.hi : o.en) : '');
const ft = (n: number) => `${Math.round(n)}'`;

const FACINGS: { key: Facing; en: string; hi: string }[] = [
  { key: 'N', en: 'North', hi: 'उत्तर' }, { key: 'E', en: 'East', hi: 'पूर्व' },
  { key: 'S', en: 'South', hi: 'दक्षिण' }, { key: 'W', en: 'West', hi: 'पश्चिम' },
];

// ── screen ───────────────────────────────────────────────────────────────────
export function VastuBlueprintScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const hi = lang === 'hi';
  const dialog = useDialog();
  const { scrollRef, onResultsLayout, scrollToResults } = useAutoScroll();

  const [plotW, setPlotW] = useState('');
  const [plotL, setPlotL] = useState('');
  const [builtW, setBuiltW] = useState('30');
  const [builtL, setBuiltL] = useState('45');
  const [facing, setFacing] = useState<Facing>('E');
  const [showCompass, setShowCompass] = useState(false);
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(2);
  const [opts, setOpts] = useState({ pooja: true, dining: true, study: false, store: false, staircase: true, parking: false, tankOverhead: true, tankUnderground: false });
  const [bp, setBp] = useState<Blueprint | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [ai, setAi] = useState<VastuAskResponse | null>(null);

  const toggle = (k: keyof typeof opts) => { hSelect(); setOpts((o) => ({ ...o, [k]: !o[k] })); };

  const generate = () => {
    const bw = Number(builtW); const bl = Number(builtL);
    if (!(bw >= 15 && bl >= 15)) { hError(); dialog(hi ? 'साइज़' : 'Size', hi ? 'निर्माण की चौड़ाई/लंबाई कम से कम 15 फ़ीट रखें।' : 'Built width/length must be at least 15 ft.'); return; }
    const pw = Number(plotW) || null; const pl = Number(plotL) || null;
    if ((pw && pw < bw) || (pl && pl < bl)) { hError(); dialog(hi ? 'साइज़' : 'Size', hi ? 'प्लॉट का साइज़ निर्माण से छोटा नहीं हो सकता।' : 'Plot size cannot be smaller than the built size.'); return; }
    hTap();
    const input: BlueprintInput = { plotW: pw, plotL: pl, builtW: bw, builtL: bl, facing, bedrooms, bathrooms, ...opts };
    setBp(buildBlueprint(input));
    setSelected(null); setAi(null);
    hSuccess(); scrollToResults();
  };

  const adjust = (room: BpRoom, dw: number, dh: number) => {
    if (!bp) return;
    hSelect();
    setBp(resizeRoom(bp, room.id, room.w + dw, room.h + dh));
  };

  const sendAsk = async () => {
    if (!bp || asking) return;
    const q = question.trim() || (hi ? 'इस नक्शे को सरल भाषा में समझाएँ और बताएँ कि यह वास्तु अनुसार क्यों सही है।' : 'Explain this plan in simple words and why it follows Vastu.');
    hTap(); setAsking(true);
    try {
      const rooms: Partial<Record<string, VastuDirectionKey>> = { kitchen: 'SE', masterBedroom: 'SW', mainEntrance: facing as VastuDirectionKey };
      if (bp.input.pooja) rooms.pujaRoom = 'NE';
      if (bp.input.bathrooms > 0) rooms.toilet = 'NW';
      if (bp.input.staircase) rooms.staircase = 'S';
      if (bp.input.tankOverhead) rooms.overheadWaterTank = 'SW';
      if (bp.input.tankUnderground) rooms.undergroundWater = 'NE';
      const res = await askVastu({ propertyType: 'home', facing: facing as VastuDirectionKey, rooms: rooms as any, question: q });
      setAi(res); setQuestion('');
    } catch (e: any) {
      hError(); dialog(hi ? 'उत्तर नहीं मिला' : 'No answer', e?.message || (hi ? 'कृपया फिर प्रयास करें।' : 'Please try again.'));
    } finally { setAsking(false); }
  };

  const selRoom = bp?.rooms.find((r) => r.id === selected) || null;
  const inputBg = theme.isDark ? 'rgba(0,0,0,0.35)' : '#fff';

  const NumField = ({ label, value, onChange, ph }: { label: string; value: string; onChange: (v: string) => void; ph: string }) => (
    <View style={{ flex: 1 }}>
      <Text style={[styles.fieldLabel, { color: theme.goldText }]}>{label}</Text>
      <TextInput value={value} onChangeText={onChange} keyboardType="numeric" placeholder={ph} placeholderTextColor={theme.textMuted}
        style={[styles.numInput, { color: theme.text, borderColor: theme.cardBorder, backgroundColor: inputBg }]} />
    </View>
  );

  return (
    <Page title={hi ? 'वास्तु नक्शा डिज़ाइनर' : 'Vastu Map Designer'} onBack={() => { hTap(); navigation.goBack(); }} scrollRef={scrollRef}>
      <LinearGradient colors={theme.isDark ? ['#171005', '#000000'] : ['#ffffff', '#fff4dc']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { borderColor: theme.cardBorder }]}>
        <GradientText style={styles.heroTitle}>{hi ? 'नया घर? वास्तु के अनुसार नक्शा बनाएँ' : 'Building a home? Design a Vastu map'}</GradientText>
        <Text style={[styles.heroSub, { color: theme.textSoft }]}>
          {hi ? 'अपनी ज़मीन और ज़रूरतें बताइए — हर कमरे की सही दिशा और साइज़ के साथ सुंदर नक्शा तैयार होगा। फिर हर कमरे का साइज़ खुद बदल भी सकते हैं।'
              : 'Tell us your plot and needs — get a beautiful plan with every room in its right direction and size. Then adjust any room size yourself.'}
        </Text>
      </LinearGradient>

      {/* step 1: sizes + facing */}
      <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.9)' }]}>
        <Text style={[styles.section, { color: theme.goldText }]}>{hi ? '१. ज़मीन व साइज़' : '1. Plot & Size'}</Text>
        <View style={styles.row2}>
          <NumField label={hi ? 'प्लॉट चौड़ाई ft (वैकल्पिक)' : 'Plot width ft (optional)'} value={plotW} onChange={setPlotW} ph="500" />
          <NumField label={hi ? 'प्लॉट लंबाई ft (वैकल्पिक)' : 'Plot length ft (optional)'} value={plotL} onChange={setPlotL} ph="500" />
        </View>
        <View style={[styles.row2, { marginTop: 10 }]}>
          <NumField label={hi ? 'निर्माण चौड़ाई ft *' : 'Built width ft *'} value={builtW} onChange={setBuiltW} ph="30" />
          <NumField label={hi ? 'निर्माण लंबाई ft *' : 'Built length ft *'} value={builtL} onChange={setBuiltL} ph="45" />
        </View>
        <View style={styles.facingRow}>
          <Text style={[styles.fieldLabel, { color: theme.goldText, marginBottom: 0 }]}>{hi ? 'घर का मुँह (सड़क किधर है?)' : 'House faces (road side)'}</Text>
          <Pressable onPress={() => { hTap(); setShowCompass(true); }}>
            <Text style={[styles.compassLink, { color: theme.gold1 }]}>🧭 {hi ? 'कंपास' : 'Compass'}</Text>
          </Pressable>
        </View>
        <View style={styles.chipRow}>
          {FACINGS.map((f) => {
            const on = facing === f.key;
            return (
              <Pressable key={f.key} onPress={() => { hSelect(); setFacing(f.key); }} style={[styles.chip, { borderColor: on ? theme.gold1 : theme.cardBorder, backgroundColor: on ? theme.gold1 : 'transparent' }]}>
                <Text style={[styles.chipTxt, { color: on ? theme.buttonInk : theme.gold1 }]}>{hi ? f.hi : f.en}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* step 2: requirements */}
      <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.9)' }]}>
        <Text style={[styles.section, { color: theme.goldText }]}>{hi ? '२. घर में क्या-क्या चाहिए?' : '2. What do you need?'}</Text>
        <Text style={[styles.fieldLabel, { color: theme.goldText }]}>{hi ? 'शयन कक्ष (बेडरूम)' : 'Bedrooms'}</Text>
        <View style={styles.chipRow}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Pressable key={n} onPress={() => { hSelect(); setBedrooms(n); }} style={[styles.chip, { borderColor: bedrooms === n ? theme.gold1 : theme.cardBorder, backgroundColor: bedrooms === n ? theme.gold1 : 'transparent' }]}>
              <Text style={[styles.chipTxt, { color: bedrooms === n ? theme.buttonInk : theme.gold1 }]}>{n}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={[styles.fieldLabel, { color: theme.goldText, marginTop: 12 }]}>{hi ? 'स्नानघर / शौचालय' : 'Bathrooms'}</Text>
        <View style={styles.chipRow}>
          {[1, 2, 3].map((n) => (
            <Pressable key={n} onPress={() => { hSelect(); setBathrooms(n); }} style={[styles.chip, { borderColor: bathrooms === n ? theme.gold1 : theme.cardBorder, backgroundColor: bathrooms === n ? theme.gold1 : 'transparent' }]}>
              <Text style={[styles.chipTxt, { color: bathrooms === n ? theme.buttonInk : theme.gold1 }]}>{n}</Text>
            </Pressable>
          ))}
        </View>
        <View style={[styles.toggleWrap, { marginTop: 14 }]}>
          {([['pooja', hi ? '🛕 पूजा घर' : '🛕 Pooja room'], ['dining', hi ? '🍽 भोजन कक्ष' : '🍽 Dining'], ['study', hi ? '📚 अध्ययन' : '📚 Study'], ['store', hi ? '📦 भंडार' : '📦 Store'], ['staircase', hi ? '🪜 सीढ़ियाँ' : '🪜 Stairs'], ['parking', hi ? '🚗 पार्किंग' : '🚗 Parking'], ['tankOverhead', hi ? '🚰 छत टंकी' : '🚰 Roof tank'], ['tankUnderground', hi ? '💧 भूमिगत जल' : '💧 Underground']] as [keyof typeof opts, string][]).map(([k, lbl]) => {
            const on = opts[k];
            return (
              <Pressable key={k} onPress={() => toggle(k)} style={[styles.chip, { borderColor: on ? theme.gold1 : theme.cardBorder, backgroundColor: on ? theme.gold1 : 'transparent' }]}>
                <Text style={[styles.chipTxt, { color: on ? theme.buttonInk : theme.gold1 }]}>{on ? '✓ ' : ''}{lbl}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={{ marginTop: 16 }}>
          <GoldButton label={hi ? '🏠 वास्तु नक्शा बनाएँ' : '🏠 Create Vastu Map'} onPress={generate} />
        </View>
      </View>

      {/* result */}
      {bp && (
        <View style={{ gap: 14, marginTop: 14 }} onLayout={onResultsLayout}>
          <View style={[styles.card, { borderColor: theme.gold2 + '55', backgroundColor: theme.isDark ? 'rgba(233,184,80,0.04)' : 'rgba(255,250,236,0.95)' }]}>
            <Text style={[styles.section, { color: theme.goldText, marginTop: 0 }]}>{hi ? 'आपका वास्तु नक्शा' : 'Your Vastu Map'}</Text>
            <Text style={[styles.helper, { color: theme.textMuted }]}>
              {hi ? 'किसी भी कमरे पर टैप करें — नीचे उसका साइज़ बदल सकते हैं।' : 'Tap any room — adjust its size below.'}
            </Text>
            <BlueprintCanvas bp={bp} selected={selected} onSelect={(id) => { hSelect(); setSelected(id === selected ? null : id); }} height={390} />
            <Pressable onPress={() => { hTap(); setFullscreen(true); }} style={[styles.fsBtn, { borderColor: theme.gold2, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.10)' : 'rgba(255,247,224,0.95)' }]}>
              <Text style={[styles.fsBtnTxt, { color: theme.gold1 }]}>⛶ {hi ? 'पूरी स्क्रीन पर देखें (ज़ूम करें)' : 'View fullscreen (zoom)'}</Text>
            </Pressable>

            {selRoom && selRoom.editable && (
              <View style={[styles.editBox, { borderColor: theme.gold2 + '66', backgroundColor: theme.isDark ? 'rgba(233,184,80,0.07)' : 'rgba(255,247,224,0.9)' }]}>
                <Text style={[styles.editTitle, { color: theme.gold1 }]}>{L(selRoom.name, hi)} — {ft(selRoom.w)} × {ft(selRoom.h)}</Text>
                <Text style={[styles.editMeta, { color: theme.textMuted }]}>
                  {hi ? `दिशा-क्षेत्र: ${selRoom.zone} · क्षेत्रफल ${Math.round(selRoom.w * selRoom.h)} वर्ग फ़ीट` : `Zone: ${selRoom.zone} · area ${Math.round(selRoom.w * selRoom.h)} sq ft`}
                </Text>
                <View style={styles.editRow}>
                  <Text style={[styles.editLbl, { color: theme.textSoft }]}>{hi ? 'चौड़ाई' : 'Width'}</Text>
                  <Stepper onMinus={() => adjust(selRoom, -1, 0)} onPlus={() => adjust(selRoom, 1, 0)} theme={theme} value={ft(selRoom.w)} />
                </View>
                <View style={styles.editRow}>
                  <Text style={[styles.editLbl, { color: theme.textSoft }]}>{hi ? 'लंबाई' : 'Length'}</Text>
                  <Stepper onMinus={() => adjust(selRoom, 0, -1)} onPlus={() => adjust(selRoom, 0, 1)} theme={theme} value={ft(selRoom.h)} />
                </View>
                <Text style={[styles.editNote, { color: theme.textMuted }]}>{hi ? 'साइज़ उसी दिशा-क्षेत्र के अंदर रहेगा, ताकि वास्तु न बिगड़े।' : 'Size stays within its direction zone so the Vastu holds.'}</Text>
              </View>
            )}
          </View>

          {/* why each room is there */}
          <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : '#fffdf8' }]}>
            <Text style={[styles.section, { color: theme.goldText, marginTop: 0 }]}>{hi ? 'हर कमरा वहीं क्यों है?' : 'Why each room is there'}</Text>
            {bp.rooms.map((r) => (
              <View key={r.id} style={styles.whyRow}>
                <View style={[styles.whyDot, { backgroundColor: r.color }]} />
                <Text style={[styles.whyTxt, { color: theme.textSoft }]}>
                  <Text style={{ fontFamily: fonts.interBold, color: theme.text }}>{L(r.name, hi)} ({ft(r.w)}×{ft(r.h)}): </Text>
                  {L(r.reason, hi)}
                </Text>
              </View>
            ))}
            {bp.notes.map((n, i) => (
              <Text key={i} style={[styles.noteTxt, { color: theme.textMuted }]}>• {L(n, hi)}</Text>
            ))}
          </View>

          {/* AI */}
          <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : '#fffdf8' }]}>
            <Text style={[styles.section, { color: theme.goldText, marginTop: 0 }]}>{hi ? 'AI से इस नक्शे के बारे में पूछें' : 'Ask AI about this map'}</Text>
            <TextInput
              value={question} onChangeText={setQuestion} multiline
              placeholder={hi ? 'जैसे: रसोई का दरवाज़ा किधर रखूँ?' : 'E.g. which side should the kitchen door open?'}
              placeholderTextColor={theme.textMuted}
              style={[styles.askInput, { color: theme.text, borderColor: theme.cardBorder, backgroundColor: inputBg }]}
            />
            <GoldButton label={asking ? (hi ? 'उत्तर बन रहा है…' : 'Preparing…') : (hi ? '🔮 AI से पूछें' : '🔮 Ask AI')} onPress={sendAsk} variant="ghost" />
            {asking && <ActivityIndicator color={theme.gold1} style={{ marginTop: 10 }} />}
            {ai && (
              <View style={[styles.aiBox, { borderColor: theme.gold2 + '55', backgroundColor: theme.isDark ? 'rgba(233,184,80,0.05)' : 'rgba(255,247,224,0.75)' }]}>
                <Text style={[styles.aiTxt, { color: theme.text }]}>{ai.answer}</Text>
                {ai.remedies.map((r, i) => <Text key={i} style={[styles.aiRem, { color: theme.textMuted }]}>- {r}</Text>)}
              </View>
            )}
          </View>

          <Text style={[styles.disc, { color: theme.textMuted }]}>
            {hi ? 'यह वास्तु-आधारित संकल्पना नक्शा है। निर्माण से पहले संरचना, नक्शा-स्वीकृति व सुरक्षा के लिए योग्य आर्किटेक्ट/इंजीनियर से अवश्य पास कराएँ।'
                : 'This is a Vastu-based concept plan. Before construction, get it approved by a qualified architect/engineer for structure, sanction and safety.'}
          </Text>
        </View>
      )}

      {bp && <BlueprintViewer bp={bp} visible={fullscreen} onClose={() => setFullscreen(false)} />}

      <VastuCompass
        visible={showCompass}
        title={hi ? 'घर की फेसिंग दिशा' : 'House Facing Direction'}
        instruction={hi ? 'प्लॉट के अंदर खड़े होकर सड़क की ओर मुँह करें।' : 'Stand on the plot facing the road.'}
        onPick={(d: CompassDir) => { const f = (['N', 'E', 'S', 'W'] as Facing[]).includes(d as Facing) ? (d as Facing) : d.includes('N') ? 'N' : d.includes('S') ? 'S' : d.includes('E') ? 'E' : 'W'; setFacing(f); setShowCompass(false); }}
        onClose={() => setShowCompass(false)}
      />
    </Page>
  );
}

function Stepper({ value, onMinus, onPlus, theme }: any) {
  return (
    <View style={styles.stepper}>
      <Pressable onPress={onMinus} style={[styles.stepBtn, { borderColor: theme.gold2 }]}><Text style={[styles.stepTxt, { color: theme.gold1 }]}>−</Text></Pressable>
      <Text style={[styles.stepVal, { color: theme.text }]}>{value}</Text>
      <Pressable onPress={onPlus} style={[styles.stepBtn, { borderColor: theme.gold2 }]}><Text style={[styles.stepTxt, { color: theme.gold1 }]}>+</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { borderWidth: 1, borderRadius: 22, padding: 18, overflow: 'hidden' },
  heroTitle: { fontFamily: fonts.playfairBold, fontSize: 22, lineHeight: 28 },
  heroSub: { fontFamily: fonts.inter, fontSize: 12.6, lineHeight: 18.5, marginTop: 8 },
  card: { borderWidth: 1, borderRadius: 20, padding: 16, marginTop: 14 },
  section: { fontFamily: fonts.cinzelSemi, fontSize: 13.5, letterSpacing: 1, marginBottom: 10 },
  helper: { fontFamily: fonts.inter, fontSize: 12, lineHeight: 17, marginBottom: 10 },
  row2: { flexDirection: 'row', gap: 10 },
  fieldLabel: { fontFamily: fonts.interSemi, fontSize: 10.5, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 },
  numInput: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontFamily: fonts.interSemi, fontSize: 15 },
  facingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, marginBottom: 8 },
  compassLink: { fontFamily: fonts.interBold, fontSize: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8, minWidth: 44, alignItems: 'center' },
  chipTxt: { fontFamily: fonts.interSemi, fontSize: 12 },
  toggleWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fsBtn: { borderWidth: 1, borderRadius: 12, paddingVertical: 11, alignItems: 'center', marginTop: 10 },
  fsBtnTxt: { fontFamily: fonts.interBold, fontSize: 12.5 },
  editBox: { borderWidth: 1, borderRadius: 14, padding: 12, marginTop: 12 },
  editTitle: { fontFamily: fonts.interBold, fontSize: 13.5, marginBottom: 2 },
  editMeta: { fontFamily: fonts.inter, fontSize: 11, marginBottom: 8 },
  editRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  editLbl: { fontFamily: fonts.interSemi, fontSize: 12.5 },
  editNote: { fontFamily: fonts.inter, fontSize: 10.6, lineHeight: 15, marginTop: 10 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBtn: { width: 34, height: 34, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  stepTxt: { fontFamily: fonts.interBold, fontSize: 18 },
  stepVal: { fontFamily: fonts.interBold, fontSize: 14, minWidth: 34, textAlign: 'center' },
  whyRow: { flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'flex-start' },
  whyDot: { width: 9, height: 9, borderRadius: 3, marginTop: 4 },
  whyTxt: { flex: 1, fontFamily: fonts.inter, fontSize: 12.2, lineHeight: 17.5 },
  noteTxt: { fontFamily: fonts.inter, fontSize: 11.4, lineHeight: 16.5, marginTop: 8 },
  askInput: { minHeight: 72, borderWidth: 1, borderRadius: 14, padding: 12, fontFamily: fonts.inter, fontSize: 13, textAlignVertical: 'top', marginBottom: 10 },
  aiBox: { borderWidth: 1, borderRadius: 14, padding: 12, marginTop: 10 },
  aiTxt: { fontFamily: fonts.inter, fontSize: 12.8, lineHeight: 19 },
  aiRem: { fontFamily: fonts.inter, fontSize: 11.8, lineHeight: 17, marginTop: 5 },
  disc: { fontFamily: fonts.interSemi, fontSize: 10.8, lineHeight: 15.5, textAlign: 'center', marginTop: 4 },
});
