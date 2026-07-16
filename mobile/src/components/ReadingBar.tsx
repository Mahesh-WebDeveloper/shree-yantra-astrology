import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Theme, fonts, radii } from '../theme/tokens';
import { ReadingScale, ReadingWeight, READING_SCALES } from '../hooks/useReadingPrefs';
import { hSelect } from '../lib/haptics';

/**
 * Reading controls row — Aa dabane par tabs ke NEECHE apni alag row me khulta hai.
 * Saare options ek saath dikhte hai: A− / A+ (size) aur मोटाई− / मोटाई+ (weight).
 * Dono rashifal pages same persisted prefs share karte hai (useReadingPrefs).
 */
export function ReadingBar({
  scale, weight, stepScale, stepWeight, theme, lang,
}: {
  scale: ReadingScale;
  weight: ReadingWeight;
  stepScale: (dir: 1 | -1) => void;
  stepWeight: (dir: 1 | -1) => void;
  theme: Theme;
  lang: string;
}) {
  const hi = lang === 'hi';
  const scaleIdx = READING_SCALES.indexOf(scale);
  const atMinS = scaleIdx <= 0;
  const atMaxS = scaleIdx >= READING_SCALES.length - 1;
  const atMinW = weight <= 0;
  const atMaxW = weight >= 2;

  const Btn = ({ label, disabled, onPress, big }: { label: string; disabled: boolean; onPress: () => void; big?: boolean }) => (
    <Pressable
      onPress={() => { if (!disabled) { hSelect(); onPress(); } }}
      hitSlop={6}
      style={({ pressed }) => [
        styles.btn,
        { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? '#0b0906' : '#fffaf0' },
        disabled && { opacity: 0.35 },
        pressed && !disabled && { transform: [{ scale: 0.94 }] },
      ]}
    >
      <Text style={[styles.btnText, big && styles.btnTextBig, { color: theme.goldText }]}>{label}</Text>
    </Pressable>
  );

  return (
    <View style={[styles.bar, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? '#000000' : '#ffffff' }]}>
      <View style={styles.group}>
        <Text style={[styles.groupLabel, { color: theme.textMuted }]}>{hi ? 'अक्षर आकार' : 'FONT SIZE'}</Text>
        <View style={styles.btnRow}>
          <Btn label="A−" disabled={atMinS} onPress={() => stepScale(-1)} />
          <Text style={[styles.stateText, { color: theme.gold1 }]}>{['S', 'M', 'L'][scaleIdx] || 'M'}</Text>
          <Btn label="A+" disabled={atMaxS} onPress={() => stepScale(1)} big />
        </View>
      </View>
      <View style={[styles.divider, { backgroundColor: theme.line }]} />
      <View style={styles.group}>
        <Text style={[styles.groupLabel, { color: theme.textMuted }]}>{hi ? 'अक्षर मोटाई' : 'FONT WEIGHT'}</Text>
        <View style={styles.btnRow}>
          <Btn label="B−" disabled={atMinW} onPress={() => stepWeight(-1)} />
          <Text style={[styles.stateText, { color: theme.gold1, fontFamily: [fonts.inter, fonts.interMed, fonts.interSemi][weight] }]}>
            {['1', '2', '3'][weight]}
          </Text>
          <Btn label="B+" disabled={atMaxW} onPress={() => stepWeight(1)} big />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  group: { alignItems: 'center', gap: 6, flex: 1 },
  groupLabel: { fontFamily: fonts.interSemi, fontSize: 9, letterSpacing: 1.2 },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  btn: {
    minWidth: 44, height: 34, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10,
  },
  btnText: { fontFamily: fonts.interSemi, fontSize: 12.5 },
  btnTextBig: { fontSize: 15 },
  stateText: { fontFamily: fonts.interSemi, fontSize: 12, minWidth: 16, textAlign: 'center' },
  divider: { width: 1, height: 40, marginHorizontal: 10 },
});
