import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, TextInput, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Page } from '../components/Page';
import { GradientText } from '../components/GradientText';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radii } from '../theme/tokens';
import { hTap, hSelect } from '../lib/haptics';
import { useLang } from '../i18n/LanguageProvider';
import { occasionById } from '../data/occasions';
import { getOccasionGuide, askOccasion, OccasionGuide } from '../lib/api';

const GREEN = '#3ec77a';
const RED = '#e06a5a';

export function OccasionScreen({ route, navigation }: any) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const hi = lang === 'hi';
  const id: string = route?.params?.id;
  const o = occasionById(id);
  const [guide, setGuide] = useState<OccasionGuide | null>(null);
  const [err, setErr] = useState(false);

  // AI assistant
  const [q, setQ] = useState('');
  const [answer, setAnswer] = useState('');
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    if (!o) return;
    let on = true;
    setGuide(null); setErr(false);
    getOccasionGuide(id, lang)
      .then((r) => { if (on) setGuide(r); })
      .catch(() => { if (on) setErr(true); });
    return () => { on = false; };
  }, [id, lang]);

  const ask = async () => {
    const text = q.trim();
    if (!text || asking) return;
    hTap();
    setAsking(true); setAnswer('');
    try {
      const r = await askOccasion(id, text, lang);
      setAnswer(r.answer || (hi ? 'क्षमा करें, उत्तर नहीं मिल पाया।' : 'Sorry, could not get an answer.'));
    } catch {
      setAnswer(hi ? 'अभी उत्तर नहीं मिल पाया — इंटरनेट जाँचकर पुनः प्रयास करें।' : 'Could not answer right now — check internet and retry.');
    } finally {
      setAsking(false);
    }
  };

  const suggestions = useMemo(() => (hi
    ? ['इसमें कितना समय लगता है?', 'क्या सामग्री ज़रूरी है?', 'कौन सी दिशा शुभ है?']
    : ['How long does it take?', 'What samagri is essential?', 'Which direction is auspicious?']), [hi]);

  const onShare = () => {
    hTap();
    const name = o ? (hi ? o.hi : o.en) : '';
    Share.share({ message: `${name} — ${hi ? 'पूरी पूजा विधि Shree Yantra ऐप में देखें' : 'See the full puja vidhi in the Shree Yantra app'} 🙏` }).catch(() => {});
  };

  if (!o) {
    return <Page title="Shubh Avsar" onBack={() => navigation.goBack()}><Text style={{ color: theme.textMuted, textAlign: 'center', marginTop: 40, fontFamily: fonts.inter }}>Not found</Text></Page>;
  }

  const cardBg = theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.85)';
  const Section = ({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) => (
    <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: cardBg }]}>
      <Text style={[styles.cardTitle, { color: theme.gold1 }]}>{icon}  {title}</Text>
      {children}
    </View>
  );
  const Bullet = ({ text, color }: { text: string; color?: string }) => (
    <View style={styles.bulletRow}>
      <Text style={[styles.bulletDot, { color: color || theme.gold2 }]}>•</Text>
      <Text style={[styles.bulletTxt, { color: theme.textSoft }]}>{text}</Text>
    </View>
  );

  return (
    <Page title={hi ? o.hi : o.en} onBack={() => { hTap(); navigation.goBack(); }} right={<Pressable onPress={onShare} hitSlop={10}><Text style={{ fontSize: 18 }}>📤</Text></Pressable>}>
      {/* Hero */}
      <LinearGradient
        colors={theme.isDark ? [o.accent + '2e', o.accent + '08'] : ['rgba(255,247,224,0.95)', 'rgba(255,253,247,0.9)']}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        style={[styles.hero, { borderColor: o.accent + (theme.isDark ? '66' : '40') }]}
      >
        <View style={[styles.crest, { borderColor: o.accent + '80', backgroundColor: o.accent + '22', shadowColor: o.accent }]}>
          <Text style={{ fontSize: 34 }}>{o.emoji}</Text>
        </View>
        <Text style={[styles.heroHi, { color: theme.text }]}>{hi ? o.hi : o.en}</Text>
        <Text style={[styles.heroSub, { color: theme.gold2 }]}>{hi ? o.subHi : o.subEn}</Text>
        <Text style={[styles.heroDeity, { color: theme.textMuted }]}>{hi ? 'मुख्य देव: ' : 'Deity: '}{hi ? o.deityHi : o.deityEn}</Text>
      </LinearGradient>

      {err && <Text style={[styles.err, { color: theme.textMuted }]}>{hi ? 'गाइड लोड नहीं हो पाई — इंटरनेट जाँचें।' : 'Could not load the guide — check internet.'}</Text>}
      {!guide && !err && (
        <View style={styles.loading}>
          <ActivityIndicator color={theme.gold1} />
          <Text style={[styles.loadTxt, { color: theme.textMuted }]}>{hi ? 'आपके लिए प्रामाणिक पूजा विधि तैयार हो रही है…' : 'Preparing an authentic puja guide for you…'}</Text>
        </View>
      )}

      {guide && (
        <View style={{ gap: 14 }}>
          {!!guide.significance && (
            <Section icon="✨" title={hi ? 'महत्व' : 'Significance'}>
              <Text style={[styles.para, { color: theme.textSoft }]}>{guide.significance}</Text>
            </Section>
          )}

          {!!guide.muhurat && (
            <Section icon="🕉️" title={hi ? 'शुभ मुहूर्त' : 'Auspicious Time'}>
              <Text style={[styles.para, { color: theme.textSoft }]}>{guide.muhurat}</Text>
            </Section>
          )}

          {!!guide.samagri.length && (
            <Section icon="🪔" title={hi ? 'पूजा सामग्री' : 'Puja Samagri'}>
              <View style={styles.chipWrap}>
                {guide.samagri.map((s, i) => (
                  <View key={i} style={[styles.chip, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.06)' : '#fff' }]}>
                    <Text style={[styles.chipTxt, { color: theme.text }]}>{s}</Text>
                  </View>
                ))}
              </View>
            </Section>
          )}

          {!!guide.steps.length && (
            <Section icon="📖" title={hi ? 'पूजा विधि — क्रमवार' : 'Step-by-Step Vidhi'}>
              <View style={{ gap: 11, marginTop: 2 }}>
                {guide.steps.map((s, i) => (
                  <View key={i} style={styles.stepRow}>
                    <LinearGradient colors={theme.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.stepNum}>
                      <Text style={[styles.stepNumTxt, { color: theme.buttonInk }]}>{i + 1}</Text>
                    </LinearGradient>
                    <Text style={[styles.stepTxt, { color: theme.textSoft }]}>{s}</Text>
                  </View>
                ))}
              </View>
            </Section>
          )}

          {!!guide.mantras.length && (
            <Section icon="📿" title={hi ? 'मंत्र' : 'Mantras'}>
              <View style={{ gap: 12, marginTop: 2 }}>
                {guide.mantras.map((m, i) => (
                  <View key={i} style={[styles.mantra, { borderColor: theme.gold3, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.05)' : 'rgba(255,247,224,0.6)' }]}>
                    <Text style={[styles.mantraSa, { color: theme.text }]}>{m.sanskrit}</Text>
                    {!!m.transliteration && <Text style={[styles.mantraRoman, { color: theme.textMuted }]}>{m.transliteration}</Text>}
                    {!!m.meaning && <Text style={[styles.mantraMeaning, { color: theme.textSoft }]}>{m.meaning}</Text>}
                    <View style={styles.mantraMeta}>
                      {!!m.when && <View style={[styles.metaPill, { borderColor: theme.gold3 }]}><Text style={[styles.metaPillTxt, { color: theme.gold1 }]}>🕐 {m.when}</Text></View>}
                      {!!m.count && <View style={[styles.metaPill, { borderColor: theme.gold3 }]}><Text style={[styles.metaPillTxt, { color: theme.gold1 }]}>🔢 {m.count}</Text></View>}
                    </View>
                    {!!m.benefit && <Text style={[styles.mantraBenefit, { color: theme.textMuted }]}>✦ {m.benefit}</Text>}
                  </View>
                ))}
              </View>
            </Section>
          )}

          {(!!guide.dos.length || !!guide.donts.length) && (
            <View style={styles.dodont}>
              {!!guide.dos.length && (
                <View style={[styles.ddCol, { borderColor: GREEN + '55', backgroundColor: theme.isDark ? 'rgba(62,199,122,0.06)' : 'rgba(62,199,122,0.07)' }]}>
                  <Text style={[styles.ddTitle, { color: GREEN }]}>✓ {hi ? 'करें' : 'Do'}</Text>
                  {guide.dos.map((d, i) => <Bullet key={i} text={d} color={GREEN} />)}
                </View>
              )}
              {!!guide.donts.length && (
                <View style={[styles.ddCol, { borderColor: RED + '55', backgroundColor: theme.isDark ? 'rgba(224,106,90,0.06)' : 'rgba(224,106,90,0.07)' }]}>
                  <Text style={[styles.ddTitle, { color: RED }]}>✕ {hi ? 'न करें' : 'Avoid'}</Text>
                  {guide.donts.map((d, i) => <Bullet key={i} text={d} color={RED} />)}
                </View>
              )}
            </View>
          )}

          {!!guide.faqs.length && (
            <Section icon="❓" title={hi ? 'सामान्य प्रश्न' : 'FAQs'}>
              <View style={{ gap: 12, marginTop: 2 }}>
                {guide.faqs.map((f, i) => (
                  <View key={i}>
                    <Text style={[styles.faqQ, { color: theme.text }]}>Q. {f.q}</Text>
                    <Text style={[styles.faqA, { color: theme.textSoft }]}>{f.a}</Text>
                  </View>
                ))}
              </View>
            </Section>
          )}

          {!!guide.regionalNote && (
            <View style={[styles.note, { borderColor: theme.gold3, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.06)' : 'rgba(233,184,80,0.08)' }]}>
              <Text style={[styles.noteTxt, { color: theme.textMuted }]}>📍 {hi ? 'क्षेत्रीय भिन्नता: ' : 'Regional note: '}{guide.regionalNote}</Text>
            </View>
          )}

          {/* AI Ritual Assistant */}
          <View style={[styles.card, { borderColor: theme.gold2 + '66', backgroundColor: theme.isDark ? 'rgba(233,184,80,0.06)' : 'rgba(255,247,224,0.7)' }]}>
            <Text style={[styles.cardTitle, { color: theme.gold1 }]}>🤖 {hi ? 'AI पंडित जी से पूछें' : 'Ask the AI Pandit'}</Text>
            <Text style={[styles.assistSub, { color: theme.textMuted }]}>{hi ? 'इस अवसर से जुड़ा कोई भी सवाल पूछें' : 'Ask any question about this occasion'}</Text>
            <View style={styles.sugRow}>
              {suggestions.map((s) => (
                <Pressable key={s} onPress={() => { hSelect(); setQ(s); }} style={[styles.sug, { borderColor: theme.cardBorder }]}>
                  <Text style={[styles.sugTxt, { color: theme.gold2 }]}>{s}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.askRow}>
              <TextInput
                value={q} onChangeText={setQ}
                placeholder={hi ? 'अपना सवाल लिखें…' : 'Type your question…'}
                placeholderTextColor={theme.textMuted}
                style={[styles.input, { borderColor: theme.cardBorder, color: theme.text, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.3)' : '#fff' }]}
                onSubmitEditing={ask} returnKeyType="send"
              />
              <Pressable onPress={ask} disabled={asking} style={styles.askBtnWrap}>
                <LinearGradient colors={theme.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.askBtn}>
                  {asking ? <ActivityIndicator color={theme.buttonInk} size="small" /> : <Text style={[styles.askBtnTxt, { color: theme.buttonInk }]}>{hi ? 'पूछें' : 'Ask'}</Text>}
                </LinearGradient>
              </Pressable>
            </View>
            {!!answer && (
              <View style={[styles.answer, { borderColor: theme.gold3, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.22)' : 'rgba(255,255,255,0.6)' }]}>
                <Text style={[styles.answerTxt, { color: theme.text, fontFamily: hi ? fonts.devanagari : fonts.inter }]}>{answer}</Text>
              </View>
            )}
          </View>

          {!!guide.disclaimer && <Text style={[styles.disclaimer, { color: theme.textMuted }]}>🔒 {guide.disclaimer}</Text>}
          <Text style={[styles.disclaimer, { color: theme.textMuted }]}>{hi ? '✦ यह मार्गदर्शन पारंपरिक हिंदू परंपरा पर आधारित है; रीति क्षेत्र व परिवार अनुसार भिन्न हो सकती है।' : '✦ This guidance follows traditional Hindu practice; customs may vary by region and family.'}</Text>
          <View style={{ height: 12 }} />
        </View>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  hero: { borderWidth: 1, borderRadius: 20, alignItems: 'center', paddingVertical: 22, paddingHorizontal: 16, marginBottom: 14 },
  crest: { width: 68, height: 68, borderRadius: 34, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 12, shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } },
  heroHi: { fontFamily: fonts.playfair, fontSize: 24, textAlign: 'center' },
  heroSub: { fontFamily: fonts.interSemi, fontSize: 13, marginTop: 5, textAlign: 'center' },
  heroDeity: { fontFamily: fonts.inter, fontSize: 11.5, marginTop: 8, textAlign: 'center' },

  err: { fontFamily: fonts.inter, fontSize: 13, textAlign: 'center', paddingVertical: 30 },
  loading: { paddingVertical: 44, alignItems: 'center', gap: 12 },
  loadTxt: { fontFamily: fonts.inter, fontSize: 12.5, textAlign: 'center', paddingHorizontal: 30, lineHeight: 18 },

  card: { borderWidth: 1, borderRadius: 16, padding: 15 },
  cardTitle: { fontFamily: fonts.cinzelSemi, fontSize: 13.5, letterSpacing: 0.5, marginBottom: 10 },
  para: { fontFamily: fonts.inter, fontSize: 13.5, lineHeight: 21 },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 2 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6, alignItems: 'center', justifyContent: 'center' },
  chipTxt: { fontFamily: fonts.inter, fontSize: 12, textAlign: 'center' },

  stepRow: { flexDirection: 'row', gap: 11, alignItems: 'flex-start' },
  stepNum: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  stepNumTxt: { fontFamily: fonts.interBold, fontSize: 12 },
  stepTxt: { flex: 1, fontFamily: fonts.inter, fontSize: 13.5, lineHeight: 21 },

  mantra: { borderWidth: 1, borderRadius: 14, padding: 13 },
  mantraSa: { fontFamily: fonts.devanagari, fontSize: 16, lineHeight: 28 },
  mantraRoman: { fontFamily: fonts.inter, fontSize: 12, fontStyle: 'italic', marginTop: 6, lineHeight: 18 },
  mantraMeaning: { fontFamily: fonts.inter, fontSize: 13, lineHeight: 20, marginTop: 8 },
  mantraMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 10 },
  metaPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, alignItems: 'center', justifyContent: 'center' },
  metaPillTxt: { fontFamily: fonts.interSemi, fontSize: 10.5, textAlign: 'center' },
  mantraBenefit: { fontFamily: fonts.inter, fontSize: 11.5, lineHeight: 17, marginTop: 9, fontStyle: 'italic' },

  dodont: { flexDirection: 'row', gap: 10 },
  ddCol: { flex: 1, borderWidth: 1, borderRadius: 14, padding: 12 },
  ddTitle: { fontFamily: fonts.interBold, fontSize: 12.5, marginBottom: 7 },
  bulletRow: { flexDirection: 'row', gap: 7, marginTop: 5 },
  bulletDot: { fontFamily: fonts.interBold, fontSize: 13, lineHeight: 18 },
  bulletTxt: { flex: 1, fontFamily: fonts.inter, fontSize: 12, lineHeight: 17 },

  faqQ: { fontFamily: fonts.interSemi, fontSize: 13 },
  faqA: { fontFamily: fonts.inter, fontSize: 12.5, lineHeight: 19, marginTop: 3 },

  note: { borderWidth: 1, borderRadius: 12, padding: 12 },
  noteTxt: { fontFamily: fonts.inter, fontSize: 12, lineHeight: 18 },

  assistSub: { fontFamily: fonts.inter, fontSize: 11.5, marginTop: -4, marginBottom: 10 },
  sugRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 11 },
  sug: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  sugTxt: { fontFamily: fonts.inter, fontSize: 11 },
  askRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: { flex: 1, height: 44, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontFamily: fonts.inter, fontSize: 13 },
  askBtnWrap: { borderRadius: 12, overflow: 'hidden' },
  askBtn: { minWidth: 62, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  askBtnTxt: { fontFamily: fonts.interBold, fontSize: 13 },
  answer: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 12 },
  answerTxt: { fontSize: 14, lineHeight: 22 },

  disclaimer: { fontFamily: fonts.inter, fontSize: 10.5, lineHeight: 15, textAlign: 'center', marginTop: 6 },
});
