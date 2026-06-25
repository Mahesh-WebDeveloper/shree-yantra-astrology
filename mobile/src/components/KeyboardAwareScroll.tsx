import React, {
  createContext, useContext, useCallback, useEffect, useImperativeHandle, useRef, forwardRef, useState,
} from 'react';
import {
  ScrollView, ScrollViewProps, Keyboard, TextInput, findNodeHandle,
  UIManager, Platform, NativeSyntheticEvent, NativeScrollEvent, EmitterSubscription,
} from 'react-native';

/**
 * Pure-JS keyboard-aware scroll container.
 *
 * Fixes "keyboard covers the input" app-wide: when a field is focused (or the
 * keyboard opens), it measures the focused TextInput against the keyboard's
 * actual top (endCoordinates.screenY) and scrolls just enough to lift it above
 * the keyboard. It also pads the bottom by the keyboard height while open, so
 * there's always room to scroll the lowest fields up.
 *
 * RN Keyboard events + UIManager.measureInWindow only (no native module / no
 * Reanimated) → identical in Expo Go and the built APK. Inputs trigger the lift
 * on focus via the context callback (useKeyboardAwareFocus) so switching fields
 * while the keyboard is already open re-scrolls too.
 */

type FocusFn = () => void;
const KeyboardAwareContext = createContext<FocusFn>(() => {});
/** Call this from a TextInput's onFocus to lift it above the keyboard. */
export const useKeyboardAwareFocus = () => useContext(KeyboardAwareContext);

interface Props extends ScrollViewProps {
  /** breathing room (px) kept between the field bottom and the keyboard top */
  extraOffset?: number;
}

export const KeyboardAwareScroll = forwardRef<ScrollView, Props>(function KeyboardAwareScroll(
  { children, extraOffset = 44, keyboardShouldPersistTaps = 'handled', onScroll, scrollEventThrottle, contentContainerStyle, ...rest },
  fwdRef,
) {
  const innerRef = useRef<ScrollView>(null);
  useImperativeHandle(fwdRef, () => innerRef.current as ScrollView, []);

  const scrollY = useRef(0);
  const kbTop = useRef(0);
  const kbOpen = useRef(false);
  const [kbInset, setKbInset] = useState(0);

  const lift = useCallback((attempt = 0) => {
    if (!kbOpen.current) return;
    const State: any = (TextInput as any).State;
    const focused = State?.currentlyFocusedInput?.() ?? null;
    const node: number | null = focused
      ? findNodeHandle(focused)
      : (typeof State?.currentlyFocusedField?.() === 'number' ? State.currentlyFocusedField() : null);
    if (node == null) return;
    UIManager.measureInWindow(node, (_x, y, _w, h) => {
      if (typeof y !== 'number' || typeof h !== 'number' || (y === 0 && h === 0)) {
        if (attempt < 2) setTimeout(() => lift(attempt + 1), 60); // layout not settled yet
        return;
      }
      const overlap = y + h + extraOffset - kbTop.current;
      if (overlap > 0) {
        innerRef.current?.scrollTo({ y: Math.max(0, scrollY.current + overlap), animated: true });
      }
    });
  }, [extraOffset]);

  useEffect(() => {
    const subs: EmitterSubscription[] = [];
    const onShow = (e: any) => {
      kbOpen.current = true;
      kbTop.current = e?.endCoordinates?.screenY ?? 0;
      setKbInset((e?.endCoordinates?.height ?? 0) + extraOffset);
      setTimeout(() => lift(), Platform.OS === 'android' ? 90 : 20);
    };
    subs.push(Keyboard.addListener('keyboardDidShow', onShow));
    subs.push(Keyboard.addListener('keyboardDidHide', () => { kbOpen.current = false; kbTop.current = 0; setKbInset(0); }));
    return () => subs.forEach((s) => s.remove());
  }, [lift, extraOffset]);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = e.nativeEvent.contentOffset.y;
    onScroll?.(e);
  }, [onScroll]);

  return (
    <KeyboardAwareContext.Provider value={lift}>
      <ScrollView
        ref={innerRef}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        onScroll={handleScroll}
        scrollEventThrottle={scrollEventThrottle ?? 16}
        contentContainerStyle={[contentContainerStyle, kbInset ? { paddingBottom: kbInset } : null]}
        {...rest}
      >
        {children}
      </ScrollView>
    </KeyboardAwareContext.Provider>
  );
});
