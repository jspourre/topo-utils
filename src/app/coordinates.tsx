import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { CoordinateInput } from '@/components/CoordinateInput';
import { CoordinateMap } from '@/components/CoordinateMap';
import { LocationSourceToggle } from '@/components/LocationSourceToggle';
import { ResultCard } from '@/components/ResultCard';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SplitLayout } from '@/components/SplitLayout';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { useTheme } from '@/hooks/use-theme';
import { decimalToDms } from '@/lib/coordinates/dms';
import { formatUtm, latLonToMgrs, latLonToUtm, mgrsToLatLon } from '@/lib/coordinates/mgrsUtm';
import type { LatLon } from '@/types/coordinates';

function formatDms(deg: number, axis: 'lat' | 'lon'): string {
  const dms = decimalToDms(deg, axis);
  return `${dms.degrees}° ${dms.minutes}' ${dms.seconds.toFixed(2)}" ${dms.hemisphere}`;
}

export default function CoordinatesScreen() {
  const theme = useTheme();
  const { coords, loading, error, refresh } = useCurrentLocation();
  const [latLon, setLatLon] = useState<LatLon | null>(null);
  const [mgrsText, setMgrsText] = useState('');
  const [mgrsError, setMgrsError] = useState<string | null>(null);

  const resolvedLatLon = latLon ?? coords;

  const converted = useMemo(() => {
    if (!resolvedLatLon) return null;
    try {
      return {
        lat: formatDms(resolvedLatLon.lat, 'lat'),
        lon: formatDms(resolvedLatLon.lon, 'lon'),
        utm: formatUtm(latLonToUtm(resolvedLatLon.lat, resolvedLatLon.lon)),
        mgrs: latLonToMgrs(resolvedLatLon.lat, resolvedLatLon.lon),
      };
    } catch {
      return null;
    }
  }, [resolvedLatLon]);

  const handleConvertMgrs = () => {
    setMgrsError(null);
    try {
      setLatLon(mgrsToLatLon(mgrsText.trim()));
    } catch {
      setMgrsError('Référence MGRS invalide.');
    }
  };

  // Relever une position en plein écran sans repasser par les champs.
  const mapOverlay = converted ? (
    <>
      <ThemedText type="small" themeColor="textSecondary">
        MGRS
      </ThemedText>
      <ThemedText type="code">{converted.mgrs}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        UTM
      </ThemedText>
      <ThemedText type="code">{converted.utm}</ThemedText>
      <ThemedText type="code">
        {converted.lat} · {converted.lon}
      </ThemedText>
    </>
  ) : null;

  return (
    <ScreenContainer title="Coordonnées">
      <SplitLayout
        primary={
          <>
            <LocationSourceToggle
              loading={loading}
              error={error}
              onPress={() => {
                refresh();
                setLatLon(null);
              }}
            />

            <CoordinateMap
              markers={
                resolvedLatLon
                  ? [{ id: 'position', position: resolvedLatLon, label: '•', color: '#3c87f7' }]
                  : []
              }
              onPick={setLatLon}
              helperText="Touchez la carte pour définir la position."
              overlay={mapOverlay}
            />
          </>
        }
        secondary={
          <>
            <ThemedView style={styles.section}>
              <ThemedText type="small" themeColor="textSecondary">
                Saisie manuelle (décimal)
              </ThemedText>
              <CoordinateInput value={resolvedLatLon} onChange={setLatLon} />
            </ThemedView>

            <ThemedView style={styles.section}>
              <ThemedText type="small" themeColor="textSecondary">
                Saisie manuelle (MGRS)
              </ThemedText>
              <View style={styles.mgrsRow}>
                <TextInput
                  value={mgrsText}
                  onChangeText={setMgrsText}
                  placeholder="31U DQ 48251 11932"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="characters"
                  style={[
                    styles.mgrsInput,
                    { color: theme.text, backgroundColor: theme.backgroundElement },
                  ]}
                />
                <Pressable
                  onPress={handleConvertMgrs}
                  style={({ pressed }) => [
                    styles.convertButton,
                    { backgroundColor: theme.backgroundSelected, opacity: pressed ? 0.7 : 1 },
                  ]}>
                  <ThemedText type="smallBold">Convertir</ThemedText>
                </Pressable>
              </View>
              {mgrsError ? (
                <ThemedText type="small" style={styles.error}>
                  {mgrsError}
                </ThemedText>
              ) : null}
            </ThemedView>

            {converted ? (
              <ResultCard
                rows={[
                  { label: 'Latitude (DMS)', value: converted.lat },
                  { label: 'Longitude (DMS)', value: converted.lon },
                  { label: 'UTM', value: converted.utm },
                  { label: 'MGRS', value: converted.mgrs },
                ]}
              />
            ) : (
              <ThemedText type="small" themeColor="textSecondary">
                Utilisez le GPS ou saisissez des coordonnées pour voir les conversions.
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
  mgrsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  mgrsInput: {
    flex: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  convertButton: {
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
  },
  error: {
    color: '#D64545',
  },
});
