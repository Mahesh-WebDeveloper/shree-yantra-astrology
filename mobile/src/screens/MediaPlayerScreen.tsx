import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import Svg, { Path } from 'react-native-svg';

import { Page } from '../components/Page';
import { Card } from '../components/Card';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radii } from '../theme/tokens';
import { hTap } from '../lib/haptics';

function PlayExternalIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M7 17L17 7" />
      <Path d="M8 7h9v9" />
      <Path d="M5 5v14h14" />
    </Svg>
  );
}

function embedUrl(videoId?: string, youtubeUrl?: string) {
  const id = videoId || youtubeUrl?.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]+)/)?.[1];
  return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1` : '';
}

export function MediaPlayerScreen({ navigation, route }: any) {
  const { theme } = useTheme();
  const media = route.params?.media || {};
  const url = embedUrl(media.youtubeVideoId, media.youtubeUrl);
  const externalUrl = media.sourceUrl || media.youtubeUrl || media.audioUrl || '';

  return (
    <Page title={media.title || 'Media'} onBack={() => { hTap(); navigation.goBack(); }}>
      <Card padded={false} style={styles.playerCard}>
        {url ? (
          <WebView
            source={{ uri: url }}
            allowsFullscreenVideo
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            style={styles.webview}
          />
        ) : (
          <View style={[styles.empty, { backgroundColor: theme.cardBg }]}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No playable source</Text>
            <Text style={[styles.emptySub, { color: theme.textMuted }]}>Add a YouTube URL or audio URL from admin.</Text>
          </View>
        )}
      </Card>

      <Card style={{ marginTop: 14 }}>
        <Text style={[styles.title, { color: theme.goldText }]}>{media.title || 'Untitled media'}</Text>
        {media.subtitle ? <Text style={[styles.sub, { color: theme.textSoft }]}>{media.subtitle}</Text> : null}
        <View style={styles.metaRow}>
          {media.category ? <Text style={[styles.pill, { color: theme.goldText, borderColor: theme.cardBorder }]}>{String(media.category).replace('_', ' ')}</Text> : null}
          {media.subCategory ? <Text style={[styles.pill, { color: theme.goldText, borderColor: theme.cardBorder }]}>{media.subCategory}</Text> : null}
          {media.durationText ? <Text style={[styles.pill, { color: theme.goldText, borderColor: theme.cardBorder }]}>{media.durationText}</Text> : null}
        </View>
        {media.attribution ? <Text style={[styles.rights, { color: theme.textMuted }]}>{media.attribution}</Text> : null}
        {media.licenseName ? <Text style={[styles.rights, { color: theme.textMuted }]}>{media.licenseName}</Text> : null}
        {media.rightsNote ? <Text style={[styles.rights, { color: theme.textMuted }]}>{media.rightsNote}</Text> : null}
        {externalUrl ? (
          <Pressable
            onPress={() => { hTap(); Linking.openURL(externalUrl).catch(() => {}); }}
            style={({ pressed }) => [styles.openBtn, { borderColor: theme.cardBorder }, pressed && { opacity: 0.8 }]}
          >
            <PlayExternalIcon color={theme.goldText} />
            <Text style={[styles.openText, { color: theme.goldText }]}>Open source</Text>
          </Pressable>
        ) : null}
      </Card>
    </Page>
  );
}

const styles = StyleSheet.create({
  playerCard: { overflow: 'hidden', borderRadius: radii.lg },
  webview: { width: '100%', aspectRatio: 16 / 9, minHeight: 220, backgroundColor: '#000' },
  empty: { minHeight: 220, alignItems: 'center', justifyContent: 'center', padding: 18 },
  emptyTitle: { fontFamily: fonts.interSemi, fontSize: 16 },
  emptySub: { fontFamily: fonts.inter, fontSize: 13, marginTop: 6, textAlign: 'center' },
  title: { fontFamily: fonts.playfairBold, fontSize: 22 },
  sub: { fontFamily: fonts.inter, fontSize: 13.5, lineHeight: 20, marginTop: 6 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  pill: { borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 5, fontFamily: fonts.interSemi, fontSize: 11, textTransform: 'capitalize' },
  rights: { fontFamily: fonts.inter, fontSize: 12, lineHeight: 18, marginTop: 10 },
  openBtn: { marginTop: 16, height: 44, borderRadius: radii.pill, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  openText: { fontFamily: fonts.interSemi, fontSize: 13 },
});
