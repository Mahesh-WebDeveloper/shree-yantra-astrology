import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';
import { PressableScale } from './PressableScale';

interface Props {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
  onRight?: () => void;
}

/** The shared compact top bar (RN port of the web `.sy-topbar`). */
export function TopBar({ title, onBack, right, onRight }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const barColors = theme.isDark
    ? (['rgba(5,5,6,0.97)', 'rgba(0,0,0,0.95)'] as const)
    : (['#ffffff', '#ffffff'] as const);
  const lightShadow = !theme.isDark
    ? { shadowColor: '#3d2809', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 4 }
    : null;
  const buttonSurface = theme.isDark ? theme.cardBg : '#ffffff';
  return (
    <LinearGradient colors={barColors} style={[styles.bar, { paddingTop: insets.top + 6, borderBottomColor: theme.isDark ? theme.line : 'rgba(23,19,12,0.10)' }, lightShadow]}>
      <PressableScale onPress={onBack} hitSlop={8} ripple={theme.ripple} rippleBorderless style={[styles.btn, { borderColor: theme.cardBorder, backgroundColor: buttonSurface }]}>
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.gold1} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M19 12H5M12 19l-7-7 7-7" />
        </Svg>
      </PressableScale>
      <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{title}</Text>
      {right ? (
        <PressableScale onPress={onRight} hitSlop={8} ripple={theme.ripple} rippleBorderless style={[styles.btn, { borderColor: theme.cardBorder, backgroundColor: buttonSurface }]}>
          {right}
        </PressableScale>
      ) : (
        <View style={styles.placeholder} />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1 },
  btn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  placeholder: { width: 40, height: 40 },
  title: { flex: 1, textAlign: 'center', fontFamily: fonts.playfair, fontSize: 17 },
});
