# Suivi des forfaits

Le tableau de bord et la page Forfaits donnent accès à `/crm/forfaits/suivi`. Cette vue administrative aide à préparer un échange avec la cliente ; elle n’envoie aucun message et n’attribue aucun abonnement automatiquement.

## Règles

- Crédits faibles : somme des crédits restants des forfaits actuellement valables inférieure ou égale à un, à condition qu’au moins un forfait soit actuellement valable. Les fiches sans forfait actuel ne sont pas assimilées à un besoin de renouvellement.
- Les crédits futurs sont présentés séparément et ne gonflent pas le solde utilisable aujourd’hui. Leur présence invite à vérifier les périodes avant de proposer un renouvellement.
- Échéance proche : fin de validité dans les sept prochaines périodes de 24 heures. Les derniers jours de validité sont affichés en heure d’Alger, en tenant compte de la borne d’expiration exclusive.
- Un forfait manuel conserve sa propre échéance. Pour les lots d’un abonnement, l’échéance provient de la dernière période du document d’abonnement : la fin d’un mois intermédiaire d’un trimestre n’est pas une fin d’abonnement.
- Les fiches inactives et forfaits expirés sont exclus des alertes.

## Lecture et limites

La page examine 25 fiches par ordre d’identifiant et propose les fiches suivantes, même si aucune alerte n’apparaît sur la page courante. Les chiffres affichés concernent explicitement la page examinée, jamais l’ensemble du centre. Cette organisation évite une lecture intégrale de tous les forfaits à chaque ouverture du tableau de bord.

Le repository relit l’adhésion active de l’administrateur, les fiches, jusqu’à 100 forfaits non expirés par fiche et les abonnements associés dans une transaction de lecture. Une limite dépassée ou une référence incohérente déclenche une erreur, sans faux résultat vide. Les périodes des lots sont vérifiées contre l’abonnement associé. Aucun nouvel index composite ni déploiement Firebase n’est requis.

L’API GET `/api/forfaits/suivi?after=identifiant` est réservée aux administrateurs et désactive le cache. La projection contient les noms et les indicateurs utiles, sans coordonnées, notes ou identité de l’auteur des attributions. Les liens ouvrent les forfaits de la cliente dans le CRM.

## Vérification

Tests unitaires : cumul des forfaits, crédits futurs, forfait épuisé/expiré/absent, limites temporelles, abonnement trimestriel, droits et curseurs. Tests HTTP sur émulateurs : pagination au-delà de 25 clientes, fiche inactive, isolation du centre, absence de coordonnées dans la réponse, accès aux pages, administrateur désactivé et refus au-delà de 100 forfaits. Aucune donnée réelle modifiée.
