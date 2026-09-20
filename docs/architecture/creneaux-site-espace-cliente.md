# Créneaux, réservation publique et espace cliente

## Besoin précisé par le centre

Le studio propose des places dans des créneaux d’une heure pendant ses horaires d’ouverture. Chaque créneau dispose de quatre places, toutes disciplines confondues. L’ouverture des créneaux ne dépend pas de la création manuelle de cours dans le CRM. Le calendrier doit permettre de réserver les mois suivants.

Les nouvelles clientes peuvent réserver depuis le site public. Les clientes déjà connues doivent se connecter pour réserver, annuler et consulter leurs forfaits et leurs mensurations. L’espace personnel doit rester simple et clair.

Une séance consommée diminue le solde du forfait. L’exemple d’un forfait de dix séances décrit le mécanisme du solde ; il ne constitue pas une validation d’une nouvelle offre tarifaire.

## État initial constaté avant raccordement

- Le formulaire public produit des créneaux horaires mais affiche des occupations simulées.
- L’API publique crée un document de séance à la réservation et écrit dans les collections utilisées par le CRM. Elle ne partage pas entièrement les contrôles du parcours authentifié.
- Le rapprochement public par téléphone ne constitue pas une preuve d’identité. Il ne doit pas autoriser l’utilisation d’un forfait ni modifier une fiche existante sans authentification.
- La réservation authentifiée débite actuellement le forfait immédiatement ; l’annulation avant le début de séance restitue ce crédit.
- Le pointage de présence n’effectue actuellement aucune opération sur les crédits.
- Les mensurations sont actuellement accessibles uniquement à l’administration.

## Architecture à mettre en œuvre

### Un calendrier commun

Une source commune définit les horaires d’ouverture à l’heure d’Alger, les plages de public éventuelles et les exceptions de fermeture. Le calendrier produit des créneaux d’une heure sans écrire une quantité illimitée de documents futurs.

Un créneau possède une identité stable fondée sur le centre, le jour et l’heure de début. Le choix d’une prestation ne crée pas une seconde capacité pour la même heure. Les réservations publiques, celles de l’espace cliente et celles de l’administration utilisent le même compteur, protégé par une transaction.

Les fermetures et annulations administratives doivent empêcher toute nouvelle réservation. Les anciens documents de séances doivent être rapprochés des créneaux avant activation pour éviter une capacité doublée. Aucune migration des données existantes ne doit être déduite du seul titre d’une séance.

### Disponibilités publiques

Le serveur expose uniquement les dates, horaires, capacité et places disponibles utiles à la réservation. Aucune identité de cliente, mensuration, information de forfait ou donnée de paiement n’est publique. Le serveur revérifie la disponibilité au moment de confirmer, même si l’affichage indiquait une place libre.

Un échec de chargement ne doit jamais être remplacé par des places inventées. La confirmation doit être idempotente pour qu’un double clic ou une nouvelle tentative ne crée pas deux réservations.

### Identité et parcours

L’écran public distingue « Première visite » et « J’ai déjà un compte ». Le second parcours demande une connexion et reprend ensuite le créneau choisi. Une fiche connue sans accès actif nécessite une activation sécurisée ; connaître son adresse ou son téléphone ne donne pas accès à son dossier.

La création d’une première réservation et son rattachement à une nouvelle fiche doivent être cohérents, sans modification arbitraire d’une fiche existante. Les contrôles de saisie, d’origine, de volume et d’abus s’appliquent également au parcours public.

### Forfaits : disponible, réservé, consommé

Proposition technique : une réservation immobilise un crédit valable à la date du créneau. Ce crédit ne peut pas servir à une autre réservation. La validation manuelle ou automatique convertit cette immobilisation en consommation, une seule fois. Une annulation admissible libère le crédit, une seule fois.

Exemple : forfait de 10 séances, 2 créneaux futurs réservés et aucune séance consommée : 8 disponibles, 2 réservées, 0 consommée. Après une présence validée : 8 disponibles, 1 réservée, 1 consommée.

Les opérations sont atomiques et historisées. Les corrections de présence doivent corriger le solde de façon traçable. Les réservations existantes ayant déjà débité un crédit ne doivent jamais être débitées une seconde fois lors du pointage. Les dates de validité et les périodes mensuelles des abonnements existants restent à respecter.

### Validation au choix du manager

Le centre demande de laisser au manager le choix entre validation manuelle et automatique. Le mode manuel est retenu par défaut pour la mise en œuvre.

- **Manuel** : à la fin du créneau, le manager décide de consommer la séance ou de restituer le crédit, notamment en cas d’absence. Les réservations non traitées apparaissent dans une liste à valider ; le crédit reste réservé jusque-là.
- **Automatique** : fonctionnement proposé, une réservation confirmée et non annulée est comptabilisée à la fin du créneau, même sans pointage. Le manager peut ensuite restituer le crédit avec un motif historisé. Cette opération ne doit pas déclarer automatiquement la cliente présente : présence et consommation sont deux informations distinctes.

Le choix est enregistré par centre, réservé à l’administration et historisé. Le mode applicable est mémorisé sur la réservation : changer le réglage ne doit pas déclencher rétroactivement la consommation des réservations anciennes. Une action explicite distincte sera nécessaire pour appliquer une autre décision à une réservation existante.

Le traitement automatique doit fonctionner côté serveur sans nécessiter l’ouverture d’une page. Il doit pouvoir reprendre après une interruption, sans double débit, et ignorer les annulations et les décisions manuelles déjà enregistrées. Son activation nécessite un traitement serveur testé ; un simple changement de libellé dans l’interface ne suffit pas.

### Espace cliente

Navigation proposée : Réserver, Mes réservations, Mon forfait, Mes mensurations. Afficher les prochains créneaux, les actions d’annulation admissibles et le détail des crédits disponibles, réservés et consommés.

La cliente consulte uniquement ses propres mensurations. Le rattachement entre compte Firebase, membre actif du centre et fiche cliente doit être vérifié côté serveur à chaque lecture. La saisie et la correction restent administratives tant qu’une autre règle n’est pas demandée.

## Vérifications requises avant activation

- Cinq réservations concurrentes ne peuvent pas occuper plus de quatre places.
- Une répétition de requête ne consomme pas une seconde place ni un second crédit.
- Une fermeture bloque les réservations publiques et authentifiées.
- Une annulation libère une place et le crédit approprié sans double restitution.
- Une présence consomme un crédit une seule fois, y compris pour les réservations historiques.
- Le mode manuel attend une décision ; le mode automatique attend la fin du créneau et ne fabrique pas de présence.
- Un changement de mode ne modifie pas rétroactivement les réservations existantes.
- Une correction manuelle et une exécution automatique concurrentes ne produisent qu’une seule écriture effective.
- Une cliente ne peut ni lire les mensurations d’une autre ni utiliser son forfait.
- Un téléphone ou une adresse e-mail fourni publiquement ne suffit pas à obtenir les droits d’une cliente connue.
- Les dates sont calculées à l’heure d’Alger, y compris lors du changement de mois ou d’année.
- Une erreur réseau ne produit pas de fausse confirmation ni de disponibilité simulée.

## Points encore attendus

1. Confirmer les horaires actuellement affichés : samedi/lundi/mercredi, femmes 10–14 h et hommes 14–20 h ; dimanche/mardi/jeudi, femmes 10–18 h et hommes 18–20 h ; vendredi fermé.

## Premier raccordement implémenté localement

- `studio-slots.ts` centralise les plages horaires existantes, les créneaux d’une heure, les quatre places et les identifiants historiques `pub_…`.
- `GET /api/disponibilites` expose uniquement les disponibilités, sans informations personnelles et sans cache. Le formulaire les actualise toutes les trente secondes lorsqu’il est visible.
- L’ouverture d’une journée dans le planning authentifié prépare ses créneaux automatiquement. Les vues administratives par période préparent au maximum 42 journées par requête. Aucun ancien créneau n’est effacé ; les chevauchements avec les séances historiques sont bloqués pour éviter une seconde capacité.
- `POST /api/reservation` vérifie les horaires et la capacité dans une transaction, utilise les tarifs du catalogue commun, puis crée ensemble la fiche, la réservation et l’occupation. Une clé de requête protège les nouvelles tentatives. Les coordonnées reconnues dirigent vers la connexion ou l’accueil sans modifier le dossier existant.
- Le parcours public n’accepte plus le paiement par crédit non authentifié ni l’option CIB non validée. Les clientes connues disposent d’un accès explicite à leur espace.
- Les montants publics sont issus des offres découverte et séance libre validées. Les anciennes prestations et leurs montants non validés ont été retirés du sélecteur de réservation.

Les horaires existants sont conservés comme hypothèse d’exploitation. Leur administration et les fermetures récurrentes restent à développer. Les créneaux annulés dans le CRM bloquent la réservation publique. Les anciennes séances chevauchantes nécessitent une vérification par le centre ; elles ne sont pas fusionnées automatiquement.

Vérifications : 14 tests unitaires de créneaux, calendrier et tarifs ; 3 tests HTTP sur émulateurs, dont cinq demandes concurrentes limitées à quatre confirmations, les nouvelles tentatives idempotentes, les annulations, le refus des crédits publics et le calendrier commun avec une cliente authentifiée.

Le suivi distinct des crédits réservés/consommés, le choix de validation manuelle/automatique et la lecture des mensurations dans l’espace cliente restent à implémenter. Aucune migration des crédits existants ni aucun déploiement ne sont inclus dans ce premier raccordement.
