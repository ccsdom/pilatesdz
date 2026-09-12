# Gestion des accès — démonstration locale

Étape historique complétée par la [gestion des clientes](gestion-clientes-locale.md) : les nouvelles invitations créent désormais une fiche et utilisent une réservation d’identité permettant la reprise. Les anciennes appartenances peuvent être reliées avec `pnpm sync:local` ; consulter le document suivant pour le comportement actuel.

## Périmètre réalisé

Cette étape poursuit l’authentification locale validée par l’utilisateur. Elle ajoute la création d’accès **clientes** par une administratrice du centre, la préparation d’un lien permettant de choisir un mot de passe, la récupération du mot de passe et la désactivation d’un accès au centre. Aucune réservation, paiement ou fiche CRM métier n’est créé. Aucun déploiement, commit ou envoi d’e-mail réel n’est effectué.

La page `/crm/acces`, accessible depuis le bandeau du CRM, liste les accès clientes du centre courant. Les statistiques et clientes de la maquette CRM restent des données fictives distinctes de ces accès.

## Parcours

1. Se connecter avec le compte administrateur local, puis ouvrir **Gestion des accès**.
2. Saisir un nom et une adresse de test, par exemple une adresse du domaine réservé `pilates.test`.
3. **Créer l’invitation** crée un utilisateur Firebase Authentication avec un mot de passe aléatoire non exposé et une appartenance Firestore de rôle `client`. L’adresse n’est pas marquée comme vérifiée.
4. Ouvrir ou copier le lien local affiché pour choisir le mot de passe. Le formulaire demande au moins 12 caractères et une confirmation. Le code à usage unique est vérifié et consommé par Firebase Authentication. Un code expiré ou réutilisé est refusé.
5. La cliente se connecte normalement sur `/connexion` et rejoint `/espace-cliente`.
6. Depuis la liste des accès, **Désactiver**, puis **Confirmer la désactivation**, retire l’accès à ce centre. Une session ouverte est refusée à sa prochaine requête serveur. Une page déjà affichée n’est pas effacée à distance ; aucune donnée métier n’est accessible dans ce socle.

Le statut **Accès autorisé** indique l’appartenance active ; il ne prétend pas que la cliente a reçu l’invitation ou s’est connectée. Un bouton **Nouveau lien de test** permet de régénérer un lien pour une cliente active. Si la génération échoue après création du compte, la liste est actualisée et le message explique cette possibilité de reprise.

## Récupération du mot de passe

Le lien **Mot de passe oublié ?** conduit à `/connexion/mot-de-passe`. Le SDK client demande un e-mail de récupération à l’émulateur Auth. L’interface ne distingue pas une adresse inconnue d’un compte existant. Une panne de service reste signalée. Aucun lien ni code n’est renvoyé par l’application à un visiteur demandant une récupération.

Pour consulter les messages simulés :

```powershell
pnpm inbox:local
```

Ouvrir ensuite `.firebase/boite-reception.json` dans le dépôt. Les liens sont destinés uniquement au test local ; certains peuvent être déjà consommés ou expirés. Ce fichier est ignoré par Git, comme les identifiants des comptes de démonstration. La commande ne contacte que l’émulateur Auth sur la boucle locale et n’envoie aucun message.

Les codes figurent dans le fragment `#oobCode=…`, qui n’est pas envoyé au serveur HTTP. Le formulaire lit le fragment, conserve le code en mémoire et retire le fragment de l’adresse. Les métadonnées demandent `no-referrer` et l’absence d’indexation. Un rechargement après retrait du fragment nécessite de rouvrir le lien d’origine.

## Séparation des responsabilités et autorisations

| Fichier | Responsabilité |
| --- | --- |
| `app/crm/acces/page.tsx` | Vérification administratrice côté serveur ; liste paginée de 50 appartenances maximum par page, filtrée pour afficher les clientes. |
| `src/features/auth/access-manager.tsx` | Formulaires, confirmation de désactivation, retours d’erreur et liens locaux. |
| `app/api/crm/acces/route.ts` | Session administratrice obligatoire, origine HTTP locale exacte, corps borné, validation Zod stricte, réponses sans cache. |
| `src/services/access-management.ts` | Cas d’usage création, renouvellement du lien et désactivation ; contrôle du rôle et refus de l’auto-désactivation. |
| `src/domain/ports/access-management.ts` | Contrats des adaptateurs et types minimaux, indépendants de Firebase. |
| `src/repositories/firestore/access-management.ts` | Transactions vérifiant à nouveau l’appartenance active de l’administratrice et le rôle de la cible. |
| `src/lib/auth/access-management.ts` | Adaptateur Firebase Admin réservé au serveur ; utilisateur Auth et lien de mot de passe. |
| `app/connexion/mot-de-passe/page.tsx` et `src/features/auth/password-form.tsx` | Demande de récupération et choix du mot de passe via le SDK Auth client. |
| `scripts/inbox-local.mjs` | Lecture de la boîte de réception fictive, inaccessible via une route publique de l’application. |

Le `centerId` et l’identité de l’administratrice proviennent de la session autorisée. Les entrées ne peuvent fournir ni rôle ni centre. Le rôle des nouveaux accès est fixé à `client` dans le dépôt Firestore. Les opérations sur une administratrice ou sur une personne absente de ce centre sont refusées. Un changement de rôle dans Firebase custom claims n’accorde aucun privilège.

Les données restent sous `centers/{centerId}/members/{uid}`. Les nouveaux documents contiennent `email`, `name`, `active`, `role`, `createdAt` et `createdBy`. La désactivation ajoute `deactivatedAt` et `deactivatedBy`. Ce sont des traces minimales d’état, pas encore un journal d’audit complet.

La désactivation écrit `active: false` dans l’appartenance du centre. Elle ne supprime pas l’utilisateur et ne désactive pas globalement Firebase Authentication, afin de préserver ses autres centres éventuels. La vérification d’appartenance déjà présente dans chaque accès serveur applique le refus, y compris aux anciennes sessions. Aucune réactivation n’est exposée pour cette étape.

Les règles Firestore et Storage restent en refus total côté client. Firebase Admin les contourne : les contrôles serveur et transactions constituent donc la barrière d’autorisation de ces opérations.

## Limites explicites avant production

- Tous les adaptateurs Firebase continuent de refuser la production et les projets non `demo-pilates-center-alger`. Les liens exposés à l’administratrice sont une facilité **locale uniquement**. En production, les transmettre uniquement à leur destinataire, via un canal privé ; supprimer cette prévisualisation des liens dans le CRM.
- Aucune connexion automatique n’est réalisée lors du choix du mot de passe. Les accès métier restent soumis à l’appartenance active au centre.
- Une adresse déjà connue de Firebase Auth produit un conflit et ne modifie jamais son identité ou ses appartenances. L’ajout d’une personne existante à un second centre nécessitera un parcours d’invitation avec consentement ; il est volontairement absent ici.
- Auth et Firestore ne partagent pas de transaction. Une panne après création Auth mais avant création de l’appartenance peut laisser une identité sans accès. Aucun lien n’est alors émis et les contrôles serveur refusent l’accès. Prévoir une orchestration idempotente, des états de provisionnement et une réparation opérateur avant production. Ne pas supprimer automatiquement une identité après une réponse réseau ambiguë.
- Le renouvellement d’un lien ne constitue pas un système autonome d’invitations révocables avec échéance configurable. Firebase gère la validité et l’usage unique de chaque code ; la désactivation de l’appartenance continue de bloquer l’accès même si un mot de passe est réinitialisé.
- La règle de 12 caractères est actuellement imposée par le formulaire. Configurer et tester aussi la politique Firebase côté service avant production ; ne pas considérer une contrainte HTML comme une politique serveur.
- La récupération utilise les mécanismes Firebase de révocation des sessions, avec leur granularité temporelle. Le registre de cookies opaques reste soumis à sa durée maximale de huit heures. Compléter les tests de révocation après récupération, notamment dans la même seconde, avant d’ouvrir l’application à des comptes réels.
- Ajouter limitation de débit, protection anti-abus, surveillance, journal d’audit, politique de conservation et livraison fiable des invitations. Les règles de création du premier compte administrateur et de gestion des administratrices restent à valider.
- Les anciens comptes de démonstration peuvent afficher leur UID faute de nom/e-mail dans leur document. `pnpm seed:local` initialise désormais ces champs, mais régénère également les mots de passe des deux comptes réservés : ne pas le lancer pendant un test utilisateur sans tenir compte de ce changement.

## Tests et exécution

```powershell
pnpm test
pnpm test:auth
pnpm test:security
pnpm typecheck
pnpm lint
pnpm build
```

Les tests d’intégration et de sécurité utilisent `firebase.test.json` avec Auth 9098, Firestore 8082, Storage 9198, hub 4402, journalisation 4502 et WebSocket Firestore 9152. Next de test utilise le port 3102 et le dossier `.next-auth-tests`, ignoré par Git. Ils peuvent donc s’exécuter pendant la démonstration sur 3100 / 9099 / 8080 / 9199. Les deux commandes d’émulateurs de test doivent s’exécuter l’une après l’autre. Tous les hôtes sont explicitement configurés ; aucun export de données de test n’est chargé dans la démonstration. Firebase CLI signale les suites simultanées pour le même identifiant démo ; les ports des services sont distincts et les SDK sont configurés explicitement.

Les nouveaux tests couvrent les refus avant toute opération pour une cliente, l’auto-désactivation, les pannes de préparation d’invitation, les tentatives d’injection de rôle/centre, l’isolation entre centres, les adresses déjà connues, l’usage unique des codes, la récupération et le refus des sessions après désactivation. La maquette, ses illustrations et les fichiers de marque restent conservés.

## Bilan de vérification du 12 septembre 2026

- 34 tests unitaires, 14 tests HTTP et 8 tests de règles Firebase réussis, soit 56 tests.
- TypeScript strict, ESLint et compilation Next.js réussis ; toutes les nouvelles routes sont compilées.
- Vérification navigateur : refus du CRM des accès pour la session cliente, connexion administratrice, création d’une cliente fictive, choix du mot de passe, confirmation de désactivation et demande de récupération réussis.
- `pnpm inbox:local` exécuté avec succès ; fichier de messages simulés ignoré par Git.
- `git diff --check` vérifié, ainsi que les nouveaux fichiers non suivis. Trois lignes vides finales héritées de l’extraction des composants visuels ont été retirées, sans modification de leur rendu.
- Aucun changement dans `app/globals.css`, `public/` ou `vendor/`. Aucun secret réel ajouté. Index Git vide, aucun commit ni déploiement.

## Références Firebase

- [Firebase Admin : génération des liens d’action](https://firebase.google.com/docs/auth/admin/email-action-links).
- [Firebase Authentication : émulateur et codes hors bande](https://firebase.google.com/docs/emulator-suite/connect_auth).
- [Firebase Authentication : API REST de récupération du mot de passe](https://firebase.google.com/docs/reference/rest/auth).
