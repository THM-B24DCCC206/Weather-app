import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Svg, { Polyline, Circle, Line } from 'react-native-svg';

export interface ForecastItem {
  dt: number;
  temp: number;
  feelsLike: number;
  description: string;
  icon: string;
  pop: number;
  rain: number;
  windSpeed: number;
  isNow?: boolean;
}

interface ForecastChartProps {
  forecastData: ForecastItem[];
  selectedForecastIndex: number;
  chartWidth: number;
  formatForecastTime: (dt: number) => string;
}

export const ForecastChart: React.FC<ForecastChartProps> = ({
  forecastData,
  selectedForecastIndex,
  chartWidth,
  formatForecastTime,
}) => {
  if (forecastData.length === 0) return null;

  const chartHeight = 125;
  const paddingLeft = 28;
  const paddingRight = 10;
  const paddingTop = 14;
  const paddingBottom = 28;

  const graphWidth = chartWidth - paddingLeft - paddingRight;
  const graphHeight = chartHeight - paddingTop - paddingBottom;

  const temperatures = forecastData.map((item) => Number(item.temp) || 0);
  const minTemp = Math.floor(Math.min(...temperatures) - 2);
  const maxTemp = Math.ceil(Math.max(...temperatures) + 2);
  const tempRange = Math.max(maxTemp - minTemp, 1);

  const points = forecastData.map((item, index) => {
    const x =
      paddingLeft +
      (index / Math.max(forecastData.length - 1, 1)) * graphWidth;
    const y =
      paddingTop +
      graphHeight -
      ((Number(item.temp) - minTemp) / tempRange) * graphHeight;

    return {
      x,
      y,
      temp: Number(item.temp) || 0,
      dt: Number(item.dt),
    };
  });

  const linePoints = points.map((point) => `${point.x},${point.y}`).join(' ');

  return (
    <View style={styles.chartBox}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>Nhiệt độ 12 giờ tới</Text>
        <Text style={styles.chartUnit}>°C</Text>
      </View>

      <View style={{ width: chartWidth, height: chartHeight, position: 'relative' }}>
        <Svg width={chartWidth} height={chartHeight}>
          <Line
            x1={paddingLeft}
            y1={paddingTop}
            x2={paddingLeft}
            y2={paddingTop + graphHeight}
            stroke="#D9D9D9"
            strokeWidth={1}
          />

          <Line
            x1={paddingLeft}
            y1={paddingTop + graphHeight}
            x2={paddingLeft + graphWidth}
            y2={paddingTop + graphHeight}
            stroke="#D9D9D9"
            strokeWidth={1}
          />

          <Line
            x1={paddingLeft}
            y1={paddingTop + graphHeight / 2}
            x2={paddingLeft + graphWidth}
            y2={paddingTop + graphHeight / 2}
            stroke="#EEEEEE"
            strokeWidth={1}
          />

          <Polyline
            points={linePoints}
            fill="none"
            stroke="#2196F3"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((point, index) => {
            const active = index === selectedForecastIndex;
            return (
              <Circle
                key={`${point.dt}-${index}`}
                cx={point.x}
                cy={point.y}
                r={active ? 6 : 4}
                fill={active ? '#FF5722' : '#2196F3'}
              />
            );
          })}
        </Svg>

        {points.map((point, index) => {
          const active = index === selectedForecastIndex;
          const timeLabel =
            index === 0 ? 'NOW' : formatForecastTime(point.dt);

          return (
            <React.Fragment key={`label-${point.dt}-${index}`}>
              <Text
                style={[
                  styles.chartTempLabel,
                  {
                    left: point.x - 15,
                    top: point.y - 18,
                    color: active ? '#FF5722' : '#333333',
                    fontWeight: active ? '700' : '600',
                  },
                ]}
              >
                {Math.round(point.temp)}°
              </Text>

              <Text
                style={[
                  styles.chartTimeLabel,
                  {
                    left: point.x - 20,
                    top: paddingTop + graphHeight + 5,
                  },
                ]}
              >
                {timeLabel}
              </Text>
            </React.Fragment>
          );
        })}

        <Text style={[styles.chartAxisLabel, { left: 0, top: paddingTop - 5 }]}>
          {maxTemp}°
        </Text>
        <Text
          style={[
            styles.chartAxisLabel,
            { left: 0, top: paddingTop + graphHeight - 5 },
          ]}
        >
          {minTemp}°
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chartBox: {
    marginTop: 10,
    marginBottom: 4,
    paddingTop: 8,
    paddingBottom: 2,
    borderRadius: 14,
    backgroundColor: '#F8FBFF',
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  chartTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#222222',
  },
  chartUnit: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2196F3',
  },
  chartTempLabel: {
    position: 'absolute',
    width: 30,
    textAlign: 'center',
    fontSize: 9,
  },
  chartTimeLabel: {
    position: 'absolute',
    width: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#666666',
  },
  chartAxisLabel: {
    position: 'absolute',
    width: 25,
    fontSize: 8,
    color: '#777777',
    textAlign: 'right',
  },
});
