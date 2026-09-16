import {
  azimuthBetween,
  backAzimuth,
  degreesToMils,
  destinationPoint,
  distanceBetween,
  formatAngle,
  gridBearingBetween,
  headingDifference,
  milsToDegrees,
} from './bearing';

describe('bearing', () => {
  const equator = { lat: 0, lon: 0 };
  const eastOnEquator = { lat: 0, lon: 1 }; // due east, along the equator
  const northOnMeridian = { lat: 1, lon: 0 }; // due north, along a meridian

  it('computes an initial azimuth of 90° due east along the equator', () => {
    expect(azimuthBetween(equator, eastOnEquator)).toBeCloseTo(90, 3);
  });

  it('computes an initial azimuth of 0° due north along a meridian', () => {
    expect(azimuthBetween(equator, northOnMeridian)).toBeCloseTo(0, 6);
  });

  it('computes the WGS84 equatorial distance for 1° of longitude (~111.32km)', () => {
    expect(distanceBetween(equator, eastOnEquator)).toBeCloseTo(111319.49, -1);
  });

  it('computes the back azimuth as the reciprocal bearing', () => {
    expect(backAzimuth(0)).toBe(180);
    expect(backAzimuth(180)).toBe(0);
    expect(backAzimuth(90)).toBe(270);
    expect(backAzimuth(350)).toBeCloseTo(170, 5);
  });

  it('computes a destination point from start + azimuth + distance', () => {
    const distance = distanceBetween(equator, eastOnEquator);
    const dest = destinationPoint(equator, 90, distance);
    expect(dest.lat).toBeCloseTo(eastOnEquator.lat, 3);
    expect(dest.lon).toBeCloseTo(eastOnEquator.lon, 3);
  });

  it('round-trips azimuth/distance -> destination for an arbitrary pair of points', () => {
    const a = { lat: 48.8583, lon: 2.2945 }; // Eiffel Tower
    const b = { lat: 45.764, lon: 4.8357 }; // Lyon
    const azimuth = azimuthBetween(a, b);
    const distance = distanceBetween(a, b);
    const dest = destinationPoint(a, azimuth, distance);
    expect(dest.lat).toBeCloseTo(b.lat, 4);
    expect(dest.lon).toBeCloseTo(b.lon, 4);
  });

  it('converts degrees to NATO mils (6400 per turn)', () => {
    expect(degreesToMils(0)).toBe(0);
    expect(degreesToMils(90)).toBe(1600);
    expect(degreesToMils(180)).toBe(3200);
    expect(degreesToMils(360)).toBe(6400);
    expect(degreesToMils(45)).toBe(800);
  });

  it('round-trips mils <-> degrees', () => {
    expect(milsToDegrees(degreesToMils(123.456))).toBeCloseTo(123.456, 9);
    expect(milsToDegrees(1600)).toBe(90);
  });

  it('grid bearing equals true azimuth on a zone central meridian', () => {
    // Zone 31 central meridian is 3°E, where meridian convergence is ~0.
    const a = { lat: 48, lon: 3 };
    const b = { lat: 48.1, lon: 3 };
    expect(gridBearingBetween(a, b)).toBeCloseTo(azimuthBetween(a, b), 3);
  });

  it('grid bearing differs from true azimuth away from the central meridian', () => {
    // Near the western edge of zone 31 (0°E), grid north is noticeably off true north.
    const a = { lat: 48.8583, lon: 0.2 };
    const b = { lat: 49.2, lon: 0.6 };
    const azimuth = azimuthBetween(a, b);
    const grid = gridBearingBetween(a, b);
    expect(grid).not.toBeCloseTo(azimuth, 2);
    // The offset is exactly the meridian convergence, ~2° at this longitude/latitude.
    expect(Math.abs(grid - azimuth)).toBeGreaterThan(1);
    expect(Math.abs(grid - azimuth)).toBeLessThan(3);
  });

  it('back azimuth approximates the return bearing over a short distance', () => {
    // Over a short leg, meridian convergence is negligible, so the doctrinal
    // (azimuth + 180) % 360 approximation should closely match the true reciprocal bearing.
    const a = { lat: 48.8583, lon: 2.2945 };
    const b = { lat: 48.868, lon: 2.3 };
    const azimuth = azimuthBetween(a, b);
    const trueReciprocal = azimuthBetween(b, a);
    expect(backAzimuth(azimuth)).toBeCloseTo(trueReciprocal, 1);
  });

  it('formats an angle with mils first and degrees in parentheses', () => {
    expect(formatAngle(0)).toBe('0 mil (0.0°)');
    expect(formatAngle(90)).toBe('1600 mil (90.0°)');
    expect(formatAngle(69.4)).toBe('1234 mil (69.4°)');
  });

  it('computes the signed difference between two headings, positive clockwise', () => {
    expect(headingDifference(0, 90)).toBe(90);
    expect(headingDifference(90, 0)).toBe(-90);
    expect(headingDifference(350, 10)).toBeCloseTo(20, 6);
    expect(headingDifference(10, 350)).toBeCloseTo(-20, 6);
    // Half a turn has no side: the range is [-180, 180[, so it always lands on -180.
    expect(headingDifference(0, 180)).toBe(-180);
    expect(headingDifference(180, 0)).toBe(-180);
    expect(headingDifference(42, 42)).toBe(0);
  });
});
