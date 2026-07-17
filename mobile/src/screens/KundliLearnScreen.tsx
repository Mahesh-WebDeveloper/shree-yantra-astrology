import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Page } from '../components/Page';
import { GradientText } from '../components/GradientText';
import { SpeakButton } from '../components/SpeakButton';
import { LearnArt } from '../components/icons/LearnArt';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radii } from '../theme/tokens';
import { useLang } from '../i18n/LanguageProvider';
import { hTap } from '../lib/haptics';
import { KUNDLI_CHAPTERS, LearnChapter, LearnBlock } from '../data/kundliLearn';

type L = 'en' | 'hi';

// ── tiny helpers ─────────────────────────────────────────────────────────────
function chapterSpeech(c: LearnChapter, l: L): string[] {
  const out: string[] = [c.title[l], c.intro[l]];
  for (const blk of c.blocks) {
    if (blk.heading) out.push(blk.heading[l]);
    out.push(blk.text[l]);
    if (blk.bullets) for (const bu of blk.bullets) out.push(bu[l]);
    if (blk.example) out.push(blk.example[l]);
  }
  return out;
}

// ── reader: one rich content block ───────────────────────────────────────────
function Block({ block, l }: { block: LearnBlock; l: L }) {
  const { theme } = useTheme();
  return (
    <View style={styles.block}>
      {!!block.heading && (
        <View style={styles.headingRow}>
          <View style={[styles.headingTick, { backgroundColor: theme.gold1 }]} />
          <Text style={[styles.heading, { color: theme.goldText }]}>{block.heading[l]}</Text>
        </View>
      )}
      <Text style={[styles.bodyText, { color: theme.textSoft }]}>{block.text[l]}</Text>

      {!!block.bullets?.length && (
        <View style={styles.bullets}>
          {block.bullets.map((bu, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={[styles.dot, { backgroundColor: theme.gold1 }]} />
              <Text style={[styles.bulletText, { color: theme.text }]}>{bu[l]}</Text>
            </View>
          ))}
        </View>
      )}

      {!!block.example && (
        <View style={[styles.example, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.08)' : 'rgba(255,247,224,0.7)' }]}>
          <Text style={[styles.exampleLabel, { color: theme.gold2 }]}>{l === 'hi' ? 'जैसे' : 'Like'}</Text>
          <Text style={[styles.exampleText, { color: theme.text }]}>{block.example[l]}</Text>
        </View>
      )}
    </View>
  );
}

// ── index: one chapter row ───────────────────────────────────────────────────
function ChapterRow({ chapter, index, l, onOpen }: { chapter: LearnChapter; index: number; l: L; onOpen: () => void }) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={() => { hTap(); onOpen(); }}
      style={({ pressed }) => [
        styles.row,
        { borderColor: theme.cardBorder, backgroundColor: theme.cardBg, opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] },
      ]}
    >
      <View style={[styles.rowArt, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.35)' : '#ffffff' }]}>
        <LearnArt art={chapter.art} dark={theme.isDark} width={70} height={56} />
        <View style={[styles.numChip, { backgroundColor: theme.gold1 }]}>
          <Text style={[styles.numTxt, !theme.isDark && { color: theme.goldInk }]}>{index + 1}</Text>
        </View>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={styles.rowMetaLine}>
          <View style={[styles.levelChip, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.10)' : 'rgba(255,247,224,0.9)' }]}>
            <Text style={[styles.levelTxt, { color: theme.gold1 }]}>{chapter.level[l]}</Text>
          </View>
          <Text style={[styles.readMin, { color: theme.textMuted }]}>{chapter.readMin} {l === 'hi' ? 'मिनट' : 'min'}</Text>
        </View>
        <Text style={[styles.rowTitle, { color: theme.text }]} numberOfLines={2}>{chapter.emoji}  {chapter.title[l]}</Text>
        <Text style={[styles.rowIntro, { color: theme.textMuted }]} numberOfLines={2}>{chapter.intro[l]}</Text>
      </View>
    </Pressable>
  );
}

// ── nav button (prev / next) ─────────────────────────────────────────────────
function NavBtn({ dir, label, sub, disabled, onPress, theme }: any) {
  if (disabled) return <View style={{ flex: 1 }} />;
  return (
    <Pressable
      onPress={() => { hTap(); onPress(); }}
      style={({ pressed }) => [styles.navBtn, { borderColor: theme.cardBorder, backgroundColor: theme.cardBg, opacity: pressed ? 0.85 : 1, alignItems: dir === 'next' ? 'flex-end' : 'flex-start' }]}
    >
      <Text style={[styles.navDir, { color: theme.gold2 }]}>{dir === 'next' ? `${label} →` : `← ${label}`}</Text>
      <Text style={[styles.navSub, { color: theme.text }]} numberOfLines={1}>{sub}</Text>
    </Pressable>
  );
}

export function KundliLearnScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const l: L = lang === 'hi' ? 'hi' : 'en';
  const [selected, setSelected] = useState<number | null>(null);
  const scrollRef = useRef<any>(null);

  // jump back to top on every view change (toc ↔ chapter). NOTE: no Animated.View +
  // transform wrapper around the scroll content — on Android a transformed container inside
  // a ScrollView renders into a fixed-size hardware layer, so content scrolled past its
  // initial bounds turns black. Plain views scroll correctly.
  useEffect(() => {
    const t = setTimeout(() => {
      const s = scrollRef.current;
      if (s?.scrollToPosition) s.scrollToPosition(0, 0, false);
      else if (s?.scrollTo) s.scrollTo({ y: 0, animated: false });
    }, 0);
    return () => clearTimeout(t);
  }, [selected]);

  const goChapter = (i: number) => setSelected(Math.max(0, Math.min(KUNDLI_CHAPTERS.length - 1, i)));

  // ── INDEX (course table of contents) ──────────────────────────────────────
  if (selected === null) {
    const tocListen = [
      l === 'hi' ? 'कुंडली सीखें — शुरुआत से उन्नत तक एक कहानी।' : 'Learn Kundli — a story from the very basics to advanced.',
      ...KUNDLI_CHAPTERS.map((c) => `${c.title[l]}. ${c.intro[l]}`),
    ];
    return (
      <Page title={l === 'hi' ? 'कुंडली सीखें' : 'Learn Kundli'} onBack={() => { hTap(); navigation.goBack(); }} scrollRef={scrollRef}>
        <View>
          <LinearGradient
            colors={theme.isDark ? ['#170f04', '#000000'] : ['#ffffff', '#fff3d6']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[styles.hero, { borderColor: theme.cardBorder }]}
          >
            <View style={{ flex: 1.25, minWidth: 0 }}>
              <Text style={[styles.eyebrow, { color: theme.gold2 }]}>{l === 'hi' ? 'बिलकुल ज़ीरो से शुरू' : 'Starts from zero'}</Text>
              <GradientText style={styles.heroTitle}>{l === 'hi' ? 'कुंडली को कहानी की तरह सीखें' : 'Learn Kundli Like a Story'}</GradientText>
              <Text style={[styles.heroSub, { color: theme.textSoft }]}>
                {l === 'hi'
                  ? 'बिना किसी ज्ञान के भी समझें — कुंडली क्या है, ग्रह-राशि-भाव क्या हैं, और चार्ट का हर खाना कैसे पढ़ें। हर शब्द आसान भाषा में।'
                  : 'No background needed — what a kundli is, what grahas, signs & houses mean, and how to read every box of the chart. Every term in simple words.'}
              </Text>
              <View style={styles.heroMetaRow}>
                <View style={[styles.heroPill, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.10)' : '#ffffff' }]}>
                  <Text style={[styles.heroPillTxt, { color: theme.gold1 }]}>{KUNDLI_CHAPTERS.length} {l === 'hi' ? 'अध्याय' : 'chapters'}</Text>
                </View>
                <View style={[styles.heroPill, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.10)' : '#ffffff' }]}>
                  <Text style={[styles.heroPillTxt, { color: theme.gold1 }]}>{l === 'hi' ? 'सुनने का विकल्प' : 'Listen option'}</Text>
                </View>
              </View>
              <View style={{ marginTop: 12 }}>
                <SpeakButton text={tocListen} label={l === 'hi' ? 'पूरा कोर्स सुनें' : 'Listen to course'} />
              </View>
            </View>
            <View style={styles.heroArt}><LearnArt art="sky" dark={theme.isDark} width={120} height={104} /></View>
          </LinearGradient>

          <Text style={[styles.sourceText, { color: theme.textMuted }]}>
            {l === 'hi'
              ? 'खगोल-विज्ञान के तथ्य अलग रखे गए हैं; ज्योतिष को पारंपरिक व्याख्या के रूप में बताया गया है — ताकि समझ साफ़ और भरोसेमंद रहे।'
              : 'Astronomy facts are kept factual and Jyotish is shown as the traditional interpretation — so the learning stays clear and trustworthy.'}
          </Text>

          {/* CTA → interactive: tap a house → it highlights in the chart + Learn with AI */}
          <Pressable
            onPress={() => { hTap(); navigation.navigate('KundliExplore'); }}
            style={({ pressed }) => [styles.exampleCta, { borderColor: theme.gold1, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.13)' : 'rgba(255,244,214,0.95)', opacity: pressed ? 0.9 : 1, marginBottom: 12 }]}
          >
            <View style={styles.exampleArt}><LearnArt art="readchart" dark={theme.isDark} width={66} height={56} /></View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.exampleKicker, { color: theme.gold2 }]}>{l === 'hi' ? '🔯 कुंडली आसान भाषा में' : '🔯 Kundli made simple'}</Text>
              <Text style={[styles.exampleTitle, { color: theme.text }]}>{l === 'hi' ? 'कुंडली के 12 खाने का मतलब — हर खाना समझें' : 'What the 12 houses mean — understand each one'}</Text>
              <Text style={[styles.exampleSub, { color: theme.textMuted }]}>{l === 'hi' ? '12 भाव + सभी 16 चार्ट, हर एक पर “सीखें”' : '12 houses + all 16 charts, each with "Learn"'}</Text>
            </View>
            <Text style={[styles.exampleArrow, { color: theme.gold1 }]}>›</Text>
          </Pressable>

          {/* CTA → live example chart, box by box */}
          <Pressable
            onPress={() => { hTap(); navigation.navigate('ExampleKundli'); }}
            style={({ pressed }) => [styles.exampleCta, { borderColor: theme.gold1, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.10)' : 'rgba(255,247,224,0.9)', opacity: pressed ? 0.9 : 1 }]}
          >
            <View style={styles.exampleArt}><LearnArt art="readchart" dark={theme.isDark} width={66} height={56} /></View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.exampleKicker, { color: theme.gold2 }]}>{l === 'hi' ? '📊 हाथों-हाथ अभ्यास' : '📊 Hands-on practice'}</Text>
              <Text style={[styles.exampleTitle, { color: theme.text }]}>{l === 'hi' ? 'एक उदाहरण कुंडली — हर खाना समझें' : 'An example kundli — every box explained'}</Text>
              <Text style={[styles.exampleSub, { color: theme.textMuted }]}>{l === 'hi' ? 'D1 से D60 तक सभी 16 चार्ट, आसान हिंदी में' : 'All 16 charts D1→D60, in simple words'}</Text>
            </View>
            <Text style={[styles.exampleArrow, { color: theme.gold1 }]}>›</Text>
          </Pressable>

          <Text style={[styles.tocHead, { color: theme.goldText }]}>{l === 'hi' ? 'आपका सीखने का सफ़र' : 'Your learning journey'}</Text>

          <View style={styles.tocList}>
            {KUNDLI_CHAPTERS.map((c, i) => (
              <ChapterRow key={c.id} chapter={c} index={i} l={l} onOpen={() => goChapter(i)} />
            ))}
          </View>
        </View>
      </Page>
    );
  }

  // ── READER (single chapter) ───────────────────────────────────────────────
  const c = KUNDLI_CHAPTERS[selected];
  const total = KUNDLI_CHAPTERS.length;
  const prev = selected > 0 ? KUNDLI_CHAPTERS[selected - 1] : null;
  const next = selected < total - 1 ? KUNDLI_CHAPTERS[selected + 1] : null;

  return (
    <Page title={l === 'hi' ? 'कुंडली सीखें' : 'Learn Kundli'} onBack={() => { hTap(); setSelected(null); }} scrollRef={scrollRef}>
      <View>
        {/* progress */}
        <View style={styles.progressWrap}>
          <View style={styles.progressTop}>
            <Text style={[styles.progressTxt, { color: theme.textMuted }]}>{l === 'hi' ? 'अध्याय' : 'Chapter'} {selected + 1}/{total}</Text>
            <Pressable onPress={() => { hTap(); setSelected(null); }} hitSlop={8}>
              <Text style={[styles.allLink, { color: theme.gold2 }]}>{l === 'hi' ? 'सभी अध्याय' : 'All chapters'}</Text>
            </Pressable>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: theme.isDark ? 'rgba(233,184,80,0.16)' : 'rgba(95,56,8,0.12)' }]}>
            <View style={[styles.progressFill, { width: `${((selected + 1) / total) * 100}%`, backgroundColor: theme.gold1 }]} />
          </View>
        </View>

        {/* chapter hero */}
        <LinearGradient
          colors={theme.isDark ? ['#170f04', '#000000'] : ['#ffffff', '#fff3d6']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.readerHero, { borderColor: theme.cardBorder }]}
        >
          <View style={styles.readerArt}><LearnArt art={c.art} dark={theme.isDark} width={170} height={128} /></View>
          <View style={styles.readerHeadRow}>
            <View style={[styles.levelChip, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.10)' : 'rgba(255,247,224,0.9)' }]}>
              <Text style={[styles.levelTxt, { color: theme.gold1 }]}>{c.level[l]}</Text>
            </View>
            <Text style={[styles.readMin, { color: theme.textMuted }]}>{c.readMin} {l === 'hi' ? 'मिनट' : 'min'}</Text>
          </View>
          <Text style={[styles.kicker, { color: theme.gold2 }]}>{c.emoji}  {c.kicker[l]}</Text>
          <GradientText style={styles.readerTitle}>{c.title[l]}</GradientText>
          <Text style={[styles.readerIntro, { color: theme.textSoft }]}>{c.intro[l]}</Text>
          <View style={{ marginTop: 13 }}>
            <SpeakButton text={chapterSpeech(c, l)} label={l === 'hi' ? 'यह अध्याय सुनें' : 'Listen to this chapter'} />
          </View>
        </LinearGradient>

        {/* blocks */}
        <View style={styles.blocks}>
          {c.blocks.map((blk, i) => <Block key={i} block={blk} l={l} />)}
        </View>

        {/* prev / next */}
        <View style={styles.navRow}>
          <NavBtn dir="prev" theme={theme} disabled={!prev} label={l === 'hi' ? 'पिछला' : 'Prev'} sub={prev ? prev.title[l] : ''} onPress={() => goChapter(selected - 1)} />
          <NavBtn dir="next" theme={theme} disabled={!next} label={l === 'hi' ? 'अगला' : 'Next'} sub={next ? next.title[l] : ''} onPress={() => goChapter(selected + 1)} />
        </View>

        {!next && (
          <View style={[styles.doneBox, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.07)' : '#ffffff' }]}>
            <Text style={[styles.doneTitle, { color: theme.gold1 }]}>{l === 'hi' ? '🎉 आपने पूरा कोर्स पढ़ लिया!' : '🎉 You finished the whole journey!'}</Text>
            <Text style={[styles.doneBody, { color: theme.text }]}>
              {l === 'hi'
                ? 'अब अपनी असली कुंडली खोलें और जो सीखा उसे आज़माएँ — पहले लग्न, फिर चंद्र राशि, फिर भाव और ग्रह।'
                : 'Now open your real kundli and try what you learned — Lagna first, then Moon sign, then houses and planets.'}
            </Text>
            <Pressable onPress={() => { hTap(); setSelected(null); }} style={({ pressed }) => [styles.doneBtn, { borderColor: theme.cardBorder, opacity: pressed ? 0.85 : 1 }]}>
              <Text style={[styles.doneBtnTxt, { color: theme.gold1 }]}>{l === 'hi' ? '↺ शुरुआत से देखें' : '↺ Back to all chapters'}</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  // hero (index)
  hero: { borderWidth: 1, borderRadius: 22, padding: 16, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyebrow: { fontFamily: fonts.interSemi, fontSize: 10.5, letterSpacing: 1.2, textTransform: 'uppercase' },
  heroTitle: { fontFamily: fonts.playfairBold, fontSize: 23, lineHeight: 29, marginTop: 5 },
  heroSub: { fontFamily: fonts.inter, fontSize: 12.5, lineHeight: 19, marginTop: 8 },
  heroMetaRow: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  heroPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  heroPillTxt: { fontFamily: fonts.interSemi, fontSize: 10.5 },
  heroArt: { width: 120, alignItems: 'center' },

  sourceText: { fontFamily: fonts.inter, fontSize: 11.5, lineHeight: 17, marginTop: 12, paddingHorizontal: 2 },
  exampleCta: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.4, borderRadius: 18, padding: 13, marginTop: 18 },
  exampleArt: { width: 66, height: 56, alignItems: 'center', justifyContent: 'center' },
  exampleKicker: { fontFamily: fonts.interSemi, fontSize: 10.5, letterSpacing: 0.6 },
  exampleTitle: { fontFamily: fonts.playfairBold, fontSize: 15.5, lineHeight: 20, marginTop: 2 },
  exampleSub: { fontFamily: fonts.inter, fontSize: 11.5, lineHeight: 16, marginTop: 3 },
  exampleArrow: { fontFamily: fonts.playfairBold, fontSize: 26, marginLeft: 2 },
  tocHead: { fontFamily: fonts.cinzelSemi, fontSize: 13.5, letterSpacing: 1.1, marginTop: 20, marginBottom: 12 },

  // toc list
  tocList: { gap: 11 },
  row: { flexDirection: 'row', gap: 12, borderWidth: 1, borderRadius: radii.lg, padding: 11, alignItems: 'center' },
  rowArt: { width: 74, height: 60, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  numChip: { position: 'absolute', top: -7, left: -7, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  numTxt: { fontFamily: fonts.cinzelSemi, fontSize: 11, color: '#1a1206' },
  rowMetaLine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  levelChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2.5 },
  levelTxt: { fontFamily: fonts.interSemi, fontSize: 9.5, letterSpacing: 0.6, textTransform: 'uppercase' },
  readMin: { fontFamily: fonts.inter, fontSize: 10.5 },
  rowTitle: { fontFamily: fonts.playfairBold, fontSize: 15.5, lineHeight: 20 },
  rowIntro: { fontFamily: fonts.inter, fontSize: 11.5, lineHeight: 16, marginTop: 3 },

  // progress (reader)
  progressWrap: { marginBottom: 14 },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 },
  progressTxt: { fontFamily: fonts.interSemi, fontSize: 11, letterSpacing: 0.5 },
  allLink: { fontFamily: fonts.interSemi, fontSize: 11.5 },
  progressTrack: { height: 5, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 5, borderRadius: 3 },

  // reader hero
  readerHero: { borderWidth: 1, borderRadius: 22, padding: 16, overflow: 'hidden' },
  readerArt: { alignItems: 'center', marginBottom: 6 },
  readerHeadRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kicker: { fontFamily: fonts.interSemi, fontSize: 10.5, letterSpacing: 1, textTransform: 'uppercase', marginTop: 10 },
  readerTitle: { fontFamily: fonts.playfairBold, fontSize: 24, lineHeight: 30, marginTop: 4 },
  readerIntro: { fontFamily: fonts.inter, fontSize: 13, lineHeight: 20, marginTop: 7 },

  // blocks
  blocks: { marginTop: 18, gap: 18 },
  block: {},
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 9 },
  headingTick: { width: 4, height: 17, borderRadius: 2 },
  heading: { fontFamily: fonts.cinzelSemi, fontSize: 13.5, letterSpacing: 0.6, flex: 1 },
  bodyText: { fontFamily: fonts.inter, fontSize: 13.5, lineHeight: 22 },
  bullets: { gap: 9, marginTop: 12 },
  bulletRow: { flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  bulletText: { flex: 1, fontFamily: fonts.inter, fontSize: 12.8, lineHeight: 19 },
  example: { borderWidth: 1, borderRadius: 14, padding: 12, marginTop: 13 },
  exampleLabel: { fontFamily: fonts.interSemi, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 },
  exampleText: { fontFamily: fonts.inter, fontSize: 12.5, lineHeight: 19, fontStyle: 'italic' },

  // nav
  navRow: { flexDirection: 'row', gap: 10, marginTop: 24 },
  navBtn: { flex: 1, borderWidth: 1, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 13, gap: 3 },
  navDir: { fontFamily: fonts.interSemi, fontSize: 12 },
  navSub: { fontFamily: fonts.inter, fontSize: 11, opacity: 0.9 },

  // done
  doneBox: { borderWidth: 1, borderRadius: 18, padding: 16, marginTop: 16, alignItems: 'center' },
  doneTitle: { fontFamily: fonts.playfairBold, fontSize: 17, textAlign: 'center' },
  doneBody: { fontFamily: fonts.inter, fontSize: 12.8, lineHeight: 20, marginTop: 8, textAlign: 'center' },
  doneBtn: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 9, marginTop: 14 },
  doneBtnTxt: { fontFamily: fonts.interSemi, fontSize: 12.5 },
});
