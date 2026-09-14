# Inscription depuis le CRM

L’accueil peut inscrire une cliente depuis Planning → détail d’une séance future → Inscrire une cliente. La recherche reprend l’annuaire paginé (début de nom, e-mail ou téléphone), distingue les fiches inactives et les participantes déjà inscrites. Une confirmation explique le débit d’un crédit avant envoi.

## Autorisation et données

- L’action POST `/api/planning` `book-client` exige un administrateur actif et un `clientId` explicite. L’action cliente `book` conserve son contrat sans délégation.
- Le serveur relit l’adhésion de l’administrateur et la fiche active dans son centre, dans la transaction. Une fiche sans compte Firebase Authentication peut être inscrite par l’accueil.
- Le même moteur transactionnel contrôle la date du cours, son annulation, sa capacité et les crédits valables à cette date. La concurrence entre accueil et espace cliente ne peut pas dépasser la capacité ou débiter deux fois une inscription confirmée.
- Le crédit provient du forfait valable expirant le plus tôt. Son mouvement et la réservation enregistrent l’UID de l’administrateur. L’annulation restitue le crédit au même forfait selon les règles existantes.
- Aucun encaissement, accès en ligne ou envoi de message n’est déclenché par cette opération.

## Vérification

Tests unitaires des droits et identifiants ; tests HTTP sur émulateurs couvrant fiche sans accès, absence de crédits, fiche inactive, isolation du centre, origine de requête, double inscription, audit, restitution et dernière place disputée entre accueil et cliente. Les pages de sélection sont également vérifiées via leur rendu HTTP et leur restriction de rôle.

## Prochaines priorités

1. Présenter les cours terminés dont les présences restent à renseigner.
2. Faire ressortir les abonnements proches de leur échéance et les crédits restants.
3. Faciliter le suivi des soldes restant à enregistrer, en distinguant une absence de saisie d’un impayé confirmé.

Ces priorités restent à implémenter ; elles ne déclenchent aucune relance automatique.
