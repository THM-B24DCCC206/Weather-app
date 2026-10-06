import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, useWindowDimensions } from 'react-native';

export const SunEffect: React.FC = () => {
  const { width } = useWindowDimensions();
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const flareAnim = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    // Xoay nhẹ nhàng các tia nắng
    const rotate = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 35000,
        useNativeDriver: true,
      })
    );

    // Hiệu ứng toả sáng nhịp thở (pulse)
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 3500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 3500,
          useNativeDriver: true,
        }),
      ])
    );

    // Hiệu ứng ánh quang (flare)
    const flare = Animated.loop(
      Animated.sequence([
        Animated.timing(flareAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(flareAnim, {
          toValue: 0.6,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    );

    rotate.start();
    pulse.start();
    flare.start();

    return () => {
      rotate.stop();
      pulse.stop();
      flare.stop();
    };
  }, [rotateAnim, pulseAnim, flareAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Vầng hào quang to toả ra từ góc phải trên */}
      <Animated.View
        style={[
          styles.sunGlowBig,
          {
            transform: [{ scale: pulseAnim }],
            opacity: flareAnim,
          },
        ]}
      />

      {/* Quầng sáng trung tâm */}
      <View style={styles.sunCore} />

      {/* Vòng tia nắng toả xoay chậm */}
      <Animated.View
        style={[
          styles.sunRaysContainer,
          {
            transform: [{ rotate: spin }],
          },
        ]}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.sunRay,
              {
                transform: [{ rotate: `${i * 45}deg` }],
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* Đốm sáng quang học (Lens Flare) */}
      <Animated.View
        style={[
          styles.lensFlare1,
          {
            left: width * 0.45,
            opacity: flareAnim,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.lensFlare2,
          {
            left: width * 0.3,
            opacity: flareAnim,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  sunGlowBig: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(253, 224, 71, 0.25)',
  },
  sunCore: {
    position: 'absolute',
    top: 20,
    right: 30,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#fffbeb',
    shadowColor: '#fde047',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 35,
    elevation: 10,
  },
  sunRaysContainer: {
    position: 'absolute',
    top: -15,
    right: -5,
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sunRay: {
    position: 'absolute',
    width: 6,
    height: 150,
    backgroundColor: 'rgba(254, 240, 138, 0.2)',
    borderRadius: 3,
  },
  lensFlare1: {
    position: 'absolute',
    top: 150,
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  lensFlare2: {
    position: 'absolute',
    top: 220,
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: 'rgba(253, 224, 71, 0.2)',
  },
});
