# Recette QA en production — 24 septembre 2026

## Périmètre et verdict

Tests exécutés dans le navigateur intégré sur https://www.pilatesdz.com, avec la session administrateur puis la session cliente ouverte par l'utilisateur. Contrôles sur ordinateur (1440 × 900), sur mobile simulé (390 × 844) et au format normal du navigateur. Aucun accès direct à la base de données ni modification du code applicatif pour ces tests.

**Verdict : recette partielle, avec anomalies. Les parcours CRM et cliente réservation → crédit réservé → annulation → restitution sont validés sur le dossier de test. Une validation globale sans réserve n'est pas justifiée.**

Bilan : **69 scénarios documentés : 54 OK, 6 échecs, 5 partiels et 4 non exécutés.** Les contrôles de la session cliente ne révèlent pas de nouvelle anomalie ; les six anomalies de la première passe restent ouvertes.

Le dossier utilisé pour l'opération métier est la fiche de test « Rbah », liée au compte de connexion déjà convenu. Aucune autre cliente n'a été modifiée. Aucun e-mail n'a été envoyé, aucun abonnement ni encaissement fictif n'a été ajouté. Le mode de validation du centre est resté manuel.

Les résultats ci-dessous décrivent exclusivement les observations de cette session. Les tests automatisés des missions précédentes ne sont pas comptabilisés comme des tests de navigateur effectués aujourd'hui. Une interface sans erreur visible ne prouve pas à elle seule la sécurité de toutes les API.

## Anomalies et observations à traiter

| ID | Priorité | Écran | Reproduction et résultat constaté | Attendu / recommandation |
|---|---|---|---|---|
| A01 | Haute | `/crm/reservations` | Sans filtre, zéro réservation affichée en grille puis en liste. Un clic sur « Charger plus de réservations » laisse zéro résultat. Le dashboard affiche pourtant 3 réservations mensuelles et l'historique du dossier de test contient une réservation à venir et des annulations. Aucune erreur console capturée pendant ce contrôle. | Rendre les réservations connues accessibles depuis cette liste ; distinguer chargement, erreur, pagination et absence réelle de données. Cause technique non déterminée dans cette recette. |
| A02 | Haute | Accueil public, bloc « Tarifs & formules » | Texte annonçant des forfaits de 10/20 séances et une remise trimestrielle de 10 %. La section détaillée de la même page, la page Tarifs et le CRM affichent 4/8 séances mensuelles et −20 %. | Une seule présentation commerciale cohérente avec les offres validées. |
| A03 | Moyenne | Accueil, Studio et Les Cours | Mentions « 4-6 max », « 4 ou 6 participantes », « MAX 4 A 6 PERSONNES », alors que d'autres sections et les réservations annoncent 4 places. | Afficher uniformément la capacité de 4 personnes. |
| A04 | Haute | En-tête public sur ordinateur et Contact | Horaires annoncés : 09h00–19h30. Page Horaires, accueil, CGV et planning : 10h00–20h00. | Uniformiser les heures d'ouverture pour éviter les déplacements et attentes à une heure non réservable. |
| A05 | Moyenne | Dashboard mobile | À 390 px, largeur du document observée à 537 px, puis 533 px lors d'un second contrôle. Sur ordinateur à 1440 px : document 1425 px, sans débordement. L'annuaire et l'accueil public restent à 375 px sur le même viewport mobile. | Corriger le débordement horizontal du dashboard ; vérifier les blocs statistiques et tableaux. L'élément responsable n'a pas été isolé avec certitude. |
| A06 | Faible | Menu public mobile | Ouverture du menu réussie. Touche Échap sur le bouton de menu : le menu reste ouvert. | Prévoir la fermeture au clavier et contrôler le parcours de focus. |
| O01 | À clarifier | Annuaire | Deux fiches partagent l'adresse du compte de test ; seule « Rbah » est liée à l'accès client. | Vérifier la politique de doublons et identifier la fiche de référence. Aucune fusion ni suppression effectuée. |
| O02 | À clarifier | Réservation publique / CGV | La réservation annonce « annulation gratuite H-12 ». Les CGV parlent d'un délai d'anticipation minimum sans le chiffrer. | Préciser une politique commune et la tester côté cliente. Le comportement à moins de 12 h n'a pas été testé aujourd'hui. |
| O03 | À confirmer | Export CSV dashboard | Clic sur « Exporter CSV » effectué ; aucun événement de téléchargement reçu dans les 10 secondes par l'outil. Aucun message d'erreur console capturé. | Vérifier un téléchargement réel et son contenu. Ne pas conclure à une panne certaine : une limitation du navigateur intégré reste possible. |

## Tableau détaillé des tests

« OK » signifie que le résultat indiqué a été observé, sans étendre la conclusion à des scénarios non testés. « Partiel » ou « Non exécuté » ne vaut pas validation.

| ID | Domaine | Scénario | Résultat observé | Statut |
|---|---|---|---|---|
| Q01 | Dashboard | Cohérence des compteurs du jour | 10 séances × 4 places = 40 ; 2 réservations + 38 places libres ; remplissage 5 %. | OK |
| Q02 | Dashboard | Consulter août 2026 | État vide explicite, zéro séance et zéro encaissement, taux non calculable plutôt qu'une division invalide. | OK |
| Q03 | Dashboard | Ouvrir les données journalières | Tableau de septembre accessible ; valeurs du 24 cohérentes avec les compteurs du jour. | OK |
| Q04 | Dashboard | Télécharger le CSV | Clic effectué ; téléchargement non confirmé par l'outil et contenu non inspecté. | Partiel — O03 |
| Q05 | Annuaire | Charger les fiches | 3 fiches affichées avec statut et coordonnées. | OK |
| Q06 | Annuaire | Recherche inexistante | Zéro résultat, message explicite, export et sélection désactivés. | OK |
| Q07 | Annuaire | Recherche par e-mail du compte de test | 2 fiches correspondantes ; doublon de donnée constaté. | OK pour la recherche — O01 |
| Q08 | Annuaire | Passer de grille à liste | Tableau lisible avec identité, coordonnées, statut et actions. | OK |
| Q09 | Annuaire | Sélectionner toutes les fiches filtrées puis annuler | 2 fiches sélectionnées ; actions groupées affichées ; sélection ensuite retirée. Les actions de mutation en masse ne sont pas validées par ce test. | OK |
| Q10 | Annuaire | Filtrer « Sans téléphone » | Une seule fiche correspondante : Rbah. | OK |
| Q11 | Fiche cliente | Adresse liée au compte | Champ e-mail observé désactivé et en lecture seule. | OK |
| Q12 | Fiche cliente | Nom obligatoire | Tentative effectuée, mais le résultat de validation n'a pas été isolé avec certitude. Nom final toujours Rbah. | Partiel |
| Q13 | Forfaits | Lire le solde initial | Forfait de test : 3 disponibles, 0 réservé, 1 ancienne déduction, total 4. | OK |
| Q14 | Forfaits | Prévisualiser 4 séances/mois sur 3 mois | 28 800 DA ; trois périodes distinctes de 4 crédits, du 24/09 au 23/12. Aucun abonnement attribué. | OK |
| Q15 | Forfaits | Prévisualiser 8 séances/mois sur 3 mois | 48 000 DA ; trois périodes distinctes de 8 crédits. Aucun abonnement attribué. | OK |
| Q16 | Planning | Vue semaine du 21 au 27/09 | 60 créneaux, 240 places, 3 réservations ; vendredi sans créneau. | OK |
| Q17 | Planning | Ouvrir samedi 26 en vue journée | Après chargement, 10 créneaux et 40 places ; 0 réservation. | OK |
| Q18 | Réservation CRM | Inscrire Rbah le 26/09 à 10 h | Confirmation préalable puis 1/4 place réservée et participante visible. | OK |
| Q19 | Crédits | Lire le forfait après inscription | 2 disponibles, 1 réservé, 1 ancienne déduction ; pas de consommation supplémentaire. | OK |
| Q20 | Doublon | Retourner dans l'inscription du même créneau | « Déjà inscrite à cette séance », sans bouton pour réinscrire Rbah. Ne couvre pas deux requêtes concurrentes. | OK |
| Q21 | Validation | Pointage et consommation avant fin du créneau | Actions indisponibles ; explication visible. | OK |
| Q22 | Annulation | Demander l'annulation de Rbah | Confirmation explicite avec possibilité de conserver la réservation. | OK |
| Q23 | Annulation | Confirmer puis relire le créneau | 0/4 place réservée et aucune participante. | OK |
| Q24 | Crédits | Relire le solde après annulation | Retour exact à 3 disponibles, 0 réservé, 1 ancienne déduction. | OK |
| Q25 | Historique | Consulter l'historique du dossier | Réservation du 26/09 affichée comme annulée ; historique chargé sans écran d'indisponibilité. | OK |
| Q26 | Mensurations | Consulter le dossier sans relevé | État vide explicite, absence de valeur inventée. | OK |
| Q27 | Mensurations | Enregistrer un relevé vide | Message « Renseignez une date et au moins une mesure valide. » | OK |
| Q28 | Mensurations | Saisir un poids de −1 et soumettre | Validation native : « Cette valeur doit être supérieure ou égale à 0,1. » Aucun relevé enregistré. | OK |
| Q29 | Validation des crédits | Lire les réglages et la file | Mode manuel ; option automatique proposée ; aucune validation en attente. Aucun réglage modifié. | OK pour la consultation |
| Q30 | Suivi forfaits | Ouvrir les échéances | 3 fiches examinées, aucune alerte ; page chargée normalement. Ce jeu de données ne permet pas de valider une alerte positive. | Partiel |
| Q31 | Encaissements | Consulter septembre puis août | Totaux à zéro, état vide explicite ; lien CSV mis à jour vers août. | OK pour la consultation |
| Q32 | Soldes | Consulter les soldes ouverts | 3 fiches examinées, 0 abonnement avec solde ouvert ; pas de faux impayé affiché. | OK pour l'état vide |
| Q33 | Accès | Filtrer les comptes désactivés | Zéro résultat et message explicite ; retour au filtre global. Aucun accès modifié. | OK |
| Q34 | Réservations | Grille, liste, chargement supplémentaire | Zéro résultat malgré les réservations connues ailleurs. | Échec — A01 |
| Q35 | Présences | Afficher les présences en attente | Une présence à renseigner sur la séance terminée du 23/09, cohérente avec le dashboard. Pas de pointage d'une cliente réelle. | OK pour la consultation |
| Q36 | Présences | Période du 01/07 au 24/09 | Refus explicite : période valide de 31 jours maximum. | OK |
| Q37 | Responsive | Dashboard à 1440 × 900 | Largeur document 1425 px ; pas de débordement global constaté. | OK |
| Q38 | Responsive | Dashboard à 390 × 844 | Largeur document supérieure au viewport, reproduite. | Échec — A05 |
| Q39 | Responsive | Annuaire à 390 × 844 | Largeur document 375 px ; navigation mobile visible. | OK pour l'écran testé |
| Q40 | Responsive | Accueil public à 390 × 844 | Largeur document 375 px ; navigation et CTA mobiles visibles. | OK pour l'écran testé |
| Q41 | Accessibilité | Ouvrir le menu public puis Échap | Menu ouvert correctement, mais non refermé par Échap. | Échec — A06 |
| Q42 | Navigation publique | « Découvrir le lieu » | Page Studio chargée correctement. | OK |
| Q43 | Offres publiques | Comparer accueil, Tarifs et CRM | Forfaits 10/20 et −10 % dans un bloc de l'accueil, contradictoires avec les offres détaillées. | Échec — A02 |
| Q44 | Capacité publique | Comparer Studio, Les Cours et réservation | Mentions 4–6 contre capacité de 4. | Échec — A03 |
| Q45 | Horaires publics | Comparer Contact/en-tête avec Horaires/CGV/CRM | 09h–19h30 contre 10h–20h. | Échec — A04 |
| Q46 | Calendrier public | Choisir le 10 octobre | Date sélectionnable ; quatre créneaux Femmes, 10–14 h, avec 4 places libres chacun. | OK |
| Q47 | Calendrier public | Vendredis d'octobre | Tous les vendredis observés sont désactivés. | OK |
| Q48 | Parcours public | Passer jusqu'aux coordonnées | Étape 4 atteinte ; récapitulatif 10/10 à 10 h, découverte 2 500 DA, espèces sélectionnées. Pas de réservation finale créée. | OK pour ces étapes |
| Q49 | Parcours public | Soumettre sans coordonnées | Reste à l'étape 4, focus sur le nom. Message de validation non capturé ; pas de confirmation obtenue. | Partiel |
| Q50 | Autorisation | Ouvrir l'espace cliente avec le compte admin | « Accès non autorisé à cet espace. » | OK pour cette combinaison de rôle |
| Q51 | Espace cliente | Session cliente authentifiée | Après connexion effectuée par l'utilisateur, planning, forfaits et historique accessibles. Le formulaire de connexion lui-même n'a pas été rejoué par l'assistant. Détails des parcours Q58–Q69. | OK pour la session |
| Q52 | Première visite | Confirmation publique et création/liaison du compte | Non soumise pour ne pas créer de compte ou envoyer de communication depuis un faux parcours. | Non exécuté |
| Q53 | Encaissements | Acompte, solde, correction, export avec écritures | Aucun abonnement facturable de test disponible dans le dossier utilisé ; aucune écriture fictive ajoutée à la caisse réelle. | Non exécuté |
| Q54 | Mensurations | Enregistrement valide, correction, courbes et lecture cliente | Consultation cliente sans relevé validée (Q60). Aucun relevé fictif persistant ajouté ; enregistrement valide, correction et courbes avec données restent non exécutés. | Partiel |
| Q55 | Consommation | Valider puis corriger un nouveau crédit après le créneau, automatique inclus | Le créneau de test est futur et a été annulé. Pas de changement d'heure ni de modification d'une séance réelle pour simuler sa fin. | Non exécuté |
| Q56 | Sécurité et robustesse | Accès croisés entre clientes, concurrence, charge et limites de pagination | Session cliente/jeu de données isolé nécessaires. Aucun test de charge ou tentative intrusive exécuté sur la production. | Non exécuté |
| Q57 | Autorisation | Accéder à `/crm/forfaits/validation` après déconnexion | Redirection vers `/connexion`, sans affichage de données du CRM. Contrôle réalisé dans un onglet temporaire distinct. | OK |
| Q58 | Historique cliente | Charger septembre | Historique accessible sans erreur d'indisponibilité ; réservation préexistante du 24/09 et annulation QA du 26/09 à 10 h visibles. | OK |
| Q59 | Historique cliente | Filtrer août | Aucun résultat ; compteurs à zéro, taux « Non calculable ». | OK |
| Q60 | Mensurations cliente | Consulter les relevés | État vide explicite, choix de mesure et tableau affichés ; aucun bouton de modification. Ne valide pas les courbes alimentées. | OK pour l'état vide |
| Q61 | Réservation cliente | Réserver le 26/09 à 11 h | Confirmation affichée ; occupation passée de 0/4 à 1/4. | OK |
| Q62 | Crédits cliente | Relire après réservation | 2 disponibles, 1 réservé, 1 ancienne déduction. | OK |
| Q63 | Persistance / doublon | Revenir au planning du 26/09 | Réservation toujours confirmée à 11 h ; seule l'annulation est proposée pour ce créneau. Ne couvre pas la concurrence réseau. | OK |
| Q64 | Annulation cliente | Confirmer l'annulation de 11 h | Confirmation explicite ; retour à 0/4. Historique : réservation de 11 h annulée, 3 annulations au total et réservation préexistante conservée. | OK |
| Q65 | Restitution cliente | Relire le forfait en fin de recette | Solde initial rétabli : 3 disponibles, 0 réservé, 1 ancienne déduction. | OK |
| Q66 | Expiration | Tenter le 12/10 à 10 h avec forfait valable jusqu'au 11/10 | Refus : « Aucun crédit disponible dans un forfait valable à la date de cette séance. Contactez le centre. » Occupation restée à 0/4 et solde final inchangé. | OK |
| Q67 | Fermeture cliente | Consulter vendredi 25/09 | « Aucune séance ce jour », aucune réservation proposée. | OK |
| Q68 | Date passée | Consulter mercredi 23/09 | Tous les créneaux indiquent « Séance commencée ou passée », sans bouton de réservation. | OK pour le contrôle UI |
| Q69 | Autorisation cliente | Ouvrir directement `/crm` | « Accès non autorisé à cet espace. » Aucune donnée CRM affichée. | OK pour cette route et ce rôle |

## État final des données de test

- Réservations créées puis annulées : samedi 26 septembre 2026 à 10 h depuis le CRM et à 11 h depuis l'espace cliente, créneaux Femmes.
- Occupation de chacun des deux créneaux revenue à **0/4** réservation.
- Forfait revenu à **3 disponibles / 0 réservé / 1 ancienne déduction**, identique au départ.
- Les deux traces d'annulation sont conservées dans l'historique ; elles n'ont pas été effacées. La réservation préexistante du 24 septembre à 14 h n'a pas été modifiée.
- Aucun nouvel abonnement, encaissement ou relevé de mensuration.
- Aucun e-mail, changement de mot de passe, modification d'autorisation ou de mode de validation.
- Dimensions temporaires du navigateur réinitialisées.

## Suite recommandée

1. Corriger A01 et les contradictions commerciales A02–A04 avant de considérer le parcours pleinement prêt.
2. Corriger le débordement mobile A05 et la fermeture clavier A06.
3. Rejouer les parcours cliente après correction ; compléter la vérification simultanée des capacités entre le site public, le CRM et l'espace cliente.
4. Prévoir un jeu de données de recette isolé pour la caisse, les consommations terminées, les courbes de mesures, les courses concurrentes et les tests de sécurité, puis rejouer les scénarios critiques après correction.
