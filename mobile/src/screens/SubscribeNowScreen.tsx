import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Image, TextInput, Dimensions } from 'react-native';
import { KeyboardAwareScroll, useKeyboardAwareFocus } from '../components/KeyboardAwareScroll';
import Svg, { Path, Circle, Polyline, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { fonts } from '../theme/tokens';
import { GradientText } from '../components/GradientText';
import { GoldDatePicker } from '../components/GoldDatePicker';
import { IMAGES } from '../assets/images';
import { hPress, hError, hSuccess } from '../lib/haptics';
import { useDialog } from '../components/DialogProvider';
import { useScreen, useBranding } from '../context/AppConfigProvider';
import { useT } from '../i18n/LanguageProvider';

/* exact palette from pages/subscribenow-page/styles.css */
const C = {
  bg: '#04081a',
  gold200: '#ffe289',
  gold300: '#f6c64a',
  line: 'rgba(214,162,56,0.55)',
  lineStrong: 'rgba(245,199,86,0.9)',
  fieldBg: 'rgba(0,0,0,0.65)',
  textMute: '#c9b88a',
  input: '#fff8e1',
};

/** soft golden radial halo (the depth/glow behind the logo + brand) */
const RadialGlow = ({ size, opacity = 0.45 }: { size: number; opacity?: number }) => (
  <Svg width={size} height={size} style={styles.glowAbs} pointerEvents="none">
    <Defs>
      <RadialGradient id="g" cx="50%" cy="50%" r="50%">
        <Stop offset="0%" stopColor="#f6c64a" stopOpacity={opacity} />
        <Stop offset="38%" stopColor="#f6c64a" stopOpacity={opacity * 0.45} />
        <Stop offset="70%" stopColor="#f6c64a" stopOpacity={0} />
      </RadialGradient>
    </Defs>
    <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#g)" />
  </Svg>
);

const ic = (n = 1.7) => ({ fill: 'none' as const, stroke: C.gold300, strokeWidth: n, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const });
const UserI = () => <Svg width={19} height={19} viewBox="0 0 24 24" {...ic()}><Circle cx={12} cy={8} r={4} /><Path d="M4 21c.7-4.4 4-7 8-7s7.3 2.6 8 7" /></Svg>;
const CalI = () => <Svg width={19} height={19} viewBox="0 0 24 24" {...ic()}><Path d="M3 4h18v18H3zM16 2v4M8 2v4M3 10h18" /></Svg>;
const PinI = () => <Svg width={19} height={19} viewBox="0 0 24 24" {...ic()}><Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><Circle cx={12} cy={10} r={3} /></Svg>;
const Chevron = () => <Svg width={13} height={13} viewBox="0 0 24 24" {...ic(2)}><Polyline points="6 9 12 15 18 9" /></Svg>;
const Crown = ({ c }: { c: string }) => <Svg width={18} height={18} viewBox="0 0 24 24" fill={c}><Path d="M2 8l4 6 5-7 5 7 4-4-2 12H4z" /></Svg>;
const Arrow = ({ c }: { c: string }) => <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><Path d="M4 12h15M13 6l6 6-6 6" /></Svg>;
const Gem = () => <Svg width={11} height={11} viewBox="0 0 24 24" fill={C.gold300}><Path d="M6 3h12l4 6-10 12L2 9z" /></Svg>;
const Sparkle = () => <Svg width={10} height={10} viewBox="0 0 24 24" fill={C.gold300}><Path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" /></Svg>;
const Shield = () => <Svg width={16} height={16} viewBox="0 0 24 24" {...ic(1.7)}><Path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" /><Polyline points="9 12 11 14 15 10" /></Svg>;
const StarI = () => <Svg width={16} height={16} viewBox="0 0 24 24" fill={C.gold300}><Path d="M12 2l3 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.9 21l1.2-6.8-5-4.9 6.9-1z" /></Svg>;
const Award = () => <Svg width={16} height={16} viewBox="0 0 24 24" {...ic(1.7)}><Circle cx={12} cy={8} r={5} /><Path d="M8.2 13 7 22l5-3 5 3-1.2-9" /></Svg>;

function Dash({ flip }: { flip?: boolean }) {
  return (
    <View style={styles.dashWrap}>
      <LinearGradient colors={['transparent', C.lineStrong, 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.dash} />
      <View style={[styles.dashArrow, flip ? { left: -3, borderTopWidth: 0, borderRightWidth: 0, borderBottomWidth: 1, borderLeftWidth: 1 } : { right: -3 }]} />
    </View>
  );
}

function SubField({ icon, label, value, onChangeText, placeholder, chevron, keyboardType, autoCapitalize, onPress }: any) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const lift = useKeyboardAwareFocus();
  const handlePress = onPress || (() => inputRef.current?.focus());
  return (
    <Pressable onPress={handlePress} style={[styles.field, { borderColor: focused && !onPress ? C.gold300 : C.line }]}>
      <View style={styles.fieldIcon}>{icon}</View>
      <View style={styles.fieldBody}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {onPress ? (
          <Text style={[styles.fieldInput, !value && { color: 'rgba(214,197,144,0.85)' }]} numberOfLines={1}>
            {value || placeholder}
          </Text>
        ) : (
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="rgba(214,197,144,0.85)"
            onFocus={() => { setFocused(true); lift(); }}
            onBlur={() => setFocused(false)}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            style={styles.fieldInput}
          />
        )}
      </View>
      {chevron && <View style={{ paddingHorizontal: 2 }}><Chevron /></View>}
    </Pressable>
  );
}

function CornerBrackets() {
  return (
    <>
      <View style={[styles.corner, { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 14 }]} />
      <View style={[styles.corner, { top: -1, right: -1, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 14 }]} />
      <View style={[styles.corner, { bottom: -1, left: -1, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 14 }]} />
      <View style={[styles.corner, { bottom: -1, right: -1, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 14 }]} />
    </>
  );
}

const BADGES = [
  { Icon: Shield, title: '100% Secure', sub: 'Your data is safe with us' },
  { Icon: StarI, title: 'Accurate Prediction', sub: 'Based on Vedic Astrology' },
  { Icon: Award, title: 'Premium Support', sub: 'Dedicated support for you' },
];

const PANEL_GRAD = ['rgba(22,14,42,0.72)', 'rgba(8,6,8,0.86)'] as const;
/* physical screen size — stays constant when the keyboard resizes the window,
   so the full-bleed background never rescales/jitters on input focus */
const SCREEN = Dimensions.get('screen');

export function SubscribeNowScreen({ navigation }: any) {
  const dialog = useDialog();
  const insets = useSafeAreaInsets();
  const sub = useScreen('subscribe'); // admin-managed content
  const brand = useBranding();
  const t = useT();
  const [n, setN] = useState('');
  const [dob, setDob] = useState('');
  const [dobDate, setDobDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [place, setPlace] = useState('');

  const confirmDate = (selected: Date) => {
    setShowPicker(false);
    setDobDate(selected);
    const d = String(selected.getDate()).padStart(2, '0');
    const m = String(selected.getMonth() + 1).padStart(2, '0');
    setDob(`${d} / ${m} / ${selected.getFullYear()}`);
  };

  const submit = () => {
    hPress();
    if (!n.trim() || !dob || !place.trim()) {
      hError();
      dialog('Incomplete details', 'Please enter your name, date of birth and place of birth to continue.');
      return;
    }
    hSuccess();
    navigation.navigate('Payment');
  };

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      <Image source={IMAGES.bgZodiac} style={[styles.bgImg, { width: SCREEN.width, height: SCREEN.height }]} resizeMode="cover" />
      <LinearGradient colors={['rgba(3,6,20,0.45)', 'rgba(3,6,20,0.68)', 'rgba(3,6,20,0.93)']} locations={[0, 0.45, 1]} style={[styles.bgOverlay, { width: SCREEN.width, height: SCREEN.height }]} />
      {/* top radial warm glow like the web bg */}
      <View style={styles.topGlow} pointerEvents="none"><RadialGlow size={420} opacity={0.22} /></View>

      <KeyboardAwareScroll
        contentContainerStyle={[styles.app, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 22 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO */}
        <View style={styles.hero}>
        <View style={styles.brand}>
          <GradientText style={styles.brandMain} colors={['#fff1b8', '#f3c95b', '#b6781a']}>{(brand.appName || 'Shree Yantra').toUpperCase()}</GradientText>
          <View style={styles.brandDivider}>
            <Dash flip />
            <Text style={styles.brandSub}>{(brand.tagline || 'Astrology').toUpperCase()}</Text>
            <Dash />
          </View>
        </View>

        <View style={styles.swastikWrap}>
          <RadialGlow size={300} opacity={0.5} />
          <Image source={IMAGES.swastik} style={styles.swastik} resizeMode="contain" />
        </View>

        <Text style={styles.tagline}>Discover the path of Divine Guidance{'\n'}with Ancient Vedic Wisdom</Text>

        <View style={styles.ornament}>
          <View style={styles.ornLine} />
          <Gem />
          <View style={styles.ornLine} />
        </View>
        </View>

        {/* PANEL */}
        <View style={styles.panel}>
          <LinearGradient colors={PANEL_GRAD} style={styles.panelBg} />
          <CornerBrackets />
          <View style={styles.panelInner} pointerEvents="none" />
          <View style={styles.form}>
            <SubField icon={<UserI />} label={t('profile.fullName', 'Full Name')} value={n} onChangeText={setN} placeholder="Enter your name" autoCapitalize="words" />
            <SubField icon={<CalI />} label={t('profile.dob', 'Date of Birth')} value={dob} placeholder="DD / MM / YYYY" chevron onPress={() => setShowPicker(true)} />
            <SubField icon={<PinI />} label={t('profile.place', 'Place of Birth')} value={place} onChangeText={setPlace} placeholder="Enter your place of birth" autoCapitalize="words" />

            <Pressable onPress={submit} style={({ pressed }) => [styles.ctaWrap, pressed && { transform: [{ scale: 0.985 }], opacity: 0.97 }]}>
              <LinearGradient colors={['#fff1ad', '#f4c34a', '#b67a16']} locations={[0, 0.45, 1]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.cta}>
                <Crown c="#1a1000" />
                <Text style={styles.ctaText}>{t('sub.cta', 'SUBSCRIBE NOW')}</Text>
                <Arrow c="#1a1000" />
              </LinearGradient>
            </Pressable>

            <View style={styles.note}>
              <Sparkle />
              <Text style={styles.noteText}>{sub.t('subtitle', 'Unlock Premium Predictions & Remedies')}</Text>
              <Sparkle />
            </View>
          </View>
        </View>

      </KeyboardAwareScroll>

      <GoldDatePicker
        visible={showPicker}
        initialDate={dobDate}
        maximumDate={new Date()}
        onConfirm={confirmDate}
        onCancel={() => setShowPicker(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bgImg: { position: 'absolute', top: 0, left: 0, opacity: 0.9 },
  bgOverlay: { position: 'absolute', top: 0, left: 0 },
  glowAbs: { position: 'absolute', alignSelf: 'center' },
  topGlow: { position: 'absolute', top: -120, left: 0, right: 0, alignItems: 'center' },
  app: { paddingHorizontal: 22, width: '100%', maxWidth: 460, alignSelf: 'center', alignItems: 'stretch' },

  hero: { alignItems: 'center' },
  brand: { alignItems: 'center', gap: 5, marginTop: 0, marginBottom: 8 },
  brandMain: { fontFamily: fonts.cinzel, fontSize: 33, letterSpacing: 3, textAlign: 'center', lineHeight: 38 },
  brandDivider: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandSub: { fontFamily: fonts.cinzelSemi, fontSize: 15, letterSpacing: 7, color: C.gold200 },
  dashWrap: { width: 28, height: 8, justifyContent: 'center' },
  dash: { height: 1, width: 28 },
  dashArrow: { position: 'absolute', top: 1, width: 6, height: 6, borderTopWidth: 1, borderRightWidth: 1, borderColor: C.lineStrong, transform: [{ rotate: '45deg' }] },

  swastikWrap: { width: 184, maxWidth: '54%', aspectRatio: 1, alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginTop: 2, marginBottom: 4 },
  swastik: { width: '88%', height: '88%' },

  tagline: { fontFamily: fonts.cormorantR, fontSize: 16.5, lineHeight: 23, color: '#f3e6c2', textAlign: 'center', marginTop: 2 },

  ornament: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 12, marginBottom: 18 },
  ornLine: { width: 36, height: 1, backgroundColor: C.line },

  panel: { position: 'relative', padding: 16, paddingTop: 22, paddingBottom: 24, borderWidth: 1, borderColor: C.line, borderRadius: 16, overflow: 'hidden' },
  panelBg: { ...StyleSheet.absoluteFillObject },
  panelInner: { position: 'absolute', top: 6, left: 6, right: 6, bottom: 6, borderWidth: 1, borderColor: 'rgba(245,199,86,0.18)', borderRadius: 12 },
  corner: { position: 'absolute', width: 18, height: 18, borderColor: C.gold300, zIndex: 2 },

  form: { gap: 12 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10, paddingHorizontal: 16, backgroundColor: C.fieldBg, borderWidth: 1, borderRadius: 12 },
  fieldFocus: { shadowColor: '#d6a238', shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
  fieldIcon: { width: 24, alignItems: 'center' },
  fieldBody: { flex: 1, minWidth: 0 },
  fieldLabel: { fontFamily: fonts.interMed, fontSize: 12, color: C.textMute, letterSpacing: 0.3 },
  fieldInput: { fontFamily: fonts.inter, fontSize: 15, color: C.input, paddingTop: 2, paddingVertical: 2 },

  ctaWrap: { marginTop: 8, borderRadius: 999, shadowColor: '#f0b43a', shadowOpacity: 0.5, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, paddingVertical: 15, paddingHorizontal: 22, borderRadius: 999 },
  ctaText: { fontFamily: fonts.interBold, fontSize: 16, letterSpacing: 2, color: '#2a1a00' },

  note: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10 },
  noteText: { fontFamily: fonts.cormorantR, fontSize: 16, color: '#f0dca0', letterSpacing: 0.3 },

  badges: { position: 'relative', flexDirection: 'row', paddingVertical: 18, paddingHorizontal: 10, borderWidth: 1, borderColor: C.line, borderRadius: 14, overflow: 'hidden' },
  badgesInner: { position: 'absolute', top: 6, left: 6, right: 6, bottom: 6, borderWidth: 1, borderColor: 'rgba(245,199,86,0.16)', borderRadius: 10 },
  badge: { flex: 1, alignItems: 'center', paddingHorizontal: 6 },
  badgeDivider: { position: 'absolute', left: -1, top: '18%', bottom: '18%', width: 1, backgroundColor: C.line },
  badgeIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(245,199,86,0.10)', borderWidth: 1, borderColor: 'rgba(245,199,86,0.35)', marginBottom: 6 },
  badgeTitle: { fontFamily: fonts.interSemi, fontSize: 12.5, color: '#fff5d6', letterSpacing: 0.3, textAlign: 'center', marginBottom: 4, lineHeight: 15 },
  badgeSub: { fontFamily: fonts.inter, fontSize: 11, color: '#b9a978', textAlign: 'center', lineHeight: 15 },
});
