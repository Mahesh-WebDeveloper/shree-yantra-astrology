import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Page } from '../components/Page';
import { Card } from '../components/Card';
import { SpeakButton } from '../components/SpeakButton';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radii } from '../theme/tokens';
import { askAiAstrologer, AiAstrologerResponse } from '../lib/api';
import { birthFromProfile } from '../lib/birth';
import { hTap } from '../lib/haptics';
import { useT } from '../i18n/LanguageProvider';

const DEFAULT_BIRTH = { dob: '01-01-2000', tob: '06:42', tz: '+05:30', place: 'Jaipur' };

type ChatTurn = {
  id: string;
  question: string;
  response?: AiAstrologerResponse;
  loading?: boolean;
  error?: string;
};

function SparkIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9z" />
      <Path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" />
    </Svg>
  );
}

function InfoIcon({ color }: { color: string }) {
  return (
    <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={12} r={10} />
      <Line x1={12} y1={11} x2={12} y2={16} />
      <Line x1={12} y1={8} x2={12.01} y2={8} />
    </Svg>
  );
}

export function AiAstrologerScreen({ navigation, route }: any) {
  const { theme } = useTheme();
  const t = useT();
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState<ChatTurn[]>([]);
  const [sending, setSending] = useState(false);
  const quickQuestions = [
    t('ai.quick.today', 'What should I focus on today?'),
    t('ai.quick.time', 'Which time is better for important work?'),
    t('ai.quick.dasha', 'What does my current dasha mean?'),
    t('ai.quick.remedy', 'Suggest a simple remedy for today.'),
  ];

  const sendQuestion = async (raw: string) => {
    const q = raw.trim();
    if (!q || sending) return;
    hTap();
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setQuestion('');
    setSending(true);
    setHistory((h) => [{ id, question: q, loading: true }, ...h]);
    try {
      const profileBirth = await birthFromProfile().catch(() => null);
      const birth = profileBirth || DEFAULT_BIRTH;
      const response = await askAiAstrologer({ ...birth, name: (profileBirth as any)?.name, question: q });
      setHistory((h) => h.map((turn) => (turn.id === id ? { id, question: q, response } : turn)));
    } catch (e: any) {
      setHistory((h) => h.map((turn) => (turn.id === id ? { id, question: q, error: e?.message || 'AI answer unavailable' } : turn)));
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    const initial = String(route?.params?.question || '').trim();
    if (initial) sendQuestion(initial);
    // Run only once for the route-provided prompt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Page title={t('ai.title', 'Vedic Astrologer')} onBack={() => navigation.goBack()}>
      <Card>
        <View style={styles.heroRow}>
          <View style={[styles.heroIcon, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.12)' : 'rgba(176,115,22,0.10)' }]}>
            <SparkIcon color={theme.gold1} size={24} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroTitle, { color: theme.goldText }]}>{t('ai.heroTitle', 'Chart-Grounded Answers')}</Text>
            <Text style={[styles.heroText, { color: theme.textSoft }]}>
              {t('ai.heroText', 'Ask about today, kundli, dasha, timing, relationships, career, remedies, or spiritual guidance.')}
            </Text>
          </View>
        </View>
        <View style={[styles.sourceRow, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.45)' : 'rgba(176,115,22,0.05)' }]}>
          <InfoIcon color={theme.gold1} />
          <Text style={[styles.sourceText, { color: theme.textSoft }]}>
            {t('ai.sourceLead', 'The answer uses your saved birth details and precise chart/panchang data before AI writes the explanation.')}
          </Text>
        </View>
      </Card>

      <Card style={{ marginTop: 14 }}>
        <Text style={[styles.inputLabel, { color: theme.goldText }]}>{t('ai.askLabel', 'Ask your question')}</Text>
        <View style={[styles.inputBox, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.64)' : '#fffdf7' }]}>
          <TextInput
            value={question}
            onChangeText={setQuestion}
            placeholder={t('ai.placeholder', 'Type your question...')}
            placeholderTextColor={theme.isDark ? 'rgba(216,203,168,0.44)' : 'rgba(95,77,45,0.62)'}
            multiline
            style={[styles.input, { color: theme.text }]}
            textAlignVertical="top"
          />
        </View>
        <Text style={[styles.voiceHint, { color: theme.textMuted }]}>
          {t('ai.voiceHint', '🎤 Keyboard ke mic se bol kar bhi prashna pooch sakte hain · uttar "सुनें" se sun bhi sakte hain')}
        </Text>
        <Pressable disabled={sending || !question.trim()} onPress={() => sendQuestion(question)} style={({ pressed }) => [styles.sendWrap, pressed && { transform: [{ scale: 0.98 }] }, (!question.trim() || sending) && { opacity: 0.55 }]}>
          <LinearGradient colors={theme.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.sendBtn}>
            {sending ? <ActivityIndicator size="small" color={theme.buttonInk} /> : <SparkIcon color={theme.buttonInk} />}
            <Text style={[styles.sendText, { color: theme.buttonInk }]}>{sending ? t('ai.asking', 'ASKING...') : t('ai.askButton', 'ASK ASTROLOGER')}</Text>
          </LinearGradient>
        </Pressable>
      </Card>

      <View style={styles.quickWrap}>
        {quickQuestions.map((q) => (
          <Pressable
            key={q}
            disabled={sending}
            onPress={() => sendQuestion(q)}
            style={({ pressed }) => [
              styles.quickChip,
              { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.10)' : 'rgba(176,115,22,0.08)' },
              pressed && { transform: [{ scale: 0.98 }] },
              sending && { opacity: 0.6 },
            ]}
          >
            <Text style={[styles.quickText, { color: theme.text }]}>{q}</Text>
          </Pressable>
        ))}
      </View>

      {history.length === 0 && (
        <Card style={{ marginTop: 14 }}>
          <Text style={[styles.emptyTitle, { color: theme.goldText }]}>{t('ai.emptyTitle', 'Personal AI guidance starts here')}</Text>
          <Text style={[styles.emptyText, { color: theme.textSoft }]}>
            {t('ai.emptyText', 'For best results, complete your birth date, birth time, and birth place in profile. The app will use that context automatically.')}
          </Text>
        </Card>
      )}

      {history.map((turn) => (
        <Card key={turn.id} style={{ marginTop: 14 }}>
          <Text style={[styles.questionTitle, { color: theme.goldText }]}>{t('ai.question', 'Question')}</Text>
          <Text style={[styles.questionBody, { color: theme.text }]}>{turn.question}</Text>

          {turn.loading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={theme.gold1} />
              <Text style={[styles.loadingText, { color: theme.textSoft }]}>{t('ai.loading', "Reading your chart and today's panchang...")}</Text>
            </View>
          )}

          {!!turn.error && (
            <Text style={[styles.errorText, { color: theme.red }]}>
              {turn.error}
            </Text>
          )}

          {!!turn.response && (
            <>
              <View style={styles.answerHead}>
                <Text style={[styles.answerTitle, { color: theme.goldText }]}>{t('ai.answer', 'Answer')}</Text>
                <SpeakButton text={[
                  turn.response.answer,
                  ...turn.response.sections.map((s) => `${s.title}. ${s.text}`),
                  ...(turn.response.remedies || []).map((r) => `${r.title}. ${r.body || ''}`),
                ]} />
              </View>
              <Text style={[styles.answerBody, { color: theme.text }]}>{turn.response.answer}</Text>

              {turn.response.sections.map((section, index) => (
                <View key={`${section.title}-${index}`} style={[styles.sectionBox, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.42)' : 'rgba(176,115,22,0.05)' }]}>
                  <Text style={[styles.sectionTitle, { color: theme.goldText }]}>{section.title}</Text>
                  <Text style={[styles.sectionText, { color: theme.textSoft }]}>{section.text}</Text>
                </View>
              ))}

              {!!turn.response.vedastroBasis.length && (
                <View style={styles.basisWrap}>
                  <Text style={[styles.smallHeading, { color: theme.goldText }]}>{t('ai.basis', 'Calculation basis')}</Text>
                  {turn.response.vedastroBasis.map((item) => (
                    <Text key={item} style={[styles.basisText, { color: theme.textSoft }]}>{item}</Text>
                  ))}
                </View>
              )}

              {!!turn.response.remedies?.length && (
                <View style={styles.basisWrap}>
                  <Text style={[styles.smallHeading, { color: theme.goldText }]}>{t('ai.remedies', 'Suggested remedies')}</Text>
                  {turn.response.remedies.map((r, index) => (
                    <View key={`${r.title}-${index}`} style={[styles.remedyBox, { borderColor: theme.cardBorder }]}>
                      <Text style={[styles.remedyTitle, { color: theme.text }]}>{r.title}</Text>
                      {!!r.body && <Text style={[styles.remedyText, { color: theme.textSoft }]}>{r.body}</Text>}
                      {!![r.timing, r.mantra].filter(Boolean).length && (
                        <Text style={[styles.remedyMeta, { color: theme.goldText }]}>{[r.timing, r.mantra].filter(Boolean).join(' | ')}</Text>
                      )}
                    </View>
                  ))}
                </View>
              )}

              <Text style={[styles.sourceNote, { color: theme.textMuted }]}>
                {turn.response.sourceNote || t('ai.defaultSource', 'Based on your precise birth chart and Panchang data.')}
              </Text>

              <View style={styles.followWrap}>
                {turn.response.followUpQuestions.map((q) => (
                  <Pressable
                    key={q}
                    disabled={sending}
                    onPress={() => sendQuestion(q)}
                    style={({ pressed }) => [
                      styles.followChip,
                      { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.10)' : 'rgba(176,115,22,0.08)' },
                      pressed && { transform: [{ scale: 0.98 }] },
                    ]}
                  >
                    <Text style={[styles.followText, { color: theme.text }]}>{q}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}
        </Card>
      ))}
    </Page>
  );
}

const styles = StyleSheet.create({
  heroRow: { flexDirection: 'row', gap: 13, alignItems: 'center' },
  heroIcon: { width: 54, height: 54, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontFamily: fonts.playfairBold, fontSize: 19, lineHeight: 25 },
  heroText: { fontFamily: fonts.inter, fontSize: 12.5, lineHeight: 19, marginTop: 3 },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderRadius: 14, padding: 11, marginTop: 14 },
  sourceText: { flex: 1, fontFamily: fonts.inter, fontSize: 11.5, lineHeight: 17 },
  inputLabel: { fontFamily: fonts.interBold, fontSize: 12, textTransform: 'uppercase' },
  inputBox: { minHeight: 98, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, marginTop: 8 },
  input: { minHeight: 78, fontFamily: fonts.inter, fontSize: 14, lineHeight: 20 },
  sendWrap: { marginTop: 12, borderRadius: radii.pill, overflow: 'hidden' },
  sendBtn: { minHeight: 48, borderRadius: radii.pill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  sendText: { fontFamily: fonts.cinzelSemi, fontSize: 12.2, letterSpacing: 1.1 },
  quickWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  quickChip: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, maxWidth: '100%' },
  quickText: { fontFamily: fonts.interSemi, fontSize: 12, lineHeight: 17 },
  emptyTitle: { fontFamily: fonts.playfairBold, fontSize: 18 },
  emptyText: { fontFamily: fonts.inter, fontSize: 12.5, lineHeight: 19, marginTop: 6 },
  questionTitle: { fontFamily: fonts.interBold, fontSize: 11, textTransform: 'uppercase' },
  questionBody: { fontFamily: fonts.interSemi, fontSize: 14, lineHeight: 20, marginTop: 5 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  loadingText: { fontFamily: fonts.inter, fontSize: 12.5 },
  errorText: { fontFamily: fonts.interSemi, fontSize: 12.5, lineHeight: 18, marginTop: 14 },
  answerHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  voiceHint: { fontFamily: fonts.inter, fontSize: 11, lineHeight: 16, marginTop: 8 },
  answerTitle: { fontFamily: fonts.interBold, fontSize: 11, textTransform: 'uppercase' },
  answerBody: { fontFamily: fonts.inter, fontSize: 14, lineHeight: 22, marginTop: 6 },
  sectionBox: { borderWidth: 1, borderRadius: 14, padding: 12, marginTop: 10 },
  sectionTitle: { fontFamily: fonts.playfairBold, fontSize: 15 },
  sectionText: { fontFamily: fonts.inter, fontSize: 12.5, lineHeight: 19, marginTop: 5 },
  basisWrap: { marginTop: 14, gap: 8 },
  smallHeading: { fontFamily: fonts.interBold, fontSize: 11, textTransform: 'uppercase' },
  basisText: { fontFamily: fonts.inter, fontSize: 12, lineHeight: 18 },
  remedyBox: { borderWidth: 1, borderRadius: 12, padding: 10 },
  remedyTitle: { fontFamily: fonts.interBold, fontSize: 12.5 },
  remedyText: { fontFamily: fonts.inter, fontSize: 12, lineHeight: 17, marginTop: 4 },
  remedyMeta: { fontFamily: fonts.interSemi, fontSize: 11, lineHeight: 16, marginTop: 5 },
  sourceNote: { fontFamily: fonts.inter, fontSize: 11.5, lineHeight: 17, marginTop: 14 },
  followWrap: { gap: 8, marginTop: 14 },
  followChip: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10 },
  followText: { fontFamily: fonts.interSemi, fontSize: 12, lineHeight: 17 },
});
