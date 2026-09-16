import LatLonVincenty from 'geodesy/latlon-ellipsoidal-vincenty.js';

import { gridConvergence } from '@/lib/coordinates/mgrsUtm';
import type { LatLon } from '@/types/coordinates';

/** NATO / French artillery mil: a full turn is 6400 mils. */
export const MILS_PER_TURN = 6400;

/** Initial azimuth from point a to point b, in degrees (0-360), WGS84 Vincenty. */
export function azimuthBetween(a: LatLon, b: LatLon): number {
  const p1 = new LatLonVincenty(a.lat, a.lon);
  const p2 = new LatLonVincenty(b.lat, b.lon);
  return p1.initialBearingTo(p2);
}

/** Back azimuth (reciprocal bearing) for a given azimuth, in degrees (0-360). */
export function backAzimuth(azimuthDeg: number): number {
  return (azimuthDeg + 180) % 360;
}

/** Great-circle (ellipsoidal) distance between two points, in metres, WGS84 Vincenty. */
export function distanceBetween(a: LatLon, b: LatLon): number {
  const p1 = new LatLonVincenty(a.lat, a.lon);
  const p2 = new LatLonVincenty(b.lat, b.lon);
  return p1.distanceTo(p2);
}

/** Destination point given a start point, azimuth (degrees) and distance (metres). */
export function destinationPoint(start: LatLon, azimuthDeg: number, distanceM: number): LatLon {
  const p1 = new LatLonVincenty(start.lat, start.lon);
  const dest = p1.destinationPoint(distanceM, azimuthDeg);
  return { lat: dest.lat, lon: dest.lon };
}

/** Converts degrees to NATO mils (6400 mils per turn). */
export function degreesToMils(deg: number): number {
  return (deg * MILS_PER_TURN) / 360;
}

/** Converts NATO mils (6400 per turn) to degrees. */
export function milsToDegrees(mils: number): number {
  return (mils * 360) / MILS_PER_TURN;
}

/**
 * Signed difference from `currentDeg` to `targetDeg`, in degrees within [-180, 180[: positive means
 * the target is clockwise (to the right) of the current heading. Also used for the magnetic
 * declination, which is the same shape of angle difference.
 */
export function headingDifference(currentDeg: number, targetDeg: number): number {
  return ((targetDeg - currentDeg + 540) % 360) - 180;
}

/**
 * "1234 mil (69.4°)" — the unit used on the ground first, with the degree value for reference.
 * Shared by every screen that shows an angle.
 */
export function formatAngle(deg: number): string {
  return `${Math.round(degreesToMils(deg))} mil (${deg.toFixed(1)}°)`;
}

/**
 * Grid bearing ("gisement") from a to b, in degrees (0-360): the true azimuth corrected by the
 * UTM meridian convergence at the start point, i.e. measured from grid north instead of true north.
 */
export function gridBearingBetween(a: LatLon, b: LatLon): number {
  const azimuth = azimuthBetween(a, b);
  return (azimuth - gridConvergence(a.lat, a.lon) + 360) % 360;
}
