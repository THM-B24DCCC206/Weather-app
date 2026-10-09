export interface WeatherCondition {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface CurrentWeatherData {
  coord: {
    lon: number;
    lat: number;
  };
  weather: WeatherCondition[];
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  visibility?: number;
  wind: {
    speed: number;
    deg?: number;
  };
  clouds?: {
    all: number;
  };
  dt: number;
  sys?: {
    sunrise?: number;
    sunset?: number;
    country?: string;
  };
  name: string;
  subLocation?: string;
  isCurrentLocation?: boolean;
  timezone?: number;
}

export interface ForecastItem {
  dt: number;
  dt_txt: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  weather: WeatherCondition[];
  wind: {
    speed: number;
  };
  pop?: number;
  rain?: {
    '3h'?: number;
  };
}

export interface ForecastData {
  list: ForecastItem[];
  city: {
    id: number;
    name: string;
    country: string;
    sunrise: number;
    sunset: number;
  };
}

export interface CitySearchResult {
  name: string;
  local_names?: Record<string, string>;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

export interface SavedCityLocation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  temp: number;
  condition: string;
  tempMax: number;
  tempMin: number;
}

export type TempUnit = 'C' | 'F' | 'system';
export type WindUnit = 'km/h' | 'mi/h' | 'mph' | 'm/s' | 'bft' | 'kn';
export type RainUnit = 'mm' | 'cm' | 'in';
export type PressureUnit = 'hPa' | 'inHg' | 'mmHg' | 'mbar' | 'atm';
export type DistanceUnit = 'km' | 'mi' | 'NM';

export interface WeatherUnitsSettings {
  temp: TempUnit;
  wind: WindUnit;
  rain: RainUnit;
  pressure: PressureUnit;
  distance: DistanceUnit;
}

export const DEFAULT_WEATHER_UNITS: WeatherUnitsSettings = {
  temp: 'C',
  wind: 'km/h',
  rain: 'mm',
  pressure: 'hPa',
  distance: 'km',
};
