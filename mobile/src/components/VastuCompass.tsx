import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Polygon, Text as SvgText } from 'react-native-svg';
import { Magnetometer } from 'expo-sensors';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';
import { useLang } from '../i18n/LanguageProvider';
import { hSuccess, hTap } from '../lib/haptics';

export type CompassDir = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

const DIR_INFO: Record<CompassDir, { en: string; hi: string }> = {
  N: { en: 'North', hi: 'उत्तर' }, NE: { en: 'North-East', hi: 'ईशान (उ-पू)' },
  E: { en: 'East', hi: 'पूर्व' }, SE: { en: 'South-East', hi: 'आग्नेय (द-पू)' },
  S: { en: 'South', hi: 'दक्षिण' }, SW: { en: 'South-West', hi: 'नैऋत्य (द-प)' },
  W: { en: 'West', hi: 'पश्चिम' }, NW: { en: 'North-West', hi: 'वायव्य (उ-प)' },
};
const dirFromHeading = (deg: number): CompassDir => {
  const dirs: CompassDir[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(((deg % 360) + 360) % 360 / 45) % 8];
};

/**
 * Simple phone compass for Vastu — made for users who do NOT know their directions.
 * Big live dial + huge direction name; the user just stands at the spot (e.g. inside the
 * main door facing OUT), holds the phone flat, and taps "use this direction".
 */
export function VastuCompass({ visible, title, instruction, onPick, onClose }: {
  visible: boolean;
  title: string;                       // e.g. "मुख्य द्वार की दिशा"
  instruction: string;                 // context line, plain language
  onPick: (dir: CompassDir) => void;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const hi = lang === 'hi';
  const [heading, setHeading] = useState<number | null>(null);
  const [available, setAvailable] = useState(true);
  const smooth = useRef<number | null>(null);

  useEffect(() => {
    if (!visible) return;
    let sub: { remove: () => void } | null = null;
    let on = true;
    (async () => {
      const ok = await Magnetometer.isAvailableAsync().catch(() => false);
      if (!on) return;
      if (!ok) { setAvailable(false); return; }
      setAvailable(true);
      Magnetometer.setUpdateInterval(120);
      sub = Magnetometer.addListener(({ x, y }) => {
        // heading of the phone's TOP edge, 0° = North (phone held flat)
        let a = Math.atan2(y, x) * (180 / Math.PI);
        if (a < 0) a += 360;
        const h = (a - 90 + 360) % 360;
        // circular low-pass to stop jitter
        const prev = smooth.current;
        if (prev == null) smooth.current = h;
        else {
          let d = h - prev;
          if (d > 180) d -= 360; else if (d < -180) d += 360;
          smooth.current = (prev + d * 0.25 + 360) % 360;
        }
        setHeading(smooth.current);
      });
    })();
    return () => { on = false; sub?.remove(); smooth.current = null; };
  }, [visible]);

  const hDeg = heading == null ? 0 : heading;
  const dir = heading == null ? null : dirFromHeading(hDeg);
  const gold = theme.gold1;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.isDark ? '#0d0a04' : '#fffdf6', borderColor: theme.gold2 + '66' }]}>
          <Text style={[styles.title, { color: theme.gold1 }]}>🧭 {title}</Text>
          <Text style={[styles.instr, { color: theme.textSoft }]}>{instruction}</Text>
          <Text style={[styles.instr2, { color: theme.textMuted }]}>
            {hi ? '📱 फोन को छाती के सामने, ज़मीन के समानांतर बिल्कुल सीधा पकड़ें। सुई अपने-आप दिशा बताएगी।'
                : '📱 Hold the phone flat in front of your chest, parallel to the ground. The needle shows the direction automatically.'}
          </Text>

          {!available ? (
            <Text style={[styles.noSensor, { color: '#e06a5a' }]}>
              {hi ? 'इस फोन में कंपास सेंसर नहीं मिला — कृपया दिशा हाथ से चुनें (सुबह सूरज जिधर उगता है वही पूर्व है)।'
                  : 'No compass sensor found on this phone — please pick the direction manually (the morning sun rises in the East).'}
            </Text>
          ) : (
            <>
              {/* dial rotates opposite to heading so N stays true */}
              <View style={styles.dialWrap}>
                <Svg width={230} height={230} viewBox="0 0 200 200">
                  <G rotation={-hDeg} origin="100,100">
                    <Circle cx={100} cy={100} r={92} fill="none" stroke={theme.gold2} strokeWidth={2} />
                    <Circle cx={100} cy={100} r={72} fill="none" stroke={theme.gold2} strokeWidth={0.8} opacity={0.5} />
                    {Array.from({ length: 8 }).map((_, i) => {
                      const a = (i * 45 - 90) * (Math.PI / 180);
                      const lbl = (['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as CompassDir[])[i];
                      return (
                        <G key={i}>
                          <Line x1={100 + 84 * Math.cos(a)} y1={100 + 84 * Math.sin(a)} x2={100 + 92 * Math.cos(a)} y2={100 + 92 * Math.sin(a)} stroke={gold} strokeWidth={i % 2 === 0 ? 2.4 : 1.2} />
                          <SvgText x={100 + 60 * Math.cos(a)} y={100 + 60 * Math.sin(a) + 4} textAnchor="middle" fontSize={i % 2 === 0 ? 13 : 9} fontWeight="700" fill={lbl === 'N' ? '#e06a5a' : gold}>{hi ? DIR_INFO[lbl].hi.split(' ')[0] : lbl}</SvgText>
                        </G>
                      );
                    })}
                  </G>
                  {/* fixed needle = where the phone's top points */}
                  <Polygon points="100,18 92,52 108,52" fill={gold} />
                  <Circle cx={100} cy={100} r={7} fill={gold} />
                </Svg>
              </View>

              <View style={[styles.readout, { borderColor: theme.gold2 + '55', backgroundColor: theme.isDark ? 'rgba(233,184,80,0.08)' : 'rgba(255,247,224,0.9)' }]}>
                <Text style={[styles.readDir, { color: theme.gold1 }]}>{dir ? (hi ? DIR_INFO[dir].hi : DIR_INFO[dir].en) : '—'}</Text>
                <Text style={[styles.readSub, { color: theme.textMuted }]}>{dir ? `${hi ? DIR_INFO[dir].en : DIR_INFO[dir].hi} · ${Math.round(hDeg)}°` : (hi ? 'सेंसर पढ़ा जा रहा है…' : 'Reading sensor…')}</Text>
              </View>
              <Text style={[styles.tip, { color: theme.textMuted }]}>
                {hi ? 'सुई अटक रही हो तो फोन को हवा में 8 (आठ) के आकार में 2-3 बार घुमाएँ।'
                    : 'If the needle sticks, wave the phone in a figure-8 motion 2-3 times.'}
              </Text>
            </>
          )}

          <View style={styles.btnRow}>
            <Pressable onPress={() => { hTap(); onClose(); }} style={[styles.btn, { borderColor: theme.cardBorder }]}>
              <Text style={[styles.btnTxt, { color: theme.textMuted }]}>{hi ? 'रद्द करें' : 'Cancel'}</Text>
            </Pressable>
            <Pressable
              disabled={!dir}
              onPress={() => { if (dir) { hSuccess(); onPick(dir); } }}
              style={[styles.btn, styles.btnGold, { backgroundColor: dir ? theme.gold1 : theme.cardBorder }]}
            >
              <Text style={[styles.btnTxt, { color: '#1a1206', fontFamily: fonts.interBold }]}>
                ✓ {dir ? (hi ? `${DIR_INFO[dir].hi.split(' ')[0]} चुनें` : `Use ${DIR_INFO[dir].en}`) : (hi ? 'रुकें…' : 'Hold on…')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  sheet: { width: '100%', maxWidth: 380, borderWidth: 1, borderRadius: 24, padding: 18, alignItems: 'center' },
  title: { fontFamily: fonts.playfairBold, fontSize: 19, textAlign: 'center' },
  instr: { fontFamily: fonts.interSemi, fontSize: 12.8, lineHeight: 18.5, textAlign: 'center', marginTop: 8 },
  instr2: { fontFamily: fonts.inter, fontSize: 11.6, lineHeight: 17, textAlign: 'center', marginTop: 6 },
  dialWrap: { marginTop: 10 },
  readout: { borderWidth: 1, borderRadius: 16, paddingVertical: 10, paddingHorizontal: 24, alignItems: 'center', marginTop: 4 },
  readDir: { fontFamily: fonts.playfairBold, fontSize: 26 },
  readSub: { fontFamily: fonts.inter, fontSize: 11.5, marginTop: 2 },
  tip: { fontFamily: fonts.inter, fontSize: 10.6, lineHeight: 15, textAlign: 'center', marginTop: 8 },
  noSensor: { fontFamily: fonts.interSemi, fontSize: 12.5, lineHeight: 18, textAlign: 'center', marginVertical: 18 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 14, alignSelf: 'stretch' },
  btn: { flex: 1, borderWidth: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  btnGold: { borderWidth: 0 },
  btnTxt: { fontFamily: fonts.interSemi, fontSize: 13.5 },
});
