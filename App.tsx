import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import {
  CurrentWeatherData,
  WeatherUnitsSettings,
  DEFAULT_WEATHER_UNITS,
} from './src/types/weather';
import {
  fetchCurrentWeather,
  fetchWeatherByCity,
  fetchWeatherByCoordinates,
  getDetailedAddress,
} from './src/api/weatherApi';
import { CityListScreen } from './src/screens/CityListScreen';
import { WeatherDetailScreen } from './src/screens/WeatherDetailScreen';
import { WeatherMapScreen } from './src/screens/WeatherMapScreen';

const STORAGE_KEY_CITIES = '@weather_saved_cities';
const STORAGE_KEY_UNITS = '@weather_units_settings';

interface SavedCity {
  name: string;
  lat: number;
  lon: number;
}

const DEFAULT_LOCATION = {
  latitude: 21.0285,
  longitude: 105.8542,
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'list' | 'detail'>('list');
  const [isMapOpen, setIsMapOpen] = useState<boolean>(false);

  const [currentWeather, setCurrentWeather] =
    useState<CurrentWeatherData | null>(null);

  const [savedCitiesWeather, setSavedCitiesWeather] = useState<
    CurrentWeatherData[]
  >([]);

  const [selectedCityIndex, setSelectedCityIndex] = useState<number>(0);

  const [units, setUnits] = useState<WeatherUnitsSettings>(DEFAULT_WEATHER_UNITS);

  const [loadingLocation, setLoadingLocation] =
    useState<boolean>(true);

  const [_errorMsg, setErrorMsg] =
    useState<string | null>(null);

  useEffect(() => {
    loadCurrentLocationWeather();
    loadSavedCities();
    loadUnits();
  }, []);

  const loadUnits = async () => {
    try {
      const savedUnitsJson = await AsyncStorage.getItem(STORAGE_KEY_UNITS);
      if (savedUnitsJson) {
        setUnits(JSON.parse(savedUnitsJson));
      }
    } catch (error) {
      console.warn('Lỗi tải cài đặt đơn vị:', error);
    }
  };

  const handleUpdateUnits = async (newUnits: WeatherUnitsSettings) => {
    setUnits(newUnits);
    try {
      await AsyncStorage.setItem(STORAGE_KEY_UNITS, JSON.stringify(newUnits));
    } catch (error) {
      console.warn('Lỗi lưu cài đặt đơn vị:', error);
    }
  };

  const loadSavedCities = async () => {
    try {
      const savedJson = await AsyncStorage.getItem(STORAGE_KEY_CITIES);
      if (!savedJson) return;

      const savedCities: Array<SavedCity | string> = JSON.parse(savedJson);
      const results = await Promise.allSettled(
        savedCities.map((city) =>
          typeof city === 'string'
            ? fetchWeatherByCity(city)
            : fetchWeatherByCoordinates(city.lat, city.lon)
        )
      );
      const validCities: CurrentWeatherData[] = [];
      results.forEach((res) => {
        if (res.status === 'fulfilled' && res.value) {
          validCities.push(res.value);
        }
      });
      setSavedCitiesWeather(validCities);
    } catch (error) {
      console.warn('Lỗi tải danh sách thành phố:', error);
    }
  };

  const handleSaveCities = async (cities: CurrentWeatherData[]) => {
    setSavedCitiesWeather(cities);
    try {
      const savedCities: SavedCity[] = cities.map((city) => ({
        name: city.name,
        lat: city.coord.lat,
        lon: city.coord.lon,
      }));
      await AsyncStorage.setItem(
        STORAGE_KEY_CITIES,
        JSON.stringify(savedCities)
      );
    } catch (error) {
      console.warn('Lỗi lưu danh sách thành phố:', error);
    }
  };

  const loadCurrentLocationWeather = async () => {
    try {
      setLoadingLocation(true);
      setErrorMsg(null);

      let latitude = DEFAULT_LOCATION.latitude;
      let longitude = DEFAULT_LOCATION.longitude;

      try {
        const { status } =
          await Location.requestForegroundPermissionsAsync();

        if (status === 'granted') {
          let location =
            await Location.getLastKnownPositionAsync({
              maxAge: 5 * 60 * 1000,
              requiredAccuracy: 1000,
            });

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

      const weatherData =
        await fetchCurrentWeather(
          latitude,
          longitude
        );

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

  const allCities: {
    weather: CurrentWeatherData;
    isCurrentLocation: boolean;
  }[] = [
    ...(currentWeather
      ? [{ weather: currentWeather, isCurrentLocation: true }]
      : []),
    ...savedCitiesWeather.map((c) => ({
      weather: c,
      isCurrentLocation: false,
    })),
  ];

  const safeIndex =
    allCities.length > 0
      ? Math.min(Math.max(0, selectedCityIndex), allCities.length - 1)
      : 0;

  const activeCity =
    allCities[safeIndex] ||
    (currentWeather
      ? { weather: currentWeather, isCurrentLocation: true }
      : null);

  const handleSelectCity = (
    _weather: CurrentWeatherData,
    _isCurrentLocation: boolean,
    cityIndex: number
  ) => {
    setSelectedCityIndex(cityIndex);
    setCurrentScreen('detail');
  };

  const handleSelectCityIndex = (index: number) => {
    if (index >= 0 && index < allCities.length) {
      setSelectedCityIndex(index);
    }
  };

  const handleBackToList = () => {
    setCurrentScreen('list');
  };

  const handleOpenMap = () => {
    setIsMapOpen(true);
  };

  const handleCloseMap = () => {
    setIsMapOpen(false);
  };

  if (loadingLocation && !currentWeather && savedCitiesWeather.length === 0) {
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

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      {currentScreen === 'detail' && activeCity ? (
        <WeatherDetailScreen
          cities={allCities}
          initialCityIndex={safeIndex}
          onBack={handleBackToList}
          onOpenMap={handleOpenMap}
          onSelectCityIndex={handleSelectCityIndex}
          units={units}
        />
      ) : (
        <CityListScreen
          currentWeather={currentWeather}
          savedCitiesWeather={savedCitiesWeather}
          units={units}
          onUpdateUnits={handleUpdateUnits}
          onSelectCity={handleSelectCity}
          onRefreshCurrentLocation={loadCurrentLocationWeather}
          onRefreshSavedCities={loadSavedCities}
          onSaveCities={handleSaveCities}
          loadingLocation={loadingLocation}
          onOpenMap={handleOpenMap}
        />
      )}

      <Modal
        visible={isMapOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleCloseMap}
        statusBarTranslucent
      >
        <WeatherMapScreen onBack={handleCloseMap} />
      </Modal>
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
});