import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radii } from '../theme/tokens';
import { Page } from '../components/Page';
import { GradientText } from '../components/GradientText';
import { VerseMeaning } from '../components/VerseMeaning';
import { hTap } from '../lib/haptics';
import { useT } from '../i18n/LanguageProvider';
import { getRigSukta, getRigvedaExplanation, RigSuktaFull } from '../lib/api';

export function RigvedaSuktaScreen({ navigation, route }: any) {
  const { theme } = useTheme();
  const t = useT();
  const mandala: number = route?.params?.mandala || 1;
  const suktaNo: number = route?.params?.sukta || 1;
  const [data, setData] = useState<RigSuktaFull | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let on = true;
    getRigSukta(mandala, suktaNo).then((r) => { if (on) setData(r.sukta); }).catch(() => { if (on) setErr(true); });
    return () => { on = false; };
  }, [mandala, suktaNo]);

  const goldDivider = theme.isDark ? 'rgba(201,150,46,0.45)' : 'rgba(176,115,22,0.35)';

  return (
    <Page title={`${t('rig.mandala', 'Mandala')} ${mandala} · ${t('rig.sukta', 'Sukta')} ${suktaNo}`} onBack={() => { hTap(); navigation.goBack(); }}>
      {!data && !err && <View style={styles.center}><ActivityIndicator color={theme.gold1} /></View>}
      {err && <Text style={[styles.err, { color: theme.textMuted }]}>{t('rig.loadErr', 'Load nahi ho paya — internet check karein.')}</Text>}

      {data && (
        <>
          <View style={styles.hero}>
            <GradientText style={styles.chTitle}>{t('rig.sukta', 'Sukta')} {mandala}.{suktaNo}</GradientText>
            <Text style={[styles.chSub, { color: theme.textMuted }]}>{data.mantraCount} {t('rig.mantras', 'mantras')}</Text>
          </View>

          <View style={{ gap: 14, marginTop: 6 }}>
            {data.mantras.map((v) => (
              <View key={v.verse} style={[styles.verseCard, { borderColor: theme.isDark ? 'rgba(201,150,46,0.26)' : 'rgba(176,115,22,0.2)', backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : '#fffdf7' }]}>
                <View style={styles.verseHead}>
                  <Text style={[styles.verseNo, { color: theme.gold1 }]}>{t('rig.mantra', 'Mantra')} {mandala}.{suktaNo}.{v.verse}</Text>
                  <LinearGradient colors={['transparent', goldDivider, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.hr} />
                </View>

                {!!v.sanskrit && <Text style={[styles.sanskrit, { color: theme.isDark ? '#f3e6c2' : theme.text }]}>{v.sanskrit}</Text>}
                {!!v.transliteration && <Text style={[styles.translit, { color: theme.textMuted }]}>{v.transliteration}</Text>}

                {!!v.hindi && (
                  <View style={[styles.transBox, { borderTopColor: theme.isDark ? 'rgba(201,150,46,0.2)' : 'rgba(176,115,22,0.15)' }]}>
                    <Text style={[styles.transLabel, { color: theme.gold2 }]}>{t('rig.hindiAnuvad', 'हिंदी अनुवाद')}</Text>
                    <Text style={[styles.hindiText, { color: theme.text }]}>{v.hindi}</Text>
                  </View>
                )}
                {!!v.english && (
                  <View style={[styles.transBox, { borderTopColor: theme.isDark ? 'rgba(201,150,46,0.2)' : 'rgba(176,115,22,0.15)' }]}>
                    <Text style={[styles.transLabel, { color: theme.gold2 }]}>English</Text>
                    <Text style={[styles.transText, { color: theme.text }]}>{v.english}</Text>
                  </View>
                )}

                <VerseMeaning fetcher={() => getRigvedaExplanation(mandala, suktaNo, v.verse)} />
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
  chTitle: { fontFamily: fonts.cinzel, fontSize: 20, letterSpacing: 1 },
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
  hindiText: { fontFamily: fonts.devanagari, fontSize: 15, lineHeight: 25 },
});
