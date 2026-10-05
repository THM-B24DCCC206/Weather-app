import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Search, Mic, MoreHorizontal, X, MapPin, Plus, Trash2 } from 'lucide-react-native';
import { CurrentWeatherData, CitySearchResult } from '../types/weather';
import { CityCard } from '../components/CityCard';
import { searchCities, fetchWeatherByCity, fetchCurrentWeather, getDetailedAddress } from '../api/weatherApi';

const STORAGE_KEY_CITIES = '@weather_saved_cities';

interface CityListScreenProps {
  currentWeather: CurrentWeatherData | null;
  onSelectCity: (weather: CurrentWeatherData, isCurrentLocation: boolean) => void;
  onRefreshCurrentLocation: () => Promise<void>;
  loadingLocation: boolean;
}

export const CityListScreen: React.FC<CityListScreenProps> = ({
  currentWeather,
  onSelectCity,
  onRefreshCurrentLocation,
  loadingLocation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CitySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [savedCitiesWeather, setSavedCitiesWeather] = useState<CurrentWeatherData[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSavedCities();
  }, []);

  // Tải danh sách các thành phố đã lưu từ AsyncStorage
  const loadSavedCities = async () => {
    try {
      const savedJson = await AsyncStorage.getItem(STORAGE_KEY_CITIES);
      if (savedJson) {
        const cityNames: string[] = JSON.parse(savedJson);
        const results = await Promise.allSettled(
          cityNames.map((city) => fetchWeatherByCity(city))
        );
        const validCities: CurrentWeatherData[] = [];
        results.forEach((res) => {
          if (res.status === 'fulfilled' && res.value) {
            validCities.push(res.value);
          }
        });
        setSavedCitiesWeather(validCities);
      }
    } catch (error) {
      console.warn('Lỗi tải danh sách thành phố:', error);
    }
  };

  // Lưu danh sách tên thành phố vào AsyncStorage
  const saveCitiesToStorage = async (cities: CurrentWeatherData[]) => {
    try {
      const names = cities.map((c) => c.name);
      await AsyncStorage.setItem(STORAGE_KEY_CITIES, JSON.stringify(names));
    } catch (error) {
      console.warn('Lỗi lưu danh sách:', error);
    }
  };

  // Tìm kiếm thành phố khi gõ
  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchCities(text);
      setSearchResults(results);
    } catch (error) {
      console.warn('Lỗi tìm kiếm thành phố:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Chọn thành phố từ kết quả tìm kiếm
  const handleSelectSearchResult = async (item: CitySearchResult) => {
    Keyboard.dismiss();
    setSearchQuery('');
    setSearchResults([]);

    try {
      const weather = await fetchWeatherByCity(item.name);
      // Kiểm tra xem đã có trong danh sách chưa
      const exists = savedCitiesWeather.some(
        (c) => c.name.toLowerCase() === weather.name.toLowerCase()
      );
      if (!exists) {
        const updated = [...savedCitiesWeather, weather];
        setSavedCitiesWeather(updated);
        await saveCitiesToStorage(updated);
      }
      onSelectCity(weather, false);
    } catch (error) {
      Alert.alert('Thông báo', 'Không thể lấy dữ liệu thời tiết của thành phố này.');
    }
  };

  // Xóa thành phố đã lưu
  const handleDeleteCity = (cityName: string) => {
    Alert.alert('Xoá thành phố', `Bạn có muốn xoá "${cityName}" khỏi danh sách?`, [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          const updated = savedCitiesWeather.filter((c) => c.name !== cityName);
          setSavedCitiesWeather(updated);
          await saveCitiesToStorage(updated);
        },
      },
    ]);
  };

  // Kéo để làm mới toàn bộ
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([onRefreshCurrentLocation(), loadSavedCities()]);
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Thời tiết</Text>
        <TouchableOpacity
          style={styles.moreButton}
          activeOpacity={0.7}
          onPress={() => {
            Alert.alert('Cài đặt', 'Weather App - Clone Apple Weather\nĐơn vị: °C (Celsius)');
          }}
        >
          <MoreHorizontal size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color="#8e8e93" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm tên thành phố/sân bay"
            placeholderTextColor="#8e8e93"
            value={searchQuery}
            onChangeText={handleSearch}
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <X size={16} color="#8e8e93" />
            </TouchableOpacity>
          ) : (
            <Mic size={18} color="#8e8e93" />
          )}
        </View>
      </View>

      {/* Gợi ý kết quả tìm kiếm nếu đang gõ */}
      {searchQuery.trim().length > 0 && (
        <View style={styles.searchResultsContainer}>
          {isSearching ? (
            <ActivityIndicator size="small" color="#ffffff" style={{ marginVertical: 15 }} />
          ) : searchResults.length > 0 ? (
            <ScrollView keyboardShouldPersistTaps="handled">
              {searchResults.map((item, idx) => (
                <TouchableOpacity
                  key={`${item.lat}-${item.lon}-${idx}`}
                  style={styles.searchResultItem}
                  onPress={() => handleSelectSearchResult(item)}
                >
                  <MapPin size={18} color="#94a3b8" style={{ marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.searchCityName}>{item.name}</Text>
                    <Text style={styles.searchCityState}>
                      {[item.state, item.country].filter(Boolean).join(', ')}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.noResultsText}>Không tìm thấy kết quả phù hợp</Text>
          )}
        </View>
      )}

      {/* Danh sách thẻ thời tiết */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || loadingLocation}
            onRefresh={handleRefresh}
            tintColor="#ffffff"
          />
        }
      >
        {/* Thẻ Vị trí của tôi (GPS) */}
        {currentWeather ? (
          <CityCard
            weatherData={currentWeather}
            isCurrentLocation={true}
            onPress={() => onSelectCity(currentWeather, true)}
          />
        ) : (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color="#ffffff" />
            <Text style={styles.loadingCardText}>Đang định vị...</Text>
          </View>
        )}

        {/* Danh sách các thành phố đã lưu */}
        {savedCitiesWeather.map((cityWeather) => (
          <CityCard
            key={cityWeather.name}
            weatherData={cityWeather}
            isCurrentLocation={false}
            onPress={() => onSelectCity(cityWeather, false)}
            onLongPress={() => handleDeleteCity(cityWeather.name)}
          />
        ))}

        {/* Footer ghi chú */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            Tìm hiểu thêm về{' '}
            <Text style={styles.footerLink}>dữ liệu thời tiết</Text> và{' '}
            <Text style={styles.footerLink}>dữ liệu bản đồ</Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.35,
  },
  moreButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    height: '100%',
  },
  searchResultsContainer: {
    marginHorizontal: 16,
    backgroundColor: '#1c1c1e',
    borderRadius: 14,
    maxHeight: 220,
    marginBottom: 10,
    paddingVertical: 6,
    zIndex: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchCityName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  searchCityState: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 2,
  },
  noResultsText: {
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 16,
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  loadingCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    height: 110,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  loadingCardText: {
    color: '#94a3b8',
    fontSize: 15,
  },
  footerContainer: {
    marginTop: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#8e8e93',
    fontSize: 12,
    textAlign: 'center',
  },
  footerLink: {
    color: '#8e8e93',
    textDecorationLine: 'underline',
  },
});
