import { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface DataPoint {
  label: string;
  weight: number;
}

interface ProgressChartProps {
  title: string;
  data: DataPoint[];
}

const CHART_HEIGHT = 160;
const CHART_MARGIN = { top: 16, right: 16, bottom: 32, left: 48 };
const DOT_RADIUS = 4;

export function ProgressChart({ title, data }: ProgressChartProps) {
  const theme = useTheme();

  const { path, dots, yLabels, xLabels, minY, maxY } = useMemo(() => {
    if (data.length === 0) {
      return { path: '', dots: [], yLabels: [], xLabels: [], minY: 0, maxY: 100 };
    }
    const weights = data.map((d) => d.weight);
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const range = max - min || 1;
    const pad = range * 0.15;
    const minYVal = Math.max(0, min - pad);
    const maxYVal = max + pad;
    const yRange = maxYVal - minYVal;

    const chartW = Dimensions.get('window').width - Spacing.three * 2 - Spacing.three * 2 - CHART_MARGIN.left - CHART_MARGIN.right;
    const chartH = CHART_HEIGHT - CHART_MARGIN.top - CHART_MARGIN.bottom;

    const points = data.map((d, i) => {
      const x = CHART_MARGIN.left + (i / Math.max(data.length - 1, 1)) * chartW;
      const y = CHART_MARGIN.top + chartH - ((d.weight - minYVal) / yRange) * chartH;
      return { x, y, ...d };
    });

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

    const dotsArr = points.map((p) => ({ cx: p.x, cy: p.y, weight: p.weight }));

    const yLabelCount = 4;
    const yLabelsArr = Array.from({ length: yLabelCount }, (_, i) => {
      const val = Math.round(minYVal + (yRange * i) / (yLabelCount - 1));
      const y = CHART_MARGIN.top + chartH - ((val - minYVal) / yRange) * chartH;
      return { y, label: `${val}` };
    });

    const xStep = Math.max(1, Math.floor(data.length / 5));
    const xLabelsArr = data
      .filter((_, i) => i % xStep === 0 || i === data.length - 1)
      .map((d, i, arr) => {
        const idx = data.indexOf(d);
        const x = CHART_MARGIN.left + (idx / Math.max(data.length - 1, 1)) * chartW;
        return { x, label: d.label };
      });

    return {
      path: pathD,
      dots: dotsArr,
      yLabels: yLabelsArr,
      xLabels: xLabelsArr,
      minY: minYVal,
      maxY: maxYVal,
    };
  }, [data]);

  if (data.length === 0) return null;

  const chartW = Dimensions.get('window').width - Spacing.three * 2 - Spacing.three * 2 - CHART_MARGIN.left - CHART_MARGIN.right;
  const totalW = CHART_MARGIN.left + chartW + CHART_MARGIN.right;
  const textColor = theme.textSecondary;
  const lineColor = theme.textSecondary;
  const strokeColor = '#e74c3c';

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>{title}</ThemedText>
      <Svg width={totalW} height={CHART_HEIGHT}>
        {yLabels.map((yl, i) => (
          <SvgText
            key={i}
            x={CHART_MARGIN.left - 8}
            y={yl.y + 4}
            fill={textColor}
            fontSize={11}
            textAnchor="end"
          >
            {yl.label}
          </SvgText>
        ))}
        {xLabels.map((xl, i) => (
          <SvgText
            key={i}
            x={xl.x}
            y={CHART_HEIGHT - 4}
            fill={textColor}
            fontSize={10}
            textAnchor="middle"
          >
            {xl.label}
          </SvgText>
        ))}
        <Path d={path} fill="none" stroke={strokeColor} strokeWidth={2.5} strokeLinejoin="round" />
        {dots.map((d, i) => (
          <Circle key={i} cx={d.cx} cy={d.cy} r={DOT_RADIUS} fill={strokeColor} />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.three,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: Spacing.one,
  },
});
