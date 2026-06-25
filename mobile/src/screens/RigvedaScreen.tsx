import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radii } from '../theme/tokens';
import { Page } from '../components/Page';
import { GradientText } from '../components/GradientText';
import { OmGlyph } from '../components/icons/OmGlyph';
import { hTap } from '../lib/haptics';
import { useT } from '../i18n/LanguageProvider';
import { getRigMandalas, RigMandala } from '../lib/api';

const Chevron = ({ c }: { c: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Polyline points="9 18 15 12 9 6" /></Svg>
);

export function RigvedaScreen({ navigation }: any) {
  const { theme } = useTheme();
  const t = useT();
  const [mandalas, setMandalas] = useState<RigMandala[] | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let on = true;
    getRigMandalas().then((r) => { if (on) setMandalas(r.mandalas); }).catch(() => { if (on) setErr(true); });
    return () => { on = false; };
  }, []);

  return (
    <Page title={t('rig.title', 'Rigveda')} onBack={() => { hTap(); navigation.goBack(); }}>
      <View style={styles.hero}>
        <View style={[styles.omCircle, { borderColor: 'rgba(201,150,46,0.5)', backgroundColor: theme.isDark ? 'rgba(0,0,0,0.5)' : 'rgba(176,115,22,0.05)' }]}>
          <OmGlyph size={40} />
        </View>
        <GradientText style={styles.heroTitle}>{t('rig.title', 'Rigveda')}</GradientText>
        <Text style={[styles.heroSub, { color: theme.gold2 }]}>{t('rig.subtitle', 'Sanskrit & English · 10 Mandala')}</Text>
      </View>

      {!mandalas && !err && <View style={styles.center}><ActivityIndicator color={theme.gold1} /></View>}
      {err && <Text style={[styles.err, { color: theme.textMuted }]}>{t('rig.loadErr', 'Content load nahi ho paya — internet check karein.')}</Text>}

      <View style={{ gap: 10 }}>
        {mandalas?.map((m) => (
          <Pressable
            key={m.mandala}
            onPress={() => { hTap(); navigation.navigate('RigvedaMandala', { mandala: m.mandala }); }}
            style={({ pressed }) => [
              styles.card,
              { borderColor: theme.isDark ? 'rgba(201,150,46,0.28)' : 'rgba(176,115,22,0.22)', backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : '#fffdf7' },
              pressed && { transform: [{ scale: 0.99 }], borderColor: theme.gold2 },
            ]}
          >
            <LinearGradient colors={['#fce8a8', '#e9b850', '#c9962e']} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.num}>
              <Text style={styles.numText}>{m.mandala}</Text>
            </LinearGradient>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.kName, { color: theme.text }]} numberOfLines={1}>{t('rig.mandala', 'Mandala')} {m.mandala}</Text>
              <Text style={[styles.kSub, { color: theme.textMuted }]} numberOfLines={1}>
                {m.suktas} {t('rig.suktas', 'Suktas')} · {m.mantras} {t('rig.mantras', 'mantras')}
              </Text>
            </View>
            <Chevron c={theme.gold2} />
          </Pressable>
        ))}
      </View>
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
  kName: { fontFamily: fonts.devanagari, fontSize: 17 },
  kSub: { fontFamily: fonts.inter, fontSize: 11.5, marginTop: 3 },
});
