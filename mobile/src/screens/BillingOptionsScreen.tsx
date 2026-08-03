import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radii } from '../theme/tokens';
import { useLang } from '../i18n/LanguageProvider';
import { Page } from '../components/Page';
import { Card } from '../components/Card';
import { useDialog } from '../components/DialogProvider';
import { cancelPaymentSubscription, getPaymentSubscription, type PaymentSubscriptionStatus } from '../lib/api';
import { updateStoredUser } from '../lib/auth';
import { hError, hSuccess, hTap } from '../lib/haptics';

function dateText(value: string | null | undefined, hi: boolean) {
  if (!value) return hi ? 'उपलब्ध नहीं' : 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return hi ? 'उपलब्ध नहीं' : 'Not available';
  return new Intl.DateTimeFormat(hi ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

export function BillingOptionsScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const hi = lang === 'hi';
  const dialog = useDialog();
  const [subscription, setSubscription] = useState<PaymentSubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    getPaymentSubscription()
      .then(async (response) => {
        if (!mounted) return;
        setSubscription(response.subscription);
        await updateStoredUser(response.user);
      })
      .catch((e) => mounted && setError(e?.message || (hi ? 'बिलिंग जानकारी लोड नहीं हो सकी।' : 'Billing details could not be loaded.')))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [hi]);

  const performCancel = async () => {
    if (cancelling) return;
    setCancelling(true);
    setError('');
    try {
      const response = await cancelPaymentSubscription();
      await updateStoredUser(response.user);
      setSubscription(response.subscription);
      hSuccess();
      if (!response.subscription.entitlementActive) {
        dialog(
          hi ? 'सदस्यता रद्द हो गई' : 'Subscription cancelled',
          hi ? 'भविष्य के स्वतः भुगतान रोक दिए गए हैं। Premium पहुँच अब बंद है।' : 'Future automatic payments have been stopped. Premium access has ended.',
          [{ text: hi ? 'ठीक है' : 'OK', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Subscribe' }] }) }],
        );
      } else {
        dialog(
          hi ? 'रद्द करने का अनुरोध दर्ज हो गया' : 'Cancellation scheduled',
          hi
            ? `${dateText(response.subscription.accessUntil, true)} के बाद स्वतः भुगतान और Premium पहुँच बंद हो जाएगी।`
            : `Automatic payments and Premium access will end after ${dateText(response.subscription.accessUntil, false)}.`,
          [{ text: hi ? 'ठीक है' : 'OK', onPress: () => navigation.goBack() }],
        );
      }
    } catch (e: any) {
      hError();
      setError(e?.message || (hi ? 'सदस्यता रद्द नहीं हो सकी। कृपया दोबारा प्रयास करें।' : 'The subscription could not be cancelled. Please try again.'));
    } finally {
      setCancelling(false);
    }
  };

  const requestCancel = () => {
    hTap();
    const trial = subscription?.status === 'authenticated';
    dialog(
      hi ? 'सदस्यता रद्द करें?' : 'Cancel subscription?',
      trial
        ? (hi ? 'ट्रायल अभी तुरंत बंद हो जाएगा और आगे ₹499 का स्वतः भुगतान नहीं होगा।' : 'Your trial will end immediately and the future ₹499 automatic payment will be stopped.')
        : (hi ? `आपकी Premium पहुँच ${dateText(subscription?.accessUntil || subscription?.currentPeriodEnd, true)} तक रहेगी। इसके बाद कोई स्वतः भुगतान नहीं होगा।` : `Premium access will remain available until ${dateText(subscription?.accessUntil || subscription?.currentPeriodEnd, false)}. No automatic payment will be made after that.`),
      [
        { text: hi ? 'सदस्यता जारी रखें' : 'Keep subscription', style: 'cancel' },
        { text: hi ? 'हाँ, रद्द करें' : 'Yes, cancel', style: 'destructive', onPress: () => { void performCancel(); } },
      ],
    );
  };

  const rows = [
    [hi ? 'नवीनीकरण' : 'Renewal', hi ? '₹499 प्रति माह स्वतः भुगतान' : '₹499 automatic payment every month'],
    [hi ? 'अगली भुगतान तिथि' : 'Next payment date', dateText(subscription?.nextChargeAt || subscription?.trialEndsAt, hi)],
    [hi ? 'भुगतान सुरक्षा' : 'Payment security', hi ? 'Razorpay mandate द्वारा सुरक्षित' : 'Secured through a Razorpay mandate'],
    [hi ? 'रसीद' : 'Receipt', hi ? 'हर सफल भुगतान के बाद Razorpay द्वारा भेजी जाती है' : 'Sent by Razorpay after each successful payment'],
  ];

  return (
    <Page title={hi ? 'बिलिंग और रद्द करना' : 'Billing & Cancellation'} onBack={() => { hTap(); navigation.goBack(); }}>
      <Card>
        <Text style={[styles.head, { color: theme.goldText }]}>{hi ? 'सदस्यता विवरण' : 'SUBSCRIPTION DETAILS'}</Text>
        {loading ? <ActivityIndicator color={theme.gold1} style={styles.loader} /> : rows.map(([key, value], index) => (
          <View key={key} style={[styles.row, { borderBottomColor: theme.line }, index === rows.length - 1 && styles.noBorder]}>
            <Text style={[styles.key, { color: theme.text }]}>{key}</Text>
            <Text style={[styles.value, { color: theme.textSoft }]}>{value}</Text>
          </View>
        ))}
      </Card>

      <View style={[styles.notice, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.08)' : '#fff8e8' }]}>
        <Text style={[styles.noticeTitle, { color: theme.text }]}>{hi ? 'आपके नियंत्रण में' : 'You stay in control'}</Text>
        <Text style={[styles.noticeText, { color: theme.textSoft }]}>
          {hi ? 'रद्द करने के बाद नया मासिक भुगतान नहीं होगा। सक्रिय मासिक अवधि का भुगतान वापस नहीं होता, लेकिन उसकी अंतिम तारीख तक Premium पहुँच जारी रहती है।' : 'After cancellation, no new monthly payment will be made. The current paid period is not refunded, but Premium access continues until its end date.'}
        </Text>
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        disabled={loading || cancelling || !subscription?.entitlementActive || subscription?.cancelAtCycleEnd}
        onPress={requestCancel}
        style={({ pressed }) => [styles.cancelButton, { borderColor: theme.gold1 }, (pressed || cancelling) && { opacity: 0.75 }]}
      >
        {cancelling && <ActivityIndicator size="small" color={theme.gold1} />}
        <Text style={[styles.cancelText, { color: theme.goldText }]}>
          {subscription?.cancelAtCycleEnd
            ? (hi ? 'रद्द करने का अनुरोध दर्ज है' : 'Cancellation already scheduled')
            : (hi ? 'सदस्यता रद्द करें' : 'Cancel subscription')}
        </Text>
      </Pressable>
    </Page>
  );
}

const styles = StyleSheet.create({
  head: { fontFamily: fonts.cinzelSemi, fontSize: 12.5, letterSpacing: 1.1, marginBottom: 7 },
  loader: { paddingVertical: 24 },
  row: { paddingVertical: 12, borderBottomWidth: 1 },
  noBorder: { borderBottomWidth: 0 },
  key: { fontFamily: fonts.interSemi, fontSize: 13 },
  value: { fontFamily: fonts.inter, fontSize: 12, lineHeight: 18, marginTop: 4 },
  notice: { borderWidth: 1, borderRadius: radii.lg, padding: 15, marginTop: 15 },
  noticeTitle: { fontFamily: fonts.interSemi, fontSize: 13 },
  noticeText: { fontFamily: fonts.inter, fontSize: 11.8, lineHeight: 18, marginTop: 5 },
  error: { color: '#ef6767', fontFamily: fonts.inter, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 16 },
  cancelButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 24, borderWidth: 1.2, borderRadius: radii.pill, paddingVertical: 13, paddingHorizontal: 20 },
  cancelText: { fontFamily: fonts.interSemi, fontSize: 12.5 },
});
