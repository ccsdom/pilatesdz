# Forfaits et crédits locaux

## Périmètre et règles initiales

L’administration attribue à une fiche active un forfait nommé, avec 1 à 100 crédits, une première date et une dernière date incluse. La validité maximale est de 366 jours ; un début futur est limité aux douze prochains mois. Les dates utilisent `Africa/Algiers`. Le formulaire propose 10 crédits sur 90 jours, entièrement réglables : il ne s’agit pas d’un tarif commercial fixé.

Chaque nouvelle réservation nécessite un crédit dans un forfait valable au début de la séance. Le forfait éligible qui expire le plus tôt est consommé en priorité ; l’identifiant départage les expirations identiques. Un forfait futur peut être utilisé dès maintenant pour un cours situé dans sa période de validité. Les forfaits peuvent se cumuler, sans transfert de crédits entre eux.

L’annulation avant le début du cours restitue exactement un crédit au forfait débité, sans prolonger son expiration. Cette règle vaut pour l’annulation par la cliente, par l’administration et pour celle de toute une séance. Aucune annulation après le début n’est autorisée par ce parcours. Les anciennes réservations de démonstration sans forfait restent valides ; leur annulation ne crée aucun crédit. Une nouvelle réservation après leur annulation suit les nouvelles règles.

Aucun paiement, prix, facture, vente en ligne, renouvellement automatique, suspension ou remboursement monétaire n’est créé. Les forfaits attribués ne sont pas modifiables ou supprimables dans cette version. Le préavis commercial, les absences, les reports et les exceptions restent à définir avec le centre.

## Interface

- `/crm/forfaits` recherche les clientes et ouvre leurs forfaits.
- `/crm/clientes/{id}/forfaits` attribue un forfait et affiche les soldes, dates et états.
- La fiche cliente et la navigation CRM donnent accès à ces écrans.
- `/espace-cliente/forfaits` affiche uniquement les forfaits de la cliente connectée, avec un retour au planning.
- Les listes affichent 20 forfaits par page, du plus récemment attribué au plus ancien, avec un second tri par identifiant et navigation vers les pages suivantes.

La carte fictive « 32 forfaits à renouveler » est remplacée par une entrée descriptive. Les finances du tableau de bord restent explicitement fictives. L’identité visuelle, les ressources de marque et les styles globaux sont conservés.

## Séparation des responsabilités

| Emplacement | Responsabilité |
| --- | --- |
| `src/domain/models/package.ts` | Validation, bornes des dates et choix du forfait éligible |
| `src/domain/ports/packages.ts` | Contrat d’attribution et de consultation |
| `src/services/packages.ts` | Rôles, identifiants et validation des entrées |
| `src/repositories/firestore/packages.ts` | Attribution atomique, vérification de l’adhésion et de la fiche, lecture paginée |
| `src/repositories/firestore/planning.ts` | Débit et restitution dans les transactions de réservation |
| `src/lib/packages/server.ts` | Assemblage serveur des dépendances |
| `app/api/forfaits/route.ts` | API authentifiée, JSON strict, origine contrôlée, taille limitée et absence de cache |
| `src/features/packages/` | Formulaire et présentation des soldes |

Firebase Admin reste `server-only` et limité aux émulateurs. Les règles Firestore continuent à interdire les lectures et écritures directes des clients, même avec une revendication administrateur.

## Modèle et journal

Les forfaits résident dans `centers/{centerId}/clients/{clientId}/packages/{packageId}`. Ils contiennent leur identité et celle du centre/de la fiche, le libellé, le nombre initial de crédits, le solde `remaining`, `validFrom` inclus, `expiresAt` exclus et les métadonnées d’attribution.

Chaque forfait possède une sous-collection `movements`. Le mouvement `assignment` crédite le nombre initial. Un débit porte un identifiant composé de l’identifiant de séance, de la révision de réservation et du suffixe `debit` ; sa restitution utilise le suffixe `refund`. Chaque mouvement enregistre le delta, la raison, l’heure serveur et l’acteur ; les mouvements de réservation indiquent aussi la séance. Ce journal technique est conservé en base, sans écran d’export dans cette étape.

La réservation conserve `creditPackageId`, `creditRevision` et `creditRefunded`. Une nouvelle inscription après annulation incrémente la révision. Cela distingue plusieurs cycles réservation/annulation tout en empêchant un second débit ou remboursement pour une même opération.

L’UUID d’attribution rend une demande rejouée idempotente : elle retourne le forfait déjà attribué. Un contenu différent pour le même UUID provoque un conflit. Le formulaire affiche la réussite et demande une action explicite pour attribuer un autre forfait.

## Atomicité et autorisations

Le débit du forfait, le mouvement, la réservation et le compteur de places sont écrits dans une même transaction. Deux réservations sur des cours différents ne peuvent donc pas consommer ensemble le dernier crédit d’une cliente. Une séance complète ne consomme aucun crédit.

L’annulation individuelle lit le forfait d’origine avant toute écriture. L’annulation d’une séance entière lit toutes les réservations confirmées et leurs forfaits, puis restitue les crédits et annule le parent dans la même transaction. La capacité maximale de 30 participantes borne cette transaction. Les documents de réservation restent conservés ; le statut annulé du parent continue à définir leur état effectif `session-cancelled`, comme décrit dans l’étape planning.

Cette étape remplace donc l’ancienne annulation portant uniquement sur le document parent par une transaction qui rembourse aussi les forfaits. Un échec interdit toute annulation partielle. Les conflits concurrents provoquent une nouvelle lecture de la transaction, sans double restitution.

Les adhésions actives, rôles et liens entre fiche et identité sont revérifiés côté serveur. L’administration ne peut attribuer qu’à une fiche active de son centre ; les clientes ne peuvent ni attribuer un forfait ni viser la fiche d’une autre personne. La désactivation d’une fiche interdit les nouvelles réservations, mais conserve l’accès aux soldes et la possibilité d’annuler une réservation si l’adhésion reste active.

Pour borner les lectures de sélection, une cliente est limitée à 100 forfaits non expirés. Les attributions concurrentes sont sérialisées par une mise à jour de la fiche dans la transaction. L’historique expiré est conservé et paginé. Si des données importées dépassent cette borne, la réservation échoue explicitement au lieu de choisir parmi une liste tronquée.

## Tests et limites avant production

Les tests unitaires couvrent les dates incluses/exclues à Alger, les bornes de crédits, la durée, la sélection par expiration et les contrôles du service. Les tests HTTP sur Next et émulateurs couvrent l’autorisation, l’isolation, l’attribution concurrente répétée, les crédits insuffisants, le dernier crédit sur deux séances, les annulations concurrentes, les restitutions collectives, plusieurs cycles de réservation, la conservation des dates, les réservations anciennes et la pagination. Les tests de règles couvrent aussi les forfaits et mouvements.

Commandes : `pnpm test`, `pnpm test:auth`, `pnpm test:security`, `pnpm typecheck`, `pnpm lint`, `pnpm build`. Les deux suites d’émulateurs se lancent successivement. Le parcours navigateur utilise seulement des comptes et crédits fictifs.

Bilan de vérification de cette étape : 127 tests réussis (79 unitaires, 40 HTTP, 8 de règles), contrôle TypeScript, ESLint et build Next réussis. Le parcours navigateur vérifie une attribution de 3 crédits, un solde de 2 après réservation et une restitution à 3 après annulation. Les fichiers de marque et styles globaux sont inchangés ; aucun secret réel, commit supplémentaire ou déploiement n’est ajouté pendant cette étape.

Avant un usage réel, valider les offres commerciales, les délais d’annulation et les exceptions ; prévoir un parcours administratif de correction traçable, la consultation/export du journal et les tests des index/requêtes sur un projet Firebase de préproduction. Le déploiement reste reporté et les protections contre un accès Firebase cloud restent actives.
