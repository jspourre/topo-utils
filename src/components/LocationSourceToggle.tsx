import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface LocationSourceToggleProps {
  loading: boolean;
  error: string | null;
  onPress: () => void;
  label?: string;
}

export function LocationSourceToggle({
  loading,
  error,
  onPress,
  label = 'Utiliser ma position GPS',
}: LocationSourceToggleProps) {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <Pressable
        onPress={onPress}
        disabled={loading}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: theme.backgroundSelected, opacity: pressed || loading ? 0.7 : 1 },
        ]}>
        {loading ? <ActivityIndicator color={theme.text} /> : null}
        <ThemedText type="smallBold">{label}</ThemedText>
      </Pressable>
      {error ? (
        <ThemedText type="small" style={styles.error}>
          {error} Vous pouvez saisir les coordonnées manuellement ci-dessous.
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  error: {
    color: '#D64545',
  },
});
