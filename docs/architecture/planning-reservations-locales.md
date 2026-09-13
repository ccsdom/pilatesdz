# Planning et réservations locales

> Évolution : les nouvelles réservations utilisent désormais les crédits et les annulations restituent le crédit dans la même transaction. Voir [Forfaits et crédits locaux](forfaits-credits-locaux.md). Les mentions d’absence de débit ci-dessous décrivent le périmètre initial de l’étape planning.

## Périmètre

Cette étape prolonge l’authentification et les fiches clientes. Elle fonctionne uniquement avec les émulateurs Firebase. Le déploiement est reporté ; aucune configuration cloud ni identité réelle n’est ajoutée.

L’administration crée une séance ponctuelle avec titre, coach, date, durée de 15 à 180 minutes et capacité de 1 à 30 places. La date doit être future et dans les 366 prochains jours. Tous les horaires et changements de journée utilisent `Africa/Algiers`, indépendamment du fuseau du navigateur.

Les clientes consultent le planning par jour, réservent une place et annulent leur propre réservation avant le début. L’administration consulte les participantes, annule une inscription ou toute la séance, également avant son début. Les annulations demandent une confirmation dans l’interface. Aucun paiement, débit de forfait ou message réel n’est déclenché.

Ces règles constituent les valeurs initiales de la démonstration ; la politique commerciale définitive reste à valider.

## Organisation et responsabilités

| Fichier ou dossier | Responsabilité |
| --- | --- |
| `src/domain/models/planning.ts` | Modèles, validation et conversion des horaires d’Alger |
| `src/domain/ports/planning.ts` | Contrat de persistance indépendant de Firebase |
| `src/services/planning.ts` | Validation des demandes et rôles autorisés |
| `src/repositories/firestore/planning.ts` | Transactions, isolation par centre, capacité et idempotence |
| `src/lib/planning/server.ts` | Assemblage serveur avec Firebase Admin |
| `src/lib/request-time.ts` | Heure cohérente pour le rendu d’une requête serveur |
| `app/api/planning/route.ts` | API authentifiée, origine contrôlée, corps limité, réponses non mises en cache |
| `app/crm/planning/` | Liste quotidienne, création et détail administrateur |
| `app/espace-cliente/page.tsx` | Planning et actions personnelles de la cliente |
| `src/features/planning/` | Calendrier, formulaire et confirmations |
| `app/crm/page.tsx`, `src/features/crm/` | Aperçu des quatre premières séances du jour ; forfaits et finances restent fictifs |
| `src/features/clients/client-shell.tsx` | Navigation commune vers le planning |

Les images, le lotus, les ressources de marque et les styles globaux sont conservés.

## Données et concurrence

Les séances sont stockées dans `centers/{centerId}/sessions/{sessionId}`. Elles portent aussi leur `centerId`, leur statut `scheduled` ou `cancelled`, leur capacité et leur compteur `bookedCount`.

Une réservation réside dans `sessions/{sessionId}/bookings/{clientId}` sous le même centre. L’identifiant de fiche assure une seule réservation par cliente et par séance. Les métadonnées permettent d’identifier les opérations de création et d’annulation.

La création utilise un UUID de requête : rejouer la même demande retourne la même séance, tandis qu’un contenu différent avec ce même identifiant est refusé. Réserver et annuler sont également idempotents. Le document de séance et la réservation sont modifiés dans une transaction : deux demandes concurrentes ne peuvent pas consommer la dernière place ensemble, ni incrémenter ou décrémenter deux fois le compteur.

Annuler une séance inscrit son statut sur le parent et remet le compteur à zéro, sans écrire toutes les réservations. Les documents enfants sont conservés pour la traçabilité ; un enfant encore marqué `confirmed` sous un parent annulé est interprété comme `session-cancelled`. Toute future statistique ou export devra respecter cette règle. Le détail administratif distingue les anciennes participantes d’une séance annulée.

La consultation est paginée à 50 séances par jour, ordonnées par horaire puis identifiant pour départager les horaires égaux. Les participantes sont exposées uniquement aux administratrices. L’espace cliente affiche uniquement son propre état de réservation, sans liste des autres personnes.

## Autorisations

Chaque transaction revérifie l’adhésion active au centre et son rôle. Une cliente doit être liée à une fiche dont `authUid` correspond à son identité. Une fiche inactive ne peut plus prendre de nouvelle place ; elle peut encore annuler une inscription existante. La désactivation de l’adhésion interdit l’accès selon la politique d’authentification existante.

Les clientes ne peuvent ni créer ni annuler une séance, ni viser la réservation d’une autre cliente. Les identifiants sont validés et les chemins restent sous le centre de la session. L’administration peut annuler une réservation de ce centre. Les contrôles de date utilisent l’horloge serveur au moment de la mutation.

Les SDK Admin restent exclusivement côté serveur. Les règles Firestore et Storage continuent à refuser les accès directs depuis les clients, y compris aux séances et aux réservations. Les nouvelles mutations utilisent la protection d’origine et le cookie de session existants.

## Vérifications

- Tests unitaires : validation, dates impossibles, fuseau d’Alger, bornes de journée et permissions du service.
- Tests HTTP sur Next et émulateurs isolés : création répétée, concurrence sur la dernière place, réservation et annulation répétées, annulations administratives, course réservation/annulation de séance, séparation des centres, accès révoqué, liaison de fiche falsifiée, fiche inactive, séance commencée et pagination à horaires identiques.
- Tests des règles : refus des lectures et écritures directes sur les séances et leurs réservations, en complément des ressources existantes.
- Contrôles TypeScript, ESLint et build Next ; parcours manuel de création, réservation, annulation et consultation des participantes.

Les suites complètes comprennent 68 tests unitaires, 34 tests HTTP et 8 tests de règles. Les ports de test sont distincts des émulateurs de démonstration. Lancer `pnpm test:security` et `pnpm test:auth` successivement, car ces deux suites partagent les ports de test.

## Limites et prochaines décisions

Le planning est quotidien : un historique personnel global et une liste de toutes les réservations à venir restent à concevoir. Il n’existe pas encore de séances récurrentes, modification d’une séance existante, liste d’attente, présence, gestion des salles ou détection des chevauchements de coach et de cliente. Pour corriger une séance, l’administration peut actuellement l’annuler et en créer une autre.

Les coachs sont des libellés libres, pas encore un annuaire. Les capacités initiales doivent être rapprochées des équipements du centre. La durée du préavis d’annulation, les annulations tardives, les absences, les forfaits et les règles de consommation nécessitent une validation métier avant leur implémentation.

La prochaine étape peut préciser et développer les forfaits et leurs crédits, puis relier leur consommation aux réservations par transaction. La mise en production reste une mission distincte : hébergeur Node.js, projet Firebase réel, identités serveur, domaine d’authentification et stratégie de sauvegarde doivent être préparés avant de lever les restrictions locales.
