import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line, Polyline, G } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';
import { CosmicBackground } from '../components/CosmicBackground';
import { GradientText } from '../components/GradientText';
import { hTap, hSuccess } from '../lib/haptics';
import { BOOKS, TrackColor } from '../data/library';
import { useSaved, toggleSaved, useLibraryStore } from '../lib/libraryStore';

const coverColor = (c: TrackColor) =>
  c === 'purple' ? '#7a4dd6' : c === 'green' ? '#1f8f4f' : c === 'rose' ? '#c0436a' : c === 'blue' ? '#3f7fd6' : '#caa23a';

function CoverPlate({ tint, name }: { tint: string; name: string }) {
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

/** Book "cover" page = a Table of Contents. Tap a chapter → opens the chapter
    reading page (LibraryChapter). */
export function LibraryReaderScreen({ navigation, route }: any) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const doc = BOOKS[route?.params?.id as string] ?? BOOKS.gita;
  const tint = coverColor(doc.cover);
  const dim = theme.isDark ? '#b89a5b' : '#8a6f3a';

  const saved = useSaved(doc.id);
  const { progress } = useLibraryStore();
  const prog = progress[doc.id];
  const percent = prog?.percent ?? 0;
  const lastChapter = prog?.chapter ?? -1;

  const openChapter = (i: number) => { hTap(); navigation.navigate('LibraryChapter', { id: doc.id, chapter: i }); };
  const onSave = () => { hSuccess(); toggleSaved(doc.id); };

  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enter, { toValue: 1, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [enter]);
  const rise = (d: number) => ({ opacity: enter, transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [d, 0] }) }] });

  return (
    <LinearGradient colors={theme.bgGradient} style={styles.fill}>
      <CosmicBackground />

      {/* top bar — back + eyebrow + bookmark */}
      <View style={[styles.topbar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => { hTap(); navigation.goBack(); }} hitSlop={8} style={({ pressed }) => [styles.iconBtn, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.5)' : 'rgba(176,115,22,0.06)' }, pressed && { transform: [{ scale: 0.92 }] }]}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={theme.gold1} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Polyline points="15 18 9 12 15 6" /></Svg>
        </Pressable>
        <Text style={[styles.topEyebrow, { color: dim }]} numberOfLines={1}>{doc.eyebrow}</Text>
        <Pressable onPress={onSave} hitSlop={8} style={({ pressed }) => [styles.iconBtn, { borderColor: saved ? theme.gold1 : theme.cardBorder, backgroundColor: saved ? 'rgba(233,184,80,0.16)' : (theme.isDark ? 'rgba(0,0,0,0.5)' : 'rgba(176,115,22,0.06)') }, pressed && { transform: [{ scale: 0.92 }] }]}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill={saved ? theme.gold1 : 'none'} stroke={theme.gold1} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><Path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></Svg>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 120, paddingTop: 8 }} showsVerticalScrollIndicator={false}>
        {/* hero */}
        <Animated.View style={[styles.hero, rise(14)]}>
          <View style={styles.coverWrap}>
            <View style={[styles.coverGlow, { backgroundColor: tint }]} />
            <CoverPlate tint={tint} name={doc.hindi} />
          </View>
          <GradientText style={styles.title}>{doc.title}</GradientText>
          <View style={styles.metaRow}>
            {[`${doc.chapters.length} chapters`, doc.language.join(' · ')].map((m) => (
              <View key={m} style={[styles.metaChip, { borderColor: 'rgba(238,203,122,0.26)', backgroundColor: theme.isDark ? 'rgba(238,203,122,0.08)' : 'rgba(176,115,22,0.06)' }]}>
                <Text style={[styles.metaText, { color: theme.isDark ? 'rgba(246,236,206,0.88)' : theme.textSoft }]}>{m}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* progress (only once they've started) */}
        {percent > 0 && (
          <Animated.View style={[styles.block, rise(18)]}>
            <View style={styles.progressTop}>
              <Text style={[styles.progressLabel, { color: dim }]}>Your progress</Text>
              <Text style={[styles.progressLabel, { color: theme.goldText }]}>{percent}%</Text>
            </View>
            <View style={[styles.track, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(176,115,22,0.14)' }]}>
              <LinearGradient colors={['#fce8a8', '#b87f1a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.bar, { width: `${percent}%` }]} />
            </View>
          </Animated.View>
        )}

        {/* intro */}
        <Animated.View style={rise(20)}>
          <Text style={[styles.intro, { color: theme.isDark ? 'rgba(231,218,180,0.82)' : theme.textSoft }]}>{doc.intro}</Text>
        </Animated.View>

        {/* table of contents */}
        <Animated.View style={rise(24)}>
          <Text style={[styles.tocLbl, { color: dim }]}>CONTENTS</Text>
          {doc.chapters.map((c, i) => {
            const current = i === lastChapter;
            return (
              <Pressable
                key={c.title}
                onPress={() => openChapter(i)}
                android_ripple={{ color: theme.ripple }}
                style={({ pressed }) => [
                  styles.tocRow,
                  { borderColor: current ? theme.gold1 : theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.4)' : '#fff' },
                  pressed && { transform: [{ scale: 0.98 }], backgroundColor: theme.isDark ? 'rgba(233,184,80,0.06)' : 'rgba(176,115,22,0.05)' },
                ]}
              >
                <View style={[styles.tocNum, { borderColor: 'rgba(220,180,80,0.4)', backgroundColor: theme.isDark ? 'rgba(233,184,80,0.10)' : 'rgba(176,115,22,0.06)' }]}>
                  <Text style={[styles.tocNumText, { color: theme.goldText }]}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.tocTitle, { color: theme.isDark ? '#fff' : theme.text }]} numberOfLines={2}>{c.title}</Text>
                  <Text style={[styles.tocMeta, { color: theme.textMuted }]}>{c.verses.length} verse{c.verses.length === 1 ? '' : 's'}{current ? '  ·  Last read' : ''}</Text>
                </View>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.gold2} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Polyline points="9 18 15 12 9 6" /></Svg>
              </Pressable>
            );
          })}
        </Animated.View>
      </ScrollView>

      {/* sticky Start / Continue reading */}
      <View style={[styles.ctaWrap, { paddingBottom: insets.bottom + 14 }]} pointerEvents="box-none">
        <LinearGradient colors={['transparent', theme.bgDeep]} style={styles.ctaScrim} pointerEvents="none" />
        <Pressable onPress={() => openChapter(lastChapter >= 0 ? lastChapter : 0)} style={({ pressed }) => [styles.cta, pressed && { transform: [{ scale: 0.98 }] }]}>
          <LinearGradient colors={['#fce8a8', '#e9b850', '#b87f1a']} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.ctaInner}>
            <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="#211300" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><Path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5z" /><Path d="M8 7h8" /></Svg>
            <Text style={styles.ctaText}>{lastChapter >= 0 ? `CONTINUE · CHAPTER ${lastChapter + 1}` : 'START READING'}</Text>
          </LinearGradient>
        </Pressable>
      </View>
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
});
