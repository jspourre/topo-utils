# Demande 4 — Carte et saisie multi-formats sur l'écran Azimut

> « Ajoute la carte dans Azimut et distance et permet de choisir une position de départ et d'arrivée
> soit par la carte, soit par l'entrée de coordonnées au format soit UTM soit MGRS. Propose d'utiliser
> ma position comme point de départ ou d'arrivée. Donne l'azimut et le gisement en millièmes avec
> entre parenthèses la valeur en degrés. »

## Décisions prises

- **Azimut vs gisement** : l'azimut se mesure depuis le nord géographique, le gisement depuis le nord
  du quadrillage UTM. L'écart est la **convergence des méridiens**, fournie par `geodesy`
  (`latLon.toUtm().convergence`) : `gisement = azimut − convergence` au point de départ.
- **Millième** : étalon **OTAN / français, 6400 par tour** (et non 6000 russe ni 6283 milliradians).
- **Deux instances du hook GPS** (une par point) plutôt qu'une seule, pour que les états de
  chargement et d'erreur du départ et de l'arrivée ne se mélangent pas.

## Plan

1. **Couche calcul** (+ tests) :
   - `lib/bearing/bearing.ts` : `MILS_PER_TURN`, `degreesToMils`, `milsToDegrees`, `gridBearingBetween`.
   - `lib/coordinates/mgrsUtm.ts` : `formatUtm`, `parseUtmString` (tolère `31N …` et `31 N …`),
     `gridConvergence`.
2. **`useCurrentLocation`** : `refresh()` retourne désormais la position, pour pouvoir l'aiguiller
   vers le départ ou l'arrivée depuis un gestionnaire d'événement (et non depuis un effet, interdit
   par la règle lint `react-hooks/set-state-in-effect`).
3. **`LocationSourceToggle`** : libellé personnalisable (« … comme départ » / « … comme arrivée »).
4. **`CoordinateMap`** : refonte multi-marqueurs — API `markers: MapMarker[]`, pastilles colorées
   avec lettre (D/A), ligne pointillée optionnelle entre les deux points, recadrage automatique
   (`fitBounds`) sauf quand la mise à jour provient d'un tap (sinon la vue saute sous le doigt ;
   ce cas est aussi poussé sans debounce, pour un retour visuel immédiat).
5. **Nouveau `src/components/PointInput.tsx`** : sélecteur de format **Décimal / UTM / MGRS**,
   bouton GPS dédié, bouton « Appliquer » pour convertir une saisie UTM/MGRS. Changer de format
   affiche la valeur courante convertie dans ce format.
6. **`src/app/azimuth.tsx`** : carte + sélecteur « Placer le départ / Placer l'arrivée » + deux
   `PointInput` + résultats au format `1234 mil (69.4°)` pour l'azimut, le gisement et l'azimut
   inverse. En mode « Point de destination », le point calculé s'affiche sur la carte et ses
   coordonnées sont données en décimal, UTM et MGRS.
7. **`src/app/coordinates.tsx`** : adaptation à la nouvelle API `markers` et réutilisation de
   `formatUtm` (suppression d'un formatage dupliqué).

## Vérification

`tsc` propre, **39 tests** verts (10 nouveaux : millièmes, gisement, convergence, parsing UTM),
lint propre hors le souci pré-existant du template, `expo export -p web` OK.

**État : livré. Reste le test tactile réel sur téléphone (demande 2).**
