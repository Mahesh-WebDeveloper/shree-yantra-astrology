import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import Svg, { Path, Polyline } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { Theme, fonts, radii } from '../theme/tokens';
import { Page } from '../components/Page';
import { GradientText } from '../components/GradientText';
import { OmGlyph } from '../components/icons/OmGlyph';
import { PlayIcon, PauseIcon } from '../audio/PlayerIcons';
import { usePlayer } from '../audio/PlayerProvider';
import { useGitaAudio, gitaTrack } from '../hooks/useGitaAudio';
import { hTap } from '../lib/haptics';
import { useT, useLang } from '../i18n/LanguageProvider';
import { getGitaChapters, GitaChapterInfo, MediaItem } from '../lib/api';
import { Track } from '../data/library';

/* Per-chapter "Listen" button — own Pressable so tapping it never opens the chapter. */
function ListenBtn({ media, queue, theme }: { media: MediaItem; queue: Track[]; theme: Theme }) {
  const player = usePlayer();
  const current = player.track?.id === media._id;
  const onPress = () => { hTap(); player.play(gitaTrack(media), queue); };
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.listen,
        { borderColor: theme.gold2, backgroundColor: current && player.isPlaying ? theme.gold1 : (theme.isDark ? 'rgba(233,184,80,0.1)' : 'rgba(176,115,22,0.06)') },
        pressed && { transform: [{ scale: 0.9 }] },
      ]}
    >
      {current && player.loading
        ? <ActivityIndicator color={theme.goldText} size="small" />
        : current && player.isPlaying
          ? <PauseIcon color={theme.buttonInk} size={14} />
          : <PlayIcon color={theme.goldText} size={13} />}
    </Pressable>
  );
}

const Chevron = ({ c }: { c: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="9 18 15 12 9 6" />
  </Svg>
);

export function GitaScreen({ navigation }: any) {
  const { theme } = useTheme();
  const t = useT();
  const { lang } = useLang();
  const [chapters, setChapters] = useState<GitaChapterInfo[] | null>(null);
  const [err, setErr] = useState(false);
  const gita = useGitaAudio();

  useEffect(() => {
    let on = true;
    getGitaChapters()
      .then((r) => { if (on) setChapters(r.chapters); })
      .catch(() => { if (on) setErr(true); });
    return () => { on = false; };
  }, []);

  return (
    <Page title={t('gita.title', 'Bhagavad Gita')} onBack={() => { hTap(); navigation.goBack(); }}>
      {/* hero */}
      <View style={styles.hero}>
        <View style={[styles.omCircle, { borderColor: 'rgba(201,150,46,0.5)', backgroundColor: theme.isDark ? 'rgba(0,0,0,0.5)' : 'rgba(176,115,22,0.05)' }]}>
          <OmGlyph size={40} />
        </View>
        <GradientText style={styles.heroTitle}>{t('gita.title', 'Bhagavad Gita')}</GradientText>
        <Text style={[styles.heroSub, { color: theme.gold2 }]}>{t('gita.subtitle', '18 Chapters · 700 Verses')}</Text>
      </View>

      {!chapters && !err && (
        <View style={styles.center}><ActivityIndicator color={theme.gold1} /></View>
      )}
      {err && (
        <Text style={[styles.err, { color: theme.textMuted }]}>Content load nahi ho paya — internet check karein.</Text>
      )}

      <View style={{ gap: 10 }}>
        {chapters?.map((ch) => (
          <Pressable
            key={ch.chapter}
            onPress={() => { hTap(); navigation.navigate('GitaChapter', { chapter: ch.chapter }); }}
            style={({ pressed }) => [
              styles.card,
              {
                borderColor: theme.isDark ? 'rgba(201,150,46,0.28)' : 'rgba(176,115,22,0.22)',
                backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : '#fffdf7',
              },
              pressed && { transform: [{ scale: 0.99 }], borderColor: theme.gold2 },
            ]}
          >
            {/* chapter number medallion */}
            <LinearGradient colors={['#fce8a8', '#e9b850', '#c9962e']} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.num}>
              <Text style={styles.numText}>{ch.chapter}</Text>
            </LinearGradient>

            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.chName, { color: theme.text }]} numberOfLines={1}>{ch.name}</Text>
              <Text style={[styles.chTranslit, { color: theme.gold1 }]} numberOfLines={1}>{ch.transliterated}</Text>
              <Text style={[styles.chMeaning, { color: theme.textMuted }]} numberOfLines={1}>
                {ch.meaning} · {ch.versesCount} {t('gita.verses', 'verses')}
              </Text>
            </View>
            {gita.byChapter.get(ch.chapter) && <ListenBtn media={gita.byChapter.get(ch.chapter)!} queue={gita.queue} theme={theme} />}
            <Chevron c={theme.gold2} />
          </Pressable>
        ))}
      </View>

      {/* प्राक्कथन + उपशम — audio-only (intro/conclusion) */}
      {(gita.prakkathan || gita.upasham) && (
        <View style={{ gap: 10, marginTop: 10 }}>
          {[gita.prakkathan, gita.upasham].filter(Boolean).map((m) => (
            <View key={m!._id} style={[styles.card, { borderColor: theme.isDark ? 'rgba(201,150,46,0.28)' : 'rgba(176,115,22,0.22)', backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : '#fffdf7' }]}>
              <View style={[styles.num, { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.gold2 }]}>
                <Text style={{ color: theme.goldText, fontSize: 18, fontFamily: fonts.devanagari }}>ॐ</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.chName, { color: theme.text }]} numberOfLines={1}>{m!.title.replace(/^Yatharth Geeta - /, '')}</Text>
                <Text style={[styles.chMeaning, { color: theme.textMuted }]} numberOfLines={1}>
                  {t('gita.audioBy', 'यथार्थ गीता · स्वामी अड़गड़ानंद')}{m!.durationText ? ` · ${m!.durationText}` : ''}
                </Text>
              </View>
              <ListenBtn media={m!} queue={gita.queue} theme={theme} />
            </View>
          ))}
        </View>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginBottom: 18, marginTop: 4 },
  omCircle: { width: 72, height: 72, borderRadius: 36, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  heroTitle: { fontFamily: fonts.cinzel, fontSize: 24, letterSpacing: 1.5 },
  heroSub: { fontFamily: fonts.interSemi, fontSize: 12, letterSpacing: 1, marginTop: 6 },

  center: { paddingVertical: 40, alignItems: 'center' },
  err: { fontFamily: fonts.inter, fontSize: 13, textAlign: 'center', paddingVertical: 30 },

  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: radii.lg, borderWidth: 1 },
  num: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  numText: { fontFamily: fonts.cinzelXBold, fontSize: 17, color: '#2a1c00' },
  chName: { fontFamily: fonts.devanagari, fontSize: 16 },
  chTranslit: { fontFamily: fonts.playfair, fontSize: 14.5, marginTop: 1 },
  chMeaning: { fontFamily: fonts.inter, fontSize: 11.5, marginTop: 2 },
  listen: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
