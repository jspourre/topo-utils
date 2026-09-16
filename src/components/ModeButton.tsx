import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ModeButtonProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

/** Bouton d'un sélecteur exclusif (mode de calcul, unité, point à placer). */
export function ModeButton({ label, active, onPress }: ModeButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[styles.button, { backgroundColor: active ? theme.backgroundSelected : theme.backgroundElement }]}>
      <ThemedText type="small" themeColor={active ? 'text' : 'textSecondary'}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

/** Rangée de `ModeButton`, chacun occupant une part égale de la largeur. */
export function ModeButtonRow({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
});
