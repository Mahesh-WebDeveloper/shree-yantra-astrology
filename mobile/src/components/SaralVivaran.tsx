import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useLang } from '../i18n/LanguageProvider';
import { fonts } from '../theme/tokens';
import { SpeakButton } from './SpeakButton';

/**
 * "Saral Vivaran" — a dedicated, beginner-friendly explanation section shown at the
 * bottom of every AI reading. Renders the AI's `saralVivaran` field (a full plain-language
 * summary with real-life examples) so a non-technical / non-astrology user understands.
 * Renders nothing when the field is empty.
 */
export function SaralVivaran({ text, scale = 1, bold = false }: { text?: string | null; scale?: number; bold?: boolean }) {
  const { theme } = useTheme();
  const { lang } = useLang();
  if (!text || !String(text).trim()) return null;
  return (
    <View
      style={[
        styles.card,
        {
          borderColor: theme.gold2 + '66',
          backgroundColor: theme.isDark ? 'rgba(233,184,80,0.07)' : 'rgba(244,195,74,0.12)',
        },
      ]}
    >
      <View style={styles.head}>
        <Text style={styles.emoji}>🪔</Text>
        <Text style={[styles.title, { color: theme.gold1 }]}>
          {lang === 'hi' ? 'सरल भाषा में समझें' : 'In Simple Words'}
        </Text>
      </View>
      <Text style={[styles.sub, { color: theme.textMuted }]}>
        {lang === 'hi' ? 'बिना किसी कठिन शब्द के, आसान भाषा में' : 'Easy explanation, no jargon'}
      </Text>
      <Text
        style={[
          styles.body,
          {
            color: theme.text,
            fontSize: 14 * scale,
            lineHeight: 23 * scale,
            fontFamily: bold ? fonts.interMed : fonts.inter,
          },
        ]}
      >
        {text}
      </Text>
      <View style={{ marginTop: 10 }}>
        <SpeakButton text={[String(text)]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, padding: 16, marginTop: 14 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  emoji: { fontSize: 18 },
  title: { fontFamily: fonts.cinzelSemi, fontSize: 14, letterSpacing: 0.5 },
  sub: { fontFamily: fonts.inter, fontSize: 11, marginTop: 2, marginBottom: 9 },
  body: { fontFamily: fonts.inter, fontSize: 14, lineHeight: 23 },
});
