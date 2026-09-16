import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { NumericField } from '@/components/NumericField';
import { Spacing } from '@/constants/theme';
import type { LatLon } from '@/types/coordinates';

interface CoordinateInputProps {
  value?: LatLon | null;
  onChange: (value: LatLon | null) => void;
}

/** Editable lat/lon (decimal degrees) pair. Pre-fills from `value` (e.g. a GPS fix) but stays editable. */
export function CoordinateInput({ value, onChange }: CoordinateInputProps) {
  const [latText, setLatText] = useState(value ? String(value.lat) : '');
  const [lonText, setLonText] = useState(value ? String(value.lon) : '');
  // Tracks the last `value` we synced from, so we only reset the text fields when
  // the incoming value actually changes (e.g. a fresh GPS fix), not on every render.
  const [syncedValue, setSyncedValue] = useState(value ?? null);

  if (value && (value.lat !== syncedValue?.lat || value.lon !== syncedValue?.lon)) {
    setSyncedValue(value);
    setLatText(String(value.lat));
    setLonText(String(value.lon));
  }

  const emitChange = (nextLatText: string, nextLonText: string) => {
    const lat = Number(nextLatText.replace(',', '.'));
    const lon = Number(nextLonText.replace(',', '.'));
    const valid =
      nextLatText.trim() !== '' &&
      nextLonText.trim() !== '' &&
      Number.isFinite(lat) &&
      Number.isFinite(lon) &&
      Math.abs(lat) <= 90 &&
      Math.abs(lon) <= 180;
    onChange(valid ? { lat, lon } : null);
  };

  return (
    <View style={styles.row}>
      <View style={styles.field}>
        <NumericField
          label="Latitude"
          unit="°"
          value={latText}
          placeholder="48.8583"
          onChangeText={(text) => {
            setLatText(text);
            emitChange(text, lonText);
          }}
        />
      </View>
      <View style={styles.field}>
        <NumericField
          label="Longitude"
          unit="°"
          value={lonText}
          placeholder="2.2945"
          onChangeText={(text) => {
            setLonText(text);
            emitChange(latText, text);
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  field: {
    flex: 1,
  },
});
