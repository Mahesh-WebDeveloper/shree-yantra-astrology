import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radii } from '../theme/tokens';
import { Page } from '../components/Page';
import { GradientText } from '../components/GradientText';
import { hTap } from '../lib/haptics';
import { useT } from '../i18n/LanguageProvider';
import { getDailyShlokaExplain, DailyShloka, DailyShlokaExplain } from '../lib/api';

const Chevron = ({ c }: { c: string }) => (
  <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Polyline points="9 18 15 12 9 6" /></Svg>
);

export function DailyShlokaScreen({ navigation, route }: any) {
  const { theme } = useTheme();
  const t = useT();
  const shloka: DailyShloka = route?.params?.shloka;
  const [exp, setExp] = useState<DailyShlokaExplain | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let on = true;
    if (!shloka?.id) return;
    getDailyShlokaExplain(shloka.id).then((r) => { if (on) setExp(r); }).catch(() => { if (on) setErr(true); });
    return () => { on = false; };
  }, [shloka?.id]);

  if (!shloka) {
    return <Page title={t('daily.title', 'Daily Shloka')} onBack={() => navigation.goBack()}><Text style={{ color: theme.textMuted, textAlign: 'center', marginTop: 40 }}>—</Text></Page>;
  }

  const boxBorder = theme.isDark ? 'rgba(201,150,46,0.22)' : 'rgba(176,115,22,0.16)';
  const Section = ({ label, text }: { label: string; text: string }) =>
    !text ? null : (
      <View style={[styles.sec, { borderColor: boxBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : '#fffdf7' }]}>
        <Text style={[styles.secLabel, { color: theme.gold2 }]}>{label}</Text>
        <Text style={[styles.secText, { color: theme.text }]}>{text}</Text>
      </View>
    );

  return (
    <Page title={t('daily.title', 'Daily Shloka')} onBack={() => { hTap(); navigation.goBack(); }}>
      {/* hero — book cover + name */}
      <View style={styles.hero}>
        <LinearGradient colors={['#2a2f6b', '#161a44', '#0a0c24']} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.cover}>
          <Text style={styles.coverOm}>ॐ</Text>
          <Text style={styles.coverName} numberOfLines={2}>{shloka.hindi}</Text>
        </LinearGradient>
        <GradientText style={styles.bookName}>{shloka.book}</GradientText>
        <Text style={[styles.ref, { color: theme.textMuted }]}>{shloka.refLabel}</Text>
      </View>

      {/* shloka card */}
      <View style={[styles.shlokCard, { borderColor: theme.isDark ? 'rgba(201,150,46,0.3)' : 'rgba(176,115,22,0.22)', backgroundColor: theme.isDark ? 'rgba(0,0,0,0.35)' : '#fffaf0' }]}>
        <Text style={[styles.sanskrit, { color: theme.isDark ? '#f3e6c2' : theme.text }]}>{shloka.sanskrit}</Text>
        {!!shloka.transliteration && <Text style={[styles.translit, { color: theme.textMuted }]}>{shloka.transliteration}</Text>}
        {!!shloka.english && (
          <View style={[styles.enBox, { borderTopColor: boxBorder }]}>
            <Text style={[styles.enText, { color: theme.textSoft }]}>{shloka.english}</Text>
          </View>
        )}
      </View>

      {/* AI explanation */}
      {!exp && !err && (
        <View style={styles.loading}>
          <ActivityIndicator color={theme.gold1} />
          <Text style={[styles.loadingText, { color: theme.textMuted }]}>{t('daily.generating', 'व्याख्या तैयार हो रही है…')}</Text>
        </View>
      )}
      {err && <Text style={[styles.err, { color: theme.textMuted }]}>{t('daily.err', 'व्याख्या लोड नहीं हो पाई — फिर प्रयास करें।')}</Text>}

      {exp && (
        <View style={{ gap: 12, marginTop: 4 }}>
          <Section label={t('daily.anuvad', 'अर्थ')} text={exp.anuvad} />
          <Section label={t('daily.vyakhya', 'विस्तृत व्याख्या')} text={exp.vyakhya} />
          <Section label={t('daily.jeevan', 'आज के जीवन में')} text={exp.jeevanUpyog} />

          {/* highlighted takeaway */}
          {!!exp.seekh && (
            <LinearGradient colors={theme.isDark ? ['rgba(233,184,80,0.16)', 'rgba(184,127,26,0.06)'] : ['rgba(252,232,168,0.7)', 'rgba(233,184,80,0.18)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.seekhCard, { borderColor: theme.gold2 }]}>
              <Text style={[styles.seekhLabel, { color: theme.goldText }]}>✦ {t('daily.seekh', 'आज का संदेश')}</Text>
              <Text style={[styles.seekhText, { color: theme.text }]}>{exp.seekh}</Text>
            </LinearGradient>
          )}

          <Text style={[styles.aiNote, { color: theme.textMuted }]}>✦ {t('ai.aiNote', 'विस्तृत व्याख्या')}</Text>
        </View>
      )}

      {/* read full chapter */}
      {shloka.nav?.screen && (
        <Pressable
          onPress={() => { hTap(); navigation.navigate(shloka.nav!.screen, shloka.nav!.params); }}
          style={({ pressed }) => [styles.readWrap, pressed && { opacity: 0.85 }]}
        >
          <LinearGradient colors={['#fce8a8', '#e9b850', '#b87f1a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.readBtn}>
            <Text style={styles.readText}>{t('daily.readFull', 'पूरा अध्याय पढ़ें')}</Text>
            <Chevron c="#2a1c00" />
          </LinearGradient>
        </Pressable>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginBottom: 16, marginTop: 2 },
  cover: { width: 76, height: 100, borderRadius: 8, alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 6, borderWidth: 1, borderColor: 'rgba(238,203,122,0.5)' },
  coverOm: { color: '#fff7d6', fontSize: 22, fontFamily: fonts.devanagari },
  coverName: { color: '#fff7d6', fontSize: 11, fontFamily: fonts.devanagari, lineHeight: 15, textAlign: 'center' },
  bookName: { fontFamily: fonts.cinzel, fontSize: 19, letterSpacing: 1, marginTop: 12 },
  ref: { fontFamily: fonts.interSemi, fontSize: 11.5, letterSpacing: 0.5, marginTop: 4 },
  shlokCard: { borderWidth: 1, borderRadius: radii.lg, padding: 18, marginBottom: 16 },
  sanskrit: { fontFamily: fonts.devanagari, fontSize: 18, lineHeight: 32, textAlign: 'center' },
  translit: { fontFamily: fonts.inter, fontStyle: 'italic', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 12 },
  enBox: { borderTopWidth: 1, marginTop: 14, paddingTop: 12 },
  enText: { fontFamily: fonts.inter, fontSize: 13.5, lineHeight: 21, textAlign: 'center' },
  loading: { paddingVertical: 30, alignItems: 'center', gap: 10 },
  loadingText: { fontFamily: fonts.inter, fontSize: 12.5 },
  err: { fontFamily: fonts.inter, fontSize: 13, textAlign: 'center', paddingVertical: 26 },
  sec: { borderWidth: 1, borderRadius: radii.lg, padding: 15 },
  secLabel: { fontFamily: fonts.interSemi, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 7 },
  secText: { fontFamily: fonts.devanagari, fontSize: 15.5, lineHeight: 27 },
  seekhCard: { borderWidth: 1, borderRadius: radii.lg, padding: 16 },
  seekhLabel: { fontFamily: fonts.cinzelSemi, fontSize: 12, letterSpacing: 1, marginBottom: 7 },
  seekhText: { fontFamily: fonts.devanagari, fontSize: 16, lineHeight: 27 },
  aiNote: { fontFamily: fonts.inter, fontSize: 10.5, textAlign: 'center', marginTop: 4, fontStyle: 'italic' },
  readWrap: { marginTop: 18, borderRadius: radii.pill, overflow: 'hidden' },
  readBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14 },
  readText: { fontFamily: fonts.interSemi, fontSize: 14, letterSpacing: 0.5, color: '#2a1c00' },
});
