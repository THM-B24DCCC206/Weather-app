import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Svg, {
  Polyline,
  Circle,
  Line,
} from 'react-native-svg';
import {
  CloudRain,
  Thermometer,
  Wind,
  Navigation,
  Play,
  Pause,
  Search,
  X,
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const HANOI = {
  latitude: 21.0285,
  longitude: 105.8542,
};

const OPENWEATHER_API_KEY =
  '9a2e4548f4742faed9ee647449ff61ef';

type MapLayer =
  | 'precipitation'
  | 'temperature'
  | 'wind';

const MAP_LAYERS = {
  precipitation: {
    name: 'Lượng mưa',
    icon: CloudRain,
    color: '#2196F3',
    tile: 'precipitation_new',
  },

  temperature: {
    name: 'Nhiệt độ',
    icon: Thermometer,
    color: '#FF7043',
    tile: 'temp_new',
  },

  wind: {
    name: 'Gió',
    icon: Wind,
    color: '#26A69A',
    tile: 'wind_new',
  },
};

const createMapHtml = () => `
<!DOCTYPE html>
<html>

<head>

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
/>

<link
  rel="stylesheet"
  href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
/>

<style>

html,
body,
#map {

  margin: 0;
  padding: 0;

  width: 100%;
  height: 100%;

  background: #e9e9e9;
}

.leaflet-control-attribution {
  font-size: 8px;
}
  .weather-tile {
  filter:
    saturate(4.8)
    contrast(4.0)
    brightness(1.0);
}
.base-map {
  filter:
    saturate(0.85)
    contrast(1.15)
    brightness(0.85);
}

.weather-marker {

  width: 62px;
  height: 62px;

  border-radius: 50%;

  background: rgba(255,255,255,.96);

  border: 3px solid #2196F3;

  box-shadow:
    0 3px 10px rgba(0,0,0,.25);

  display: flex;

  align-items: center;
  justify-content: center;

  font-family: Arial, sans-serif;

  font-size: 20px;
  font-weight: bold;

  color: #111;
}

.weather-label {

  margin-top: 4px;

  font-family: Arial, sans-serif;

  font-size: 12px;
  font-weight: bold;

  color: #111;

  background: white;

  padding: 3px 7px;

  border-radius: 8px;

  box-shadow:
    0 2px 7px rgba(0,0,0,.2);

  white-space: nowrap;
}

.search-marker {

  width: 26px;
  height: 26px;

  border-radius: 50%;

  background: #2196F3;

  border: 4px solid white;

  box-shadow:
    0 2px 8px rgba(0,0,0,.35);
}

.search-label {

  font-family: Arial, sans-serif;

  font-size: 12px;
  font-weight: bold;

  color: #111;

  background: white;

  padding: 4px 8px;

  border-radius: 8px;

  box-shadow:
    0 2px 7px rgba(0,0,0,.2);

  white-space: nowrap;

  max-width: 260px;

  overflow: hidden;

  text-overflow: ellipsis;
}

</style>

</head>

<body>

<div id="map"></div>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

<script>

const HANOI = [
  21.0285,
  105.8542
];

const API_KEY =
  '${OPENWEATHER_API_KEY}';

const map = L.map('map', {

  zoomControl: false,

  attributionControl: true,

  minZoom: 3,

  maxZoom: 18,

}).setView(
  HANOI,
  6
);


// BẢN ĐỒ NỀN OPENSTREETMAP
const baseMap = L.tileLayer(
  'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
    crossOrigin: true,
    className: 'base-map',
    opacity: 0.92,
  }
);

baseMap.addTo(map);


// CÁC LỚP OPENWEATHER

const weatherLayers = {
  precipitation: L.tileLayer(
    'https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid='
    + API_KEY,
    {
      opacity: 1,
      maxZoom: 18,
      className: 'weather-tile',
    }
  ),

  temperature: L.tileLayer(
    'https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid='
    + API_KEY,
    {
      opacity: 1,
      maxZoom: 18,
      className: 'weather-tile',
    }
  ),

  wind: L.tileLayer(
    'https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid='
    + API_KEY,
    {
      opacity: 1,
      maxZoom: 18,
      className: 'weather-tile',
    }
  ),
};
weatherLayers.precipitation.addTo(map);


// MARKER HÀ NỘI

const markerIcon =
  L.divIcon({

    className: '',

    html:
      '<div class="weather-marker">27°</div>',

    iconSize: [
      62,
      62
    ],

    iconAnchor: [
      31,
      31
    ],

  });


const hanoiMarker =
  L.marker(
    HANOI,
    {
      icon: markerIcon,
    }
  ).addTo(map);


hanoiMarker.bindTooltip(

  '<div class="weather-label">Hà Nội</div>',

  {
    permanent: true,

    direction: 'bottom',

    offset: [
      0,
      34
    ],

    opacity: 1,
  }

).openTooltip();


// ĐỔI LỚP THỜI TIẾT
window.changeWeatherLayer = function(layer) {
  console.log('Đổi lớp thời tiết:', layer);

  Object.keys(weatherLayers).forEach(function(key) {
    if (map.hasLayer(weatherLayers[key])) {
      map.removeLayer(weatherLayers[key]);
    }
  });

  const selectedWeatherLayer = weatherLayers[layer];

  if (selectedWeatherLayer) {
    selectedWeatherLayer.setOpacity(0.95);
    selectedWeatherLayer.addTo(map);
    selectedWeatherLayer.bringToFront();
  }

  map.invalidateSize();
};

// VỀ HÀ NỘI

window.goToHanoi =
  function() {

    map.flyTo(
      HANOI,
      6,
      {
        duration: 0.7,
      }
    );

  };
  window.zoomInMap = function() {
    map.zoomIn();
  };

  window.zoomOutMap = function() {
    map.zoomOut();
  };


// MARKER TÌM KIẾM

let searchMarker = null;


window.goToSearchLocation =
  function(
    lat,
    lon,
    label
  ) {

    const latitude =
      parseFloat(lat);

    const longitude =
      parseFloat(lon);


    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {

      return;

    }


    const position = [
      latitude,
      longitude
    ];


    map.flyTo(
      position,
      13,
      {
        duration: 0.8,
      }
    );


    if (searchMarker) {

      map.removeLayer(
        searchMarker
      );

    }


    const searchIcon =
      L.divIcon({

        className: '',

        html:
          '<div class="search-marker"></div>',

        iconSize: [
          26,
          26
        ],

        iconAnchor: [
          13,
          13
        ],

      });


    searchMarker =
      L.marker(
        position,
        {
          icon: searchIcon,
        }
      ).addTo(map);


    const safeLabel =
      String(label || '')

        .replace(
          /&/g,
          '&amp;'
        )

        .replace(
          /</g,
          '&lt;'
        )

        .replace(
          />/g,
          '&gt;'
        )

        .replace(
          /"/g,
          '&quot;'
        )

        .replace(
          /'/g,
          '&#039;'
        );


    searchMarker.bindTooltip(

      '<div class="search-label">'
      + safeLabel
      + '</div>',

      {

        permanent: true,

        direction: 'top',

        offset: [
          0,
          -10
        ],

        opacity: 1,

      }

    ).openTooltip();

  };

window.clearSearchMarker = function() {
  if (searchMarker) {
    map.removeLayer(searchMarker);
    searchMarker = null;
  }
};


</script>

</body>

</html>
`;


type SearchResult = {

  place_id: string;

  display_name: string;

  lat: string;

  lon: string;

};


export function WeatherMapScreen() {

  const webViewRef =
    useRef<WebView>(null);


  // =========================
  // SEARCH
  // =========================

  const [searchText,
    setSearchText] =
    useState('');


  const [searchResults,
    setSearchResults] =
    useState<SearchResult[]>([]);


  const [showResults,
    setShowResults] =
    useState(false);


  const [searching,
    setSearching] =
    useState(false);


  const searchTimer =
    useRef<
      ReturnType<typeof setTimeout>
      | null
    >(null);


  // =========================
  // MAP
  // =========================

  const [
    selectedLayer,
    setSelectedLayer
  ] =
    useState<MapLayer>(
      'precipitation'
    );

  const [isPlaying, setIsPlaying] =
    useState(false);

  const [showForecastChart, setShowForecastChart] =
    useState(false);

  type ForecastItem = {
    dt: number;
    temp: number;
    feelsLike: number;
    description: string;
    icon: string;
    pop: number;
    rain: number;
    windSpeed: number;
    isNow?: boolean;
  };

  const [forecastData, setForecastData] =
    useState<ForecastItem[]>([]);

  const [selectedForecastIndex, setSelectedForecastIndex] =
    useState(0);

  const [forecastLoading, setForecastLoading] =
    useState(false);

  // =========================
  // TIMELINE
  useEffect(() => {
    if (!isPlaying || forecastData.length === 0) {
      return;
    }

    const timer = setInterval(() => {
      setSelectedForecastIndex((previous) =>
        previous >= forecastData.length - 1
          ? 0
          : previous + 1
      );
    }, 1500);

    return () => clearInterval(timer);
  }, [isPlaying, forecastData.length]);

  // =========================
  // CLEAR TIMER
  // =========================

  useEffect(() => {

    return () => {

      if (
        searchTimer.current
      ) {

        clearTimeout(
          searchTimer.current
        );

      }

    };

  }, []);
  // lấy dự báo thật
  const loadForecast = async (
    latitude: number,
    longitude: number
  ) => {
    try {
      setForecastLoading(true);

      const currentUrl =
        'https://api.openweathermap.org/data/2.5/weather' +
        '?lat=' + latitude +
        '&lon=' + longitude +
        '&units=metric' +
        '&lang=vi' +
        '&appid=' + OPENWEATHER_API_KEY;

      const forecastUrl =
        'https://api.openweathermap.org/data/2.5/forecast' +
        '?lat=' + latitude +
        '&lon=' + longitude +
        '&units=metric' +
        '&lang=vi' +
        '&cnt=4' +
        '&appid=' + OPENWEATHER_API_KEY;

      const [currentResponse, forecastResponse] =
        await Promise.all([
          fetch(currentUrl),
          fetch(forecastUrl),
        ]);

      if (!currentResponse.ok) {
        throw new Error(
          `Current weather HTTP ${currentResponse.status}`
        );
      }

      if (!forecastResponse.ok) {
        throw new Error(
          `Forecast HTTP ${forecastResponse.status}`
        );
      }

      const currentData = await currentResponse.json();
      const forecastDataResponse =
        await forecastResponse.json();

      if (!Array.isArray(forecastDataResponse.list)) {
        throw new Error(
          'Dữ liệu forecast không hợp lệ'
        );
      }

      const nowItem: ForecastItem = {
        dt:
          Number(currentData.dt) ||
          Math.floor(Date.now() / 1000),

        temp: Number(
          currentData.main?.temp ?? 0
        ),

        feelsLike: Number(
          currentData.main?.feels_like ?? 0
        ),

        description: String(
          currentData.weather?.[0]?.description || ''
        ),

        icon: String(
          currentData.weather?.[0]?.icon || ''
        ),

        pop: Number(currentData.pop ?? 0),

        rain: Number(
          currentData.rain?.['1h'] ??
          currentData.rain?.['3h'] ??
          0
        ),

        windSpeed: Number(
          currentData.wind?.speed ?? 0
        ),

        isNow: true,
      };

      const nextItems: ForecastItem[] =
        forecastDataResponse.list
          .slice(0, 4)
          .map((item: any) => ({
            dt: Number(item.dt),
            temp: Number(
              item.main?.temp ?? 0
            ),
            feelsLike: Number(
              item.main?.feels_like ?? 0
            ),
            description: String(
              item.weather?.[0]?.description || ''
            ),
            icon: String(
              item.weather?.[0]?.icon || ''
            ),
            pop: Number(item.pop ?? 0),
            rain: Number(
              item.rain?.['3h'] ?? 0
            ),
            windSpeed: Number(
              item.wind?.speed ?? 0
            ),
            isNow: false,
          }));

      setForecastData([
        nowItem,
        ...nextItems,
      ]);

      setSelectedForecastIndex(0);

    } catch (error) {
      console.log(
        'Lỗi lấy dự báo 12 giờ:',
        error
      );

      setForecastData([]);
      setSelectedForecastIndex(0);

    } finally {
      setForecastLoading(false);
    }
  };
  useEffect(() => {
    loadForecast(
      HANOI.latitude,
      HANOI.longitude
    );
  }, []);


// SEARCH LOCATION


  const searchLocation = async (
    text?: string
  ) => {
    const query = (
      text ?? searchText
    ).trim();

    if (!query) {
      setSearchResults([]);
      setShowResults(false);
      setSearching(false);
      return;
    }

    try {
      setSearching(true);
      setShowResults(true);

      let results: SearchResult[] = [];

      // =========================
      // 1. OPENWEATHER
      // =========================

      try {
        const openWeatherUrl =
          'https://api.openweathermap.org/geo/1.0/direct' +
          '?q=' +
          encodeURIComponent(query) +
          '&limit=5' +
          '&appid=' +
          OPENWEATHER_API_KEY;

        console.log(
          'Đang tìm OpenWeather:',
          query
        );

        const response =
          await fetch(openWeatherUrl);

        console.log(
          'OpenWeather status:',
          response.status
        );

        if (response.ok) {
          const data =
            await response.json();

          console.log(
            'OpenWeather result:',
            data
          );

          if (Array.isArray(data)) {
            results = data.map(
              (item: any, index: number) => {

                const name =
                  item.name || '';

                const state =
                  item.state || '';

                const country =
                  item.country || '';

                return {
                  place_id:
                    `ow-${index}-${Date.now()}`,

                  display_name:
                    [
                      name,
                      state,
                      country,
                    ]
                      .filter(Boolean)
                      .join(', ') || query,

                  lat:
                    String(item.lat),

                  lon:
                    String(item.lon),
                };
              }
            );
          }
        }
      } catch (error) {
        console.log(
          'OpenWeather Geocoding lỗi:',
          error
        );
      }

      // =========================
      // 2. NOMINATIM DỰ PHÒNG
      // =========================

      if (results.length === 0) {
        try {
          const nominatimUrl =
            'https://nominatim.openstreetmap.org/search' +
            '?format=jsonv2' +
            '&limit=5' +
            '&addressdetails=1' +
            '&accept-language=vi' +
            '&q=' +
            encodeURIComponent(query);

          const response =
            await fetch(
              nominatimUrl,
              {
                headers: {
                  Accept:
                    'application/json',
                },
              }
            );

          if (response.ok) {
            const data =
              await response.json();

            if (Array.isArray(data)) {
              results =
                data.map(
                  (item: any) => ({
                    place_id:
                      String(
                        item.place_id
                      ),

                    display_name:
                      String(
                        item.display_name
                      ),

                    lat:
                      String(
                        item.lat
                      ),

                    lon:
                      String(
                        item.lon
                      ),
                  })
                );
            }
          }
        } catch (error) {
          console.log(
            'Nominatim lỗi:',
            error
          );
        }
      }

      // =========================
      // 3. PHOTON CUỐI CÙNG
      // =========================

      if (results.length === 0) {
        try {
          const photonUrl =
            'https://photon.komoot.io/api/?q=' +
            encodeURIComponent(query) +
            '&limit=5&lang=vi';

          const response =
            await fetch(
              photonUrl
            );

          if (response.ok) {
            const data =
              await response.json();

            if (
              data &&
              Array.isArray(
                data.features
              )
            ) {
              results =
                data.features
                  .filter(
                    (feature: any) =>
                      feature?.geometry?.coordinates
                  )
                  .map(
                    (
                      feature: any,
                      index: number
                    ) => {

                      const coordinates =
                        feature
                          .geometry
                          .coordinates;

                      const properties =
                        feature.properties ||
                        {};

                      const name =
                        properties.name ||
                        '';

                      const city =
                        properties.city ||
                        properties.district ||
                        '';

                      const state =
                        properties.state ||
                        '';

                      const country =
                        properties.country ||
                        '';

                      return {
                        place_id:
                          `photon-${index}-${Date.now()}`,

                        display_name:
                          [
                            name,
                            city,
                            state,
                            country,
                          ]
                            .filter(Boolean)
                            .join(', ') ||
                          query,

                        lat:
                          String(
                            coordinates[1]
                          ),

                        lon:
                          String(
                            coordinates[0]
                          ),
                      };
                    }
                  );
            }
          }
        } catch (error) {
          console.log(
            'Photon lỗi:',
            error
          );
        }
      }

      console.log(
        'Kết quả cuối cùng:',
        results
      );

      setSearchResults(
        results
      );

    } catch (error) {
      console.log(
        'Lỗi tìm kiếm:',
        error
      );

      setSearchResults([]);

    } finally {
      setSearching(false);
    }
  };
  // SEARCH INPUT
  // =========================

  const handleSearchTextChange =
    (text: string) => {

      setSearchText(text);


      if (
        searchTimer.current
      ) {

        clearTimeout(
          searchTimer.current
        );

      }


      if (
        !text.trim()
      ) {

        setSearchResults([]);

        setShowResults(false);

        setSearching(false);

        return;

      }


      if (
        text.trim().length < 2
      ) {

        setSearchResults([]);

        setShowResults(false);

        setSearching(false);

        return;

      }


      setShowResults(true);

      setSearching(true);


      searchTimer.current =
        setTimeout(() => {

          searchLocation(
            text
          );

        }, 600);

    };


  // =========================
  // SELECT RESULT
  // =========================

  const selectSearchResult =
    (
      item: SearchResult
    ) => {

      const shortName =
        item.display_name

          .split(',')

          .slice(0, 3)

          .join(',')

          .trim();


      const lat =
        Number(
          item.lat
        );


      const lon =
        Number(
          item.lon
        );


      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lon)
      ) {

        return;

      }


      webViewRef.current
        ?.injectJavaScript(

          `window.goToSearchLocation(${lat}, ${lon}, ${JSON.stringify(
            shortName
          )}); true;`

        );
      loadForecast(lat, lon);


      setSearchText(
        shortName
      );


      setShowResults(
        false
      );


      setSearchResults(
        []
      );


      setSearching(
        false
      );


      if (
        searchTimer.current
      ) {

        clearTimeout(
          searchTimer.current
        );

      }

    };


  // =========================
  // CLEAR SEARCH
  // =========================

  const clearSearch = () => {
    if (searchTimer.current) {
      clearTimeout(searchTimer.current);
    }

    webViewRef.current?.injectJavaScript(
      `window.clearSearchMarker(); true;`
    );

    setSearchText('');
    setSearchResults([]);
    setShowResults(false);
    setSearching(false);
  };
  // CHANGE WEATHER LAYER
  // =========================

  const changeLayer =
    (
      layer: MapLayer
    ) => {

      setSelectedLayer(
        layer
      );


      webViewRef.current
        ?.injectJavaScript(

          `window.changeWeatherLayer('${layer}'); true;`

        );

    };


  // =========================
  // GO TO HANOI
  const goToHanoi = () => {
    webViewRef.current?.injectJavaScript(
      `window.goToHanoi(); true;`
    );

    loadForecast(
      HANOI.latitude,
      HANOI.longitude
    );
  };

  const zoomIn = () => {
    webViewRef.current?.injectJavaScript(
      `window.zoomInMap(); true;`
    );
  };

  const zoomOut = () => {
    webViewRef.current?.injectJavaScript(
      `window.zoomOutMap(); true;`
    );
  };


  // =========================
  // FORECAST CHART
  // =========================

  const formatForecastTime = (dt: number) => {
    const date = new Date(dt * 1000);

    const hours = String(
      date.getHours()
    ).padStart(2, '0');

    const minutes = String(
      date.getMinutes()
    ).padStart(2, '0');

    return `${hours}:${minutes}`;
  };

  const renderForecastChart = () => {
    if (
      forecastLoading ||
      forecastData.length === 0
    ) {
      return null;
    }

    const chartWidth = width - 48;
    const chartHeight = 125;

    const paddingLeft = 28;
    const paddingRight = 10;
    const paddingTop = 14;
    const paddingBottom = 28;

    const graphWidth =
      chartWidth -
      paddingLeft -
      paddingRight;

    const graphHeight =
      chartHeight -
      paddingTop -
      paddingBottom;

    const temperatures = forecastData.map(
      (item) => Number(item.temp) || 0
    );

    const minTemp = Math.floor(
      Math.min(...temperatures) - 2
    );

    const maxTemp = Math.ceil(
      Math.max(...temperatures) + 2
    );

    const tempRange = Math.max(
      maxTemp - minTemp,
      1
    );

    const points = forecastData.map(
      (item, index) => {
        const x =
          paddingLeft +
          (index /
            Math.max(
              forecastData.length - 1,
              1
            )) *
            graphWidth;

        const y =
          paddingTop +
          graphHeight -
          ((Number(item.temp) - minTemp) /
            tempRange) *
            graphHeight;

        return {
          x,
          y,
          temp: Number(item.temp) || 0,
          dt: Number(item.dt),
        };
      }
    );

    const linePoints = points
      .map(
        (point) =>
          `${point.x},${point.y}`
      )
      .join(' ');

    return (
      <View style={styles.chartBox}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>
            Nhiệt độ 12 giờ tới
          </Text>

          <Text style={styles.chartUnit}>
            °C
          </Text>
        </View>

        <View
          style={{
            width: chartWidth,
            height: chartHeight,
            position: 'relative',
          }}
        >
          <Svg
            width={chartWidth}
            height={chartHeight}
          >
            <Line
              x1={paddingLeft}
              y1={paddingTop}
              x2={paddingLeft}
              y2={
                paddingTop +
                graphHeight
              }
              stroke="#D9D9D9"
              strokeWidth={1}
            />

            <Line
              x1={paddingLeft}
              y1={
                paddingTop +
                graphHeight
              }
              x2={
                paddingLeft +
                graphWidth
              }
              y2={
                paddingTop +
                graphHeight
              }
              stroke="#D9D9D9"
              strokeWidth={1}
            />

            <Line
              x1={paddingLeft}
              y1={
                paddingTop +
                graphHeight / 2
              }
              x2={
                paddingLeft +
                graphWidth
              }
              y2={
                paddingTop +
                graphHeight / 2
              }
              stroke="#EEEEEE"
              strokeWidth={1}
            />

            <Polyline
              points={linePoints}
              fill="none"
              stroke="#2196F3"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {points.map(
              (point, index) => {
                const active =
                  index ===
                  selectedForecastIndex;

                return (
                  <Circle
                    key={`${point.dt}-${index}`}
                    cx={point.x}
                    cy={point.y}
                    r={active ? 6 : 4}
                    fill={
                      active
                        ? '#FF5722'
                        : '#2196F3'
                    }
                  />
                );
              }
            )}
          </Svg>

          {points.map(
            (point, index) => {
              const active =
                index ===
                selectedForecastIndex;

              const timeLabel =
                index === 0
                  ? 'NOW'
                  : formatForecastTime(
                      point.dt
                    );

              return (
                <React.Fragment
                  key={`label-${point.dt}-${index}`}
                >
                  <Text
                    style={[
                      styles.chartTempLabel,
                      {
                        left:
                          point.x - 15,
                        top:
                          point.y - 18,
                        color: active
                          ? '#FF5722'
                          : '#333333',
                        fontWeight: active
                          ? '700'
                          : '600',
                      },
                    ]}
                  >
                    {Math.round(
                      point.temp
                    )}°
                  </Text>

                  <Text
                    style={[
                      styles.chartTimeLabel,
                      {
                        left:
                          point.x - 20,
                        top:
                          paddingTop +
                          graphHeight +
                          5,
                      },
                    ]}
                  >
                    {timeLabel}
                  </Text>
                </React.Fragment>
              );
            }
          )}

          <Text
            style={[
              styles.chartAxisLabel,
              {
                left: 0,
                top: paddingTop - 5,
              },
            ]}
          >
            {maxTemp}°
          </Text>

          <Text
            style={[
              styles.chartAxisLabel,
              {
                left: 0,
                top:
                  paddingTop +
                  graphHeight -
                  5,
              },
            ]}
          >
            {minTemp}°
          </Text>
        </View>
      </View>
    );
  };

  // =========================
  // LEGEND
  // =========================

  const renderLegend = () => {

    let colors:
      string[] = [];

    let labels:
      string[] = [];


    if (
      selectedLayer ===
      'precipitation'
    ) {

      colors = [
        '#B7F4FF',
        '#5ED7FF',
        '#3B82F6',
        '#6A1B9A',
        '#D50000',
      ];
                  


      labels = [
        '0',
        'Nhẹ',
        'Vừa',
        'Mạnh',
        'Rất mạnh',
      ];

    }


    if (
      selectedLayer ===
      'temperature'
    ) {

      colors = [
        '#1565C0',
        '#00B0FF',
        '#00E676',
        '#FFD600',
        '#FF1744',
      ];


      labels = [
        '10°',
        '15°',
        '20°',
        '30°',
        '40°+',
      ];

    }

      if (selectedLayer === 'wind') {
        colors = [
          '#FFFF00',
          '#EECECC',
          '#B364BC',
          '#3F213B',
          '#744CAC',
          '#4600AF',
        ];

        labels = [
          '0',
          '10',
          '20',
          '40',
          '60',
          '100+',
        ];
      }


    return (

      <View
        style={styles.legendBox}
      >

        <Text
          style={styles.legendTitle}
        >

          {
            MAP_LAYERS[
              selectedLayer
            ].name
          }

          {
            selectedLayer === 'wind'
              ? ' (km/h)'
              : ''
          }

        </Text>


        <View
          style={
            styles.legendGradient
          }
        >

          {colors.map(
            (color) => (

              <View
                key={color}
                style={[
                  styles.legendColor,
                  {
                    backgroundColor:
                      color,
                  },
                ]}
              />

            )
          )}

        </View>


        <View
          style={
            styles.legendLabels
          }
        >

          {labels.map(
            (label) => (

              <Text
                key={label}
                style={
                  styles.legendText
                }
              >
                {label}
              </Text>

            )
          )}

        </View>

      </View>

    );

  };


  return (

    <View
      style={styles.container}
    >

      <WebView
        ref={webViewRef}
        source={{
          html:
            createMapHtml(),
        }}
        style={styles.map}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        mixedContentMode="always"
        allowsInlineMediaPlayback
        scrollEnabled={false}
      />


      {/* =========================
          Ô TÌM KIẾM
      ========================= */}

      <View
        style={
          styles.searchContainer
        }
      >

        <Search
          size={19}
          color="#666666"
        />


        <TextInput
          style={
            styles.searchInput
          }

          placeholder="Tìm địa chỉ..."

          placeholderTextColor="#777777"

          value={searchText}

          onChangeText={
            handleSearchTextChange
          }

          onSubmitEditing={() =>
            searchLocation()
          }

          returnKeyType="search"

          autoCorrect={false}

          autoCapitalize="none"
        />


        {searchText.length > 0 && (

          <TouchableOpacity
            onPress={
              clearSearch
            }

            activeOpacity={0.7}
          >

            <X
              size={19}
              color="#777777"
            />

          </TouchableOpacity>

        )}

      </View>


      {/* =========================
          KẾT QUẢ TÌM KIẾM
      ========================= */}

      {
        showResults &&
        searchText.trim().length >= 2 && (

          <View
            style={
              styles.searchResultsBox
            }
          >

            {searching ? (

              <View
                style={
                  styles.searchMessage
                }
              >

                <ActivityIndicator
                  size="small"
                  color="#2196F3"
                />

                <Text
                  style={
                    styles.searchMessageText
                  }
                >
                  Đang tìm địa chỉ...
                </Text>

              </View>

            ) : searchResults.length === 0 ? (

              <View
                style={
                  styles.searchMessage
                }
              >

                <Text
                  style={
                    styles.searchMessageText
                  }
                >
                  Không tìm thấy địa chỉ
                </Text>

              </View>

            ) : (

              <FlatList
                data={
                  searchResults
                }

                keyExtractor={
                  (item) =>
                    item.place_id
                }

                keyboardShouldPersistTaps="handled"

                nestedScrollEnabled

                renderItem={({
                  item
                }) => (

                  <TouchableOpacity
                    style={
                      styles.searchResultItem
                    }

                    onPress={() =>
                      selectSearchResult(
                        item
                      )
                    }

                    activeOpacity={0.7}
                  >

                    <View
                      style={
                        styles.resultIcon
                      }
                    >

                      <Navigation
                        size={17}
                        color="#2196F3"
                      />

                    </View>


                    <View
                      style={
                        styles.resultTextContainer
                      }
                    >

                      <Text
                        style={
                          styles.searchResultTitle
                        }

                        numberOfLines={1}
                      >
                        {
                          item.display_name
                            .split(',')[0]
                        }
                      </Text>


                      <Text
                        style={
                          styles.searchResultText
                        }

                        numberOfLines={2}
                      >
                        {
                          item.display_name
                        }
                      </Text>

                    </View>

                  </TouchableOpacity>

                )}

              />

            )}

          </View>

        )
      }

      {/* NÚT VỀ HÀ NỘI */}

<View style={styles.topButtons}>

    <TouchableOpacity
      style={styles.roundButton}
      onPress={goToHanoi}
      activeOpacity={0.8}
    >
      <Navigation
        size={21}
        color="#222"
      />
    </TouchableOpacity>

    <View style={styles.zoomContainer}>

      <TouchableOpacity
        style={styles.zoomButton}
        onPress={zoomIn}
        activeOpacity={0.7}
      >
        <Text style={styles.zoomText}>
          +
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.zoomButton}
        onPress={zoomOut}
        activeOpacity={0.7}
      >
        <Text style={styles.zoomText}>
          −
        </Text>
      </TouchableOpacity>

    </View>

  </View>
      {/* CÁC LỚP THỜI TIẾT */}

      <View
        style={
          styles.layerContainer
        }
      >

        {(
          Object.keys(
            MAP_LAYERS
          ) as MapLayer[]
        ).map(
          (layer) => {

            const item =
              MAP_LAYERS[layer];

            const Icon =
              item.icon;

            const active =
              selectedLayer ===
              layer;


            return (

              <TouchableOpacity
                key={layer}

                style={[

                  styles.layerButton,

                  active &&
                    styles.layerButtonActive,

                ]}

                onPress={() =>
                  changeLayer(
                    layer
                  )
                }

                activeOpacity={0.85}
              >

                <Icon
                  size={18}

                  color={
                    active
                      ? '#FFFFFF'
                      : item.color
                  }
                />


                <Text
                  style={[

                    styles.layerButtonText,

                    active &&
                      styles.layerButtonTextActive,

                  ]}
                >
                  {item.name}
                </Text>

              </TouchableOpacity>

            );

          }
        )}

      </View>


      {renderLegend()}


      {/* TIMELINE */}

      <View style={styles.timelineContainer}>

        <View style={styles.timelineHeader}>

          <View style={{ flex: 1 }}>

            <Text style={styles.timelineTitle}>
              Dự báo 12 giờ
            </Text>

            <Text style={styles.timelineTime}>
              {forecastLoading
                ? 'Đang tải dự báo...'
                : forecastData.length === 0
                  ? 'Chưa có dữ liệu'
                  : selectedForecastIndex === 0
                    ? 'Hiện tại'
                    : formatForecastTime(
                        forecastData[
                          selectedForecastIndex
                        ].dt
                      )}
            </Text>

            {forecastData.length > 0 && (
              <Text style={styles.forecastSummary}>
                {Math.round(
                  forecastData[
                    selectedForecastIndex
                  ].temp
                )}°C
                {'  •  '}
                Mưa{' '}
                {Math.round(
                  forecastData[
                    selectedForecastIndex
                  ].pop * 100
                )}%
                {'  •  '}
                Gió{' '}
                {(
                  forecastData[
                    selectedForecastIndex
                  ].windSpeed * 3.6
                ).toFixed(1)} km/h
              </Text>
            )}

          </View>

          <View style={styles.timelineActions}>

            <TouchableOpacity
              style={styles.chartToggleButton}
              onPress={() =>
                setShowForecastChart(
                  (previous) => !previous
                )
              }
              activeOpacity={0.8}
            >
              <Text style={styles.chartToggleText}>
                {showForecastChart
                  ? 'Ẩn biểu đồ'
                  : 'Xem biểu đồ'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.playButton}
              onPress={() =>
                setIsPlaying(
                  (previous) => !previous
                )
              }
              activeOpacity={0.8}
            >
              {isPlaying ? (
                <Pause
                  size={20}
                  color="#FFFFFF"
                />
              ) : (
                <Play
                  size={20}
                  color="#FFFFFF"
                />
              )}
            </TouchableOpacity>

          </View>

        </View>

        {showForecastChart &&
          renderForecastChart()}

        {forecastLoading ? (

          <View style={styles.forecastLoading}>
            <ActivityIndicator
              size="small"
              color="#2196F3"
            />
          </View>

        ) : (

          <View style={styles.timeline}>

            {forecastData.map(
              (item, index) => {

                const active =
                  index ===
                  selectedForecastIndex;

                const label =
                  index === 0
                    ? 'NOW'
                    : formatForecastTime(
                        item.dt
                      );

                return (
                  <TouchableOpacity
                    key={`${item.dt}-${index}`}
                    style={styles.timelineItem}
                    onPress={() =>
                      setSelectedForecastIndex(
                        index
                      )
                    }
                    activeOpacity={0.7}
                  >

                    <View
                      style={[
                        styles.timelineDot,
                        active &&
                          styles.timelineDotActive,
                      ]}
                    />

                    <Text
                      style={[
                        styles.timelineText,
                        active &&
                          styles.timelineTextActive,
                      ]}
                    >
                      {label}
                    </Text>

                    <Text
                      style={[
                        styles.timelineTemp,
                        active &&
                          styles.timelineTempActive,
                      ]}
                    >
                      {Math.round(item.temp)}°
                    </Text>

                  </TouchableOpacity>
                );
              }
            )}

          </View>

        )}

      </View>

    </View>

  );
}


const styles =
  StyleSheet.create({

    container: {

      flex: 1,

      backgroundColor:
        '#EAF2F8',

    },


    map: {

      width,

      height,

      backgroundColor:
        '#E9E9E9',

    },


    // SEARCH

    searchContainer: {

      position: 'absolute',

      top: 96,

      left: 15,

      right: 69,

      height: 42,

      borderRadius: 14,

      backgroundColor:
        'rgba(255,255,255,0.98)',

      flexDirection: 'row',

      alignItems: 'center',

      paddingHorizontal: 12,

      zIndex: 50,

      elevation: 12,

    },


    searchInput: {

      flex: 1,

      height: 42,

      marginLeft: 8,

      fontSize: 14,

      color: '#222222',

      paddingVertical: 0,

    },


    searchResultsBox: {

      position: 'absolute',

      top: 136,

      left: 15,

      right: 15,

      maxHeight: 230,

      backgroundColor: '#FFFFFF',

      borderRadius: 14,

      overflow: 'hidden',

      zIndex: 60,

      elevation: 15,

    },


    searchResultItem: {

      minHeight: 52,

      paddingHorizontal: 12,

      paddingVertical: 8,

      flexDirection: 'row',

      alignItems: 'center',

      borderBottomWidth: 1,

      borderBottomColor:
        '#E5E5E5',

    },


    resultIcon: {

      width: 32,

      height: 32,

      borderRadius: 16,

      backgroundColor:
        '#E3F2FD',

      alignItems: 'center',

      justifyContent:
        'center',

      marginRight: 9,

    },


    resultTextContainer: {

      flex: 1,

    },


    searchResultTitle: {

      fontSize: 13,

      fontWeight: '700',

      color: '#111111',

      marginBottom: 2,

    },


    searchResultText: {

      flex: 1,

      fontSize: 12,

      fontWeight: '600',

      color: '#555555',

      lineHeight: 17,

    },


    searchMessage: {

      padding: 16,

      alignItems: 'center',

      gap: 8,

    },


    searchMessageText: {

      fontSize: 13,

      fontWeight: '600',

      color: '#555555',

    },

    // NÚT ĐỊNH VỊ
    // =========================

    topButtons: {

      position: 'absolute',

      top: 85,

      right: 18,

    },


    roundButton: {

      width: 45,

      height: 45,

      borderRadius: 23,

      backgroundColor:
        'rgba(255,255,255,0.96)',

      justifyContent:
        'center',

      alignItems:
        'center',

      elevation: 5,

    },
    zoomContainer: {
      position: 'absolute',
      top: 150,
      right: 0,
      width: 45,
      borderRadius: 14,
      overflow: 'hidden',
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#C7C7C7',
      elevation: 7,
    },

    zoomButton: {
      width: 45,
      height: 45,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: '#E5E5E5',
    },

    zoomText: {
      fontSize: 25,
      fontWeight: '500',
      color: '#222222',
      lineHeight: 28,
    },


    // =========================
    // CÁC LỚP
    // =========================

    layerContainer: {

      position: 'absolute',

      top: 150,

      left: 15,

      right: 15,

      flexDirection: 'row',

      gap: 8,

    },


    layerButton: {

      flex: 1,

      minHeight: 43,

      paddingHorizontal: 6,

      borderRadius: 13,

      backgroundColor:
        'rgba(255,255,255,0.95)',

      alignItems:
        'center',

      justifyContent:
        'center',

      flexDirection:
        'row',

      gap: 5,

      elevation: 4,

    },


    layerButtonActive: {

      backgroundColor:
        '#222',

    },


    layerButtonText: {

      fontSize: 11,

      fontWeight: '600',

      color: '#333',

    },


    layerButtonTextActive: {

      color: '#FFFFFF',

    },

    // LEGEND


    legendBox: {

      position: 'absolute',

      top: 200,

      left: 15,

      width: 175,

      padding: 12,

      borderRadius: 14,

      backgroundColor:
        'rgba(255,255,255,0.95)',

      elevation: 5,

    },


    legendTitle: {

      fontSize: 13,

      fontWeight: '700',

      color: '#222',

      marginBottom: 8,

    },


    legendGradient: {

      height: 10,

      width: '100%',

      flexDirection:
        'row',

      borderRadius: 5,

      overflow: 'hidden',

    },


    legendColor: {

      flex: 1,

      height: 10,

    },


    legendLabels: {

      marginTop: 5,

      flexDirection:
        'row',

      justifyContent:
        'space-between',

    },


    legendText: {

      fontSize: 8,

      color: '#555',

    },

    // TIMELINE
  
    timelineContainer: {

      position: 'absolute',

      bottom: 0,

      left: 0,

      right: 0,

      paddingTop: 15,

      paddingBottom: 25,

      paddingHorizontal: 16,

      backgroundColor:
        'rgba(255,255,255,0.97)',

      borderTopLeftRadius: 24,

      borderTopRightRadius: 24,

      elevation: 12,

    },


    timelineHeader: {

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

    },


    timelineTitle: {

      fontSize: 16,

      fontWeight: '700',

      color: '#111',

    },

    timelineTime: {

      marginTop: 2,

      fontSize: 11,

      fontWeight: '600',

      color: '#666',

    },



    chartBox: {
      marginTop: 10,
      marginBottom: 4,
      paddingTop: 8,
      paddingBottom: 2,
      borderRadius: 14,
      backgroundColor: '#F8FBFF',
    },

    chartHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 10,
    },

    chartTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: '#222222',
    },

    chartUnit: {
      fontSize: 10,
      fontWeight: '700',
      color: '#2196F3',
    },

    chartTempLabel: {
      position: 'absolute',
      width: 30,
      textAlign: 'center',
      fontSize: 9,
    },

    chartTimeLabel: {
      position: 'absolute',
      width: 40,
      textAlign: 'center',
      fontSize: 8,
      color: '#666666',
    },

    chartAxisLabel: {
      position: 'absolute',
      width: 25,
      fontSize: 8,
      color: '#777777',
      textAlign: 'right',
    },

    forecastSummary: {
      marginTop: 3,
      fontSize: 11,
      fontWeight: '600',
      color: '#2196F3',
    },

    forecastLoading: {
      height: 55,
      alignItems: 'center',
      justifyContent: 'center',
    },

    timelineTemp: {
      marginTop: 4,
      fontSize: 8,
      fontWeight: '600',
      color: '#777',
    },

    timelineTempActive: {
      color: '#2196F3',
    },


    timelineActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    chartToggleButton: {
      height: 38,
      paddingHorizontal: 12,
      borderRadius: 19,
      backgroundColor: '#E3F2FD',
      alignItems: 'center',
      justifyContent: 'center',
    },

    chartToggleText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#2196F3',
    },

    playButton: {

      width: 43,

      height: 43,

      borderRadius: 22,

      backgroundColor:
        '#222',

      alignItems:
        'center',

      justifyContent:
        'center',

    },


    timeline: {

      marginTop: 17,

      height: 45,

      flexDirection:
        'row',

      alignItems:
        'flex-start',

      justifyContent:
        'space-between',

    },


    timelineItem: {

      alignItems:
        'center',

      justifyContent:
        'flex-start',

      width: 27,

    },


    timelineDot: {

      width: 8,

      height: 8,

      borderRadius: 5,

      backgroundColor:
        '#BDBDBD',

      marginBottom: 7,

    },


    timelineDotActive: {

      width: 12,

      height: 12,

      borderRadius: 6,

      backgroundColor:
        '#2196F3',

      marginTop: -2,

      marginBottom: 5,

    },


    timelineText: {

      fontSize: 8,

      color: '#777',

    },


    timelineTextActive: {

      fontWeight: '700',

      color: '#2196F3',

    },

  });