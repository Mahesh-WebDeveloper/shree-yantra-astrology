import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';
import { SpeakButton } from './SpeakButton';
import { ExplainView, Dignity } from '../data/jyotish';

function DigDot({ d }: { d: Dignity }) {
  if (!d) return null;
  const c = d === 'debil' ? '#d98a8a' : d === 'exalt' ? '#6fcf97' : '#e9b850';
  return <View style={[styles.dot, { backgroundColor: c }]} />;
}

/** Bottom-sheet popup that explains a tapped chart box / number / planet in simple
 *  language with an example. Driven entirely by a pre-resolved ExplainView. */
export function ChartExplainModal({ view, lang, onClose }: { view: ExplainView | null; lang: 'en' | 'hi'; onClose: () => void }) {
  const { theme } = useTheme();
  return (
    <Modal visible={!!view} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={{ width: '100%' }} onPress={(e) => e.stopPropagation()}>
          <LinearGradient
            colors={theme.isDark ? ['#1a1206', '#0b0b06'] : ['#fffdf6', '#fff3d6']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[styles.sheet, { borderColor: theme.gold1 }]}
          >
            <View style={[styles.grab, { backgroundColor: theme.cardBorder }]} />
            {!!view && (
              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                <Text style={[styles.heading, { color: theme.goldText }]}>{view.heading}</Text>
                <Text style={[styles.sub, { color: theme.gold2 }]}>{view.sub}</Text>

                {view.chips.length > 0 && (
                  <View style={styles.chips}>
                    {view.chips.map((c, i) => (
                      <View key={i} style={[styles.chip, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.3)' : '#fff' }]}>
                        <DigDot d={c.dignity} />
                        <Text style={[styles.chipTxt, { color: theme.text }]}>{c.label}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <Text style={[styles.body, { color: theme.textSoft }]}>{view.body}</Text>

                <View style={[styles.example, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.08)' : 'rgba(255,247,224,0.8)' }]}>
                  <Text style={[styles.exTxt, { color: theme.text }]}>{view.example}</Text>
                </View>

                <View style={styles.actions}>
                  <SpeakButton text={view.speak} label={lang === 'hi' ? 'सुनें' : 'Listen'} />
                  <Pressable onPress={onClose} style={({ pressed }) => [styles.closeBtn, { borderColor: theme.cardBorder, opacity: pressed ? 0.8 : 1 }]}>
                    <Text style={[styles.closeTxt, { color: theme.gold1 }]}>{lang === 'hi' ? 'ठीक है' : 'Got it'}</Text>
                  </Pressable>
                </View>
              </ScrollView>
            )}
          </LinearGradient>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end', padding: 12 },
  sheet: { borderWidth: 1.4, borderRadius: 22, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 18, maxHeight: '78%' },
  grab: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  heading: { fontFamily: fonts.playfairBold, fontSize: 20, lineHeight: 26 },
  sub: { fontFamily: fonts.interSemi, fontSize: 12.5, marginTop: 3 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 12 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  chipTxt: { fontFamily: fonts.interSemi, fontSize: 12 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  body: { fontFamily: fonts.inter, fontSize: 13.5, lineHeight: 21, marginTop: 14 },
  example: { borderWidth: 1, borderRadius: 14, padding: 12, marginTop: 14 },
  exTxt: { fontFamily: fonts.inter, fontSize: 12.8, lineHeight: 19, fontStyle: 'italic' },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  closeBtn: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 20, paddingVertical: 9 },
  closeTxt: { fontFamily: fonts.interSemi, fontSize: 13 },
});
