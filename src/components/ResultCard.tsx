import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

interface ResultRow {
  label: string;
  value: string;
}

interface ResultCardProps {
  rows: ResultRow[];
  footer?: ReactNode;
}

export function ResultCard({ rows, footer }: ResultCardProps) {
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      {rows.map((row) => (
        <ThemedView key={row.label} style={styles.row}>
          <ThemedText type="small" themeColor="textSecondary">
            {row.label}
          </ThemedText>
          <ThemedText type="code">{row.value}</ThemedText>
        </ThemedView>
      ))}
      {footer}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
    gap: Spacing.two,
  },
});
