import React from 'react';
import { View } from 'react-native';
import {
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudDrizzle,
  CloudLightning,
  CloudSnow,
  Wind,
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

  if (iconCode.startsWith('02') || (iconCode.startsWith('03') && !isNight)) {
    if (isNight) {
      return (
        <View style={{ width: size + 4, height: size, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ position: 'absolute', top: -2, right: 0 }}>
            <Moon size={size * 0.65} color="#cbd5e1" fill="#e2e8f0" />
          </View>
          <View style={{ position: 'absolute', bottom: 0, left: 0 }}>
            <Cloud size={size * 0.85} color="#ffffff" fill="#ffffff" />
          </View>
        </View>
      );
    }

    return (
      <View style={{ width: size + 4, height: size + 2, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ position: 'absolute', top: -2, right: -2 }}>
          <Sun size={size * 0.78} color="#f59e0b" fill="#fbbf24" strokeWidth={2.2} />
        </View>
        <View style={{ position: 'absolute', bottom: 0, left: 0 }}>
          <Cloud size={size * 0.88} color="#ffffff" fill="#ffffff" />
        </View>
      </View>
    );
  }

  if (iconCode.startsWith('03') || iconCode.startsWith('04')) {
    if (isNight) {
      return (
        <View style={{ width: size + 4, height: size, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ position: 'absolute', top: -2, right: 0 }}>
            <Moon size={size * 0.6} color="#94a3b8" fill="#cbd5e1" />
          </View>
          <View style={{ position: 'absolute', bottom: 0, left: 0 }}>
            <Cloud size={size * 0.85} color="#cbd5e1" fill="#cbd5e1" />
          </View>
        </View>
      );
    }
    return (
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <Cloud size={size} color="#ffffff" fill="#ffffff" />
      </View>
    );
  }

  if (iconCode.startsWith('09')) {
    return (
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <CloudDrizzle size={size} color="#38bdf8" fill="#ffffff" strokeWidth={2.2} />
      </View>
    );
  }

  if (iconCode.startsWith('10')) {
    return (
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <CloudRain size={size} color="#38bdf8" fill="#ffffff" strokeWidth={2.2} />
      </View>
    );
  }

  if (iconCode.startsWith('11')) {
    return (
      <View style={{ width: size + 2, height: size + 2, justifyContent: 'center', alignItems: 'center' }}>
        <CloudLightning size={size} color="#f59e0b" fill="#ffffff" strokeWidth={2.2} />
      </View>
    );
  }

  if (iconCode.startsWith('13')) {
    return (
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <CloudSnow size={size} color="#7dd3fc" fill="#ffffff" strokeWidth={2.2} />
      </View>
    );
  }

  if (iconCode.startsWith('50')) {
    return (
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <Wind size={size} color="#ffffff" strokeWidth={2.4} />
      </View>
    );
  }

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Cloud size={size} color="#ffffff" fill="#ffffff" />
    </View>
  );
};
