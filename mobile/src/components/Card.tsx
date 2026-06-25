import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { radii, space } from '../theme/tokens';

const BORDER_W = 1;

interface Props {
  children: React.ReactNode;
  /** OUTER container — for positioning only (margin, alignSelf). Do NOT put
      padding/alignItems here or they inflate the gold border. */
  style?: StyleProp<ViewStyle>;
  /** INNER content styles — padding, alignItems, gap, etc. live here. */
  contentStyle?: StyleProp<ViewStyle>;
  padded?: boolean;
  /** outer corner radius — inner is auto-derived so the border never cuts off */
  radius?: number;
  /** force a fully-opaque solid inner surface (e.g. horoscope card):
      pure black in dark mode, pure white in light mode. */
  solidBlack?: boolean;
}

export function Card({ children, style, contentStyle, padded = true, radius = radii.lg, solidBlack = false }: Props) {
  const { theme } = useTheme();
  const innerBg = solidBlack
    ? (theme.isDark ? '#000000' : '#ffffff')
    : theme.isDark ? 'rgba(0,0,0,0.94)' : 'rgba(255,255,255,0.98)';
  return (
    <LinearGradient
      colors={
        theme.isDark
          ? ['#fce8a8', '#e9b850', '#a17613', '#f6d27a']
          : ['#e9cf8e', '#c89023', '#9a6810', '#dfb24f']
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.border, { borderRadius: radius, padding: BORDER_W, shadowColor: theme.isDark ? '#000000' : '#6e4a12', shadowOpacity: theme.isDark ? 0.18 : 0.22 }, style]}
    >
      <View
        style={[
          styles.card,
          { borderRadius: radius - BORDER_W, backgroundColor: innerBg },
          padded && { padding: space[5] },
          contentStyle,
        ]}
      >
        <View
          style={[
            styles.topGlow,
            { backgroundColor: theme.isDark ? 'rgba(252,232,168,0.45)' : 'rgba(154,104,16,0.5)' },
          ]}
        />
        {children}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  border: {
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 6,
  },
  card: {
    overflow: 'hidden',
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: '14%',
    right: '14%',
    height: 1,
  },
});
