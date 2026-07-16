import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SpeakButton } from './SpeakButton';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';
import { AiAstrologerResponse } from '../lib/api';
import { useT, useLang } from '../i18n/LanguageProvider';
import { aAstroText } from '../i18n/astro';

/**
 * The astrologer's answer block — answer text, sections, calculation basis,
 * remedies, source note and follow-up chips. Extracted from AiAstrologerScreen
 * so the live chat AND the history browser render a stored answer with the
 * exact same treatment (styles are a verbatim move from that screen).
 */
export function AnswerView({ response, onAsk, disabled }: {
  response: AiAstrologerResponse;
  /** tapped follow-up question — chat sends it, history prefills the input */
  onAsk?: (q: string) => void;
  disabled?: boolean;
}) {
  const { theme } = useTheme();
  const t = useT();
  const { lang } = useLang();
  const tx = (value?: string) => aAstroText(value || '', lang);
  // stored docs are Mixed in Mongo — older turns may miss an array, so guard each
  const sections = response.sections || [];
  const basis = response.vedastroBasis || [];
  const remedies = response.remedies || [];
  const followUps = response.followUpQuestions || [];

  return (
    <>
      <View style={styles.answerHead}>
        <Text style={[styles.answerTitle, { color: theme.goldText }]}>{t('ai.answer', 'Answer')}</Text>
        <SpeakButton text={[
          tx(response.answer),
          ...sections.map((s) => `${tx(s.title)}. ${tx(s.text)}`),
          ...remedies.map((r) => `${tx(r.title)}. ${tx(r.body || '')}`),
        ]} />
      </View>
      <Text style={[styles.answerBody, { color: theme.text }]}>{tx(response.answer)}</Text>

      {sections.map((section, index) => (
        <View key={`${section.title}-${index}`} style={[styles.sectionBox, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.42)' : '#f8fafc' }]}>
          <Text style={[styles.sectionTitle, { color: theme.goldText }]}>{tx(section.title)}</Text>
          <Text style={[styles.sectionText, { color: theme.textSoft }]}>{tx(section.text)}</Text>
        </View>
      ))}

      {!!basis.length && (
        <View style={styles.basisWrap}>
          <Text style={[styles.smallHeading, { color: theme.goldText }]}>{tx(t('ai.basis', 'Calculation basis'))}</Text>
          {basis.map((item) => (
            <Text key={item} style={[styles.basisText, { color: theme.textSoft }]}>{tx(item)}</Text>
          ))}
        </View>
      )}

      {!!remedies.length && (
        <View style={styles.basisWrap}>
          <Text style={[styles.smallHeading, { color: theme.goldText }]}>{tx(t('ai.remedies', 'Suggested remedies'))}</Text>
          {remedies.map((r, index) => (
            <View key={`${r.title}-${index}`} style={[styles.remedyBox, { borderColor: theme.cardBorder }]}>
              <Text style={[styles.remedyTitle, { color: theme.text }]}>{tx(r.title)}</Text>
              {!!r.body && <Text style={[styles.remedyText, { color: theme.textSoft }]}>{tx(r.body)}</Text>}
              {!![r.timing, r.mantra].filter(Boolean).length && (
                <Text style={[styles.remedyMeta, { color: theme.goldText }]}>{tx([r.timing, r.mantra].filter(Boolean).join(' | '))}</Text>
              )}
            </View>
          ))}
        </View>
      )}

      <Text style={[styles.sourceNote, { color: theme.textMuted }]}>
        {tx(response.sourceNote || t('ai.defaultSource', 'Based on your precise birth chart and Panchang data.'))}
      </Text>

      {!!onAsk && followUps.length > 0 && (
        <View style={styles.followWrap}>
          {followUps.map((q) => (
            <Pressable
              key={q}
              disabled={disabled}
              onPress={() => onAsk(q)}
              style={({ pressed }) => [
                styles.followChip,
                { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.10)' : '#ffffff' },
                pressed && { transform: [{ scale: 0.98 }] },
              ]}
            >
              <Text style={[styles.followText, { color: theme.text }]}>{tx(q)}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  answerHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
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
