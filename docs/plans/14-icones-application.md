# Demande 14 — Refonte du jeu d'icônes

> « Revoyons les icônes de l'application en prenant pour exemple
> `assets/expo.icon/Assets/expo-symbol 2.svg` »

## Contexte

`assets/expo.icon/Assets/expo-symbol 2.svg` a été redessiné au commit `f8fd0e1` (carte pliée +
tracé d'azimut + point d'arrivée, palette `#1F2421` / `#A3B18A` / `#E76F51` / `#E9C46A`). Mais ce
dessin n'existe **que** dans ce fichier : tout le reste du jeu d'icônes est encore celui du template
Expo, et le SVG lui-même est mal branché dans le bundle Icon Composer.

Constat, fichier par fichier :

| Élément | État actuel | Problème |
|---|---|---|
| `assets/expo.icon/icon.json` | `fill` = dégradé bleu Expo, calque `grid.png`, translation résiduelle `-16.046875` | Le dégradé et la grille du template sont toujours là ; le fond `#1F2421` du SVG les recouvre par accident |
| `expo-symbol 2.svg` | contient un `<rect rx="112">` plein cadre | Dans Icon Composer le fond vient de `fill`, pas du calque : les coins arrondis seront masqués une seconde fois par la superellipse d'Apple → artefacts dans les angles |
| `assets/images/icon.png` | logo flèche du template Expo (1024) | C'est **cette** image que prennent Android, le web et Expo Go |
| `android-icon-{foreground,background,monochrome}.png` | template Expo | Idem ; et le dessin déborde du cercle de sécurité de l'adaptive icon |
| `app.json` → `adaptiveIcon.backgroundColor` | `#E6F4FE` (bleu pâle Expo) | Incohérent avec `#1F2421` |
| `app.json` → splash `backgroundColor` / `imageWidth` | `#208AEF` (bleu Expo) / `76` | `76` est la largeur du logo Expo, pas d'une marque carrée |
| `assets/images/splash-icon.png` | copie de `expo-logo.png` (228×213) | Logo Expo |
| `src/components/animated-icon.tsx` → `AnimatedSplashOverlay` | affiche `expo-logo.png` en 76×71 | **Affiché à chaque lancement natif** : c'est l'écran de marque le plus visible de l'app |
| `src/components/app-tabs.tsx` | 1 icône (`home.png`, template) sur 5 onglets | Les 4 autres onglets n'ont aucune icône |
| `assets/images/tabIcons/explore*.png` | template | Non référencé |

**Résultat visé** : une seule source de vérité (le SVG), tous les dérivés régénérables par script,
et plus une seule image Expo visible dans l'app ou sur l'écran d'accueil.

## Décisions prises

| Question | Choix retenu | Justification |
|---|---|---|
| Retoucher le dessin de la marque ? | **Non** — géométrie, couleurs et épaisseurs du SVG conservées à l'identique | Demande explicite de l'utilisateur ; seule la plomberie est corrigée |
| Le `<rect>` plein cadre du SVG | Déplacé du calque vers `fill` dans `icon.json` (couleur unie `#1F2421`) | Rendu final strictement identique, mais plus de double masquage des coins sur iOS. Le calque redevient ce qu'Icon Composer attend : un dessin sur fond transparent |
| Coins arrondis dans les PNG | Supprimés pour `icon.png` / Android, conservés pour le favicon | iOS et Android appliquent leur propre masque ; le navigateur non |
| Fond de l'adaptive icon Android | `backgroundColor: "#1F2421"` — on supprime `android-icon-background.png` | Un aplat n'a pas besoin d'un PNG de 512 px |
| Zone de sécurité Android | Marque réduite à **0,78×** dans le premier plan 512 px | Le rayon circonscrit de la marque vaut 197/256 ; le cercle garanti de l'adaptive icon vaut 66/108 du cadre → rayon 156 px. Sans réduction, les coins de la carte sont rognés par les lanceurs à masque rond |
| Génération des PNG | Script `scripts/generate-icons.mjs` + `npm run icons`, `sharp` en **devDependency** | Sinon les 20 PNG dérivent du SVG au premier retouche. `sharp` est une dépendance native d'environ 50 Mo, mais uniquement de développement — elle ne part pas dans le bundle |
| Icônes d'onglets | 5 glyphes SVG neufs, monotrait 1,9 px sur grille 24, `renderingMode="template"` | Le SVG source n'offre rien d'exploitable à 24 px. Les glyphes reprennent le vocabulaire de la marque (trait rond, même graisse relative) mais restent lisibles. `template` = la teinte vient de `iconColor`/`labelStyle` déjà configurés dans `app-tabs.tsx`, donc thème clair et sombre gratuits |
| Icônes d'onglets : `src` PNG ou `sf`/`drawable` ? | `src={require(...)}` + `renderingMode="template"` | C'est déjà le motif en place pour `home` (`src/components/app-tabs.tsx:24`), et `SrcIcon` (`node_modules/expo-router/build/native-tabs/common/elements.d.ts`) le documente comme la voie multiplateforme |
| `AnimatedIcon` (le logo Expo animé sur fond dégradé bleu, `animated-icon.tsx:98` / `.web.tsx:57`) | Laissé en place | Vérifié : exporté mais **jamais importé**. Code mort du template, hors périmètre. `logo-glow.png` et `expo-logo.png` ne servent plus qu'à lui et à `AnimatedSplashOverlay` |

### Glyphes d'onglets retenus

Validés par rendu à 72 / 48 / 24 px avant d'écrire ce plan :

| Onglet | Glyphe |
|---|---|
| Accueil | la carte pliée à trois panneaux de la marque, simplifiée |
| Coord. | réticule — cercle, quatre branches, point central plein |
| Azimut | deux flèches partant du même point : le nord vers le haut, la visée en diagonale |
| Boussole | cercle + aiguille en losange |
| Pente | triangle rectangle + petit arc d'angle à la base |

## Plan

### 1. Sources
- `assets/expo.icon/Assets/expo-symbol 2.svg` : retirer le `<rect width="512" height="512" rx="112">`.
  **Tout le reste du fichier est inchangé** (mêmes `d`, mêmes couleurs, mêmes `stroke-width`).
- `assets/expo.icon/icon.json` : `fill` → couleur unie `#1F2421` ; supprimer le calque `grid.png` ;
  remettre la translation du calque à `[0, 0]`.
- Supprimer `assets/expo.icon/Assets/grid.png`.
- Nouveau dossier `assets/icons/tabs/` : `home.svg`, `coordinates.svg`, `azimuth.svg`,
  `compass.svg`, `slope.svg` (viewBox 24, `stroke="#FFFFFF"`, `fill="none"`, traits arrondis).

### 2. Script de génération
`scripts/generate-icons.mjs`, exposé en `npm run icons` ; `sharp` ajouté aux `devDependencies`.
Entrées : le SVG de la marque + les 5 glyphes. Sorties :

| Fichier | Taille | Contenu |
|---|---|---|
| `assets/images/icon.png` | 1024 | marque sur fond `#1F2421` plein, carré, sans arrondi |
| `assets/images/android-icon-foreground.png` | 512 | marque seule, transparente, à 0,78× |
| `assets/images/android-icon-monochrome.png` | 432 | même cadrage, silhouette blanche (RGB forcé à blanc, alpha conservé) |
| `assets/images/splash-icon.png` | 512 | marque seule, transparente |
| `assets/images/favicon.png` | 64 | marque sur `#1F2421`, coins arrondis conservés |
| `assets/images/tabIcons/{home,coordinates,azimuth,compass,slope}{,@2x,@3x}.png` | 24 / 48 / 72 | blanc sur transparent |

Rendu via `sharp(svg, { density: 600 })` puis `resize` — rastériser d'abord puis agrandir écrase les
tirets du tracé (vérifié pendant le prototypage).

- Supprimer `assets/images/android-icon-background.png` et `assets/images/tabIcons/explore*.png`.

### 3. Configuration
`app.json` :
- `android.adaptiveIcon` : retirer `backgroundImage`, poser `backgroundColor: "#1F2421"`.
- plugin `expo-splash-screen` : `backgroundColor` `#208AEF` → `#1F2421`, `imageWidth` `76` → `200`.

### 4. Code
- `src/components/app-tabs.tsx` : ajouter un `<NativeTabs.Trigger.Icon src={require(...)}
  renderingMode="template" />` aux onglets `coordinates`, `azimuth`, `compass`, `slope`, et faire
  pointer `index` sur le nouveau `home.png`. Même forme que le bloc existant lignes 21-27.
- `src/components/animated-icon.tsx` : dans `AnimatedSplashOverlay`, remplacer
  `require('@/assets/images/expo-logo.png')` par `splash-icon.png`, et passer `styles.image` de
  `76×71` à `200×200` pour coller au `imageWidth` du plugin — le raccord entre le splash natif et
  l'overlay animé doit être invisible.

## Vérification

1. `npm run icons` régénère tous les PNG sans erreur ; `git status` ne montre que les fichiers
   attendus.
2. `npx expo lint` et `npx tsc --noEmit` passent.
3. `npx expo prebuild --clean` puis vérifier que `ios/landnavtoolkit/expo.icon/` et
   `android/app/src/main/res/mipmap-*/` contiennent la nouvelle marque, et non le logo Expo.
4. `npm run android` (ou `ios`) : au lancement, le splash natif `#1F2421` doit enchaîner sans saut
   visible sur l'overlay animé — même marque, même taille, même fond.
5. Barre d'onglets : les 5 onglets ont une icône, elle change de teinte entre actif et inactif, en
   thème clair comme en thème sombre.
6. Icône sur l'écran d'accueil Android : vérifier sur un lanceur à masque rond que les coins de la
   carte ne sont pas rognés.
7. `npm run web` : le favicon de l'onglet navigateur n'est plus celui d'Expo.

**État : livré.**
