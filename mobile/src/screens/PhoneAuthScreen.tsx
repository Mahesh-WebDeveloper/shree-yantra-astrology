import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Keyboard } from 'react-native';
import { KeyboardAwareScroll } from '../components/KeyboardAwareScroll';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';
import { GradientText } from '../components/GradientText';
import { CosmicBackground } from '../components/CosmicBackground';
import { TextField } from '../components/TextField';
import { OmGlyph } from '../components/icons/OmGlyph';
import { hPress, hError, hSuccess, hTap } from '../lib/haptics';
import { useDialog } from '../components/DialogProvider';
import { requestOtp, verifyOtp, googleLogin } from '../lib/api';
import { saveAuth } from '../lib/auth';
import { registerForPush } from '../lib/notifications';
import { track } from '../lib/analytics';
import { useT, useLang } from '../i18n/LanguageProvider';

// Google web OAuth client ID (audience the backend verifies against)
const GOOGLE_WEB_CLIENT_ID = '946405354801-crhr95aq5fq7nlhhl8r0i6nr4aveoqme.apps.googleusercontent.com';

const PhoneIcon = ({ color }: { color: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M22 16.92V21a1 1 0 0 1-1.11 1A19.94 19.94 0 0 1 2 4.11 1 1 0 0 1 3 3h4a1 1 0 0 1 1 .75l1.5 6a1 1 0 0 1-.27 1L7 13a16 16 0 0 0 4 4l2.25-2.23a1 1 0 0 1 1-.27l6 1.5A1 1 0 0 1 22 17z" />
  </Svg>
);

const GoogleG = () => (
  <Svg width={20} height={20} viewBox="0 0 48 48">
    <Path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8a12 12 0 1 1 7.9-21l5.7-5.7A20 20 0 1 0 24 44c11 0 19.5-8 19.5-20 0-1.3-.1-2.3-.4-3.5z" />
    <Path fill="#FF3D00" d="M6.3 14.7l6.6 4.8A12 12 0 0 1 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 0 0 6.3 14.7z" />
    <Path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A12 12 0 0 1 12.7 28l-6.5 5A20 20 0 0 0 24 44z" />
    <Path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C39.9 35.6 44 30.5 44 24c0-1.3-.1-2.3-.4-3.5z" />
  </Svg>
);

const OTP_LEN = 6;

export function PhoneAuthScreen({ navigation }: any) {
  const { theme } = useTheme();
  const dialog = useDialog();
  const insets = useSafeAreaInsets();

  const t = useT();
  const { lang } = useLang();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [secs, setSecs] = useState(0); // resend countdown
  const otpRef = useRef<TextInput>(null);

  useEffect(() => {
    if (secs <= 0) return;
    const t = setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secs]);

  const digits = phone.replace(/\D/g, '');

  const sendOtp = async () => {
    hPress();
    if (digits.length < 10) { hError(); dialog(lang === 'hi' ? 'मोबाइल नंबर' : 'Mobile Number', lang === 'hi' ? 'कृपया 10-अंकीय मोबाइल नंबर दर्ज करें।' : 'Please enter a 10-digit mobile number.'); return; }
    if (busy) return;
    setBusy(true);
    try {
      const r = await requestOtp('+91' + digits.slice(-10));
      setDevCode(r.devCode || null);
      setCode('');
      setStep('otp');
      setSecs(30);
      hSuccess();
      setTimeout(() => otpRef.current?.focus(), 350);
    } catch (e: any) {
      hError();
      dialog('Could not send OTP', e?.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const verify = async (full: string) => {
    if (busy) return;
    Keyboard.dismiss();
    setBusy(true);
    try {
      const r = await verifyOtp({ phone: '+91' + digits.slice(-10), code: full });
      await saveAuth(r.token, r.user);
      registerForPush(); // register device for push (prompts permission)
      track(r.isNew ? 'register' : 'login', undefined, { method: 'otp' });
      hSuccess();
      // NEW registration → language → subscription → birth-details onboarding.
      // Existing user: profile adhura (DOB nahi) → birth-details, warna seedha app.
      navigation.replace(r.isNew ? 'Subscribe' : (r.profileComplete ? 'Main' : 'BirthDetails'));
    } catch (e: any) {
      hError();
      setCode('');
      dialog('Verification failed', e?.message || 'Incorrect OTP — please try again.');
    } finally {
      setBusy(false);
    }
  };

  const onOtpChange = (t: string) => {
    const clean = t.replace(/\D/g, '').slice(0, OTP_LEN);
    setCode(clean);
    if (clean.length === OTP_LEN) verify(clean);
  };

  // Google one-tap sign-in. The native module isn't in Expo Go → lazy-require + guard,
  // so testing in Expo Go shows a friendly note instead of crashing. Works in the built APK.
  const onGoogle = async () => {
    hTap();
    let GoogleSignin: any;
    try {
      GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
    } catch (_) { GoogleSignin = null; }
    if (!GoogleSignin) {
      dialog(lang === 'hi' ? 'Google साइन-इन' : 'Google Sign-In', lang === 'hi' ? 'Google लॉगिन ऐप के बने हुए APK में चलता है (Expo Go में नहीं)।' : 'Google sign-in works in the built app (not in Expo Go).');
      return;
    }
    try {
      setBusy(true);
      GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID, offlineAccess: false });
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const info: any = await GoogleSignin.signIn();
      const idToken = info?.data?.idToken || info?.idToken;
      if (!idToken) throw new Error('No Google token');
      const r = await googleLogin(idToken);
      await saveAuth(r.token, r.user);
      registerForPush(); // register device for push (prompts permission)
      track(r.isNew ? 'register' : 'login', undefined, { method: 'google' });
      hSuccess();
      navigation.replace(r.isNew ? 'Subscribe' : (r.profileComplete ? 'Main' : 'BirthDetails'));
    } catch (e: any) {
      const cancelled = e?.code === '-5' || /cancel/i.test(String(e?.message || e?.code || ''));
      if (!cancelled) { hError(); dialog(lang === 'hi' ? 'Google साइन-इन विफल' : 'Google Sign-In failed', e?.message || (lang === 'hi' ? 'दोबारा प्रयास करें।' : 'Please try again.')); }
    } finally {
      setBusy(false);
    }
  };

  const gold = theme.gold1;

  return (
    <LinearGradient colors={theme.bgGradient} style={styles.fill}>
      <CosmicBackground />
      <KeyboardAwareScroll
        contentContainerStyle={[styles.shell, { paddingTop: insets.top + 18, paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* back — only on the OTP step (phone step is the stack root, so back would be a no-op) */}
        {step === 'otp' && (
          <Pressable
            onPress={() => { hTap(); setStep('phone'); }}
            style={[styles.back, { borderColor: 'rgba(201,150,46,0.4)', backgroundColor: theme.isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,250,240,0.7)' }]}
            hitSlop={6}
          >
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={gold} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M19 12H5M12 19l-7-7 7-7" /></Svg>
          </Pressable>
        )}

        {/* hero */}
        <View style={styles.hero}>
          <View style={[styles.omCircle, { borderColor: 'rgba(201,150,46,0.5)' }]}>
            <LinearGradient colors={theme.isDark ? ['#1a1230', '#050511'] : ['#fff3d6', '#f1e1ba']} start={{ x: 0.3, y: 0.3 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <OmGlyph size={48} />
          </View>
          <GradientText style={styles.h1}>{step === 'phone' ? t('auth.enterMobile', 'ENTER MOBILE') : t('auth.verifyOtp', 'VERIFY OTP')}</GradientText>
          <Text style={[styles.lead, { color: theme.textSoft }]}>
            {step === 'phone'
              ? t('auth.enterMobileSub', 'We’ll send a one-time code to verify your number')
              : `${t('auth.otpSentTo', 'Code sent to')} +91 ${digits.slice(-10)}`}
          </Text>
        </View>

        {step === 'phone' ? (
          <View style={{ gap: 16, marginTop: 8 }}>
            <TextField
              icon={<PhoneIcon color={theme.gold2} />}
              label={t('auth.mobileNumber', 'Mobile Number')}
              value={phone}
              onChangeText={setPhone}
              placeholder="98XXXXXXXX"
              keyboardType="phone-pad"
            />
            <Pressable onPress={sendOtp} disabled={busy} style={({ pressed }) => [styles.btnShadow, pressed && styles.pressed]}>
              <LinearGradient colors={['#fce8a8', '#e9b850', '#b87f1a']} locations={[0, 0.45, 1]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.primaryBtn}>
                <Text style={styles.primaryText}>{busy ? t('auth.sending', 'SENDING…') : t('auth.sendOtp', 'SEND OTP')}</Text>
              </LinearGradient>
            </Pressable>
            <Text style={[styles.terms, { color: theme.textMuted }]}>
              {t('auth.terms', 'By continuing you agree to our Terms & Privacy Policy.')}
            </Text>
          </View>
        ) : (
          <View style={{ gap: 18, marginTop: 8 }}>
            {/* 6-box OTP — ek hidden input poori value capture karta hai */}
            <Pressable onPress={() => otpRef.current?.focus()} style={styles.otpRow}>
              {Array.from({ length: OTP_LEN }).map((_, i) => {
                const filled = i < code.length;
                const active = i === code.length;
                return (
                  <View
                    key={i}
                    style={[
                      styles.otpBox,
                      {
                        borderColor: active ? gold : (theme.isDark ? 'rgba(201,150,46,0.35)' : 'rgba(176,115,22,0.3)'),
                        backgroundColor: theme.isDark ? 'rgba(0,0,0,0.55)' : '#fffdf7',
                      },
                      active && styles.otpBoxActive,
                    ]}
                  >
                    <Text style={[styles.otpDigit, { color: theme.text }]}>{filled ? code[i] : ''}</Text>
                  </View>
                );
              })}
            </Pressable>
            <TextInput
              ref={otpRef}
              value={code}
              onChangeText={onOtpChange}
              keyboardType="number-pad"
              maxLength={OTP_LEN}
              autoFocus
              style={styles.hiddenInput}
              caretHidden
            />

            {devCode && (
              <Pressable onPress={() => onOtpChange(devCode)} style={[styles.devHint, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.10)' : 'rgba(176,115,22,0.06)' }]}>
                <Text style={[styles.devHintText, { color: theme.gold2 }]}>DEMO MODE · tap to auto-fill OTP: {devCode}</Text>
              </Pressable>
            )}

            <Pressable onPress={() => verify(code)} disabled={busy || code.length < OTP_LEN} style={({ pressed }) => [styles.btnShadow, (busy || code.length < OTP_LEN) && { opacity: 0.55 }, pressed && styles.pressed]}>
              <LinearGradient colors={['#fce8a8', '#e9b850', '#b87f1a']} locations={[0, 0.45, 1]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.primaryBtn}>
                <Text style={styles.primaryText}>{busy ? t('auth.verifying', 'VERIFYING…') : t('auth.verifyContinue', 'VERIFY & CONTINUE')}</Text>
              </LinearGradient>
            </Pressable>

            <Pressable onPress={() => secs === 0 && sendOtp()} disabled={secs > 0} hitSlop={8} style={styles.resend}>
              <Text style={[styles.resendText, { color: secs > 0 ? theme.textMuted : gold }]}>
                {secs > 0 ? `${t('auth.resendIn', 'Resend OTP in')} ${secs}s` : t('auth.resendOtp', 'Resend OTP')}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Google one-tap (works in the built APK; in Expo Go it shows a friendly note) */}
        <View style={styles.altWrap}>
          <View style={styles.divider}>
            <View style={[styles.line, { backgroundColor: theme.line }]} />
            <Text style={[styles.dividerText, { color: theme.gold2 }]}>{t('auth.or', 'OR')}</Text>
            <View style={[styles.line, { backgroundColor: theme.line }]} />
          </View>
          {/* key={theme.name}: android_ripple + theme-driven bg needs a native remount
              on theme switch (RN-Android ripple/background repaint bug) */}
          <Pressable
            key={theme.name}
            onPress={onGoogle}
            disabled={busy}
            android_ripple={{ color: theme.ripple }}
            style={({ pressed }) => [
              styles.altBtn,
              { borderColor: theme.isDark ? 'rgba(201,150,46,0.5)' : 'rgba(176,115,22,0.4)', backgroundColor: theme.isDark ? 'rgba(0,0,0,0.6)' : '#fffdf7' },
              pressed && { transform: [{ scale: 0.98 }] },
            ]}
          >
            <GoogleG />
            <Text style={[styles.altBtnText, { color: theme.gold1 }]}>{lang === 'hi' ? 'Google से जारी रखें' : 'Continue with Google'}</Text>
          </Pressable>
        </View>
      </KeyboardAwareScroll>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  shell: { paddingHorizontal: 18, flexGrow: 1 },
  back: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  hero: { alignItems: 'center', paddingVertical: 18, marginTop: 6 },
  omCircle: { width: 84, height: 84, borderRadius: 42, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', shadowColor: '#e9b850', shadowOpacity: 0.18, shadowRadius: 30, shadowOffset: { width: 0, height: 0 }, elevation: 6 },
  h1: { fontFamily: fonts.cinzel, fontSize: 22, letterSpacing: 3, marginTop: 14, marginBottom: 6 },
  lead: { fontFamily: fonts.inter, fontSize: 13.5, textAlign: 'center', maxWidth: 300 },

  btnShadow: { borderRadius: 999, marginTop: 4, shadowColor: '#e9b850', shadowOpacity: 0.28, shadowRadius: 20, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  pressed: { transform: [{ scale: 0.985 }], opacity: 0.96 },
  primaryBtn: { minHeight: 52, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  primaryText: { fontFamily: fonts.cinzel, fontSize: 13.5, letterSpacing: 1.8, color: '#2a1c00' },
  terms: { fontFamily: fonts.inter, fontSize: 11.5, textAlign: 'center', marginTop: 4, lineHeight: 17 },

  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 9 },
  otpBox: { width: 46, height: 56, borderRadius: 12, borderWidth: 1.4, alignItems: 'center', justifyContent: 'center' },
  otpBoxActive: { shadowColor: '#e9b850', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
  otpDigit: { fontFamily: fonts.interBold, fontSize: 22 },
  hiddenInput: { position: 'absolute', opacity: 0, height: 1, width: 1 },

  devHint: { alignSelf: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  devHintText: { fontFamily: fonts.interSemi, fontSize: 11.5, letterSpacing: 0.3 },

  resend: { alignSelf: 'center', paddingVertical: 6 },
  resendText: { fontFamily: fonts.interMed, fontSize: 13 },

  altWrap: { marginTop: 'auto', paddingTop: 24 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  line: { flex: 1, height: 1 },
  dividerText: { fontFamily: fonts.cinzelSemi, fontSize: 11, letterSpacing: 2 },
  altBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    minHeight: 52, borderRadius: 999, borderWidth: 1.4, paddingHorizontal: 18,
  },
  altBtnText: { fontFamily: fonts.cinzel, fontSize: 13, letterSpacing: 0.8 },
});
