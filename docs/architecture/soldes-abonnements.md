# Soldes des abonnements à vérifier

Le tableau de bord et le récapitulatif des encaissements donnent accès à `/crm/encaissements/soldes`. La page ouvre les journaux existants pour vérifier les saisies et enregistrer les espèces réellement reçues. Elle ne modifie aucune donnée et n’envoie aucune relance.

## Interprétation

Le reste à enregistrer est le prix stocké de l’abonnement, converti en centimes de dinar, moins son `paidMinor`. Ce dernier est mis à jour dans les transactions existantes d’encaissement et de correction. Les prix ne sont pas recalculés à partir du catalogue actuel.

Trois situations sont distinguées : aucun paiement enregistré, encaissement partiel enregistré, ou historique d’encaissement dont le montant net est nul après corrections. Aucun de ces états ne constitue à lui seul une preuve d’impayé. Les abonnements entièrement couverts disparaissent du suivi ; une correction peut les faire réapparaître après actualisation.

Les abonnements terminés et les fiches inactives restent inclus. Leur solde ne dépend pas des crédits de cours et aucune opération de cette vue ne change les forfaits.

## Portée et architecture

L’API GET `/api/encaissements/soldes?after=identifiant` et la page sont réservées aux administrateurs actifs du centre. La lecture transactionnelle vérifie l’adhésion, les identités des fiches et abonnements, les montants entiers sûrs, la devise DZD et les bornes des soldes. La projection exclut les coordonnées et les notes des clientes.

L’annuaire est examiné par pages de 25 fiches, actives ou inactives. Les abonnements ouverts sont présentés par date d’achat croissante sur chaque page. Le total et le nombre d’abonnements indiqués concernent explicitement cette page et ne représentent pas le centre entier. Les pages suivantes restent accessibles même si la page courante ne contient aucun solde ouvert.

Jusqu’à 100 abonnements par fiche sont examinés, indépendamment des 20 résultats de la première page de son historique. Au-delà, la lecture est refusée sans total partiel et invite à consulter les journaux individuels. Une incohérence de données est affichée comme une indisponibilité, jamais comme un solde nul.

Les requêtes utilisent les index simples existants. Aucun index, déploiement Firebase ou changement des fonctions d’encaissement n’est nécessaire. L’API désactive le cache.

## Vérification

Tests unitaires des états, montants invalides, dépassements de précision, rôles et curseurs. Tests HTTP sur émulateurs : 26 fiches, plus de 20 abonnements d’une fiche, paiements complets exclus, acompte sur fiche inactive, abonnements terminés, isolation du centre, pagination, rendu administratif, paiement puis correction, absence de modification des crédits, administrateur désactivé, montant incohérent et limite de 100 abonnements. Aucune opération effectuée sur les données réelles.
