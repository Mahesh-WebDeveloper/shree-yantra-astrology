import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Path, Polygon, Rect, Circle, Polyline, Line } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { useT, useLang } from '../i18n/LanguageProvider';
import { Theme, fonts, radii } from '../theme/tokens';
import { Page } from '../components/Page';
import { Card } from '../components/Card';
import { hTap } from '../lib/haptics';

const sw = (c: string) => ({ width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none' as const, stroke: c, strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const });

const PERKS = [
  { en: 'Daily predictions', hi: 'दैनिक भविष्यवाणी', icon: (c: string) => <Svg {...sw(c)}><Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></Svg> },
  { en: 'Full kundli analysis', hi: 'पूर्ण कुंडली विश्लेषण', icon: (c: string) => <Svg {...sw(c)}><Rect x={3} y={3} width={18} height={18} /><Line x1={3} y1={3} x2={21} y2={21} /><Line x1={21} y1={3} x2={3} y2={21} /></Svg> },
  { en: 'Unlimited chat', hi: 'असीमित चैट', icon: (c: string) => <Svg {...sw(c)}><Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></Svg> },
  { en: 'Personal remedies', hi: 'व्यक्तिगत उपाय', icon: (c: string) => <Svg {...sw(c)}><Path d="M12 2C9 6 7 8 7 12a5 5 0 0 0 10 0c0-2-1-4-3-6-1 2-2 2-2 0z" /></Svg> },
  { en: 'Auspicious timings', hi: 'शुभ मुहूर्त', icon: (c: string) => <Svg {...sw(c)}><Circle cx={12} cy={12} r={10} /><Polyline points="12 6 12 12 16 14" /></Svg> },
  { en: 'Personal dashboard', hi: 'व्यक्तिगत डैशबोर्ड', icon: (c: string) => <Svg {...sw(c)}><Circle cx={12} cy={12} r={3} /><Path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8M4.6 9a1.7 1.7 0 0 0-.3-1.8" /></Svg> },
];

const BILLING: { en: [string, string]; hi: [string, string] }[] = [
  { en: ['Plan', 'Monthly'], hi: ['प्लान', 'मासिक'] },
  { en: ['Amount', '₹499 / month'], hi: ['राशि', '₹499 / माह'] },
  { en: ['Billing', 'Auto-renews monthly'], hi: ['बिलिंग', 'हर माह स्वतः नवीनीकरण'] },
  { en: ['Payment Method', 'UPI · Google Pay'], hi: ['भुगतान का तरीका', 'UPI · Google Pay'] },
];

function CardHead({ children, theme }: { children: React.ReactNode; theme: Theme }) {
  return <Text style={[styles.cardHead, { color: theme.goldText }]}>{children}</Text>;
}

export function ManageSubscriptionScreen({ navigation }: any) {
  const { theme } = useTheme();
  const t = useT();
  const { lang } = useLang();
  const hi = lang === 'hi';

  return (
    <Page title={t('ms.title', 'Manage Plan')} onBack={() => { hTap(); navigation.goBack(); }}>
      {/* Plan hero */}
      <Card contentStyle={styles.heroInner}>
        <LinearGradient colors={theme.buttonGradient} start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }} style={styles.crown}>
          <Svg width={30} height={30} viewBox="0 0 24 24" fill={theme.buttonInk}><Path d="M3 7l4 4 5-7 5 7 4-4-2 12H5L3 7z" /></Svg>
        </LinearGradient>
        <View style={[styles.status, { borderColor: 'rgba(74,222,128,0.4)', backgroundColor: 'rgba(74,222,128,0.12)' }]}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>{hi ? 'सक्रिय' : 'ACTIVE'}</Text>
        </View>
        <Text style={[styles.planName, { color: theme.goldText }]}>{hi ? 'Premium ज्योतिष' : 'Premium Astrology'}</Text>
        <Text style={[styles.planSub, { color: theme.textSoft }]}>{hi ? '24 Jun 2025 को स्वतः नवीनीकरण' : 'Renews automatically on 24 Jun 2025'}</Text>
      </Card>

      {/* Billing */}
      <Card style={{ marginTop: 14 }}>
        <CardHead theme={theme}>{hi ? 'बिलिंग विवरण' : 'BILLING DETAILS'}</CardHead>
        {BILLING.map((b, i) => {
          const [k, v] = hi ? b.hi : b.en;
          return (
            <View key={b.en[0]} style={[styles.row, { borderBottomColor: theme.line }, i === BILLING.length - 1 && styles.noBorder]}>
              <Text style={[styles.rowK, { color: theme.textSoft }]}>{k}</Text>
              <Text style={[styles.rowV, { color: theme.goldText }]}>{v}</Text>
            </View>
          );
        })}
      </Card>

      {/* Perks */}
      <Card style={{ marginTop: 14 }}>
        <CardHead theme={theme}>{hi ? 'आपके Premium लाभ' : 'YOUR PREMIUM PERKS'}</CardHead>
        <View style={styles.perks}>
          {PERKS.map((p) => (
            <View key={p.en} style={[styles.perk, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.55)' : '#ffffff' }]}>
              {p.icon(theme.gold1)}
              <Text style={[styles.perkText, { color: theme.textSoft }]} numberOfLines={1}>{hi ? p.hi : p.en}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Cancel is intentionally NOT here. A low-key link leads to a deeper Billing & Account
          screen where cancellation lives at the very bottom — so it is not front-and-centre. */}
      <Pressable onPress={() => { hTap(); navigation.navigate('BillingOptions'); }} hitSlop={6} style={styles.billingLink}>
        <Text style={[styles.billingLinkTxt, { color: theme.textMuted }]}>{hi ? 'बिलिंग और खाता विकल्प ›' : 'Billing & account options ›'}</Text>
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
  lightPlanShadow: { shadowColor: '#3d2809', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  planTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  currentPill: { borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: 7, paddingVertical: 2 },
  currentText: { fontFamily: fonts.interBold, fontSize: 8.5, letterSpacing: 0.8, color: '#3aa860' },
  planTitle: { fontFamily: fonts.playfair, fontSize: 15 },
  planMeta: { fontFamily: fonts.inter, fontSize: 11.5, marginTop: 2 },
  savePill: { alignSelf: 'flex-start', marginTop: 6, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radii.pill },
  saveText: { fontFamily: fonts.interBold, fontSize: 9, letterSpacing: 0.6 },
  price: { fontFamily: fonts.cinzelSemi, fontSize: 15 },
  per: { fontFamily: fonts.inter, fontSize: 9.5, letterSpacing: 1 },

  billingLink: { marginTop: 20, alignSelf: 'center', paddingVertical: 8 },
  billingLinkTxt: { fontFamily: fonts.inter, fontSize: 12, letterSpacing: 0.3 },
});
