import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect, Line, Polygon, G, Text as SvgText } from 'react-native-svg';
import { fonts } from '../theme/tokens';
import { useTheme } from '../theme/ThemeProvider';

// North-Indian diamond. House polygons (viewBox 0-200): 4 inner kites (1,4,7,10) + 8
// corner triangles. Tapping a house — or selecting its tab — highlights that region so a
// learner can see exactly which "khana" they are reading about.
const HOUSE_POLY: Record<number, string> = {
  1: '100,10 145,55 100,100 55,55',
  2: '10,10 100,10 55,55',
  3: '10,10 55,55 10,100',
  4: '10,100 55,55 100,100 55,145',
  5: '10,100 55,145 10,190',
  6: '10,190 55,145 100,190',
  7: '100,190 55,145 100,100 145,145',
  8: '100,190 145,145 190,190',
  9: '190,190 145,145 190,100',
  10: '190,100 145,55 100,100 145,145',
  11: '190,100 145,55 190,10',
  12: '190,10 145,55 100,10',
};
// label anchor per house
const HPOS: Record<number, [number, number]> = {
  1: [100, 40], 2: [52, 26], 3: [28, 54], 4: [52, 100], 5: [28, 148], 6: [52, 176],
  7: [100, 150], 8: [148, 176], 9: [172, 148], 10: [148, 100], 11: [172, 54], 12: [148, 26],
};

export function LearnKundliChart({ highlight, onSelect, size = 300 }: {
  highlight?: number | null; onSelect?: (h: number) => void; size?: number;
}) {
  const { theme } = useTheme();
  const stroke = theme.gold2;
  const numFill = theme.isDark ? '#e9b850' : theme.gold1;
  const hiFill = theme.isDark ? 'rgba(233,184,80,0.30)' : 'rgba(233,184,80,0.38)';

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg viewBox="0 0 200 200" width="100%" height="100%">
        {/* highlighted house fill (behind the lines) */}
        {highlight ? <Polygon points={HOUSE_POLY[highlight]} fill={hiFill} /> : null}

        {/* diamond skeleton */}
        <Rect x={10} y={10} width={180} height={180} stroke={stroke} strokeWidth={1.5} fill="none" />
        <Line x1={10} y1={10} x2={190} y2={190} stroke={stroke} strokeWidth={1} />
        <Line x1={190} y1={10} x2={10} y2={190} stroke={stroke} strokeWidth={1} />
        <Line x1={100} y1={10} x2={190} y2={100} stroke={stroke} strokeWidth={1} />
        <Line x1={190} y1={100} x2={100} y2={190} stroke={stroke} strokeWidth={1} />
        <Line x1={100} y1={190} x2={10} y2={100} stroke={stroke} strokeWidth={1} />
        <Line x1={10} y1={100} x2={100} y2={10} stroke={stroke} strokeWidth={1} />

        {/* house numbers — each tappable */}
        {Array.from({ length: 12 }).map((_, k) => {
          const h = k + 1; const [x, y] = HPOS[h]; const on = highlight === h;
          return (
            <G key={h} onPress={() => onSelect?.(h)}>
              <Polygon points={HOUSE_POLY[h]} fill="transparent" />
              <SvgText x={x} y={y} fontFamily={fonts.cinzelSemi} fontWeight="700" fontSize={on ? 15 : 12} fill={on ? numFill : (theme.isDark ? '#c9a961' : theme.textSoft)} textAnchor="middle">{h}</SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { alignSelf: 'center' } });
