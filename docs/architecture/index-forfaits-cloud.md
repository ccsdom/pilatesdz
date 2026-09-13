# Index de lecture des forfaits

Le test réel de préparation des crédits a rencontré `FAILED_PRECONDITION` : Firestore exige un index pour la requête `packages.orderBy(assignedAt, desc).orderBy(documentId, asc)` utilisée par la pagination.

L’inventaire cloud a confirmé l’absence d’index composites. L’index requis est préparé dans `firestore.indexes.json` : collection `packages`, portée `COLLECTION`, `assignedAt DESCENDING`, `__name__ ASCENDING`. Il conserve l’ordre et les curseurs actuels sans modifier les données ou les permissions.

La tentative de publication limitée à `firestore:indexes` a été refusée par le contrôle automatique d’approbation, qui demande une autorisation explicite au regard de la consigne initiale de ne rien déployer. Aucun index cloud n’a donc été créé lors de cette tentative. Le JSON et `git diff --check` sont valides.

Après autorisation : créer cet index, attendre son état prêt, recharger la page des forfaits de la cliente de test, puis reprendre l’attribution des quatre crédits et la création du cours. Aucun crédit ni cours n’a été créé pendant ce diagnostic.

L’utilisateur a ensuite autorisé explicitement l’index. La publication limitée à `firestore:indexes` a réussi ; l’API a confirmé sa construction sous l’identifiant `CICAgOjXh4EK`. Aucun site ni règle d’accès n’a été publié par cette commande. Pendant la construction, le cours `f971fd56-3170-4234-a07e-74d06c0b2f4e`, « Reformer — test réservation », a été créé depuis le CRM pour le 13 septembre 2026 à 18 h, heure d’Alger : 60 minutes, 4 places, coach « Équipe test », aucune inscription initiale.

L’API a ensuite confirmé l’état `READY`. La page des forfaits s’est chargée avec une liste vide. Depuis le formulaire CRM, le forfait « Test réservation — 4 crédits sans paiement » a été attribué à la fiche cliente de test `2KR5FDP8Bax67Yyb4xjj`, pour la période du 12 septembre au 11 octobre 2026 inclus. L’interface a confirmé l’attribution et affiché **4 / 4 crédits restants**. Aucun paiement enregistré. La réservation réelle par la cliente et la vérification du passage à trois crédits restent à réaliser après sa connexion personnelle.

Après connexion personnelle de la cliente, le test navigateur cloud a confirmé le solde initial de 4 crédits, puis réservé le cours du 13 septembre à 18 h via « Réserver ma place ». Le planning a affiché « Votre réservation est confirmée » et **1 / 4 places réservées**. La page des forfaits a ensuite affiché **3 / 4 crédits restants**, avec la même validité. La réservation de test est laissée confirmée ; aucune annulation ni paiement n’a été effectué pendant ce contrôle.

À l’étape suivante, l’utilisateur a autorisé le test d’annulation. L’annulation a été effectuée et confirmée depuis l’espace cliente : message « Vous avez annulé votre réservation », **0 / 4 places réservées** et **4 places disponibles**. La page des forfaits a ensuite confirmé **4 / 4 crédits restants**, toujours valables du 12 septembre au 11 octobre 2026 inclus. État final : réservation annulée, cours toujours ouvert, crédit restitué sans prolongation de validité et aucun paiement enregistré.
