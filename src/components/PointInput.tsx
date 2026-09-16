import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { CoordinateInput } from '@/components/CoordinateInput';
import { LocationSourceToggle } from '@/components/LocationSourceToggle';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  formatUtm,
  latLonToMgrs,
  latLonToUtm,
  mgrsToLatLon,
  parseUtmString,
  utmToLatLon,
} from '@/lib/coordinates/mgrsUtm';
import type { LatLon } from '@/types/coordinates';

type Format = 'decimal' | 'utm' | 'mgrs';

interface PointInputProps {
  label: string;
  value: LatLon | null;
  onChange: (value: LatLon | null) => void;
  onUseGps: () => void;
  gpsLabel: string;
  gpsLoading: boolean;
  gpsError: string | null;
}

/** Shows the point in the selected grid format, so switching format reveals the current value. */
function gridText(value: LatLon | null, format: Format): string {
  if (!value) return '';
  try {
    return format === 'utm' ? formatUtm(latLonToUtm(value.lat, value.lon)) : latLonToMgrs(value.lat, value.lon);
  } catch {
    return '';
  }
}

export function PointInput({
  label,
  value,
  onChange,
  onUseGps,
  gpsLabel,
  gpsLoading,
  gpsError,
}: PointInputProps) {
  const theme = useTheme();
  const [format, setFormat] = useState<Format>('decimal');
  const [gridInput, setGridInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  // Tracks the value the grid field was filled from, so an incoming change (GPS, map tap,
  // decimal edit) refreshes the text without clobbering what the user is typing.
  const [syncedValue, setSyncedValue] = useState(value ?? null);

  if (value && (value.lat !== syncedValue?.lat || value.lon !== syncedValue?.lon)) {
    setSyncedValue(value);
    setGridInput(gridText(value, format));
    setError(null);
  }

  const selectFormat = (next: Format) => {
    setFormat(next);
    setError(null);
    if (next !== 'decimal') {
      setGridInput(gridText(value, next));
    }
  };

  const convertGridInput = () => {
    const text = gridInput.trim();
    if (!text) {
      setError(null);
      return;
    }
    try {
      const converted = format === 'utm' ? utmToLatLon(parseUtmString(text)) : mgrsToLatLon(text);
      setSyncedValue(converted);
      setError(null);
      onChange(converted);
    } catch {
      setError(format === 'utm' ? 'Coordonnée UTM invalide.' : 'Référence MGRS invalide.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="smallBold">{label}</ThemedText>

      <ThemedView style={styles.formatRow}>
        <FormatButton label="Décimal" active={format === 'decimal'} onPress={() => selectFormat('decimal')} />
        <FormatButton label="UTM" active={format === 'utm'} onPress={() => selectFormat('utm')} />
        <FormatButton label="MGRS" active={format === 'mgrs'} onPress={() => selectFormat('mgrs')} />
      </ThemedView>

      <LocationSourceToggle
        loading={gpsLoading}
        error={gpsError}
        onPress={onUseGps}
        label={gpsLabel}
      />

      {format === 'decimal' ? (
        <CoordinateInput value={value} onChange={onChange} />
      ) : (
        <View style={styles.gridRow}>
          <TextInput
            value={gridInput}
            onChangeText={setGridInput}
            placeholder={format === 'utm' ? '31 N 448251 5411932' : '31U DQ 48251 11932'}
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="characters"
            autoCorrect={false}
            style={[styles.gridInput, { color: theme.text, backgroundColor: theme.backgroundElement }]}
          />
          <Pressable
            onPress={convertGridInput}
            style={({ pressed }) => [
              styles.convertButton,
              { backgroundColor: theme.backgroundSelected, opacity: pressed ? 0.7 : 1 },
            ]}>
            <ThemedText type="smallBold">Appliquer</ThemedText>
          </Pressable>
        </View>
      )}

      {error ? (
        <ThemedText type="small" style={styles.error}>
          {error}
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}

function FormatButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.formatButton,
        { backgroundColor: active ? theme.backgroundSelected : theme.backgroundElement },
      ]}>
      <ThemedText type="small" themeColor={active ? 'text' : 'textSecondary'}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  formatRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  formatButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  gridRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  gridInput: {
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
