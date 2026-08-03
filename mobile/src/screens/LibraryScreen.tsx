import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated, Easing, ActivityIndicator, TextInput, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Path, Polyline, Circle, Rect, Line, Defs, LinearGradient as SvgGrad, Stop, G,
} from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { Theme, fonts } from '../theme/tokens';
import { Screen } from '../components/Screen';
import { BrandHeader } from '../components/BrandHeader';
import { ShubhAvsar } from '../components/ShubhAvsar';
import { GradientText } from '../components/GradientText';
import { Chevron, Sparkle } from '../components/icons/CommonIcons';
import { usePlayer, usePlayerTime, fmtTime } from '../audio/PlayerProvider';
import { Seekbar } from '../audio/Seekbar';
import { PlayIcon, PauseIcon, PrevIcon, NextIcon } from '../audio/PlayerIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { openAppDrawer } from '../navigation/AppDrawerHost';
import { useScreen } from '../context/AppConfigProvider';
import { useLang, useT } from '../i18n/LanguageProvider';
import { avatarUrl, getLibrary, getMedia, getDailyShloka, ContentBook, MediaItem, DailyShloka } from '../lib/api';
import { hTap, hSelect } from '../lib/haptics';
import {
  LIB_FILTERS, SCRIPTURES, booksByCat,
  itemById, Track, TrackColor, LibraryItem, FilterKey, LibFilter,
} from '../data/library';
import { useLibraryStore, toggleSaved } from '../lib/libraryStore';
import { cmsToLibraryItem, isCmsBookId, cmsRawId } from '../lib/cmsBooks';

const colorFor = (theme: Theme, c: TrackColor) =>
  c === 'purple' ? theme.purple : c === 'green' ? theme.green : c === 'blue' ? theme.blue : c === 'rose' ? theme.red : theme.gold1;

/* ── icon sets ───────────────────────────────────────────────────────── */
const fic = (c: string) => ({ width: 26, height: 26, viewBox: '0 0 24 24', fill: 'none' as const, stroke: c, strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const });
function FilterIcon({ name, color }: { name: LibFilter['icon']; color: string }) {
  switch (name) {
    case 'sparkle': return <Svg {...fic(color)}><Path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill={color} /></Svg>;
    case 'mantra': return <Svg {...fic(color)}><Circle cx={12} cy={12} r={8} strokeDasharray="2 3" /><Circle cx={12} cy={4} r={2} fill={color} /></Svg>;
    case 'flame': return <Svg {...fic(color)}><Path d="M12 3c1.6 2.7 4 4.4 4 7.8A4 4 0 0 1 8 11c0-1.6.8-2.8 1.8-3.8.4 1 .9 1.6 2.2 1.2-1.2-1.6-1.1-3.4 0-5.4z" fill={color} fillOpacity={0.15} /></Svg>;
    case 'scroll': return <Svg {...fic(color)}><Path d="M7 4h10v13a3 3 0 0 1-3 3H6a3 3 0 0 0 3-3V6a2 2 0 0 0-2-2z" /><Path d="M10 8h4M10 12h4" /></Svg>;
    case 'stack': return <Svg {...fic(color)}><Path d="M12 3l8 4-8 4-8-4z" /><Path d="M4 12l8 4 8-4M4 17l8 4 8-4" /></Svg>;
    case 'lotus': return <Svg {...fic(color)}><Path d="M12 5c1.3 1.7 2 3.6 2 6 1-1.4 2.3-2.2 4-2.6-.3 2.3-1.6 4.2-3.6 5.2 1.8.5 3.6.2 5.1-.8-.7 3-3.6 5.2-7.5 5.2s-6.8-2.2-7.5-5.2c1.5 1 3.3 1.3 5.1.8C7.6 12.6 6.3 10.7 6 8.4c1.7.4 3 1.2 4 2.6 0-2.4.7-4.3 2-6z" fill={color} fillOpacity={0.15} /></Svg>;
    case 'music': return <Svg {...fic(color)}><Path d="M9 18V5l12-2v13" /><Circle cx={6} cy={18} r={3} /><Circle cx={18} cy={16} r={3} /></Svg>;
    case 'bookmark': return <Svg {...fic(color)}><Path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></Svg>;
    default: return null;
  }
}

const gl = (c: string) => ({ width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none' as const, stroke: c, strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const });
function ItemGlyph({ name, color }: { name?: LibraryItem['glyph']; color: string }) {
  switch (name) {
    case 'sun': return <Svg {...gl(color)}><Circle cx={12} cy={12} r={8} /><Path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></Svg>;
    case 'target': return <Svg {...gl(color)}><Circle cx={12} cy={12} r={8} /><Circle cx={12} cy={12} r={4} /></Svg>;
    case 'star': return <Svg {...gl(color)}><Path d="M12 2l3 9h9l-7 5 3 9-8-6-8 6 3-9-7-5h9z" /></Svg>;
    case 'bells': return <Svg {...gl(color)}><Path d="M5 8h14M7 8v9a5 5 0 0 0 10 0V8M9 5h6" /><Circle cx={12} cy={20} r={2} fill={color} /></Svg>;
    case 'flute': return <Svg {...gl(color)}><Path d="M4 17L17 4l3 3L7 20H4zM14 7l3 3" /></Svg>;
    case 'rain': return <Svg {...gl(color)}><Path d="M8 19v2M12 19v2M16 19v2M7 16a4 4 0 1 1 .8-7.9A5 5 0 0 1 17.7 10 3 3 0 0 1 17 16z" /></Svg>;
    case 'mix': return <Svg {...gl(color)}><Path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" /></Svg>;
    case 'om': return <Svg {...gl(color)}><Circle cx={12} cy={12} r={9} strokeDasharray="2 3" /></Svg>;
    default: return null;
  }
}

const Waveform = ({ color }: { color: string }) => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill={color}><Rect x={4} y={10} width={3} height={10} rx={1} /><Rect x={10.5} y={4} width={3} height={16} rx={1} /><Rect x={17} y={14} width={3} height={6} rx={1} /></Svg>
);

/* Bookmark toggle — filled gold when saved. Memoized; its own Pressable so it
   captures the tap and never triggers the parent card's onPress. */
const BookmarkBtn = React.memo(function BookmarkBtn({ active, onPress, theme }: { active: boolean; onPress: () => void; theme: Theme }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [
        styles.saveBtn,
        {
          borderColor: active ? theme.gold1 : theme.cardBorder,
          backgroundColor: active ? 'rgba(233,184,80,0.2)' : (theme.isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.9)'),
        },
        pressed && { transform: [{ scale: 0.85 }] },
      ]}
    >
      <Svg width={14} height={14} viewBox="0 0 24 24" fill={active ? theme.gold1 : 'none'} stroke={active ? theme.gold1 : theme.gold2} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </Svg>
    </Pressable>
  );
});

function BookMark() {
  return (
    <Svg width={132} height={84} viewBox="0 0 160 110" fill="none">
      <Defs>
        <SvgGrad id="libGold" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#fce8a8" /><Stop offset="0.6" stopColor="#e9b850" /><Stop offset="1" stopColor="#a17613" />
        </SvgGrad>
      </Defs>
      <Path d="M80 84c-19-18-40-19-66-13V22c27-7 49 1 66 18v44Z" fill="rgba(238,203,122,0.1)" stroke="url(#libGold)" strokeWidth={2} />
      <Path d="M80 84c19-18 40-19 66-13V22c-27-7-49 1-66 18v44Z" fill="rgba(238,203,122,0.1)" stroke="url(#libGold)" strokeWidth={2} />
      <Path d="M80 40v50M31 36c15-1 28 3 39 11M31 50c15-1 28 3 39 11M129 36c-15-1-28 3-39 11M129 50c-15-1-28 3-39 11" stroke="url(#libGold)" strokeWidth={1.5} opacity={0.7} />
    </Svg>
  );
}

const GitaCover = React.memo(function GitaCover({ theme }: { theme: Theme }) {
  return (
    <LinearGradient colors={['#2a2f6b', '#161a44', '#0a0c24']} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.boostCover}>
      <View style={[styles.boostFrame, { borderColor: 'rgba(238,203,122,0.55)' }]}>
        <Text style={styles.bcOm}>ॐ</Text>
        <Text style={styles.bcHi}>श्रीमद्{'\n'}भगवद् गीता</Text>
        <Svg width={40} height={40} viewBox="0 0 48 48" fill="none">
          <Circle cx={24} cy={24} r={13} stroke="rgba(238,203,122,0.92)" strokeWidth={1.3} />
          <Circle cx={24} cy={24} r={4} fill="rgba(238,203,122,0.92)" />
          <G stroke="rgba(238,203,122,0.92)" strokeWidth={1.1}>
            <Line x1={24} y1={6} x2={24} y2={42} /><Line x1={6} y1={24} x2={42} y2={24} />
            <Line x1={11} y1={11} x2={37} y2={37} /><Line x1={37} y1={11} x2={11} y2={37} />
          </G>
        </Svg>
        <Text style={styles.bcEn}>BHAGAVAD GITA</Text>
      </View>
    </LinearGradient>
  );
});

function LibCard({ children, theme }: { children: React.ReactNode; theme: Theme }) {
  return (
    <LinearGradient
      colors={theme.isDark ? ['#000000', '#000000'] : ['#ffffff', '#fffdf7']}
      start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
      style={[styles.secCard, { borderColor: theme.isDark ? 'rgba(214,176,92,0.18)' : 'rgba(176,115,22,0.18)' }]}
    >
      {children}
    </LinearGradient>
  );
}

function SectionHead({ label, theme, count }: { label: string; theme: Theme; count?: number }) {
  const dim = theme.isDark ? '#b89a5b' : theme.textMuted;
  return (
    <View style={styles.secHead}>
      <Text style={[styles.secLabel, { color: dim }]}>{label}</Text>
      {typeof count === 'number' && count > 0 && (
        <View style={[styles.countChip, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.10)' : 'rgba(176,115,22,0.08)' }]}>
          <Text style={[styles.countChipText, { color: theme.goldText }]}>{count}</Text>
        </View>
      )}
    </View>
  );
}

/* Defers mounting of below-the-fold sections so the first paint is instant.
   Children stay unmounted until `delay` ms after this component appears. */
function Deferred({ delay = 60, children }: { delay?: number; children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  if (!ready) return null;
  return <>{children}</>;
}

/* Category chip — gold gradient when active (theme-coherent, no purple),
   with a spring press animation. Memoized so the row re-renders cheaply. */
const FilterChip = React.memo(function FilterChip({ active, label, icon, theme, onPress }: {
  active: boolean; label: string; icon: LibFilter['icon']; theme: Theme; onPress: () => void;
}) {
  const sc = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(sc, { toValue: 0.92, speed: 40, bounciness: 5, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(sc, { toValue: 1, speed: 22, bounciness: 9, useNativeDriver: true }).start();
  const ink = active ? theme.goldInk : theme.goldText;
  return (
    <Animated.View
      style={[
        { transform: [{ scale: sc }], borderRadius: 14 },
        active && {
          backgroundColor: theme.gold1,
          shadowColor: theme.gold1, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6,
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={[
          styles.catCard,
          {
            borderColor: active ? theme.gold1 : (theme.isDark ? 'rgba(220,180,80,0.18)' : 'rgba(176,115,22,0.2)'),
            borderWidth: active ? 1.5 : 1,
            backgroundColor: active ? 'transparent' : theme.cardBg,
          },
        ]}
      >
        {active && <LinearGradient colors={theme.buttonGradient} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />}
        <FilterIcon name={icon} color={ink} />
        <Text style={[styles.catLabel, { color: ink }]} numberOfLines={1}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
});

/* The category rail scrolls horizontally, but a first-time user has no way to know that —
   it just looks like a row that happens to end at the screen edge. Three affordances, no
   arrows and no dots:
     1. PEEK      — the rail bleeds past the right edge so a chip is always cut in half.
                    A half-chip reads as "there is more" in a way a full row never does.
     2. EDGE FADE — content dissolves into the page background at whichever edge still has
                    more to scroll (right fade drops to 0 once you reach the end, left fade
                    appears once you leave the start), so the cut never looks like a border.
     3. NUDGE     — on the very first visit the rail slides a little and springs back on its
                    own. Motion is the affordance every user understands. Shown once ever.
   The fades ride on a native-driver Animated.Value, so scrolling stays on the UI thread. */
const RAIL_HINT_KEY = 'sy.lib.railHinted';

function CategoryRail({ theme, children }: { theme: Theme; children: React.ReactNode }) {
  const ref = useRef<any>(null);          // Animated.ScrollView — required for native-driven onScroll
  const x = useRef(new Animated.Value(0)).current;
  const [maxX, setMaxX] = useState(0);   // contentWidth - viewportWidth
  const viewW = useRef(0);

  const measure = (content: number) => setMaxX(Math.max(0, content - viewW.current));

  // First visit ever: slide out and spring back so the rail visibly moves.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (await AsyncStorage.getItem(RAIL_HINT_KEY)) return;      // already hinted once
      await new Promise((r) => setTimeout(r, 900));                // let the screen settle
      if (cancelled || !ref.current) return;
      ref.current.scrollTo({ x: 64, animated: true });
      setTimeout(() => ref.current?.scrollTo({ x: 0, animated: true }), 620);
      AsyncStorage.setItem(RAIL_HINT_KEY, '1').catch(() => {});
    })();
    return () => { cancelled = true; };
  }, []);

  const fade = (side: 'left' | 'right') => {
    // Right fade is on until you reach the end; left fade turns on once you scroll away.
    const opacity = maxX <= 0 ? 0 : side === 'right'
      ? x.interpolate({ inputRange: [Math.max(0, maxX - 40), maxX], outputRange: [1, 0], extrapolate: 'clamp' })
      : x.interpolate({ inputRange: [0, 28], outputRange: [0, 1], extrapolate: 'clamp' });
    const bg = theme.bgDeep;
    return (
      <Animated.View pointerEvents="none" style={[styles.railFade, side === 'right' ? { right: 0 } : { left: 0 }, { opacity }]}>
        <LinearGradient
          colors={side === 'right' ? ['transparent', bg] : [bg, 'transparent']}
          start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    );
  };

  return (
    <View style={styles.railHost}>
      <Animated.ScrollView
        ref={ref}
        horizontal
        showsHorizontalScrollIndicator={false}
        onLayout={(e) => { viewW.current = e.nativeEvent.layout.width; }}
        onContentSizeChange={measure}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        style={styles.catsScroll}
        contentContainerStyle={styles.catsContent}
      >
        {children}
      </Animated.ScrollView>
      {fade('left')}
      {fade('right')}
    </View>
  );
}

/* One scripture card — memoized so grids don't fully re-render on every
   save/progress tick; spring press scale for a premium feel.

   Card surfaces here use the OPAQUE theme.cardBg, never a translucent rgba black:
   the spring-scale Animated.View promotes the card to a hardware layer, and Android
   composites a translucent layer against white — which turned the cards white in dark mode. */
const BookCard = React.memo(function BookCard({ item, title, subtitle, theme, hi, dim, saved, onOpen, onToggleSave }: {
  item: LibraryItem; title: string; subtitle: string; theme: Theme; hi: boolean; dim: string;
  saved: boolean; onOpen: (bookId: string) => void; onToggleSave: (id: string) => void;
}) {
  const sc = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(sc, { toValue: 0.95, speed: 40, bounciness: 5, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(sc, { toValue: 1, speed: 22, bounciness: 9, useNativeDriver: true }).start();
  const ac = colorFor(theme, item.color);
  return (
    <Animated.View style={[styles.vedaCardWrap, { transform: [{ scale: sc }] }]}>
      {/* key={theme.name}: android_ripple + theme-driven bg needs a native remount on
          theme switch (RN-Android ripple/background repaint bug) */}
      <Pressable
        key={theme.name}
        onPress={() => onOpen(item.bookId!)}
        onPressIn={pressIn}
        onPressOut={pressOut}
        android_ripple={{ color: theme.ripple }}
        style={[styles.vedaCard, { borderColor: theme.cardBorder, backgroundColor: theme.cardBg }]}
      >
        <LinearGradient colors={[ac + 'cc', '#0c0c18']} start={{ x: 0.2, y: 0.1 }} end={{ x: 0.8, y: 1 }} style={styles.vedaCover}>
          {item.coverImage ? (
            <>
              <Image source={{ uri: avatarUrl(item.coverImage) }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={StyleSheet.absoluteFillObject} />
              <Text style={styles.vedaCoverName} numberOfLines={2}>{item.hindi}</Text>
            </>
          ) : (
            <>
              <Text style={styles.vedaCoverOm}>ॐ</Text>
              <Text style={styles.vedaCoverName} numberOfLines={2}>{item.hindi}</Text>
            </>
          )}
        </LinearGradient>
        <Text style={[styles.vedaName, { color: theme.isDark ? '#f0e8d0' : theme.text }]} numberOfLines={2}>{title}</Text>
        <Text style={[styles.vedaSub, { color: dim }]}>{subtitle}</Text>
        <View style={[styles.readPill, { borderColor: theme.isDark ? 'rgba(220,180,80,0.4)' : theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.10)' : '#ffffff' }]}>
          <Text style={[styles.readPillText, { color: theme.goldText }]}>{hi ? 'पढ़ें' : 'READ'}</Text>
          <Chevron color={theme.goldText} size={13} />
        </View>
        <View style={styles.saveBtnAbs} pointerEvents="box-none">
          <BookmarkBtn active={saved} onPress={() => onToggleSave(item.id)} theme={theme} />
        </View>
      </Pressable>
    </Animated.View>
  );
});

/* static gradient palettes (hoisted out of the mantra list render to avoid
   re-allocating the arrays for every item on each re-render) */
const MANTRA_TILE_DARK = ['rgba(230,194,119,0.18)', 'rgba(0,0,0,0.85)'] as const;
const MANTRA_TILE_LIGHT = ['rgba(176,115,22,0.16)', 'rgba(255,250,240,0.9)'] as const;

// Continue-listening seekbar + time labels — isolated so ONLY these tiny pieces re-render
// on playback ticks (usePlayerTime), not the whole heavy Library screen.
function ContinueSeek({ live, onSeek }: { live: boolean; onSeek?: (f: number) => void }) {
  const { position, duration } = usePlayerTime();
  const progress = live && duration > 0 ? position / duration : 0.45;
  return <Seekbar progress={progress} onSeek={live ? onSeek : undefined} showThumb={live} style={{ marginTop: 10 }} />;
}
function ContTime({ live, kind, color, right }: { live: boolean; kind: 'pos' | 'dur'; color: string; right?: boolean }) {
  const { position, duration } = usePlayerTime();
  const txt = live ? fmtTime(kind === 'pos' ? position : duration) : kind === 'pos' ? '12:45' : '28:36';
  return <Text style={[styles.timeText, { color, textAlign: right ? 'right' : 'left' }]}>{txt}</Text>;
}

export function LibraryScreen({ navigation }: any) {
  const { theme } = useTheme();
  const player = usePlayer();
  const { saved, progress } = useLibraryStore();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [query, setQuery] = useState('');
  const [cmsBooks, setCmsBooks] = useState<ContentBook[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [daily, setDaily] = useState<DailyShloka | null>(null);
  const lib = useScreen('library'); // admin-managed content
  const tr = useT();
  const { lang } = useLang();
  const hi = lang === 'hi';

  const cmsLibraryItems = useMemo(() => cmsBooks.map(cmsToLibraryItem), [cmsBooks]);

  const openMenu = () => openAppDrawer();
  const openReader = useCallback((bookId: string) => {
    hTap();
    // Bhagavad Gita / Ramayana → poora dynamic reader (DB se)
    if (bookId === 'gita') return navigation.navigate('Gita');
    if (bookId === 'ramayan') return navigation.navigate('Ramayan');
    if (bookId === 'ramcharitmanas') return navigation.navigate('Ramcharitmanas');
    if (bookId === 'hanuman-chalisa') return navigation.navigate('HanumanChalisa');
    if (bookId === 'aarti-sangrah') return navigation.navigate('AartiSangrah');
    if (bookId === 'mantra-sangrah') return navigation.navigate('MantraSangrah');
    if (bookId === 'stotra-sangrah') return navigation.navigate('StotraSangrah');
    if (bookId === 'rigveda') return navigation.navigate('Rigveda');
    if (bookId === 'yajurveda' || bookId === 'samaveda' || bookId === 'atharvaveda' || bookId === 'upanishads')
      return navigation.navigate('Veda', { veda: bookId });
    if (bookId === 'mahabharat') return navigation.navigate('Veda', { veda: 'mahabharata' });
    // 18 Mahapuranas → same DB-backed VedaScreen flow (chapters → verses + per-verse AI meaning)
    if (bookId.startsWith('puran-')) return navigation.navigate('Veda', { veda: bookId });
    if (isCmsBookId(bookId)) return navigation.navigate('ContentBook', { id: cmsRawId(bookId) });
    navigation.navigate('LibraryReader', { id: bookId });
  }, [navigation]);
  const handleToggleSave = useCallback((id: string) => { hSelect(); toggleSaved(id); }, []);
  const mediaAsTrack = (media: MediaItem): Track => ({
    id: media._id,
    title: media.title,
    sub: media.subtitle || media.artist || media.subCategory || '',
    color: media.category === 'bhajan' ? 'rose' : media.subCategory === 'flute' ? 'green' : 'gold',
    source: avatarUrl(media.audioUrl || '') || media.audioUrl || '',
    loop: false, // commentary/bhajan/track ek baar chale, loop na ho
  });
  // `section` = jis list se item khela gaya — wahi player ki queue banti hai, isi se
  // popup ke next/prev buttons chalte hai (bina queue ke wo kuch nahi karte).
  const openMedia = (media: MediaItem, section?: MediaItem[]) => {
    hTap();
    if (media.sourceType === 'audio' && media.audioUrl) {
      const queue = (section || []).filter((m) => m.sourceType === 'audio' && m.audioUrl).map(mediaAsTrack);
      player.play(mediaAsTrack(media), queue.length > 1 ? queue : undefined);
      return;
    }
    navigation.navigate('MediaPlayer', { media });
  };
  const openItem = (it: LibraryItem) => {
    if (it.bookId) return openReader(it.bookId);
    hTap(); // demo trackId play retired — playable audio sirf admin media se aata hai
  };

  const isCurrent = (id?: string) => !!id && player.track?.id === id;
  const playing = (id?: string) => isCurrent(id) && player.isPlaying;


  const dim = theme.isDark ? '#b89a5b' : theme.textMuted;

  /* localized title/subtitle for a scripture card (shared: grids + search + continue-reading) */
  const bookTitle = (b: LibraryItem) =>
    b.bookId === 'gita' ? tr('gita.title', b.title)
      : b.bookId === 'ramayan' ? tr('ram.title', b.title)
      : b.bookId === 'ramcharitmanas' ? tr('rcm.title', b.title)
      : b.bookId === 'rigveda' ? tr('rig.title', b.title)
      : b.title;
  const bookSub = (b: LibraryItem) =>
    b.bookId === 'gita' ? tr('gita.subtitle', '18 Chapters · 700 Verses')
      : b.bookId === 'ramayan' ? tr('ram.subtitle', 'Sanskrit & English · 7 Kanda')
      : b.bookId === 'ramcharitmanas' ? tr('rcm.subtitle', 'Hindi · 7 Kand · 1074 Verses')
      : b.bookId === 'rigveda' ? tr('rig.subtitle', 'Sanskrit & English · 10 Mandala')
      : (b.subtitle || '');

  /* ── library-wide search (local filter, no debounce needed) ── */
  const qRaw = query.trim();
  const q = qRaw.toLowerCase();
  const searching = q.length >= 2;
  const searchBooks = useMemo<LibraryItem[]>(() => {
    if (!searching) return [];
    const staticHits = SCRIPTURES.filter((b) =>
      b.title.toLowerCase().includes(q)
      || (b.hindi || '').replace(/\n/g, '').includes(qRaw)
      || (b.subtitle || '').toLowerCase().includes(q));
    const cmsHits = cmsLibraryItems.filter((b) =>
      b.title.toLowerCase().includes(q)
      || (b.hindi || '').replace(/\n/g, '').includes(qRaw)
      || (b.subtitle || '').toLowerCase().includes(q));
    return [...staticHits, ...cmsHits];
  }, [searching, q, qRaw, cmsLibraryItems]);
  const searchMedia = useMemo<MediaItem[]>(() => {
    if (!searching) return [];
    return mediaItems.filter((m) =>
      (m.title || '').toLowerCase().includes(q)
      || (m.subtitle || '').toLowerCase().includes(q)
      || (m.artist || '').toLowerCase().includes(q));
  }, [searching, q, mediaItems]);

  /* ── continue reading — deepest in-progress book (progress map has no timestamps) ── */
  const contRead = useMemo(() => {
    let best: { book: LibraryItem; chapter: number; percent: number } | null = null;
    const allBooks = [...SCRIPTURES, ...cmsLibraryItems];
    for (const b of allBooks) {
      const p = progress[b.id];
      if (!p || !(p.percent > 0) || p.percent >= 100) continue;
      if (!best || p.percent > best.percent) best = { book: b, chapter: p.chapter, percent: p.percent };
    }
    return best;
  }, [progress, cmsLibraryItems]);

  useEffect(() => {
    let on = true;
    Promise.allSettled([getLibrary(), getMedia(), getDailyShloka()])
      .then(([booksRes, mediaRes, dailyRes]) => {
        if (!on) return;
        if (booksRes.status === 'fulfilled') setCmsBooks(booksRes.value.books || []);
        if (mediaRes.status === 'fulfilled') setMediaItems(mediaRes.value.media || []);
        if (dailyRes.status === 'fulfilled') setDaily(dailyRes.value.shloka);
      })
      .catch(() => {});
    return () => { on = false; };
  }, [lang]);

  // Yatharth Geeta (Gita audio commentary) — apna alag section + playlist (general music se alag)
  const isGitaAudio = (m: MediaItem) => /^yatharth_geeta/.test(m.subCategory || '');
  const gitaAudio = mediaItems.filter(isGitaAudio).sort((a, b) => (a.order || 0) - (b.order || 0));
  const mediaToTrack = (m: MediaItem): Track => ({
    id: m._id, title: m.title, sub: m.subtitle || m.artist || '',
    color: 'gold', source: avatarUrl(m.audioUrl) || m.audioUrl || '', loop: false,
  });
  const gitaQueue = gitaAudio.map(mediaToTrack);
  const playGita = (m: MediaItem) => { hTap(); player.play(mediaToTrack(m), gitaQueue); };

  // CONTINUE LISTENING → REAL Bhagavad Gita Chapter 2 audio (Yatharth Geeta) once loaded;
  // falls back to the static placeholder until the media list arrives.
  const gitaCh2 = gitaAudio.find((m) => /chapter\s*0*2\b/i.test(m.title || ''));
  // demo fallback retired — continue-listening sirf REAL audio par (live ya Gita audio)
  const contTrack: Track | null = gitaCh2 ? mediaToTrack(gitaCh2) : null;
  const playContinue = () => { if (!contTrack) return; hTap(); player.play(contTrack, gitaCh2 ? gitaQueue : undefined); };
  // The Continue card is a LIVE mini-player: reflect whatever is currently loaded in the
  // player (so next/prev update the title, seekbar, time + play/pause icon in real time);
  // fall back to the Gita placeholder when nothing has been played yet.
  const activeTrack = player.track ?? contTrack;  // card tabhi render hota hai jab ye non-null ho
  const liveActive = !!player.track;
  const onContPlay = () => { hTap(); if (liveActive) player.toggle(); else playContinue(); };

  // Ramayan audio (Audioboom playlist) — apni dedicated screen me, Library sections me nahi
  const isRamayanAudio = (m: MediaItem) => m.subCategory === 'ramayan_audio';
  const hide = (m: MediaItem) => isGitaAudio(m) || isRamayanAudio(m);
  const mediaMantras = mediaItems.filter((item) => item.category === 'mantra' && !hide(item));
  const mediaMusic = mediaItems.filter((item) => item.category === 'spiritual_music' && !hide(item));
  const mediaBhajans = mediaItems.filter((item) => item.category === 'bhajan' && !hide(item));
  const mediaAarti = mediaItems.filter((item) => (item.category as string) === 'aarti' && !hide(item));
  const mediaMeditation = mediaItems.filter((item) => (item.category as string) === 'meditation' && !hide(item));

  /* Saved list — static library items (books/mantras/music) + dynamic media
     (mantra/bhajan/audio) resolved by id, into one normalized render shape. */
  interface SavedEntry { id: string; title: string; subtitle: string; glyph?: LibraryItem['glyph']; scripture: boolean; playable: boolean; trackId?: string; open: () => void }
  const savedEntries: SavedEntry[] = saved
    .map((id): SavedEntry | null => {
      const s = itemById(id);
      if (s) return { id, title: s.title, subtitle: s.subtitle || '', glyph: s.glyph, scripture: s.type === 'scripture', playable: !!s.trackId, trackId: s.trackId, open: () => openItem(s) };
      const cms = cmsLibraryItems.find((x) => x.id === id);
      if (cms) return { id, title: cms.title, subtitle: cms.subtitle || '', glyph: cms.glyph, scripture: true, playable: false, open: () => openReader(cms.bookId!) };
      const m = mediaItems.find((x) => x._id === id);
      if (m) return {
        id, title: m.title,
        subtitle: [m.subtitle, m.artist, m.subCategory].filter(Boolean).join(' • '),
        glyph: (m.category === 'bhajan' ? 'star' : m.category === 'spiritual_music' ? 'mix' : 'om') as LibraryItem['glyph'],
        scripture: false, playable: m.sourceType !== 'youtube', open: () => openMedia(m, mediaItems.filter((x) => x.category === m.category)),
      };
      return null; // (purane demo-track saves ab resolve nahi hote)
    })
    .filter(Boolean) as SavedEntry[];

  // staggered entrance — replays when the filter changes so new sections glide in
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    enter.setValue(0);
    Animated.timing(enter, { toValue: 1, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [filter, enter]);
  const rise = (start: number) => ({
    opacity: enter.interpolate({ inputRange: [start, Math.min(1, start + 0.45)], outputRange: [0, 1], extrapolate: 'clamp' }),
    transform: [{ translateY: enter.interpolate({ inputRange: [start, Math.min(1, start + 0.45)], outputRange: [22, 0], extrapolate: 'clamp' }) }],
  });

  // gentle breathing glow on the hero emblem (continuous)
  const heroPulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(heroPulse, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(heroPulse, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ])).start();
  }, [heroPulse]);
  const omScale = heroPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const renderMediaRows = (items: MediaItem[]) => (
      <View style={{ gap: 12 }}>
        {items.map((item) => {
          const glyph = (item.category as string) === 'meditation' ? 'flute' : (item.category as string) === 'aarti' ? 'om' : item.category === 'bhajan' ? 'star' : item.subCategory === 'flute' ? 'flute' : item.subCategory === 'temple_bells' ? 'bells' : item.category === 'mantra' ? 'om' : 'mix';
          const accent = (item.category as string) === 'meditation' ? theme.green : (item.category as string) === 'aarti' ? theme.red : item.category === 'bhajan' ? theme.red : item.subCategory === 'flute' ? theme.green : theme.goldText;
          const sourceLabel = [item.sourceName || (item.sourceType === 'youtube' ? 'YouTube' : item.sourceType === 'audio' ? 'Audio' : item.sourceType === 'video' ? 'Video' : 'External'), item.durationText, item.licenseName].filter(Boolean).join(' - ');
          return (
            <Pressable
              key={item._id}
              onPress={() => openMedia(item, items)}
              style={({ pressed }) => [styles.mantra, pressed && { backgroundColor: theme.isDark ? 'rgba(230,194,119,0.06)' : 'rgba(176,115,22,0.06)' }]}
            >
              <LinearGradient colors={theme.isDark ? MANTRA_TILE_DARK : MANTRA_TILE_LIGHT} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={[styles.mantraImg, { borderColor: theme.cardBorder }]}>
                <ItemGlyph name={glyph as LibraryItem['glyph']} color={accent} />
              </LinearGradient>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.mantraTitle, { color: theme.isDark ? '#fff' : theme.text }]} numberOfLines={1}>{item.title}</Text>
                <Text style={[styles.itemSub, { color: theme.textMuted }]} numberOfLines={1}>
                  {[item.subtitle, item.artist, item.subCategory].filter(Boolean).join(' • ')}
                </Text>
                <View style={styles.countRow}>
                  <Text style={[styles.countText, { color: dim }]} numberOfLines={1}>{sourceLabel}</Text>
                </View>
              </View>
              <BookmarkBtn active={saved.includes(item._id)} onPress={() => { hSelect(); toggleSaved(item._id); }} theme={theme} />
              <View style={[styles.playDot, { borderColor: 'rgba(220,180,80,0.4)', backgroundColor: playing(item._id) ? theme.gold1 : (theme.isDark ? 'rgba(0,0,0,0.3)' : 'rgba(176,115,22,0.06)') }]}>
                {item.sourceType === 'youtube' || item.sourceType === 'video'
                  ? <Chevron color={theme.goldText} size={14} />
                  : isCurrent(item._id) && player.loading
                    ? <ActivityIndicator color={theme.goldText} size="small" />
                    : playing(item._id)
                      ? <PauseIcon color={theme.goldInk} size={14} />
                      : <PlayIcon color={theme.goldText} size={13} />}
              </View>
            </Pressable>
          );
        })}
      </View>
  );

  const renderMediaSection = (label: string, items: MediaItem[]) => (
    <LibCard theme={theme}>
      <SectionHead label={label} theme={theme} count={items.length} />
      {renderMediaRows(items)}
    </LibCard>
  );

  // Grid of memoized BookCards (shared by category sections + search results)
  const renderBookCards = (books: LibraryItem[]) => (
    <View style={styles.vedaGrid}>
      {books.map((b) => (
        <BookCard
          key={b.id}
          item={b}
          title={bookTitle(b)}
          subtitle={bookSub(b)}
          theme={theme}
          hi={hi}
          dim={dim}
          saved={saved.includes(b.id)}
          onOpen={openReader}
          onToggleSave={handleToggleSave}
        />
      ))}
    </View>
  );

  // Book grid for one topic category (Vedas / Puranas / Gita & Epics / etc.)
  const renderBookGrid = (label: string, hint: string, books: LibraryItem[]) => {
    if (!books.length) return null;
    return (
      <LibCard theme={theme}>
        <SectionHead label={label} theme={theme} count={books.length} />
        {!!hint && <Text style={[styles.scriptHint, { color: theme.textMuted }]}>{hint}</Text>}
        {renderBookCards(books)}
      </LibCard>
    );
  };

  return (
    <Screen
      header={<BrandHeader onMenu={openMenu} onBell={() => navigation.navigate('Notifications')} />}
      contentStyle={player.track ? { paddingBottom: 230 } : undefined}
    >
      {/* ── Hero ── */}
      <Animated.View style={[styles.hero, rise(0)]}>
        <Animated.Text style={[styles.omGlyph, { color: theme.gold1, transform: [{ scale: omScale }] }]}>ॐ</Animated.Text>
        <View style={styles.bookWrap}><BookMark /></View>
        <View style={styles.titleRow}>
          <Sparkle color={dim} size={16} />
          <GradientText style={styles.heroTitle}>{lib.t('heading', hi ? 'दिव्य पुस्तकालय' : 'DIVINE LIBRARY')}</GradientText>
          <Sparkle color={dim} size={16} />
        </View>
        <Text style={[styles.heroSub, { color: theme.isDark ? '#d9d9d9' : theme.text }]}>{lib.t('subtitle', hi ? 'मंत्र, शास्त्र व वैदिक ज्ञान' : 'Mantras, Scriptures & Vedic Wisdom')}</Text>
        <View style={styles.dotsRow}>
          {['Listen', 'Read', 'Learn', 'Grow'].map((w, i) => (
            <React.Fragment key={w}>
              {i > 0 && <Text style={[styles.dotSep, { color: dim }]}>•</Text>}
              <Text style={[styles.dotWord, { color: dim }]}>{w}</Text>
            </React.Fragment>
          ))}
        </View>
      </Animated.View>

      {/* ── Library-wide search ── */}
      <Animated.View style={rise(0.05)}>
        <View style={[styles.searchBar, { borderColor: theme.isDark ? 'rgba(220,180,80,0.35)' : theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(12,12,16,0.92)' : '#ffffff' }]}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.goldText} strokeWidth={1.8} strokeLinecap="round">
            <Circle cx={11} cy={11} r={7} /><Line x1={20.5} y1={20.5} x2={16} y2={16} />
          </Svg>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={hi ? 'मंत्र, ग्रंथ, आरती खोजें…' : 'Search mantras, scriptures, aarti…'}
            placeholderTextColor={theme.textMuted}
            style={[styles.searchInput, { color: theme.text }]}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => { hSelect(); setQuery(''); }} hitSlop={10} style={[styles.searchClear, { backgroundColor: theme.isDark ? 'rgba(233,184,80,0.15)' : 'rgba(176,115,22,0.10)' }]}>
              <Svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke={theme.goldText} strokeWidth={2.4} strokeLinecap="round">
                <Line x1={5} y1={5} x2={19} y2={19} /><Line x1={19} y1={5} x2={5} y2={19} />
              </Svg>
            </Pressable>
          )}
        </View>
      </Animated.View>

      {/* ── SEARCH RESULTS — replaces the normal sections while a query is active ── */}
      {searching && (
        <LibCard theme={theme}>
          <SectionHead label={hi ? 'परिणाम' : 'RESULTS'} theme={theme} count={searchBooks.length + searchMedia.length} />
          {searchBooks.length === 0 && searchMedia.length === 0 ? (
            <View style={styles.empty}>
              <View style={[styles.emptyIc, { borderColor: theme.cardBorder }]}>
                <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={theme.gold2} strokeWidth={1.6} strokeLinecap="round">
                  <Circle cx={11} cy={11} r={7} /><Line x1={20.5} y1={20.5} x2={16} y2={16} />
                </Svg>
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>{hi ? 'कुछ नहीं मिला' : 'Nothing found'}</Text>
              <Text style={[styles.emptySub, { color: theme.textMuted }]}>{hi ? 'कोई और शब्द आज़माएँ — जैसे "गीता", "हनुमान" या "आरती"।' : 'Try another word — like "Gita", "Hanuman" or "aarti".'}</Text>
            </View>
          ) : (
            <View style={{ gap: 16 }}>
              {searchBooks.length > 0 && renderBookCards(searchBooks)}
              {searchMedia.length > 0 && renderMediaRows(searchMedia)}
            </View>
          )}
        </LibCard>
      )}

      {/* ── Filter chips (topic categories — gold active state) ── */}
      {!searching && (
      <Animated.View style={rise(0.08)}>
      <CategoryRail theme={theme}>
        {LIB_FILTERS.map((c) => (
          <FilterChip
            key={c.key}
            active={c.key === filter}
            label={tr(`lib.filter.${c.key}`, c.label)}
            icon={c.icon}
            theme={theme}
            onPress={() => { hSelect(); setFilter(c.key); }}
          />
        ))}
      </CategoryRail>
      </Animated.View>
      )}

      {/* ── 🌸 Shubh Avsar — occasion slider (below the filter slider; the highlight) ── */}
      {!searching && filter === 'all' && (
        <Animated.View style={rise(0.12)}>
          <ShubhAvsar onOpen={(id) => navigation.navigate('Occasion', { id })} />
        </Animated.View>
      )}

      {!searching && (
      <Animated.View style={rise(0.16)}>
      {/* ── SAVED (only when the Saved filter is active) ── */}
      {filter === 'saved' && (
        <LibCard theme={theme}>
          <SectionHead label={hi ? 'मेरा पुस्तकालय' : 'MY LIBRARY'} theme={theme} count={savedEntries.length} />
          {savedEntries.length === 0 ? (
            <View style={styles.empty}>
              <View style={[styles.emptyIc, { borderColor: theme.cardBorder }]}>
                <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={theme.gold2} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><Path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></Svg>
              </View>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>{hi ? 'अभी कुछ सहेजा नहीं गया' : 'Nothing saved yet'}</Text>
              <Text style={[styles.emptySub, { color: theme.textMuted }]}>{hi ? 'किसी भी शास्त्र, मंत्र, भजन या ट्रैक पर बुकमार्क दबाएँ ताकि वह यहाँ सुरक्षित रहे।' : 'Tap the bookmark on any scripture, mantra, bhajan or track to keep it here.'}</Text>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {savedEntries.map((it) => (
                <Pressable key={it.id} onPress={it.open} style={({ pressed }) => [styles.mantra, pressed && { backgroundColor: theme.isDark ? 'rgba(230,194,119,0.06)' : 'rgba(176,115,22,0.06)' }]}>
                  <LinearGradient colors={theme.isDark ? ['rgba(230,194,119,0.18)', 'rgba(0,0,0,0.85)'] : ['rgba(176,115,22,0.16)', 'rgba(255,250,240,0.9)']} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={[styles.mantraImg, { borderColor: theme.cardBorder }]}>
                    {it.scripture ? <Text style={{ color: theme.goldText, fontSize: 20, fontFamily: fonts.devanagari }}>ॐ</Text> : <ItemGlyph name={it.glyph} color={theme.goldText} />}
                  </LinearGradient>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.mantraTitle, { color: theme.isDark ? '#fff' : theme.text }]} numberOfLines={1}>{it.title}</Text>
                    {!!it.subtitle && <Text style={[styles.itemSub, { color: theme.textMuted }]} numberOfLines={1}>{it.subtitle}</Text>}
                  </View>
                  <BookmarkBtn active onPress={() => { hSelect(); toggleSaved(it.id); }} theme={theme} />
                  {it.scripture
                    ? <Chevron color={theme.gold2} size={18} />
                    : <View style={[styles.playDot, { borderColor: 'rgba(220,180,80,0.4)', backgroundColor: it.playable && playing(it.trackId) ? theme.gold1 : (theme.isDark ? 'rgba(0,0,0,0.3)' : 'rgba(176,115,22,0.06)') }]}>{it.playable && playing(it.trackId) ? <PauseIcon color={theme.goldInk} size={14} /> : <PlayIcon color={theme.goldText} size={13} />}</View>}
                </Pressable>
              ))}
            </View>
          )}
        </LibCard>
      )}

      {/* ── TODAY'S SPIRITUAL BOOST — daily rotating shloka + AI detail ── */}
      {filter === 'all' && (
        <LibCard theme={theme}>
          <SectionHead label={tr('daily.boostLabel', "TODAY'S SPIRITUAL BOOST")} theme={theme} />
          {daily ? (
            <Pressable
              onPress={() => { hTap(); navigation.navigate('DailyShloka', { shloka: daily }); }}
              style={({ pressed }) => [styles.boostRow, pressed && { opacity: 0.88 }]}
            >
              <LinearGradient colors={[colorFor(theme, daily.cover as TrackColor) + 'cc', '#0c0c18']} start={{ x: 0.2, y: 0.1 }} end={{ x: 0.8, y: 1 }} style={styles.vedaCover}>
                <Text style={styles.vedaCoverOm}>ॐ</Text>
                <Text style={styles.vedaCoverName} numberOfLines={2}>{daily.hindi}</Text>
              </LinearGradient>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.boostTitle, { color: theme.goldText }]}>{tr('daily.todayShloka', "Today's Shloka")}</Text>
                <Text style={[styles.sanskrit, { color: theme.isDark ? '#fff' : theme.text }]} numberOfLines={2}>{daily.sanskrit}</Text>
                <Text style={[styles.ref, { color: dim }]}>– {daily.refLabel}</Text>
                <View style={[styles.readLink, { borderColor: theme.isDark ? 'rgba(220,180,80,0.4)' : theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.1)' : '#ffffff' }]}>
                  <Sparkle color={theme.goldText} size={13} />
                  <Text style={[styles.readLinkText, { color: theme.goldText }]}>{tr('daily.learnMore', 'Learn more')}</Text>
                  <Chevron color={theme.goldText} size={14} />
                </View>
              </View>
            </Pressable>
          ) : (
            <View style={styles.boostRow}>
              <GitaCover theme={theme} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.boostTitle, { color: theme.goldText }]}>{tr('daily.todayShloka', "Today's Shloka")}</Text>
                <Text style={[styles.sanskrit, { color: theme.isDark ? '#fff' : theme.text }]}>कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ।</Text>
                <Text style={[styles.ref, { color: dim }]}>– Bhagavad Gita (2.47)</Text>
              </View>
            </View>
          )}
        </LibCard>
      )}

      {/* ── CONTINUE LISTENING — only when there's REAL audio (playing, or Gita audio loaded); no demo ── */}
      {filter === 'all' && (liveActive || !!gitaCh2) && (
        <LibCard theme={theme}>
          <SectionHead label={hi ? 'सुनना जारी रखें' : 'CONTINUE LISTENING'} theme={theme} />
          <Pressable style={styles.contRow} onPress={() => { if (liveActive) { hTap(); player.openSheet(); } }} disabled={!liveActive}>
            <LinearGradient colors={['#243555', '#080f1e']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={[styles.contCover, { borderColor: theme.cardBorder }]}>
              <Text style={{ color: theme.gold2, fontSize: 26, fontFamily: fonts.devanagari }}>ॐ</Text>
            </LinearGradient>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.contTitle, { color: theme.isDark ? '#fff' : theme.text }]} numberOfLines={1}>{activeTrack?.title}</Text>
              <Text style={[styles.itemSub, { color: theme.textMuted }]} numberOfLines={1}>{activeTrack?.sub}</Text>
            </View>
            {liveActive && <Chevron color={theme.gold2} size={18} />}
          </Pressable>
          <ContinueSeek live={liveActive} onSeek={player.seekFraction} />
          <View style={styles.contFooter}>
            <ContTime live={liveActive} kind="pos" color={theme.textMuted} />
            <View style={styles.transport}>
              <Pressable onPress={() => { hTap(); player.prev(); }} hitSlop={8} style={[styles.tBtn, { borderColor: 'rgba(233,184,80,0.2)', backgroundColor: 'rgba(233,184,80,0.05)' }]}><PrevIcon color={theme.goldText} /></Pressable>
              <Pressable onPress={onContPlay} hitSlop={8}>
                <LinearGradient colors={['#fce8a8', '#b87f1a']} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.tPlay}>
                  {player.loading ? <ActivityIndicator color="#1a0e00" size="small" /> : (liveActive && player.isPlaying) ? <PauseIcon color="#1a0e00" size={18} /> : <PlayIcon color="#1a0e00" size={18} />}
                </LinearGradient>
              </Pressable>
              <Pressable onPress={() => { hTap(); player.next(); }} hitSlop={8} style={[styles.tBtn, { borderColor: 'rgba(233,184,80,0.2)', backgroundColor: 'rgba(233,184,80,0.05)' }]}><NextIcon color={theme.goldText} /></Pressable>
            </View>
            <ContTime live={liveActive} kind="dur" color={theme.textMuted} right />
          </View>
        </LibCard>
      )}

      {/* ── CONTINUE READING — deepest in-progress book (only when real progress exists) ── */}
      {filter === 'all' && contRead && (
        <LibCard theme={theme}>
          <SectionHead label={hi ? 'पढ़ना जारी रखें' : 'CONTINUE READING'} theme={theme} />
          <Pressable onPress={() => openReader(contRead.book.bookId!)} style={({ pressed }) => [styles.crRow, pressed && { opacity: 0.88 }]}>
            <LinearGradient colors={[colorFor(theme, contRead.book.color) + 'cc', '#0c0c18']} start={{ x: 0.2, y: 0.1 }} end={{ x: 0.8, y: 1 }} style={styles.crCover}>
              <Text style={styles.crCoverOm}>ॐ</Text>
              <Text style={styles.crCoverName} numberOfLines={2}>{contRead.book.hindi}</Text>
            </LinearGradient>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.mantraTitle, { color: theme.isDark ? '#fff' : theme.text }]} numberOfLines={1}>{bookTitle(contRead.book)}</Text>
              <View style={[styles.crTrack, { backgroundColor: theme.isDark ? 'rgba(233,184,80,0.14)' : 'rgba(176,115,22,0.12)' }]}>
                <LinearGradient
                  colors={theme.buttonGradient}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[styles.crFill, { width: `${Math.min(100, Math.max(2, contRead.percent))}%` as `${number}%` }]}
                />
              </View>
              <Text style={[styles.crPct, { color: dim }]}>{contRead.percent}% {hi ? 'पूर्ण' : 'complete'}</Text>
            </View>
            <View style={[styles.readPill, { marginTop: 0, borderColor: theme.isDark ? 'rgba(220,180,80,0.4)' : theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(233,184,80,0.10)' : '#ffffff' }]}>
              <Text style={[styles.readPillText, { color: theme.goldText }]}>
                {hi ? `पढ़ें · अध्याय ${contRead.chapter + 1}` : `READ · CH ${contRead.chapter + 1}`}
              </Text>
              <Chevron color={theme.goldText} size={13} />
            </View>
          </Pressable>
        </LibCard>
      )}

      {/* ── MANTRAS & CHANTS — CMS audio + mantra/stotra/chalisa books ── */}
      {(filter === 'all' || filter === 'mantra') && mediaMantras.length > 0 && <Deferred delay={50}>{renderMediaSection(tr('lib.sec.mantra', 'MANTRAS & CHANTS'), mediaMantras)}</Deferred>}
      {(filter === 'all' || filter === 'mantra') && <Deferred delay={100}>{renderBookGrid(tr('lib.sec.mantra', 'MANTRAS & CHANTS'), hi ? 'मंत्र, जाप, स्तोत्र व चालीसा — पढ़ें व जपें।' : 'Mantras, jaap, stotra & chalisa — read & chant.', booksByCat('mantra'))}</Deferred>}

      {/* ── AARTI & DEVOTION — aarti book + CMS aarti/bhajan audio ── */}
      {(filter === 'all' || filter === 'aarti') && <Deferred delay={150}>{renderBookGrid(tr('lib.sec.aarti', 'AARTI & DEVOTION'), hi ? 'सभी देवी-देवताओं की पूर्ण आरती।' : 'Full aarti of every deity.', booksByCat('aarti'))}</Deferred>}
      {(filter === 'all' || filter === 'aarti') && mediaAarti.length > 0 && <Deferred delay={200}>{renderMediaSection(tr('lib.dynamicAarti', 'AARTI'), mediaAarti)}</Deferred>}
      {(filter === 'all' || filter === 'aarti') && mediaBhajans.length > 0 && <Deferred delay={250}>{renderMediaSection(tr('lib.dynamicBhajans', 'BHAJANS'), mediaBhajans)}</Deferred>}
      {(filter === 'all' || filter === 'meditation') && mediaMeditation.length > 0 && <Deferred delay={280}>{renderMediaSection(tr('lib.dynamicMeditation', hi ? 'ध्यान संगीत' : 'MEDITATION MUSIC'), mediaMeditation)}</Deferred>}

      {/* ── THE VEDAS ── */}
      {(filter === 'all' || filter === 'veda') && <Deferred delay={300}>{renderBookGrid(tr('lib.sec.veda', 'THE VEDAS'), hi ? 'ऋग्, यजुर्, साम, अथर्व व उपनिषद्।' : 'Rig, Yajur, Sama, Atharva & Upanishads.', booksByCat('veda'))}</Deferred>}

      {/* ── 18 MAHAPURANAS ── */}
      {(filter === 'all' || filter === 'purana') && <Deferred delay={350}>{renderBookGrid(tr('lib.sec.purana', '18 MAHAPURANAS'), hi ? 'सभी 18 महापुराण — मंगलाचरण, खंड-सार व मंत्र।' : 'All 18 Mahapuranas — invocation, section summaries & mantras.', booksByCat('purana'))}</Deferred>}

      {/* ── GITA, RAMAYANA & EPICS ── */}
      {(filter === 'all' || filter === 'gita') && <Deferred delay={400}>{renderBookGrid(tr('lib.sec.gita', 'GITA, RAMAYANA & EPICS'), hi ? 'श्रीमद्भगवद्गीता, रामायण, रामचरितमानस व महाभारत।' : 'Bhagavad Gita, Ramayana, Ramcharitmanas & Mahabharata.', booksByCat('gita'))}</Deferred>}

      {filter === 'all' && cmsLibraryItems.length > 0 && (
        <Deferred delay={450}>
          {renderBookGrid(
            tr('lib.sec.books', 'BOOKS & LEARNING'),
            hi ? 'एडमिन द्वारा प्रकाशित पुस्तकें — तुरंत ऐप में उपलब्ध।' : 'Admin-published books — available instantly in the app.',
            cmsLibraryItems,
          )}
        </Deferred>
      )}

      {/* ── BHAGAVAD GITA AUDIO — Yatharth Geeta playlist. It's AUDIO → lives in Music (NOT
            Scriptures, which is books-only). Also on All. ── */}
      {(filter === 'all' || filter === 'gita' || filter === 'music') && gitaAudio.length > 0 && (
        <Deferred delay={450}>
        <LibCard theme={theme}>
          <SectionHead label={tr('lib.gitaAudio', 'BHAGAVAD GITA AUDIO')} theme={theme} count={gitaAudio.length} />
          <Text style={[styles.scriptHint, { color: theme.textMuted }]}>{tr('lib.gitaAudioHint', 'Yatharth Geeta · Swami Adgadanand · Hindi — tap to listen, auto-plays next.')}</Text>
          <View style={{ gap: 12 }}>
            {gitaAudio.map((m) => (
              <Pressable
                key={m._id}
                onPress={() => playGita(m)}
                style={({ pressed }) => [styles.mantra, (isCurrent(m._id) || pressed) && { backgroundColor: theme.isDark ? 'rgba(230,194,119,0.06)' : 'rgba(176,115,22,0.06)' }]}
              >
                <LinearGradient colors={theme.isDark ? MANTRA_TILE_DARK : MANTRA_TILE_LIGHT} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={[styles.mantraImg, { borderColor: theme.cardBorder }]}>
                  <Text style={{ color: theme.goldText, fontSize: 18, fontFamily: fonts.devanagari }}>ॐ</Text>
                </LinearGradient>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.mantraTitle, { color: theme.isDark ? '#fff' : theme.text }]} numberOfLines={1}>{m.title}</Text>
                  <View style={styles.countRow}>
                    <Text style={[styles.countText, { color: theme.textMuted }]} numberOfLines={1}>
                      {[m.artist, m.durationText].filter(Boolean).join(' • ')}
                    </Text>
                  </View>
                </View>
                <BookmarkBtn active={saved.includes(m._id)} onPress={() => { hSelect(); toggleSaved(m._id); }} theme={theme} />
                <View style={[styles.playDot, { borderColor: 'rgba(220,180,80,0.4)', backgroundColor: playing(m._id) ? theme.gold1 : (theme.isDark ? 'rgba(0,0,0,0.3)' : 'rgba(176,115,22,0.06)') }]}>
                  {isCurrent(m._id) && player.loading
                    ? <ActivityIndicator color={theme.goldText} size="small" />
                    : playing(m._id)
                      ? <PauseIcon color={theme.goldInk} size={14} />
                      : <PlayIcon color={theme.goldText} size={13} />}
                </View>
              </Pressable>
            ))}
          </View>
          {!!gitaAudio[0] && (gitaAudio[0].attribution || gitaAudio[0].licenseName) ? (
            <Text style={[styles.rightsNote, { color: dim }]}>
              {[gitaAudio[0].attribution, gitaAudio[0].licenseName].filter(Boolean).join(' · ')}
            </Text>
          ) : null}
        </LibCard>
        </Deferred>
      )}


      {/* ── SPIRITUAL MUSIC — real admin-published audio only (demo drones removed) ── */}
      {(filter === 'all' || filter === 'music') && mediaMusic.length > 0 && <Deferred delay={550}>{renderMediaSection(tr('lib.dynamicMusic', 'SPIRITUAL MUSIC'), mediaMusic)}</Deferred>}
      {filter === 'music' && mediaMusic.length === 0 && gitaAudio.length === 0 && mediaBhajans.length === 0 && (
        <LibCard theme={theme}>
          <View style={styles.empty}>
            <View style={[styles.emptyIc, { borderColor: theme.cardBorder }]}>
              <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={theme.gold2} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><Path d="M9 18V5l12-2v13" /><Circle cx={6} cy={18} r={3} /><Circle cx={18} cy={16} r={3} /></Svg>
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>{hi ? 'संगीत जल्द आ रहा है' : 'Music coming soon'}</Text>
            <Text style={[styles.emptySub, { color: theme.textMuted }]}>{hi ? 'भजन, मंत्र व आध्यात्मिक संगीत जल्द ही यहाँ जोड़े जाएँगे।' : 'Bhajans, mantras & spiritual music will be added here soon.'}</Text>
          </View>
        </LibCard>
      )}
      </Animated.View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', marginTop: 16, marginBottom: 22 },
  omGlyph: { fontFamily: fonts.devanagari, fontSize: 34, lineHeight: 38, marginBottom: -14 },
  bookWrap: { },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  heroTitle: { fontFamily: fonts.cinzel, fontSize: 23, letterSpacing: 2.2, fontWeight: '700', lineHeight: 27 },
  heroSub: { fontFamily: fonts.inter, fontSize: 13.5, marginTop: 7, textAlign: 'center' },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 9 },
  dotWord: { fontFamily: fonts.inter, fontSize: 12 },
  dotSep: { fontSize: 7 },

  // The host bleeds to the screen edges so the fades sit on the true edge, not inside the gutter.
  railHost: { marginHorizontal: -18, marginBottom: 20 },
  catsScroll: {},
  // paddingRight < paddingLeft so the rail runs past the edge and a chip is always
  // caught mid-way — the "peek" that tells you the row keeps going.
  catsContent: { gap: 12, paddingLeft: 18, paddingRight: 40, paddingVertical: 4 },
  railFade: { position: 'absolute', top: 0, bottom: 0, width: 34 },
  catCard: { width: 78, height: 86, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 6, overflow: 'hidden' },
  catLabel: { fontFamily: fonts.interSemi, fontSize: 9, letterSpacing: 0.4, textAlign: 'center', lineHeight: 12, textTransform: 'uppercase' },

  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, height: 48, marginBottom: 16 },
  searchInput: { flex: 1, fontFamily: fonts.inter, fontSize: 13.5, paddingVertical: 0, height: '100%' },
  searchClear: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },

  countChip: { minWidth: 24, height: 20, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7 },
  countChipText: { fontFamily: fonts.interSemi, fontSize: 10, letterSpacing: 0.2 },

  crRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  crCover: { width: 46, height: 62, borderRadius: 6, alignItems: 'center', justifyContent: 'center', gap: 2, paddingHorizontal: 3, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  crCoverOm: { color: '#fff7d6', fontSize: 12, fontFamily: fonts.devanagari, lineHeight: 15 },
  crCoverName: { color: '#fff7d6', fontSize: 7.5, fontFamily: fonts.devanagari, lineHeight: 10, textAlign: 'center' },
  crTrack: { height: 4, borderRadius: 2, overflow: 'hidden', marginTop: 9, alignSelf: 'stretch' },
  crFill: { height: '100%', borderRadius: 2 },
  crPct: { fontFamily: fonts.interSemi, fontSize: 10, marginTop: 5 },

  secCard: { borderRadius: 18, borderWidth: 1, padding: 18, marginBottom: 20, overflow: 'hidden' },
  secHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  secLabel: { fontFamily: fonts.interSemi, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase' },

  empty: { alignItems: 'center', paddingVertical: 18, gap: 10 },
  emptyIc: { width: 54, height: 54, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontFamily: fonts.interSemi, fontSize: 14.5 },
  emptySub: { fontFamily: fonts.inter, fontSize: 12, lineHeight: 18, textAlign: 'center', paddingHorizontal: 20 },

  boostRow: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  boostCover: { width: 104, height: 146, borderRadius: 5, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(220,180,80,0.4)', alignSelf: 'flex-start' },
  boostFrame: { flex: 1, margin: 8, marginLeft: 12, borderWidth: 1, borderRadius: 4, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 6 },
  bcOm: { fontFamily: fonts.devanagari, fontSize: 20, color: '#fff7d6', lineHeight: 22 },
  bcHi: { fontFamily: fonts.devanagari, fontSize: 11, fontWeight: '600', color: '#e6c277', textAlign: 'center', lineHeight: 14 },
  bcEn: { fontFamily: fonts.cinzel, fontSize: 7.5, letterSpacing: 1.2, color: 'rgba(238,203,122,0.78)' },
  boostTitle: { fontFamily: fonts.playfairBold, fontSize: 14, marginBottom: 8 },
  sanskrit: { fontFamily: fonts.devanagari, fontSize: 15, lineHeight: 22, marginBottom: 6 },
  english: { fontFamily: fonts.inter, fontSize: 11, lineHeight: 16, marginBottom: 8 },
  ref: { fontFamily: fonts.interSemi, fontSize: 10, marginBottom: 12 },
  readLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 6, paddingVertical: 8, paddingHorizontal: 12 },
  readLinkText: { fontFamily: fonts.interMed, fontSize: 12 },

  contRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  contCover: { width: 60, height: 60, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  contTitle: { fontFamily: fonts.interSemi, fontSize: 13 },
  itemSub: { fontFamily: fonts.inter, fontSize: 11, marginTop: 3 },
  contFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  timeText: { fontFamily: fonts.inter, fontSize: 10, minWidth: 42 },
  transport: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  tBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  tPlay: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

  mantra: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 8, marginHorizontal: -8, borderRadius: 12 },
  mantraImg: { width: 48, height: 48, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  mantraTitle: { fontFamily: fonts.interSemi, fontSize: 13.5 },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  countText: { flexShrink: 1, fontFamily: fonts.inter, fontSize: 11 },
  playDot: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  musicHint: { fontFamily: fonts.inter, fontSize: 11, marginTop: 4 },
  musicItem: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, borderRadius: 12, borderWidth: 1 },
  musicIc: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  musicTitle: { fontFamily: fonts.interBold, fontSize: 13, letterSpacing: 0.5, textTransform: 'uppercase' },

  vedaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  vedaCardWrap: { width: '47%', flexGrow: 1 },
  vedaCard: { width: '100%', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1 },
  vedaCover: { width: 68, height: 92, borderRadius: 8, alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  vedaCoverOm: { color: '#fff7d6', fontSize: 18, fontFamily: fonts.devanagari, lineHeight: 22 },
  vedaCoverName: { color: '#fff7d6', fontSize: 10.5, fontFamily: fonts.devanagari, lineHeight: 14, textAlign: 'center' },
  vedaPlay: { position: 'absolute', bottom: -6, right: -6 },
  vedaPlayInner: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  vedaName: { fontFamily: fonts.interSemi, fontSize: 14, marginTop: 12, textAlign: 'center', alignSelf: 'stretch' },
  vedaSub: { fontFamily: fonts.inter, fontSize: 10.5, letterSpacing: 0.2, marginTop: 2, textAlign: 'center', alignSelf: 'stretch', lineHeight: 15 },
  scriptHint: { fontFamily: fonts.inter, fontSize: 11.5, lineHeight: 16, marginBottom: 12, marginTop: -4 },
  rightsNote: { fontFamily: fonts.inter, fontSize: 10.5, lineHeight: 15, marginTop: 12, fontStyle: 'italic' },
  readPill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, marginTop: 10 },
  readPillText: { fontFamily: fonts.interSemi, fontSize: 10.5, letterSpacing: 1 },
  saveBtnAbs: { position: 'absolute', top: 8, right: 8 },
  saveBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
