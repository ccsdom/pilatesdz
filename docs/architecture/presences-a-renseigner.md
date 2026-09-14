# Présences à renseigner

Le tableau de bord présente le nombre de pointages manquants sur les sept derniers jours, aujourd’hui compris, et les trois premières séances concernées. Le lien ouvre `/crm/presences`, accessible également depuis le planning. Cette page affiche toutes les séances concernées et permet de sélectionner jusqu’à 31 jours, y compris une période ancienne.

## Règles de calcul

- Les bornes correspondent aux dates de début des cours en heure d’Alger, inclusivement. Un cours commencé la veille et terminé après minuit appartient à la veille.
- Seules les séances maintenues dont l’heure de fin est atteinte sont éligibles, selon la règle existante `attendanceOpen`.
- Seules les réservations confirmées sont comptées. Une présence absente ou présente est déjà renseignée ; une donnée absente ou un statut explicite `unmarked` reste à traiter.
- Une séance sans pointage manquant disparaît de la liste après actualisation. L’ordre est chronologique, puis par identifiant en cas d’égalité.
- Les compteurs couvrent toute la période, même au-delà des 50 séances de la première page du planning. Au-delà de 500 séances dans la période, une erreur demande de réduire les dates ; aucun total partiel n’est présenté.

## Architecture et accès

La méthode `pendingAttendance` du service de planning valide le rôle administrateur et la période. Le repository relit l’adhésion active au centre, les séances et leurs réservations dans une transaction de lecture. Il contrôle les identifiants, les statuts, la capacité et les données de présence. Les requêtes restent sous le chemin du centre de l’administrateur.

L’API GET `/api/presences/a-traiter?from=YYYY-MM-DD&to=YYYY-MM-DD` et les pages CRM sont réservées à l’administration. L’API désactive le cache. La projection ne retourne ni notes privées, ni coordonnées, ni identités des clientes : uniquement les informations des cours et les compteurs. Le détail existant reste le point d’entrée pour effectuer le pointage et ses corrections motivées.

Aucun nouveau champ stocké, index composite, déploiement Firebase ou changement des crédits n’est nécessaire. Le panneau du tableau de bord affiche une indisponibilité si sa lecture échoue, sans bloquer les autres indicateurs.

## Validation

Tests unitaires de rôle, période et instant d’ouverture du pointage. Tests HTTP sur émulateurs : autorisations, adhésion désactivée, centre étranger, bornes en heure d’Alger, annulations, statuts présents/absents/non renseignés, 55 séances, disparition après pointage, cours en cours/à venir/vides et refus au-delà de 500 séances. Vérification du rendu des pages via HTTP ; aucun pointage réel effectué.
