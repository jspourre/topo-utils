# Demande 1 — Création de l'application

> « Création d'une application React Native permettant d'avoir des outils de calcul et d'aide de
> localisation avec des formats d'unité militaire. »

## Décisions prises

| Question | Choix retenu | Justification |
|---|---|---|
| Outils | Conversion de coordonnées, azimut/distance, comptage de pas, dénivelé | Demandé explicitement |
| Stack | Expo (managed) + TypeScript | Setup rapide, GPS simplifié, build iOS/Android sans Xcode |
| Localisation | GPS réel **et** saisie manuelle | Demandé explicitement |
| Bibliothèque de calcul | `geodesy` (Chris Veness) | Pur JS/ESM, sans module natif ; couvre MGRS/UTM/DMS **et** Vincenty — un seul modèle d'ellipsoïde (WGS84) pour toute l'app |
| Navigation | `expo-router` (fourni par le template) | Routing par fichiers, tabs préconfigurés, pas de boilerplate |

## Principe d'architecture

Séparation stricte entre la **logique de calcul pure** (`src/lib/**`, aucun import React/React Native)
et l'**UI** (`src/app/**` pour les écrans, `src/components/**` pour les composants). La précision des
conversions — cœur critique de l'app — est ainsi testable en Jest sans mock, et un seul chemin de
calcul sert quelle que soit la source de la coordonnée (GPS ou saisie).

## Plan d'implémentation

1. Scaffold `create-expo-app`, puis `expo install expo-location`, `npm install geodesy async-storage zod`.
2. `src/types/coordinates.ts` — types partagés (`LatLon`, `UtmCoordinate`, `DmsCoordinate`).
3. Modules de calcul purs, chacun avec ses tests, **avant toute UI** :
   - `lib/coordinates/dms.ts` — `decimalToDms`, `dmsToDecimal`, `parseDmsString`
   - `lib/coordinates/mgrsUtm.ts` — `latLonToMgrs`, `mgrsToLatLon`, `latLonToUtm`, `utmToLatLon`
   - `lib/bearing/bearing.ts` — `azimuthBetween`, `backAzimuth`, `distanceBetween`, `destinationPoint`
   - `lib/paceCount/paceCount.ts` — `distanceFromSteps`, `stepsFromDistance`, `calibrateStrideLength`
   - `lib/slope/slope.ts` — `slopeFromRiseRun`, `slopeFromInclinedDistance`
4. `npm test` — valider toute la couche calcul avant de toucher à l'UI.
5. Composants réutilisables : `ScreenContainer`, `NumericField`, `CoordinateInput`, `ResultCard`,
   `LocationSourceToggle`.
6. Hooks : `useCurrentLocation` (expo-location), `useStrideLength` (AsyncStorage).
7. Écrans : accueil, coordonnées, azimut, comptage de pas, dénivelé + branchement des onglets.

## Pattern GPS + saisie manuelle

`LocationSourceToggle` déclenche le hook GPS ; en cas de refus de permission, message d'erreur et
repli sur la saisie manuelle. Les champs sont **pré-remplis mais restent éditables**. La conversion
passe ensuite toujours par les fonctions pures, identiques quelle que soit la source.

## Écarts constatés par rapport au plan initial

Le template Expo SDK 57 réellement généré diffère de ce qui était anticipé :

- Les routes vivent sous `src/app/*.tsx` (à plat) et non `app/(tabs)/*.tsx`, avec l'alias `@/`.
- Les onglets utilisent `NativeTabs` (`expo-router/unstable-native-tabs`) via
  `src/components/app-tabs.tsx` (+ variante web), pas un groupe `(tabs)/_layout.tsx`.
- Les composants réutilisent le design system du template (`ThemedText`, `ThemedView`, `useTheme`,
  `Colors`/`Spacing`) au lieu d'en recréer un.
- `zod` installé mais non branché (le parsing direct suffit) ; `lib/units.ts` non créé (pas de besoin).

## Vérification

`npm test` (29 tests verts à ce stade), `tsc --noEmit` propre, `expo lint` propre hors un souci
pré-existant du template, `expo export -p web` bundle les 7 routes.

**État : livré.**
