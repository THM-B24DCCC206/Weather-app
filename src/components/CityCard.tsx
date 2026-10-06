import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ImageBackground } from 'react-native';
import { CurrentWeatherData } from '../types/weather';
import { getWeatherTheme } from '../api/weatherApi';

const weatherImages = {
  cloud: require('../../assets/weather/clouds.jpg'),
  rain: require('../../assets/weather/rain.jpg'),
  sun: require('../../assets/weather/sun.jpg'),
  night: require('../../assets/weather/night.jpg'),
};

interface CityCardProps {
  weatherData: CurrentWeatherData;
  onPress: () => void;
  onLongPress?: () => void;
  isCurrentLocation?: boolean;
}

export const CityCard: React.FC<CityCardProps> = ({
  weatherData,
  onPress,
  onLongPress,
  isCurrentLocation = false,
}) => {
  const iconCode = weatherData.weather?.[0]?.icon;
  const conditionMain = weatherData.weather?.[0]?.main;
  const conditionDesc = weatherData.weather?.[0]?.description || '';
  const theme = getWeatherTheme(iconCode, conditionMain, weatherData.sys, weatherData.dt);

  const formattedCondition =
    conditionDesc.charAt(0).toUpperCase() + conditionDesc.slice(1);

  const mainTitle = isCurrentLocation ? 'Vị trí của tôi' : weatherData.name;
  const subtitle = isCurrentLocation
    ? weatherData.subLocation || weatherData.name
    : weatherData.sys?.country || '';

  const temp = Math.round(weatherData.main?.temp || 0);
  const tempMax = Math.round(weatherData.main?.temp_max || 0);
  const tempMin = Math.round(weatherData.main?.temp_min || 0);

  const bgImage = weatherImages[theme.weatherType] || weatherImages.cloud;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.cardContainer}
    >
      <ImageBackground
        source={bgImage}
        style={styles.cardBgImage}
        imageStyle={styles.cardImageStyle}
        resizeMode="cover"
      >
        {/* Lớp phủ mờ tối sâu giúp chữ hiển thị cực kỳ sắc nét */}
        <View style={styles.cardOverlay}>
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
              C:{tempMax}°  T:{tempMin}°
            </Text>
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 16,
    marginVertical: 7,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    overflow: 'hidden',
  },
  cardBgImage: {
    width: '100%',
    minHeight: 118,
  },
  cardImageStyle: {
    borderRadius: 20,
  },
  cardOverlay: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 18,
    minHeight: 118,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 32, 54, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 3,
  },
  subtitle: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tempText: {
    color: '#ffffff',
    fontSize: 48,
    fontWeight: '300',
    lineHeight: 52,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 12,
  },
  conditionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  minMaxText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
