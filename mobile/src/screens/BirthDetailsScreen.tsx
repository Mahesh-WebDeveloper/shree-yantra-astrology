import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { KeyboardAwareScroll } from '../components/KeyboardAwareScroll';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Polyline } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { Theme, fonts, radii } from '../theme/tokens';
import { GradientText } from '../components/GradientText';
import { GoldButton } from '../components/GoldButton';
import { CosmicBackground } from '../components/CosmicBackground';
import { TextField } from '../components/TextField';
import { BirthPlaceField } from '../components/BirthPlaceField';
import { GoldDatePicker } from '../components/GoldDatePicker';
import { GoldTimePicker } from '../components/GoldTimePicker';
import { OmGlyph } from '../components/icons/OmGlyph';
import { UserLine, CalendarIcon, ClockIcon } from '../components/icons/ProfileIcons';
import { hTap, hSelect, hSuccess, hError } from '../lib/haptics';
import { useT, useLang } from '../i18n/LanguageProvider';
import { useDialog } from '../components/DialogProvider';
import { getStoredUser, updateStoredUser } from '../lib/auth';
import { LocationSuggestion, resolveLocation, updateProfileApi } from '../lib/api';

const PROFILE_KEY = 'sy.profile';
const GENDERS = ['Male', 'Female', 'Other'] as const;
const pad = (n: number) => (n < 10 ? '0' : '') + n;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toDDMM = (d: Date) => `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
const fmtDob = (d: Date) => `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
const to24h = (t: string): string => {
  const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return t;
  let h = Number(m[1]); const ap = (m[3] || '').toUpperCase();
  if (ap === 'PM' && h < 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return `${pad(h)}:${m[2]}`;
};

function PickerField({ icon, label, value, onPress, theme }: { icon: React.ReactNode; label: string; value: string; onPress: () => void; theme: Theme }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pf,
        { backgroundColor: theme.isDark ? 'rgba(0,0,0,0.70)' : '#fffdf7', borderColor: pressed ? theme.gold1 : (theme.isDark ? 'rgba(201,150,46,0.35)' : 'rgba(176,115,22,0.30)') },
      ]}
    >
      <View style={styles.pfIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.pfLabel, { color: theme.goldText }]}>{label.toUpperCase()}</Text>
        <Text style={[styles.pfValue, { color: value ? theme.text : theme.textMuted }]}>{value || 'Tap to select'}</Text>
      </View>
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.gold2} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Polyline points="6 9 12 15 18 9" /></Svg>
    </Pressable>
  );
}

export function BirthDetailsScreen({ navigation }: any) {
  const { theme } = useTheme();
  const dialog = useDialog();
  const insets = useSafeAreaInsets();
  const t = useT();
  const { lang } = useLang();

  const [name, setName] = useState('');
  const [gender, setGender] = useState<typeof GENDERS[number]>('Male');
  const [dob, setDob] = useState<Date | null>(null);
  const [tob, setTob] = useState('');
  const [place, setPlace] = useState('');
  const [birthLocation, setBirthLocation] = useState<LocationSuggestion | null>(null);
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getStoredUser().then((u) => { if (u?.name && u.name !== 'Friend') setName(u.name); });
  }, []);

  const save = async () => {
    if (!name.trim()) { hError(); dialog('Naam zaroori hai', 'Kripya apna naam daalein.'); return; }
    if (!dob) { hError(); dialog('Date of Birth', 'Kripya apni janm tithi chunein.'); return; }
    if (!tob.trim()) { hError(); dialog('Time of Birth', 'Kripya apna janm samay chunein.'); return; }
    if (!place.trim()) { hError(); dialog('Place of Birth', 'Kripya apna janm sthan daalein.'); return; }
    if (busy) return;
    setBusy(true);
    const resolved = birthLocation || await resolveLocation({ query: place.trim(), lang }).then((r) => r.item).catch(() => null);
    const finalPlace = resolved?.description || place.trim();
    const coords = resolved?.lat != null && resolved?.lng != null ? { lat: resolved.lat, lng: resolved.lng } : {};
    if (resolved?.description && resolved.description !== place) setPlace(resolved.description);

    // local (kundli/panchang isi se birth details lete hain — dob ISO)
    const local = { name: name.trim(), dob: toISO(dob), tob, place: finalPlace, gender, ...coords };
    AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(local)).catch(() => {});

    // backend + local user mirror (dob DD-MM-YYYY, tob 24h)
    const profile = { dob: toDDMM(dob), tob: to24h(tob), place: finalPlace, gender, tz: '+05:30', ...coords };
    try {
      await updateProfileApi({ name: name.trim(), profile });
    } catch (_) { /* offline → local save phir bhi ho gaya */ }
    await updateStoredUser({ name: name.trim(), profile });

    hSuccess();
    navigation.replace('Main');
  };

  return (
    <LinearGradient colors={theme.bgGradient} style={styles.fill}>
      <CosmicBackground />
      <KeyboardAwareScroll contentContainerStyle={[styles.shell, { paddingTop: insets.top + 22, paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
        {/* hero */}
        <View style={styles.hero}>
          <View style={[styles.omCircle, { borderColor: 'rgba(201,150,46,0.5)' }]}>
            <LinearGradient colors={theme.isDark ? ['#1a1230', '#050511'] : ['#fff3d6', '#f1e1ba']} start={{ x: 0.3, y: 0.3 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <OmGlyph size={42} />
          </View>
          <GradientText style={styles.h1}>{t('birth.title', 'YOUR BIRTH DETAILS')}</GradientText>
          <Text style={[styles.lead, { color: theme.textSoft }]}>
            {t('birth.lead', 'Ye sirf ek baar — inse hum aapki kundli, daily panchang aur predictions 100% accurate banate hain.')}
          </Text>
        </View>

        <View style={[styles.panel, { borderColor: theme.isDark ? 'rgba(201,150,46,0.28)' : 'rgba(176,115,22,0.22)', backgroundColor: theme.isDark ? 'rgba(255,255,255,0.015)' : 'rgba(255,253,247,0.6)' }]}>
          <View style={{ gap: 14 }}>
            <TextField icon={<UserLine color={theme.gold2} size={20} />} label={t('profile.fullName', 'Full Name')} value={name} onChangeText={setName} placeholder="Eg. Raj Kumar Sharma" autoCapitalize="words" />

            {/* gender */}
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

            <PickerField icon={<CalendarIcon color={theme.gold2} size={20} />} label={t('profile.dob', 'Date of Birth')} value={dob ? fmtDob(dob) : ''} onPress={() => { hTap(); setShowDate(true); }} theme={theme} />
            <PickerField icon={<ClockIcon color={theme.gold2} size={20} />} label={t('profile.tob', 'Time of Birth')} value={tob} onPress={() => { hTap(); setShowTime(true); }} theme={theme} />
            <BirthPlaceField label={t('profile.place', 'Place of Birth')} value={place} onChangeText={setPlace} onSelect={setBirthLocation} placeholder="Eg. Agolai, Jodhpur, Rajasthan" />
          </View>
        </View>

        <Text style={[styles.privacy, { color: theme.textMuted }]}>🔒 Aapki details surakshit hain aur sirf astrology calculations ke liye use hoti hain.</Text>

        <View style={{ marginTop: 18 }}>
          <GoldButton label={busy ? t('common.loading', 'Saving…') : t('birth.continueApp', 'Continue to App')} onPress={save} />
        </View>
      </KeyboardAwareScroll>

      <GoldDatePicker
        visible={showDate}
        initialDate={dob || new Date(2000, 0, 1)}
        maximumDate={new Date()}
        onConfirm={(d) => { setDob(d); setShowDate(false); hSelect(); }}
        onCancel={() => setShowDate(false)}
        lang={lang}
      />
      <GoldTimePicker
        visible={showTime}
        value={tob || '06:42'}
        onConfirm={(t) => { setTob(t); setShowTime(false); hSelect(); }}
        onCancel={() => setShowTime(false)}
        lang={lang}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  shell: { paddingHorizontal: 18, flexGrow: 1 },

  hero: { alignItems: 'center', paddingBottom: 18 },
  omCircle: { width: 76, height: 76, borderRadius: 38, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  h1: { fontFamily: fonts.cinzel, fontSize: 20, letterSpacing: 2.4, marginTop: 12, marginBottom: 6 },
  lead: { fontFamily: fonts.inter, fontSize: 13, textAlign: 'center', lineHeight: 19, maxWidth: 330 },

  panel: { borderWidth: 1, borderRadius: 18, padding: 16 },

  genderLabel: { fontFamily: fonts.interSemi, fontSize: 10.5, letterSpacing: 2, marginBottom: 8, marginLeft: 2 },
  genderRow: { flexDirection: 'row', gap: 8 },
  genderChipWrap: { flex: 1, borderRadius: radii.md, overflow: 'hidden' },
  genderChip: { minHeight: 44, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  genderText: { fontFamily: fonts.interSemi, fontSize: 13 },

  pf: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderRadius: radii.md, borderWidth: 1 },
  pfIcon: { width: 20, alignItems: 'center' },
  pfLabel: { fontFamily: fonts.interSemi, fontSize: 10.5, letterSpacing: 2 },
  pfValue: { fontFamily: fonts.inter, fontSize: 15, marginTop: 3 },

  privacy: { fontFamily: fonts.inter, fontSize: 11.5, textAlign: 'center', marginTop: 14, lineHeight: 17 },
});
