import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutAnimation, Platform, UIManager, Switch, Alert } from 'react-native';
import Svg, { Path, Polygon, Polyline, Circle, Rect, Line } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radii } from '../theme/tokens';
import { Page } from '../components/Page';
import { hTap, hSelect, hSuccess } from '../lib/haptics';
import {
  getNotifications, markNotificationRead, markAllNotificationsRead,
  deleteNotification, clearAllNotifications, AppNotification,
} from '../lib/api';
import { getDailyReminder, setDailyReminder } from '../lib/notifications';
import { setUnread, bumpUnread } from '../lib/notificationStore';
import { useT, useLang } from '../i18n/LanguageProvider';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const sw = (c: string) => ({ width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none' as const, stroke: c, strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const });

// category = one of the tabs; icon = the glyph shown per row
type Cat = 'predictions' | 'offers' | 'account';
type Icon = 'star' | 'crown' | 'clock' | 'chart' | 'chat' | 'bell';

interface Note { id: string; cat: Cat; icon: Icon; title: string; msg: string; ts: string; unread: boolean; go?: string; }

const ICONS: Record<Icon, (c: string) => React.ReactNode> = {
  star: (c) => <Svg {...sw(c)}><Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></Svg>,
  crown: (c) => <Svg {...sw(c)}><Path d="M2 8l4 6 5-7 5 7 4-4-2 12H4z" /></Svg>,
  clock: (c) => <Svg {...sw(c)}><Circle cx={12} cy={12} r={10} /><Polyline points="12 6 12 12 16 14" /></Svg>,
  chart: (c) => <Svg {...sw(c)}><Line x1={3} y1={21} x2={21} y2={21} /><Rect x={5} y={11} width={3.4} height={8} /><Rect x={10.3} y={7} width={3.4} height={12} /><Rect x={15.6} y={3.5} width={3.4} height={15.5} /></Svg>,
  chat: (c) => <Svg {...sw(c)}><Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></Svg>,
  bell: (c) => <Svg {...sw(c)}><Path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><Path d="M13.73 21a2 2 0 0 1-3.46 0" /></Svg>,
};

const TrashIcon = ({ c, size = 15 }: { c: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="3 6 5 6 21 6" /><Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </Svg>
);

const TABS: { key: 'all' | Cat; label: string }[] = [
  { key: 'all', label: 'ALL' },
  { key: 'predictions', label: 'PREDICTIONS' },
  { key: 'offers', label: 'OFFERS' },
  { key: 'account', label: 'ACCOUNT' },
];

const easeNext = () => LayoutAnimation.configureNext(LayoutAnimation.create(220, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity));

// backend notification type → category / icon / deep-link screen
const ncat = (t: string): Cat => (t === 'account' ? 'account' : t === 'promo' ? 'offers' : 'predictions');
const nicon = (t: string): Icon => (t === 'account' ? 'crown' : t === 'promo' ? 'star' : 'bell');
const ngo = (t: string): string | undefined => (t === 'account' ? 'ManageSubscription' : t === 'prediction' ? 'DailyPrediction' : undefined);

const relDay = (iso: string) => {
  const d = new Date(iso); const now = new Date();
  const sd = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((sd(now) - sd(d)) / 86400000);
  return diff <= 0 ? 'TODAY' : diff === 1 ? 'YESTERDAY' : 'EARLIER';
};
const MONS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const relTime = (iso: string) => {
  const d = new Date(iso); const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins} min`;
  if (mins < 1440) return `${Math.floor(mins / 60)} hr`;
  return `${d.getDate()} ${MONS[d.getMonth()]}`;
};

// Local daily "आज का राशिफल" reminder — scheduled on the device (works offline, no server).
function DailyReminderCard() {
  const { theme } = useTheme();
  const { lang } = useLang();
  const hi = lang === 'hi';
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);

  React.useEffect(() => { getDailyReminder().then((r) => setOn(r.on)); }, []);

  const toggle = async (next: boolean) => {
    if (busy) return;
    hSelect();
    setBusy(true);
    setOn(next); // optimistic
    const ok = await setDailyReminder(next, 8, 0);
    if (!ok && next) setOn(false); // permission denied
    setBusy(false);
  };

  return (
    <View style={[styles.reminderCard, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.06)' : 'rgba(255,247,224,0.9)' }]}>
      <View style={styles.reminderRow}>
        <Text style={styles.reminderEmoji}>🌅</Text>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.reminderTitle, { color: theme.text }]}>{hi ? 'रोज़ का राशिफल रिमाइंडर' : 'Daily Rashifal Reminder'}</Text>
          <Text style={[styles.reminderSub, { color: theme.textMuted }]}>{hi ? 'हर सुबह 8:00 बजे सूचना' : 'A gentle nudge every morning at 8:00 AM'}</Text>
        </View>
        <Switch value={on} onValueChange={toggle} trackColor={{ true: theme.gold1, false: theme.cardBorder }} thumbColor="#fff" />
      </View>
    </View>
  );
}

export function NotificationsScreen({ navigation }: any) {
  const { theme } = useTheme();
  const t = useT();
  const [tab, setTab] = useState<'all' | Cat>('all');
  const [live, setLive] = useState<AppNotification[] | null>(null);
  const [read, setRead] = useState<Set<string>>(new Set());     // local optimistic read
  const [gone, setGone] = useState<Set<string>>(new Set());     // local optimistic delete

  const load = useCallback(() => {
    getNotifications().then((r) => {
      setLive(r.notifications || []);
      setUnread(r.unreadCount || 0);
    }).catch(() => { setLive([]); });
  }, []);

  // refresh every time the screen gains focus (keeps the list + badge live)
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const isReadN = (n: AppNotification) => read.has(n._id) || !!n.read;

  // live data → date-grouped sections, minus locally-deleted, filtered by tab
  const sections = useMemo(() => {
    const list = (live || []).filter((n) => !gone.has(n._id));
    const groups: Record<string, Note[]> = { TODAY: [], YESTERDAY: [], EARLIER: [] };
    list.forEach((n) => {
      const ts = n.sentAt || n.createdAt;
      const note: Note = { id: n._id, cat: ncat(n.type), icon: nicon(n.type), title: n.title, msg: n.body, ts: relTime(ts), unread: !isReadN(n), go: ngo(n.type) };
      if (tab === 'all' || note.cat === tab) groups[relDay(ts)].push(note);
    });
    return ['TODAY', 'YESTERDAY', 'EARLIER'].map((day) => ({ day, items: groups[day] })).filter((s) => s.items.length);
  }, [live, read, gone, tab]);

  const totalUnread = useMemo(() => (live || []).filter((n) => !gone.has(n._id) && !isReadN(n)).length, [live, read, gone]);
  const anyItems = useMemo(() => (live || []).some((n) => !gone.has(n._id)), [live, gone]);

  const selectTab = (k: 'all' | Cat) => { if (k === tab) return; hSelect(); easeNext(); setTab(k); };

  const openNote = (n: Note) => {
    hTap();
    if (n.unread) { easeNext(); setRead((r) => new Set(r).add(n.id)); bumpUnread(-1); markNotificationRead(n.id).catch(() => {}); }
    if (n.go) requestAnimationFrame(() => navigation.navigate(n.go as never));
  };

  const markAll = () => {
    if (!totalUnread) return;
    hSuccess();
    easeNext();
    setRead(new Set((live || []).map((n) => n._id)));
    setUnread(0);
    markAllNotificationsRead().catch(() => {});
  };

  const deleteOne = (n: Note) => {
    hTap();
    easeNext();
    setGone((g) => new Set(g).add(n.id));
    if (n.unread) bumpUnread(-1);
    deleteNotification(n.id).then((r) => { if (typeof r.unreadCount === 'number') setUnread(r.unreadCount); }).catch(() => {});
  };

  const clearAll = () => {
    if (!anyItems) return;
    Alert.alert(
      t('notif.clearTitle', 'Clear all notifications?'),
      t('notif.clearMsg', 'This removes all your notifications. This cannot be undone.'),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('notif.clearAll', 'Clear all'),
          style: 'destructive',
          onPress: () => {
            hSuccess();
            easeNext();
            setGone(new Set((live || []).map((n) => n._id)));
            setUnread(0);
            clearAllNotifications().catch(() => {});
          },
        },
      ]
    );
  };

  const dim = theme.isDark ? '#b89a5b' : theme.textMuted;

  return (
    <Page
      title="Notifications"
      onBack={() => { hTap(); navigation.goBack(); }}
      right={anyItems ? (
        <Pressable onPress={clearAll} hitSlop={10}>
          <TrashIcon c={theme.gold1} size={19} />
        </Pressable>
      ) : undefined}
    >
      <DailyReminderCard />

      <View style={styles.tabs}>
        {TABS.map((tb) => {
          const active = tb.key === tab;
          return active ? (
            <Pressable key={tb.key} onPress={() => selectTab(tb.key)} style={styles.tabWrap}>
              <LinearGradient colors={theme.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.tab}>
                <Text style={[styles.tabText, { color: theme.buttonInk }]}>{tb.label}</Text>
              </LinearGradient>
            </Pressable>
          ) : (
            <Pressable key={tb.key} onPress={() => selectTab(tb.key)} style={({ pressed }) => [styles.tabWrap, styles.tab, { borderWidth: 1, borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.6)' : '#fffdf7' }, pressed && { transform: [{ scale: 0.96 }] }]}>
              <Text style={[styles.tabText, { color: theme.goldText }]}>{tb.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* unread count + mark all */}
      <View style={styles.headRow}>
        <Text style={[styles.countText, { color: dim }]}>
          {totalUnread > 0 ? `${totalUnread} ${t('notif.unread', 'unread')}` : t('notif.allCaught', 'You’re all caught up')}
        </Text>
        {totalUnread > 0 && (
          <Pressable onPress={markAll} hitSlop={6} style={({ pressed }) => [styles.markAll, pressed && { opacity: 0.6 }]}>
            <Text style={[styles.markText, { color: theme.gold2 }]}>{t('notif.markAll', 'MARK ALL AS READ')}</Text>
          </Pressable>
        )}
      </View>

      {sections.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.06)' : '#ffffff' }]}>
            <Svg width={34} height={34} viewBox="0 0 24 24" fill="none" stroke={theme.gold2} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><Path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </Svg>
          </View>
          <Text style={[styles.emptyText, { color: theme.textSoft }]}>
            {live === null ? t('notif.loading', 'Loading…') : t('notif.none', 'No notifications yet')}
          </Text>
        </View>
      ) : (
        sections.map((s) => (
          <View key={s.day}>
            <Text style={[styles.day, { color: theme.gold2 }]}>{t(`notif.${s.day.toLowerCase()}`, s.day)}</Text>
            <View style={{ gap: 10 }}>
              {s.items.map((n) => (
                <Pressable
                  key={n.id}
                  onPress={() => openNote(n)}
                  style={({ pressed }) => [
                    styles.row,
                    {
                      backgroundColor: n.unread ? (theme.isDark ? 'rgba(233,184,80,0.07)' : 'rgba(176,115,22,0.06)') : theme.cardBg,
                      borderColor: n.unread ? theme.gold3 : theme.cardBorder,
                      opacity: n.unread ? 1 : 0.72,
                    },
                    pressed && { transform: [{ scale: 0.99 }], borderColor: theme.gold2 },
                  ]}
                >
                  <View style={[styles.icon, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.12)' : '#ffffff' }]}>
                    {ICONS[n.icon](theme.gold1)}
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.title, { color: theme.text }]}>{n.title}</Text>
                    <Text style={[styles.msg, { color: theme.textSoft }]}>{n.msg}</Text>
                    <Text style={[styles.time, { color: theme.textMuted }]}>{n.ts}</Text>
                  </View>
                  <View style={styles.rightCol}>
                    {n.unread && <View style={[styles.dot, { backgroundColor: theme.gold1, shadowColor: theme.gold1 }]} />}
                    <Pressable onPress={() => deleteOne(n)} hitSlop={10} style={({ pressed }) => [styles.del, pressed && { opacity: 0.5 }]}>
                      <TrashIcon c={theme.textMuted} size={15} />
                    </Pressable>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ))
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  reminderCard: { borderWidth: 1, borderRadius: 16, marginBottom: 12, overflow: 'hidden' },
  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  reminderEmoji: { fontSize: 26 },
  reminderTitle: { fontFamily: fonts.interBold, fontSize: 14 },
  reminderSub: { fontFamily: fonts.inter, fontSize: 11.5, lineHeight: 16, marginTop: 2 },
  tabs: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  tabWrap: { flex: 1, borderRadius: radii.pill },
  tab: { paddingVertical: 9, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  tabText: { fontFamily: fonts.cinzelSemi, fontSize: 9, letterSpacing: 0.6 },

  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  countText: { fontFamily: fonts.interMed, fontSize: 11.5, letterSpacing: 0.2 },
  markAll: { paddingVertical: 6, paddingHorizontal: 2 },
  markText: { fontFamily: fonts.interSemi, fontSize: 11, letterSpacing: 0.8 },

  day: { fontFamily: fonts.cinzelSemi, fontSize: 11, letterSpacing: 2, marginTop: 14, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, borderRadius: radii.lg, borderWidth: 1 },
  icon: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.playfair, fontSize: 14.5 },
  msg: { fontFamily: fonts.inter, fontSize: 12.5, lineHeight: 18, marginTop: 3 },
  rightCol: { alignItems: 'flex-end', justifyContent: 'space-between', gap: 10, minHeight: 40 },
  dot: { width: 8, height: 8, borderRadius: 4, shadowOpacity: 0.9, shadowRadius: 5, shadowOffset: { width: 0, height: 0 }, elevation: 3 },
  del: { padding: 2 },
  time: { fontFamily: fonts.inter, fontSize: 10, letterSpacing: 0.8, marginTop: 6 },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyText: { fontFamily: fonts.inter, fontSize: 13.5 },
});
