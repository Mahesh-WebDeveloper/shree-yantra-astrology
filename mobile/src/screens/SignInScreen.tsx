import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { KeyboardAwareScroll } from '../components/KeyboardAwareScroll';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { Theme, fonts, radii } from '../theme/tokens';
import { GradientText } from '../components/GradientText';
import { CosmicBackground } from '../components/CosmicBackground';
import { TextField } from '../components/TextField';
import { OmGlyph } from '../components/icons/OmGlyph';
import { MailIcon, LockIcon, CrownIcon } from '../components/icons/ProfileIcons';
import { hPress, hError, hSuccess, hTap, hSelect } from '../lib/haptics';
import { useDialog } from '../components/DialogProvider';
import { loginUser } from '../lib/api';
import { saveAuth } from '../lib/auth';
import { useT } from '../i18n/LanguageProvider';


const GoogleIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24">
    <Path fill="#4285F4" d="M21.35 11.1H12v3.8h5.36c-.23 1.2-.93 2.2-1.98 2.88v2.4h3.2c1.87-1.72 2.95-4.26 2.95-7.28 0-.7-.06-1.4-.18-2.06z" />
    <Path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.42l-3.2-2.4c-.9.6-2.05.94-3.42.94-2.63 0-4.86-1.78-5.66-4.18H2.96v2.62A10 10 0 0 0 12 22z" />
    <Path fill="#FBBC05" d="M6.34 13.94A5.99 5.99 0 0 1 6 12c0-.67.12-1.33.34-1.94V7.44H2.96A10 10 0 0 0 2 12c0 1.6.38 3.12 1.04 4.46z" />
    <Path fill="#EA4335" d="M12 6.06c1.47 0 2.78.5 3.82 1.5l2.85-2.85C16.97 3.2 14.7 2 12 2A10 10 0 0 0 2.96 7.44l3.38 2.62C7.14 7.83 9.37 6.06 12 6.06z" />
  </Svg>
);
const AppleIcon = ({ c }: { c: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill={c}>
    <Path d="M17.5 12c0-1.6.8-3 2.1-3.8-.9-1.3-2.4-2.2-4.1-2.2-1.7 0-2.3.8-3.5.8s-2-.8-3.5-.8C5.8 6 3 8.3 3 13.1c0 3 1.9 6.9 4.4 6.9 1.1 0 1.9-.7 3.1-.7s2 .7 3.1.7c2.3 0 4.1-3.8 4.1-4.7 0-.1-2.2-.9-2.2-3.3zM14 4.6c.6-.8 1.1-1.9 1-3-1 .1-2.1.7-2.8 1.5-.6.7-1.1 1.8-1 2.9 1.1.1 2.2-.6 2.8-1.4z" />
  </Svg>
);

export function SignInScreen({ navigation }: any) {
  const { theme } = useTheme();
  const dialog = useDialog();
  const t = useT();
  const insets = useSafeAreaInsets();
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<{ id?: string; pw?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    hPress();
    const e: typeof errors = {};
    if (!id.trim()) e.id = 'Required';
    if (pw.length < 6) e.pw = 'Password must be at least 6 characters';
    setErrors(e);
    if (Object.keys(e).length) { hError(); return; }
    if (submitting) return;
    setSubmitting(true);
    try {
      const { token, user } = await loginUser({ identifier: id.trim(), password: pw });
      await saveAuth(token, user);
      hSuccess();
      navigation.navigate('Main');
    } catch (err: any) {
      hError();
      dialog('Sign in failed', err?.message || 'Galat email/mobile ya password.', [{ text: 'OK' }]);
    } finally {
      setSubmitting(false);
    }
  };
  const forgot = () =>
    dialog('Reset password?', 'We will send a reset link to your registered email.', [
      { text: 'CANCEL', style: 'cancel' }, { text: 'SEND LINK', onPress: () => {} },
    ]);

  return (
    <LinearGradient colors={theme.bgGradient} style={styles.fill}>
      <CosmicBackground />
      <KeyboardAwareScroll
        contentContainerStyle={[styles.shell, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* auth-top: back + pill */}
        <View style={styles.top}>
          <View style={styles.topLeft}>
            <Pressable onPress={() => navigation.goBack()} style={[styles.back, { borderColor: 'rgba(201,150,46,0.4)', backgroundColor: theme.isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,250,240,0.7)' }]} hitSlop={6}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.gold1} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M19 12H5M12 19l-7-7 7-7" /></Svg>
            </Pressable>
            <View style={[styles.pill, { borderColor: 'rgba(201,150,46,0.5)', backgroundColor: theme.isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,250,240,0.7)' }]}>
              <Text style={[styles.pillText, { color: theme.gold1 }]}>{t('common.signIn', 'SIGN IN')}</Text>
            </View>
          </View>
        </View>

        {/* hero */}
        <View style={styles.hero}>
          <View style={[styles.omCircle, { borderColor: 'rgba(201,150,46,0.5)' }]}>
            <LinearGradient colors={theme.isDark ? ['#1a1230', '#050511'] : ['#fff3d6', '#f1e1ba']} start={{ x: 0.3, y: 0.3 }} end={{ x: 1, y: 1 }} style={styles.omBg} />
            <OmGlyph size={54} />
          </View>
          <GradientText style={styles.h1}>{t('signin.welcomeBack', 'WELCOME BACK')}</GradientText>
          <Text style={[styles.lead, { color: theme.textSoft }]}>{t('signin.lead', 'Sign in to continue your cosmic journey')}</Text>
        </View>

        {/* form */}
        <View style={{ gap: 14, marginTop: 4 }}>
          <TextField icon={<MailIcon color={theme.gold2} size={20} />} label={t('signin.emailOrMobile', 'Email or Mobile')} value={id} onChangeText={setId} placeholder="you@cosmos.com or +91 ..." keyboardType="email-address" error={errors.id} />
          <TextField icon={<LockIcon color={theme.gold2} size={20} />} label={t('signin.password', 'Password')} value={pw} onChangeText={setPw} placeholder="Enter your password" secureTextEntry error={errors.pw} />

          <View style={styles.rowBetween}>
            <Pressable style={styles.remember} onPress={() => { hSelect(); setRemember((r) => !r); }} hitSlop={6}>
              <View style={[styles.check, { borderColor: theme.gold2, backgroundColor: remember ? theme.gold2 : 'transparent' }]}>
                {remember && <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={theme.buttonInk} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><Path d="M20 6L9 17l-5-5" /></Svg>}
              </View>
              <Text style={[styles.rememberText, { color: theme.textSoft }]}>{t('signin.rememberMe', 'Remember me')}</Text>
            </Pressable>
            <Pressable onPress={forgot} hitSlop={6}><Text style={[styles.forgot, { color: theme.gold2 }]}>{t('signin.forgot', 'Forgot Password?')}</Text></Pressable>
          </View>

          <Pressable onPress={submit} style={({ pressed }) => [styles.btnShadow, pressed && styles.pressed]}>
            <LinearGradient colors={['#fce8a8', '#e9b850', '#b87f1a']} locations={[0, 0.45, 1]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.primaryBtn}>
              <CrownIcon color="#2a1c00" size={17} />
              <Text style={styles.primaryText}>{submitting ? t('common.loading', 'SIGNING IN…') : t('common.signIn', 'SIGN IN')}</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* divider */}
        <View style={styles.divider}>
          <View style={[styles.line, { backgroundColor: theme.line }]} />
          <Text style={[styles.dividerText, { color: theme.gold2 }]}>{t('signin.orContinue', 'OR CONTINUE WITH')}</Text>
          <View style={[styles.line, { backgroundColor: theme.line }]} />
        </View>

        {/* social */}
        <View style={styles.socialRow}>
          <Pressable onPress={() => { hTap(); navigation.navigate('Main'); }} style={[styles.social, { borderColor: theme.isDark ? 'rgba(201,150,46,0.35)' : 'rgba(176,115,22,0.26)', backgroundColor: theme.isDark ? 'rgba(0,0,0,0.7)' : '#fffdf7' }]} android_ripple={{ color: theme.ripple }}>
            <GoogleIcon /><Text style={[styles.socialText, { color: theme.text }]}>Google</Text>
          </Pressable>
          <Pressable onPress={() => { hTap(); navigation.navigate('Main'); }} style={[styles.social, { borderColor: theme.isDark ? 'rgba(201,150,46,0.35)' : 'rgba(176,115,22,0.26)', backgroundColor: theme.isDark ? 'rgba(0,0,0,0.7)' : '#fffdf7' }]} android_ripple={{ color: theme.ripple }}>
            <AppleIcon c={theme.text} /><Text style={[styles.socialText, { color: theme.text }]}>Apple</Text>
          </Pressable>
        </View>

        <Text style={[styles.foot, { color: theme.textSoft }]}>{t('signin.newUser', 'New to Shree Yantra?')}</Text>
        <Pressable onPress={() => { hTap(); navigation.navigate('Register'); }} android_ripple={{ color: theme.ripple }} style={[styles.ghostBtn, { borderColor: theme.isDark ? 'rgba(201,150,46,0.5)' : 'rgba(176,115,22,0.26)', backgroundColor: theme.isDark ? 'rgba(0,0,0,0.6)' : '#fffdf7' }]}>
          <Text style={[styles.ghostText, { color: theme.gold1 }]}>{t('signin.createAccount', 'Create Account')}</Text>
        </Pressable>
      </KeyboardAwareScroll>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  shell: { paddingHorizontal: 18 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  back: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  pill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  pillText: { fontFamily: fonts.interSemi, fontSize: 11, letterSpacing: 1.65 },
  toggle: { flexDirection: 'row', borderRadius: 999, borderWidth: 1, padding: 3, gap: 2 },
  toggleBtn: { width: 32, height: 28, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },

  hero: { alignItems: 'center', paddingVertical: 12 },
  omCircle: { width: 88, height: 88, borderRadius: 44, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', shadowColor: '#e9b850', shadowOpacity: 0.18, shadowRadius: 36, shadowOffset: { width: 0, height: 0 }, elevation: 6 },
  omBg: { ...StyleSheet.absoluteFillObject, borderRadius: 44 },
  h1: { fontFamily: fonts.cinzel, fontSize: 22, letterSpacing: 3.5, marginTop: 12, marginBottom: 6 },
  lead: { fontFamily: fonts.inter, fontSize: 13.5 },

  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  remember: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  check: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  rememberText: { fontFamily: fonts.inter, fontSize: 13 },
  forgot: { fontFamily: fonts.interMed, fontSize: 12.5 },

  btnShadow: { borderRadius: 999, marginTop: 8, shadowColor: '#e9b850', shadowOpacity: 0.28, shadowRadius: 20, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  pressed: { transform: [{ scale: 0.985 }], opacity: 0.96 },
  primaryBtn: { minHeight: 52, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 24 },
  primaryText: { fontFamily: fonts.cinzel, fontSize: 13.5, letterSpacing: 1.8, color: '#2a1c00' },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 18 },
  line: { flex: 1, height: 1 },
  dividerText: { fontFamily: fonts.cinzelSemi, fontSize: 11, letterSpacing: 2 },

  socialRow: { flexDirection: 'row', gap: 10 },
  social: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  socialText: { fontFamily: fonts.interSemi, fontSize: 13.5 },

  foot: { fontFamily: fonts.inter, fontSize: 13, textAlign: 'center', marginTop: 22, marginBottom: 10 },
  ghostBtn: { minHeight: 52, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  ghostText: { fontFamily: fonts.cinzel, fontSize: 13.5, letterSpacing: 1.6 },
});
