# Connexion au projet Firebase PILATES CENTER

## Projet demandé

- Nom : PILATES CENTER.
- Identifiant : `pilates-center-9dee6`.
- Numéro : `736869698241`.
- Type d’environnement affiché dans la console : non spécifié.

Le fichier `.firebaserc` associe l’alias `pilates` à ce projet et l’alias `local` au projet de démonstration. Aucun projet par défaut n’est imposé. Les commandes d’émulateurs existantes continuent à indiquer explicitement le projet de démonstration.

Les adaptateurs acceptent un mode cloud explicite. L’identité serveur a été autorisée et configurée ; le serveur local cloud accède effectivement à Authentication et Firestore. Le premier compte administrateur a été créé ; son titulaire doit définir son mot de passe avant le test d’une connexion utilisateur complète.

## État de la vérification

La réauthentification Google a été terminée et Firebase CLI peut accéder au projet. Le projet ne possédait aucune application Web ; l’application `PILATES CENTER Web` a été créée avec l’identifiant `1:736869698241:web:71bb6d30d3610cfb642240`.

La configuration publique officielle a été récupérée et conservée dans `.firebase/firebase-cloud-config.json`, ignoré par Git. Le bucket indiqué par cette configuration est `pilates-center-9dee6.firebasestorage.app` ; cela ne confirme pas à lui seul son provisionnement ou son accessibilité.

L’utilisateur a choisi Paris. L’API Cloud Firestore a été activée puis la base `(default)` créée et relue avec succès : région `europe-west9`, édition Standard, mode natif, protection contre la suppression activée, récupération à un instant donné désactivée. L’API signale `freeTier: true` ; cela ne constitue pas une garantie d’absence de coûts futurs. La région d’une instance ne peut pas être changée après sa création, selon la [documentation des emplacements Firestore](https://firebase.google.com/docs/firestore/locations).

Une lecture REST anonyme du chemin `centers/alger` a renvoyé `403 PERMISSION_DENIED`. Ce contrôle confirme uniquement le refus de cette lecture anonyme ; il ne remplace pas la vérification complète des règles.

Après validation explicite de l’utilisateur, les règles `firestore.rules` ont été publiées uniquement sur Firestore, sans déploiement du site. Elles refusent toutes les lectures et écritures directes des clients. La release active a été relue via l’API Firebase Rules : son contenu correspond exactement au fichier local validé. Identifiant du ruleset : `f2a46231-4118-45d6-b10b-6c57aa586ec2`. Une nouvelle lecture REST anonyme a confirmé `403 PERMISSION_DENIED`.

## Étapes restantes

1. Conserver les règles Firestore publiées en refus par défaut ; vérifier les autorisations métier côté serveur avant le raccordement cloud de l’application.
2. Authentication et le fournisseur e-mail/mot de passe sont activés et relus avec succès. Le bucket Storage reste à vérifier séparément.
3. Identité serveur locale configurée et vérifiée. Prévoir une identité d’exécution propre à l’hébergement lors de la future mise en ligne.
4. Le mode cloud explicite est implémenté, séparé des émulateurs, avec projet imposé et refus des hôtes d’émulateurs. Vérifier la connexion réelle après configuration de l’identité serveur.
5. Adapter l’origine autorisée, les cookies, les domaines Firebase Auth et le parcours d’invitation réel. Les liens de récupération affichés dans le CRM de démonstration ne doivent pas être exposés de cette manière pour des comptes réels.
6. Vérifier les règles et index du projet avant de permettre des écritures métier ; préparer le premier accès administrateur sur une identité vérifiée. Ne pas transférer les comptes, mots de passe ou données fictives des émulateurs.
7. Tester la connexion de bout en bout avant de déclarer le projet connecté. Le déploiement reste une opération distincte.

Les paramètres `firebaseConfig` de l’application Web sont des paramètres publics du SDK, distincts des justificatifs privés du serveur. Documentation : [configuration Web Firebase](https://firebase.google.com/docs/web/setup), [installation du SDK Admin](https://firebase.google.com/docs/admin/setup).

L’application Web et la base Firestore Paris existent, et les règles Firestore validées sont publiées et vérifiées. Aucun index ou compte métier n’a été créé et aucune donnée de démonstration transférée. Le site n’est pas déployé. La démonstration reste sur le port 3100 ; le serveur local cloud fonctionne sur le port 3101.

## Raccordement Authentication — 12 septembre 2026

Firebase Authentication a été initialisé avec le seul fournisseur e-mail/mot de passe. Les paramètres relus confirment `email.enabled=true` et `passwordRequired=true`. Aucun compte utilisateur ni e-mail n’a été créé ou envoyé pendant cette étape.

Le formulaire existant utilise le SDK Firebase réel en mode cloud. Le serveur valide le jeton et les sessions avec Firebase Admin et Application Default Credentials. Les rôles restent contrôlés dans `centers/alger/members/{uid}` ; un compte Firebase seul ne donne aucun accès CRM. Les sessions cloud utilisent un cookie distinct des sessions de démonstration.

`pnpm dev:local` conserve la démonstration sur le port 3100. `pnpm dev:cloud` lance le projet réel sur le port 3101, avec une compilation isolée dans `.next-cloud`. Ce dernier exige la configuration publique ignorée `.firebase/firebase-cloud-config.json` et utilise `GOOGLE_APPLICATION_CREDENTIALS` si renseigné, sinon le fichier local ignoré `.firebase/server-adc.json`. Aucune clé privée ni justificatif serveur n’est intégré au code versionné. Les invitations et créations de comptes clientes par le CRM sont désormais disponibles en cloud avec livraison privée par Firebase, sans affichage du lien dans le CRM ; voir `invitations-clientes-cloud.md`.

### Identité serveur approuvée et configurée

L’identité `pilates-app-local@pilates-center-9dee6.iam.gserviceaccount.com` a été créée, sans générer de clé privée. Elle possède `roles/firebaseauth.admin` pour la gestion et la vérification des sessions, et `roles/datastore.user` pour les membres et sessions Firestore. Ces rôles donnent des droits à l’échelle du projet, pas seulement au centre : les contrôles métier serveur restent indispensables. Le compte Google connecté possède `roles/iam.serviceAccountTokenCreator` uniquement sur cette identité, afin d’obtenir des jetons temporaires par délégation. Les politiques préexistantes ont été conservées, y compris leurs conditions.

Après un premier refus du contrôle automatique, l’utilisateur a explicitement autorisé cette création et les droits proposés. Les opérations ont ensuite réussi. Après propagation IAM, Firebase Admin a pu lister les utilisateurs Auth et lire `centers/alger` : aucun utilisateur et aucun document centre n’existaient à ce contrôle.

Le fichier ADC local contient la configuration de délégation et un jeton de renouvellement du compte Google déjà connecté à Firebase CLI. Ce jeton est un secret, même en l’absence de clé privée de compte de service : le fichier reste dans `.firebase`, ignoré par Git, et ne doit jamais être partagé ni déployé. Les jetons temporaires du compte de service sont obtenus à l’exécution. Une révocation de la connexion Google nécessite de renouveler cette configuration locale. La future production devra utiliser l’identité native de son hébergement.

L’utilisateur a désigné l’adresse du premier administrateur. Le compte Firebase Authentication correspondant et son document `centers/alger/members/{uid}` ont été créés puis relus : rôle `admin`, centre `alger`, accès actif. Aucun rôle administrateur applicatif n’a été déduit du compte Google propriétaire du projet.

Le compte a reçu un mot de passe aléatoire initial, non conservé et non communiqué. Son titulaire doit demander un lien depuis `/connexion/mot-de-passe`, puis définir lui-même son mot de passe via l’e-mail Firebase. Aucun e-mail n’a été envoyé par l’agent et aucun lien de récupération n’a été exposé dans le CRM. L’adresse n’est pas déclarée vérifiée artificiellement. L’utilisateur a ensuite confirmé la réussite de sa connexion administrateur au CRM. La réception et la connexion d’une première cliente restent à tester.

La future mise en ligne nécessitera aussi une origine HTTPS autorisée : la politique de mutations actuelle n’autorise que l’exécution locale. Références : [fournisseurs Firebase Authentication](https://firebase.google.com/docs/auth/configure-providers-cli), [ADC avec délégation de compte de service](https://docs.cloud.google.com/docs/authentication/set-up-adc-local-dev-environment).

### Vérifications du raccordement

- 104 tests unitaires réussis, dont 5 sur la sélection explicite du cloud et le refus des configurations mixtes.
- 49 tests HTTP réussis sur les émulateurs isolés : sessions, rôles et parcours métier existants.
- ESLint et TypeScript réussis. Le contrôle TypeScript initial rencontrait un fichier de cache `.next/dev/types/routes.d.ts` corrompu ; les types de routes ont été régénérés par Next et le cache réparé avant le contrôle réussi.
- Un appel au service Auth réel avec une adresse réservée inexistante renvoie `INVALID_LOGIN_CREDENTIALS` : le service répond sans créer de compte. Cela ne constitue pas un test de session cloud de bout en bout.
- Le serveur cloud répond sur `http://127.0.0.1:3101/connexion` (HTTP 200). Son API refuse une fausse session cloud (401), un jeton invalide (401) et une origine non autorisée (403). Le contrôle de fausse session a exercé la lecture Firestore réelle avec l’identité dédiée.
- Aucun commit ni déploiement du site pendant ce raccordement.
