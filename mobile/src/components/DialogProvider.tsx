import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radii } from '../theme/tokens';
import { GradientText } from './GradientText';
import { hTap, hSelect } from '../lib/haptics';

/**
 * App-themed dialog system — replaces native Alert.alert with a beautiful
 * black-gold (light+dark aware) modal: gold gradient frame, ornament, themed
 * buttons (ghost / gold-primary / destructive). API mirrors Alert.alert so
 * call sites are a drop-in: `dialog(title, message?, buttons?)`.
 */
export type DialogButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};
type ShowFn = (title: string, message?: string, buttons?: DialogButton[]) => void;

const DialogContext = createContext<ShowFn>(() => {});
export const useDialog = () => useContext(DialogContext);

interface State { title: string; message?: string; buttons: DialogButton[] }

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const [state, setState] = useState<State | null>(null);
  const anim = useRef(new Animated.Value(0)).current;

  const show = useCallback<ShowFn>((title, message, buttons) => {
    hTap();
    setState({ title, message, buttons: buttons && buttons.length ? buttons : [{ text: 'OK' }] });
  }, []);

  useEffect(() => {
    if (state) {
      anim.setValue(0);
      Animated.timing(anim, { toValue: 1, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    }
  }, [state, anim]);

  const dismiss = useCallback((btn?: DialogButton) => {
    Animated.timing(anim, { toValue: 0, duration: 160, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => {
      setState(null);
      btn?.onPress?.();
    });
  }, [anim]);

  const onBackdrop = () => {
    const cancel = state?.buttons.find((b) => b.style === 'cancel');
    dismiss(cancel);
  };

  const cardScale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] });
  const backdropOp = anim;

  const buttons = state?.buttons ?? [];
  const sideBySide = buttons.length === 2;

  return (
    <DialogContext.Provider value={show}>
      {children}
      <Modal visible={!!state} transparent animationType="none" onRequestClose={onBackdrop} statusBarTranslucent>
        <Animated.View style={[styles.backdrop, { opacity: backdropOp, backgroundColor: theme.isDark ? 'rgba(2,2,6,0.66)' : 'rgba(58,40,10,0.52)' }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onBackdrop} />
          <Animated.View style={{ width: '100%', maxWidth: 360, transform: [{ scale: cardScale }], opacity: anim }}>
            <LinearGradient
              colors={theme.isDark ? ['#fce8a8', '#e9b850', '#a17613', '#f6d27a'] : ['#f8ecd0', '#d49b2e', '#a66f12', '#efd37b']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={[styles.frame, { shadowColor: theme.isDark ? '#000' : '#5c3f12' }]}
            >
              <View style={[styles.card, { backgroundColor: theme.isDark ? '#0a0a12' : '#fffdf7' }]}>
                <View style={[styles.topGlow, { backgroundColor: theme.isDark ? 'rgba(252,232,168,0.45)' : 'rgba(176,115,22,0.28)' }]} />

                {/* ornament */}
                <View style={styles.ornament}>
                  <View style={[styles.ornLine, { backgroundColor: theme.line }]} />
                  <Text style={[styles.ornDiamond, { color: theme.gold2 }]}>◆</Text>
                  <View style={[styles.ornLine, { backgroundColor: theme.line }]} />
                </View>

                <GradientText style={styles.title}>{state?.title ?? ''}</GradientText>
                {!!state?.message && <Text style={[styles.message, { color: theme.textSoft }]}>{state.message}</Text>}

                <View style={[styles.btnRow, !sideBySide && styles.btnCol]}>
                  {buttons.map((b, i) => (
                    <DialogBtn key={`${b.text}-${i}`} btn={b} theme={theme} fill={sideBySide} onPress={() => { hSelect(); dismiss(b); }} />
                  ))}
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        </Animated.View>
      </Modal>
    </DialogContext.Provider>
  );
}

function DialogBtn({ btn, theme, fill, onPress }: { btn: DialogButton; theme: any; fill: boolean; onPress: () => void }) {
  const destructive = btn.style === 'destructive';
  const cancel = btn.style === 'cancel';
  const primary = !cancel && !destructive;

  if (primary) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [fill ? styles.btnFlex : styles.btnFull, pressed && styles.pressed]}>
        <LinearGradient colors={theme.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.btn}>
          <Text style={[styles.btnText, { color: theme.buttonInk }]} numberOfLines={1}>{btn.text}</Text>
        </LinearGradient>
      </Pressable>
    );
  }
  const color = destructive ? (theme.isDark ? '#ff8585' : '#c0392b') : theme.goldText;
  const border = destructive ? 'rgba(192,57,43,0.5)' : theme.cardBorder;
  const bg = destructive ? (theme.isDark ? 'rgba(255,80,80,0.08)' : 'rgba(192,57,43,0.09)') : (theme.isDark ? 'rgba(0,0,0,0.35)' : 'rgba(151,93,12,0.13)');
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [fill ? styles.btnFlex : styles.btnFull, styles.btn, styles.ghost, { borderColor: border, backgroundColor: bg }, pressed && styles.pressed]}>
      <Text style={[styles.btnText, { color }]} numberOfLines={1}>{btn.text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  frame: { borderRadius: radii.xl, padding: 1, shadowOpacity: 0.4, shadowRadius: 26, shadowOffset: { width: 0, height: 14 }, elevation: 18 },
  card: { borderRadius: radii.xl - 1, paddingHorizontal: 22, paddingTop: 18, paddingBottom: 18, overflow: 'hidden' },
  topGlow: { position: 'absolute', top: 0, left: '14%', right: '14%', height: 1 },
  ornament: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 },
  ornLine: { width: 34, height: 1 },
  ornDiamond: { fontSize: 9 },
  title: { fontFamily: fonts.cinzel, fontSize: 19, fontWeight: '700', textAlign: 'center', lineHeight: 25 },
  message: { fontFamily: fonts.inter, fontSize: 13.5, lineHeight: 20, textAlign: 'center', marginTop: 10 },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  btnCol: { flexDirection: 'column' },
  btn: { minHeight: 48, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  ghost: { borderWidth: 1 },
  btnFlex: { flex: 1, borderRadius: radii.pill, overflow: 'hidden' },
  btnFull: { width: '100%', borderRadius: radii.pill, overflow: 'hidden' },
  btnText: { fontFamily: fonts.cinzelSemi, fontSize: 13, letterSpacing: 1, textAlign: 'center' },
  pressed: { transform: [{ scale: 0.97 }], opacity: 0.92 },
});
