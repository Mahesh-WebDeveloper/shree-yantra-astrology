import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutAnimation, Platform, UIManager } from 'react-native';
import Svg, { Path, Polygon, Polyline, Circle, Rect, Line } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radii } from '../theme/tokens';
import { Page } from '../components/Page';
import { BellIcon } from '../components/icons/NavIcons';
import { hTap, hSelect, hSuccess } from '../lib/haptics';
import { getNotifications, markNotificationRead, AppNotification } from '../lib/api';
import { useT } from '../i18n/LanguageProvider';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const sw = (c: string) => ({ width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none' as const, stroke: c, strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const });

type NType = 'predictions' | 'account';
type Icon = 'star' | 'crown' | 'clock' | 'chart' | 'chat';

interface Note { id: string; type: NType; icon: Icon; title: string; msg: string; time: string; unread?: boolean; go?: string; }

const ICONS: Record<Icon, (c: string) => React.ReactNode> = {
  star: (c) => <Svg {...sw(c)}><Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></Svg>,
  crown: (c) => <Svg {...sw(c)}><Path d="M2 8l4 6 5-7 5 7 4-4-2 12H4z" /></Svg>,
  clock: (c) => <Svg {...sw(c)}><Circle cx={12} cy={12} r={10} /><Polyline points="12 6 12 12 16 14" /></Svg>,
  chart: (c) => <Svg {...sw(c)}><Rect x={3} y={3} width={18} height={18} /><Line x1={3} y1={3} x2={21} y2={21} /><Line x1={21} y1={3} x2={3} y2={21} /></Svg>,
  chat: (c) => <Svg {...sw(c)}><Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></Svg>,
};

const SECTIONS: { day: string; items: Note[] }[] = [
  {
    day: 'TODAY',
    items: [
      { id: 't1', type: 'predictions', icon: 'star', title: 'Today’s Prediction is Ready', msg: 'Leo · A powerful day for finance & relationships. Read your full prediction.', time: '2 min', unread: true, go: 'DailyPrediction' },
      { id: 't2', type: 'account', icon: 'crown', title: 'Premium Renews in 5 Days', msg: 'Your premium subscription will renew on 24 Jun. Tap to manage your plan.', time: '1 hr', unread: true, go: 'ManageSubscription' },
      { id: 't3', type: 'predictions', icon: 'clock', title: 'Auspicious Time Alert', msg: 'Brahma muhurta begins at 4:18 AM tomorrow — ideal for meditation.', time: '4 hr', unread: true },
    ],
  },
  {
    day: 'YESTERDAY',
    items: [
      { id: 'y1', type: 'predictions', icon: 'chart', title: 'New Insight in Your Kundli', msg: 'Jupiter Mahadasha activated · favourable period until Feb 2040.', time: '23 May', go: 'Kundli' },
      { id: 'y2', type: 'account', icon: 'chat', title: 'Pandit Suresh sent you a message', msg: '“Namaste Raj, your next consultation slot is confirmed for tomorrow…”', time: '23 May' },
    ],
  },
  {
    day: 'EARLIER',
    items: [
      { id: 'e1', type: 'account', icon: 'crown', title: 'Welcome to Premium', msg: 'Unlimited predictions, kundli analysis & astrologer chats are now active.', time: '24 Apr' },
    ],
  },
];

const TABS = [
  { key: 'all', label: 'ALL' },
  { key: 'predictions', label: 'PREDICTIONS' },
  { key: 'account', label: 'ACCOUNT' },
];

const easeNext = () => LayoutAnimation.configureNext(LayoutAnimation.create(220, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity));

// backend notification → screen Note shape
const ntype = (t: string): NType => (t === 'account' ? 'account' : 'predictions');
const nicon = (t: string): Icon => (t === 'account' ? 'crown' : t === 'promo' ? 'star' : 'chart');
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

export function NotificationsScreen({ navigation }: any) {
  const { theme } = useTheme();
  const t = useT();
  const [tab, setTab] = useState('all');
  const [read, setRead] = useState<Set<string>>(new Set());
  const [live, setLive] = useState<AppNotification[] | null>(null);

  useEffect(() => {
    let on = true;
    getNotifications().then((r) => { if (on) setLive(r.notifications); }).catch(() => {});
    return () => { on = false; };
  }, []);

  // live data → sections (warna static demo)
  const data = useMemo(() => {
    if (!live || !live.length) return SECTIONS;
    const groups: Record<string, Note[]> = { TODAY: [], YESTERDAY: [], EARLIER: [] };
    live.forEach((n) => {
      const ts = n.sentAt || n.createdAt;
      groups[relDay(ts)].push({ id: n._id, type: ntype(n.type), icon: nicon(n.type), title: n.title, msg: n.body, time: relTime(ts), unread: !n.read });
    });
    return ['TODAY', 'YESTERDAY', 'EARLIER'].map((day) => ({ day, items: groups[day] })).filter((s) => s.items.length);
  }, [live]);

  const isUnread = (n: Note) => !!n.unread && !read.has(n.id);
  const unreadCount = useMemo(
    () => data.reduce((acc, s) => acc + s.items.filter(isUnread).length, 0),
    [read, data]
  );

  const markAll = () => {
    if (!unreadCount) return;
    hSuccess();
    easeNext();
    const all = new Set<string>();
    data.forEach((s) => s.items.forEach((i) => { all.add(i.id); if (isUnread(i)) markNotificationRead(i.id).catch(() => {}); }));
    setRead(all);
  };

  const selectTab = (k: string) => { if (k === tab) return; hSelect(); easeNext(); setTab(k); };

  const openNote = (n: Note) => {
    hTap();
    if (isUnread(n)) { easeNext(); setRead((r) => new Set(r).add(n.id)); if (live) markNotificationRead(n.id).catch(() => {}); }
    if (n.go) requestAnimationFrame(() => navigation.navigate(n.go as never));
  };

  const sections = useMemo(
    () => data
      .map((s) => ({ ...s, items: s.items.filter((i) => tab === 'all' || i.type === tab) }))
      .filter((s) => s.items.length),
    [tab, data]
  );

  const dim = theme.isDark ? '#b89a5b' : '#8a6f3a';

  return (
    <Page
      title="Notifications"
      onBack={() => { hTap(); navigation.goBack(); }}
      right={<BellIcon color={theme.gold1} size={20} />}
    >
      <View style={styles.tabs}>
        {TABS.map((t) => {
          const active = t.key === tab;
          return active ? (
            <Pressable key={t.key} onPress={() => selectTab(t.key)} style={styles.tabWrap}>
              <LinearGradient colors={theme.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.tab}>
                <Text style={[styles.tabText, { color: theme.buttonInk }]}>{t.label}</Text>
              </LinearGradient>
            </Pressable>
          ) : (
            <Pressable key={t.key} onPress={() => selectTab(t.key)} style={({ pressed }) => [styles.tabWrap, styles.tab, { borderWidth: 1, borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.6)' : '#fffdf7' }, pressed && { transform: [{ scale: 0.96 }] }]}>
              <Text style={[styles.tabText, { color: theme.goldText }]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* unread count + mark all */}
      <View style={styles.headRow}>
        <Text style={[styles.countText, { color: dim }]}>
          {unreadCount > 0 ? `${unreadCount} ${t('notif.unread', 'unread')}` : t('notif.allCaught', 'You’re all caught up')}
        </Text>
        {unreadCount > 0 && (
          <Pressable onPress={markAll} hitSlop={6} style={({ pressed }) => [styles.markAll, pressed && { opacity: 0.6 }]}>
            <Text style={[styles.markText, { color: theme.gold2 }]}>{t('notif.markAll', 'MARK ALL AS READ')}</Text>
          </Pressable>
        )}
      </View>

      {sections.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.06)' : 'rgba(176,115,22,0.05)' }]}>
            <Svg width={34} height={34} viewBox="0 0 24 24" fill="none" stroke={theme.gold2} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><Path d="M13.7 21a2 2 0 0 1-3.4 0" /><Line x1={3} y1={3} x2={21} y2={21} />
            </Svg>
          </View>
          <Text style={[styles.emptyText, { color: theme.textSoft }]}>No {tab === 'all' ? '' : tab + ' '}notifications yet</Text>
        </View>
      ) : (
        sections.map((s) => (
          <View key={s.day}>
            <Text style={[styles.day, { color: theme.gold2 }]}>{t(`notif.${s.day.toLowerCase()}`, s.day)}</Text>
            <View style={{ gap: 10 }}>
              {s.items.map((n) => {
                const unread = isUnread(n);
                return (
                  <Pressable
                    key={n.id}
                    onPress={() => openNote(n)}
                    style={({ pressed }) => [
                      styles.row,
                      {
                        backgroundColor: unread ? (theme.isDark ? 'rgba(233,184,80,0.07)' : 'rgba(176,115,22,0.06)') : theme.cardBg,
                        borderColor: unread ? theme.gold3 : theme.cardBorder,
                      },
                      pressed && { transform: [{ scale: 0.99 }], borderColor: theme.gold2 },
                    ]}
                  >
                    <View style={[styles.icon, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.12)' : 'rgba(176,115,22,0.10)' }]}>
                      {ICONS[n.icon](theme.gold1)}
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.title, { color: theme.text }]}>{n.title}</Text>
                      <Text style={[styles.msg, { color: theme.textSoft }]}>{n.msg}</Text>
                    </View>
                    <View style={styles.rightCol}>
                      {unread && <View style={[styles.dot, { backgroundColor: theme.gold1, shadowColor: theme.gold1 }]} />}
                      <Text style={[styles.time, { color: theme.textMuted }]}>{n.time}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  tabWrap: { flex: 1, borderRadius: radii.pill },
  tab: { paddingVertical: 9, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  tabText: { fontFamily: fonts.cinzelSemi, fontSize: 10.5, letterSpacing: 1 },

  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  countText: { fontFamily: fonts.interMed, fontSize: 11.5, letterSpacing: 0.2 },
  markAll: { paddingVertical: 6, paddingHorizontal: 2 },
  markText: { fontFamily: fonts.interSemi, fontSize: 11, letterSpacing: 0.8 },

  day: { fontFamily: fonts.cinzelSemi, fontSize: 11, letterSpacing: 2, marginTop: 14, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, borderRadius: radii.lg, borderWidth: 1 },
  icon: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.playfair, fontSize: 14.5 },
  msg: { fontFamily: fonts.inter, fontSize: 12.5, lineHeight: 18, marginTop: 3 },
  rightCol: { alignItems: 'flex-end', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, shadowOpacity: 0.9, shadowRadius: 5, shadowOffset: { width: 0, height: 0 }, elevation: 3 },
  time: { fontFamily: fonts.inter, fontSize: 10, letterSpacing: 1 },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyText: { fontFamily: fonts.inter, fontSize: 13.5, textTransform: 'capitalize' },
});
