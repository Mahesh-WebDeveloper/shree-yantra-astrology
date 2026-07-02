import React, { useRef, useState } from 'react';
import { Animated, Dimensions, Modal, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLang } from '../i18n/LanguageProvider';
import { hTap } from '../lib/haptics';
import { Blueprint } from '../lib/vastuBlueprint';
import { BlueprintCanvas } from './BlueprintCanvas';

/**
 * Fullscreen blueprint viewer — pinch to zoom, one-finger pan, rotate-to-landscape,
 * +/−/reset controls. Pure PanResponder (no extra native deps).
 */
export function BlueprintViewer({ bp, visible, onClose }: { bp: Blueprint; visible: boolean; onClose: () => void }) {
  const { lang } = useLang();
  const hi = lang === 'hi';
  const [landscape, setLandscape] = useState(false);
  const [mandala, setMandala] = useState(false);

  const scale = useRef(new Animated.Value(1)).current;
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const cur = useRef({ scale: 1, x: 0, y: 0 });
  const gest = useRef({ startScale: 1, startDist: 0, startX: 0, startY: 0 });

  const clampScale = (v: number) => Math.max(0.6, Math.min(7, v));
  const setScale = (v: number) => { cur.current.scale = clampScale(v); scale.setValue(cur.current.scale); };

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3,
      onPanResponderGrant: () => {
        gest.current.startScale = cur.current.scale;
        gest.current.startDist = 0;
        gest.current.startX = cur.current.x;
        gest.current.startY = cur.current.y;
      },
      onPanResponderMove: (evt, g) => {
        const t = evt.nativeEvent.touches;
        if (t.length >= 2) {
          const dx = t[0].pageX - t[1].pageX; const dy = t[0].pageY - t[1].pageY;
          const dist = Math.hypot(dx, dy);
          if (!gest.current.startDist) { gest.current.startDist = dist; gest.current.startScale = cur.current.scale; return; }
          setScale(gest.current.startScale * (dist / gest.current.startDist));
        } else {
          gest.current.startDist = 0;
          cur.current.x = gest.current.startX + g.dx;
          cur.current.y = gest.current.startY + g.dy;
          pan.setValue({ x: cur.current.x, y: cur.current.y });
        }
      },
      onPanResponderRelease: () => { gest.current.startDist = 0; },
    })
  ).current;

  const reset = () => {
    hTap();
    cur.current = { scale: 1, x: 0, y: 0 };
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: true }),
    ]).start();
  };

  const { width: SW, height: SH } = Dimensions.get('window');
  const contentW = landscape ? SH * 0.9 : SW * 0.96;
  const contentH = landscape ? SW * 0.86 : SH * 0.7;

  const Btn = ({ label, onPress }: { label: string; onPress: () => void }) => (
    <Pressable onPress={onPress} style={styles.ctl}><Text style={styles.ctlTxt}>{label}</Text></Pressable>
  );

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.wrap}>
        <View style={styles.canvasArea} {...responder.panHandlers}>
          <Animated.View
            style={{
              width: contentW,
              transform: [
                { translateX: pan.x }, { translateY: pan.y },
                { scale },
                ...(landscape ? [{ rotate: '90deg' }] : []),
              ],
            }}
          >
            <BlueprintCanvas bp={bp} selected={null} showMandala={mandala} height={contentH} />
          </Animated.View>
        </View>

        <Text style={styles.hint}>{hi ? 'दो उँगलियों से ज़ूम करें · एक उँगली से खिसकाएँ' : 'Pinch to zoom · drag to move'}</Text>
        <View style={styles.ctlRow}>
          <Btn label="＋" onPress={() => { hTap(); setScale(cur.current.scale * 1.4); }} />
          <Btn label="−" onPress={() => { hTap(); setScale(cur.current.scale / 1.4); }} />
          <Btn label="⟳" onPress={reset} />
          <Pressable onPress={() => { hTap(); setMandala((v) => !v); }} style={[styles.ctl, mandala && styles.ctlOn]}><Text style={[styles.ctlTxt, mandala && { color: '#1a1206' }]}>🕉</Text></Pressable>
          <Btn label={landscape ? '▭' : '▯'} onPress={() => { hTap(); setLandscape((v) => !v); reset(); }} />
          <Pressable onPress={() => { hTap(); onClose(); }} style={[styles.ctl, styles.close]}><Text style={[styles.ctlTxt, { color: '#1a1206' }]}>✕</Text></Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#080604', alignItems: 'center', justifyContent: 'center' },
  canvasArea: { flex: 1, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  hint: { color: 'rgba(252,232,168,0.55)', fontSize: 11.5, marginBottom: 8 },
  ctlRow: { flexDirection: 'row', gap: 12, paddingBottom: 26 },
  ctl: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: 'rgba(233,184,80,0.6)', backgroundColor: 'rgba(233,184,80,0.10)', alignItems: 'center', justifyContent: 'center' },
  ctlTxt: { color: '#e9b850', fontSize: 19, fontWeight: '700' },
  ctlOn: { backgroundColor: '#e9b850' },
  close: { backgroundColor: '#e9b850' },
});
