import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface StarProps {
  top: number;
  left: number;
  size: number;
  delay: number;
}

const Star: React.FC<StarProps> = ({ top, left, size, delay }) => {
  const opacityAnim = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 1200 + Math.random() * 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.15,
          duration: 1200 + Math.random() * 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [delay, opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.star,
        {
          top,
          left,
          width: size,
          height: size,
          borderRadius: size / 2,
          opacity: opacityAnim,
        },
      ]}
    />
  );
};

export const NightEffect: React.FC = () => {
  const stars = useRef(
    Array.from({ length: 35 }).map((_, i) => ({
      id: i,
      top: Math.random() * (SCREEN_HEIGHT * 0.6),
      left: Math.random() * SCREEN_WIDTH,
      size: 1.5 + Math.random() * 2.5,
      delay: Math.random() * 2000,
    }))
  ).current;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Vầng trăng đêm mờ ảo */}
      <View style={styles.moonGlow} />
      <View style={styles.moon} />

      {/* Sao lấp lánh */}
      {stars.map((star) => (
        <Star
          key={star.id}
          top={star.top}
          left={star.left}
          size={star.size}
          delay={star.delay}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  moonGlow: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(224, 231, 255, 0.12)',
  },
  moon: {
    position: 'absolute',
    top: 45,
    right: 45,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f8fafc',
    shadowColor: '#e0e7ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 8,
  },
  star: {
    position: 'absolute',
    backgroundColor: '#ffffff',
  },
});
