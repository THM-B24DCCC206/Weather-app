import {
  TempUnit,
  WindUnit,
  RainUnit,
  PressureUnit,
  DistanceUnit,
} from '../types/weather';

export const formatTemperature = (
  tempC: number,
  unit: TempUnit = 'C'
): number => {
  if (unit === 'F') {
    return Math.round((tempC * 9) / 5 + 32);
  }
  return Math.round(tempC);
};

const getBeaufortLevel = (speedMs: number): number => {
  if (speedMs < 0.3) return 0;
  if (speedMs < 1.6) return 1;
  if (speedMs < 3.4) return 2;
  if (speedMs < 5.5) return 3;
  if (speedMs < 8.0) return 4;
  if (speedMs < 10.8) return 5;
  if (speedMs < 13.9) return 6;
  if (speedMs < 17.2) return 7;
  if (speedMs < 20.8) return 8;
  if (speedMs < 24.5) return 9;
  if (speedMs < 28.5) return 10;
  if (speedMs < 32.7) return 11;
  return 12;
};

export const formatWindSpeed = (
  speedMs: number,
  unit: WindUnit = 'km/h'
): { value: number | string; unitText: string } => {
  switch (unit) {
    case 'mi/h':
    case 'mph':
      return { value: Math.round(speedMs * 2.23694), unitText: 'mi/h' };
    case 'm/s':
      return { value: Math.round(speedMs * 10) / 10, unitText: 'm/s' };
    case 'kn':
      return { value: Math.round(speedMs * 1.94384), unitText: 'kn' };
    case 'bft':
      return { value: getBeaufortLevel(speedMs), unitText: 'bft' };
    case 'km/h':
    default:
      return { value: Math.round(speedMs * 3.6), unitText: 'km/h' };
  }
};

export const formatPrecipitation = (
  rainMm: number,
  unit: RainUnit = 'mm'
): { value: string; unitText: string } => {
  switch (unit) {
    case 'cm': {
      const valCm = rainMm / 10;
      return {
        value: valCm >= 0.1 ? valCm.toFixed(1) : (rainMm > 0 ? '<0.1' : '0'),
        unitText: 'cm',
      };
    }
    case 'in': {
      const valIn = rainMm / 25.4;
      return {
        value: valIn >= 0.1 ? valIn.toFixed(1) : (rainMm > 0 ? '<0.1' : '0'),
        unitText: 'in',
      };
    }
    case 'mm':
    default:
      return { value: Math.round(rainMm).toString(), unitText: 'mm' };
  }
};

export const formatPressure = (
  pressureHpa: number,
  unit: PressureUnit = 'hPa'
): { value: string; unitText: string } => {
  switch (unit) {
    case 'inHg':
      return {
        value: (pressureHpa * 0.02953).toFixed(2),
        unitText: 'inHg',
      };
    case 'mmHg':
      return {
        value: Math.round(pressureHpa * 0.750062).toString(),
        unitText: 'mmHg',
      };
    case 'mbar':
      return {
        value: Math.round(pressureHpa).toString(),
        unitText: 'mbar',
      };
    case 'atm':
      return {
        value: (pressureHpa / 1013.25).toFixed(2),
        unitText: 'atm',
      };
    case 'hPa':
    default:
      return {
        value: Math.round(pressureHpa).toString(),
        unitText: 'hPa',
      };
  }
};

export const formatVisibility = (
  visibilityMeters: number | undefined,
  unit: DistanceUnit = 'km'
): { value: string; unitText: string } => {
  const km = visibilityMeters ? visibilityMeters / 1000 : 10;
  if (unit === 'mi') {
    return {
      value: (km * 0.621371).toFixed(1),
      unitText: 'mi',
    };
  }
  if (unit === 'NM') {
    return {
      value: (km / 1.852).toFixed(1),
      unitText: 'NM',
    };
  }
  return {
    value: km.toFixed(1),
    unitText: 'km',
  };
};

export const getCalibratedRainPop = (
  rawPop: number = 0,
  rainMm: number = 0,
  desc: string = ''
): number => {
  const d = (desc || '').toLowerCase();
  const hasRainKeyword =
    d.includes('mưa') ||
    d.includes('rain') ||
    d.includes('drizzle') ||
    d.includes('dông') ||
    d.includes('sấm') ||
    d.includes('thunder');

  if (rawPop <= 0 && rainMm <= 0 && !hasRainKeyword) {
    return 0;
  }

  let percent = rawPop <= 1 ? rawPop * 100 : rawPop;

  if (percent <= 0 && (rainMm > 0 || hasRainKeyword)) {
    percent = 40;
  }

  if (d.includes('phùn') || d.includes('drizzle') || (rainMm > 0 && rainMm < 0.5)) {
    percent = Math.min(40, Math.max(20, percent * 0.45));
  } else if (d.includes('nhẹ') || d.includes('light') || (rainMm >= 0.5 && rainMm < 2.5)) {
    percent = Math.min(55, Math.max(30, percent * 0.6));
  } else if (d.includes('rào') || d.includes('vừa') || d.includes('moderate') || (rainMm >= 2.5 && rainMm < 8)) {
    percent = Math.min(75, Math.max(50, percent * 0.75));
  } else if (d.includes('to') || d.includes('heavy') || d.includes('dông') || d.includes('thunder') || rainMm >= 8) {
    percent = Math.min(85, Math.max(65, percent * 0.85));
  } else {
    percent = Math.min(70, Math.max(30, percent * 0.7));
  }

  const rounded = Math.round(percent / 5) * 5;
  return Math.min(90, Math.max(15, rounded));
};
