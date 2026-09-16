# Demande 3 — Carte libre sur l'écran Coordonnées

> « Ajoute une carte en utilisant une bibliothèque libre dans la page coordonnées. »

## Décisions prises

| Question | Choix retenu | Justification |
|---|---|---|
| Bibliothèque | **Leaflet + tuiles OpenStreetMap** dans une `WebView` | Pleinement libre (Leaflet BSD, OSM ODbL), aucune clé API, fonctionne dans Expo Go sans dev client |
| Alternative écartée | `react-native-maps` | Reste basé sur le moteur Google Maps / Apple Maps même en surchargeant les tuiles ; clé Google requise pour un build Android de production |
| Interactivité | **Interactive** (tap pour définir la position) | Choix explicite de l'utilisateur |

## Plan

1. `npx expo install react-native-webview`.
2. Nouveau composant `src/components/CoordinateMap.tsx` :
   - `WebView` de hauteur fixe (280 px), HTML autonome embarqué, Leaflet chargé depuis CDN.
   - Le HTML est construit **une seule fois au montage** ; les mises à jour passent par
     `injectJavaScript`, jamais par un changement de `source` (sinon la page recharge et perd le zoom).
   - Attribution `© OpenStreetMap contributors` visible (obligation de licence).
   - `map.on('click')` → `window.ReactNativeWebView.postMessage(...)` → `onPick`.
   - Synchronisation du marqueur par `useEffect` **avec debounce ~400 ms**, pour que la carte ne
     saute pas à chaque frappe pendant une saisie manuelle.
3. Intégration dans `src/app/coordinates.tsx` entre le bouton GPS et la saisie manuelle : la carte
   devient une troisième façon de définir la position, branchée sur le même état `setLatLon`.

## Détail technique du composant

API d'origine (avant la refonte multi-marqueurs de la demande 4) :

```ts
interface CoordinateMapProps {
  position: LatLon | null;            // position affichée (marqueur)
  onPick: (position: LatLon) => void; // appelée quand l'utilisateur tape sur la carte
}
```

- **CDN** : Leaflet `unpkg.com/leaflet@1.9.4`, tuiles
  `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`. La WebView d'un téléphone a un accès réseau
  normal — pas de restriction de chargement externe ici.
- **Centre initial** : la position connue au montage, sinon un centre par défaut (France, zoom
  faible) et aucun marqueur tant qu'aucune position n'existe.
- **`source={{ html }}` construit une seule fois** via `useState(() => buildMapHtml(...))` : changer
  `source` rechargerait la page et ferait perdre le zoom et le centre à chaque frappe.
- **Fonction JS globale `showMarker(lat, lon, recenter)`** dans la page : crée le marqueur ou le
  déplace, recentre si demandé. Elle sert aux deux sens — `injectJavaScript` depuis React Native et
  `map.on('click')` depuis la page.
- **Tap** : `map.on('click')` déplace le marqueur *sans* recentrer (sinon la vue saute sous le
  doigt) puis `postMessage(JSON.stringify({ lat, lon }))` ; côté RN, `onMessage` parse et appelle
  `onPick`.
- Le `useEffect` de synchronisation se redéclenche après un tap (la position est déjà à jour dans la
  WebView) : c'est un no-op inoffensif, pas besoin de logique anti-écho.

## Vérification

`tsc` propre, lint propre, 29 tests toujours verts, `expo export -p web` OK.

**État : livré.**
