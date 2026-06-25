import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Polyline } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { fonts, radii } from '../theme/tokens';
import { Page } from '../components/Page';
import { Card } from '../components/Card';
import { GradientText } from '../components/GradientText';
import { ContentBook, getBook } from '../lib/api';
import { hTap } from '../lib/haptics';

export function ContentBookScreen({ navigation, route }: any) {
  const { theme } = useTheme();
  const [book, setBook] = useState<ContentBook | null>(null);
  const [open, setOpen] = useState(0);

  useEffect(() => {
    let on = true;
    getBook(route.params.id).then((r) => { if (on) setBook(r.book); }).catch(() => {});
    return () => { on = false; };
  }, [route.params.id]);

  return (
    <Page title={book?.title || 'Library'} onBack={() => { hTap(); navigation.goBack(); }}>
      {!book ? (
        <Card><Text style={[styles.loading, { color: theme.textSoft }]}>Loading...</Text></Card>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <LinearGradient colors={theme.isDark ? ['#000000', '#15110a'] : ['#ffffff', '#fff7e6']} style={[styles.hero, { borderColor: theme.cardBorder }]}>
            <GradientText style={styles.title}>{book.title}</GradientText>
            <Text style={[styles.meta, { color: theme.gold2 }]}>{[book.author, book.category].filter(Boolean).join(' - ')}</Text>
            <Text style={[styles.desc, { color: theme.textSoft }]}>{book.description}</Text>
          </LinearGradient>
          <View style={{ gap: 10, marginTop: 14 }}>
            {(book.chapters || []).map((chapter, index) => {
              const active = open === index;
              return (
                <Pressable key={chapter._id || index} onPress={() => setOpen(active ? -1 : index)} style={[styles.chapter, { borderColor: active ? theme.gold1 : theme.cardBorder, backgroundColor: theme.cardBg }]}>
                  <View style={styles.chapterHead}>
                    <Text style={[styles.chapterTitle, { color: active ? theme.goldText : theme.text }]}>{chapter.title}</Text>
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.gold1} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <Polyline points={active ? '18 15 12 9 6 15' : '9 18 15 12 9 6'} />
                    </Svg>
                  </View>
                  {active ? <Text style={[styles.content, { color: theme.textSoft }]}>{chapter.content || 'No content added yet.'}</Text> : null}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  loading: { fontFamily: fonts.inter, fontSize: 14 },
  hero: { borderWidth: 1, borderRadius: radii.lg, padding: 18 },
  title: { fontFamily: fonts.playfairBold, fontSize: 24, lineHeight: 30 },
  meta: { fontFamily: fonts.cinzelSemi, fontSize: 11, letterSpacing: 1.2, marginTop: 6 },
  desc: { fontFamily: fonts.inter, fontSize: 13, lineHeight: 20, marginTop: 12 },
  chapter: { borderWidth: 1, borderRadius: radii.md, padding: 14 },
  chapterHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  chapterTitle: { flex: 1, fontFamily: fonts.playfair, fontSize: 15.5, lineHeight: 20 },
  content: { fontFamily: fonts.inter, fontSize: 13.5, lineHeight: 22, marginTop: 12 },
});
