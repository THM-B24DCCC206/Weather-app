import axios from "axios";
import * as Location from "expo-location";
import {
  CurrentWeatherData,
  ForecastData,
  CitySearchResult,
} from "../types/weather";
import { WeatherType } from "../components/WeatherBackground";

const API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY || "";
const BASE_URL = "https://api.openweathermap.org/data/2.5";
const GEO_URL = "https://api.openweathermap.org/geo/1.0";

export const getDetailedAddress = async (
  lat: number,
  lon: number,
): Promise<string> => {
  try {
    const results = await Location.reverseGeocodeAsync({
      latitude: lat,
      longitude: lon,
    });
    if (results && results.length > 0) {
      const info = results[0];
      if (info.region) return info.region;
      if (info.subregion) return info.subregion;
      if (info.city) return info.city;
      if (info.district) return info.district;
    }
  } catch (error) {
    console.warn("Reverse geocode error:", error);
  }
  return "";
};

export const fetchCurrentWeather = async (
  lat: number,
  lon: number,
): Promise<CurrentWeatherData> => {
  const response = await axios.get(`${BASE_URL}/weather`, {
    params: {
      lat,
      lon,
      appid: API_KEY,
      units: "metric",
      lang: "vi",
    },
  });
  return response.data;
};

export const fetchWeatherByCoordinates = async (
  lat: number,
  lon: number,
): Promise<CurrentWeatherData> => {
  const response = await axios.get(`${BASE_URL}/weather`, {
    params: {
      lat,
      lon,
      appid: API_KEY,
      units: "metric",
      lang: "vi",
    },
  });
  return response.data;
};

export const fetchForecast = async (
  lat: number,
  lon: number,
): Promise<ForecastData> => {
  const response = await axios.get(`${BASE_URL}/forecast`, {
    params: {
      lat,
      lon,
      appid: API_KEY,
      units: "metric",
      lang: "vi",
    },
  });
  return response.data;
};

export const fetchWeatherByCity = async (
  cityName: string,
): Promise<CurrentWeatherData> => {
  const response = await axios.get(`${BASE_URL}/weather`, {
    params: {
      q: cityName,
      appid: API_KEY,
      units: "metric",
      lang: "vi",
    },
  });
  return response.data;
};

export const fetchForecastByCity = async (
  cityName: string,
): Promise<ForecastData> => {
  const response = await axios.get(`${BASE_URL}/forecast`, {
    params: {
      q: cityName,
      appid: API_KEY,
      units: "metric",
      lang: "vi",
    },
  });
  return response.data;
};

export const searchCities = async (
  query: string,
): Promise<CitySearchResult[]> => {
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
  overlayColors: [string, string];
  isLightBackground: boolean;
  cardBg: string;
  cardBorder: string;
}

export const getFormattedCondition = (code?: string, desc?: string): string => {
  const c = (code || "").toLowerCase();
  const d = (desc || "").toLowerCase();
  if (c.startsWith("01d") || d.includes("quang đãng") || d.includes("clear")) {
    return "Có nắng";
  }
  if (c.startsWith("01n")) {
    return "Quang đãng";
  }
  if (c.startsWith("02d")) {
    return "Ít mây";
  }
  if (c.startsWith("02n")) {
    return "Ít mây";
  }
  if (c.startsWith("03") || d.includes("rải rác")) {
    return "Mây rải rác";
  }
  if (
    c.startsWith("04") ||
    d.includes("nhiều mây") ||
    d.includes("u ám") ||
    d.includes("overcast") ||
    d.includes("cụm")
  ) {
    return "Nhiều mây";
  }
  if (d.includes("mưa rào") || c.startsWith("09")) {
    return "Mưa rào";
  }
  if (d.includes("mưa") || c.startsWith("10")) {
    return "Có mưa";
  }
  if (d.includes("dông") || d.includes("sấm") || c.startsWith("11")) {
    return "Có dông";
  }
  if (d.includes("tuyết") || c.startsWith("13")) {
    return "Có tuyết";
  }
  if (d.includes("sương") || c.startsWith("50")) {
    return "Sương mù";
  }
  if (!desc) return "Có nắng";
  return desc.charAt(0).toUpperCase() + desc.slice(1);
};

export const checkIsNight = (
  iconCode?: string,
  sys?: { sunrise?: number; sunset?: number },
  dt?: number,
): boolean => {
  if (iconCode && iconCode.includes("n")) {
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

export const getWeatherTheme = (
  iconCode?: string,
  conditionMain?: string,
  sys?: { sunrise?: number; sunset?: number },
  dt?: number,
  conditionDesc?: string,
): WeatherTheme => {
  const isNight = checkIsNight(iconCode, sys, dt);
  const main = (conditionMain || "").toLowerCase();
  const code = (iconCode || "").toLowerCase();
  const desc = (conditionDesc || "").toLowerCase();

  if (
    main.includes("rain") ||
    main.includes("drizzle") ||
    main.includes("mưa") ||
    main.includes("thunder") ||
    main.includes("sấm") ||
    desc.includes("mưa") ||
    desc.includes("dông") ||
    code.startsWith("09") ||
    code.startsWith("10") ||
    code.startsWith("11")
  ) {
    return {
      weatherType: "rain",
      gradientColors: ["#1e2c3d", "#2c3f54", "#121b27"],
      overlayColors: ["rgba(15, 25, 40, 0.38)", "rgba(10, 18, 30, 0.6)"],
      isLightBackground: false,
      cardBg: "rgba(15, 23, 42, 0.68)",
      cardBorder: "rgba(255, 255, 255, 0.15)",
    };
  }

  if (isNight) {
    return {
      weatherType: "night",
      gradientColors: ["#090d16", "#111827", "#030712"],
      overlayColors: ["rgba(3, 7, 18, 0.3)", "rgba(3, 7, 18, 0.55)"],
      isLightBackground: false,
      cardBg: "rgba(15, 23, 42, 0.65)",
      cardBorder: "rgba(255, 255, 255, 0.18)",
    };
  }

  if (
    code.startsWith("04") ||
    desc.includes("u ám") ||
    desc.includes("nhiều mây") ||
    desc.includes("overcast") ||
    desc.includes("cụm")
  ) {
    return {
      weatherType: "cloud",
      gradientColors: ["#4c647b", "#5a748d", "#384758"],
      overlayColors: ["rgba(40, 60, 85, 0.28)", "rgba(30, 48, 70, 0.48)"],
      isLightBackground: true,
      cardBg: "rgba(24, 49, 79, 0.58)",
      cardBorder: "rgba(255, 255, 255, 0.2)",
    };
  }

  if (
    code.startsWith("02") ||
    code.startsWith("03") ||
    main.includes("cloud") ||
    desc.includes("mây") ||
    desc.includes("rải rác")
  ) {
    return {
      weatherType: "cloud",
      gradientColors: ["#507a9e", "#628eb4", "#3d6486"],
      overlayColors: ["rgba(50, 95, 145, 0.1)", "rgba(25, 55, 95, 0.25)"],
      isLightBackground: true,
      cardBg: "rgba(24, 49, 79, 0.58)",
      cardBorder: "rgba(255, 255, 255, 0.2)",
    };
  }

  return {
    weatherType: "sun",
    gradientColors: ["#5588b3", "#679ac5", "#436f94"],
    overlayColors: ["rgba(56, 189, 248, 0.04)", "rgba(25, 55, 110, 0.2)"],
    isLightBackground: true,
    cardBg: "rgba(24, 49, 79, 0.58)",
    cardBorder: "rgba(255, 255, 255, 0.2)",
  };
};

export const getWeatherGradient = (
  iconCode?: string,
  conditionMain?: string,
  conditionDesc?: string,
): [string, string, ...string[]] => {
  return getWeatherTheme(iconCode, conditionMain, undefined, undefined, conditionDesc).gradientColors;
};

export const formatForecastHour = (
  timestampOrDtTxt: number | string,
  index: number,
): string => {
  if (index === 0) return "Bây giờ";
  let date: Date;
  if (typeof timestampOrDtTxt === "number") {
    date = new Date(timestampOrDtTxt * 1000);
  } else if (timestampOrDtTxt.includes("Z") || timestampOrDtTxt.includes("T")) {
    date = new Date(timestampOrDtTxt);
  } else {
    date = new Date(timestampOrDtTxt.replace(" ", "T") + "Z");
  }
  const hours = date.getHours().toString().padStart(2, "0");
  return `${hours}:00`;
};

export const formatForecastDay = (
  timestampOrDtTxt: number | string,
  index: number,
): string => {
  if (index === 0) return "Hôm nay";
  let date: Date;
  if (typeof timestampOrDtTxt === "number") {
    date = new Date(timestampOrDtTxt * 1000);
  } else if (timestampOrDtTxt.includes("Z") || timestampOrDtTxt.includes("T")) {
    date = new Date(timestampOrDtTxt);
  } else {
    date = new Date(timestampOrDtTxt.replace(" ", "T") + "Z");
  }
  const days = [
    "Chủ Nhật",
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy",
  ];
  return days[date.getDay()];
};

export const fetchForecastByCoordinates = async (
  lat: number,
  lon: number,
): Promise<ForecastData> => {
  const response = await axios.get(`${BASE_URL}/forecast`, {
    params: {
      lat,
      lon,
      appid: API_KEY,
      units: "metric",
      lang: "vi",
    },
  });
  return response.data;
};
