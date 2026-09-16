import * as Location from 'expo-location';
import { useCallback, useState } from 'react';

import type { LatLon } from '@/types/coordinates';

interface UseCurrentLocationResult {
  coords: LatLon | null;
  loading: boolean;
  error: string | null;
  /** Fetches the current position and also returns it, so callers can route it to a specific field. */
  refresh: () => Promise<LatLon | null>;
}

export function useCurrentLocation(): UseCurrentLocationResult {
  const [coords, setCoords] = useState<LatLon | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<LatLon | null> => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permission de localisation refusée.');
        return null;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const latLon = { lat: position.coords.latitude, lon: position.coords.longitude };
      setCoords(latLon);
      return latLon;
    } catch {
      setError('Impossible de récupérer la position GPS.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { coords, loading, error, refresh };
}
