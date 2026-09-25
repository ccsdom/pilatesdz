# Recette des paramètres d’ouverture — 25 septembre 2026

## Périmètre

Nouvel écran admin/manager `/crm/horaires`, sauvegarde versionnée par centre,
calendrier public et contrôles de réservation. Toutes les écritures de test ont
été effectuées sur les émulateurs du projet `demo-pilates-center-alger`.
L’application locale connectée au centre réel a servi uniquement à vérifier
l’affichage et l’aperçu, sans confirmation d’enregistrement.

| Vérification | Résultat |
| --- | --- |
| Modèle : horaires historiques inchangés, exceptions, pauses, minuit à Alger | Réussi |
| Refus des chevauchements, mauvaises dates et exceptions en double | Réussi |
| Résolution des versions et conversion pour le stockage Firestore | Réussi |
| Accès admin/manager ; refus cliente, visiteur, origine étrangère et centre injecté | Réussi sur émulateurs |
| Fermeture occupée bloquée, réservation et état du crédit conservés | Réussi sur émulateurs |
| Fermeture/réouverture de créneaux vides avec conservation des historiques | Réussi sur émulateurs |
| Annulations explicites et séances manuelles conservées | Réussi sur émulateurs |
| Pas de réouverture parallèle à une séance manuelle | Réussi sur émulateurs |
| Ouverture exceptionnelle le vendredi, disponibilité publique correspondante | Réussi sur émulateurs |
| Deux sauvegardes concurrentes : une seule version acceptée | Réussi sur émulateurs |
| Fermeture et réservation publique concurrentes : jamais acceptées toutes les deux | Réussi sur émulateurs |
| Formulaire CRM et aperçu, disposition compacte | Réussi dans le navigateur intégré |
| Page horaires : sept jours chargés depuis la configuration commune | Réussi dans le navigateur intégré |
| Réservation publique : créneaux chargés, mois suivants accessibles, vendredi fermé selon réglage actuel | Réussi dans le navigateur intégré |
| Ensemble des tests unitaires | 260 réussis dans 31 suites |
| TypeScript strict | Réussi |
| ESLint ciblé et contrôle du diff | Réussi |

## Anomalies rencontrées et corrections

Le stockage initial utilisait des tableaux de jours imbriqués. Firestore les
refusait : les sept jours sont désormais sérialisés dans une map et reconvertis
avec validation stricte. Un test couvre cet aller-retour.

Un premier passage HTTP complet a subi un verrou lors de la remise à zéro des
émulateurs, empêchant les suites suivantes de démarrer. Le passage isolé sur
émulateurs frais a permis de vérifier les huit nouveaux scénarios. Un test
public existant a été adapté : un horaire désormais fermé renvoie un conflit
409 avec la configuration courante, et non une erreur de format 400.

Une génération concurrente du fichier de types Next du serveur de test a
perturbé un contrôle TypeScript ; le contrôle relancé après régénération réussit.

## Limites de la recette

Aucun nouveau réglage n’a été enregistré dans le centre réel et aucun déploiement
n’a été effectué. La recette navigateur n’a pas exécuté de sauvegarde réelle.
Les droits manager/cliente et les écritures ont été vérifiés par HTTP sur les
émulateurs, sans connexion navigateur distincte pour chaque rôle.

Les limites de volumétrie et le traitement des séances manuelles sont décrits
dans `docs/architecture/parametres-ouverture.md`.
