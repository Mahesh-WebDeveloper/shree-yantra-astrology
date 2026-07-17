import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Page } from '../components/Page';
import { GradientText } from '../components/GradientText';
import { SpeakButton } from '../components/SpeakButton';
import { VedicChart, ChartStyle } from '../components/VedicChart';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radii } from '../theme/tokens';
import { useLang } from '../i18n/LanguageProvider';
import { hTap } from '../lib/haptics';
import {
  EXAMPLE_CHARTS, EXAMPLE_PROFILE, ExampleChart, ChartBox,
  boxExplanation, houseTitle, signLabel, grahaLabel, dignityLabel,
} from '../data/exampleKundli';

type L = 'en' | 'hi';

function DignityDot({ dignity }: { dignity: 'exalt' | 'debil' | 'own' | '' }) {
  if (!dignity) return null;
  const color = dignity === 'debil' ? '#d98a8a' : dignity === 'exalt' ? '#6fcf97' : '#e9b850';
  return <View style={[styles.digDot, { backgroundColor: color }]} />;
}

function BoxCard({ chart, box, l, index }: { chart: ExampleChart; box: ChartBox; l: L; index: number }) {
  const { theme } = useTheme();
  const isLagna = box.house === 1;
  return (
    <View style={[styles.box, { borderColor: isLagna ? theme.gold1 : theme.cardBorder, backgroundColor: theme.cardBg }]}>
      <View style={styles.boxTop}>
        <View style={[styles.houseNo, { backgroundColor: isLagna ? theme.gold1 : (theme.isDark ? 'rgba(233,184,80,0.14)' : 'rgba(255,247,224,0.95)') }]}>
          <Text style={[styles.houseNoTxt, { color: isLagna ? '#1a1206' : theme.gold1 }]}>{box.house}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.boxTitle, { color: theme.text }]}>{houseTitle(box.house, l)}{isLagna ? (l === 'hi' ? '  · लग्न' : '  · Lagna') : ''}</Text>
          <View style={styles.boxMeta}>
            <View style={[styles.signChip, { borderColor: theme.cardBorder }]}>
              <Text style={[styles.signChipTxt, { color: theme.gold2 }]}>{signLabel(box.signIdx, l)}</Text>
            </View>
            {box.planets.length === 0 ? (
              <Text style={[styles.emptyTxt, { color: theme.textMuted }]}>{l === 'hi' ? 'खाली' : 'empty'}</Text>
            ) : box.planets.map((bp) => (
              <View key={bp.planet} style={[styles.grahaChip, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.3)' : '#fff' }]}>
                <DignityDot dignity={bp.dignity} />
                <Text style={[styles.grahaChipTxt, { color: theme.text }]}>{grahaLabel(bp.planet, l)}</Text>
                {!!bp.dignity && <Text style={[styles.digTxt, { color: bp.dignity === 'debil' ? '#d98a8a' : theme.gold2 }]}>{dignityLabel(bp.dignity, l)}</Text>}
              </View>
            ))}
          </View>
        </View>
      </View>
      <Text style={[styles.boxBody, { color: theme.textSoft }]}>{boxExplanation(chart, box, l)}</Text>
    </View>
  );
}

export function ExampleKundliScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const l: L = lang === 'hi' ? 'hi' : 'en';
  const [sel, setSel] = useState(0);
  const [style, setStyle] = useState<ChartStyle>('north');
  const chart = EXAMPLE_CHARTS[sel];

  const listen = useMemo(() => {
    const out: string[] = [
      l === 'hi'
        ? `${chart.nameHi} चार्ट — इसमें देखते हैं ${chart.focusHi}।`
        : `${chart.nameEn} chart — used to see ${chart.focusEn}.`,
      l === 'hi' ? `इस चार्ट का लग्न ${signLabel(chart.ascIdx, l)} राशि है।` : `This chart's Lagna is ${signLabel(chart.ascIdx, l)}.`,
      ...chart.boxes.map((bx) => `${houseTitle(bx.house, l)}. ${boxExplanation(chart, bx, l)}`),
    ];
    return out;
  }, [chart, l]);

  return (
    <Page title={l === 'hi' ? 'उदाहरण कुंडली — समझें' : 'Example Kundli — Explained'} onBack={() => { hTap(); navigation.goBack(); }}>
      {/* profile banner */}
      <LinearGradient
        colors={theme.isDark ? ['#170f04', '#000000'] : ['#ffffff', '#fff3d6']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.hero, { borderColor: theme.cardBorder }]}
      >
        <Text style={[styles.eyebrow, { color: theme.gold2 }]}>{l === 'hi' ? 'एक उदाहरण कुंडली से सीखें' : 'Learn from one example chart'}</Text>
        <GradientText style={styles.heroTitle}>{l === 'hi' ? 'हर खाने को आसान भाषा में समझें' : 'Understand every box in simple words'}</GradientText>
        <View style={styles.profileRow}>
          {[
            [l === 'hi' ? 'नाम' : 'Name', l === 'hi' ? EXAMPLE_PROFILE.nameHi : EXAMPLE_PROFILE.nameEn],
            [l === 'hi' ? 'जन्म' : 'Born', l === 'hi' ? EXAMPLE_PROFILE.dobHi : EXAMPLE_PROFILE.dobEn],
            [l === 'hi' ? 'समय' : 'Time', l === 'hi' ? EXAMPLE_PROFILE.timeHi : EXAMPLE_PROFILE.timeEn],
            [l === 'hi' ? 'स्थान' : 'Place', l === 'hi' ? EXAMPLE_PROFILE.placeHi : EXAMPLE_PROFILE.placeEn],
          ].map(([k, v]) => (
            <View key={k} style={styles.profileItem}>
              <Text style={[styles.profileK, { color: theme.textMuted }]}>{k}</Text>
              <Text style={[styles.profileV, { color: theme.text }]}>{v}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* note: what "16 charts" really means */}
      <View style={[styles.note, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.07)' : '#fff' }]}>
        <Text style={[styles.noteTxt, { color: theme.textSoft }]}>
          {l === 'hi'
            ? '“16 चार्ट” को षोडशवर्ग कहते हैं — ये D1 से D60 तक होते हैं (सिर्फ़ D16 तक नहीं)। नीचे सभी 16 चार्ट दिए हैं। पढ़ने का तरीका हर चार्ट में एक जैसा है — सिर्फ़ चार्ट का मक़सद बदलता है।'
            : 'The “16 charts” are called Shodashavarga — they run from D1 to D60 (not just up to D16). All 16 are below. The reading method is the same in every chart — only the chart’s purpose changes.'}
        </Text>
      </View>

      {/* chart selector */}
      {/* wrapped chips — all charts visible, no fragile horizontal scroll */}
      <View style={styles.chipRow}>
        {EXAMPLE_CHARTS.map((c, i) => {
          const on = i === sel;
          return (
            <Pressable key={c.code} onPress={() => { hTap(); setSel(i); }}
              style={[styles.chip, { borderColor: on ? theme.gold1 : theme.cardBorder, backgroundColor: on ? theme.gold1 : (theme.isDark ? 'rgba(233,184,80,0.08)' : '#fff') }]}>
              <Text style={[styles.chipTxt, { color: on ? (theme.isDark ? '#1a1206' : theme.goldInk) : theme.gold1 }]}>{c.code}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* selected chart focus */}
      <View style={styles.focusHead}>
        <GradientText style={styles.focusTitle}>{chart.code} · {l === 'hi' ? chart.nameHi : chart.nameEn}</GradientText>
        <Text style={[styles.focusSub, { color: theme.textSoft }]}>
          {l === 'hi' ? `इसमें देखते हैं: ${chart.focusHi}` : `Used to see: ${chart.focusEn}`}
        </Text>
        {!!(l === 'hi' ? chart.noteHi : chart.noteEn) && (
          <View style={[styles.chartNote, { borderColor: theme.gold1, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.08)' : 'rgba(255,247,224,0.9)' }]}>
            <Text style={[styles.chartNoteTxt, { color: theme.textSoft }]}>{l === 'hi' ? chart.noteHi : chart.noteEn}</Text>
          </View>
        )}
      </View>

      {/* diamond + style toggle */}
      <View style={[styles.chartWrap, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.28)' : '#fff' }]}>
        <View style={styles.styleRow}>
          {(['north', 'south'] as ChartStyle[]).map((s) => {
            const on = s === style;
            return (
              <Pressable key={s} onPress={() => { hTap(); setStyle(s); }}
                style={[styles.styleBtn, { borderColor: on ? theme.gold1 : theme.cardBorder, backgroundColor: on ? (theme.isDark ? 'rgba(233,184,80,0.16)' : 'rgba(255,247,224,0.95)') : 'transparent' }]}>
                <Text style={[styles.styleTxt, { color: on ? theme.gold1 : theme.textMuted }]}>
                  {l === 'hi' ? (s === 'north' ? 'उत्तर शैली' : 'दक्षिण शैली') : (s === 'north' ? 'North' : 'South')}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <VedicChart planets={chart.apiPlanets} ascendant={signLabel(chart.ascIdx, 'en') /* VedicChart expects EN sign */} style={style} lang={l} size={300} />
        <Text style={[styles.lagnaLine, { color: theme.gold2 }]}>
          {l === 'hi' ? `इस चार्ट का लग्न: ${signLabel(chart.ascIdx, l)} राशि (भाव 1)` : `Lagna of this chart: ${signLabel(chart.ascIdx, l)} (House 1)`}
        </Text>
        <View style={{ marginTop: 12 }}>
          <SpeakButton text={listen} label={l === 'hi' ? 'यह पूरा चार्ट सुनें' : 'Listen to this chart'} />
        </View>
      </View>

      {/* how-to-read legend */}
      <View style={[styles.legend, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.06)' : '#fff' }]}>
        <Text style={[styles.legendHead, { color: theme.goldText }]}>{l === 'hi' ? 'हर खाने में 3 चीज़ें देखें' : 'Read 3 things in every box'}</Text>
        <Text style={[styles.legendTxt, { color: theme.textSoft }]}>
          {l === 'hi'
            ? '1) भाव नंबर (कौन-सा जीवन-क्षेत्र)  ·  2) राशि (कौन-सी राशि)  ·  3) ग्रह (कौन बैठा है)। हरा बिंदु = मज़बूत (उच्च/स्वराशि), लाल बिंदु = कमज़ोर (नीच)।'
            : '1) House number (which life-area)  ·  2) Sign (which rashi)  ·  3) Planet (who sits there). Green dot = strong (exalted/own), red dot = weak (debilitated).'}
        </Text>
      </View>

      {/* box-by-box */}
      <View style={styles.boxList}>
        {chart.boxes.map((bx, i) => <BoxCard key={bx.house} chart={chart} box={bx} l={l} index={i} />)}
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  hero: { borderWidth: 1, borderRadius: 22, padding: 16, overflow: 'hidden' },
  eyebrow: { fontFamily: fonts.interSemi, fontSize: 10.5, letterSpacing: 1.2, textTransform: 'uppercase' },
  heroTitle: { fontFamily: fonts.playfairBold, fontSize: 22, lineHeight: 28, marginTop: 5 },
  profileRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 14 },
  profileItem: {},
  profileK: { fontFamily: fonts.interSemi, fontSize: 9.5, letterSpacing: 0.6, textTransform: 'uppercase' },
  profileV: { fontFamily: fonts.inter, fontSize: 12.5, marginTop: 2 },

  note: { borderWidth: 1, borderRadius: 14, padding: 12, marginTop: 13 },
  noteTxt: { fontFamily: fonts.inter, fontSize: 12, lineHeight: 18 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16, justifyContent: 'center' },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 7, minWidth: 44, alignItems: 'center' },
  chipTxt: { fontFamily: fonts.cinzelSemi, fontSize: 12.5 },

  focusHead: { marginTop: 16 },
  focusTitle: { fontFamily: fonts.playfairBold, fontSize: 20, lineHeight: 26 },
  focusSub: { fontFamily: fonts.inter, fontSize: 12.5, lineHeight: 18, marginTop: 3 },
  chartNote: { borderWidth: 1, borderRadius: 12, padding: 10, marginTop: 9 },
  chartNoteTxt: { fontFamily: fonts.inter, fontSize: 11.5, lineHeight: 17 },

  chartWrap: { borderWidth: 1, borderRadius: 20, padding: 14, marginTop: 12, alignItems: 'center' },
  styleRow: { flexDirection: 'row', gap: 8, marginBottom: 10, alignSelf: 'center' },
  styleBtn: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  styleTxt: { fontFamily: fonts.interSemi, fontSize: 11.5 },
  lagnaLine: { fontFamily: fonts.interSemi, fontSize: 12, marginTop: 12, textAlign: 'center' },

  legend: { borderWidth: 1, borderRadius: 14, padding: 13, marginTop: 14 },
  legendHead: { fontFamily: fonts.cinzelSemi, fontSize: 12.5, letterSpacing: 0.8 },
  legendTxt: { fontFamily: fonts.inter, fontSize: 12, lineHeight: 18, marginTop: 6 },

  boxList: { gap: 11, marginTop: 16 },
  box: { borderWidth: 1, borderRadius: radii.lg, padding: 13 },
  boxTop: { flexDirection: 'row', gap: 11 },
  houseNo: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  houseNoTxt: { fontFamily: fonts.cinzelSemi, fontSize: 13 },
  boxTitle: { fontFamily: fonts.playfairBold, fontSize: 14.5, lineHeight: 19 },
  boxMeta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 6 },
  signChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2.5 },
  signChipTxt: { fontFamily: fonts.interSemi, fontSize: 10.5 },
  emptyTxt: { fontFamily: fonts.inter, fontSize: 11, fontStyle: 'italic' },
  grahaChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2.5 },
  grahaChipTxt: { fontFamily: fonts.interSemi, fontSize: 10.5 },
  digDot: { width: 6, height: 6, borderRadius: 3 },
  digTxt: { fontFamily: fonts.interSemi, fontSize: 9, letterSpacing: 0.3 },
  boxBody: { fontFamily: fonts.inter, fontSize: 12.8, lineHeight: 20, marginTop: 11 },
});
