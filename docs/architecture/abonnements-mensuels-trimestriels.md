# Abonnements mensuels et trimestriels

## Règles validées

- Début à la date d’achat, à minuit dans le fuseau `Africa/Algiers` ; fin exclusive à minuit à la date anniversaire suivante.
- 4 séances par mois à 12 000 DA, ou 8 séances par mois à 20 000 DA.
- Le trimestre couvre trois périodes mensuelles distinctes, à 28 800 DA ou 48 000 DA après la remise de 20 %.
- Aucun report des crédits inutilisés. Le trimestre ne donne pas un solde libre de 12 ou 24 crédits.

Pour les fins de mois, chaque échéance est calculée à partir du jour d’achat initial, ramené au dernier jour du mois si nécessaire. Exemple non bissextile : 31 janvier → 28 février → 31 mars → 30 avril. L’interface présente les dates inclusives exactes avant validation. Ce choix technique couvre les mois courts sans perdre le jour anniversaire d’origine.

## Interface et données

Le formulaire se trouve dans CRM → Clientes → fiche → Forfaits, avant la section repliable des forfaits manuels. L’administrateur choisit la formule, un mois ou trois mois, et la date d’achat. Le tarif est calculé à partir du catalogue serveur ; le navigateur ne transmet aucun montant, nombre de crédits ou date de fin libre.

`POST /api/abonnements` exige une session administrateur, une origine autorisée, un UUID de demande, un identifiant de cliente et une entrée stricte. Le serveur contrôle les dates réelles, refuse les dates d’achat futures et les abonnements entièrement expirés. Une attribution rétrospective encore valable est possible : seules les périodes correspondant aux dates des cours pourront être utilisées.

Une transaction Firestore crée simultanément :

- `centers/{centerId}/clients/{clientId}/subscriptions/{requestId}` : conditions, montant de référence en DZD, version tarifaire, périodes et trace d’attribution ;
- un ou trois documents `packages/sub-{requestId}-{period}` avec leurs dates et crédits propres ;
- un mouvement initial par période.

L’opération relit l’administrateur et la fiche dans la transaction, puis met à jour la fiche pour sérialiser les attributions concurrentes. Une même demande rejouée ne recrée pas de crédits ; réutiliser son UUID avec d’autres conditions est refusé. Deux abonnements ne peuvent pas se chevaucher pour une même cliente. Les forfaits manuels existants peuvent coexister et restent sélectionnés selon leur validité et l’expiration la plus proche. La limite existante de 100 forfaits non expirés est conservée.

## Réservations et expiration

Le moteur de réservation existant sélectionne le lot valable **à la date de la séance**, pas à la date du clic. Une cliente peut donc réserver à l’avance un cours du deuxième mois en utilisant uniquement les crédits de ce deuxième mois. Épuiser le premier mois ne permet pas d’y utiliser les crédits d’un mois futur.

L’expiration est contrôlée à chaque sélection ; aucun traitement planifié n’est requis. Les crédits expirés sont conservés pour l’historique, mais inutilisables. Une annulation autorisée restitue le crédit au lot d’origine, sans prolonger sa validité ni transférer le crédit dans un autre mois.

## Limites de cette étape

L’attribution ouvre les crédits. Le tarif est conservé comme référence, avec `paymentRecorded: false` ; aucun paiement, encaissement, prélèvement ou facture n’est enregistré. Il n’y a pas de renouvellement automatique, de suspension ou de modification rétroactive d’un abonnement. La validité des séances unitaires et les conditions spécifiques de la découverte restent à définir séparément.

Les données cloud de test existantes ne sont pas converties et aucun abonnement cloud n’est attribué automatiquement pendant le développement. Le site n’est pas déployé.

## Vérifications réalisées

Tests des mois courts, années bissextiles, changements d’année et bornes exclusives ; tarifs des quatre formules ; refus d’injection de prix et d’accès cliente ; intégration HTTP pour les transactions, rejeux, courses concurrentes, limites mensuelles, réservations futures et restitution au bon lot.

Résultats : **132 tests unitaires et 53 tests HTTP réussis**. TypeScript, compilation Next.js complète, ESLint et `git diff --check` réussis. Aucun justificatif privé détecté dans les fichiers versionnables. Aucun abonnement réel n’a été créé pendant ces contrôles ; aucune modification des données cloud de Rbah, aucun commit et aucun déploiement.

Après reconnexion administrateur, le formulaire cloud a été vérifié dans le navigateur sur la fiche de test Rbah. Pour un achat au 12 septembre 2026, les périodes affichées sont 12 septembre–11 octobre, 12 octobre–11 novembre et 12 novembre–11 décembre inclus. La sélection trimestrielle affiche 28 800 DA avec quatre séances par période, puis 48 000 DA avec huit séances par période. L’aperçu a été laissé sur quatre séances ; le bouton d’attribution n’a pas été soumis et le forfait de test existant reste à quatre crédits.
