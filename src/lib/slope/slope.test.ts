import { riseFromPercent, slopeFromInclinedDistance, slopeFromRiseRun } from './slope';

describe('slope', () => {
  it('computes a 45° slope (rise = run) as 100%', () => {
    const { angleDeg, percent } = slopeFromRiseRun(10, 10);
    expect(angleDeg).toBeCloseTo(45, 5);
    expect(percent).toBeCloseTo(100, 5);
  });

  it('computes a flat slope as 0%', () => {
    const { angleDeg, percent } = slopeFromRiseRun(0, 10);
    expect(angleDeg).toBeCloseTo(0, 5);
    expect(percent).toBeCloseTo(0, 5);
  });

  it('handles a downhill (negative rise) slope', () => {
    const { angleDeg, percent } = slopeFromRiseRun(-10, 10);
    expect(angleDeg).toBeCloseTo(-45, 5);
    expect(percent).toBeCloseTo(-100, 5);
  });

  it('throws when run is not positive', () => {
    expect(() => slopeFromRiseRun(10, 0)).toThrow();
    expect(() => slopeFromRiseRun(10, -5)).toThrow();
  });

  it('derives rise/run/percent from an inclined distance and angle', () => {
    const inclined = Math.sqrt(100 * 100 + 100 * 100); // hypotenuse of a 100/100 right triangle
    const { riseM, runM, percent } = slopeFromInclinedDistance(inclined, 45);
    expect(riseM).toBeCloseTo(100, 3);
    expect(runM).toBeCloseTo(100, 3);
    expect(percent).toBeCloseTo(100, 3);
  });

  it('rejects angles at or beyond +/-90 degrees', () => {
    expect(() => slopeFromInclinedDistance(100, 90)).toThrow();
    expect(() => slopeFromInclinedDistance(100, -90)).toThrow();
    expect(() => slopeFromInclinedDistance(100, 91)).toThrow();
  });

  it('derives rise/angle/inclined distance from a grade and a horizontal run', () => {
    const { riseM, angleDeg, inclinedM } = riseFromPercent(100, 100);
    expect(riseM).toBeCloseTo(100, 5);
    expect(angleDeg).toBeCloseTo(45, 5);
    expect(inclinedM).toBeCloseTo(Math.sqrt(2) * 100, 3);
  });

  it('computes a 10% grade over 250 m as a 25 m rise', () => {
    const { riseM, angleDeg } = riseFromPercent(10, 250);
    expect(riseM).toBeCloseTo(25, 5);
    expect(angleDeg).toBeCloseTo(5.71, 2);
  });

  it('handles a downhill grade as a negative rise', () => {
    const { riseM, angleDeg } = riseFromPercent(-20, 50);
    expect(riseM).toBeCloseTo(-10, 5);
    expect(angleDeg).toBeCloseTo(-11.31, 2);
  });

  it('round-trips with slopeFromRiseRun', () => {
    const { riseM } = riseFromPercent(37, 180);
    expect(slopeFromRiseRun(riseM, 180).percent).toBeCloseTo(37, 5);
  });

  it('throws when run is not positive', () => {
    expect(() => riseFromPercent(10, 0)).toThrow();
    expect(() => riseFromPercent(10, -5)).toThrow();
  });
});
