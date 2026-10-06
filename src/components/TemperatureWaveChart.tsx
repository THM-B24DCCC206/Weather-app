import React from 'react';
import { StyleSheet, View, Text, LayoutChangeEvent, Platform } from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Circle,
  Line,
  Rect,
} from 'react-native-svg';
import { WeatherIcon } from './WeatherIcon';

interface HourlyPoint {
  hourStr: string;
  temp: number;
  icon: string;
  pop: number;
}

interface TemperatureWaveChartProps {
  hourlyPoints: HourlyPoint[];
  maxTemp: number;
  minTemp: number;
}

// Hàm tạo đường cong Bézier mượt mà (Smooth Cubic Bezier Spline)
function getSmoothCurvePath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  let path = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 5;
    const cp1y = p1.y + (p2.y - p0.y) / 5;
    const cp2x = p2.x - (p3.x - p1.x) / 5;
    const cp2y = p2.y - (p3.y - p1.y) / 5;

    path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return path;
}

export const TemperatureWaveChart: React.FC<TemperatureWaveChartProps> = ({
  hourlyPoints,
  maxTemp,
  minTemp,
}) => {
  const [chartWidth, setChartWidth] = React.useState<number>(340);
  const chartHeight = 160;

  const onLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (width > 50) {
      setChartWidth(width);
    }
  };

  const allTemps = hourlyPoints.map((p) => p.temp);
  const rawMin = Math.min(...allTemps, minTemp);
  const rawMax = Math.max(...allTemps, maxTemp);

  // Tạo các mốc trục Y cách nhau 3° chuẩn Apple Weather (VD: 36, 33, 30, 27, 24, 21, 18, 15)
  const yMax = Math.ceil((rawMax + 3) / 3) * 3;
  const yMin = Math.floor((rawMin - 3) / 3) * 3;
  const yStepsCount = 7;
  const stepSize = Math.max(3, Math.ceil((yMax - yMin) / yStepsCount / 3) * 3);
  const ySteps: number[] = [];
  for (let val = yMax; val >= yMin; val -= stepSize) {
    ySteps.push(val);
  }

  const range = yMax - yMin || 1;
  const paddingLeft = 14;
  const paddingRight = 42;
  const usableWidth = Math.max(chartWidth - paddingLeft - paddingRight, 100);

  const points = hourlyPoints.map((p, idx) => {
    const x = paddingLeft + (idx / Math.max(hourlyPoints.length - 1, 1)) * usableWidth;
    const normalizedY = (p.temp - yMin) / range;
    const y = chartHeight - normalizedY * (chartHeight - 36) - 18;
    return {
      x,
      y,
      temp: p.temp,
      hourStr: p.hourStr,
      icon: p.icon,
      isMax: p.temp === maxTemp,
      isMin: p.temp === minTemp,
    };
  });

  const curvePath = getSmoothCurvePath(points);
  const fillPath =
    points.length > 0
      ? `${curvePath} L ${points[points.length - 1].x},${chartHeight} L ${points[0].x},${chartHeight} Z`
      : '';

  const maxPoint = points.find((p) => p.isMax) || points[Math.floor(points.length / 2)];
  const minPoint = points.find((p) => p.isMin && p !== maxPoint) || points[points.length - 1];

  // Cột thời gian hiện tại
  const currentHour = new Date().getHours();
  const currentIdx = Math.min(
    Math.max(0, Math.floor((currentHour / 24) * points.length)),
    points.length - 1
  );
  const activePoint = points[currentIdx] || points[0];

  const renderSvgContent = () => {
    if (Platform.OS === 'web') {
      return (
        <svg
          width={chartWidth}
          height={chartHeight}
          style={{ width: chartWidth, height: chartHeight, overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="tempWaveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#eab308" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#0d9488" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Cột mờ Active biểu thị mốc thời gian hiện tại chuẩn iOS */}
          {activePoint && (
            <rect
              x={activePoint.x - 14}
              y={0}
              width={28}
              height={chartHeight}
              fill="rgba(20, 184, 166, 0.15)"
            />
          )}

          {/* Các đường lưới ngang trục Y */}
          {ySteps.map((yVal, idx) => {
            const lineY =
              chartHeight - ((yVal - yMin) / range) * (chartHeight - 36) - 18;
            return (
              <line
                key={`grid-${idx}`}
                x1={paddingLeft}
                y1={lineY}
                x2={chartWidth - paddingRight}
                y2={lineY}
                stroke="rgba(255, 255, 255, 0.07)"
                strokeDasharray={idx === ySteps.length - 1 ? undefined : '3,3'}
              />
            );
          })}

          {/* Lớp gradient dưới đường cong */}
          {fillPath ? <path d={fillPath} fill="url(#tempWaveGradient)" /> : null}

          {/* Đường cong nhiệt độ nét đứt vàng chanh chuẩn Apple Weather */}
          {curvePath ? (
            <path
              d={curvePath}
              stroke="#eab308"
              strokeWidth="2.5"
              strokeDasharray="4,4"
              fill="none"
              strokeLinecap="round"
            />
          ) : null}

          {/* Điểm cực đại Peak */}
          {maxPoint ? (
            <circle
              cx={maxPoint.x}
              cy={maxPoint.y}
              r="4.5"
              fill="#fbbf24"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
          ) : null}

          {/* Điểm cực tiểu Trough */}
          {minPoint ? (
            <circle
              cx={minPoint.x}
              cy={minPoint.y}
              r="4.5"
              fill="#2dd4bf"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
          ) : null}

          {/* Điểm mốc thời gian hiện tại */}
          {activePoint ? (
            <circle
              cx={activePoint.x}
              cy={activePoint.y}
              r="5.5"
              fill="#ffffff"
              stroke="#0d9488"
              strokeWidth="2.5"
            />
          ) : null}
        </svg>
      );
    }

    return (
      <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          <SvgLinearGradient id="tempWaveGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#eab308" stopOpacity="0.45" />
            <Stop offset="50%" stopColor="#0d9488" stopOpacity="0.25" />
            <Stop offset="100%" stopColor="#0f172a" stopOpacity="0.05" />
          </SvgLinearGradient>
        </Defs>

        {activePoint && (
          <Rect
            x={activePoint.x - 14}
            y={0}
            width={28}
            height={chartHeight}
            fill="rgba(20, 184, 166, 0.15)"
          />
        )}

        {ySteps.map((yVal, idx) => {
          const lineY =
            chartHeight - ((yVal - yMin) / range) * (chartHeight - 36) - 18;
          return (
            <Line
              key={`grid-${idx}`}
              x1={paddingLeft}
              y1={lineY}
              x2={chartWidth - paddingRight}
              y2={lineY}
              stroke="rgba(255, 255, 255, 0.07)"
              strokeDasharray={idx === ySteps.length - 1 ? undefined : '3,3'}
            />
          );
        })}

        {fillPath ? <Path d={fillPath} fill="url(#tempWaveGradient)" /> : null}

        {curvePath ? (
          <Path
            d={curvePath}
            stroke="#eab308"
            strokeWidth="2.5"
            strokeDasharray="4,4"
            fill="none"
            strokeLinecap="round"
          />
        ) : null}

        {maxPoint ? (
          <Circle
            cx={maxPoint.x}
            cy={maxPoint.y}
            r="4.5"
            fill="#fbbf24"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
        ) : null}

        {minPoint ? (
          <Circle
            cx={minPoint.x}
            cy={minPoint.y}
            r="4.5"
            fill="#2dd4bf"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
        ) : null}

        {activePoint ? (
          <Circle
            cx={activePoint.x}
            cy={activePoint.y}
            r="5.5"
            fill="#ffffff"
            stroke="#0d9488"
            strokeWidth="2.5"
          />
        ) : null}
      </Svg>
    );
  };

  return (
    <View style={styles.container} onLayout={onLayout}>
      {/* 1. Hàng Icon thời tiết phía trên chuẩn Apple Weather */}
      <View style={[styles.iconsRow, { paddingLeft, paddingRight }]}>
        {points.map((p, idx) => (
          <View key={idx} style={styles.iconItem}>
            <WeatherIcon iconCode={p.icon} size={19} />
          </View>
        ))}
      </View>

      {/* 2. Vùng vẽ Biểu đồ đường cong SVG */}
      <View style={styles.svgWrapper}>
        {renderSvgContent()}

        {/* Chữ C (Cao nhất) và T (Thấp nhất) tối giản sang trọng chuẩn Apple */}
        {maxPoint && (
          <View
            style={[
              styles.letterBadge,
              { left: maxPoint.x - 7, top: maxPoint.y - 18 },
            ]}
          >
            <Text style={styles.letterText}>C</Text>
          </View>
        )}
        {minPoint && minPoint !== maxPoint && (
          <View
            style={[
              styles.letterBadge,
              { left: minPoint.x + 8, top: minPoint.y - 7 },
            ]}
          >
            <Text style={styles.letterText}>T</Text>
          </View>
        )}

        {/* Trục nhiệt độ Y bên phải với các mốc cách nhau 3° */}
        <View style={styles.yAxisColumn}>
          {ySteps.map((yVal, idx) => (
            <Text key={idx} style={styles.yAxisText}>
              {yVal}°
            </Text>
          ))}
        </View>
      </View>

      {/* 3. Trục X hiển thị 4 mốc chuẩn: 00, 06, 12, 18 */}
      <View style={[styles.xAxisRow, { paddingLeft, paddingRight }]}>
        <Text style={styles.xAxisText}>00</Text>
        <Text style={styles.xAxisText}>06</Text>
        <Text style={styles.xAxisText}>12</Text>
        <Text style={styles.xAxisText}>18</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  iconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconItem: {
    alignItems: 'center',
    width: 22,
  },
  svgWrapper: {
    position: 'relative',
    height: 160,
    width: '100%',
  },
  yAxisColumn: {
    position: 'absolute',
    right: 0,
    top: 4,
    bottom: 4,
    width: 34,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  yAxisText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  letterBadge: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  xAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 14,
  },
  xAxisText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    width: 24,
    textAlign: 'center',
  },
});
