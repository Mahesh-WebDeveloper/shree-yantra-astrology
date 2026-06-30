import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radii } from '../theme/tokens';
import { useKeyboardAwareFocus } from './KeyboardAwareScroll';
import { MapPinIcon } from './icons/ProfileIcons';
import { useLang } from '../i18n/LanguageProvider';
import { hSelect } from '../lib/haptics';
import { LocationSuggestion, resolveLocation, searchLocations } from '../lib/api';

interface Props {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onSelect: (item: LocationSuggestion | null) => void;
  placeholder?: string;
  error?: string | null;
  country?: string;
}

// friendly bilingual label for an OSM place type → helps users trust the suggestion
function placeTypeLabel(type: string | undefined, hi: boolean): string {
  const t = (type || '').toLowerCase();
  const map: Record<string, [string, string]> = {
    village: ['गाँव', 'Village'],
    hamlet: ['ढाणी', 'Hamlet'],
    isolated_dwelling: ['ढाणी', 'Hamlet'],
    town: ['कस्बा', 'Town'],
    city: ['शहर', 'City'],
    municipality: ['नगर', 'Town'],
    suburb: ['क्षेत्र', 'Area'],
    quarter: ['क्षेत्र', 'Area'],
    neighbourhood: ['मोहल्ला', 'Area'],
    locality: ['स्थान', 'Locality'],
    administrative: ['तहसील/ज़िला', 'Region'],
  };
  const hit = map[t];
  if (hit) return hi ? hit[0] : hit[1];
  return '';
}

export function BirthPlaceField({ label, value, onChangeText, onSelect, placeholder, error, country = 'in' }: Props) {
  const { theme } = useTheme();
  const { lang } = useLang();
  const liftAboveKeyboard = useKeyboardAwareFocus();
  const inputRef = useRef<TextInput>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seq = useRef(0);
  const [focused, setFocused] = useState(false);
  const [items, setItems] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const q = value.trim();
    setMessage('');
    if (!focused || q.length < 3) {
      setItems([]);
      setLoading(false);
      return;
    }

    const requestId = ++seq.current;
    setLoading(true);
    timer.current = setTimeout(() => {
      searchLocations({ query: q, lang, country, limit: 6 })
        .then((res) => {
          if (requestId !== seq.current) return;
          setItems(res.items || []);
          setMessage(res.items?.length ? '' : (lang === 'hi' ? 'कोई स्थान नहीं मिला — कृपया अधिक विवरण लिखें।' : 'No match yet, type more details.'));
        })
        .catch(() => {
          if (requestId !== seq.current) return;
          setItems([]);
          setMessage(lang === 'hi' ? 'Location search abhi unavailable hai.' : 'Location search is unavailable right now.');
        })
        .finally(() => {
          if (requestId === seq.current) setLoading(false);
        });
    }, 360);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [country, focused, lang, value]);

  const invalid = !!error;
  const borderColor = invalid ? 'rgba(245,100,100,0.65)' : focused ? theme.gold2 : (theme.isDark ? 'rgba(201,150,46,0.35)' : theme.cardBorder);

  const changeText = (text: string) => {
    onChangeText(text);
    onSelect(null);
  };

  const pick = async (item: LocationSuggestion) => {
    hSelect();
    setResolvingId(item.id);
    setMessage('');
    try {
      const resolved = item.lat != null && item.lng != null
        ? item
        : (await resolveLocation({ ...item, query: item.description, lang, country })).item;
      onChangeText(resolved.description || item.description);
      onSelect(resolved);
      setItems([]);
      setFocused(false);
      inputRef.current?.blur();
    } catch (_) {
      onChangeText(item.description);
      onSelect(item.lat != null && item.lng != null ? item : null);
      setMessage(lang === 'hi' ? 'निर्देशांक लॉक नहीं हो पाए — पूरा पता लिखकर सेव करें।' : 'Could not lock coordinates. Type the full address and save.');
    } finally {
      setResolvingId(null);
    }
  };

  const showPanel = focused && (!!items.length || loading || !!message);

  return (
    <View>
      <Pressable
        onPress={() => inputRef.current?.focus()}
        style={[
          styles.field,
          {
            backgroundColor: invalid ? (theme.isDark ? 'rgba(36,12,18,0.55)' : '#fff2f2') : (theme.isDark ? (focused ? 'rgba(0,0,0,0.78)' : 'rgba(0,0,0,0.70)') : '#ffffff'),
            borderColor,
            shadowColor: theme.isDark ? '#000000' : '#5c3f12',
          },
          focused && !invalid && styles.focusGlow,
        ]}
      >
        <View style={styles.icon}><MapPinIcon color={theme.gold2} size={20} /></View>
        <View style={styles.body}>
          <Text style={[styles.label, { color: focused ? theme.gold2 : theme.goldText }]}>{label.toUpperCase()}</Text>
          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              value={value}
              onChangeText={changeText}
              placeholder={placeholder}
              placeholderTextColor={theme.isDark ? 'rgba(216,203,168,0.42)' : theme.textMuted}
              autoCapitalize="words"
              autoCorrect={false}
              onFocus={() => { setFocused(true); liftAboveKeyboard(); }}
              onBlur={() => setTimeout(() => setFocused(false), 180)}
              style={[styles.input, { color: theme.text }]}
            />
            {(loading || resolvingId) && <ActivityIndicator color={theme.gold1} size="small" />}
          </View>
        </View>
      </Pressable>

      {showPanel && (
        <View style={[styles.panel, { borderColor: theme.cardBorder, backgroundColor: theme.isDark ? '#090915' : '#ffffff' }]}>
          {items.map((item) => {
            const locked = item.lat != null && item.lng != null;
            const typeLabel = placeTypeLabel(item.type, lang === 'hi');
            return (
              <Pressable key={item.id} onPress={() => pick(item)} style={({ pressed }) => [styles.item, pressed && { opacity: 0.76 }]}>
                <View style={{ flex: 1 }}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.itemTitle, { color: theme.text }]} numberOfLines={1}>{item.mainText || item.description}</Text>
                    {!!typeLabel && (
                      <Text style={[styles.typeTag, { color: theme.gold1, borderColor: theme.gold2 + '55', backgroundColor: theme.isDark ? 'rgba(233,184,80,0.10)' : 'rgba(255,247,224,0.9)' }]}>{typeLabel}</Text>
                    )}
                  </View>
                  {!!item.secondaryText && <Text style={[styles.itemSub, { color: theme.textMuted }]} numberOfLines={2}>{item.secondaryText}</Text>}
                </View>
                {locked && (
                  <Text style={[styles.badge, { color: '#3ec77a', borderColor: '#3ec77a66' }]}>✓</Text>
                )}
              </Pressable>
            );
          })}
          {!!message && <Text style={[styles.hint, { color: theme.textMuted }]}>{message}</Text>}
          <Text style={[styles.source, { color: theme.textMuted }]}>
            {lang === 'hi' ? 'सुझाव चुनें; न मिले तो पूरा गाँव, तहसील, ज़िला व राज्य लिखें।' : 'Select a suggestion, or type full village, tehsil, district and state.'}
          </Text>
        </View>
      )}

      {invalid && <Text style={[styles.error, { color: theme.isDark ? '#ff9d9d' : theme.red }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  focusGlow: { shadowColor: '#e9b850', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 2 },
  icon: { width: 20, alignItems: 'center' },
  body: { flex: 1 },
  label: { fontFamily: fonts.interSemi, fontSize: 10.5, letterSpacing: 2 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { flex: 1, fontFamily: fonts.inter, fontSize: 15, paddingVertical: 2, marginTop: 2 },
  panel: { marginTop: 7, borderWidth: 1, borderRadius: 12, overflow: 'hidden', elevation: 6 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(201,150,46,0.22)' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  itemTitle: { fontFamily: fonts.interSemi, fontSize: 13.5, flexShrink: 1 },
  typeTag: { fontFamily: fonts.interSemi, fontSize: 9, borderWidth: 1, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1.5, overflow: 'hidden' },
  itemSub: { fontFamily: fonts.inter, fontSize: 11.5, lineHeight: 16, marginTop: 2 },
  badge: { fontFamily: fonts.interBold, fontSize: 10, borderWidth: 1, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 3, overflow: 'hidden' },
  hint: { fontFamily: fonts.inter, fontSize: 12, lineHeight: 17, paddingHorizontal: 12, paddingTop: 10 },
  source: { fontFamily: fonts.inter, fontSize: 10.5, lineHeight: 15, paddingHorizontal: 12, paddingVertical: 10 },
  error: { fontFamily: fonts.inter, fontSize: 11.5, color: '#ff9d9d', marginTop: 6, paddingLeft: 14, letterSpacing: 0.2 },
});
