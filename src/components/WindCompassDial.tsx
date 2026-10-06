import React from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import Svg, { Circle, Line, Polygon, G } from 'react-native-svg';

interface WindCompassDialProps {
  windDeg: number;
  windDirText: string;
}

export const WindCompassDial: React.FC<WindCompassDialProps> = ({
  windDeg,
  windDirText,
}) => {
  const size = 130;
  const center = size / 2;
  const radius = 55;

  // Tạo 36 vạch chia độ quanh vòng tròn la bàn (mỗi vạch cách nhau 10°)
  const ticks = Array.from({ length: 36 }).map((_, i) => {
    const angle = i * 10;
    const isMajor = angle % 90 === 0;
    const isSemiMajor = angle % 30 === 0;
    const tickLen = isMajor ? 7 : isSemiMajor ? 4.5 : 3;
    const rad = (angle * Math.PI) / 180;

    const x1 = center + (radius - tickLen) * Math.sin(rad);
    const y1 = center - (radius - tickLen) * Math.cos(rad);
    const x2 = center + radius * Math.sin(rad);
    const y2 = center - radius * Math.cos(rad);

    return {
      id: i,
      x1,
      y1,
      x2,
      y2,
      stroke: isMajor
        ? 'rgba(255, 255, 255, 0.45)'
        : isSemiMajor
        ? 'rgba(255, 255, 255, 0.25)'
        : 'rgba(255, 255, 255, 0.12)',
      strokeWidth: isMajor ? 1.5 : 1,
    };
  });

  const renderSvgContent = () => {
    if (Platform.OS === 'web') {
      return (
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ overflow: 'visible' }}
        >
          {/* Vòng tròn nền la bàn */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="rgba(0, 0, 0, 0.22)"
            stroke="rgba(255, 255, 255, 0.18)"
            strokeWidth="1.2"
          />

          {/* Vạch chia độ chuẩn đồng hồ hàng hải Apple */}
          {ticks.map((t) => (
            <line
              key={t.id}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke={t.stroke}
              strokeWidth={t.strokeWidth}
            />
          ))}

          {/* Tam giác chỉ hướng Bắc ở đỉnh */}
          <polygon
            points={`${center},${center - radius + 2} ${center - 4},${
              center - radius + 9
            } ${center + 4},${center - radius + 9}`}
            fill="#38bdf8"
          />

          {/* Kim chỉ hướng gió xoay chuẩn xác theo độ góc gió */}
          <g transform={`rotate(${windDeg} ${center} ${center})`}>
            {/* Đầu kim nhọn chỉ hướng gió */}
            <polygon
              points={`${center},${center - radius - 1} ${center - 4.5},${
                center - radius + 12
              } ${center + 4.5},${center - radius + 12}`}
              fill="#ffffff"
            />
            {/* Đuôi kim */}
            <line
              x1={center}
              y1={center + radius - 10}
              x2={center}
              y2={center + radius + 1}
              stroke="rgba(255, 255, 255, 0.45)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        </svg>
      );
    }

    return (
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill="rgba(0, 0, 0, 0.22)"
          stroke="rgba(255, 255, 255, 0.18)"
          strokeWidth="1.2"
        />

        {ticks.map((t) => (
          <Line
            key={t.id}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke={t.stroke}
            strokeWidth={t.strokeWidth}
          />
        ))}

        <Polygon
          points={`${center},${center - radius + 2} ${center - 4},${
            center - radius + 9
          } ${center + 4},${center - radius + 9}`}
          fill="#38bdf8"
        />

        <G
          rotation={windDeg}
          originX={center}
          originY={center}
        >
          <Polygon
            points={`${center},${center - radius - 1} ${center - 4.5},${
              center - radius + 12
            } ${center + 4.5},${center - radius + 12}`}
            fill="#ffffff"
          />
          <Line
            x1={center}
            y1={center + radius - 10}
            x2={center}
            y2={center + radius + 1}
            stroke="rgba(255, 255, 255, 0.45)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </G>
      </Svg>
    );
  };

  return (
    <View style={styles.container}>
      {renderSvgContent()}

      {/* 4 Chữ cái chỉ hướng: B (Bắc), Đ (Đông), N (Nam), T (Tây) */}
      <Text style={styles.cardinalN}>B</Text>
      <Text style={styles.cardinalE}>Đ</Text>
      <Text style={styles.cardinalS}>N</Text>
      <Text style={styles.cardinalW}>T</Text>

      {/* Chữ hướng gió lớn ở trung tâm (VD: B, ĐB, TN) */}
      <Text style={styles.centerHeading}>{windDirText}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 130,
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cardinalN: {
    position: 'absolute',
    top: 12,
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '800',
  },
  cardinalE: {
    position: 'absolute',
    right: 12,
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '800',
  },
  cardinalS: {
    position: 'absolute',
    bottom: 12,
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '800',
  },
  cardinalW: {
    position: 'absolute',
    left: 12,
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '800',
  },
  centerHeading: {
    position: 'absolute',
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
