import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useLayout } from '@/hooks/use-layout';

interface SplitLayoutProps {
  /** Colonne de gauche en paysage large, premier bloc en portrait. */
  primary: ReactNode;
  /** Colonne de droite en paysage large, second bloc en portrait. */
  secondary: ReactNode;
}

/**
 * Deux colonnes en paysage large, empilement en portrait.
 * En portrait le fragment n'introduit aucune vue : les blocs héritent du `gap` du parent.
 */
export function SplitLayout({ primary, secondary }: SplitLayoutProps) {
  const { isWide } = useLayout();

  if (!isWide) {
    return (
      <>
        {primary}
        {secondary}
      </>
    );
  }

  return (
    <View style={styles.row}>
      <View style={styles.column}>{primary}</View>
      <View style={styles.column}>{secondary}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.four,
  },
  column: {
    flex: 1,
    gap: Spacing.four,
  },
});
