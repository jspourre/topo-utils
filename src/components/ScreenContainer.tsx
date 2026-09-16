import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useLayout } from '@/hooks/use-layout';

interface ScreenContainerProps {
  title: string;
  children: ReactNode;
}

export function ScreenContainer({ title, children }: ScreenContainerProps) {
  const { isLandscape } = useLayout();

  return (
    <ThemedView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        // En paysage le clavier couvre l'essentiel de l'écran : le champ focalisé doit rester visible.
        automaticallyAdjustKeyboardInsets>
        {/* En paysage les encoches passent sur les côtés, déjà couvertes par les edges latéraux. */}
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <ThemedText type="subtitle" style={[styles.title, isLandscape && styles.titleLandscape]}>
            {title}
          </ThemedText>
          <ThemedView style={styles.body}>{children}</ThemedView>
        </SafeAreaView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: BottomTabInset + Spacing.three,
  },
  safeArea: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
  },
  title: {
    marginTop: Spacing.three,
    marginBottom: Spacing.four,
  },
  titleLandscape: {
    fontSize: 24,
    lineHeight: 30,
    marginTop: Spacing.two,
    marginBottom: Spacing.three,
  },
  body: {
    gap: Spacing.four,
  },
});
