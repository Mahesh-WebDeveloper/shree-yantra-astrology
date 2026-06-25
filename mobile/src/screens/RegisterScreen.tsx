import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import { KeyboardAwareScroll } from '../components/KeyboardAwareScroll';
import Svg, { Path, Circle, Polyline, Line } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { Theme, fonts, radii } from '../theme/tokens';
import { GradientText } from '../components/GradientText';
import { GoldButton } from '../components/GoldButton';
import { TextField } from '../components/TextField';
import { CosmicBackground } from '../components/CosmicBackground';
import { OmGlyph } from '../components/icons/OmGlyph';
import { UserLine, MailIcon, LockIcon } from '../components/icons/ProfileIcons';
import { hSelect, hError, hSuccess, hTap } from '../lib/haptics';
import { useT } from '../i18n/LanguageProvider';
import { registerUser } from '../lib/api';
import { saveAuth } from '../lib/auth';
import { useDialog } from '../components/DialogProvider';

const sw = (color: string) => ({
  width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none' as const, stroke: color,
  strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
});

const PhoneIcon = ({ color }: { color: string }) => (
  <Svg {...sw(color)} width={20} height={20}>
    <Path d="M22 16.92V21a1 1 0 0 1-1.11 1A19.94 19.94 0 0 1 2 4.11 1 1 0 0 1 3 3h4a1 1 0 0 1 1 .75l1.5 6a1 1 0 0 1-.27 1L7 13a16 16 0 0 0 4 4l2.25-2.23a1 1 0 0 1 1-.27l6 1.5A1 1 0 0 1 22 17z" />
  </Svg>
);

const INTERESTS = [
  { key: 'love', title: 'Love & Relationships', sub: 'Compatibility, marriage timing, conflicts',
    icon: (c: string) => <Svg {...sw(c)}><Path d="M12 21s-7-4.4-7-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.6-7 11-7 11z" /></Svg> },
  { key: 'career', title: 'Career & Business', sub: 'Job changes, promotions, business luck',
    icon: (c: string) => <Svg {...sw(c)}><Path d="M3 7h18v13H3z" /><Path d="M8 7V5a4 4 0 0 1 8 0v2" /></Svg> },
  { key: 'wealth', title: 'Wealth & Finance', sub: 'Money, investments, prosperity yogas',
    icon: (c: string) => <Svg {...sw(c)}><Circle cx={12} cy={12} r={9} /><Path d="M3 12h18" /><Path d="M12 3a14.5 14.5 0 0 1 0 18M12 3a14.5 14.5 0 0 0 0 18" /></Svg> },
  { key: 'health', title: 'Health & Wellness', sub: 'Daily energy, mental peace, ayurveda',
    icon: (c: string) => <Svg {...sw(c)}><Path d="M12 2C9 6 7 8 7 12a5 5 0 0 0 10 0c0-2-1-4-3-6-1 2-2 2-2 0z" /></Svg> },
];

const STEP_LABELS = ['Your Details', 'Interests'];

/* gold OM medallion (brand mark) */
function Medallion({ theme }: { theme: Theme }) {
  return (
    <View style={styles.medWrap}>
      <View style={[styles.medGlow, { shadowColor: theme.gold1 }]} />
      <LinearGradient colors={['#fce8a8', '#e9b850', '#c9962e']} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.medRing}>
        <View style={[styles.medInner, { backgroundColor: theme.isDark ? '#0a0a14' : '#fffdf7' }]}>
          <OmGlyph size={32} />
        </View>
      </LinearGradient>
    </View>
  );
}

/* connected two-step indicator (dot — animated line — dot) */
function Stepper({ step, theme, fill }: { step: number; theme: Theme; fill: Animated.AnimatedInterpolation<string> }) {
  const Dot = ({ n }: { n: number }) => {
    const on = n <= step;
    return on ? (
      <LinearGradient colors={theme.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={[styles.dot, styles.dotActive]}>
        {step > n
          ? <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={theme.buttonInk} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><Path d="M20 6L9 17l-5-5" /></Svg>
          : <Text style={[styles.dotText, { color: theme.buttonInk }]}>{n}</Text>}
      </LinearGradient>
    ) : (
      <View style={[styles.dot, { borderWidth: 1, borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.7)' : '#fffdf7' }]}>
        <Text style={[styles.dotText, { color: theme.goldText }]}>{n}</Text>
      </View>
    );
  };
  return (
    <View style={styles.stepsWrap}>
      <View style={styles.stepsRow}>
        <Dot n={1} />
        <View style={[styles.connector, { backgroundColor: theme.isDark ? 'rgba(201,150,46,0.2)' : 'rgba(176,115,22,0.18)' }]}>
          <Animated.View style={[styles.connectorFill, { width: fill }]}>
            <LinearGradient colors={theme.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          </Animated.View>
        </View>
        <Dot n={2} />
      </View>
      <View style={styles.labelsRow}>
        {STEP_LABELS.map((l, i) => (
          <Text key={l} style={[styles.stepLabel, { color: i + 1 <= step ? theme.gold1 : theme.textMuted }]}>{l}</Text>
        ))}
      </View>
    </View>
  );
}

function Panel({ theme, children }: { theme: Theme; children: React.ReactNode }) {
  const gold = theme.gold1;
  const corner = (pos: any) => <View style={[styles.fpCorner, { borderColor: gold }, pos]} />;
  return (
    <View style={[styles.formPanel, { borderColor: theme.isDark ? 'rgba(201,150,46,0.28)' : 'rgba(176,115,22,0.22)', backgroundColor: theme.isDark ? 'rgba(255,255,255,0.015)' : 'rgba(255,253,247,0.6)' }]}>
      {corner({ top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 16 })}
      {corner({ top: -1, right: -1, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 16 })}
      {corner({ bottom: -1, left: -1, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 16 })}
      {corner({ bottom: -1, right: -1, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 16 })}
      {children}
    </View>
  );
}

export function RegisterScreen({ navigation }: any) {
  const { theme } = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const dialog = useDialog();
  const [submitting, setSubmitting] = useState(false);

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [prefs, setPrefs] = useState<string[]>([]);

  // medallion entrance (once) + per-step content entrance + stepper fill
  const intro = useRef(new Animated.Value(0)).current;
  const stepEnter = useRef(new Animated.Value(0)).current;
  const fill = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(intro, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [intro]);

  useEffect(() => {
    stepEnter.setValue(0);
    Animated.timing(stepEnter, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    // width can't use the native driver
    Animated.timing(fill, { toValue: step >= 2 ? 1 : 0, duration: 420, easing: Easing.inOut(Easing.ease), useNativeDriver: false }).start();
  }, [step, stepEnter, fill]);

  const togglePref = (k: string) => {
    hSelect();
    setPrefs((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));
  };

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Please tell us your name';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) e.email = 'Enter a valid email';
    if (mobile.replace(/\D/g, '').length < 10) e.mobile = 'Enter a valid mobile number';
    if (password.length < 8) e.password = 'Password must be at least 8 characters';
    setErrors(e);
    const ok = Object.keys(e).length === 0;
    if (!ok) hError();
    return ok;
  };

  const next = async () => {
    if (step === 1) { if (!validateStep1()) return; setStep(2); return; }
    // step 2 → backend par account banao
    if (submitting) return;
    setSubmitting(true);
    try {
      const { token, user } = await registerUser({
        name: name.trim(),
        email: email.trim(),
        phone: mobile.trim(),
        password,
        interests: prefs,
      });
      await saveAuth(token, user);
      hSuccess();
      navigation.navigate('BirthDetails');
    } catch (e: any) {
      hError();
      dialog('Registration failed', e?.message || 'Something went wrong — please try again.', [{ text: 'OK' }]);
    } finally {
      setSubmitting(false);
    }
  };
  const prev = () => {
    if (step === 1) { navigation.navigate('SignIn'); return; }
    setStep(1);
  };

  const introStyle = { opacity: intro, transform: [{ scale: intro.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }] };
  const stepStyle = { opacity: stepEnter, transform: [{ translateY: stepEnter.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] };
  const fillWidth = fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <LinearGradient colors={theme.bgGradient} style={[styles.fill, { backgroundColor: theme.bgDeep }]}>
      <CosmicBackground />
      <View style={[styles.shell, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 14 }]}>
        {/* top bar */}
        <View style={styles.top}>
          <Pressable onPress={prev} style={[styles.iconBtn, { borderColor: theme.isDark ? 'rgba(201,150,46,0.4)' : 'rgba(176,115,22,0.35)', backgroundColor: theme.isDark ? 'rgba(0,0,0,0.6)' : '#fffdf7' }]} hitSlop={8}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.gold1} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M19 12H5M12 19l-7-7 7-7" /></Svg>
          </Pressable>
          <View style={styles.titleWrap}>
            <GradientText style={styles.title}>{t('reg.title', 'CREATE DIVINE PROFILE')}</GradientText>
          </View>
          <Pressable onPress={() => navigation.navigate('SignIn')} style={[styles.iconBtn, { borderColor: theme.isDark ? 'rgba(201,150,46,0.4)' : 'rgba(176,115,22,0.35)', backgroundColor: theme.isDark ? 'rgba(0,0,0,0.6)' : '#fffdf7' }]} hitSlop={8}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.gold1} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><Polyline points="16 17 21 12 16 7" /><Line x1={21} y1={12} x2={9} y2={12} />
            </Svg>
          </Pressable>
        </View>

        {/* brand medallion */}
        <Animated.View style={introStyle}>
          <Medallion theme={theme} />
        </Animated.View>

        <View style={styles.titleOrn}>
          <View style={[styles.ornLine, { backgroundColor: theme.isDark ? 'rgba(201,150,46,0.4)' : 'rgba(176,115,22,0.35)' }]} />
          <View style={[styles.ornDiamond, { backgroundColor: theme.gold1 }]} />
          <View style={[styles.ornLine, { backgroundColor: theme.isDark ? 'rgba(201,150,46,0.4)' : 'rgba(176,115,22,0.35)' }]} />
        </View>

        <Stepper step={step} theme={theme} fill={fillWidth} />

        <KeyboardAwareScroll style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View style={stepStyle}>
            {step === 1 ? (
              <View>
                <Text style={[styles.h2, { color: theme.text }]}>{t('reg.identity', 'Your Cosmic Identity')}</Text>
                <Text style={[styles.lead, { color: theme.textSoft }]}>{t('reg.identityLead', 'Tell us how the universe should greet you.')}</Text>
                <Panel theme={theme}>
                  <View style={{ gap: 13 }}>
                    <TextField icon={<UserLine color={theme.gold2} size={20} />} label={t('profile.fullName', 'Full Name')} value={name} onChangeText={setName} placeholder="Eg. Raj Kumar Sharma" autoCapitalize="words" error={errors.name} />
                    <TextField icon={<MailIcon color={theme.gold2} size={20} />} label={t('profile.email', 'Email')} value={email} onChangeText={setEmail} placeholder="you@cosmos.com" keyboardType="email-address" error={errors.email} />
                    <TextField icon={<PhoneIcon color={theme.gold2} />} label={t('auth.mobileNumber', 'Mobile Number')} value={mobile} onChangeText={setMobile} placeholder="+91 98XXXXXXXX" keyboardType="phone-pad" error={errors.mobile} />
                    <TextField icon={<LockIcon color={theme.gold2} size={20} />} label={t('reg.createPassword', 'Create Password')} value={password} onChangeText={setPassword} placeholder="Min 8 characters" secureTextEntry error={errors.password} />
                  </View>
                </Panel>
                <Pressable onPress={() => { hTap(); navigation.navigate('SignIn'); }} style={styles.footerLink} hitSlop={8}>
                  <Text style={[styles.footerText, { color: theme.textMuted }]}>{t('reg.alreadyHave', 'Already have an account? ')}</Text>
                  <Text style={[styles.footerText, styles.footerCta, { color: theme.goldText }]}>{t('common.signIn', 'Sign In')}</Text>
                </Pressable>
              </View>
            ) : (
              <View>
                <Text style={[styles.h2, { color: theme.text }]}>What guides you?</Text>
                <Text style={[styles.lead, { color: theme.textSoft }]}>Pick what you’re most curious about — we’ll personalise your home.</Text>
                <Panel theme={theme}>
                  <View style={{ gap: 10 }}>
                    {INTERESTS.map((it) => {
                      const on = prefs.includes(it.key);
                      return (
                        <Pressable
                          key={it.key}
                          onPress={() => togglePref(it.key)}
                          style={({ pressed }) => [
                            styles.tile,
                            {
                              backgroundColor: on
                                ? (theme.isDark ? 'rgba(233,184,80,0.10)' : 'rgba(176,115,22,0.07)')
                                : (theme.isDark ? 'rgba(255,255,255,0.02)' : '#ffffff'),
                              borderColor: on ? theme.gold1 : (theme.isDark ? 'rgba(201,150,46,0.28)' : 'rgba(176,115,22,0.22)'),
                              borderWidth: on ? 1.5 : 1,
                            },
                            on && styles.tileOn,
                            pressed && { transform: [{ scale: 0.98 }] },
                          ]}
                        >
                          <View style={[styles.tileIcon, { borderWidth: 1, borderColor: on ? theme.gold1 : (theme.isDark ? 'rgba(201,150,46,0.4)' : 'rgba(176,115,22,0.28)'), backgroundColor: theme.isDark ? 'rgba(233,184,80,0.12)' : 'rgba(176,115,22,0.06)' }]}>
                            {it.icon(theme.gold1)}
                          </View>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={[styles.tileTitle, { color: theme.text }]}>{it.title}</Text>
                            <Text style={[styles.tileSub, { color: theme.textMuted }]}>{it.sub}</Text>
                          </View>
                          {on ? (
                            <LinearGradient colors={theme.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.tileCheckOn}>
                              <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={theme.buttonInk} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><Path d="M20 6L9 17l-5-5" /></Svg>
                            </LinearGradient>
                          ) : (
                            <View style={[styles.tileCheckOff, { borderColor: theme.isDark ? 'rgba(201,150,46,0.45)' : 'rgba(176,115,22,0.3)' }]} />
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                </Panel>
                <Text style={[styles.selCount, { color: theme.textMuted }]}>
                  {prefs.length > 0 ? `${prefs.length} selected — you can change these anytime` : 'Select at least one to personalise your experience'}
                </Text>
              </View>
            )}

            <View style={styles.actions}>
              <GoldButton label={step === 1 ? t('common.continue', 'Continue') : submitting ? t('reg.creating', 'Creating…') : t('reg.createAccount', 'Create Account')} onPress={next} />
              <GoldButton label={step === 1 ? t('common.cancel', 'Cancel') : t('common.back', 'Back')} variant="ghost" onPress={prev} />
            </View>
          </Animated.View>
        </KeyboardAwareScroll>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  flex: { flex: 1 },
  shell: { flex: 1, paddingHorizontal: 18, width: '100%', maxWidth: 480, alignSelf: 'center' },
  scrollContent: { flexGrow: 1, justifyContent: 'flex-start', paddingTop: 4, paddingBottom: 8 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  titleWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { textAlign: 'center', fontFamily: fonts.cinzel, fontSize: 14, letterSpacing: 2.2 },

  medWrap: { alignSelf: 'center', marginTop: 8, marginBottom: 4, alignItems: 'center', justifyContent: 'center' },
  medGlow: { position: 'absolute', width: 70, height: 70, borderRadius: 35, shadowOpacity: 0.55, shadowRadius: 18, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
  medRing: { width: 62, height: 62, borderRadius: 31, padding: 2, alignItems: 'center', justifyContent: 'center' },
  medInner: { width: '100%', height: '100%', borderRadius: 30, alignItems: 'center', justifyContent: 'center' },

  titleOrn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8, marginBottom: 2 },
  ornLine: { width: 38, height: 1 },
  ornDiamond: { width: 6, height: 6, transform: [{ rotate: '45deg' }] },

  stepsWrap: { marginTop: 12, marginBottom: 14, alignSelf: 'center', width: '100%', maxWidth: 260 },
  stepsRow: { flexDirection: 'row', alignItems: 'center' },
  connector: { flex: 1, height: 3, borderRadius: 999, marginHorizontal: 8, overflow: 'hidden' },
  connectorFill: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  labelsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 },
  stepLabel: { fontFamily: fonts.interSemi, fontSize: 10.5, letterSpacing: 0.6 },
  dot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  dotActive: { shadowColor: '#e9b850', shadowOpacity: 0.55, shadowRadius: 9, shadowOffset: { width: 0, height: 0 }, elevation: 5 },
  dotText: { fontFamily: fonts.interBold, fontSize: 12 },

  h2: { fontFamily: fonts.playfairBold, fontSize: 22, textAlign: 'center', marginTop: 2 },
  lead: { fontFamily: fonts.inter, fontSize: 13.5, textAlign: 'center', marginTop: 6, marginBottom: 14, alignSelf: 'center', maxWidth: 320 },

  formPanel: { position: 'relative', borderWidth: 1, borderRadius: 18, padding: 14, marginTop: 2 },
  fpCorner: { position: 'absolute', width: 16, height: 16 },

  footerLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  footerText: { fontFamily: fonts.inter, fontSize: 13 },
  footerCta: { fontFamily: fonts.interSemi },

  tile: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 16, borderWidth: 1 },
  tileOn: { shadowColor: '#e9b850', shadowOpacity: 0.28, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  tileIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  tileTitle: { fontFamily: fonts.playfair, fontSize: 15.5 },
  tileSub: { fontFamily: fonts.inter, fontSize: 12.5, marginTop: 2 },
  tileCheckOff: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5 },
  tileCheckOn: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  selCount: { fontFamily: fonts.inter, fontSize: 11.5, textAlign: 'center', marginTop: 12 },

  actions: { gap: 12, marginTop: 22 },
});
