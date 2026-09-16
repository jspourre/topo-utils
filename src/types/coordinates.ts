export interface LatLon {
  lat: number;
  lon: number;
}

export interface UtmCoordinate {
  zone: number;
  hemisphere: 'N' | 'S';
  easting: number;
  northing: number;
}

export interface DmsCoordinate {
  degrees: number;
  minutes: number;
  seconds: number;
  hemisphere: 'N' | 'S' | 'E' | 'W';
}
