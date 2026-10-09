import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  SafeAreaView,
  StatusBar,
  TouchableWithoutFeedback,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Navigation,
  List,
  Layers,
  Umbrella,
  Thermometer,
  Sparkles,
  Wind,
  Play,
  Pause,
  ChevronsUpDown,
  Check,
} from 'lucide-react-native';
import {
  HANOI,
  OPENWEATHER_API_KEY,
  MapLayer,
  MAP_LAYERS,
  createMapHtml,
} from './WeatherMap/mapHtml';
import { ForecastItem } from './WeatherMap/ForecastChart';

interface WeatherMapScreenProps {
  onBack?: () => void;
}

export function WeatherMapScreen({ onBack }: WeatherMapScreenProps) {
  const webViewRef = useRef<WebView>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const [selectedLayer, setSelectedLayer] = useState<MapLayer>('precipitation');
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [forecastData, setForecastData] = useState<ForecastItem[]>([]);
  const [selectedForecastIndex, setSelectedForecastIndex] = useState(0);

  const executeMapScript = (script: string) => {
    if (Platform.OS === 'web') {
      try {
        if (iframeRef.current?.contentWindow) {
          (iframeRef.current.contentWindow as any).eval(script);
        }
      } catch (err) {
        console.warn('Lỗi thực thi script trên iframe Web:', err);
      }
    } else {
      webViewRef.current?.injectJavaScript(`${script}; true;`);
    }
  };

  useEffect(() => {
    if (!isPlaying || forecastData.length === 0) return;

    const timer = setInterval(() => {
      setSelectedForecastIndex((prev) =>
        prev >= forecastData.length - 1 ? 0 : prev + 1
      );
    }, 1800);

    return () => clearInterval(timer);
  }, [isPlaying, forecastData.length]);

  const loadForecast = async (latitude: number, longitude: number) => {
    try {
      const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&lang=vi&appid=${OPENWEATHER_API_KEY}`;
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&lang=vi&cnt=8&appid=${OPENWEATHER_API_KEY}`;

      const [currentResponse, forecastResponse] = await Promise.all([
        fetch(currentUrl),
        fetch(forecastUrl),
      ]);

      if (!currentResponse.ok || !forecastResponse.ok) {
        throw new Error('Lỗi tải dữ liệu thời tiết');
      }

      const currentData = await currentResponse.json();
      const forecastDataResponse = await forecastResponse.json();

      if (!Array.isArray(forecastDataResponse.list)) {
        throw new Error('Dữ liệu forecast không hợp lệ');
      }

      const nowItem: ForecastItem = {
        dt: Number(currentData.dt) || Math.floor(Date.now() / 1000),
        temp: Number(currentData.main?.temp ?? 0),
        feelsLike: Number(currentData.main?.feels_like ?? 0),
        description: String(currentData.weather?.[0]?.description || ''),
        icon: String(currentData.weather?.[0]?.icon || ''),
        pop: Number(currentData.pop ?? 0),
        rain: Number(currentData.rain?.['1h'] ?? currentData.rain?.['3h'] ?? 0),
        windSpeed: Number(currentData.wind?.speed ?? 0),
        isNow: true,
      };

      const nextItems: ForecastItem[] = forecastDataResponse.list
        .slice(0, 8)
        .map((item: any) => ({
          dt: Number(item.dt),
          temp: Number(item.main?.temp ?? 0),
          feelsLike: Number(item.main?.feels_like ?? 0),
          description: String(item.weather?.[0]?.description || ''),
          icon: String(item.weather?.[0]?.icon || ''),
          pop: Number(item.pop ?? 0),
          rain: Number(item.rain?.['3h'] ?? 0),
          windSpeed: Number(item.wind?.speed ?? 0),
          isNow: false,
        }));

      setForecastData([nowItem, ...nextItems]);
      setSelectedForecastIndex(0);
    } catch (error) {
      console.log('Lỗi lấy dự báo:', error);
    }
  };

  useEffect(() => {
    loadForecast(HANOI.latitude, HANOI.longitude);
  }, []);

  const changeLayer = (layer: MapLayer) => {
    setSelectedLayer(layer);
    executeMapScript(`window.changeWeatherLayer('${layer}');`);
  };

  const goToHanoi = () => {
    executeMapScript(`window.goToHanoi();`);
    loadForecast(HANOI.latitude, HANOI.longitude);
  };

  const formattedDateTitle = useMemo(() => {
    const days = [
      'Chủ Nhật',
      'Thứ Hai',
      'Thứ Ba',
      'Thứ Tư',
      'Thứ Năm',
      'Thứ Sáu',
      'Thứ Bảy',
    ];
    const now = new Date();
    const dayName = days[now.getDay()];
    return `${dayName}, ngày ${now.getDate()} tháng ${now.getMonth() + 1}, ${now.getFullYear()}`;
  }, []);

  const timelineHours = useMemo(() => {
    const now = new Date();
    const currentH = now.getHours();
    const list: { label: string; isNow: boolean; hour: number }[] = [];

    const hMinus2 = (currentH - 2 + 24) % 24;
    const hMinus1 = (currentH - 1 + 24) % 24;
    list.push({ label: `${hMinus2}`, isNow: false, hour: hMinus2 });
    list.push({ label: `${hMinus1}`, isNow: false, hour: hMinus1 });
    list.push({ label: 'Bây giờ', isNow: true, hour: currentH });

    for (let i = 1; i <= 6; i++) {
      const nextH = (currentH + i * 2) % 24;
      list.push({
        label: nextH.toString().padStart(2, '0'),
        isNow: false,
        hour: nextH,
      });
    }
    return list;
  }, []);

  const legendConfig = useMemo(() => {
    switch (selectedLayer) {
      case 'precipitation':
        return {
          title: 'Lượng mưa',
          colors: [
            '#fde047',
            '#e879f9',
            '#a855f7',
            '#3b82f6',
            '#38bdf8',
            '#bae6fd',
          ] as [string, string, ...string[]],
          labels: ['Rất lớn', 'Lớn', 'Vừa', 'Nhỏ'],
        };
      case 'temperature':
        return {
          title: 'Nhiệt độ',
          colors: [
            '#ef4444',
            '#f97316',
            '#eab308',
            '#22c55e',
            '#3b82f6',
            '#1d4ed8',
          ] as [string, string, ...string[]],
          labels: ['40°+', '30°', '20°', '10°', '0°'],
        };
      case 'airQuality':
        return {
          title: 'C.lượng k.khí',
          colors: [
            '#7e22ce',
            '#ef4444',
            '#f97316',
            '#eab308',
            '#22c55e',
          ] as [string, string, ...string[]],
          labels: ['Nguy hại', 'Rất xấu', 'Kém', 'T.bình', 'Tốt'],
        };
      case 'wind':
        return {
          title: 'Gió (km/h)',
          colors: [
            '#312e81',
            '#7c3aed',
            '#c026d3',
            '#ec4899',
            '#fde047',
          ] as [string, string, ...string[]],
          labels: ['100+', '60', '40', '20', '0'],
        };
    }
  }, [selectedLayer]);

  const renderLayerIcon = (iconName: string) => {
    switch (iconName) {
      case 'Umbrella':
        return <Umbrella size={18} color="#111827" strokeWidth={2} />;
      case 'Thermometer':
        return <Thermometer size={18} color="#111827" strokeWidth={2} />;
      case 'Sparkles':
        return <Sparkles size={18} color="#111827" strokeWidth={2} />;
      case 'Wind':
        return <Wind size={18} color="#111827" strokeWidth={2} />;
      default:
        return <Umbrella size={18} color="#111827" strokeWidth={2} />;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {Platform.OS === 'web' ? (
        <iframe
          ref={iframeRef as any}
          srcDoc={createMapHtml()}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
          title="Apple Weather Map"
        />
      ) : (
        <WebView
          ref={webViewRef}
          source={{ html: createMapHtml() }}
          style={StyleSheet.absoluteFill}
          containerStyle={StyleSheet.absoluteFill}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState={false}
          mixedContentMode="always"
          allowsInlineMediaPlayback
          scrollEnabled={false}
          onLoadEnd={() => {
            executeMapScript('if (window.resizeMap) { window.resizeMap(); }');
          }}
        />
      )}

      {isLayerMenuOpen && (
        <TouchableWithoutFeedback onPress={() => setIsLayerMenuOpen(false)}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
      )}

      <SafeAreaView style={styles.overlaySafeArea} pointerEvents="box-none">
        <View style={styles.topBarContainer} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.doneButton}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Text style={styles.doneButtonText}>Xong</Text>
          </TouchableOpacity>

          <View style={styles.rightButtonsColumn}>
            <TouchableOpacity
              style={styles.rightPillButton}
              onPress={goToHanoi}
              activeOpacity={0.7}
            >
              <Navigation
                size={20}
                color="#111827"
                style={{ transform: [{ rotate: '45deg' }] }}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.rightPillButton}
              onPress={onBack}
              activeOpacity={0.7}
            >
              <List size={20} color="#111827" strokeWidth={2.2} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.rightPillButton,
                isLayerMenuOpen && styles.rightPillButtonActive,
              ]}
              onPress={() => setIsLayerMenuOpen((prev) => !prev)}
              activeOpacity={0.7}
            >
              <Layers size={20} color="#111827" strokeWidth={2.2} />
            </TouchableOpacity>
          </View>
        </View>

        {isLayerMenuOpen && (
          <View style={styles.layerPopupContainer}>
            {(Object.keys(MAP_LAYERS) as MapLayer[]).map((layerKey, idx) => {
              const layer = MAP_LAYERS[layerKey];
              const isSelected = selectedLayer === layerKey;
              const isLast = idx === Object.keys(MAP_LAYERS).length - 1;

              return (
                <TouchableOpacity
                  key={layerKey}
                  style={[
                    styles.layerPopupRow,
                    !isLast && styles.layerPopupBorder,
                  ]}
                  onPress={() => {
                    changeLayer(layerKey);
                    setIsLayerMenuOpen(false);
                  }}
                  activeOpacity={0.65}
                >
                  <View style={styles.layerPopupLeft}>
                    {isSelected ? (
                      <Check
                        size={17}
                        color="#111827"
                        strokeWidth={2.5}
                        style={{ marginRight: 8 }}
                      />
                    ) : (
                      <View style={{ width: 25 }} />
                    )}
                    <Text
                      style={[
                        styles.layerPopupText,
                        isSelected && styles.layerPopupTextBold,
                      ]}
                    >
                      {layer.name}
                    </Text>
                  </View>
                  {renderLayerIcon(layer.iconName)}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={styles.verticalLegendCard}>
          <Text style={styles.verticalLegendTitle}>{legendConfig.title}</Text>
          <View style={styles.verticalLegendBody}>
            <View style={styles.gradientStripWrapper}>
              <LinearGradient
                colors={legendConfig.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.gradientStrip}
              />
            </View>

            <View style={styles.legendLabelsColumn}>
              {legendConfig.labels.map((lbl, idx) => (
                <Text key={idx} style={styles.verticalLegendLabel}>
                  {lbl}
                </Text>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.bottomDockWrapper}>
          <View style={styles.bottomDockCard}>
            <View style={styles.dockHeaderRow}>
              <TouchableOpacity
                style={styles.playPauseCircle}
                onPress={() => setIsPlaying((prev) => !prev)}
                activeOpacity={0.7}
              >
                {isPlaying ? (
                  <Pause size={16} color="#111827" strokeWidth={2.5} />
                ) : (
                  <Play size={16} color="#111827" strokeWidth={2.5} style={{ marginLeft: 2 }} />
                )}
              </TouchableOpacity>

              <View style={styles.dockTitleCol}>
                <View style={styles.dockTitleRow}>
                  <Text style={styles.dockTitleText}>Dự báo 12 giờ</Text>
                  <ChevronsUpDown size={14} color="#64748b" style={{ marginLeft: 4 }} />
                </View>
                <Text style={styles.dockSubDateText}>{formattedDateTitle}</Text>
              </View>
            </View>

            <View style={styles.timelineScrubberWrapper}>
              <View style={styles.scrubberTrack}>
                <View
                  style={[
                    styles.scrubberThumb,
                    {
                      left: `${Math.min(
                        94,
                        Math.max(
                            2,
                          (selectedForecastIndex /
                            Math.max(timelineHours.length - 1, 1)) *
                            94
                        )
                      )}%`,
                    },
                  ]}
                />
              </View>

              <View style={styles.timelineHoursRow}>
                {timelineHours.map((item, idx) => {
                  const isActive = idx === selectedForecastIndex;
                  return (
                    <TouchableOpacity
                      key={`${item.label}-${idx}`}
                      style={styles.timelineHourItem}
                      onPress={() => setSelectedForecastIndex(idx)}
                      activeOpacity={0.6}
                    >
                      <Text
                        style={[
                          styles.timelineHourText,
                          item.isNow && styles.timelineNowText,
                          isActive && styles.timelineActiveText,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <TouchableOpacity activeOpacity={0.7} style={styles.mapAttributionLink}>
              <Text style={styles.mapAttributionText}>Dữ liệu bản đồ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e293b',
  },
  overlaySafeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBarContainer: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 28) + 12 : 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 50,
  },
  doneButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 4,
  },
  doneButtonText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  rightButtonsColumn: {
    alignItems: 'center',
    gap: 10,
  },
  rightPillButton: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 4,
  },
  rightPillButtonActive: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#3b82f6',
  },
  layerPopupContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 140 : 110,
    right: 16,
    width: 218,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 18,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 100,
  },
  layerPopupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  layerPopupBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  layerPopupLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  layerPopupText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#0f172a',
  },
  layerPopupTextBold: {
    fontWeight: '700',
  },
  verticalLegendCard: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 95 : 68,
    left: 16,
    width: 108,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 40,
  },
  verticalLegendTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10,
  },
  verticalLegendBody: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 140,
  },
  gradientStripWrapper: {
    width: 5,
    height: '100%',
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 10,
  },
  gradientStrip: {
    width: '100%',
    height: '100%',
  },
  legendLabelsColumn: {
    flex: 1,
    height: '100%',
    justifyContent: 'space-between',
  },
  verticalLegendLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  bottomDockWrapper: {
    paddingHorizontal: 14,
    paddingBottom: Platform.OS === 'android' ? 16 : 8,
    zIndex: 50,
  },
  bottomDockCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 8,
  },
  dockHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playPauseCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dockTitleCol: {
    flex: 1,
  },
  dockTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dockTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  dockSubDateText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 1,
  },
  timelineScrubberWrapper: {
    marginTop: 14,
    marginBottom: 6,
  },
  scrubberTrack: {
    height: 3,
    backgroundColor: '#cbd5e1',
    borderRadius: 1.5,
    position: 'relative',
    marginHorizontal: 4,
    marginBottom: 10,
  },
  scrubberThumb: {
    position: 'absolute',
    top: -5,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#0f172a',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  timelineHoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineHourItem: {
    paddingVertical: 2,
    paddingHorizontal: 2,
    alignItems: 'center',
  },
  timelineHourText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  timelineNowText: {
    fontWeight: '700',
    color: '#0f172a',
  },
  timelineActiveText: {
    color: '#0284c7',
    fontWeight: '700',
  },
  mapAttributionLink: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  mapAttributionText: {
    fontSize: 10,
    color: '#64748b',
    textDecorationLine: 'underline',
  },
});