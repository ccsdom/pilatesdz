# Accès du centre : administrateur, manager et cliente

## Périmètre retenu

Le Manager assure toute la gestion opérationnelle du centre. Les rôles Accueil et Coach ne sont pas introduits. L’administration des accès reste réservée à l’administrateur.

| Fonction | Administrateur | Manager | Cliente |
| --- | --- | --- | --- |
| Tableau de bord, statistiques et exports | Oui | Oui | Non |
| Fiches clientes, historique et mensurations | Oui | Oui | Ses données dans son espace |
| Planning, réservations et présences | Oui | Oui | Ses réservations |
| Forfaits, abonnements et décisions sur les crédits | Oui | Oui | Consultation de ses forfaits |
| Encaissements, corrections, soldes et rapports | Oui | Oui | Informations de son abonnement |
| Choix de la validation manuelle ou automatique | Oui | Oui | Non |
| Invitation, désactivation et réactivation des accès | Oui | Non | Non |
| Création d’un administrateur ou changement de rôle | Hors de cette interface | Non | Non |

## Invitation et réactivation

Dans `/crm/acces`, l’administrateur choisit Cliente ou Manager, puis renseigne le nom et l’e-mail. Firebase transmet en production l’e-mail permettant de choisir son mot de passe ; aucun lien privé n’est affiché dans le CRM. Les émulateurs proposent un lien local sans envoyer de courrier.

Un Manager possède une adhésion `centers/{centerId}/members/{uid}` avec le rôle `manager`, sans fiche cliente artificielle. Une réservation d’identité dans `staffInvitations` rend une nouvelle tentative récupérable après une interruption. Une adresse appartenant à un autre compte n’est pas récupérée ni promue automatiquement. Une invitation ne réactive pas un accès désactivé.

L’administrateur peut désactiver et réactiver les accès clientes et managers. La désactivation porte sur ce centre ; elle ne supprime ni le compte Firebase ni les données métier. Une réactivation conserve le rôle existant, refuse un compte désactivé dans Firebase et exige, pour une cliente, une fiche active correctement reliée. Les modifications d’état et la création d’un Manager sont tracées dans `members/{uid}/accessEvents` avec leur auteur.

Un Manager peut créer une fiche cliente, mais l’invitation à l’espace en ligne est à effectuer par l’administrateur depuis cette fiche. Le parcours d’inscription publique existant conserve son fonctionnement.

## Contrôles techniques

- Autorisation côté serveur sur les pages et routes API ; le contexte React ne sert qu’à adapter les menus.
- Lecture de l’adhésion active à chaque requête authentifiée et nouvelle vérification dans les transactions métier.
- Vérification du rôle, de l’UID et du `centerId` enregistrés, sans faire confiance au rôle soumis par le navigateur.
- Opérations de gestion des accès exclusivement administrateur, y compris les invitations depuis une fiche cliente.
- Les écritures métier conservent l’UID réel du Manager comme auteur.
- Les règles Firestore et Storage de refus d’accès direct restent inchangées. Aucun nouvel index n’est requis pour les accès.

## Validation et mise en service

Les tests locaux couvrent l’invitation Manager, les parcours métier, le refus des opérations administratives, les changements de rôle ou de centre, la désactivation immédiate, la réactivation et le refus de récupération d’un compte cliente existant. Ils utilisent uniquement les émulateurs du projet de démonstration.

Après déploiement, un administrateur pourra créer le premier accès Manager depuis le CRM. Cette livraison locale ne crée aucun compte en production et ne modifie aucun rôle existant.

### Vérifications du 24 septembre 2026

- 225 tests unitaires réussis.
- 90 tests HTTP existants réussis dans la suite complète.
- Après correction d’un refus Manager sur l’historique et du créneau de test qui chevauchait le planning, les 6 nouveaux scénarios HTTP Manager/réactivation réussissent dans une exécution ciblée.
- TypeScript, ESLint, compilation Next.js de production et `git diff --check` réussis.
- Aucun test d’envoi réel d’e-mail ni changement de compte en production : ces étapes restent à vérifier après déploiement avec un compte dédié.
