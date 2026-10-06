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
  Pattern,
} from 'react-native-svg';

interface HourlyPoint {
  hourStr: string;
  temp: number;
  icon: string;
  pop: number;
}

interface RainProbabilityChartProps {
  hourlyPoints: HourlyPoint[];
}

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

export const RainProbabilityChart: React.FC<RainProbabilityChartProps> = ({ hourlyPoints }) => {
  const [chartWidth, setChartWidth] = React.useState<number>(340);
  const chartHeight = 150;

  const onLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (width > 50) {
      setChartWidth(width);
    }
  };

  const paddingLeft = 14;
  const paddingRight = 46;
  const usableWidth = Math.max(chartWidth - paddingLeft - paddingRight, 100);

  const ySteps = [100, 80, 60, 40, 20, 0];

  const points = hourlyPoints.map((p, idx) => {
    const x = paddingLeft + (idx / Math.max(hourlyPoints.length - 1, 1)) * usableWidth;
    const normalizedY = p.pop / 100;
    const y = chartHeight - normalizedY * (chartHeight - 36) - 18;
    return {
      x,
      y,
      pop: p.pop,
      hourStr: p.hourStr,
    };
  });

  const curvePath = getSmoothCurvePath(points);
  const fillPath =
    points.length > 0
      ? `${curvePath} L ${points[points.length - 1].x},${chartHeight - 18} L ${points[0].x},${
          chartHeight - 18
        } Z`
      : '';

  // Vị trí mốc thời gian hiện tại
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
            <linearGradient id="rainAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#0284c7" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0.02" />
            </linearGradient>

            <pattern
              id="diagonalHatch"
              width="10"
              height="10"
              patternTransform="rotate(45 0 0)"
              patternUnits="userSpaceOnUse"
            >
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="10"
                stroke="rgba(255, 255, 255, 0.04)"
                strokeWidth="1.2"
              />
            </pattern>
          </defs>

          {/* Nền gạch sọc chéo đặc trưng Apple Weather */}
          <rect
            x={paddingLeft}
            y={8}
            width={chartWidth - paddingLeft - paddingRight}
            height={chartHeight - 26}
            fill="url(#diagonalHatch)"
          />

          {/* Đường lưới ngang 100%, 80%, 60%, 40%, 20%, 0% */}
          {ySteps.map((val, idx) => {
            const lineY = chartHeight - (val / 100) * (chartHeight - 36) - 18;
            return (
              <line
                key={`grid-${idx}`}
                x1={paddingLeft}
                y1={lineY}
                x2={chartWidth - paddingRight}
                y2={lineY}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeDasharray={val === 0 ? undefined : '3,3'}
              />
            );
          })}

          {/* Lớp gradient vùng mưa */}
          {fillPath ? <path d={fillPath} fill="url(#rainAreaGradient)" /> : null}

          {/* Đường vẽ xác suất mưa xanh ngọc */}
          {curvePath ? (
            <path
              d={curvePath}
              stroke="#38bdf8"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          ) : null}

          {/* Cột chỉ báo Active tại mốc hiện tại */}
          {activePoint ? (
            <>
              <line
                x1={activePoint.x}
                y1={activePoint.y}
                x2={activePoint.x}
                y2={chartHeight - 18}
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="2,2"
              />
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="4.5"
                fill="#38bdf8"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
            </>
          ) : null}
        </svg>
      );
    }

    return (
      <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          <SvgLinearGradient id="rainAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
            <Stop offset="60%" stopColor="#0284c7" stopOpacity="0.2" />
            <Stop offset="100%" stopColor="#0369a1" stopOpacity="0.02" />
          </SvgLinearGradient>

          <Pattern
            id="diagonalHatch"
            width="10"
            height="10"
            patternTransform="rotate(45 0 0)"
            patternUnits="userSpaceOnUse"
          >
            <Line
              x1={0}
              y1={0}
              x2={0}
              y2={10}
              stroke="rgba(255, 255, 255, 0.04)"
              strokeWidth={1.2}
            />
          </Pattern>
        </Defs>

        <Rect
          x={paddingLeft}
          y={8}
          width={chartWidth - paddingLeft - paddingRight}
          height={chartHeight - 26}
          fill="url(#diagonalHatch)"
        />

        {ySteps.map((val, idx) => {
          const lineY = chartHeight - (val / 100) * (chartHeight - 36) - 18;
          return (
            <Line
              key={`grid-${idx}`}
              x1={paddingLeft}
              y1={lineY}
              x2={chartWidth - paddingRight}
              y2={lineY}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeDasharray={val === 0 ? undefined : '3,3'}
            />
          );
        })}

        {fillPath ? <Path d={fillPath} fill="url(#rainAreaGradient)" /> : null}

        {curvePath ? (
          <Path
            d={curvePath}
            stroke="#38bdf8"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        ) : null}

        {activePoint ? (
          <>
            <Line
              x1={activePoint.x}
              y1={activePoint.y}
              x2={activePoint.x}
              y2={chartHeight - 18}
              stroke="#38bdf8"
              strokeWidth="1.5"
              strokeDasharray="2,2"
            />
            <Circle
              cx={activePoint.x}
              cy={activePoint.y}
              r="4.5"
              fill="#38bdf8"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
          </>
        ) : null}
      </Svg>
    );
  };

  return (
    <View style={styles.container} onLayout={onLayout}>
      <View style={styles.svgWrapper}>
        {renderSvgContent()}

        {/* Huy hiệu hiển thị % tại mốc thời gian hiện tại */}
        {activePoint && (
          <View
            style={[
              styles.popBadge,
              { left: activePoint.x - 14, top: activePoint.y - 18 },
            ]}
          >
            <Text style={styles.popBadgeText}>{activePoint.pop}%</Text>
          </View>
        )}

        {/* Trục Y bên phải: 100%, 80%, 60%, 40%, 20%, 0% */}
        <View style={styles.yAxisColumn}>
          {ySteps.map((val, idx) => (
            <Text key={idx} style={styles.yAxisText}>
              {val}%
            </Text>
          ))}
        </View>
      </View>

      {/* Trục X hiển thị 4 mốc: 00, 06, 12, 18 */}
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
  svgWrapper: {
    position: 'relative',
    height: 150,
    width: '100%',
  },
  yAxisColumn: {
    position: 'absolute',
    right: 0,
    top: 6,
    bottom: 6,
    width: 38,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  yAxisText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  popBadge: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popBadgeText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
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
