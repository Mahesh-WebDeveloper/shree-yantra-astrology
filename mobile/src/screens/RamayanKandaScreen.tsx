import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radii } from '../theme/tokens';
import { Page } from '../components/Page';
import { GradientText } from '../components/GradientText';
import { hTap } from '../lib/haptics';
import { useT, useLang } from '../i18n/LanguageProvider';
import { aKanda } from '../i18n/astro';
import { getRamayanSargas, RamayanSargaInfo } from '../lib/api';

export function RamayanKandaScreen({ navigation, route }: any) {
  const { theme } = useTheme();
  const t = useT();
  const { lang } = useLang();
  const kandaOrder: number = route?.params?.kanda || 1;
  const kandaName: string = route?.params?.name || '';
  const [sargas, setSargas] = useState<RamayanSargaInfo[] | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let on = true;
    getRamayanSargas(kandaOrder).then((r) => { if (on) setSargas(r.sargas); }).catch(() => { if (on) setErr(true); });
    return () => { on = false; };
  }, [kandaOrder]);

  return (
    <Page title={aKanda(kandaName, lang) || t('ram.title', 'Ramayana')} onBack={() => { hTap(); navigation.goBack(); }}>
      <View style={styles.hero}>
        <GradientText style={styles.heroTitle}>{aKanda(kandaName, lang)}</GradientText>
        {sargas && <Text style={[styles.heroSub, { color: theme.gold2 }]}>{sargas.length} {t('ram.sargas', 'Sargas')}</Text>}
      </View>

      {!sargas && !err && <View style={styles.center}><ActivityIndicator color={theme.gold1} /></View>}
      {err && <Text style={[styles.err, { color: theme.textMuted }]}>Load nahi ho paya.</Text>}

      <View style={styles.grid}>
        {sargas?.map((s) => (
          <Pressable
            key={s.sarga}
            onPress={() => { hTap(); navigation.navigate('RamayanSarga', { kanda: kandaOrder, sarga: s.sarga, name: kandaName }); }}
            style={({ pressed }) => [
              styles.tile,
              { borderColor: theme.isDark ? 'rgba(201,150,46,0.28)' : 'rgba(176,115,22,0.22)', backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : '#fffdf7' },
              pressed && { transform: [{ scale: 0.95 }], borderColor: theme.gold2 },
            ]}
          >
            <Text style={[styles.tileNo, { color: theme.gold1 }]}>{s.sarga}</Text>
            <Text style={[styles.tileSub, { color: theme.textMuted }]}>{s.shlokaCount} {t('ram.shlokas', 'shlokas')}</Text>
          </Pressable>
        ))}
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginBottom: 16, marginTop: 2 },
  heroTitle: { fontFamily: fonts.devanagari, fontSize: 22 },
  heroSub: { fontFamily: fonts.interSemi, fontSize: 12, letterSpacing: 1, marginTop: 4 },
  center: { paddingVertical: 40, alignItems: 'center' },
  err: { fontFamily: fonts.inter, fontSize: 13, textAlign: 'center', paddingVertical: 30 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile: { width: '22.5%', flexGrow: 1, minWidth: 72, aspectRatio: 1, borderWidth: 1, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  tileNo: { fontFamily: fonts.cinzelXBold, fontSize: 20 },
  tileSub: { fontFamily: fonts.inter, fontSize: 9, marginTop: 3 },
});
