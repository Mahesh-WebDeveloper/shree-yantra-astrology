import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView, Modal, TextInput } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Page } from '../components/Page';
import { GradientText } from '../components/GradientText';
import { GoldButton } from '../components/GoldButton';
import { TextField } from '../components/TextField';
import { UserLine } from '../components/icons/ProfileIcons';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radii } from '../theme/tokens';
import { hTap, hSelect, hError } from '../lib/haptics';
import { useLang } from '../i18n/LanguageProvider';
import { useDialog } from '../components/DialogProvider';
import { getBabyNames, askNameQuestion, NameEngineResponse, NameItem } from '../lib/api';
import { subscribeShortlist, toggleShortlist, loadShortlist } from '../lib/nameShortlist';

type ChatMsg = { role: 'user' | 'bot'; text: string; suggestions?: NameItem[]; source?: string };
const SORTS = [
  { v: 'recent', en: 'Recent', hi: 'नया' },
  { v: 'az', en: 'A–Z', hi: 'अ–ज्ञ' },
  { v: 'num', en: 'Lucky #', hi: 'अंक' },
] as const;

function Sparkle({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
      <Path d="M12 2l1.7 5.1L19 9l-5.3 1.9L12 16l-1.7-5.1L5 9l5.3-1.9L12 2z" />
      <Path d="M19 13l.9 2.5 2.6.9-2.6.9L19 20l-.9-2.7-2.6-.9 2.6-.9L19 13z" opacity={0.7} />
    </Svg>
  );
}

type Mode = 'letter' | 'theme' | 'words';
const GENDERS = ['Boy', 'Girl', 'Any'] as const;
const ORIGINS = [
  { v: '', en: 'Any', hi: 'कोई भी' },
  { v: 'Sanskrit', en: 'Sanskrit', hi: 'संस्कृत' },
  { v: 'Hindu', en: 'Hindu', hi: 'हिन्दू' },
  { v: 'Sikh', en: 'Sikh', hi: 'सिख' },
  { v: 'Muslim', en: 'Muslim', hi: 'मुस्लिम' },
  { v: 'Christian', en: 'Christian', hi: 'ईसाई' },
];
const LENGTHS = [
  { v: '', en: 'Any', hi: 'कोई भी' },
  { v: 'short', en: 'Short', hi: 'छोटा' },
  { v: 'medium', en: 'Medium', hi: 'मध्यम' },
  { v: 'long', en: 'Long', hi: 'लंबा' },
];

function Heart({ filled, color, size = 18 }: { filled?: boolean; color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </Svg>
  );
}

export function BabyNamesScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const hi = lang === 'hi';
  const dialog = useDialog();

  const [mode, setMode] = useState<Mode>('letter');
  const [gender, setGender] = useState<typeof GENDERS[number]>('Boy');
  const [letter, setLetter] = useState('');
  const [theme_, setTheme_] = useState('');
  const [words, setWords] = useState('');
  const [origin, setOrigin] = useState('');
  const [lengthPref, setLengthPref] = useState('');

  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<NameEngineResponse | null>(null);
  const [detail, setDetail] = useState<NameItem | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [savedList, setSavedList] = useState<NameItem[]>([]);
  const [viewSaved, setViewSaved] = useState(false);

  // shortlist advanced filters
  const [sQuery, setSQuery] = useState('');
  const [sGender, setSGender] = useState<'Boy' | 'Girl' | 'Any'>('Any');
  const [sSort, setSSort] = useState<'recent' | 'az' | 'num'>('recent');

  // name helper (Q&A)
  const [helperOpen, setHelperOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [askInput, setAskInput] = useState('');
  const [asking, setAsking] = useState(false);
  const chatRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadShortlist();
    return subscribeShortlist((items) => {
      setSavedList(items);
      setSaved(new Set(items.map((n) => n.name.toLowerCase())));
    });
  }, []);

  const gLabel = (g: string) => hi ? (g === 'Boy' ? 'लड़का' : g === 'Girl' ? 'लड़की' : 'कोई भी') : g;

  const filteredSaved = useMemo(() => {
    let arr = savedList.slice();
    if (sGender !== 'Any') {
      const want = sGender === 'Boy' ? 'b' : 'g';
      arr = arr.filter((n) => (n.gender || '').toLowerCase().startsWith(want) || (n.gender || '').toLowerCase() === 'unisex');
    }
    const q = sQuery.trim().toLowerCase();
    if (q) arr = arr.filter((n) => n.name.toLowerCase().includes(q) || (n.meaning || '').toLowerCase().includes(q) || (n.nameHi || '').includes(sQuery.trim()));
    if (sSort === 'az') arr.sort((a, b) => a.name.localeCompare(b.name));
    else if (sSort === 'num') arr.sort((a, b) => (a.numerology?.luckyNumber || 99) - (b.numerology?.luckyNumber || 99));
    return arr;
  }, [savedList, sQuery, sGender, sSort]);

  const sendAsk = async (qOverride?: string) => {
    const q = (qOverride ?? askInput).trim();
    if (!q || asking) return;
    hTap();
    const ctx = (viewSaved ? savedList : (data?.names || [])).slice(0, 40);
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setAskInput(''); setAsking(true);
    setTimeout(() => chatRef.current?.scrollToEnd({ animated: true }), 60);
    try {
      const r = await askNameQuestion({ question: q, names: ctx, gender: gender.toLowerCase() });
      setMessages((m) => [...m, { role: 'bot', text: r.answer || '…', suggestions: r.suggestions, source: r.source }]);
    } catch {
      setMessages((m) => [...m, { role: 'bot', text: hi ? 'क्षमा करें, अभी उत्तर नहीं मिल पाया — दोबारा पूछें।' : 'Sorry, could not get an answer — please try again.' }]);
    } finally {
      setAsking(false);
      setTimeout(() => chatRef.current?.scrollToEnd({ animated: true }), 80);
    }
  };

  const quickPrompts = hi
    ? ['इन नामों में से सबसे अच्छा कौन सा?', 'अर्थ के साथ 5 नाम सुझाओ', 'आधुनिक और छोटे नाम', 'देवी लक्ष्मी से जुड़े नाम']
    : ['Which of these is best?', 'Suggest 5 names with meanings', 'Modern short names', 'Names related to Lakshmi'];

  const run = async () => {
    const q = mode === 'letter' ? letter : mode === 'theme' ? theme_ : words;
    if (!q.trim()) {
      hError();
      dialog(hi ? 'भरें' : 'Fill', mode === 'letter' ? (hi ? 'एक अक्षर लिखें' : 'Enter a letter') : mode === 'theme' ? (hi ? 'अर्थ/भाव लिखें' : 'Enter a meaning/theme') : (hi ? 'दो शब्द लिखें' : 'Enter two words'));
      return;
    }
    if (busy) return;
    hTap(); setBusy(true); setViewSaved(false); setData(null);
    try {
      const r = await getBabyNames({
        gender: gender.toLowerCase(),
        startWith: mode === 'letter' ? letter.trim() : undefined,
        theme: mode === 'theme' ? theme_.trim() : undefined,
        words: mode === 'words' ? words.trim() : undefined,
        origin: origin || undefined,
        lengthPref: (lengthPref || undefined) as any,
        count: 18,
      });
      setData(r);
    } catch (e: any) { hError(); dialog(hi ? 'त्रुटि' : 'Error', e?.message || 'Try again'); }
    finally { setBusy(false); }
  };

  const onToggleSave = (n: NameItem) => { hSelect(); toggleShortlist(n); };

  const list = viewSaved ? filteredSaved : (data?.names || []);

  return (
    <Page
      title={hi ? 'नाम खोजें' : 'Baby Names'}
      onBack={() => { hTap(); navigation.goBack(); }}
      right={(
        <View style={styles.heartWrap}>
          <Heart filled={viewSaved} color={theme.gold1} />
          {savedList.length > 0 && (
            <View style={[styles.heartBadge, { backgroundColor: '#e0567a', borderColor: theme.isDark ? '#000' : '#fff' }]}>
              <Text style={styles.heartBadgeTxt}>{savedList.length > 99 ? '99+' : savedList.length}</Text>
            </View>
          )}
        </View>
      )}
      onRight={() => { hSelect(); setViewSaved((v) => !v); }}
    >
      {!viewSaved && (
        <View style={[styles.card, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.85)' }]}>
          <View style={{ alignItems: 'center' }}>
            <GradientText style={styles.title}>{hi ? 'सुंदर नाम खोजें' : 'Find a Beautiful Name'}</GradientText>
            <Text style={[styles.sub, { color: theme.textMuted }]}>{hi ? 'अक्षर, अर्थ या दो शब्दों से — पूरा विवरण, अंकशास्त्र और शुभता सहित' : 'By letter, meaning or two words — with full detail, numerology & luck'}</Text>
          </View>

          {/* mode toggle */}
          <View style={styles.seg}>
            {(['letter', 'theme', 'words'] as Mode[]).map((m) => {
              const on = mode === m;
              const lbl = m === 'letter' ? (hi ? 'अक्षर' : 'Letter') : m === 'theme' ? (hi ? 'अर्थ' : 'Meaning') : (hi ? 'मिलाएँ' : 'Combine');
              return (
                <Pressable key={m} onPress={() => { hSelect(); setMode(m); }} style={{ flex: 1 }}>
                  <View style={[styles.segBtn, on ? { backgroundColor: theme.gold1 } : { borderWidth: 1, borderColor: theme.cardBorder }]}>
                    <Text style={[styles.segTxt, { color: on ? theme.buttonInk : theme.gold1 }]}>{lbl}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={{ marginTop: 12 }}>
            {mode === 'letter' && <TextField icon={<UserLine color={theme.gold2} size={19} />} label={hi ? 'अक्षर (जैसे म, A)' : 'Letter (e.g. M, अ)'} value={letter} onChangeText={setLetter} placeholder={hi ? 'म' : 'M'} autoCapitalize="characters" />}
            {mode === 'theme' && <TextField icon={<UserLine color={theme.gold2} size={19} />} label={hi ? 'अर्थ / भाव' : 'Meaning / Theme'} value={theme_} onChangeText={setTheme_} placeholder={hi ? 'प्रकाश, लक्ष्मी, साहस' : 'light, Lakshmi, brave'} autoCapitalize="none" />}
            {mode === 'words' && <TextField icon={<UserLine color={theme.gold2} size={19} />} label={hi ? 'दो शब्द (माता-पिता के नाम/भाव)' : 'Two words (parents’ names/ideas)'} value={words} onChangeText={setWords} placeholder={hi ? 'सूर्य, तेज' : 'Surya, Tej'} autoCapitalize="words" />}
          </View>

          {/* gender */}
          <Text style={[styles.fLabel, { color: theme.goldText }]}>{hi ? 'किसके लिए' : 'FOR'}</Text>
          <View style={styles.chipRow}>
            {GENDERS.map((g) => {
              const on = g === gender;
              return (
                <Pressable key={g} onPress={() => { hSelect(); setGender(g); }} style={{ flex: 1 }}>
                  <View style={[styles.gChip, on ? { backgroundColor: theme.gold1, borderColor: theme.gold1 } : { borderWidth: 1, borderColor: theme.cardBorder }]}>
                    <Text style={[styles.gTxt, { color: on ? theme.buttonInk : theme.gold1 }]}>{gLabel(g)}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* filters — always visible */}
          <Text style={[styles.fLabel, { color: theme.goldText }]}>{hi ? 'परंपरा / मूल' : 'ORIGIN'}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollChips}>
            {ORIGINS.map((o) => {
              const on = origin === o.v;
              return (
                <Pressable key={o.v || 'any'} onPress={() => { hSelect(); setOrigin(o.v); }}>
                  <View style={[styles.pill, on ? { backgroundColor: theme.gold1, borderColor: theme.gold1 } : { borderColor: theme.cardBorder }]}>
                    <Text style={[styles.pillTxt, { color: on ? theme.buttonInk : theme.gold1 }]}>{hi ? o.hi : o.en}</Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
          <Text style={[styles.fLabel, { color: theme.goldText }]}>{hi ? 'लंबाई' : 'LENGTH'}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollChips}>
            {LENGTHS.map((o) => {
              const on = lengthPref === o.v;
              return (
                <Pressable key={o.v || 'any'} onPress={() => { hSelect(); setLengthPref(o.v); }}>
                  <View style={[styles.pill, on ? { backgroundColor: theme.gold1, borderColor: theme.gold1 } : { borderColor: theme.cardBorder }]}>
                    <Text style={[styles.pillTxt, { color: on ? theme.buttonInk : theme.gold1 }]}>{hi ? o.hi : o.en}</Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={{ marginTop: 16 }}>
            <GoldButton label={busy ? (hi ? 'खोज रहे हैं…' : 'Finding…') : (hi ? 'नाम सुझाएँ' : 'Suggest Names')} onPress={run} />
          </View>
          {busy && <ActivityIndicator color={theme.gold1} style={{ marginTop: 14 }} />}
          <HelperTrigger theme={theme} hi={hi} onPress={() => { hTap(); setHelperOpen(true); }} />
        </View>
      )}

      {/* SAVED view — wishlist with advanced filters */}
      {viewSaved && (
        <View>
          <View style={styles.savedHeadRow}>
            <GradientText style={styles.savedTitle}>{hi ? 'मेरी पसंद' : 'My Wishlist'}</GradientText>
            <Text style={[styles.resHint, { color: theme.textMuted }]}>
              {filteredSaved.length === savedList.length
                ? `${savedList.length} ${hi ? 'नाम' : 'names'}`
                : `${filteredSaved.length} / ${savedList.length}`}
            </Text>
          </View>

          {savedList.length > 0 && (
            <View style={[styles.savedTools, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,253,247,0.85)' }]}>
              <View style={[styles.searchBox, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.25)' : '#fffdf7' }]}>
                <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={theme.gold2} strokeWidth={2} strokeLinecap="round"><Path d="M21 21l-4.3-4.3M11 19a8 8 0 100-16 8 8 0 000 16z" /></Svg>
                <TextInput
                  value={sQuery} onChangeText={setSQuery}
                  placeholder={hi ? 'नाम या अर्थ खोजें…' : 'Search name or meaning…'}
                  placeholderTextColor={theme.textMuted}
                  style={[styles.searchInput, { color: theme.text }]}
                />
                {!!sQuery && <Text onPress={() => setSQuery('')} style={[styles.searchClear, { color: theme.textMuted }]}>✕</Text>}
              </View>
              <View style={styles.savedFilterRow}>
                {(['Boy', 'Girl', 'Any'] as const).map((g) => {
                  const on = sGender === g;
                  return (
                    <Pressable key={g} onPress={() => { hSelect(); setSGender(g); }} style={{ flex: 1 }}>
                      <View style={[styles.miniChip, on ? { backgroundColor: theme.gold1, borderColor: theme.gold1 } : { borderColor: theme.cardBorder }]}>
                        <Text style={[styles.miniTxt, { color: on ? theme.buttonInk : theme.gold1 }]}>{gLabel(g)}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.savedFilterRow}>
                {SORTS.map((s) => {
                  const on = sSort === s.v;
                  return (
                    <Pressable key={s.v} onPress={() => { hSelect(); setSSort(s.v); }} style={{ flex: 1 }}>
                      <View style={[styles.miniChip, on ? { backgroundColor: theme.gold2, borderColor: theme.gold2 } : { borderColor: theme.cardBorder }]}>
                        <Text style={[styles.miniTxt, { color: on ? theme.buttonInk : theme.gold2 }]}>{hi ? s.hi : s.en}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {savedList.length > 0 && <HelperTrigger theme={theme} hi={hi} onPress={() => { hTap(); setHelperOpen(true); }} />}

          {savedList.length === 0 && (
            <View style={[styles.empty, { borderColor: theme.cardBorder }]}>
              <Heart color={theme.gold2} size={28} />
              <Text style={[styles.emptyTxt, { color: theme.textMuted }]}>{hi ? 'अभी कोई नाम सहेजा नहीं गया। नाम कार्ड पर ♡ दबाएँ।' : 'No saved names yet. Tap ♡ on a name card.'}</Text>
            </View>
          )}
          {savedList.length > 0 && filteredSaved.length === 0 && (
            <Text style={[styles.emptyTxt, { color: theme.textMuted, marginTop: 16 }]}>{hi ? 'इन फ़िल्टर से कोई नाम नहीं मिला।' : 'No saved names match these filters.'}</Text>
          )}
        </View>
      )}

      {/* SEARCH results header */}
      {!viewSaved && data && !busy && (
        <View style={styles.resHeadRow}>
          <Text style={[styles.resH, { color: theme.gold1 }]}>{list.length} {hi ? 'नाम' : 'names'}</Text>
          <SourceBadge source={data.source} theme={theme} />
        </View>
      )}

      {/* result grid */}
      {list.length > 0 && (
        <View style={styles.grid}>
          {list.map((n, i) => {
            const isSaved = saved.has(n.name.toLowerCase());
            return (
              <Pressable key={`${n.name}${i}`} onPress={() => { hTap(); setDetail(n); }} style={styles.gridItem}>
                <View style={[styles.nameCard, { borderColor: theme.gold2 + '40', backgroundColor: theme.isDark ? 'rgba(201,150,46,0.06)' : '#fffdf7' }]}>
                  <View style={styles.nameTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.nameTxt, { color: theme.text }]} numberOfLines={1}>{n.name}</Text>
                      {!!n.nameHi && <Text style={[styles.nameHi, { color: theme.gold1 }]} numberOfLines={1}>{n.nameHi}</Text>}
                    </View>
                    <Pressable hitSlop={8} onPress={() => onToggleSave(n)}><Heart filled={isSaved} color={isSaved ? '#e0567a' : theme.gold2} size={17} /></Pressable>
                  </View>
                  <Text style={[styles.nameMean, { color: theme.textMuted }]} numberOfLines={2}>{hi ? (n.meaningHi || n.meaning) : n.meaning}</Text>
                  <View style={styles.metaRow}>
                    {!!n.origin && <Text style={[styles.metaTag, { color: theme.gold1, borderColor: theme.gold2 + '55' }]} numberOfLines={1}>{n.origin}</Text>}
                    {!!n.numerology && <Text style={[styles.metaNum, { color: theme.textSoft }]}>#{n.numerology.luckyNumber}</Text>}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {viewSaved && savedList.length > 0 && (
        <Text style={[styles.clearHint, { color: theme.textMuted }]} onPress={() => { hTap(); setViewSaved(false); }}>
          ← {hi ? 'वापस खोज पर' : 'Back to search'}
        </Text>
      )}

      {/* detail bottom sheet */}
      <Modal visible={!!detail} transparent animationType="slide" onRequestClose={() => setDetail(null)}>
        <Pressable style={styles.backdrop} onPress={() => setDetail(null)}>
          <Pressable style={[styles.sheet, { backgroundColor: theme.isDark ? '#14110b' : '#fffdf6', borderColor: theme.gold2 + '66' }]} onPress={(e) => e.stopPropagation()}>
            {!!detail && <NameDetail n={detail} hi={hi} theme={theme} saved={saved.has(detail.name.toLowerCase())} onSave={() => onToggleSave(detail)} onClose={() => setDetail(null)} />}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Name Helper (Q&A) sheet */}
      <Modal visible={helperOpen} transparent animationType="slide" onRequestClose={() => setHelperOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setHelperOpen(false)}>
          <Pressable style={[styles.helperSheet, { backgroundColor: theme.isDark ? '#14110b' : '#fffdf6', borderColor: theme.gold2 + '66' }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />
            <View style={styles.helperHead}>
              <View style={[styles.helperHeadIcon, { borderColor: theme.gold2 + '66', backgroundColor: theme.isDark ? 'rgba(201,150,46,0.12)' : 'rgba(244,195,74,0.18)' }]}>
                <Sparkle color={theme.gold1} size={18} />
              </View>
              <View style={{ flex: 1 }}>
                <GradientText style={styles.helperHeadTitle}>{hi ? 'नाम सहायक' : 'Name Helper'}</GradientText>
                <Text style={[styles.helperHeadSub, { color: theme.textMuted }]} numberOfLines={1}>{hi ? 'नामों के बारे में सलाह लें' : 'Get guidance about names'}</Text>
              </View>
              <Text onPress={() => setHelperOpen(false)} style={[styles.closeX, { color: theme.textMuted }]}>✕</Text>
            </View>

            <ScrollView ref={chatRef} style={styles.chatScroll} contentContainerStyle={{ paddingBottom: 8 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {messages.length === 0 && (
                <View style={{ marginTop: 4 }}>
                  <Text style={[styles.helperHint, { color: theme.textSoft }]}>{hi ? 'पूछने के लिए चुनें या नीचे टाइप करें:' : 'Tap a question or type your own below:'}</Text>
                  {quickPrompts.map((q) => (
                    <Pressable key={q} onPress={() => sendAsk(q)} style={[styles.qChip, { borderColor: theme.gold2 + '55', backgroundColor: theme.isDark ? 'rgba(201,150,46,0.06)' : 'rgba(244,195,74,0.1)' }]}>
                      <Text style={[styles.qChipTxt, { color: theme.gold1 }]}>{q}</Text>
                      <Text style={[styles.qArrow, { color: theme.gold2 }]}>›</Text>
                    </Pressable>
                  ))}
                </View>
              )}
              {messages.map((m, i) => (
                <Bubble key={i} m={m} theme={theme} hi={hi} saved={saved} onOpen={(n: NameItem) => setDetail(n)} onSave={onToggleSave} />
              ))}
              {asking && (
                <View style={[styles.botBubble, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : '#fff' }]}>
                  <ActivityIndicator color={theme.gold1} size="small" />
                </View>
              )}
            </ScrollView>

            <View style={[styles.askRow, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.3)' : '#fffdf7' }]}>
              <TextInput
                value={askInput} onChangeText={setAskInput}
                placeholder={hi ? 'अपना सवाल लिखें…' : 'Type your question…'}
                placeholderTextColor={theme.textMuted}
                style={[styles.askInput, { color: theme.text }]}
                onSubmitEditing={() => sendAsk()}
                returnKeyType="send"
              />
              <Pressable onPress={() => sendAsk()} disabled={asking || !askInput.trim()} style={[styles.sendBtn, { backgroundColor: askInput.trim() ? theme.gold1 : theme.cardBorder }]}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={askInput.trim() ? theme.buttonInk : theme.textMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></Svg>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Page>
  );
}

function NameDetail({ n, hi, theme, saved, onSave, onClose }: any) {
  const num = n.numerology;
  const row = (label: string, value?: string | null) => value ? (
    <View style={styles.dRow}><Text style={[styles.dKey, { color: theme.textMuted }]}>{label}</Text><Text style={[styles.dVal, { color: theme.text }]}>{value}</Text></View>
  ) : null;
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.handle} />
      <View style={{ alignItems: 'center', marginBottom: 6 }}>
        <GradientText style={styles.dName}>{n.name}</GradientText>
        {!!n.nameHi && <Text style={[styles.dNameHi, { color: theme.gold1 }]}>{n.nameHi}</Text>}
        {!!n.pronunciation && <Text style={[styles.dPron, { color: theme.textMuted }]}>/ {n.pronunciation} /</Text>}
      </View>
      <Text style={[styles.dMean, { color: theme.text }]}>{hi ? (n.meaningHi || n.meaning) : n.meaning}</Text>
      {Array.isArray(n.themes) && n.themes.length > 0 && (
        <View style={styles.themeRow}>
          {n.themes.map((t: string, i: number) => (
            <Text key={i} style={[styles.themePill, { color: theme.gold1, borderColor: theme.gold2 + '55' }]}>{t}</Text>
          ))}
        </View>
      )}
      <View style={[styles.dBlock, { borderColor: theme.cardBorder }]}>
        {row(hi ? 'मूल / परंपरा' : 'Origin', n.origin)}
        {row(hi ? 'लिंग' : 'Gender', n.gender)}
        {row(hi ? 'अक्षर' : 'Letters', n.letterCount ? String(n.letterCount) : null)}
      </View>
      {!!num && (
        <View style={[styles.dBlock, { borderColor: theme.gold2 + '55', backgroundColor: theme.isDark ? 'rgba(201,150,46,0.06)' : 'rgba(244,195,74,0.08)' }]}>
          <Text style={[styles.dBlockH, { color: theme.gold1 }]}>{hi ? 'अंकशास्त्र व शुभता' : 'Numerology & Luck'}</Text>
          <View style={styles.luckGrid}>
            <Luck k={hi ? 'अंक' : 'Number'} v={String(num.luckyNumber)} theme={theme} />
            <Luck k={hi ? 'ग्रह' : 'Planet'} v={hi ? num.planetHi : num.planet} theme={theme} />
            <Luck k={hi ? 'रंग' : 'Colour'} v={hi ? num.colorHi : num.color} theme={theme} />
            <Luck k={hi ? 'रत्न' : 'Stone'} v={hi ? num.stoneHi : num.stone} theme={theme} />
            <Luck k={hi ? 'धातु' : 'Metal'} v={hi ? num.metalHi : num.metal} theme={theme} />
            <Luck k={hi ? 'दिन' : 'Day'} v={hi ? num.dayHi : num.day} theme={theme} />
          </View>
        </View>
      )}
      <View style={{ marginTop: 14, marginBottom: 6 }}>
        <GoldButton label={saved ? (hi ? '♡ सहेजा गया — हटाएँ' : '♡ Saved — Remove') : (hi ? '♡ शॉर्टलिस्ट में जोड़ें' : '♡ Add to Shortlist')} variant={saved ? 'ghost' : 'primary'} onPress={onSave} />
      </View>
      <Text style={[styles.closeTxt, { color: theme.textMuted }]} onPress={onClose}>{hi ? 'बंद करें' : 'Close'}</Text>
    </ScrollView>
  );
}

function Luck({ k, v, theme }: any) {
  if (!v) return null;
  return (
    <View style={styles.luckCell}>
      <Text style={[styles.luckK, { color: theme.textMuted }]}>{k}</Text>
      <Text style={[styles.luckV, { color: theme.text }]}>{v}</Text>
    </View>
  );
}

// Dev-only source indicator — a tiny colour dot (no text). Only the developer
// knows the mapping: green = AI, gold = AI+library, blue = offline library.
function SourceBadge({ source, theme }: { source?: string; theme: any }) {
  if (!source) return null;
  const c = source === 'ai' ? '#3ec77a' : source === 'mixed' ? theme.gold1 : '#6fa8dc';
  return <View style={[styles.srcDot, { backgroundColor: c, borderColor: c }]} />;
}

// Entry button that opens the Name Helper chat.
function HelperTrigger({ theme, hi, onPress }: { theme: any; hi: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.helperBtn, { borderColor: theme.gold2 + '66', backgroundColor: theme.isDark ? 'rgba(201,150,46,0.08)' : 'rgba(244,195,74,0.13)' }]}>
      <View style={[styles.helperBtnIcon, { borderColor: theme.gold2 + '55', backgroundColor: theme.isDark ? 'rgba(201,150,46,0.12)' : '#fffdf7' }]}>
        <Sparkle color={theme.gold1} size={17} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.helperTitle, { color: theme.gold1 }]}>{hi ? 'नाम सहायक से पूछें' : 'Ask the Name Helper'}</Text>
        <Text style={[styles.helperSub, { color: theme.textMuted }]} numberOfLines={1}>{hi ? 'सबसे अच्छा नाम, अर्थ, तुलना — कुछ भी पूछें' : 'Best name, meanings, comparisons — ask anything'}</Text>
      </View>
      <Text style={[styles.helperArrow, { color: theme.gold2 }]}>›</Text>
    </Pressable>
  );
}

// One chat message bubble (user or helper), with optional name suggestions.
function Bubble({ m, theme, hi, saved, onOpen, onSave }: any) {
  if (m.role === 'user') {
    return (
      <View style={[styles.userBubble, { backgroundColor: theme.gold1 }]}>
        <Text style={[styles.userTxt, { color: theme.buttonInk }]}>{m.text}</Text>
      </View>
    );
  }
  return (
    <View style={[styles.botBubble, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : '#fff' }]}>
      <Text style={[styles.botTxt, { color: theme.text }]}>{m.text}</Text>
      {Array.isArray(m.suggestions) && m.suggestions.length > 0 && (
        <View style={styles.sugWrap}>
          {m.suggestions.map((n: NameItem, i: number) => {
            const isSaved = saved.has(n.name.toLowerCase());
            return (
              <Pressable key={`${n.name}${i}`} onPress={() => { hTap(); onOpen(n); }} style={[styles.sugChip, { borderColor: theme.gold2 + '55', backgroundColor: theme.isDark ? 'rgba(0,0,0,0.25)' : '#fffdf7' }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sugName, { color: theme.text }]} numberOfLines={1}>{n.name}{n.nameHi ? `  ${n.nameHi}` : ''}</Text>
                  {!!n.meaning && <Text style={[styles.sugMean, { color: theme.textMuted }]} numberOfLines={1}>{n.meaning}</Text>}
                </View>
                <Pressable hitSlop={8} onPress={() => onSave(n)}><Heart filled={isSaved} color={isSaved ? '#e0567a' : theme.gold2} size={15} /></Pressable>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, padding: 16 },
  title: { fontFamily: fonts.cinzel, fontSize: 20, letterSpacing: 0.6 },
  sub: { fontFamily: fonts.inter, fontSize: 12, textAlign: 'center', marginTop: 6, lineHeight: 17 },
  seg: { flexDirection: 'row', gap: 8, marginTop: 14 },
  segBtn: { minHeight: 40, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  segTxt: { fontFamily: fonts.interSemi, fontSize: 13 },
  fLabel: { fontFamily: fonts.interSemi, fontSize: 10.5, letterSpacing: 1.5, marginTop: 14, marginBottom: 7, marginLeft: 2 },
  chipRow: { flexDirection: 'row', gap: 8 },
  gChip: { minHeight: 40, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  gTxt: { fontFamily: fonts.interSemi, fontSize: 13 },
  moreRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, flexWrap: 'wrap' },
  moreTxt: { fontFamily: fonts.interSemi, fontSize: 12.5 },
  moreBadge: { fontFamily: fonts.inter, fontSize: 11 },
  scrollChips: { gap: 8, paddingVertical: 2, paddingRight: 8 },
  pill: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  pillTxt: { fontFamily: fonts.interSemi, fontSize: 12.5 },
  resHeadRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 16, marginBottom: 4, paddingHorizontal: 2 },
  resH: { fontFamily: fonts.cinzelSemi, fontSize: 14, letterSpacing: 0.5 },
  resHint: { fontFamily: fonts.inter, fontSize: 11 },
  srcDot: { width: 9, height: 9, borderRadius: 5, borderWidth: 1, opacity: 0.85 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 8 },
  gridItem: { width: '48.5%', marginBottom: 10 },
  nameCard: { borderWidth: 1, borderRadius: 13, padding: 11, minHeight: 96 },
  nameTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  nameTxt: { fontFamily: fonts.cinzelSemi, fontSize: 17 },
  nameHi: { fontFamily: fonts.inter, fontSize: 12.5, marginTop: 1 },
  nameMean: { fontFamily: fonts.inter, fontSize: 11.5, marginTop: 5, lineHeight: 15.5, flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 8 },
  metaTag: { fontFamily: fonts.interSemi, fontSize: 9.5, borderWidth: 1, borderRadius: 7, paddingHorizontal: 6, paddingVertical: 2, overflow: 'hidden', maxWidth: '70%' },
  metaNum: { fontFamily: fonts.interSemi, fontSize: 11, marginLeft: 'auto' },
  empty: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 14, padding: 24, alignItems: 'center', gap: 10, marginTop: 16 },
  emptyTxt: { fontFamily: fonts.inter, fontSize: 12.5, textAlign: 'center', lineHeight: 18 },
  clearHint: { fontFamily: fonts.interSemi, fontSize: 12.5, textAlign: 'center', marginTop: 6, paddingVertical: 8 },
  // detail sheet
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, borderWidth: 1, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 26, maxHeight: '88%' },
  handle: { alignSelf: 'center', width: 42, height: 4, borderRadius: 2, backgroundColor: 'rgba(150,150,150,0.4)', marginBottom: 12 },
  dName: { fontFamily: fonts.cinzel, fontSize: 27, letterSpacing: 0.5 },
  dNameHi: { fontFamily: fonts.inter, fontSize: 17, marginTop: 2 },
  dPron: { fontFamily: fonts.inter, fontSize: 12.5, marginTop: 3, fontStyle: 'italic' },
  dMean: { fontFamily: fonts.inter, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 8 },
  themeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, justifyContent: 'center', marginTop: 11 },
  themePill: { fontFamily: fonts.interSemi, fontSize: 11, borderWidth: 1, borderRadius: 20, paddingHorizontal: 11, paddingVertical: 4, overflow: 'hidden' },
  dBlock: { borderWidth: 1, borderRadius: 13, padding: 13, marginTop: 14 },
  dBlockH: { fontFamily: fonts.cinzelSemi, fontSize: 13, letterSpacing: 0.5, marginBottom: 10 },
  dRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, gap: 12 },
  dKey: { fontFamily: fonts.interSemi, fontSize: 12.5 },
  dVal: { fontFamily: fonts.inter, fontSize: 12.5, flexShrink: 1, textAlign: 'right' },
  luckGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  luckCell: { width: '33.3%', marginBottom: 12 },
  luckK: { fontFamily: fonts.interSemi, fontSize: 9.5, letterSpacing: 0.6, textTransform: 'uppercase' },
  luckV: { fontFamily: fonts.interSemi, fontSize: 13, marginTop: 3 },
  closeTxt: { fontFamily: fonts.interSemi, fontSize: 13, textAlign: 'center', marginTop: 10, paddingVertical: 6 },

  // header heart + count
  heartWrap: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  heartBadge: { position: 'absolute', top: -7, right: -10, minWidth: 16, height: 16, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  heartBadgeTxt: { fontFamily: fonts.interSemi, fontSize: 9, color: '#fff' },

  // saved / wishlist
  savedHeadRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 6, marginBottom: 10, paddingHorizontal: 2 },
  savedTitle: { fontFamily: fonts.cinzel, fontSize: 19, letterSpacing: 0.5 },
  savedTools: { borderWidth: 1, borderRadius: 14, padding: 11, gap: 9 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 11, paddingHorizontal: 11, height: 42 },
  searchInput: { flex: 1, fontFamily: fonts.inter, fontSize: 13.5, paddingVertical: 0 },
  searchClear: { fontFamily: fonts.interSemi, fontSize: 13, paddingHorizontal: 4 },
  savedFilterRow: { flexDirection: 'row', gap: 7 },
  miniChip: { minHeight: 34, borderWidth: 1, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  miniTxt: { fontFamily: fonts.interSemi, fontSize: 12 },

  // helper trigger
  helperBtn: { flexDirection: 'row', alignItems: 'center', gap: 11, borderWidth: 1, borderRadius: 13, padding: 11, marginTop: 12 },
  helperBtnIcon: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  helperTitle: { fontFamily: fonts.cinzelSemi, fontSize: 13.5, letterSpacing: 0.3 },
  helperSub: { fontFamily: fonts.inter, fontSize: 11, marginTop: 2 },
  helperArrow: { fontFamily: fonts.interSemi, fontSize: 22, marginRight: 2 },

  // helper sheet (chat)
  helperSheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, borderWidth: 1, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14, height: '84%' },
  helperHead: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(150,150,150,0.25)' },
  helperHeadIcon: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  helperHeadTitle: { fontFamily: fonts.cinzel, fontSize: 18, letterSpacing: 0.4 },
  helperHeadSub: { fontFamily: fonts.inter, fontSize: 11.5, marginTop: 1 },
  closeX: { fontFamily: fonts.interSemi, fontSize: 16, paddingHorizontal: 6, paddingVertical: 2 },
  chatScroll: { flex: 1, marginTop: 12 },
  helperHint: { fontFamily: fonts.inter, fontSize: 12.5, marginBottom: 10, lineHeight: 18 },
  qChip: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 11, marginBottom: 8 },
  qChipTxt: { flex: 1, fontFamily: fonts.interSemi, fontSize: 13 },
  qArrow: { fontFamily: fonts.interSemi, fontSize: 18 },
  userBubble: { alignSelf: 'flex-end', maxWidth: '85%', borderRadius: 14, borderBottomRightRadius: 4, paddingHorizontal: 13, paddingVertical: 9, marginBottom: 10 },
  userTxt: { fontFamily: fonts.interSemi, fontSize: 13.5, lineHeight: 19 },
  botBubble: { alignSelf: 'flex-start', maxWidth: '92%', borderWidth: 1, borderRadius: 14, borderBottomLeftRadius: 4, paddingHorizontal: 13, paddingVertical: 11, marginBottom: 10 },
  botTxt: { fontFamily: fonts.inter, fontSize: 13.5, lineHeight: 20 },
  sugWrap: { marginTop: 10, gap: 7 },
  sugChip: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 8 },
  sugName: { fontFamily: fonts.cinzelSemi, fontSize: 14 },
  sugMean: { fontFamily: fonts.inter, fontSize: 11, marginTop: 1 },
  askRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 24, paddingLeft: 15, paddingRight: 5, height: 48, marginTop: 8 },
  askInput: { flex: 1, fontFamily: fonts.inter, fontSize: 14, paddingVertical: 0 },
  sendBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
});
