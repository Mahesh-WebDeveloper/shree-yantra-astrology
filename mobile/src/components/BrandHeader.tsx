import React from 'react';
import { View, Text, StyleSheet, ColorValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';
import { GradientText } from './GradientText';
import { PressableScale } from './PressableScale';
import { BrandEmblem, MenuIcon, BellIcon } from './icons/NavIcons';
import { useUnreadCount } from '../lib/notificationStore';

interface Props {
  onMenu?: () => void;
  onBell?: () => void;
  /** override the live unread badge (defaults to the real unread count) */
  badge?: number;
  showEmblem?: boolean;
}

/* icon button — hoisted OUT of BrandHeader so its identity is stable across
   renders (an inline component remounts its subtree — and resets the press
   spring — on every parent render) */
function HeaderBtn({ onPress, colors, border, ripple, children }: {
  onPress?: () => void;
  colors: readonly [ColorValue, ColorValue];
  border: string;
  ripple: ColorValue;
  children: React.ReactNode;
}) {
  return (
    <PressableScale onPress={onPress} hitSlop={10} ripple={ripple} rippleBorderless style={styles.btnWrap}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.btn, { borderColor: border }]}>
        {children}
      </LinearGradient>
    </PressableScale>
  );
}

/**
 * Shared top app bar used on every main screen (via <Screen header={…}>).
 * A self-contained, full-width bar with a COMPLETELY BLACK background, a gold
 * border on the sides + bottom, rounded bottom corners and a soft shadow.
 * It owns the status-bar inset so the black fills behind the status bar — no
 * purple gradient, no top gap. The brand is centred between a menu button
 * (left) and a bell button (right). No negative margins → never overflows.
 */
export function BrandHeader({ onMenu, onBell, badge, showEmblem = true }: Props) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const liveUnread = useUnreadCount();
  const count = badge !== undefined ? badge : liveUnread;

  const barBg = theme.isDark ? '#000000' : '#ffffff';
  const goldBorder = theme.isDark ? 'rgba(233,184,80,0.5)' : theme.cardBorder;

  const btnColors = theme.isDark
    ? (['rgba(233,184,80,0.18)', 'rgba(233,184,80,0.04)'] as const)
    : (['#ffffff', '#f8fafc'] as const);
  const btnBorder = theme.isDark ? 'rgba(233,184,80,0.45)' : theme.cardBorder;

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: barBg,
          paddingTop: insets.top + 8,
          borderColor: goldBorder,
          shadowColor: theme.isDark ? '#000' : 'rgba(15,23,42,0.18)',
        },
      ]}
    >
      <HeaderBtn onPress={onMenu} colors={btnColors} border={btnBorder} ripple={theme.ripple}>
        <MenuIcon color={theme.gold1} size={20} />
      </HeaderBtn>

      <View style={styles.brand}>
        {showEmblem && <BrandEmblem color={theme.gold1} size={30} />}
        <View style={styles.brandText}>
          <GradientText style={styles.word}>SHREE YANTRA</GradientText>
          <View style={styles.subRow}>
            <View style={[styles.subDash, { backgroundColor: theme.gold2 }]} />
            <Text style={[styles.sub, { color: theme.gold2 }]}>ASTROLOGY</Text>
            <View style={[styles.subDash, { backgroundColor: theme.gold2 }]} />
          </View>
        </View>
      </View>

      <HeaderBtn onPress={onBell} colors={btnColors} border={btnBorder} ripple={theme.ripple}>
        <BellIcon color={theme.gold1} size={20} />
        {count > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
          </View>
        )}
      </HeaderBtn>

      {/* fading gold hairline tucked just above the bar's bottom edge */}
      <LinearGradient
        colors={['rgba(233,184,80,0)', theme.isDark ? 'rgba(246,210,122,0.55)' : 'rgba(176,115,22,0.4)', 'rgba(233,184,80,0)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.hairline}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
    // rounded bottom corners, gold outline on the two sides + bottom (open top)
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1.5,
    // soft floating shadow under the rounded bar
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 12,
  },
  btnWrap: { borderRadius: 14 },
  btn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  brand: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  brandText: { alignItems: 'center' },
  word: { fontFamily: fonts.cinzel, fontSize: 16, letterSpacing: 2.6, textAlign: 'center' },
  subRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4 },
  subDash: { width: 14, height: 1, opacity: 0.55, borderRadius: 1 },
  hairline: { position: 'absolute', bottom: 6, left: 58, right: 58, height: 1 },
  sub: { fontFamily: fonts.cinzelSemi, fontSize: 8, letterSpacing: 3.2, textAlign: 'center' },
  badge: {
    position: 'absolute', top: -4, right: -4, minWidth: 17, height: 17, borderRadius: 9,
    backgroundColor: '#e23b3b', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
    borderWidth: 1.5, borderColor: '#000',
  },
  badgeText: { color: '#fff', fontFamily: fonts.interBold, fontSize: 9.5, lineHeight: 13 },
});
