import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Rect, Polygon, Polyline, Line } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';
import { useT, useLang } from '../i18n/LanguageProvider';
import { aActivity, aPeriod } from '../i18n/astro';

/* 24px icons — web .cg-act-icon svg { width:24px; height:24px } */
const ic = (c: string) => ({
  width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none' as const,
  stroke: c, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
});

const ICONS = {
  business: (c: string) => (
    <Svg {...ic(c)}>
      <Rect x={2} y={7} width={20} height={14} rx={2} ry={2} />
      <Path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </Svg>
  ),
  buying: (c: string) => (
    <Svg {...ic(c)}>
      <Circle cx={9} cy={21} r={1} />
      <Circle cx={20} cy={21} r={1} />
      <Path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </Svg>
  ),
  gold: (c: string) => (
    <Svg {...ic(c)}>
      <Polygon points="12 2 2 7 12 12 22 7 12 2" />
      <Polyline points="2 17 12 22 22 17" />
      <Polyline points="2 12 12 17 22 12" />
    </Svg>
  ),
  vehicle: (c: string) => (
    <Svg {...ic(c)}>
      <Path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a2 2 0 0 0-1.6-.8H8a2 2 0 0 0-2 2v2.4" />
      <Circle cx={6.5} cy={16.5} r={2.5} />
      <Circle cx={16.5} cy={16.5} r={2.5} />
    </Svg>
  ),
  money: (c: string) => (
    <Svg {...ic(c)}>
      <Line x1={12} y1={1} x2={12} y2={23} />
      <Path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </Svg>
  ),
  travel: (c: string) => (
    <Svg {...ic(c)}>
      <Path d="M22 2L11 13" />
      <Path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </Svg>
  ),
  social: (c: string) => (
    <Svg {...ic(c)}>
      <Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </Svg>
  ),
  interview: (c: string) => (
    <Svg {...ic(c)}>
      <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <Circle cx={9} cy={7} r={4} />
      <Path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Svg>
  ),
  worship: (c: string) => (
    <Svg {...ic(c)}>
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </Svg>
  ),
};

const ACTIVITIES = [
  { id: 'business', title: 'Business / Deal Signing', tag: 'LABH / AMRIT', color: 'green' },
  { id: 'buying', title: 'Buying New Items', tag: 'SHUBH / LABH', color: 'purple' },
  { id: 'gold', title: 'Gold / Jewelry Purchase', tag: 'AMRIT', color: 'gold' },
  { id: 'vehicle', title: 'Vehicle Purchase', tag: 'SHUBH', color: 'green' },
  { id: 'money', title: 'Money Transfer', tag: 'LABH', color: 'blue' },
  { id: 'travel', title: 'Travel / Journey', tag: 'CHAR', color: 'gold' },
  { id: 'social', title: 'Social Media Posting', tag: 'CHAR', color: 'purple' },
  { id: 'interview', title: 'Interview / Meeting', tag: 'SHUBH', color: 'green' },
  { id: 'worship', title: 'Worship / Prayer', tag: 'AMRIT', color: 'gold' },
];

export const ChoghadiyaActivities = React.memo(function ChoghadiyaActivities({
  activeChoghadiya,
}: {
  /** Current active period name (e.g. "Amrit") — only when viewing today.
      Activities whose tag includes this period get a live "NOW" highlight. */
  activeChoghadiya?: string;
}) {
  const { theme } = useTheme();
  const t = useT();
  const { lang } = useLang();
  const activeUp = (activeChoghadiya || '').toUpperCase();

  const getColor = (c: string) => {
    switch (c) {
      case 'green': return '#32cd32';
      case 'purple': return '#bd5cff';
      case 'gold': return theme.goldText;
      case 'blue': return '#4499ff';
      default: return theme.goldText;
    }
  };
  /* web: radial-gradient(circle, rgba(c,0.2), transparent) + 1px border rgba(c,0.2)
     → approximated with a soft solid fill + slightly stronger border */
  const getFill = (c: string) => {
    switch (c) {
      case 'green': return 'rgba(50,205,50,0.10)';
      case 'purple': return 'rgba(189,92,255,0.10)';
      case 'gold': return 'rgba(238,203,122,0.10)';
      case 'blue': return 'rgba(68,153,255,0.10)';
      default: return 'rgba(238,203,122,0.10)';
    }
  };
  const getBorder = (c: string) => {
    switch (c) {
      case 'green': return 'rgba(50,205,50,0.38)';
      case 'purple': return 'rgba(189,92,255,0.38)';
      case 'gold': return 'rgba(238,203,122,0.42)';
      case 'blue': return 'rgba(68,153,255,0.36)';
      default: return 'rgba(238,203,122,0.42)';
    }
  };

  const goldDim = theme.goldDim;
  const cardBorder = theme.isDark ? 'rgba(238,203,122,0.30)' : theme.cardBorder;

  return (
    <View style={styles.container}>
      {/* web .cg-section-header — left-aligned clock icon + dim-gold uppercase */}
      <View style={styles.headRow}>
        <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={goldDim} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Circle cx={12} cy={12} r={10} />
          <Path d="M12 8v4l3 3" />
        </Svg>
        <Text style={[styles.headText, { color: goldDim }]}>{t('cg.activities', 'WHICH CHOGHADIYA IS BEST FOR WHICH ACTIVITY?')}</Text>
      </View>
      <View style={styles.grid}>
        {ACTIVITIES.map((act) => {
          const color = getColor(act.color);
          // tag "LABH / AMRIT" → ["LABH","AMRIT"]; live if the active period matches
          const names = act.tag.split('/').map((s) => s.trim());
          const isNow = !!activeUp && names.includes(activeUp);
          return (
            <View
              key={act.id}
              style={[
                styles.card,
                {
                  // same background for all; active card highlights with BORDER only (no colored glow / inner fill)
                  backgroundColor: theme.isDark ? '#000000' : '#ffffff',
                  borderColor: isNow ? color : cardBorder,
                  borderWidth: isNow ? 1.5 : 1,
                },
              ]}
            >
              {isNow && (
                <View style={[styles.nowBadge, { backgroundColor: color }]}>
                  <Text style={styles.nowBadgeText}>{t('cg.now', 'NOW')}</Text>
                </View>
              )}
              <View style={[styles.icon, { borderColor: getBorder(act.color), backgroundColor: getFill(act.color) }]}>
                {ICONS[act.id as keyof typeof ICONS](color)}
              </View>
              <Text style={[styles.title, { color: theme.isDark ? '#dddddd' : theme.text }]}>{aActivity(act.id, lang, act.title)}</Text>
              <Text style={[styles.tag, { color: act.color === 'gold' ? theme.goldText : color }]}>
                {lang === 'hi' ? act.tag.split('/').map((s) => aPeriod(s.trim(), lang)).join(' / ') : act.tag}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {},
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  headText: { flex: 1, fontFamily: fonts.interMed, fontSize: 12.5, letterSpacing: 0.8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  card: {
    width: '48%',
    flexGrow: 1,
    borderRadius: 15,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  icon: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title: { fontFamily: fonts.interSemi, fontSize: 11, textAlign: 'center', marginBottom: 6, minHeight: 30 },
  tag: { fontFamily: fonts.interBold, fontSize: 10, letterSpacing: 0.5 },
  /* live highlight — current active choghadiya ke matching activities */
  cardNow: {
    borderWidth: 1.5,
    shadowOpacity: 0.55,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  nowBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  nowBadgeText: { fontFamily: fonts.interBold, fontSize: 8, letterSpacing: 0.8, color: '#0a0a0a' },
});
