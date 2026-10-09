import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FloatingCloudProps {
  top: number;
  scale: number;
  opacity: number;
  duration: number;
  startOffset: number;
}

const FloatingCloud: React.FC<FloatingCloudProps> = ({
  top,
  scale,
  opacity,
  duration,
  startOffset,
}) => {
  const moveAnim = useRef(new Animated.Value(startOffset)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(moveAnim, {
          toValue: SCREEN_WIDTH + 150,
          duration: duration * (1 - (startOffset + 150) / (SCREEN_WIDTH + 300)),
          useNativeDriver: true,
        }),
        Animated.timing(moveAnim, {
          toValue: -180,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(moveAnim, {
          toValue: SCREEN_WIDTH + 150,
          duration: duration,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [duration, moveAnim, startOffset]);

  return (
    <Animated.View
      style={[
        styles.cloudWrapper,
        {
          top,
          opacity,
          transform: [{ translateX: moveAnim }, { scale }],
        },
      ]}
    >
      <View style={styles.cloudBase} />
      <View style={styles.cloudPuff1} />
      <View style={styles.cloudPuff2} />
      <View style={styles.cloudPuff3} />
    </Animated.View>
  );
};

export const CloudEffect: React.FC = () => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={styles.staticCloudBackdrop1} />
      <View style={styles.staticCloudBackdrop2} />

      <FloatingCloud
        top={35}
        scale={1.2}
        opacity={0.65}
        duration={42000}
        startOffset={SCREEN_WIDTH * 0.1}
      />
      <FloatingCloud
        top={95}
        scale={0.9}
        opacity={0.5}
        duration={58000}
        startOffset={SCREEN_WIDTH * 0.55}
      />
      <FloatingCloud
        top={160}
        scale={1.4}
        opacity={0.4}
        duration={50000}
        startOffset={-80}
      />
      <FloatingCloud
        top={230}
        scale={0.8}
        opacity={0.35}
        duration={65000}
        startOffset={SCREEN_WIDTH * 0.3}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  staticCloudBackdrop1: {
    position: 'absolute',
    top: 50,
    left: -50,
    right: -50,
    height: 220,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 120,
    transform: [{ scaleX: 1.4 }],
  },
  staticCloudBackdrop2: {
    position: 'absolute',
    top: 130,
    left: 20,
    right: -30,
    height: 180,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 90,
  },
  cloudWrapper: {
    position: 'absolute',
    width: 140,
    height: 50,
  },
  cloudBase: {
    position: 'absolute',
    bottom: 0,
    left: 15,
    width: 110,
    height: 35,
    backgroundColor: '#ffffff',
    borderRadius: 20,
  },
  cloudPuff1: {
    position: 'absolute',
    bottom: 10,
    left: 25,
    width: 45,
    height: 45,
    backgroundColor: '#ffffff',
    borderRadius: 25,
  },
  cloudPuff2: {
    position: 'absolute',
    bottom: 15,
    left: 55,
    width: 55,
    height: 55,
    backgroundColor: '#ffffff',
    borderRadius: 30,
  },
  cloudPuff3: {
    position: 'absolute',
    bottom: 8,
    left: 90,
    width: 35,
    height: 35,
    backgroundColor: '#ffffff',
    borderRadius: 20,
  },
});
