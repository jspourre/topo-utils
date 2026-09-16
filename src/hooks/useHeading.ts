import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

export interface HeadingReading {
  /** Cap par rapport au nord géographique, en degrés (0-360). */
  trueHeading: number | null;
  /** Cap par rapport au nord magnétique, en degrés (0-360). */
  magHeading: number;
  /** Calibration du magnétomètre : 3 bonne, 2 moyenne, 1 faible, 0 inutilisable. */
  accuracy: number;
}

interface UseHeadingResult {
  heading: HeadingReading | null;
  error: string | null;
}

/**
 * S'abonne à la boussole du téléphone. `trueHeading` demande la permission de localisation
 * (Expo renvoie -1 sans elle) : on la demande au montage et on retombe sur le cap magnétique seul
 * si elle est refusée.
 */
export function useHeading(): UseHeadingResult {
  const [heading, setHeading] = useState<HeadingReading | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;

    (async () => {
      try {
        await Location.requestForegroundPermissionsAsync();
        const watcher = await Location.watchHeadingAsync((reading) => {
          setHeading({
            // -1 signale un nord géographique indisponible (permission refusée, ou pas de position).
            trueHeading: reading.trueHeading >= 0 ? reading.trueHeading : null,
            magHeading: reading.magHeading,
            accuracy: reading.accuracy,
          });
        });
        if (cancelled) {
          watcher.remove();
          return;
        }
        subscription = watcher;
      } catch {
        if (!cancelled) setError('Boussole indisponible sur cet appareil.');
      }
    })();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);

  return { heading, error };
}
