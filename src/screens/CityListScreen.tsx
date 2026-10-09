import React, { useState } from "react";
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
  Alert,
  Modal,
  Platform,
} from "react-native";
import {
  Search,
  Mic,
  MoreHorizontal,
  X,
  MapPin,
  Pencil,
  Bell,
  Check,
  SlidersHorizontal,
  MessageSquare,
  Map as MapIcon,
} from "lucide-react-native";
import {
  CurrentWeatherData,
  CitySearchResult,
  WeatherUnitsSettings,
  DEFAULT_WEATHER_UNITS,
} from "../types/weather";
import { CityCard } from "../components/CityCard";
import { WeatherDetailScreen } from "./WeatherDetailScreen";
import { UnitSettingsModal } from "../components/UnitSettingsModal";
import {
  searchCities,
  fetchWeatherByCoordinates,
} from "../api/weatherApi";

interface CityListScreenProps {
  currentWeather: CurrentWeatherData | null;
  savedCitiesWeather: CurrentWeatherData[];
  units?: WeatherUnitsSettings;
  onUpdateUnits?: (newUnits: WeatherUnitsSettings) => void;
  onSelectCity: (
    weather: CurrentWeatherData,
    isCurrentLocation: boolean,
    cityIndex: number,
  ) => void;
  onRefreshCurrentLocation: () => Promise<void>;
  onRefreshSavedCities: () => Promise<void>;
  onSaveCities: (cities: CurrentWeatherData[]) => Promise<void>;
  loadingLocation: boolean;
  onOpenMap?: () => void;
}

export const CityListScreen: React.FC<CityListScreenProps> = ({
  currentWeather,
  savedCitiesWeather,
  units = DEFAULT_WEATHER_UNITS,
  onUpdateUnits,
  onSelectCity,
  onRefreshCurrentLocation,
  onRefreshSavedCities,
  onSaveCities,
  loadingLocation,
  onOpenMap,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CitySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [previewWeather, setPreviewWeather] = useState<CurrentWeatherData | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showUnitsModal, setShowUnitsModal] = useState(false);

  const handleToggleTempUnit = (unit: "C" | "F") => {
    onUpdateUnits?.({
      ...units,
      temp: unit,
    });
    setShowMoreMenu(false);
  };

  const handleDeleteCityDirect = async (city: CurrentWeatherData) => {
    const updated = savedCitiesWeather.filter(
      (savedCity) =>
        savedCity.coord.lat !== city.coord.lat ||
        savedCity.coord.lon !== city.coord.lon,
    );
    await onSaveCities(updated);
  };

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
      console.warn("Lỗi tìm kiếm thành phố:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = async (item: CitySearchResult) => {
    Keyboard.dismiss();
    setSearchQuery("");
    setSearchResults([]);
    setLoadingPreview(true);
    try {
      const weather = await fetchWeatherByCoordinates(item.lat, item.lon);
      weather.name = item.name;
      setPreviewWeather(weather);
    } catch {
      Alert.alert(
        "Thông báo",
        "Không thể lấy dữ liệu thời tiết của thành phố này.",
      );
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleAddPreviewCity = async (weather: CurrentWeatherData) => {
    const exists = savedCitiesWeather.some(
      (city) =>
        city.coord.lat === weather.coord.lat &&
        city.coord.lon === weather.coord.lon,
    );

    if (!exists) {
      const updated = [...savedCitiesWeather, weather];
      await onSaveCities(updated);
    }
    setPreviewWeather(null);
  };

  const handleDeleteCity = (city: CurrentWeatherData) => {
    const cityName = city.name;
    Alert.alert(
      "Xoá thành phố",
      `Bạn có muốn xoá "${cityName}" khỏi danh sách?`,
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Xoá",
          style: "destructive",
          onPress: async () => {
            handleDeleteCityDirect(city);
          },
        },
      ],
    );
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([onRefreshCurrentLocation(), onRefreshSavedCities()]);
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <View style={styles.topBar}>
        <View style={{ flex: 1 }} />
        {isEditMode ? (
          <TouchableOpacity
            style={styles.doneTextButton}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 15, right: 15 }}
            onPress={() => setIsEditMode(false)}
          >
            <Text style={styles.doneText}>Xong</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.moreButton}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 15, right: 15 }}
            onPress={() => setShowMoreMenu(true)}
          >
            <MoreHorizontal size={22} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.headerTitle}>Thời tiết</Text>
      </View>

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
            editable={!isEditMode}
            underlineColorAndroid="transparent"
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => handleSearch("")}>
              <X size={16} color="#8e8e93" />
            </TouchableOpacity>
          ) : (
            <Mic size={18} color="#8e8e93" />
          )}
        </View>
      </View>

      {!isEditMode && searchQuery.trim().length > 0 && (
        <View style={styles.searchResultsContainer}>
          {isSearching ? (
            <ActivityIndicator
              size="small"
              color="#ffffff"
              style={{ marginVertical: 15 }}
            />
          ) : searchResults.length > 0 ? (
            <ScrollView keyboardShouldPersistTaps="handled">
              {searchResults.map((item, idx) => (
                <TouchableOpacity
                  key={`${item.lat}-${item.lon}-${idx}`}
                  style={styles.searchResultItem}
                  onPress={() => handleSelectSearchResult(item)}
                >
                  <MapPin
                    size={18}
                    color="#94a3b8"
                    style={{ marginRight: 10 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.searchCityName}>{item.name}</Text>
                    <Text style={styles.searchCityState}>
                      {[item.state, item.country].filter(Boolean).join(", ")}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.noResultsText}>
              Không tìm thấy kết quả phù hợp
            </Text>
          )}
        </View>
      )}

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
        {currentWeather ? (
          <CityCard
            weatherData={currentWeather}
            isCurrentLocation={true}
            isEditMode={isEditMode}
            tempUnit={units.temp}
            onPress={() => {
              if (!isEditMode) {
                onSelectCity(currentWeather, true, 0);
              }
            }}
          />
        ) : (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color="#ffffff" />
            <Text style={styles.loadingCardText}>Đang định vị...</Text>
          </View>
        )}

        {savedCitiesWeather.map((cityWeather, index) => (
          <CityCard
            key={`${cityWeather.coord.lat}-${cityWeather.coord.lon}`}
            weatherData={cityWeather}
            isCurrentLocation={false}
            isEditMode={isEditMode}
            tempUnit={units.temp}
            onPress={() => {
              if (!isEditMode) {
                onSelectCity(
                  cityWeather,
                  false,
                  currentWeather ? index + 1 : index,
                );
              }
            }}
            onLongPress={() => handleDeleteCity(cityWeather)}
            onDelete={() => handleDeleteCityDirect(cityWeather)}
          />
        ))}

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            Tìm hiểu thêm về{" "}
            <Text style={styles.footerLink}>dữ liệu thời tiết</Text> và{" "}
            <Text style={styles.footerLink}>dữ liệu bản đồ</Text>
          </Text>
        </View>
      </ScrollView>

      {!isEditMode && (
        <View style={styles.cityListBottomBar}>
          <TouchableOpacity
            style={styles.mapIconButton}
            onPress={onOpenMap}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <MapIcon size={24} color="#ffffff" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={showMoreMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMoreMenu(false)}
      >
        <TouchableOpacity
          style={styles.menuBackdrop}
          activeOpacity={1}
          onPress={() => setShowMoreMenu(false)}
        >
          <View style={styles.menuPopupContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.6}
              onPress={() => {
                setShowMoreMenu(false);
                setIsEditMode(true);
              }}
            >
              <Text style={styles.menuItemText}>Sửa danh sách</Text>
              <Pencil size={19} color="#ffffff" strokeWidth={2} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.6}
              onPress={() => {
                setShowMoreMenu(false);
                Alert.alert("Thông báo", "Bạn đã bật thông báo thời tiết cho các địa điểm đã lưu.");
              }}
            >
              <Text style={styles.menuItemText}>Thông báo</Text>
              <Bell size={19} color="#ffffff" strokeWidth={2} />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.6}
              onPress={() => handleToggleTempUnit("C")}
            >
              <View style={styles.menuCheckRow}>
                {units.temp === "C" ? (
                  <Check size={16} color="#ffffff" strokeWidth={2.5} style={styles.checkIcon} />
                ) : (
                  <View style={styles.checkPlaceholder} />
                )}
                <Text style={styles.menuItemText}>Độ C</Text>
              </View>
              <Text style={styles.menuUnitBadge}>°C</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.6}
              onPress={() => handleToggleTempUnit("F")}
            >
              <View style={styles.menuCheckRow}>
                {units.temp === "F" ? (
                  <Check size={16} color="#ffffff" strokeWidth={2.5} style={styles.checkIcon} />
                ) : (
                  <View style={styles.checkPlaceholder} />
                )}
                <Text style={styles.menuItemText}>Độ F</Text>
              </View>
              <Text style={styles.menuUnitBadge}>°F</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.6}
              onPress={() => {
                setShowMoreMenu(false);
                setShowUnitsModal(true);
              }}
            >
              <Text style={styles.menuItemText}>Đơn vị</Text>
              <SlidersHorizontal size={19} color="#ffffff" strokeWidth={2} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.6}
              onPress={() => {
                setShowMoreMenu(false);
                Alert.alert("Báo cáo sự cố", "Cảm ơn bạn đã phản hồi để cải thiện dữ liệu thời tiết.");
              }}
            >
              <Text style={styles.menuItemText}>Báo cáo sự cố</Text>
              <MessageSquare size={19} color="#ffffff" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <UnitSettingsModal
        visible={showUnitsModal}
        onClose={() => setShowUnitsModal(false)}
        units={units}
        onUpdateUnits={onUpdateUnits || (() => {})}
      />

      <Modal
        visible={!!previewWeather}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPreviewWeather(null)}
      >
        <View style={styles.previewBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setPreviewWeather(null)}
          />
          <View style={styles.previewSheetContainer}>
            {previewWeather && (
              <WeatherDetailScreen
                weatherData={previewWeather}
                isCurrentLocation={false}
                isPreviewMode={true}
                isAlreadySaved={savedCitiesWeather.some(
                  (city) =>
                    city.coord.lat === previewWeather.coord.lat &&
                    city.coord.lon === previewWeather.coord.lon,
                )}
                onBack={() => setPreviewWeather(null)}
                onAddCity={() => handleAddPreviewCity(previewWeather)}
              />
            )}
          </View>
        </View>
      </Modal>

      {loadingPreview && (
        <View style={styles.previewLoadingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.previewLoadingText}>Đang tải thời tiết...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 6 : 0,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 6,
    minHeight: 38,
  },
  doneTextButton: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  doneText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  titleContainer: {
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.35,
  },
  moreButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1.5,
    borderColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1c1c1e",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 16,
    height: "100%",
    paddingVertical: 0,
    ...(Platform.OS === "web"
      ? ({
          outlineStyle: "none",
          outlineWidth: 0,
          outlineColor: "transparent",
        } as any)
      : {}),
  },
  searchResultsContainer: {
    marginHorizontal: 16,
    backgroundColor: "#1c1c1e",
    borderRadius: 14,
    maxHeight: 220,
    marginBottom: 10,
    paddingVertical: 6,
    zIndex: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  searchCityName: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  searchCityState: {
    color: "#94a3b8",
    fontSize: 13,
    marginTop: 2,
  },
  noResultsText: {
    color: "#94a3b8",
    textAlign: "center",
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
    backgroundColor: "#1e293b",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  loadingCardText: {
    color: "#94a3b8",
    fontSize: 15,
  },
  footerContainer: {
    marginTop: 24,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  footerText: {
    color: "#8e8e93",
    fontSize: 12,
    textAlign: "center",
  },
  footerLink: {
    color: "#8e8e93",
    textDecorationLine: "underline",
  },
  previewBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "flex-end",
  },
  previewSheetContainer: {
    height: "96.5%",
    width: "100%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    backgroundColor: "#0f172a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  previewLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  previewLoadingText: {
    color: "#ffffff",
    marginTop: 12,
    fontSize: 15,
    fontWeight: "500",
  },
  doneButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  doneButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  menuPopupContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 100 : 54,
    right: 16,
    width: 250,
    backgroundColor: "rgba(38, 38, 42, 0.96)",
    borderRadius: 15,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  menuItemText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "400",
  },
  menuCheckRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkIcon: {
    marginRight: 10,
  },
  checkPlaceholder: {
    width: 26,
  },
  menuUnitBadge: {
    color: "rgba(255, 255, 255, 0.55)",
    fontSize: 15,
    fontWeight: "500",
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    marginVertical: 4,
  },
  cityListBottomBar: {
    height: 48,
    paddingHorizontal: 18,
    justifyContent: "center",
    alignItems: "flex-start",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255, 255, 255, 0.18)",
    backgroundColor: "#000000",
  },
  mapIconButton: {
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },
});
