# Plans de développement — Land Nav Toolkit

Historique des demandes et des plans d'implémentation correspondants, dans l'ordre chronologique.
Un fichier par demande.

## Index

| Fichier | Demande | État |
|---|---|---|
| [01-creation-application.md](01-creation-application.md) | Création de l'application (4 outils, Expo + TypeScript) | Livré |
| [02-test-appareil-reel.md](02-test-appareil-reel.md) | Test sur appareil réel via Expo Go | Non réalisé |
| [03-carte-coordonnees.md](03-carte-coordonnees.md) | Carte libre (Leaflet/OSM) sur l'écran Coordonnées | Livré |
| [04-carte-azimut.md](04-carte-azimut.md) | Carte et saisie multi-formats sur l'écran Azimut | Livré |
| [05-mode-paysage-carte-plein-ecran.md](05-mode-paysage-carte-plein-ecran.md) | Mode paysage + carte plein écran | Livré |
| [06-azimut-millieme-degres.md](06-azimut-millieme-degres.md) | Azimut en millièmes ou en degrés | Livré |
| [07-organisation-des-plans.md](07-organisation-des-plans.md) | Rapatrier les plans dans le projet | Livré |
| [08-suppression-comptage-de-pas.md](08-suppression-comptage-de-pas.md) | Suppression de l'outil « Comptage de pas » | Livré |
| [09-page-boussole.md](09-page-boussole.md) | Page Boussole (cap au capteur, millièmes) | Livré |
| [10-boussole-cap-a-suivre.md](10-boussole-cap-a-suivre.md) | Cap à suivre sur la Boussole (millièmes/degrés) | Livré |
| [11-slope-denivele-depuis-pourcentage.md](11-slope-denivele-depuis-pourcentage.md) | Dénivelé à partir du % de pente | Livré |
| [12-navigation-lisible-smartphone.md](12-navigation-lisible-smartphone.md) | Barre de navigation lisible sur téléphone | Livré |
| [13-tuiles-hors-ligne.md](13-tuiles-hors-ligne.md) | Téléchargement de tuiles sur un cadre + mode hors ligne | **À faire** — bloqué sur la source de tuiles |
| [14-icones-application.md](14-icones-application.md) | Refonte du jeu d'icônes (marque, adaptive Android, splash, onglets) | Livré |
| [annexe-incident-restauration.md](annexe-incident-restauration.md) | Incident de restauration (entre les demandes 3 et 4) | — |

## Convention

Les plans de ce projet s'écrivent **ici**, dans `docs/plans/` — jamais dans le profil utilisateur
(`~/.claude/plans/`).

- Un fichier par demande, nommé `NN-slug-court.md`, `NN` incrémenté à partir du dernier existant.
- Ajouter la ligne correspondante au tableau d'index ci-dessus.
- Structure attendue d'un plan :
  1. Titre `# Demande N — …`
  2. La demande citée (`> « … »`)
  3. `## Contexte` — le problème, ce qui l'a déclenché, le résultat visé
  4. `## Décisions prises` — tableau `Question | Choix retenu | Justification`, y compris les
     alternatives écartées et pourquoi
  5. `## Plan` — les étapes, avec les chemins de fichiers concernés
  6. `## Vérification` — comment on constate que c'est fait
  7. Une ligne finale **État : livré. / à faire. / en cours. / non réalisé.** — un plan peut donc
     être écrit en avance, comme fiche de travail à reprendre plus tard.
