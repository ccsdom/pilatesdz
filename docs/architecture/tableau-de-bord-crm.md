# Tableau de bord CRM

Le chiffre d’affaires et la progression fictifs sont retirés. Les quatre cartes présentent les séances maintenues, les réservations, les places non réservées et le taux de remplissage de la journée civile à Alger. Les réservations sont des places, pas un nombre de clientes uniques. Les cours passés et futurs de la journée sont inclus ; les cours annulés sont exclus de tous ces calculs. Le nombre d’annulations est indiqué à part.

Le remplissage est le total des réservations divisé par le total des capacités, arrondi au pourcentage entier. Une journée sans capacité affiche un tiret ; une journée avec des séances vides affiche 0 %. Les places non réservées comprennent celles des cours déjà passés : cet indicateur ne représente pas les disponibilités futures.

## Lecture des données

La page administrateur utilise `daySessions` du service de planning. Le dépôt relit le rôle, le centre et l’accès actif dans la même transaction que les séances du jour. Le résumé porte sur toute la journée, indépendamment de la pagination du planning et de l’aperçu limité à quatre cours. Une limite explicite de 500 séances protège la lecture : au-delà, le CRM indique une erreur plutôt qu’un total tronqué. Le tarif d’un abonnement n’est jamais utilisé comme preuve d’encaissement.

Les indicateurs reflètent l’état enregistré au chargement de la page, sans abonnement temps réel. L’actualisation du navigateur recharge les chiffres. Les données financières et la messagerie restent à développer ; leurs entrées de navigation sont signalées « À venir ». La recherche mène à l’annuaire et l’icône d’accès mène à la gestion des accès.

`src/features/crm/crm.fixtures.ts` ne servait qu’à alimenter les anciennes cartes ; son unique import a été remplacé et ce fichier est retiré. Les couleurs et la structure visuelle du tableau de bord sont conservées.

## Vérification

Les tests unitaires couvrent les journées vides, les annulations, les capacités différentes, le remplissage pondéré et le calcul au-delà des quatre lignes d’aperçu. Le test HTTP injecte 55 cours dans les émulateurs, vérifie les quatre valeurs rendues, exclut les séances d’un autre centre et confirme qu’une cliente ne voit pas les indicateurs CRM.

Le scénario de tableau de bord s’exécute avant les scénarios qui ajoutent d’autres cours dans la journée. La première exécution placée en fin de suite comptait correctement six cours supplémentaires issus des tests précédents ; l’ordre du scénario a été corrigé sans modifier les calculs de l’application ni les valeurs attendues.

Résultats du 13 septembre 2026 : 137 tests unitaires et 56 tests HTTP réussis après cette correction. TypeScript, ESLint, compilation Next.js et `git diff --check` réussis. Aucun déploiement ni modification des données cloud.
