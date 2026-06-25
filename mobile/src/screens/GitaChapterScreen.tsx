import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radii } from '../theme/tokens';
import { Page } from '../components/Page';
import { GradientText } from '../components/GradientText';
import { VerseMeaning } from '../components/VerseMeaning';
import { PlayIcon, PauseIcon } from '../audio/PlayerIcons';
import { usePlayer } from '../audio/PlayerProvider';
import { useGitaAudio, gitaTrack } from '../hooks/useGitaAudio';
import { hTap } from '../lib/haptics';
import { useT, useLang } from '../i18n/LanguageProvider';
import { getGitaChapter, getGitaExplanation, GitaChapterFull } from '../lib/api';

type ReadLang = 'hi' | 'en' | 'both';

export function GitaChapterScreen({ navigation, route }: any) {
  const { theme } = useTheme();
  const t = useT();
  const { lang } = useLang();
  const chapterNo: number = route?.params?.chapter || 1;
  const player = usePlayer();
  const gita = useGitaAudio();
  const audio = gita.byChapter.get(chapterNo);
  const audioCurrent = !!audio && player.track?.id === audio._id;
  const [data, setData] = useState<GitaChapterFull | null>(null);
  const [err, setErr] = useState(false);
  // reading-translation language (app language se default; reader me alag switch)
  const [readLang, setReadLang] = useState<ReadLang>(lang === 'hi' ? 'hi' : 'en');

  useEffect(() => {
    let on = true;
    getGitaChapter(chapterNo)
      .then((r) => { if (on) setData(r.chapter); })
      .catch(() => { if (on) setErr(true); });
    return () => { on = false; };
  }, [chapterNo]);

  const summary = data ? (readLang === 'en' ? data.summaryEn : data.summaryHi) : '';
  const goldDivider = theme.isDark ? 'rgba(201,150,46,0.45)' : 'rgba(176,115,22,0.35)';
  const showHi = readLang === 'hi' || readLang === 'both';
  const showEn = readLang === 'en' || readLang === 'both';
  const LANG_OPTS: { key: ReadLang; label: string }[] = [
    { key: 'hi', label: 'हिंदी' },
    { key: 'en', label: 'English' },
    { key: 'both', label: lang === 'hi' ? 'दोनों' : 'Both' },
  ];

  return (
    <Page title={`${t('gita.chapter', 'Chapter')} ${chapterNo}`} onBack={() => { hTap(); navigation.goBack(); }}>
      {!data && !err && <View style={styles.center}><ActivityIndicator color={theme.gold1} /></View>}
      {err && <Text style={[styles.err, { color: theme.textMuted }]}>Load nahi ho paya — internet check karein.</Text>}

      {data && (
        <>
          {/* chapter hero */}
          <View style={styles.hero}>
            <LinearGradient colors={['#fce8a8', '#e9b850', '#c9962e']} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.num}>
              <Text style={styles.numText}>{data.chapter}</Text>
            </LinearGradient>
            <Text style={[styles.chName, { color: theme.text }]}>{data.name}</Text>
            <GradientText style={styles.chTranslit}>{data.transliterated}</GradientText>
            <Text style={[styles.chMeaning, { color: theme.textMuted }]}>{data.meaning} · {data.versesCount} {t('gita.verses', 'verses')}</Text>
          </View>

          {/* 🎧 listen to this chapter (Yatharth Geeta audio) */}
          {audio && (
            <Pressable
              onPress={() => { hTap(); player.play(gitaTrack(audio), gita.queue); }}
              style={({ pressed }) => [
                styles.audioBar,
                { borderColor: theme.gold2, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.12)' : 'rgba(176,115,22,0.07)' },
                pressed && { opacity: 0.9 },
              ]}
            >
              <View style={[styles.audioDot, { backgroundColor: audioCurrent && player.isPlaying ? theme.gold1 : 'transparent', borderColor: theme.gold2 }]}>
                {audioCurrent && player.loading
                  ? <ActivityIndicator color={theme.goldText} size="small" />
                  : audioCurrent && player.isPlaying
                    ? <PauseIcon color={theme.buttonInk} size={15} />
                    : <PlayIcon color={theme.goldText} size={14} />}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.audioTitle, { color: theme.goldText }]} numberOfLines={1}>
                  {audioCurrent && player.isPlaying ? t('gita.audioPlaying', 'अध्याय चल रहा है…') : t('gita.audioListen', 'इस अध्याय को सुनें')}
                </Text>
                <Text style={[styles.audioSub, { color: theme.textMuted }]} numberOfLines={1}>
                  {t('gita.audioBy', 'यथार्थ गीता · स्वामी अड़गड़ानंद')}{audio.durationText ? ` · ${audio.durationText}` : ''}
                </Text>
              </View>
            </Pressable>
          )}

          {/* reading language toggle — हिंदी / English / दोनों */}
          <View style={[styles.langRow, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.4)' : 'rgba(176,115,22,0.05)' }]}>
            {LANG_OPTS.map((o) => {
              const active = readLang === o.key;
              return (
                <Pressable key={o.key} onPress={() => { hTap(); setReadLang(o.key); }} style={styles.langBtnWrap}>
                  {active ? (
                    <LinearGradient colors={['#fce8a8', '#e9b850', '#b87f1a']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.langBtn}>
                      <Text style={[styles.langBtnText, { color: '#2a1c00' }]}>{o.label}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.langBtn}><Text style={[styles.langBtnText, { color: theme.textSoft }]}>{o.label}</Text></View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* summary */}
          {!!summary && (
            <View style={[styles.summaryCard, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.4)' : 'rgba(176,115,22,0.04)' }]}>
              <Text style={[styles.summaryHead, { color: theme.goldText }]}>{t('gita.summary', 'Chapter Summary')}</Text>
              <Text style={[styles.summaryText, { color: theme.textSoft }]}>{summary}</Text>
            </View>
          )}

          {/* verses */}
          <View style={{ gap: 14, marginTop: 6 }}>
            {data.verses.map((v) => (
              <View
                key={v.verse}
                style={[styles.verseCard, { borderColor: theme.isDark ? 'rgba(201,150,46,0.26)' : 'rgba(176,115,22,0.2)', backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : '#fffdf7' }]}
              >
                {/* verse number */}
                <View style={styles.verseHead}>
                  <Text style={[styles.verseNo, { color: theme.gold1 }]}>{t('gita.verse', 'Verse')} {data.chapter}.{v.verse}</Text>
                  <LinearGradient colors={['transparent', goldDivider, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.hr} />
                </View>

                {/* sanskrit shloka */}
                <Text style={[styles.sanskrit, { color: theme.isDark ? '#f3e6c2' : theme.text }]}>{v.sanskrit}</Text>

                {/* transliteration */}
                {!!v.transliteration && (
                  <Text style={[styles.translit, { color: theme.textMuted }]}>{v.transliteration}</Text>
                )}

                {/* translation — readLang ke hisaab se (Hindi / English / dono) */}
                {showHi && !!v.hindi && (
                  <View style={[styles.transBox, { borderTopColor: theme.isDark ? 'rgba(201,150,46,0.2)' : 'rgba(176,115,22,0.15)' }]}>
                    <Text style={[styles.transLabel, { color: theme.gold2 }]}>हिंदी</Text>
                    <Text style={[styles.transText, { color: theme.text }]}>{v.hindi}</Text>
                  </View>
                )}
                {showEn && !!v.english && (
                  <View style={[styles.transBox, { borderTopColor: theme.isDark ? 'rgba(201,150,46,0.2)' : 'rgba(176,115,22,0.15)' }]}>
                    <Text style={[styles.transLabel, { color: theme.gold2 }]}>English</Text>
                    <Text style={[styles.transText, { color: theme.text }]}>{v.english}</Text>
                  </View>
                )}

                <VerseMeaning fetcher={() => getGitaExplanation(data.chapter, v.verse)} />
              </View>
            ))}
          </View>
        </>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  center: { paddingVertical: 50, alignItems: 'center' },
  err: { fontFamily: fonts.inter, fontSize: 13, textAlign: 'center', paddingVertical: 30 },

  hero: { alignItems: 'center', marginBottom: 16 },
  num: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  numText: { fontFamily: fonts.cinzelXBold, fontSize: 20, color: '#2a1c00' },
  chName: { fontFamily: fonts.devanagari, fontSize: 20, textAlign: 'center' },
  chTranslit: { fontFamily: fonts.cinzel, fontSize: 17, letterSpacing: 1, marginTop: 2 },
  chMeaning: { fontFamily: fonts.inter, fontSize: 12, marginTop: 4, textAlign: 'center' },

  audioBar: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: radii.lg, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 14 },
  audioDot: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  audioTitle: { fontFamily: fonts.interSemi, fontSize: 13.5 },
  audioSub: { fontFamily: fonts.inter, fontSize: 11, marginTop: 2 },
  langRow: { flexDirection: 'row', gap: 4, padding: 4, borderWidth: 1, borderRadius: radii.pill, marginBottom: 14 },
  langBtnWrap: { flex: 1, borderRadius: radii.pill, overflow: 'hidden' },
  langBtn: { paddingVertical: 8, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  langBtnText: { fontFamily: fonts.interSemi, fontSize: 12.5, letterSpacing: 0.3 },

  summaryCard: { borderWidth: 1, borderRadius: radii.lg, padding: 14, marginBottom: 8 },
  summaryHead: { fontFamily: fonts.cinzelSemi, fontSize: 12, letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' },
  summaryText: { fontFamily: fonts.inter, fontSize: 13, lineHeight: 20 },

  verseCard: { borderWidth: 1, borderRadius: radii.lg, padding: 16 },
  verseHead: { marginBottom: 12 },
  verseNo: { fontFamily: fonts.cinzelSemi, fontSize: 12, letterSpacing: 1 },
  hr: { height: 1, marginTop: 8, borderRadius: 1 },
  sanskrit: { fontFamily: fonts.devanagari, fontSize: 17, lineHeight: 30, textAlign: 'center' },
  translit: { fontFamily: fonts.inter, fontStyle: 'italic', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 10 },
  transBox: { borderTopWidth: 1, marginTop: 14, paddingTop: 12 },
  transLabel: { fontFamily: fonts.interSemi, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 5 },
  transText: { fontFamily: fonts.inter, fontSize: 13.5, lineHeight: 21 },
});
