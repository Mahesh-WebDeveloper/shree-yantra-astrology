import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, TextInput, Share, LayoutAnimation, Platform, UIManager } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Page } from '../components/Page';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';
import { hTap, hSelect } from '../lib/haptics';
import { useLang } from '../i18n/LanguageProvider';
import { occasionById } from '../data/occasions';
import { ExplainButton } from '../components/ExplainButton';
import { curatedOccasion, Bi } from '../data/occasionContent';
import { aartisFor } from '../data/aartis';
import { getOccasionGuide, askOccasion, OccasionGuide } from '../lib/api';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) UIManager.setLayoutAnimationEnabledExperimental(true);

const GREEN = '#3ec77a';
const RED = '#e06a5a';
const MUHURAT_KEY: Record<string, string> = { vivah: 'vivah', 'grah-pravesh': 'griha-pravesh', vehicle: 'vehicle', business: 'new-business' };
const ease = () => LayoutAnimation.configureNext(LayoutAnimation.create(200, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity));

const Chevron = ({ open, c }: { open: boolean; c: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}><Path d="M6 9l6 6 6-6" /></Svg>
);
const Check = ({ on, c }: { on: boolean; c: string }) => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">{on ? <Path d="M20 6L9 17l-5-5" /> : null}</Svg>
);

// collapsible section — top-level so its open/close state survives parent re-renders (e.g. typing)
function Acc({ theme, icon, title, sub, open, onLayout, children }: { theme: any; icon: string; title: string; sub?: string; open?: boolean; onLayout?: (e: any) => void; children: React.ReactNode }) {
  const [o2, setO2] = useState(open !== false);
  const cardBg = theme.isDark ? '#000000' : 'rgba(255,253,247,0.92)';
  return (
    <View onLayout={onLayout} style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: cardBg }]}>
      <Pressable onPress={() => { hSelect(); ease(); setO2((x) => !x); }} style={styles.accHead} hitSlop={6}>
        <Text style={[styles.cardTitle, { color: theme.gold1, marginBottom: 0, flex: 1 }]}>{icon}  {title}</Text>
        <Chevron open={o2} c={theme.gold2} />
      </Pressable>
      {o2 && (<>{!!sub && <Text style={[styles.cardSub, { color: theme.textMuted }]}>{sub}</Text>}<View style={{ marginTop: 10 }}>{children}</View></>)}
    </View>
  );
}

function shareMantra(title: string, sanskrit: string, meaning: string) { hTap(); Share.share({ message: `${title}\n\n${sanskrit}\n\n${meaning}\n\n— Shree Yantra Astrology 🙏` }).catch(() => {}); }

function MantraCard({ theme, hi, occasionName, m }: { theme: any; hi: boolean; occasionName: string; m: { title?: Bi; sanskrit: string; roman?: string; meaning?: Bi; when?: Bi; count?: string } }) {
  const L = (b?: Bi) => (b ? (hi ? b.hi : b.en) : '');
  return (
    <View style={[styles.mantra, { borderColor: theme.gold3, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.05)' : 'rgba(255,247,224,0.6)' }]}>
      {!!m.title && <Text style={[styles.mantraTitle, { color: theme.gold2 }]}>{L(m.title)}</Text>}
      <Text style={[styles.mantraSa, { color: theme.text }]}>{m.sanskrit}</Text>
      {!!m.roman && <Text style={[styles.mantraRoman, { color: theme.textMuted }]}>{m.roman}</Text>}
      {!!L(m.meaning) && <Text style={[styles.mantraMeaning, { color: theme.textSoft }]}>{L(m.meaning)}</Text>}
      <View style={styles.mantraMeta}>
        {!!L(m.when) && <View style={[styles.metaPill, { borderColor: theme.gold3 }]}><Text style={[styles.metaPillTxt, { color: theme.gold1 }]}>🕐 {L(m.when)}</Text></View>}
        {!!m.count && <View style={[styles.metaPill, { borderColor: theme.gold3 }]}><Text style={[styles.metaPillTxt, { color: theme.gold1 }]}>🔢 {m.count}</Text></View>}
        <Pressable onPress={() => shareMantra(L(m.title), m.sanskrit, L(m.meaning))} style={[styles.metaPill, { borderColor: theme.gold3 }]}><Text style={[styles.metaPillTxt, { color: theme.gold1 }]}>📤 {hi ? 'शेयर' : 'Share'}</Text></Pressable>
      </View>
      <ExplainButton text={`${L(m.title)} — ${m.sanskrit} — ${L(m.meaning)}`} context={occasionName} />
    </View>
  );
}

// one complete aarti as its own mini-accordion (title → full lyrics), for readability
function AartiCard({ theme, hi, a, occasionName }: { theme: any; hi: boolean; a: { titleHi: string; titleEn: string; lines: string }; occasionName: string }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={[styles.aartiCard, { borderColor: theme.gold3, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.05)' : 'rgba(255,247,224,0.55)' }]}>
      <Pressable onPress={() => { hSelect(); ease(); setOpen((x) => !x); }} style={styles.accHead} hitSlop={4}>
        <Text style={[styles.aartiTitle, { color: theme.gold1, flex: 1 }]}>🪔  {hi ? a.titleHi : a.titleEn}</Text>
        <Chevron open={open} c={theme.gold2} />
      </Pressable>
      {open && (<><Text style={[styles.aartiLines, { color: theme.text }]}>{a.lines}</Text><ExplainButton text={`${hi ? a.titleHi : a.titleEn}\n${a.lines}`} context={occasionName} /></>)}
    </View>
  );
}

export function OccasionScreen({ route, navigation }: any) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const insets = useSafeAreaInsets();
  const hi = lang === 'hi';
  const id: string = route?.params?.id;
  const o = occasionById(id);
  const curated = curatedOccasion(id);
  const L = (b?: Bi) => (b ? (hi ? b.hi : b.en) : '');

  const [guide, setGuide] = useState<OccasionGuide | null>(null);
  const [err, setErr] = useState(false);
  const [q, setQ] = useState('');
  const [answer, setAnswer] = useState('');
  const [asking, setAsking] = useState(false);
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const scrollRef = useRef<any>(null);
  const yRef = useRef<Record<string, number>>({});
  const askRef = useRef<TextInput>(null);
  const onY = (key: string) => (e: any) => { yRef.current[key] = e.nativeEvent.layout.y; };
  const scrollTo = (key: string) => { hTap(); const y = yRef.current[key]; if (typeof y === 'number') scrollRef.current?.scrollTo({ y: Math.max(0, y - 10), animated: true }); };

  useEffect(() => {
    if (!o || curated) return;
    let on = true; setGuide(null); setErr(false);
    getOccasionGuide(id, lang).then((r) => { if (on) setGuide(r); }).catch(() => { if (on) setErr(true); });
    return () => { on = false; };
  }, [id, lang, curated]);

  // persisted samagri checklist
  const CK = `sy.samagri.${id}`;
  useEffect(() => { AsyncStorage.getItem(CK).then((v) => { if (v) try { setChecked(new Set(JSON.parse(v))); } catch {} }); }, [CK]);
  const toggleCheck = (i: number) => { hSelect(); ease(); setChecked((s) => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); AsyncStorage.setItem(CK, JSON.stringify([...n])).catch(() => {}); return n; }); };

  const samagriItems: { label: string; reason?: string }[] = useMemo(() => {
    if (curated) return curated.samagri.map((s) => ({ label: L(s.name), reason: L(s.reason) }));
    return (guide?.samagri || []).map((s) => ({ label: s }));
  }, [curated, guide, hi]);

  const ask = async () => {
    const text = q.trim(); if (!text || asking) return; hTap();
    setAsking(true); setAnswer('');
    try { const r = await askOccasion(id, text, lang); setAnswer(r.answer || (hi ? 'क्षमा करें, उत्तर नहीं मिला।' : 'Sorry, no answer.')); }
    catch { setAnswer(hi ? 'अभी उत्तर नहीं मिल पाया — इंटरनेट जाँचें।' : 'Could not answer — check internet.'); }
    finally { setAsking(false); }
  };
  const suggestions = useMemo(() => (hi ? ['इसमें कितना समय लगता है?', 'अब अगला चरण क्या है?', 'कौन सी दिशा शुभ है?'] : ['How long does it take?', 'What is the next step?', 'Which direction is auspicious?']), [hi]);
  const onShare = () => { hTap(); const name = o ? (hi ? o.hi : o.en) : ''; Share.share({ message: `${name} — ${hi ? 'पूरी पूजा विधि Shree Yantra ऐप में देखें' : 'See the full puja vidhi in the Shree Yantra app'} 🙏` }).catch(() => {}); };
  const openMuhurat = () => { hTap(); const key = MUHURAT_KEY[id]; if (key) navigation.navigate('MuhuratFinder', { categoryKey: key }); else navigation.navigate('Muhurat'); };
  const focusAsk = () => { scrollTo('ai'); setTimeout(() => askRef.current?.focus(), 260); };

  if (!o) return <Page title="Shubh Avsar" onBack={() => navigation.goBack()}><Text style={{ color: theme.textMuted, textAlign: 'center', marginTop: 40, fontFamily: fonts.inter }}>Not found</Text></Page>;

  const cardBg = theme.isDark ? '#000000' : 'rgba(255,253,247,0.92)';

  const Bullet = ({ text, color }: { text: string; color?: string }) => (
    <View style={styles.bulletRow}><Text style={[styles.bulletDot, { color: color || theme.gold2 }]}>•</Text><Text style={[styles.bulletTxt, { color: theme.textSoft }]}>{text}</Text></View>
  );
  const MuhuratCTA = () => (
    <Pressable onPress={openMuhurat} style={{ marginTop: 12, borderRadius: 12, overflow: 'hidden' }}>
      <LinearGradient colors={theme.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}><Text style={[styles.ctaTxt, { color: theme.buttonInk }]}>🔎 {hi ? 'अपना शुभ मुहूर्त देखें' : 'Check your Shubh Muhurat'}  →</Text></LinearGradient>
    </Pressable>
  );
  const occName = hi ? o.hi : o.en;

  // quick-action chips (scroll to a section)
  const QUICK = [
    { k: 'vidhi', icon: '📖', label: hi ? 'विधि' : 'Vidhi' },
    { k: 'mantra', icon: '📿', label: hi ? 'मंत्र' : 'Mantra' },
    ...(curated?.saptapadiMantras?.length ? [{ k: 'saptapadi', icon: '👣', label: hi ? 'सप्तपदी' : 'Saptapadi' }] : []),
    { k: 'samagri', icon: '🛒', label: hi ? 'सामग्री' : 'Samagri' },
    { k: 'aarti', icon: '🪔', label: hi ? 'आरती' : 'Aarti' },
    { k: 'ai', icon: '🤖', label: hi ? 'AI गाइड' : 'AI Guide' },
  ];

  const done = checked.size; const total = samagriItems.length;

  return (
    <View style={{ flex: 1 }}>
      <Page title={hi ? o.hi : o.en} scrollRef={scrollRef} onBack={() => { hTap(); navigation.goBack(); }} right={<Pressable onPress={onShare} hitSlop={10}><Text style={{ fontSize: 18 }}>📤</Text></Pressable>} contentStyle={{ paddingBottom: 96 }}>
        {/* ── HERO with mandala ── */}
        <LinearGradient colors={theme.isDark ? [o.accent + '33', o.accent + '06'] : ['rgba(255,247,224,0.96)', 'rgba(255,253,247,0.9)']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={[styles.hero, { borderColor: o.accent + (theme.isDark ? '66' : '40') }]}>
          <View style={[styles.crest, { borderColor: o.accent + '90', backgroundColor: o.accent + '22', shadowColor: o.accent }]}><Text style={{ fontSize: 40 }}>{o.emoji}</Text></View>
          <Text style={[styles.heroHi, { color: theme.text }]}>{hi ? o.hi : o.en}</Text>
          <Text style={[styles.heroSub, { color: theme.gold2 }]}>{hi ? o.subHi : o.subEn}</Text>
          <View style={styles.heroChips}>
            {!!curated?.estTime && <View style={[styles.hChip, { borderColor: o.accent + '77' }]}><Text style={[styles.hChipTxt, { color: theme.text }]}>⏳ {L(curated.estTime)}</Text></View>}
            <View style={[styles.hChip, { borderColor: o.accent + '77' }]}><Text style={[styles.hChipTxt, { color: theme.text }]}>🙏 {hi ? o.deityHi.split(' ')[0] + '…' : o.deityEn.split(' ')[0] + '…'}</Text></View>
            {!!curated?.difficulty && <View style={[styles.hChip, { borderColor: o.accent + '77' }]}><Text style={[styles.hChipTxt, { color: theme.text }]}>📊 {L(curated.difficulty)}</Text></View>}
          </View>
          <Pressable onPress={() => scrollTo('vidhi')} style={{ marginTop: 15, borderRadius: 12, overflow: 'hidden' }}>
            <LinearGradient colors={theme.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.quickStart}><Text style={[styles.quickStartTxt, { color: theme.buttonInk }]}>▶  {hi ? 'पूजा शुरू करें' : 'Start the Puja'}</Text></LinearGradient>
          </Pressable>
        </LinearGradient>

        {/* ── QUICK ACTIONS ── */}
        <View style={styles.quickRow}>
          {QUICK.map((a) => (
            <Pressable key={a.k} onPress={() => (a.k === 'ai' ? focusAsk() : scrollTo(a.k))} style={({ pressed }) => [styles.qa, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? '#000' : '#fff' }, pressed && { transform: [{ scale: 0.95 }] }]}>
              <Text style={styles.qaIcon}>{a.icon}</Text>
              <Text style={[styles.qaLabel, { color: theme.gold1 }]} numberOfLines={1}>{a.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* ── CONTENT ── */}
        {curated ? (
          <>
            <Acc theme={theme} icon="🌸" title={hi ? 'परिचय' : 'Introduction'} open={false}>
              <Text style={[styles.para, { color: theme.textSoft }]}>{L(curated.intro)}</Text>
              <ExplainButton text={L(curated.intro)} context={hi ? o.hi : o.en} />
            </Acc>
            <Acc theme={theme} icon="✨" title={hi ? 'महत्व' : 'Significance'} open={false}>
              {curated.significance.map((b, i) => <Bullet key={i} text={L(b)} />)}
              {!!curated.history && <Text style={[styles.para, { color: theme.textMuted, marginTop: 10, fontStyle: 'italic' }]}>{L(curated.history)}</Text>}
            </Acc>
            <Acc theme={theme} icon="🕉️" title={hi ? 'शुभ मुहूर्त' : 'Auspicious Time'}>
              <Text style={[styles.para, { color: theme.textSoft }]}>{L(curated.muhurat)}</Text>
              {[curated.shubhMonths, curated.varjit, curated.nakshatra, curated.tithi].filter(Boolean).map((b, i) => <Bullet key={i} text={L(b)} />)}
              <MuhuratCTA />
            </Acc>

            {/* Samagri interactive checklist */}
            <View onLayout={onY('samagri')} style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: cardBg }]}>
              <View style={styles.accHead}>
                <Text style={[styles.cardTitle, { color: theme.gold1, marginBottom: 0, flex: 1 }]}>🛒  {hi ? 'सामग्री चेकलिस्ट' : 'Samagri Checklist'}</Text>
                <Text style={[styles.progTxt, { color: theme.gold2 }]}>{done}/{total}</Text>
              </View>
              <View style={[styles.progBar, { backgroundColor: theme.cardBorder }]}><View style={{ width: `${total ? (done / total) * 100 : 0}%`, height: '100%', backgroundColor: GREEN, borderRadius: 4 }} /></View>
              <View style={{ marginTop: 10, gap: 8 }}>
                {samagriItems.map((s, i) => {
                  const on = checked.has(i);
                  return (
                    <Pressable key={i} onPress={() => toggleCheck(i)} style={styles.ckRow}>
                      <View style={[styles.ckBox, { borderColor: on ? GREEN : theme.cardBorder, backgroundColor: on ? GREEN + '22' : 'transparent' }]}><Check on={on} c={GREEN} /></View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.ckLabel, { color: theme.text, textDecorationLine: on ? 'line-through' : 'none', opacity: on ? 0.6 : 1 }]}>{s.label}</Text>
                        {!!s.reason && <Text style={[styles.ckReason, { color: theme.textMuted }]}>{s.reason}</Text>}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Vidhi timeline */}
            <View onLayout={onY('vidhi')} style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: cardBg }]}>
              <Text style={[styles.cardTitle, { color: theme.gold1 }]}>📖  {hi ? 'पूजा विधि — क्रमवार' : 'Step-by-Step Vidhi'}</Text>
              <View style={{ marginTop: 4 }}>
                {curated.steps.map((s, i) => (
                  <View key={i} style={styles.tlRow}>
                    <View style={styles.tlLeft}>
                      <LinearGradient colors={theme.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tlNum}><Text style={[styles.tlNumTxt, { color: theme.buttonInk }]}>{i + 1}</Text></LinearGradient>
                      {i < curated.steps.length - 1 && <View style={[styles.tlLine, { backgroundColor: theme.gold3 }]} />}
                    </View>
                    <View style={{ flex: 1, paddingBottom: 16 }}>
                      <Text style={[styles.stepTitle, { color: theme.text }]}>{L(s.title)}</Text>
                      <Text style={[styles.stepTxt, { color: theme.textSoft }]}>{L(s.what)}</Text>
                      <Text style={[styles.stepWhy, { color: theme.textMuted }]}>✦ {L(s.why)}</Text>
                      {!!L(s.deity) && <View style={[styles.deityPill, { borderColor: theme.gold3 }]}><Text style={[styles.deityPillTxt, { color: theme.gold1 }]}>🙏 {L(s.deity)}</Text></View>}
                      <ExplainButton text={`${L(s.title)}: ${L(s.what)} ${L(s.why)}`} context={hi ? o.hi : o.en} />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Saptapadi premium cards */}
            {!!curated.saptapadiMantras?.length && (
              <View onLayout={onY('saptapadi')} style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: cardBg }]}>
                <Text style={[styles.cardTitle, { color: theme.gold1 }]}>👣  {hi ? 'सप्तपदी — सात फेरे' : 'Saptapadi — Seven Steps'}</Text>
                <View style={{ gap: 12, marginTop: 4 }}>
                  {curated.saptapadiMantras.map((s, i) => (
                    <View key={i} style={[styles.sapCard, { borderColor: o.accent + '66', backgroundColor: theme.isDark ? 'rgba(233,184,80,0.05)' : 'rgba(255,247,224,0.6)' }]}>
                      <View style={styles.sapHead}>
                        <View style={[styles.sapBadge, { backgroundColor: o.accent }]}><Text style={styles.sapBadgeTxt}>{i + 1}</Text></View>
                        <Text style={[styles.sapPada, { color: theme.gold1, flex: 1 }]}>{L(s.pada)}</Text>
                      </View>
                      <Text style={[styles.mantraSa, { color: theme.text, marginTop: 8 }]}>{s.sanskrit}</Text>
                      <Text style={[styles.mantraMeaning, { color: theme.textSoft }]}>{L(s.vachan)}</Text>
                      <ExplainButton text={`${L(s.pada)} — ${s.sanskrit} — ${L(s.vachan)}`} context={hi ? o.hi : o.en} />
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Mantras */}
            <View onLayout={onY('mantra')} style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: cardBg }]}>
              <Text style={[styles.cardTitle, { color: theme.gold1 }]}>📿  {hi ? 'मुख्य मंत्र' : 'Core Mantras'}</Text>
              <View style={{ gap: 12, marginTop: 4 }}>{curated.mantras.map((m, i) => <MantraCard key={i} theme={theme} hi={hi} occasionName={occName} m={m} />)}</View>
            </View>

            {!!curated.mangalashtak && (
              <Acc theme={theme} icon="🔔" title={hi ? 'मंगलाष्टक' : 'Mangalashtak'} open={false}>
                <Text style={[styles.mantraSa, { color: theme.text }]}>{curated.mangalashtak.sanskrit}</Text>
                <Text style={[styles.para, { color: theme.textMuted, marginTop: 8, fontStyle: 'italic' }]}>{L(curated.mangalashtak.note)}</Text>
                <ExplainButton text={`${curated.mangalashtak.sanskrit} — ${L(curated.mangalashtak.note)}`} context={hi ? o.hi : o.en} />
              </Acc>
            )}

            <Acc theme={theme} icon="📍" title={hi ? 'क्षेत्रीय परंपराएँ' : 'Regional Traditions'} open={false}>
              <View style={{ gap: 9 }}>
                {curated.regional.map((r, i) => (
                  <View key={i} style={[styles.regional, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.5)' }]}><Text style={[styles.regionalName, { color: theme.gold2 }]}>{L(r.region)}</Text><Text style={[styles.regionalTxt, { color: theme.textSoft }]}>{L(r.text)}</Text></View>
                ))}
              </View>
            </Acc>

            <Acc theme={theme} icon="✅" title={hi ? 'करें / न करें' : 'Do & Avoid'} open={false}>
              <View style={styles.dodont}>
                <View style={[styles.ddCol, { borderColor: GREEN + '55' }]}><Text style={[styles.ddTitle, { color: GREEN }]}>✓ {hi ? 'करें' : 'Do'}</Text>{curated.dos.map((b, i) => <Bullet key={i} text={L(b)} color={GREEN} />)}</View>
                <View style={[styles.ddCol, { borderColor: RED + '55' }]}><Text style={[styles.ddTitle, { color: RED }]}>✕ {hi ? 'न करें' : 'Avoid'}</Text>{curated.donts.map((b, i) => <Bullet key={i} text={L(b)} color={RED} />)}</View>
              </View>
              {!!curated.mistakes.length && <><Text style={[styles.subHead, { color: RED }]}>⚠️ {hi ? 'सामान्य गलतियाँ' : 'Common mistakes'}</Text>{curated.mistakes.map((b, i) => <Bullet key={i} text={L(b)} color={RED} />)}</>}
            </Acc>

            <Acc theme={theme} icon="❓" title={hi ? 'सामान्य प्रश्न' : 'FAQs'} open={false}>
              <View style={{ gap: 12 }}>{curated.faqs.map((f, i) => <View key={i}><Text style={[styles.faqQ, { color: theme.text }]}>Q. {L(f.q)}</Text><Text style={[styles.faqA, { color: theme.textSoft }]}>{L(f.a)}</Text></View>)}</View>
            </Acc>

            <View style={[styles.note, { borderColor: theme.gold3, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.06)' : 'rgba(233,184,80,0.08)' }]}><Text style={[styles.noteTxt, { color: theme.textMuted }]}>🔒 {L(curated.disclaimer)}</Text></View>
          </>
        ) : (
          /* AI-generated occasions */
          <>
            {err && <Text style={[styles.err, { color: theme.textMuted }]}>{hi ? 'गाइड लोड नहीं हो पाई — इंटरनेट जाँचें।' : 'Could not load — check internet.'}</Text>}
            {!guide && !err && <View style={styles.loading}><ActivityIndicator color={theme.gold1} /><Text style={[styles.loadTxt, { color: theme.textMuted }]}>{hi ? 'प्रामाणिक पूजा विधि तैयार हो रही है…' : 'Preparing an authentic guide…'}</Text></View>}
            {guide && (
              <>
                {!!guide.significance && <Acc theme={theme} icon="✨" title={hi ? 'महत्व' : 'Significance'}><Text style={[styles.para, { color: theme.textSoft }]}>{guide.significance}</Text></Acc>}
                {!!guide.muhurat && <Acc theme={theme} icon="🕉️" title={hi ? 'शुभ मुहूर्त' : 'Auspicious Time'}><Text style={[styles.para, { color: theme.textSoft }]}>{guide.muhurat}</Text><MuhuratCTA /></Acc>}
                {!!samagriItems.length && (
                  <View onLayout={onY('samagri')} style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: cardBg }]}>
                    <View style={styles.accHead}><Text style={[styles.cardTitle, { color: theme.gold1, marginBottom: 0, flex: 1 }]}>🛒  {hi ? 'सामग्री चेकलिस्ट' : 'Samagri Checklist'}</Text><Text style={[styles.progTxt, { color: theme.gold2 }]}>{done}/{total}</Text></View>
                    <View style={[styles.progBar, { backgroundColor: theme.cardBorder }]}><View style={{ width: `${total ? (done / total) * 100 : 0}%`, height: '100%', backgroundColor: GREEN, borderRadius: 4 }} /></View>
                    <View style={{ marginTop: 10, gap: 8 }}>{samagriItems.map((s, i) => { const on = checked.has(i); return (<Pressable key={i} onPress={() => toggleCheck(i)} style={styles.ckRow}><View style={[styles.ckBox, { borderColor: on ? GREEN : theme.cardBorder, backgroundColor: on ? GREEN + '22' : 'transparent' }]}><Check on={on} c={GREEN} /></View><Text style={[styles.ckLabel, { color: theme.text, flex: 1, textDecorationLine: on ? 'line-through' : 'none', opacity: on ? 0.6 : 1 }]}>{s.label}</Text></Pressable>); })}</View>
                  </View>
                )}
                {!!guide.steps.length && (
                  <View onLayout={onY('vidhi')} style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: cardBg }]}>
                    <Text style={[styles.cardTitle, { color: theme.gold1 }]}>📖  {hi ? 'पूजा विधि' : 'Step-by-Step Vidhi'}</Text>
                    <View style={{ marginTop: 4 }}>{guide.steps.map((s, i) => (<View key={i} style={styles.tlRow}><View style={styles.tlLeft}><LinearGradient colors={theme.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tlNum}><Text style={[styles.tlNumTxt, { color: theme.buttonInk }]}>{i + 1}</Text></LinearGradient>{i < guide.steps.length - 1 && <View style={[styles.tlLine, { backgroundColor: theme.gold3 }]} />}</View><Text style={[styles.stepTxt, { color: theme.textSoft, flex: 1, paddingBottom: 16 }]}>{s}</Text></View>))}</View>
                  </View>
                )}
                {!!guide.mantras.length && <View onLayout={onY('mantra')} style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: cardBg }]}><Text style={[styles.cardTitle, { color: theme.gold1 }]}>📿  {hi ? 'मंत्र' : 'Mantras'}</Text><View style={{ gap: 12, marginTop: 4 }}>{guide.mantras.map((m, i) => <MantraCard key={i} theme={theme} hi={hi} occasionName={occName} m={{ sanskrit: m.sanskrit, roman: m.transliteration, meaning: { hi: m.meaning, en: m.meaning }, when: { hi: m.when, en: m.when }, count: m.count }} />)}</View></View>}
                {(!!guide.dos.length || !!guide.donts.length) && <Acc theme={theme} icon="✅" title={hi ? 'करें / न करें' : 'Do & Avoid'} open={false}><View style={styles.dodont}>{!!guide.dos.length && <View style={[styles.ddCol, { borderColor: GREEN + '55' }]}><Text style={[styles.ddTitle, { color: GREEN }]}>✓ {hi ? 'करें' : 'Do'}</Text>{guide.dos.map((d, i) => <Bullet key={i} text={d} color={GREEN} />)}</View>}{!!guide.donts.length && <View style={[styles.ddCol, { borderColor: RED + '55' }]}><Text style={[styles.ddTitle, { color: RED }]}>✕ {hi ? 'न करें' : 'Avoid'}</Text>{guide.donts.map((d, i) => <Bullet key={i} text={d} color={RED} />)}</View>}</View></Acc>}
                {!!guide.faqs.length && <Acc theme={theme} icon="❓" title={hi ? 'सामान्य प्रश्न' : 'FAQs'} open={false}><View style={{ gap: 12 }}>{guide.faqs.map((f, i) => <View key={i}><Text style={[styles.faqQ, { color: theme.text }]}>Q. {f.q}</Text><Text style={[styles.faqA, { color: theme.textSoft }]}>{f.a}</Text></View>)}</View></Acc>}
                {!!guide.disclaimer && <Text style={[styles.disclaimer, { color: theme.textMuted }]}>🔒 {guide.disclaimer}</Text>}
              </>
            )}
          </>
        )}

        {/* Complete aartis (shared library — full lyrics for every occasion) */}
        {(curated || guide) && (
          <Acc theme={theme} onLayout={onY('aarti')} icon="🪔" title={hi ? 'आरती (पूर्ण)' : 'Aarti (complete)'} sub={hi ? 'शीर्षक पर टैप करें — पूरी आरती खुलेगी' : 'Tap a title to open the full aarti'} open={false}>
            <View style={{ gap: 10 }}>
              {aartisFor(id).map((a) => <AartiCard key={a.id} theme={theme} hi={hi} a={a} occasionName={occName} />)}
            </View>
          </Acc>
        )}

        {/* AI assistant */}
        {(curated || guide) && (
          <View onLayout={onY('ai')} style={[styles.card, { marginTop: 2, borderColor: theme.gold2 + '66', backgroundColor: theme.isDark ? 'rgba(233,184,80,0.06)' : 'rgba(255,247,224,0.7)' }]}>
            <Text style={[styles.cardTitle, { color: theme.gold1 }]}>🤖 {hi ? 'AI पंडित जी से पूछें' : 'Ask the AI Pandit'}</Text>
            <View style={styles.sugRow}>{suggestions.map((s) => <Pressable key={s} onPress={() => { hSelect(); setQ(s); }} style={[styles.sug, { borderColor: theme.cardBorder }]}><Text style={[styles.sugTxt, { color: theme.gold2 }]}>{s}</Text></Pressable>)}</View>
            <View style={styles.askRow}>
              <TextInput ref={askRef} value={q} onChangeText={setQ} placeholder={hi ? 'अपना सवाल लिखें…' : 'Type your question…'} placeholderTextColor={theme.textMuted} style={[styles.input, { borderColor: theme.cardBorder, color: theme.text, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.3)' : '#fff' }]} onSubmitEditing={ask} returnKeyType="send" />
              <Pressable onPress={ask} disabled={asking} style={styles.askBtnWrap}><LinearGradient colors={theme.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.askBtn}>{asking ? <ActivityIndicator color={theme.buttonInk} size="small" /> : <Text style={[styles.askBtnTxt, { color: theme.buttonInk }]}>{hi ? 'पूछें' : 'Ask'}</Text>}</LinearGradient></Pressable>
            </View>
            {!!answer && <View style={[styles.answer, { borderColor: theme.gold3, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.22)' : 'rgba(255,255,255,0.6)' }]}><Text style={[styles.answerTxt, { color: theme.text, fontFamily: hi ? fonts.devanagari : fonts.inter }]}>{answer}</Text></View>}
          </View>
        )}
        <Text style={[styles.disclaimer, { color: theme.textMuted }]}>{hi ? '✦ पारंपरिक हिंदू परंपरा पर आधारित; रीति क्षेत्र व परिवार अनुसार भिन्न हो सकती है।' : '✦ Based on traditional Hindu practice; customs vary by region and family.'}</Text>
      </Page>

      {/* ── STICKY BOTTOM CTA ── */}
      {(curated || guide) && (
        <View style={[styles.sticky, { paddingBottom: insets.bottom + 8, borderTopColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.94)' : 'rgba(255,255,255,0.96)' }]}>
          <Pressable onPress={focusAsk} style={({ pressed }) => [styles.stickyBtn, { borderColor: theme.gold2 }, pressed && { opacity: 0.7 }]}><Text style={[styles.stickyTxt, { color: theme.gold1 }]}>🤖 {hi ? 'AI से पूछें' : 'Ask AI'}</Text></Pressable>
          <Pressable onPress={() => scrollTo('vidhi')} style={{ flex: 1, borderRadius: 12, overflow: 'hidden' }}><LinearGradient colors={theme.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.stickyMain}><Text style={[styles.stickyMainTxt, { color: theme.buttonInk }]}>▶ {hi ? 'विधि शुरू करें' : 'Start Ritual'}</Text></LinearGradient></Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { borderWidth: 1, borderRadius: 20, alignItems: 'center', paddingVertical: 22, paddingHorizontal: 16, marginBottom: 14, overflow: 'hidden' },
  crestWrap: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  crest: { width: 72, height: 72, borderRadius: 36, borderWidth: 1, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } },
  heroHi: { fontFamily: fonts.playfair, fontSize: 25, textAlign: 'center' },
  heroSub: { fontFamily: fonts.interSemi, fontSize: 13, marginTop: 5, textAlign: 'center' },
  heroChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, justifyContent: 'center', marginTop: 12 },
  hChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 5, alignItems: 'center', justifyContent: 'center' },
  hChipTxt: { fontFamily: fonts.interSemi, fontSize: 10.5, textAlign: 'center', includeFontPadding: false },
  quickStart: { paddingVertical: 12, paddingHorizontal: 26, borderRadius: 12, alignItems: 'center' },
  quickStartTxt: { fontFamily: fonts.interBold, fontSize: 14 },

  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', marginBottom: 16 },
  qa: { width: '31%', borderWidth: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center', gap: 5 },
  qaIcon: { fontSize: 22 },
  qaLabel: { fontFamily: fonts.interSemi, fontSize: 10.5, textAlign: 'center', includeFontPadding: false },

  card: { borderWidth: 1, borderRadius: 16, padding: 15, marginBottom: 14 },
  accHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontFamily: fonts.cinzelSemi, fontSize: 13.5, letterSpacing: 0.5, marginBottom: 10 },
  cardSub: { fontFamily: fonts.inter, fontSize: 11, marginTop: 6, fontStyle: 'italic' },
  subHead: { fontFamily: fonts.interBold, fontSize: 12, marginTop: 12, marginBottom: 2 },
  para: { fontFamily: fonts.inter, fontSize: 14, lineHeight: 23 },

  cta: { paddingVertical: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  ctaTxt: { fontFamily: fonts.interBold, fontSize: 13.5 },

  progTxt: { fontFamily: fonts.interBold, fontSize: 12 },
  progBar: { height: 7, borderRadius: 4, marginTop: 10, overflow: 'hidden' },
  ckRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  ckBox: { width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  ckLabel: { fontFamily: fonts.interSemi, fontSize: 14, lineHeight: 20 },
  ckReason: { fontFamily: fonts.inter, fontSize: 11, lineHeight: 16, marginTop: 1 },

  tlRow: { flexDirection: 'row', gap: 12 },
  tlLeft: { width: 26, alignItems: 'center' },
  tlNum: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  tlNumTxt: { fontFamily: fonts.interBold, fontSize: 12.5 },
  tlLine: { width: 2, flex: 1, marginTop: 3, borderRadius: 1 },
  stepTitle: { fontFamily: fonts.interBold, fontSize: 13.5, marginBottom: 3 },
  stepTxt: { fontFamily: fonts.inter, fontSize: 13.5, lineHeight: 22 },
  stepWhy: { fontFamily: fonts.inter, fontSize: 11.5, lineHeight: 17, marginTop: 4, fontStyle: 'italic' },
  deityPill: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3, marginTop: 7 },
  deityPillTxt: { fontFamily: fonts.interSemi, fontSize: 10, includeFontPadding: false },

  sapCard: { borderWidth: 1, borderRadius: 14, padding: 13 },
  sapHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sapBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sapBadgeTxt: { fontFamily: fonts.interBold, fontSize: 13, color: '#1a1206' },
  sapPada: { fontFamily: fonts.interBold, fontSize: 13 },

  mantra: { borderWidth: 1, borderRadius: 14, padding: 13 },
  mantraTitle: { fontFamily: fonts.interSemi, fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 },
  mantraSa: { fontFamily: fonts.devanagari, fontSize: 16.5, lineHeight: 30 },
  mantraRoman: { fontFamily: fonts.inter, fontSize: 12, fontStyle: 'italic', marginTop: 6, lineHeight: 18 },
  mantraMeaning: { fontFamily: fonts.inter, fontSize: 13.5, lineHeight: 22, marginTop: 8 },
  mantraMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 10 },
  metaPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, alignItems: 'center', justifyContent: 'center' },
  metaPillTxt: { fontFamily: fonts.interSemi, fontSize: 10.5, textAlign: 'center', textAlignVertical: 'center', includeFontPadding: false },

  aartiCard: { borderWidth: 1, borderRadius: 12, padding: 12 },
  aartiTitle: { fontFamily: fonts.interSemi, fontSize: 13.5, lineHeight: 20 },
  aartiLines: { fontFamily: fonts.devanagari, fontSize: 15.5, lineHeight: 31, marginTop: 9 },

  regional: { borderWidth: 1, borderRadius: 12, padding: 11 },
  regionalName: { fontFamily: fonts.interBold, fontSize: 12.5, marginBottom: 4 },
  regionalTxt: { fontFamily: fonts.inter, fontSize: 13, lineHeight: 21 },

  dodont: { flexDirection: 'row', gap: 10 },
  ddCol: { flex: 1, borderWidth: 1, borderRadius: 14, padding: 12 },
  ddTitle: { fontFamily: fonts.interBold, fontSize: 12.5, marginBottom: 4 },
  bulletRow: { flexDirection: 'row', gap: 7, marginTop: 6 },
  bulletDot: { fontFamily: fonts.interBold, fontSize: 13, lineHeight: 19 },
  bulletTxt: { flex: 1, fontFamily: fonts.inter, fontSize: 13, lineHeight: 21 },

  faqQ: { fontFamily: fonts.interSemi, fontSize: 13 },
  faqA: { fontFamily: fonts.inter, fontSize: 13, lineHeight: 21, marginTop: 3 },

  note: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 4 },
  noteTxt: { fontFamily: fonts.inter, fontSize: 12, lineHeight: 18 },

  err: { fontFamily: fonts.inter, fontSize: 13, textAlign: 'center', paddingVertical: 30 },
  loading: { paddingVertical: 44, alignItems: 'center', gap: 12 },
  loadTxt: { fontFamily: fonts.inter, fontSize: 12.5, textAlign: 'center', paddingHorizontal: 30, lineHeight: 18 },

  sugRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 11 },
  sug: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  sugTxt: { fontFamily: fonts.inter, fontSize: 11 },
  askRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: { flex: 1, height: 44, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontFamily: fonts.inter, fontSize: 13 },
  askBtnWrap: { borderRadius: 12, overflow: 'hidden' },
  askBtn: { minWidth: 62, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  askBtnTxt: { fontFamily: fonts.interBold, fontSize: 13 },
  answer: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 12 },
  answerTxt: { fontSize: 14, lineHeight: 22 },

  disclaimer: { fontFamily: fonts.inter, fontSize: 10.5, lineHeight: 15, textAlign: 'center', marginTop: 8 },

  sticky: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingTop: 10, borderTopWidth: 1 },
  stickyBtn: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 16, height: 46, alignItems: 'center', justifyContent: 'center' },
  stickyTxt: { fontFamily: fonts.interBold, fontSize: 13 },
  stickyMain: { flex: 1, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stickyMainTxt: { fontFamily: fonts.interBold, fontSize: 14 },
});
