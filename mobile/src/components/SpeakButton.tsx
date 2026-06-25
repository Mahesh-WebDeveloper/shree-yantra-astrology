import React, { useEffect, useState } from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import * as Speech from 'expo-speech';
import { useTheme } from '../theme/ThemeProvider';
import { useLang } from '../i18n/LanguageProvider';
import { fonts } from '../theme/tokens';
import { hTap } from '../lib/haptics';

/* "Bolne wala jyotishi" — kisi bhi text ko zor se padh deta hai (Hindi/English TTS).
   Reusable: <SpeakButton text={answer} /> ya <SpeakButton text={[a, b, c]} />. */
const MAX = 3800; // Android TTS per-utterance safe limit

export function SpeakButton({ text, label }: { text: string | string[]; label?: string }) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const [speaking, setSpeaking] = useState(false);

  const full = (Array.isArray(text) ? text.filter(Boolean).join('. ') : (text || '')).trim().slice(0, MAX);

  // screen chhodne par awaaz band
  useEffect(() => () => { Speech.stop(); }, []);

  const toggle = () => {
    hTap();
    if (speaking) { Speech.stop(); setSpeaking(false); return; }
    if (!full) return;
    setSpeaking(true);
    Speech.speak(full, {
      language: lang === 'hi' ? 'hi-IN' : 'en-IN',
      rate: lang === 'hi' ? 0.94 : 1.0,
      pitch: 1.0,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  if (!full) return null;
  const txt = label || (lang === 'hi' ? (speaking ? 'रोकें' : 'सुनें') : (speaking ? 'Stop' : 'Listen'));
  const col = speaking ? theme.buttonInk : theme.gold1;

  return (
    <Pressable
      onPress={toggle}
      hitSlop={8}
      style={({ pressed }) => [
        styles.btn,
        speaking
          ? { backgroundColor: theme.gold1, borderColor: theme.gold1 }
          : { backgroundColor: theme.isDark ? 'rgba(233,184,80,0.12)' : 'rgba(176,115,22,0.10)', borderColor: theme.cardBorder },
        pressed && { opacity: 0.85 },
      ]}
    >
      {speaking ? (
        <Svg width={14} height={14} viewBox="0 0 24 24" fill={col}><Rect x={6} y={6} width={12} height={12} rx={2} /></Svg>
      ) : (
        <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M11 5L6 9H2v6h4l5 4V5z" fill={col} />
          <Path d="M15.5 8.5a5 5 0 010 7" /><Path d="M18.5 5.5a9 9 0 010 13" />
        </Svg>
      )}
      <Text style={[styles.label, { color: col }]}>{txt}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' },
  label: { fontFamily: fonts.interSemi, fontSize: 12, letterSpacing: 0.3 },
});
