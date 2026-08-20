import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Keyboard, Platform } from 'react-native';
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
import { verifyMsg91WidgetSession, googleLogin } from '../lib/api';
import {
  initializeMsg91Widget,
  sendMsg91WidgetOtp,
  verifyMsg91WidgetOtp,
} from '../lib/msg91Widget';
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
  const [requestId, setRequestId] = useState<string | null>(null);
  const [otpLength, setOtpLength] = useState(4);
  const [secs, setSecs] = useState(0); // OTP validity countdown
  const phoneRef = useRef<TextInput>(null);
  const otpRef = useRef<TextInput>(null);
  const verifyingRef = useRef(false);
  const phoneHintAttemptedRef = useRef(false);
  const otpLengthRef = useRef(4);
  const phoneDigitsRef = useRef('');
  const smsSubscriptionRef = useRef<{ remove: () => void } | null>(null);
  const expiryRef = useRef(5 * 60);

  useEffect(() => {
    if (secs <= 0) return;
    const t = setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secs]);

  useEffect(() => {
    initializeMsg91Widget()
      .then((config) => {
        setOtpLength(config.otpLength);
        otpLengthRef.current = config.otpLength;
        expiryRef.current = config.expirySeconds;
      })
      .catch(() => {});
  }, []);

  useEffect(() => () => {
    smsSubscriptionRef.current?.remove();
    smsSubscriptionRef.current = null;
    if (Platform.OS === 'android') {
      try {
        require('@pushpendersingh/react-native-otp-verify').removeSmsListener();
      } catch (_) {}
    }
  }, []);

  const digits = phone.replace(/\D/g, '');

  const startOtpAutofill = async () => {
    if (Platform.OS !== 'android') return;
    try {
      const sms = require('@pushpendersingh/react-native-otp-verify');
      smsSubscriptionRef.current?.remove();
      smsSubscriptionRef.current = sms.addSmsListener((event: { status?: string; message?: string | null }) => {
        if (event?.status !== 'success' || !event.message) return;
        const receivedCode = sms.extractOtp(event.message, otpLengthRef.current);
        if (receivedCode) {
          smsSubscriptionRef.current?.remove();
          smsSubscriptionRef.current = null;
          setCode(receivedCode);
        }
      });
      // This package method starts Android SMS User Consent before the OTP is sent.
      await sms.requestPhoneNumber();
    } catch (_) {
      // Keyboard OTP suggestions and manual entry remain available.
    }
  };

  const suggestPhoneNumber = async () => {
    if (Platform.OS !== 'android' || phoneHintAttemptedRef.current || phoneDigitsRef.current.length > 0) return;
    phoneHintAttemptedRef.current = true;
    let autoSending = false;
    try {
      const phoneHint = require('expo-phone-number-hint');
      if (!(await phoneHint.isAvailableAsync())) return;
      const result = await phoneHint.showPhoneNumberHintAsync();
      if (result?.canceled) return;
      const selected = String(result?.hint?.e164 || result?.hint?.number || '').replace(/\D/g, '');
      if (selected.length >= 10) {
        const selectedIndianNumber = selected.slice(-10);
        autoSending = true;
        phoneDigitsRef.current = selectedIndianNumber;
        setPhone(selectedIndianNumber);
        setTimeout(() => sendOtp(selectedIndianNumber), 0);
      }
    } catch (_) {
      // SIM hints are optional; manual entry remains available on unsupported devices.
    } finally {
      if (!autoSending) setTimeout(() => phoneRef.current?.focus(), 150);
    }
  };

  const formatCountdown = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  const finishOtpLogin = async (accessToken: string, verifiedDigits?: string) => {
    const loginDigits = (verifiedDigits || phoneDigitsRef.current || digits).slice(-10);
    const r = await verifyMsg91WidgetSession({
      mobile: '+91' + loginDigits,
      accessToken,
      lang,
    });
    await saveAuth(r.token, r.user);
    registerForPush();
    track(r.isNew ? 'register' : 'login', undefined, { method: 'otp' });
    hSuccess();
    navigation.replace(r.isNew ? 'Subscribe' : (r.profileComplete ? 'Main' : 'BirthDetails'));
  };

  const sendOtp = async (phoneDigits?: string) => {
    hPress();
    const requestedDigits = String(phoneDigits || digits).replace(/\D/g, '').slice(-10);
    if (requestedDigits.length !== 10) { hError(); dialog(lang === 'hi' ? 'मोबाइल नंबर' : 'Mobile Number', lang === 'hi' ? 'कृपया 10-अंकीय मोबाइल नंबर दर्ज करें।' : 'Please enter a 10-digit mobile number.'); return; }
    if (busy) return;
    phoneDigitsRef.current = requestedDigits;
    setBusy(true);
    try {
      await startOtpAutofill();
      const r = await sendMsg91WidgetOtp('91' + requestedDigits);
      if (r.accessToken) {
        await finishOtpLogin(r.accessToken, requestedDigits);
        return;
      }
      setRequestId(r.requestId);
      setCode('');
      setStep('otp');
      setSecs(expiryRef.current);
      hSuccess();
      setTimeout(() => otpRef.current?.focus(), 350);
    } catch (e: any) {
      hError();
      dialog(
        lang === 'hi' ? 'ओटीपी नहीं भेजा जा सका' : 'Could not send OTP',
        lang === 'hi' ? 'मोबाइल सत्यापन सेवा उपलब्ध नहीं है। कृपया कुछ समय बाद पुनः प्रयास करें।' : (e?.message || 'Please try again.')
      );
    } finally {
      setBusy(false);
    }
  };

  const verify = async (full: string) => {
    if (busy || verifyingRef.current || !requestId) return;
    if (secs <= 0) {
      hError();
      dialog(
        lang === 'hi' ? 'ओटीपी की समय-सीमा समाप्त' : 'OTP expired',
        lang === 'hi' ? 'नया ओटीपी मँगाकर फिर प्रयास करें।' : 'Request a new OTP and try again.'
      );
      return;
    }
    verifyingRef.current = true;
    Keyboard.dismiss();
    setBusy(true);
    try {
      const accessToken = await verifyMsg91WidgetOtp(requestId, full);
      await finishOtpLogin(accessToken);
    } catch (e: any) {
      hError();
      setCode('');
      const messageHi = e?.code === 'OTP_EXPIRED'
        ? 'ओटीपी की समय-सीमा समाप्त हो गई है। नया ओटीपी मँगाएँ।'
        : e?.code === 'OTP_INVALID'
          ? 'ओटीपी सही नहीं है। जाँचकर फिर प्रयास करें।'
          : e?.code === 'OTP_PROVIDER_TIMEOUT'
            ? 'सत्यापन सेवा ने समय पर उत्तर नहीं दिया। आपका ओटीपी अभी समाप्त नहीं हुआ है; फिर प्रयास करें।'
            : 'सत्यापन पूरा नहीं हो सका। कृपया फिर प्रयास करें।';
      dialog(
        lang === 'hi' ? 'सत्यापन पूरा नहीं हुआ' : 'Verification failed',
        lang === 'hi' ? messageHi : (e?.message || 'Check the OTP and try again.')
      );
      setTimeout(() => otpRef.current?.focus(), 250);
    } finally {
      verifyingRef.current = false;
      setBusy(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => suggestPhoneNumber(), 550);
    return () => clearTimeout(timer);
  }, []);

  const resend = async () => {
    if (busy || secs > 0 || !requestId) return;
    hPress();
    setBusy(true);
    try {
      // MSG91 cannot retry an expired reqId, so start a fresh OTP request.
      await startOtpAutofill();
      const next = await sendMsg91WidgetOtp('91' + digits.slice(-10));
      if (next.accessToken) {
        await finishOtpLogin(next.accessToken);
        return;
      }
      setRequestId(next.requestId);
      setCode('');
      setSecs(expiryRef.current);
      hSuccess();
      setTimeout(() => otpRef.current?.focus(), 250);
    } catch (e: any) {
      hError();
      dialog(
        lang === 'hi' ? 'ओटीपी दोबारा नहीं भेजा जा सका' : 'Could not resend OTP',
        lang === 'hi' ? 'ओटीपी दोबारा नहीं भेजा जा सका। कृपया कुछ समय बाद पुनः प्रयास करें।' : (e?.message || 'Please try again.')
      );
    } finally {
      setBusy(false);
    }
  };

  const onOtpChange = (t: string) => {
    const clean = t.replace(/\D/g, '').slice(0, otpLength);
    setCode(clean);
  };

  useEffect(() => {
    if (code.length !== otpLength || !requestId || secs <= 0 || busy || verifyingRef.current) return;
    const timer = setTimeout(() => verify(code), 0);
    return () => clearTimeout(timer);
  }, [code, otpLength, requestId, secs, busy]);

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
            onPress={() => { hTap(); setStep('phone'); setRequestId(null); setCode(''); }}
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
              onChangeText={(value) => {
                const nextPhone = value.replace(/\D/g, '').slice(0, 10);
                phoneDigitsRef.current = nextPhone;
                setPhone(nextPhone);
              }}
              placeholder="98XXXXXXXX"
              keyboardType="phone-pad"
              autoComplete="tel-national"
              textContentType="telephoneNumber"
              importantForAutofill="yes"
              inputRef={phoneRef}
              maxLength={10}
            />
            <Pressable onPress={() => sendOtp()} disabled={busy} style={({ pressed }) => [styles.btnShadow, pressed && styles.pressed]}>
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
            {/* A full-size transparent input remains visible to Android Autofill. */}
            <Pressable onPress={() => otpRef.current?.focus()} style={styles.otpRow}>
              {Array.from({ length: otpLength }).map((_, i) => {
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
              <TextInput
                ref={otpRef}
                value={code}
                onChangeText={onOtpChange}
                keyboardType="number-pad"
                maxLength={otpLength}
                textContentType="oneTimeCode"
                autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
                importantForAutofill="yes"
                autoFocus
                style={styles.otpCaptureInput}
                caretHidden
              />
            </Pressable>

            <Pressable onPress={() => verify(code)} disabled={busy || code.length < otpLength} style={({ pressed }) => [styles.btnShadow, (busy || code.length < otpLength) && { opacity: 0.55 }, pressed && styles.pressed]}>
              <LinearGradient colors={['#fce8a8', '#e9b850', '#b87f1a']} locations={[0, 0.45, 1]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.primaryBtn}>
                <Text style={styles.primaryText}>{busy ? t('auth.verifying', 'VERIFYING…') : t('auth.verifyContinue', 'VERIFY & CONTINUE')}</Text>
              </LinearGradient>
            </Pressable>

            <Pressable onPress={resend} disabled={secs > 0 || busy} hitSlop={8} style={styles.resend}>
              <Text style={[styles.resendText, { color: secs > 0 ? theme.textMuted : gold }]}>
                {secs > 0
                  ? `${lang === 'hi' ? 'नया ओटीपी' : 'New OTP'} ${formatCountdown(secs)}`
                  : (lang === 'hi' ? 'नया ओटीपी मँगाएँ' : 'Request new OTP')}
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
  otpCaptureInput: {
    position: 'absolute', left: 0, right: 0, top: 0, height: 56,
    zIndex: 2, opacity: 0.02, color: 'transparent', backgroundColor: 'transparent', fontSize: 22,
  },

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
