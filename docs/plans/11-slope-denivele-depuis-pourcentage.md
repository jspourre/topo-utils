# Demande 11 — Dénivelé à partir du pourcentage de pente

> « Permet le calcul du dénivelé avec le % de pente dans slope. »

## Contexte

L'écran Dénivelé proposait deux modes : **rise / run** (dénivelé + distance horizontale → angle et
pente) et **distance inclinée + angle** (→ dénivelé, distance horizontale, pente). Le cas inverse du
premier manquait : sur une carte, la pente se lit en pourcentage et la distance horizontale se
mesure — c'est le dénivelé qu'on cherche.

## Décisions prises

| Question | Choix retenu | Justification |
|---|---|---|
| Forme du calcul | Nouveau mode **« Pente % + distance »** | Symétrique du mode rise / run existant, qui produit déjà le % ; les trois modes couvrent les trois inconnues |
| Sorties | Dénivelé, angle **et** distance inclinée | La distance inclinée vient gratuitement (`hypot`) et c'est ce qu'on parcourt réellement |
| Champ « distance horizontale » | **Partagé** avec le mode rise / run | Même grandeur, même unité : basculer entre les deux modes garde la valeur déjà saisie |
| Pente négative | Acceptée, donne un dénivelé négatif | Cohérent avec `slopeFromRiseRun`, qui gère déjà la descente |

## Plan

### 1. `src/lib/slope/slope.ts`

```ts
export function riseFromPercent(percent: number, runM: number):
  { riseM: number; angleDeg: number; inclinedM: number }
```

`rise = run × pente/100`, `angle = atan(pente/100)`, `inclinée = hypot(run, rise)`. Même garde et
même message d'erreur que `slopeFromRiseRun` quand `run ≤ 0`.

Tests ajoutés dans `slope.test.ts` : 100 % sur 100 m → 45° et 100 m de dénivelé ; 10 % sur 250 m →
25 m ; pente négative → dénivelé négatif ; aller-retour avec `slopeFromRiseRun` ; `run ≤ 0` lève.

### 2. `src/app/slope.tsx`

- Troisième valeur `'percent-run'` dans le type `Mode`, troisième `ModeButton` intitulé
  « Pente % + distance ».
- État `percentText` ; `useMemo` `percentRun` calqué sur les deux existants (parsing, `try/catch`
  autour de l'appel, `{ result, error }`).
- Le champ « Distance horizontale (run) » est extrait dans une constante `runField` réutilisée par
  les deux modes qui en ont besoin, plutôt que dupliquée.
- La sélection du message d'erreur et celle du texte d'attente passent d'un ternaire à une table
  indexée par `mode` — un ternaire à trois branches devenait illisible.
- `ResultCard` du nouveau mode : dénivelé (1 décimale), angle (2 décimales), distance inclinée
  (1 décimale), aux mêmes formats que les modes existants.

## Vérification

`npx tsc --noEmit` propre, `npm test` → **40 tests verts** (5 nouveaux sur `riseFromPercent`),
`npm run lint` propre hors l'erreur pré-existante du template, `npx expo export -p web` → 7 routes.

Contrôle manuel : mode « Pente % + distance », `10` % et `250` m → dénivelé `25.0 m`, angle `5.71°`,
distance inclinée `251.2 m` ; basculer sur « Rise / Run » conserve les `250` m et, avec `25` m de
dénivelé, redonne bien `10.0 %`.

**État : livré.**
