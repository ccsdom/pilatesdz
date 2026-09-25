# Recette CRM dans le navigateur intégré — 25 septembre 2026

## Nettoyage final des données de test

Après confirmation que les deux fiches étaient des tests et demande explicite
de suppression de l'accès associé, A04 est clos par suppression, sans fusion.
Nettoyage exécuté sur Firebase `pilates-center-9dee6` : deux fiches, sept
réservations et leurs données liées (33 documents Firestore au total), ainsi
que le compte Authentication de test. Accès désactivé et sessions révoquées
avant le nettoyage ; cookies de session enregistrés supprimés avec les liens.
Les six créneaux concernés sont conservés. Leurs compteurs ont été recalculés
transactionnellement sur les réservations restantes : les créneaux du 23/09 à
12h et du 24/09 à 14h passent respectivement de 1 et 2 à zéro place réservée.
Les autres compteurs concernés restent à zéro.

Vérification SDK : aucune des deux fiches ni de leurs réservations ne subsiste,
compte Auth introuvable. Vérification navigateur après actualisation : zéro
présence en attente et zéro réservation dans les statistiques du mois.
Les autres dossiers et les comptes d'équipe ne sont pas supprimés.

Une copie locale de récupération des documents de test, sans cookies de session,
est conservée dans `work/test-cleanup-recovery.json`, répertoire ignoré par Git.
Le script ponctuel reste également dans `work/`, hors application et hors Git.
Les constats historiques et contre-recettes ci-dessous décrivent l'état avant
ce nettoyage.

## Contre-recette après corrections locales

Cette section complète le constat initial conservé ci-dessous.

| Anomalie | État après intervention | Vérification |
| --- | --- | --- |
| A01 | Corrigée | Filtre Disponibles : zéro séance terminée, vingt futures dans la semaine contrôlée. Limite exacte du début couverte en test unitaire. |
| A02 | Corrigée | Vue journée du 26/09 : Fermé hors plages d'ouverture ; une plage ouverte sans séance filtrée indique Aucune séance affichée. Calcul à partir du générateur de créneaux existant. |
| A03 | Corrigée | Résumé mensuel : 97 séances, 3 réservations, 388 places, en accord avec le tableau de bord. Jours voisins conservés dans la grille, exclus du résumé. Test de frontière du mois à Alger ajouté. |
| A04 | Détectée dans l'interface, rapprochement des données restant | Alerte avec liens vers les dossiers partageant un e-mail parmi les fiches chargées. Identité commune confirmée par l'utilisateur. Aucune fusion ni suppression effectuée. |
| A05 | Corrigée | Annuaire liste et mensurations : largeur globale 375 px pour fenêtre de 390 px ; tableaux confinés dans leur propre zone de défilement. |
| A06 | Corrigée | Entrée Réservations dans le menu Paramètres du CRM ; navigation vérifiée jusqu'à la page Réservations sur mobile. |
| A07 | Corrigée | Bouton d'export annuaire possède un nom accessible permanent, visible dans l'arbre accessible mobile. |
| A08 | Corrigée | Cartes semaine et commandes du mois converties en boutons ; journée du 26/09 ouverte avec Entrée depuis le calendrier mensuel. Pas de boutons imbriqués. |

Validation : 245 tests unitaires réussis dans 29 fichiers ; TypeScript strict,
ESLint ciblé et diff sans erreur. Les cinq nouveaux tests couvrent disponibilité,
frontière mensuelle et détection des doublons. Aucun changement des règles de
réservation, de facturation ou des permissions serveur dans ce lot.

Pour A04 : la fiche déjà liée à la connexion conserve le rôle de référence.
La seconde fiche n'affiche aucun abonnement ni forfait ; son historique de
septembre comprend les séances du 23/09 à 12h et du 24/09 à 14h. Cette dernière
est aussi inscrite sur la fiche de référence. Un rapprochement doit préserver
l'événement du 23, traiter explicitement le doublon du 24 et ses compteurs,
conserver les traces de pointage et vérifier les autres périodes et sous-collections.
La confirmation de l'identité est acquise ; il reste le traitement technique
transactionnel et sa validation sur émulateurs avant modification des données cloud.

## Avis de recette

Le parcours testé de réservation, réservation de crédit, annulation et restitution
fonctionne. Le pointage et sa correction motivée fonctionnent également, avec
traçabilité et sans nouvelle déduction de crédit. La recette globale reste
**avec réserves** : incohérences du planning, doublon de dossier et défauts mobiles
à corriger. Ce rapport ne vaut pas certification de tous les scénarios métier.

## Périmètre réellement exécuté

- Navigateur intégré, application locale `http://127.0.0.1:3103`.
- Session affichée : **Administrateur**. Le rôle manager n'a pas été testé par
  connexion distincte. Le compte manager apparaît dans la gestion des accès.
- Application locale en mode cloud, projet Firebase `pilates-center-9dee6`.
  Il ne s'agit pas d'un jeu de données isolé sur émulateurs.
- Affichage initial du navigateur, puis contrôles à 1440 × 1000 et 390 × 844.
  Le réglage de largeur a été réinitialisé à la fin.
- Compte de test déjà désigné dans le projet : fiche « Rbah », e-mail de test
  `app.ccs94@gmail.com`, forfait « Test réservation — 4 crédits sans paiement ».
- Les autres dossiers n'ont fait l'objet d'aucune modification volontaire.
- Aucun paiement, abonnement, accès ou e-mail d'invitation créé. Aucun déploiement,
  commit ou changement de code applicatif pendant cette recette.

## Résultats des contrôles

« Conforme » désigne uniquement l'action et le résultat indiqués dans la ligne.

| ID | Parcours / action exécutée | Résultat observé | Verdict |
| --- | --- | --- | --- |
| R01 | Ouvrir le CRM et le menu du compte | Tableau de bord chargé ; identité affichée Administrateur | Conforme, périmètre admin |
| R02 | Lire le tableau de bord du 25 septembre | Indicateurs du jour, graphiques du mois et liens de suivi affichés ; vendredi sans séance | Conforme au jeu consulté |
| R03 | Navigation grand écran et menu Paramètres | Accès aux rubriques principales ; menu vers accès, suivi forfaits, soldes et présences | Conforme |
| R04 | Planning semaine du 21 au 27 septembre | 60 séances, 3 réservations, capacités de 4 ; vendredi vide | Conforme |
| R05 | Basculer semaine, journée, grille et mois | Les quatre présentations chargent | Conforme pour le changement de vue |
| R06 | Passer du vendredi au samedi avec Suivant | Date au 26 septembre ; dix créneaux d'une heure, de 10h à 20h | Conforme |
| R07 | Filtre planning Disponibles | 40 séances terminées restent visibles avec 20 séances futures | Anomalie A01 |
| R08 | Lire les heures sans séance en vue journée | 08h, 09h, 20h et 21h portent le libellé Libre | Anomalie A02 |
| R09 | Lire les totaux de la vue mensuelle de septembre | 187 séances / 748 places dans la grille de six semaines, contre 97 séances / 388 places dans le tableau de bord de septembre | Anomalie A03 |
| R10 | Ouvrir un aperçu puis le fermer | Modal fonctionnelle ; un aperçu de séance passée charge finalement les inscrites et le statut Terminée | Conforme au scénario consulté |
| R11 | Réservations : filtre Confirmées, vue Liste | Trois lignes confirmées, cohérentes avec la synthèse | Conforme |
| R12 | Réservations : recherche inexistante | Zéro résultat et message invitant à modifier les filtres | Conforme |
| R13 | Clientes : basculer grille/liste | Trois dossiers affichés ; liens de fiches accessibles | Conforme sur grand écran ; voir A05 sur mobile |
| R14 | Clientes : sélectionner Rbah puis annuler la sélection | Barre d'actions groupées affichée puis retirée ; aucune activation/désactivation appliquée | Conforme pour la sélection uniquement |
| R15 | Clientes : filtre Sans téléphone puis Appliquer | Une seule fiche, Rbah, sans téléphone | Conforme |
| R16 | Comparer les dossiers chargés | Deux fiches actives partagent la même adresse e-mail de test ; une seule apparaît comme accès cliente | Anomalie de données A04 |
| R17 | Ouvrir fiche, forfaits et historique du compte de test | Pages chargées ; historique des réservations et des annulations visible | Conforme |
| R18 | Inscrire le compte de test au 26/09, 10h | Confirmation affichée, puis séance à 1/4 avec la cliente inscrite | Conforme |
| R19 | Consulter le forfait après inscription | Disponibles : 3 → 2 ; réservés : 0 → 1 ; consommés : 1 inchangé | Conforme |
| R20 | Annuler la réservation après confirmation | Séance revenue à 0/4 ; aucune participante inscrite | Conforme |
| R21 | Consulter le forfait après annulation | Disponibles : 3 ; réservés : 0 ; consommés : 1 | Conforme, compteurs initiaux restaurés |
| R22 | Ouvrir une séance future puis une séance terminée | Pointage indisponible avant la fin ; formulaire disponible après la fin | Conforme |
| R23 | Pointer Présente sur le compte de test | Compteur passé à une présente ; statut individuel Présente | Conforme |
| R24 | Corriger vers Non renseignée avec motif QA | Compteurs initiaux rétablis ; les deux événements et le motif apparaissent dans l'historique | Conforme |
| R25 | Relire le forfait après le pointage et sa correction | Toujours 3 disponibles, 0 réservé, 1 consommé | Conforme, aucune double déduction observée |
| R26 | Simuler la formule trimestrielle sans attribution | 4 séances/mois : 28 800 DA ; 8 séances/mois : 48 000 DA ; trois périodes mensuelles affichées | Conforme |
| R27 | Ouvrir la validation des séances | Mode manuel affiché ; aucune validation de crédit en attente ; mode non modifié | Conforme pour la consultation |
| R28 | Encaissements : septembre puis août | Changement de période effectif ; états vides explicites et totaux à zéro | Conforme au jeu consulté |
| R29 | Télécharger l'export CSV des encaissements | Événement de téléchargement obtenu | Déclenchement conforme ; contenu du fichier non audité |
| R30 | Ouvrir Soldes à vérifier et Forfaits à suivre | Trois fiches examinées ; aucun abonnement débiteur ni alerte sur les données chargées | Conforme au jeu consulté |
| R31 | Accès : rechercher le manager puis filtrer Désactivés | Une correspondance, puis zéro ; état vide explicite | Conforme |
| R32 | Soumettre une invitation vide | Navigateur : Veuillez renseigner ce champ ; focus sur le nom ; deux accès conservés | Conforme, aucun envoi |
| R33 | Ouvrir les mensurations puis soumettre un relevé vide | Message Renseignez une date et au moins une mesure valide ; réponse API 400 dans le journal local | Conforme, aucun relevé enregistré |
| R34 | Mobile : planning, annuaire grille, réservations liste | Largeur de page mesurée 375 px pour une fenêtre de 390 px ; aperçu de réservation lisible | Conforme sur les écrans contrôlés |
| R35 | Mobile : annuaire liste et mensurations | Largeurs de page de 601 px et 564 px, supérieures à la fenêtre de 390 px | Anomalie A05 |
| R36 | Mobile : examiner la navigation et les commandes | Réservations absentes de la navigation mobile ; bouton d'export annuaire sans nom accessible | Anomalies A06 et A07 |
| R37 | Examiner les contrôles interactifs du calendrier | Cartes semaine et cases mensuelles exposées comme éléments génériques ; code confirmant des div onClick sans activation clavier | Anomalie A08 ; constat DOM/code, pas audit clavier exhaustif |

## Anomalies et corrections recommandées

Priorité P1 : à traiter avant validation opérationnelle des données.
Priorité P2 : correction fonctionnelle ou ergonomique importante.

| ID | Priorité | Reproduction / preuve | Impact et correction proposée |
| --- | --- | --- | --- |
| A01 | P2 | Planning semaine 21–27/09 → statut Disponibles : 40 cartes Terminée conservées | Disponibilité ambiguë. Exclure les créneaux commencés de ce filtre ou renommer explicitement le filtre si son objet est seulement le remplissage historique. |
| A02 | P2 | Planning journée 26/09 : Libre à 08h, 09h, 20h, 21h alors que l'ouverture actuelle est 10h–20h | Confusion entre absence de séance et possibilité de réservation. Distinguer Fermé, Créneau ouvert et Aucune séance ; utiliser les horaires du centre. |
| A03 | P2 | Vue mensuelle intitulée Septembre 2026 : 187 séances ; tableau de bord septembre : 97 | Les compteurs du planning additionnent les séances des 42 jours visibles, y compris hors mois. Calculer le résumé sur le mois sélectionné ou afficher la période exacte couverte. Aucun doublon de réservation démontré par cet écart. |
| A04 | P1, données | Annuaire : deux dossiers actifs avec l'e-mail de test ; gestion des accès : un seul dossier lié | Risque de suivi et crédits répartis entre deux fiches. Identifier le dossier de référence et la provenance du doublon avant rapprochement. La création actuelle d'un doublon n'a pas été reproduite ; aucun défaut de permission n'est déduit de ce constat. Ne pas supprimer automatiquement un dossier. |
| A05 | P2 | Fenêtre 390 × 844 ; annuaire en liste : scrollWidth 601 ; mensurations : scrollWidth 564 | Débordement de toute la page sur mobile. Contraindre les conteneurs et limiter le défilement horizontal au tableau, puis vérifier actions et focus. La liste des réservations offre un exemple qui reste dans la largeur. |
| A06 | P2 | Menu mobile : Accueil, Planning, Clientes, Forfaits, Espèces ; menu Paramètres sans Réservations | Le registre des réservations n'a pas d'accès mobile direct identifié. Ajouter une entrée dans un menu Plus ou un lien dans le planning. |
| A07 | P2, accessibilité | Annuaire mobile : bouton export exposé sans nom dans l'arbre accessible ; texte masqué par hidden sm:inline | Ajouter un aria-label permanent pour l'export courant. Vérifier également les icônes seules des autres écrans. |
| A08 | P2, accessibilité | `crm-planning-views.tsx` : cartes semaine et cases/pastilles mensuelles en div onClick, sans rôle ni tabIndex ni gestion clavier | Ces commandes ne sont pas des contrôles clavier natifs. Utiliser des boutons/liens et éviter l'imbrication de contrôles interactifs. |

## Écritures et remise en état

1. Réservation de test réactivée sur le créneau du 26 septembre à 10h, puis
   annulée par le parcours normal. Place et crédit disponibles restaurés.
2. Pointage du compte de test sur le créneau du 24 septembre à 14h :
   Non renseignée → Présente → Non renseignée. Correction motivée par
   « Recette QA du 25/09/2026 : retour au statut initial après test de pointage. »
3. Les événements d'audit restent conservés. Remise en état fonctionnelle
   ne signifie pas suppression de la trace du test.
4. Le planning peut matérialiser automatiquement des créneaux futurs lors de
   sa consultation, notamment en vue mensuelle. Ce comportement existant
   a été confirmé dans le code ; aucun inventaire avant/après ne permet
   d'attribuer un nombre exact de créations à cette recette.
5. Deux soumissions de relevé vide ont été refusées. Aucun relevé ajouté.
6. Affichage navigateur restauré ; page laissée sur le tableau de bord CRM.

## Limites et contrôles restant à réaliser

- Connexions distinctes manager et cliente : permissions et parcours propres
  à ces rôles non certifiés par une session administrateur.
- Paiements : aucun acompte, solde, correction ou remboursement enregistré.
  Les vues vides et l'export ne prouvent pas le cycle de caisse complet.
- Consommation automatique à la fin d'un créneau, restitution manuelle d'un
  crédit consommé, concurrence sur la quatrième place et double clic réseau :
  non exécutés dans le navigateur connecté au cloud.
- Statut En cours et changement spontané à l'heure de fin : non observés ici
  puisque les créneaux consultés étaient passés ou futurs, et le vendredi fermé.
- Création/révocation d'accès et réception des e-mails : non exécutées.
- Pagination et volumes importants : les trois clientes et sept réservations
  chargées ne permettent pas de valider Chargez plus sur un grand annuaire.
- Mesures existantes et graphiques d'évolution : le compte de test ne possède
  aucun relevé ; seules l'ouverture et la validation négative ont été contrôlées.
- Aucun audit complet de contraste, lecteur d'écran, navigateurs multiples
  ou conditions réseau dégradées.
- Certaines premières ouvertures locales ont pris plusieurs secondes : le
  journal indique de la compilation Next.js en développement, notamment
  pour historique et mensurations. Ce n'est pas une mesure de production.

Les 240 tests unitaires, 96 tests HTTP sur émulateurs et huit tests de règles
mentionnés dans le rapport de stabilisation précédent restent des preuves
distinctes. Ils n'ont pas été relancés dans cette recette navigateur et ne sont
pas présentés comme des scénarios cloud exécutés ici.

## Suite recommandée

Corriger A01–A03 et A05–A08, clarifier le doublon A04, puis refaire les contrôles
ciblés avec un manager. Effectuer la recette de caisse et de concurrence dans
un environnement isolé avant de valider la livraison. Les paramètres d'ouverture
pourront ensuite remplacer les horaires codés sans masquer les incohérences
actuelles d'affichage.
