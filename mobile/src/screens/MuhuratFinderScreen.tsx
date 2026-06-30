import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Page } from '../components/Page';
import { GradientText } from '../components/GradientText';
import { GoldButton } from '../components/GoldButton';
import { BirthPlaceField } from '../components/BirthPlaceField';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radii } from '../theme/tokens';
import { useLang } from '../i18n/LanguageProvider';
import { hTap } from '../lib/haptics';
import { aSign } from '../i18n/astro';
import { naamRashi } from '../lib/naamRashi';
import { birthFromProfile } from '../lib/birth';
import { muhuratCatByKey } from '../data/muhuratCategories';
import { findMuhurat, MuhuratItem, MuhuratResult, LocationSuggestion } from '../lib/api';

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MON_HI = ['जन', 'फ़र', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुल', 'अग', 'सित', 'अक्तू', 'नव', 'दिस'];
const WD_HI: Record<string, string> = { Sunday: 'रविवार', Monday: 'सोमवार', Tuesday: 'मंगलवार', Wednesday: 'बुधवार', Thursday: 'गुरुवार', Friday: 'शुक्रवार', Saturday: 'शनिवार' };

function dmyParts(dmy: string) {
  const [d, m, y] = String(dmy).split('/').map(Number);
  return { d, m, y };
}

function ResultCard({ item, best, lang, theme }: { item: MuhuratItem; best: boolean; lang: 'en' | 'hi'; theme: any }) {
  const { d, m, y } = dmyParts(item.dmy);
  const monName = (lang === 'hi' ? MON_HI : MON)[(m - 1) % 12];
  const wd = lang === 'hi' ? (item.weekdayHi || WD_HI[item.weekday] || item.weekday) : item.weekday;
  const nak = lang === 'hi' ? (item.nakshatra.hi || item.nakshatra.name) : item.nakshatra.name;
  const tithi = lang === 'hi' ? (item.tithi.hi || item.tithi.name) : item.tithi.name;
  const goodReasons = item.reasons.filter((r) => r.good).slice(0, 4);

  return (
    <View style={[styles.card, { borderColor: best ? theme.gold1 : theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.9)' }]}>
      {best && (
        <LinearGradient colors={['#fce8a8', '#e9b850', '#b87f1a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.bestTag}>
          <Text style={styles.bestTagTxt}>★ {lang === 'hi' ? 'सर्वश्रेष्ठ मुहूर्त' : 'Best Muhurat'}</Text>
        </LinearGradient>
      )}
      <View style={styles.cardTop}>
        <LinearGradient colors={best ? ['#eab94f', '#9f6b16'] : (theme.isDark ? ['#2a2410', '#15120a'] : ['#fff7e6', '#f3e2bd'])} style={styles.dateBox}>
          <Text style={[styles.dateDay, { color: best ? '#fff8ec' : theme.goldText }]}>{d}</Text>
          <Text style={[styles.dateMon, { color: best ? '#fff3da' : theme.gold2 }]}>{monName}</Text>
          <Text style={[styles.dateYr, { color: best ? 'rgba(255,248,236,0.8)' : theme.textMuted }]}>{y}</Text>
        </LinearGradient>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.wd, { color: theme.text }]}>{wd}</Text>
          <View style={styles.chipRow}>
            <View style={[styles.miniChip, { borderColor: theme.cardBorder }]}><Text style={[styles.miniChipTxt, { color: theme.gold2 }]}>{nak}</Text></View>
            <View style={[styles.miniChip, { borderColor: theme.cardBorder }]}><Text style={[styles.miniChipTxt, { color: theme.gold2 }]}>{tithi}</Text></View>
          </View>
          {!!item.time.abhijit && (
            <Text style={[styles.timeLine, { color: theme.gold1 }]}>
              🕉 {lang === 'hi' ? 'शुभ समय (अभिजीत)' : 'Best time (Abhijit)'}: {item.time.abhijit.start} – {item.time.abhijit.end}
            </Text>
          )}
        </View>
      </View>

      {!!goodReasons.length && (
        <View style={styles.reasons}>
          {goodReasons.map((r, i) => (
            <View key={i} style={[styles.reasonChip, { borderColor: '#3ec77a55', backgroundColor: theme.isDark ? 'rgba(62,199,122,0.08)' : 'rgba(62,199,122,0.1)' }]}>
              <Text style={[styles.reasonTxt, { color: theme.isDark ? '#8fe0ad' : '#2c8a52' }]}>✓ {lang === 'hi' ? r.hi : r.en}</Text>
            </View>
          ))}
        </View>
      )}

      {!!item.time.rahuKaal && (
        <Text style={[styles.avoidLine, { color: theme.textMuted }]}>⛔ {lang === 'hi' ? 'राहुकाल टालें' : 'Avoid Rahu Kaal'}: {item.time.rahuKaal.start} – {item.time.rahuKaal.end}</Text>
      )}
    </View>
  );
}

export function MuhuratFinderScreen({ navigation, route }: any) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const categoryKey: string = route?.params?.categoryKey || 'griha-pravesh';
  const cat = muhuratCatByKey(categoryKey);

  const [name, setName] = useState('');
  const [placeText, setPlaceText] = useState('');
  const [loc, setLoc] = useState<{ place?: string; lat?: number; lng?: number } | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);
  const [birth, setBirth] = useState<any>(null);
  const [result, setResult] = useState<MuhuratResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    birthFromProfile().then((b: any) => {
      if (b?.place) { setPlaceText(b.place); setLoc({ place: b.place, lat: b.lat, lng: b.lng }); }
      if (b?.dob && b?.place) setBirth({ date: String(b.dob).replace(/-/g, '/'), time: b.tob, tz: b.tz, place: b.place, lat: b.lat, lng: b.lng });
    }).catch(() => {});
  }, []);

  const rashi = useMemo(() => naamRashi(name), [name]);
  const months = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 4 }).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      return { offset: i, month: d.getMonth() + 1, year: d.getFullYear(), label: `${(lang === 'hi' ? MON_HI : MON)[d.getMonth()]} ${d.getFullYear()}` };
    });
  }, [lang]);

  const onFind = async () => {
    hTap();
    setError(null); setResult(null); setLoading(true);
    const sel = months[monthOffset];
    try {
      const res = await findMuhurat({
        category: categoryKey,
        month: sel.month, year: sel.year, months: 2,
        place: loc?.place || placeText || undefined,
        lat: loc?.lat, lng: loc?.lng,
        nameRashi: rashi,
        birth: birth || undefined,
      });
      setResult(res);
      if (!res.items.length) setError(lang === 'hi' ? 'इस अवधि में कोई शुभ मुहूर्त नहीं मिला — आगे का महीना चुनें।' : 'No auspicious muhurat in this window — try a later month.');
    } catch (e: any) {
      setError(lang === 'hi' ? 'मुहूर्त गणना अभी नहीं हो पाई — इंटरनेट जाँचकर पुनः प्रयास करें।' : 'Could not compute muhurat — check internet and retry.');
    } finally {
      setLoading(false);
    }
  };

  const bestScore = result?.items.length ? Math.max(...result.items.map((i) => i.score)) : -1;

  return (
    <Page title={lang === 'hi' ? (cat?.name.hi || 'मुहूर्त') : (cat?.name.en || 'Muhurat')} onBack={() => { hTap(); navigation.goBack(); }}>
      <LinearGradient colors={cat?.colors || ['#eab94f', '#9f6b16']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <Text style={styles.heroEmoji}>{cat?.emoji || '🕉'}</Text>
        <Text style={styles.heroName}>{lang === 'hi' ? cat?.name.hi : cat?.name.en}</Text>
        <Text style={styles.heroBlurb}>{lang === 'hi' ? cat?.blurb.hi : cat?.blurb.en}</Text>
      </LinearGradient>

      {/* form */}
      <View style={styles.form}>
        {cat?.nameBased && (
          <View style={styles.field}>
            <Text style={[styles.label, { color: theme.gold2 }]}>{lang === 'hi' ? 'नाम (वैकल्पिक — चंद्रबल हेतु)' : 'Name (optional — for Chandrabal)'}</Text>
            <TextInput
              value={name} onChangeText={setName}
              placeholder={lang === 'hi' ? 'जिस सदस्य के नाम से मुहूर्त देखना है' : "Family member's name"}
              placeholderTextColor={theme.textMuted}
              style={[styles.input, { borderColor: theme.cardBorder, color: theme.text, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.4)' : '#fff' }]}
            />
            {!!name.trim() && (
              <Text style={[styles.hint, { color: rashi ? theme.gold1 : theme.textMuted }]}>
                {rashi ? `${lang === 'hi' ? 'नाम राशि' : 'Naam Rashi'}: ${aSign(rashi, lang)} 🌙` : (lang === 'hi' ? 'इस अक्षर की राशि नहीं मिली — फिर भी मुहूर्त मिलेगा।' : 'Could not map this letter — muhurat still works.')}
              </Text>
            )}
          </View>
        )}

        <View style={styles.field}>
          <BirthPlaceField
            label={lang === 'hi' ? 'स्थान' : 'Location'}
            value={placeText}
            onChangeText={setPlaceText}
            onSelect={(it: LocationSuggestion | null) => setLoc(it ? { place: it.description, lat: it.lat ?? undefined, lng: it.lng ?? undefined } : null)}
            placeholder={lang === 'hi' ? 'शहर / गाँव' : 'City / village'}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: theme.gold2 }]}>{lang === 'hi' ? 'किस महीने से' : 'Starting month'}</Text>
          <View style={styles.monthRow}>
            {months.map((mo) => {
              const on = monthOffset === mo.offset;
              return (
                <Pressable key={mo.offset} onPress={() => { hTap(); setMonthOffset(mo.offset); }}
                  style={[styles.monthChip, { borderColor: on ? theme.gold1 : theme.cardBorder, backgroundColor: on ? theme.gold1 : (theme.isDark ? 'rgba(233,184,80,0.08)' : '#fff') }]}>
                  <Text style={[styles.monthTxt, { color: on ? '#1a1206' : theme.gold1 }]}>{mo.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {!!birth && (
          <Text style={[styles.taraNote, { color: theme.textMuted }]}>✓ {lang === 'hi' ? 'आपके जन्म विवरण से ताराबल भी जोड़ा जाएगा (अधिक सटीक)।' : 'Tara Bal from your birth details will be included (more accurate).'}</Text>
        )}

        <GoldButton label={loading ? (lang === 'hi' ? 'गणना हो रही है…' : 'Calculating…') : (lang === 'hi' ? 'शुभ मुहूर्त खोजें' : 'Find Muhurat')} onPress={loading ? undefined : onFind} style={{ marginTop: 4 }} />
      </View>

      {loading && (
        <View style={styles.loadBox}>
          <ActivityIndicator color={theme.gold1} />
          <Text style={[styles.loadTxt, { color: theme.textMuted }]}>{lang === 'hi' ? 'हर दिन का पंचांग जाँचकर सबसे शुभ दिन चुने जा रहे हैं…' : 'Checking each day’s panchang to pick the best…'}</Text>
        </View>
      )}

      {!!error && !loading && <Text style={[styles.err, { color: theme.textMuted }]}>{error}</Text>}

      {!!result && !loading && !!result.items.length && (
        <View style={{ marginTop: 18 }}>
          <Text style={[styles.method, { color: theme.textMuted }]}>{lang === 'hi' ? result.method.hi : result.method.en}</Text>
          <View style={{ gap: 12, marginTop: 12 }}>
            {result.items.map((it) => <ResultCard key={it.dmy} item={it} best={it.score === bestScore} lang={lang} theme={theme} />)}
          </View>
          <Text style={[styles.disclaimer, { color: theme.textMuted }]}>
            {lang === 'hi'
              ? '🔒 सभी तिथि, नक्षत्र व समय खगोलीय गणना से निकाले गए हैं। विशेष/बड़े कार्य के लिए किसी विद्वान से लग्न-शुद्धि भी करा लें।'
              : '🔒 All dates, nakshatras & times are from astronomical calculation. For very important events, also confirm the lagna with a learned pandit.'}
          </Text>
        </View>
      )}
      <View style={{ height: 16 }} />
    </Page>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 20, padding: 18, overflow: 'hidden', alignItems: 'center' },
  heroEmoji: { fontSize: 40 },
  heroName: { fontFamily: fonts.playfairBold, fontSize: 22, color: '#fff8ec', marginTop: 6, textAlign: 'center' },
  heroBlurb: { fontFamily: fonts.inter, fontSize: 12.5, color: 'rgba(255,248,236,0.9)', marginTop: 3, textAlign: 'center' },

  form: { marginTop: 18, gap: 16 },
  field: {},
  label: { fontFamily: fonts.interSemi, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 7 },
  input: { height: 46, borderWidth: 1, borderRadius: radii.md, paddingHorizontal: 14, fontFamily: fonts.inter, fontSize: 15 },
  hint: { fontFamily: fonts.interSemi, fontSize: 12, marginTop: 7 },
  monthRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  monthChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 7 },
  monthTxt: { fontFamily: fonts.interSemi, fontSize: 12 },
  taraNote: { fontFamily: fonts.inter, fontSize: 11.5, lineHeight: 16 },

  loadBox: { alignItems: 'center', gap: 12, paddingVertical: 34 },
  loadTxt: { fontFamily: fonts.inter, fontSize: 12.5, textAlign: 'center', paddingHorizontal: 30, lineHeight: 18 },
  err: { fontFamily: fonts.inter, fontSize: 13, textAlign: 'center', paddingVertical: 26, lineHeight: 19 },

  method: { fontFamily: fonts.inter, fontSize: 11.5, lineHeight: 17, fontStyle: 'italic' },
  card: { borderWidth: 1, borderRadius: radii.lg, padding: 13, overflow: 'hidden' },
  bestTag: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10 },
  bestTagTxt: { fontFamily: fonts.interBold, fontSize: 10, color: '#2a1c00', letterSpacing: 0.5 },
  cardTop: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  dateBox: { width: 60, borderRadius: 14, paddingVertical: 9, alignItems: 'center' },
  dateDay: { fontFamily: fonts.cinzelSemi, fontSize: 24, lineHeight: 26 },
  dateMon: { fontFamily: fonts.interBold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginTop: 1 },
  dateYr: { fontFamily: fonts.inter, fontSize: 9.5, marginTop: 1 },
  wd: { fontFamily: fonts.playfairBold, fontSize: 16 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 5 },
  miniChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2.5 },
  miniChipTxt: { fontFamily: fonts.interSemi, fontSize: 10.5 },
  timeLine: { fontFamily: fonts.interSemi, fontSize: 12, marginTop: 7 },
  reasons: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 11 },
  reasonChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  reasonTxt: { fontFamily: fonts.inter, fontSize: 10.5 },
  avoidLine: { fontFamily: fonts.inter, fontSize: 11, marginTop: 10 },
  disclaimer: { fontFamily: fonts.inter, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 16 },
});
