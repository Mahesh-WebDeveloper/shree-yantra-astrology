import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutAnimation, Platform, UIManager, Linking } from 'react-native';
import Svg, { Path, Polyline } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { Theme, fonts, radii } from '../theme/tokens';
import { Page } from '../components/Page';
import { Card } from '../components/Card';
import { useDialog } from '../components/DialogProvider';
import { hTap, hSelect } from '../lib/haptics';
import { useAppConfig } from '../context/AppConfigProvider';
import { useLang } from '../i18n/LanguageProvider';
import { getFaq } from '../lib/api';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const sw = (c: string, n = 1.7) => ({ width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none' as const, stroke: c, strokeWidth: n, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const });

const QUICK = [
  { key: 'chat', label: 'Chat with us', labelHi: 'हमसे चैट करें', icon: (c: string) => <Svg {...sw(c)}><Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></Svg> },
  { key: 'email', label: 'Email support', labelHi: 'ईमेल सहायता', icon: (c: string) => <Svg {...sw(c)}><Path d="M4 4h16v16H4z" /><Polyline points="4 4 12 13 20 4" /></Svg> },
];

const FAQS = [
  { q: 'How is my horoscope calculated?', qHi: 'मेरी कुंडली कैसे बनती है?', a: 'We use authentic Vedic Lahiri ayanamsa with your exact birth date, time and location to generate planetary positions and dasha periods.', aHi: 'हम प्रामाणिक वैदिक लाहिड़ी अयनांश और आपकी सटीक जन्म तिथि, समय व स्थान का उपयोग करके ग्रहों की स्थिति व दशा-काल की गणना करते हैं।' },
  { q: 'Can I cancel my Premium subscription?', qHi: 'क्या मैं प्रीमियम सदस्यता रद्द कर सकता/सकती हूँ?', a: "Yes, cancel anytime from Profile → Manage Subscription. You'll continue to enjoy Premium until the end of the billing cycle.", aHi: 'हाँ, प्रोफ़ाइल → सदस्यता प्रबंधन से कभी भी रद्द करें। बिलिंग अवधि समाप्त होने तक प्रीमियम सुविधाएँ मिलती रहेंगी।' },
  { q: 'Are the astrologers verified?', qHi: 'क्या ज्योतिषी सत्यापित हैं?', a: 'All our astrologers go through a 7-step verification including qualification check, test consultations and user-rating review.', aHi: 'हमारे सभी ज्योतिषी 7-चरणीय सत्यापन से गुज़रते हैं — योग्यता जाँच, परीक्षण परामर्श व उपयोगकर्ता-रेटिंग समीक्षा सहित।' },
  { q: 'How accurate are the predictions?', qHi: 'भविष्यवाणियाँ कितनी सटीक होती हैं?', a: 'Vedic astrology is a science of probabilities, not absolutes. Our 4.8★ user rating reflects the average accuracy reported by our community.', aHi: 'वैदिक ज्योतिष संभावनाओं का विज्ञान है, निश्चितताओं का नहीं। हमारी 4.8★ रेटिंग समुदाय द्वारा बताई गई औसत सटीकता दर्शाती है।' },
  { q: 'How do I talk to an astrologer?', qHi: 'ज्योतिषी से कैसे बात करूँ?', a: 'Open “Ask the Astrologer” from the home screen and ask your questions any time — your answers use your exact birth chart and planetary data.', aHi: 'होम स्क्रीन से "ज्योतिषी से पूछें" खोलें और कभी भी प्रश्न पूछें — उत्तर आपकी सटीक जन्म-कुंडली व ग्रह-स्थिति पर आधारित होते हैं।' },
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
  const hi = useLang().lang === 'hi';
  const supportEmail = config.support?.email || 'support@shreeyantra.app';
  const [openFaq, setOpenFaq] = useState(0); // first open by default (matches web)

  // FAQ admin-panel se (fallback static)
  const [liveFaqs, setLiveFaqs] = useState<{ q: string; a: string }[] | null>(null);
  useEffect(() => {
    getFaq().then((r) => {
      if (r.faq && r.faq.length) setLiveFaqs(r.faq.map((f) => ({ q: f.question, a: f.answer })));
    }).catch(() => {});
  }, []);
  const faqs = liveFaqs || FAQS.map((f) => ({ q: hi ? f.qHi : f.q, a: hi ? f.aHi : f.a }));

  const toggleFaq = (i: number) => {
    hSelect();
    LayoutAnimation.configureNext(LayoutAnimation.create(220, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity));
    setOpenFaq((cur) => (cur === i ? -1 : i)); // single-open: opening one closes the rest
  };

  const onQuick = (key: string) => {
    hTap();
    if (key === 'email') {
      Linking.openURL(`mailto:${supportEmail}?subject=Support%20Request`).catch(() => dialog('Email support', supportEmail));
    } else {
      dialog(hi ? 'लाइव चैट' : 'Live Chat', hi ? 'हम आपको हमारी सहायता टीम से जोड़ रहे हैं — एक मिनट में कोई सदस्य जुड़ जाएगा। 🌟' : 'Connecting you to our cosmic support team — a guide will join within a minute. 🌟');
    }
  };

  return (
    <Page title={hi ? 'सहायता' : 'Help'} onBack={() => { hTap(); navigation.goBack(); }}>
      <Card contentStyle={{ alignItems: 'center', paddingVertical: 22 }}>
        <View style={[styles.pill, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.08)' : 'rgba(176,115,22,0.07)' }]}>
          <Text style={[styles.pillText, { color: theme.goldText }]}>{hi ? 'सहायता 24×7' : 'SUPPORT 24×7'}</Text>
        </View>
        <Text style={[styles.h2, { color: theme.goldText }]}>{hi ? 'हम आपकी कैसे मदद करें?' : 'How can we help?'}</Text>
        <Text style={[styles.sub, { color: theme.textMuted }]}>{hi ? 'हमारी टीम एक घंटे के भीतर उत्तर देती है।' : 'Our cosmic team responds within an hour.'}</Text>
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
            <Text style={[styles.quickLabel, { color: theme.text }]}>{hi ? q.labelHi : q.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.section, { color: theme.goldText }]}>{hi ? 'अक्सर पूछे जाने वाले प्रश्न' : 'Frequently Asked Questions'}</Text>
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
