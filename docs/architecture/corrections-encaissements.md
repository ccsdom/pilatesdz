# Correction des erreurs de saisie d’encaissement

Dans le journal d’un abonnement, une administratrice peut annuler intégralement une saisie erronée. Le formulaire exige un motif de 5 à 300 caractères, présente l’impact sur le solde puis demande une confirmation explicite. Pour rectifier un montant, l’ancienne saisie est annulée avant d’enregistrer le montant exact. Ce parcours ne représente aucun remboursement d’espèces à la cliente.

## Traçabilité

`POST /api/encaissements/corrections` exige une session administrateur, une origine autorisée et un corps strict contenant la cliente, l’abonnement, l’UUID de demande, l’encaissement et le motif. Le montant à compenser est exclusivement lu côté serveur.

Une transaction relit l’accès actif, le centre, la cliente, l’abonnement et le paiement. Elle crée un document `paymentCorrections/{requestId}` dans l’abonnement : montant négatif en centimes, référence du paiement, motif, date serveur et auteur. Le document de paiement conserve son montant, sa date de réception et son auteur d’origine ; seuls l’identifiant, le motif et la date de correction lui sont ajoutés. Le cumul net `paidMinor` est diminué dans cette même transaction.

Le paiement reste visible dans le journal, avec son montant barré, la mention « Saisie annulée », le motif et la date. Il conserve sa position chronologique d’origine, même si la correction intervient plus tard. L’auteur de correction demeure dans l’écriture d’audit côté serveur. Le champ historique `paymentRecorded` reste vrai : une écriture a bien été enregistrée, même si elle est ensuite annulée. Le cumul net constitue le montant de référence pour le solde.

## Concurrence et reprises

Un paiement ne peut être annulé qu’une fois. Le rejeu du même UUID avec le même auteur et les mêmes informations retourne la correction initiale. Une demande différente sur une saisie déjà annulée est refusée. La transaction sur l’abonnement sérialise les corrections et les nouveaux encaissements pour conserver un solde cohérent.

Rejouer l’encaissement initial après son annulation ne le réactive jamais : la réponse conserve son annotation de correction et le formulaire demande de consulter le journal. Un nouvel encaissement exact utilise une nouvelle demande. Le formulaire de correction garde son UUID et son motif après une réponse incertaine pour permettre une reprise sans double déduction.

## Périmètre et tests

Les crédits, les réservations et les tarifs ne sont pas modifiés. Les corrections partielles, l’annulation d’une correction et les remboursements restent hors périmètre. Aucun paiement cloud réel n’a été corrigé pendant le développement.

Les tests couvrent les autorisations, les motifs et identifiants invalides, les paiements introuvables, les doubles demandes simultanées, deux demandes distinctes concurrentes, le maintien des champs d’origine et de l’auteur d’audit, le rejeu de l’encaissement annulé, le rétablissement du solde par une nouvelle saisie exacte et le rendu de l’annotation sur une ancienne page du journal.

Résultats du 13 septembre 2026 : 152 tests unitaires et 62 tests HTTP réussis ; TypeScript, ESLint, compilation Next.js et `git diff --check` réussis. Aucun encaissement réel n’a été modifié. Aucun commit, push ou déploiement n’a été effectué pour cette étape.
