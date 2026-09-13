# Consultation des abonnements

Les pages de forfaits CRM et cliente présentent les abonnements enregistrés : formule, tarif d’origine, dates inclusives à l’heure d’Alger, périodes mensuelles et état de validité. Le tarif est lu dans le document enregistré, sans recalcul à partir du catalogue actuel. Il ne représente pas une confirmation d’encaissement. Les crédits disponibles restent affichés séparément dans les forfaits.

## Accès et pagination

`GET /api/abonnements` et les pages utilisent le même service. L’administrateur indique une fiche de son centre ; une cliente ne peut pas transmettre de fiche et utilise exclusivement son rattachement serveur. La transaction relit l’accès actif, son centre, son rôle et le lien `authUid` de la fiche. La réponse sélectionne les seules conditions de l’abonnement ; elle exclut l’auteur de l’attribution et les champs internes.

La lecture est bornée à 21 documents pour afficher 20 résultats et détecter une page suivante. Le tri est `assignedAt DESC, __name__ DESC`, avec un curseur composé de la date et de l’identifiant. Les égalités de date sont ainsi paginées sans doublon. Ce tri utilise l’index simple descendant automatique de Firestore. Aucune configuration ni donnée cloud n’est modifiée par cette étape.

Les paramètres `after` (forfaits) et `subscriptionAfter` (abonnements) sont indépendants et conservés dans leurs liens de navigation. Une fiche sans abonnement garde ses crédits manuels visibles. Les données incohérentes produisent une erreur de lecture plutôt qu’une présentation partielle trompeuse.

Référence technique : [ordre des index Firestore et du champ `__name__`](https://firebase.google.com/docs/firestore/query-data/index-overview#default_ordering_and_the_name_field).

## Périmètre

Cette étape ajoute uniquement la consultation. Elle ne change pas les crédits, les réservations ou les tarifs et n’ajoute ni encaissement, ni renouvellement automatique, ni remboursement.

## Vérification

Les tests couvrent l’accès anonyme, les lectures d’autres clientes, la désactivation d’accès, un rattachement incohérent, les curseurs invalides, la projection des champs publics, la conservation du prix enregistré et la pagination de 23 documents dont 22 ont la même date d’attribution. Le rendu de la page cliente est également contrôlé avec les émulateurs isolés.

Résultats du 13 septembre 2026 : 133 tests unitaires et 55 tests HTTP réussis ; TypeScript, ESLint, compilation Next.js et `git diff --check` réussis. Les données de pagination sont créées uniquement dans les émulateurs de test. Aucun abonnement cloud n’a été attribué.
