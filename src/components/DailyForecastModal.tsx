import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { X, Cloud, ChevronDown, Droplets, Thermometer, Wind } from 'lucide-react-native';
import { ForecastData, ForecastItem } from '../types/weather';
import { WeatherIcon } from './WeatherIcon';
import { TemperatureWaveChart } from './TemperatureWaveChart';
import { RainProbabilityChart } from './RainProbabilityChart';

interface HourlyPoint {
  hourStr: string;
  temp: number;
  icon: string;
  pop: number;
}

interface DaySummary {
  dateKey: string;
  dayOfWeekShort: string;
  dayOfWeekFull: string;
  dayNumber: number;
  fullDateText: string;
  minTemp: number;
  maxTemp: number;
  avgTemp: number;
  icon: string;
  description: string;
  rainTotal: number;
  avgHumidity: number;
  hourlyPoints: HourlyPoint[];
}

interface DailyForecastModalProps {
  visible: boolean;
  onClose: () => void;
  forecastData: ForecastData | null;
  initialSelectedDayIndex?: number;
}

export const DailyForecastModal: React.FC<DailyForecastModalProps> = ({
  visible,
  onClose,
  forecastData,
  initialSelectedDayIndex = 0,
}) => {
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(initialSelectedDayIndex);
  const slideAnim = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    if (visible) {
      setSelectedDayIdx(initialSelectedDayIndex);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 3,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 600,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, initialSelectedDayIndex, slideAnim]);

  // Xử lý và tạo dữ liệu 24h đầy đủ 8 mốc theo đúng múi giờ địa phương
  const daysList: DaySummary[] = useMemo(() => {
    const standardHours = ['00', '03', '06', '09', '12', '15', '18', '21'];
    const dayNamesShort = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const dayNamesFull = [
      'Chủ Nhật',
      'Thứ Hai',
      'Thứ Ba',
      'Thứ Tư',
      'Thứ Năm',
      'Thứ Sáu',
      'Thứ Bảy',
    ];

    const groupedByDate: { [key: string]: ForecastItem[] } = {};
    if (forecastData?.list) {
      forecastData.list.forEach((item) => {
        // Chuyển timestamp UTC sang ngày theo giờ địa phương
        const d = new Date(item.dt * 1000);
        const dKey = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d
          .getDate()
          .toString()
          .padStart(2, '0')}`;
        if (!groupedByDate[dKey]) groupedByDate[dKey] = [];
        groupedByDate[dKey].push(item);
      });
    }

    const dates = Object.keys(groupedByDate).slice(0, 8);
    const result: DaySummary[] = [];

    dates.forEach((dateKey) => {
      const items = groupedByDate[dateKey];
      const firstItem = items[0];
      const dateObj = new Date(firstItem.dt * 1000);

      const temps = items.map((i) => i.main.temp);
      const minTemp = Math.round(Math.min(...temps));
      const maxTemp = Math.round(Math.max(...temps));
      const avgTemp = Math.round(temps.reduce((a, b) => a + b, 0) / temps.length);
      const avgHumidity = Math.round(
        items.reduce((a, b) => a + (b.main?.humidity || 70), 0) / items.length
      );
      const rainTotal = Number(
        items.reduce((a, b) => a + (b.rain?.['3h'] || 0), 0).toFixed(1)
      );
      const midItem = items[Math.floor(items.length / 2)];

      const dayOfWeekShort = dayNamesShort[dateObj.getDay()];
      const dayOfWeekFull = dayNamesFull[dateObj.getDay()];
      const dayNumber = dateObj.getDate();
      const monthNumber = dateObj.getMonth() + 1;
      const yearNumber = dateObj.getFullYear();
      const fullDateText = `${dayOfWeekFull}, ngày ${dayNumber} tháng ${monthNumber}, ${yearNumber}`;

      const hourlyPoints: HourlyPoint[] = standardHours.map((hStr) => {
        const hourNum = parseInt(hStr, 10);
        const isNightHour = hourNum < 6 || hourNum >= 18;

        const matched = items.find((it) => {
          const d = new Date(it.dt * 1000);
          return Math.abs(d.getHours() - hourNum) <= 1;
        });

        if (matched) {
          let iconCode = matched.weather?.[0]?.icon || '01d';
          if (isNightHour && iconCode.endsWith('d')) {
            iconCode = iconCode.replace('d', 'n');
          } else if (!isNightHour && iconCode.endsWith('n')) {
            iconCode = iconCode.replace('n', 'd');
          }

          return {
            hourStr: hStr,
            temp: Math.round(matched.main.temp),
            icon: iconCode,
            pop: matched.pop ? Math.round(matched.pop * 100) : 0,
          };
        }

        let factor = 0.5;
        if (hourNum <= 6) factor = (hourNum / 6) * 0.2;
        else if (hourNum <= 15) factor = 0.2 + ((hourNum - 6) / 9) * 0.8;
        else factor = 1.0 - ((hourNum - 15) / 9) * 0.7;

        const estimatedTemp = Math.round(minTemp + (maxTemp - minTemp) * factor);
        const iconCode = isNightHour ? '02n' : '02d';

        return {
          hourStr: hStr,
          temp: estimatedTemp,
          icon: iconCode,
          pop: 0,
        };
      });

      result.push({
        dateKey,
        dayOfWeekShort,
        dayOfWeekFull,
        dayNumber,
        fullDateText,
        minTemp,
        maxTemp,
        avgTemp,
        icon: midItem.weather?.[0]?.icon || '01d',
        description: midItem.weather?.[0]?.description || '',
        rainTotal,
        avgHumidity,
        hourlyPoints,
      });
    });

    return result;
  }, [forecastData]);

  const activeDay = daysList[selectedDayIdx] || daysList[0];

  if (!visible) return null;
  if (!activeDay) return null;

  return (
    <View style={styles.overlayContainer}>
      <TouchableOpacity
        style={styles.backdropTouch}
        activeOpacity={1}
        onPress={onClose}
      />

      <Animated.View
        style={[
          styles.modalSheet,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Modal Header với Tiêu đề căn giữa chuẩn iOS Apple Weather */}
        <View style={styles.sheetHeader}>
          <View style={{ width: 32, height: 32 }} />

          <View style={styles.sheetHeaderTitleWrapper}>
            <Cloud size={18} color="#ffffff" style={{ marginRight: 7 }} />
            <Text style={styles.sheetHeaderTitle}>Điều kiện thời tiết</Text>
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
            <X size={17} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Dải chọn ngày trong tuần (Chữ & số to rõ ràng chuẩn Apple Weather) */}
        <View style={styles.daySelectorSection}>
          <View style={styles.daySelectorRow}>
            {daysList.map((day, idx) => {
              const isSelected = idx === selectedDayIdx;
              return (
                <TouchableOpacity
                  key={day.dateKey}
                  style={styles.dayTab}
                  onPress={() => setSelectedDayIdx(idx)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dayTabShortName, isSelected && styles.dayTabShortActive]}>
                    {day.dayOfWeekShort}
                  </Text>
                  <View
                    style={[
                      styles.dayTabCircle,
                      isSelected && styles.dayTabCircleActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayTabNumber,
                        isSelected && styles.dayTabNumberActive,
                      ]}
                    >
                      {day.dayNumber}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.selectedDayFullText} numberOfLines={1} ellipsizeMode="tail">
            {activeDay.fullDateText}
          </Text>
        </View>

        <ScrollView
          style={styles.modalScrollView}
          contentContainerStyle={styles.scrollInnerContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hàng tổng quan nhiệt độ ngày */}
          <View style={styles.dayOverviewRow}>
            <View>
              <View style={styles.dayTempRow}>
                <Text style={styles.dayBigTemp}>{activeDay.avgTemp}°</Text>
                <View style={{ marginLeft: 8, marginTop: 2 }}>
                  <WeatherIcon iconCode={activeDay.icon} size={34} />
                </View>
              </View>
              <Text style={styles.dayMinMaxText}>
                C: {activeDay.maxTemp}°  •  T: {activeDay.minTemp}°
              </Text>
            </View>

            <View style={styles.conditionPill}>
              <Cloud size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <ChevronDown size={15} color="#cbd5e1" />
            </View>
          </View>

          {/* 1. Biểu đồ đường cong nhiệt độ dạng sóng chuẩn Apple Weather */}
          <View style={styles.chartCard}>
            <TemperatureWaveChart
              hourlyPoints={activeDay.hourlyPoints}
              maxTemp={activeDay.maxTemp}
              minTemp={activeDay.minTemp}
            />
          </View>

          {/* 2. Khả năng có mưa (Rain Probability Area Chart) */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Khả năng có mưa</Text>
            <View style={styles.chartCard}>
              <RainProbabilityChart hourlyPoints={activeDay.hourlyPoints} />
            </View>
          </View>

          {/* 3. Tổng lượng mưa (24h qua & 24h tới) */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Tổng lượng mưa</Text>
            <View style={styles.precipCard}>
              <View style={styles.precipTopRow}>
                <Text style={styles.precipHeroValue}>{activeDay.rainTotal} mm</Text>
                <Text style={styles.precipHeroSub}>
                  {activeDay.rainTotal > 0
                    ? `Dự kiến có mưa khoảng ${activeDay.rainTotal} mm`
                    : 'Không ghi nhận lượng mưa nào trong 24 giờ qua'}
                </Text>
              </View>

              {/* 2 Cột so sánh 24 GIỜ QUA và 24 GIỜ TỚI */}
              <View style={styles.precipColsRow}>
                <View style={styles.precipColBox}>
                  <Text style={styles.precipColLabel}>24 GIỜ QUA</Text>
                  <Text style={styles.precipColValue}>0 mm</Text>
                  <Text style={styles.precipColNote}>Đã đo đạc</Text>
                </View>

                <View style={styles.precipColDivider} />

                <View style={styles.precipColBox}>
                  <Text style={styles.precipColLabel}>24 GIỜ TỚI</Text>
                  <Text style={styles.precipColValue}>{activeDay.rainTotal} mm</Text>
                  <Text style={styles.precipColNote}>
                    {activeDay.rainTotal > 0 ? 'Dự báo có mưa' : 'Dự kiến khô ráo'}
                  </Text>
                </View>
              </View>

              {/* Dải phân cấp mức độ mưa Apple Weather */}
              <View style={styles.precipBarSection}>
                <View style={styles.precipScaleBar}>
                  <View
                    style={[
                      styles.precipScaleFill,
                      {
                        width: `${Math.min(100, Math.max(8, (activeDay.rainTotal / 25) * 100))}%`,
                      },
                    ]}
                  />
                </View>
                <View style={styles.precipScaleLabels}>
                  <Text style={styles.scaleLabelText}>Khô ráo</Text>
                  <Text style={styles.scaleLabelText}>Mưa nhỏ</Text>
                  <Text style={styles.scaleLabelText}>Mưa vừa</Text>
                  <Text style={styles.scaleLabelText}>Mưa to</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 4. So sánh hàng ngày (Daily Comparison) */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>So sánh hàng ngày</Text>
            <View style={styles.comparisonList}>
              <View style={styles.comparisonCard}>
                <View style={styles.comparisonCardHeader}>
                  <Thermometer size={16} color="#fbbf24" style={{ marginRight: 8 }} />
                  <Text style={styles.comparisonCardTitle}>Nhiệt độ</Text>
                </View>
                <Text style={styles.comparisonCardDesc}>
                  Nhiệt độ cao nhất hôm nay là {activeDay.maxTemp}°C, thấp nhất {activeDay.minTemp}°C, tương tự như hôm qua.
                </Text>
              </View>

              <View style={styles.comparisonCard}>
                <View style={styles.comparisonCardHeader}>
                  <Droplets size={16} color="#38bdf8" style={{ marginRight: 8 }} />
                  <Text style={styles.comparisonCardTitle}>Khả năng có mưa</Text>
                </View>
                <Text style={styles.comparisonCardDesc}>
                  {activeDay.rainTotal > 0
                    ? `Dự kiến có mưa nhẹ vào một số thời điểm trong ngày (tổng ${activeDay.rainTotal} mm).`
                    : 'Khả năng có mưa rất thấp (0%), thời tiết khô ráo thoáng mát.'}
                </Text>
              </View>

              <View style={styles.comparisonCard}>
                <View style={styles.comparisonCardHeader}>
                  <Wind size={16} color="#a7f3d0" style={{ marginRight: 8 }} />
                  <Text style={styles.comparisonCardTitle}>Độ ẩm & Gió</Text>
                </View>
                <Text style={styles.comparisonCardDesc}>
                  Độ ẩm trung bình khoảng {activeDay.avgHumidity}%, tốc độ gió cấp nhẹ giúp thời tiết dễ chịu.
                </Text>
              </View>
            </View>
          </View>

          {/* 5. Chi tiết ngày */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Chi tiết ngày</Text>
            <View style={styles.detailRowCards}>
              <View style={styles.miniCard}>
                <Text style={styles.miniCardLabel}>Nhiệt độ trung bình</Text>
                <Text style={styles.miniCardValue}>{activeDay.avgTemp}°</Text>
                <Text style={styles.miniCardSub}>
                  Cao: {activeDay.maxTemp}° • Thấp: {activeDay.minTemp}°
                </Text>
              </View>
              <View style={styles.miniCard}>
                <Text style={styles.miniCardLabel}>Trạng thái thời tiết</Text>
                <Text style={styles.miniCardValue} numberOfLines={1}>
                  {activeDay.description.charAt(0).toUpperCase() +
                    activeDay.description.slice(1)}
                </Text>
                <Text style={styles.miniCardSub}>Độ ẩm: ~{activeDay.avgHumidity}%</Text>
              </View>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    justifyContent: 'flex-end',
  },
  backdropTouch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  modalSheet: {
    height: '96%',
    width: '100%',
    backgroundColor: '#181a20',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 14,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
    width: '100%',
  },
  sheetHeaderTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetHeaderTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  daySelectorSection: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
    width: '100%',
  },
  daySelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  dayTab: {
    alignItems: 'center',
    flex: 1,
  },
  dayTabShortName: {
    color: '#9ca3af',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 5,
  },
  dayTabShortActive: {
    color: '#38bdf8',
  },
  dayTabCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayTabCircleActive: {
    backgroundColor: '#38bdf8',
  },
  dayTabNumber: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  dayTabNumberActive: {
    color: '#000000',
    fontWeight: '800',
  },
  selectedDayFullText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 10,
    width: '100%',
  },
  modalScrollView: {
    flex: 1,
    width: '100%',
  },
  scrollInnerContent: {
    paddingTop: 14,
    paddingBottom: 20,
    width: '100%',
  },
  dayOverviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    width: '100%',
  },
  dayTempRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayBigTemp: {
    color: '#ffffff',
    fontSize: 38,
    fontWeight: '700',
  },
  dayMinMaxText: {
    color: '#cbd5e1',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  conditionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  chartCard: {
    backgroundColor: '#1f242d',
    borderRadius: 20,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    width: '100%',
    overflow: 'hidden',
  },
  sectionContainer: {
    marginBottom: 18,
    width: '100%',
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  precipCard: {
    backgroundColor: '#1f242d',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    width: '100%',
  },
  precipTopRow: {
    marginBottom: 14,
  },
  precipHeroValue: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
  },
  precipHeroSub: {
    color: '#cbd5e1',
    fontSize: 13,
    marginTop: 4,
  },
  precipColsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 10,
  },
  precipColBox: {
    flex: 1,
    alignItems: 'center',
  },
  precipColDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  precipColLabel: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  precipColValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  precipColNote: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  precipBarSection: {
    marginTop: 8,
  },
  precipScaleBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  precipScaleFill: {
    height: '100%',
    backgroundColor: '#38bdf8',
    borderRadius: 3,
  },
  precipScaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scaleLabelText: {
    color: '#9ca3af',
    fontSize: 10.5,
    fontWeight: '600',
  },
  comparisonList: {
    gap: 10,
    width: '100%',
  },
  comparisonCard: {
    backgroundColor: '#1f242d',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  comparisonCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  comparisonCardTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  comparisonCardDesc: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 18,
  },
  detailRowCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    width: '100%',
  },
  miniCard: {
    flex: 1,
    backgroundColor: '#1f242d',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  miniCardLabel: {
    color: '#9ca3af',
    fontSize: 12.5,
    fontWeight: '600',
    marginBottom: 4,
  },
  miniCardValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  miniCardSub: {
    color: '#cbd5e1',
    fontSize: 11.5,
  },
});
