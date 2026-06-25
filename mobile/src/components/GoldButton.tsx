import React from 'react';
import { Pressable, Text, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radii } from '../theme/tokens';
import { hPress } from '../lib/haptics';

interface Props {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'ghost';
  style?: StyleProp<ViewStyle>;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  compact?: boolean;
}

/** The unified gold CTA (primary) + outlined ghost button from the web app. */
export function GoldButton({ label, onPress, variant = 'primary', style, icon, trailing, compact = false }: Props) {
  const { theme } = useTheme();
  const isGhost = variant === 'ghost';
  const handlePress = () => { hPress(); onPress?.(); };

  const inner = (
    <View style={styles.row}>
      {icon}
      <Text
        numberOfLines={1}
        style={[
          styles.label,
          compact && styles.labelCompact,
          { color: isGhost ? theme.gold1 : theme.buttonInk },
        ]}
      >
        {label}
      </Text>
      {trailing}
    </View>
  );

  if (isGhost) {
    return (
      <Pressable
        onPress={handlePress}
        android_ripple={{ color: theme.ripple }}
        style={({ pressed }) => [
          styles.base,
          compact && styles.baseCompact,
          {
            backgroundColor: theme.isDark ? 'rgba(0,0,0,0.6)' : '#fffdf7',
            borderColor: theme.cardBorder,
            borderWidth: 1,
            opacity: pressed ? 0.94 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
          style,
        ]}
      >
        {inner}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      android_ripple={{ color: 'rgba(255,255,255,0.25)' }}
      style={({ pressed }) => [
        styles.primaryWrap,
        {
          shadowColor: theme.isDark ? '#000000' : '#8a5b10',
          opacity: pressed ? 0.96 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
        style,
      ]}
    >
      <LinearGradient
        colors={theme.buttonGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.base, compact && styles.baseCompact]}
      >
        {inner}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primaryWrap: {
    borderRadius: radii.pill,
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 5,
  },
  base: {
    minHeight: 52,
    borderRadius: radii.pill,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  baseCompact: {
    minHeight: 50,
    paddingHorizontal: 8,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: {
    fontFamily: fonts.cinzel,
    fontSize: 13.5,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  labelCompact: {
    fontSize: 12,
    letterSpacing: 0.6,
  },
});
