# Vérification après déploiement — 24 septembre 2026

Contrôles réalisés sur pilatesdz.com dans le navigateur intégré, après connexion administrateur par l'utilisateur. Aucune réservation, présence, consommation, écriture de caisse ou fiche cliente modifiée pendant cette vérification.

| Contrôle | Résultat observé | Statut |
|---|---|---|
| Accueil public | Offres de 4/8 séances, remise trimestrielle de 20 %, horaires 10h–20h et capacité de 4 affichés | Conforme |
| Accueil mobile | Document de 375 px pour un viewport de 390 px | Conforme pour le débordement horizontal |
| Menu mobile | Échap ferme le dialogue | Conforme ; restitution du focus non confirmée lors de cette reprise |
| Dashboard mobile | Document de 375 px à 390 px, tableau détaillé fermé puis ouvert | Conforme pour le débordement horizontal |
| Export CSV du dashboard | Événement de téléchargement reçu après clic sur Exporter CSV pour septembre 2026 | Téléchargement confirmé ; contenu du fichier non relu dans cette recette, route couverte par les tests locaux |
| Réservations en grille | Six cartes chargées sans erreur | Conforme |
| Réservations en liste | Les six réservations apparaissent dans le tableau | Conforme |
| Filtre Confirmées | Trois réservations confirmées | Conforme |
| Filtre Annulées | Trois réservations annulées | Conforme |
| Filtre coach | Une réservation pour le coach de test | Conforme |
| Recherche positive | Deux réservations pour le nom recherché, cohérentes avec la liste initiale | Conforme |
| Recherche sans correspondance | Zéro résultat et message invitant à modifier les filtres | Conforme |
| Filtre Présente | Zéro résultat, cohérent avec le compteur initial | Conforme pour cet état vide |
| Aperçu | Séance de test chargée, zéro participante et capacité de quatre, cohérent avec son annulation | Conforme |
| Charger plus | Bouton absent avec six réservations | Non applicable à ce volume ; pagination multi-pages validée sur émulateurs seulement |

Filtres remis à leur état initial, recherche effacée, grille rétablie et dimensions temporaires du navigateur réinitialisées en fin de contrôle. L'onglet CRM est conservé pour la suite.

## Reste à vérifier

- Cycle réservation/annulation/restitution rejoué avec succès après connexion cliente par l'utilisateur (voir ci-dessous).
- Compléter les scénarios de consommation, encaissement et mensurations sur un jeu de recette isolé.
- Rejouer la pagination en production lorsque le volume dépasse une page, sans créer de réservations fictives uniquement pour remplir la liste.

Ces résultats ne constituent pas une validation exhaustive de la production et ne remplacent pas les limites consignées dans la recette initiale.

## Complément — cycle cliente après déploiement

Compte disposant du forfait « Test réservation — 4 crédits sans paiement », valable du 12 septembre au 11 octobre 2026. Créneau utilisé : 26 septembre 2026 à 12 h, Femmes.

| Étape | Résultat |
|---|---|
| Solde initial | 3 crédits disponibles, 0 réservé, 1 ancienne déduction |
| Réservation | Confirmation affichée ; occupation passée de 0/4 à 1/4 |
| Solde après réservation | 2 disponibles, 1 réservé, 1 ancienne déduction |
| Retour au planning | Réservation persistante ; bouton d'annulation proposé |
| Demande d'annulation | Confirmation explicite et option Conserver affichées |
| Annulation confirmée | Occupation revenue à 0/4 ; réservation signalée annulée |
| Solde final | 3 disponibles, 0 réservé, 1 ancienne déduction : identique au solde initial |
| Historique | Annulation du 26 septembre à 12 h affichée ; réservation préexistante du 24 septembre à 14 h conservée |

Une nouvelle trace d'annulation de test est conservée dans l'historique de production. Aucun paiement, relevé de mensuration ou crédit consommé ajouté. Ce contrôle ne valide pas la consommation après séance ni la concurrence entre clientes.
