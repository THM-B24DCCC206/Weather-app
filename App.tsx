import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import * as Location from 'expo-location';
import { CurrentWeatherData } from './src/types/weather';
import { fetchCurrentWeather, getDetailedAddress } from './src/api/weatherApi';
import { CityListScreen } from './src/screens/CityListScreen';
import { WeatherDetailScreen } from './src/screens/WeatherDetailScreen';
import { WeatherMapScreen } from './src/screens/WeatherMapScreen';

// Vị trí mặc định: Hà Nội
const DEFAULT_LOCATION = {
  latitude: 21.0285,
  longitude: 105.8542,
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<
    'list' | 'detail' | 'map'
  >('list');

  const [currentWeather, setCurrentWeather] =
    useState<CurrentWeatherData | null>(null);

  const [selectedWeather, setSelectedWeather] =
    useState<CurrentWeatherData | null>(null);

  const [isCurrentLocationSelected, setIsCurrentLocationSelected] =
    useState<boolean>(true);

  const [loadingLocation, setLoadingLocation] =
    useState<boolean>(true);

  const [errorMsg, setErrorMsg] =
    useState<string | null>(null);

  useEffect(() => {
    loadCurrentLocationWeather();
  }, []);

  const loadCurrentLocationWeather = async () => {
    try {
      setLoadingLocation(true);
      setErrorMsg(null);

      let latitude = DEFAULT_LOCATION.latitude;
      let longitude = DEFAULT_LOCATION.longitude;

      // Thử xin quyền GPS
      try {
        const { status } =
          await Location.requestForegroundPermissionsAsync();

        if (status === 'granted') {
          // Thử lấy vị trí đã lưu gần nhất
          let location =
            await Location.getLastKnownPositionAsync({
              maxAge: 5 * 60 * 1000,
              requiredAccuracy: 1000,
            });

          // Nếu không có vị trí đã lưu thì thử lấy GPS hiện tại
          if (!location) {
            location =
              await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
              });
          }

          if (location) {
            latitude = location.coords.latitude;
            longitude = location.coords.longitude;

            console.log(
              'Tọa độ GPS:',
              latitude,
              longitude
            );
          }
        } else {
          console.log(
            'Không được cấp quyền GPS. Sử dụng vị trí mặc định Hà Nội.'
          );
        }
      } catch (locationError) {
        console.warn(
          'Không lấy được GPS. Sử dụng vị trí mặc định Hà Nội:',
          locationError
        );
      }

      // Lấy thời tiết
      const weatherData =
        await fetchCurrentWeather(
          latitude,
          longitude
        );

      // Lấy tên địa phương
      let subLocation = '';

      try {
        subLocation =
          await getDetailedAddress(
            latitude,
            longitude
          );
      } catch (addressError) {
        console.warn(
          'Không lấy được tên địa phương:',
          addressError
        );
      }

      const enhancedWeather: CurrentWeatherData = {
        ...weatherData,
        subLocation:
          subLocation ||
          weatherData.name ||
          'Hà Nội',
        isCurrentLocation: true,
      };

      setCurrentWeather(enhancedWeather);

      console.log(
        'Thời tiết đã tải thành công:',
        weatherData.name,
        weatherData.main?.temp
      );
    } catch (err: any) {
      console.error(
        'Lỗi khi lấy dữ liệu thời tiết:',
        err
      );

      setErrorMsg(
        'Không thể tải dữ liệu thời tiết.'
      );
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleSelectCity = (
    weather: CurrentWeatherData,
    isCurrentLocation: boolean
  ) => {
    setSelectedWeather(weather);
    setIsCurrentLocationSelected(isCurrentLocation);
    setCurrentScreen('detail');
  };

  const handleBackToList = () => {
    setCurrentScreen('list');
  };

  // MỞ BẢN ĐỒ
  const handleOpenMap = () => {
    setCurrentScreen('map');
  };

  if (loadingLocation && !currentWeather) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#ffffff"
        />

        <Text style={styles.loadingText}>
          Đang lấy vị trí & dữ liệu thời tiết...
        </Text>
      </View>
    );
  }

  // MÀN HÌNH BẢN ĐỒ
  if (currentScreen === 'map') {
    return (
      <View style={{ flex: 1 }}>
        <WeatherMapScreen />

        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackToList}
        >
          <Text style={styles.backButtonText}>
            ← Danh sách
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (
    currentScreen === 'detail' &&
    (selectedWeather || currentWeather)
  ) {
    return (
      <WeatherDetailScreen
        weatherData={
          (selectedWeather || currentWeather)!
        }
        isCurrentLocation={
          isCurrentLocationSelected
        }
        onBack={handleBackToList}
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <CityListScreen
        currentWeather={currentWeather}
        onSelectCity={handleSelectCity}
        onRefreshCurrentLocation={
          loadCurrentLocationWeather
        }
        loadingLocation={loadingLocation}
      />

      {/* NÚT MỞ BẢN ĐỒ */}
      <TouchableOpacity
        style={styles.mapButton}
        onPress={handleOpenMap}
      >
        <Text style={styles.mapButtonText}>
          🗺️ Bản đồ
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  loadingText: {
    color: '#ffffff',
    marginTop: 14,
    fontSize: 15,
  },

  mapButton: {
    position: 'absolute',
    right: 20,
    bottom: 25,
    backgroundColor: '#222222',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 25,
    zIndex: 999,
    elevation: 20,
  },

  mapButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 18,
  },

  backButton: {
    position: 'absolute',
    top: 55,
    left: 18,
    backgroundColor: '#ffffff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },

  backButtonText: {
    color: '#222222',
    fontWeight: '600',
    fontSize: 14,
  },
});