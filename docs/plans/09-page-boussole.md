# Demande 9 — Page Boussole

> « Ajoute une page boussole. La boussole doit utiliser par défaut les millièmes et mettre les
> degrés entre parenthèses. »

## Contexte

L'application donnait des azimuts calculés entre deux points (demande 4), mais aucun cap en temps
réel : impossible de suivre une direction sur le terrain avec le téléphone lui-même. Cette page
ajoute la lecture du cap au capteur, dans l'unité de travail de l'app — les millièmes, avec les
degrés en référence.

## Décisions prises

| Question | Choix retenu | Justification |
|---|---|---|
| Capteur | `Location.watchHeadingAsync` (**expo-location**, déjà installé) | Fournit `trueHeading`, `magHeading` et la calibration, et corrige la déclinaison ; le magnétomètre brut d'`expo-sensors` aurait imposé une nouvelle dépendance **et** le calcul de déclinaison à la main |
| Référence du cap affiché | Nord **géographique**, repli sur le magnétique | C'est la référence de navigation ; Expo renvoie `trueHeading = -1` sans permission de localisation, cas traité explicitement |
| Affichage principal | Millièmes en `title` (48 px), degrés entre parenthèses en dessous | `1234 mil (69.4°)` sur une seule ligne à 48 px déborde d'un écran de téléphone ; les deux lignes gardent le grand chiffre lisible à bout de bras |
| Rose des vents | Dessinée en `View` + `transform: rotate` | Aucune dépendance SVG à ajouter pour huit lettres et une aiguille |

## Plan

1. **`src/lib/bearing/bearing.ts`** — remonter `formatAngle(deg)` (`"1234 mil (69.4°)"`) depuis
   `src/app/azimuth.tsx`, où il était local, vers la couche pure : les deux écrans l'utilisent
   désormais, avec un test dans `bearing.test.ts`.
2. **`src/hooks/useHeading.ts`** (nouveau) — abonnement à `watchHeadingAsync`, permission demandée
   au montage, `remove()` au démontage (avec garde `cancelled` si le composant part avant la
   résolution de la promesse), `trueHeading` normalisé à `null` quand le capteur renvoie `-1`.
3. **`src/app/compass.tsx`** (nouveau) — `SplitLayout` : à gauche la rose + le cap en grand, à
   droite un `ResultCard` (cap géographique, cap magnétique, déclinaison E/O, calibration) et les
   messages d'état. Sous-composant local `CompassRose` : cadran mobile tournant à `-cap`, aiguille
   bicolore, repère de visée fixe en haut. Chaque lettre de la rose vit dans un calque plein cadran
   tourné de son azimut — elle se place ainsi à sa graduation et suit la rotation, comme une carte
   de boussole réelle.
4. **Branchement** — onglet « Boussole » dans `src/components/app-tabs.tsx` et
   `app-tabs.web.tsx`, carte correspondante dans le tableau `TOOLS` de `src/app/index.tsx`.

Aucune dépendance ajoutée. La permission de localisation est déjà configurée (écran Coordonnées).

## Vérification

`npx tsc --noEmit` propre, `npm test` → **34 tests verts** (un de plus : `formatAngle`),
`npm run lint` propre hors le souci pré-existant du template,
`npx expo export -p web` → 7 routes dont `/compass`.

Test terrain restant (cf. [02-test-appareil-reel.md](02-test-appareil-reel.md)) : sur téléphone,
vérifier que la rose suit la rotation de l'appareil, que le cap en millièmes correspond à une
boussole de référence, et que la ligne « Calibration » passe à « Faible » tant que le mouvement en 8
n'a pas été fait.

**État : livré.**
