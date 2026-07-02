import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Page } from '../components/Page';
import { GradientText } from '../components/GradientText';
import { LearnKundliChart } from '../components/LearnKundliChart';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';
import { useLang } from '../i18n/LanguageProvider';
import { hTap, hSelect } from '../lib/haptics';
import { BHAVAS, VARGAS, Bi } from '../data/kundliBhava';

export function KundliExploreScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const hi = lang === 'hi';
  const [mode, setMode] = useState<'bhava' | 'varga'>('bhava');
  const [house, setHouse] = useState(1);
  const L = (o?: Bi | null) => (o ? (hi ? o.hi : o.en) : '');
  const LL = (o?: { en: string[]; hi: string[] } | null) => (o ? (hi ? o.hi : o.en) : []);
  const bhava = BHAVAS[house - 1];

  const askAi = (q: Bi) => { hTap(); navigation.navigate('AiAstrologer', { question: hi ? q.hi : q.en }); };

  const impLabel = (imp: string) => imp === 'core'
    ? (hi ? 'सबसे ज़रूरी' : 'Core') : imp === 'major' ? (hi ? 'प्रमुख' : 'Major') : (hi ? 'विशेष' : 'Special');
  const impColor = (imp: string) => imp === 'core' ? theme.gold1 : imp === 'major' ? '#3ec77a' : theme.textMuted;

  return (
    <Page title={hi ? 'कुंडली सीखें' : 'Learn Kundli'} onBack={() => { hTap(); navigation.goBack(); }}>
      <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.85)' }]}>
        <GradientText style={styles.h1}>{hi ? 'कुंडली में 12 खाने का मतलब' : 'What the 12 houses mean'}</GradientText>
        <Text style={[styles.sub, { color: theme.textMuted }]}>
          {hi ? 'कुंडली में 12 खाने (भाव) होते हैं — हर एक जीवन का एक अलग हिस्सा दर्शाता है। किसी भी खाने पर टैप करके उसका सरल अर्थ जानें। साथ ही सभी 16 वर्ग-चार्ट भी समझें।'
              : 'A kundli has 12 houses — each shows a different part of life. Tap any house to learn its simple meaning. Plus, understand all 16 divisional charts.'}
        </Text>
      </View>

      {/* mode toggle */}
      <View style={styles.toggleRow}>
        {(['bhava', 'varga'] as const).map((m) => {
          const on = mode === m;
          return (
            <Pressable key={m} onPress={() => { hSelect(); setMode(m); }} style={[styles.toggle, { borderColor: on ? theme.gold1 : theme.cardBorder, backgroundColor: on ? theme.gold1 : 'transparent' }]}>
              <Text style={[styles.toggleTxt, { color: on ? theme.buttonInk : theme.gold1 }]}>{m === 'bhava' ? (hi ? '12 भाव (घर)' : '12 Houses') : (hi ? '16 चार्ट' : '16 Charts')}</Text>
            </Pressable>
          );
        })}
      </View>

      {mode === 'bhava' ? (
        <>
          <View style={{ marginTop: 14 }}>
            <LearnKundliChart highlight={house} onSelect={(h) => { hSelect(); setHouse(h); }} size={300} />
          </View>
          <Text style={[styles.hint, { color: theme.textMuted }]}>{hi ? 'नीचे किसी भी भाव पर टैप करें' : 'Tap any house below'}</Text>

          {/* house tabs */}
          <View style={styles.tabWrap}>
            {BHAVAS.map((b) => {
              const on = b.house === house;
              return (
                <Pressable key={b.house} onPress={() => { hSelect(); setHouse(b.house); }} style={[styles.tab, { borderColor: on ? theme.gold1 : theme.cardBorder, backgroundColor: on ? theme.gold1 : (theme.isDark ? 'rgba(233,184,80,0.07)' : '#fff') }]}>
                  <Text style={[styles.tabTxt, { color: on ? theme.buttonInk : theme.gold1 }]}>{b.house}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* selected bhava explanation */}
          <View style={[styles.card, { borderColor: theme.gold2 + '55', backgroundColor: theme.isDark ? 'rgba(233,184,80,0.05)' : 'rgba(255,250,240,0.8)', marginTop: 14 }]}>
            <View style={styles.bhHead}>
              <View style={[styles.bhNum, { backgroundColor: theme.gold1 }]}><Text style={styles.bhNumTxt}>{house}</Text></View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.bhName, { color: theme.text }]}>{L(bhava.name)}</Text>
                <Text style={[styles.bhTitle, { color: theme.gold1 }]}>{L(bhava.title)}</Text>
              </View>
            </View>
            <View style={styles.kwWrap}>
              {LL(bhava.keywords).map((k) => (
                <View key={k} style={[styles.kw, { borderColor: theme.gold2 + '44', backgroundColor: theme.isDark ? 'rgba(233,184,80,0.07)' : 'rgba(255,247,224,0.85)' }]}>
                  <Text style={[styles.kwTxt, { color: theme.gold1 }]}>{k}</Text>
                </View>
              ))}
            </View>
            <Block theme={theme} icon="🟢" head={hi ? 'आसान भाषा में' : 'In simple words'} text={L(bhava.easy)} />
            <Block theme={theme} icon="📘" head={hi ? 'तकनीकी (ज्योतिष)' : 'Technical (Jyotish)'} text={L(bhava.technical)} />
            <Block theme={theme} icon="💡" head={hi ? 'उदाहरण' : 'Example'} text={L(bhava.example)} />
            <Text style={[styles.karaka, { color: theme.textMuted }]}>{hi ? 'कारक ग्रह: ' : 'Significator: '}<Text style={{ color: theme.gold1 }}>{L(bhava.karaka)}</Text></Text>
            <Pressable onPress={() => askAi(bhava.aiPrompt)} style={[styles.aiBtn, { borderColor: theme.gold2 }]}>
              <Text style={[styles.aiBtnTxt, { color: theme.gold1 }]}>🔮 {hi ? 'AI से सीखें — मेरी कुंडली में यह भाव' : 'Learn with AI — this house in my chart'}</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          <Text style={[styles.sectionNote, { color: theme.textMuted }]}>
            {hi ? 'कुंडली सिर्फ़ एक चार्ट नहीं — हर जीवन-क्षेत्र के लिए एक अलग “वर्ग” चार्ट है। D1 पूरा जीवन, D9 विवाह, D10 करियर… इन्हें राजा-महाराजाओं के लिए देखा जाता था।'
                : 'A kundli is not one chart — each life-area has its own "divisional" chart. D1 whole life, D9 marriage, D10 career… traditionally read for kings.'}
          </Text>
          {VARGAS.map((v) => (
            <View key={v.code} style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.85)', marginTop: 12 }]}>
              <View style={styles.vHead}>
                <View style={[styles.vCode, { borderColor: theme.gold2 + '66', backgroundColor: theme.isDark ? 'rgba(233,184,80,0.10)' : 'rgba(255,247,224,0.9)' }]}>
                  <Text style={[styles.vCodeTxt, { color: theme.gold1 }]}>{v.code}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.vName, { color: theme.text }]}>{L(v.name)}</Text>
                  <Text style={[styles.vDiv, { color: impColor(v.importance) }]}>{impLabel(v.importance)}{v.code.startsWith('D') ? ` · ${hi ? 'राशि के' : ''} ${v.divisions} ${hi ? 'भाग' : 'parts'}` : ''}</Text>
                </View>
              </View>
              <Text style={[styles.vEasy, { color: theme.text }]}>{L(v.easy)}</Text>
              <Text style={[styles.vTech, { color: theme.textMuted }]}>{L(v.technical)}</Text>
              <Pressable onPress={() => askAi(v.aiPrompt)} style={[styles.aiBtnSm, { borderColor: theme.gold2 + '88' }]}>
                <Text style={[styles.aiBtnSmTxt, { color: theme.gold1 }]}>🔮 {hi ? 'AI से सीखें' : 'Learn with AI'}</Text>
              </Pressable>
            </View>
          ))}
        </>
      )}
      <Text style={[styles.disc, { color: theme.textMuted }]}>
        {hi ? 'यह सीखने की सरल मार्गदर्शिका है; व्यक्तिगत फल आपकी पूरी कुंडली पर निर्भर करते हैं।' : 'This is a simple learning guide; actual results depend on your full chart.'}
      </Text>
      <View style={{ height: 10 }} />
    </Page>
  );
}

function Block({ theme, icon, head, text }: { theme: any; icon: string; head: string; text: string }) {
  return (
    <View style={{ marginTop: 11 }}>
      <Text style={[styles.blockHead, { color: theme.gold2 }]}>{icon} {head}</Text>
      <Text style={[styles.blockTxt, { color: theme.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 18, padding: 15 },
  h1: { fontFamily: fonts.playfairBold, fontSize: 21, lineHeight: 27 },
  sub: { fontFamily: fonts.inter, fontSize: 12.5, lineHeight: 18, marginTop: 6 },
  toggleRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  toggle: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  toggleTxt: { fontFamily: fonts.interBold, fontSize: 13.5 },
  hint: { fontFamily: fonts.inter, fontSize: 11.5, textAlign: 'center', marginTop: 8 },
  tabWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 10 },
  tab: { width: 44, height: 40, borderWidth: 1, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  tabTxt: { fontFamily: fonts.interBold, fontSize: 15 },
  bhHead: { flexDirection: 'row', alignItems: 'center' },
  bhNum: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  bhNumTxt: { fontFamily: fonts.playfairBold, fontSize: 20, color: '#2a1c00' },
  bhName: { fontFamily: fonts.interBold, fontSize: 16 },
  bhTitle: { fontFamily: fonts.interSemi, fontSize: 12.5, marginTop: 1 },
  kwWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  kw: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  kwTxt: { fontFamily: fonts.interSemi, fontSize: 10.5 },
  blockHead: { fontFamily: fonts.interBold, fontSize: 12, marginBottom: 2 },
  blockTxt: { fontFamily: fonts.inter, fontSize: 13, lineHeight: 19 },
  karaka: { fontFamily: fonts.interSemi, fontSize: 11.5, marginTop: 11 },
  aiBtn: { borderWidth: 1.4, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 14 },
  aiBtnTxt: { fontFamily: fonts.interBold, fontSize: 12.5 },
  sectionNote: { fontFamily: fonts.inter, fontSize: 12.5, lineHeight: 18, marginTop: 14 },
  vHead: { flexDirection: 'row', alignItems: 'center' },
  vCode: { minWidth: 46, height: 34, borderWidth: 1, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  vCodeTxt: { fontFamily: fonts.interBold, fontSize: 13 },
  vName: { fontFamily: fonts.interBold, fontSize: 14.5 },
  vDiv: { fontFamily: fonts.interSemi, fontSize: 10.5, marginTop: 1 },
  vEasy: { fontFamily: fonts.inter, fontSize: 13, lineHeight: 19, marginTop: 10 },
  vTech: { fontFamily: fonts.inter, fontSize: 11.5, lineHeight: 17, marginTop: 5 },
  aiBtnSm: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, marginTop: 11 },
  aiBtnSmTxt: { fontFamily: fonts.interBold, fontSize: 11.5 },
  disc: { fontFamily: fonts.inter, fontSize: 10.5, lineHeight: 15, textAlign: 'center', marginTop: 18 },
});
