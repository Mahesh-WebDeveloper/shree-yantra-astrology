import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { KeyboardAwareScroll } from '../components/KeyboardAwareScroll';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';
import { Page } from '../components/Page';
import { Card } from '../components/Card';
import { TextField } from '../components/TextField';
import { GoldButton } from '../components/GoldButton';
import { MailIcon, LockIcon } from '../components/icons/ProfileIcons';
import { hSuccess, hError } from '../lib/haptics';
import { useDialog } from '../components/DialogProvider';
import { setPasswordApi } from '../lib/api';
import { getStoredUser, updateStoredUser } from '../lib/auth';
import { useLang } from '../i18n/LanguageProvider';

export function SetPasswordScreen({ navigation }: any) {
  const { theme } = useTheme();
  const dialog = useDialog();
  const { lang } = useLang();

  const [hasPassword, setHasPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [emailLocked, setEmailLocked] = useState(false);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getStoredUser().then((u) => {
      if (!u) return;
      setHasPassword(u.providers?.includes('password'));
      if (u.email) { setEmail(u.email); setEmailLocked(true); }
    });
  }, []);

  const emailErr = !!email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  const pwErr = pw.length > 0 && pw.length < 6;
  const matchErr = pw2.length > 0 && pw !== pw2;

  const save = async () => {
    if (!email.trim()) { hError(); dialog(lang === 'hi' ? 'ईमेल आवश्यक है' : 'Email Required', lang === 'hi' ? 'ईमेल लॉगिन के लिए ईमेल आवश्यक है।' : 'Email is required to set up email login.'); return; }
    if (emailErr) { hError(); dialog(lang === 'hi' ? 'अमान्य ईमेल' : 'Invalid Email', lang === 'hi' ? 'कृपया वैध ईमेल दर्ज करें।' : 'Please enter a valid email.'); return; }
    if (pw.length < 6) { hError(); dialog(lang === 'hi' ? 'पासवर्ड बहुत छोटा है' : 'Password Too Short', lang === 'hi' ? 'पासवर्ड कम से कम 6 वर्णों का होना चाहिए।' : 'Password must be at least 6 characters.'); return; }
    if (pw !== pw2) { hError(); dialog(lang === 'hi' ? 'पासवर्ड मेल नहीं खाते' : 'Passwords Don’t Match', lang === 'hi' ? 'दोनों पासवर्ड समान होने चाहिए।' : 'Both passwords must be the same.'); return; }
    if (busy) return;
    setBusy(true);
    try {
      const r = await setPasswordApi({ email: emailLocked ? undefined : email.trim(), password: pw });
      await updateStoredUser({ email: r.user.email, providers: r.user.providers });
      hSuccess();
      dialog('Done', 'You can now sign in with email + password too. (Mobile OTP still works — same account.)', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e: any) {
      hError();
      dialog('Could not save', e?.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page title={hasPassword ? (lang === 'hi' ? 'पासवर्ड बदलें' : 'Change Password') : (lang === 'hi' ? 'ईमेल लॉगिन जोड़ें' : 'Add Email Login')} onBack={() => navigation.goBack()}>
      <KeyboardAwareScroll contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <Card contentStyle={{ padding: 18 }}>
          <Text style={[styles.lead, { color: theme.textSoft }]}>
            {hasPassword
              ? 'Update your login password.'
              : 'Set this once to also sign in with email + password alongside mobile OTP. Both work on the same account.'}
          </Text>
          <View style={{ gap: 14, marginTop: 16 }}>
            <TextField
              icon={<MailIcon color={theme.gold2} size={20} />}
              label={emailLocked ? 'Email (linked)' : 'Email'}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              error={emailErr ? (lang === 'hi' ? 'वैध ईमेल दर्ज करें' : 'Enter a valid email') : null}
            />
            <TextField
              icon={<LockIcon color={theme.gold2} size={20} />}
              label="New Password"
              value={pw}
              onChangeText={setPw}
              placeholder="Min 6 characters"
              secureTextEntry
              error={pwErr ? (lang === 'hi' ? 'कम से कम 6 वर्ण' : 'At least 6 characters') : null}
            />
            <TextField
              icon={<LockIcon color={theme.gold2} size={20} />}
              label="Confirm Password"
              value={pw2}
              onChangeText={setPw2}
              placeholder="Re-enter password"
              secureTextEntry
              error={matchErr ? (lang === 'hi' ? 'पासवर्ड मेल नहीं खाते' : 'Passwords don’t match') : null}
            />
          </View>
          <View style={{ marginTop: 18 }}>
            <GoldButton label={busy ? 'Saving…' : hasPassword ? 'Update Password' : 'Add Email Login'} onPress={save} />
          </View>
        </Card>
        <Text style={[styles.note, { color: theme.textMuted }]}>
          🔒 Aapka mobile number hi aapki primary identity hai — email/password sirf ek extra login tareeka hai, same account ke liye.
        </Text>
      </KeyboardAwareScroll>
    </Page>
  );
}

const styles = StyleSheet.create({
  lead: { fontFamily: fonts.inter, fontSize: 13, lineHeight: 19 },
  note: { fontFamily: fonts.inter, fontSize: 11.5, textAlign: 'center', marginTop: 16, lineHeight: 17, paddingHorizontal: 8 },
});
