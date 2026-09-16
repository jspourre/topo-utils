import MgrsRef, { LatLon as LatLonMgrs } from 'geodesy/mgrs.js';
import UtmCoord, { LatLon as LatLonUtm } from 'geodesy/utm.js';

import type { LatLon, UtmCoordinate } from '@/types/coordinates';

/**
 * Converts lat/lon (WGS84) to an MGRS grid reference string, e.g. "31U DQ 48251 11932".
 * `digits` is the combined easting+northing digit count (one of 2/4/6/8/10); 10 (default) is 1m precision.
 */
export function latLonToMgrs(lat: number, lon: number, digits = 10): string {
  const point = new LatLonMgrs(lat, lon);
  return point.toUtm().toMgrs().toString(digits);
}

/** Parses an MGRS grid reference string back to lat/lon (WGS84), SW corner of the grid square. */
export function mgrsToLatLon(mgrs: string): LatLon {
  const point = MgrsRef.parse(mgrs).toUtm().toLatLon();
  return { lat: point.lat, lon: point.lon };
}

/** Converts lat/lon (WGS84) to a UTM coordinate. */
export function latLonToUtm(lat: number, lon: number): UtmCoordinate {
  const point = new LatLonUtm(lat, lon);
  const utm = point.toUtm();
  return {
    zone: utm.zone,
    hemisphere: utm.hemisphere as 'N' | 'S',
    easting: utm.easting,
    northing: utm.northing,
  };
}

/** Converts a UTM coordinate back to lat/lon (WGS84). */
export function utmToLatLon(utm: UtmCoordinate): LatLon {
  const coord = new UtmCoord(utm.zone, utm.hemisphere, utm.easting, utm.northing);
  const point = coord.toLatLon();
  return { lat: point.lat, lon: point.lon };
}

/** Formats a UTM coordinate as "31 N 448251 5411932" (metre resolution). */
export function formatUtm(utm: UtmCoordinate): string {
  return `${utm.zone} ${utm.hemisphere} ${Math.round(utm.easting)} ${Math.round(utm.northing)}`;
}

/** Parses a UTM string such as "31 N 448251 5411932" (also tolerates "31N 448251 5411932"). */
export function parseUtmString(input: string): UtmCoordinate {
  const normalized = input.trim().toUpperCase().replace(/^(\d{1,2})\s*([NS])/, '$1 $2');
  const utm = UtmCoord.parse(normalized);
  return {
    zone: utm.zone,
    hemisphere: utm.hemisphere as 'N' | 'S',
    easting: utm.easting,
    northing: utm.northing,
  };
}

/**
 * Meridian convergence at a point: the bearing of UTM grid north, clockwise from true north,
 * in degrees. Subtract it from a true azimuth to obtain the grid bearing ("gisement").
 */
export function gridConvergence(lat: number, lon: number): number {
  const point = new LatLonUtm(lat, lon);
  return point.toUtm().convergence;
}
