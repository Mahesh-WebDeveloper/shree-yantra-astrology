import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, LayoutAnimation, Platform, UIManager, Share } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Page } from '../components/Page';
import { GradientText } from '../components/GradientText';
import { ExplainButton } from '../components/ExplainButton';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';
import { hTap, hSelect } from '../lib/haptics';
import { useLang } from '../i18n/LanguageProvider';
import { AARTIS, AARTI_CATEGORIES, AARTI_LIST, FullAarti } from '../data/aartis';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) UIManager.setLayoutAnimationEnabledExperimental(true);
const ease = () => LayoutAnimation.configureNext(LayoutAnimation.create(200, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity));

const Chevron = ({ open, c }: { open: boolean; c: string }) => (
  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}><Path d="M6 9l6 6 6-6" /></Svg>
);

function AartiRow({ theme, hi, a }: { theme: any; hi: boolean; a: FullAarti }) {
  const [open, setOpen] = useState(false);
  const share = () => { hTap(); Share.share({ message: `${a.titleHi}\n\n${a.lines}\n\n— Shree Yantra Astrology 🙏` }).catch(() => {}); };
  return (
    <View style={[styles.card, { borderColor: open ? theme.gold3 : theme.cardBorder, backgroundColor: theme.isDark ? '#000000' : 'rgba(255,253,247,0.92)' }]}>
      <Pressable onPress={() => { hSelect(); ease(); setOpen((x) => !x); }} style={styles.head} hitSlop={4}>
        <View style={[styles.dot, { borderColor: theme.gold3, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.12)' : '#fff' }]}><Text style={{ fontSize: 17 }}>🪔</Text></View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={open ? undefined : 1}>{hi ? a.titleHi : a.titleEn}</Text>
          <Text style={[styles.deity, { color: theme.textMuted }]} numberOfLines={1}>{a.deity}</Text>
        </View>
        <Chevron open={open} c={theme.gold2} />
      </Pressable>
      {open && (
        <View style={{ marginTop: 10 }}>
          <Text style={[styles.lines, { color: theme.text }]}>{a.lines}</Text>
          <View style={styles.actions}>
            <Pressable onPress={share} style={[styles.actBtn, { borderColor: theme.gold3 }]}><Text style={[styles.actTxt, { color: theme.gold1 }]}>📤 {hi ? 'शेयर' : 'Share'}</Text></Pressable>
          </View>
          <ExplainButton text={`${a.titleHi}\n${a.lines}`} context={hi ? 'आरती' : 'Aarti'} />
        </View>
      )}
    </View>
  );
}

export function AartiSangrahScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const hi = lang === 'hi';
  const [query, setQuery] = useState('');
  const dim = theme.isDark ? '#b89a5b' : theme.textMuted;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return AARTI_LIST.filter((a) => `${a.titleHi} ${a.titleEn} ${a.deity}`.toLowerCase().includes(q));
  }, [query]);

  return (
    <Page title={hi ? 'आरती संग्रह' : 'Aarti Sangrah'} onBack={() => { hTap(); navigation.goBack(); }}>
      {/* hero */}
      <LinearGradient colors={theme.isDark ? ['rgba(233,184,80,0.16)', 'rgba(233,184,80,0.03)'] : ['rgba(255,247,224,0.95)', 'rgba(255,253,247,0.9)']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={[styles.hero, { borderColor: theme.gold3 }]}>
        <LinearGradient colors={theme.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.crest}><Text style={{ fontSize: 30 }}>🪔</Text></LinearGradient>
        <Text style={[styles.heroDeva, { color: theme.text }]}>आरती संग्रह</Text>
        <GradientText style={styles.heroTitle}>AARTI SANGRAH</GradientText>
        <Text style={[styles.heroSub, { color: theme.gold2 }]}>{hi ? `${AARTI_LIST.length} सम्पूर्ण आरतियाँ · सभी देवी-देवता` : `${AARTI_LIST.length} complete aartis · all deities`}</Text>
      </LinearGradient>

      <TextInput
        value={query} onChangeText={setQuery}
        placeholder={hi ? 'आरती या देवता खोजें…' : 'Search aarti or deity…'}
        placeholderTextColor={theme.textMuted}
        style={[styles.search, { borderColor: theme.cardBorder, color: theme.text, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.62)' }]}
      />

      {filtered ? (
        <View style={{ gap: 10, marginTop: 12 }}>
          {filtered.length === 0 ? <Text style={[styles.empty, { color: theme.textMuted }]}>{hi ? 'कोई आरती नहीं मिली' : 'No aarti found'}</Text>
            : filtered.map((a) => <AartiRow key={a.id} theme={theme} hi={hi} a={a} />)}
        </View>
      ) : (
        AARTI_CATEGORIES.map((cat) => {
          const items = AARTI_LIST.filter((a) => a.category === cat.key);
          if (!items.length) return null;
          return (
            <View key={cat.key} style={{ marginTop: 18 }}>
              <View style={styles.catHead}>
                <View style={[styles.catLine, { backgroundColor: theme.gold3 }]} />
                <Text style={[styles.catTitle, { color: theme.gold1 }]}>{hi ? cat.hi : cat.en}</Text>
                <View style={[styles.catLine, { backgroundColor: theme.gold3 }]} />
              </View>
              <View style={{ gap: 10, marginTop: 10 }}>
                {items.map((a) => <AartiRow key={a.id} theme={theme} hi={hi} a={a} />)}
              </View>
            </View>
          );
        })
      )}

      <Text style={[styles.footer, { color: dim }]}>{hi ? '॥ जय जय देव हरे ॥' : '॥ Jai Jai Dev Hare ॥'}</Text>
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

  card: { borderWidth: 1, borderRadius: 14, padding: 13 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  dot: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.playfair, fontSize: 15.5, lineHeight: 22 },
  deity: { fontFamily: fonts.inter, fontSize: 11.5, marginTop: 2 },
  lines: { fontFamily: fonts.devanagari, fontSize: 16, lineHeight: 32 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actBtn: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  actTxt: { fontFamily: fonts.interSemi, fontSize: 11.5 },

  empty: { fontFamily: fonts.inter, fontSize: 13, textAlign: 'center', paddingVertical: 20 },
  footer: { fontFamily: fonts.devanagari, fontSize: 15, textAlign: 'center', marginTop: 20 },
});
