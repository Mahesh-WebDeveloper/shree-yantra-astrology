import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Share, Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Page } from '../components/Page';
import { GradientText } from '../components/GradientText';
import { ExplainButton } from '../components/ExplainButton';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';
import { hSelect, hTap } from '../lib/haptics';
import { useLang } from '../i18n/LanguageProvider';
import { AARTIS } from '../data/aartis';
import { MANTRAS_COLL } from '../data/mantraSangrah';
import { STOTRAS } from '../data/stotras';

type Kind = 'aarti' | 'mantra' | 'stotra';
const CREST: Record<Kind, string> = { aarti: '🪔', mantra: '📿', stotra: '📜' };
const FSCALE_KEY = 'sy.devFontScale';
const MALA_OPTIONS = [1, 3, 5, 7, 11, 21, 54, 108];
const GREEN = '#3ec77a';
const strongTap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});

export function DevReaderScreen({ route, navigation }: any) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const hi = lang === 'hi';
  const kind: Kind = route?.params?.kind || 'aarti';
  const id: string = route?.params?.id;

  const item: any = useMemo(() => {
    if (kind === 'mantra') return MANTRAS_COLL.find((m) => m.id === id) || null;
    if (kind === 'stotra') return STOTRAS[id] || null;
    return AARTIS[id] || null;
  }, [kind, id]);

  const [scale, setScale] = useState(1);
  useEffect(() => { AsyncStorage.getItem(FSCALE_KEY).then((v) => { const n = parseFloat(v || ''); if (n >= 0.8 && n <= 1.8) setScale(n); }); }, []);
  const bump = (d: number) => { hSelect(); setScale((s) => { const n = Math.max(0.85, Math.min(1.7, +(s + d).toFixed(2))); AsyncStorage.setItem(FSCALE_KEY, String(n)).catch(() => {}); return n; }); };

  // jaap counter (mantra only), persisted. jaap = total beads; target = malas × 108.
  const isMantra = kind === 'mantra';
  const JK = `sy.jaap.${id}`;
  const [jaap, setJaap] = useState(0);
  const [malas, setMalas] = useState(1);
  const target = malas * 108;
  const done = isMantra && jaap >= target;
  const roundsDone = Math.floor(jaap / 108);
  const bead = jaap % 108 === 0 && jaap > 0 ? 108 : jaap % 108; // show 108 at a mala boundary
  const persist = (j: number, m: number) => AsyncStorage.setItem(JK, JSON.stringify({ j, m })).catch(() => {});
  useEffect(() => { if (!isMantra) return; AsyncStorage.getItem(JK).then((v) => { if (v) try { const o = JSON.parse(v); setJaap(o.j || 0); setMalas(o.m || 1); } catch {} }); }, [JK, isMantra]);

  const speakDone = () => {
    Speech.stop();
    Speech.speak(hi ? 'जाप पूरा हुआ। हरि ॐ।' : 'Your jaap is complete. Well done.', { language: hi ? 'hi-IN' : 'en-US', rate: hi ? 0.9 : 1.0, pitch: 1.0 });
  };
  const tapJaap = () => {
    if (jaap >= target) return; // reached the goal — stop counting
    const nj = jaap + 1;
    if (nj >= target) { // GOAL reached
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Vibration.vibrate([0, 350, 130, 350, 130, 550]);
      speakDone();
    } else if (nj % 108 === 0) { // one mala complete (not the last)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Vibration.vibrate(140);
    } else {
      strongTap();
    }
    setJaap(nj);
    persist(nj, malas);
  };
  const setMalaTarget = (m: number) => { hSelect(); Speech.stop(); const cap = Math.min(jaap, m * 108); setMalas(m); setJaap(cap); persist(cap, m); };
  const resetJaap = () => { hSelect(); Speech.stop(); Vibration.cancel(); setJaap(0); persist(0, malas); };

  if (!item) return <Page title="—" onBack={() => navigation.goBack()}><Text style={{ color: theme.textMuted, textAlign: 'center', marginTop: 40, fontFamily: fonts.inter }}>{hi ? 'नहीं मिला' : 'Not found'}</Text></Page>;

  const titleHi = item.titleHi; const titleEn = item.titleEn; const deity = item.deity;
  const mainText = isMantra ? item.sanskrit : item.lines;
  const onShare = () => { hTap(); Share.share({ message: `${titleHi}\n\n${mainText}\n\n— Shree Yantra Astrology 🙏` }).catch(() => {}); };

  return (
    <Page title={hi ? titleHi.replace(/\n/g, ' ') : titleEn} onBack={() => { hTap(); navigation.goBack(); }} right={<Pressable onPress={onShare} hitSlop={10}><Text style={{ fontSize: 18 }}>📤</Text></Pressable>}>
      {/* hero */}
      <LinearGradient colors={theme.isDark ? ['rgba(233,184,80,0.16)', 'rgba(233,184,80,0.03)'] : ['rgba(255,247,224,0.95)', 'rgba(255,253,247,0.9)']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={[styles.hero, { borderColor: theme.gold3 }]}>
        <LinearGradient colors={theme.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.crest}><Text style={{ fontSize: 32 }}>{CREST[kind]}</Text></LinearGradient>
        <Text style={[styles.heroTitle, { color: theme.text }]}>{hi ? titleHi.replace(/\n/g, ' ') : titleEn}</Text>
        <Text style={[styles.heroDeity, { color: theme.gold2 }]}>{deity}</Text>
      </LinearGradient>

      {/* font size control */}
      <View style={[styles.fontBar, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? '#000' : '#fff' }]}>
        <Text style={[styles.fontLabel, { color: theme.textMuted }]}>{hi ? 'अक्षर का आकार' : 'Text size'}</Text>
        <View style={styles.fontBtns}>
          <Pressable onPress={() => bump(-0.1)} style={[styles.fontBtn, { borderColor: theme.gold3 }]}><Text style={[styles.fontBtnTxt, { color: theme.gold1, fontSize: 13 }]}>A−</Text></Pressable>
          <Pressable onPress={() => bump(0.1)} style={[styles.fontBtn, { borderColor: theme.gold3 }]}><Text style={[styles.fontBtnTxt, { color: theme.gold1, fontSize: 19 }]}>A+</Text></Pressable>
        </View>
      </View>

      {/* intro (stotra) */}
      {kind === 'stotra' && !!(item.introHi) && (
        <View style={[styles.introCard, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.85)' }]}>
          <Text style={[styles.introTxt, { color: theme.textSoft, fontSize: 13.5 * scale, lineHeight: 22 * scale }]}>{hi ? item.introHi : item.introEn}</Text>
        </View>
      )}

      {/* main text — BIG & readable */}
      <View style={[styles.textCard, { borderColor: theme.gold3, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.04)' : 'rgba(255,247,224,0.5)' }]}>
        <Text style={[styles.mainText, { color: theme.text, fontSize: 20 * scale, lineHeight: 38 * scale }]}>{mainText}</Text>
        {isMantra && !!item.roman && <Text style={[styles.roman, { color: theme.textMuted, fontSize: 13.5 * scale, lineHeight: 22 * scale }]}>{item.roman}</Text>}
      </View>

      {/* mantra: meaning + pills + jaap */}
      {isMantra && (
        <>
          {!!(hi ? item.meaningHi : item.meaningEn) && (
            <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? '#000' : 'rgba(255,253,247,0.9)' }]}>
              <Text style={[styles.cardTitle, { color: theme.gold1 }]}>✨ {hi ? 'अर्थ' : 'Meaning'}</Text>
              <Text style={[styles.meaning, { color: theme.textSoft, fontSize: 15 * scale, lineHeight: 24 * scale }]}>{hi ? item.meaningHi : item.meaningEn}</Text>
              <View style={styles.pills}>
                <View style={[styles.pill, { borderColor: theme.gold3 }]}><Text style={[styles.pillTxt, { color: theme.gold1 }]}>🕐 {hi ? item.whenHi : item.whenEn}</Text></View>
                <View style={[styles.pill, { borderColor: theme.gold3 }]}><Text style={[styles.pillTxt, { color: theme.gold1 }]}>🔢 {item.count}</Text></View>
              </View>
              <Text style={[styles.benefit, { color: theme.textMuted, fontSize: 12.5 * scale, lineHeight: 19 * scale }]}>✦ {hi ? item.benefitHi : item.benefitEn}</Text>
            </View>
          )}

          {/* WORLD-CLASS JAAP */}
          <View style={[styles.card, { borderColor: done ? GREEN + '99' : theme.gold2 + '66', backgroundColor: theme.isDark ? 'rgba(233,184,80,0.06)' : 'rgba(255,247,224,0.7)' }]}>
            <Text style={[styles.cardTitle, { color: theme.gold1 }]}>🧎 {hi ? 'जाप — माला गिनें' : 'Jaap — Count Malas'}</Text>

            {/* how many malas */}
            <Text style={[styles.jaapLabel, { color: theme.textMuted }]}>{hi ? 'कितनी मालाएँ करनी हैं?' : 'How many malas?'}</Text>
            <View style={styles.malaRow}>
              {MALA_OPTIONS.map((m) => {
                const on = malas === m;
                return (
                  <Pressable key={m} onPress={() => setMalaTarget(m)} style={[styles.malaChip, { borderColor: on ? theme.gold1 : theme.cardBorder, backgroundColor: on ? theme.gold1 : 'transparent' }]}>
                    <Text style={[styles.malaChipTxt, { color: on ? theme.buttonInk : theme.gold2 }]}>{m}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* progress */}
            <View style={styles.jaapProgHead}>
              <Text style={[styles.jaapProgTxt, { color: theme.gold2 }]}>{hi ? `माला ${roundsDone}/${malas}` : `Mala ${roundsDone}/${malas}`}</Text>
              <Text style={[styles.jaapProgTxt, { color: theme.gold2 }]}>{jaap} / {target}</Text>
            </View>
            <View style={[styles.jaapBar, { backgroundColor: theme.cardBorder }]}><View style={{ width: `${target ? Math.min(100, (jaap / target) * 100) : 0}%`, height: '100%', backgroundColor: done ? GREEN : theme.gold1, borderRadius: 5 }} /></View>

            {/* mantra kept RIGHT HERE so it's readable while tapping */}
            <Text style={[styles.jaapMantra, { color: theme.text, borderColor: theme.cardBorder }]}>{item.sanskrit}</Text>

            {/* the big tap bead */}
            <Pressable onPress={tapJaap} disabled={done} style={({ pressed }) => [styles.tapWrap, pressed && !done && { transform: [{ scale: 0.96 }] }]}>
              <LinearGradient colors={done ? [GREEN, '#1f9e57'] : theme.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tapBead}>
                {done ? (
                  <><Text style={styles.tapDone}>✓</Text><Text style={[styles.tapDoneTxt, { color: '#08351d' }]}>{hi ? 'पूर्ण' : 'Done'}</Text></>
                ) : (
                  <><Text style={[styles.tapCount, { color: theme.buttonInk }]}>{bead}</Text><Text style={[styles.tapOf, { color: theme.buttonInk }]}>/ 108</Text></>
                )}
              </LinearGradient>
            </Pressable>

            {done ? (
              <>
                <Text style={[styles.doneBanner, { color: GREEN }]}>🎉 {hi ? 'जाप पूरा हुआ!' : 'Jaap complete!'}</Text>
                <Pressable onPress={resetJaap} style={{ borderRadius: 14, overflow: 'hidden', marginTop: 12 }}>
                  <LinearGradient colors={theme.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bigReset}><Text style={[styles.bigResetTxt, { color: theme.buttonInk }]}>🔄 {hi ? 'फिर से जाप शुरू करें' : 'Start jaap again'}</Text></LinearGradient>
                </Pressable>
              </>
            ) : (
              <View style={styles.jaapFoot}>
                <Text style={[styles.jaapHint, { color: theme.textMuted }]}>{hi ? 'हर जाप पर वृत्त दबाएँ' : 'Tap the circle for each chant'}</Text>
                <Pressable onPress={resetJaap} hitSlop={8}><Text style={[styles.reset, { color: theme.textMuted }]}>{hi ? 'रीसेट' : 'Reset'}</Text></Pressable>
              </View>
            )}
          </View>
        </>
      )}

      <View style={styles.actions}>
        <Pressable onPress={onShare} style={[styles.actBtn, { borderColor: theme.gold3 }]}><Text style={[styles.actTxt, { color: theme.gold1 }]}>📤 {hi ? 'शेयर करें' : 'Share'}</Text></Pressable>
      </View>
      <ExplainButton text={`${titleHi}\n${mainText}`} context={kind === 'mantra' ? 'मंत्र' : kind === 'stotra' ? 'स्तोत्र' : 'आरती'} />

      <View style={{ height: 20 }} />
    </Page>
  );
}

const styles = StyleSheet.create({
  hero: { borderWidth: 1, borderRadius: 20, alignItems: 'center', paddingVertical: 22, paddingHorizontal: 16, marginBottom: 12 },
  crest: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  heroTitle: { fontFamily: fonts.playfair, fontSize: 21, textAlign: 'center', lineHeight: 28 },
  heroDeity: { fontFamily: fonts.interSemi, fontSize: 12.5, marginTop: 7, textAlign: 'center' },

  fontBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9, marginBottom: 12 },
  fontLabel: { fontFamily: fonts.interSemi, fontSize: 12 },
  fontBtns: { flexDirection: 'row', gap: 8 },
  fontBtn: { width: 40, height: 34, borderWidth: 1, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  fontBtnTxt: { fontFamily: fonts.interBold },

  introCard: { borderWidth: 1, borderRadius: 14, padding: 13, marginBottom: 12 },
  introTxt: { fontFamily: fonts.inter, fontStyle: 'italic' },

  textCard: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 14 },
  mainText: { fontFamily: fonts.devanagari },
  roman: { fontFamily: fonts.inter, fontStyle: 'italic', marginTop: 12 },

  card: { borderWidth: 1, borderRadius: 16, padding: 15, marginBottom: 14 },
  cardTitle: { fontFamily: fonts.cinzelSemi, fontSize: 13.5, letterSpacing: 0.5, marginBottom: 9 },
  meaning: { fontFamily: fonts.inter },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 11 },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 5, alignItems: 'center', justifyContent: 'center' },
  pillTxt: { fontFamily: fonts.interSemi, fontSize: 11, includeFontPadding: false },
  benefit: { fontFamily: fonts.inter, marginTop: 10, fontStyle: 'italic' },

  reset: { fontFamily: fonts.interSemi, fontSize: 12 },
  jaapLabel: { fontFamily: fonts.interSemi, fontSize: 12, marginTop: 2, marginBottom: 9 },
  malaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  malaChip: { minWidth: 42, height: 38, borderWidth: 1.5, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  malaChipTxt: { fontFamily: fonts.interBold, fontSize: 15 },
  jaapProgHead: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  jaapProgTxt: { fontFamily: fonts.interBold, fontSize: 13 },
  jaapBar: { height: 9, borderRadius: 5, marginTop: 8, overflow: 'hidden' },
  jaapMantra: { fontFamily: fonts.devanagari, fontSize: 17, lineHeight: 30, textAlign: 'center', marginTop: 16, borderTopWidth: 1, paddingTop: 14 },
  tapWrap: { alignSelf: 'center', borderRadius: 999, overflow: 'hidden', marginTop: 16 },
  tapBead: { width: 190, height: 190, borderRadius: 95, alignItems: 'center', justifyContent: 'center' },
  tapCount: { fontFamily: fonts.cinzelSemi, fontSize: 68, lineHeight: 74 },
  tapOf: { fontFamily: fonts.interSemi, fontSize: 15, marginTop: 2 },
  tapDone: { fontSize: 66, lineHeight: 72, color: '#08351d' },
  tapDoneTxt: { fontFamily: fonts.interBold, fontSize: 16, marginTop: 2 },
  doneBanner: { fontFamily: fonts.interBold, fontSize: 16, textAlign: 'center', marginTop: 14 },
  bigReset: { paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  bigResetTxt: { fontFamily: fonts.interBold, fontSize: 15.5 },
  jaapFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  jaapHint: { fontFamily: fonts.inter, fontSize: 12 },

  actions: { flexDirection: 'row', gap: 8, marginTop: 2 },
  actBtn: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  actTxt: { fontFamily: fonts.interSemi, fontSize: 12.5 },
});
