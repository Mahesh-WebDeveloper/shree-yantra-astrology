import React, { useRef } from 'react';
import { Animated, Pressable, PressableProps, StyleProp, ViewStyle, ColorValue } from 'react-native';
import { hTap, hPress, hSelect } from '../lib/haptics';

type HapticKind = 'tap' | 'press' | 'select' | 'none';
const HAPTICS: Record<HapticKind, () => void> = { tap: hTap, press: hPress, select: hSelect, none: () => {} };

interface Props extends Omit<PressableProps, 'style' | 'children'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** scale at the bottom of the press (default 0.94) */
  scaleTo?: number;
  /** haptic fired on press (default 'tap'); 'none' to disable */
  haptic?: HapticKind;
  /** android ripple colour; null disables ripple */
  ripple?: ColorValue | null;
  rippleBorderless?: boolean;
}

/**
 * Tactile, Material-feel pressable: animated spring scale-down on press (native
 * driver), haptic feedback, and Android ripple — the shared interaction
 * primitive for buttons/tiles/icon-buttons across the app.
 */
export function PressableScale({
  children,
  style,
  scaleTo = 0.94,
  haptic = 'tap',
  ripple = 'rgba(255,255,255,0.18)',
  rippleBorderless = false,
  onPress,
  onPressIn,
  onPressOut,
  ...rest
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v: number) => Animated.spring(scale, {
    toValue: v,
    useNativeDriver: true,
    speed: 44,
    bounciness: 4,
  }).start();
  const minScale = Math.min(scaleTo, 0.999);
  const opacity = scale.interpolate({
    inputRange: [minScale, 1],
    outputRange: [0.92, 1],
    extrapolate: 'clamp',
  });

  return (
    <Pressable
      onPressIn={(e) => { to(scaleTo); onPressIn?.(e); }}
      onPressOut={(e) => { to(1); onPressOut?.(e); }}
      onPress={(e) => { HAPTICS[haptic](); onPress?.(e); }}
      android_ripple={ripple === null ? undefined : { color: ripple, borderless: rippleBorderless }}
      {...rest}
    >
      <Animated.View style={[{ opacity, transform: [{ scale }] }, style]}>{children}</Animated.View>
    </Pressable>
  );
}
