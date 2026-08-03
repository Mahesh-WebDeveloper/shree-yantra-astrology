import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radii } from '../theme/tokens';
import { useLang } from '../i18n/LanguageProvider';
import { Page } from '../components/Page';
import { Card } from '../components/Card';
import { getPaymentSubscription, type PaymentSubscriptionStatus } from '../lib/api';
import { updateStoredUser } from '../lib/auth';
import { hTap } from '../lib/haptics';

const PERKS = {
  en: ['Personal Kundli and reports', 'Daily and period predictions', 'Panchang, Muhurat and Choghadiya', 'Remedies, Vastu and spiritual library'],
  hi: ['व्यक्तिगत कुंडली और रिपोर्ट', 'दैनिक और अवधि आधारित राशिफल', 'पंचांग, मुहूर्त और चौघड़िया', 'उपाय, वास्तु और धार्मिक पुस्तकालय'],
};

function formatDate(value: string | null | undefined, hi: boolean) {
  if (!value) return hi ? 'उपलब्ध नहीं' : 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return hi ? 'उपलब्ध नहीं' : 'Not available';
  return new Intl.DateTimeFormat(hi ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

function statusCopy(status: PaymentSubscriptionStatus | null, hi: boolean) {
  if (!status) return { label: hi ? 'लोड हो रहा है' : 'LOADING', note: '' };
  if (status.cancelAtCycleEnd && status.entitlementActive) return {
    label: hi ? 'रद्द करने का अनुरोध दर्ज' : 'CANCELLATION SCHEDULED',
    note: hi ? `${formatDate(status.accessUntil, true)} तक Premium उपलब्ध रहेगा` : `Premium remains available until ${formatDate(status.accessUntil, false)}`,
  };
  if (status.status === 'authenticated' && status.entitlementActive) return {
    label: status.initialPeriodType === 'paid'
      ? (hi ? 'सदस्यता सक्रिय' : 'SUBSCRIPTION ACTIVE')
      : (hi ? 'ट्रायल सक्रिय' : 'TRIAL ACTIVE'),
    note: status.initialPeriodType === 'paid'
      ? (hi ? `अगला भुगतान: ${formatDate(status.nextChargeAt, true)}` : `Next payment: ${formatDate(status.nextChargeAt, false)}`)
      : (hi ? `${formatDate(status.trialEndsAt, true)} से ₹499 प्रति माह` : `₹499/month starts on ${formatDate(status.trialEndsAt, false)}`),
  };
  if (status.status === 'active' && status.entitlementActive) return {
    label: hi ? 'सदस्यता सक्रिय' : 'SUBSCRIPTION ACTIVE',
    note: hi ? `अगला भुगतान: ${formatDate(status.nextChargeAt, true)}` : `Next payment: ${formatDate(status.nextChargeAt, false)}`,
  };
  if (status.status === 'pending' && status.entitlementActive) return {
    label: hi ? 'भुगतान प्रक्रिया में' : 'PAYMENT PENDING',
    note: hi ? 'Razorpay भुगतान दोबारा संसाधित कर रहा है।' : 'Razorpay is retrying the renewal payment.',
  };
  return {
    label: hi ? 'सदस्यता सक्रिय नहीं है' : 'NO ACTIVE SUBSCRIPTION',
    note: hi ? 'Premium सुविधाओं के लिए सदस्यता शुरू करें।' : 'Start a subscription to access Premium features.',
  };
}

export function ManageSubscriptionScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const hi = lang === 'hi';
  const [subscription, setSubscription] = useState<PaymentSubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getPaymentSubscription();
      setSubscription(response.subscription);
      await updateStoredUser(response.user);
    } catch (e: any) {
      setError(e?.message || (hi ? 'सदस्यता की जानकारी लोड नहीं हो सकी।' : 'Subscription details could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [hi]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const copy = statusCopy(subscription, hi);
  const active = !!subscription?.entitlementActive;
  const green = active && !subscription?.cancelAtCycleEnd;
  const billingRows = [
    [hi ? 'प्लान' : 'Plan', hi ? 'Premium मासिक' : 'Premium Monthly'],
    [subscription?.initialPeriodType === 'paid' ? (hi ? 'आज का भुगतान' : 'Paid today') : (hi ? 'ट्रायल' : 'Trial'), subscription?.initialPeriodType === 'paid' ? '₹499' : (hi ? '7 दिन के लिए ₹1' : '₹1 for 7 days')],
    [hi ? 'मासिक शुल्क' : 'Monthly price', '₹499'],
    [hi ? 'अगला भुगतान' : 'Next payment', formatDate(subscription?.nextChargeAt || subscription?.trialEndsAt, hi)],
    [hi ? 'भुगतान व्यवस्था' : 'Payment mandate', hi ? 'Razorpay द्वारा सुरक्षित' : 'Secured by Razorpay'],
  ];

  return (
    <Page title={hi ? 'मेरी सदस्यता' : 'My Subscription'} onBack={() => { hTap(); navigation.goBack(); }}>
      <Card contentStyle={styles.heroInner}>
        <LinearGradient colors={theme.buttonGradient} style={styles.crown}>
          <Svg width={30} height={30} viewBox="0 0 24 24" fill={theme.buttonInk}><Path d="M3 7l4 4 5-7 5 7 4-4-2 12H5L3 7z" /></Svg>
        </LinearGradient>
        {loading ? <ActivityIndicator color={theme.gold1} /> : (
          <View style={[styles.status, { borderColor: green ? 'rgba(74,222,128,0.45)' : theme.cardBorder, backgroundColor: green ? 'rgba(74,222,128,0.1)' : 'rgba(233,184,80,0.09)' }]}>
            <CircleDot color={green ? '#4ade80' : theme.gold1} />
            <Text style={[styles.statusText, { color: green ? '#45b96a' : theme.goldText }]}>{copy.label}</Text>
          </View>
        )}
        <Text style={[styles.planName, { color: theme.goldText }]}>{hi ? 'Shree Yantra Premium' : 'Shree Yantra Premium'}</Text>
        <Text style={[styles.planSub, { color: theme.textSoft }]}>{copy.note}</Text>
      </Card>

      {!!error && (
        <View style={styles.errorWrap}>
          <Text style={styles.error}>{error}</Text>
          <Pressable onPress={load}><Text style={[styles.retry, { color: theme.goldText }]}>{hi ? 'दोबारा प्रयास करें' : 'Try again'}</Text></Pressable>
        </View>
      )}

      <Card style={styles.cardGap}>
        <Text style={[styles.cardHead, { color: theme.goldText }]}>{hi ? 'बिलिंग विवरण' : 'BILLING DETAILS'}</Text>
        {billingRows.map(([key, value], index) => (
          <View key={key} style={[styles.row, { borderBottomColor: theme.line }, index === billingRows.length - 1 && styles.noBorder]}>
            <Text style={[styles.rowKey, { color: theme.textSoft }]}>{key}</Text>
            <Text style={[styles.rowValue, { color: theme.text }]}>{value}</Text>
          </View>
        ))}
      </Card>

      <Card style={styles.cardGap}>
        <Text style={[styles.cardHead, { color: theme.goldText }]}>{hi ? 'Premium में शामिल' : 'INCLUDED WITH PREMIUM'}</Text>
        {(hi ? PERKS.hi : PERKS.en).map((perk) => (
          <View key={perk} style={styles.perkRow}>
            <View style={[styles.checkCircle, { backgroundColor: theme.isDark ? 'rgba(233,184,80,0.12)' : '#fff6de' }]}>
              <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={theme.gold1} strokeWidth={2.6} strokeLinecap="round"><Path d="m5 12 4 4L19 6" /></Svg>
            </View>
            <Text style={[styles.perkText, { color: theme.textSoft }]}>{perk}</Text>
          </View>
        ))}
      </Card>

      {active ? (
        <Pressable onPress={() => { hTap(); navigation.navigate('BillingOptions'); }} style={[styles.manageButton, { borderColor: theme.gold1 }]}>
          <Text style={[styles.manageText, { color: theme.goldText }]}>{hi ? 'नवीनीकरण प्रबंधित करें या सदस्यता रद्द करें' : 'Manage renewal or cancel subscription'}</Text>
        </Pressable>
      ) : (
        <Pressable onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Subscribe' }] })} style={styles.subscribeWrap}>
          <LinearGradient colors={theme.buttonGradient} style={styles.subscribeButton}>
            <Text style={[styles.subscribeText, { color: theme.buttonInk }]}>{hi ? 'Premium सदस्यता शुरू करें' : 'Start Premium subscription'}</Text>
          </LinearGradient>
        </Pressable>
      )}
    </Page>
  );
}

function CircleDot({ color }: { color: string }) {
  return <View style={[styles.statusDot, { backgroundColor: color }]} />;
}

const styles = StyleSheet.create({
  heroInner: { alignItems: 'center', paddingVertical: 22, paddingHorizontal: 18 },
  crown: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.pill, borderWidth: 1, marginBottom: 10 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontFamily: fonts.interBold, fontSize: 9.5, letterSpacing: 1 },
  planName: { fontFamily: fonts.playfairBold, fontSize: 23, textAlign: 'center' },
  planSub: { fontFamily: fonts.inter, fontSize: 12.5, lineHeight: 18, textAlign: 'center', marginTop: 6 },
  errorWrap: { alignItems: 'center', paddingVertical: 12 },
  error: { color: '#ef6767', fontFamily: fonts.inter, fontSize: 12, textAlign: 'center' },
  retry: { fontFamily: fonts.interSemi, fontSize: 12, textDecorationLine: 'underline', marginTop: 7 },
  cardGap: { marginTop: 14 },
  cardHead: { fontFamily: fonts.cinzelSemi, fontSize: 12, letterSpacing: 1.1, marginBottom: 7 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingVertical: 11, borderBottomWidth: 1 },
  noBorder: { borderBottomWidth: 0 },
  rowKey: { flex: 1, fontFamily: fonts.inter, fontSize: 12.5 },
  rowValue: { flex: 1.2, fontFamily: fonts.interSemi, fontSize: 12.5, textAlign: 'right' },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  checkCircle: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  perkText: { flex: 1, fontFamily: fonts.inter, fontSize: 12.5 },
  manageButton: { alignSelf: 'stretch', marginTop: 20, borderWidth: 1.2, borderRadius: radii.pill, paddingVertical: 13, paddingHorizontal: 18 },
  manageText: { fontFamily: fonts.interSemi, fontSize: 12.5, lineHeight: 17, textAlign: 'center' },
  subscribeWrap: { marginTop: 20, borderRadius: radii.pill, overflow: 'hidden' },
  subscribeButton: { paddingVertical: 14, paddingHorizontal: 18, borderRadius: radii.pill },
  subscribeText: { fontFamily: fonts.interBold, fontSize: 13.5, textAlign: 'center' },
});
