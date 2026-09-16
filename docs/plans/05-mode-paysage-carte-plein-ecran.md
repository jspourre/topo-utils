# Demande 5 — Mode paysage + carte plein écran

> Demande (reformulée) : permettre le passage de l'application en mode paysage, et ouvrir la carte
> en plein écran avec les coordonnées du point en surimpression.

## Contexte

`land-nav-toolkit` est verrouillée en portrait (`app.json`, `AndroidManifest.xml`, `Info.plist`) et toutes
les pages empilent leur contenu dans une colonne unique (`ScreenContainer`). Sur un téléphone tenu en
paysage (~400 px de haut), l'app est soit impossible à tourner, soit inutilisable : le titre de 44 px de
hauteur de ligne, la carte de 280 px fixes et les champs de saisie ne tiennent pas ensemble.

Deux objectifs :

1. Rendre l'application réellement utilisable en paysage sur téléphone (orientation libre + mises en page
   sur deux colonnes qui exploitent la largeur).
2. Permettre d'ouvrir la carte en plein écran depuis l'écran Coordonnées (et Azimut, via le composant
   partagé), avec les coordonnées du point courant en surimpression — c'est le cas d'usage terrain :
   viser un point sur la carte sans devoir revenir à la liste des champs.

## Étape 1 — Déverrouiller l'orientation

- `app.json` : `"orientation": "portrait"` → `"default"`.
- `android/app/src/main/AndroidManifest.xml` : sur `.MainActivity`,
  `android:screenOrientation="portrait"` → `"unspecified"` (valeur qu'Expo génère pour `default`).
  `android:configChanges` contient déjà `orientation|screenSize`, rien à changer.
- `ios/landnavtoolkit/Info.plist` : ajouter `UIInterfaceOrientationLandscapeLeft` et
  `UIInterfaceOrientationLandscapeRight` au tableau `UISupportedInterfaceOrientations`.

`/ios` et `/android` sont dans `.gitignore` (dossiers de prebuild) : on les édite pour que le build local
actuel suive, mais `app.json` reste la source de vérité et `npx expo prebuild --clean` régénère la même
config.

## Étape 2 — Socle responsive

**Nouveau `src/hooks/use-layout.ts`** — s'appuie sur `useWindowDimensions` (se réévalue à chaque rotation) :

```ts
const WIDE_BREAKPOINT = 640;
export function useLayout() {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  return { width, height, isLandscape, isWide: isLandscape && width >= WIDE_BREAKPOINT };
}
```

**Nouveau `src/components/SplitLayout.tsx`** — deux colonnes en paysage, empilement sinon :

```tsx
export function SplitLayout({ primary, secondary }: { primary: ReactNode; secondary: ReactNode }) {
  const { isWide } = useLayout();
  if (!isWide) return <>{primary}{secondary}</>;   // fragment : le `gap` du parent s'applique aux enfants
  return (
    <View style={styles.row}>
      <View style={styles.column}>{primary}</View>
      <View style={styles.column}>{secondary}</View>
    </View>
  );
}
// row: { flexDirection: 'row', gap: Spacing.four }, column: { flex: 1, gap: Spacing.four }
```

**`src/components/ScreenContainer.tsx`** :
- titre compact en paysage (env. `fontSize: 24 / lineHeight: 30`, marges `Spacing.two`/`Spacing.three`)
  via un style conditionnel, sans toucher au type `subtitle` de `themed-text.tsx` ;
- sur la `ScrollView` : `keyboardShouldPersistTaps="handled"`, `keyboardDismissMode="on-drag"` et
  `automaticallyAdjustKeyboardInsets` — en paysage le clavier couvre la majeure partie de l'écran ;
- `SafeAreaView` garde `edges={['top', 'left', 'right']}` : les encoches passent sur les côtés en paysage,
  c'est déjà couvert.

## Étape 3 — `CoordinateMap` : hauteur adaptative, plein écran, viewport conservé

`src/components/CoordinateMap.tsx` est le fichier le plus touché. Trois changements :

**a) Hauteur adaptative** — remplacer `mapWrapper.height: 280` par une hauteur calculée :
en portrait 280 ; en paysage `Math.max(180, Math.round(height * 0.6))`.

**b) Extraire un sous-composant `MapSurface`** (même fichier) qui porte le `WebView`, le `useState(() =>
buildMapHtml(...))` initial et l'effet de synchronisation `setMarkers`. Aujourd'hui le HTML est figé pour
toute la vie de `CoordinateMap` ; il doit être reconstruit à chaque montage de surface, à partir des
markers **et** du viewport courants. `CoordinateMap` rend soit `<MapSurface key="inline" …>`, soit, en
plein écran, la même surface dans un `Modal`. Le passage inline ↔ plein écran remonte forcément le
WebView (hiérarchie native distincte pour un `Modal`), d'où le point (c).

**c) Conserver centre/zoom entre les deux montages** — `buildMapHtml` reçoit un `viewport` optionnel
`{ lat, lon, zoom }` utilisé à la place de `DEFAULT_CENTER`/`FOCUS_ZOOM` quand il est fourni. Côté HTML,
ajouter `map.on('moveend', …)` qui poste le viewport courant. Les messages deviennent typés
(`{ type: 'pick', … }` / `{ type: 'viewport', … }`) et `onMessage` dispatche ; le viewport est stocké dans
un `useRef` de `CoordinateMap`, qui survit au remontage de la surface. Résultat : on ouvre le plein écran
exactement là où on était, et on revient de même.

**d) Contrôles** — un `Pressable` en position absolue dans le coin de la carte (glyphe `⤢`, pastille
semi-opaque construite avec `useTheme()`) ouvre le plein écran. En plein écran :
- `Modal` avec `supportedOrientations={['portrait', 'landscape', 'landscape-left', 'landscape-right']}`
  (sans quoi le modal ne tourne pas sur iOS), `animationType="fade"`, `onRequestClose` pour le bouton
  retour Android ;
- `SafeAreaView` (edges complètes) pour les contrôles au-dessus du `WebView` en `absoluteFill` ;
- bouton « Fermer » explicite ;
- nouvelle prop `overlay?: ReactNode` rendue dans un bandeau translucide en bas : l'écran fournit le
  contenu, le composant ne connaît pas les conversions.

Les props existantes (`markers`, `onPick`, `connectMarkers`, `helperText`) ne changent pas, donc les deux
appelants actuels continuent de fonctionner ; le plein écran est disponible partout (Coordonnées **et**
Azimut, cf. décision retenue).

## Étape 4 — Écrans

Découpages en `SplitLayout` (ordre de lecture inchangé en portrait) :

- **`src/app/coordinates.tsx`** — colonne 1 : `LocationSourceToggle` + `CoordinateMap` ; colonne 2 :
  saisie décimale, saisie MGRS, `ResultCard`. Passer à la carte un `overlay` reprenant les lignes
  `converted` (MGRS + lat/lon) déjà calculées par le `useMemo` existant.
- **`src/app/azimuth.tsx`** — colonne 1 : boutons de mode, carte, boutons « placer départ/arrivée » ;
  colonne 2 : `PointInput`(s) ou champs azimut/distance, puis les `ResultCard`. `overlay` = azimut +
  distance depuis le `useMemo` `bearings`.
- **`src/app/pace-count.tsx`** — colonne 1 : foulée courante + bloc de calibration ; colonne 2 : les deux
  conversions pas ↔ distance.
- **`src/app/slope.tsx`** — extraire les `ResultCard` hors des blocs de saisie : colonne 1 = boutons de
  mode + `NumericField`s, colonne 2 = résultat + erreur. Ajouter un texte d'attente (comme sur les autres
  écrans) quand aucun résultat n'est calculable, pour ne pas laisser la colonne droite vide.
- **`src/app/index.tsx`** — en `isWide`, grille de deux cartes par ligne (`flexWrap: 'row'`,
  `width: '48%'` + `gap: Spacing.three`) au lieu d'une liste verticale.

Aucun changement dans `src/lib/**` : la logique de calcul et ses tests ne sont pas concernés.

## Vérification

1. `npm test` et `npm run lint` — doivent rester verts (les tests couvrent `src/lib`, non modifié).
2. `npx expo start` puis lancement sur téléphone/émulateur Android (ou iOS) :
   - rotation en paysage sur chacun des 5 écrans → passage en deux colonnes, aucun contenu tronqué,
     scroll disponible ;
   - focus sur un champ en paysage → le champ reste visible au-dessus du clavier ;
   - écran Coordonnées : bouton `⤢` → carte plein écran, coordonnées lisibles en surimpression, tap sur
     la carte met bien à jour le point, « Fermer » revient à la vue inline **au même centre/zoom** ;
   - même vérification sur Azimut (placement départ/arrivée depuis le plein écran) ;
   - rotation pendant que le plein écran est ouvert → la carte suit l'orientation.
3. Après changement d'`app.json`, si un build natif est refait : `npx expo prebuild --clean` puis
   `npm run android` pour confirmer que l'orientation libre est bien régénérée.

**État : livré.**
