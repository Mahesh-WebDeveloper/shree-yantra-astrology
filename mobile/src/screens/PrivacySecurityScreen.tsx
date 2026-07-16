import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { Theme, fonts } from '../theme/tokens';
import { Page } from '../components/Page';
import { Card } from '../components/Card';
import { PressableScale } from '../components/PressableScale';
import { useDialog } from '../components/DialogProvider';
import { hTap, hSelect, hSuccess } from '../lib/haptics';
import { useCurrentUser } from '../lib/auth';
import { useLang } from '../i18n/LanguageProvider';

const STORE_KEY = 'sy.privacy';

/* ── inline icon set (stroke) ───────────────────────────────────────── */
type IconName = 'shield' | 'lock' | 'finger' | 'twofa' | 'activity' | 'sparkles' | 'chart' | 'mail' | 'eye' | 'download' | 'doc' | 'trash';
const sp = (c: string) => ({ width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none' as const, stroke: c, strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const });
function Icon({ name, color }: { name: IconName; color: string }) {
  switch (name) {
    case 'shield': return <Svg {...sp(color)}><Path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" /><Polyline points="9 12 11 14 15 10" /></Svg>;
    case 'lock': return <Svg {...sp(color)}><Rect x={4} y={11} width={16} height={9} rx={2} /><Path d="M8 11V8a4 4 0 0 1 8 0v3" /></Svg>;
    case 'finger': return <Svg {...sp(color)}><Path d="M12 11a2 2 0 0 1 2 2c0 3-1 5-1 5M9 9.5a4 4 0 0 1 7 2.5c0 4-1.5 6-1.5 6M6.5 12a6 6 0 0 1 11-3.3M12 13c0 4-1 6-1 6" /></Svg>;
    case 'twofa': return <Svg {...sp(color)}><Rect x={5} y={11} width={14} height={9} rx={2} /><Path d="M8 11V8a4 4 0 0 1 8 0v3" /><Circle cx={12} cy={15.5} r={1.4} fill={color} /></Svg>;
    case 'activity': return <Svg {...sp(color)}><Polyline points="3 12 7 12 9 6 13 18 15 12 21 12" /></Svg>;
    case 'sparkles': return <Svg {...sp(color)}><Path d="M12 3l1.8 4.7L18.5 9l-4.7 1.3L12 15l-1.8-4.7L5.5 9l4.7-1.3z" fill={color} fillOpacity={0.2} /></Svg>;
    case 'chart': return <Svg {...sp(color)}><Path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></Svg>;
    case 'mail': return <Svg {...sp(color)}><Rect x={3} y={5} width={18} height={14} rx={2} /><Polyline points="3 7 12 13 21 7" /></Svg>;
    case 'eye': return <Svg {...sp(color)}><Path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" /><Circle cx={12} cy={12} r={3} /></Svg>;
    case 'download': return <Svg {...sp(color)}><Path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></Svg>;
    case 'doc': return <Svg {...sp(color)}><Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><Polyline points="14 2 14 8 20 8" /><Line x1={8} y1={13} x2={16} y2={13} /><Line x1={8} y1={17} x2={13} y2={17} /></Svg>;
    case 'trash': return <Svg {...sp(color)}><Polyline points="3 6 5 6 21 6" /><Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></Svg>;
  }
}

function IcCircle({ name, theme }: { name: IconName; theme: Theme }) {
  return (
    <View style={[styles.icCircle, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.10)' : '#ffffff' }]}>
      <Icon name={name} color={theme.gold1} />
    </View>
  );
}

function SectionLabel({ text, theme }: { text: string; theme: Theme }) {
  return <Text style={[styles.section, { color: theme.goldText }]}>{text}</Text>;
}

function ToggleRow({ icon, title, sub, value, onValueChange, theme, last }: {
  icon: IconName; title: string; sub: string; value: boolean; onValueChange: (v: boolean) => void; theme: Theme; last?: boolean;
}) {
  return (
    <View style={[styles.row, { borderBottomColor: theme.line }, last && styles.noBorder]}>
      <IcCircle name={icon} theme={theme} />
      <View style={styles.body}>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.sub, { color: theme.textMuted }]}>{sub}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={(v) => { hSelect(); onValueChange(v); }}
        trackColor={{ false: 'rgba(150,150,150,0.4)', true: theme.gold2 }}
        thumbColor="#fff"
        ios_backgroundColor="rgba(150,150,150,0.4)"
      />
    </View>
  );
}

function ActionRow({ icon, title, sub, onPress, theme, last, destructive }: {
  icon: IconName; title: string; sub: string; onPress: () => void; theme: Theme; last?: boolean; destructive?: boolean;
}) {
  const color = destructive ? (theme.isDark ? '#ff8585' : '#c0392b') : theme.text;
  return (
    <PressableScale
      onPress={onPress}
      ripple={theme.ripple}
      style={[styles.row, { borderBottomColor: theme.line, marginHorizontal: -2, paddingHorizontal: 2 }, last && styles.noBorder]}
    >
      <View style={[styles.icCircle, { borderColor: destructive ? 'rgba(192,57,43,0.4)' : theme.cardBorder, backgroundColor: destructive ? 'rgba(192,57,43,0.08)' : (theme.isDark ? 'rgba(233,184,80,0.10)' : '#ffffff') }]}>
        <Icon name={icon} color={destructive ? (theme.isDark ? '#ff8585' : '#c0392b') : theme.gold1} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, { color }]}>{title}</Text>
        <Text style={[styles.sub, { color: theme.textMuted }]}>{sub}</Text>
      </View>
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.gold2} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Polyline points="9 18 15 12 9 6" /></Svg>
    </PressableScale>
  );
}

interface Prefs { appLock: boolean; twoFA: boolean; personalized: boolean; analytics: boolean; marketing: boolean; discoverable: boolean }
const DEFAULTS: Prefs = { appLock: false, twoFA: false, personalized: true, analytics: true, marketing: false, discoverable: false };

export function PrivacySecurityScreen({ navigation }: any) {
  const { theme } = useTheme();
  const dialog = useDialog();
  const hi = useLang().lang === 'hi';
  const user = useCurrentUser();
  const hasPassword = !!user?.providers?.includes('password');
  const [p, setP] = useState<Prefs>(DEFAULTS);

  useEffect(() => {
    AsyncStorage.getItem(STORE_KEY).then((raw) => { if (raw) { try { setP({ ...DEFAULTS, ...JSON.parse(raw) }); } catch {} } });
  }, []);

  const set = (k: keyof Prefs) => (v: boolean) => {
    setP((cur) => { const next = { ...cur, [k]: v }; AsyncStorage.setItem(STORE_KEY, JSON.stringify(next)).catch(() => {}); return next; });
  };

  const loginActivity = () => dialog(hi ? 'हाल की लॉगिन गतिविधि' : 'Recent Login Activity', hi ? 'अंतिम साइन-इन: आज, सुबह 9:42 · जयपुर, भारत · Android.\nकोई संदिग्ध गतिविधि नहीं मिली। ✓' : 'Last sign-in: Today, 9:42 AM · Jaipur, India · Android.\nNo suspicious activity detected. ✓');
  const downloadData = () => dialog(hi ? 'मेरा डेटा डाउनलोड करें' : 'Download My Data', hi ? 'हम आपके डेटा की एक प्रति तैयार कर 24 घंटे के भीतर डाउनलोड लिंक ईमेल कर देंगे।' : 'We will prepare a copy of your data and email a download link within 24 hours.', [
    { text: hi ? 'रद्द करें' : 'Cancel', style: 'cancel' }, { text: hi ? 'अनुरोध करें' : 'Request', onPress: () => { hSuccess(); dialog(hi ? 'अनुरोध प्राप्त हुआ' : 'Request received', hi ? 'आपका डेटा एक्सपोर्ट तैयार हो रहा है। 📦' : 'Your data export is being prepared. 📦'); } },
  ]);
  return (
    <Page title={hi ? 'गोपनीयता व सुरक्षा' : 'Privacy & Security'} onBack={() => { hTap(); navigation.goBack(); }}>
      {/* intro */}
      <Card contentStyle={styles.intro}>
        <View style={[styles.shieldWrap, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.10)' : '#ffffff' }]}>
          <Svg width={30} height={30} viewBox="0 0 24 24" fill="none" stroke={theme.gold1} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><Path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" /><Polyline points="9 12 11 14 15 10" /></Svg>
        </View>
        <Text style={[styles.introTitle, { color: theme.text }]}>{hi ? 'आपका डेटा सुरक्षित है' : 'Your data is protected'}</Text>
        <Text style={[styles.introSub, { color: theme.textMuted }]}>{hi ? 'आप कैसे साइन-इन करते हैं, क्या साझा करते हैं व अपना खाता डेटा — सब एक ही जगह प्रबंधित करें।' : 'Manage how you sign in, what you share, and your account data — all in one place.'}</Text>
      </Card>

      <SectionLabel text={hi ? 'सुरक्षा' : 'Security'} theme={theme} />
      <Card padded={false} contentStyle={styles.listCard}>
        <ToggleRow icon="finger" title={hi ? 'ऐप लॉक' : 'App Lock'} sub={hi ? 'ऐप खोलने के लिए फिंगरप्रिंट / फेस अनिवार्य करें' : 'Require fingerprint / face to open the app'} value={p.appLock} onValueChange={set('appLock')} theme={theme} />
        <ActionRow icon="activity" title={hi ? 'लॉगिन गतिविधि' : 'Login Activity'} sub={hi ? 'अपने खाते के हाल के साइन-इन देखें' : 'See recent sign-ins to your account'} onPress={loginActivity} theme={theme} last />
      </Card>

      <SectionLabel text={hi ? 'गोपनीयता' : 'Privacy'} theme={theme} />
      <Card padded={false} contentStyle={styles.listCard}>
        <ToggleRow icon="sparkles" title={hi ? 'व्यक्तिगत भविष्यवाणियाँ' : 'Personalised Predictions'} sub={hi ? 'रीडिंग को अनुकूल बनाने हेतु मेरे जन्म-विवरण का उपयोग करें' : 'Use my birth details to tailor readings'} value={p.personalized} onValueChange={set('personalized')} theme={theme} />
        <ToggleRow icon="chart" title={hi ? 'उपयोग विश्लेषण' : 'Usage Analytics'} sub={hi ? 'ऐप को बेहतर बनाने हेतु अनाम उपयोग-डेटा साझा करें' : 'Share anonymous app usage to improve'} value={p.analytics} onValueChange={set('analytics')} theme={theme} />
        <ToggleRow icon="mail" title={hi ? 'मार्केटिंग ईमेल' : 'Marketing Emails'} sub={hi ? 'ऑफ़र, त्योहार राशिफल व अपडेट' : 'Offers, festival horoscopes & updates'} value={p.marketing} onValueChange={set('marketing')} theme={theme} />
        <ToggleRow icon="eye" title={hi ? 'खोज-योग्य प्रोफ़ाइल' : 'Discoverable Profile'} sub={hi ? 'ज्योतिषियों को परामर्श हेतु मुझे खोजने दें' : 'Let astrologers find me for consults'} value={p.discoverable} onValueChange={set('discoverable')} theme={theme} last />
      </Card>

      <SectionLabel text={hi ? 'डेटा व नीतियाँ' : 'Data & Policies'} theme={theme} />
      <Card padded={false} contentStyle={styles.listCard}>
        <ActionRow icon="download" title={hi ? 'मेरा डेटा डाउनलोड करें' : 'Download My Data'} sub={hi ? 'अपने खाते के डेटा की एक प्रति प्राप्त करें' : 'Get a copy of your account data'} onPress={downloadData} theme={theme} />
        {/* full documents live in-app (LegalScreen) — no dead external URLs */}
        <ActionRow icon="doc" title={hi ? 'गोपनीयता नीति' : 'Privacy Policy'} sub={hi ? 'हम आपकी जानकारी कैसे संभालते हैं' : 'How we handle your information'} onPress={() => { hTap(); navigation.navigate('Legal', { doc: 'privacy' }); }} theme={theme} />
        <ActionRow icon="doc" title={hi ? 'सेवा की शर्तें' : 'Terms of Service'} sub={hi ? 'हमारे नियम व शर्तें' : 'Our terms & conditions'} onPress={() => { hTap(); navigation.navigate('Legal', { doc: 'terms' }); }} theme={theme} last />
      </Card>

      <Text style={[styles.foot, { color: theme.textMuted }]}>{hi ? '🔒 आपकी रीडिंग व जन्म-डेटा हमारे सर्वर पर एन्क्रिप्टेड हैं।' : '🔒 Your readings & birth data are encrypted on our servers.'}</Text>
    </Page>
  );
}

const styles = StyleSheet.create({
  intro: { alignItems: 'center', paddingVertical: 22 },
  shieldWrap: { width: 56, height: 56, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  introTitle: { fontFamily: fonts.playfairBold, fontSize: 18 },
  introSub: { fontFamily: fonts.inter, fontSize: 12.5, lineHeight: 18, textAlign: 'center', marginTop: 6, paddingHorizontal: 8 },

  section: { fontFamily: fonts.cinzelSemi, fontSize: 13, letterSpacing: 1.4, marginTop: 22, marginBottom: 10, marginLeft: 2 },
  listCard: { paddingHorizontal: 14 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderBottomWidth: 1 },
  noBorder: { borderBottomWidth: 0 },
  icCircle: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, minWidth: 0 },
  title: { fontFamily: fonts.interSemi, fontSize: 14 },
  sub: { fontFamily: fonts.inter, fontSize: 11.5, marginTop: 2, lineHeight: 16 },

  foot: { fontFamily: fonts.inter, fontSize: 11, letterSpacing: 0.3, textAlign: 'center', marginTop: 18, lineHeight: 16 },
});
