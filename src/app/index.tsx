import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useLayout } from '@/hooks/use-layout';

const TOOLS: { href: Href; title: string; description: string }[] = [
  {
    href: '/coordinates',
    title: 'Coordonnées',
    description: 'Convertir entre MGRS, UTM et Lat/Long (décimal ou DMS).',
  },
  {
    href: '/azimuth',
    title: 'Azimut & distance',
    description: 'Azimut, azimut inverse, distance et point de destination.',
  },
  {
    href: '/compass',
    title: 'Boussole',
    description: 'Cap magnétique et géographique en millièmes, avec rose des vents.',
  },
  {
    href: '/slope',
    title: 'Dénivelé',
    description: 'Pente (angle et %) à partir d’un rapport rise/run ou d’une distance inclinée.',
  },
];

export default function HomeScreen() {
  const { isWide } = useLayout();

  return (
    <ScreenContainer title="Land Nav Toolkit">
      <ThemedText themeColor="textSecondary">
        Outils de calcul et de localisation au format militaire.
      </ThemedText>
      <ThemedView style={[styles.grid, isWide && styles.gridWide]}>
        {TOOLS.map((tool) => (
          <Link key={tool.title} href={tool.href} asChild>
            <Pressable
              style={({ pressed }) => [isWide && styles.cellWide, pressed && styles.pressed]}>
              <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedText type="smallBold">{tool.title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {tool.description}
                </ThemedText>
              </ThemedView>
            </Pressable>
          </Link>
        ))}
      </ThemedView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: Spacing.four,
  },
  gridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  cellWide: {
    width: '48%',
  },
  pressed: {
    opacity: 0.7,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
});
