export interface SlopeResult {
  angleDeg: number;
  percent: number;
}

/** Slope angle (degrees) and grade (%) from a vertical rise and horizontal run (both in metres). */
export function slopeFromRiseRun(riseM: number, runM: number): SlopeResult {
  if (runM <= 0) {
    throw new Error('La distance horizontale (run) doit être supérieure à 0.');
  }
  const angleDeg = Math.atan(riseM / runM) * (180 / Math.PI);
  const percent = (riseM / runM) * 100;
  return { angleDeg, percent };
}

/**
 * Rise, inclined distance (metres) and angle (degrees) from a grade (%) and a horizontal run:
 * the map-reading case, where the grade is read off the chart and the run measured on the map.
 */
export function riseFromPercent(
  percent: number,
  runM: number,
): { riseM: number; angleDeg: number; inclinedM: number } {
  if (runM <= 0) {
    throw new Error('La distance horizontale (run) doit être supérieure à 0.');
  }
  const ratio = percent / 100;
  const riseM = runM * ratio;
  const angleDeg = Math.atan(ratio) * (180 / Math.PI);
  const inclinedM = Math.hypot(runM, riseM);
  return { riseM, angleDeg, inclinedM };
}

/** Rise, run (metres) and grade (%) from an inclined (slope) distance and a slope angle (degrees). */
export function slopeFromInclinedDistance(
  inclinedM: number,
  angleDeg: number,
): { riseM: number; runM: number; percent: number } {
  if (angleDeg <= -90 || angleDeg >= 90) {
    throw new Error("L'angle doit être compris entre -90° et 90° (exclus).");
  }
  const angleRad = angleDeg * (Math.PI / 180);
  const riseM = inclinedM * Math.sin(angleRad);
  const runM = inclinedM * Math.cos(angleRad);
  const percent = Math.tan(angleRad) * 100;
  return { riseM, runM, percent };
}
