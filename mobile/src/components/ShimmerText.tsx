import React, { useEffect, useRef, useState } from 'react';
import { Text, TextStyle, StyleProp, View, Animated, Easing, StyleSheet } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';

interface Props {
  children: string;
  style?: StyleProp<TextStyle>;
  /** resting (dim) colour of the text */
  baseColor?: string;
  /** colour of the bright band that sweeps across */
  shineColor?: string;
  /** ms for one sweep */
  duration?: number;
  /** ms pause between sweeps */
  gap?: number;
}

/**
 * iOS-15 startup-style shimmer text: the text rests in a dim colour while a
 * bright light-band sweeps across the letters on a loop (clipped to the glyph
 * shapes via MaskedView). RN Animated, native driver.
 */
export function ShimmerText({ children, style, baseColor, shineColor, duration = 1500, gap = 550 }: Props) {
  const { theme } = useTheme();
  const dim = baseColor ?? (theme.isDark ? 'rgba(233,184,80,0.42)' : 'rgba(151,93,12,0.7)');
  const shine = shineColor ?? (theme.isDark ? '#fff7e0' : '#f3d98a');

  const [w, setW] = useState(0);
  const x = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!w) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(x, { toValue: 1, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.delay(gap),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [w, x, duration, gap]);

  const band = Math.max(70, w * 0.42);
  const tx = x.interpolate({ inputRange: [0, 1], outputRange: [-band, w + band] });

  return (
    <MaskedView maskElement={<Text style={[{ backgroundColor: 'transparent' }, style]}>{children}</Text>}>
      <View onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        {/* reserve the exact text box */}
        <Text style={[style, { opacity: 0 }]}>{children}</Text>
        {/* dim resting fill */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: dim }]} />
        {/* bright sweeping band */}
        {w > 0 && (
          <Animated.View style={[styles.band, { width: band, transform: [{ translateX: tx }] }]} pointerEvents="none">
            <LinearGradient colors={['transparent', shine, 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
          </Animated.View>
        )}
      </View>
    </MaskedView>
  );
}

const styles = StyleSheet.create({
  band: { position: 'absolute', top: 0, bottom: 0, left: 0 },
});
