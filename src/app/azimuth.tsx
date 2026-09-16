import { useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';

import { CoordinateMap, type MapMarker } from '@/components/CoordinateMap';
import { ModeButton, ModeButtonRow } from '@/components/ModeButton';
import { NumericField } from '@/components/NumericField';
import { PointInput } from '@/components/PointInput';
import { ResultCard } from '@/components/ResultCard';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SplitLayout } from '@/components/SplitLayout';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import {
  azimuthBetween,
  backAzimuth,
  destinationPoint,
  distanceBetween,
  formatAngle,
  gridBearingBetween,
  milsToDegrees,
} from '@/lib/bearing/bearing';
import { formatUtm, latLonToMgrs, latLonToUtm } from '@/lib/coordinates/mgrsUtm';
import type { LatLon } from '@/types/coordinates';

type Mode = 'azimuth-distance' | 'destination';
type PickTarget = 'start' | 'end';
/** Unité de saisie de l'azimut : millièmes (usage terrain) ou degrés. */
type AzimuthUnit = 'mil' | 'deg';

const START_COLOR = '#2E9E5B';
const END_COLOR = '#D64545';

export default function AzimuthScreen() {
  const gpsStart = useCurrentLocation();
  const gpsEnd = useCurrentLocation();

  const [mode, setMode] = useState<Mode>('azimuth-distance');
  const [pickTarget, setPickTarget] = useState<PickTarget>('start');
  const [start, setStart] = useState<LatLon | null>(null);
  const [end, setEnd] = useState<LatLon | null>(null);
  const [azimuthText, setAzimuthText] = useState('');
  const [azimuthUnit, setAzimuthUnit] = useState<AzimuthUnit>('mil');
  const [distanceText, setDistanceText] = useState('');

  const destination = useMemo(() => {
    if (mode !== 'destination' || !start) return null;
    const azimuth = Number(azimuthText.replace(',', '.'));
    const distance = Number(distanceText.replace(',', '.'));
    if (!Number.isFinite(azimuth) || !Number.isFinite(distance) || azimuthText === '' || distanceText === '') {
      return null;
    }
    const azimuthDeg = azimuthUnit === 'mil' ? milsToDegrees(azimuth) : azimuth;
    return destinationPoint(start, azimuthDeg, distance);
  }, [mode, start, azimuthText, azimuthUnit, distanceText]);

  // In destination mode the computed point is shown as the "end" marker.
  const effectiveEnd = mode === 'destination' ? destination : end;

  const markers = useMemo(() => {
    const list: MapMarker[] = [];
    if (start) list.push({ id: 'start', position: start, label: 'D', color: START_COLOR });
    if (effectiveEnd) list.push({ id: 'end', position: effectiveEnd, label: 'A', color: END_COLOR });
    return list;
  }, [start, effectiveEnd]);

  const bearings = useMemo(() => {
    if (!start || !effectiveEnd) return null;
    const azimuth = azimuthBetween(start, effectiveEnd);
    return {
      azimuth: formatAngle(azimuth),
      grid: formatAngle(gridBearingBetween(start, effectiveEnd)),
      back: formatAngle(backAzimuth(azimuth)),
      distance: `${distanceBetween(start, effectiveEnd).toFixed(1)} m`,
    };
  }, [start, effectiveEnd]);

  const handleMapPick = (position: LatLon) => {
    if (pickTarget === 'start') {
      setStart(position);
    } else if (mode === 'azimuth-distance') {
      setEnd(position);
    }
  };

  const canPickEnd = mode === 'azimuth-distance';

  // Relever l'azimut depuis la carte plein écran, sans repasser par les champs.
  const mapOverlay = bearings ? (
    <>
      <ThemedText type="small" themeColor="textSecondary">
        Azimut · distance
      </ThemedText>
      <ThemedText type="code">{bearings.azimuth}</ThemedText>
      <ThemedText type="code">{bearings.distance}</ThemedText>
    </>
  ) : null;

  return (
    <ScreenContainer title="Azimut & distance">
      <SplitLayout
        primary={
          <>
            <ModeButtonRow>
              <ModeButton
                label="Azimut & distance"
                active={mode === 'azimuth-distance'}
                onPress={() => setMode('azimuth-distance')}
              />
              <ModeButton
                label="Point de destination"
                active={mode === 'destination'}
                onPress={() => {
                  setMode('destination');
                  setPickTarget('start');
                }}
              />
            </ModeButtonRow>

            <CoordinateMap
              markers={markers}
              onPick={handleMapPick}
              connectMarkers
              helperText={
                canPickEnd
                  ? 'Touchez la carte pour placer le point sélectionné ci-dessous.'
                  : 'Touchez la carte pour placer le point de départ ; l’arrivée est calculée.'
              }
              overlay={mapOverlay}
            />

            {canPickEnd ? (
              <ModeButtonRow>
                <ModeButton
                  label="Placer le départ"
                  active={pickTarget === 'start'}
                  onPress={() => setPickTarget('start')}
                />
                <ModeButton
                  label="Placer l’arrivée"
                  active={pickTarget === 'end'}
                  onPress={() => setPickTarget('end')}
                />
              </ModeButtonRow>
            ) : null}
          </>
        }
        secondary={
          <>
            <PointInput
              label="Point de départ"
              value={start}
              onChange={setStart}
              gpsLabel="Utiliser ma position comme départ"
              gpsLoading={gpsStart.loading}
              gpsError={gpsStart.error}
              onUseGps={async () => {
                const position = await gpsStart.refresh();
                if (position) setStart(position);
              }}
            />

            {mode === 'azimuth-distance' ? (
              <PointInput
                label="Point d’arrivée"
                value={end}
                onChange={setEnd}
                gpsLabel="Utiliser ma position comme arrivée"
                gpsLoading={gpsEnd.loading}
                gpsError={gpsEnd.error}
                onUseGps={async () => {
                  const position = await gpsEnd.refresh();
                  if (position) setEnd(position);
                }}
              />
            ) : (
              <ThemedView style={styles.section}>
                <ModeButtonRow>
                  <ModeButton
                    label="Millièmes (mil)"
                    active={azimuthUnit === 'mil'}
                    onPress={() => setAzimuthUnit('mil')}
                  />
                  <ModeButton
                    label="Degrés (°)"
                    active={azimuthUnit === 'deg'}
                    onPress={() => setAzimuthUnit('deg')}
                  />
                </ModeButtonRow>
                <NumericField
                  label="Azimut"
                  unit={azimuthUnit === 'mil' ? 'mil' : '°'}
                  value={azimuthText}
                  onChangeText={setAzimuthText}
                  placeholder={azimuthUnit === 'mil' ? '800' : '45'}
                />
                <NumericField
                  label="Distance"
                  unit="m"
                  value={distanceText}
                  onChangeText={setDistanceText}
                  placeholder="500"
                />
              </ThemedView>
            )}

            {mode === 'destination' && destination ? (
              <ResultCard
                rows={[
                  { label: 'Latitude arrivée', value: destination.lat.toFixed(6) },
                  { label: 'Longitude arrivée', value: destination.lon.toFixed(6) },
                  { label: 'UTM arrivée', value: formatUtm(latLonToUtm(destination.lat, destination.lon)) },
                  { label: 'MGRS arrivée', value: latLonToMgrs(destination.lat, destination.lon) },
                ]}
              />
            ) : null}

            {bearings ? (
              <ResultCard
                rows={[
                  { label: 'Azimut (nord géo.)', value: bearings.azimuth },
                  { label: 'Gisement (nord quadr.)', value: bearings.grid },
                  { label: 'Azimut inverse', value: bearings.back },
                  { label: 'Distance', value: bearings.distance },
                ]}
              />
            ) : (
              <ThemedText type="small" themeColor="textSecondary">
                {mode === 'azimuth-distance'
                  ? 'Définissez le départ et l’arrivée pour obtenir l’azimut, le gisement et la distance.'
                  : 'Définissez le départ, l’azimut et la distance pour calculer le point d’arrivée.'}
              </ThemedText>
            )}
          </>
        }
      />
    </ScreenContainer>
  );
}


const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
});
