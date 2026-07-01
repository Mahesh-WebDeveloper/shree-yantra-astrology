import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';
import { hTap } from '../lib/haptics';
import { MuhuratItem } from '../lib/api';

const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MON_HI = ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];
const WD = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const dmyParts = (dmy: string) => { const [d, m, y] = String(dmy).split('/').map(Number); return { d, m, y }; };

/** Month calendar that highlights recommended muhurat dates with colored dots.
 *  Reuses the app's gold theme. Tapping a highlighted date calls onPick(dmy). */
export function MuhuratCalendar({ items, bestDmy, lang, onPick, selected }: {
  items: MuhuratItem[]; bestDmy?: string | null; lang: 'en' | 'hi'; onPick: (dmy: string) => void; selected?: string | null;
}) {
  const { theme } = useTheme();
  // map "y-m-d" → item (score) for quick lookup
  const map = useMemo(() => {
    const m: Record<string, MuhuratItem> = {};
    items.forEach((it) => { const p = dmyParts(it.dmy); m[`${p.y}-${p.m}-${p.d}`] = it; });
    return m;
  }, [items]);

  const first = items[0] ? dmyParts(items[0].dmy) : dmyParts(bestDmy || `1/${new Date().getMonth() + 1}/${new Date().getFullYear()}`);
  const [view, setView] = useState({ m: first.m, y: first.y });

  // range of months that actually contain results (for prev/next bounds)
  const bounds = useMemo(() => {
    const keys = items.map((it) => { const p = dmyParts(it.dmy); return p.y * 12 + (p.m - 1); });
    return { min: Math.min(...keys), max: Math.max(...keys) };
  }, [items]);
  const cursor = view.y * 12 + (view.m - 1);
  const shift = (d: number) => {
    const n = Math.max(bounds.min, Math.min(bounds.max, cursor + d));
    setView({ y: Math.floor(n / 12), m: (n % 12) + 1 });
  };

  const daysInMonth = new Date(view.y, view.m, 0).getDate();
  const firstDow = new Date(view.y, view.m - 1, 1).getDay();
  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const dotFor = (score: number, isBest: boolean) => {
    if (isBest) return '#e9b850';
    if (score >= 92) return '#3ec77a';
    if (score >= 80) return '#e0a92e';
    return '#9a8a6a';
  };

  return (
    <View style={[styles.wrap, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.9)' }]}>
      <View style={styles.head}>
        <Pressable onPress={() => { hTap(); shift(-1); }} disabled={cursor <= bounds.min} hitSlop={10} style={styles.navBtn}>
          <Text style={[styles.nav, { color: cursor <= bounds.min ? theme.textMuted : theme.gold1 }]}>‹</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.goldText }]}>{(lang === 'hi' ? MON_HI : MON)[view.m - 1]} {view.y}</Text>
        <Pressable onPress={() => { hTap(); shift(1); }} disabled={cursor >= bounds.max} hitSlop={10} style={styles.navBtn}>
          <Text style={[styles.nav, { color: cursor >= bounds.max ? theme.textMuted : theme.gold1 }]}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WD.map((w, i) => <Text key={i} style={[styles.wd, { color: theme.textMuted }]}>{w}</Text>)}
      </View>

      <View style={styles.grid}>
        {cells.map((day, i) => {
          if (day == null) return <View key={i} style={styles.cell} />;
          const it = map[`${view.y}-${view.m}-${day}`];
          const isBest = !!it && it.dmy === bestDmy;
          const isSel = !!it && it.dmy === selected;
          const dot = it ? dotFor(it.score, isBest) : null;
          const inner = (
            <>
              <Text style={[styles.dayTxt, { color: it ? (isBest ? '#2a1c00' : theme.text) : theme.textMuted }]}>{day}</Text>
              {!!dot && !isBest && <View style={[styles.dot, { backgroundColor: dot }]} />}
              {isBest && <Text style={styles.bestStar}>★</Text>}
            </>
          );
          return (
            <Pressable key={i} disabled={!it} onPress={() => { hTap(); onPick(it!.dmy); }} style={styles.cell}>
              {isBest ? (
                <LinearGradient colors={['#fce8a8', '#e9b850']} style={[styles.dayInner, styles.dayBest]}>{inner}</LinearGradient>
              ) : (
                <View style={[styles.dayInner, isSel && { borderWidth: 1.4, borderColor: theme.gold1, borderRadius: 10 }, it && !isSel && { backgroundColor: theme.isDark ? 'rgba(233,184,80,0.06)' : 'rgba(233,184,80,0.08)', borderRadius: 10 }]}>{inner}</View>
              )}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.legend}>
        {[['★', '#e9b850', lang === 'hi' ? 'सर्वश्रेष्ठ' : 'Best'], ['●', '#3ec77a', lang === 'hi' ? 'शुभ' : 'Recommended'], ['●', '#e0a92e', lang === 'hi' ? 'अच्छा' : 'Good']].map(([g, c, t], i) => (
          <View key={i} style={styles.legItem}><Text style={{ color: c as string, fontSize: 11 }}>{g}</Text><Text style={[styles.legTxt, { color: theme.textMuted }]}>{t}</Text></View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderWidth: 1, borderRadius: 18, padding: 13 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  navBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  nav: { fontSize: 26, fontFamily: fonts.interBold, lineHeight: 28 },
  title: { fontFamily: fonts.cinzelSemi, fontSize: 15, letterSpacing: 0.5 },
  weekRow: { flexDirection: 'row' },
  wd: { flex: 1, textAlign: 'center', fontFamily: fonts.interSemi, fontSize: 10.5, paddingVertical: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 2 },
  dayInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dayBest: { borderRadius: 10 },
  dayTxt: { fontFamily: fonts.interSemi, fontSize: 12.5 },
  dot: { width: 5, height: 5, borderRadius: 2.5, marginTop: 2 },
  bestStar: { fontSize: 8, color: '#2a1c00', marginTop: 0 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 10 },
  legItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legTxt: { fontFamily: fonts.inter, fontSize: 10.5 },
});
