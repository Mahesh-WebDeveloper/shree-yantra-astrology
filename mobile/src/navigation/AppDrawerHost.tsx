import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Pressable, BackHandler, View, PanResponder } from 'react-native';
import Animated, {
  Easing, Extrapolation, interpolate, runOnJS, useAnimatedStyle, useSharedValue,
  withSpring, withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { DrawerContent } from './DrawerContent';

const WIDTH = 320;

/* module-level controller so any screen can open the drawer without prop drilling */
let openFn: (() => void) | null = null;
export function openAppDrawer() { openFn?.(); }

/* one spring for every settle — entrance + snap-back share the same character */
const OPEN_SPRING = { damping: 24, stiffness: 240, mass: 0.85 } as const;

/** Custom drawer overlay — one Reanimated shared value drives the panel slide +
    backdrop fade ON THE UI THREAD (same worklet approach as CustomTabBar), so the
    entrance spring and swipe stay butter-smooth even while JS is busy mounting
    screens or re-theming the whole tree. Backdrop tap, X button and swipe all
    run the SAME close animation. */
export function AppDrawerHost() {
  const progress = useSharedValue(0);  // 0 = closed, 1 = open
  const [mounted, setMounted] = useState(false);

  const unmount = useCallback(() => setMounted(false), []);

  const close = useCallback(() => {
    progress.value = withTiming(0, { duration: 220, easing: Easing.in(Easing.cubic) }, (finished) => {
      'worklet';
      if (finished) runOnJS(unmount)();
    });
  }, [progress, unmount]);

  const open = useCallback(() => { setMounted(true); }, []);

  useEffect(() => { openFn = open; return () => { if (openFn === open) openFn = null; }; }, [open]);

  // spring IN once mounted (interpolations are clamped, so overshoot never
  // reveals a gap at the screen edge)
  useEffect(() => {
    if (!mounted) return;
    progress.value = 0;
    progress.value = withSpring(1, OPEN_SPRING);
  }, [mounted, progress]);

  // Android hardware back closes the drawer first
  useEffect(() => {
    if (!mounted) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { close(); return true; });
    return () => sub.remove();
  }, [mounted, close]);

  // ── swipe-to-close: drag the panel left to dismiss ──
  const pan = useRef(
    PanResponder.create({
      // only claim clearly-horizontal left drags so vertical scrolling still works
      onMoveShouldSetPanResponder: (_, g) => g.dx < -8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderMove: (_, g) => {
        progress.value = Math.min(1, Math.max(0, 1 + g.dx / WIDTH));
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < -WIDTH * 0.33 || g.vx < -0.4) {
          progress.value = withTiming(0, { duration: 190, easing: Easing.in(Easing.cubic) }, (finished) => {
            'worklet';
            if (finished) runOnJS(unmount)();
          });
        } else {
          progress.value = withSpring(1, OPEN_SPRING);
        }
      },
      onPanResponderTerminate: () => { progress.value = withSpring(1, OPEN_SPRING); },
    })
  ).current;

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP),
  }));
  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(progress.value, [0, 1], [-WIDTH, 0], Extrapolation.CLAMP) }],
  }));

  if (!mounted) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* frosted backdrop — blur + dim, fades in; tap to close */}
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close}>
          <BlurView intensity={26} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, styles.dim]} />
        </Pressable>
      </Animated.View>

      {/* sliding panel — swipeable */}
      <Animated.View style={[styles.panel, panelStyle]} {...pan.panHandlers}>
        <DrawerContent close={close} progress={progress} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  dim: { backgroundColor: 'rgba(2,3,10,0.5)' },
  panel: {
    position: 'absolute', top: 0, bottom: 0, left: 0, width: WIDTH,
    shadowColor: '#000', shadowOpacity: 0.55, shadowRadius: 28, shadowOffset: { width: 8, height: 0 }, elevation: 24,
  },
});
