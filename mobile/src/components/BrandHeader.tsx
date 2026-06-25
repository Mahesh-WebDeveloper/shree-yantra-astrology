import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';
import { GradientText } from './GradientText';
import { PressableScale } from './PressableScale';
import { BrandEmblem, MenuIcon, BellIcon } from './icons/NavIcons';

interface Props {
  onMenu?: () => void;
  onBell?: () => void;
  /** notification badge count */
  badge?: number;
  showEmblem?: boolean;
}

/**
 * Shared top app bar — pixel-matched to the web `.sy-topbar` + `.sy-brand-header`:
 * full-width dark gradient bar with a gold bottom border, 40px bordered buttons,
 * a centred brand (emblem + SHREE YANTRA / ASTROLOGY) and a bell with red badge.
 * Uses negative margins to span edge-to-edge inside the padded <Screen>.
 */
export function BrandHeader({ onMenu, onBell, badge = 3, showEmblem = true }: Props) {
  const { theme } = useTheme();
  const barColors = theme.isDark
    ? (['rgba(5,5,6,0.97)', 'rgba(0,0,0,0.95)'] as const)
    : (['rgba(255,253,247,0.99)', 'rgba(255,248,235,0.98)'] as const);

  const btnStyle = {
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : '#fffdf7',
    borderColor: theme.isDark ? 'rgba(201,150,46,0.35)' : theme.cardBorder,
  };

  return (
    <LinearGradient colors={barColors} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={[styles.bar, { borderBottomColor: theme.line }]}>
      <PressableScale onPress={onMenu} hitSlop={8} ripple={theme.ripple} rippleBorderless style={[styles.btn, btnStyle]}>
        <MenuIcon color={theme.gold1} size={20} />
      </PressableScale>

      <View style={styles.brand}>
        {showEmblem && <BrandEmblem color={theme.gold1} size={32} />}
        <View style={styles.brandText}>
          <GradientText style={styles.word}>SHREE YANTRA</GradientText>
          <Text style={[styles.sub, { color: theme.gold2 }]}>ASTROLOGY</Text>
        </View>
      </View>

      <PressableScale onPress={onBell} hitSlop={8} ripple={theme.ripple} rippleBorderless style={[styles.btn, btnStyle]}>
        <BellIcon color={theme.gold1} size={20} />
        {badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </PressableScale>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: -16, // cancel Screen's horizontal padding → full-width bar
    marginTop: -8,         // cancel Screen's top gap → sit at the top
    marginBottom: 10,
    borderBottomWidth: 1,
  },
  btn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  brand: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  brandText: { alignItems: 'center' },
  word: { fontFamily: fonts.cinzel, fontSize: 16, letterSpacing: 2.4, textAlign: 'center' },
  sub: { fontFamily: fonts.cinzelSemi, fontSize: 8, letterSpacing: 3.2, marginTop: 3, textAlign: 'center' },
  badge: {
    position: 'absolute', top: 2, right: 2, minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: '#e23b3b', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontFamily: fonts.interBold, fontSize: 9.5, lineHeight: 13 },
});
