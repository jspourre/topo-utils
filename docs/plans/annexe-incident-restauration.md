# Annexe — Incident de restauration

Entre les demandes 3 et 4, le projet s'est retrouvé cassé par deux événements cumulés :

1. **`npm run reset-project`** (script fourni par le template Expo) a été exécuté : il **déplace**
   `src/` et `scripts/` vers `example/` et recrée un `src/app/` vierge. Rien n'était perdu, mais
   l'app semblait réduite à un écran « Edit src/app/index.tsx ».
2. **Downgrade des dépendances** : `node_modules` contenait réellement `expo@46.0.21`,
   `expo-router@5.1.11` et `expo-splash-screen@55.0.25` — des versions de 2022 incompatibles avec
   React 19 / RN 0.86 / SDK 57. D'où le crash `SyntaxError: Unexpected identifier 'run'` dans
   `@expo/config-plugins`.

**Restauration effectuée** : `package.json` remis à l'état SDK 57, réinstallation propre de toutes
les dépendances, remise en place du script `test` et de la configuration Jest, puis restauration
intégrale de `src/` et `scripts/` depuis `example/`.

**Précautions pour la suite** :
- Ne pas lancer `npm run reset-project` — il archive tout le projet.
- Utiliser `npx expo install <pkg>` plutôt que `npm install <pkg>` pour rester sur des versions
  compatibles avec le SDK.
