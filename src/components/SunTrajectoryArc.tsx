import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Svg, { Path, Line, Circle } from 'react-native-svg';

interface SunTrajectoryArcProps {
  sunriseTs?: number;
  sunsetTs?: number;
  dt?: number;
}

export const SunTrajectoryArc: React.FC<SunTrajectoryArcProps> = ({
  sunriseTs,
  sunsetTs,
  dt,
}) => {
  const currentTs = dt || Math.floor(Date.now() / 1000);
  const sunrise = sunriseTs || currentTs - 3600 * 6;
  const sunset = sunsetTs || currentTs + 3600 * 6;

  let t = 0.5;
  const isNight = currentTs < sunrise || currentTs >= sunset;

  if (!isNight) {
    const dayProgress = Math.max(0, Math.min(1, (currentTs - sunrise) / (sunset - sunrise)));
    t = 0.18 + dayProgress * 0.64;
  } else {
    if (currentTs >= sunset) {
      const nightProgress = Math.max(0, Math.min(1, (currentTs - sunset) / (86400 - (sunset - sunrise))));
      t = 0.82 + nightProgress * 0.18;
    } else {
      t = 0.05 + (currentTs / sunrise) * 0.13;
    }
  }

  const width = 140;
  const height = 48;
  const horizonY = 28;

  const sunX = Math.min(132, Math.max(8, t * width));
  const sunY = horizonY - Math.sin((t - 0.18) * (Math.PI / 0.64)) * 18;

  const curvePath = 'M 6,34 C 24,34 36,10 70,10 C 104,10 116,34 134,34';

  const dotFill = isNight ? '#0f172a' : '#fde047';
  const dotStroke = isNight ? '#cbd5e1' : '#ffffff';

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{ overflow: 'visible' }}
        >
          <line
            x1="4"
            y1={horizonY}
            x2={width - 4}
            y2={horizonY}
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="1.2"
          />

          <path
            d={curvePath}
            stroke="rgba(255, 255, 255, 0.45)"
            strokeWidth="2.2"
            fill="none"
            strokeLinecap="round"
          />

          <circle
            cx={sunX}
            cy={sunY}
            r="4.5"
            fill={dotFill}
            stroke={dotStroke}
            strokeWidth="2"
          />
        </svg>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Line
          x1="4"
          y1={horizonY}
          x2={width - 4}
          y2={horizonY}
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth="1.2"
        />

        <Path
          d={curvePath}
          stroke="rgba(255, 255, 255, 0.45)"
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
        />

        <Circle
          cx={sunX}
          cy={sunY}
          r="4.5"
          fill={dotFill}
          stroke={dotStroke}
          strokeWidth="2"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 48,
    marginVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
