import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated, Easing, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line, Polyline, G } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';
import { CosmicBackground } from '../components/CosmicBackground';
import { GradientText } from '../components/GradientText';
import { hTap, hSuccess } from '../lib/haptics';
import { useLang } from '../i18n/LanguageProvider';
import { TrackColor } from '../data/library';
import { useSaved, toggleSaved, useLibraryStore } from '../lib/libraryStore';
import { avatarUrl, ContentBook, getBook } from '../lib/api';
import { cmsBookId } from '../lib/cmsBooks';

const coverColor = (c: TrackColor) =>
  c === 'purple' ? '#7a4dd6' : c === 'green' ? '#1f8f4f' : c === 'rose' ? '#c0436a' : c === 'blue' ? '#3f7fd6' : '#caa23a';

function CoverPlate({ tint, name, coverUri }: { tint: string; name: string; coverUri?: string }) {
  if (coverUri) {
    return (
      <View style={cv.cover}>
        <Image source={{ uri: coverUri }} style={cv.image} resizeMode="cover" />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} style={cv.imageOverlay} />
        <Text style={cv.imageName} numberOfLines={2}>{name}</Text>
      </View>
    );
  }
  return (
    <LinearGradient colors={[tint, '#0c0c1e']} start={{ x: 0.2, y: 0 }} end={{ x: 0.85, y: 1 }} style={cv.cover}>
      <View style={cv.frame}>
        <Text style={cv.om}>ॐ</Text>
        <Svg width={34} height={34} viewBox="0 0 48 48" fill="none">
          <Circle cx={24} cy={24} r={13} stroke="rgba(255,247,214,0.92)" strokeWidth={1.3} />
          <Circle cx={24} cy={24} r={4} fill="rgba(255,247,214,0.92)" />
          <G stroke="rgba(255,247,214,0.92)" strokeWidth={1}>
            <Line x1={24} y1={6} x2={24} y2={42} /><Line x1={6} y1={24} x2={42} y2={24} />
            <Line x1={11} y1={11} x2={37} y2={37} /><Line x1={37} y1={11} x2={11} y2={37} />
          </G>
        </Svg>
        <Text style={cv.name} numberOfLines={2}>{name}</Text>
      </View>
    </LinearGradient>
  );
}

/** CMS book reader — same layout/UX as LibraryReaderScreen (static books). */
export function ContentBookScreen({ navigation, route }: any) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const hi = lang === 'hi';
  const insets = useSafeAreaInsets();
  const dim = theme.isDark ? '#b89a5b' : theme.textMuted;
  const [book, setBook] = useState<ContentBook | null>(null);
  const bookKey = book ? cmsBookId(book._id) : '';
  const saved = useSaved(bookKey);
  const { progress } = useLibraryStore();
  const prog = bookKey ? progress[bookKey] : undefined;
  const percent = prog?.percent ?? 0;
  const lastChapter = prog?.chapter ?? -1;
  const tint = coverColor('gold');
  const coverUri = book?.coverImage ? (avatarUrl(book.coverImage) || undefined) : undefined;
  const chapters = book?.chapters || [];

  useEffect(() => {
    let on = true;
    getBook(route.params.id).then((r) => { if (on) setBook(r.book); }).catch(() => {});
    return () => { on = false; };
  }, [route.params.id]);

  const openChapter = (i: number) => {
    hTap();
    navigation.navigate('ContentBookChapter', { id: book!._id, chapter: i });
  };
  const onSave = () => { if (!bookKey) return; hSuccess(); toggleSaved(bookKey); };

  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    enter.setValue(0);
    Animated.timing(enter, { toValue: 1, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [book?._id, enter]);
  const rise = (d: number) => ({ opacity: enter, transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [d, 0] }) }] });

  if (!book) {
    return (
      <LinearGradient colors={theme.bgGradient} style={styles.fill}>
        <CosmicBackground />
        <View style={[styles.topbar, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => { hTap(); navigation.goBack(); }} hitSlop={8} style={[styles.iconBtn, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.5)' : '#ffffff' }]}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={theme.gold1} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Polyline points="15 18 9 12 15 6" /></Svg>
          </Pressable>
          <Text style={[styles.topEyebrow, { color: dim }]}>{hi ? 'पुस्तकालय' : 'LIBRARY'}</Text>
          <View style={styles.iconBtn} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: dim, fontFamily: fonts.inter }}>{hi ? 'लोड हो रहा है…' : 'Loading…'}</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={theme.bgGradient} style={styles.fill}>
      <CosmicBackground />

      <View style={[styles.topbar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => { hTap(); navigation.goBack(); }} hitSlop={8} style={({ pressed }) => [styles.iconBtn, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.5)' : '#ffffff' }, pressed && { transform: [{ scale: 0.92 }] }]}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={theme.gold1} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Polyline points="15 18 9 12 15 6" /></Svg>
        </Pressable>
        <Text style={[styles.topEyebrow, { color: dim }]} numberOfLines={1}>{book.category || (hi ? 'पुस्तक' : 'BOOK')}</Text>
        <Pressable onPress={onSave} hitSlop={8} style={({ pressed }) => [styles.iconBtn, { borderColor: saved ? theme.gold1 : theme.cardBorder, backgroundColor: saved ? 'rgba(233,184,80,0.16)' : (theme.isDark ? 'rgba(0,0,0,0.5)' : 'rgba(176,115,22,0.06)') }, pressed && { transform: [{ scale: 0.92 }] }]}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill={saved ? theme.gold1 : 'none'} stroke={theme.gold1} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><Path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></Svg>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 120, paddingTop: 8 }} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.hero, rise(14)]}>
          <View style={styles.coverWrap}>
            <View style={[styles.coverGlow, { backgroundColor: tint }]} />
            <CoverPlate tint={tint} name={book.title} coverUri={coverUri} />
          </View>
          <GradientText style={styles.title}>{book.title}</GradientText>
          <View style={styles.metaRow}>
            {book.author ? (
              <View style={[styles.metaChip, { borderColor: theme.cardBorder }]}>
                <Text style={[styles.metaText, { color: dim }]}>{book.author}</Text>
              </View>
            ) : null}
            <View style={[styles.metaChip, { borderColor: theme.cardBorder }]}>
              <Text style={[styles.metaText, { color: dim }]}>{chapters.length} {chapters.length === 1 ? 'chapter' : 'chapters'}</Text>
            </View>
          </View>
        </Animated.View>

        {percent > 0 && (
          <Animated.View style={[styles.block, rise(18)]}>
            <View style={styles.progressTop}>
              <Text style={[styles.progressLabel, { color: dim }]}>{hi ? 'आपकी प्रगति' : 'Your progress'}</Text>
              <Text style={[styles.progressLabel, { color: theme.goldText }]}>{percent}%</Text>
            </View>
            <View style={[styles.track, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(176,115,22,0.14)' }]}>
              <LinearGradient colors={['#fce8a8', '#b87f1a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.bar, { width: `${percent}%` }]} />
            </View>
          </Animated.View>
        )}

        {!!book.description && (
          <Animated.View style={rise(20)}>
            <Text style={[styles.intro, { color: theme.isDark ? 'rgba(231,218,180,0.82)' : theme.textSoft }]}>{book.description}</Text>
          </Animated.View>
        )}

        <Animated.View style={rise(24)}>
          <Text style={[styles.tocLbl, { color: dim }]}>{hi ? 'विषय-सूची' : 'CONTENTS'}</Text>
          {chapters.length === 0 ? (
            <Text style={[styles.intro, { color: dim }]}>{hi ? 'अभी कोई अध्याय नहीं।' : 'No chapters added yet.'}</Text>
          ) : chapters.map((c, i) => {
            const current = i === lastChapter;
            return (
              <Pressable
                key={c._id || `${c.title}-${i}`}
                onPress={() => openChapter(i)}
                android_ripple={{ color: theme.ripple }}
                style={({ pressed }) => [
                  styles.tocRow,
                  { borderColor: current ? theme.gold1 : theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.4)' : '#fff' },
                  pressed && { transform: [{ scale: 0.98 }], backgroundColor: theme.isDark ? 'rgba(233,184,80,0.06)' : 'rgba(176,115,22,0.05)' },
                ]}
              >
                <View style={[styles.tocNum, { borderColor: theme.isDark ? 'rgba(220,180,80,0.4)' : theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.10)' : '#ffffff' }]}>
                  <Text style={[styles.tocNumText, { color: theme.goldText }]}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.tocTitle, { color: theme.isDark ? '#fff' : theme.text }]} numberOfLines={2}>{c.title}</Text>
                  <Text style={[styles.tocMeta, { color: theme.textMuted }]}>
                    {current ? (hi ? 'अंतिम पढ़ा' : 'Last read') : (hi ? 'अध्याय' : 'Chapter')}
                  </Text>
                </View>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.gold2} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Polyline points="9 18 15 12 9 6" /></Svg>
              </Pressable>
            );
          })}
        </Animated.View>
      </ScrollView>

      {chapters.length > 0 && (
        <View style={[styles.ctaWrap, { paddingBottom: insets.bottom + 14 }]} pointerEvents="box-none">
          <LinearGradient colors={['transparent', theme.bgDeep]} style={styles.ctaScrim} pointerEvents="none" />
          <Pressable onPress={() => openChapter(lastChapter >= 0 ? lastChapter : 0)} style={({ pressed }) => [styles.cta, pressed && { transform: [{ scale: 0.98 }] }]}>
            <LinearGradient colors={['#fce8a8', '#e9b850', '#b87f1a']} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.ctaInner}>
              <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="#211300" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><Path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5z" /><Path d="M8 7h8" /></Svg>
              <Text style={styles.ctaText}>{lastChapter >= 0 ? `CONTINUE · CHAPTER ${lastChapter + 1}` : 'START READING'}</Text>
            </LinearGradient>
          </Pressable>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingBottom: 10 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  topEyebrow: { flex: 1, textAlign: 'center', fontFamily: fonts.cinzelSemi, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' },
  hero: { alignItems: 'center', marginTop: 6, marginBottom: 18 },
  coverWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  coverGlow: { position: 'absolute', width: 130, height: 130, borderRadius: 70, opacity: 0.28, top: 18 },
  title: { fontFamily: fonts.playfairBold, fontSize: 24, textAlign: 'center', lineHeight: 30 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 12 },
  metaChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6 },
  metaText: { fontFamily: fonts.inter, fontSize: 11 },
  block: { marginBottom: 18 },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  progressLabel: { fontFamily: fonts.interMed, fontSize: 11.5 },
  track: { height: 6, borderRadius: 999, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: 999 },
  intro: { fontFamily: fonts.inter, fontSize: 13.5, lineHeight: 21, marginBottom: 20 },
  tocLbl: { fontFamily: fonts.interSemi, fontSize: 11, letterSpacing: 1.4, marginBottom: 12 },
  tocRow: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 10 },
  tocNum: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  tocNumText: { fontFamily: fonts.playfairBold, fontSize: 16 },
  tocTitle: { fontFamily: fonts.interSemi, fontSize: 14 },
  tocMeta: { fontFamily: fonts.inter, fontSize: 11.5, marginTop: 3 },
  ctaWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20 },
  ctaScrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 120 },
  cta: { borderRadius: 999, overflow: 'hidden', shadowColor: '#e9b850', shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 10 },
  ctaInner: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  ctaText: { fontFamily: fonts.cinzel, fontSize: 13, fontWeight: '800', letterSpacing: 1.4, color: '#211300' },
});

const cv = StyleSheet.create({
  cover: { width: 116, height: 162, borderRadius: 6, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(238,203,122,0.45)' },
  frame: { flex: 1, margin: 9, marginLeft: 13, borderWidth: 1, borderColor: 'rgba(238,203,122,0.55)', borderRadius: 4, alignItems: 'center', justifyContent: 'space-around', paddingVertical: 12, paddingHorizontal: 4 },
  om: { fontFamily: fonts.devanagari, fontSize: 22, color: '#fff7d6', lineHeight: 26 },
  name: { fontFamily: fonts.devanagari, fontSize: 12, color: '#fff7d6', lineHeight: 16, textAlign: 'center' },
  image: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  imageOverlay: { ...StyleSheet.absoluteFillObject },
  imageName: { position: 'absolute', bottom: 8, left: 6, right: 6, fontFamily: fonts.devanagari, fontSize: 11, color: '#fff7d6', textAlign: 'center', lineHeight: 14 },
});
