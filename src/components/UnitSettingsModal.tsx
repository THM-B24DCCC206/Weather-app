import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native';
import { Check, ChevronsUpDown } from 'lucide-react-native';
import {
  WeatherUnitsSettings,
  TempUnit,
  WindUnit,
  RainUnit,
  PressureUnit,
  DistanceUnit,
  DEFAULT_WEATHER_UNITS,
} from '../types/weather';

interface UnitSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  units: WeatherUnitsSettings;
  onUpdateUnits: (newUnits: WeatherUnitsSettings) => void;
}

type PickerType = 'wind' | 'rain' | 'pressure' | 'distance' | null;

interface UnitDropdownOption<T> {
  value: T;
  label: string;
}

const WIND_DROPDOWN_OPTIONS: UnitDropdownOption<WindUnit>[] = [
  { value: 'mi/h', label: 'Dặm/giờ (mi/h)' },
  { value: 'km/h', label: 'Kilômét/giờ (km/h)' },
  { value: 'm/s', label: 'Mét/giây (m/s)' },
  { value: 'bft', label: 'Beaufort (bft)' },
  { value: 'kn', label: 'Knot (kn)' },
];

const RAIN_DROPDOWN_OPTIONS: UnitDropdownOption<RainUnit>[] = [
  { value: 'mm', label: 'Milimét (mm)' },
  { value: 'cm', label: 'Centimét (cm)' },
  { value: 'in', label: 'Inch (in)' },
];

const PRESSURE_DROPDOWN_OPTIONS: UnitDropdownOption<PressureUnit>[] = [
  { value: 'hPa', label: 'Hectopascal (hPa)' },
  { value: 'mmHg', label: 'Milimét thủy ngân (mmHg)' },
  { value: 'inHg', label: 'Inch thủy ngân (inHg)' },
  { value: 'mbar', label: 'Millibar (mbar)' },
  { value: 'atm', label: 'Atmosphere (atm)' },
];

const DISTANCE_DROPDOWN_OPTIONS: UnitDropdownOption<DistanceUnit>[] = [
  { value: 'km', label: 'Kilômét (km)' },
  { value: 'mi', label: 'Dặm (mi)' },
  { value: 'NM', label: 'Hải lý (NM)' },
];

export const UnitSettingsModal: React.FC<UnitSettingsModalProps> = ({
  visible,
  onClose,
  units,
  onUpdateUnits,
}) => {
  const [activePicker, setActivePicker] = useState<PickerType>(null);
  const [pickerTopOffset, setPickerTopOffset] = useState<number>(200);

  const handleSelectTemp = (tempUnit: TempUnit) => {
    onUpdateUnits({
      ...units,
      temp: tempUnit,
    });
  };

  const handleSelectWind = (windUnit: WindUnit) => {
    onUpdateUnits({
      ...units,
      wind: windUnit,
    });
    setActivePicker(null);
  };

  const handleSelectRain = (rainUnit: RainUnit) => {
    onUpdateUnits({
      ...units,
      rain: rainUnit,
    });
    setActivePicker(null);
  };

  const handleSelectPressure = (pressureUnit: PressureUnit) => {
    onUpdateUnits({
      ...units,
      pressure: pressureUnit,
    });
    setActivePicker(null);
  };

  const handleSelectDistance = (distanceUnit: DistanceUnit) => {
    onUpdateUnits({
      ...units,
      distance: distanceUnit,
    });
    setActivePicker(null);
  };

  const handleResetDefaults = () => {
    onUpdateUnits({ ...DEFAULT_WEATHER_UNITS });
  };

  const openPicker = (type: PickerType, offset: number) => {
    setPickerTopOffset(offset);
    setActivePicker(type);
  };

  const renderDropdownPopup = () => {
    if (!activePicker) return null;

    let optionsList: React.ReactNode = null;

    if (activePicker === 'wind') {
      optionsList = WIND_DROPDOWN_OPTIONS.map((opt, idx) => {
        const isSelected = units.wind === opt.value;
        const isLast = idx === WIND_DROPDOWN_OPTIONS.length - 1;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.dropdownItem, !isLast && styles.dropdownDivider]}
            activeOpacity={0.65}
            onPress={() => handleSelectWind(opt.value)}
          >
            <View style={styles.dropdownCheckRow}>
              {isSelected ? (
                <Check
                  size={17}
                  color="#ffffff"
                  strokeWidth={2.5}
                  style={styles.dropdownCheckIcon}
                />
              ) : (
                <View style={styles.dropdownCheckPlaceholder} />
              )}
              <Text style={styles.dropdownItemText}>{opt.label}</Text>
            </View>
          </TouchableOpacity>
        );
      });
    } else if (activePicker === 'rain') {
      optionsList = RAIN_DROPDOWN_OPTIONS.map((opt, idx) => {
        const isSelected = units.rain === opt.value;
        const isLast = idx === RAIN_DROPDOWN_OPTIONS.length - 1;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.dropdownItem, !isLast && styles.dropdownDivider]}
            activeOpacity={0.65}
            onPress={() => handleSelectRain(opt.value)}
          >
            <View style={styles.dropdownCheckRow}>
              {isSelected ? (
                <Check
                  size={17}
                  color="#ffffff"
                  strokeWidth={2.5}
                  style={styles.dropdownCheckIcon}
                />
              ) : (
                <View style={styles.dropdownCheckPlaceholder} />
              )}
              <Text style={styles.dropdownItemText}>{opt.label}</Text>
            </View>
          </TouchableOpacity>
        );
      });
    } else if (activePicker === 'pressure') {
      optionsList = PRESSURE_DROPDOWN_OPTIONS.map((opt, idx) => {
        const isSelected = units.pressure === opt.value;
        const isLast = idx === PRESSURE_DROPDOWN_OPTIONS.length - 1;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.dropdownItem, !isLast && styles.dropdownDivider]}
            activeOpacity={0.65}
            onPress={() => handleSelectPressure(opt.value)}
          >
            <View style={styles.dropdownCheckRow}>
              {isSelected ? (
                <Check
                  size={17}
                  color="#ffffff"
                  strokeWidth={2.5}
                  style={styles.dropdownCheckIcon}
                />
              ) : (
                <View style={styles.dropdownCheckPlaceholder} />
              )}
              <Text style={styles.dropdownItemText}>{opt.label}</Text>
            </View>
          </TouchableOpacity>
        );
      });
    } else if (activePicker === 'distance') {
      optionsList = DISTANCE_DROPDOWN_OPTIONS.map((opt, idx) => {
        const isSelected = units.distance === opt.value;
        const isLast = idx === DISTANCE_DROPDOWN_OPTIONS.length - 1;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.dropdownItem, !isLast && styles.dropdownDivider]}
            activeOpacity={0.65}
            onPress={() => handleSelectDistance(opt.value)}
          >
            <View style={styles.dropdownCheckRow}>
              {isSelected ? (
                <Check
                  size={17}
                  color="#ffffff"
                  strokeWidth={2.5}
                  style={styles.dropdownCheckIcon}
                />
              ) : (
                <View style={styles.dropdownCheckPlaceholder} />
              )}
              <Text style={styles.dropdownItemText}>{opt.label}</Text>
            </View>
          </TouchableOpacity>
        );
      });
    }

    return (
      <Modal
        visible={true}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setActivePicker(null)}
      >
        <TouchableOpacity
          style={styles.dropdownBackdrop}
          activeOpacity={1}
          onPress={() => setActivePicker(null)}
        >
          <View
            style={[
              styles.dropdownPopupContainer,
              { top: Math.min(pickerTopOffset, Platform.OS === 'web' ? 400 : 380) },
            ]}
          >
            {optionsList}
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.sheetContainer}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
              <View style={styles.headerLeftPlaceholder} />
              <Text style={styles.headerTitle}>Đơn vị</Text>
              <TouchableOpacity
                onPress={onClose}
                style={styles.doneButton}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={styles.doneButtonText}>Xong</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.sectionHeader}>NHIỆT ĐỘ</Text>
              <View style={styles.cardGroup}>
                <TouchableOpacity
                  style={styles.cardRow}
                  activeOpacity={0.6}
                  onPress={() => handleSelectTemp('C')}
                >
                  <Text style={styles.rowLabel}>Độ C (°C)</Text>
                  {units.temp === 'C' ? (
                    <Check size={20} color="#0a84ff" strokeWidth={2.5} />
                  ) : null}
                </TouchableOpacity>

                <View style={styles.rowDivider} />

                <TouchableOpacity
                  style={styles.cardRow}
                  activeOpacity={0.6}
                  onPress={() => handleSelectTemp('F')}
                >
                  <Text style={styles.rowLabel}>Độ F (°F)</Text>
                  {units.temp === 'F' ? (
                    <Check size={20} color="#0a84ff" strokeWidth={2.5} />
                  ) : null}
                </TouchableOpacity>

                <View style={styles.rowDivider} />

                <TouchableOpacity
                  style={styles.cardRow}
                  activeOpacity={0.6}
                  onPress={() => handleSelectTemp('system')}
                >
                  <Text style={styles.rowLabel}>Sử dụng cài đặt hệ thống (°C)</Text>
                  {units.temp === 'system' ? (
                    <Check size={20} color="#0a84ff" strokeWidth={2.5} />
                  ) : null}
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionHeader}>CÁC ĐƠN VỊ KHÁC</Text>
              <View style={styles.cardGroup}>
                <TouchableOpacity
                  style={styles.cardRow}
                  activeOpacity={0.6}
                  onPress={(e) => {
                    const y = (e.nativeEvent as any)?.pageY || 240;
                    openPicker('wind', y - 40);
                  }}
                >
                  <Text style={styles.rowLabel}>Gió</Text>
                  <View style={styles.rightValueRow}>
                    <Text style={styles.rightValueText}>{units.wind}</Text>
                    <ChevronsUpDown size={16} color="#8e8e93" style={styles.chevronIcon} />
                  </View>
                </TouchableOpacity>

                <View style={styles.rowDivider} />

                <TouchableOpacity
                  style={styles.cardRow}
                  activeOpacity={0.6}
                  onPress={(e) => {
                    const y = (e.nativeEvent as any)?.pageY || 290;
                    openPicker('rain', y - 40);
                  }}
                >
                  <Text style={styles.rowLabel}>Lượng mưa</Text>
                  <View style={styles.rightValueRow}>
                    <Text style={styles.rightValueText}>{units.rain}</Text>
                    <ChevronsUpDown size={16} color="#8e8e93" style={styles.chevronIcon} />
                  </View>
                </TouchableOpacity>

                <View style={styles.rowDivider} />

                <TouchableOpacity
                  style={styles.cardRow}
                  activeOpacity={0.6}
                  onPress={(e) => {
                    const y = (e.nativeEvent as any)?.pageY || 340;
                    openPicker('pressure', y - 40);
                  }}
                >
                  <Text style={styles.rowLabel}>Áp suất</Text>
                  <View style={styles.rightValueRow}>
                    <Text style={styles.rightValueText}>{units.pressure}</Text>
                    <ChevronsUpDown size={16} color="#8e8e93" style={styles.chevronIcon} />
                  </View>
                </TouchableOpacity>

                <View style={styles.rowDivider} />

                <TouchableOpacity
                  style={styles.cardRow}
                  activeOpacity={0.6}
                  onPress={(e) => {
                    const y = (e.nativeEvent as any)?.pageY || 390;
                    openPicker('distance', y - 40);
                  }}
                >
                  <Text style={styles.rowLabel}>Khoảng cách</Text>
                  <View style={styles.rightValueRow}>
                    <Text style={styles.rightValueText}>{units.distance}</Text>
                    <ChevronsUpDown size={16} color="#8e8e93" style={styles.chevronIcon} />
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.resetCardGroup}>
                <TouchableOpacity
                  style={styles.resetButtonRow}
                  activeOpacity={0.6}
                  onPress={handleResetDefaults}
                >
                  <Text style={styles.resetButtonText}>Khôi phục mặc định</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.footerNote}>
                Đặt tất cả các đơn vị thời tiết về mặc định cho vùng của bạn.
              </Text>
            </ScrollView>
          </SafeAreaView>
        </View>

        {renderDropdownPopup()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheetContainer: {
    height: '96.5%',
    width: '100%',
    backgroundColor: '#000000',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 20,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeftPlaceholder: {
    width: 50,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
  },
  doneButton: {
    paddingVertical: 6,
    paddingHorizontal: 6,
    minWidth: 50,
    alignItems: 'flex-end',
  },
  doneButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 40,
  },
  sectionHeader: {
    color: '#8e8e93',
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: -0.08,
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 8,
  },
  cardGroup: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 48,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#38383a',
    marginLeft: 16,
  },
  rowLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '400',
  },
  rightValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightValueText: {
    color: '#8e8e93',
    fontSize: 16,
    marginRight: 6,
  },
  chevronIcon: {
    marginTop: 1,
  },
  resetCardGroup: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 28,
    overflow: 'hidden',
  },
  resetButtonRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'flex-start',
  },
  resetButtonText: {
    color: '#0a84ff',
    fontSize: 16,
    fontWeight: '400',
  },
  footerNote: {
    color: '#8e8e93',
    fontSize: 13,
    paddingHorizontal: 32,
    marginTop: 8,
    lineHeight: 18,
  },
  dropdownBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  dropdownPopupContainer: {
    position: 'absolute',
    right: 16,
    width: 255,
    backgroundColor: 'rgba(38, 38, 42, 0.98)',
    borderRadius: 14,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  dropdownDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
  },
  dropdownCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownCheckIcon: {
    marginRight: 8,
  },
  dropdownCheckPlaceholder: {
    width: 25,
  },
  dropdownItemText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '400',
  },
});
