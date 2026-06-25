/**
 * Google / Material-Design motion system for the app's screen + tab transitions.
 *
 * All of this runs on RN's `Animated` API with the native driver (opacity +
 * transform only) — NOT Reanimated — so it stays buttery-smooth in Expo Go
 * here (Reanimated does not animate in this environment).
 *
 * References: Material 3 "shared axis" + "fade through" patterns.
 *   - Shared Axis X → hierarchical / sequential pushes (list → detail).
 *   - Fade Through  → unrelated destinations (auth flow, tab switches).
 */
import { Animated, Easing } from 'react-native';
import type {
  StackCardStyleInterpolator,
  TransitionPreset,
} from '@react-navigation/stack';

/* Material standard easing curves (the "emphasized" / "standard" beziers). */
const STANDARD = Easing.bezier(0.4, 0.0, 0.2, 1); // enter
const ACCELERATE = Easing.bezier(0.4, 0.0, 1, 1); // exit/close

/* ── Stack timing specs (≈ Material durations) ───────────────────────────── */
export const stackSpec: TransitionPreset['transitionSpec'] = {
  open: { animation: 'timing', config: { duration: 320, easing: STANDARD } },
  close: { animation: 'timing', config: { duration: 270, easing: ACCELERATE } },
};

/**
 * SHARED AXIS X — the recognisable Google "buttery" page change: the incoming
 * page slides in a short distance from the right while fading in; the outgoing
 * page slides the same short distance to the left while fading out. The small
 * travel (not a full-width slide) + cross-fade is what reads as premium.
 */
export const forSharedAxisX: StackCardStyleInterpolator = ({ current, next, layouts }) => {
  const shift = Math.min(layouts.screen.width * 0.22, 110);
  // single 0→1→2 timeline: 0..1 = this card entering, 1..2 = it leaving under a push
  const p = Animated.add(
    current.progress,
    next ? next.progress : 0,
  );
  return {
    cardStyle: {
      transform: [
        {
          translateX: p.interpolate({
            inputRange: [0, 1, 2],
            outputRange: [shift, 0, -shift],
            extrapolate: 'clamp',
          }),
        },
      ],
      opacity: p.interpolate({
        inputRange: [0, 0.28, 1, 1.72, 2],
        outputRange: [0, 1, 1, 0, 0],
        extrapolate: 'clamp',
      }),
    },
  };
};

/**
 * FADE THROUGH — calm cross-fade with a subtle scale-up (0.92→1) for screens
 * that aren't spatially related (splash → auth → app). There's a brief blank
 * beat at the crossover (the "through"), exactly per Material.
 */
export const forFadeThrough: StackCardStyleInterpolator = ({ current, next }) => {
  const p = Animated.add(current.progress, next ? next.progress : 0);
  return {
    cardStyle: {
      opacity: p.interpolate({
        inputRange: [0, 0.5, 1, 1.5, 2],
        outputRange: [0, 0, 1, 0, 0],
        extrapolate: 'clamp',
      }),
      transform: [
        {
          scale: p.interpolate({
            inputRange: [0, 1, 2],
            outputRange: [0.94, 1, 1.04],
            extrapolate: 'clamp',
          }),
        },
      ],
    },
  };
};

/* ── Bottom-tab fade-through (Material) ──────────────────────────────────────
   bottom-tabs gives each scene a symmetric `current.progress`: 0 = focused,
   ±1 = off to a side. We fade + scale so the focused tab blooms in (0.96→1)
   while the leaving tab fades out fast — the standard Google bottom-nav feel. */
export const tabTransitionSpec = {
  animation: 'timing' as const,
  config: { duration: 260, easing: STANDARD },
};

export function forTabFadeThrough({ current }: { current: { progress: Animated.AnimatedInterpolation<number> } }) {
  return {
    sceneStyle: {
      opacity: current.progress.interpolate({
        inputRange: [-1, -0.32, 0, 0.32, 1],
        outputRange: [0, 0, 1, 0, 0],
        extrapolate: 'clamp',
      }),
      transform: [
        {
          scale: current.progress.interpolate({
            inputRange: [-1, 0, 1],
            outputRange: [0.96, 1, 0.96],
            extrapolate: 'clamp',
          }),
        },
      ],
    },
  };
}
