# Demande 13 — Téléchargement de tuiles sur un cadre et mode hors ligne

> « Est-il possible de faire un système pour télécharger des tuiles sur un cadre sélectionné pour la
> carte et l'avoir en mode hors ligne ? »

## Contexte

La carte (`src/components/CoordinateMap.tsx`) charge ses tuiles en ligne depuis
`tile.openstreetmap.org`. Sur le terrain — le cas d'usage de l'app — il n'y a souvent pas de réseau.
L'objectif est de sélectionner un cadre sur la carte, d'en télécharger les tuiles à l'avance, et de
naviguer ensuite sans connexion.

**Faisable, mais pas en l'état** : une décision bloquante et trois obstacles techniques sont à lever
avant de commencer.

## Décision bloquante — la source de tuiles

La [politique d'usage des tuiles OSM](https://operations.osmfoundation.org/policies/tiles/) interdit
explicitement cet usage :

> « Offline use is not permitted on `tile.openstreetmap.org` »

Le « bulk downloading » y est défini comme « tout chargement préemptif de tuiles autres que celles
que l'utilisateur regarde activement », et les fonctions « télécharger une ville / un pays pour usage
hors ligne » sont citées nommément comme prohibées. La politique renvoie vers les tuiles
auto-hébergées ou « un fournisseur qui autorise explicitement le hors-ligne / le préchargement », et
signale que les tuiles vectorielles sont souvent mieux adaptées.

**À trancher avant toute implémentation** : tuiles auto-hébergées, fournisseur avec clé API
autorisant le préchargement, ou jeu de tuiles préparé à l'avance et livré avec l'application.
Tant que ce choix n'est pas fait, le reste du plan reste théorique.

## Obstacles techniques relevés dans le code actuel

1. **Leaflet vient d'un CDN** (`unpkg`) dans le HTML construit par `buildMapHtml`
   (`src/components/CoordinateMap.tsx`). Hors ligne, la bibliothèque elle-même ne se charge pas :
   page blanche, même avec toutes les tuiles en local. Leaflet doit être embarqué dans l'app.
2. **Pas d'origine exploitable** : la WebView est alimentée par `source={{ html }}` sans `baseUrl`.
   L'origine est nulle, donc `IndexedDB` / `localStorage` sont inutilisables ou non persistants, et
   les sous-ressources `file://` sont bloquées.
3. **Stockage** : en SDK 57, `expo-file-system` expose les classes `File` / `Directory`
   (`File.downloadFileAsync`, `Paths.document`) — l'API adaptée, sans dépendance supplémentaire.
   L'API historique (`downloadAsync`, `documentDirectory`) n'est plus accessible que via
   `expo-file-system/legacy` et est dépréciée.

## Architecture retenue

Écrire au premier lancement la page de carte **et** Leaflet dans le dossier documents, puis charger
la WebView avec `source={{ uri }}` au lieu d'une chaîne HTML. La page a alors une vraie origine
`file://` et le `tileLayer` peut pointer directement sur `file:///…/tiles/{z}/{x}/{y}.png`, avec
repli réseau quand la tuile manque — aucun pont JS par tuile, et les tuiles restent inspectables et
supprimables.

S'y ajoutent :

- **Sélection du cadre** : deux taps sur les coins opposés, `L.Rectangle` pour le retour visuel. Le
  pont `postMessage` → `onPick` existe déjà et gère les taps.
- **Choix du zoom maximal** et **estimation du volume affichée avant** de lancer le téléchargement.
- **Téléchargement séquentiel** avec progression et annulation, et **plafond de tuiles codé en dur**
  avec refus explicite au-delà.
- **Liste des zones téléchargées** (emprise, zoom, taille, date) avec suppression.

## Volumes — l'argument dimensionnant

Cadre de 10 × 10 km vers 45° de latitude, tuiles cumulées depuis le zoom 12 :

| Zoom max | Tuiles cumulées | Poids approximatif |
|---|---|---|
| 15 | ~180 | ~4 Mo |
| 16 | ~700 | ~15 Mo |
| 17 | ~2 900 | ~60 Mo |
| 18 | ~11 500 | ~250 Mo |

Le zoom 16 est le bon compromis pour de la navigation terrestre : au-delà le volume explose et aucun
fournisseur gratuit ne suivra. D'où le plafond de tuiles, à fixer autour de cet ordre de grandeur.

## Portée

C'est la demande la plus lourde du projet à ce jour : refonte du chargement de `CoordinateMap`,
nouveau module de cache de tuiles, nouvel écran de gestion des zones, et changement de source de
tuiles. À découper en plusieurs étapes livrables (embarquer Leaflet → passer la page en `file://` →
cache et repli → sélection du cadre → gestion des zones).

## Vérification (à l'implémentation)

- Mode avion après téléchargement : la carte s'affiche et se déplace dans l'emprise téléchargée,
  sans tuile grise ; hors emprise, comportement dégradé explicite.
- Volume annoncé avant téléchargement cohérent avec la taille réelle du dossier.
- Suppression d'une zone : l'espace est bien rendu, la carte retombe en ligne.
- `npm test`, `npx tsc --noEmit`, `npm run lint`, `npx expo export -p web` toujours propres.

**État : à faire — bloqué sur le choix de la source de tuiles.**
