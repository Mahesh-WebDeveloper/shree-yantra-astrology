import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radii } from '../theme/tokens';
import { hTap } from '../lib/haptics';
import { useLang } from '../i18n/LanguageProvider';
import { VerseExplanation } from '../lib/api';

/**
 * Reusable "हिंदी में अर्थ जानें" block for ANY scripture verse.
 * Pass a fetcher that returns { anuvad, katha, seekh }. Lazy-loads on first open, caches in component.
 * Use in Gita / Valmiki Ramayan / Ramcharitmanas — aur aage saari books me.
 */
export function VerseMeaning({ fetcher }: { fetcher: () => Promise<VerseExplanation> }) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const hi = lang === 'hi';
  const [open, setOpen] = useState(false);
  const [exp, setExp] = useState<VerseExplanation | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(false);
  const boxBorder = theme.isDark ? 'rgba(201,150,46,0.2)' : 'rgba(176,115,22,0.15)';

  const toggle = () => {
    hTap();
    const next = !open;
    setOpen(next);
    if (next && !exp && !loading) {
      setLoading(true); setErr(false);
      fetcher()
        .then((r) => setExp(r))
        .catch(() => setErr(true))
        .finally(() => setLoading(false));
    }
  };

  const Box = ({ label, text }: { label: string; text: string }) =>
    !text ? null : (
      <View style={[styles.mBox, { borderTopColor: boxBorder }]}>
        <Text style={[styles.mLabel, { color: theme.gold2 }]}>{label}</Text>
        <Text style={[styles.mText, { color: theme.text, fontFamily: hi ? fonts.devanagari : fonts.inter, fontSize: hi ? 15 : 14 }]}>{text}</Text>
      </View>
    );

  return (
    <View>
      <Pressable
        onPress={toggle}
        style={({ pressed }) => [
          styles.btn,
          { borderColor: theme.isDark ? 'rgba(201,150,46,0.5)' : 'rgba(176,115,22,0.45)', backgroundColor: theme.isDark ? 'rgba(233,184,80,0.12)' : 'rgba(176,115,22,0.08)' },
          pressed && { backgroundColor: theme.isDark ? 'rgba(233,184,80,0.2)' : 'rgba(176,115,22,0.14)' },
        ]}
      >
        <Text style={[styles.btnText, { color: theme.gold1 }]}>
          📖  {open ? (hi ? 'अर्थ छिपाएँ' : 'Hide explanation') : (hi ? 'सरल अर्थ जानें' : 'Understand in simple words')}
        </Text>
      </Pressable>

      {open && (
        <View style={{ marginTop: 12 }}>
          {loading && <View style={{ paddingVertical: 14, alignItems: 'center' }}><ActivityIndicator color={theme.gold1} /><Text style={[styles.aiNote, { color: theme.textMuted, marginTop: 8 }]}>{hi ? 'AI सरल अर्थ तैयार कर रहा है…' : 'AI is preparing a simple explanation…'}</Text></View>}
          {err && <Text style={[styles.errSmall, { color: theme.textMuted }]}>{hi ? 'अर्थ लोड नहीं हो पाया — फिर प्रयास करें।' : 'Could not load — please try again.'}</Text>}
          {exp && (
            <>
              <Box label={hi ? 'अर्थ' : 'Meaning'} text={exp.anuvad} />
              <Box label={hi ? 'कथा' : 'Story'} text={exp.katha} />
              <Box label={hi ? 'जीवन की सीख' : 'Lesson for life'} text={exp.seekh} />
              <Text style={[styles.aiNote, { color: theme.textMuted }]}>✦ {hi ? 'AI द्वारा सरल व्याख्या' : 'Simple explanation by AI'}</Text>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  btn: { marginTop: 16, alignSelf: 'stretch', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 18, borderRadius: radii.pill, borderWidth: 1.5 },
  btnText: { fontFamily: fonts.interSemi, fontSize: 15, letterSpacing: 0.3 },
  errSmall: { fontFamily: fonts.inter, fontSize: 12.5, textAlign: 'center', paddingVertical: 8 },
  mBox: { borderTopWidth: 1, marginTop: 12, paddingTop: 12 },
  mLabel: { fontFamily: fonts.interSemi, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 5 },
  mText: { fontFamily: fonts.devanagari, fontSize: 15, lineHeight: 26 },
  aiNote: { fontFamily: fonts.inter, fontSize: 10.5, textAlign: 'center', marginTop: 12, fontStyle: 'italic' },
});
