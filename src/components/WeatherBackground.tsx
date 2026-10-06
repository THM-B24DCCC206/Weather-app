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
  gradientColors?: [string, string, ...string[]];
  children?: React.ReactNode;
}

export const WeatherBackground: React.FC<WeatherBackgroundProps> = ({
  weatherType,
  children,
}) => {
  const { width, height } = useWindowDimensions();
  const panAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Hiệu ứng dịch chuyển nhẹ nhàng (Parallax / Pan)
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

  // Lớp phủ màu chuyển sắc nhẹ giúp giảm độ chói của mây trắng và làm nổi chữ 100%
  const overlayColors: [string, string] =
    weatherType === 'cloud'
      ? ['rgba(15, 35, 60, 0.25)', 'rgba(15, 35, 60, 0.45)']
      : weatherType === 'sun'
      ? ['rgba(15, 45, 80, 0.2)', 'rgba(15, 45, 80, 0.4)']
      : weatherType === 'rain'
      ? ['rgba(10, 20, 30, 0.4)', 'rgba(10, 20, 30, 0.6)']
      : ['rgba(3, 7, 18, 0.3)', 'rgba(3, 7, 18, 0.5)'];

  return (
    <View style={styles.container}>
      {/* Ảnh nền thời tiết chân thực co giãn tự động theo mọi kích thước màn hình */}
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
          {/* Lớp gradient chống chói, tăng tương phản chuẩn Apple Weather */}
          <LinearGradient
            colors={overlayColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </ImageBackground>
      </Animated.View>

      {/* Các lớp hạt chuyển động thời tiết */}
      {weatherType === 'rain' && <RainEffect />}
      {weatherType === 'sun' && <SunEffect />}
      {weatherType === 'night' && <NightEffect />}

      {/* Nội dung giao diện */}
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
