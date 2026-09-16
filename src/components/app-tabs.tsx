import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <NativeTabs
      // Barre détachée du fond de page : en thème sombre, background = #000 = fond des écrans.
      backgroundColor={colors.backgroundElement}
      indicatorColor={colors.backgroundSelected}
      tintColor={colors.text}
      // Au-delà de 4 onglets, le mode Android « auto » n'affiche que le libellé sélectionné.
      labelVisibilityMode="labeled"
      // Sans `default`, les onglets inactifs gardent la couleur native (noire, invisible sur fond sombre).
      labelStyle={{ default: { color: colors.textSecondary }, selected: { color: colors.text } }}
      iconColor={{ default: colors.textSecondary, selected: colors.text }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Accueil</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="coordinates">
        {/* Abrégé : à cinq onglets labellisés, « Coordonnées » est tronqué sur un écran de téléphone. */}
        <NativeTabs.Trigger.Label>Coord.</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="azimuth">
        <NativeTabs.Trigger.Label>Azimut</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="compass">
        <NativeTabs.Trigger.Label>Boussole</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="slope">
        <NativeTabs.Trigger.Label>Pente</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
