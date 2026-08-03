import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Dimensions,
  NativeSyntheticEvent, NativeScrollEvent, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Polyline, Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';
import { hTap, hSelect } from '../lib/haptics';
import { useLang } from '../i18n/LanguageProvider';
import { ContentBook, getBook } from '../lib/api';
import { cmsBookId } from '../lib/cmsBooks';
import { setProgress } from '../lib/libraryStore';

const { width: SCREEN_W } = Dimensions.get('window');

function paperTheme(isDark: boolean) {
  return isDark
    ? { sheet: ['#2b2417', '#211a10'] as const, ink: '#ece0c2', inkSoft: 'rgba(236,224,194,0.72)', frame: 'rgba(233,184,80,0.40)', edge: '#0c0a06', vignette: 'rgba(0,0,0,0.55)' }
    : { sheet: ['#f8efd6', '#efe0bb'] as const, ink: '#43340f', inkSoft: 'rgba(67,52,15,0.78)', frame: 'rgba(151,103,18,0.45)', edge: '#caa64f', vignette: 'rgba(120,86,20,0.18)' };
}

type Page = { kind: 'cover' } | { kind: 'body'; part: number; text: string };

function Corner({ color, rotate }: { color: string; rotate: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" style={{ transform: [{ rotate }] }}>
      <Path d="M2 2h8M2 2v8M2 2c6 0 14 6 14 16" stroke={color} strokeWidth={1.1} strokeLinecap="round" />
    </Svg>
  );
}

function PaperSheet({ children, pageLabel, pal }: { children: React.ReactNode; pageLabel: string; pal: ReturnType<typeof paperTheme> }) {
  return (
    <View style={styles.pageOuter}>
      <LinearGradient colors={pal.sheet} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={[styles.sheet, { shadowColor: pal.edge }]}>
        <Svg style={StyleSheet.absoluteFill as any} pointerEvents="none">
          <Defs>
            <RadialGradient id="cmsPgVig" cx="50%" cy="46%" r="72%">
              <Stop offset="60%" stopColor={pal.vignette} stopOpacity={0} />
              <Stop offset="100%" stopColor={pal.vignette} stopOpacity={1} />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width="100%" height="100%" fill="url(#cmsPgVig)" />
        </Svg>
        <View style={[styles.frame, { borderColor: pal.frame }]} pointerEvents="none" />
        <View style={styles.cornerTL} pointerEvents="none"><Corner color={pal.frame} rotate="0deg" /></View>
        <View style={styles.cornerTR} pointerEvents="none"><Corner color={pal.frame} rotate="90deg" /></View>
        <View style={styles.cornerBR} pointerEvents="none"><Corner color={pal.frame} rotate="180deg" /></View>
        <View style={styles.cornerBL} pointerEvents="none"><Corner color={pal.frame} rotate="270deg" /></View>
        <ScrollView contentContainerStyle={styles.sheetBody} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
        <Text style={[styles.pageNum, { color: pal.inkSoft }]}>{pageLabel}</Text>
      </LinearGradient>
    </View>
  );
}

/** Split long chapter text into readable manuscript pages (~900 chars each). */
function splitContent(text: string): string[] {
  const trimmed = (text || '').trim();
  if (!trimmed) return [trimmed || 'No content added yet.'];
  const paras = trimmed.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let buf = '';
  const flush = () => { if (buf.trim()) { chunks.push(buf.trim()); buf = ''; } };
  for (const p of paras) {
    if ((buf + '\n\n' + p).length > 900 && buf) { flush(); buf = p; }
    else buf = buf ? `${buf}\n\n${p}` : p;
  }
  flush();
  return chunks.length ? chunks : [trimmed];
}

/** CMS chapter reader — parchment UX matching LibraryChapterScreen. */
export function ContentBookChapterScreen({ navigation, route }: any) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const hi = lang === 'hi';
  const insets = useSafeAreaInsets();
  const pal = paperTheme(theme.isDark);
  const dim = theme.isDark ? '#b89a5b' : theme.textMuted;
  const [book, setBook] = useState<ContentBook | null>(null);
  const [chapter, setChapter] = useState(0);

  useEffect(() => {
    let on = true;
    getBook(route.params.id).then((r) => {
      if (!on) return;
      setBook(r.book);
      const max = Math.max(0, (r.book.chapters?.length || 1) - 1);
      setChapter(Math.min(route?.params?.chapter ?? 0, max));
    }).catch(() => {});
    return () => { on = false; };
  }, [route.params.id, route?.params?.chapter]);

  const chapters = book?.chapters || [];
  const ch = chapters[chapter];
  const last = Math.max(0, chapters.length - 1);
  const percent = chapters.length ? Math.round(((chapter + 1) / chapters.length) * 100) : 0;
  const bookKey = book ? cmsBookId(book._id) : '';

  const pages = useMemo<Page[]>(() => {
    if (!ch) return [{ kind: 'cover' }];
    const parts = splitContent(ch.content || '');
    return [{ kind: 'cover' }, ...parts.map((text, i) => ({ kind: 'body' as const, part: i + 1, text }))];
  }, [ch]);

  const pagerRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!bookKey) return;
    setProgress(bookKey, { chapter, percent });
    setPage(0);
    pagerRef.current?.scrollTo({ x: 0, animated: false });
  }, [bookKey, chapter, percent]);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const p = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (p !== page) { setPage(p); hSelect(); }
  };
  const goChapter = (dir: -1 | 1) => { hTap(); setChapter((c) => Math.max(0, Math.min(last, c + dir))); };
  const flipTo = (p: number) => { pagerRef.current?.scrollTo({ x: p * SCREEN_W, animated: true }); };

  if (!book || !ch) {
    return (
      <LinearGradient colors={theme.bgGradient} style={styles.fill}>
        <View style={[styles.topbar, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => { hTap(); navigation.goBack(); }} hitSlop={8} style={[styles.iconBtn, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.5)' : '#ffffff' }]}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={theme.gold1} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Polyline points="15 18 9 12 15 6" /></Svg>
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <ActivityIndicator color={theme.gold1} />
          </View>
          <View style={styles.iconBtn} />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={theme.bgGradient} style={styles.fill}>
      <View style={[styles.topbar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => { hTap(); navigation.goBack(); }} hitSlop={8} style={({ pressed }) => [styles.iconBtn, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.5)' : '#ffffff' }, pressed && { transform: [{ scale: 0.92 }] }]}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={theme.gold1} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Polyline points="15 18 9 12 15 6" /></Svg>
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.topTitle, { color: theme.goldText }]} numberOfLines={1}>{book.title}</Text>
          <Text style={[styles.topEyebrow, { color: dim }]} numberOfLines={1}>
            {hi ? 'अध्याय' : 'Chapter'} {chapter + 1} / {chapters.length}
          </Text>
        </View>
        <View style={styles.iconBtn} />
      </View>

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
                <Text style={[styles.coverKicker, { color: pal.inkSoft }]}>{hi ? 'अध्याय' : 'CHAPTER'} {chapter + 1}</Text>
                <Text style={[styles.coverTitle, { color: pal.ink }]}>{ch.title}</Text>
                <View style={[styles.coverRule, { backgroundColor: pal.frame }]} />
                <Text style={[styles.coverMeta, { color: pal.inkSoft }]}>{book.author || book.category || ''}</Text>
                {pages.length > 1 ? (
                  <Pressable onPress={() => flipTo(1)} style={({ pressed }) => [styles.beginBtn, { borderColor: pal.frame }, pressed && { opacity: 0.7 }]}>
                    <Text style={[styles.beginText, { color: pal.ink }]}>{hi ? 'पढ़ना आरंभ करें' : 'Begin reading'}</Text>
                    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={pal.ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Polyline points="9 18 15 12 9 6" /></Svg>
                  </Pressable>
                ) : null}
              </View>
            ) : (
              <View style={styles.verseBody}>
                {pages.length > 2 ? (
                  <Text style={[styles.verseRef, { color: pal.inkSoft, borderColor: pal.frame }]}>
                    {hi ? 'भाग' : 'Part'} · {pg.part}
                  </Text>
                ) : null}
                <Text style={[styles.bodyText, { color: pal.ink }]}>{pg.text}</Text>
              </View>
            )}
          </PaperSheet>
        ))}
      </ScrollView>

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
  pageOuter: { width: SCREEN_W, paddingHorizontal: 16, paddingVertical: 8 },
  sheet: { flex: 1, borderRadius: 4, overflow: 'hidden', elevation: 8, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  frame: { ...StyleSheet.absoluteFillObject, margin: 10, borderWidth: 1, borderRadius: 2 },
  cornerTL: { position: 'absolute', top: 14, left: 14 },
  cornerTR: { position: 'absolute', top: 14, right: 14 },
  cornerBR: { position: 'absolute', bottom: 28, right: 14 },
  cornerBL: { position: 'absolute', bottom: 28, left: 14 },
  sheetBody: { paddingHorizontal: 28, paddingTop: 36, paddingBottom: 48, flexGrow: 1 },
  pageNum: { position: 'absolute', bottom: 10, alignSelf: 'center', fontFamily: fonts.inter, fontSize: 10, letterSpacing: 1 },
  cover: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 24 },
  coverOm: { fontFamily: fonts.devanagari, fontSize: 36, lineHeight: 40, marginBottom: 12 },
  coverKicker: { fontFamily: fonts.cinzelSemi, fontSize: 11, letterSpacing: 2.5, marginBottom: 10 },
  coverTitle: { fontFamily: fonts.playfairBold, fontSize: 22, textAlign: 'center', lineHeight: 28, paddingHorizontal: 8 },
  coverRule: { width: 48, height: 1, marginVertical: 14 },
  coverMeta: { fontFamily: fonts.inter, fontSize: 12, textAlign: 'center' },
  beginBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, borderWidth: 1, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10 },
  beginText: { fontFamily: fonts.interSemi, fontSize: 13 },
  verseBody: { flex: 1 },
  verseRef: { fontFamily: fonts.interSemi, fontSize: 10.5, letterSpacing: 1.2, alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 16 },
  bodyText: { fontFamily: fonts.inter, fontSize: 15, lineHeight: 26 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 10, borderTopWidth: 1 },
  chBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 4 },
  chBtnText: { fontFamily: fonts.interSemi, fontSize: 12 },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { height: 6, borderRadius: 999 },
});
