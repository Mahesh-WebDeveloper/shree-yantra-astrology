import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../theme/ThemeProvider';
import { Theme, fonts, radii } from '../theme/tokens';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { BrandHeader } from '../components/BrandHeader';
import { GradientText } from '../components/GradientText';
import {
  UserGlyph, UserLine, CalendarIcon, ClockIcon, MapPinIcon, MailIcon,
  EditIcon, BellLine, CrownIcon, BookmarkIcon, GlobeIcon, LockIcon, HelpIcon,
  LogoutIcon, CameraIcon, ChevronIcon,
} from '../components/icons/ProfileIcons';
import {
  PROFILE, STATS, INFO, ACCOUNT, PREFERENCES, VERSION, InfoItem, MenuItem, RowIcon,
} from '../data/profile';
import { openAppDrawer } from '../navigation/AppDrawerHost';
import { useDialog } from '../components/DialogProvider';
import { hTap, hSelect, hSuccess } from '../lib/haptics';
import { clearAuth, useCurrentUser, updateStoredUser } from '../lib/auth';
import { uploadAvatar, removeAvatarApi, avatarUrl } from '../lib/api';
import { useScreen } from '../context/AppConfigProvider';
import { useLang } from '../i18n/LanguageProvider';

const AVATAR_KEY = 'sy.avatar';
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// '15-08-1995' → '15 Aug 1995'
const fmtBirthDate = (ddmmyyyy?: string) => {
  if (!ddmmyyyy) return 'Not set';
  const [d, m, y] = ddmmyyyy.split('-');
  if (!d || !m || !y) return ddmmyyyy;
  return `${d} ${MON[(Number(m) || 1) - 1]} ${y}`;
};
// '06:42' → '06:42 AM'
const fmt12h = (hhmm?: string) => {
  if (!hhmm) return 'Not set';
  const mt = hhmm.match(/^(\d{1,2}):(\d{2})/);
  if (!mt) return hhmm;
  let h = Number(mt[1]); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12; if (h === 0) h = 12;
  return `${h < 10 ? '0' : ''}${h}:${mt[2]} ${ap}`;
};
const monthYear = (iso?: string) => {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : `${MON[d.getMonth()]} ${d.getFullYear()}`;
};

const infoIcon = (k: InfoItem['icon'], color: string) => {
  switch (k) {
    case 'user': return <UserLine color={color} />;
    case 'calendar': return <CalendarIcon color={color} />;
    case 'clock': return <ClockIcon color={color} />;
    case 'pin': return <MapPinIcon color={color} />;
    case 'mail': return <MailIcon color={color} />;
  }
};

const menuIcon = (k: RowIcon, color: string) => {
  switch (k) {
    case 'edit': return <EditIcon color={color} />;
    case 'bell': return <BellLine color={color} />;
    case 'crown': return <CrownIcon color={color} size={18} />;
    case 'bookmark': return <BookmarkIcon color={color} />;
    case 'globe': return <GlobeIcon color={color} />;
    case 'lock': return <LockIcon color={color} />;
    case 'help': return <HelpIcon color={color} />;
  }
};

/* shared gold-bordered icon tile */
function IcCircle({ children, theme }: { children: React.ReactNode; theme: Theme }) {
  return (
    <View style={[styles.icCircle, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.5)' : 'rgba(176,115,22,0.06)' }]}>
      {children}
    </View>
  );
}

export function ProfileScreen({ navigation }: any) {
  const { theme } = useTheme();
  const dialog = useDialog();
  const openMenu = () => openAppDrawer();
  const user = useCurrentUser();
  const pscr = useScreen('profile'); // admin-managed badges/labels

  // live user → name / meta / info (warna static demo)
  const displayName = user?.name || PROFILE.name;
  const isPremium = user?.plan === 'premium';
  const since = monthYear(user?.createdAt);
  const metaText = user
    ? `${isPremium ? 'Premium' : 'Free'} Member${since ? ` · Since ${since}` : ''}`
    : PROFILE.meta;
  const infoItems: InfoItem[] = user
    ? [
        { icon: 'user', label: 'Full Name', value: user.name },
        { icon: 'calendar', label: 'Date of Birth', value: fmtBirthDate(user.profile?.dob) },
        { icon: 'clock', label: 'Time of Birth', value: fmt12h(user.profile?.tob) },
        { icon: 'pin', label: 'Place of Birth', value: user.profile?.place || 'Not set' },
        { icon: 'mail', label: user.email ? 'Email' : 'Mobile', value: user.email || user.phone || 'Not set' },
      ]
    : INFO;

  const [avatar, setAvatar] = useState<string | null>(null);
  const [notify, setNotify] = useState(true);
  const { lang, setLang, t } = useLang();
  const langLabel = lang === 'hi' ? 'हिंदी' : 'English';

  useEffect(() => {
    AsyncStorage.getItem(AVATAR_KEY).then((v) => v && setAvatar(v));
  }, []);

  // server par saved avatar (dusre device par bhi dikhega) — local cache se win karta hai
  useEffect(() => {
    if (user?.profile?.avatar) setAvatar(avatarUrl(user.profile.avatar));
  }, [user?.profile?.avatar]);

  const applyAvatar = (uri: string) => {
    setAvatar(uri); // turant local preview
    AsyncStorage.setItem(AVATAR_KEY, uri).catch(() => {});
    hSuccess();
    // background me server par upload → kisi bhi device par sync
    uploadAvatar(uri)
      .then((r) => updateStoredUser({ profile: { avatar: r.avatar } }))
      .catch((e) => dialog('Upload failed', e?.message || 'Photo could not be saved — please check your internet.'));
  };

  const openCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      dialog('Camera permission needed', 'Allow camera access to take a profile photo from Settings.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.85 });
    if (!res.canceled && res.assets?.[0]?.uri) applyAvatar(res.assets[0].uri);
  };

  const openGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      dialog('Permission needed', 'Allow photo access to set a profile picture.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.85 });
    if (!res.canceled && res.assets?.[0]?.uri) applyAvatar(res.assets[0].uri);
  };

  // tap the camera badge → choose Camera or Gallery (themed dialog)
  const pickAvatar = () => {
    hTap();
    dialog('Profile Photo', 'How would you like to set your photo?', [
      { text: 'Take Photo', onPress: openCamera },
      { text: 'Choose from Gallery', onPress: openGallery },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const removeAvatar = () => {
    if (!avatar) return;
    hSelect();
    dialog('Remove profile photo?', 'Your default avatar will be shown instead.', [
      { text: 'KEEP', style: 'cancel' },
      {
        text: 'REMOVE',
        style: 'destructive',
        onPress: () => {
          setAvatar(null);
          AsyncStorage.removeItem(AVATAR_KEY).catch(() => {});
          removeAvatarApi()
            .then(() => updateStoredUser({ profile: { avatar: undefined } }))
            .catch(() => {});
        },
      },
    ]);
  };

  const logout = () => {
    hTap();
    dialog('Log out?', 'You will need to sign in again to access your profile.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => { clearAuth(); navigation.navigate('SignIn'); } },
    ]);
  };

  const onMenuItem = (label: string) => {
    hTap();
    if (label === 'Edit Profile') navigation.navigate('EditProfile');
    else if (label === 'Manage Subscription') navigation.navigate('ManageSubscription');
    else if (label === 'Notifications') navigation.navigate('Notifications');
    else if (label === 'Saved Library') navigation.navigate('Library');
    else if (label === 'Help & Support') navigation.navigate('Help');
    else if (label === 'Language') {
      dialog('Language', 'Choose your preferred language', [
        { text: 'English', onPress: () => { setLang('en'); hSuccess(); } },
        { text: 'हिंदी', onPress: () => { setLang('hi'); hSuccess(); } },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } else if (label === 'Privacy & Security') {
      navigation.navigate('PrivacySecurity');
    }
  };

  return (
    <Screen>
      <BrandHeader onMenu={openMenu} onBell={() => navigation.navigate('Notifications')} />

      {/* HERO */}
      <Card solidBlack style={styles.heroOuter} contentStyle={styles.hero}>
        <View style={styles.avatarWrap}>
          {/* delicate outer hairline ring (with a gap) — premium medallion frame */}
          <View style={[styles.avatarOuterRing, { borderColor: theme.isDark ? 'rgba(233,184,80,0.28)' : 'rgba(176,115,22,0.28)' }]} />
          <Pressable onLongPress={removeAvatar} delayLongPress={400}>
            <LinearGradient
              colors={['#fce8a8', '#e9b850', '#c9962e']}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={styles.avatarRing}
            >
              <View style={[styles.avatarInner, { backgroundColor: theme.isDark ? '#07071a' : '#f6ead0' }]}>
                {avatar ? (
                  <Image source={{ uri: avatar }} style={styles.avatarImg} />
                ) : (
                  <UserGlyph color={theme.gold1} size={54} />
                )}
              </View>
            </LinearGradient>
          </Pressable>
          <Pressable
            onPress={pickAvatar}
            style={({ pressed }) => [styles.avatarEdit, { backgroundColor: theme.isDark ? '#07071a' : '#fffdf7', borderColor: theme.gold1 }, pressed && { transform: [{ scale: 0.88 }] }]}
            hitSlop={8}
          >
            <CameraIcon color={theme.gold1} size={14} />
          </Pressable>
        </View>

        <GradientText style={styles.name}>{displayName}</GradientText>
        <Text style={[styles.meta, { color: theme.textSoft }]}>{metaText}</Text>

        <LinearGradient
          colors={theme.buttonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.premium}
        >
          <CrownIcon color={theme.buttonInk} size={13} />
          <Text style={[styles.premiumText, { color: theme.buttonInk }]}>{isPremium ? pscr.t('premiumBadge', 'PREMIUM MEMBER') : pscr.t('freeBadge', 'FREE MEMBER')}</Text>
        </LinearGradient>

        <View style={styles.stats}>
          {STATS.map((s) => (
            <View
              key={s.label}
              style={[styles.statCell, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.45)' : 'rgba(176,115,22,0.06)' }]}
            >
              <GradientText style={styles.statNum}>{s.num}</GradientText>
              <Text style={[styles.statLbl, { color: theme.textSoft }]}>{s.label}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* MY INFORMATION */}
      <Text style={[styles.section, { color: theme.goldText }]}>{t('profile.myInfo', 'My Information')}</Text>
      <Card padded={false} solidBlack contentStyle={styles.listCard}>
        {infoItems.map((it, i) => (
          <View key={it.label} style={[styles.infoRow, { borderBottomColor: theme.line }, i === infoItems.length - 1 && styles.noBorder]}>
            <IcCircle theme={theme}>{infoIcon(it.icon, theme.gold1)}</IcCircle>
            <View style={styles.body}>
              <Text style={[styles.infoLbl, { color: theme.goldText }]}>{it.label.toUpperCase()}</Text>
              <Text style={[styles.infoVal, { color: theme.text }]}>{it.value}</Text>
            </View>
          </View>
        ))}
      </Card>

      {/* ACCOUNT */}
      <Text style={[styles.section, { color: theme.goldText }]}>{t('profile.account', 'Account')}</Text>
      <MenuCard items={ACCOUNT} theme={theme} onItem={onMenuItem} />

      {/* PREFERENCES */}
      <Text style={[styles.section, { color: theme.goldText }]}>{t('profile.preferences', 'Preferences')}</Text>
      <Card padded={false} solidBlack contentStyle={styles.listCard}>
        {PREFERENCES.map((it, i) => (
          <Pressable
            key={it.label}
            onPress={() => !it.toggle && onMenuItem(it.label)}
            disabled={it.toggle}
            style={({ pressed }) => [
              styles.menuRow,
              { borderBottomColor: theme.line },
              i === PREFERENCES.length - 1 && styles.noBorder,
              pressed && !it.toggle && { backgroundColor: theme.isDark ? 'rgba(233,184,80,0.06)' : 'rgba(176,115,22,0.06)' },
            ]}
          >
            <IcCircle theme={theme}>{menuIcon(it.icon, theme.gold1)}</IcCircle>
            <View style={styles.body}>
              <Text style={[styles.mLbl, { color: theme.text }]}>{t(`menu.${it.label}`, it.label)}</Text>
              <Text style={[styles.mSub, { color: theme.textMuted }]}>{it.label === 'Language' ? langLabel : it.sub}</Text>
            </View>
            {it.toggle ? (
              <Switch
                value={notify}
                onValueChange={(v) => { hSelect(); setNotify(v); }}
                trackColor={{ false: 'rgba(150,150,150,0.4)', true: theme.gold2 }}
                thumbColor="#fff"
                ios_backgroundColor="rgba(150,150,150,0.4)"
              />
            ) : (
              <ChevronIcon color={theme.gold2} size={18} />
            )}
          </Pressable>
        ))}
      </Card>

      {/* LOGOUT */}
      <Pressable
        onPress={logout}
        style={({ pressed }) => [styles.logout, { borderColor: 'rgba(192,57,43,0.45)', backgroundColor: theme.isDark ? 'rgba(255,80,80,0.06)' : 'rgba(192,57,43,0.06)' }, pressed && { transform: [{ scale: 0.99 }], backgroundColor: theme.isDark ? 'rgba(255,80,80,0.12)' : 'rgba(192,57,43,0.1)' }]}
        android_ripple={{ color: 'rgba(192,57,43,0.15)' }}
      >
        <LogoutIcon color={theme.isDark ? '#ff8585' : '#c0392b'} size={18} />
        <Text style={[styles.logoutText, { color: theme.isDark ? '#ff8585' : '#c0392b' }]}>LOGOUT</Text>
      </Pressable>

      <Text style={[styles.version, { color: theme.textMuted }]}>{VERSION}</Text>
    </Screen>
  );
}

function MenuCard({ items, theme, onItem }: { items: MenuItem[]; theme: Theme; onItem: (label: string) => void }) {
  const t = useLang().t;
  return (
    <Card padded={false} solidBlack contentStyle={styles.listCard}>
      {items.map((it, i) => (
        <Pressable
          key={it.label}
          onPress={() => onItem(it.label)}
          android_ripple={{ color: theme.ripple }}
          style={({ pressed }) => [
            styles.menuRow,
            { borderBottomColor: theme.line },
            i === items.length - 1 && styles.noBorder,
            pressed && { backgroundColor: theme.isDark ? 'rgba(233,184,80,0.06)' : 'rgba(176,115,22,0.06)' },
          ]}
        >
          <IcCircle theme={theme}>{menuIcon(it.icon, theme.gold1)}</IcCircle>
          <View style={styles.body}>
            <Text style={[styles.mLbl, { color: theme.text }]}>{t(`menu.${it.label}`, it.label)}</Text>
            <Text style={[styles.mSub, { color: theme.textMuted }]}>{it.sub}</Text>
          </View>
          <ChevronIcon color={theme.gold2} size={18} />
        </Pressable>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  heroOuter: { marginTop: 14 },
  hero: { alignItems: 'center', paddingVertical: 22, paddingHorizontal: 18 },
  avatarWrap: { width: 120, height: 120, marginBottom: 12, alignItems: 'center', justifyContent: 'center' },
  avatarOuterRing: { position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 1 },
  avatarRing: { width: 102, height: 102, borderRadius: 51, padding: 2, alignItems: 'center', justifyContent: 'center', shadowColor: '#e9b850', shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
  avatarInner: { width: '100%', height: '100%', borderRadius: 50, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
  avatarEdit: { position: 'absolute', right: 4, bottom: 6, width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },

  name: { fontFamily: fonts.playfairBold, fontSize: 24, marginTop: 2 },
  meta: { fontFamily: fonts.inter, fontSize: 12.5, marginTop: 4 },

  premium: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.pill },
  premiumText: { fontFamily: fonts.cinzel, fontSize: 10.5, letterSpacing: 1.6 },

  stats: { flexDirection: 'row', gap: 8, marginTop: 18, alignSelf: 'stretch' },
  statCell: { flex: 1, paddingVertical: 12, paddingHorizontal: 6, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
  statNum: { fontFamily: fonts.playfairBold, fontSize: 22, lineHeight: 26 },
  statLbl: { fontFamily: fonts.inter, fontSize: 9.5, letterSpacing: 1, marginTop: 4, textTransform: 'uppercase' },

  section: { fontFamily: fonts.cinzelSemi, fontSize: 13, letterSpacing: 1.4, marginTop: 22, marginBottom: 10, marginLeft: 2 },
  listCard: { paddingHorizontal: 14 },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, borderBottomWidth: 1 },
  noBorder: { borderBottomWidth: 0 },

  icCircle: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, minWidth: 0 },

  infoLbl: { fontFamily: fonts.interSemi, fontSize: 10, letterSpacing: 1.4 },
  infoVal: { fontFamily: fonts.interMed, fontSize: 14, marginTop: 2 },

  mLbl: { fontFamily: fonts.interMed, fontSize: 14.5 },
  mSub: { fontFamily: fonts.inter, fontSize: 11.5, marginTop: 2 },

  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 18, paddingVertical: 14, borderRadius: 14, borderWidth: 1 },
  logoutText: { fontFamily: fonts.cinzel, fontSize: 12.5, letterSpacing: 1.8 },

  version: { fontFamily: fonts.inter, fontSize: 10.5, letterSpacing: 1.4, textAlign: 'center', marginTop: 18 },
});
