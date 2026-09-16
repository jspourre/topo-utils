# Demande 12 — Barre de navigation lisible sur téléphone

> « Rends le menu de navigation plus visible sur smartphone. On ne voit que la page sélectionnée
> mais les autres sont illisibles car noir sur fond noir. »

## Contexte

`src/components/app-tabs.tsx` configurait `NativeTabs` avec uniquement
`labelStyle={{ selected: { color } }}`. Deux défauts se cumulaient sur téléphone :

1. **Libellés inactifs invisibles** — sans clé `default`, les onglets non sélectionnés gardaient la
   couleur native (noire), donc illisibles sur le fond sombre.
2. **Libellés inactifs masqués** — le bottom nav Material d'Android, en `labelVisibilityMode`
   `auto`, n'affiche le libellé que de l'onglet sélectionné **dès qu'il y a plus de quatre
   onglets**. L'app en a cinq depuis l'ajout de la Boussole.

S'y ajoutait un manque de contraste : `backgroundColor` valait `colors.background`, soit exactement
le fond des écrans (`#000000` en thème sombre) — la barre ne se détachait pas de la page.

## Décisions prises

| Question | Choix retenu | Justification |
|---|---|---|
| Couleur des onglets inactifs | `labelStyle.default` + `iconColor.default` à `textSecondary` | La forme `{ default, selected }` est celle documentée pour l'API v57 ; `textSecondary` est déjà la couleur « secondaire lisible » du thème |
| Libellés Android | `labelVisibilityMode="labeled"` | Force l'affichage de tous les libellés malgré les cinq onglets |
| Fond de la barre | `backgroundElement` au lieu de `background` | Détache la barre du fond de page dans les deux thèmes |
| Indicateur | `backgroundSelected` | Reste visible sur le nouveau fond de barre |
| Libellé « Coordonnées » | Abrégé en « Coord. » | À cinq onglets labellisés, il était tronqué sur un écran de téléphone |

## Plan

Un seul fichier : `src/components/app-tabs.tsx` (variante native). Le `NativeTabs` racine reçoit
`backgroundColor`, `indicatorColor`, `tintColor`, `labelVisibilityMode`, `labelStyle` sous la forme
`{ default, selected }` et `iconColor` sous la même forme.

`src/components/app-tabs.web.tsx` n'est pas touché : sa barre est un composant maison
(`TabButton` / `CustomTabList`) qui gère déjà l'état inactif via `themeColor="textSecondary"`.

Source : [documentation Native Tabs SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/router/native-tabs/)
— `labelStyle` accepte `StyleProp<NativeTabsLabelStyle> | { default, selected }`, et
`labelVisibilityMode` est propre à Android.

## Vérification

`npx tsc --noEmit` propre (les props sont bien typées par l'API v57), `npm test` → 40 tests verts,
`npm run lint` propre hors l'erreur pré-existante du template.

Contrôle sur téléphone : les cinq libellés sont visibles simultanément, les inactifs en gris lisible
et l'actif en pleine couleur ; la barre se distingue du fond de page en thème clair comme en thème
sombre. À refaire dans les deux thèmes, Android et iOS.

**État : livré, rendu à confirmer sur appareil.**
