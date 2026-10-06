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

// 7. Hàm kiểm tra xem hiện tại là Ban ngày hay Ban đêm chuẩn xác
export const checkIsNight = (
  iconCode?: string,
  sys?: { sunrise?: number; sunset?: number },
  dt?: number
): boolean => {
  if (iconCode && iconCode.includes('n')) {
    return true;
  }

  if (sys?.sunrise && sys?.sunset) {
    const currentTimestamp = dt || Math.floor(Date.now() / 1000);
    if (currentTimestamp < sys.sunrise || currentTimestamp >= sys.sunset) {
      return true;
    }
  }

  const currentHour = new Date().getHours();
  if (currentHour >= 18 || currentHour < 6) {
    return true;
  }

  return false;
};

// 8. Phân loại Theme & Ảnh nền chính xác giữa Nắng / Mây / Mưa / Đêm
export const getWeatherTheme = (
  iconCode?: string,
  conditionMain?: string,
  sys?: { sunrise?: number; sunset?: number },
  dt?: number
): WeatherTheme => {
  const isNight = checkIsNight(iconCode, sys, dt);
  const main = (conditionMain || '').toLowerCase();
  const code = (iconCode || '').toLowerCase();

  // 1. Mưa / Dông bão -> Nền mưa & Hạt mưa rơi
  if (
    main.includes('rain') ||
    main.includes('drizzle') ||
    main.includes('mưa') ||
    main.includes('thunder') ||
    main.includes('sấm')
  ) {
    return {
      weatherType: 'rain',
      gradientColors: ['#0f172a', '#1e293b', '#0f172a'],
      isLightBackground: false,
      cardBg: 'rgba(15, 23, 42, 0.68)',
      cardBorder: 'rgba(255, 255, 255, 0.15)',
    };
  }

  // 2. Ban đêm -> Nền đêm tối + Trăng sao lấp lánh
  if (isNight) {
    return {
      weatherType: 'night',
      gradientColors: ['#090d16', '#111827', '#030712'],
      isLightBackground: false,
      cardBg: 'rgba(15, 23, 42, 0.65)',
      cardBorder: 'rgba(255, 255, 255, 0.18)',
    };
  }

  // 3. Ban ngày mây dày u ám / râm mát
  if (code.startsWith('04') || main.includes('overcast') || main.includes('u ám')) {
    return {
      weatherType: 'cloud',
      gradientColors: ['#5b9bd5', '#8bbde2', '#bfe0f7'],
      isLightBackground: true,
      cardBg: 'rgba(24, 49, 79, 0.58)',
      cardBorder: 'rgba(255, 255, 255, 0.2)',
    };
  }

  // 4. Ban ngày có nắng (01d, 02d, 03d, Mây cụm, Mây rải rác)
  return {
    weatherType: 'sun',
    gradientColors: ['#2563eb', '#38bdf8', '#60a5fa'],
    isLightBackground: true,
    cardBg: 'rgba(24, 49, 79, 0.58)',
    cardBorder: 'rgba(255, 255, 255, 0.2)',
  };
};

export const getWeatherGradient = (iconCode?: string, conditionMain?: string): [string, string, ...string[]] => {
  return getWeatherTheme(iconCode, conditionMain).gradientColors;
};

// 9. Định dạng giờ chuẩn theo múi giờ Việt Nam từ Unix timestamp
export const formatForecastHour = (timestampOrDtTxt: number | string, index: number): string => {
  if (index === 0) return 'Bây giờ';
  let date: Date;
  if (typeof timestampOrDtTxt === 'number') {
    date = new Date(timestampOrDtTxt * 1000);
  } else if (timestampOrDtTxt.includes('Z') || timestampOrDtTxt.includes('T')) {
    date = new Date(timestampOrDtTxt);
  } else {
    // OpenWeather trả về chuỗi UTC (VD: "2026-10-06 00:00:00") -> chuyển sang Date theo UTC
    date = new Date(timestampOrDtTxt.replace(' ', 'T') + 'Z');
  }
  const hours = date.getHours().toString().padStart(2, '0');
  return `${hours}:00`;
};

// 10. Định dạng thứ trong tuần chuẩn theo Unix timestamp
export const formatForecastDay = (timestampOrDtTxt: number | string, index: number): string => {
  if (index === 0) return 'Hôm nay';
  let date: Date;
  if (typeof timestampOrDtTxt === 'number') {
    date = new Date(timestampOrDtTxt * 1000);
  } else if (timestampOrDtTxt.includes('Z') || timestampOrDtTxt.includes('T')) {
    date = new Date(timestampOrDtTxt);
  } else {
    date = new Date(timestampOrDtTxt.replace(' ', 'T') + 'Z');
  }
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  return days[date.getDay()];
};