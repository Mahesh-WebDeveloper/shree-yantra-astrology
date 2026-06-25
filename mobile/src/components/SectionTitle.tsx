import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';
import { GradientText } from './GradientText';

/** Centered gold section heading with flanking sparkle dots. */
export function SectionTitle({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={[styles.dot, { backgroundColor: theme.gold2 }]} />
      <GradientText style={styles.text}>{children}</GradientText>
      <View style={[styles.dot, { backgroundColor: theme.gold2 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginVertical: 18 },
  text: { fontFamily: fonts.playfairBold, fontSize: 18, letterSpacing: 1 },
  dot: { width: 5, height: 5, borderRadius: 5, transform: [{ rotate: '45deg' }] },
});
