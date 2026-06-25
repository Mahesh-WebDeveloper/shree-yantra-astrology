import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutAnimation, Platform, UIManager, Linking } from 'react-native';
import Svg, { Path, Circle, Polyline, Line } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { Theme, fonts, radii } from '../theme/tokens';
import { Page } from '../components/Page';
import { Card } from '../components/Card';
import { useDialog } from '../components/DialogProvider';
import { hTap, hSelect } from '../lib/haptics';
import { useAppConfig } from '../context/AppConfigProvider';
import { useT } from '../i18n/LanguageProvider';
import { getFaq } from '../lib/api';

const QUICK_KEY: Record<string, string> = { chat: 'help.chat', call: 'help.call', email: 'help.emailSupport', kb: 'help.kb' };

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const sw = (c: string, n = 1.7) => ({ width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none' as const, stroke: c, strokeWidth: n, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const });

const QUICK = [
  { key: 'chat', label: 'Chat with us', icon: (c: string) => <Svg {...sw(c)}><Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></Svg> },
  { key: 'call', label: 'Call helpline', icon: (c: string) => <Svg {...sw(c)}><Path d="M22 16.92V21a1 1 0 0 1-1.11 1A19.94 19.94 0 0 1 2 4.11 1 1 0 0 1 3 3h4a1 1 0 0 1 1 .75l1.5 6a1 1 0 0 1-.27 1L7 13a16 16 0 0 0 4 4l2.25-2.23a1 1 0 0 1 1-.27l6 1.5A1 1 0 0 1 22 17z" /></Svg> },
  { key: 'email', label: 'Email support', icon: (c: string) => <Svg {...sw(c)}><Path d="M4 4h16v16H4z" /><Polyline points="4 4 12 13 20 4" /></Svg> },
  { key: 'kb', label: 'Knowledge base', icon: (c: string) => <Svg {...sw(c)}><Circle cx={12} cy={12} r={10} /><Path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2-3 4" /><Line x1={12} y1={17} x2={12.01} y2={17} /></Svg> },
];

const FAQS = [
  { q: 'How is my horoscope calculated?', a: 'We use authentic Vedic Lahiri ayanamsa with your exact birth date, time and location to generate planetary positions and dasha periods.' },
  { q: 'Can I cancel my Premium subscription?', a: "Yes, cancel anytime from Profile → Manage Subscription. You'll continue to enjoy Premium until the end of the billing cycle." },
  { q: 'Are the astrologers verified?', a: 'All our astrologers go through a 7-step verification including qualification check, test consultations and user-rating review.' },
  { q: 'How accurate are the predictions?', a: 'Vedic astrology is a science of probabilities, not absolutes. Our 4.8★ user rating reflects the average accuracy reported by our community.' },
  { q: 'How do I talk to an astrologer?', a: 'Open the Consult tab, pick an astrologer, and start chat or call. Premium members get free 5-min sessions every day.' },
];

function Faq({ q, a, open, onToggle, theme }: { q: string; a: string; open: boolean; onToggle: () => void; theme: Theme }) {
  return (
    <Pressable
      onPress={onToggle}
      style={[
        styles.faq,
        {
          backgroundColor: theme.cardBg,
          borderColor: open ? theme.gold1 : theme.cardBorder,
        },
      ]}
    >
      <View style={styles.faqHead}>
        <Text style={[styles.faqQ, { color: open ? theme.goldText : theme.text }]}>{q}</Text>
        <View style={[styles.faqSignWrap, { borderColor: open ? theme.gold1 : theme.cardBorder, backgroundColor: open ? (theme.isDark ? 'rgba(233,184,80,0.14)' : 'rgba(176,115,22,0.1)') : 'transparent' }]}>
          <Text style={[styles.faqSign, { color: theme.gold1 }]}>{open ? '−' : '+'}</Text>
        </View>
      </View>
      {open && <Text style={[styles.faqA, { color: theme.textSoft }]}>{a}</Text>}
    </Pressable>
  );
}

export function HelpScreen({ navigation }: any) {
  const { theme } = useTheme();
  const dialog = useDialog();
  const { config } = useAppConfig();
  const t = useT();
  const supportEmail = config.support?.email || 'support@shreeyantra.app';
  const supportPhone = (config.support?.phone || '').replace(/\s/g, '') || '18002667890';
  const [openFaq, setOpenFaq] = useState(0); // first open by default (matches web)

  // FAQ admin-panel se (fallback static)
  const [liveFaqs, setLiveFaqs] = useState<{ q: string; a: string }[] | null>(null);
  useEffect(() => {
    getFaq().then((r) => {
      if (r.faq && r.faq.length) setLiveFaqs(r.faq.map((f) => ({ q: f.question, a: f.answer })));
    }).catch(() => {});
  }, []);
  const faqs = liveFaqs || FAQS;

  const toggleFaq = (i: number) => {
    hSelect();
    LayoutAnimation.configureNext(LayoutAnimation.create(220, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity));
    setOpenFaq((cur) => (cur === i ? -1 : i)); // single-open: opening one closes the rest
  };

  const onQuick = (key: string) => {
    hTap();
    if (key === 'call') {
      Linking.openURL(`tel:${supportPhone}`).catch(() => dialog('Call helpline', supportPhone));
    } else if (key === 'email') {
      Linking.openURL(`mailto:${supportEmail}?subject=Support%20Request`).catch(() => dialog('Email support', supportEmail));
    } else if (key === 'chat') {
      dialog('Live Chat', 'Connecting you to our cosmic support team — a guide will join within a minute. 🌟');
    } else {
      dialog('Knowledge Base', 'Browse step-by-step guides, astrology basics and account help — articles coming soon.');
    }
  };

  return (
    <Page title="Help" onBack={() => { hTap(); navigation.goBack(); }}>
      <Card contentStyle={{ alignItems: 'center', paddingVertical: 22 }}>
        <View style={[styles.pill, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.08)' : 'rgba(176,115,22,0.07)' }]}>
          <Text style={[styles.pillText, { color: theme.goldText }]}>SUPPORT 24×7</Text>
        </View>
        <Text style={[styles.h2, { color: theme.goldText }]}>How can we help?</Text>
        <Text style={[styles.sub, { color: theme.textMuted }]}>Our cosmic team responds within an hour.</Text>
      </Card>

      <View style={styles.quick}>
        {QUICK.map((q) => (
          <Pressable
            key={q.key}
            onPress={() => onQuick(q.key)}
            android_ripple={{ color: theme.ripple }}
            style={({ pressed }) => [
              styles.quickCell,
              { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
              pressed && { transform: [{ scale: 0.97 }], borderColor: theme.gold2, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.06)' : 'rgba(176,115,22,0.05)' },
            ]}
          >
            {q.icon(theme.gold1)}
            <Text style={[styles.quickLabel, { color: theme.text }]}>{t(QUICK_KEY[q.key] || '', q.label)}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.section, { color: theme.goldText }]}>{t('help.faq', 'Frequently Asked Questions')}</Text>
      <View style={{ gap: 10 }}>
        {faqs.map((f, i) => (
          <Faq key={f.q} q={f.q} a={f.a} open={openFaq === i} onToggle={() => toggleFaq(i)} theme={theme} />
        ))}
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.pill, borderWidth: 1 },
  pillText: { fontFamily: fonts.interSemi, fontSize: 10.5, letterSpacing: 2 },
  h2: { fontFamily: fonts.playfairBold, fontSize: 22, marginTop: 10 },
  sub: { fontFamily: fonts.inter, fontSize: 12.5, marginTop: 4 },

  quick: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  quickCell: { width: '47.5%', flexGrow: 1, alignItems: 'center', gap: 8, paddingVertical: 18, borderRadius: radii.md, borderWidth: 1 },
  quickLabel: { fontFamily: fonts.interMed, fontSize: 12.5 },

  section: { fontFamily: fonts.cinzelSemi, fontSize: 13, letterSpacing: 1.4, marginTop: 22, marginBottom: 10, marginLeft: 2 },

  faq: { borderRadius: radii.md, borderWidth: 1, padding: 14 },
  faqHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  faqQ: { flex: 1, fontFamily: fonts.playfair, fontSize: 14.5, lineHeight: 20 },
  faqSignWrap: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  faqSign: { fontFamily: fonts.inter, fontSize: 17, lineHeight: 19 },
  faqA: { fontFamily: fonts.inter, fontSize: 13, lineHeight: 20, marginTop: 12 },
});
