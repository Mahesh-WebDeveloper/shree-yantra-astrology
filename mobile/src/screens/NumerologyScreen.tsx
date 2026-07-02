import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Page } from '../components/Page';
import { GradientText } from '../components/GradientText';
import { GoldButton } from '../components/GoldButton';
import { TextField } from '../components/TextField';
import { GoldDatePicker } from '../components/GoldDatePicker';
import { UserLine, CalendarIcon } from '../components/icons/ProfileIcons';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';
import { useLang } from '../i18n/LanguageProvider';
import { hTap, hSuccess, hError } from '../lib/haptics';
import { useDialog } from '../components/DialogProvider';
import { useAutoScroll } from '../lib/useAutoScroll';
import {
  getNumerologyProfile, getNumerologyReading, checkNumerologyNumber,
  NumerologyProfile, NumerologyReading, NumberCheck, NumWithPlanet, NumReduced, NumRelation,
} from '../lib/api';

const pad = (n: number) => (n < 10 ? '0' : '') + n;
const toDMY = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
const LOSHU_ROWS = [[4, 9, 2], [3, 5, 7], [8, 1, 6]];

// Beginner tutorial — easy language + examples, for users with zero numerology knowledge.
const GUIDE: { icon: string; tEn: string; tHi: string; bEn: string; bHi: string }[] = [
  {
    icon: '🔢', tEn: 'What is Numerology?', tHi: 'अंकशास्त्र क्या है?',
    bEn: 'Every number 1–9 carries its own energy and personality. From your NAME and your DATE OF BIRTH we work out a few special numbers that describe your nature, your destiny, and your name\'s energy. It is pure maths — nothing is guessed.',
    bHi: 'हर अंक (1 से 9) की अपनी एक ऊर्जा और स्वभाव होती है। आपके नाम और जन्म-तिथि से कुछ खास अंक निकलते हैं जो आपके स्वभाव, भाग्य और नाम की ऊर्जा को बताते हैं। यह पूरी तरह गणित है — कुछ भी अनुमान से नहीं।',
  },
  {
    icon: '🚗', tEn: 'Mulank (Driver) — how it\'s found', tHi: 'मूलांक (ड्राइवर) कैसे निकलता है?',
    bEn: 'Add only the DAY of birth to a single digit. Example: born on the 19th → 1+9 = 10 → 1+0 = 1. This is your inner nature — like the driver who steers your everyday behaviour.',
    bHi: 'सिर्फ़ जन्म के दिन को जोड़कर एक अंक बनाएँ। उदाहरण: 19 तारीख → 1+9 = 10 → 1+0 = 1। यह आपका भीतरी स्वभाव है — जैसे गाड़ी का ड्राइवर जो आपके रोज़ के व्यवहार को चलाता है।',
  },
  {
    icon: '🚌', tEn: 'Bhagyank (Conductor) — how it\'s found', tHi: 'भाग्यांक (कंडक्टर) कैसे निकलता है?',
    bEn: 'Add the WHOLE date (day+month+year) to a single digit. Example: 19/04/2005 → 1+9+0+4+2+0+0+5 = 21 → 2+1 = 3. This is your life-path & destiny — like a bus conductor who manages the route.',
    bHi: 'पूरी जन्म-तिथि (दिन+माह+वर्ष) को जोड़कर एक अंक बनाएँ। उदाहरण: 19/04/2005 → 1+9+0+4+2+0+0+5 = 21 → 2+1 = 3। यह आपका जीवन-पथ व भाग्य है — जैसे बस का कंडक्टर जो रास्ता संभालता है।',
  },
  {
    icon: '🔤', tEn: 'Namank (Name number) — Chaldean', tHi: 'नामांक (नाम अंक) — चेल्डियन',
    bEn: 'Each letter of your name has a number (Chaldean chart). Add them all and reduce. Example: "Mahesh Choudhary" → 57 → 5+7 = 12 → 3. (In Chaldean, the number 9 is sacred and given to no letter.)',
    bHi: 'आपके नाम के हर अक्षर का एक अंक होता है (चेल्डियन चार्ट)। सबको जोड़कर घटाएँ। उदाहरण: "Mahesh Choudhary" → 57 → 5+7 = 12 → 3। (चेल्डियन में 9 पवित्र है, किसी अक्षर को नहीं दिया जाता।)',
  },
  {
    icon: '✦', tEn: 'Master & Karmic numbers', tHi: 'मास्टर व कार्मिक अंक',
    bEn: '11, 22 and 33 are "Master" numbers — very powerful, so they are NOT reduced. 13, 14, 16 and 19 are "Karmic Debt" numbers — they ask for extra effort and patience in life.',
    bHi: '11, 22 और 33 “मास्टर” अंक हैं — बहुत शक्तिशाली, इसलिए इन्हें घटाया नहीं जाता। 13, 14, 16 और 19 “कार्मिक ऋण” अंक हैं — ये जीवन में थोड़ी अतिरिक्त मेहनत व धैर्य माँगते हैं।',
  },
  {
    icon: '🔲', tEn: 'Lo Shu Grid & missing numbers', tHi: 'लो-शु ग्रिड व अनुपस्थित अंक',
    bEn: 'A 3×3 magic square. We fill in the digits of your birth date + your Mulank + your Bhagyank (not the name). Whichever numbers are MISSING show the areas you can work on, with simple remedies.',
    bHi: 'एक 3×3 जादुई वर्ग। इसमें आपकी जन्म-तिथि के अंक + मूलांक + भाग्यांक भरते हैं (नाम नहीं)। जो अंक अनुपस्थित हैं वे बताते हैं कि आपको किन क्षेत्रों पर काम करना है, साथ में आसान उपाय।',
  },
  {
    icon: '🪐', tEn: 'Number → Planet', tHi: 'अंक → ग्रह',
    bEn: 'Each number is ruled by a planet: 1-Sun, 2-Moon, 3-Jupiter, 4-Rahu, 5-Mercury, 6-Venus, 7-Ketu, 8-Saturn, 9-Mars. This links numerology with Vedic astrology.',
    bHi: 'हर अंक का एक स्वामी ग्रह है: 1-सूर्य, 2-चंद्र, 3-गुरु, 4-राहु, 5-बुध, 6-शुक्र, 7-केतु, 8-शनि, 9-मंगल। यही अंकशास्त्र को वैदिक ज्योतिष से जोड़ता है।',
  },
  {
    icon: '🤝', tEn: 'Harmony (friend/enemy)', tHi: 'तालमेल (मित्र/शत्रु)',
    bEn: 'When your Mulank, Bhagyank and Namank are friends, life tends to flow with less struggle. If the name clashes, a small spelling change can improve harmony (see Name Harmony).',
    bHi: 'जब आपके मूलांक, भाग्यांक और नामांक आपस में मित्र हों, तो जीवन में संघर्ष कम रहता है। यदि नाम टकराए, तो नाम में छोटा बदलाव सामंजस्य बढ़ा सकता है (नाम सामंजस्य देखें)।',
  },
  {
    icon: '📖', tEn: 'How to read your report', tHi: 'अपनी रिपोर्ट कैसे पढ़ें',
    bEn: '1) Mulank = who you are inside. 2) Bhagyank = your life direction & best career. 3) Check if your Namank matches them. 4) Lo Shu missing = areas to strengthen. 5) Personal Year = this year\'s focus.',
    bHi: '1) मूलांक = आप भीतर से कैसे हैं। 2) भाग्यांक = आपकी जीवन-दिशा व सर्वोत्तम करियर। 3) देखें नामांक इनसे मेल खाता है या नहीं। 4) लो-शु अनुपस्थित = मज़बूत करने वाले क्षेत्र। 5) व्यक्तिगत वर्ष = इस साल का फोकस।',
  },
  {
    icon: '🙏', tEn: 'Please note', tHi: 'ध्यान दें',
    bEn: 'The maths here is exact and reproducible. The meanings are traditional guidance for reflection — not scientific fact. Use them as a helpful mirror, not a fixed prediction.',
    bHi: 'यहाँ की गणना सटीक व पुनः-सत्यापित है। अर्थ परंपरागत मार्गदर्शन हैं (चिंतन हेतु) — वैज्ञानिक तथ्य नहीं। इन्हें एक सहायक दर्पण की तरह लें, तय भविष्यवाणी नहीं।',
  },
];

export function NumerologyScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const hi = lang === 'hi';
  const dialog = useDialog();
  const { scrollRef, onResultsLayout, scrollToResults } = useAutoScroll();

  const [name, setName] = useState('');
  const [dob, setDob] = useState<Date | null>(null);
  const [showDate, setShowDate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [profile, setProfile] = useState<NumerologyProfile | null>(null);

  const [reading, setReading] = useState<NumerologyReading | null>(null);
  const [readingBusy, setReadingBusy] = useState(false);

  const [numInput, setNumInput] = useState('');
  const [check, setCheck] = useState<NumberCheck | null>(null);
  const [checkBusy, setCheckBusy] = useState(false);

  const L = (o?: { en: string; hi: string } | null) => (o ? (hi ? o.hi : o.en) : '');
  const LL = (o?: { en: string[]; hi: string[] } | null) => (o ? (hi ? o.hi : o.en) : []);

  const calc = async () => {
    if (!dob) { hError(); dialog(hi ? 'जन्म तिथि' : 'Date of birth', hi ? 'कृपया अपनी जन्म तिथि चुनें।' : 'Please pick your date of birth.'); return; }
    if (busy) return;
    hTap(); setBusy(true); setProfile(null); setReading(null); setCheck(null);
    try {
      const { profile: p } = await getNumerologyProfile({ name: name.trim(), dob: toDMY(dob) });
      setProfile(p); hSuccess(); scrollToResults();
    } catch (e: any) { hError(); dialog(hi ? 'त्रुटि' : 'Error', e?.message || (hi ? 'फिर प्रयास करें।' : 'Please try again.')); }
    finally { setBusy(false); }
  };

  const loadReading = async () => {
    if (!dob || readingBusy) return;
    hTap(); setReadingBusy(true);
    try {
      const r = await getNumerologyReading({ name: name.trim(), dob: toDMY(dob) });
      setReading(r.reading);
    } catch (e: any) { hError(); dialog(hi ? 'त्रुटि' : 'Error', e?.message || (hi ? 'फिर प्रयास करें।' : 'Please try again.')); }
    finally { setReadingBusy(false); }
  };

  const runCheck = async () => {
    if (!profile || checkBusy) return;
    if (!numInput.replace(/\D/g, '')) { hError(); dialog(hi ? 'नंबर' : 'Number', hi ? 'मोबाइल/गाड़ी नंबर लिखें।' : 'Enter a mobile/vehicle number.'); return; }
    hTap(); setCheckBusy(true);
    try {
      const r = await checkNumerologyNumber({ number: numInput, mulank: profile.mulank.final });
      setCheck(r); hSuccess();
    } catch (e: any) { hError(); dialog(hi ? 'त्रुटि' : 'Error', e?.message || 'Try again'); }
    finally { setCheckBusy(false); }
  };

  const relColor = (r?: NumRelation) => (r?.key === 'friend' ? '#3ec77a' : r?.key === 'enemy' ? '#e06a5a' : theme.textMuted);

  return (
    <Page title={hi ? 'अंकशास्त्र' : 'Numerology'} onBack={() => { hTap(); navigation.goBack(); }} scrollRef={scrollRef}>
      {/* ── intro / input ── */}
      <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.85)' }]}>
        <GradientText style={styles.h1}>{hi ? 'अंक ज्योतिष विश्लेषण' : 'Numerology Analysis'}</GradientText>
        <Text style={[styles.sub, { color: theme.textMuted }]}>
          {hi ? 'मूलांक, भाग्यांक, नामांक (चेल्डियन), लो-शु ग्रिड, शुभ अंक और मोबाइल/गाड़ी नंबर मिलान — 100% सटीक गणना।'
              : 'Mulank, Bhagyank, Namank (Chaldean), Lo Shu grid, lucky numbers & mobile/vehicle matching — 100% exact math.'}
        </Text>
        <View style={{ gap: 11, marginTop: 12 }}>
          <TextField icon={<UserLine color={theme.gold2} size={19} />} label={hi ? 'पूरा नाम' : 'Full name'} value={name} onChangeText={setName} placeholder={hi ? 'जैसे: अमित शर्मा (अंग्रेज़ी में)' : 'Eg. Amit Sharma'} autoCapitalize="words" />
          <Pressable onPress={() => { hTap(); setShowDate(true); }} style={[styles.picker, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : '#fff' }]}>
            <CalendarIcon color={theme.gold2} size={19} />
            <View style={{ marginLeft: 12 }}>
              <Text style={[styles.pLabel, { color: theme.goldText }]}>{hi ? 'जन्म तिथि' : 'DATE OF BIRTH'}</Text>
              <Text style={[styles.pVal, { color: dob ? theme.text : theme.textMuted }]}>{dob ? toDMY(dob) : (hi ? 'चुनने के लिए टैप करें' : 'Tap to choose')}</Text>
            </View>
          </Pressable>
        </View>
        <View style={{ marginTop: 15 }}>
          <GoldButton label={busy ? (hi ? 'गणना हो रही है…' : 'Calculating…') : (hi ? 'अंक निकालें' : 'Calculate')} onPress={calc} />
        </View>
        <Text style={[styles.trust, { color: theme.textMuted }]}>
          {hi ? '🔒 चेल्डियन प्रणाली पर आधारित शुद्ध गणित — कोई अनुमान नहीं। व्याख्या केवल मार्गदर्शन हेतु।'
              : '🔒 Pure math on the Chaldean system — nothing guessed. Interpretation is guidance only.'}
        </Text>
        {busy && <ActivityIndicator color={theme.gold1} style={{ marginTop: 12 }} />}
      </View>

      {/* ── learn / tutorial (for beginners) ── */}
      <Pressable onPress={() => { hTap(); setShowGuide((s) => !s); }} style={[styles.learnBtn, { borderColor: theme.gold2 + '66', backgroundColor: theme.isDark ? 'rgba(233,184,80,0.06)' : 'rgba(255,247,224,0.6)' }]}>
        <Text style={[styles.learnTxt, { color: theme.gold1 }]}>📖 {hi ? 'अंकशास्त्र कैसे समझें? (नए हैं तो पढ़ें)' : 'How to read Numerology? (new? tap here)'}</Text>
        <Text style={[styles.learnChev, { color: theme.gold1 }]}>{showGuide ? '▲' : '▼'}</Text>
      </Pressable>
      {showGuide && (
        <View style={{ gap: 8, marginTop: 10 }}>
          {GUIDE.map((g, i) => (
            <GuideItem key={i} theme={theme} icon={g.icon} title={hi ? g.tHi : g.tEn} body={hi ? g.bHi : g.bEn} />
          ))}
        </View>
      )}

      {/* ── results ── */}
      {profile && !busy && (
        <View style={{ gap: 14, marginTop: 14 }} onLayout={onResultsLayout}>
          <Text style={[styles.section, { color: theme.goldText }]}>{hi ? 'मुख्य त्रिमूर्ति' : 'Core Trinity'}</Text>
          <Trinity theme={theme} hi={hi} focus="nature" label={hi ? 'मूलांक' : 'Mulank'} tag={hi ? 'ड्राइवर · स्वभाव' : 'Driver · Nature'}
            plain={hi ? 'सिर्फ़ जन्म-तारीख से बना अंक — यह आपका स्वभाव व व्यक्तित्व “चलाता” है (जैसे गाड़ी का ड्राइवर)।' : "Made from just your birth day — it 'drives' your nature & personality (like a car's driver)."}
            data={profile.mulank} />
          <Trinity theme={theme} hi={hi} focus="path" label={hi ? 'भाग्यांक' : 'Bhagyank'} tag={hi ? 'कंडक्टर · जीवन-पथ' : 'Conductor · Life Path'}
            plain={hi ? 'पूरी जन्म-तिथि (दिन+माह+वर्ष) का जोड़ — यह आपके जीवन-पथ व भाग्य को दिशा देता है (जैसे बस का कंडक्टर)।' : 'Sum of your full birth date — it guides your life-path & destiny (like a bus conductor).'}
            data={profile.bhagyank} />
          <Trinity theme={theme} hi={hi} focus="name" label={hi ? 'नामांक' : 'Namank'} tag={hi ? 'चेल्डियन · नाम कंपन' : 'Chaldean · Name'}
            plain={hi ? 'आपके नाम के अक्षरों की ऊर्जा (चेल्डियन विधि) — नाम मूलांक/भाग्यांक से मिले तो जीवन आसान।' : "The energy of your name's letters (Chaldean) — if it matches your Mulank/Bhagyank, life flows easier."}
            data={profile.namank} />

          <View style={styles.row2}>
            <MiniStat theme={theme} label={hi ? 'सोल अर्ज' : 'Soul Urge'} n={profile.soulUrge.final} />
            <MiniStat theme={theme} label={hi ? 'व्यक्तित्व' : 'Personality'} n={profile.personality.final} />
            <MiniStat theme={theme} label={hi ? 'व्यक्तिगत वर्ष' : 'Personal Year'} n={profile.personalYear.final} highlight />
          </View>
          {!!profile.personalYear.meaning && (
            <View style={[styles.pyCard, { borderColor: theme.gold2 + '55', backgroundColor: theme.isDark ? 'rgba(233,184,80,0.06)' : 'rgba(255,247,224,0.7)' }]}>
              <Text style={[styles.pyTxt, { color: theme.text }]}>
                <Text style={{ color: theme.gold1, fontFamily: fonts.interBold }}>{hi ? `व्यक्तिगत वर्ष ${profile.personalYear.final}: ` : `Personal Year ${profile.personalYear.final}: `}</Text>
                {L(profile.personalYear.meaning)}
              </Text>
            </View>
          )}

          {/* ── Lo Shu grid ── */}
          <Text style={[styles.section, { color: theme.goldText }]}>{hi ? 'लो-शु ग्रिड' : 'Lo Shu Grid'}</Text>
          <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.04)' : 'rgba(255,253,247,0.85)' }]}>
            <View style={styles.grid}>
              {LOSHU_ROWS.map((r, ri) => (
                <View key={ri} style={{ flexDirection: 'row' }}>
                  {r.map((n) => {
                    const c = profile.loShu.counts[String(n)] || 0;
                    const on = c > 0;
                    return (
                      <View key={n} style={[styles.gCell, { borderColor: on ? theme.gold2 + '66' : theme.cardBorder, backgroundColor: on ? (theme.isDark ? 'rgba(233,184,80,0.14)' : 'rgba(233,184,80,0.16)') : 'transparent' }]}>
                        {on ? (
                          <View style={styles.gRepeat}>
                            {Array.from({ length: c }).map((_, k) => (
                              <Text key={k} style={[styles.gNum, { color: theme.gold1 }]}>{n}</Text>
                            ))}
                          </View>
                        ) : (
                          <Text style={[styles.gDash, { color: theme.textMuted }]}>–</Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
            {profile.loShu.missing.length > 0 && (
              <Text style={[styles.gMiss, { color: theme.textMuted }]}>
                {hi ? 'अनुपस्थित अंक: ' : 'Missing numbers: '}<Text style={{ color: '#e06a5a', fontFamily: fonts.interBold }}>{profile.loShu.missing.join(', ')}</Text>
              </Text>
            )}
            {profile.loShu.presentArrows.length > 0 && (
              <View style={styles.chipWrap}>
                {profile.loShu.presentArrows.map((a) => (
                  <View key={a.key} style={[styles.arrow, { borderColor: theme.gold2 + '55', backgroundColor: theme.isDark ? 'rgba(233,184,80,0.08)' : 'rgba(255,247,224,0.9)' }]}>
                    <Text style={[styles.arrowTxt, { color: theme.gold1 }]}>✦ {L(a)}</Text>
                  </View>
                ))}
              </View>
            )}
            <Text style={[styles.gridNote, { color: theme.textMuted }]}>
              {hi ? 'ग्रिड में जन्मतिथि के अंक + मूलांक (ड्राइवर) + भाग्यांक (कंडक्टर) शामिल हैं — मानक विधि (नामांक नहीं जोड़ा जाता)।'
                  : 'Grid includes the birth-date digits + Mulank (Driver) + Bhagyank (Conductor) — the standard method (the name number is never added).'}
            </Text>
          </View>

          {/* ── Core compatibility (Driver ↔ Conductor ↔ Name) ── */}
          <Text style={[styles.section, { color: theme.goldText }]}>{hi ? 'अंकों का आपसी तालमेल' : 'Core Number Harmony'}</Text>
          <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.85)' }]}>
            <CompatRow theme={theme} hi={hi} a={hi ? 'मूलांक' : 'Mulank'} an={profile.mulank.final} b={hi ? 'भाग्यांक' : 'Bhagyank'} bn={profile.bhagyank.final} rel={profile.coreCompatibility.driverConductor} relColor={relColor} L={L} />
            <CompatRow theme={theme} hi={hi} a={hi ? 'मूलांक' : 'Mulank'} an={profile.mulank.final} b={hi ? 'नामांक' : 'Namank'} bn={profile.namank.final} rel={profile.coreCompatibility.driverName} relColor={relColor} L={L} />
            <CompatRow theme={theme} hi={hi} a={hi ? 'भाग्यांक' : 'Bhagyank'} an={profile.bhagyank.final} b={hi ? 'नामांक' : 'Namank'} bn={profile.namank.final} rel={profile.coreCompatibility.conductorName} relColor={relColor} L={L} />
          </View>

          {/* ── Lucky ── */}
          {profile.lucky && (
            <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.85)' }]}>
              <Text style={[styles.cardH, { color: theme.gold1 }]}>{hi ? '🍀 आपके शुभ तत्व' : '🍀 Your Lucky Elements'}</Text>
              <LuckyRow theme={theme} k={hi ? 'अंक' : 'Numbers'} v={profile.lucky.numbers.join(', ')} />
              <LuckyRow theme={theme} k={hi ? 'रंग' : 'Colours'} v={LL(profile.lucky.colors).join(', ')} />
              <LuckyRow theme={theme} k={hi ? 'दिन' : 'Days'} v={LL(profile.lucky.days).join(', ')} />
              <LuckyRow theme={theme} k={hi ? 'रत्न' : 'Gem'} v={L(profile.lucky.gem)} />
            </View>
          )}

          {/* ── Number checker ── */}
          <Text style={[styles.section, { color: theme.goldText }]}>{hi ? 'मोबाइल / गाड़ी नंबर मिलान' : 'Mobile / Vehicle Number Match'}</Text>
          <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.85)' }]}>
            <Text style={[styles.sub, { color: theme.textMuted, marginBottom: 8 }]}>
              {hi ? `आपके मूलांक ${profile.mulank.final} से नंबर की मित्रता जाँचें।` : `Check a number's friendship with your Mulank ${profile.mulank.final}.`}
            </Text>
            <View style={styles.checkRow}>
              <TextInput
                value={numInput} onChangeText={setNumInput} keyboardType="number-pad"
                placeholder={hi ? 'जैसे: 98765 43210' : 'Eg. 98765 43210'} placeholderTextColor={theme.textMuted}
                style={[styles.numInput, { borderColor: theme.cardBorder, color: theme.text, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.2)' : '#fff' }]}
              />
              <Pressable onPress={runCheck} style={[styles.checkBtn, { backgroundColor: theme.gold1 }]}>
                <Text style={[styles.checkBtnTxt, { color: theme.buttonInk }]}>{checkBusy ? '…' : (hi ? 'जाँचें' : 'Check')}</Text>
              </Pressable>
            </View>
            {check && (
              <View style={[styles.checkOut, { borderColor: relColor(check.relation) + '66' }]}>
                <Text style={[styles.checkTotal, { color: theme.text }]}>{hi ? 'नंबर योग' : 'Total'}: <Text style={{ color: theme.gold1, fontFamily: fonts.interBold }}>{check.numberTotal}</Text> · {L(check.planet)}</Text>
                <Text style={[styles.checkRel, { color: relColor(check.relation) }]}>{check.relation.key === 'friend' ? '✓ ' : check.relation.key === 'enemy' ? '✕ ' : '• '}{L(check.relation)}</Text>
              </View>
            )}
          </View>

          {/* ── Name correction hint ── */}
          {profile.nameCorrection && (
            <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.05)' : 'rgba(255,250,240,0.7)' }]}>
              <Text style={[styles.cardH, { color: theme.gold1 }]}>{hi ? '✍️ नाम सामंजस्य' : '✍️ Name Harmony'}</Text>
              <Text style={[styles.sub, { color: theme.text }]}>{L(profile.nameCorrection.note)}</Text>
              {!profile.nameCorrection.isHarmonious && profile.nameCorrection.suggestedNameNumbers.length > 0 && (
                <Text style={[styles.sub, { color: theme.textMuted, marginTop: 6 }]}>
                  {hi ? 'सुझाए गए नामांक: ' : 'Suggested name numbers: '}<Text style={{ color: theme.gold1 }}>{profile.nameCorrection.suggestedNameNumbers.join(', ')}</Text>
                </Text>
              )}
            </View>
          )}

          {/* ── AI reading ── */}
          {!reading ? (
            <Pressable onPress={loadReading} disabled={readingBusy} style={[styles.aiBtn, { borderColor: theme.gold2 }]}>
              {readingBusy ? <ActivityIndicator color={theme.gold1} /> : <Text style={[styles.aiBtnTxt, { color: theme.gold1 }]}>{hi ? '🔮 विस्तृत व्याख्या पढ़ें (AI)' : '🔮 Read detailed interpretation (AI)'}</Text>}
            </Pressable>
          ) : (
            <View style={[styles.card, { borderColor: theme.gold2 + '55', backgroundColor: theme.isDark ? 'rgba(233,184,80,0.05)' : 'rgba(255,250,240,0.75)' }]}>
              <Text style={[styles.cardH, { color: theme.gold1 }]}>{hi ? '🔮 विस्तृत व्याख्या' : '🔮 Detailed Interpretation'}</Text>
              <AiBlock theme={theme} title={hi ? 'मूलांक' : 'Mulank'} b={reading.mulank} />
              <AiBlock theme={theme} title={hi ? 'भाग्यांक' : 'Bhagyank'} b={reading.bhagyank} list={reading.bhagyank?.career} />
              <AiBlock theme={theme} title={hi ? 'नामांक' : 'Namank'} b={reading.namank} />
              <AiBlock theme={theme} title={hi ? 'व्यक्तिगत वर्ष' : 'Personal Year'} b={reading.personalYear} />
              {reading.loShu && (
                <View style={{ marginTop: 8 }}>
                  <Text style={[styles.aiHead, { color: theme.gold2 }]}>{hi ? 'लो-शु' : 'Lo Shu'}</Text>
                  {!!reading.loShu.strengths && <Text style={[styles.aiTxt, { color: theme.text }]}>{reading.loShu.strengths}</Text>}
                  {!!reading.loShu.gaps && <Text style={[styles.aiTxt, { color: theme.textMuted, marginTop: 3 }]}>{reading.loShu.gaps}</Text>}
                  {Array.isArray(reading.loShu.remedies) && reading.loShu.remedies.map((r, i) => <Text key={i} style={[styles.aiTxt, { color: theme.text, marginTop: 2 }]}>• {r}</Text>)}
                </View>
              )}
              {!!reading.summary && <Text style={[styles.aiTxt, { color: theme.text, marginTop: 10, fontFamily: fonts.interSemi }]}>{reading.summary}</Text>}
              {!!reading.saralVivaran && (
                <View style={[styles.saral, { borderColor: theme.gold2 + '44' }]}>
                  <Text style={[styles.aiHead, { color: theme.gold2 }]}>{hi ? 'सरल विवरण' : 'In simple words'}</Text>
                  <Text style={[styles.aiTxt, { color: theme.text }]}>{reading.saralVivaran}</Text>
                </View>
              )}
            </View>
          )}

          <Text style={[styles.disc, { color: theme.textMuted }]}>{L(profile.disclaimer)}</Text>
          <View style={{ height: 8 }} />
        </View>
      )}

      <GoldDatePicker
        visible={showDate}
        initialDate={dob || new Date(1995, 0, 1)}
        maximumDate={new Date()}
        onConfirm={(d) => { setDob(d); setShowDate(false); }}
        onCancel={() => setShowDate(false)}
        lang={lang}
      />
    </Page>
  );
}

// ── sub-components ──
function Trinity({ theme, hi, label, tag, plain, data, focus }: { theme: any; hi: boolean; label: string; tag: string; plain: string; data: NumWithPlanet; focus: 'nature' | 'path' | 'name' }) {
  const L = (o?: { en: string; hi: string } | null) => (o ? (hi ? o.hi : o.en) : '');
  const LL = (o?: { en: string[]; hi: string[] } | null) => (o ? (hi ? o.hi : o.en) : []);
  const m = data.meaning;
  return (
    <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.85)' }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <LinearGradient colors={['#fce8a8', '#e9b850']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.numCircle}>
          <Text style={styles.numBig}>{data.final}</Text>
        </LinearGradient>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={[styles.tLabel, { color: theme.text }]}>{label}</Text>
          <Text style={[styles.tTag, { color: theme.textMuted }]}>{tag}</Text>
          <Text style={[styles.tPlanet, { color: theme.gold1 }]}>{L(data.planet)}</Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
            {data.compound !== data.final && <Badge theme={theme} txt={`${data.compound} → ${data.final}`} />}
            {data.isMaster && <Badge theme={theme} txt="Master ✦" gold />}
            {data.isKarmic && <Badge theme={theme} txt="Karmic" warn />}
          </View>
        </View>
      </View>

      <Text style={[styles.plainTxt, { color: theme.textMuted }]}>ℹ️ {plain}</Text>

      {m && (
        <View style={{ marginTop: 11 }}>
          <View style={styles.kwWrap}>
            {LL(m.keywords).map((k) => (
              <View key={k} style={[styles.kw, { borderColor: theme.gold2 + '44', backgroundColor: theme.isDark ? 'rgba(233,184,80,0.07)' : 'rgba(255,247,224,0.85)' }]}>
                <Text style={[styles.kwTxt, { color: theme.gold1 }]}>{k}</Text>
              </View>
            ))}
          </View>
          {focus === 'path' ? (
            <>
              <Text style={[styles.meaningTxt, { color: theme.text }]}>{L(m.lifePath)}</Text>
              <Text style={[styles.subHead, { color: theme.gold2 }]}>{hi ? 'उपयुक्त क्षेत्र' : 'Suited fields'}</Text>
              <Text style={[styles.careerTxt, { color: theme.textMuted }]}>{LL(m.career).join(' · ')}</Text>
            </>
          ) : focus === 'name' ? (
            <Text style={[styles.meaningTxt, { color: theme.text }]}>{L(m.nature)}</Text>
          ) : (
            <>
              <Text style={[styles.meaningTxt, { color: theme.text }]}>{L(m.nature)}</Text>
              <View style={styles.scRow}>
                <Text style={[styles.scTxt, { color: '#3ec77a' }]}>✓ {L(m.strength)}</Text>
                <Text style={[styles.scTxt, { color: '#e0a92e' }]}>⚠ {L(m.caution)}</Text>
              </View>
            </>
          )}
        </View>
      )}
      {data.remedy && <Text style={[styles.remedy, { color: theme.textMuted }]}>🕉 {L(data.remedy)}</Text>}
    </View>
  );
}
function Badge({ theme, txt, gold, warn }: any) {
  const c = warn ? '#e06a5a' : gold ? theme.gold1 : theme.textMuted;
  return <View style={[styles.badge, { borderColor: c + '77' }]}><Text style={[styles.badgeTxt, { color: c }]}>{txt}</Text></View>;
}
function MiniStat({ theme, label, n, highlight }: any) {
  return (
    <View style={[styles.mini, { borderColor: highlight ? theme.gold2 + '88' : theme.cardBorder, backgroundColor: highlight ? (theme.isDark ? 'rgba(233,184,80,0.10)' : 'rgba(255,247,224,0.9)') : (theme.isDark ? 'rgba(255,255,255,0.02)' : '#fff') }]}>
      <Text style={[styles.miniN, { color: theme.gold1 }]}>{n}</Text>
      <Text style={[styles.miniL, { color: theme.textMuted }]}>{label}</Text>
    </View>
  );
}
function LuckyRow({ theme, k, v }: any) {
  return (
    <View style={styles.luckyRow}>
      <Text style={[styles.luckyK, { color: theme.textMuted }]}>{k}</Text>
      <Text style={[styles.luckyV, { color: theme.text }]}>{v}</Text>
    </View>
  );
}
function CompatRow({ theme, a, an, b, bn, rel, relColor, L }: any) {
  const c = relColor(rel);
  return (
    <View style={styles.compatRow}>
      <Text style={[styles.compatPair, { color: theme.text }]}>{a} <Text style={{ color: theme.gold1, fontFamily: fonts.interBold }}>{an}</Text>  <Text style={{ color: theme.textMuted }}>↔</Text>  {b} <Text style={{ color: theme.gold1, fontFamily: fonts.interBold }}>{bn}</Text></Text>
      <View style={[styles.compatPill, { borderColor: c + '66' }]}>
        <Text style={[styles.compatPillTxt, { color: c }]}>{rel.key === 'friend' ? '✓ ' : rel.key === 'enemy' ? '✕ ' : '• '}{L(rel)}</Text>
      </View>
    </View>
  );
}
function GuideItem({ theme, icon, title, body }: { theme: any; icon: string; title: string; body: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Pressable onPress={() => { hTap(); setOpen((o) => !o); }} style={[styles.guideItem, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.85)' }]}>
      <View style={styles.guideHead}>
        <Text style={[styles.guideTitle, { color: theme.text }]}>{icon}  {title}</Text>
        <Text style={[styles.guideChevron, { color: theme.gold1 }]}>{open ? '−' : '+'}</Text>
      </View>
      {open && <Text style={[styles.guideBody, { color: theme.textMuted }]}>{body}</Text>}
    </Pressable>
  );
}
function AiBlock({ theme, title, b, list }: { theme: any; title: string; b?: { title?: string; meaning?: string } | null; list?: string[] }) {
  if (!b || !b.meaning) return null;
  return (
    <View style={{ marginTop: 8 }}>
      <Text style={[styles.aiHead, { color: theme.gold2 }]}>{b.title || title}</Text>
      <Text style={[styles.aiTxt, { color: theme.text }]}>{b.meaning}</Text>
      {Array.isArray(list) && list.length > 0 && <Text style={[styles.aiTxt, { color: theme.textMuted, marginTop: 2 }]}>{list.join(' · ')}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 18, padding: 15 },
  h1: { fontFamily: fonts.playfairBold, fontSize: 22, lineHeight: 28 },
  sub: { fontFamily: fonts.inter, fontSize: 12.5, lineHeight: 18 },
  trust: { fontFamily: fonts.inter, fontSize: 10.5, lineHeight: 15, marginTop: 10 },
  picker: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14 },
  pLabel: { fontFamily: fonts.interSemi, fontSize: 10, letterSpacing: 0.6 },
  pVal: { fontFamily: fonts.interSemi, fontSize: 14.5, marginTop: 2 },
  section: { fontFamily: fonts.cinzelSemi, fontSize: 13, letterSpacing: 1, marginTop: 4 },

  learnBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 15, marginTop: 14 },
  learnTxt: { fontFamily: fonts.interBold, fontSize: 13, flex: 1 },
  learnChev: { fontFamily: fonts.interBold, fontSize: 12, marginLeft: 8 },
  guideItem: { borderWidth: 1, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14 },
  guideHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  guideTitle: { fontFamily: fonts.interSemi, fontSize: 13, flex: 1 },
  guideChevron: { fontFamily: fonts.interBold, fontSize: 18, marginLeft: 10 },
  guideBody: { fontFamily: fonts.inter, fontSize: 12.5, lineHeight: 19, marginTop: 9 },
  plainTxt: { fontFamily: fonts.inter, fontSize: 11.5, lineHeight: 16, marginTop: 10, fontStyle: 'italic' },
  numCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  numBig: { fontFamily: fonts.playfairBold, fontSize: 38, color: '#2a1c00' },
  tLabel: { fontFamily: fonts.interBold, fontSize: 17 },
  tTag: { fontFamily: fonts.inter, fontSize: 10.5, marginTop: 1 },
  tPlanet: { fontFamily: fonts.interSemi, fontSize: 13, marginTop: 3 },
  kwWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 9 },
  kw: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  kwTxt: { fontFamily: fonts.interSemi, fontSize: 10.5 },
  meaningTxt: { fontFamily: fonts.inter, fontSize: 13, lineHeight: 19 },
  subHead: { fontFamily: fonts.interBold, fontSize: 11, marginTop: 9, letterSpacing: 0.3 },
  careerTxt: { fontFamily: fonts.interSemi, fontSize: 12.5, lineHeight: 18, marginTop: 2 },
  scRow: { marginTop: 9, gap: 3 },
  scTxt: { fontFamily: fonts.inter, fontSize: 11.5, lineHeight: 16 },
  pyCard: { borderWidth: 1, borderRadius: 14, padding: 12 },
  pyTxt: { fontFamily: fonts.inter, fontSize: 12.5, lineHeight: 18 },
  remedy: { fontFamily: fonts.inter, fontSize: 11.5, lineHeight: 16, marginTop: 11 },
  badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  badgeTxt: { fontFamily: fonts.interSemi, fontSize: 9.5 },

  row2: { flexDirection: 'row', gap: 10 },
  mini: { flex: 1, borderWidth: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  miniN: { fontFamily: fonts.playfairBold, fontSize: 22 },
  miniL: { fontFamily: fonts.inter, fontSize: 10, marginTop: 2, textAlign: 'center' },

  grid: { alignSelf: 'center' },
  gCell: { width: 60, height: 54, borderWidth: 1, alignItems: 'center', justifyContent: 'center', margin: 2, borderRadius: 8 },
  gRepeat: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, alignItems: 'center', justifyContent: 'center' },
  gNum: { fontFamily: fonts.interBold, fontSize: 16 },
  gDash: { fontFamily: fonts.interSemi, fontSize: 17, opacity: 0.28 },
  gMiss: { fontFamily: fonts.inter, fontSize: 12, textAlign: 'center', marginTop: 12 },
  gridNote: { fontFamily: fonts.inter, fontSize: 10.5, lineHeight: 15, textAlign: 'center', marginTop: 12 },
  compatRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 7, gap: 10 },
  compatPair: { fontFamily: fonts.interSemi, fontSize: 12.5, flex: 1 },
  compatPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  compatPillTxt: { fontFamily: fonts.interBold, fontSize: 11 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 10 },
  arrow: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  arrowTxt: { fontFamily: fonts.interSemi, fontSize: 10.5 },

  cardH: { fontFamily: fonts.interBold, fontSize: 14, marginBottom: 8 },
  luckyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, gap: 12 },
  luckyK: { fontFamily: fonts.interSemi, fontSize: 12.5 },
  luckyV: { fontFamily: fonts.inter, fontSize: 12.5, flex: 1, textAlign: 'right' },

  checkRow: { flexDirection: 'row', gap: 8 },
  numInput: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontFamily: fonts.interSemi, fontSize: 15 },
  checkBtn: { borderRadius: 12, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  checkBtnTxt: { fontFamily: fonts.interBold, fontSize: 14 },
  checkOut: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  checkTotal: { fontFamily: fonts.inter, fontSize: 12.5 },
  checkRel: { fontFamily: fonts.interBold, fontSize: 14 },

  aiBtn: { borderWidth: 1.4, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  aiBtnTxt: { fontFamily: fonts.interBold, fontSize: 13.5 },
  aiHead: { fontFamily: fonts.interBold, fontSize: 12.5, marginBottom: 2 },
  aiTxt: { fontFamily: fonts.inter, fontSize: 12.5, lineHeight: 18 },
  saral: { borderTopWidth: 1, marginTop: 12, paddingTop: 10 },
  disc: { fontFamily: fonts.inter, fontSize: 10.5, lineHeight: 15, textAlign: 'center', marginTop: 6 },
});
