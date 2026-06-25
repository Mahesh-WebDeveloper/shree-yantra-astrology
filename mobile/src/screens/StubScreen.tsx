import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';
import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { BrandHeader } from '../components/BrandHeader';
import { SectionTitle } from '../components/SectionTitle';
import { openAppDrawer } from '../navigation/AppDrawerHost';

/**
 * On-brand placeholder for screens being ported next (Choghadiya, Kundli,
 * Profile). Uses the real theme/components so the design is already consistent.
 */
export function StubScreen({ navigation, title, note }: any) {
  const { theme } = useTheme();
  const openMenu = () => openAppDrawer();
  return (
    <Screen>
      <BrandHeader onMenu={openMenu} />
      <SectionTitle>{title}</SectionTitle>
      <Card padded style={{ marginTop: 10 }}>
        <Text style={[styles.h, { color: theme.gold1 }]}>Native port in progress</Text>
        <Text style={[styles.p, { color: theme.textSoft }]}>{note}</Text>
        <Text style={[styles.p, { color: theme.textMuted, marginTop: 10 }]}>
          The shared theme, fonts, gold gradients, navigation and bottom-nav are already live — this
          screen will be filled with the full feature set next, pixel-matched to the approved web UI.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h: { fontFamily: fonts.playfairBold, fontSize: 16, marginBottom: 6 },
  p: { fontFamily: fonts.inter, fontSize: 13.5, lineHeight: 20 },
});
