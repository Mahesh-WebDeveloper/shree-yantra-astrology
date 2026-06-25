import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fonts } from '../theme/tokens';
import { hSelect, hPress } from '../lib/haptics';

/* Black & gold wheel time picker — Hour | Minute | AM/PM scrollable columns.
   Mirrors GoldDatePicker exactly: snap-to-row wheels, centre selection band,
   haptic tick on every snap, animated slide on tap. */
const GOLD = '#f4c34a';
const GOLD_SOFT = '#ffe289';
const LINE = 'rgba(214,162,56,0.5)';
const TEXT = '#f6e7c8';
const MUTE = 'rgba(143,128,89,0.85)';
const PANEL = '#0b0913';
const GRAD = ['#fff1ad', '#f4c34a', '#b67a16'] as const;

const pad = (n: number) => (n < 10 ? '0' : '') + n;
const ROW = 44;
const VISIBLE = 5;          // odd — centre row is the selection
const PAD = Math.floor(VISIBLE / 2);

interface WheelItem { label: string; value: number }
function Wheel({ data, value, onChange }: { data: WheelItem[]; value: number; onChange: (v: number) => void }) {
  const ref = useRef<ScrollView>(null);
  const idx = Math.max(0, data.findIndex((d) => d.value === value));

  // keep the wheel aligned when value/length changes externally
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

  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => commitOffset(e.nativeEvent.contentOffset.y);

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.y / ROW);
    const c = Math.max(0, Math.min(data.length - 1, i));
    const v = data[c]?.value;
    if (v != null && v !== value) { hSelect(); onChange(v); }
  };

  const pick = (v: number) => {
    const nextIdx = Math.max(0, data.findIndex((x) => x.value === v));
    hSelect();
    onChange(v);
    requestAnimationFrame(() => ref.current?.scrollTo({ y: nextIdx * ROW, animated: true }));
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

/** Parse "06:42 AM" / "6:42" / "18:42" → { h:1-12, m, ap }. */
function parse(value: string): { h: number; m: number; ap: 'AM' | 'PM' } {
  const mt = (value || '').match(/(\d{1,2})\s*:\s*(\d{1,2})\s*(AM|PM)?/i);
  let h = 8, m = 0; let ap: 'AM' | 'PM' = 'AM';
  if (mt) {
    h = parseInt(mt[1], 10);
    m = Math.min(59, parseInt(mt[2], 10) || 0);
    if (mt[3]) ap = mt[3].toUpperCase() as 'AM' | 'PM';
    else ap = h >= 12 ? 'PM' : 'AM';
    if (h === 0) h = 12;
    if (h > 12) h -= 12;
  }
  return { h, m, ap };
}

interface Props {
  visible: boolean;
  value: string;
  onConfirm: (v: string) => void;
  onCancel: () => void;
  lang?: 'en' | 'hi';
}

export function GoldTimePicker({ visible, value, onConfirm, onCancel, lang = 'en' }: Props) {
  const init = useMemo(() => parse(value), [value]);
  const [h, setH] = useState(init.h);
  const [m, setM] = useState(init.m);
  const [ap, setAp] = useState<'AM' | 'PM'>(init.ap);

  useEffect(() => {
    if (visible) { const p = parse(value); setH(p.h); setM(p.m); setAp(p.ap); }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const hours = useMemo<WheelItem[]>(() => Array.from({ length: 12 }, (_, i) => ({ label: pad(i + 1), value: i + 1 })), []);
  const minutes = useMemo<WheelItem[]>(() => Array.from({ length: 60 }, (_, i) => ({ label: pad(i), value: i })), []);
  const ampm = useMemo<WheelItem[]>(() => [{ label: 'AM', value: 0 }, { label: 'PM', value: 1 }], []);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View style={styles.card}>
          <View style={[styles.corner, { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 16 }]} />
          <View style={[styles.corner, { top: -1, right: -1, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 16 }]} />
          <View style={[styles.corner, { bottom: -1, left: -1, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 16 }]} />
          <View style={[styles.corner, { bottom: -1, right: -1, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 16 }]} />

          <Text style={styles.heading}>{lang === 'hi' ? 'जन्म समय चुनें' : 'SELECT TIME OF BIRTH'}</Text>

          {/* big readable preview of the chosen time */}
          <Text style={styles.preview}>{pad(h)}:{pad(m)} <Text style={{ color: GOLD_SOFT }}>{ap}</Text></Text>

          <View style={styles.colLabels}>
            <Text style={styles.colLabel}>{lang === 'hi' ? 'घंटा' : 'Hour'}</Text>
            <Text style={styles.colLabel}>{lang === 'hi' ? 'मिनट' : 'Min'}</Text>
            <Text style={styles.colLabel}>AM/PM</Text>
          </View>

          <View style={styles.wheels}>
            {/* centre selection band */}
            <View pointerEvents="none" style={styles.band} />
            <View style={styles.col}><Wheel data={hours} value={h} onChange={setH} /></View>
            <View style={styles.col}><Wheel data={minutes} value={m} onChange={setM} /></View>
            <View style={styles.col}><Wheel data={ampm} value={ap === 'AM' ? 0 : 1} onChange={(v) => setAp(v === 0 ? 'AM' : 'PM')} /></View>
          </View>

          <View style={styles.footer}>
            <Pressable onPress={onCancel} hitSlop={6} style={[styles.btn, styles.btnGhost]}><Text style={styles.btnGhostText}>{lang === 'hi' ? 'रद्द' : 'CANCEL'}</Text></Pressable>
            <Pressable onPress={() => { hPress(); onConfirm(`${pad(h)}:${pad(m)} ${ap}`); }} hitSlop={6} style={styles.btn}>
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
  preview: { fontFamily: fonts.playfairBold, fontSize: 22, color: TEXT, textAlign: 'center', marginBottom: 14, letterSpacing: 1 },

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
