import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';
import { hTap } from '../lib/haptics';
import { useLang } from '../i18n/LanguageProvider';
import { explainSimple } from '../lib/api';

/**
 * Tiny "🤖 Explain simply with AI" toggle placed under any ritual paragraph / mantra.
 * Lazy-loads a very simple, example-based explanation (bilingual, backend-cached).
 */
export function ExplainButton({ text, context }: { text: string; context?: string }) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const hi = lang === 'hi';
  const [open, setOpen] = useState(false);
  const [exp, setExp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(false);

  const toggle = () => {
    hTap();
    const next = !open;
    setOpen(next);
    if (next && exp === null && !loading) {
      setLoading(true); setErr(false);
      explainSimple(text, context || '', lang)
        .then((r) => setExp(r.explanation || ''))
        .catch(() => setErr(true))
        .finally(() => setLoading(false));
    }
  };

  return (
    <View style={{ marginTop: 9 }}>
      <Pressable
        onPress={toggle}
        hitSlop={6}
        style={({ pressed }) => [styles.btn, { borderColor: theme.gold3, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.08)' : 'rgba(176,115,22,0.06)' }, pressed && { opacity: 0.7 }]}
      >
        <Text style={[styles.btnTxt, { color: theme.gold1 }]}>🤖 {open ? (hi ? 'छिपाएँ' : 'Hide') : (hi ? 'AI से सरल भाषा में समझें' : 'Explain simply with AI')}</Text>
      </Pressable>
      {open && (
        <View style={{ marginTop: 8 }}>
          {loading && <ActivityIndicator color={theme.gold1} style={{ paddingVertical: 8 }} />}
          {err && <Text style={[styles.err, { color: theme.textMuted }]}>{hi ? 'अभी नहीं मिल पाया — फिर प्रयास करें।' : 'Could not load — please try again.'}</Text>}
          {!!exp && (
            <View style={[styles.box, { borderColor: theme.gold3, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.6)' }]}>
              <Text style={[styles.boxTxt, { color: theme.text, fontFamily: hi ? fonts.devanagari : fonts.inter }]}>{exp}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  btnTxt: { fontFamily: fonts.interSemi, fontSize: 11.5 },
  err: { fontFamily: fonts.inter, fontSize: 12, paddingVertical: 4 },
  box: { borderWidth: 1, borderRadius: 12, padding: 11 },
  boxTxt: { fontSize: 13.5, lineHeight: 21 },
});
