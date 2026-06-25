import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Dimensions,
  NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Polyline, Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';
import { usePlayer } from '../audio/PlayerProvider';
import { hTap, hPress, hSelect } from '../lib/haptics';
import { BOOKS, byId, ReaderVerse } from '../data/library';
import { setProgress } from '../lib/libraryStore';

const { width: SCREEN_W } = Dimensions.get('window');

/* ── Manuscript palette (parchment "paper" tuned to the black-gold theme) ──
   Light app → warm cream page; dark app → aged dark-parchment page (so it
   doesn't glare white at night, like a palm-leaf manuscript). */
function paperTheme(isDark: boolean) {
  return isDark
    ? { sheet: ['#2b2417', '#211a10'] as const, ink: '#ece0c2', inkSoft: 'rgba(236,224,194,0.72)', frame: 'rgba(233,184,80,0.40)', edge: '#0c0a06', vignette: 'rgba(0,0,0,0.55)' }
    : { sheet: ['#f8efd6', '#efe0bb'] as const, ink: '#43340f', inkSoft: 'rgba(67,52,15,0.78)', frame: 'rgba(151,103,18,0.45)', edge: '#caa64f', vignette: 'rgba(120,86,20,0.18)' };
}

/* one rendered page: either the chapter opener or a single verse */
type Page = { kind: 'cover' } | { kind: 'verse'; verse: ReaderVerse; n: number };

/* corner flourish for the page frame */
function Corner({ color, rotate }: { color: string; rotate: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" style={{ transform: [{ rotate }] }}>
      <Path d="M2 2h8M2 2v8M2 2c6 0 14 6 14 16" stroke={color} strokeWidth={1.1} strokeLinecap="round" />
    </Svg>
  );
}

/** A single parchment sheet with paper vignette, gold frame + corner flourishes. */
function PaperSheet({
  children, pageLabel, pal,
}: { children: React.ReactNode; pageLabel: string; pal: ReturnType<typeof paperTheme> }) {
  return (
    <View style={styles.pageOuter}>
      <LinearGradient colors={pal.sheet} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={[styles.sheet, { shadowColor: pal.edge }]}>
        {/* paper vignette (darker toward the edges) */}
        <Svg style={StyleSheet.absoluteFill as any} pointerEvents="none">
          <Defs>
            <RadialGradient id="pgVig" cx="50%" cy="46%" r="72%">
              <Stop offset="60%" stopColor={pal.vignette} stopOpacity={0} />
              <Stop offset="100%" stopColor={pal.vignette} stopOpacity={1} />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width="100%" height="100%" fill="url(#pgVig)" />
        </Svg>

        {/* thin gold page frame + corner flourishes */}
        <View style={[styles.frame, { borderColor: pal.frame }]} pointerEvents="none" />
        <View style={[styles.cornerTL]} pointerEvents="none"><Corner color={pal.frame} rotate="0deg" /></View>
        <View style={[styles.cornerTR]} pointerEvents="none"><Corner color={pal.frame} rotate="90deg" /></View>
        <View style={[styles.cornerBR]} pointerEvents="none"><Corner color={pal.frame} rotate="180deg" /></View>
        <View style={[styles.cornerBL]} pointerEvents="none"><Corner color={pal.frame} rotate="270deg" /></View>

        <ScrollView contentContainerStyle={styles.sheetBody} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>

        {/* page number footer */}
        <Text style={[styles.pageNum, { color: pal.inkSoft }]}>{pageLabel}</Text>
      </LinearGradient>
    </View>
  );
}

export function LibraryChapterScreen({ navigation, route }: any) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const player = usePlayer();
  const pal = paperTheme(theme.isDark);
  const dim = theme.isDark ? '#b89a5b' : '#8a6f3a';

  const doc = BOOKS[route?.params?.id as string] ?? BOOKS.gita;
  const [chapter, setChapter] = useState<number>(Math.min(route?.params?.chapter ?? 0, doc.chapters.length - 1));
  const ch = doc.chapters[chapter];
  const last = doc.chapters.length - 1;
  const percent = Math.round(((chapter + 1) / doc.chapters.length) * 100);

  const track = byId(doc.trackId);
  const isPlaying = player.track?.id === doc.trackId && player.isPlaying;

  // build the page list: a cover page, then one page per verse
  const pages = useMemo<Page[]>(
    () => [{ kind: 'cover' }, ...ch.verses.map((verse, i) => ({ kind: 'verse' as const, verse, n: i + 1 }))],
    [ch]
  );

  const pagerRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);

  // changing chapter → persist progress + jump back to the cover page
  useEffect(() => {
    setProgress(doc.id, { chapter, percent });
    setPage(0);
    pagerRef.current?.scrollTo({ x: 0, animated: false });
  }, [doc.id, chapter, percent]);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const p = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (p !== page) { setPage(p); hSelect(); }
  };
  const goChapter = (dir: -1 | 1) => { hTap(); setChapter((c) => Math.max(0, Math.min(last, c + dir))); };
  const flipTo = (p: number) => { pagerRef.current?.scrollTo({ x: p * SCREEN_W, animated: true }); };

  return (
    <LinearGradient colors={theme.bgGradient} style={styles.fill}>
      {/* top bar */}
      <View style={[styles.topbar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => { hTap(); navigation.goBack(); }} hitSlop={8} style={({ pressed }) => [styles.iconBtn, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.5)' : 'rgba(176,115,22,0.06)' }, pressed && { transform: [{ scale: 0.92 }] }]}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={theme.gold1} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Polyline points="15 18 9 12 15 6" /></Svg>
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.topTitle, { color: theme.goldText }]} numberOfLines={1}>{doc.title}</Text>
          <Text style={[styles.topEyebrow, { color: dim }]} numberOfLines={1}>Chapter {chapter + 1} of {doc.chapters.length}</Text>
        </View>
        <Pressable onPress={() => { hPress(); player.play(track); }} hitSlop={8} style={({ pressed }) => [styles.iconBtn, { borderColor: isPlaying ? theme.gold1 : theme.cardBorder, backgroundColor: isPlaying ? 'rgba(233,184,80,0.16)' : (theme.isDark ? 'rgba(0,0,0,0.5)' : 'rgba(176,115,22,0.06)') }, pressed && { transform: [{ scale: 0.92 }] }]}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.gold1} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><Path d="M3 18v-6a9 9 0 0 1 18 0v6" /><Path d="M21 19a2 2 0 0 1-2 2h-1v-6h3zM3 19a2 2 0 0 0 2 2h1v-6H3z" /></Svg>
        </Pressable>
      </View>

      {/* paged manuscript */}
      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        style={styles.pager}
      >
        {pages.map((pg, i) => (
          <PaperSheet key={i} pal={pal} pageLabel={`${i + 1} / ${pages.length}`}>
            {pg.kind === 'cover' ? (
              <View style={styles.cover}>
                <Text style={[styles.coverOm, { color: pal.ink }]}>ॐ</Text>
                <Text style={[styles.coverKicker, { color: pal.inkSoft }]}>CHAPTER {chapter + 1}</Text>
                <Text style={[styles.coverTitle, { color: pal.ink }]}>{ch.title}</Text>
                <View style={[styles.coverRule, { backgroundColor: pal.frame }]} />
                <Text style={[styles.coverMeta, { color: pal.inkSoft }]}>{ch.verses.length} verse{ch.verses.length === 1 ? '' : 's'}</Text>
                <Pressable onPress={() => flipTo(1)} style={({ pressed }) => [styles.beginBtn, { borderColor: pal.frame }, pressed && { opacity: 0.7 }]}>
                  <Text style={[styles.beginText, { color: pal.ink }]}>Begin reading</Text>
                  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={pal.ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Polyline points="9 18 15 12 9 6" /></Svg>
                </Pressable>
              </View>
            ) : (
              <View style={styles.verseBody}>
                <Text style={[styles.verseRef, { color: pal.inkSoft, borderColor: pal.frame }]}>श्लोक · {pg.verse.ref}</Text>
                <Text style={[styles.verseSa, { color: pal.ink }]}>{pg.verse.sa}</Text>
                <View style={styles.ornDivider}>
                  <View style={[styles.ornLine, { backgroundColor: pal.frame }]} />
                  <Text style={[styles.ornDot, { color: pal.frame }]}>❖</Text>
                  <View style={[styles.ornLine, { backgroundColor: pal.frame }]} />
                </View>
                <Text style={[styles.verseEn, { color: pal.inkSoft }]}>{pg.verse.en}</Text>
              </View>
            )}
          </PaperSheet>
        ))}
      </ScrollView>

      {/* footer: page dots + prev/next chapter */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 10, borderTopColor: theme.line, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,253,247,0.6)' }]}>
        <Pressable disabled={chapter === 0} onPress={() => goChapter(-1)} hitSlop={6} style={[styles.chBtn, { opacity: chapter === 0 ? 0.35 : 1 }]}>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={theme.goldText} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><Polyline points="15 18 9 12 15 6" /></Svg>
          <Text style={[styles.chBtnText, { color: theme.goldText }]}>Ch {chapter}</Text>
        </Pressable>

        <View style={styles.dots}>
          {pages.map((_, i) => (
            <View key={i} style={[styles.dot, { backgroundColor: i === page ? theme.gold1 : theme.line, width: i === page ? 18 : 6 }]} />
          ))}
        </View>

        <Pressable disabled={chapter === last} onPress={() => goChapter(1)} hitSlop={6} style={[styles.chBtn, { opacity: chapter === last ? 0.35 : 1 }]}>
          <Text style={[styles.chBtnText, { color: theme.goldText }]}>Ch {chapter + 2}</Text>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={theme.goldText} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><Polyline points="9 18 15 12 9 6" /></Svg>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingBottom: 10 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontFamily: fonts.cinzelSemi, fontSize: 13.5, letterSpacing: 1 },
  topEyebrow: { fontFamily: fonts.interSemi, fontSize: 10, letterSpacing: 1.5, marginTop: 2 },

  pager: { flex: 1 },

  /* page = full screen width; the sheet sits inside with a margin so you see the dark "desk" around it */
  pageOuter: { width: SCREEN_W, paddingHorizontal: 16, paddingVertical: 10 },
  sheet: { flex: 1, borderRadius: 12, overflow: 'hidden', padding: 22, shadowOpacity: 0.45, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 12 },
  frame: { position: 'absolute', top: 10, left: 10, right: 10, bottom: 10, borderWidth: 1, borderRadius: 6 },
  cornerTL: { position: 'absolute', top: 12, left: 12 },
  cornerTR: { position: 'absolute', top: 12, right: 12 },
  cornerBR: { position: 'absolute', bottom: 12, right: 12 },
  cornerBL: { position: 'absolute', bottom: 12, left: 12 },
  sheetBody: { flexGrow: 1, justifyContent: 'center', paddingVertical: 18, paddingHorizontal: 12 },
  pageNum: { position: 'absolute', bottom: 14, alignSelf: 'center', fontFamily: fonts.cormorantR, fontSize: 13, letterSpacing: 1 },

  /* chapter cover page */
  cover: { alignItems: 'center', gap: 12 },
  coverOm: { fontFamily: fonts.devanagari, fontSize: 52, lineHeight: 60 },
  coverKicker: { fontFamily: fonts.interSemi, fontSize: 11, letterSpacing: 3 },
  coverTitle: { fontFamily: fonts.playfairBold, fontSize: 25, textAlign: 'center', lineHeight: 32 },
  coverRule: { width: 70, height: 1, marginVertical: 6 },
  coverMeta: { fontFamily: fonts.cormorantR, fontSize: 16, letterSpacing: 0.5 },
  beginBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 9, marginTop: 14 },
  beginText: { fontFamily: fonts.cormorantR, fontSize: 16, letterSpacing: 0.5 },

  /* verse page */
  verseBody: { alignItems: 'center' },
  verseRef: { fontFamily: fonts.interSemi, fontSize: 10.5, letterSpacing: 1.5, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 22, textTransform: 'uppercase' },
  verseSa: { fontFamily: fonts.devanagari, fontSize: 21, lineHeight: 38, textAlign: 'center', marginBottom: 8 },
  ornDivider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 20 },
  ornLine: { width: 46, height: 1 },
  ornDot: { fontSize: 12 },
  verseEn: { fontFamily: fonts.cormorantR, fontSize: 19, lineHeight: 29, textAlign: 'center', fontStyle: 'italic' },

  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 12, borderTopWidth: 1 },
  chBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 64 },
  chBtnText: { fontFamily: fonts.interSemi, fontSize: 12 },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { height: 6, borderRadius: 3 },
});
