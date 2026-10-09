import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Platform,
  ImageBackground,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Defs,
  RadialGradient,
  LinearGradient as SvgLinearGradient,
  Stop,
  Rect,
  Polygon,
} from 'react-native-svg';
import { CurrentWeatherData, TempUnit } from '../types/weather';
import { getWeatherTheme, getFormattedCondition } from '../api/weatherApi';
import { WeatherType } from './WeatherBackground';

const weatherImages: Record<WeatherType, any> = {
  cloud: require('../../assets/weather/clouds.jpg'),
  rain: require('../../assets/weather/rain.jpg'),
  sun: require('../../assets/weather/sun.jpg'),
  night: require('../../assets/weather/night.jpg'),
};

interface CardRainDropProps {
  startX: number;
  delay: number;
  duration: number;
  length: number;
  opacity: number;
  strokeWidth: number;
}

const CardRainDrop: React.FC<CardRainDropProps> = ({
  startX,
  delay,
  duration,
  length,
  opacity,
  strokeWidth,
}) => {
  const fallAnim = useRef(new Animated.Value(-40)).current;

  useEffect(() => {
    let anim: Animated.CompositeAnimation | null = null;
    const timeout = setTimeout(() => {
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(fallAnim, {
            toValue: 160,
            duration: duration,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(fallAnim, {
            toValue: -40,
            duration: 0,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ])
      );
      anim.start();
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (anim) anim.stop();
    };
  }, [delay, duration, fallAnim]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: startX,
        width: strokeWidth,
        height: length,
        backgroundColor: '#ffffff',
        borderRadius: 1,
        opacity: opacity,
        transform: [
          { translateY: fallAnim },
          { rotate: '-12deg' },
        ],
      }}
    />
  );
};

interface CityCardProps {
  weatherData: CurrentWeatherData;
  onPress: () => void;
  onLongPress?: () => void;
  onDelete?: () => void;
  isCurrentLocation?: boolean;
  isEditMode?: boolean;
  tempUnit?: TempUnit;
}

export const CityCard: React.FC<CityCardProps> = ({
  weatherData,
  onPress,
  onLongPress,
  onDelete,
  isCurrentLocation = false,
  isEditMode = false,
  tempUnit = 'C',
}) => {
  const iconCode = weatherData.weather?.[0]?.icon;
  const conditionMain = weatherData.weather?.[0]?.main;
  const conditionDesc = weatherData.weather?.[0]?.description || '';
  const theme = getWeatherTheme(
    iconCode,
    conditionMain,
    weatherData.sys,
    weatherData.dt,
    conditionDesc
  );

  const driftAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const drift = Animated.loop(
      Animated.sequence([
        Animated.timing(driftAnim, {
          toValue: -26,
          duration: 20000,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(driftAnim, {
          toValue: 0,
          duration: 20000,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    drift.start();
    return () => drift.stop();
  }, [driftAnim]);

  const getCityLocalTime = (timezoneSec?: number) => {
    const now = new Date();
    if (typeof timezoneSec === 'number') {
      const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
      const cityDate = new Date(utcMs + timezoneSec * 1000);
      const h = cityDate.getHours().toString().padStart(2, '0');
      const m = cityDate.getMinutes().toString().padStart(2, '0');
      return `${h}:${m}`;
    }
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const formattedCondition = getFormattedCondition(iconCode, conditionDesc);
  const mainTitle = isCurrentLocation ? 'Vị trí của tôi' : weatherData.name;
  const subtitle = isCurrentLocation
    ? weatherData.subLocation || weatherData.name
    : getCityLocalTime(weatherData.timezone);

  const convertTemp = (tempC: number) => {
    if (tempUnit === 'F') {
      return Math.round((tempC * 9) / 5 + 32);
    }
    return Math.round(tempC);
  };

  const temp = convertTemp(weatherData.main?.temp || 0);
  const tempMax = convertTemp(weatherData.main?.temp_max ?? (weatherData.main?.temp || 0));
  const tempMin = convertTemp(weatherData.main?.temp_min ?? ((weatherData.main?.temp || 0) - 5));

  const renderLiveRainOverlay = () => {
    const rainDrops = [
      { x: 20, len: 26, strokeWidth: 1.8, delay: 50, dur: 650, opacity: 0.9 },
      { x: 45, len: 18, strokeWidth: 1.2, delay: 350, dur: 800, opacity: 0.6 },
      { x: 70, len: 28, strokeWidth: 1.9, delay: 150, dur: 620, opacity: 0.95 },
      { x: 95, len: 24, strokeWidth: 1.7, delay: 100, dur: 680, opacity: 0.85 },
      { x: 120, len: 20, strokeWidth: 1.3, delay: 450, dur: 780, opacity: 0.65 },
      { x: 145, len: 30, strokeWidth: 2.0, delay: 250, dur: 600, opacity: 0.95 },
      { x: 175, len: 26, strokeWidth: 1.8, delay: 300, dur: 640, opacity: 0.9 },
      { x: 200, len: 18, strokeWidth: 1.2, delay: 80, dur: 820, opacity: 0.6 },
      { x: 225, len: 25, strokeWidth: 1.7, delay: 520, dur: 660, opacity: 0.85 },
      { x: 255, len: 24, strokeWidth: 1.6, delay: 120, dur: 700, opacity: 0.85 },
      { x: 280, len: 20, strokeWidth: 1.3, delay: 480, dur: 760, opacity: 0.65 },
      { x: 305, len: 28, strokeWidth: 1.9, delay: 280, dur: 630, opacity: 0.95 },
      { x: 335, len: 26, strokeWidth: 1.8, delay: 320, dur: 650, opacity: 0.9 },
      { x: 360, len: 18, strokeWidth: 1.2, delay: 60, dur: 800, opacity: 0.6 },
      { x: 380, len: 26, strokeWidth: 1.8, delay: 420, dur: 640, opacity: 0.9 },
    ];

    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {rainDrops.map((d, i) => (
          <CardRainDrop
            key={i}
            startX={d.x}
            delay={d.delay}
            duration={d.dur}
            length={d.len}
            opacity={d.opacity}
            strokeWidth={d.strokeWidth}
          />
        ))}
      </View>
    );
  };

  const renderLiveSunOverlay = () => {
    if (Platform.OS === 'web') {
      return (
        <svg
          width="100%"
          height="100%"
          style={{ position: 'absolute', top: 0, left: 0 }}
          preserveAspectRatio="none"
        >
          <defs>
            <radialGradient id="sunCoreGlowBright" cx="84%" cy="-4%" r="80%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
              <stop offset="18%" stopColor="#fffbeb" stopOpacity="0.85" />
              <stop offset="38%" stopColor="#fef08a" stopOpacity="0.45" />
              <stop offset="65%" stopColor="#60a5fa" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
            </radialGradient>

            <linearGradient id="sunRayBeam1" x1="88%" y1="0%" x2="10%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.48" />
              <stop offset="30%" stopColor="#fef9c3" stopOpacity="0.28" />
              <stop offset="70%" stopColor="#bae6fd" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="sunRayBeam2" x1="95%" y1="0%" x2="45%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.42" />
              <stop offset="40%" stopColor="#fef08a" stopOpacity="0.22" />
              <stop offset="80%" stopColor="#38bdf8" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>

            <style>
              {`
                @keyframes sunPulseAnimation {
                  0% { opacity: 0.88; transform: scale(1); }
                  50% { opacity: 1; transform: scale(1.03); }
                  100% { opacity: 0.88; transform: scale(1); }
                }
                .sun-pulsing {
                  animation: sunPulseAnimation 5s ease-in-out infinite;
                  transform-origin: 84% 0%;
                }
              `}
            </style>
          </defs>

          <rect width="100%" height="100%" fill="url(#sunCoreGlowBright)" className="sun-pulsing" />
          <polygon points="260,-10 380,-10 160,140 40,140" fill="url(#sunRayBeam1)" />
          <polygon points="320,-10 395,-10 290,140 190,140" fill="url(#sunRayBeam2)" />
        </svg>
      );
    }

    return (
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="sunCoreGlowBright" cx="84%" cy="-4%" rx="80%" ry="80%">
            <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
            <Stop offset="18%" stopColor="#fffbeb" stopOpacity="0.85" />
            <Stop offset="38%" stopColor="#fef08a" stopOpacity="0.45" />
            <Stop offset="65%" stopColor="#60a5fa" stopOpacity="0.18" />
            <Stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
          </RadialGradient>
          <SvgLinearGradient id="sunRayBeam1" x1="88%" y1="0%" x2="10%" y2="100%">
            <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.48" />
            <Stop offset="30%" stopColor="#fef9c3" stopOpacity="0.28" />
            <Stop offset="70%" stopColor="#bae6fd" stopOpacity="0.1" />
            <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </SvgLinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#sunCoreGlowBright)" />
        <Polygon points="260,-10 380,-10 160,140 40,140" fill="url(#sunRayBeam1)" />
      </Svg>
    );
  };

  const renderCardSkyBackground = (weatherType: WeatherType) => {
    const bgImage = weatherImages[weatherType] || weatherImages.cloud;
    const overlayColors = theme.overlayColors;

    return (
      <View style={[StyleSheet.absoluteFill, { overflow: 'hidden', borderRadius: 18 }]}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              width: '118%',
              height: '100%',
              transform: [{ translateX: driftAnim }],
            },
          ]}
        >
          <ImageBackground
            source={bgImage}
            style={styles.cardImageBg}
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

        {weatherType === 'sun' && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {renderLiveSunOverlay()}
          </View>
        )}

        {weatherType === 'rain' && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {renderLiveRainOverlay()}
          </View>
        )}
      </View>
    );
  };

  if (isEditMode) {
    if (isCurrentLocation) {
      return (
        <View style={styles.cardContainer}>
          <View style={[styles.cardContentWrapper, styles.editCardContentWrapper]}>
            {renderCardSkyBackground(theme.weatherType)}
            <View style={styles.editCardRow}>
              <View style={styles.leftInfo}>
                <Text style={[styles.mainTitle, styles.editMainTitle]} numberOfLines={1}>
                  {mainTitle}
                </Text>
                {subtitle ? (
                  <Text style={styles.subtitle} numberOfLines={1}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>
              <Text style={[styles.tempText, styles.editTempText]}>{temp}°</Text>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.editRowContainer}>
        <TouchableOpacity
          style={styles.redMinusButton}
          onPress={onDelete}
          activeOpacity={0.7}
        >
          <View style={styles.minusLine} />
        </TouchableOpacity>

        <View style={[styles.cardContainer, styles.editCardContainer]}>
          <View style={[styles.cardContentWrapper, styles.editCardContentWrapper]}>
            {renderCardSkyBackground(theme.weatherType)}
            <View style={styles.editCardRow}>
              <View style={styles.leftInfo}>
                <Text style={[styles.mainTitle, styles.editMainTitle]} numberOfLines={1}>
                  {mainTitle}
                </Text>
                {subtitle ? (
                  <Text style={styles.subtitle} numberOfLines={1}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>
              <Text style={[styles.tempText, styles.editTempText]}>{temp}°</Text>
            </View>
          </View>
        </View>

        <View style={styles.dragHandleWrapper}>
          <View style={styles.dragLine} />
          <View style={styles.dragLine} />
          <View style={styles.dragLine} />
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.cardContainer}
    >
      <View style={styles.cardContentWrapper}>
        {renderCardSkyBackground(theme.weatherType)}

        <View style={styles.topRow}>
          <View style={styles.leftInfo}>
            <Text style={styles.mainTitle} numberOfLines={1}>
              {mainTitle}
            </Text>
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          <Text style={styles.tempText}>{temp}°</Text>
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.conditionText} numberOfLines={1}>
            {formattedCondition}
          </Text>
          <Text style={styles.minMaxText}>
            C:{tempMax}° T:{tempMin}°
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 16,
    marginVertical: 5,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  cardContentWrapper: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    minHeight: 118,
    justifyContent: 'space-between',
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  cardImageBg: {
    width: '100%',
    height: '100%',
  },
  editRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 4.5,
  },
  redMinusButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  minusLine: {
    width: 10,
    height: 2.2,
    backgroundColor: '#ffffff',
    borderRadius: 1,
  },
  dragHandleWrapper: {
    marginLeft: 10,
    width: 20,
    height: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 1,
  },
  dragLine: {
    width: 18,
    height: 1.8,
    backgroundColor: '#636366',
    borderRadius: 1,
  },
  editCardContainer: {
    flex: 1,
    marginHorizontal: 0,
    marginVertical: 0,
    borderRadius: 18,
    shadowOpacity: 0,
    elevation: 0,
  },
  editCardContentWrapper: {
    minHeight: 68,
    height: 68,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
    borderRadius: 18,
  },
  editCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 2,
  },
  leftInfo: {
    flex: 1,
    paddingRight: 10,
  },
  mainTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  editMainTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tempText: {
    color: '#ffffff',
    fontSize: 48,
    fontWeight: '200',
    lineHeight: 52,
    letterSpacing: -1,
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  editTempText: {
    fontSize: 38,
    fontWeight: '300',
    lineHeight: 40,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 10,
    zIndex: 2,
  },
  conditionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  minMaxText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
