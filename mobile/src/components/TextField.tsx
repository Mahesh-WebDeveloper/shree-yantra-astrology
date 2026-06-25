import React, { useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardTypeOptions, Pressable } from 'react-native';
import Svg, { Path, Line } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radii } from '../theme/tokens';
import { useKeyboardAwareFocus } from './KeyboardAwareScroll';

interface Props {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: any;
  error?: string | null;
}

/** Themed input field — RN port of the web `.sy-field` (icon · label · input). */
export function TextField({
  icon, label, value, onChangeText, placeholder, secureTextEntry,
  keyboardType, autoCapitalize = 'none', autoComplete, error,
}: Props) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);
  const [hide, setHide] = useState(!!secureTextEntry);
  const inputRef = useRef<TextInput>(null);
  const liftAboveKeyboard = useKeyboardAwareFocus();

  const invalid = !!error;
  const borderColor = invalid ? 'rgba(245,100,100,0.65)' : focused ? theme.gold2 : (theme.isDark ? 'rgba(201,150,46,0.35)' : 'rgba(151,93,12,0.5)');

  return (
    <View>
      <Pressable
        onPress={() => inputRef.current?.focus()}
        style={[
          styles.field,
          {
            backgroundColor: invalid ? (theme.isDark ? 'rgba(36,12,18,0.55)' : 'rgba(255,238,238,0.95)') : (theme.isDark ? (focused ? 'rgba(0,0,0,0.78)' : 'rgba(0,0,0,0.70)') : '#fffdf7'),
            borderColor,
            shadowColor: theme.isDark ? '#000000' : '#5c3f12',
            shadowOpacity: theme.isDark ? 0.45 : 0.1,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 6 },
            elevation: 3,
          },
          focused && !invalid && styles.focusGlow,
        ]}
      >
        <View style={styles.icon}>{icon}</View>
        <View style={styles.body}>
          <Text style={[styles.label, { color: focused ? theme.gold2 : theme.goldText }]}>
            {label.toUpperCase()}
          </Text>
          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              value={value}
              onChangeText={onChangeText}
              placeholder={placeholder}
              placeholderTextColor={theme.isDark ? 'rgba(216,203,168,0.42)' : 'rgba(95,77,45,0.7)'}
              secureTextEntry={hide}
              keyboardType={keyboardType}
              autoCapitalize={autoCapitalize}
              autoComplete={autoComplete}
              onFocus={() => { setFocused(true); liftAboveKeyboard(); }}
              onBlur={() => setFocused(false)}
              style={[styles.input, { color: theme.text }]}
            />
            {secureTextEntry && (
              <Pressable onPress={() => setHide((h) => !h)} hitSlop={10}>
                <EyeIcon open={!hide} color={theme.gold2} />
              </Pressable>
            )}
          </View>
        </View>
      </Pressable>
      {invalid && <Text style={[styles.error]}>{error}</Text>}
    </View>
  );
}

function EyeIcon({ open, color }: { open: boolean; color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      <Path d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
      {!open && <Line x1={3} y1={3} x2={21} y2={21} />}
    </Svg>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  focusGlow: { shadowColor: '#e9b850', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 2 },
  icon: { width: 20, alignItems: 'center' },
  body: { flex: 1 },
  label: { fontFamily: fonts.interSemi, fontSize: 10.5, letterSpacing: 2 },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, fontFamily: fonts.inter, fontSize: 15, paddingVertical: 2, marginTop: 2 },
  error: { fontFamily: fonts.inter, fontSize: 11.5, color: '#ff9d9d', marginTop: 6, paddingLeft: 14, letterSpacing: 0.2 },
});
