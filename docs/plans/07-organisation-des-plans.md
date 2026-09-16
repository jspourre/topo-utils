# Demande 7 — Rapatrier les plans dans le projet

> « Écris les plans dans le projet et pas dans le profil. Reprends les plans déjà écrits. »

## Contexte

Les plans vivaient à deux endroits, aucun des deux satisfaisant :

- `~/.claude/plans/` (profil utilisateur) : fichiers au nom généré aléatoirement, non versionnés,
  invisibles depuis le dépôt, et mélangeant plusieurs projets.
- `PLANS.md` à la racine : historique chronologique rédigé à la main, à jour **jusqu'à la demande 4
  seulement** — les demandes 5 et 6 étaient livrées mais absentes.

## Décisions prises

| Question | Choix retenu | Justification |
|---|---|---|
| Structure | `docs/plans/`, **un fichier par demande** (`NN-slug.md`) + `README.md` index | Chaque plan reste lisible seul ; les nouveaux s'ajoutent sans toucher aux anciens |
| Alternative écartée | Garder le `PLANS.md` unique | Un seul fichier à lire, mais il grossit sans fin |
| Fichiers du profil | Supprimés après recopie, **pour ce projet uniquement** | Les plans d'autres projets (site réserviste, page-20) ne sont pas concernés |

## Plan

1. Découper `PLANS.md` en `01-…` à `04-…` + `annexe-incident-restauration.md`, contenu inchangé,
   titres remontés d'un niveau. Supprimer `PLANS.md` de la racine.
2. Enrichir `03-carte-coordonnees.md` du détail technique que contenait le plan d'origine resté dans
   le profil (API `CoordinateMapProps`, HTML construit une seule fois, CDN Leaflet, `showMarker`).
3. Rapatrier les deux plans manquants depuis le profil : `05-mode-paysage-carte-plein-ecran.md` et
   `06-azimut-millieme-degres.md`, avec la demande citée en tête et la ligne **État** en fin.
4. `docs/plans/README.md` : index + convention.
5. `AGENTS.md` (importé par `CLAUDE.md`) : inscrire la règle, pour que les prochaines sessions
   écrivent au bon endroit.
6. Supprimer du profil les trois fichiers propres à ce projet.

Aucun fichier de `src/`, aucune dépendance, aucun test touché : changement purement documentaire.

## Vérification

`ls docs/plans/` liste les fichiers attendus, `PLANS.md` a disparu de la racine, aucun fichier ne le
référence (`grep`), et `~/.claude/plans/` ne contient plus que les plans des autres projets.

**État : livré.**
