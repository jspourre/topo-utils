import { decimalToDms, dmsToDecimal, parseDmsString } from './dms';
import {
  formatUtm,
  gridConvergence,
  latLonToMgrs,
  latLonToUtm,
  mgrsToLatLon,
  parseUtmString,
  utmToLatLon,
} from './mgrsUtm';

describe('dms', () => {
  it('converts a decimal latitude to DMS', () => {
    const dms = decimalToDms(48.858222, 'lat');
    expect(dms.hemisphere).toBe('N');
    expect(dms.degrees).toBe(48);
    expect(dms.minutes).toBe(51);
    expect(dms.seconds).toBeCloseTo(29.6, 1);
  });

  it('converts a negative decimal longitude to DMS with W hemisphere', () => {
    const dms = decimalToDms(-2.2945, 'lon');
    expect(dms.hemisphere).toBe('W');
    expect(dms.degrees).toBe(2);
  });

  it('round-trips decimal -> DMS -> decimal', () => {
    const original = 48.858222;
    const dms = decimalToDms(original, 'lat');
    expect(dmsToDecimal(dms)).toBeCloseTo(original, 5);
  });

  it('parses a free-text DMS string', () => {
    expect(parseDmsString(`48°51'29.5"N`)).toBeCloseTo(48.858194, 4);
  });

  it('throws on an invalid DMS string', () => {
    expect(() => parseDmsString('not a coordinate')).toThrow();
  });
});

describe('mgrsUtm', () => {
  // Reference point from the geodesy library's own worked example (utm.js / mgrs.js docs):
  // 48.8582N, 2.2945E -> 31 N 448251 5411932 -> 31U DQ 48251 11932
  const eiffelTower = { lat: 48.8582, lon: 2.2945 };

  it('converts lat/lon to UTM', () => {
    const utm = latLonToUtm(eiffelTower.lat, eiffelTower.lon);
    expect(utm.zone).toBe(31);
    expect(utm.hemisphere).toBe('N');
    expect(utm.easting).toBeCloseTo(448251, -1);
    expect(utm.northing).toBeCloseTo(5411932, -1);
  });

  it('round-trips lat/lon -> UTM -> lat/lon', () => {
    const utm = latLonToUtm(eiffelTower.lat, eiffelTower.lon);
    const back = utmToLatLon(utm);
    expect(back.lat).toBeCloseTo(eiffelTower.lat, 4);
    expect(back.lon).toBeCloseTo(eiffelTower.lon, 4);
  });

  it('converts lat/lon to an MGRS string', () => {
    const mgrs = latLonToMgrs(eiffelTower.lat, eiffelTower.lon);
    expect(mgrs).toMatch(/^31U DQ \d{5} \d{5}$/);
  });

  it('round-trips lat/lon -> MGRS -> lat/lon within grid precision', () => {
    const mgrs = latLonToMgrs(eiffelTower.lat, eiffelTower.lon);
    const back = mgrsToLatLon(mgrs);
    // Default 5-digit easting/northing precision is accurate to 1m.
    expect(back.lat).toBeCloseTo(eiffelTower.lat, 4);
    expect(back.lon).toBeCloseTo(eiffelTower.lon, 4);
  });

  it('throws on an invalid MGRS string', () => {
    expect(() => mgrsToLatLon('not an mgrs ref')).toThrow();
  });

  it('formats a UTM coordinate as a string', () => {
    const utm = latLonToUtm(eiffelTower.lat, eiffelTower.lon);
    expect(formatUtm(utm)).toMatch(/^31 N \d+ \d+$/);
  });

  it('parses a UTM string, with or without a space after the zone', () => {
    const spaced = parseUtmString('31 N 448251 5411932');
    expect(spaced).toEqual({ zone: 31, hemisphere: 'N', easting: 448251, northing: 5411932 });
    expect(parseUtmString('31n 448251 5411932')).toEqual(spaced);
  });

  it('round-trips lat/lon -> UTM string -> lat/lon', () => {
    const text = formatUtm(latLonToUtm(eiffelTower.lat, eiffelTower.lon));
    const back = utmToLatLon(parseUtmString(text));
    expect(back.lat).toBeCloseTo(eiffelTower.lat, 4);
    expect(back.lon).toBeCloseTo(eiffelTower.lon, 4);
  });

  it('throws on an invalid UTM string', () => {
    expect(() => parseUtmString('not a utm ref')).toThrow();
  });

  it('computes a near-zero meridian convergence on a zone central meridian', () => {
    // Zone 31 spans 0°E-6°E, central meridian 3°E.
    expect(gridConvergence(48, 3)).toBeCloseTo(0, 6);
  });

  it('computes a non-zero meridian convergence away from the central meridian', () => {
    expect(Math.abs(gridConvergence(48.8583, 0.2))).toBeGreaterThan(1);
  });
});
