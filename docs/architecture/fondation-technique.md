# Fondation technique — Pilates Center Alger

Date de révision : 12 septembre 2026. Statut : proposition de migration, à valider avant mise en œuvre.

Mise à jour après validation : le commanditaire a validé le plan et autorisé sa mise en œuvre. Ce document conserve l'inventaire et les résultats de la mission documentaire initiale ; l'état réalisé et ses limites sont consignés dans [le bilan de migration](migration-nextjs-firebase.md). Aucun commit ni déploiement n'est inclus dans cette validation.

## 1. Périmètre et sécurité Git

Cette mission reprend et révise uniquement ce document préexistant, avec l'autorisation explicite du commanditaire. Elle ne modifie aucune route, dépendance, configuration applicative ou ressource graphique. Elle ne crée aucun projet Firebase, secret, donnée, commit ou déploiement.

Le dossier actif et la racine Git ont été vérifiés : `C:\Users\Lenovo\Desktop\espace-travail\pilate-center-alger`. À la reprise, la branche `codex/fondation-nextjs-firebase` existait déjà ; aucun fichier suivi n'était modifié, mais ce document était non suivi. Le dépôt n'était donc pas propre. Après signalement, le commanditaire a autorisé la reprise du document. Aucun nettoyage, changement de branche ou commit n'a été nécessaire. La création antérieure de la branche depuis un dépôt propre sur `main` n'est pas attestée par les contrôles de cette reprise. Les prochaines modifications doivent rester sur cette branche ou sur des branches de travail validées, jamais directement sur `main`.

La décision d'utiliser Next.js standard et Firebase remplace la cible Vinext/Sites/D1 du starter. Aucun cycle de publication Sites ne fait partie de cette mission. Aucune suppression n'est effectuée ici ; les suppressions proposées ci-dessous sont conditionnées à l'identification des usages et à la validation de la bascule.

## 2. État actuel vérifié

- Une route `/`, définie dans `app/page.tsx`, affiche deux onglets : site public et aperçu CRM. La page entière est un Client Component.
- `PublicSite`, `CrmPreview`, `PreviewSwitcher`, `SidebarItem`, `BrandLockup` et `Lotus` sont définis et utilisés dans cette page.
- Seul `components/ui/tabs.tsx` est importé du catalogue de 61 composants UI par la page. Il utilise Radix, `class-variance-authority` et `lib/utils.ts`, qui dépend de `clsx` et `tailwind-merge`. `next/image` et Lucide complètent les dépendances visuelles directes.
- Les 60 autres composants UI et `hooks/use-mobile.ts` ne participent pas au parcours actuellement rendu ; certains se référencent entre eux. Leur éventuelle suppression exige une analyse du graphe d'import complet.
- Les clientes, séances, soldes et indicateurs sont des données de démonstration en mémoire, codées en dur. Aucun parcours de réservation, paiement ou gestion des clientes n'est fonctionnel.
- Les ancres Planning/Tarifs sont sans section correspondante ; les boutons métier et menus mobiles sont inactifs. Ces limites préexistantes ne doivent pas être confondues avec des régressions de migration.
- Les helpers `app/chatgpt-auth.ts` ne sont pas appelés par l'interface. L'onglet CRM n'est pas une frontière d'autorisation.
- `db/schema.ts` est vide ; `drizzle/meta/_journal.json` ne contient aucune migration. `.openai/hosting.json` a des bindings D1 et R2 à `null`. Aucun jeu de données métier D1 actif n'est identifié dans ce dépôt : aucune conversion de données n'est prévue.
- Versions déclarées : Next.js 16.2.6, React/React DOM 19.2.6, TypeScript 5.9.3, Tailwind 4.2.1, Vinext 1.0.0-beta.5, Vite 8.0.13, Drizzle ORM 0.45.2, Wrangler 4.92.0. Firebase et Vitest ne sont pas installés.
- Le gestionnaire déclaré est pnpm 11.25.0, avec `pnpm-lock.yaml`. L'installation CI appelle un script Bash/Linux alors que le README décrit aussi un ancien parcours npm portable. Ce décalage sera corrigé lors de la migration.

## 3. Inventaire et décisions fichier par fichier

Toutes les décisions de ce tableau sont futures, sauf la conservation immédiate des fichiers existants.

| Fichier ou dossier | Utilité actuelle | Décision proposée | Risque |
| --- | --- | --- | --- |
| `app/page.tsx` | Toutes les vues et les exemples métier | Conserver intact pendant la première bascule Next ; extraire ensuite les composants et déplacer l'accueil dans `app/(public)/page.tsx` | Élevé : perte visuelle, doublon de route `/` ou frontière serveur/client incorrecte |
| `Lotus` et `BrandLockup` dans `app/page.tsx` | Symbole SVG, proportions, nom et signature | Extraire à l'identique dans `src/components/brand/` ; conserver tous les tracés | Élevé : identité altérée par une réécriture |
| `PublicSite`, `CrmPreview`, `SidebarItem`, `PreviewSwitcher` | Composition des deux maquettes | Extraire dans les composants de présentation de `src/features/` ; conserver une référence de démonstration pendant la transition | Moyen : confusion entre exemple et véritable administration |
| Tableaux `sessions`, `clients`, `stats` | Données fictives affichées | Isoler ultérieurement dans des fichiers `*.fixtures.ts` près des vues de démonstration ; ne jamais les importer en base réelle | Moyen : chiffres pris pour des données réelles |
| `app/layout.tsx` | HTML français, CSS, favicon, métadonnées | Conserver le layout racine ; supprimer seulement plus tard la métadonnée `codex-preview` et ajuster les titres lors de la séparation des routes | Faible |
| `app/globals.css` | Couleurs, typographies, rayons et thème Tailwind | Conserver à cet emplacement et à l'identique lors de la bascule | Élevé : régression visuelle globale |
| `components/ui/tabs.tsx` | Onglets réellement utilisés | Conserver puis déplacer avec le catalogue vers `src/components/ui/` | Moyen : imports et styles des onglets |
| Autres `components/ui/*` | Réserve de composants shadcn | Conserver au départ ; déplacer sans réécrire ; ne retirer qu'après vérification des imports et besoins | Moyen : dépendances internes au catalogue |
| `lib/utils.ts` | Fusion des classes via `cn` | Déplacer vers `src/lib/utils.ts` avec mise à jour coordonnée des alias | Moyen : impact sur tout le catalogue |
| `hooks/use-mobile.ts` | Hook partagé, notamment pour la sidebar disponible | Déplacer vers `src/components/hooks/use-mobile.ts`, actualiser ses consommateurs | Faible ; pas de nouveau dossier racine nécessaire |
| `public/brand/reformer-art.png` | Illustration principale, 2 860 094 octets | Conserver le fichier et son URL `/brand/reformer-art.png` ; optimisation séparée après comparaison visuelle | Élevé si recadrage ou remplacement |
| `public/brand/signage.jpg` | Ressource de marque, 88 995 octets, non utilisée par la page | Conserver comme ressource de référence | Faible ; ne pas assimiler non-utilisé à inutile |
| `public/favicon.svg` | Favicon référencé par le layout | Conserver | Faible |
| `public/file.svg`, `globe.svg`, `window.svg` | Ressources génériques sans usage identifié dans l'application | Candidates au retrait après recherche finale d'usages | Faible |
| `vendor/shadcn-tailwind-4.13.0.css` et licence | Styles importés par `globals.css` et conditions de réutilisation | Conserver ensemble | Élevé si suppression des styles ; conserver la licence |
| `next.config.ts` | Configuration Next minimale | Conserver comme configuration unique du framework ; n'ajouter que les besoins vérifiés | Moyen : comportement images et compilation |
| `postcss.config.mjs` | Plugin Tailwind 4 | Conserver | Faible |
| `tsconfig.json` | TypeScript strict, alias `@/*` vers la racine, types Cloudflare | Conserver `strict`; retirer les types Cloudflare après retrait de leurs imports ; basculer `@/*` vers `./src/*` en même temps que les déplacements | Élevé : résolution d'import et types résiduels |
| `components.json` | Configuration du catalogue shadcn | Conserver et adapter les alias UI/lib/hooks ; laisser le CSS pointer vers `app/globals.css` | Moyen |
| `eslint.config.mjs` | Règles Next/TypeScript et exceptions du catalogue | Adapter les motifs vers `src/components/ui/` et le hook déplacé ; préserver les contrôles stricts du code métier | Moyen : exceptions appliquées au mauvais périmètre |
| `package.json` | Stack et scripts hybrides actuels | Remplacer les scripts par Next standard ; ajouter Firebase et tests lors d'une étape distincte ; retirer les dépendances anciennes après vérification | Élevé : chaîne d'exécution |
| `pnpm-lock.yaml` | Versions reproductibles | Conserver pnpm et mettre à jour le verrou uniquement via pnpm ; pas de second lockfile npm | Élevé : mises à jour transitives non maîtrisées |
| `pnpm-workspace.yaml` | Politique d'installation et chemins de cache Sites | Conserver les protections pertinentes ; retirer les chemins/variables Sites et réévaluer `allowBuilds` après changement de dépendances | Moyen : installation sur une machine neuve |
| `.npmrc` | Désactivation de messages/audit automatiques | Conserver au départ ; l'audit explicite futur doit rester possible | Faible |
| `README.md` | Documentation du starter Vinext/Sites et ancien installateur npm | Réécrire pour Next/pnpm/Firebase local, sans instructions de publication implicite | Moyen : commandes obsolètes |
| `.gitignore` | Exclusion des dépendances, caches et environnements | Adapter aux caches de tests/Firebase ; autoriser explicitement un futur `.env.example` vide de secrets ; ignorer les identifiants privés | Moyen : ajout accidentel de configuration privée |
| `vite.config.ts` | Vinext + Sites + Cloudflare et bindings locaux | Retirer après bascule validée ; une future `vitest.config.ts` est indépendante | Élevé si supprimé avant remplacement des scripts |
| `build/sites-vite-plugin.ts` et licence | Auth ChatGPT simulée en local, copie de métadonnées Sites au build | Retirer ensemble après suppression de l'import Vite ; conserver dans l'historique Git | Moyen : résidu de fausse authentification |
| `.openai/hosting.json` | Identifiant et configuration du projet Sites | Retirer du code lors de la sortie de Sites ; ne supprimer aucune ressource distante | Moyen : ancien pipeline encore connecté |
| `cloudflare-env.d.ts` | Types D1/R2 | Retirer après suppression des imports et références TypeScript | Faible |
| `db/index.ts` | Connecteur Drizzle/D1 inutilisé par les vues | Retirer ; remplacer la responsabilité par les repositories Firestore | Faible : aucune donnée métier identifiée |
| `db/schema.ts`, `drizzle.config.ts`, `drizzle/meta/_journal.json` | Schéma SQL vide et génération de migrations | Retirer après constat d'absence de consommateurs ; ne pas traduire un schéma vide | Faible |
| `examples/d1/app/api/notes/route.ts`, `examples/d1/db/schema.ts` | Exemple hors routes actives | Retirer avec l'exemple D1 | Faible |
| `app/chatgpt-auth.ts` | Identité issue des en-têtes Sites, non utilisée | Retirer ; ne pas réutiliser les en-têtes Sites comme preuve d'identité Firebase | Élevé si les deux mécanismes sont mélangés |
| `scripts/run-framework.mjs`, `execution-profile.mjs` | Sélection Vinext/Vite selon profil | Retirer quand les scripts Next directs fonctionnent | Moyen |
| `scripts/sites-env.mjs`, `sites-env.sh` | Préparation des chemins Wrangler/Sites | Retirer après suppression des appels restants | Moyen |
| `scripts/install-pnpm.sh`, `pnpm-install.mjs` | Installation et caches spécifiques à l'environnement Sites | Remplacer par installation pnpm standard, puis retirer | Moyen : reproductibilité Windows/Linux |
| `scripts/install-ci.mjs`, `install-ci.sh` | Ancien parcours npm nécessitant un package-lock absent | Retirer après réécriture de l'installation documentée | Faible |
| `scripts/build-verified.sh` | Compilation Vinext sous Linux avec timeout | Retirer après remplacement par `next build` | Faible |
| `.vinext/`, `.wrangler/`, `.sites-runtime/` | États locaux et caches ignorés | Nettoyage optionnel séparé, après arrêt des processus concernés et contrôle des chemins | Moyen : serveur actif ou cache pnpm encore référencé |
| `.next/`, `next-env.d.ts`, `node_modules/` | Fichiers générés et dépendances | Laisser les outils régénérer au besoin ; ne pas versionner ; `.next` demeure utilisé par Next | Moyen : ne pas supprimer indistinctement tous les caches |
| `docs/architecture/fondation-technique.md` | Proposition préexistante non suivie par Git | Seul fichier révisé dans cette mission, repris avec autorisation | Faible |

### Préservation visuelle

Préserver l'ivoire `#f8f2e9`, les surfaces `#fffdf9` et `#f3eee5`, les noirs `#080808`/`#111`, le doré principal `#b7893b` et l'accent `#d5ae65`. Préserver aussi les valeurs locales du JSX, les bordures, rayons, espacements, hauteurs et points de rupture : les variables CSS seules ne décrivent pas toute la maquette.

Ne changer ni les tracés du lotus, ni les illustrations, ni le cadrage `object-[center_13%]`, ni les familles typographiques de repli. Conserver provisoirement la signature « SCULPTFIT CENTER » ; son éventuel changement est une décision éditoriale distincte. Comparer les deux maquettes sur le même navigateur et le même système pour éviter de confondre une substitution de police système avec une régression.

## 4. Architecture cible retenue

La structure demandée est conservée : routes à la racine dans `app/`, code partagé et métier dans `src/`. Il n'est pas nécessaire de déplacer les routes dans `src/app/`. Ne pas créer simultanément `app/` et `src/app/`.

```text
app/
  layout.tsx                    # Layout racine et langue française
  globals.css                   # Thème conservé
  (public)/
    layout.tsx                  # En-tête et pied de page publics
    page.tsx                    # URL /
  espace-cliente/
    layout.tsx                  # Enveloppe cliente, puis garde serveur
    page.tsx                    # Coquille initiale, sans fonctions métier
  crm/
    layout.tsx                  # Enveloppe équipe, puis garde serveur
    page.tsx                    # Présentation CRM conservée
  connexion/
    page.tsx                    # Future entrée Firebase Auth
  api/                          # Futurs Route Handlers
src/
  components/
    brand/                      # Lotus et BrandLockup
    ui/                         # Catalogue existant déplacé
    hooks/                      # Hook use-mobile existant
  features/
    public-site/                # Présentation de l'accueil
    crm/                        # Vue de démonstration, puis UI CRM
    auth/                       # Future UI de connexion
  domain/
    models/                     # Types métier indépendants des SDK
    policies/                   # Règles et permissions pures
    ports/                      # Contrats des repositories
  services/                     # Cas d'usage et orchestration serveur
  repositories/
    firestore/                  # Implémentations de stockage
    memory/                     # Doubles de test, pas de fallback production
  lib/
    utils.ts
    firebase/
      client.ts                 # SDK navigateur
      admin.ts                  # SDK Admin, server-only
      session.ts                # Vérification d'identité serveur
  config/
    env.client.ts               # Paramètres publics validés
    env.server.ts               # Paramètres serveur validés, server-only
  types/                        # DTO techniques partagés, sans doublons métier
tests/
  unit/
  integration/
  security/
```

Ce schéma décrit la cible ; les fichiers seront introduits avec leur premier usage plutôt que de multiplier les dossiers vides. Le groupe `(public)` n'apparaît pas dans l'URL. Le déplacement de l'accueil doit supprimer simultanément l'ancienne définition `app/page.tsx` pour éviter deux pages à `/`. Voir la [structure App Router officielle](https://nextjs.org/docs/app/getting-started/project-structure).

Les layouts servent à la composition visuelle et à l'expérience d'accès ; ils ne remplacent jamais l'autorisation au point de lecture ou d'écriture des données.

## 5. Technologies et dépendances

Conserver Next.js App Router, React, TypeScript strict et Tailwind CSS. Utiliser Next comme serveur applicatif standard, avec runtime Node.js pour tous les modules qui appellent Firebase Admin. Ne pas viser un export statique pour les futures fonctions privées.

Conserver les versions actuelles du socle lors de la première bascule, sous réserve d'une vérification de compatibilité et de sécurité avant implémentation. Ne pas mélanger changement de framework d'exécution et mise à niveau générale des bibliothèques.

Ajouter ultérieurement `firebase`, `firebase-admin` et `server-only`; puis `vitest`, `@firebase/rules-unit-testing` et les outils Firebase locaux nécessaires. Fixer leurs versions compatibles dans le verrou au moment de cette étape, sans inventer de versions ici. Vérifier également le runtime Java requis par les versions retenues des émulateurs.

Retirer après suppression des usages : `vinext`, `@cloudflare/vite-plugin`, `@cloudflare/workers-types`, `wrangler`, `drizzle-orm`, `drizzle-kit` et `@vitejs/plugin-rsc`. Réexaminer les dépendances directes `react-server-dom-webpack` et `@vitejs/plugin-react` : Next gère son intégration RSC ; un éventuel plugin React de test ne doit subsister que s'il est réellement utilisé.

Retirer Vite du démarrage et de la compilation de l'application. Vite peut rester une dépendance transitive ou un outil de configuration de Vitest ; sa présence dans le verrou n'est donc pas en soi un échec de migration. [Vitest utilise l'écosystème Vite](https://vitest.dev/guide/).

Ne pas supprimer les bibliothèques UI pour le seul motif que la page actuelle ne les utilise pas : les composants conservés peuvent les importer. Faire le nettoyage du catalogue dans une étape séparée.

## 6. Responsabilités et dépendances entre couches

| Couche | Responsabilité | Limites |
| --- | --- | --- |
| `app/` | Routes, layouts, adaptation HTTP, composition des dépendances serveur | Pas de règles métier dupliquées dans les pages |
| `components/`, `features/` | Affichage, interactions et état d'interface | Aucun import Firebase Admin ni accès direct aux écritures métier privilégiées |
| `domain/` | Modèles, invariants, contrats et politiques d'autorisation | Aucun import React, Next ou Firebase |
| `services/` | Exécution des cas d'usage, contrôle d'identité et de périmètre, orchestration | Dépend des contrats du domaine, pas d'un stockage codé en dur |
| `repositories/` | Requêtes, pagination, transactions, conversion Firestore/domaine | Ne décide pas seul qu'un appelant est autorisé |
| `lib/firebase/` | Initialisation SDK et primitives de session | Aucun calcul métier |
| `config/`, `types/` | Validation des paramètres et contrats de transport | Aucun secret dans les types ou exports client |

Flux cible : interface → Route Handler ou fonction serveur → service → contrat de repository → adaptateur Firestore. Les Server Components peuvent appeler directement les services sans faire de requête HTTP interne. Les dépendances concrètes sont assemblées côté serveur.

Convertir les `Timestamp`, références et snapshots Firebase en types de domaine puis en DTO sérialisables ; ne pas les faire remonter dans les composants. Injecter les repositories et l'horloge dans les services pour les tester sans réseau. Les accès personnels ne doivent jamais être placés dans un cache partagé entre utilisateurs.

Les composants sont serveur par défaut, avec `use client` limité aux interactions et au SDK navigateur. Les modules Admin et leurs points d'entrée portent `import "server-only"`, sans export par un fichier partagé client/serveur. Cette frontière est contrôlée par la compilation, pas seulement par le nom du fichier. Voir les [frontières serveur/client Next.js](https://nextjs.org/docs/app/getting-started/server-and-client-components).

## 7. Firebase et configuration sans secrets réels

| Service | Responsabilité cible | Ce qu'il ne remplace pas |
| --- | --- | --- |
| Firebase Authentication | Comptes, connexion, identité stable `uid`, jetons | L'appartenance à un centre et les permissions métier |
| Cloud Firestore | Profils, adhésions aux centres et futurs documents métier | Le stockage des fichiers et le moteur d'authentification |
| Firebase Storage | Futurs fichiers, avec chemins et métadonnées contrôlés | Les documents métier structurés et les assets de marque déjà versionnés |
| Firebase Admin SDK | Vérification serveur des jetons/sessions et accès privilégié aux services | Une autorisation automatique de l'utilisateur appelant |

Les images de `public/brand` restent dans Git ; aucun transfert Storage n'est nécessaire pour la fondation.

Prévoir un futur `.env.example` contenant uniquement des noms et valeurs factices : `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`, ainsi que des paramètres locaux explicites pour les émulateurs. Ce fichier n'est pas créé dans cette mission.

Les paramètres Web Firebase sont publics par conception et ne constituent pas une autorisation d'accès. Ils ne doivent contenir aucune clé privée. Les [clés API Firebase](https://firebase.google.com/docs/projects/api-keys) ne remplacent pas les règles et contrôles serveur.

Pour les tests, utiliser un identifiant fictif de type `demo-pilates-center-alger`, des hôtes loopback et aucune identité de production. Séparer explicitement les configurations client et serveur ; configurer les connexions aux émulateurs avant la première utilisation des SDK. En mode émulateur, arrêter avec une erreur si un service requis ou son hôte manque : aucun repli silencieux vers le cloud réel. Refuser les paramètres d'émulateur en production.

Pour un futur déploiement, privilégier les identités d'exécution et Application Default Credentials. Si un fichier de compte de service est nécessaire localement, son contenu reste hors Git et est référencé uniquement côté serveur. Ne pas créer, demander ou copier de secret réel durant la préparation. L'initialisation Firebase doit être différée jusqu'à son usage pour que l'accueil public et les tests unitaires purs restent utilisables sans compte Firebase.

## 8. Stratégie d'autorisation proposée

Le principe retenu est le refus par défaut. Proposition de rôles initiaux à valider : `client` et `admin` par centre. Les besoins de coach, accueil et administration globale seront précisés avant d'ajouter des droits.

Proposition de session pour les pages privées : connexion via Firebase Auth côté navigateur, échange du jeton auprès d'un endpoint serveur dédié, vérification puis création d'un cookie de session `HttpOnly`, `Secure` en production et `SameSite`. Vérifier origine et protection CSRF lors de l'échange et des mutations utilisant le cookie ; limiter les redirections à l'origine de l'application. Prévoir expiration, déconnexion et révocation. Le détail de durée de session et des fournisseurs de connexion reste à valider. Voir les [cookies de session Firebase](https://firebase.google.com/docs/auth/admin/manage-cookies).

Chaque lecture ou mutation privée vérifie côté serveur : session valide, utilisateur actif, appartenance active au centre, rôle et propriété de la ressource. Une redirection de layout ou un bouton masqué ne suffit pas. Les rôles et adhésions sont attribués par une opération privilégiée ; l'inscription ne permet pas de devenir administratrice. Ne pas accepter un rôle, un `uid` propriétaire ou un `centerId` simplement parce qu'ils arrivent du navigateur.

Pour les données métier, privilégier les accès serveur via services et repositories. Garder les règles Firestore fermées aux clients pour ces collections tant qu'aucun accès direct n'est explicitement nécessaire. Si un accès direct est ajouté, ses contraintes doivent être formulées et testées dans les règles.

Le SDK Admin contourne les règles Firestore : une règle correcte ne protège pas une API serveur mal autorisée. Tester séparément les politiques des services et les règles pour les SDK clients. Ce comportement est documenté dans les [tests de règles Firestore](https://firebase.google.com/docs/firestore/security/test-rules-emulator).

Pour Storage, refuser les accès par défaut et ouvrir uniquement les chemins utiles. Les futurs uploads directs nécessiteront identité, périmètre centre/propriétaire, taille et type autorisés ; aucune écriture sur les rôles via les métadonnées. Un upload serveur utilisant des privilèges Admin réapplique ces contrôles. Les règles Storage sont distinctes des règles Firestore : voir les [règles Cloud Storage](https://firebase.google.com/docs/storage/security).

Le cookie de session serveur n'authentifie pas à lui seul le SDK Storage du navigateur. Pour la fondation, retenir des accès aux fichiers médiés par le serveur lorsque leur premier usage sera développé. Tout upload direct futur devra définir explicitement la session Firebase cliente et la vérification de l'adhésion du centre par les règles Storage, puis tester la désactivation de cette adhésion. Ne pas ouvrir des règles pour contourner un défaut de session.

Ne pas journaliser les jetons, cookies ou données privées complètes. Les futurs liens temporaires de fichiers ne doivent pas devenir des URL publiques permanentes. Le premier compte administrateur sera provisionné explicitement, sans endpoint public d'auto-attribution.

## 9. Préparation au multicentre avec `centerId`

Un seul centre est configuré au lancement, sans sélecteur artificiel dans l'interface. Conserver une identité de centre stable, indépendante du libellé et de l'adresse.

Modèle indicatif à valider avant les premières écritures :

```text
users/{uid}                              # Identité/profil global minimal
centers/{centerId}                       # Informations du centre
centers/{centerId}/members/{uid}         # Rôle et statut propres au centre
centers/{centerId}/clients/{clientId}    # Future fiche locale, lien uid facultatif
centers/{centerId}/...                   # Futures collections métier
```

Une fiche CRM ne doit pas être confondue avec un compte Auth : une cliente peut être enregistrée avant de créer son accès. Cette distinction ne crée aucune fonction CRM dans la fondation.

Les entités rattachées à un centre exposent `centerId` dans le domaine ; si le champ est aussi stocké dans le document, vérifier son égalité avec le chemin parent et empêcher sa modification. Les profils globaux n'ont pas artificiellement un centre unique.

Chaque contrat de repository métier exige un périmètre centre explicite. Le serveur vérifie ce périmètre contre l'adhésion avant d'exécuter la requête ; ne pas charger tous les centres puis filtrer dans l'interface. Les références entre documents doivent appartenir au même centre. Les chemins Storage suivent également `centers/{centerId}/...`. Un éventuel accès transversal exige une permission distincte.

Prévoir des dates stockées de façon cohérente, une présentation selon `Africa/Algiers` et des montants futurs en unités monétaires entières avec devise explicite. Les réservations, soldes, paiements et leurs transactions restent hors de cette mission.

## 10. Stratégie de tests

1. **Contrôles statiques** : TypeScript strict sans émission, ESLint, puis build Next standard à l'étape de migration. Vérifier les imports interdits entre domaine, SDK et composants client.
2. **Vitest unitaire** : modèles, politiques de rôle et de centre, validation de configuration, conversion des données, services avec repositories en mémoire. Aucun accès Firebase réel. Utiliser des assertions comportementales, pas des snapshots massifs du JSX.
3. **Intégration Firebase locale** : repositories Firestore et primitives de session contre les émulateurs Auth/Firestore ; tests des fichiers contre Storage au moment de leur introduction.
4. **Tests de sécurité** : `@firebase/rules-unit-testing`, configurations de règles explicites et données de test isolées. Tester visiteur anonyme, cliente propriétaire, autre cliente, administratrice du centre, administratrice d'un autre centre, adhésion désactivée, escalade de rôle et changement de `centerId`. Tester Storage séparément : chemin étranger, format et taille refusés.
5. **Services privilégiés** : tester les mêmes refus côté serveur puisque les règles ne s'appliquent pas à Admin. Vérifier que le repository n'est pas appelé après un refus d'autorisation.
6. **Régression visuelle et navigateur, pendant la migration** : vérifier accueil et maquette CRM aux largeurs 390, 768 et 1440 pixels ; logo, image, couleurs, polices, espacements et onglets. Vérifier les futures redirections et les accès privés avec un navigateur ; Vitest ne remplace pas la validation complète des pages serveur asynchrones.

Prévoir `vitest.config.ts`, `firebase.json`, `firestore.rules`, `storage.rules` et `firestore.indexes.json` lors de la mise en œuvre. Configuration initiale des règles : refus par défaut, pas de mode test permissif. Le lanceur de tests sécurité doit démarrer les seuls émulateurs requis, attendre leur disponibilité, exécuter les tests et les arrêter ; un émulateur indisponible doit faire échouer la suite. Aucun test ne doit utiliser implicitement le projet cloud sélectionné dans une session Firebase CLI.

Commandes cibles, à ajouter et vérifier ultérieurement :

```text
pnpm install --frozen-lockfile
pnpm dev             -> next dev
pnpm build           -> next build
pnpm start           -> next start
pnpm typecheck       -> tsc --noEmit
pnpm lint            -> eslint .
pnpm test            -> vitest run
pnpm test:watch      -> vitest
pnpm test:security   -> lanceur des émulateurs et tests de règles isolés
```

La future CI exécutera installation verrouillée, types, lint, tests unitaires et build ; les tests de sécurité seront ajoutés avec les premières règles. Aucun pipeline de déploiement n'est autorisé par cette mission.

## 11. Séquence de mise en œuvre après validation

| Étape | Modifications futures | Critère de sortie |
| --- | --- | --- |
| A — Référence | Vérifier branche et état Git, consigner les ressources, comparer les vues existantes, identifier les processus actifs | Référence visuelle et limites actuelles connues ; aucun serveur arrêté arbitrairement |
| B — Next standard | Remplacer les scripts dev/build/start ; retirer les imports et fichiers Cloudflare qui empêchent le contrôle des types ; conserver `app/page.tsx` et les styles | Démarrage, build et start Next réussis sans Vinext ; les deux maquettes sont conservées |
| C — Sortie de l'ancien socle | Retirer la liste identifiée Sites/D1/Drizzle et les helpers devenus inutilisés ; mettre à jour pnpm, README et configurations associées | Installation Windows reproductible ; recherche d'import sans dépendance d'exécution Cloudflare/Sites ; aucune ressource distante touchée |
| D — Organisation | Extraire marque et présentations, déplacer UI/lib/hook, changer les alias de façon atomique, puis séparer les routes | Une seule page `/`, visuels inchangés et coquilles distinctes public/cliente/CRM/connexion ; aucune promesse de fonction métier |
| E — Firebase préparé | Ajouter SDK, frontières server-only, validation des paramètres et configuration locale des émulateurs ; conserver les vues publiques sans dépendance à des identifiants réels | Import Admin impossible côté client, démarrage public sans secret, mode local sans repli vers production |
| F — Tests | Installer Vitest, premiers tests de configuration et de politiques, règles fermées et tests émulateurs de refus | Tests unitaires et de sécurité reproductibles hors cloud réel |
| G — Revue | Comparaison visuelle, build et revue du diff ; valider le parcours d'authentification avant son implémentation complète | Fondation prête à revue, sans réservation/paiement/CRM fonctionnel ; commit uniquement après validation |

Lors de D, conserver le sélecteur d'aperçu uniquement le temps de vérifier les extractions. Le retirer ensuite du site destiné au public tout en gardant la présentation CRM dans sa route. Tant que l'authentification n'est pas mise en place, toute vue CRM accessible doit rester une démonstration sans données réelles ; aucune publication n'est prévue. Le comportement exact de cet aperçu transitoire fait partie des décisions à valider.

Les étapes B et C peuvent nécessiter une modification coordonnée des fichiers et dépendances : ne pas chercher à conserver un build intermédiaire impossible entre retrait de packages et retrait de leurs imports. Chaque lot terminé doit, lui, être validé avant le suivant. Les commits futurs, une fois autorisés, doivent permettre de revenir par lot ; ne pas utiliser de réinitialisation destructive pour annuler du travail utilisateur.

## 12. Risques et mesures

| Risque | Mesure proposée |
| --- | --- |
| Rupture de l'apparence lors d'une extraction ou du passage au compilateur Next | Première bascule avec JSX/CSS inchangés ; comparaison des deux vues avant nettoyage |
| Fichiers Cloudflare encore inclus par `tsconfig` après retrait des dépendances | Retrait coordonné des imports, types et fichiers ; contrôle TypeScript complet |
| Alias `@/*` brisés après déplacement | Changer consommateurs, `components.json`, tsconfig et motifs ESLint dans le même lot |
| CSS manquant dans `src/` | Vérifier la détection Tailwind sur les fichiers déplacés et conserver l'import vendor |
| Suppression de Vite incompatible avec Vitest | Distinguer moteur du site et moteur des tests ; contrôler les dépendances transitives |
| SDK Admin inclus dans le navigateur ou utilisé sans autorisation | `server-only`, runtime Node, services autorisés et tests de refus |
| Confusion Auth/rôles ou accès entre centres | Adhésions locales au centre, vérification serveur et règles testées |
| Connexion involontaire à Firebase réel | Identifiant `demo-`, hôtes explicites, échec si configuration locale incomplète |
| Mauvais classement des paramètres publics et secrets | Modules de configuration séparés et exemple factice ; aucune clé privée versionnée |
| Dépendances et scripts d'installation non reproductibles | pnpm unique, verrou versionné, essai ultérieur sur environnement propre |
| Prise de données fictives pour un CRM opérationnel | Fixtures explicites, aucun import en production, accès réel bloqué avant autorisation |
| Choix de région, d'hébergement ou de coûts prématuré | Décision séparée avant création des ressources ; aucune ressource distante dans cette mission |

## 13. Décisions restant à valider

- Validation de ce plan et autorisation de démarrer la migration technique ; validation séparée de tout commit.
- Modalités de connexion des clientes et de l'équipe, durée de session et procédure de création de la première administratrice.
- Matrice des rôles : cliente/administratrice initialement, puis éventuels droits coach et accueil ; périmètre d'une éventuelle administration globale.
- Modèle d'adhésion multicentre proposé et règles de visibilité entre centres avant les premières données réelles.
- Sort du sélecteur d'aperçu pendant la séparation des routes ; maintien des vues comme démonstration tant que les accès privés ne sont pas implémentés.
- Hébergement Next compatible Node, projets Firebase développement/production, région et ressources, à décider avant tout provisioning. Firebase pour les données n'impose pas à lui seul le lieu d'hébergement de Next.

Les technologies imposées par la mission et la palette ivoire/noir/doré ne sont pas remises en discussion. Les réservations, paiements, blog et fonctions CRM feront l'objet de missions suivantes.

## 14. Vérifications de cette mission

Contrôles réexécutés le 12 septembre 2026. Les résultats antérieurs du brouillon sont remplacés par ceux de cette reprise :

| Vérification exécutée | Résultat |
| --- | --- |
| `node node_modules/typescript/bin/tsc --noEmit --incremental false` | Réussi, code de sortie 0, aucun diagnostic et aucun cache TypeScript généré |
| Périmètre ESLint | Exclusions `dist`, `.next` et caches locaux `.sites-runtime`, `.wrangler`, `.vinext` ; les exclusions et exceptions du fichier ESLint existant restent applicables, notamment `build/**`. Le script `pnpm lint` exact n'a pas été relancé ; aucune configuration n'a été modifiée |
| `node node_modules/eslint/bin/eslint.js . --ignore-pattern dist --ignore-pattern .next --ignore-pattern .sites-runtime --ignore-pattern .wrangler --ignore-pattern .vinext` | Réussi, code de sortie 0, aucun diagnostic ; caches locaux exclus explicitement, aucune configuration modifiée et aucune correction automatique |
| `git diff`, `git diff --cached` | Aucun changement de fichier déjà suivi et aucun changement indexé |
| `git diff --no-index -- NUL docs/architecture/fondation-technique.md` | Document non suivi examiné comme ajout complet ; le code 1 de cette commande signifie qu'une différence existe |
| `git diff --check` et contrôle `--no-index --check` du document | Aucune erreur d'espacement ; Git annonce seulement la conversion LF/CRLF selon sa configuration Windows |
| `git status --short --untracked-files=all` | Seul fichier non suivi : `docs/architecture/fondation-technique.md`, déjà présent avant la reprise |
| Revue du contenu et recherche de signatures de clés privées et jetons | Aucun secret réel ajouté ; uniquement noms de paramètres et identifiant de démonstration |

Aucun fichier applicatif modifié, aucun fichier supprimé, aucune dépendance installée, aucun commit et aucun déploiement. Ces contrôles de la maquette existante ne valident pas encore le futur build Next standard ni les règles Firebase, qui ne sont pas implémentés.
