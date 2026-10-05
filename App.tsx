import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { CurrentWeatherData } from './src/types/weather';
import { fetchCurrentWeather, getDetailedAddress } from './src/api/weatherApi';
import { CityListScreen } from './src/screens/CityListScreen';
import { WeatherDetailScreen } from './src/screens/WeatherDetailScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'list' | 'detail'>('list');
  const [currentWeather, setCurrentWeather] = useState<CurrentWeatherData | null>(null);
  const [selectedWeather, setSelectedWeather] = useState<CurrentWeatherData | null>(null);
  const [isCurrentLocationSelected, setIsCurrentLocationSelected] = useState<boolean>(true);
  const [loadingLocation, setLoadingLocation] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadCurrentLocationWeather();
  }, []);

  const loadCurrentLocationWeather = async () => {
    try {
      setLoadingLocation(true);
      setErrorMsg(null);

      // Xin quyền GPS
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Ứng dụng cần quyền vị trí để lấy thông tin thời tiết.');
        setLoadingLocation(false);
        return;
      }

      // Lấy toạ độ GPS
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Lấy thời tiết & tên địa phương chi tiết (Thành phố/Tỉnh) song song
      const [weatherData, subLocation] = await Promise.all([
        fetchCurrentWeather(latitude, longitude),
        getDetailedAddress(latitude, longitude),
      ]);

      const enhancedWeather: CurrentWeatherData = {
        ...weatherData,
        subLocation: subLocation || weatherData.name,
        isCurrentLocation: true,
      };

      setCurrentWeather(enhancedWeather);
    } catch (err: any) {
      console.error('Lỗi khi lấy vị trí / thời tiết:', err);
      setErrorMsg('Không thể tải dữ liệu thời tiết hiện tại.');
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleSelectCity = (weather: CurrentWeatherData, isCurrentLocation: boolean) => {
    setSelectedWeather(weather);
    setIsCurrentLocationSelected(isCurrentLocation);
    setCurrentScreen('detail');
  };

  const handleBackToList = () => {
    setCurrentScreen('list');
  };

  if (loadingLocation && !currentWeather) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Đang lấy vị trí & dữ liệu thời tiết...</Text>
      </View>
    );
  }

  if (currentScreen === 'detail' && (selectedWeather || currentWeather)) {
    return (
      <WeatherDetailScreen
        weatherData={(selectedWeather || currentWeather)!}
        isCurrentLocation={isCurrentLocationSelected}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <CityListScreen
      currentWeather={currentWeather}
      onSelectCity={handleSelectCity}
      onRefreshCurrentLocation={loadCurrentLocationWeather}
      loadingLocation={loadingLocation}
    />
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