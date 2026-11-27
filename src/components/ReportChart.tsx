import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { useAppTheme } from '../hooks/useAppTheme';
import { FONT_FAMILIES, RADIUS, SPACING } from '../theme';

export interface ChartPoint {
  label: string;
  value: number;
  maxValue?: number;
  highlight?: boolean;
}

interface ReportChartProps {
  title: string;
  subtitle?: string;
  data: ChartPoint[];
  unitSuffix?: string;
}

export function ReportChart({
  title,
  subtitle,
  data,
  unitSuffix = '',
}: ReportChartProps) {
  const theme = useAppTheme();
  const chartWidth = 310;
  const chartHeight = 148;
  const topPad = 20;
  const bottomPad = 24;
  const usableHeight = chartHeight - topPad - bottomPad;

  const maxVal = Math.max(
    100,
    ...data.map((d) => d.maxValue ?? d.value)
  );
  const count = Math.max(1, data.length);
  const slotWidth = chartWidth / count;
  const barWidth = Math.min(26, Math.max(10, slotWidth * 0.52));

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.white,
          borderColor: theme.colors.border,
        },
        theme.shadow,
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.primaryText }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: theme.colors.secondaryText }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.svgBox}>
        <Svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
          <Line
            x1="0"
            y1={topPad}
            x2={chartWidth}
            y2={topPad}
            stroke={theme.colors.border}
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          <Line
            x1="0"
            y1={topPad + usableHeight / 2}
            x2={chartWidth}
            y2={topPad + usableHeight / 2}
            stroke={theme.colors.border}
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          <Line
            x1="0"
            y1={topPad + usableHeight}
            x2={chartWidth}
            y2={topPad + usableHeight}
            stroke={theme.colors.border}
            strokeWidth="1"
          />

          {data.map((point, idx) => {
            const ratio = Math.max(0, Math.min(1, point.value / maxVal));
            const barH = Math.max(3, ratio * usableHeight);
            const x = idx * slotWidth + (slotWidth - barWidth) / 2;
            const y = topPad + usableHeight - barH;
            const barColor = point.highlight
              ? theme.colors.primaryNavy
              : point.value > 0
              ? theme.colors.secondaryTeal
              : theme.colors.border;

            return (
              <React.Fragment key={`${point.label}-${idx}`}>
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barH}
                  rx={6}
                  fill={barColor}
                />
                {point.value > 0 ? (
                  <SvgText
                    x={x + barWidth / 2}
                    y={y - 5}
                    fontSize="9"
                    fontWeight="600"
                    fill={theme.colors.primaryText}
                    textAnchor="middle"
                  >
                    {`${point.value}${unitSuffix}`}
                  </SvgText>
                ) : null}
                <SvgText
                  x={x + barWidth / 2}
                  y={chartHeight - 6}
                  fontSize="10"
                  fill={theme.colors.secondaryText}
                  textAnchor="middle"
                >
                  {point.label}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.base,
    gap: SPACING.sm,
  },
  header: {
    gap: 2,
  },
  title: {
    fontFamily: FONT_FAMILIES.semiBold,
    fontSize: 15,
  },
  subtitle: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: 12,
  },
  svgBox: {
    width: '100%',
    alignItems: 'center',
  },
});
