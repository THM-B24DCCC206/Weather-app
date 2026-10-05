import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudDrizzle,
  CloudLightning,
  CloudSnow,
  Wind,
  Zap,
} from 'lucide-react-native';

interface WeatherIconProps {
  iconCode?: string;
  size?: number;
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({
  iconCode = '01d',
  size = 24,
}) => {
  const isNight = iconCode.includes('n');

  // 1. Trời nắng rực rỡ / Quang đãng (Sun / Clear sky) - Apple Weather sun.max.fill
  if (iconCode.startsWith('01')) {
    if (isNight) {
      return (
        <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
          <Moon size={size * 0.9} color="#e2e8f0" fill="#f8fafc" />
        </View>
      );
    }
    return (
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <Sun size={size} color="#f59e0b" fill="#fbbf24" strokeWidth={2.2} />
      </View>
    );
  }

  // 2. Nắng có mây / Mây vài nơi (Few clouds / Sun behind cloud) - Apple Weather cloud.sun.fill
  if (iconCode.startsWith('02')) {
    if (isNight) {
      return (
        <View style={{ width: size + 4, height: size, justifyContent: 'center', alignItems: 'center' }}>
          {/* Trăng phía sau */}
          <View style={{ position: 'absolute', top: -2, right: 0 }}>
            <Moon size={size * 0.65} color="#cbd5e1" fill="#e2e8f0" />
          </View>
          {/* Mây trắng phía trước */}
          <View style={{ position: 'absolute', bottom: 0, left: 0 }}>
            <Cloud size={size * 0.85} color="#ffffff" fill="#ffffff" />
          </View>
        </View>
      );
    }

    // Mặt trời vàng rực ló sau đám mây trắng chuẩn 100% Ảnh 2 (17:00 & Th 3)
    return (
      <View style={{ width: size + 4, height: size + 2, justifyContent: 'center', alignItems: 'center' }}>
        {/* Mặt trời vàng toả tia nắng ở góc trên phải */}
        <View style={{ position: 'absolute', top: -1, right: -1 }}>
          <Sun size={size * 0.72} color="#f59e0b" fill="#fbbf24" strokeWidth={2.2} />
        </View>
        {/* Đám mây trắng đặc chồng lên phía trước */}
        <View style={{ position: 'absolute', bottom: 0, left: 0 }}>
          <Cloud size={size * 0.88} color="#ffffff" fill="#ffffff" />
        </View>
      </View>
    );
  }

  // 3. Nhiều mây / Có mây (Scattered / Broken clouds) - Apple Weather cloud.fill
  if (iconCode.startsWith('03') || iconCode.startsWith('04')) {
    return (
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <Cloud size={size} color="#ffffff" fill="#ffffff" />
      </View>
    );
  }

  // 4. Mưa rào / Mưa nhẹ (Shower rain / Drizzle) - Apple Weather cloud.drizzle.fill
  if (iconCode.startsWith('09')) {
    return (
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <CloudDrizzle size={size} color="#38bdf8" fill="#ffffff" strokeWidth={2.2} />
      </View>
    );
  }

  // 5. Mưa rào / Mưa vừa (Rain) - Apple Weather cloud.rain.fill
  if (iconCode.startsWith('10')) {
    return (
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <CloudRain size={size} color="#38bdf8" fill="#ffffff" strokeWidth={2.2} />
      </View>
    );
  }

  // 6. Dông sét / Sấm chớp (Thunderstorm) - Apple Weather cloud.bolt.rain.fill
  if (iconCode.startsWith('11')) {
    return (
      <View style={{ width: size + 2, height: size + 2, justifyContent: 'center', alignItems: 'center' }}>
        <CloudLightning size={size} color="#f59e0b" fill="#ffffff" strokeWidth={2.2} />
      </View>
    );
  }

  // 7. Tuyết rơi (Snow) - Apple Weather cloud.snow.fill
  if (iconCode.startsWith('13')) {
    return (
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <CloudSnow size={size} color="#7dd3fc" fill="#ffffff" strokeWidth={2.2} />
      </View>
    );
  }

  // 8. Sương mù / Gió (Mist / Wind)
  if (iconCode.startsWith('50')) {
    return (
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <Wind size={size} color="#ffffff" strokeWidth={2.4} />
      </View>
    );
  }

  // Mặc định
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Cloud size={size} color="#ffffff" fill="#ffffff" />
    </View>
  );
};
