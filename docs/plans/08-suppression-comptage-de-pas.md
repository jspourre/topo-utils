# Demande 8 — Suppression de l'outil « Comptage de pas »

> « Supprime la page pas. »

## Contexte

Le comptage de pas faisait partie des quatre outils prévus à la création de l'application
(cf. [01-creation-application.md](01-creation-application.md)) : distance parcourue à partir d'un
nombre de pas, avec une foulée calibrable persistée en `AsyncStorage`. Il est retiré de
l'application.

## Décisions prises

| Question | Choix retenu | Justification |
|---|---|---|
| Étendue | **Complète** : page, onglet, carte d'accueil, hook, couche de calcul et tests | Supprimer la seule route aurait laissé `lib/paceCount/`, ses tests et `useStrideLength` en code mort |
| `@react-native-async-storage/async-storage` | Retiré de `package.json` | `useStrideLength` était son unique consommateur ; plus aucun module ne l'importe |

## Plan

**Supprimés :**

- `src/app/pace-count.tsx` — l'écran.
- `src/hooks/useStrideLength.ts` — persistance de la foulée (`AsyncStorage`).
- `src/lib/paceCount/` — `paceCount.ts` (`distanceFromSteps`, `stepsFromDistance`,
  `calibrateStrideLength`) et `paceCount.test.ts`.

**Amendés :**

- `src/components/app-tabs.tsx` — retrait du `NativeTabs.Trigger name="pace-count"` (onglet « Pas »).
- `src/components/app-tabs.web.tsx` — retrait du `TabTrigger` correspondant.
- `src/app/index.tsx` — retrait de l'entrée `/pace-count` du tableau `TOOLS` ; l'accueil ne propose
  plus que trois outils.
- `package.json` — retrait de `@react-native-async-storage/async-storage` ; `npm install` a purgé la
  dépendance de `package-lock.json`.

Les autres outils (coordonnées, azimut, dénivelé) ne partagent rien avec celui-ci : aucun composant
ni utilitaire commun n'est touché.

## Vérification

`npx tsc --noEmit` propre, `npm test` → **33 tests verts** sur 3 suites (les tests de `paceCount`
ont disparu avec le module), `npm run lint` propre.
`grep -rn "pace-count\|paceCount\|useStrideLength" src/` ne renvoie plus rien.
Dans l'app : 4 onglets (Accueil, Coordonnées, Azimut, Pente), 3 cartes sur l'accueil.

**État : livré.**
