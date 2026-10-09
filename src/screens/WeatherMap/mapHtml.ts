export const HANOI = {
  latitude: 21.0285,
  longitude: 105.8542,
};

export const OPENWEATHER_API_KEY = process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY || '';

export type MapLayer = 'precipitation' | 'temperature' | 'airQuality' | 'wind';

export interface MapLayerConfig {
  id: MapLayer;
  name: string;
  iconName: 'Umbrella' | 'Thermometer' | 'Sparkles' | 'Wind';
  color: string;
  tile: string;
}

export const MAP_LAYERS: Record<MapLayer, MapLayerConfig> = {
  precipitation: {
    id: 'precipitation',
    name: 'Lượng mưa',
    iconName: 'Umbrella',
    color: '#2196F3',
    tile: 'precipitation_new',
  },
  temperature: {
    id: 'temperature',
    name: 'Nhiệt độ',
    iconName: 'Thermometer',
    color: '#EF4444',
    tile: 'temp_new',
  },
  airQuality: {
    id: 'airQuality',
    name: 'C.lượng không khí',
    iconName: 'Sparkles',
    color: '#8B5CF6',
    tile: 'clouds_new',
  },
  wind: {
    id: 'wind',
    name: 'Gió',
    iconName: 'Wind',
    color: '#10B981',
    tile: 'wind_new',
  },
};

export const createMapHtml = () => `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
    background: #1e293b;
  }
  #map {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #1e293b;
  }
  .leaflet-control-attribution {
    display: none;
  }
  .weather-tile {
    filter: saturate(2.2) contrast(1.25) brightness(1.0);
  }
  .base-map {
    filter: saturate(0.9) contrast(1.1);
  }
  .apple-weather-marker {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .apple-marker-circle {
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: #1e293b;
    border: 2.5px solid #ffffff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .marker-temp {
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
    font-size: 16px;
    font-weight: 700;
    color: #ffffff;
    line-height: 16px;
  }
  .marker-icon {
    font-size: 9px;
    margin-top: 1px;
    color: #f8fafc;
  }
  .apple-marker-label {
    margin-top: 4px;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
    font-size: 12px;
    font-weight: 700;
    color: #0f172a;
    text-shadow: 0 0 4px #ffffff, 0 0 6px #ffffff, 0 1px 3px rgba(255,255,255,0.95);
    white-space: nowrap;
    text-align: center;
  }
  .search-marker {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #007aff;
    border: 3.5px solid #ffffff;
    box-shadow: 0 2px 8px rgba(0,0,0,.35);
  }
  .search-label {
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
    font-size: 12px;
    font-weight: 700;
    color: #111;
    background: rgba(255, 255, 255, 0.95);
    padding: 4px 8px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,.2);
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
  const HANOI = [21.0285, 105.8542];
  const DANANG = [16.0544, 108.2022];
  const HOCHIMINH = [10.8231, 106.6297];
  const API_KEY = '${OPENWEATHER_API_KEY}';

  const map = L.map('map', {
    zoomControl: false,
    attributionControl: false,
    minZoom: 3,
    maxZoom: 18,
  }).setView(HANOI, 5);

  const baseMap = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri',
      crossOrigin: true,
      className: 'base-map',
      opacity: 0.95,
    }
  );
  baseMap.addTo(map);

  const weatherLayers = {
    precipitation: L.tileLayer(
      'https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=' + API_KEY,
      {
        opacity: 0.95,
        maxNativeZoom: 10,
        maxZoom: 19,
        className: 'weather-tile',
      }
    ),
    temperature: L.tileLayer(
      'https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=' + API_KEY,
      {
        opacity: 0.78,
        maxNativeZoom: 10,
        maxZoom: 19,
        className: 'weather-tile',
      }
    ),
    airQuality: L.tileLayer(
      'https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=' + API_KEY,
      {
        opacity: 0.85,
        maxNativeZoom: 10,
        maxZoom: 19,
        className: 'weather-tile',
      }
    ),
    wind: L.tileLayer(
      'https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=' + API_KEY,
      {
        opacity: 0.88,
        maxNativeZoom: 10,
        maxZoom: 19,
        className: 'weather-tile',
      }
    ),
  };
  weatherLayers.precipitation.addTo(map);

  function createAppleMarker(latLng, temp, icon, label) {
    const html = '<div class="apple-weather-marker">' +
      '<div class="apple-marker-circle">' +
      '<span class="marker-temp">' + temp + '°</span>' +
      '<span class="marker-icon">' + icon + '</span>' +
      '</div>' +
      '<div class="apple-marker-label">' + label + '</div>' +
      '</div>';

    const customIcon = L.divIcon({
      className: '',
      html: html,
      iconSize: [120, 70],
      iconAnchor: [60, 23],
    });

    return L.marker(latLng, { icon: customIcon, zIndexOffset: 1000 }).addTo(map);
  }

  createAppleMarker(HANOI, '26', '🌙', 'Vị trí của tôi');
  createAppleMarker(DANANG, '26', '🌙', 'Thành Phố Đà Nẵng');
  createAppleMarker(HOCHIMINH, '27', '🌙', 'Thành Phố Hồ Chí Minh');

  window.changeWeatherLayer = function(layer) {
    Object.keys(weatherLayers).forEach(function(key) {
      if (map.hasLayer(weatherLayers[key])) {
        map.removeLayer(weatherLayers[key]);
      }
    });

    const selectedWeatherLayer = weatherLayers[layer];
    if (selectedWeatherLayer) {
      selectedWeatherLayer.addTo(map);
      selectedWeatherLayer.bringToFront();
    }
    map.invalidateSize();
  };

  window.goToHanoi = function() {
    map.flyTo(HANOI, 5, { duration: 0.7 });
  };

  window.zoomInMap = function() {
    map.zoomIn();
  };

  window.zoomOutMap = function() {
    map.zoomOut();
  };

  let searchMarker = null;

  window.goToSearchLocation = function(lat, lon, label) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    const position = [latitude, longitude];
    map.flyTo(position, 10, { duration: 0.8 });

    if (searchMarker) {
      map.removeLayer(searchMarker);
    }

    const searchIcon = L.divIcon({
      className: '',
      html: '<div class="search-marker"></div>',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    searchMarker = L.marker(position, { icon: searchIcon, zIndexOffset: 1100 }).addTo(map);

    const safeLabel = String(label || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    searchMarker.bindTooltip(
      '<div class="search-label">' + safeLabel + '</div>',
      {
        permanent: true,
        direction: 'top',
        offset: [0, -10],
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

  window.map = map;

  function forceResizeMap() {
    if (map) {
      try {
        map.invalidateSize({ pan: false });
      } catch (e) {}
    }
  }

  window.resizeMap = forceResizeMap;

  window.addEventListener('load', function() {
    forceResizeMap();
    setTimeout(forceResizeMap, 100);
    setTimeout(forceResizeMap, 300);
    setTimeout(forceResizeMap, 600);
    setTimeout(forceResizeMap, 1200);
  });

  window.addEventListener('resize', forceResizeMap);
  document.addEventListener('DOMContentLoaded', forceResizeMap);
</script>
</body>
</html>
`;
