import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radii } from '../theme/tokens';
import { Page } from '../components/Page';
import { GradientText } from '../components/GradientText';
import { OmGlyph } from '../components/icons/OmGlyph';
import { PlayIcon, PauseIcon } from '../audio/PlayerIcons';
import { usePlayer } from '../audio/PlayerProvider';
import { hTap, hSelect } from '../lib/haptics';
import { getMedia, avatarUrl, MediaItem } from '../lib/api';
import { Track } from '../data/library';
import { useLibraryStore, toggleSaved } from '../lib/libraryStore';

const toTrack = (m: MediaItem): Track => ({
  id: m._id, title: m.title, sub: m.artist || m.subtitle || '',
  color: 'gold', source: avatarUrl(m.audioUrl) || m.audioUrl || '', loop: false,
});
const cleanTitle = (t: string) => t.replace(/^(?:Ep\s*\d+\s*[-–]\s*|#\s*\d+\s*[-–]?\s*)/i, '').trim();

/** Generic streaming audio playlist (Ramayan / Mahabharat / …). route.params: { subCategory, title, attribution } */
export function AudioPlaylistScreen({ navigation, route }: any) {
  const { theme } = useTheme();
  const player = usePlayer();
  const { saved } = useLibraryStore();
  const subCategory: string = route?.params?.subCategory;
  const title: string = route?.params?.title || 'Audio';
  const attribution: string = route?.params?.attribution || '';
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let on = true;
    getMedia({ subCategory, limit: 200 }).then((r) => { if (on) setItems(r.media || []); }).catch(() => { if (on) setErr(true); });
    return () => { on = false; };
  }, [subCategory]);

  const queue = useMemo(() => (items || []).map(toTrack), [items]);
  const isCurrent = (id: string) => player.track?.id === id;
  const playing = (id: string) => isCurrent(id) && player.isPlaying;

  return (
    <Page title={title} onBack={() => { hTap(); navigation.goBack(); }}>
      <View style={styles.hero}>
        <View style={[styles.omCircle, { borderColor: 'rgba(201,150,46,0.5)', backgroundColor: theme.isDark ? 'rgba(0,0,0,0.5)' : 'rgba(176,115,22,0.05)' }]}>
          <OmGlyph size={40} />
        </View>
        <GradientText style={styles.heroTitle}>{title}</GradientText>
        {items && <Text style={[styles.heroSub, { color: theme.gold2 }]}>{items.length} episodes</Text>}
      </View>

      {!items && !err && <View style={styles.center}><ActivityIndicator color={theme.gold1} /></View>}
      {err && <Text style={[styles.err, { color: theme.textMuted }]}>Audio load nahi ho paya — internet check karein.</Text>}

      <View style={{ gap: 10 }}>
        {items?.map((m, i) => (
          <Pressable
            key={m._id}
            onPress={() => { hTap(); player.play(toTrack(m), queue); }}
            style={({ pressed }) => [
              styles.row,
              { borderColor: theme.isDark ? 'rgba(201,150,46,0.26)' : 'rgba(176,115,22,0.2)', backgroundColor: (isCurrent(m._id) || pressed) ? (theme.isDark ? 'rgba(230,194,119,0.08)' : 'rgba(176,115,22,0.07)') : (theme.isDark ? 'rgba(255,255,255,0.02)' : '#fffdf7') },
            ]}
          >
            <Text style={[styles.idx, { color: theme.gold1 }]}>{i + 1}</Text>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>{cleanTitle(m.title)}</Text>
              {!!m.durationText && <Text style={[styles.dur, { color: theme.textMuted }]}>{m.durationText}</Text>}
            </View>
            <Pressable hitSlop={8} onPress={() => { hSelect(); toggleSaved(m._id); }} style={styles.bm}>
              <Text style={{ color: saved.includes(m._id) ? theme.gold1 : theme.textMuted, fontSize: 16 }}>{saved.includes(m._id) ? '🔖' : '🏷️'}</Text>
            </Pressable>
            <View style={[styles.playDot, { borderColor: 'rgba(220,180,80,0.4)', backgroundColor: playing(m._id) ? theme.gold1 : (theme.isDark ? 'rgba(0,0,0,0.3)' : 'rgba(176,115,22,0.06)') }]}>
              {isCurrent(m._id) && player.loading
                ? <ActivityIndicator color={theme.goldText} size="small" />
                : playing(m._id)
                  ? <PauseIcon color={theme.buttonInk} size={14} />
                  : <PlayIcon color={theme.goldText} size={13} />}
            </View>
          </Pressable>
        ))}
      </View>

      {!!items?.length && !!attribution && (
        <Text style={[styles.rights, { color: theme.textMuted }]}>{attribution}</Text>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginBottom: 16, marginTop: 4 },
  omCircle: { width: 72, height: 72, borderRadius: 36, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  heroTitle: { fontFamily: fonts.cinzel, fontSize: 22, letterSpacing: 1, textAlign: 'center' },
  heroSub: { fontFamily: fonts.interSemi, fontSize: 12, letterSpacing: 1, marginTop: 6 },
  center: { paddingVertical: 40, alignItems: 'center' },
  err: { fontFamily: fonts.inter, fontSize: 13, textAlign: 'center', paddingVertical: 30 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radii.lg, borderWidth: 1 },
  idx: { fontFamily: fonts.cinzelSemi, fontSize: 13, width: 26, textAlign: 'center' },
  title: { fontFamily: fonts.interSemi, fontSize: 13.5, lineHeight: 18 },
  dur: { fontFamily: fonts.inter, fontSize: 11, marginTop: 2 },
  bm: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  playDot: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  rights: { fontFamily: fonts.inter, fontSize: 10.5, textAlign: 'center', marginTop: 16, fontStyle: 'italic' },
});
