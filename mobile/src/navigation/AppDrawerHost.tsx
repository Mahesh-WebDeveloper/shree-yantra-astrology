import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Pressable, BackHandler, View, Animated, Easing, PanResponder } from 'react-native';
import { BlurView } from 'expo-blur';
import { DrawerContent } from './DrawerContent';

const WIDTH = 320;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedBlur = Animated.createAnimatedComponent(BlurView);

/* module-level controller so any screen can open the drawer without prop drilling */
let openFn: (() => void) | null = null;
export function openAppDrawer() { openFn?.(); }

/** Custom drawer overlay — one native-driven `Animated.Value` drives the panel
    slide + backdrop fade, with swipe-to-close (PanResponder) and a frosted blur
    backdrop. Backdrop tap, X button and swipe all run the SAME close animation. */
export function AppDrawerHost() {
  const progress = useRef(new Animated.Value(0)).current;  // 0 = closed, 1 = open
  const [mounted, setMounted] = useState(false);

  const animateTo = useCallback((to: number, duration: number, after?: () => void) => {
    Animated.timing(progress, {
      toValue: to,
      duration,
      easing: to === 1 ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => { if (finished) after?.(); });
  }, [progress]);

  const open = useCallback(() => { setMounted(true); }, []);
  const close = useCallback(() => { animateTo(0, 240, () => setMounted(false)); }, [animateTo]);

  useEffect(() => { openFn = open; return () => { if (openFn === open) openFn = null; }; }, [open]);

  // animate IN once mounted
  useEffect(() => {
    if (!mounted) return;
    progress.setValue(0);
    animateTo(1, 320);
  }, [mounted, progress, animateTo]);

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
        const p = Math.min(1, Math.max(0, 1 + g.dx / WIDTH));
        progress.setValue(p);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx < -WIDTH * 0.33 || g.vx < -0.4) animateTo(0, 200, () => setMounted(false));
        else animateTo(1, 200);
      },
      onPanResponderTerminate: () => animateTo(1, 200),
    })
  ).current;

  if (!mounted) return null;

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [-WIDTH, 0] });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* frosted backdrop — blur + dim, fades in; tap to close */}
      <AnimatedPressable style={[StyleSheet.absoluteFill, { opacity: progress }]} onPress={close}>
        <AnimatedBlur intensity={26} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, styles.dim]} />
      </AnimatedPressable>

      {/* sliding panel — swipeable */}
      <Animated.View style={[styles.panel, { transform: [{ translateX }] }]} {...pan.panHandlers}>
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
