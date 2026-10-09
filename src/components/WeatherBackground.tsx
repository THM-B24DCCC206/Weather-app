import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, ImageBackground, Animated, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RainEffect } from './WeatherEffects/RainEffect';
import { SunEffect } from './WeatherEffects/SunEffect';
import { NightEffect } from './WeatherEffects/NightEffect';

export type WeatherType = 'rain' | 'sun' | 'cloud' | 'night';

const weatherImages: Record<WeatherType, any> = {
  cloud: require('../../assets/weather/clouds.jpg'),
  rain: require('../../assets/weather/rain.jpg'),
  sun: require('../../assets/weather/sun.jpg'),
  night: require('../../assets/weather/night.jpg'),
};

interface WeatherBackgroundProps {
  weatherType: WeatherType;
  overlayColors?: [string, string];
  gradientColors?: [string, string, ...string[]];
  children?: React.ReactNode;
}

export const WeatherBackground: React.FC<WeatherBackgroundProps> = ({
  weatherType,
  overlayColors: customOverlayColors,
  children,
}) => {
  const { width, height } = useWindowDimensions();
  const panAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pan = Animated.loop(
      Animated.sequence([
        Animated.timing(panAnim, {
          toValue: -30,
          duration: 25000,
          useNativeDriver: true,
        }),
        Animated.timing(panAnim, {
          toValue: 0,
          duration: 25000,
          useNativeDriver: true,
        }),
      ])
    );
    pan.start();

    return () => pan.stop();
  }, [panAnim]);

  const bgImage = weatherImages[weatherType] || weatherImages.cloud;

  const defaultOverlayColors: [string, string] =
    weatherType === 'cloud'
      ? ['rgba(50, 95, 145, 0.12)', 'rgba(25, 55, 90, 0.28)']
      : weatherType === 'sun'
      ? ['rgba(56, 189, 248, 0.04)', 'rgba(30, 58, 138, 0.22)']
      : weatherType === 'rain'
      ? ['rgba(15, 25, 40, 0.38)', 'rgba(10, 18, 30, 0.6)']
      : ['rgba(3, 7, 18, 0.3)', 'rgba(3, 7, 18, 0.55)'];

  const overlayColors = customOverlayColors || defaultOverlayColors;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.imageWrapper,
          {
            width: width + 60,
            height: height + 60,
            transform: [{ translateX: panAnim }, { scale: 1.08 }],
          },
        ]}
      >
        <ImageBackground
          source={bgImage}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <LinearGradient
            colors={overlayColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </ImageBackground>
      </Animated.View>

      {weatherType === 'rain' && <RainEffect />}
      {weatherType === 'sun' && <SunEffect />}
      {weatherType === 'night' && <NightEffect />}

      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    overflow: 'hidden',
  },
  imageWrapper: {
    position: 'absolute',
    top: -30,
    left: -30,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
});
