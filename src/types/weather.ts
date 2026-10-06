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
  subLocation?: string; // Tên thành phố / tỉnh chi tiết (vd: Thành Phố Hà Nội)
  isCurrentLocation?: boolean;
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
  pop?: number; // Xác suất mưa (0-1)
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
export interface SavedCityLocation{
  id: string;
  name: string;
  lat: number;
  lon: number;
  temp: number;
  condition: string;
  tempMax: number;
  tempMin: number;
}

