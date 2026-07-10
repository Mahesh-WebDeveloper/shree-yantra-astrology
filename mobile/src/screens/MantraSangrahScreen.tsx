import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Page } from '../components/Page';
import { GradientText } from '../components/GradientText';
import { ExplainButton } from '../components/ExplainButton';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';
import { hTap } from '../lib/haptics';
import { useLang } from '../i18n/LanguageProvider';
import { MANTRAS_COLL, MANTRA_CATEGORIES, CollMantra } from '../data/mantraSangrah';

function MantraRow({ theme, hi, m }: { theme: any; hi: boolean; m: CollMantra }) {
  const share = () => { hTap(); Share.share({ message: `${m.titleHi}\n\n${m.sanskrit}\n\n${m.meaningHi}\n\n— Shree Yantra Astrology 🙏` }).catch(() => {}); };
  return (
    <View style={[styles.card, { borderColor: theme.gold3, backgroundColor: theme.isDark ? '#000000' : 'rgba(255,253,247,0.92)' }]}>
      <View style={styles.head}>
        <View style={[styles.dot, { borderColor: theme.gold3, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.12)' : '#fff' }]}><Text style={{ fontSize: 17 }}>📿</Text></View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.title, { color: theme.text }]}>{hi ? m.titleHi : m.titleEn}</Text>
          <Text style={[styles.deity, { color: theme.textMuted }]} numberOfLines={1}>{m.deity}</Text>
        </View>
      </View>
      <Text style={[styles.sanskrit, { color: theme.text }]}>{m.sanskrit}</Text>
      <Text style={[styles.roman, { color: theme.textMuted }]}>{m.roman}</Text>
      <Text style={[styles.meaning, { color: theme.textSoft }]}>{hi ? m.meaningHi : m.meaningEn}</Text>
      <View style={styles.pills}>
        <View style={[styles.pill, { borderColor: theme.gold3 }]}><Text style={[styles.pillTxt, { color: theme.gold1 }]}>🕐 {hi ? m.whenHi : m.whenEn}</Text></View>
        <View style={[styles.pill, { borderColor: theme.gold3 }]}><Text style={[styles.pillTxt, { color: theme.gold1 }]}>🔢 {m.count}</Text></View>
      </View>
      <Text style={[styles.benefit, { color: theme.textMuted }]}>✦ {hi ? m.benefitHi : m.benefitEn}</Text>
      <View style={styles.actions}>
        <Pressable onPress={share} style={[styles.actBtn, { borderColor: theme.gold3 }]}><Text style={[styles.actTxt, { color: theme.gold1 }]}>📤 {hi ? 'शेयर' : 'Share'}</Text></Pressable>
      </View>
      <ExplainButton text={`${m.titleHi} — ${m.sanskrit} — ${m.meaningHi}`} context={hi ? 'मंत्र' : 'Mantra'} />
    </View>
  );
}

export function MantraSangrahScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const hi = lang === 'hi';
  const [query, setQuery] = useState('');
  const dim = theme.isDark ? '#b89a5b' : theme.textMuted;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return MANTRAS_COLL.filter((m) => `${m.titleHi} ${m.titleEn} ${m.deity}`.toLowerCase().includes(q));
  }, [query]);

  return (
    <Page title={hi ? 'मंत्र संग्रह' : 'Mantra Sangrah'} onBack={() => { hTap(); navigation.goBack(); }}>
      <LinearGradient colors={theme.isDark ? ['rgba(233,184,80,0.16)', 'rgba(233,184,80,0.03)'] : ['rgba(255,247,224,0.95)', 'rgba(255,253,247,0.9)']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={[styles.hero, { borderColor: theme.gold3 }]}>
        <LinearGradient colors={theme.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.crest}><Text style={{ fontSize: 30 }}>📿</Text></LinearGradient>
        <Text style={[styles.heroDeva, { color: theme.text }]}>मंत्र संग्रह</Text>
        <GradientText style={styles.heroTitle}>MANTRA SANGRAH</GradientText>
        <Text style={[styles.heroSub, { color: theme.gold2 }]}>{hi ? `${MANTRAS_COLL.length} मुख्य मंत्र · अर्थ · कब व कितनी बार` : `${MANTRAS_COLL.length} key mantras · meaning · when & count`}</Text>
      </LinearGradient>

      <TextInput value={query} onChangeText={setQuery} placeholder={hi ? 'मंत्र या देवता खोजें…' : 'Search mantra or deity…'} placeholderTextColor={theme.textMuted} style={[styles.search, { borderColor: theme.cardBorder, color: theme.text, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.62)' }]} />

      {filtered ? (
        <View style={{ gap: 12, marginTop: 12 }}>
          {filtered.length === 0 ? <Text style={[styles.empty, { color: theme.textMuted }]}>{hi ? 'कोई मंत्र नहीं मिला' : 'No mantra found'}</Text>
            : filtered.map((m) => <MantraRow key={m.id} theme={theme} hi={hi} m={m} />)}
        </View>
      ) : (
        MANTRA_CATEGORIES.map((cat) => {
          const items = MANTRAS_COLL.filter((m) => m.category === cat.key);
          if (!items.length) return null;
          return (
            <View key={cat.key} style={{ marginTop: 18 }}>
              <View style={styles.catHead}><View style={[styles.catLine, { backgroundColor: theme.gold3 }]} /><Text style={[styles.catTitle, { color: theme.gold1 }]}>{hi ? cat.hi : cat.en}</Text><View style={[styles.catLine, { backgroundColor: theme.gold3 }]} /></View>
              <View style={{ gap: 12, marginTop: 10 }}>{items.map((m) => <MantraRow key={m.id} theme={theme} hi={hi} m={m} />)}</View>
            </View>
          );
        })
      )}
      <Text style={[styles.footer, { color: dim }]}>{hi ? '॥ ॐ ॥' : '॥ Om ॥'}</Text>
      <View style={{ height: 12 }} />
    </Page>
  );
}

const styles = StyleSheet.create({
  hero: { borderWidth: 1, borderRadius: 20, alignItems: 'center', paddingVertical: 22, paddingHorizontal: 16, marginBottom: 14 },
  crest: { width: 62, height: 62, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  heroDeva: { fontFamily: fonts.devanagari, fontSize: 24, textAlign: 'center' },
  heroTitle: { fontFamily: fonts.cinzelSemi, fontSize: 14, letterSpacing: 2, textAlign: 'center', marginTop: 6 },
  heroSub: { fontFamily: fonts.interSemi, fontSize: 12, marginTop: 8, textAlign: 'center' },
  search: { height: 44, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontFamily: fonts.inter, fontSize: 13.5 },
  catHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  catLine: { flex: 1, height: 1, opacity: 0.5 },
  catTitle: { fontFamily: fonts.cinzelSemi, fontSize: 12.5, letterSpacing: 1.5, textAlign: 'center' },
  card: { borderWidth: 1, borderRadius: 14, padding: 14 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 10 },
  dot: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.playfair, fontSize: 16, lineHeight: 22 },
  deity: { fontFamily: fonts.inter, fontSize: 11.5, marginTop: 2 },
  sanskrit: { fontFamily: fonts.devanagari, fontSize: 17, lineHeight: 32 },
  roman: { fontFamily: fonts.inter, fontSize: 12, fontStyle: 'italic', lineHeight: 19, marginTop: 7 },
  meaning: { fontFamily: fonts.inter, fontSize: 13.5, lineHeight: 22, marginTop: 9 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 11 },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, alignItems: 'center', justifyContent: 'center' },
  pillTxt: { fontFamily: fonts.interSemi, fontSize: 10.5, includeFontPadding: false },
  benefit: { fontFamily: fonts.inter, fontSize: 12, lineHeight: 18, marginTop: 10, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actBtn: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  actTxt: { fontFamily: fonts.interSemi, fontSize: 11.5 },
  empty: { fontFamily: fonts.inter, fontSize: 13, textAlign: 'center', paddingVertical: 20 },
  footer: { fontFamily: fonts.devanagari, fontSize: 16, textAlign: 'center', marginTop: 20 },
});
