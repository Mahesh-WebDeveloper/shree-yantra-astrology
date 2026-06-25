import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radii } from '../theme/tokens';
import { Page } from '../components/Page';
import { GradientText } from '../components/GradientText';
import { VerseMeaning } from '../components/VerseMeaning';
import { hTap } from '../lib/haptics';
import { useT } from '../i18n/LanguageProvider';
import { getRcmKanda, getRcmExplanation, RcmKandaFull } from '../lib/api';

const PAGE = 50;

export function RamcharitmanasKandaScreen({ navigation, route }: any) {
  const { theme } = useTheme();
  const t = useT();
  const kandaOrder: number = route?.params?.kanda || 1;
  const kandaName: string = route?.params?.name || '';
  const [data, setData] = useState<RcmKandaFull | null>(null);
  const [err, setErr] = useState(false);
  const [limit, setLimit] = useState(PAGE);

  useEffect(() => {
    let on = true;
    getRcmKanda(kandaOrder).then((r) => { if (on) setData(r.kanda); }).catch(() => { if (on) setErr(true); });
    return () => { on = false; };
  }, [kandaOrder]);

  const goldDivider = theme.isDark ? 'rgba(201,150,46,0.45)' : 'rgba(176,115,22,0.35)';
  const shown = useMemo(() => data?.verses.slice(0, limit) ?? [], [data, limit]);
  const hasMore = data ? limit < data.verses.length : false;

  return (
    <Page title={kandaName || t('rcm.title', 'Ramcharitmanas')} onBack={() => { hTap(); navigation.goBack(); }}>
      {!data && !err && <View style={styles.center}><ActivityIndicator color={theme.gold1} /></View>}
      {err && <Text style={[styles.err, { color: theme.textMuted }]}>{t('rcm.loadErr', 'Load nahi ho paya — internet check karein.')}</Text>}

      {data && (
        <>
          <View style={styles.hero}>
            <GradientText style={styles.chTitle}>{data.kandaHindi}</GradientText>
            <Text style={[styles.chSub, { color: theme.textMuted }]}>{data.verseCount} {t('rcm.verses', 'verses')}</Text>
          </View>

          <View style={{ gap: 14, marginTop: 4 }}>
            {shown.map((v, i) => (
              <View key={i} style={[styles.verseCard, { borderColor: theme.isDark ? 'rgba(201,150,46,0.26)' : 'rgba(176,115,22,0.2)', backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : '#fffdf7' }]}>
                <View style={styles.verseHead}>
                  <Text style={[styles.verseNo, { color: theme.gold1 }]}>{v.type ? `${v.type} · ` : ''}{v.number}</Text>
                  <LinearGradient colors={['transparent', goldDivider, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.hr} />
                </View>
                <Text style={[styles.verseText, { color: theme.isDark ? '#f3e6c2' : theme.text }]}>{v.text}</Text>
                <VerseMeaning fetcher={() => getRcmExplanation(kandaOrder, v.number)} />
              </View>
            ))}
          </View>

          {hasMore && (
            <Pressable onPress={() => { hTap(); setLimit((n) => n + PAGE); }} style={styles.moreWrap}>
              <LinearGradient colors={['#fce8a8', '#e9b850', '#b87f1a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.moreBtn}>
                <Text style={styles.moreText}>{t('rcm.loadMore', 'और देखें')}</Text>
              </LinearGradient>
            </Pressable>
          )}
        </>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  center: { paddingVertical: 50, alignItems: 'center' },
  err: { fontFamily: fonts.inter, fontSize: 13, textAlign: 'center', paddingVertical: 30 },
  hero: { alignItems: 'center', marginBottom: 14 },
  chTitle: { fontFamily: fonts.devanagari, fontSize: 24 },
  chSub: { fontFamily: fonts.inter, fontSize: 12, marginTop: 4 },
  verseCard: { borderWidth: 1, borderRadius: radii.lg, padding: 16 },
  verseHead: { marginBottom: 12 },
  verseNo: { fontFamily: fonts.cinzelSemi, fontSize: 12, letterSpacing: 1 },
  hr: { height: 1, marginTop: 8, borderRadius: 1 },
  verseText: { fontFamily: fonts.devanagari, fontSize: 17, lineHeight: 31, textAlign: 'center' },
  moreWrap: { marginTop: 18, borderRadius: radii.pill, overflow: 'hidden' },
  moreBtn: { paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  moreText: { fontFamily: fonts.interSemi, fontSize: 13.5, letterSpacing: 0.5, color: '#2a1c00' },
});
