import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path, Polyline } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { Theme, fonts, radii } from '../theme/tokens';
import { Page } from '../components/Page';
import { Card } from '../components/Card';
import { TextField } from '../components/TextField';
import { BirthPlaceField } from '../components/BirthPlaceField';
import { GoldButton } from '../components/GoldButton';
import { GoldDatePicker } from '../components/GoldDatePicker';
import { GoldTimePicker } from '../components/GoldTimePicker';
import { TextInput } from 'react-native';
import {
  UserGlyph, UserLine, MailIcon, CalendarIcon, ClockIcon, CameraIcon,
} from '../components/icons/ProfileIcons';
import { hTap, hSelect, hSuccess, hError } from '../lib/haptics';
import { useDialog } from '../components/DialogProvider';
import { useKeyboardAwareFocus } from '../components/KeyboardAwareScroll';
import { getStoredUser, updateStoredUser } from '../lib/auth';
import { useT, useLang } from '../i18n/LanguageProvider';
import { LocationSuggestion, resolveLocation, updateProfileApi, uploadAvatar, avatarUrl } from '../lib/api';

const AVATAR_KEY = 'sy.avatar';
const PROFILE_KEY = 'sy.profile';
const GENDERS = ['Male', 'Female', 'Other'] as const;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const pad = (n: number) => (n < 10 ? '0' : '') + n;
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toDDMM = (d: Date) => `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`; // backend format
const fmtDob = (d: Date) => `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
const parseISO = (s: string) => {
  const [y, m, dd] = s.split('-').map(Number);
  return new Date(y || 2000, (m || 1) - 1, dd || 1);
};
const parseDDMM = (s: string) => {
  const [dd, m, y] = s.split('-').map(Number);
  return new Date(y || 2000, (m || 1) - 1, dd || 1);
};
// '06:42 AM' / '6:42' → 24h '06:42'
const to24h = (t: string): string => {
  const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return t;
  let h = Number(m[1]); const ap = (m[3] || '').toUpperCase();
  if (ap === 'PM' && h < 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return `${pad(h)}:${m[2]}`;
};
const normGender = (g?: string): typeof GENDERS[number] => {
  const c = (g || '').toLowerCase();
  return c === 'female' ? 'Female' : c === 'other' ? 'Other' : 'Male';
};
const savedLocation = (place?: string, lat?: number | null, lng?: number | null): LocationSuggestion | null => (
  place && lat != null && lng != null
    ? { id: `saved:${lat},${lng}`, provider: 'manual', mainText: place, description: place, lat, lng }
    : null
);

/** Read-only tappable field that mirrors the TextField look (icon · label · value · chevron). */
function PickerField({ icon, label, value, onPress, theme }: { icon: React.ReactNode; label: string; value: string; onPress: () => void; theme: Theme }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pf,
        {
          backgroundColor: theme.isDark ? 'rgba(0,0,0,0.70)' : '#fffdf7',
          borderColor: pressed ? theme.gold1 : (theme.isDark ? 'rgba(201,150,46,0.35)' : 'rgba(176,115,22,0.30)'),
          shadowColor: theme.isDark ? '#000000' : '#5c3f12',
        },
      ]}
    >
      <View style={styles.pfIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.pfLabel, { color: theme.goldText }]}>{label.toUpperCase()}</Text>
        <Text style={[styles.pfValue, { color: theme.text }]}>{value}</Text>
      </View>
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.gold2} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Polyline points="6 9 12 15 18 9" /></Svg>
    </Pressable>
  );
}

/** Time field — manual typing AND a clock button that opens the time picker. */
function TimeField({ value, onChangeText, onClock, theme }: { value: string; onChangeText: (t: string) => void; onClock: () => void; theme: Theme }) {
  const [focused, setFocused] = useState(false);
  const lift = useKeyboardAwareFocus();
  const borderColor = focused ? theme.gold1 : (theme.isDark ? 'rgba(201,150,46,0.35)' : 'rgba(176,115,22,0.30)');
  return (
    <View style={[styles.pf, { backgroundColor: theme.isDark ? 'rgba(0,0,0,0.70)' : '#fffdf7', borderColor, shadowColor: theme.isDark ? '#000000' : '#5c3f12' }]}>
      <View style={styles.pfIcon}><ClockIcon color={theme.gold2} size={20} /></View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.pfLabel, { color: focused ? theme.gold1 : theme.goldText }]}>TIME OF BIRTH</Text>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="06:42 AM"
          placeholderTextColor={theme.isDark ? 'rgba(216,203,168,0.42)' : 'rgba(109,91,56,0.5)'}
          onFocus={() => { setFocused(true); lift(); }}
          onBlur={() => setFocused(false)}
          style={[styles.pfValue, { color: theme.text, padding: 0 }]}
        />
      </View>
      {/* clock button — opens the gold time picker */}
      <Pressable onPress={onClock} hitSlop={8} style={({ pressed }) => [styles.clockBtn, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.12)' : 'rgba(176,115,22,0.10)' }, pressed && { transform: [{ scale: 0.9 }] }]}>
        <ClockIcon color={theme.gold1} size={17} />
      </Pressable>
    </View>
  );
}

export function EditProfileScreen({ navigation }: any) {
  const { theme } = useTheme();
  const dialog = useDialog();
  const t = useT();
  const { lang } = useLang();
  const [avatar, setAvatar] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [dob, setDob] = useState<Date>(parseISO('2000-01-01'));
  const [tob, setTob] = useState('06:42');
  const [place, setPlace] = useState('');
  const [birthLocation, setBirthLocation] = useState<LocationSuggestion | null>(null);
  const [gender, setGender] = useState<typeof GENDERS[number]>('Male');
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);

  // load saved profile — pehle logged-in user (backend), warna local sy.profile
  useEffect(() => {
    AsyncStorage.getItem(AVATAR_KEY).then((v) => v && setAvatar(v));
    (async () => {
      const u = await getStoredUser();
      if (u) {
        if (u.name) setName(u.name);
        if (u.email) setEmail(u.email);
        if (u.phone) setMobile(u.phone);
        const p = u.profile || {};
        if (p.dob) setDob(parseDDMM(p.dob)); // backend dob = DD-MM-YYYY
        if (p.tob) setTob(p.tob);
        if (p.place) setPlace(p.place);
        setBirthLocation(savedLocation(p.place, p.lat, p.lng));
        if (p.gender) setGender(normGender(p.gender));
        if (p.avatar) setAvatar(avatarUrl(p.avatar)); // server avatar
        return;
      }
      const raw = await AsyncStorage.getItem(PROFILE_KEY);
      if (!raw) return;
      try {
        const p = JSON.parse(raw);
        if (p.name) setName(p.name);
        if (p.email) setEmail(p.email);
        if (p.mobile) setMobile(p.mobile);
        if (p.dob) setDob(parseISO(p.dob)); // local sy.profile dob = YYYY-MM-DD
        if (p.tob) setTob(p.tob);
        if (p.place) setPlace(p.place);
        setBirthLocation(savedLocation(p.place, p.lat, p.lng));
        if (p.gender) setGender(normGender(p.gender));
      } catch (_) { /* ignore */ }
    })();
  }, []);

  const applyAvatar = (uri: string) => {
    setAvatar(uri); // turant preview
    AsyncStorage.setItem(AVATAR_KEY, uri).catch(() => {});
    hSuccess();
    uploadAvatar(uri)
      .then((r) => updateStoredUser({ profile: { avatar: r.avatar } }))
      .catch((e) => dialog('Upload failed', e?.message || 'Photo server par save nahi hui.'));
  };
  const openCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { dialog('Camera permission needed', 'Allow camera access to take a profile photo from Settings.'); return; }
    const res = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.85 });
    if (!res.canceled && res.assets?.[0]?.uri) applyAvatar(res.assets[0].uri);
  };
  const openGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { dialog('Permission needed', 'Allow photo access to set a profile picture.'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.85 });
    if (!res.canceled && res.assets?.[0]?.uri) applyAvatar(res.assets[0].uri);
  };
  const pickAvatar = () => {
    hTap();
    dialog('Profile Photo', 'How would you like to set your photo?', [
      { text: 'Take Photo', onPress: openCamera },
      { text: 'Choose from Gallery', onPress: openGallery },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const nameErr = !name.trim();
  const emailErr = !!email && !email.includes('@');
  const mobileErr = mobile.replace(/\D/g, '').length < 10;

  const save = async () => {
    if (nameErr || emailErr || mobileErr) {
      hError();
      dialog('Please fix the highlighted fields', 'Name, a valid email and a valid mobile number are required.');
      return;
    }
    const resolved = birthLocation || (place.trim().length >= 3 ? await resolveLocation({ query: place.trim(), lang }).then((r) => r.item).catch(() => null) : null);
    const finalPlace = resolved?.description || place.trim();
    const coords = resolved?.lat != null && resolved?.lng != null ? { lat: resolved.lat, lng: resolved.lng } : {};
    if (resolved?.description && resolved.description !== place) setPlace(resolved.description);

    // local sy.profile (kundli/panchang isi se birth details lete hain — dob ISO)
    const payload = { name: name.trim(), email, mobile, dob: toISO(dob), tob, place: finalPlace, gender, ...coords };
    AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(payload)).catch(() => {});

    // backend profile (dob DD-MM-YYYY, tob 24h) + local user mirror (sab screens turant update)
    const profile = { dob: toDDMM(dob), tob: to24h(tob), place: finalPlace, gender, tz: '+05:30', ...coords };
    try {
      await updateProfileApi({ name: name.trim(), profile });
    } catch (_) { /* offline → local save phir bhi ho gaya */ }
    await updateStoredUser({ name: name.trim(), email, phone: mobile, profile });

    hSuccess();
    dialog('Profile updated', 'Your details have been saved.', [
      { text: 'OK', onPress: () => navigation.navigate('Main', { screen: 'Profile' }) },
    ]);
  };

  return (
    <Page title="Edit Profile" onBack={() => { hTap(); navigation.goBack(); }}>
      <Card style={styles.avatarCardOuter} contentStyle={styles.avatarCardInner}>
        <View style={styles.avatarWrap}>
          {/* delicate outer hairline ring (with a gap) — premium medallion frame */}
          <View style={[styles.avatarOuterRing, { borderColor: theme.isDark ? 'rgba(233,184,80,0.28)' : 'rgba(176,115,22,0.28)' }]} />
          <LinearGradient colors={['#fce8a8', '#e9b850', '#8a6418', '#c9962e']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatarRing}>
            <View style={[styles.avatarInner, { backgroundColor: theme.isDark ? '#07071a' : '#fffaf0' }]}>
              {avatar ? <Image source={{ uri: avatar }} style={styles.avatarImg} /> : <UserGlyph color={theme.gold1} size={50} />}
            </View>
          </LinearGradient>
          <Pressable onPress={pickAvatar} hitSlop={8} style={({ pressed }) => [styles.avatarEdit, { backgroundColor: theme.isDark ? '#07071a' : '#ffffff', borderColor: theme.gold1 }, pressed && { transform: [{ scale: 0.88 }] }]}>
            <CameraIcon color={theme.gold1} size={14} />
          </Pressable>
        </View>
        <Text style={[styles.avatarNote, { color: theme.textSoft }]}>Keep your details up to date for accurate predictions.</Text>
      </Card>

      <Text style={[styles.section, { color: theme.goldText }]}>{t('edit.personal', 'Personal Details')}</Text>
      <Card contentStyle={styles.formCard}>
        <View style={styles.formGap}>
          <TextField icon={<UserLine color={theme.gold2} size={20} />} label={t('profile.fullName', 'Full Name')} value={name} onChangeText={setName} placeholder="Raj Kumar" autoCapitalize="words" error={nameErr ? 'Required' : null} />
          <TextField icon={<MailIcon color={theme.gold2} size={20} />} label={t('profile.email', 'Email')} value={email} onChangeText={setEmail} placeholder="raj.kumar@cosmos.com" keyboardType="email-address" error={emailErr ? 'Enter a valid email' : null} />
          <TextField icon={<UserLine color={theme.gold2} size={20} />} label={t('auth.mobileNumber', 'Mobile Number')} value={mobile} onChangeText={setMobile} placeholder="+91 98765 43210" keyboardType="phone-pad" error={mobileErr ? 'Enter a valid mobile number' : null} />
        </View>
      </Card>

      <Text style={[styles.section, { color: theme.goldText }]}>{t('edit.birthDetails', 'Birth Details')}</Text>
      <Card contentStyle={styles.formCard}>
        <View style={styles.formGap}>
          <PickerField icon={<CalendarIcon color={theme.gold2} size={20} />} label={t('profile.dob', 'Date of Birth')} value={fmtDob(dob)} onPress={() => { hTap(); setShowDate(true); }} theme={theme} />
          <TimeField value={tob} onChangeText={setTob} onClock={() => { hTap(); setShowTime(true); }} theme={theme} />
          <BirthPlaceField label={t('profile.place', 'Place of Birth')} value={place} onChangeText={setPlace} onSelect={setBirthLocation} placeholder="Agolai, Jodhpur, Rajasthan" />

          {/* Gender selector (web had a <select> — here as premium segmented chips) */}
          <View>
            <Text style={[styles.genderLabel, { color: theme.goldText }]}>{t('birth.gender', 'GENDER')}</Text>
            <View style={styles.genderRow}>
              {GENDERS.map((g) => {
                const on = g === gender;
                return (
                  <Pressable key={g} onPress={() => { hSelect(); setGender(g); }} style={({ pressed }) => [styles.genderChipWrap, pressed && { transform: [{ scale: 0.97 }] }]}>
                    {on ? (
                      <LinearGradient colors={theme.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.genderChip}>
                        <Text style={[styles.genderText, { color: theme.buttonInk }]}>{g}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={[styles.genderChip, { borderWidth: 1, borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.6)' : '#fffdf7' }]}>
                        <Text style={[styles.genderText, { color: theme.gold1 }]}>{g}</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Card>

      <View style={styles.actions}>
        <GoldButton label={t('common.cancel', 'Cancel')} variant="ghost" compact onPress={() => { hTap(); navigation.goBack(); }} style={styles.actionBtn} />
        <GoldButton label={t('common.saveChanges', 'Save Changes')} compact onPress={save} style={styles.actionBtnWide} />
      </View>

      <GoldDatePicker
        visible={showDate}
        initialDate={dob}
        maximumDate={new Date()}
        onConfirm={(d) => { setDob(d); setShowDate(false); hSelect(); }}
        onCancel={() => setShowDate(false)}
        lang={lang}
      />
      <GoldTimePicker
        visible={showTime}
        value={tob}
        onConfirm={(t) => { setTob(t); setShowTime(false); hSelect(); }}
        onCancel={() => setShowTime(false)}
        lang={lang}
      />
    </Page>
  );
}

const styles = StyleSheet.create({
  avatarCardOuter: { marginTop: 6 },
  avatarCardInner: { alignItems: 'center', paddingVertical: 22 },
  avatarWrap: { width: 116, height: 116, marginBottom: 14, alignItems: 'center', justifyContent: 'center' },
  avatarOuterRing: { position: 'absolute', width: 116, height: 116, borderRadius: 58, borderWidth: 1 },
  avatarRing: { width: 98, height: 98, borderRadius: 49, padding: 2, shadowColor: '#e9b850', shadowOpacity: 0.32, shadowRadius: 18, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
  avatarInner: { flex: 1, borderRadius: 47, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
  avatarEdit: { position: 'absolute', right: 4, bottom: 4, width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  avatarNote: { fontFamily: fonts.inter, fontSize: 12.5, textAlign: 'center', lineHeight: 18 },

  section: { fontFamily: fonts.cinzelSemi, fontSize: 13, letterSpacing: 1.4, marginTop: 22, marginBottom: 10, marginLeft: 2 },
  formCard: { padding: 18 },
  formGap: { gap: 14 },

  /* picker field (DOB) — matches TextField */
  pf: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderRadius: radii.md, borderWidth: 1, shadowOpacity: 0.12, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  pfIcon: { width: 20, alignItems: 'center' },
  pfLabel: { fontFamily: fonts.interSemi, fontSize: 10.5, letterSpacing: 2 },
  pfValue: { fontFamily: fonts.inter, fontSize: 15, marginTop: 3 },
  clockBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  /* gender */
  genderLabel: { fontFamily: fonts.interSemi, fontSize: 10.5, letterSpacing: 2, marginBottom: 8, marginLeft: 2 },
  genderRow: { flexDirection: 'row', gap: 8 },
  genderChipWrap: { flex: 1, borderRadius: radii.md, overflow: 'hidden' },
  genderChip: { minHeight: 44, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  genderText: { fontFamily: fonts.interSemi, fontSize: 13 },

  actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  actionBtn: { flex: 1 },
  actionBtnWide: { flex: 1.5 },
});
