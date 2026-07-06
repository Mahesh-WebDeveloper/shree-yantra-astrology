import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useT } from '../i18n/LanguageProvider';
import { fonts, radii } from '../theme/tokens';
import { Page } from '../components/Page';
import { Card } from '../components/Card';
import { useDialog } from '../components/DialogProvider';
import { hTap } from '../lib/haptics';

// Deeper "Billing & Account" screen. Reached from Manage Subscription → a low-key link,
// so it sits 3 screens in. Mostly benign billing info; cancellation is a small, muted link
// at the very bottom (kept out of the way to reduce accidental churn, per product decision).
const INFO: [string, string][] = [
  ['Renewal', 'Your Monthly plan renews automatically. Nothing to do to stay premium.'],
  ['Payment method', 'UPI · Google Pay. Update it from your UPI app if your bank changes.'],
  ['Receipts', 'A payment receipt is emailed to you after every renewal.'],
  ['Change payment date', 'The billing date follows your first subscription date and cannot be changed.'],
];

export function BillingOptionsScreen({ navigation }: any) {
  const { theme } = useTheme();
  const t = useT();
  const dialog = useDialog();

  const cancel = () => {
    hTap();
    dialog(
      'Cancel your subscription?',
      'You will lose access to all premium predictions, kundli analysis, remedies and consultations. This cannot be undone from the app.',
      [
        { text: 'KEEP MY PREMIUM', style: 'cancel' },
        { text: 'Cancel anyway', style: 'destructive', onPress: () => navigation.goBack() },
      ],
    );
  };

  return (
    <Page title={t('billing.title', 'Billing & Account')} onBack={() => { hTap(); navigation.goBack(); }}>
      <Card>
        <Text style={[styles.head, { color: theme.goldText }]}>BILLING & ACCOUNT</Text>
        {INFO.map(([k, v], i) => (
          <View key={k} style={[styles.row, { borderBottomColor: theme.line }, i === INFO.length - 1 && styles.noBorder]}>
            <Text style={[styles.k, { color: theme.text }]}>{k}</Text>
            <Text style={[styles.v, { color: theme.textSoft }]}>{v}</Text>
          </View>
        ))}
      </Card>

      <Text style={[styles.note, { color: theme.textMuted }]}>
        For any billing question, use Help & Support → Email support and our team will assist within a day.
      </Text>

      {/* buried at the very bottom, small and muted */}
      <Pressable onPress={cancel} hitSlop={6} style={styles.cancelLink}>
        <Text style={[styles.cancelTxt, { color: theme.textMuted }]}>Cancel subscription</Text>
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
