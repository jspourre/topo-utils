# Demande 10 — Cap à suivre sur la page Boussole

> « Dans la page boussole, permet de choisir un cap avec le choix entre millième et degré. Utilise
> les millièmes par défaut. Si changement d'unité, garde la valeur numérique brute sans
> conversion. »

## Contexte

La page Boussole ([09-page-boussole.md](09-page-boussole.md)) affichait le cap courant mais ne
permettait pas de **se fixer un cap à suivre** : sur le terrain, on relève un azimut sur la carte
puis on marche dessus en surveillant l'écart. Sans repère, il fallait comparer mentalement deux
nombres à chaque coup d'œil.

## Décisions prises

| Question | Choix retenu | Justification |
|---|---|---|
| Unité par défaut | **Millièmes (mil)** | Unité de travail de l'app, comme partout ailleurs |
| Changement d'unité | **Valeur numérique brute conservée**, sans conversion | Demandé explicitement ; même convention que le mode « Point de destination » ([06](06-azimut-millieme-degres.md)) |
| Retour visuel | Repère porté par la rose **+ ligne d'écart chiffrée** avec le sens de correction | Le repère s'aligne sous le repère de visée quand on est dans l'axe ; l'écart chiffré évite d'estimer à l'œil |
| Référence de l'écart | Le cap déjà affiché en grand (géographique, ou magnétique en repli) | Les deux valeurs comparées ont ainsi toujours la même référence de nord |

## Plan

### 1. `src/components/ModeButton.tsx` (nouveau)

`ModeButton` était **dupliqué à l'identique** dans `azimuth.tsx` et `slope.tsx` ; la boussole en
aurait été la troisième copie. Le composant est extrait avec son style, accompagné d'un
`ModeButtonRow` (la rangée `flexDirection: 'row'` + `gap`). Les deux écrans existants importent
désormais le composant partagé et leurs styles locaux `modeButton` / `modeRow` / `row` disparaissent.
Rendu inchangé.

### 2. `headingDifference` dans la couche pure

`src/lib/bearing/bearing.ts` : `headingDifference(currentDeg, targetDeg)` → écart signé dans
`[-180, 180[`, positif dans le sens horaire. La fonction locale `declination` de `compass.tsx`
faisait exactement ce calcul : elle est supprimée au profit de la fonction partagée (la déclinaison
**est** un écart de cap). Testée dans `bearing.test.ts`, y compris le demi-tour qui tombe toujours
sur `-180` — d'où le libellé « à gauche » pour un cap exactement opposé, cas sans côté.

### 3. Saisie dans `src/app/compass.tsx`

- État `targetText` + `targetUnit: 'mil' | 'deg'` (millièmes par défaut).
- `targetHeading` (`useMemo`) : parsing tolérant à la virgule, conversion par `milsToDegrees` si
  l'unité est le millième, puis normalisation dans `[0, 360[`. **Le texte saisi n'est jamais
  converti** au changement d'unité : seul le cap calculé change.
- UI dans la colonne de droite : `ModeButtonRow` (« Millièmes (mil) » / « Degrés (°) ») puis un
  `NumericField` « Cap à suivre », dont `unit` et `placeholder` suivent l'unité.

### 4. Repère et écart

- `CompassRose` prend une prop `target` : un losange vert rendu dans un calque
  `StyleSheet.absoluteFill` tourné du cap visé — même technique que les lettres cardinales. Le
  calque étant **à l'intérieur** de la rose, il tourne avec elle et passe sous le repère de visée
  fixe une fois dans l'axe.
- Deux lignes s'ajoutent au `ResultCard` quand un cap est saisi : `Cap visé` (`formatAngle`) et
  `Écart` (« 350 mil (19.7°) à droite », ou « dans l'axe » sous 2°, seuil qui évite un sens
  oscillant à l'arrêt).
- Le `ResultCard` est désormais construit à partir d'un tableau de lignes assemblé
  conditionnellement : le cap visé s'affiche **même sans capteur** (navigateur, permission refusée),
  seul l'écart manque.

## Vérification

`npx tsc --noEmit` propre, `npm test` → **35 tests verts** (nouveau cas `headingDifference`),
`npm run lint` propre hors l'erreur pré-existante du template, `npx expo export -p web` → 7 routes.

Test terrain restant : saisir `1600` en millièmes → repère vert plein est et `Cap visé :
1600 mil (90.0°)` ; tourner sur soi-même → l'écart décroît et le sens s'inverse en passant le cap ;
basculer en degrés sans toucher au champ → `1600` est conservé et relu comme `160°`, le repère se
déplace ; vider le champ → repère et lignes disparaissent.

**État : livré.**
