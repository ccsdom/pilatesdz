# Préparation du suivi des encaissements

Statut : moyens et acomptes validés le 13 septembre 2026. Le centre accepte les espèces uniquement et autorise plusieurs acomptes avec suivi du solde. Le journal par abonnement est implémenté ; le récapitulatif global des encaissements reste une étape suivante.

## État actuel

Chaque abonnement conserve son tarif contractuel en DZD, ses périodes et sa date d’attribution. Il ouvre ses crédits sans enregistrer de paiement. Le champ historique `paymentRecorded: false` signifie qu’aucun paiement n’a été enregistré dans cette application ; il ne prouve pas que la cliente n’a rien payé au centre. Le tableau de bord ne présente plus de chiffre d’affaires fictif.

## Parcours proposé

Depuis un abonnement dans la fiche CRM, une administratrice sélectionne « Enregistrer un encaissement », indique le montant réellement reçu, la date de réception et le moyen de paiement autorisé. Un récapitulatif présente la cliente, l’abonnement, le montant et la date avant la confirmation. Cette opération consigne un paiement reçu ; elle ne prélève pas la cliente et n’envoie pas de message.

Le suivi présente le tarif enregistré, le total des encaissements consignés et l’écart restant à documenter. Les anciens abonnements sans écriture portent « Aucun encaissement renseigné », sans être automatiquement classés comme impayés. Aucun historique de paiement n’est fabriqué à partir des crédits attribués ou consommés.

## Modèle technique proposé

Les écritures sont liées explicitement à `centerId`, `clientId` et `subscriptionId`, sous `centers/{centerId}/clients/{clientId}/subscriptions/{subscriptionId}/payments/{requestId}`. Un UUID assure l’idempotence : le rejeu d’une même demande retourne le même résultat, une réutilisation avec des informations différentes est rejetée.

Champs prévus : identifiants, montant entier en unité monétaire minimale, devise DZD, date de réception à Alger, moyen de paiement validé, date serveur d’enregistrement et auteur. Le domaine utilise des entiers pour éviter les erreurs d’arrondi ; la conversion depuis les tarifs existants en dinars est explicite et contrôlée. La liste retournée à l’interface sélectionne les champs nécessaires.

Une transaction Firestore relit l’accès administrateur actif, les identités du centre et de la cliente, l’abonnement et le cumul enregistré. Elle crée l’écriture et met à jour le cumul dans une seule opération. Les enregistrements concurrents ne doivent pas dépasser le tarif de l’abonnement. Le navigateur ne peut ni imposer le prix de référence ni modifier le cumul.

Le journal d’encaissements ne comporte pas de suppression ou de modification silencieuse. Une future correction devra être une écriture liée à l’original, avec auteur et motif. Les remboursements, les factures et les paiements en ligne feront l’objet d’étapes distinctes. Les crédits et les réservations conservent leur fonctionnement actuel.

## Décisions validées

1. Espèces uniquement. Le serveur refuse les autres moyens.
2. Plusieurs acomptes possibles, jusqu’au tarif de l’abonnement. Aucun dépassement n’est autorisé.

L’éventuel lien entre paiement et ouverture des crédits n’est pas modifié par cette étape : l’attribution reste actuellement indépendante de l’encaissement. La remise trimestrielle conserve les tarifs déjà validés ; aucune nouvelle condition commerciale n’est déduite automatiquement d’une autorisation d’acomptes.

## Découpage de mise en œuvre

1. Modèle du domaine et validations des montants, dates et moyens retenus.
2. Port, service et dépôt Firestore avec transaction et rejeu idempotent.
3. API réservée aux administratrices avec session, origine et corps stricts.
4. Formulaire et journal dans la fiche CRM, puis total des encaissements réellement enregistrés au tableau de bord.
5. Tests unitaires et HTTP sur émulateurs : refus cliente/intercentre, montant nul ou négatif, dépassement, dates invalides, double clic, demandes concurrentes et préservation des crédits.

## Implémentation du journal

`GET` et `POST /api/encaissements` sont réservés aux administratrices. La saisie passe par CRM → Forfaits et encaissements → cliente → abonnement → Encaissements et solde. La confirmation affiche la cliente, la date, le montant reçu et le solde après saisie. Une réception peut être renseignée entre la date d’achat et aujourd’hui, à l’heure d’Alger. Les encaissements antérieurs à l’achat restent hors périmètre de ce parcours.

Les sommes sont stockées en centimes dans `amountMinor` et le cumul `paidMinor` de l’abonnement. Le serveur convertit explicitement son tarif en dinars, crée une écriture contenant l’auteur et met à jour le cumul dans la même transaction. `paymentRecorded` devient vrai dès la première écriture ; le journal et le cumul sont la source du suivi. Les nouveaux enregistrements n’altèrent pas les crédits, même pour une fiche devenue inactive ou un abonnement expiré.

Le journal utilise une pagination de 20 éléments, triés par date serveur d’enregistrement décroissante puis identifiant décroissant. La date réelle de réception est affichée séparément. Le cumul couvre toutes les pages. L’auteur reste conservé côté serveur, sans exposition dans la réponse de lecture.

Une demande rejouée avec le même UUID et les mêmes données retourne l’écriture initiale. Le formulaire conserve sa demande après une réponse incertaine et bloque la modification de ses champs pour permettre ce rejeu. Une nouvelle saisie exige de recharger et vérifier le journal. La concurrence est sérialisée par le document d’abonnement.

Une correction intégrale de saisie est maintenant proposée avec motif obligatoire et écriture de compensation ; elle est décrite dans `corrections-encaissements.md`. Aucune suppression ni aucun remboursement d’espèces n’est proposé. Le formulaire doit servir à des espèces effectivement reçues ; les premières vérifications sont réalisées uniquement sur les émulateurs. Aucun encaissement réel n’a été créé et aucun déploiement n’a été effectué.

## Résultats des vérifications

Le 13 septembre 2026 : 151 tests unitaires et 59 tests HTTP réussis, TypeScript, ESLint et compilation Next.js réussis. Les tests couvrent les montants décimaux, les dates invalides et futures, le refus des autres moyens de paiement, les accès clients refusés, les doubles demandes simultanées, le dépassement du solde, les encaissements finaux concurrents, la pagination du journal, la conservation privée de l’auteur et l’absence d’effet sur les crédits. La page du journal est rendue pendant les tests HTTP.
