import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import RazorpayCheckout, { type RazorpayFailure } from 'react-native-razorpay';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radii } from '../theme/tokens';
import { useLang } from '../i18n/LanguageProvider';
import { CosmicBackground } from '../components/CosmicBackground';
import { TopBar } from '../components/TopBar';
import { BellIcon } from '../components/icons/NavIcons';
import { hError, hSuccess, hTap } from '../lib/haptics';
import { getStoredUser, updateStoredUser } from '../lib/auth';
import {
  createPaymentSubscription,
  getPaymentConfig,
  getPaymentSubscription,
  verifyPaymentSubscription,
  type PaymentConfig,
  type SubscriptionResponse,
} from '../lib/api';
import { track } from '../lib/analytics';

const CheckIcon = ({ color, size = 16 }: { color: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 6 9 17l-5-5" />
  </Svg>
);

const ShieldIcon = ({ color }: { color: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" />
    <Path d="m8.5 12 2.2 2.2 4.8-5" />
  </Svg>
);

const MandateIcon = ({ color }: { color: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Rect x={3} y={5} width={18} height={14} rx={2} />
    <Path d="M3 10h18M7 15h4" />
  </Svg>
);

const money = (paise?: number) => `₹${((paise || 0) / 100).toLocaleString('en-IN')}`;

function indiaDate(value?: string | null, hi = false) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(hi ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

function contactForCheckout(phone?: string | null) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return phone || undefined;
}

export function PaymentScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const hi = lang === 'hi';
  const insets = useSafeAreaInsets();
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [trialEligible, setTrialEligible] = useState(true);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  const trialEnd = useMemo(() => {
    const d = new Date();
    if (trialEligible) d.setDate(d.getDate() + (config?.trialDays || 7));
    else d.setMonth(d.getMonth() + 1);
    return d;
  }, [config?.trialDays, trialEligible]);

  const finish = async (response: SubscriptionResponse) => {
    await updateStoredUser(response.user);
    hSuccess();
    track('subscribe_success', undefined, { provider: 'razorpay', status: response.subscription.status });
    navigation.replace('SubscriptionActivated');
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const cfg = await getPaymentConfig();
        if (!mounted) return;
        setConfig(cfg);
        if (!cfg.enabled) setError(hi ? 'भुगतान सेवा अभी उपलब्ध नहीं है। कृपया सहायता टीम से संपर्क करें।' : 'Payments are not available right now. Please contact support.');

        const current = await getPaymentSubscription().catch(() => null);
        if (mounted && current) {
          setTrialEligible(current.subscription.trialEligible !== false);
          if (current.subscription.entitlementActive) await finish(current);
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || (hi ? 'भुगतान की जानकारी लोड नहीं हो सकी।' : 'Payment details could not be loaded.'));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
    // The active language is captured for the initial load message.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recoverStatus = async () => {
    const current = await getPaymentSubscription();
    if (current.subscription.entitlementActive) {
      await finish(current);
      return true;
    }
    return false;
  };

  const checkPayment = async () => {
    if (checking || processing) return;
    setChecking(true);
    setError('');
    try {
      const recovered = await recoverStatus();
      if (!recovered) setError(hi ? 'अभी सफल भुगतान नहीं मिला। भुगतान पूरा करके दोबारा जाँचें।' : 'No successful payment was found yet. Complete the payment and check again.');
    } catch (e: any) {
      setError(e?.message || (hi ? 'भुगतान की स्थिति जाँची नहीं जा सकी।' : 'Payment status could not be checked.'));
    } finally {
      setChecking(false);
    }
  };

  const startPayment = async () => {
    if (processing || !config?.enabled) return;
    if (!consent) {
      hError();
      setError(hi ? 'कृपया मासिक स्वतः भुगतान की शर्त पढ़कर सहमति दें।' : 'Please read and accept the monthly auto-payment terms.');
      return;
    }
    setProcessing(true);
    setError('');
    try {
      const session = await createPaymentSubscription();
      if (session.alreadyEntitled) {
        await recoverStatus();
        return;
      }
      if (!session.keyId || !session.providerSubscriptionId) throw new Error(hi ? 'सुरक्षित भुगतान सत्र नहीं बन सका।' : 'A secure payment session could not be created.');

      const sessionTrialEligible = session.initialPeriodType !== 'paid';
      if (sessionTrialEligible !== trialEligible) {
        setTrialEligible(sessionTrialEligible);
        setConsent(false);
        throw new Error(hi
          ? 'आपके खाते के अनुसार भुगतान राशि अपडेट हुई है। कृपया नई राशि देखकर दोबारा सहमति दें।'
          : 'The amount has been updated for your account. Review it and confirm again.');
      }

      const user = await getStoredUser();
      const result = await RazorpayCheckout.open({
        key: session.keyId,
        subscription_id: session.providerSubscriptionId,
        name: 'Shree Yantra Astrology',
        description: sessionTrialEligible
          ? (hi ? '7 दिन का Premium ट्रायल, फिर ₹499 प्रति माह' : '7-day Premium trial, then ₹499 per month')
          : (hi ? 'Premium सदस्यता, ₹499 प्रति माह' : 'Premium membership, ₹499 per month'),
        currency: session.currency || 'INR',
        prefill: {
          name: user?.name && user.name !== 'Friend' ? user.name : undefined,
          email: user?.email || undefined,
          contact: contactForCheckout(user?.phone),
        },
        notes: { product: 'Shree Yantra Premium Monthly' },
        theme: { color: '#b88621' },
        modal: { confirm_close: true, handleback: true, animation: true },
        timeout: 600,
      });

      const subscriptionId = result.razorpay_subscription_id || session.providerSubscriptionId;
      if (!result.razorpay_payment_id || !result.razorpay_signature) {
        throw new Error(hi ? 'भुगतान की पुष्टि अधूरी है।' : 'Payment confirmation is incomplete.');
      }
      try {
        const verified = await verifyPaymentSubscription({
          razorpay_payment_id: result.razorpay_payment_id,
          razorpay_subscription_id: subscriptionId,
          razorpay_signature: result.razorpay_signature,
        });
        await finish(verified);
      } catch (verifyError) {
        // Checkout may succeed while the verification response is delayed. The
        // signed webhook is authoritative, so perform one immediate recovery check.
        await new Promise((resolve) => setTimeout(resolve, 1400));
        const recovered = await recoverStatus().catch(() => false);
        if (!recovered) throw verifyError;
      }
    } catch (raw: any) {
      const failure = raw as RazorpayFailure;
      const cancelled = failure?.code === 0 || /cancel|dismiss|back/i.test(`${failure?.reason || ''} ${failure?.description || ''}`);
      if (!cancelled) hError();
      setError(cancelled
        ? (hi ? 'भुगतान रद्द कर दिया गया। आप तैयार होने पर दोबारा प्रयास कर सकते हैं।' : 'Payment was cancelled. You can try again when ready.')
        : (raw?.message || (hi ? 'भुगतान पूरा नहीं हो सका। कोई राशि कटी हो तो “भुगतान जाँचें” दबाएँ।' : 'Payment could not be completed. If money was debited, tap “Check payment”.')));
      track('subscribe_failed', undefined, { provider: 'razorpay', cancelled });
    } finally {
      setProcessing(false);
    }
  };

  const monthlyAmount = money(config?.monthlyAmountPaise || 49900);
  const upfrontAmount = money(trialEligible
    ? (config?.trialAmountPaise || 100)
    : (config?.monthlyAmountPaise || 49900));
  const panelBg = theme.isDark ? 'rgba(9,8,12,0.88)' : '#ffffff';

  return (
    <View style={[styles.root, { backgroundColor: theme.bgDeep }]}>
      <CosmicBackground />
      <TopBar
        title={hi ? 'सुरक्षित भुगतान' : 'Secure payment'}
        onBack={() => { hTap(); navigation.goBack(); }}
        right={<BellIcon color={theme.gold1} size={20} />}
        onRight={() => navigation.navigate('Notifications')}
      />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 36 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.headingWrap}>
          <Text style={[styles.eyebrow, { color: theme.gold1 }]}>{hi ? 'SHREE YANTRA PREMIUM' : 'SHREE YANTRA PREMIUM'}</Text>
          <Text style={[styles.heading, { color: theme.text }]}>
            {trialEligible
              ? (hi ? 'पहले 7 दिन केवल ₹1' : 'First 7 days for just ₹1')
              : (hi ? '₹499 में Premium जारी रखें' : 'Continue Premium for ₹499')}
          </Text>
          <Text style={[styles.subheading, { color: theme.textSoft }]}>
            {trialEligible
              ? (hi ? 'इसके बाद ₹499 प्रति माह स्वतः भुगतान होगा। सदस्यता कभी भी रद्द की जा सकती है।' : 'After that, ₹499 is charged automatically every month. Cancel anytime.')
              : (hi ? 'आज ₹499 का भुगतान होगा। अगला स्वतः भुगतान एक महीने बाद होगा।' : 'Pay ₹499 today. The next automatic payment will be one month later.')}
          </Text>
        </View>

        <LinearGradient
          colors={theme.isDark ? ['rgba(33,23,8,0.92)', 'rgba(8,8,12,0.96)'] : ['#fffaf0', '#ffffff']}
          style={[styles.planCard, { borderColor: theme.cardBorder }]}
        >
          <View style={styles.planTop}>
            <View>
              <Text style={[styles.planLabel, { color: theme.textMuted }]}>{hi ? 'आज देय राशि' : 'PAYABLE TODAY'}</Text>
              <Text style={[styles.price, { color: theme.goldText }]}>{upfrontAmount}</Text>
            </View>
            <View style={[styles.secureBadge, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.1)' : '#fff' }]}>
              <ShieldIcon color={theme.gold1} />
              <Text style={[styles.secureBadgeText, { color: theme.text }]}>{hi ? 'सुरक्षित' : 'Secure'}</Text>
            </View>
          </View>

          <View style={[styles.timeline, { borderTopColor: theme.line }]}>
            <View style={styles.timelineRow}>
              <View style={[styles.dot, { backgroundColor: theme.gold1 }]} />
              <View style={styles.timelineCopy}>
                <Text style={[styles.timelineTitle, { color: theme.text }]}>{hi ? `आज ${upfrontAmount}` : `${upfrontAmount} today`}</Text>
                <Text style={[styles.timelineText, { color: theme.textSoft }]}>
                  {trialEligible
                    ? (hi ? 'ट्रायल और मासिक भुगतान की अनुमति सक्रिय होगी' : 'Activates your trial and monthly payment mandate')
                    : (hi ? 'पहले महीने की Premium सदस्यता और भुगतान अनुमति सक्रिय होगी' : 'Activates your first paid month and payment mandate')}
                </Text>
              </View>
            </View>
            <View style={styles.timelineRow}>
              <View style={[styles.dot, { backgroundColor: '#4ade80' }]} />
              <View style={styles.timelineCopy}>
                <Text style={[styles.timelineTitle, { color: theme.text }]}>{hi ? `${indiaDate(trialEnd.toISOString(), true)} से ${monthlyAmount}/माह` : `${monthlyAmount}/month from ${indiaDate(trialEnd.toISOString())}`}</Text>
                <Text style={[styles.timelineText, { color: theme.textSoft }]}>{hi ? 'हर माह उसी तारीख के आसपास स्वतः भुगतान' : 'Automatic payment around the same date each month'}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={[styles.methodCard, { borderColor: theme.cardBorder, backgroundColor: panelBg }]}>
          <View style={[styles.methodIcon, { backgroundColor: theme.isDark ? 'rgba(233,184,80,0.11)' : '#fff8e7' }]}><MandateIcon color={theme.gold1} /></View>
          <View style={styles.methodCopy}>
            <Text style={[styles.methodTitle, { color: theme.text }]}>{hi ? 'अपना सुविधाजनक तरीका चुनें' : 'Choose a convenient payment method'}</Text>
            <Text style={[styles.methodText, { color: theme.textSoft }]}>{hi ? 'Razorpay checkout में उपलब्ध UPI Autopay, कार्ड या बैंक mandate का उपयोग करें।' : 'Use UPI Autopay, card, or bank mandate available in Razorpay Checkout.'}</Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: consent }}
          onPress={() => { hTap(); setConsent((value) => !value); setError(''); }}
          style={[styles.consent, { borderColor: consent ? theme.gold1 : theme.cardBorder, backgroundColor: panelBg }]}
        >
          <View style={[styles.checkbox, { borderColor: consent ? theme.gold1 : theme.textMuted, backgroundColor: consent ? theme.gold1 : 'transparent' }]}>
            {consent && <CheckIcon color={theme.buttonInk} size={14} />}
          </View>
          <Text style={[styles.consentText, { color: theme.textSoft }]}>
            {hi
              ? (trialEligible
                ? `मैं सहमत हूँ कि आज ${upfrontAmount} लिया जाएगा। 7 दिन बाद ${monthlyAmount} प्रति माह स्वतः भुगतान होगा, जब तक मैं सदस्यता रद्द नहीं करता/करती।`
                : `मैं सहमत हूँ कि आज ${upfrontAmount} लिया जाएगा। एक महीने बाद ${monthlyAmount} प्रति माह स्वतः भुगतान होगा, जब तक मैं सदस्यता रद्द नहीं करता/करती।`)
              : (trialEligible
                ? `I agree to pay ${upfrontAmount} today. After 7 days, ${monthlyAmount} will be charged automatically every month until I cancel.`
                : `I agree to pay ${upfrontAmount} today. After one month, ${monthlyAmount} will be charged automatically every month until I cancel.`)}
          </Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate('Legal')} style={styles.termsLink}>
          <Text style={[styles.termsText, { color: theme.goldText }]}>{hi ? 'सदस्यता और रद्द करने की शर्तें पढ़ें' : 'Read subscription and cancellation terms'}</Text>
        </Pressable>

        {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}

        <Pressable disabled={loading || processing || !config?.enabled} onPress={startPayment} style={({ pressed }) => [styles.payWrap, (pressed || processing) && { opacity: 0.88, transform: [{ scale: 0.99 }] }]}>
          <LinearGradient colors={theme.buttonGradient} style={styles.payButton}>
            {loading || processing ? <ActivityIndicator color={theme.buttonInk} /> : <ShieldIcon color={theme.buttonInk} />}
            <Text style={[styles.payText, { color: theme.buttonInk }]}>
              {processing
                ? (hi ? 'Razorpay खोल रहे हैं…' : 'Opening Razorpay…')
                : trialEligible
                  ? (hi ? `${upfrontAmount} देकर ट्रायल शुरू करें` : `Pay ${upfrontAmount} and start trial`)
                  : (hi ? `${upfrontAmount} देकर Premium शुरू करें` : `Pay ${upfrontAmount} and start Premium`)}
            </Text>
          </LinearGradient>
        </Pressable>

        <Pressable disabled={checking || processing} onPress={checkPayment} style={styles.checkLink}>
          {checking && <ActivityIndicator size="small" color={theme.gold1} />}
          <Text style={[styles.checkText, { color: theme.textSoft }]}>{hi ? 'भुगतान हो गया? स्थिति जाँचें' : 'Already paid? Check payment status'}</Text>
        </Pressable>

        <View style={styles.providerRow}>
          <ShieldIcon color={theme.textMuted} />
          <Text style={[styles.providerText, { color: theme.textMuted }]}>{hi ? 'भुगतान Razorpay द्वारा सुरक्षित रूप से संसाधित किया जाता है। ऐप कार्ड, CVV या UPI PIN नहीं रखता।' : 'Payments are processed securely by Razorpay. The app never stores your card, CVV, or UPI PIN.'}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 16, paddingTop: 22 },
  headingWrap: { alignItems: 'center', paddingHorizontal: 12, marginBottom: 18 },
  eyebrow: { fontFamily: fonts.cinzelSemi, fontSize: 10.5, letterSpacing: 1.6, marginBottom: 8 },
  heading: { fontFamily: fonts.playfairBold, fontSize: 28, lineHeight: 35, textAlign: 'center' },
  subheading: { fontFamily: fonts.inter, fontSize: 13.5, lineHeight: 20, textAlign: 'center', marginTop: 8 },
  planCard: { borderWidth: 1, borderRadius: radii.lg, padding: 18, overflow: 'hidden' },
  planTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planLabel: { fontFamily: fonts.interSemi, fontSize: 10, letterSpacing: 1.1 },
  price: { fontFamily: fonts.cinzelSemi, fontSize: 34, marginTop: 4 },
  secureBadge: { flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: 11, paddingVertical: 7 },
  secureBadgeText: { fontFamily: fonts.interSemi, fontSize: 11.5 },
  timeline: { borderTopWidth: 1, marginTop: 16, paddingTop: 14, gap: 14 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  dot: { width: 9, height: 9, borderRadius: 5, marginTop: 5 },
  timelineCopy: { flex: 1 },
  timelineTitle: { fontFamily: fonts.interSemi, fontSize: 13.5 },
  timelineText: { fontFamily: fonts.inter, fontSize: 11.5, lineHeight: 17, marginTop: 2 },
  methodCard: { flexDirection: 'row', gap: 12, borderWidth: 1, borderRadius: radii.lg, padding: 15, marginTop: 14 },
  methodIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  methodCopy: { flex: 1 },
  methodTitle: { fontFamily: fonts.interSemi, fontSize: 13.5 },
  methodText: { fontFamily: fonts.inter, fontSize: 11.5, lineHeight: 17, marginTop: 4 },
  consent: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderWidth: 1, borderRadius: radii.lg, padding: 14, marginTop: 14 },
  checkbox: { width: 22, height: 22, borderWidth: 1.5, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  consentText: { flex: 1, fontFamily: fonts.inter, fontSize: 12, lineHeight: 18 },
  termsLink: { alignSelf: 'center', paddingVertical: 10, paddingHorizontal: 10 },
  termsText: { fontFamily: fonts.interSemi, fontSize: 11.5, textDecorationLine: 'underline' },
  error: { fontFamily: fonts.interMed, fontSize: 12, lineHeight: 18, color: '#ef6767', textAlign: 'center', marginBottom: 10, paddingHorizontal: 8 },
  payWrap: { borderRadius: radii.pill, overflow: 'hidden', shadowColor: '#d49b2d', shadowOpacity: 0.32, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  payButton: { minHeight: 54, borderRadius: radii.pill, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 18 },
  payText: { fontFamily: fonts.interBold, fontSize: 14.5, textAlign: 'center' },
  checkLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15 },
  checkText: { fontFamily: fonts.interSemi, fontSize: 11.5, textDecorationLine: 'underline' },
  providerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 9, paddingHorizontal: 12, marginTop: 4 },
  providerText: { flex: 1, maxWidth: 390, fontFamily: fonts.inter, fontSize: 10.5, lineHeight: 16, textAlign: 'left' },
});
