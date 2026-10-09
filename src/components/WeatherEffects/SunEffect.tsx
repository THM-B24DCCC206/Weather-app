import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, useWindowDimensions, Platform } from 'react-native';
import Svg, {
  Defs,
  RadialGradient,
  LinearGradient as SvgLinearGradient,
  Stop,
  Circle,
  Polygon,
  G,
} from 'react-native-svg';

export const SunEffect: React.FC = () => {
  const { width } = useWindowDimensions();

  const pulseAnim = useRef(new Animated.Value(0.85)).current;
  const shimmerAnim = useRef(new Animated.Value(0.7)).current;
  const raySwayAnim = useRef(new Animated.Value(0)).current;
  const dustAnim1 = useRef(new Animated.Value(0)).current;
  const dustAnim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 4500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.85,
          duration: 4500,
          useNativeDriver: true,
        }),
      ])
    );

    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1.0,
          duration: 3200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.65,
          duration: 3200,
          useNativeDriver: true,
        }),
      ])
    );

    const raySway = Animated.loop(
      Animated.sequence([
        Animated.timing(raySwayAnim, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: true,
        }),
        Animated.timing(raySwayAnim, {
          toValue: -1,
          duration: 8000,
          useNativeDriver: true,
        }),
        Animated.timing(raySwayAnim, {
          toValue: 0,
          duration: 8000,
          useNativeDriver: true,
        }),
      ])
    );

    const dust1 = Animated.loop(
      Animated.timing(dustAnim1, {
        toValue: 1,
        duration: 9000,
        useNativeDriver: true,
      })
    );
    const dust2 = Animated.loop(
      Animated.timing(dustAnim2, {
        toValue: 1,
        duration: 12000,
        useNativeDriver: true,
      })
    );

    pulse.start();
    shimmer.start();
    raySway.start();
    dust1.start();
    dust2.start();

    return () => {
      pulse.stop();
      shimmer.stop();
      raySway.stop();
      dust1.stop();
      dust2.stop();
    };
  }, [pulseAnim, shimmerAnim, raySwayAnim, dustAnim1, dustAnim2]);

  const sunX = width * 0.78;
  const sunY = 55;

  const rayRotate = raySwayAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-2.5deg', '0deg', '2.5deg'],
  });

  const dustParticles = [
    { x: width * 0.65, y: 120, size: 3, delay: dustAnim1, deltaY: -40, opacity: 0.7 },
    { x: width * 0.52, y: 180, size: 2.2, delay: dustAnim2, deltaY: -55, opacity: 0.55 },
    { x: width * 0.42, y: 140, size: 3.5, delay: dustAnim1, deltaY: -35, opacity: 0.8 },
    { x: width * 0.58, y: 220, size: 2, delay: dustAnim2, deltaY: -50, opacity: 0.6 },
    { x: width * 0.35, y: 250, size: 2.8, delay: dustAnim1, deltaY: -45, opacity: 0.75 },
    { x: width * 0.72, y: 160, size: 2.5, delay: dustAnim2, deltaY: -30, opacity: 0.5 },
    { x: width * 0.48, y: 290, size: 3.2, delay: dustAnim1, deltaY: -60, opacity: 0.65 },
  ];

  const godRays = [
    {
      id: 'ray1',
      p1: `${sunX - 10},${sunY - 10}`,
      p2: `${sunX - 120},${sunY + 380}`,
      p3: `${sunX - 40},${sunY + 410}`,
      opacity: 0.45,
    },
    {
      id: 'ray2',
      p1: `${sunX},${sunY}`,
      p2: `${sunX - 220},${sunY + 440}`,
      p3: `${sunX - 140},${sunY + 460}`,
      opacity: 0.35,
    },
    {
      id: 'ray3',
      p1: `${sunX + 15},${sunY - 5}`,
      p2: `${sunX - 320},${sunY + 390}`,
      p3: `${sunX - 250},${sunY + 420}`,
      opacity: 0.28,
    },
    {
      id: 'ray4',
      p1: `${sunX - 5},${sunY + 15}`,
      p2: `${sunX - 60},${sunY + 330}`,
      p3: `${sunX + 20},${sunY + 350}`,
      opacity: 0.4,
    },
  ];

  const renderSvgDefs = () => {
    if (Platform.OS === 'web') {
      return (
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
          <defs>
            <radialGradient id="sunCoreGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="20%" stopColor="#fef08a" stopOpacity="0.75" />
              <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.35" />
              <stop offset="75%" stopColor="#f59e0b" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>

            <radialGradient id="sunAmbientBloom" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.45" />
              <stop offset="35%" stopColor="#f59e0b" stopOpacity="0.22" />
              <stop offset="70%" stopColor="#ea580c" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
            </radialGradient>

            <linearGradient id="godRayGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fffbeb" stopOpacity="0.7" />
              <stop offset="25%" stopColor="#fef08a" stopOpacity="0.4" />
              <stop offset="60%" stopColor="#fbbf24" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </linearGradient>

            <radialGradient id="lensFlareOrb" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
              <stop offset="40%" stopColor="#a855f7" stopOpacity="0.18" />
              <stop offset="75%" stopColor="#f59e0b" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      );
    }

    return (
      <Defs>
        <RadialGradient id="sunCoreGlow" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <Stop offset="20%" stopColor="#fef08a" stopOpacity="0.75" />
          <Stop offset="50%" stopColor="#fbbf24" stopOpacity="0.35" />
          <Stop offset="75%" stopColor="#f59e0b" stopOpacity="0.12" />
          <Stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </RadialGradient>

        <RadialGradient id="sunAmbientBloom" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor="#fef08a" stopOpacity="0.45" />
          <Stop offset="35%" stopColor="#f59e0b" stopOpacity="0.22" />
          <Stop offset="70%" stopColor="#ea580c" stopOpacity="0.06" />
          <Stop offset="100%" stopColor="#ea580c" stopOpacity="0" />
        </RadialGradient>

        <SvgLinearGradient id="godRayGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#fffbeb" stopOpacity="0.7" />
          <Stop offset="25%" stopColor="#fef08a" stopOpacity="0.4" />
          <Stop offset="60%" stopColor="#fbbf24" stopOpacity="0.15" />
          <Stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </SvgLinearGradient>

        <RadialGradient id="lensFlareOrb" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
          <Stop offset="40%" stopColor="#a855f7" stopOpacity="0.18" />
          <Stop offset="75%" stopColor="#f59e0b" stopOpacity="0.08" />
          <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </RadialGradient>
      </Defs>
    );
  };

  const renderVisualLayer = () => {
    if (Platform.OS === 'web') {
      return (
        <svg
          width="100%"
          height="100%"
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', overflow: 'visible' }}
        >
          <circle
            cx={sunX}
            cy={sunY}
            r={160}
            fill="url(#sunAmbientBloom)"
          />

          <circle
            cx={sunX}
            cy={sunY}
            r={65}
            fill="url(#sunCoreGlow)"
          />

          {godRays.map((ray) => (
            <polygon
              key={ray.id}
              points={`${ray.p1} ${ray.p2} ${ray.p3}`}
              fill="url(#godRayGrad)"
              opacity={ray.opacity}
            />
          ))}

          <circle
            cx={width * 0.46}
            cy={175}
            r={32}
            fill="url(#lensFlareOrb)"
          />
          <circle
            cx={width * 0.32}
            cy={260}
            r={18}
            fill="url(#lensFlareOrb)"
            opacity={0.65}
          />
        </svg>
      );
    }

    return (
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        {renderSvgDefs()}

        <Circle
          cx={sunX}
          cy={sunY}
          r={160}
          fill="url(#sunAmbientBloom)"
        />

        <Circle
          cx={sunX}
          cy={sunY}
          r={65}
          fill="url(#sunCoreGlow)"
        />

        <G>
          {godRays.map((ray) => (
            <Polygon
              key={ray.id}
              points={`${ray.p1} ${ray.p2} ${ray.p3}`}
              fill="url(#godRayGrad)"
              opacity={ray.opacity}
            />
          ))}
        </G>

        <Circle
          cx={width * 0.46}
          cy={175}
          r={32}
          fill="url(#lensFlareOrb)"
        />
        <Circle
          cx={width * 0.32}
          cy={260}
          r={18}
          fill="url(#lensFlareOrb)"
          opacity={0.65}
        />
      </Svg>
    );
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Platform.OS === 'web' && renderSvgDefs()}

      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: shimmerAnim,
            transform: [
              { scale: pulseAnim },
              { rotate: rayRotate },
            ],
          },
        ]}
      >
        {renderVisualLayer()}
      </Animated.View>

      {dustParticles.map((p, idx) => {
        const translateY = p.delay.interpolate({
          inputRange: [0, 1],
          outputRange: [0, p.deltaY],
        });
        const particleOpacity = p.delay.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.2, p.opacity, 0],
        });

        return (
          <Animated.View
            key={`dust-${idx}`}
            style={[
              styles.dustMote,
              {
                left: p.x,
                top: p.y,
                width: p.size,
                height: p.size,
                borderRadius: p.size / 2,
                opacity: particleOpacity,
                transform: [{ translateY }],
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  dustMote: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    shadowColor: '#fde047',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 3,
  },
});
