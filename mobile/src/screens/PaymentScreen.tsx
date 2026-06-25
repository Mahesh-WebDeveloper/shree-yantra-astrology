import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator,
  LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { KeyboardAwareScroll } from '../components/KeyboardAwareScroll';
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { Theme, fonts, radii } from '../theme/tokens';
import { CosmicBackground } from '../components/CosmicBackground';
import { TopBar } from '../components/TopBar';
import { BellIcon } from '../components/icons/NavIcons';
import { hTap, hSelect, hSuccess, hError } from '../lib/haptics';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const easeNext = () => LayoutAnimation.configureNext(LayoutAnimation.create(220, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity));

/* ── UPI apps (Indian) ── */
const UPI_APPS = [
  { key: 'gpay', name: 'Google Pay' },
  { key: 'phonepe', name: 'PhonePe' },
  { key: 'paytm', name: 'Paytm' },
  { key: 'bhim', name: 'BHIM' },
];

/* Brand-accurate UPI app marks (SVG, drawn in each brand's colours). */
function UpiLogo({ app }: { app: string }) {
  if (app === 'gpay') {
    return (
      <View style={[styles.brandTile, { backgroundColor: '#ffffff' }]}>
        <Svg width={30} height={30} viewBox="0 0 40 40">
          {/* Google 4-colour swirl */}
          <Path d="M20 6 a14 14 0 0 1 14 14" stroke="#EA4335" strokeWidth={5.5} fill="none" strokeLinecap="round" />
          <Path d="M34 20 a14 14 0 0 1 -14 14" stroke="#FBBC04" strokeWidth={5.5} fill="none" strokeLinecap="round" />
          <Path d="M20 34 a14 14 0 0 1 -14 -14" stroke="#34A853" strokeWidth={5.5} fill="none" strokeLinecap="round" />
          <Path d="M6 20 a14 14 0 0 1 14 -14" stroke="#4285F4" strokeWidth={5.5} fill="none" strokeLinecap="round" />
        </Svg>
      </View>
    );
  }
  if (app === 'phonepe') {
    return <View style={[styles.brandTile, { backgroundColor: '#5f259f' }]}><Text style={styles.peText}>Pe</Text></View>;
  }
  if (app === 'paytm') {
    return (
      <View style={[styles.brandTile, { backgroundColor: '#ffffff' }]}>
        <Text style={styles.paytmText}><Text style={{ color: '#012970' }}>pay</Text><Text style={{ color: '#00b9f1' }}>tm</Text></Text>
      </View>
    );
  }
  // BHIM — white tile, navy ₹ with a tricolour accent
  return (
    <View style={[styles.brandTile, { backgroundColor: '#ffffff' }]}>
      <Text style={styles.bhimText}>₹</Text>
      <View style={styles.bhimBar}>
        <View style={{ flex: 1, backgroundColor: '#ff9933' }} />
        <View style={{ flex: 1, backgroundColor: '#ffffff' }} />
        <View style={{ flex: 1, backgroundColor: '#138808' }} />
      </View>
    </View>
  );
}

const sw = (c: string, n = 1.7) => ({ width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none' as const, stroke: c, strokeWidth: n, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const });

const UpiIcon = ({ c }: { c: string }) => (
  <Svg {...sw(c)}><Path d="M5 19 10 5h4l-5 14z" /><Path d="M12 19 17 5h2l-5 14z" /></Svg>
);
const CardIcon = ({ c }: { c: string }) => (
  <Svg {...sw(c)}><Rect x={3} y={5} width={18} height={14} rx={2} /><Path d="M3 10h18M7 15h4" /></Svg>
);
const BankIcon = ({ c }: { c: string }) => (
  <Svg {...sw(c)}><Path d="M3 10l9-6 9 6M5 10v9M19 10v9M9 10v9M15 10v9M3 21h18" /></Svg>
);
const QrIcon = ({ c, size = 18 }: { c: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <Rect x={3} y={3} width={7} height={7} rx={1} /><Rect x={14} y={3} width={7} height={7} rx={1} /><Rect x={3} y={14} width={7} height={7} rx={1} />
    <Path d="M14 14h3v3M21 14v7h-7M17 21v-1" />
  </Svg>
);
const Lock = ({ c, size = 14 }: { c: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x={4} y={11} width={16} height={10} rx={2} /><Path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </Svg>
);
const Check = ({ c, size = 13 }: { c: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><Path d="M20 6 9 17l-5-5" /></Svg>
);

/** Faux QR — finder patterns + a deterministic module field (looks like a real UPI QR). */
function QrCode({ size = 168 }: { size?: number }) {
  const N = 25;
  const cell = size / N;
  const inFinder = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= N - 7) || (r >= N - 7 && c < 7);
  const modules: { x: number; y: number }[] = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (inFinder(r, c)) continue;
      if (((r * 7 + c * 3 + r * c) % 5) < 2) modules.push({ x: c * cell, y: r * cell });
    }
  }
  const Finder = ({ r, c }: { r: number; c: number }) => (
    <>
      <Rect x={c * cell} y={r * cell} width={cell * 7} height={cell * 7} rx={cell} fill="none" stroke="#0a0a0a" strokeWidth={cell} />
      <Rect x={(c + 2) * cell} y={(r + 2) * cell} width={cell * 3} height={cell * 3} rx={cell * 0.6} fill="#0a0a0a" />
    </>
  );
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Rect x={0} y={0} width={size} height={size} rx={10} fill="#ffffff" />
      {modules.map((m, i) => <Rect key={i} x={m.x} y={m.y} width={cell} height={cell} fill="#0a0a0a" />)}
      <Finder r={0} c={0} /><Finder r={0} c={N - 7} /><Finder r={N - 7} c={0} />
    </Svg>
  );
}

type Method = 'upi' | 'card' | 'bank';

export function PaymentScreen({ navigation }: any) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [method, setMethod] = useState<Method>('upi');
  const [upiApp, setUpiApp] = useState<string | null>('gpay');
  const [upiId, setUpiId] = useState('');
  const [showQr, setShowQr] = useState(false);
  const [card, setCard] = useState('');
  const [exp, setExp] = useState('');
  const [cvv, setCvv] = useState('');
  const [processing, setProcessing] = useState(false);

  const dim = theme.isDark ? '#b89a5b' : '#8a6f3a';
  const subtle = theme.isDark ? 'rgba(0,0,0,0.5)' : '#fffdf7';

  const selectMethod = (m: Method) => { if (m === method) return; hSelect(); easeNext(); setMethod(m); };

  // can we accept payment with the current selection?
  const canPay = useMemo(() => {
    if (processing) return false;
    if (method === 'upi') return !!upiApp || /.+@.+/.test(upiId) || showQr;
    if (method === 'card') return card.replace(/\s/g, '').length >= 12 && /\d\d\/\d\d/.test(exp) && cvv.length >= 3;
    return true; // bank → demo
  }, [method, upiApp, upiId, showQr, card, exp, cvv, processing]);

  const pay = () => {
    if (!canPay) { hError(); return; }
    hSuccess();
    setProcessing(true);
    setTimeout(() => navigation.replace ? navigation.replace('SubscriptionActivated') : navigation.navigate('SubscriptionActivated'), 1400);
  };

  const fmtCard = (t: string) => t.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const fmtExp = (t: string) => {
    const d = t.replace(/\D/g, '').slice(0, 4);
    return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  /* selectable method header row */
  const MethodHead = ({ id, title, sub, icon, badge }: { id: Method; title: string; sub: string; icon: React.ReactNode; badge?: string }) => {
    const on = method === id;
    return (
      <Pressable
        onPress={() => selectMethod(id)}
        style={({ pressed }) => [
          styles.mHead,
          { borderColor: on ? theme.gold2 : theme.cardBorder, backgroundColor: on ? (theme.isDark ? 'rgba(246,210,122,0.10)' : 'rgba(176,115,22,0.07)') : (theme.isDark ? 'rgba(0,0,0,0.72)' : '#fffdf7') },
          pressed && { transform: [{ scale: 0.995 }] },
        ]}
      >
        <View style={[styles.mIcon, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.12)' : 'rgba(176,115,22,0.08)' }]}>{icon}</View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.mTitleRow}>
            <Text style={[styles.mTitle, { color: theme.text }]}>{title}</Text>
            {badge && (
              <View style={[styles.recPill, { borderColor: 'rgba(74,222,128,0.4)', backgroundColor: 'rgba(74,222,128,0.12)' }]}>
                <Text style={styles.recText}>{badge}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.mSub, { color: theme.textMuted }]}>{sub}</Text>
        </View>
        <View style={[styles.radio, { borderColor: on ? theme.gold1 : theme.cardBorder }]}>
          {on && <View style={[styles.radioDot, { backgroundColor: theme.gold1 }]} />}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.fill, { backgroundColor: theme.bgDeep }]}>
      <CosmicBackground />
      <TopBar title="Payment" onBack={() => { hTap(); navigation.goBack(); }} right={<BellIcon color={theme.gold1} size={20} />} onRight={() => navigation.navigate('Notifications')} />

      <KeyboardAwareScroll
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: insets.bottom + 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Order summary ── */}
        <LinearGradient
          colors={theme.isDark ? ['rgba(20,16,8,0.6)', 'rgba(6,6,8,0.96)'] : ['#fffdf6', '#fff6e6']}
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
          style={[styles.summary, { borderColor: theme.cardBorder }]}
        >
          <View style={styles.sumTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.kicker, { color: dim }]}>YOU’RE SUBSCRIBING TO</Text>
              <Text style={[styles.planName, { color: theme.goldText }]}>Premium Astrology</Text>
            </View>
            <View style={[styles.crown, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.12)' : 'rgba(176,115,22,0.08)' }]}>
              <Svg width={22} height={22} viewBox="0 0 24 24" fill={theme.gold1}><Path d="M2 8l4 6 5-7 5 7 4-4-2 12H4z" /></Svg>
            </View>
          </View>

          {/* amount rows */}
          <View style={[styles.amtRows, { borderTopColor: theme.line }]}>
            <View style={styles.amtRow}>
              <Text style={[styles.amtK, { color: theme.textSoft }]}>7-day premium trial</Text>
              <Text style={[styles.amtV, { color: theme.text }]}>₹1</Text>
            </View>
          </View>

          <View style={[styles.totalRow, { borderTopColor: theme.line }]}>
            <Text style={[styles.totalK, { color: theme.text }]}>Payable today</Text>
            <Text style={[styles.totalV, { color: theme.goldText }]}>₹1</Text>
          </View>
        </LinearGradient>

        <Text style={[styles.sectionLbl, { color: dim }]}>CHOOSE PAYMENT METHOD</Text>

        {/* ── UPI ── */}
        <View style={{ gap: 10 }}>
          <MethodHead id="upi" title="UPI" sub="GPay, PhonePe, Paytm & more" icon={<UpiIcon c={theme.gold1} />} badge="RECOMMENDED" />
          {method === 'upi' && (
            <View style={[styles.body, { borderColor: theme.cardBorder, backgroundColor: subtle }]}>
              <Text style={[styles.bodyLbl, { color: dim }]}>PAY USING YOUR UPI APP</Text>
              <View style={styles.appsRow}>
                {UPI_APPS.map((a) => {
                  const on = upiApp === a.key && !showQr;
                  return (
                    <Pressable key={a.key} onPress={() => { hSelect(); setShowQr(false); setUpiApp(a.key); }} style={styles.appTile}>
                      <View style={[styles.appLogoWrap, { borderColor: on ? theme.gold1 : 'transparent' }]}>
                        <UpiLogo app={a.key} />
                        {on && <View style={styles.appCheck}><Check c="#1a7a3a" size={10} /></View>}
                      </View>
                      <Text style={[styles.appName, { color: on ? theme.goldText : theme.textSoft }]} numberOfLines={1}>{a.name}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.orRow}>
                <View style={[styles.orLine, { backgroundColor: theme.line }]} />
                <Text style={[styles.orText, { color: theme.textMuted }]}>or enter UPI ID</Text>
                <View style={[styles.orLine, { backgroundColor: theme.line }]} />
              </View>

              <View style={[styles.input, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.55)' : '#ffffff' }]}>
                <UpiIcon c={theme.gold2} />
                <TextInput
                  value={upiId}
                  onChangeText={(t) => { setUpiId(t); if (t) { setUpiApp(null); setShowQr(false); } }}
                  placeholder="yourname@okaxis"
                  placeholderTextColor={theme.isDark ? 'rgba(216,203,168,0.42)' : 'rgba(109,91,56,0.5)'}
                  autoCapitalize="none"
                  style={[styles.inputText, { color: theme.text }]}
                />
                {/.+@.+/.test(upiId) && <Check c="#4ade80" />}
              </View>

              {/* Scan QR toggle */}
              <Pressable onPress={() => { hTap(); easeNext(); setShowQr((q) => !q); if (!showQr) setUpiApp(null); }} style={[styles.qrToggle, { borderColor: showQr ? theme.gold2 : theme.cardBorder, backgroundColor: showQr ? (theme.isDark ? 'rgba(246,210,122,0.10)' : 'rgba(176,115,22,0.07)') : 'transparent' }]}>
                <QrIcon c={theme.gold1} />
                <Text style={[styles.qrToggleText, { color: theme.goldText }]}>{showQr ? 'Hide QR code' : 'Scan QR with any UPI app'}</Text>
              </Pressable>

              {showQr && (
                <View style={styles.qrWrap}>
                  <View style={styles.qrCard}><QrCode size={172} /></View>
                  <Text style={[styles.qrHint, { color: theme.textSoft }]}>Open GPay / PhonePe / Paytm, tap <Text style={{ color: theme.goldText, fontFamily: fonts.interBold }}>Scan</Text> and pay <Text style={{ color: theme.goldText, fontFamily: fonts.interBold }}>₹1</Text></Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* ── Cards ── */}
        <View style={{ gap: 10, marginTop: 10 }}>
          <MethodHead id="card" title="Credit / Debit Card" sub="Visa, Mastercard, RuPay" icon={<CardIcon c={theme.gold1} />} />
          {method === 'card' && (
            <View style={[styles.body, { borderColor: theme.cardBorder, backgroundColor: subtle, gap: 10 }]}>
              <View style={[styles.input, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.55)' : '#ffffff' }]}>
                <CardIcon c={theme.gold2} />
                <TextInput value={card} onChangeText={(t) => setCard(fmtCard(t))} placeholder="Card number" placeholderTextColor={theme.isDark ? 'rgba(216,203,168,0.42)' : 'rgba(109,91,56,0.5)'} keyboardType="number-pad" style={[styles.inputText, { color: theme.text }]} />
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={[styles.input, { flex: 1, borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.55)' : '#ffffff' }]}>
                  <TextInput value={exp} onChangeText={(t) => setExp(fmtExp(t))} placeholder="MM/YY" placeholderTextColor={theme.isDark ? 'rgba(216,203,168,0.42)' : 'rgba(109,91,56,0.5)'} keyboardType="number-pad" style={[styles.inputText, { color: theme.text, marginLeft: 2 }]} />
                </View>
                <View style={[styles.input, { flex: 1, borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.55)' : '#ffffff' }]}>
                  <TextInput value={cvv} onChangeText={(t) => setCvv(t.replace(/\D/g, '').slice(0, 4))} placeholder="CVV" placeholderTextColor={theme.isDark ? 'rgba(216,203,168,0.42)' : 'rgba(109,91,56,0.5)'} keyboardType="number-pad" secureTextEntry style={[styles.inputText, { color: theme.text, marginLeft: 2 }]} />
                </View>
              </View>
            </View>
          )}
        </View>

        {/* ── Netbanking / Wallets ── */}
        <View style={{ gap: 10, marginTop: 10 }}>
          <MethodHead id="bank" title="Netbanking & Wallets" sub="All major banks · Paytm, Amazon Pay" icon={<BankIcon c={theme.gold1} />} />
          {method === 'bank' && (
            <View style={[styles.body, { borderColor: theme.cardBorder, backgroundColor: subtle }]}>
              <View style={styles.bankRow}>
                {['HDFC', 'SBI', 'ICICI', 'Axis', 'Paytm', 'Amazon Pay'].map((b) => (
                  <View key={b} style={[styles.bankChip, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.55)' : '#ffffff' }]}>
                    <Text style={[styles.bankChipText, { color: theme.text }]}>{b}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* trust */}
        <View style={styles.trust}>
          <Lock c={theme.gold2} />
          <Text style={[styles.trustText, { color: theme.textMuted }]}>100% secure payments · Cancel anytime · No hidden charges</Text>
        </View>
      </KeyboardAwareScroll>

      {/* ── Sticky pay bar ── */}
      <View style={[styles.payBar, { paddingBottom: insets.bottom + 12, borderTopColor: theme.line, backgroundColor: theme.isDark ? 'rgba(8,7,12,0.98)' : 'rgba(255,253,247,0.99)' }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.payBarAmt, { color: theme.goldText }]}>₹1</Text>
          <Text style={[styles.payBarSub, { color: theme.textMuted }]}>Total payable today</Text>
        </View>
        <Pressable onPress={pay} disabled={!canPay} style={({ pressed }) => [styles.payBtnWrap, { opacity: canPay ? 1 : 0.5 }, pressed && canPay && { transform: [{ scale: 0.98 }] }]}>
          <LinearGradient colors={theme.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.payBtn}>
            {processing ? (
              <ActivityIndicator color={theme.buttonInk} />
            ) : (
              <>
                <Lock c={theme.buttonInk} size={15} />
                <Text style={[styles.payText, { color: theme.buttonInk }]}>PAY ₹1 SECURELY</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },

  summary: { borderRadius: 22, borderWidth: 1, padding: 18, overflow: 'hidden' },
  sumTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  kicker: { fontFamily: fonts.interBold, fontSize: 10, letterSpacing: 1.6 },
  planName: { fontFamily: fonts.playfairBold, fontSize: 21, marginTop: 4 },
  crown: { width: 46, height: 46, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  amtRows: { borderTopWidth: 1, marginTop: 16, paddingTop: 12, gap: 8 },
  amtRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amtK: { fontFamily: fonts.inter, fontSize: 13 },
  amtV: { fontFamily: fonts.interSemi, fontSize: 13.5 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, marginTop: 12, paddingTop: 12 },
  totalK: { fontFamily: fonts.interBold, fontSize: 14 },
  totalV: { fontFamily: fonts.playfairBold, fontSize: 22 },

  sectionLbl: { fontFamily: fonts.interSemi, fontSize: 11, letterSpacing: 1.6, marginTop: 22, marginBottom: 10, marginLeft: 2 },

  mHead: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, borderWidth: 1 },
  mIcon: { width: 40, height: 40, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  mTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mTitle: { fontFamily: fonts.interSemi, fontSize: 14.5 },
  mSub: { fontFamily: fonts.inter, fontSize: 11.5, marginTop: 2 },
  recPill: { borderWidth: 1, borderRadius: radii.pill, paddingHorizontal: 7, paddingVertical: 2 },
  recText: { fontFamily: fonts.interBold, fontSize: 8, letterSpacing: 0.6, color: '#3aa860' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },

  body: { borderRadius: 16, borderWidth: 1, padding: 14 },
  bodyLbl: { fontFamily: fonts.interSemi, fontSize: 10, letterSpacing: 1.4, marginBottom: 12 },
  appsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  appTile: { flex: 1, alignItems: 'center', gap: 7 },
  appLogoWrap: { width: 58, height: 58, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  brandTile: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  peText: { fontFamily: fonts.interBold, fontSize: 20, color: '#ffffff' },
  paytmText: { fontFamily: fonts.interBold, fontSize: 13.5, letterSpacing: -0.3 },
  bhimText: { fontFamily: fonts.interBold, fontSize: 24, color: '#1c3f94', lineHeight: 28 },
  bhimBar: { flexDirection: 'row', width: 26, height: 3, marginTop: 1, borderRadius: 2, overflow: 'hidden' },
  appCheck: { position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: 9, backgroundColor: '#bff5cf', alignItems: 'center', justifyContent: 'center' },
  appName: { fontFamily: fonts.inter, fontSize: 10.5 },

  orRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 14 },
  orLine: { flex: 1, height: 1 },
  orText: { fontFamily: fonts.inter, fontSize: 11 },

  input: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, height: 50, borderRadius: radii.md, borderWidth: 1 },
  inputText: { flex: 1, fontFamily: fonts.inter, fontSize: 15 },

  qrToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, paddingVertical: 12, borderRadius: radii.md, borderWidth: 1 },
  qrToggleText: { fontFamily: fonts.interSemi, fontSize: 12.5 },
  qrWrap: { alignItems: 'center', marginTop: 14 },
  qrCard: { padding: 12, borderRadius: 16, backgroundColor: '#ffffff', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  qrHint: { fontFamily: fonts.inter, fontSize: 12, textAlign: 'center', marginTop: 12, lineHeight: 18, paddingHorizontal: 10 },

  bankRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bankChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: radii.pill, borderWidth: 1 },
  bankChipText: { fontFamily: fonts.interMed, fontSize: 12.5 },

  trust: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 18, paddingHorizontal: 16 },
  trustText: { fontFamily: fonts.inter, fontSize: 11, textAlign: 'center' },

  payBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingTop: 12, borderTopWidth: 1 },
  payBarAmt: { fontFamily: fonts.playfairBold, fontSize: 22 },
  payBarSub: { fontFamily: fonts.inter, fontSize: 10.5, marginTop: 1 },
  payBtnWrap: { flex: 1.4, borderRadius: radii.pill, overflow: 'hidden' },
  payBtn: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: radii.pill },
  payText: { fontFamily: fonts.cinzel, fontSize: 13, fontWeight: '800', letterSpacing: 1 },
});
