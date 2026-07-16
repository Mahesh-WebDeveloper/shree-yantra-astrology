import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Dimensions, Easing, Modal, Pressable, ScrollView,
  SectionList, StyleSheet, Text, TextInput, View,
} from 'react-native';
import Svg, { Circle, Line, Path, Polyline } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { Theme, fonts } from '../theme/tokens';
import { ChatTurnDto, clearChatHistory, getChatHistory } from '../lib/api';
import { rankObservances } from '../lib/fuzzyMatch';
import { useLang } from '../i18n/LanguageProvider';
import { useDialog } from './DialogProvider';
import { hSelect, hTap } from '../lib/haptics';
import { AnswerView } from './AnswerView';
import { PressableScale } from './PressableScale';

/**
 * ChatGPT-style history browser for the "Ask the Astrologer" chat.
 *
 * Full-screen modal: search bar (250ms debounce, server `q` regex first, then a
 * client-side fuzzy re-rank via the same bilingual scorer the festival search
 * uses — so "shani sade sati", "शनि" and "kundli"→कुंडली all land), date-grouped
 * rows (आज / कल / पिछले 7 दिन / …), `before`-cursor pagination, a slide-in detail
 * view that renders the stored answer with the chat screen's own AnswerView,
 * and an "Ask again" button that prefills the chat input.
 */

/* ── icons ── */

/** clock-with-back-arrow "history" glyph — the header affordance on the chat screen */
export function HistoryIcon({ color, size = 19 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 3v6h6" />
      <Path d="M3.51 13a9 9 0 1 0 2.13-9.36L3 6" />
      <Path d="M12 8v5l3.5 2" />
    </Svg>
  );
}

function ChatGlyph({ color, size = 19 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </Svg>
  );
}

function SearchIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round">
      <Circle cx={11} cy={11} r={7} /><Line x1={20.5} y1={20.5} x2={16} y2={16} />
    </Svg>
  );
}

function CloseIcon({ color, size = 15, strokeWidth = 2 }: { color: string; size?: number; strokeWidth?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round">
      <Line x1={5} y1={5} x2={19} y2={19} /><Line x1={19} y1={5} x2={5} y2={19} />
    </Svg>
  );
}

function TrashIcon({ color }: { color: string }) {
  return (
    <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Polyline points="3 6 5 6 21 6" />
      <Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <Line x1={10} y1={11} x2={10} y2={17} /><Line x1={14} y1={11} x2={14} y2={17} />
    </Svg>
  );
}

function BackIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M19 12H5M12 19l-7-7 7-7" />
    </Svg>
  );
}

function ChevronIcon({ color }: { color: string }) {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 18l6-6-6-6" />
    </Svg>
  );
}

/* ── formatting helpers ── */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "10:42 AM · 14 Jul" — always English numerals (Date getters return plain numbers). */
function fmtTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  let h = d.getHours();
  const am = h < 12 ? 'AM' : 'PM';
  h = h % 12 || 12;
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${mm} ${am} · ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** ChatGPT-style date bucket for a row. */
function groupLabel(iso: string, hi: boolean, now: Date): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return hi ? 'पुराने' : 'Older';
  const dayStart = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.floor((dayStart(now) - dayStart(d)) / 86400000);
  if (days <= 0) return hi ? 'आज' : 'Today';
  if (days === 1) return hi ? 'कल' : 'Yesterday';
  if (days < 7) return hi ? 'पिछले 7 दिन' : 'Previous 7 Days';
  if (days < 30) return hi ? 'पिछले 30 दिन' : 'Previous 30 Days';
  return hi ? 'पुराने' : 'Older';
}

/** 2-line preview: when the query appears verbatim, window around the first hit and paint it gold. */
function Snippet({ text, q, gold, style, lines = 2 }: { text: string; q: string; gold: string; style: any; lines?: number }) {
  const idx = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (idx < 0) return <Text numberOfLines={lines} style={style}>{text}</Text>;
  const start = Math.max(0, idx - 36);
  const pre = (start > 0 ? '…' : '') + text.slice(start, idx);
  const hit = text.slice(idx, idx + q.length);
  const post = text.slice(idx + q.length, idx + q.length + 180);
  return (
    <Text numberOfLines={lines} style={style}>
      {pre}<Text style={{ color: gold, fontFamily: fonts.interBold }}>{hit}</Text>{post}
    </Text>
  );
}

/* ── one history row (memoized — the list can grow into hundreds of turns) ── */

const HistoryRow = memo(function HistoryRow({ turn, q, theme, onOpen }: {
  turn: ChatTurnDto; q: string; theme: Theme; onOpen: (t: ChatTurnDto) => void;
}) {
  const answer = String(turn.response?.answer || '');
  const gold = theme.isDark ? theme.gold1 : theme.gold3;
  return (
    <PressableScale
      onPress={() => onOpen(turn)}
      scaleTo={0.975}
      haptic="select"
      ripple={theme.ripple}
      // opaque surface: this sits inside PressableScale's transform-animated view (Android composite)
      style={[styles.row, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? '#070707' : '#ffffff' }]}
    >
      <View style={[styles.medallion, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? '#0e0a04' : '#f8fafc' }]}>
        <ChatGlyph color={gold} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Snippet text={turn.question} q={q} gold={gold} style={[styles.rowQ, { color: theme.text }]} />
        {!!answer && <Snippet text={answer} q={q} gold={gold} style={[styles.rowA, { color: theme.textMuted }]} />}
        <Text style={[styles.rowTime, { color: theme.textMuted }]}>{fmtTime(turn.createdAt)}</Text>
      </View>
      <View style={{ alignSelf: 'center' }}><ChevronIcon color={theme.textMuted} /></View>
    </PressableScale>
  );
});

/* ── the modal ── */

interface Props {
  visible: boolean;
  onClose: () => void;
  /** close the modal and prefill the chat input with this question */
  onAskAgain: (question: string) => void;
  /** parent hook so the live chat list empties too after "clear history" */
  onCleared?: () => void;
}

export function ChatHistoryModal({ visible, onClose, onAskAgain, onCleared }: Props) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const hi = lang === 'hi';
  const insets = useSafeAreaInsets();
  const dialog = useDialog();

  // base history (no filter) — `before` cursor pages
  const [rows, setRows] = useState<ChatTurnDto[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // search — server-first (`q` regex), then fuzzy re-rank client-side
  const [query, setQuery] = useState('');
  const [q, setQ] = useState(''); // 250ms-debounced
  const [serverRows, setServerRows] = useState<ChatTurnDto[]>([]);
  const [serverHasMore, setServerHasMore] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // detail view (slides in over the list, same modal)
  const [detail, setDetail] = useState<ChatTurnDto | null>(null);
  const slide = useRef(new Animated.Value(0)).current;

  /* fresh first page every time the modal opens; full reset on close */
  useEffect(() => {
    if (!visible) {
      setDetail(null); setQuery(''); setQ('');
      setServerRows([]); setServerHasMore(false);
      return;
    }
    let on = true;
    setLoading(true);
    getChatHistory()
      .then((r) => { if (!on) return; setRows(r.turns); setHasMore(r.hasMore); })
      .catch(() => { /* offline → whatever loads next time */ })
      .finally(() => { if (on) setLoading(false); });
    return () => { on = false; };
  }, [visible]);

  /* 250ms debounce on the search box */
  useEffect(() => {
    const id = setTimeout(() => setQ(query.trim()), 250);
    return () => clearTimeout(id);
  }, [query]);

  const searching = q.length >= 2;

  /* server-first search: `q` regex over question + stored answer, pagination reset */
  useEffect(() => {
    if (!visible) return;
    if (!searching) { setServerRows([]); setServerHasMore(false); return; }
    let on = true;
    setSearchLoading(true);
    getChatHistory(undefined, 30, q)
      .then((r) => { if (!on) return; setServerRows(r.turns); setServerHasMore(r.hasMore); })
      .catch(() => { /* fuzzy over already-loaded rows still works */ })
      .finally(() => { if (on) setSearchLoading(false); });
    return () => { on = false; };
  }, [q, searching, visible]);

  /* what the list shows: plain pages, or fuzzy-ranked merge of server hits + loaded rows */
  const results = useMemo(() => {
    if (!searching) return rows;
    const byId = new Map<string, ChatTurnDto>();
    for (const r of serverRows) byId.set(r.id, r);
    for (const r of rows) if (!byId.has(r.id)) byId.set(r.id, r);
    const all = Array.from(byId.values());
    // same typo-tolerant bilingual scorer as the festival search — "kundli" reaches कुंडली
    const items = all.map((t) => ({
      key: t.id,
      name: { en: t.question, hi: t.question },
      aliases: t.response?.answer ? [String(t.response.answer).slice(0, 400)] : [],
    }));
    const pos = new Map<string, number>();
    const ranked = rankObservances(q, items);
    if (ranked.length) {
      ranked.forEach((r, i) => pos.set(r.key, i));
    } else {
      // strict pass empty — the scorer takes the WEAKEST query word, so one word the
      // transliteration spells differently ("sade" vs साढ़े→"sarhe") sinks the whole
      // query. Drop one word at a time and union the sub-rankings, best score first.
      const qt = q.split(/\s+/).filter(Boolean);
      if (qt.length >= 2) {
        const best = new Map<string, number>();
        for (let i = 0; i < qt.length; i += 1) {
          const sub = qt.filter((_, j) => j !== i).join(' ');
          for (const r of rankObservances(sub, items)) {
            if ((best.get(r.key) || 0) < r.score) best.set(r.key, r.score);
          }
        }
        Array.from(best.entries()).sort((a, b) => b[1] - a[1]).forEach(([k], i) => pos.set(k, i));
      }
    }
    if (pos.size) return all.filter((t) => pos.has(t.id)).sort((a, b) => (pos.get(a.id)! - pos.get(b.id)!));
    // last resort: plain substring (a hit deep inside a long answer that the alias slice missed)
    const lq = q.toLowerCase();
    return all
      .filter((t) => t.question.toLowerCase().includes(lq) || String(t.response?.answer || '').toLowerCase().includes(lq))
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }, [searching, q, rows, serverRows]);

  /* date-group sections (search shows one flat ranked "Results" section) */
  const sections = useMemo(() => {
    if (!results.length) return [] as { title: string; data: ChatTurnDto[] }[];
    if (searching) return [{ title: hi ? 'परिणाम' : 'Results', data: results }];
    const out: { title: string; data: ChatTurnDto[] }[] = [];
    const now = new Date();
    for (const t of results) {
      const label = groupLabel(t.createdAt, hi, now);
      const last = out[out.length - 1];
      if (last && last.title === label) last.data.push(t);
      else out.push({ title: label, data: [t] });
    }
    return out;
  }, [results, searching, hi]);

  const moreAvailable = searching ? serverHasMore : hasMore;

  /* onEndReached → next `before` page (search keeps its own cursor + q) */
  const loadMore = useCallback(async () => {
    if (loading || loadingMore) return;
    if (searching) {
      if (!serverHasMore || searchLoading) return;
      const last = serverRows[serverRows.length - 1];
      if (!last?.createdAt) return;
      setLoadingMore(true);
      try {
        const r = await getChatHistory(last.createdAt, 30, q);
        setServerRows((s) => [...s, ...r.turns]);
        setServerHasMore(r.hasMore);
      } catch { /* ignore */ }
      setLoadingMore(false);
    } else {
      if (!hasMore) return;
      const last = rows[rows.length - 1];
      if (!last?.createdAt) return;
      setLoadingMore(true);
      try {
        const r = await getChatHistory(last.createdAt);
        setRows((s) => [...s, ...r.turns]);
        setHasMore(r.hasMore);
      } catch { /* ignore */ }
      setLoadingMore(false);
    }
  }, [loading, loadingMore, searching, serverHasMore, searchLoading, serverRows, q, hasMore, rows]);

  /* detail slide in/out */
  const W = Dimensions.get('window').width;
  const openDetail = useCallback((t: ChatTurnDto) => {
    setDetail(t);
    slide.setValue(0);
    Animated.timing(slide, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [slide]);
  const closeDetail = useCallback(() => {
    Animated.timing(slide, { toValue: 0, duration: 220, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => setDetail(null));
  }, [slide]);
  const detailX = slide.interpolate({ inputRange: [0, 1], outputRange: [W, 0] });

  /* clear history — themed confirm dialog, then empty state */
  const confirmClear = () => {
    dialog(
      hi ? 'चैट इतिहास मिटाएँ?' : 'Clear chat history?',
      hi ? 'आपके सभी सहेजे हुए प्रश्न-उत्तर हमेशा के लिए हट जाएँगे।' : 'All your saved questions and answers will be permanently removed.',
      [
        { text: hi ? 'रद्द करें' : 'Cancel', style: 'cancel' },
        {
          text: hi ? 'मिटाएँ' : 'Delete',
          style: 'destructive',
          onPress: () => {
            clearChatHistory()
              .then(() => {
                setRows([]); setServerRows([]); setHasMore(false); setServerHasMore(false);
                setDetail(null); setQuery('');
                onCleared?.();
              })
              .catch(() => {});
          },
        },
      ],
    );
  };

  const gold = theme.isDark ? theme.gold1 : theme.gold3;
  const btnSurface = theme.isDark ? '#000000' : '#ffffff';
  const busy = loading || (searchLoading && results.length === 0);

  const emptyBlock = (
    <View style={styles.emptyWrap}>
      {busy ? (
        <ActivityIndicator color={theme.gold1} />
      ) : (
        <>
          <View style={[styles.emptyGlyph, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? '#0e0a04' : '#f8fafc' }]}>
            <ChatGlyph color={gold} size={27} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.goldText }]}>
            {searching
              ? (hi ? `'${q}' के लिए कुछ नहीं मिला` : `Nothing found for '${q}'`)
              : (hi ? 'अभी कोई इतिहास नहीं' : 'No history yet')}
          </Text>
          <Text style={[styles.emptyText, { color: theme.textSoft }]}>
            {searching
              ? (hi ? 'छोटे शब्द से या वर्तनी बदलकर खोजें।' : 'Try a shorter word or a different spelling.')
              : (hi ? 'ज्योतिषी से पहला प्रश्न पूछें — हर प्रश्न और उत्तर यहाँ सुरक्षित रहेगा।' : 'Ask the astrologer your first question — every question and answer is saved here.')}
          </Text>
        </>
      )}
    </View>
  );

  const footerBlock = loadingMore ? (
    <View style={styles.footerWrap}><ActivityIndicator color={theme.gold1} size="small" /></View>
  ) : results.length > 0 && !moreAvailable ? (
    <Text style={[styles.endNote, { color: theme.textMuted }]}>{'बस इतना ही · That’s all'}</Text>
  ) : null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={() => { if (detail) closeDetail(); else onClose(); }}
    >
      {/* opaque theme background — never transparent (Android composite) */}
      <View style={{ flex: 1, backgroundColor: theme.bgDeep }}>
        {/* ── header: close ✕ · title + count · trash ── */}
        <View style={[styles.header, { paddingTop: insets.top + 10, borderBottomColor: theme.line, backgroundColor: theme.bgDeep }]}>
          <PressableScale onPress={onClose} hitSlop={10} haptic="select" ripple={theme.ripple} rippleBorderless style={[styles.hBtn, { borderColor: theme.cardBorder, backgroundColor: btnSurface }]}>
            <CloseIcon color={theme.gold1} />
          </PressableScale>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[styles.hTitle, { color: theme.text }]} numberOfLines={1}>{hi ? 'चैट इतिहास' : 'Chat History'}</Text>
            <Text style={[styles.hCount, { color: theme.textMuted }]} numberOfLines={1}>
              {rows.length
                ? `${rows.length}${hasMore ? '+' : ''} ${hi ? 'प्रश्न' : rows.length === 1 && !hasMore ? 'question' : 'questions'}`
                : hi ? 'ज्योतिषी से आपकी बातचीत' : 'Your talks with the astrologer'}
            </Text>
          </View>
          {rows.length > 0 ? (
            <PressableScale onPress={confirmClear} hitSlop={10} haptic="select" ripple={theme.ripple} rippleBorderless style={[styles.hBtn, { borderColor: theme.cardBorder, backgroundColor: btnSurface }]}>
              <TrashIcon color={theme.isDark ? '#ff8585' : '#b91c1c'} />
            </PressableScale>
          ) : (
            <View style={styles.hSpacer} />
          )}
        </View>

        {/* ── search bar (LibraryScreen treatment) ── */}
        <View style={{ paddingHorizontal: 16, paddingTop: 12, backgroundColor: theme.bgDeep }}>
          <View style={[styles.searchBar, { borderColor: theme.isDark ? 'rgba(220,180,80,0.35)' : theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(12,12,16,0.92)' : '#ffffff' }]}>
            <SearchIcon color={theme.goldText} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={hi ? 'प्रश्न या उत्तर खोजें…' : 'Search questions & answers…'}
              placeholderTextColor={theme.textMuted}
              style={[styles.searchInput, { color: theme.text }]}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Pressable onPress={() => { hSelect(); setQuery(''); }} hitSlop={10} style={[styles.searchClear, { backgroundColor: theme.isDark ? 'rgba(233,184,80,0.15)' : 'rgba(176,115,22,0.10)' }]}>
                <CloseIcon color={theme.goldText} size={11} strokeWidth={2.4} />
              </Pressable>
            )}
          </View>
        </View>

        {/* ── grouped list ── */}
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <HistoryRow turn={item} q={searching ? q : ''} theme={theme} onOpen={openDetail} />}
          renderSectionHeader={({ section }) => (
            <View style={[styles.secHead, { backgroundColor: theme.bgDeep }]}>
              <Text style={[styles.secLabel, { color: theme.goldText }]}>{section.title}</Text>
            </View>
          )}
          stickySectionHeadersEnabled
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={footerBlock}
          ListEmptyComponent={emptyBlock}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24, flexGrow: sections.length ? undefined : 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />

        {/* ── detail: full question + the stored answer, chat-identical rendering ── */}
        {detail && (
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: theme.bgDeep, transform: [{ translateX: detailX }] }]}>
            <View style={[styles.header, { paddingTop: insets.top + 10, borderBottomColor: theme.line, backgroundColor: theme.bgDeep }]}>
              <PressableScale onPress={closeDetail} hitSlop={10} haptic="select" ripple={theme.ripple} rippleBorderless style={[styles.hBtn, { borderColor: theme.cardBorder, backgroundColor: btnSurface }]}>
                <BackIcon color={theme.gold1} />
              </PressableScale>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={[styles.hTitle, { color: theme.text }]} numberOfLines={1}>{hi ? 'पूरा उत्तर' : 'Full Answer'}</Text>
                <Text style={[styles.hCount, { color: theme.textMuted }]}>{fmtTime(detail.createdAt)}</Text>
              </View>
              <View style={styles.hSpacer} />
            </View>
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 28 }} showsVerticalScrollIndicator={false}>
              <View style={[styles.detailCard, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? '#050505' : '#ffffff' }]}>
                <Text style={[styles.qLabel, { color: theme.goldText }]}>{hi ? 'प्रश्न' : 'Question'}</Text>
                <Text style={[styles.qBody, { color: theme.text }]}>{detail.question}</Text>
                {detail.response ? (
                  <AnswerView response={detail.response} onAsk={(fq) => onAskAgain(fq)} />
                ) : (
                  <Text style={[styles.noAnswer, { color: theme.textMuted }]}>
                    {hi ? 'इस प्रश्न का उत्तर सहेजा नहीं जा सका।' : 'The answer for this question could not be saved.'}
                  </Text>
                )}
              </View>
              <Pressable onPress={() => { hTap(); onAskAgain(detail.question); }} style={({ pressed }) => [styles.askWrap, pressed && { transform: [{ scale: 0.98 }] }]}>
                <LinearGradient colors={theme.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.askBtn}>
                  <Text style={[styles.askText, { color: theme.buttonInk }, hi && { fontFamily: fonts.devanagariBold, letterSpacing: 0.3 }]}>
                    {hi ? 'इस प्रश्न को फिर पूछें' : 'ASK AGAIN'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </ScrollView>
          </Animated.View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1 },
  hBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  hSpacer: { width: 40, height: 40 },
  hTitle: { fontFamily: fonts.playfair, fontSize: 17 },
  hCount: { fontFamily: fonts.inter, fontSize: 10.5, marginTop: 1 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, height: 48 },
  searchInput: { flex: 1, fontFamily: fonts.inter, fontSize: 13.5, paddingVertical: 0, height: '100%' },
  searchClear: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  secHead: { paddingTop: 14, paddingBottom: 8 },
  secLabel: { fontFamily: fonts.interBold, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  row: { flexDirection: 'row', gap: 12, borderWidth: 1, borderRadius: 16, padding: 12, marginBottom: 10 },
  medallion: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  rowQ: { fontFamily: fonts.interSemi, fontSize: 13.5, lineHeight: 19 },
  rowA: { fontFamily: fonts.inter, fontSize: 12, lineHeight: 17, marginTop: 3 },
  rowTime: { fontFamily: fonts.inter, fontSize: 10.5, marginTop: 6 },
  footerWrap: { paddingVertical: 18, alignItems: 'center' },
  endNote: { textAlign: 'center', fontFamily: fonts.inter, fontSize: 11.5, paddingVertical: 18 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 60, gap: 8 },
  emptyGlyph: { width: 64, height: 64, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  emptyTitle: { fontFamily: fonts.playfairBold, fontSize: 17, textAlign: 'center' },
  emptyText: { fontFamily: fonts.inter, fontSize: 12.5, lineHeight: 19, textAlign: 'center' },
  detailCard: { borderWidth: 1, borderRadius: 20, padding: 16 },
  qLabel: { fontFamily: fonts.interBold, fontSize: 11, textTransform: 'uppercase' },
  qBody: { fontFamily: fonts.interSemi, fontSize: 14.5, lineHeight: 21, marginTop: 5 },
  noAnswer: { fontFamily: fonts.inter, fontSize: 12.5, lineHeight: 19, marginTop: 12 },
  askWrap: { marginTop: 16, borderRadius: 999, overflow: 'hidden' },
  askBtn: { minHeight: 48, borderRadius: 999, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  askText: { fontFamily: fonts.cinzelSemi, fontSize: 12.2, letterSpacing: 1.1 },
});
