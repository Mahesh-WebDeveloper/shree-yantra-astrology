import React, { useState } from 'react';
import { View, StyleSheet, GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';

interface Props {
  /** 0..1 */
  progress: number;
  onSeek?: (fraction: number) => void;
  height?: number;
  showThumb?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Tap-to-seek progress track (no extra slider dependency). */
export function Seekbar({ progress, onSeek, height = 6, showThumb = true, style }: Props) {
  const { theme } = useTheme();
  const [w, setW] = useState(0);
  const [dragging, setDragging] = useState(false);
  const p = Math.max(0, Math.min(1, progress || 0));

  const handle = (e: GestureResponderEvent) => {
    if (!w || !onSeek) return;
    onSeek(Math.max(0, Math.min(1, e.nativeEvent.locationX / w)));
  };

  // enlarged + gold-glowing thumb while the finger is down
  const thumbSize = dragging ? 18 : 12;
  return (
    <View
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onResponderGrant={(e) => { setDragging(true); handle(e); }}
      onResponderMove={handle}
      onResponderRelease={() => setDragging(false)}
      onResponderTerminate={() => setDragging(false)}
      style={[styles.hit, style]}
    >
      <View style={[styles.track, { height, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(176,115,22,0.20)' }]}>
        <LinearGradient
          colors={theme.buttonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { width: `${p * 100}%` }]}
        />
        {showThumb && w > 0 && (
          <View
            style={[
              styles.thumb,
              {
                width: thumbSize,
                height: thumbSize,
                borderRadius: thumbSize / 2,
                marginTop: -thumbSize / 2,
                left: Math.max(0, p * w - thumbSize / 2),
                borderColor: theme.gold1,
                borderWidth: dragging ? 2 : 1,
                backgroundColor: theme.goldSoft,
              },
              dragging && { shadowColor: theme.gold1, shadowOpacity: 0.9, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 6 },
            ]}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hit: { paddingVertical: 8, justifyContent: 'center' },
  track: { borderRadius: 999, justifyContent: 'center' },
  fill: { height: '100%', borderRadius: 999 },
  thumb: { position: 'absolute', top: '50%' },
});
