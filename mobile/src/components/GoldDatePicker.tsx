import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fonts } from '../theme/tokens';
import { hSelect, hPress } from '../lib/haptics';

/* Black & gold wheel date picker — Day | Month | Year scrollable columns.
   Har column independent: sirf year badalne par month/day bane rehte hain. */
const GOLD = '#f4c34a';
const GOLD_SOFT = '#ffe289';
const LINE = 'rgba(214,162,56,0.5)';
const LINE_DIM = 'rgba(214,162,56,0.28)';
const TEXT = '#f6e7c8';
const MUTE = 'rgba(143,128,89,0.85)';
const PANEL = '#0b0913';
const GRAD = ['#fff1ad', '#f4c34a', '#b67a16'] as const;

const MO_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MO_HI = ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];

const ROW = 44;
const VISIBLE = 5;            // odd — center row is the selection
const PAD = Math.floor(VISIBLE / 2);
const daysIn = (y: number, m: number) => new Date(y, m + 1, 0).getDate();

interface WheelItem { label: string; value: number }
function Wheel({ data, value, onChange }: { data: WheelItem[]; value: number; onChange: (v: number) => void }) {
  const ref = useRef<ScrollView>(null);
  const idx = Math.max(0, data.findIndex((d) => d.value === value));

  // keep the wheel aligned when value/length changes externally (e.g. day clamps on month change)
  useEffect(() => {
    const t = setTimeout(() => ref.current?.scrollTo({ y: idx * ROW, animated: false }), 0);
    return () => clearTimeout(t);
  }, [idx, data.length]);

  const commitOffset = (y: number) => {
    const i = Math.round(y / ROW);
    const c = Math.max(0, Math.min(data.length - 1, i));
    const v = data[c]?.value;
    if (v != null && v !== value) { hSelect(); onChange(v); }
    requestAnimationFrame(() => ref.current?.scrollTo({ y: c * ROW, animated: true }));
  };

  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    commitOffset(e.nativeEvent.contentOffset.y);
  };

  const pick = (v: number) => {
    const nextIdx = Math.max(0, data.findIndex((x) => x.value === v));
    hSelect();
    onChange(v);
    requestAnimationFrame(() => ref.current?.scrollTo({ y: nextIdx * ROW, animated: true }));
  };

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.y / ROW);
    const c = Math.max(0, Math.min(data.length - 1, i));
    const v = data[c]?.value;
    if (v != null && v !== value) { hSelect(); onChange(v); }
  };

  return (
    <ScrollView
      ref={ref}
      style={styles.wheel}
      showsVerticalScrollIndicator={false}
      snapToInterval={ROW}
      decelerationRate="fast"
      nestedScrollEnabled
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingVertical: PAD * ROW }}
      onScrollEndDrag={onEnd}
      onMomentumScrollEnd={onMomentumEnd}
    >
      {data.map((d) => {
        const on = d.value === value;
        return (
          <Pressable key={d.value} style={styles.wheelRow} onPress={() => pick(d.value)}>
            <Text style={[styles.wheelText, on ? styles.wheelTextOn : styles.wheelTextOff]} numberOfLines={1}>{d.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

interface Props {
  visible: boolean;
  initialDate?: Date | null;
  maximumDate?: Date;
  onConfirm: (d: Date) => void;
  onCancel: () => void;
  lang?: 'en' | 'hi';
}

export function GoldDatePicker({ visible, initialDate, maximumDate, onConfirm, onCancel, lang = 'en' }: Props) {
  const max = maximumDate || new Date();
  const maxY = max.getFullYear();
  const base = initialDate || new Date(2000, 0, 1);
  const [y, setY] = useState(base.getFullYear());
  const [m, setM] = useState(base.getMonth());
  const [d, setD] = useState(base.getDate());
  const MO = lang === 'hi' ? MO_HI : MO_EN;

  useEffect(() => {
    if (visible) {
      const b = initialDate || new Date(2000, 0, 1);
      setY(b.getFullYear()); setM(b.getMonth()); setD(b.getDate());
    }
  }, [visible]);

  // clamp day when month/year reduces the number of days (e.g. 31 -> Feb)
  const dim = daysIn(y, m);
  useEffect(() => { if (d > dim) setD(dim); }, [dim, d]);

  const years = useMemo(() => {
    const arr: WheelItem[] = [];
    for (let yr = maxY - 100; yr <= maxY; yr++) arr.push({ label: String(yr), value: yr });
    return arr;
  }, [maxY]);
  const months = useMemo(() => MO.map((label, i) => ({ label, value: i })), [lang]);
  const days = useMemo(() => Array.from({ length: dim }, (_, i) => ({ label: String(i + 1), value: i + 1 })), [dim]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View style={styles.card}>
          <View style={[styles.corner, { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 16 }]} />
          <View style={[styles.corner, { top: -1, right: -1, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 16 }]} />
          <View style={[styles.corner, { bottom: -1, left: -1, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 16 }]} />
          <View style={[styles.corner, { bottom: -1, right: -1, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 16 }]} />

          <Text style={styles.heading}>{lang === 'hi' ? 'जन्म तिथि चुनें' : 'SELECT DATE OF BIRTH'}</Text>

          {/* big readable preview of the chosen date */}
          <Text style={styles.preview}>{d} {MO[m]} {y}</Text>

          <View style={styles.colLabels}>
            <Text style={styles.colLabel}>{lang === 'hi' ? 'दिन' : 'Day'}</Text>
            <Text style={[styles.colLabel, { flex: 1.4 }]}>{lang === 'hi' ? 'महीना' : 'Month'}</Text>
            <Text style={styles.colLabel}>{lang === 'hi' ? 'साल' : 'Year'}</Text>
          </View>

          <View style={styles.wheels}>
            {/* center selection band */}
            <View pointerEvents="none" style={styles.band} />
            <View style={styles.col}><Wheel data={days} value={d} onChange={setD} /></View>
            <View style={[styles.col, { flex: 1.4 }]}><Wheel data={months} value={m} onChange={setM} /></View>
            <View style={styles.col}><Wheel data={years} value={y} onChange={setY} /></View>
          </View>

          <View style={styles.footer}>
            <Pressable onPress={onCancel} hitSlop={6} style={[styles.btn, styles.btnGhost]}><Text style={styles.btnGhostText}>{lang === 'hi' ? 'रद्द' : 'CANCEL'}</Text></Pressable>
            <Pressable onPress={() => { hPress(); onConfirm(new Date(y, m, Math.min(d, daysIn(y, m)))); }} hitSlop={6} style={styles.btn}>
              <LinearGradient colors={GRAD} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.btnOk}>
                <Text style={styles.btnOkText}>{lang === 'hi' ? 'ठीक है' : 'OK'}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(2,3,10,0.78)', alignItems: 'center', justifyContent: 'center', padding: 26 },
  card: { width: '100%', maxWidth: 340, backgroundColor: PANEL, borderRadius: 16, borderWidth: 1, borderColor: LINE, padding: 18, paddingTop: 16 },
  corner: { position: 'absolute', width: 16, height: 16, borderColor: GOLD },

  heading: { fontFamily: fonts.cinzel, fontSize: 12.5, letterSpacing: 2, color: GOLD_SOFT, textAlign: 'center', marginBottom: 8 },
  preview: { fontFamily: fonts.playfairBold, fontSize: 22, color: TEXT, textAlign: 'center', marginBottom: 14 },

  colLabels: { flexDirection: 'row', marginBottom: 2 },
  colLabel: { flex: 1, textAlign: 'center', fontFamily: fonts.interSemi, fontSize: 11, letterSpacing: 0.5, color: GOLD },

  wheels: { flexDirection: 'row', height: VISIBLE * ROW, position: 'relative' },
  band: { position: 'absolute', left: 0, right: 0, top: PAD * ROW, height: ROW, borderTopWidth: 1, borderBottomWidth: 1, borderColor: LINE, backgroundColor: 'rgba(244,195,74,0.10)', borderRadius: 8 },
  col: { flex: 1 },
  wheel: { height: VISIBLE * ROW },
  wheelRow: { height: ROW, alignItems: 'center', justifyContent: 'center' },
  wheelText: { fontFamily: fonts.inter, textAlign: 'center' },
  wheelTextOn: { fontFamily: fonts.interBold, fontSize: 19, color: GOLD_SOFT },
  wheelTextOff: { fontSize: 16, color: MUTE },

  footer: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginTop: 16 },
  btn: { borderRadius: 999, overflow: 'hidden' },
  btnGhost: { paddingHorizontal: 18, paddingVertical: 10, borderWidth: 1, borderColor: LINE, backgroundColor: 'rgba(0,0,0,0.4)' },
  btnGhostText: { fontFamily: fonts.interSemi, fontSize: 12.5, letterSpacing: 1, color: GOLD },
  btnOk: { paddingHorizontal: 26, paddingVertical: 11, alignItems: 'center', justifyContent: 'center' },
  btnOkText: { fontFamily: fonts.interBold, fontSize: 12.5, letterSpacing: 1, color: '#2a1a00' },
});
