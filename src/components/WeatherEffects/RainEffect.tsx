import React, { useEffect, useRef, useMemo } from 'react';
import { StyleSheet, View, Animated, useWindowDimensions } from 'react-native';

interface RainDropProps {
  startX: number;
  delay: number;
  duration: number;
  length: number;
  opacity: number;
  screenHeight: number;
}

const RainDrop: React.FC<RainDropProps> = ({
  startX,
  delay,
  duration,
  length,
  opacity,
  screenHeight,
}) => {
  const fallAnim = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(fallAnim, {
          toValue: screenHeight + 80,
          duration: duration,
          useNativeDriver: true,
        }),
        Animated.timing(fallAnim, {
          toValue: -60,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [delay, duration, fallAnim, screenHeight]);

  return (
    <Animated.View
      style={[
        styles.rainDrop,
        {
          left: startX,
          height: length,
          opacity: opacity,
          transform: [
            { translateY: fallAnim },
            { rotate: '-12deg' }, // Góc nghiêng giọt mưa tự nhiên
          ],
        },
      ]}
    />
  );
};

export const RainEffect: React.FC = () => {
  const { width, height } = useWindowDimensions();

  // Tạo 45 giọt mưa ngẫu nhiên với độ trễ, vị trí và tốc độ khác nhau co giãn theo độ rộng màn hình
  const drops = useMemo(
    () =>
      Array.from({ length: 45 }).map((_, i) => ({
        id: i,
        startX: Math.random() * (width + 80) - 40,
        delay: Math.random() * 1200,
        duration: 700 + Math.random() * 500,
        length: 18 + Math.random() * 20,
        opacity: 0.35 + Math.random() * 0.55,
      })),
    [width]
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {drops.map((drop) => (
        <RainDrop
          key={drop.id}
          startX={drop.startX}
          delay={drop.delay}
          duration={drop.duration}
          length={drop.length}
          opacity={drop.opacity}
          screenHeight={height}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  rainDrop: {
    position: 'absolute',
    top: 0,
    width: 1.6,
    backgroundColor: '#cbd5e1',
    borderRadius: 1,
  },
});
