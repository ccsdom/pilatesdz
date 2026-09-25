# Paramètres d’ouverture du centre

## Fonctionnement

La page `/crm/horaires`, accessible aux administrateurs et managers, permet de
modifier les plages hebdomadaires femmes/hommes et les exceptions datées.
Une exception remplace entièrement la journée ; sans plage, le centre est fermé.
Les horaires sont exprimés dans le fuseau Africa/Algiers. Chaque plage contient
des créneaux complets de 60 minutes, de quatre places. Les chevauchements sont
refusés. 00:00 en heure de fin représente minuit en fin de journée.

Le changement prend effet au plus tôt le lendemain. Les versions restent
ordonnées par date d’effet. Une correction peut remplacer une version pour la
même date ; elle ne peut pas être antidatée avant le dernier changement programmé.
Les jours précédents conservent leur configuration. En absence de configuration,
les horaires historiques continuent de s’appliquer. Une configuration corrompue
produit une erreur, jamais une ouverture implicite.

## Sauvegarde et réservations

1. Le manager vérifie les conséquences du formulaire.
2. L’aperçu présente les créneaux vides à fermer/rouvrir, les réservations
   incompatibles et les séances manuelles conservées.
3. Une confirmation distincte déclenche la sauvegarde. Le serveur relit les
   droits, la version, les séances et les réservations concernées dans la
   transaction ; il ne fait pas confiance à l’aperçu précédent.
4. Toute réservation incompatible ou incohérence de compteur bloque l’opération.
   Aucun forfait, crédit, paiement ou historique n’est modifié.
5. Les créneaux automatiques vides fermés portent `openingClosed: true` sans
   supprimer leur document ni leurs réservations annulées. Les interfaces les
   présentent comme indisponibles, avec le titre « Fermé (horaires) ». Une nouvelle
   configuration peut les rouvrir seulement si aucun autre créneau n’occupe
   l’heure. Les annulations explicites ne sont jamais rouvertes.
6. Les séances manuelles restent disponibles selon leur propre statut, même en
   dehors des plages automatiques ; cet effet est annoncé dans l’aperçu.

La réservation publique, la génération automatique, la création manuelle et la
réservation par compte cliente/manager lisent le document de configuration dans
leur transaction. Le changement concurrent des horaires provoque un nouveau
contrôle. Une réservation publique déjà créée conserve sa reprise idempotente.

## Persistance et autorisation

`centers/{centerId}/settings/opening` contient la version et les révisions,
avec date d’effet, auteur, date de modification et configuration. Pour Firestore,
la semaine est stockée comme une map de sept jours, pas comme des tableaux
imbriqués. La conversion et le schéma sont validés à la lecture.

Les API CRM vérifient la session puis l’appartenance active au centre dans la
transaction. Une cliente ne peut ni consulter ni modifier ces paramètres via
l’API CRM. L’API publique ne publie pas les identités des auteurs ni les dates
d’audit. Les règles Firebase existantes continuent d’interdire les accès directs.

## Consommateurs synchronisés

- API des disponibilités et réservation de première visite.
- Création automatique et réservation de créneaux dans l’espace cliente/CRM.
- Calendrier public, affichage journalier CRM.
- Horaires sur l’accueil, le studio, le contact et la page horaires.
- En-tête et texte des CGV renvoyant aux horaires en vigueur plutôt qu’à une
  ancienne plage fixe.

Les calendriers sont des instantanés : la transaction de réservation reste
l’autorité si les horaires changent après l’affichage de la page.
La réservation publique à partir du lendemain et l’annulation avant le début
restent inchangées.

## Limites explicites

- La sauvegarde traite jusqu’à 400 séances futures, sans tronquer les résultats.
  Au-delà, elle est refusée avec un message invitant à choisir une date plus
  tardive ou à faire intervenir le support.
- L’historique est limité à 100 révisions et 800 Ko ; son archivage sera nécessaire
  avant dépassement. Aucune ancienne version n’est supprimée automatiquement.
- Aucun horaire réel n’a été enregistré pendant la recette : les écritures sont
  testées exclusivement sur les émulateurs. La vérification navigateur du centre
  réel se limite à l’affichage et à l’aperçu.
