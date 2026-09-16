import Dms from 'geodesy/dms.js';

import type { DmsCoordinate } from '@/types/coordinates';

export function decimalToDms(deg: number, axis: 'lat' | 'lon'): DmsCoordinate {
  const hemisphere = axis === 'lat' ? (deg >= 0 ? 'N' : 'S') : deg >= 0 ? 'E' : 'W';
  const abs = Math.abs(deg);
  const degrees = Math.floor(abs);
  const minutesFull = (abs - degrees) * 60;
  const minutes = Math.floor(minutesFull);
  const seconds = (minutesFull - minutes) * 60;
  return { degrees, minutes, seconds, hemisphere };
}

export function dmsToDecimal(dms: DmsCoordinate): number {
  const sign = dms.hemisphere === 'S' || dms.hemisphere === 'W' ? -1 : 1;
  return sign * (dms.degrees + dms.minutes / 60 + dms.seconds / 3600);
}

/** Parses a free-text DMS string (e.g. `48°51'29.5"N`) into a decimal degree value. */
export function parseDmsString(input: string): number {
  const value = Dms.parse(input);
  if (Number.isNaN(value)) {
    throw new Error(`Format DMS invalide : "${input}"`);
  }
  return value;
}
