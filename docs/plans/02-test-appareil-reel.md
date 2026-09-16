# Demande 2 — Test sur appareil réel

> Choix fait en réponse à une question de cadrage : tester l'app sur un téléphone via Expo Go.

## Contexte technique

L'environnement de dev tourne sous WSL2 : le réseau est isolé du réseau local, donc le mode LAN
d'Expo peut échouer à joindre le téléphone même sur le même Wi-Fi.

## Plan

1. `npx expo start` ; si le QR code LAN ne fonctionne pas depuis le téléphone, basculer sur
   `npx expo start --tunnel` (traverse l'isolation réseau, plus lent à démarrer).
2. Installer **Expo Go** sur le téléphone, scanner le QR code.
3. Parcourir les 5 onglets :
   - **Coordonnées** : GPS (accepter la permission), vérifier DMS/UTM/MGRS, tester la saisie manuelle
     et la conversion MGRS → Lat/Long.
   - **Azimut & distance** : les deux modes.
   - **Comptage de pas** : calibrer, vérifier la persistance après fermeture, les deux conversions.
   - **Dénivelé** : les deux modes, y compris les cas d'erreur (run = 0, angle ≥ 90°).
4. Relever les bugs d'affichage ou de layout (petit écran) pour correction.

**État : non réalisé** (interrompu par un conflit de port puis l'incident décrit en annexe).
