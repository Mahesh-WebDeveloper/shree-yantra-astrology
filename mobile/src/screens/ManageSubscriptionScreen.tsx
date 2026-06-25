import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Path, Polygon, Rect, Circle, Polyline, Line } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { useT } from '../i18n/LanguageProvider';
import { Theme, fonts, radii } from '../theme/tokens';
import { Page } from '../components/Page';
import { Card } from '../components/Card';
import { useDialog } from '../components/DialogProvider';
import { hTap, hSelect } from '../lib/haptics';
import { getPlans, Plan } from '../lib/api';

const sw = (c: string) => ({ width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none' as const, stroke: c, strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const });

const PERKS = [
  { label: 'Daily predictions', icon: (c: string) => <Svg {...sw(c)}><Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></Svg> },
  { label: 'Full kundli analysis', icon: (c: string) => <Svg {...sw(c)}><Rect x={3} y={3} width={18} height={18} /><Line x1={3} y1={3} x2={21} y2={21} /><Line x1={21} y1={3} x2={3} y2={21} /></Svg> },
  { label: 'Unlimited chat', icon: (c: string) => <Svg {...sw(c)}><Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></Svg> },
  { label: 'Personal remedies', icon: (c: string) => <Svg {...sw(c)}><Path d="M12 2C9 6 7 8 7 12a5 5 0 0 0 10 0c0-2-1-4-3-6-1 2-2 2-2 0z" /></Svg> },
  { label: 'Auspicious timings', icon: (c: string) => <Svg {...sw(c)}><Circle cx={12} cy={12} r={10} /><Polyline points="12 6 12 12 16 14" /></Svg> },
  { label: 'Personal dashboard', icon: (c: string) => <Svg {...sw(c)}><Circle cx={12} cy={12} r={3} /><Path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8M4.6 9a1.7 1.7 0 0 0-.3-1.8" /></Svg> },
];

const BILLING = [
  ['Plan', 'Monthly'],
  ['Amount', '₹499 / month'],
  ['Started On', '24 Apr 2025'],
  ['Next Billing', '24 Jun 2025'],
  ['Payment Method', 'UPI · Google Pay'],
];

const PLANS = [
  { key: 'monthly', name: 'Monthly', sub: 'Renews every month', price: '₹499', per: '/MONTH' },
  { key: 'quarterly', name: 'Quarterly', sub: 'Renews every 3 months', price: '₹1,299', per: '/QUARTER', save: 'SAVE 15%' },
  { key: 'yearly', name: 'Yearly', sub: 'Renews every year', price: '₹3,999', per: '/YEAR', save: 'SAVE 33%' },
];

const HISTORY = [
  ['24 May 2025 · UPI', '₹499'],
  ['24 Apr 2025 · UPI', '₹499'],
  ['24 Mar 2025 · Card', '₹499'],
  ['24 Feb 2025 · Card', '₹499'],
];

function CardHead({ children, theme }: { children: React.ReactNode; theme: Theme }) {
  return <Text style={[styles.cardHead, { color: theme.goldText }]}>{children}</Text>;
}

export function ManageSubscriptionScreen({ navigation }: any) {
  const { theme } = useTheme();
  const dialog = useDialog();
  const t = useT();
  const [current, setCurrent] = useState('monthly');
  const [livePlans, setLivePlans] = useState<Plan[] | null>(null);

  useEffect(() => {
    let on = true;
    getPlans().then((r) => { if (on && r.plans.length) setLivePlans(r.plans); }).catch(() => {});
    return () => { on = false; };
  }, []);

  const plans = useMemo(() => {
    if (!livePlans) return PLANS;
    return livePlans.map((p) => ({
      key: p._id,
      name: p.name,
      sub: `${p.durationDays} days`,
      price: p.priceINR === 0 ? 'Free' : `₹${p.priceINR}`,
      per: p.durationDays >= 365 ? '/YEAR' : p.durationDays >= 90 ? '/QUARTER' : '/PLAN',
      save: p.badge || undefined,
      features: p.features,
    }));
  }, [livePlans]);

  const switchPlan = (key: string, name: string, price: string) => {
    if (key === current) return;
    hTap();
    dialog(`Switch to ${name}?`, `Your new ${name.toLowerCase()} plan (${price}) will activate from the next billing cycle.`, [
      { text: 'KEEP CURRENT', style: 'cancel' },
      { text: 'SWITCH PLAN', onPress: () => { hSelect(); setCurrent(key); } },
    ]);
  };

  const cancel = () => {
    hTap();
    dialog('Cancel your subscription?', 'You will keep premium access until your current billing cycle ends. After that, only free predictions will be available.', [
      { text: 'KEEP PREMIUM', style: 'cancel' },
      { text: 'CANCEL ANYWAY', style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <Page title={t('ms.title', 'Manage Plan')} onBack={() => { hTap(); navigation.goBack(); }}>
      {/* Plan hero */}
      <Card contentStyle={styles.heroInner}>
        <LinearGradient colors={theme.buttonGradient} start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }} style={styles.crown}>
          <Svg width={30} height={30} viewBox="0 0 24 24" fill={theme.buttonInk}><Path d="M3 7l4 4 5-7 5 7 4-4-2 12H5L3 7z" /></Svg>
        </LinearGradient>
        <View style={[styles.status, { borderColor: 'rgba(74,222,128,0.4)', backgroundColor: 'rgba(74,222,128,0.12)' }]}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>ACTIVE</Text>
        </View>
        <Text style={[styles.planName, { color: theme.goldText }]}>Premium Astrology</Text>
        <Text style={[styles.planSub, { color: theme.textSoft }]}>Renews automatically on 24 Jun 2025</Text>
      </Card>

      {/* Billing */}
      <Card style={{ marginTop: 14 }}>
        <CardHead theme={theme}>BILLING DETAILS</CardHead>
        {BILLING.map(([k, v], i) => (
          <View key={k} style={[styles.row, { borderBottomColor: theme.line }, i === BILLING.length - 1 && styles.noBorder]}>
            <Text style={[styles.rowK, { color: theme.textSoft }]}>{k}</Text>
            <Text style={[styles.rowV, { color: theme.goldText }]}>{v}</Text>
          </View>
        ))}
      </Card>

      {/* Perks */}
      <Card style={{ marginTop: 14 }}>
        <CardHead theme={theme}>YOUR PREMIUM PERKS</CardHead>
        <View style={styles.perks}>
          {PERKS.map((p) => (
            <View key={p.label} style={[styles.perk, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.55)' : 'rgba(176,115,22,0.05)' }]}>
              {p.icon(theme.gold1)}
              <Text style={[styles.perkText, { color: theme.textSoft }]} numberOfLines={1}>{p.label}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Text style={[styles.section, { color: theme.goldText }]}>Change Plan</Text>
      <View style={{ gap: 10 }}>
        {plans.map((p) => {
          const isCurrent = p.key === current;
          return (
            <Pressable
              key={p.key}
              onPress={() => switchPlan(p.key, p.name, p.price)}
              style={({ pressed }) => [
                styles.planCard,
                { backgroundColor: isCurrent ? (theme.isDark ? 'rgba(233,184,80,0.08)' : 'rgba(176,115,22,0.07)') : theme.cardBg, borderColor: isCurrent ? theme.gold1 : theme.cardBorder, borderWidth: isCurrent ? 1.5 : 1 },
                pressed && !isCurrent && { transform: [{ scale: 0.985 }], borderColor: theme.gold2 },
              ]}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={styles.planTitleRow}>
                  <Text style={[styles.planTitle, { color: theme.text }]}>{p.name}</Text>
                  {isCurrent && (
                    <View style={[styles.currentPill, { borderColor: 'rgba(74,222,128,0.4)', backgroundColor: 'rgba(74,222,128,0.12)' }]}>
                      <Text style={styles.currentText}>CURRENT</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.planMeta, { color: theme.textMuted }]}>{p.sub}</Text>
                {p.save && (
                  <LinearGradient colors={theme.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.savePill}>
                    <Text style={[styles.saveText, { color: theme.buttonInk }]}>{p.save}</Text>
                  </LinearGradient>
                )}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.price, { color: theme.goldText }]}>{p.price}</Text>
                <Text style={[styles.per, { color: theme.textMuted }]}>{p.per}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* History */}
      <Card style={{ marginTop: 14 }}>
        <CardHead theme={theme}>PAYMENT HISTORY</CardHead>
        {HISTORY.map(([k, v], i) => (
          <View key={k} style={[styles.row, { borderBottomColor: theme.line }, i === HISTORY.length - 1 && styles.noBorder]}>
            <Text style={[styles.histK, { color: theme.textSoft }]}>{k}</Text>
            <Text style={[styles.rowV, { color: theme.goldText }]}>{v}</Text>
          </View>
        ))}
      </Card>

      <Pressable
        onPress={cancel}
        style={({ pressed }) => [styles.cancel, { borderColor: 'rgba(220,80,80,0.4)' }, pressed && { backgroundColor: 'rgba(220,80,80,0.1)', borderColor: 'rgba(220,80,80,0.7)' }]}
        android_ripple={{ color: 'rgba(220,80,80,0.12)' }}
      >
        <Text style={styles.cancelText}>CANCEL SUBSCRIPTION</Text>
      </Pressable>
    </Page>
  );
}

const styles = StyleSheet.create({
  heroInner: { alignItems: 'center', paddingVertical: 22, paddingHorizontal: 18 },
  crown: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 12, shadowColor: '#e9b850', shadowOpacity: 0.45, shadowRadius: 16, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 5, borderRadius: radii.pill, borderWidth: 1, marginBottom: 10 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ade80' },
  statusText: { fontFamily: fonts.cinzelSemi, fontSize: 10.5, letterSpacing: 1.5, color: '#3aa860' },
  planName: { fontFamily: fonts.playfairBold, fontSize: 24, marginTop: 2 },
  planSub: { fontFamily: fonts.inter, fontSize: 13, marginTop: 4 },

  cardHead: { fontFamily: fonts.cinzelSemi, fontSize: 13, letterSpacing: 1.2, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  noBorder: { borderBottomWidth: 0 },
  rowK: { fontFamily: fonts.inter, fontSize: 13.5 },
  rowV: { fontFamily: fonts.cinzelSemi, fontSize: 13 },
  histK: { fontFamily: fonts.inter, fontSize: 12.5 },

  perks: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  perk: { width: '47.8%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 12, borderWidth: 1 },
  perkText: { fontFamily: fonts.inter, fontSize: 12, flex: 1 },

  section: { fontFamily: fonts.cinzelSemi, fontSize: 13, letterSpacing: 1.4, marginTop: 22, marginBottom: 10, marginLeft: 2 },
  planCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: radii.lg, borderWidth: 1 },
  planTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  currentPill: { borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: 7, paddingVertical: 2 },
  currentText: { fontFamily: fonts.interBold, fontSize: 8.5, letterSpacing: 0.8, color: '#3aa860' },
  planTitle: { fontFamily: fonts.playfair, fontSize: 15 },
  planMeta: { fontFamily: fonts.inter, fontSize: 11.5, marginTop: 2 },
  savePill: { alignSelf: 'flex-start', marginTop: 6, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radii.pill },
  saveText: { fontFamily: fonts.interBold, fontSize: 9, letterSpacing: 0.6 },
  price: { fontFamily: fonts.cinzelSemi, fontSize: 15 },
  per: { fontFamily: fonts.inter, fontSize: 9.5, letterSpacing: 1 },

  cancel: { marginTop: 16, paddingVertical: 13, borderRadius: radii.pill, borderWidth: 1, alignItems: 'center' },
  cancelText: { fontFamily: fonts.cinzelSemi, fontSize: 12.5, letterSpacing: 1.2, color: '#d9534f' },
});
