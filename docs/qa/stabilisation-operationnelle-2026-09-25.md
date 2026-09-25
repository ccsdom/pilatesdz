# Stabilisation opérationnelle — 25 septembre 2026

## Correction des statuts

Le planning considérait une séance comme terminée dès son heure de début.
Le calcul commun `sessionPhase` distingue désormais : à venir avant le début,
en cours entre le début inclus et la fin exclue, terminée à partir de la fin.
Une annulation reste prioritaire sur le statut temporel. La durée enregistrée
est respectée, y compris pour les anciennes séances de 90 minutes.

Application : grille CRM, journée, semaine, aperçu de séance et calendrier cliente.
Les réservations et annulations restent fermées dès le début du créneau.
Aucun mouvement financier ni de crédit n'est déclenché par cet affichage.
Les statuts sont désormais actualisés chaque seconde pendant l'affichage,
avec rattrapage au retour sur l'onglet ou après mise en veille du navigateur.
Une horloge partagée dessert le CRM, le calendrier cliente et l'aperçu.
Son minuteur et ses écouteurs sont supprimés quand le dernier composant quitte
la page. Le premier rendu conserve l'heure serveur pour l'hydratation React.
L'heure du navigateur sert uniquement à l'affichage : les contrôles serveur
restent la référence pour les réservations et les mouvements de crédits.
Cette horloge ne recharge pas les réservations ni les places depuis Firestore.

## Vérifications

- 240 tests unitaires réussis dans 27 suites, dont 10 cas de phase temporelle
  et cinq cas d'actualisation, reprise et nettoyage de l'horloge.
- TypeScript strict réussi.
- ESLint ciblé réussi.
- Vérification du diff réussie.
- Huit tests de sécurité Firestore et Storage réussis sur émulateurs locaux :
  refus des lectures, listes et écritures directes pour les identités testées.
  Journal : `outputs/stabilisation-security.log`. Les émulateurs ont été arrêtés.
- Recette HTTP sur émulateurs : 96 tests réussis dans six suites.
- Premier passage : 94 réussites et deux échecs manager. Les suites partageaient
  des données de tests, dont des dossiers invalides et des créneaux occupés.
  Après remise à zéro des seuls émulateurs de test avant chaque suite, les
  96 tests réussissent, sans modifier les règles applicatives pour les contourner.
  Le nettoyage est limité aux adresses locales 8082/9098 et au projet fictif
  `demo-pilates-center-alger`. Les suites restent séquentielles.
- Recette visuelle admin, manager et cliente : en attente de connexion.
  Vérification dans le navigateur intégré : l'onglet local affiche toujours
  le formulaire de connexion ; aucune session authentifiée n'a été contournée.

## Règles à confirmer avant modification

| Sujet | Fonctionnement actuel | Décision attendue |
| --- | --- | --- |
| Réservation publique | À partir de demain | Autoriser le jour même avant le début ? |
| Annulation cliente | Avant le début, libération du crédit réservé | Garder cette limite ou imposer un préavis ? |
| Absence | Décision du manager en manuel ; consommation après fin en automatique | Confirmer la politique et son information aux clientes |
| Horaires | 10h–20h samedi à jeudi, vendredi fermé, plages femmes/hommes codées | Confirmer avant de rendre ces horaires administrables |

## Étape suivante : paramètres d'ouverture

Prévoir un réglage par centre accessible aux administrateurs et managers :
horaires hebdomadaires, plages de public et exceptions datées de fermeture.
Conserver 60 minutes et quatre places maximum. Utiliser la même configuration
pour le site public, l'espace cliente et le CRM.

Une modification ne doit ni supprimer des réservations ni déplacer des séances
existantes silencieusement. Présenter les créneaux concernés et traiter les
réservations existantes explicitement. Tracer auteur, date et version du réglage.
Tester concurrence, chevauchements, fermetures et changement de journée à Alger.

Cette étape reste à implémenter après validation des règles et recette du socle.

## Préparation technique des paramètres d'ouverture

Constat vérifié : Firestore `(default)` utilise l'édition Standard, en région
`europe-west9`. Aucune configuration distante n'a été modifiée.

| Élément | Adaptation nécessaire |
| --- | --- |
| `src/domain/models/studio-slots.ts` | Recevoir les horaires applicables au jour demandé ; conserver les identifiants publics, les 60 minutes et la limite de quatre places. |
| `src/repositories/firestore/automatic-slots.ts` | Lire la même version des horaires dans la transaction de génération ; conserver les contrôles d'identité et de chevauchement. |
| `src/repositories/firestore/public-availability.ts` | Calculer les disponibilités à partir de cette configuration et des occupations réelles. |
| `app/api/reservation/route.ts` | Relire et vérifier les horaires dans la transaction de réservation ; une disponibilité affichée auparavant ne constitue pas une autorisation. Préserver la reprise idempotente d'une réservation déjà créée. |
| `src/domain/models/public-booking-calendar.ts` | Remplacer l'interdiction fixe du vendredi par les fermetures effectives ; garder la règle de réservation à partir de demain tant qu'elle n'est pas modifiée explicitement. |
| `src/features/public-site/booking-date-picker.tsx` et `booking-wizard.tsx` | Afficher les fermetures et plages issues de la même source ; retirer les messages d'horaires figés. |
| Accueil, `app/studio/page.tsx`, `app/contact/page.tsx`, `app/horaires/page.tsx` | Afficher des horaires cohérents avec le calendrier. |
| Nouvelle page CRM de paramètres | Réservée à admin et manager ; validation des horaires, aperçu des impacts, date d'effet, auteur et version. |

Séquence proposée :

1. Définir un modèle validé par centre : semaine, plages femmes/hommes,
   exceptions datées, fuseau Africa/Algiers, date d'effet et version.
2. Utiliser les horaires actuels lorsqu'aucun réglage n'existe. Un réglage
   invalide doit produire une erreur explicite, sans ouvrir des créneaux par défaut.
3. Construire un aperçu des séances affectées avant toute sauvegarde.
   Bloquer les changements incompatibles avec des réservations existantes
   et présenter les séances à traiter par le manager. Aucune annulation,
   modification de crédit ou suppression ne doit être implicite.
4. Prévoir également le traitement des créneaux automatiques déjà générés
   mais vides : changer seulement le générateur laisserait des disponibilités
   obsolètes dans l'espace cliente. Conserver les annulations explicites et
   les séances manuelles ; ne jamais réouvrir une séance annulée par accident.
5. Protéger sauvegarde et réservation concurrentes avec lecture transactionnelle
   de la configuration et contrôle de version. Ne pas se limiter au contrôle UI.
6. Relier tous les consommateurs avant d'exposer le formulaire manager.
7. Tester sur émulateurs : ouverture exceptionnelle un vendredi, fermeture,
   chevauchement des publics, anciennes réservations, créneau complet,
   sauvegardes simultanées, réservation pendant modification, isolation des
   centres et interdiction d'accès cliente.

Les paramètres d'ouverture ne sont pas encore exposés dans le CRM.
