import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radii } from '../theme/tokens';
import { Page } from '../components/Page';
import { GradientText } from '../components/GradientText';
import { VerseMeaning } from '../components/VerseMeaning';
import { hTap } from '../lib/haptics';
import { useT, useLang } from '../i18n/LanguageProvider';
import { aKanda } from '../i18n/astro';
import { getRamayanSarga, getRamayanExplanation, RamayanSargaFull } from '../lib/api';

export function RamayanSargaScreen({ navigation, route }: any) {
  const { theme } = useTheme();
  const t = useT();
  const { lang } = useLang();
  const kandaOrder: number = route?.params?.kanda || 1;
  const sargaNo: number = route?.params?.sarga || 1;
  const kandaName: string = route?.params?.name || '';
  const [data, setData] = useState<RamayanSargaFull | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let on = true;
    getRamayanSarga(kandaOrder, sargaNo).then((r) => { if (on) setData(r.sarga); }).catch(() => { if (on) setErr(true); });
    return () => { on = false; };
  }, [kandaOrder, sargaNo]);

  const goldDivider = theme.isDark ? 'rgba(201,150,46,0.45)' : 'rgba(176,115,22,0.35)';

  return (
    <Page title={`${aKanda(kandaName, lang)} · ${t('ram.sarga', 'Sarga')} ${sargaNo}`} onBack={() => { hTap(); navigation.goBack(); }}>
      {!data && !err && <View style={styles.center}><ActivityIndicator color={theme.gold1} /></View>}
      {err && <Text style={[styles.err, { color: theme.textMuted }]}>Load nahi ho paya — internet check karein.</Text>}

      {data && (
        <>
          <View style={styles.hero}>
            <GradientText style={styles.chTitle}>{aKanda(kandaName, lang)}</GradientText>
            <Text style={[styles.chSub, { color: theme.textMuted }]}>{t('ram.sarga', 'Sarga')} {sargaNo} · {data.shlokaCount} {t('ram.shlokas', 'shlokas')}</Text>
          </View>

          <View style={{ gap: 14, marginTop: 6 }}>
            {data.shlokas.map((v, i) => (
              <View key={i} style={[styles.verseCard, { borderColor: theme.isDark ? 'rgba(201,150,46,0.26)' : 'rgba(176,115,22,0.2)', backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : '#fffdf7' }]}>
                <View style={styles.verseHead}>
                  <Text style={[styles.verseNo, { color: theme.gold1 }]}>{t('ram.shloka', 'Shloka')} {sargaNo}.{v.shloka}</Text>
                  <LinearGradient colors={['transparent', goldDivider, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.hr} />
                </View>

                {!!v.sanskrit && <Text style={[styles.sanskrit, { color: theme.isDark ? '#f3e6c2' : theme.text }]}>{v.sanskrit}</Text>}
                {!!v.transliteration && <Text style={[styles.translit, { color: theme.textMuted }]}>{v.transliteration}</Text>}

                {!!v.english && (
                  <View style={[styles.transBox, { borderTopColor: theme.isDark ? 'rgba(201,150,46,0.2)' : 'rgba(176,115,22,0.15)' }]}>
                    <Text style={[styles.transLabel, { color: theme.gold2 }]}>English</Text>
                    <Text style={[styles.transText, { color: theme.text }]}>{v.english}</Text>
                  </View>
                )}

                <VerseMeaning fetcher={() => getRamayanExplanation(kandaOrder, sargaNo, v.shloka)} />
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
  hero: { alignItems: 'center', marginBottom: 14 },
  chTitle: { fontFamily: fonts.devanagari, fontSize: 22 },
  chSub: { fontFamily: fonts.inter, fontSize: 12, marginTop: 4 },
  verseCard: { borderWidth: 1, borderRadius: radii.lg, padding: 16 },
  verseHead: { marginBottom: 12 },
  verseNo: { fontFamily: fonts.cinzelSemi, fontSize: 12, letterSpacing: 1 },
  hr: { height: 1, marginTop: 8, borderRadius: 1 },
  sanskrit: { fontFamily: fonts.devanagari, fontSize: 16.5, lineHeight: 29, textAlign: 'center' },
  translit: { fontFamily: fonts.inter, fontStyle: 'italic', fontSize: 11.5, lineHeight: 17, textAlign: 'center', marginTop: 10 },
  transBox: { borderTopWidth: 1, marginTop: 14, paddingTop: 12 },
  transLabel: { fontFamily: fonts.interSemi, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 5 },
  transText: { fontFamily: fonts.inter, fontSize: 13.5, lineHeight: 21 },
});
