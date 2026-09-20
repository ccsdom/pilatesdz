# Suivi des mensurations

## Périmètre

Depuis la fiche cliente, `/crm/clientes/[id]/mensurations` présente un historique paginé, une courbe par mesure et la différence entre première et dernière valeur renseignée parmi les relevés chargés. Un historique partiel est signalé. Les valeurs manquantes restent absentes, sans être remplacées par zéro. Aucune interprétation médicale ni objectif de poids n’est calculé.

Champs facultatifs : poids (kg), stature, poitrine, tour de taille, hanches, cuisse et bras (cm). Au moins une mesure positive est requise ; précision maximale de 0,1. Des bornes techniques limitent les erreurs de saisie. La date doit être réelle et ne pas dépasser le jour courant à Alger.

## Données et autorisations

Base existante `(default)` du projet `pilates-center-9dee6`, édition Standard, Paris (`europe-west9`). Aucune nouvelle base, règle ou configuration d’index n’est nécessaire.

Un relevé par date : `centers/{centerId}/clients/{clientId}/measurements/{YYYY-MM-DD}`. Chaque document contient les valeurs, les identifiants du centre et de la cliente, les auteurs, les horodatages et une version. Chaque écriture crée aussi une copie dans `revisions/{version}` dans la même transaction.

L’API `/api/crm/mensurations` exige une session administrateur. Le repository relit l’adhésion active et l’appartenance de la fiche au centre dans chaque transaction. Les règles Firestore existantes refusent les accès directs ; seul le serveur utilise Admin SDK. Les réponses API portent `Cache-Control: no-store`. Le POST contrôle l’origine, le type de contenu, la taille et le schéma strict du corps. Aucun champ de mensuration n’est ajouté à l’annuaire général.

Cette première version réserve lecture et saisie à l’administration. Elle ne transmet aucun relevé à la cliente et n’ajoute ni export ni envoi par e-mail.

## Corrections et pagination

La version 0 signifie création. Une date déjà enregistrée doit être ouverte via « Corriger ». La version attendue empêche l’écrasement concurrent ; une réponse 409 demande de recharger. Une correction conserve la date et toutes les versions précédentes. Aucune suppression n’est exposée dans cette version.

Lecture par champ de date `day` décroissant, 25 relevés par page et curseur de date. L’index natif suffit. « Charger les relevés précédents » étend l’historique et la période de comparaison. La courbe utilise une échelle temporelle ; le tableau fournit les valeurs détaillées.

## Vérification

Tests unitaires : valeurs invalides/absentes, dates réelles, fuseau d’Alger, autorisations, champs injectés et calcul d’évolution.

Tests HTTP avec Auth et Firestore émulés : accès anonyme et cliente refusés, origine non autorisée, isolation intercentre, création, doublon, corrections concurrentes, conservation des révisions, pagination et cache.

Contrôle visuel avec des relevés fictifs. Aucune mensuration réelle créée dans Firebase cloud pendant le développement.

Validation du 20 septembre 2026 : 32 tests unitaires ciblés et 10 tests HTTP réussis sur les émulateurs, ESLint ciblé, TypeScript et compilation de production réussis. Le test HTTP a permis de remplacer le tri décroissant sur identifiant de document, refusé par Firestore, par le tri sur `day`. Aucun commit, push ou déploiement effectué pour cette fonctionnalité.
