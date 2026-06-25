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

export function SetPasswordScreen({ navigation }: any) {
  const { theme } = useTheme();
  const dialog = useDialog();

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
    if (!email.trim()) { hError(); dialog('Email chahiye', 'Email login ke liye email zaroori hai.'); return; }
    if (emailErr) { hError(); dialog('Galat email', 'Sahi email daalein.'); return; }
    if (pw.length < 6) { hError(); dialog('Password chhota hai', 'Password kam se kam 6 characters ka ho.'); return; }
    if (pw !== pw2) { hError(); dialog('Password match nahi', 'Dono passwords same hone chahiye.'); return; }
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
    <Page title={hasPassword ? 'Change Password' : 'Add Email Login'} onBack={() => navigation.goBack()}>
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
              error={emailErr ? 'Sahi email daalein' : null}
            />
            <TextField
              icon={<LockIcon color={theme.gold2} size={20} />}
              label="New Password"
              value={pw}
              onChangeText={setPw}
              placeholder="Min 6 characters"
              secureTextEntry
              error={pwErr ? 'Kam se kam 6 characters' : null}
            />
            <TextField
              icon={<LockIcon color={theme.gold2} size={20} />}
              label="Confirm Password"
              value={pw2}
              onChangeText={setPw2}
              placeholder="Re-enter password"
              secureTextEntry
              error={matchErr ? 'Passwords match nahi karte' : null}
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
