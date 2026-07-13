import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Share } from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { Theme, fonts, radii } from '../theme/tokens';
import { Page } from '../components/Page';
import { Card } from '../components/Card';
import { CrownIcon, CalendarIcon } from '../components/icons/ProfileIcons';
import { ZodiacIcon } from '../components/icons/ZodiacIcon';
import { SaralVivaran } from '../components/SaralVivaran';
import { IMAGES } from '../assets/images';
import { hTap, hSelect } from '../lib/haptics';
import { getPanchang, PanchangResponse, getDailyPrediction, DailyPrediction, avatarUrl, PredPeriod } from '../lib/api';
import { PeriodForecast } from '../components/PeriodForecast';
import { birthFromProfile } from '../lib/birth';
import { naamRashi } from '../lib/naamRashi';
import { useScreen } from '../context/AppConfigProvider';
import { useT, useLang } from '../i18n/LanguageProvider';
import { aArea, aAstroText, aColor, aMood, aPanchangLabel, aPanchangTerm, aSign } from '../i18n/astro';

const DEFAULT_BIRTH = { dob: '01-01-2000', tob: '06:42', tz: '+05:30', place: 'Jaipur' };

const FALLBACK_TEXT =
  'Today favours calm planning, balanced speech, and practical decisions. Keep your routine clean and avoid rushed reactions before important work.';

const sw = (c: string, n = 1.8) => ({ width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none' as const, stroke: c, strokeWidth: n, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const });
const fl = (c: string) => ({ width: 22, height: 22, viewBox: '0 0 24 24', fill: c });
const rg = (c: string) => ({ width: 30, height: 30, viewBox: '0 0 64 64', fill: 'none' as const, stroke: c, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const });

const MOODS = [
  { label: 'Energy', pct: 76, icon: (c: string) => <Svg {...fl(c)}><Path d="M13 2L3 14h7l-1 8 10-12h-7z" /></Svg> },
  { label: 'Love', pct: 70, icon: (c: string) => <Svg {...fl(c)}><Path d="M12 21s-7-4.4-7-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.6-7 11-7 11z" /></Svg> },
  { label: 'Career', pct: 68, icon: (c: string) => <Svg {...sw(c)}><Path d="M3 7h18v13H3z" /><Path d="M8 7V5a4 4 0 0 1 8 0v2" /></Svg> },
  { label: 'Health', pct: 72, icon: (c: string) => <Svg {...fl(c)}><Path d="M12 2C9 6 7 8 7 12a5 5 0 0 0 10 0c0-2-1-4-3-6-1 2-2 2-2 0z" /></Svg> },
];

const AREA_ICONS: Record<string, (c: string) => React.ReactNode> = {
  Love: (c) => <Svg {...fl(c)}><Path d="M12 21s-7-4.4-7-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.6-7 11-7 11z" /></Svg>,
  Career: (c) => <Svg {...sw(c)}><Path d="M3 7h18v13H3z" /><Path d="M8 7V5a4 4 0 0 1 8 0v2" /></Svg>,
  Finance: (c) => <Svg {...sw(c)}><Circle cx={12} cy={12} r={9} /><Path d="M8 14a4 4 0 0 0 8 0c0-2-1.5-3-4-3s-4-1-4-3a4 4 0 0 1 8 0M12 6v12" /></Svg>,
  Health: (c) => <Svg {...sw(c)}><Path d="M12 21s-8-4.5-8-12a4 4 0 0 1 8 0 4 4 0 0 1 8 0c0 7.5-8 12-8 12z" /></Svg>,
};

const FALLBACK_AREAS = [
  { title: 'Love', text: 'Keep warmth in relationships and avoid stretching small issues.', action: 'Listen first, reply slowly.', score: 70 },
  { title: 'Career', text: 'Pending work can move when priorities are clear.', action: 'Finish one important task before multitasking.', score: 68 },
  { title: 'Finance', text: 'Review spending and avoid impulsive commitments.', action: 'Delay non-essential purchases.', score: 64 },
  { title: 'Health', text: 'Energy improves with routine and hydration.', action: 'Eat on time and rest well.', score: 72 },
];

const FALLBACK_REMEDIES = [
  {
    title: 'Morning Prayer',
    body: 'Begin the day with a short prayer or gratitude practice to steady the mind.',
    timing: 'Morning',
    icon: (c: string) => <Svg {...rg(c)}><Path d="M32 10c-3 6-5 8-5 14a5 5 0 0 0 10 0c0-2-1-4-3-6-1 2-2 2-2 0z" fill={c} fillOpacity={0.25} /><Path d="M20 36h24l-3 18H23z" fill={c} fillOpacity={0.12} /></Svg>,
  },
  {
    title: 'Simple Donation',
    body: 'Offer food, fruit, or water to someone in need.',
    timing: 'Daytime',
    icon: (c: string) => <Svg {...rg(c)}><Circle cx={32} cy={34} r={18} fill={c} fillOpacity={0.15} /><Path d="M14 34h36M14 28h36" /></Svg>,
  },
  {
    title: 'Mindful Speech',
    body: 'Avoid arguments and choose calm words throughout the day.',
    timing: 'All day',
    icon: (c: string) => <Svg {...rg(c)}><Circle cx={32} cy={32} r={22} strokeDasharray="3 5" /><Circle cx={32} cy={14} r={2.5} fill={c} /><Circle cx={50} cy={32} r={2.5} fill={c} /><Circle cx={32} cy={50} r={2.5} fill={c} /><Circle cx={14} cy={32} r={2.5} fill={c} /></Svg>,
  },
];

type Tone = 'good' | 'bad' | 'plain' | 'neutral' | 'caution';

function SectionH({ children, theme }: { children: React.ReactNode; theme: Theme }) {
  return (
    <View style={styles.secH}>
      <View style={[styles.secLine, { backgroundColor: theme.line }]} />
      <Text style={[styles.secTitle, { color: theme.goldText }]}>{children}</Text>
      <View style={[styles.secLine, { backgroundColor: theme.line }]} />
    </View>
  );
}

function MiniSpark({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9z" />
    </Svg>
  );
}

const asText = (v: any) => {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object') return v.name || v.sign || v.title || '';
  return String(v);
};

const clampPct = (n: any, fallback: number) => Math.max(0, Math.min(100, Number(n) || fallback));
const panchangName = (v: any, lang: 'en' | 'hi') => {
  if (!v) return '';
  if (lang === 'hi' && typeof v === 'object' && v.hi) return v.hi;
  return aPanchangTerm(asText(v), lang);
};

export function DailyPredictionScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<'daily' | PredPeriod>('daily');
  const dp = useScreen('dailyPrediction');
  const t = useT();
  const heroImage = dp.img('heroImage');
  const accent = (tone: Tone) => (tone === 'good' ? theme.green : tone === 'bad' || tone === 'caution' ? theme.red : theme.gold1);

  const [pred, setPred] = useState<DailyPrediction | null>(null);
  const [predLoading, setPredLoading] = useState(true);
  const [predError, setPredError] = useState<string | null>(null);
  const [panch, setPanch] = useState<PanchangResponse | null>(null);
  const [birthName, setBirthName] = useState<string | null>(null);

  useEffect(() => {
    let on = true;
    (async () => {
      const b = await birthFromProfile().catch(() => null);
      const birth = b || DEFAULT_BIRTH;
      if (on) setBirthName((b as any)?.name || null);
      try {
        const p = await getDailyPrediction({ ...birth, name: (b as any)?.name });
        if (on) setPred(p);
      } catch (e: any) {
        if (on) setPredError(e?.message || 'Prediction unavailable');
      } finally {
        if (on) setPredLoading(false);
      }

      try {
        const p = await getPanchang({ place: b?.place || birth.place || 'Jaipur' });
        if (on) setPanch(p);
      } catch (_) {
        // daily AI response already includes compact panchang context when available
      }
    })();
    return () => { on = false; };
    // refetch when language switches so the AI rashifal text re-renders in the chosen language
  }, [lang]);

  const today = pred?.basis?.today;
  const predText = aAstroText(pred?.overall || FALLBACK_TEXT, lang);
  const detailText = aAstroText(pred?.detailedSummary || pred?.transitSummary || '', lang);
  const moonSign = pred?.basis?.moonSign || panch?.moon.sign || 'Moon Sign';
  // user's rashi identity shown prominently = naam-rashi (by name) when known, else moon sign
  const displayRashi = naamRashi(birthName) || (pred?.basis?.moonSign || panch?.moon.sign || null);
  const ascendant = pred?.basis?.ascendant || 'Lagna';
  const dasha = pred?.basis?.dasha || 'Dasha';
  const luckyColour = aColor(pred?.luckyColour || 'Gold', lang);
  const luckyNumber = pred ? String(pred.luckyNumber) : '7';
  const confidence = pred?.confidence ? Math.round(pred.confidence * 100) : null;
  const displayRashiText = lang === 'hi'
    ? aSign(displayRashi || moonSign, lang)
    : String(displayRashi || moonSign).toUpperCase();

  const basisCells = useMemo(() => [
    { label: aAstroText(t('dp.moonSign', 'Moon Sign'), lang), value: aAstroText(aSign(moonSign, lang), lang) },
    { label: aAstroText(t('dp.lagna', 'Lagna'), lang), value: aAstroText(aSign(ascendant, lang), lang) },
    { label: aAstroText(t('dp.dasha', 'Dasha'), lang), value: aAstroText(dasha, lang) },
    { label: aAstroText(t('dp.nakshatra', 'Nakshatra'), lang), value: panchangName(today?.nakshatra, lang) || panchangName(panch?.nakshatra, lang) || aAstroText('Today', lang) },
  ], [moonSign, ascendant, dasha, today, panch, t, lang]);

  const panchCells = useMemo(() => {
    if (panch) {
      return [
        { lbl: aPanchangLabel('Tithi', lang), val: lang === 'hi' ? (panch.tithi.hi || aPanchangTerm(panch.tithi.name, lang)) : panch.tithi.name, tone: 'plain' as Tone },
        { lbl: aPanchangLabel('Paksha', lang), val: lang === 'hi' ? (panch.tithi.pakshaHi || aPanchangTerm(panch.tithi.paksha, lang)) : panch.tithi.paksha, tone: 'plain' as Tone },
        { lbl: aPanchangLabel('Nakshatra', lang), val: `${lang === 'hi' ? (panch.nakshatra.hi || aPanchangTerm(panch.nakshatra.name, lang)) : panch.nakshatra.name} ${lang === 'hi' ? 'चरण' : 'Pada'} ${panch.nakshatra.pada}`, tone: 'good' as Tone },
        { lbl: aPanchangLabel('Yoga', lang), val: lang === 'hi' ? (panch.yoga.hi || aPanchangTerm(panch.yoga.name, lang)) : panch.yoga.name, tone: 'plain' as Tone },
        { lbl: aPanchangLabel('Karana', lang), val: lang === 'hi' ? (panch.karana.hi || aPanchangTerm(panch.karana.name, lang)) : panch.karana.name, tone: 'plain' as Tone },
        { lbl: aPanchangLabel('Moon', lang), val: aSign(panch.moon.sign || '-', lang), tone: 'good' as Tone },
        { lbl: aPanchangLabel('Sunrise', lang), val: panch.sunrise, tone: 'plain' as Tone },
        { lbl: aPanchangLabel('Sunset', lang), val: panch.sunset, tone: 'plain' as Tone },
        ...panch.inauspicious.map((p) => ({ lbl: aPanchangLabel(p.name, lang), val: `${p.start} - ${p.end}`, tone: 'caution' as Tone })),
      ];
    }
    if (today) {
      return [
        { lbl: aPanchangLabel('Tithi', lang), val: panchangName(today.tithi, lang) || '-', tone: 'plain' as Tone },
        { lbl: aPanchangLabel('Paksha', lang), val: aPanchangTerm(today.paksha, lang) || '-', tone: 'plain' as Tone },
        { lbl: aPanchangLabel('Nakshatra', lang), val: panchangName(today.nakshatra, lang) || '-', tone: 'good' as Tone },
        { lbl: aPanchangLabel('Yoga', lang), val: panchangName(today.yoga, lang) || '-', tone: 'plain' as Tone },
        { lbl: aPanchangLabel('Moon', lang), val: aSign(today.transitMoon || '-', lang), tone: 'good' as Tone },
        { lbl: aPanchangLabel('Sunrise', lang), val: today.sunrise || '-', tone: 'plain' as Tone },
        ...(today.inauspicious || []).map((p) => ({ lbl: aPanchangLabel(p.name, lang), val: `${p.start} - ${p.end}`, tone: 'caution' as Tone })),
      ];
    }
    return null;
  }, [panch, today, lang]);

  const timeWindows = useMemo(() => {
    const fromAi = pred?.timeWindows || [];
    if (fromAi.length) return fromAi;
    const fallback = pred?.luckyTime ? [{ label: 'Lucky Time', time: pred.luckyTime, quality: 'good' as const, advice: pred.advice }] : [];
    return [
      ...fallback,
      ...((today?.inauspicious || panch?.inauspicious || []).slice(0, 2).map((p) => ({
        label: p.name,
        time: `${p.start} - ${p.end}`,
        quality: 'caution' as const,
        advice: p.note,
      }))),
    ];
  }, [pred, today, panch]);

  const fallbackAreas = lang === 'hi' ? [
    { title: 'Love', text: 'रिश्तों में गर्मजोशी रखें और छोटी बातों को बड़ा न बनाएं।', action: 'पहले सुनें, फिर शांत होकर जवाब दें।', score: 70 },
    { title: 'Career', text: 'काम में प्राथमिकता साफ रखें, अधूरे काम आगे बढ़ सकते हैं।', action: 'मल्टीटास्किंग से पहले एक जरूरी काम पूरा करें।', score: 68 },
    { title: 'Finance', text: 'खर्च और निवेश में सोच-समझकर निर्णय लें।', action: 'गैर-जरूरी खरीदारी आज टालें।', score: 64 },
    { title: 'Health', text: 'दिनचर्या, पानी और आराम से ऊर्जा बेहतर रहेगी।', action: 'समय पर भोजन करें और पर्याप्त आराम लें।', score: 72 },
  ] : FALLBACK_AREAS;
  const fallbackRemedies = lang === 'hi' ? FALLBACK_REMEDIES.map((r, i) => ({
    ...r,
    title: ['सुबह की प्रार्थना', 'सरल दान', 'शांत वाणी'][i] || r.title,
    body: ['दिन की शुरुआत छोटी प्रार्थना या कृतज्ञता से करें।', 'जरूरतमंद को भोजन, फल या पानी दें।', 'वाद-विवाद से बचें और पूरे दिन शांत शब्द चुनें।'][i] || r.body,
    timing: ['सुबह', 'दिन में', 'पूरे दिन'][i] || r.timing,
  })) : FALLBACK_REMEDIES;
  const areas = pred?.areas?.length ? pred.areas : fallbackAreas;
  const remedies = pred?.remedies?.length ? pred.remedies : fallbackRemedies;
  const doList = pred?.doList?.length ? pred.doList : (lang === 'hi'
    ? ['पहले जरूरी काम पूरा करें', 'बातचीत शांत रखें', 'नए काम के लिए सही समय चुनें']
    : ['Complete priority work first', 'Keep communication calm', 'Use the right timing for new work']);
  const avoidList = pred?.avoidList?.length ? pred.avoidList : (lang === 'hi'
    ? ['जल्दबाजी में निर्णय', 'अनावश्यक बहस', 'अचानक खर्च']
    : ['Rushed decisions', 'Unnecessary arguments', 'Impulsive spending']);
  const focus = pred?.focus?.length ? pred.focus : (lang === 'hi' ? ['स्पष्टता', 'धैर्य', 'दिनचर्या'] : ['Clarity', 'Patience', 'Routine']);
  const aiQuestions = pred?.aiQuestions?.length ? pred.aiQuestions : (lang === 'hi' ? [
    'आज करियर में मुझे किस बात पर ध्यान देना चाहिए?',
    'महत्वपूर्ण काम के लिए कौन सा समय बेहतर है?',
    'आज मुझे कौन सा सरल उपाय करना चाहिए?',
  ] : [
    'What should I focus on in career today?',
    'Which time is best for important work?',
    'What simple remedy should I follow today?',
  ]);

  const toggleSave = () => { setSaved((s) => { hSelect(); return !s; }); };
  const openAiQuestion = (question?: string) => {
    hTap();
    navigation.navigate('AiAstrologer', { question: question || aiQuestions[0] });
  };
  const sharePrediction = async () => {
    hTap();
    try {
      await Share.share({
        message:
          'Daily Prediction - Shree Yantra Astrology\n\n' +
          `${pred?.headline ? `${pred.headline}\n` : ''}${predText}` +
          `\n\nAdvice: ${pred?.advice || 'Stay calm and act with clarity.'}` +
          `\nLucky Colour: ${luckyColour} | Lucky Number: ${luckyNumber}`,
      });
    } catch (_) {
      // user dismissed
    }
  };

  return (
    <Page
      title={t('home.feat.pred.title', 'My Rashifal')}
      onBack={() => navigation.goBack()}
      right={<CrownIcon color={theme.gold1} size={16} />}
      onRight={() => navigation.navigate('ManageSubscription')}
    >
      {/* Daily / Weekly / Monthly / Yearly */}
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 14 }}>
        {(([['daily', lang === 'hi' ? 'दैनिक' : 'Daily'], ['week', lang === 'hi' ? 'साप्ताहिक' : 'Weekly'], ['month', lang === 'hi' ? 'मासिक' : 'Monthly'], ['year', lang === 'hi' ? 'वार्षिक' : 'Yearly']]) as [('daily' | PredPeriod), string][]).map(([k, lbl]) => {
          const on = tab === k;
          return (
            <Pressable key={k} onPress={() => { hSelect(); setTab(k); }} style={{ flex: 1 }}>
              {on ? (
                <LinearGradient colors={theme.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ paddingVertical: 8, borderRadius: 999, alignItems: 'center' }}>
                  <Text style={{ fontFamily: fonts.interSemi, fontSize: 12, color: theme.buttonInk }}>{lbl}</Text>
                </LinearGradient>
              ) : (
                <View style={{ paddingVertical: 8, borderRadius: 999, alignItems: 'center', borderWidth: 1, borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.4)' : '#fffdf7' }}>
                  <Text style={{ fontFamily: fonts.interSemi, fontSize: 12, color: theme.gold2 }}>{lbl}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {tab !== 'daily' ? (
        <PeriodForecast period={tab as PredPeriod} />
      ) : (
      <>
      <Card>
        <View style={{ alignItems: 'center' }}>
          <ZodiacIcon sign={displayRashi || moonSign} size={96} theme={theme} />
          <Text style={[styles.sign, { color: theme.goldText }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{displayRashiText}</Text>
          <Text style={[styles.hindi, { color: theme.textSoft }]}>{t('dp.moonBased', 'Moon sign based guidance')}</Text>
        </View>
        <View style={[styles.dateRow, { borderTopColor: theme.line }]}>
          <CalendarIcon color={theme.gold1} size={15} />
          <Text style={[styles.dateText, { color: theme.gold1 }]}>
            {predLoading ? t('dp.personalising', 'Personalising your day...') : pred ? `${aAstroText(t('dp.sourceTag', 'Chart Data'), lang)} | ${pred.generatedFor || aAstroText('Today', lang)}` : aAstroText('Today', lang)}
          </Text>
        </View>
        {!!pred?.headline && <Text style={[styles.headline, { color: theme.goldText }]}>{aAstroText(pred.headline, lang)}</Text>}
        <Text style={[styles.predBody, { color: theme.text }]}>{predText}</Text>
        {!!detailText && <Text style={[styles.detailBody, { color: theme.textSoft }]}>{detailText}</Text>}
        {!!predError && <Text style={[styles.errorText, { color: theme.red }]}>{t('dp.aiFallback', 'Estimated guidance')}: {predError}</Text>}

        <View style={styles.focusRow}>
          {focus.map((item) => (
            <View key={item} style={[styles.focusChip, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.10)' : '#ffffff' }]}>
              <MiniSpark color={theme.gold1} />
              <Text style={[styles.focusText, { color: theme.goldText }]} numberOfLines={1}>{aAstroText(item, lang)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.luckRow}>
          <View style={[styles.luckPill, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.5)' : '#ffffff' }]}>
            <Text style={[styles.luckStar, { color: theme.gold1 }]}>#</Text>
            <Text style={[styles.luckLbl, { color: theme.textSoft }]}>{t('dp.luckyNumber', 'Lucky Number')} </Text>
            <Text style={[styles.luckVal, { color: theme.goldText }]}>{luckyNumber}</Text>
          </View>
          <View style={[styles.luckPill, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.5)' : '#ffffff' }]}>
            <MiniSpark color={theme.gold1} />
            <Text style={[styles.luckLbl, { color: theme.textSoft }]}>{t('dp.luckyColour', 'Lucky Colour')} </Text>
            <Text style={[styles.luckVal, { color: theme.goldText }]}>{luckyColour}</Text>
          </View>
          {!!confidence && (
            <View style={[styles.luckPill, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.5)' : '#ffffff' }]}>
              <Text style={[styles.luckLbl, { color: theme.textSoft }]}>{t('dp.confidence', 'Confidence')} </Text>
              <Text style={[styles.luckVal, { color: theme.goldText }]}>{confidence}%</Text>
            </View>
          )}
        </View>
      </Card>

      <Card style={{ marginTop: 14 }}>
        <SectionH theme={theme}>{aAstroText(t('dp.astroBasis', 'Astro Basis'), lang)}</SectionH>
        <View style={styles.basisGrid}>
          {basisCells.map((b) => (
            <View key={b.label} style={[styles.basisCell, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.44)' : 'rgba(176,115,22,0.05)' }]}>
              <Text style={[styles.basisLabel, { color: theme.textMuted }]}>{b.label}</Text>
              <Text style={[styles.basisValue, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{b.value || '-'}</Text>
            </View>
          ))}
        </View>
        {!!pred?.transitSummary && <Text style={[styles.summaryText, { color: theme.textSoft }]}>{aAstroText(pred.transitSummary, lang)}</Text>}
      </Card>

      <Card style={{ marginTop: 14 }}>
        <SectionH theme={theme}>{aAstroText(t('dp.cosmicMood', "Today's Cosmic Mood"), lang)}</SectionH>
        <View style={{ gap: 14, marginTop: 6 }}>
          {MOODS.map((m) => {
            const pct = clampPct(pred?.moods?.find((x) => x.label === m.label)?.pct, m.pct);
            return (
              <View key={m.label}>
                <View style={styles.moodHead}>
                  <View style={[styles.moodIc, { backgroundColor: theme.isDark ? 'rgba(233,184,80,0.12)' : 'rgba(176,115,22,0.10)' }]}>
                    {m.icon(theme.gold1)}
                  </View>
                  <Text style={[styles.moodLbl, { color: theme.text }]}>{aMood(m.label, lang)}</Text>
                  <Text style={[styles.moodPct, { color: theme.goldText }]}>{pct}%</Text>
                </View>
                <View style={[styles.track, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(176,115,22,0.16)' }]}>
                  <LinearGradient colors={theme.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.fill, { width: `${pct}%` }]} />
                </View>
              </View>
            );
          })}
        </View>
      </Card>

      <Card style={{ marginTop: 14 }}>
        <SectionH theme={theme}>{aAstroText(t('dp.panchang', "Today's Panchang"), lang)}</SectionH>
        {(panch || today) && (
          <View style={styles.panchDateRow}>
            <Text style={[styles.panchDate, { color: theme.gold1 }]}>
              {panch ? `${aAstroText(panch.weekday, lang)} | ${panch.date}` : `${aAstroText(today?.weekday || 'Today', lang)} | ${today?.date || pred?.generatedFor || ''}`}
            </Text>
            <Text style={[styles.panchLive, { color: theme.green }]}>{aAstroText('LIVE DATA', lang)}</Text>
          </View>
        )}
        {panchCells ? (
          <View style={styles.timeGrid}>
            {panchCells.map((c, i) => (
              <View key={`${c.lbl}-${i}`} style={[styles.timeCell, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.5)' : '#ffffff' }]}>
                <Text style={[styles.timeLbl, { color: accent(c.tone) }]}>{c.lbl}</Text>
                <Text style={[styles.timeVal, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{c.val}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.summaryText, { color: theme.textSoft }]}>{t('dp.panchangEmpty', 'Panchang will appear after your birth place and network data are available.')}</Text>
        )}
        {!!pred?.panchangSummary && <Text style={[styles.summaryText, { color: theme.textSoft }]}>{aAstroText(pred.panchangSummary, lang)}</Text>}
      </Card>

      {!!timeWindows.length && (
        <Card style={{ marginTop: 14 }}>
          <SectionH theme={theme}>{aAstroText(t('dp.bestTiming', 'Best Timing Today'), lang)}</SectionH>
          <View style={{ gap: 10, marginTop: 6 }}>
            {timeWindows.map((item, index) => (
              <View key={`${item.label}-${index}`} style={[styles.timingRow, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.42)' : 'rgba(176,115,22,0.05)' }]}>
                <View style={[styles.timingDot, { backgroundColor: accent((item.quality || 'neutral') as Tone) }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.timingTitle, { color: theme.text }]}>{aAstroText(item.label, lang)}</Text>
                  <Text style={[styles.timingBody, { color: theme.textSoft }]}>{aAstroText(item.advice || (lang === 'hi' ? 'इस समय को शांत मन और स्पष्ट ध्यान के साथ उपयोग करें।' : 'Use this timing with calm focus.'), lang)}</Text>
                </View>
                <Text style={[styles.timingTime, { color: theme.goldText }]}>{item.time}</Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      <Card style={{ marginTop: 14 }}>
        <SectionH theme={theme}>{aAstroText(t('dp.moreInsights', 'More Insights'), lang)}</SectionH>
        <View style={styles.insightGrid}>
          {areas.map((it) => {
            const icon = AREA_ICONS[it.title] || AREA_ICONS.Career;
            return (
              <View key={it.title} style={[styles.insight, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.45)' : 'rgba(176,115,22,0.05)' }]}>
                <View style={styles.insightTop}>
                  <View style={styles.insightIc}>{icon(theme.gold1)}</View>
                  {!!it.score && <Text style={[styles.scoreText, { color: theme.goldText }]}>{clampPct(it.score, 70)}%</Text>}
                </View>
                <Text style={[styles.insightTitle, { color: theme.goldText }]}>{aArea(it.title, lang)}</Text>
                <Text style={[styles.insightBody, { color: theme.textSoft }]}>{aAstroText(it.text, lang)}</Text>
                {!!it.action && <Text style={[styles.insightAction, { color: theme.text }]}>{aAstroText(it.action, lang)}</Text>}
              </View>
            );
          })}
        </View>
      </Card>

      <Card style={{ marginTop: 14 }}>
        <SectionH theme={theme}>{aAstroText(t('dp.doAvoid', 'Do And Avoid'), lang)}</SectionH>
        <View style={styles.doAvoidGrid}>
          <View style={[styles.doAvoidBox, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(39,119,56,0.12)' : 'rgba(31,143,79,0.08)' }]}>
            <Text style={[styles.doAvoidTitle, { color: theme.green }]}>{aAstroText(t('dp.do', 'Do'), lang)}</Text>
            {doList.map((item) => <Text key={item} style={[styles.listText, { color: theme.text }]}>{aAstroText(item, lang)}</Text>)}
          </View>
          <View style={[styles.doAvoidBox, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(160,48,48,0.12)' : 'rgba(192,57,43,0.08)' }]}>
            <Text style={[styles.doAvoidTitle, { color: theme.red }]}>{aAstroText(t('dp.avoid', 'Avoid'), lang)}</Text>
            {avoidList.map((item) => <Text key={item} style={[styles.listText, { color: theme.text }]}>{aAstroText(item, lang)}</Text>)}
          </View>
        </View>
      </Card>

      <Card style={{ marginTop: 14 }}>
        <SectionH theme={theme}>{aAstroText(t('dp.remedies', 'Suggested Remedies'), lang)}</SectionH>
        <View style={{ gap: 12, marginTop: 6 }}>
          {remedies.map((r, index) => {
            const rr = r as any;
            const icon = 'icon' in r && typeof (r as any).icon === 'function'
              ? (r as any).icon
              : FALLBACK_REMEDIES[index % FALLBACK_REMEDIES.length].icon;
            const body = rr.body || rr.text || '';
            const timing = rr.timing || rr.tag || '';
            return (
              <View key={`${r.title}-${index}`} style={[styles.remedy, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.4)' : 'rgba(176,115,22,0.04)' }]}>
                <View style={[styles.remedyGlyph, { borderColor: theme.cardBorder }]}>
                  {icon(theme.gold1)}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.remedyTitle, { color: theme.text }]}>{aAstroText(r.title, lang)}</Text>
                  <Text style={[styles.remedyBody, { color: theme.textSoft }]}>{aAstroText(body, lang)}</Text>
                  {!!timing && <Text style={[styles.remedyTag, { color: theme.gold2 }]}>{aAstroText(timing, lang)}</Text>}
                  {!!rr.mantra && <Text style={[styles.mantraSmall, { color: theme.goldText }]}>{rr.mantra}</Text>}
                </View>
              </View>
            );
          })}
        </View>
      </Card>

      {!!pred?.mantra?.text && (
        <Card style={{ marginTop: 14 }}>
          <SectionH theme={theme}>{aAstroText(pred.mantra.title || (lang === 'hi' ? 'आज का मंत्र' : "Today's Mantra"), lang)}</SectionH>
          <Text style={[styles.mantraText, { color: theme.goldText }]}>{pred.mantra.text}</Text>
          <Text style={[styles.summaryText, { color: theme.textSoft }]}>
            {aAstroText([pred.mantra.count, pred.mantra.bestTime].filter(Boolean).join(' | '), lang)}
          </Text>
        </Card>
      )}

      <SaralVivaran text={pred?.saralVivaran} />

      <Card style={{ marginTop: 14 }}>
        <SectionH theme={theme}>{aAstroText(t('dp.askAi', 'Ask the Astrologer'), lang)}</SectionH>
        <Text style={[styles.summaryText, { color: theme.textSoft }]}>{t('dp.askAiLead', "These questions will use your saved birth details, today's precise astrology data, and the current language mode.")}</Text>
        <View style={styles.questionWrap}>
          {aiQuestions.map((q) => (
            <Pressable
              key={q}
              onPress={() => openAiQuestion(q)}
              style={({ pressed }) => [
                styles.questionChip,
                { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.10)' : 'rgba(176,115,22,0.08)' },
                pressed && { transform: [{ scale: 0.98 }] },
              ]}
            >
              <Text style={[styles.questionText, { color: theme.text }]}>{aAstroText(q, lang)}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={() => openAiQuestion()} style={({ pressed }) => [styles.askPrimaryWrap, pressed && { transform: [{ scale: 0.98 }] }]}>
          <LinearGradient colors={theme.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.askPrimary}>
            <MiniSpark color={theme.buttonInk} />
            <Text style={[styles.actionText, { color: theme.buttonInk }]}>{t('dp.openAi', 'OPEN ASTROLOGER')}</Text>
          </LinearGradient>
        </Pressable>
      </Card>

      <LinearGradient
        colors={theme.isDark ? ['rgba(233,184,80,0.12)', 'rgba(20,16,8,0.55)'] : ['rgba(176,115,22,0.10)', 'rgba(255,250,240,0.6)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.note, { borderColor: theme.cardBorder }]}
      >
        <View style={[styles.noteIc, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.14)' : 'rgba(176,115,22,0.10)' }]}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.gold1} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <Circle cx={12} cy={12} r={10} />
            <Line x1={12} y1={11} x2={12} y2={16} />
            <Line x1={12} y1={8} x2={12.01} y2={8} />
          </Svg>
        </View>
        <Text style={[styles.noteText, { color: theme.textSoft }]}>
          <Text style={{ color: theme.goldText, fontFamily: fonts.interBold }}>{aAstroText(t('dp.source', 'Source | '), lang)}</Text>
          {aAstroText(pred?.sourceNote || dp.t('noteText', lang === 'hi' ? 'भविष्यवाणियाँ आपकी सटीक कुंडली व पंचांग डेटा पर आधारित हैं।' : 'Predictions are based on your precise chart and Panchang data.'), lang)}
        </Text>
      </LinearGradient>

      <View style={styles.actions}>
        <Pressable
          onPress={toggleSave}
          style={({ pressed }) => [
            styles.action,
            { borderColor: saved ? theme.gold2 : theme.cardBorder, backgroundColor: saved ? (theme.isDark ? 'rgba(233,184,80,0.16)' : 'rgba(176,115,22,0.12)') : (theme.isDark ? 'rgba(0,0,0,0.5)' : '#fffdf7') },
            pressed && { transform: [{ scale: 0.97 }] },
          ]}
        >
          <Svg width={15} height={15} viewBox="0 0 24 24" fill={saved ? theme.gold1 : 'none'} stroke={theme.goldText} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </Svg>
          <Text style={[styles.actionText, { color: theme.goldText }]}>{saved ? t('dp.saved', 'SAVED') : t('dp.save', 'SAVE')}</Text>
        </Pressable>
        <Pressable onPress={sharePrediction} style={({ pressed }) => [styles.actionPrimaryWrap, pressed && { transform: [{ scale: 0.98 }] }]}>
          <LinearGradient colors={theme.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.actionPrimary}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={theme.buttonInk} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
              <Circle cx={18} cy={5} r={3} /><Circle cx={6} cy={12} r={3} /><Circle cx={18} cy={19} r={3} />
              <Line x1={8.6} y1={13.5} x2={15.4} y2={17.5} /><Line x1={15.4} y1={6.5} x2={8.6} y2={10.5} />
            </Svg>
            <Text style={[styles.actionText, { color: theme.buttonInk }]}>{t('dp.share', 'SHARE PREDICTION')}</Text>
          </LinearGradient>
        </Pressable>
      </View>
      </>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  heroImage: { width: 132, height: 132, borderRadius: 16 },
  sign: { fontFamily: fonts.playfairBold, fontSize: 22, marginTop: 6 },
  hindi: { fontFamily: fonts.interSemi, fontSize: 12, marginTop: 2 },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, paddingTop: 14, borderTopWidth: 1 },
  dateText: { fontFamily: fonts.interSemi, fontSize: 12 },
  headline: { fontFamily: fonts.playfairBold, fontSize: 20, lineHeight: 26, textAlign: 'center', marginTop: 12 },
  predBody: { fontFamily: fonts.inter, fontSize: 13.5, lineHeight: 21, marginTop: 12 },
  detailBody: { fontFamily: fonts.inter, fontSize: 12.5, lineHeight: 20, marginTop: 8 },
  errorText: { fontFamily: fonts.interSemi, fontSize: 11.5, lineHeight: 16, marginTop: 8 },
  focusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  focusChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 7, maxWidth: '100%' },
  focusText: { fontFamily: fonts.interSemi, fontSize: 11.5, maxWidth: 170 },
  luckRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  luckPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radii.pill, borderWidth: 1 },
  luckStar: { fontFamily: fonts.interBold, fontSize: 12 },
  luckLbl: { fontFamily: fonts.inter, fontSize: 11.5 },
  luckVal: { fontFamily: fonts.interBold, fontSize: 11.5 },

  secH: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  secLine: { flex: 1, height: 1 },
  secTitle: { fontFamily: fonts.playfair, fontSize: 15 },

  basisGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  basisCell: { width: '47.8%', flexGrow: 1, padding: 12, borderRadius: 14, borderWidth: 1 },
  basisLabel: { fontFamily: fonts.interBold, fontSize: 9.5, textTransform: 'uppercase' },
  basisValue: { fontFamily: fonts.interSemi, fontSize: 13.5, marginTop: 5 },
  summaryText: { fontFamily: fonts.inter, fontSize: 12.5, lineHeight: 19, marginTop: 10 },

  moodHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 7 },
  moodIc: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  moodLbl: { flex: 1, fontFamily: fonts.interSemi, fontSize: 13 },
  moodPct: { fontFamily: fonts.interBold, fontSize: 12.5 },
  track: { height: 7, borderRadius: 999, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999 },

  panchDateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 2, gap: 8 },
  panchDate: { fontFamily: fonts.interSemi, fontSize: 11.5, flex: 1 },
  panchLive: { fontFamily: fonts.interBold, fontSize: 9.5 },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  timeCell: { width: '47.8%', flexGrow: 1, paddingVertical: 13, paddingHorizontal: 10, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
  timeLbl: { fontFamily: fonts.interSemi, fontSize: 11.5, textAlign: 'center' },
  timeVal: { fontFamily: fonts.interBold, fontSize: 13, marginTop: 4, textAlign: 'center' },
  timingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, borderWidth: 1 },
  timingDot: { width: 9, height: 9, borderRadius: 5 },
  timingTitle: { fontFamily: fonts.interBold, fontSize: 13 },
  timingBody: { fontFamily: fonts.inter, fontSize: 11.5, lineHeight: 16, marginTop: 2 },
  timingTime: { fontFamily: fonts.interBold, fontSize: 11.5, maxWidth: 92, textAlign: 'right' },

  insightGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  insight: { width: '47.8%', flexGrow: 1, padding: 12, borderRadius: 14, borderWidth: 1 },
  insightTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  insightIc: { marginBottom: 6 },
  scoreText: { fontFamily: fonts.interBold, fontSize: 11.5 },
  insightTitle: { fontFamily: fonts.playfair, fontSize: 14 },
  insightBody: { fontFamily: fonts.inter, fontSize: 11.5, lineHeight: 16, marginTop: 4 },
  insightAction: { fontFamily: fonts.interSemi, fontSize: 11.5, lineHeight: 16, marginTop: 8 },

  doAvoidGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  doAvoidBox: { width: '47.8%', flexGrow: 1, borderWidth: 1, borderRadius: 14, padding: 12, gap: 7 },
  doAvoidTitle: { fontFamily: fonts.interBold, fontSize: 13 },
  listText: { fontFamily: fonts.inter, fontSize: 11.8, lineHeight: 17 },

  remedy: { flexDirection: 'row', gap: 12, padding: 12, borderRadius: 14, borderWidth: 1 },
  remedyGlyph: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  remedyTitle: { fontFamily: fonts.playfair, fontSize: 14.5 },
  remedyBody: { fontFamily: fonts.inter, fontSize: 12, lineHeight: 17, marginTop: 3 },
  remedyTag: { fontFamily: fonts.interBold, fontSize: 9.5, marginTop: 6 },
  mantraSmall: { fontFamily: fonts.interSemi, fontSize: 11.5, lineHeight: 16, marginTop: 5 },
  mantraText: { fontFamily: fonts.devanagariBold, fontSize: 17, lineHeight: 26, textAlign: 'center', marginTop: 10 },

  questionWrap: { gap: 8, marginTop: 10 },
  questionChip: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 11 },
  questionText: { fontFamily: fonts.interSemi, fontSize: 12.5, lineHeight: 18 },
  askPrimaryWrap: { marginTop: 12, borderRadius: radii.pill, overflow: 'hidden' },
  askPrimary: { flexDirection: 'row', gap: 8, paddingVertical: 13, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },

  note: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14, padding: 14, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  noteIc: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  noteText: { flex: 1, fontFamily: fonts.inter, fontSize: 12, lineHeight: 18 },

  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  action: { flex: 1, flexDirection: 'row', gap: 7, paddingVertical: 14, borderRadius: radii.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  actionPrimaryWrap: { flex: 2, borderRadius: radii.pill, overflow: 'hidden' },
  actionPrimary: { flexDirection: 'row', gap: 8, paddingVertical: 14, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontFamily: fonts.cinzelSemi, fontSize: 12, letterSpacing: 1.1 },
});
