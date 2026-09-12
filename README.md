# Pilates Center Alger

Fondation Next.js App Router, React, TypeScript strict et Tailwind CSS. L’authentification, les accès et l’annuaire des clientes fonctionnent avec les émulateurs Firebase locaux. L’identité visuelle est conservée ; les réservations et paiements restent à développer.

## Démarrage local

Prérequis : Node.js 22 (au moins 22.13), pnpm 11.25.0. Java 21 est nécessaire uniquement pour les émulateurs Firebase.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Ouvrir http://127.0.0.1:3000. Les commandes serveur écoutent uniquement sur la machine locale. Aucun compte Firebase ni fichier `.env.local` n'est nécessaire pour afficher les pages.

- `/` : maquette publique, identité visuelle conservée.
- `/crm` : aperçu avec données fictives, réservé aux administratrices du centre.
- `/espace-cliente` : accueil privé réservé aux clientes du centre ; services métier à venir.
- `/connexion` : connexion e-mail/mot de passe, fonctionnelle avec les émulateurs locaux.
- `/crm/acces` : invitations et désactivation des accès clientes, réservé aux administratrices.
- `/crm/clientes` : fiches clientes du centre, recherche et pagination.
- `/crm/clientes/nouvelle` et `/crm/clientes/{id}` : création, modification et invitation depuis une fiche.
- `/connexion/mot-de-passe` : récupération et choix du mot de passe.

Pour tester la connexion, lancer `pnpm emulators` dans un terminal, puis `pnpm seed:local` dans un second. Les deux comptes fictifs sont enregistrés dans `.firebase/demo-accounts.json`, ignoré par Git. Lancer ensuite `pnpm dev:local` et ouvrir http://127.0.0.1:3100. Ce parcours fournit explicitement les paramètres locaux sans créer de `.env.local`. Chaque exécution du seed renouvelle les mots de passe des deux comptes de démonstration. Aucun compte réel ni e-mail d'invitation n'est créé ou envoyé.

Le sélecteur de maquettes a été retiré de l'accueil. Le CRM relie la rubrique Clientes à l’annuaire Firestore et affiche un aperçu des fiches enregistrées. Le planning, les forfaits et les finances restent des éléments de démonstration.

Pour relier les anciens comptes de démonstration à leurs fiches sans changer leurs mots de passe, exécuter `pnpm sync:local`. Le script est relançable et conserve les désactivations. `pnpm seed:local` assure aussi cette association lors de l’initialisation, mais renouvelle toujours les mots de passe des comptes réservés.

## Vérifications

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm start
pnpm test:security
pnpm test:auth
```

`pnpm start` nécessite d'abord `pnpm build`. Le build public réussit sans configuration Firebase ; les accès privés sans session redirigent vers la connexion. Firebase reste désactivé en production, donc utiliser `pnpm dev:local` pour tester l'authentification. Vitest exécute les tests unitaires sans réseau. Les tests de sécurité lancent Auth, Firestore et Storage localement, testent le refus des accès clients, puis arrêtent les émulateurs. `pnpm test:auth` démarre également un serveur Next éphémère sur le port 3102 et dans `.next-auth-tests` pour tester les API et pages protégées. Exécuter les deux suites d’émulateurs l’une après l’autre. Elles utilisent les ports de test 9098, 8082, 9198, 4402, 4502 et 9152, distincts de la démonstration ; celle-ci peut rester ouverte. Le premier lancement télécharge les binaires officiels dans `.firebase/cache/`.

## Firebase local uniquement

Pour un futur développement utilisant les SDK, copier `.env.example` dans `.env.local`, puis lancer `pnpm emulators`. Le projet est obligatoirement `demo-pilates-center-alger`, les trois hôtes sont explicitement locaux, et une configuration incomplète provoque une erreur. Les paramètres du navigateur doivent correspondre à ceux du serveur et de `firebase.json`.

Les SDK sont initialisés à la demande pour l'authentification ; la page publique n'en dépend pas. Firebase réel est volontairement indisponible dans cette fondation : les adaptateurs refusent un autre projet, des hôtes distants ou un appel en production. Ne pas supprimer ces protections pour mettre en ligne : préparer séparément la configuration cloud et les identités serveur après validation.

Firebase Authentication identifiera les utilisateurs. Firestore contiendra les documents structurés. Storage contiendra les futurs fichiers ; les ressources de marque restent dans `public/brand`. Firebase Admin est marqué `server-only` et nécessite le runtime Node.js. Il contourne les règles : chaque futur service devra vérifier session, adhésion au centre, rôle et propriétaire avant d'utiliser un repository. Les règles actuelles refusent toutes les lectures et écritures clientes, même avec une revendication `admin`.

## Organisation

- `app/` : routes et composition des pages.
- `src/components/` : marque, composants UI et présentation partagée.
- `src/features/` : vues publiques, fiches clientes et aperçu CRM avec fixtures restantes explicites.
- `src/domain/` : politiques pures, indépendantes des SDK.
- `src/config/` et `src/lib/firebase/` : validation locale et initialisation différée des SDK.
- `tests/unit/` et `tests/security/` : contrôles de configuration, périmètre centre et règles Firebase.

`app/api/auth/`, `src/services/auth-service.ts` et `src/repositories/firestore/memberships.ts` assurent les sessions et les accès par centre. Les rôles locaux sont `client` et `admin`. Le navigateur conserve uniquement un cookie opaque `HttpOnly`, d'une durée de huit heures ; le jeton Firebase reste côté serveur. Les adhésions sont revérifiées à chaque requête privée. L’administration peut créer un accès cliente et le désactiver dans son centre. Aucun écran d’inscription publique ou de création d’administratrice n’est fourni.

Pour tester une invitation, ouvrir **Gestion des accès** depuis le CRM administrateur, créer une cliente fictive et ouvrir le lien local affiché. Pour tester **Mot de passe oublié ?**, soumettre l’adresse du compte, lancer `pnpm inbox:local`, puis ouvrir le lien correspondant dans `.firebase/boite-reception.json`. Ce fichier contient uniquement les messages simulés et est ignoré par Git. Aucun e-mail réel n’est envoyé.

Le catalogue UI, les styles vendor et leur licence sont conservés. Les caches anciens `.sites-runtime`, `.wrangler` et `.vinext` ne participent plus à l'exécution ; ils restent ignorés et n'ont pas été nettoyés. Le stockage pnpm local est `.pnpm-store/`. Le délai de maturité des paquets et le contrôle des scripts d'installation sont conservés.

Voir [le plan d'architecture](docs/architecture/fondation-technique.md) et [le bilan de migration](docs/architecture/migration-nextjs-firebase.md). Aucun déploiement n'est configuré.

Voir également [l'authentification locale et ses limites](docs/architecture/authentification-locale.md).

La suite est décrite dans [la gestion locale des accès](docs/architecture/gestion-acces-locale.md), avec les limites de provisionnement et les décisions avant production.

La [gestion des clientes](docs/architecture/gestion-clientes-locale.md) décrit le modèle, les transactions, la recherche et les 82 tests. Le statut de suivi d’une fiche reste distinct de son autorisation de connexion. Une adresse devient non modifiable dans la fiche dès la préparation d’un accès ; son changement nécessite un parcours de vérification distinct.
