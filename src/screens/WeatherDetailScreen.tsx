import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  List,
  ChevronLeft,
  Compass,
  Droplets,
  Wind,
  Eye,
  Sunrise,
  Gauge,
  Calendar,
  Clock,
  Map as MapIcon,
  Navigation,
} from 'lucide-react-native';
import { CurrentWeatherData, ForecastData, ForecastItem } from '../types/weather';
import {
  fetchForecast,
  fetchForecastByCity,
  getWeatherTheme,
  formatForecastHour,
  formatForecastDay,
} from '../api/weatherApi';
import { WeatherIcon } from '../components/WeatherIcon';
import { WeatherBackground } from '../components/WeatherBackground';

const { width } = Dimensions.get('window');

interface WeatherDetailScreenProps {
  weatherData: CurrentWeatherData;
  isCurrentLocation?: boolean;
  onBack: () => void;
}

export const WeatherDetailScreen: React.FC<WeatherDetailScreenProps> = ({
  weatherData,
  isCurrentLocation = false,
  onBack,
}) => {
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loadingForecast, setLoadingForecast] = useState(true);

  useEffect(() => {
    loadForecastData();
  }, [weatherData]);

  const loadForecastData = async () => {
    try {
      setLoadingForecast(true);
      let data: ForecastData;
      if (weatherData.coord?.lat && weatherData.coord?.lon) {
        data = await fetchForecast(weatherData.coord.lat, weatherData.coord.lon);
      } else {
        data = await fetchForecastByCity(weatherData.name);
      }
      setForecast(data);
    } catch (error) {
      console.warn('Lỗi tải dữ liệu dự báo:', error);
    } finally {
      setLoadingForecast(false);
    }
  };

  const iconCode = weatherData.weather?.[0]?.icon;
  const conditionMain = weatherData.weather?.[0]?.main;
  const conditionDesc = weatherData.weather?.[0]?.description || '';
  const theme = getWeatherTheme(iconCode, conditionMain);

  // Viết hoa chữ cái đầu cho mô tả
  const formattedCondition =
    conditionDesc.charAt(0).toUpperCase() + conditionDesc.slice(1);

  const mainTitle = isCurrentLocation ? 'Vị trí của tôi' : weatherData.name;
  const subLocation = isCurrentLocation
    ? (weatherData.subLocation || weatherData.name).toUpperCase()
    : (weatherData.sys?.country || '').toUpperCase();

  const temp = Math.round(weatherData.main?.temp || 0);
  const tempMax = Math.round(weatherData.main?.temp_max || 0);
  const tempMin = Math.round(weatherData.main?.temp_min || 0);
  const feelsLike = Math.round(weatherData.main?.feels_like || 0);
  const humidity = weatherData.main?.humidity || 0;
  const windSpeed = weatherData.wind?.speed || 0;
  const pressure = weatherData.main?.pressure || 1013;
  const visibilityKm = weatherData.visibility
    ? (weatherData.visibility / 1000).toFixed(1)
    : '10';

  // Lấy dự báo 24 giờ tiếp theo
  const hourlyList = forecast?.list?.slice(0, 9) || [];

  // Tạo dòng tóm tắt thông minh cho thẻ theo giờ (như Apple Weather)
  let hourlySummary = `Dự báo ${conditionDesc.toLowerCase()} trong những giờ tới.`;
  if (hourlyList.length > 2) {
    const nextChange = hourlyList.slice(1).find(
      (item) => item.weather?.[0]?.description !== conditionDesc
    );
    if (nextChange) {
      const changeHour = formatForecastHour(nextChange.dt_txt, 1);
      hourlySummary = `Dự báo ${nextChange.weather?.[0]?.description.toLowerCase()} vào khoảng ${changeHour}.`;
    }
  }

  // Gom nhóm dự báo theo ngày (5 ngày tới)
  const dailyList: { day: string; min: number; max: number; icon: string; desc: string }[] = [];
  if (forecast?.list) {
    const grouped: { [key: string]: ForecastItem[] } = {};
    forecast.list.forEach((item) => {
      const dateKey = item.dt_txt.split(' ')[0];
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(item);
    });

    Object.keys(grouped).forEach((dateKey, idx) => {
      const items = grouped[dateKey];
      const temps = items.map((i) => i.main.temp);
      const min = Math.round(Math.min(...temps));
      const max = Math.round(Math.max(...temps));
      const middleItem = items[Math.floor(items.length / 2)];
      dailyList.push({
        day: formatForecastDay(middleItem.dt_txt, idx),
        min,
        max,
        icon: middleItem.weather?.[0]?.icon || '01d',
        desc: middleItem.weather?.[0]?.description || '',
      });
    });
  }

  const formatSunTime = (timestamp?: number) => {
    if (!timestamp) return '--:--';
    const date = new Date(timestamp * 1000);
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  // Màu thẻ kính tối chuyển sắc sâu chuẩn Apple iOS Weather
  const cardStyle = {
    backgroundColor:
      theme.weatherType === 'cloud' || theme.weatherType === 'sun'
        ? 'rgba(24, 49, 79, 0.58)'
        : 'rgba(15, 23, 42, 0.68)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  };

  return (
    <WeatherBackground weatherType={theme.weatherType}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={styles.safeArea}>
        {/* Top Header Navigation */}
        <View style={styles.topNav}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft size={28} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Thông tin thời tiết lớn */}
          <View style={styles.heroSection}>
            <Text style={styles.mainTitle}>{mainTitle}</Text>
            {subLocation ? <Text style={styles.subLocation}>{subLocation}</Text> : null}
            <Text style={styles.tempText}>{temp}°</Text>
            <Text style={styles.conditionText}>{formattedCondition}</Text>
            <Text style={styles.minMaxText}>
              C:{tempMax}°  T:{tempMin}°
            </Text>
          </View>

          {/* 1. Dự báo theo giờ (Hourly Forecast cuộn ngang) */}
          <View style={[styles.cardWrapper, cardStyle]}>
            <Text style={styles.hourlySummaryText}>{hourlySummary}</Text>

            {loadingForecast ? (
              <ActivityIndicator size="small" color="#ffffff" style={{ marginVertical: 20 }} />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hourlyScrollContent}
              >
                {hourlyList.map((item, index) => {
                  const hourText = formatForecastHour(item.dt_txt, index);
                  const itemTemp = Math.round(item.main.temp);
                  const itemIcon = item.weather?.[0]?.icon || '01d';
                  const pop = item.pop ? Math.round(item.pop * 100) : 0;

                  return (
                    <View key={item.dt} style={styles.hourlyItem}>
                      <Text style={styles.hourlyTime}>{hourText}</Text>
                      <View style={styles.hourlyIconWrapper}>
                        <WeatherIcon iconCode={itemIcon} size={28} />
                      </View>
                      {pop > 0 ? (
                        <Text style={styles.hourlyPop}>{pop}%</Text>
                      ) : (
                        <View style={{ height: 16 }} />
                      )}
                      <Text style={styles.hourlyTemp}>{itemTemp}°</Text>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {/* 2. Dự báo 5 ngày (5-Day Forecast với icon đầy đặn) */}
          <View style={[styles.cardWrapper, cardStyle]}>
            <View style={styles.cardHeader}>
              <Calendar size={15} color="#cbd5e1" style={{ marginRight: 6 }} />
              <Text style={styles.cardHeaderTitle}>DỰ BÁO 5 NGÀY</Text>
            </View>

            {loadingForecast ? (
              <ActivityIndicator size="small" color="#ffffff" style={{ marginVertical: 20 }} />
            ) : (
              <View style={styles.dailyListContainer}>
                {dailyList.map((item, idx) => (
                  <View key={`${item.day}-${idx}`} style={styles.dailyRow}>
                    <Text style={styles.dailyDayName}>{item.day}</Text>
                    <View style={styles.dailyIconWrapper}>
                      <WeatherIcon iconCode={item.icon} size={24} />
                    </View>
                    <View style={styles.dailyTempRange}>
                      <Text style={styles.dailyMinTemp}>{item.min}°</Text>
                      {/* Thanh dải nhiệt độ Apple Weather */}
                      <View style={styles.tempBarBackground}>
                        <LinearGradient
                          colors={['#38bdf8', '#fbbf24', '#f97316']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.tempBarActive}
                        />
                      </View>
                      <Text style={styles.dailyMaxTemp}>{item.max}°</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 3. Lưới các thẻ chỉ số chi tiết */}
          <View style={styles.gridContainer}>
            {/* Thẻ Độ ẩm & Gió */}
            <View style={[styles.gridCard, cardStyle]}>
              <View style={styles.gridCardHeader}>
                <Droplets size={15} color="#93c5fd" />
                <Text style={styles.gridCardHeaderTitle}>ĐỘ ẨM</Text>
              </View>
              <Text style={styles.gridCardValue}>{humidity}%</Text>
              <Text style={styles.gridCardSub}>Điểm sương hiện tại: {temp - 3}°</Text>
            </View>

            <View style={[styles.gridCard, cardStyle]}>
              <View style={styles.gridCardHeader}>
                <Wind size={15} color="#93c5fd" />
                <Text style={styles.gridCardHeaderTitle}>GIÓ</Text>
              </View>
              <Text style={styles.gridCardValue}>{windSpeed} m/s</Text>
              <Text style={styles.gridCardSub}>Cảm giác như {feelsLike}°</Text>
            </View>

            {/* Mặt trời mọc / lặn */}
            <View style={[styles.gridCard, cardStyle]}>
              <View style={styles.gridCardHeader}>
                <Sunrise size={15} color="#fde047" />
                <Text style={styles.gridCardHeaderTitle}>MẶT TRỜI MỌC</Text>
              </View>
              <Text style={styles.gridCardValue}>
                {formatSunTime(weatherData.sys?.sunrise)}
              </Text>
              <Text style={styles.gridCardSub}>
                Lặn: {formatSunTime(weatherData.sys?.sunset)}
              </Text>
            </View>

            {/* Tầm nhìn */}
            <View style={[styles.gridCard, cardStyle]}>
              <View style={styles.gridCardHeader}>
                <Eye size={15} color="#93c5fd" />
                <Text style={styles.gridCardHeaderTitle}>TẦM NHÌN</Text>
              </View>
              <Text style={styles.gridCardValue}>{visibilityKm} km</Text>
              <Text style={styles.gridCardSub}>
                {Number(visibilityKm) >= 10 ? 'Rất quang đãng' : 'Hạn chế tầm nhìn'}
              </Text>
            </View>

            {/* Áp suất */}
            <View style={[styles.gridCard, cardStyle]}>
              <View style={styles.gridCardHeader}>
                <Gauge size={15} color="#93c5fd" />
                <Text style={styles.gridCardHeaderTitle}>ÁP SUẤT</Text>
              </View>
              <Text style={styles.gridCardValue}>{pressure} hPa</Text>
              <Text style={styles.gridCardSub}>Áp suất tiêu chuẩn</Text>
            </View>

            {/* Hướng gió */}
            <View style={[styles.gridCard, cardStyle]}>
              <View style={styles.gridCardHeader}>
                <Compass size={15} color="#93c5fd" />
                <Text style={styles.gridCardHeaderTitle}>HƯỚNG GIÓ</Text>
              </View>
              <Text style={styles.gridCardValue}>
                {weatherData.wind?.deg ? `${weatherData.wind.deg}°` : '0°'}
              </Text>
              <Text style={styles.gridCardSub}>Gió cấp nhẹ</Text>
            </View>
          </View>
        </ScrollView>

        {/* Thanh điều hướng chân trang (Bottom Bar Apple Weather) */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.bottomBarIcon}
            onPress={() => {}}
            activeOpacity={0.7}
          >
            <MapIcon size={24} color="#ffffff" />
          </TouchableOpacity>

          <View style={styles.locationIndicator}>
            <Navigation size={15} color="#ffffff" style={{ transform: [{ rotate: '45deg' }] }} />
          </View>

          <TouchableOpacity
            style={styles.bottomBarIcon}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <List size={26} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </WeatherBackground>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topNav: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 35,
    alignItems: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginVertical: 14,
  },
  mainTitle: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 4,
  },
  subLocation: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginTop: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  tempText: {
    color: '#ffffff',
    fontSize: 86,
    fontWeight: '200',
    marginVertical: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 5,
  },
  conditionText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  minMaxText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cardWrapper: {
    width: '100%',
    borderRadius: 20,
    padding: 16,
    marginVertical: 7,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  hourlySummaryText: {
    color: '#f1f5f9',
    fontSize: 13,
    fontWeight: '600',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.18)',
    paddingBottom: 10,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.18)',
    paddingBottom: 8,
    marginBottom: 8,
  },
  cardHeaderTitle: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  hourlyScrollContent: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  hourlyItem: {
    alignItems: 'center',
    marginRight: 20,
    minWidth: 44,
  },
  hourlyTime: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  hourlyIconWrapper: {
    marginVertical: 4,
    height: 32,
    width: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hourlyPop: {
    color: '#67e8f9',
    fontSize: 11,
    fontWeight: '700',
    marginVertical: 2,
  },
  hourlyTemp: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  dailyListContainer: {
    paddingVertical: 2,
  },
  dailyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
  },
  dailyDayName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    width: 90,
  },
  dailyIconWrapper: {
    width: 36,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dailyTempRange: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginLeft: 10,
  },
  dailyMinTemp: {
    color: '#cbd5e1',
    fontSize: 15,
    fontWeight: '600',
    width: 32,
    textAlign: 'right',
  },
  tempBarBackground: {
    flex: 1,
    height: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 2.5,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  tempBarActive: {
    height: '100%',
    width: '100%',
    borderRadius: 2.5,
  },
  dailyMaxTemp: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    width: 32,
    textAlign: 'left',
  },
  gridContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  gridCard: {
    width: (width - 44) / 2,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  gridCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  gridCardHeaderTitle: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  gridCardValue: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    marginVertical: 2,
  },
  gridCardSub: {
    color: '#cbd5e1',
    fontSize: 12,
    marginTop: 2,
  },
  bottomBar: {
    height: 54,
    backgroundColor: 'rgba(10, 20, 35, 0.5)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  bottomBarIcon: {
    padding: 8,
  },
  locationIndicator: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
