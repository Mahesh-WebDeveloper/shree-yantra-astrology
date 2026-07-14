import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
// SVG is still needed for the card's background glow — only the diya itself became a GIF.
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { fonts } from '../theme/tokens';
import { useT } from '../i18n/LanguageProvider';

/* The flame animates in the GIF itself, so nothing here drives it — the hand-rolled SVG
   diya this replaced had to flicker its flame through a JS-driven Animated loop.
   Animated GIFs need Fresco's animated-gif decoder on Android; it is already in the
   Gradle config, so this plays rather than freezing on the first frame. */
function DiyaIcon() {
  return (
    <View style={styles.iconWrap}>
      <Image source={require('../../assets/images/diya.gif')} style={styles.diya} resizeMode="contain" />
    </View>
  );
}

export const ChoghadiyaSpecialMessage = React.memo(function ChoghadiyaSpecialMessage({
  activeName, desc, timeRange, today = true,
}: {
  activeName: string;
  desc: string;
  timeRange: string;
  /** false when showing a non-today date — switches to the web's "On this day…" copy */
  today?: boolean;
}) {
  const { theme } = useTheme();
  const t = useT();
  const borderColor = theme.isDark ? 'rgba(238,203,122,0.36)' : theme.cardBorder;
  return (
    <View style={[styles.container, { backgroundColor: theme.isDark ? '#000000' : '#fffdf6', borderColor }]}>
      {/* web: radial-gradient(circle at 80% 50%, rgba(220,180,80,0.2), …) */}
      {theme.isDark && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Svg width="100%" height="100%">
            <Defs>
              <RadialGradient id="spGlow" cx="82%" cy="50%" r="60%">
                <Stop offset="0%" stopColor="#dcb450" stopOpacity={0.2} />
                <Stop offset="100%" stopColor="#dcb450" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx="82%" cy="50%" r="65%" fill="url(#spGlow)" />
          </Svg>
        </View>
      )}
      <View style={styles.content}>
        <Text style={[styles.h4, { color: theme.goldDim }]}>{t('cg.special', "TODAY'S SPECIAL MESSAGE")}</Text>
        {today ? (
          <Text style={[styles.p, { color: theme.isDark ? '#cccccc' : theme.textSoft }]}>
            From {timeRange} is <Text style={{ color: '#32cd32', fontFamily: fonts.interBold }}>{activeName} Choghadiya</Text>. {desc}
          </Text>
        ) : (
          <Text style={[styles.p, { color: theme.isDark ? '#cccccc' : theme.textSoft }]}>
            On this day, <Text style={{ color: '#32cd32', fontFamily: fonts.interBold }}>{activeName}</Text> runs {timeRange}. {desc}
          </Text>
        )}
      </View>
      <DiyaIcon />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.24,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  content: { flex: 1 },
  h4: { fontFamily: fonts.interSemi, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  p: { fontFamily: fonts.inter, fontSize: 12, lineHeight: 18 },
  /* no solid bg — the diya art carries its own glow, and the GIF is transparent */
  iconWrap: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  diya: { width: 60, height: 60 },
});
