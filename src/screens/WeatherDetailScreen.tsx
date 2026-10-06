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
  Sunset,
  Gauge,
  Calendar,
  Clock,
  Map as MapIcon,
  Navigation,
  Sun,
  Thermometer,
  ArrowUp,
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
import { DailyForecastModal } from '../components/DailyForecastModal';
import { SunTrajectoryArc } from '../components/SunTrajectoryArc';
import { WindCompassDial } from '../components/WindCompassDial';

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
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

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
  const theme = getWeatherTheme(iconCode, conditionMain, weatherData.sys, weatherData.dt);

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
  const windSpeedMs = weatherData.wind?.speed || 0;
  const windSpeedKmh = Math.round(windSpeedMs * 3.6);
  const windGustKmh = Math.round(
    ((weatherData.wind as any)?.gust || windSpeedMs * 1.6) * 3.6
  );
  const windDeg = weatherData.wind?.deg || 0;
  const pressure = weatherData.main?.pressure || 1013;
  const visibilityKm = weatherData.visibility
    ? (weatherData.visibility / 1000).toFixed(1)
    : '10';

  // Xác định chữ viết tắt hướng gió (B, ĐB, Đ, ĐN, N, TN, T, TB)
  const getWindDirectionName = (deg: number) => {
    if (deg >= 337.5 || deg < 22.5) return 'B';
    if (deg >= 22.5 && deg < 67.5) return 'ĐB';
    if (deg >= 67.5 && deg < 112.5) return 'Đ';
    if (deg >= 112.5 && deg < 157.5) return 'ĐN';
    if (deg >= 157.5 && deg < 202.5) return 'N';
    if (deg >= 202.5 && deg < 247.5) return 'TN';
    if (deg >= 247.5 && deg < 292.5) return 'T';
    return 'TB';
  };
  const windDirText = getWindDirectionName(windDeg);

  // Tính toán chỉ số UV ước lượng
  const currentHour = new Date().getHours();
  const isNight = currentHour >= 18 || currentHour < 6;
  const uvVal = isNight ? 0 : Math.min(10, Math.max(1, Math.round((temp / 35) * 8)));
  const uvCategory =
    uvVal === 0
      ? 'Thấp'
      : uvVal <= 2
      ? 'Thấp'
      : uvVal <= 5
      ? 'Trung bình'
      : uvVal <= 7
      ? 'Cao'
      : 'Rất cao';
  const uvSub =
    uvVal === 0
      ? 'Thấp đến hết ngày.'
      : uvVal <= 2
      ? 'Thấp trong hầu hết thời gian.'
      : 'Chỉ số UV ở mức cao, khuyên dùng kem chống nắng.';

  // Cảm nhận nhiệt độ
  const feelsLikeDiff = feelsLike - temp;
  const feelsLikeSub =
    Math.abs(feelsLikeDiff) <= 1
      ? 'Giống với nhiệt độ thực tế.'
      : feelsLikeDiff > 1
      ? 'Độ ẩm khiến cảm giác ấm hơn.'
      : 'Gió khiến cảm giác mát hơn.';

  // Lượng mưa 24h
  const rain24h = ((weatherData as any).rain?.['1h'] || 0) > 0 ? (weatherData as any).rain['1h'] : 0;
  const rainSub =
    rain24h > 0
      ? 'Dự báo có mưa rải rác.'
      : 'Dự báo tiếp theo là không có mưa đáng kể.';

  // Tạo danh sách dự báo 24 giờ tiếp theo từng giờ một (1-hour step chuẩn Apple Weather)
  const hourlyDisplayList = React.useMemo(() => {
    const list: {
      id: string;
      timeText: string;
      temp: number;
      icon: string;
      pop: number;
      isNow: boolean;
    }[] = [];
    const now = new Date();

    // 1. Mốc "Bây giờ"
    const currentPop = forecast?.list?.[0]?.pop ? Math.round(forecast.list[0].pop * 100) : 0;
    list.push({
      id: 'now',
      timeText: 'Bây giờ',
      temp: Math.round(weatherData.main?.temp || 0),
      icon: weatherData.weather?.[0]?.icon || '01d',
      pop: currentPop,
      isNow: true,
    });

    if (!forecast?.list || forecast.list.length === 0) {
      return list;
    }

    const forecastItems = forecast.list;

    // 2. Tạo các mốc giờ kế tiếp trong vòng 24 giờ (1-hour step liên tục)
    for (let step = 1; step <= 24; step++) {
      const targetDate = new Date(now.getTime() + step * 3600 * 1000);
      const targetUnix = Math.floor(targetDate.getTime() / 1000);
      const targetHour = targetDate.getHours();
      const timeText = `${targetHour.toString().padStart(2, '0')}:00`;

      // Tìm 2 mốc 3-giờ gần nhất trong forecast để nội suy nhiệt độ & trạng thái
      let prevItem = forecastItems[0];
      let nextItem = forecastItems[forecastItems.length - 1];

      for (let i = 0; i < forecastItems.length; i++) {
        if (forecastItems[i].dt <= targetUnix) {
          prevItem = forecastItems[i];
        }
        if (forecastItems[i].dt >= targetUnix) {
          nextItem = forecastItems[i];
          break;
        }
      }

      let interpolatedTemp: number;
      let pop = 0;
      let iconCode = '01d';

      if (prevItem.dt === nextItem.dt) {
        interpolatedTemp = prevItem.main.temp;
        pop = prevItem.pop ? Math.round(prevItem.pop * 100) : 0;
        iconCode = prevItem.weather?.[0]?.icon || '01d';
      } else {
        const ratio = Math.max(
          0,
          Math.min(1, (targetUnix - prevItem.dt) / (nextItem.dt - prevItem.dt))
        );
        interpolatedTemp =
          prevItem.main.temp + (nextItem.main.temp - prevItem.main.temp) * ratio;
        const prevPop = prevItem.pop ? Math.round(prevItem.pop * 100) : 0;
        const nextPop = nextItem.pop ? Math.round(nextItem.pop * 100) : 0;
        pop = Math.round(prevPop + (nextPop - prevPop) * ratio);
        const chosen = ratio < 0.5 ? prevItem : nextItem;
        iconCode = chosen.weather?.[0]?.icon || '01d';
      }

      // Kiểm tra ngày/đêm chính xác cho từng mốc giờ theo giờ địa phương
      const isNightHour = targetHour >= 18 || targetHour < 6;
      if (isNightHour && iconCode.endsWith('d')) {
        iconCode = iconCode.replace('d', 'n');
      } else if (!isNightHour && iconCode.endsWith('n')) {
        iconCode = iconCode.replace('n', 'd');
      }

      list.push({
        id: `hour-${targetUnix}`,
        timeText,
        temp: Math.round(interpolatedTemp),
        icon: iconCode,
        pop,
        isNow: false,
      });
    }

    return list;
  }, [weatherData, forecast]);

  // Tạo dòng tóm tắt thông minh cho thẻ theo giờ trong tương lai
  let hourlySummary = `Dự báo ${conditionDesc.toLowerCase()} trong những giờ tới.`;
  if (hourlyDisplayList.length > 1) {
    const nextRain = hourlyDisplayList.slice(1).find((it) => it.pop >= 40);
    if (nextRain) {
      hourlySummary = `Dự báo có khả năng mưa (${nextRain.pop}%) vào khoảng ${nextRain.timeText}.`;
    }
  }

  // Gom nhóm dự báo theo ngày (5 ngày tới)
  const dailyList: { day: string; min: number; max: number; icon: string; desc: string }[] = [];
  if (forecast?.list) {
    const grouped: { [key: string]: ForecastItem[] } = {};
    forecast.list.forEach((item) => {
      // Chuyển timestamp dt sang ngày theo giờ địa phương
      const localDate = new Date(item.dt * 1000);
      const dateKey = `${localDate.getFullYear()}-${(localDate.getMonth() + 1)
        .toString()
        .padStart(2, '0')}-${localDate.getDate().toString().padStart(2, '0')}`;
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
        day: formatForecastDay(middleItem.dt, idx),
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

  const cardStyle = {
    backgroundColor:
      theme.weatherType === 'cloud' || theme.weatherType === 'sun'
        ? 'rgba(24, 49, 79, 0.58)'
        : 'rgba(15, 23, 42, 0.68)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  };

  const handleOpenDayModal = (index: number) => {
    setSelectedDayIndex(index);
    setShowDailyModal(true);
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

          {/* 1. Dự báo theo giờ (Chuẩn múi giờ địa phương) */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => handleOpenDayModal(0)}
            style={[styles.cardWrapper, cardStyle]}
          >
            <Text style={styles.hourlySummaryText}>{hourlySummary}</Text>

            {loadingForecast ? (
              <ActivityIndicator size="small" color="#ffffff" style={{ marginVertical: 20 }} />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hourlyScrollContent}
              >
                {hourlyDisplayList.map((item) => (
                  <View key={item.id} style={styles.hourlyItem}>
                    <Text style={styles.hourlyTime}>{item.timeText}</Text>
                    <View style={styles.hourlyIconWrapper}>
                      <WeatherIcon iconCode={item.icon} size={28} />
                    </View>
                    {item.pop > 0 ? (
                      <Text style={styles.hourlyPop}>{item.pop}%</Text>
                    ) : (
                      <View style={{ height: 16 }} />
                    )}
                    <Text style={styles.hourlyTemp}>{item.temp}°</Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </TouchableOpacity>

          {/* 2. Dự báo 5 ngày */}
          <View style={[styles.cardWrapper, cardStyle]}>
            <View style={styles.cardHeader}>
              <Calendar size={15} color="#cbd5e1" style={{ marginRight: 6 }} />
              <Text style={styles.cardHeaderTitle}>DỰ BÁO 5 NGÀY (CHẠM ĐỂ XEM BIỂU ĐỒ)</Text>
            </View>

            {loadingForecast ? (
              <ActivityIndicator size="small" color="#ffffff" style={{ marginVertical: 20 }} />
            ) : (
              <View style={styles.dailyListContainer}>
                {dailyList.map((item, idx) => (
                  <TouchableOpacity
                    key={`${item.day}-${idx}`}
                    style={styles.dailyRow}
                    activeOpacity={0.7}
                    onPress={() => handleOpenDayModal(idx)}
                  >
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
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* 3. Lưới các thẻ chỉ số chi tiết chuẩn 100% Apple Weather */}
          <View style={styles.gridContainer}>
            {/* Hàng 1: CHỈ SỐ UV & MẶT TRỜI MỌC */}
            <View style={[styles.gridCard, cardStyle]}>
              <View style={styles.gridCardHeader}>
                <Sun size={14} color="#cbd5e1" />
                <Text style={styles.gridCardHeaderTitle}>CHỈ SỐ UV</Text>
              </View>
              <Text style={styles.gridCardValue}>{uvVal}</Text>
              <Text style={styles.gridCardCategory}>{uvCategory}</Text>

              {/* Dải gradient chỉ số UV */}
              <View style={styles.uvBarWrapper}>
                <LinearGradient
                  colors={['#22c55e', '#fbbf24', '#f97316', '#ef4444', '#a855f7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.uvGradientBar}
                />
                <View
                  style={[
                    styles.uvDotIndicator,
                    { left: `${Math.min(94, Math.max(0, (uvVal / 11) * 94))}%` },
                  ]}
                />
              </View>

              <Text style={styles.gridCardSub}>{uvSub}</Text>
            </View>

            <View style={[styles.gridCard, cardStyle]}>
              <View style={styles.gridCardHeader}>
                <Sunrise size={14} color="#cbd5e1" />
                <Text style={styles.gridCardHeaderTitle}>MẶT TRỜI MỌC</Text>
              </View>
              <Text style={styles.gridCardValue}>
                {formatSunTime(weatherData.sys?.sunrise)}
              </Text>

              {/* Vòng cung quỹ đạo hình sin mặt trời chuẩn Apple Weather */}
              <SunTrajectoryArc
                sunriseTs={weatherData.sys?.sunrise}
                sunsetTs={weatherData.sys?.sunset}
                dt={weatherData.dt}
              />

              <Text style={styles.gridCardSub}>
                Mặt trời lặn: {formatSunTime(weatherData.sys?.sunset)}
              </Text>
            </View>

            {/* Hàng 2: Thẻ GIÓ (Full Width Card với La bàn chuẩn Apple Weather) */}
            <View style={[styles.wideGridCard, cardStyle]}>
              <View style={styles.gridCardHeader}>
                <Wind size={14} color="#cbd5e1" />
                <Text style={styles.gridCardHeaderTitle}>GIÓ</Text>
              </View>

              <View style={styles.windCardContentRow}>
                {/* Cột trái: Tốc độ gió & Gió giật */}
                <View style={styles.windStatsCol}>
                  <View style={styles.windStatItem}>
                    <Text style={styles.windBigNumber}>
                      {windSpeedKmh} <Text style={styles.windUnitText}>km/h</Text>
                    </Text>
                    <Text style={styles.windStatLabel}>Gió</Text>
                  </View>

                  <View style={styles.windDividerLine} />

                  <View style={styles.windStatItem}>
                    <Text style={styles.windBigNumber}>
                      {windGustKmh} <Text style={styles.windUnitText}>km/h</Text>
                    </Text>
                    <Text style={styles.windStatLabel}>Gió giật</Text>
                  </View>
                </View>

                {/* Cột phải: Mặt đồng hồ La bàn với 36 vạch chia độ và kim xoay */}
                <WindCompassDial windDeg={windDeg} windDirText={windDirText} />
              </View>
            </View>

            {/* Hàng 3: CẢM NHẬN & LƯỢNG MƯA */}
            <View style={[styles.gridCard, cardStyle]}>
              <View style={styles.gridCardHeader}>
                <Thermometer size={14} color="#cbd5e1" />
                <Text style={styles.gridCardHeaderTitle}>CẢM NHẬN</Text>
              </View>
              <Text style={styles.gridCardValue}>{feelsLike}°</Text>
              <View style={styles.gridCardSubWrapper}>
                <Text style={styles.gridCardSub}>{feelsLikeSub}</Text>
              </View>
            </View>

            <View style={[styles.gridCard, cardStyle]}>
              <View style={styles.gridCardHeader}>
                <Droplets size={14} color="#cbd5e1" />
                <Text style={styles.gridCardHeaderTitle}>LƯỢNG MƯA</Text>
              </View>
              <Text style={styles.gridCardValue}>{rain24h} mm</Text>
              <Text style={styles.gridCardCategory}>trong 24 giờ qua</Text>
              <View style={styles.gridCardSubWrapper}>
                <Text style={styles.gridCardSub}>{rainSub}</Text>
              </View>
            </View>

            {/* Hàng 4: ĐỘ ẨM & TẦM NHÌN */}
            <View style={[styles.gridCard, cardStyle]}>
              <View style={styles.gridCardHeader}>
                <Droplets size={14} color="#cbd5e1" />
                <Text style={styles.gridCardHeaderTitle}>ĐỘ ẨM</Text>
              </View>
              <Text style={styles.gridCardValue}>{humidity}%</Text>
              <View style={styles.gridCardSubWrapper}>
                <Text style={styles.gridCardSub}>Điểm sương hiện tại: {temp - 3}°</Text>
              </View>
            </View>

            <View style={[styles.gridCard, cardStyle]}>
              <View style={styles.gridCardHeader}>
                <Eye size={14} color="#cbd5e1" />
                <Text style={styles.gridCardHeaderTitle}>TẦM NHÌN</Text>
              </View>
              <Text style={styles.gridCardValue}>{visibilityKm} km</Text>
              <View style={styles.gridCardSubWrapper}>
                <Text style={styles.gridCardSub}>
                  {Number(visibilityKm) >= 10 ? 'Rất quang đãng' : 'Hạn chế tầm nhìn'}
                </Text>
              </View>
            </View>

            {/* Hàng 5: ÁP SUẤT & HƯỚNG GIÓ */}
            <View style={[styles.gridCard, cardStyle]}>
              <View style={styles.gridCardHeader}>
                <Gauge size={14} color="#cbd5e1" />
                <Text style={styles.gridCardHeaderTitle}>ÁP SUẤT</Text>
              </View>
              <Text style={styles.gridCardValue}>{pressure} hPa</Text>
              <View style={styles.gridCardSubWrapper}>
                <Text style={styles.gridCardSub}>Áp suất tiêu chuẩn</Text>
              </View>
            </View>

            <View style={[styles.gridCard, cardStyle]}>
              <View style={styles.gridCardHeader}>
                <Compass size={14} color="#cbd5e1" />
                <Text style={styles.gridCardHeaderTitle}>HƯỚNG GIÓ</Text>
              </View>
              <Text style={styles.gridCardValue}>{windDirText} ({windDeg}°)</Text>
              <View style={styles.gridCardSubWrapper}>
                <Text style={styles.gridCardSub}>Gió cấp nhẹ</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Thanh điều hướng chân trang */}
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

        {/* Bottom Sheet Modal chi tiết ngày */}
        <DailyForecastModal
          visible={showDailyModal}
          onClose={() => setShowDailyModal(false)}
          forecastData={forecast}
          initialSelectedDayIndex={selectedDayIndex}
        />
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
    width: '48.5%',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 148,
    justifyContent: 'space-between',
  },
  wideGridCard: {
    width: '100%',
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
    fontSize: 28,
    fontWeight: '700',
    marginVertical: 1,
  },
  gridCardCategory: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  gridCardSubWrapper: {
    marginTop: 6,
  },
  gridCardSub: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 16,
  },
  uvBarWrapper: {
    position: 'relative',
    height: 4.5,
    marginVertical: 8,
    justifyContent: 'center',
  },
  uvGradientBar: {
    height: 4.5,
    borderRadius: 2.25,
    width: '100%',
  },
  uvDotIndicator: {
    position: 'absolute',
    top: -2.5,
    width: 9.5,
    height: 9.5,
    borderRadius: 4.75,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#0f172a',
  },
  windCardContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  windStatsCol: {
    flex: 1,
    paddingRight: 16,
  },
  windStatItem: {
    marginVertical: 1,
  },
  windBigNumber: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
  },
  windUnitText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '500',
  },
  windStatLabel: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  windDividerLine: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginVertical: 6,
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
