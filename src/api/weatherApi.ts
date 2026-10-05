import axios from 'axios';
import * as Location from 'expo-location';
import { CurrentWeatherData, ForecastData, CitySearchResult } from '../types/weather';
import { WeatherType } from '../components/WeatherBackground';

const API_KEY = '9a2e4548f4742faed9ee647449ff61ef';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEO_URL = 'https://api.openweathermap.org/geo/1.0';

// 1. Lấy thông tin địa chỉ chi tiết (Tỉnh/Thành phố) từ toạ độ GPS
export const getDetailedAddress = async (lat: number, lon: number): Promise<string> => {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
    if (results && results.length > 0) {
      const info = results[0];
      if (info.region) return info.region;
      if (info.subregion) return info.subregion;
      if (info.city) return info.city;
      if (info.district) return info.district;
    }
  } catch (error) {
    console.warn('Reverse geocode error:', error);
  }
  return '';
};

// 2. Lấy thời tiết hiện tại theo toạ độ GPS
export const fetchCurrentWeather = async (lat: number, lon: number): Promise<CurrentWeatherData> => {
  const response = await axios.get(`${BASE_URL}/weather`, {
    params: {
      lat,
      lon,
      appid: API_KEY,
      units: 'metric',
      lang: 'vi',
    },
  });
  return response.data;
};

// 3. Lấy dự báo theo giờ & ngày theo toạ độ GPS
export const fetchForecast = async (lat: number, lon: number): Promise<ForecastData> => {
  const response = await axios.get(`${BASE_URL}/forecast`, {
    params: {
      lat,
      lon,
      appid: API_KEY,
      units: 'metric',
      lang: 'vi',
    },
  });
  return response.data;
};

// 4. Lấy thời tiết theo tên thành phố
export const fetchWeatherByCity = async (cityName: string): Promise<CurrentWeatherData> => {
  const response = await axios.get(`${BASE_URL}/weather`, {
    params: {
      q: cityName,
      appid: API_KEY,
      units: 'metric',
      lang: 'vi',
    },
  });
  return response.data;
};

// 5. Lấy dự báo theo tên thành phố
export const fetchForecastByCity = async (cityName: string): Promise<ForecastData> => {
  const response = await axios.get(`${BASE_URL}/forecast`, {
    params: {
      q: cityName,
      appid: API_KEY,
      units: 'metric',
      lang: 'vi',
    },
  });
  return response.data;
};

// 6. Tìm kiếm danh sách gợi ý thành phố
export const searchCities = async (query: string): Promise<CitySearchResult[]> => {
  if (!query || query.trim().length === 0) return [];
  const response = await axios.get(`${GEO_URL}/direct`, {
    params: {
      q: query.trim(),
      limit: 6,
      appid: API_KEY,
    },
  });
  return response.data;
};

export interface WeatherTheme {
  weatherType: WeatherType;
  gradientColors: [string, string, ...string[]];
  isLightBackground: boolean;
  cardBg: string;
  cardBorder: string;
}

// 7. Xác định Theme, Gradient và Hiệu ứng thời tiết (Mưa / Nắng / Mây / Đêm)
export const getWeatherTheme = (iconCode?: string, conditionMain?: string): WeatherTheme => {
  const isNight = iconCode ? iconCode.includes('n') : false;
  const main = (conditionMain || '').toLowerCase();

  // 1. Mưa / Dông bão -> Hiệu ứng hạt mưa rơi
  if (main.includes('rain') || main.includes('drizzle') || main.includes('mưa') || main.includes('thunder') || main.includes('sấm')) {
    return {
      weatherType: 'rain',
      gradientColors: ['#1e293b', '#2e3e50', '#141d26'],
      isLightBackground: false,
      cardBg: 'rgba(255, 255, 255, 0.12)',
      cardBorder: 'rgba(255, 255, 255, 0.12)',
    };
  }

  // 2. Ban đêm -> Sao lấp lánh & Ánh trăng
  if (isNight) {
    return {
      weatherType: 'night',
      gradientColors: ['#090d16', '#111827', '#030712'],
      isLightBackground: false,
      cardBg: 'rgba(255, 255, 255, 0.1)',
      cardBorder: 'rgba(255, 255, 255, 0.1)',
    };
  }

  // 3. Ban ngày trời quang / nắng gắt -> Hiệu ứng Nắng mặt trời + Tia sáng rực rỡ
  if (main.includes('clear') || (iconCode && iconCode.startsWith('01d'))) {
    return {
      weatherType: 'sun',
      gradientColors: ['#2563eb', '#38bdf8', '#60a5fa'],
      isLightBackground: true,
      cardBg: 'rgba(255, 255, 255, 0.22)',
      cardBorder: 'rgba(255, 255, 255, 0.3)',
    };
  }

  // 4. Ban ngày có mây / râm mát (như Ảnh 2) -> Bầu trời xanh mây trắng bồng bềnh
  return {
    weatherType: 'cloud',
    gradientColors: ['#5b9bd5', '#8bbde2', '#bfe0f7'],
    isLightBackground: true,
    cardBg: 'rgba(255, 255, 255, 0.28)',
    cardBorder: 'rgba(255, 255, 255, 0.38)',
  };
};

// Giữ lại hàm cũ để tương thích
export const getWeatherGradient = (iconCode?: string, conditionMain?: string): [string, string, ...string[]] => {
  return getWeatherTheme(iconCode, conditionMain).gradientColors;
};

// 8. Định dạng giờ (ví dụ: "14:00" hoặc "Bây giờ")
export const formatForecastHour = (dtTxt: string, index: number): string => {
  if (index === 0) return 'Bây giờ';
  const date = new Date(dtTxt);
  const hours = date.getHours().toString().padStart(2, '0');
  return `${hours}:00`;
};

// 9. Định dạng thứ trong tuần (Thứ Hai, Thứ Ba, Hôm nay...)
export const formatForecastDay = (dtTxt: string, index: number): string => {
  if (index === 0) return 'Hôm nay';
  const date = new Date(dtTxt);
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  return days[date.getDay()];
};