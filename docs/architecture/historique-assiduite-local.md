# Historique des séances et assiduité

## Parcours

L’administration ouvre « Historique et assiduité » depuis la fiche cliente, sur `/crm/clientes/{id}/historique`. La cliente ouvre « Mes séances et mon assiduité » depuis son espace, sur `/espace-cliente/historique`. Les deux écrans utilisent les mêmes calculs et proposent un mois de consultation, par défaut le mois courant à Alger.

La liste présente les réservations du mois, de la séance la plus récente à la plus ancienne, par pages de 20. Elle distingue : à venir, en cours, présente, absente, présence non renseignée, réservation annulée et séance annulée. Le mois correspond à la date de début du cours, et non à la date de réservation. Les réservations annulées avant l’annulation éventuelle du cours conservent leur état « Réservation annulée ».

Chaque ligne représente l’état actuel d’une réservation pour une séance. Plusieurs cycles réservation/annulation de la même place ne produisent pas plusieurs séances dans cette liste. Les journaux de crédits et de corrections restent leurs sources de traçabilité distinctes.

Les liens vers les feuilles de présence sont réservés au CRM. La cliente voit uniquement ses séances, leur état et son assiduité, sans participantes, motifs administratifs ou identifiants des comptes ayant corrigé les présences.

## Indicateurs

- Présences et absences : cours terminés dont le pointage est renseigné.
- À renseigner : cours terminés, réservation confirmée, aucun pointage final renseigné.
- Taux de présence : `présences / (présences + absences) × 100`, arrondi à l’entier le plus proche.
- Sans cours renseigné, le taux est « Non calculable », jamais zéro par défaut.
- Réservations à venir, cours en cours et annulations sont comptés séparément et exclus du taux.

Les indicateurs concernent le mois entier et restent identiques sur les différentes pages. Ils sont recalculés à partir des données dans une transaction de lecture ; une correction de présence est donc reflétée lors de l’actualisation, sans compteur mensuel à synchroniser.

## Architecture et données

| Emplacement | Responsabilité |
| --- | --- |
| `src/domain/models/client-history.ts` | Période mensuelle à Alger, états effectifs, calcul de l’assiduité |
| `src/domain/ports/client-history.ts` | Contrat de lecture |
| `src/services/client-history.ts` | Validation du mois, du curseur et de la fiche visée |
| `src/repositories/firestore/client-history.ts` | Vérification des accès et lecture cohérente des séances/réservations |
| `src/lib/client-history/server.ts` | Assemblage serveur |
| `app/api/historique/route.ts` | GET authentifié sans cache |
| `src/features/planning/client-history.tsx` | Vue mensuelle partagée et pagination |
| `app/crm/clientes/[id]/historique/`, `app/espace-cliente/historique/` | Pages administrateur et cliente |

Aucun document supplémentaire ni index de données applicatif n’est écrit. Le repository lit les séances du centre dont l’horaire est dans le mois demandé, puis uniquement la réservation de la fiche concernée pour chacune de ces séances. Il utilise les statuts du parent et de la réservation, ainsi que le pointage existant. Les anciennes réservations sans champ de présence sont prises en compte comme non renseignées si le cours est terminé.

Cette stratégie conserve toutes les données locales existantes sans migration. La requête est bornée à 500 séances du centre par mois. Au-delà, l’application refuse explicitement d’afficher le bilan au lieu de produire un taux à partir de données tronquées. Le nombre de lectures reste proportionnel aux séances du centre, même si la cliente en a réservé peu : cette limite et ce coût doivent être revus avant une exploitation à plus grande échelle.

La pagination utilise l’horaire puis l’identifiant de séance pour départager les horaires égaux. Un curseur devenu invalide renvoie une erreur demandant de revenir au début du mois. Les mois acceptés vont de janvier 2000 à décembre 2100.

## Autorisations

L’administration consulte les fiches de son centre uniquement. La cliente est liée à sa fiche par l’adhésion ; elle ne peut pas fournir une autre fiche à l’API. Chaque transaction revérifie l’identité de l’adhésion, son activation, son rôle, le centre et la correspondance entre fiche et `authUid` côté cliente. Une fiche inactive reste consultable si l’adhésion de connexion reste active, selon la séparation entre suivi de fiche et autorisation d’accès déjà retenue.

Les lignes retournées sont construites explicitement : titre, coach, horaire, durée, identifiant de séance et état. Les documents bruts, motifs de correction et autres participantes ne sont jamais renvoyés. Les règles Firebase restent en refus par défaut ; Admin reste côté serveur et limité aux émulateurs. Cette étape n’ajoute aucune mutation de réservation, de présence ou de crédit.

## Vérifications et suite

Les tests unitaires couvrent les bornes mensuelles à Alger et les années bissextiles, les périodes invalides, les séances à venir/en cours/terminées, les annulations prioritaires, le dénominateur du taux et l’interdiction de viser une autre fiche.

Les tests HTTP couvrent les adhésions révoquées, une liaison de fiche falsifiée, l’isolation des centres, les anciennes réservations, les mois vides, les états mixtes, la pagination à horaires identiques, les indicateurs couvrant le mois complet, la prise en compte d’une correction et le refus explicite d’un mois dépassant 500 séances.

Bilan : 156 tests réussis (99 unitaires, 49 HTTP, 8 de règles Firebase), TypeScript, ESLint et build Next réussis. Les parcours CRM et cliente sont vérifiés dans le navigateur, ainsi qu’un mois vide. Les styles globaux et les ressources de marque restent inchangés. Aucun secret réel, commit supplémentaire ou déploiement n’est ajouté à cette étape.

Avant d’augmenter le volume, prévoir un index de réservations par cliente et date, alimenté atomiquement avec les écritures et accompagné d’un rattrapage vérifié des données existantes. L’émulateur ne valide pas tous les besoins d’index d’un futur Firestore cloud ; ceux-ci devront être contrôlés en préproduction. Les exports, statistiques sur plusieurs mois et indicateurs globaux du centre restent à développer séparément. Aucun déploiement ni paiement réel n’est ajouté.
