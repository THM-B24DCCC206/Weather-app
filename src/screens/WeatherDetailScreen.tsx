import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  List,
  Compass,
  Droplets,
  Wind,
  Eye,
  Sunrise,
  Gauge,
  Calendar,
  Map as MapIcon,
  Navigation,
  Sun,
  Thermometer,
} from 'lucide-react-native';
import {
  CurrentWeatherData,
  ForecastData,
  ForecastItem,
  WeatherUnitsSettings,
  DEFAULT_WEATHER_UNITS,
} from '../types/weather';
import {
  fetchForecast,
  fetchForecastByCity,
  getWeatherTheme,
  getFormattedCondition,
  formatForecastDay,
} from '../api/weatherApi';
import {
  formatTemperature,
  formatWindSpeed,
  formatPrecipitation,
  formatPressure,
  formatVisibility,
  getCalibratedRainPop,
} from '../utils/unitConverter';
import { WeatherIcon } from '../components/WeatherIcon';
import { WeatherBackground } from '../components/WeatherBackground';
import { DailyForecastModal } from '../components/DailyForecastModal';
import { SunTrajectoryArc } from '../components/SunTrajectoryArc';
import { WindCompassDial } from '../components/WindCompassDial';

interface CityItem {
  weather: CurrentWeatherData;
  isCurrentLocation: boolean;
}

interface WeatherDetailScreenProps {
  weatherData?: CurrentWeatherData;
  isCurrentLocation?: boolean;
  onBack: () => void;
  isPreviewMode?: boolean;
  onAddCity?: () => void;
  isAlreadySaved?: boolean;
  onOpenMap?: () => void;
  cities?: CityItem[];
  initialCityIndex?: number;
  citiesCount?: number;
  selectedCityIndex?: number;
  onSelectCityIndex?: (index: number) => void;
  onNextCity?: () => void;
  units?: WeatherUnitsSettings;
}

interface WeatherCityPageViewProps {
  weatherData: CurrentWeatherData;
  isCurrentLocation: boolean;
  isPreviewMode?: boolean;
  onBack?: () => void;
  onAddCity?: () => void;
  isAlreadySaved?: boolean;
  units?: WeatherUnitsSettings;
}

export const WeatherCityPageView: React.FC<WeatherCityPageViewProps> = ({
  weatherData,
  isCurrentLocation,
  isPreviewMode = false,
  onBack,
  onAddCity,
  isAlreadySaved = false,
  units = DEFAULT_WEATHER_UNITS,
}) => {
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loadingForecast, setLoadingForecast] = useState(true);
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const loadForecastData = useCallback(async () => {
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
  }, [weatherData]);

  useEffect(() => {
    loadForecastData();
  }, [loadForecastData]);

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

  const formattedCondition = getFormattedCondition(iconCode, conditionDesc);

  const mainTitle = isCurrentLocation ? 'Vị trí của tôi' : weatherData.name;
  const subLocation = isCurrentLocation
    ? (weatherData.subLocation || weatherData.name).toUpperCase()
    : (weatherData.sys?.country || '').toUpperCase();

  const temp = formatTemperature(weatherData.main?.temp || 0, units.temp);
  const tempMax = formatTemperature(
    weatherData.main?.temp_max ?? (weatherData.main?.temp || 0),
    units.temp
  );
  const tempMin = formatTemperature(
    weatherData.main?.temp_min ?? ((weatherData.main?.temp || 0) - 5),
    units.temp
  );
  const feelsLike = formatTemperature(
    weatherData.main?.feels_like || 0,
    units.temp
  );
  const humidity = weatherData.main?.humidity || 0;

  const windSpeedMs = weatherData.wind?.speed || 0;
  const windInfo = formatWindSpeed(windSpeedMs, units.wind);
  const windGustMs = (weatherData.wind as any)?.gust || windSpeedMs * 1.6;
  const windGustInfo = formatWindSpeed(windGustMs, units.wind);
  const windDeg = weatherData.wind?.deg || 0;

  const rawRain24h =
    ((weatherData as any).rain?.['1h'] || 0) > 0
      ? (weatherData as any).rain['1h']
      : 0;
  const rainInfo = formatPrecipitation(rawRain24h, units.rain);

  const pressureHpa = weatherData.main?.pressure || 1013;
  const pressureInfo = formatPressure(pressureHpa, units.pressure);

  const visibilityInfo = formatVisibility(weatherData.visibility, units.distance);

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

  const currentHour = new Date().getHours();
  const isNight = currentHour >= 18 || currentHour < 6;
  const rawTempC = weatherData.main?.temp || 0;
  const uvVal = isNight ? 0 : Math.min(10, Math.max(1, Math.round((rawTempC / 35) * 8)));
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

  const feelsLikeDiff = feelsLike - temp;
  const feelsLikeSub =
    Math.abs(feelsLikeDiff) <= 1
      ? 'Giống với nhiệt độ thực tế.'
      : feelsLikeDiff > 1
      ? 'Độ ẩm khiến cảm giác ấm hơn.'
      : 'Gió khiến cảm giác mát hơn.';

  const rainSub =
    rawRain24h > 0
      ? 'Dự báo có mưa rải rác.'
      : 'Dự báo tiếp theo là không có mưa đáng kể.';

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

    const rawCurrentPop = forecast?.list?.[0]?.pop || 0;
    const rawCurrentRain = (weatherData as any).rain?.['1h'] || forecast?.list?.[0]?.rain?.['3h'] || 0;
    const currentPop = getCalibratedRainPop(
      rawCurrentPop,
      rawCurrentRain,
      weatherData.weather?.[0]?.description || ''
    );
    list.push({
      id: 'now',
      timeText: 'Bây giờ',
      temp: formatTemperature(weatherData.main?.temp || 0, units.temp),
      icon: weatherData.weather?.[0]?.icon || '01d',
      pop: currentPop,
      isNow: true,
    });

    if (!forecast?.list || forecast.list.length === 0) {
      return list;
    }

    const forecastItems = forecast.list;

    for (let step = 1; step <= 24; step++) {
      const targetDate = new Date(now.getTime() + step * 3600 * 1000);
      const targetUnix = Math.floor(targetDate.getTime() / 1000);
      const targetHour = targetDate.getHours();
      const timeText = `${targetHour.toString().padStart(2, '0')}:00`;

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
      let curIconCode = '01d';

      if (prevItem.dt === nextItem.dt) {
        interpolatedTemp = prevItem.main.temp;
        curIconCode = prevItem.weather?.[0]?.icon || '01d';
        pop = getCalibratedRainPop(
          prevItem.pop || 0,
          prevItem.rain?.['3h'] || 0,
          prevItem.weather?.[0]?.description || ''
        );
      } else {
        const ratio = Math.max(
          0,
          Math.min(1, (targetUnix - prevItem.dt) / (nextItem.dt - prevItem.dt))
        );
        interpolatedTemp =
          prevItem.main.temp + (nextItem.main.temp - prevItem.main.temp) * ratio;
        const chosen = ratio < 0.5 ? prevItem : nextItem;
        curIconCode = chosen.weather?.[0]?.icon || '01d';

        const prevCalPop = getCalibratedRainPop(
          prevItem.pop || 0,
          prevItem.rain?.['3h'] || 0,
          prevItem.weather?.[0]?.description || ''
        );
        const nextCalPop = getCalibratedRainPop(
          nextItem.pop || 0,
          nextItem.rain?.['3h'] || 0,
          nextItem.weather?.[0]?.description || ''
        );
        const interpolatedPop = Math.round(prevCalPop + (nextCalPop - prevCalPop) * ratio);
        pop = interpolatedPop > 0 ? Math.round(interpolatedPop / 5) * 5 : 0;
      }

      const isNightHour = targetHour >= 18 || targetHour < 6;
      if (isNightHour && curIconCode.endsWith('d')) {
        curIconCode = curIconCode.replace('d', 'n');
      } else if (!isNightHour && curIconCode.endsWith('n')) {
        curIconCode = curIconCode.replace('n', 'd');
      }

      list.push({
        id: `hour-${targetUnix}`,
        timeText,
        temp: formatTemperature(interpolatedTemp, units.temp),
        icon: curIconCode,
        pop,
        isNow: false,
      });
    }

    return list;
  }, [weatherData, forecast, units.temp]);

  let hourlySummary = `Dự báo ${formattedCondition.toLowerCase()} trong những giờ tới.`;
  if (hourlyDisplayList.length > 1) {
    const nextRain = hourlyDisplayList.slice(1).find((it) => it.pop >= 30);
    if (nextRain) {
      hourlySummary = `Dự báo có khả năng mưa (${nextRain.pop}%) vào khoảng ${nextRain.timeText}.`;
    }
  }

  const dailyList: { day: string; min: number; max: number; icon: string; desc: string; pop: number }[] = [];
  if (forecast?.list) {
    const grouped: { [key: string]: ForecastItem[] } = {};
    forecast.list.forEach((item) => {
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
      const min = Math.min(...temps);
      const max = Math.max(...temps);

      const popsInDay = items.map((i) =>
        getCalibratedRainPop(
          i.pop || 0,
          i.rain?.['3h'] || 0,
          i.weather?.[0]?.description || ''
        )
      );
      const dayPop = popsInDay.length > 0 ? Math.max(...popsInDay) : 0;

      const middleItem = items[Math.floor(items.length / 2)];
      dailyList.push({
        day: formatForecastDay(middleItem.dt, idx),
        min: formatTemperature(min, units.temp),
        max: formatTemperature(max, units.temp),
        icon: middleItem.weather?.[0]?.icon || '01d',
        desc: middleItem.weather?.[0]?.description || '',
        pop: dayPop,
      });
    });
  }

  const overallMin = dailyList.length > 0 ? Math.min(...dailyList.map((d) => d.min)) : 0;
  const overallMax = dailyList.length > 0 ? Math.max(...dailyList.map((d) => d.max)) : 40;
  const tempSpan = Math.max(1, overallMax - overallMin);

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
    <WeatherBackground weatherType={theme.weatherType} overlayColors={theme.overlayColors}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={styles.safeArea}>
        {isPreviewMode && (
          <View style={[styles.topNav, styles.previewTopNav]}>
            <TouchableOpacity
              onPress={onBack}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 15, right: 15 }}
            >
              <Text style={styles.previewCancelText}>Hủy</Text>
            </TouchableOpacity>

            {!isAlreadySaved && onAddCity ? (
              <TouchableOpacity
                onPress={onAddCity}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 15, right: 15 }}
              >
                <Text style={styles.previewAddText}>Thêm</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 40 }} />
            )}
          </View>
        )}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, !isPreviewMode && styles.scrollContentWithBottomBar]}
          showsVerticalScrollIndicator={false}
          directionalLockEnabled={true}
        >
          <View style={styles.heroSection}>
            <Text style={styles.mainTitle}>{mainTitle}</Text>
            {subLocation ? <Text style={styles.subLocation}>{subLocation}</Text> : null}
            <Text style={styles.tempText}>{temp}°</Text>
            <Text style={styles.conditionText}>{formattedCondition}</Text>
            <Text style={styles.minMaxText}>
              C:{tempMax}°  T:{tempMin}°
            </Text>
          </View>

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

          <View style={[styles.cardWrapper, cardStyle]}>
            <View style={styles.cardHeader}>
              <Calendar size={15} color="#cbd5e1" style={{ marginRight: 6 }} />
              <Text style={styles.cardHeaderTitle}>DỰ BÁO 5 NGÀY (CHẠM ĐỂ XEM BIỂU ĐỒ)</Text>
            </View>

            {loadingForecast ? (
              <ActivityIndicator size="small" color="#ffffff" style={{ marginVertical: 20 }} />
            ) : (
              <View style={styles.dailyListContainer}>
                {dailyList.map((item, idx) => {
                  const leftRatio = (item.min - overallMin) / tempSpan;
                  const widthRatio = (item.max - item.min) / tempSpan;
                  const leftPercent = Math.max(0, Math.min(100, leftRatio * 100));
                  const widthPercent = Math.max(15, Math.min(100 - leftPercent, widthRatio * 100));

                  const curTemp = formatTemperature(weatherData.main?.temp || 0, units.temp);
                  const curTempRatio = (curTemp - overallMin) / tempSpan;
                  const curTempPercent = Math.max(2, Math.min(98, curTempRatio * 100));

                  return (
                    <TouchableOpacity
                      key={`${item.day}-${idx}`}
                      style={[styles.dailyRow, idx > 0 && styles.dailyRowBorder]}
                      activeOpacity={0.7}
                      onPress={() => handleOpenDayModal(idx)}
                    >
                      <Text style={styles.dailyDayName} numberOfLines={1}>
                        {item.day}
                      </Text>
                      <View style={styles.dailyIconWrapper}>
                        <WeatherIcon iconCode={item.icon} size={24} />
                        {item.pop >= 25 ? (
                          <Text style={styles.dailyPopText}>{item.pop}%</Text>
                        ) : null}
                      </View>
                      <Text style={styles.dailyMinTemp}>{item.min}°</Text>
                      <View style={styles.tempBarTrack}>
                        <LinearGradient
                          colors={['#38bdf8', '#fbbf24', '#f97316']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[
                            styles.tempBarSegment,
                            {
                              left: `${leftPercent}%`,
                              width: `${widthPercent}%`,
                            },
                          ]}
                        />
                        {idx === 0 ? (
                          <View
                            style={[
                              styles.tempCurrentDot,
                              { left: `${curTempPercent}%` },
                            ]}
                          />
                        ) : null}
                      </View>
                      <Text style={styles.dailyMaxTemp}>{item.max}°</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          <View style={styles.gridContainer}>
            <View style={[styles.gridCard, cardStyle]}>
              <View style={styles.gridCardHeader}>
                <Sun size={14} color="#cbd5e1" />
                <Text style={styles.gridCardHeaderTitle}>CHỈ SỐ UV</Text>
              </View>
              <Text style={styles.gridCardValue}>{uvVal}</Text>
              <Text style={styles.gridCardCategory}>{uvCategory}</Text>

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

              <SunTrajectoryArc
                sunriseTs={weatherData.sys?.sunrise}
                sunsetTs={weatherData.sys?.sunset}
                dt={weatherData.dt}
              />

              <Text style={styles.gridCardSub}>
                Mặt trời lặn: {formatSunTime(weatherData.sys?.sunset)}
              </Text>
            </View>

            <View style={[styles.wideGridCard, cardStyle]}>
              <View style={styles.gridCardHeader}>
                <Wind size={14} color="#cbd5e1" />
                <Text style={styles.gridCardHeaderTitle}>GIÓ</Text>
              </View>

              <View style={styles.windCardContentRow}>
                <View style={styles.windStatsCol}>
                  <View style={styles.windStatItem}>
                    <Text style={styles.windBigNumber}>
                      {windInfo.value} <Text style={styles.windUnitText}>{windInfo.unitText}</Text>
                    </Text>
                    <Text style={styles.windStatLabel}>Gió</Text>
                  </View>

                  <View style={styles.windDividerLine} />

                  <View style={styles.windStatItem}>
                    <Text style={styles.windBigNumber}>
                      {windGustInfo.value} <Text style={styles.windUnitText}>{windGustInfo.unitText}</Text>
                    </Text>
                    <Text style={styles.windStatLabel}>Gió giật</Text>
                  </View>
                </View>

                <WindCompassDial windDeg={windDeg} windDirText={windDirText} />
              </View>
            </View>

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
              <Text style={styles.gridCardValue}>
                {rainInfo.value} {rainInfo.unitText}
              </Text>
              <Text style={styles.gridCardCategory}>trong 24 giờ qua</Text>
              <View style={styles.gridCardSubWrapper}>
                <Text style={styles.gridCardSub}>{rainSub}</Text>
              </View>
            </View>

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
              <Text style={styles.gridCardValue}>
                {visibilityInfo.value} {visibilityInfo.unitText}
              </Text>
              <View style={styles.gridCardSubWrapper}>
                <Text style={styles.gridCardSub}>
                  {Number(visibilityInfo.value) >= 10 || visibilityInfo.unitText === 'mi' && Number(visibilityInfo.value) >= 6
                    ? 'Rất quang đãng'
                    : 'Hạn chế tầm nhìn'}
                </Text>
              </View>
            </View>

            <View style={[styles.gridCard, cardStyle]}>
              <View style={styles.gridCardHeader}>
                <Gauge size={14} color="#cbd5e1" />
                <Text style={styles.gridCardHeaderTitle}>ÁP SUẤT</Text>
              </View>
              <Text style={styles.gridCardValue}>
                {pressureInfo.value} {pressureInfo.unitText}
              </Text>
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

export const WeatherDetailScreen: React.FC<WeatherDetailScreenProps> = ({
  weatherData,
  isCurrentLocation = false,
  onBack,
  isPreviewMode = false,
  onAddCity,
  isAlreadySaved = false,
  onOpenMap,
  cities,
  initialCityIndex = 0,
  citiesCount,
  selectedCityIndex,
  onSelectCityIndex,
  onNextCity,
  units = DEFAULT_WEATHER_UNITS,
}) => {
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const horizontalScrollViewRef = useRef<ScrollView>(null);

  const citiesList: CityItem[] = React.useMemo(() => {
    if (cities && cities.length > 0) return cities;
    if (weatherData) return [{ weather: weatherData, isCurrentLocation }];
    return [];
  }, [cities, weatherData, isCurrentLocation]);

  const [activeIndex, setActiveIndex] = useState<number>(
    initialCityIndex ?? selectedCityIndex ?? 0
  );

  useEffect(() => {
    const targetIdx = initialCityIndex ?? selectedCityIndex ?? 0;
    if (targetIdx >= 0 && targetIdx < citiesList.length) {
      setActiveIndex(targetIdx);
      horizontalScrollViewRef.current?.scrollTo({
        x: targetIdx * SCREEN_WIDTH,
        animated: false,
      });
    }
  }, [initialCityIndex, selectedCityIndex, SCREEN_WIDTH, citiesList.length]);

  const scrollToCity = (index: number) => {
    if (index >= 0 && index < citiesList.length) {
      setActiveIndex(index);
      horizontalScrollViewRef.current?.scrollTo({
        x: index * SCREEN_WIDTH,
        animated: true,
      });
      onSelectCityIndex?.(index);
    }
  };

  const handleNextCity = () => {
    if (citiesList.length > 1) {
      const nextIdx = (activeIndex + 1) % citiesList.length;
      scrollToCity(nextIdx);
    }
    onNextCity?.();
  };

  if (isPreviewMode && weatherData) {
    return (
      <WeatherCityPageView
        weatherData={weatherData}
        isCurrentLocation={isCurrentLocation}
        isPreviewMode={true}
        onBack={onBack}
        onAddCity={onAddCity}
        isAlreadySaved={isAlreadySaved}
        units={units}
      />
    );
  }

  const effectiveCount = citiesCount || citiesList.length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        ref={horizontalScrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        directionalLockEnabled={true}
        bounces={true}
        decelerationRate="fast"
        scrollEventThrottle={16}
        contentOffset={{
          x: (initialCityIndex ?? selectedCityIndex ?? 0) * SCREEN_WIDTH,
          y: 0,
        }}
        onMomentumScrollEnd={(e) => {
          const pageIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          if (pageIndex >= 0 && pageIndex < citiesList.length) {
            setActiveIndex(pageIndex);
            onSelectCityIndex?.(pageIndex);
          }
        }}
        style={StyleSheet.absoluteFill}
      >
        {citiesList.map((item, idx) => (
          <View
            key={`${item.weather.name}-${item.weather.coord?.lat}-${item.weather.coord?.lon}-${idx}`}
            style={{ width: SCREEN_WIDTH, height: '100%' }}
          >
            <WeatherCityPageView
              weatherData={item.weather}
              isCurrentLocation={item.isCurrentLocation}
              onBack={onBack}
              units={units}
            />
          </View>
        ))}
      </ScrollView>

      <SafeAreaView style={styles.floatingBottomBarWrapper} pointerEvents="box-none">
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.bottomBarIcon}
            onPress={onOpenMap}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MapIcon size={24} color="#ffffff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.pageIndicatorContainer}
            onPress={handleNextCity}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 10, right: 10 }}
          >
            <TouchableOpacity
              onPress={() => scrollToCity(0)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
              style={styles.indicatorTouch}
            >
              <Navigation
                size={14}
                color="#ffffff"
                style={{
                  transform: [{ rotate: '45deg' }],
                  opacity: activeIndex === 0 ? 1 : 0.4,
                }}
              />
            </TouchableOpacity>

            {Array.from({ length: Math.max(0, effectiveCount - 1) }).map(
              (_, idx) => {
                const cityIdx = idx + 1;
                const isActive = activeIndex === cityIdx;
                return (
                  <TouchableOpacity
                    key={cityIdx}
                    onPress={() => scrollToCity(cityIdx)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                    style={styles.indicatorTouch}
                  >
                    <View
                      style={[
                        styles.indicatorDot,
                        isActive
                          ? styles.indicatorDotActive
                          : styles.indicatorDotInactive,
                      ]}
                    />
                  </TouchableOpacity>
                );
              }
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bottomBarIcon}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <List size={26} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 6 : 8,
    minHeight: 44,
  },
  previewTopNav: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    paddingTop: 12,
    paddingBottom: 4,
  },
  previewCancelText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '500',
  },
  previewAddText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  scrollContentWithBottomBar: {
    paddingBottom: 80,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 24,
  },
  mainTitle: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '400',
    letterSpacing: 0.35,
    textAlign: 'center',
  },
  subLocation: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 2,
    marginBottom: 2,
  },
  tempText: {
    color: '#ffffff',
    fontSize: 92,
    fontWeight: '200',
    letterSpacing: -2,
    marginVertical: -8,
  },
  conditionText: {
    color: '#e2e8f0',
    fontSize: 20,
    fontWeight: '500',
    marginTop: 2,
  },
  minMaxText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
  },
  cardWrapper: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardHeaderTitle: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  hourlySummaryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
    lineHeight: 18,
  },
  hourlyScrollContent: {
    flexDirection: 'row',
    paddingVertical: 2,
  },
  hourlyItem: {
    alignItems: 'center',
    width: 60,
    marginRight: 6,
  },
  hourlyTime: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  hourlyIconWrapper: {
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  hourlyPop: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
    height: 16,
  },
  hourlyTemp: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  dailyListContainer: {
    paddingVertical: 2,
  },
  dailyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
  },
  dailyRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  dailyDayName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    width: 82,
  },
  dailyIconWrapper: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dailyPopText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '700',
    marginTop: -2,
  },
  dailyMinTemp: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 16,
    fontWeight: '600',
    width: 32,
    textAlign: 'right',
    marginRight: 8,
  },
  tempBarTrack: {
    flex: 1,
    height: 4.5,
    borderRadius: 2.25,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    position: 'relative',
    justifyContent: 'center',
  },
  tempBarSegment: {
    position: 'absolute',
    height: 4.5,
    borderRadius: 2.25,
  },
  tempCurrentDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#0f172a',
    marginLeft: -4,
    top: -1.75,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 1.5,
    elevation: 3,
  },
  dailyMaxTemp: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    width: 32,
    textAlign: 'left',
    marginLeft: 8,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  gridCard: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    minHeight: 142,
    justifyContent: 'space-between',
  },
  wideGridCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    minHeight: 142,
  },
  gridCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  gridCardHeaderTitle: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  gridCardValue: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '700',
    marginTop: 4,
  },
  gridCardCategory: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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
    width: '100%',
    height: 4.5,
    borderRadius: 2.25,
    marginVertical: 6,
    position: 'relative',
    justifyContent: 'center',
  },
  uvGradientBar: {
    width: '100%',
    height: '100%',
    borderRadius: 2.25,
  },
  uvDotIndicator: {
    position: 'absolute',
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
  floatingBottomBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  bottomBar: {
    height: 54,
    backgroundColor: 'rgba(10, 20, 35, 0.65)',
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
  pageIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 7,
  },
  indicatorTouch: {
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorDot: {
    width: 6.5,
    height: 6.5,
    borderRadius: 3.25,
  },
  indicatorDotActive: {
    backgroundColor: '#ffffff',
    opacity: 1,
    transform: [{ scale: 1.2 }],
  },
  indicatorDotInactive: {
    backgroundColor: '#ffffff',
    opacity: 0.4,
  },
});
