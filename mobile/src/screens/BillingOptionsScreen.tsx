import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useT, useLang } from '../i18n/LanguageProvider';
import { fonts, radii } from '../theme/tokens';
import { Page } from '../components/Page';
import { Card } from '../components/Card';
import { useDialog } from '../components/DialogProvider';
import { hTap } from '../lib/haptics';
import { setPremium } from '../lib/premiumStore';

// Deeper "Billing & Account" screen. Reached from Manage Subscription → a low-key link,
// so it sits 3 screens in. Mostly benign billing info; cancellation is a small, muted link
// at the very bottom (kept out of the way to reduce accidental churn, per product decision).
const INFO: { en: [string, string]; hi: [string, string] }[] = [
  {
    en: ['Renewal', 'Your Monthly plan renews automatically. Nothing to do to stay premium.'],
    hi: ['नवीनीकरण', 'आपका मासिक प्लान स्वतः नवीनीकृत होता है। Premium बने रहने के लिए कुछ करने की जरूरत नहीं।'],
  },
  {
    en: ['Payment method', 'UPI · Google Pay. Update it from your UPI app if your bank changes.'],
    hi: ['भुगतान का तरीका', 'UPI · Google Pay. बैंक बदलने पर इसे अपने UPI ऐप से अपडेट करें।'],
  },
  {
    en: ['Receipts', 'A payment receipt is emailed to you after every renewal.'],
    hi: ['रसीदें', 'हर नवीनीकरण के बाद भुगतान रसीद आपके ईमेल पर भेजी जाती है।'],
  },
  {
    en: ['Change payment date', 'The billing date follows your first subscription date and cannot be changed.'],
    hi: ['भुगतान तिथि बदलें', 'बिलिंग तिथि आपकी पहली सदस्यता तिथि पर आधारित होती है और इसे बदला नहीं जा सकता।'],
  },
];

export function BillingOptionsScreen({ navigation }: any) {
  const { theme } = useTheme();
  const t = useT();
  const { lang } = useLang();
  const hi = lang === 'hi';
  const dialog = useDialog();

  const cancel = () => {
    hTap();
    dialog(
      hi ? 'अपनी सदस्यता रद्द करें?' : 'Cancel your subscription?',
      hi
        ? 'आप सभी premium भविष्यवाणियों, कुंडली विश्लेषण, उपायों और परामर्श तक पहुँच खो देंगे। इसे ऐप से पूर्ववत नहीं किया जा सकता।'
        : 'You will lose access to all premium predictions, kundli analysis, remedies and consultations. This cannot be undone from the app.',
      [
        { text: hi ? 'मेरा Premium रखें' : 'KEEP MY PREMIUM', style: 'cancel' },
        { text: hi ? 'फिर भी रद्द करें' : 'Cancel anyway', style: 'destructive', onPress: () => { setPremium(false); navigation.goBack(); } },
      ],
    );
  };

  return (
    <Page title={t('billing.title', 'Billing & Account')} onBack={() => { hTap(); navigation.goBack(); }}>
      <Card>
        <Text style={[styles.head, { color: theme.goldText }]}>{hi ? 'बिलिंग और खाता' : 'BILLING & ACCOUNT'}</Text>
        {INFO.map((info, i) => {
          const [k, v] = hi ? info.hi : info.en;
          return (
            <View key={info.en[0]} style={[styles.row, { borderBottomColor: theme.line }, i === INFO.length - 1 && styles.noBorder]}>
              <Text style={[styles.k, { color: theme.text }]}>{k}</Text>
              <Text style={[styles.v, { color: theme.textSoft }]}>{v}</Text>
            </View>
          );
        })}
      </Card>

      <Text style={[styles.note, { color: theme.textMuted }]}>
        {hi
          ? 'किसी भी बिलिंग प्रश्न के लिए, Help & Support → Email support का उपयोग करें और हमारी टीम एक दिन के भीतर सहायता करेगी।'
          : 'For any billing question, use Help & Support → Email support and our team will assist within a day.'}
      </Text>

      {/* buried at the very bottom, small and muted */}
      <Pressable onPress={cancel} hitSlop={6} style={styles.cancelLink}>
        <Text style={[styles.cancelTxt, { color: theme.textMuted }]}>{hi ? 'सदस्यता रद्द करें' : 'Cancel subscription'}</Text>
      </Pressable>
    </Page>
  );
}

const styles = StyleSheet.create({
  head: { fontFamily: fonts.cinzelSemi, fontSize: 13, letterSpacing: 1.2, marginBottom: 8 },
  row: { paddingVertical: 12, borderBottomWidth: 1 },
  noBorder: { borderBottomWidth: 0 },
  k: { fontFamily: fonts.interSemi, fontSize: 13.5 },
  v: { fontFamily: fonts.inter, fontSize: 12.5, lineHeight: 18, marginTop: 3 },
  note: { fontFamily: fonts.inter, fontSize: 11.5, lineHeight: 17, marginTop: 16, paddingHorizontal: 2 },
  cancelLink: { marginTop: 40, marginBottom: 8, alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 12 },
  cancelTxt: { fontFamily: fonts.inter, fontSize: 12, textDecorationLine: 'underline', opacity: 0.7 },
});
