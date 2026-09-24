# Recette isolée — crédits et caisse — 24 septembre 2026

## Périmètre et résultat

Exécution de `credit-settlement-http.test.ts` (8 tests) et `planning-http.test.ts` (52 tests) : **60 réussis, 0 échec, 0 ignoré**. Aucun changement de code applicatif nécessaire.

Application Next.js locale sur le port 3102, Firebase Authentication 9098, Firestore 8082 et Storage 9198. Projet exclusivement `demo-pilates-center-alger`. Les identités, forfaits, séances terminées et écritures sont fictifs. Aucune donnée de production modifiée pendant cette exécution ; les services de test ont été arrêtés par le lanceur.

## Résultats métier

| Scénario | Résultat vérifié |
|---|---|
| Validation manuelle après séance | Crédit réservé consommé ; refus avant la fin du créneau |
| Deux demandes identiques | Une seule décision et une seule consommation |
| Correction de consommation | Restitution puis nouvelle consommation possibles, avec trois décisions conservées ; version périmée refusée |
| Ancienne réservation déjà déduite | Pas de second débit |
| Traitement automatique | Consommation unique après la séance, sans visite de page ; aucune présence inventée |
| Concurrence automatique/manuelle | Une décision cohérente, aucun double mouvement |
| Activation automatique | Refus sans passage récent du traitement ; réglages concurrents contrôlés |
| Annulation | Crédit libéré et retrait des deux files de validation |
| Acompte espèces | 5 000 DA sur un abonnement de 28 800 DA, enregistré une fois malgré deux requêtes identiques |
| Paiement du solde | Deux paiements finaux concurrents : un seul accepté, dépassement refusé |
| Correction de caisse | Compensation de 5 000 DA avec motif et auteur conservés ; écriture originale préservée ; rejeu sans réactivation |
| Deux corrections concurrentes | Une seule correction acceptée |
| Crédits et caisse | Paiements et corrections sans effet sur les crédits |
| Soldes ouverts | Disparition de l'abonnement soldé puis réapparition après correction |
| Journaux et exports | Pagination sans omission, totaux complets, export du mois, refus d'un résultat tronqué |
| Autorisations | Refus des clientes pour les opérations administratives, contrôle d'origine et isolation entre centres |

Les 60 tests couvrent aussi les réservations concurrentes, les forfaits trimestriels, les présences, les historiques et la confidentialité des mensurations. Rapport technique local : `outputs/qa-credits-caisse.json` ; journal : `outputs/qa-credits-caisse.log` (ignorés par Git).

## Limites et suite

- Il s'agit de tests HTTP et de dépôts sur émulateurs, pas d'une nouvelle recette graphique de tous les formulaires.
- Le traitement automatique a été exécuté localement ; cela ne prouve pas le fonctionnement de Cloud Scheduler ni l'authentification OIDC du traitement en production.
- Contrôler ensuite la tâche planifiée et son état dans le CRM, en lecture seule, avant toute annonce d'automatisation opérationnelle. Le choix manuel/automatique reste celui du manager.
- Aucun commit, push ou déploiement effectué pendant cette étape.

## Vérification du traitement en production

Contrôle en lecture seule le 24 septembre 2026 à 10:22 UTC (11:22 à Alger), avec la connexion Firebase CLI existante.

| Contrôle | Constat |
|---|---|
| Tâche `pilates-credit-settlement` | Activée, région `europe-west4`, passage toutes les cinq minutes, fuseau `Africa/Algiers` |
| Destination | POST vers `https://www.pilatesdz.com/api/internal/credits` |
| Authentification | OIDC avec le compte de service dédié et l'audience correspondant exactement à la destination |
| Trois derniers passages terminés | Réponses HTTP 200 à 10:10, 10:15 et 10:20 UTC |
| Signal applicatif Firestore | `lastSuccessAt` = 10:20:01.081 UTC, âgé de 147 secondes au contrôle |
| Résultat du dernier passage | 0 réservation traitée, 0 échec |
| Politique du centre | Document `settings/credits` absent ; le code applique le mode manuel par défaut |

Le déclenchement planifié et l'exécution de l'application sont opérationnels. Le centre reste en validation manuelle. Aucune tâche forcée, modification de configuration ou activation du mode automatique effectuée. Zéro traitement au dernier passage ne constitue pas une preuve de consommation réelle en production ; ce parcours reste couvert localement par les tests ci-dessus. Le choix du manager s'applique aux nouvelles réservations, pas rétroactivement aux réservations existantes.
