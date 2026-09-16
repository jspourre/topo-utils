# Demande 6 — Azimut en millièmes ou en degrés (mode Point de destination)

> « Dans pont de destination de azimuth, donne le choix entre les dégrés et les millième pour
> placer le point de destination. »

## Contexte

Dans `src/app/azimuth.tsx`, le mode « Point de destination » demande un azimut et une distance pour
calculer le point d'arrivée. Le champ `Azimut` était figé en degrés (`unit="°"`), alors que tout le
reste de l'écran affiche les angles en millièmes en premier (`formatAngle` → `"1234 mil (69.4°)"`),
parce que c'est l'unité utilisée sur le terrain.

## Décisions prises

| Question | Choix retenu | Justification |
|---|---|---|
| Unité par défaut | **Millièmes (mil)** | Cohérent avec l'affichage des résultats, qui met déjà les mil en premier ; usage terrain |
| Changement d'unité | **Le nombre saisi est conservé tel quel** | 45 reste 45 et devient 45 mil ; le point de destination se recalcule. Pas de conversion automatique, pas de remise à zéro |

## Plan

Tout tient dans `src/app/azimuth.tsx` — aucun nouveau composant, aucun nouveau helper.

1. **État** : type `AzimuthUnit = 'mil' | 'deg'` et `useState<AzimuthUnit>('mil')`.
2. **Calcul** : dans le `useMemo` de `destination`, convertir avant `destinationPoint` —
   `const azimuthDeg = azimuthUnit === 'mil' ? milsToDegrees(azimuth) : azimuth;`.
   `milsToDegrees` existe déjà dans `src/lib/bearing/bearing.ts` (ajouté à la demande 4).
   `azimuthUnit` entre dans les dépendances du `useMemo`.
3. **UI** : au-dessus du `NumericField` « Azimut », une ligne de deux boutons réutilisant le
   composant local `ModeButton` et le style `styles.row` déjà présents dans le fichier —
   « Millièmes (mil) » / « Degrés (°) ».
4. **Champ** : `unit` et `placeholder` suivent l'unité (`mil` / `800`, `°` / `45`).

Le reste de l'écran (marqueurs, `bearings`, `ResultCard`) est inchangé : il travaille sur les points
calculés et continue d'afficher l'azimut résultant dans les deux unités via `formatAngle`.

## Vérification

`npx tsc --noEmit` propre. Sur l'écran Azimut, mode « Point de destination » : départ posé sur la
carte, `1600` mil + `1000` m → point plein est, `ResultCard` à `1600 mil (90.0°)` ; bascule en
degrés sans toucher au champ → `1600` est relu comme des degrés (`1600 % 360 = 160°`) et le point se
déplace, comportement attendu ; `90` en degrés redonne le plein est.

Aucun test unitaire ajouté : la conversion passe par `milsToDegrees`, déjà couvert par
`src/lib/bearing/bearing.test.ts`.

**État : livré.**
