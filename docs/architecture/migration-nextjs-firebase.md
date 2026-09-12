# Bilan de migration — fondation Next.js et Firebase

Date : 12 septembre 2026. Branche : `codex/fondation-nextjs-firebase`. Travail local, non commité, non déployé.

## Résultat

Le projet utilise maintenant les commandes standard `next dev`, `next build` et `next start`. Next.js 16.2.6, React 19.2.6, TypeScript strict et Tailwind 4.2.1 sont conservés. Aucun moteur Vinext, binding Cloudflare, schéma D1 ou adaptateur Drizzle ne participe à l'application.

Les quatre routes sont `/`, `/crm`, `/espace-cliente` et `/connexion`. Le site public conserve la maquette ; le sélecteur d'aperçus a été retiré de l'accueil. Le CRM affiche uniquement les fixtures d'origine avec une mention explicite de démonstration. Les deux autres routes affichent leur indisponibilité actuelle, sans formulaire trompeur ni collecte de données. Le lien « Espace cliente » et son retour à l'accueil fonctionnent. Les autres boutons métier restent inactifs comme dans la maquette initiale.

## Changements par lot

| Lot | Fichiers concernés | Résultat |
| --- | --- | --- |
| Exécution | `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `tsconfig.json`, `eslint.config.mjs`, `.gitignore` | Scripts Next directs, installation pnpm Windows standard, alias `@/*` vers `src/*`, caches isolés |
| Sortie Sites | `vite.config.ts`, `.openai/hosting.json`, `build/sites-vite-plugin.*`, anciens `scripts/*`, `app/chatgpt-auth.ts` | Fichiers identifiés retirés ; aucune ressource distante touchée |
| Sortie SQL | `db/*`, `drizzle/*`, `drizzle.config.ts`, `cloudflare-env.d.ts`, `examples/d1/*` | Schéma vide, types et exemples retirés |
| Identité et vues | Ancienne `app/page.tsx` vers `src/components/brand/`, `src/features/public-site/`, `src/features/crm/` et nouvelles pages `app/` | Lotus extrait à l'identique, fixtures isolées, séparation des espaces |
| Catalogue | `components/ui/*`, `hooks/use-mobile.ts`, `lib/utils.ts` vers `src/` | 61 composants conservés ; seul l'import du hook dans la sidebar a été adapté |
| Firebase | `src/config/*`, `src/lib/firebase/*`, `.env.example`, `firebase.json`, règles et index | Initialisation différée, mode local explicite, refus par défaut |
| Tests | `vitest*.config.ts`, `tests/*`, `scripts/firebase-local.mjs` | Tests unitaires et suite de sécurité reproductible avec arrêt des émulateurs |
| Documentation | `README.md`, document de fondation et ce bilan | Commandes et limites actualisées |

Les assets `public/brand/reformer-art.png`, `public/brand/signage.jpg`, le favicon, `app/globals.css` et les fichiers vendor n'ont pas été modifiés. L'attribut `sizes` a été ajouté à l'image Next pour indiquer sa largeur d'affichage sans changer son cadrage. Les couleurs et tracés SVG du lotus restent ceux de la maquette.

Les caches historiques `.sites-runtime`, `.wrangler` et `.vinext` ont été conservés et exclus des contrôles. Un fichier généré `.next/dev/types/validator.ts`, qui référençait encore l'ancienne page, a été retiré puis les types Next ont été régénérés. Aucun fichier source utilisateur n'a été supprimé pour corriger ce cache.

## Firebase et limites d'autorisation

Versions ajoutées : `firebase` 12.18.0, `firebase-admin` 14.3.0, `vitest` 5.0.0, `@firebase/rules-unit-testing` 5.0.2 et `firebase-tools` 15.29.0. Le verrou est mis à jour par pnpm. La politique de maturité de sept jours et le contrôle strict des scripts sont conservés. Les scripts optionnels `@firebase/util` (autoconfiguration) et `protobufjs` (avertissement de version) sont explicitement désactivés ; RE2 est autorisé pour la dépendance native du CLI Firebase.

Les adaptateurs acceptent exclusivement `demo-pilates-center-alger`, un mode émulateur explicitement activé et les trois hôtes loopback. Ils refusent une configuration partielle, un autre projet, un hôte distant et l'utilisation en production. Aucun secret, compte de service ni fichier `.env.local` n'a été créé. Le build public n'appelle pas Firebase.

`admin.ts` et la configuration serveur importent `server-only`. Les futures entrées qui les utiliseront devront fonctionner en runtime Node.js. Les règles Firestore et Storage refusent toutes les opérations clientes, même authentifiées. Cela ne protège pas automatiquement les accès privilégiés Admin : aucun service métier, endpoint privé ni session n'est implémenté ici.

La politique pure `belongsToCenter` vérifie une adhésion active correspondant au `uid` et au `centerId`. Elle suppose une identité vérifiée et une adhésion issue d'une source serveur fiable ; elle ne remplace pas une permission métier. La matrice de rôles, les cookies de session et les contrôles de propriété doivent être réalisés avant toute utilisation privée réelle.

Les dossiers `app/api/`, `src/services/`, `src/repositories/` et `src/types/` ne sont pas créés à vide. Leur introduction reste prévue au premier cas d'usage, conformément au plan. Aucun repository Firestore métier, paiement, réservation, provisioning cloud ni workflow de déploiement n'a été ajouté. La CI distante reste à configurer lors de la préparation du dépôt distant ; les commandes de validation locales sont disponibles.

## Vérifications réalisées

| Contrôle | Résultat |
| --- | --- |
| `pnpm install --frozen-lockfile` | Réussi après mise à jour du verrou et déclaration explicite des scripts autorisés |
| TypeScript strict sans émission | Réussi, y compris les modules Firebase et les tests |
| ESLint | Réussi sans diagnostic, avec les exclusions de caches et exceptions UI documentées |
| `pnpm test` | 14 tests réussis : configuration locale et périmètre centre |
| `pnpm test:security` | 8 tests réussis sur Firestore/Storage ; lectures, listes, écritures et suppressions refusées pour visiteur, cliente, revendication admin et autre centre |
| Cycle émulateurs | Auth, Firestore et Storage démarrés sur le projet fictif, tests exécutés, arrêt réussi ; binaires téléchargés dans `.firebase/cache` |
| `pnpm build` | Réussi sans configuration Firebase ; quatre routes applicatives générées et page introuvable |
| `pnpm start --port 3100` | Serveur de production local démarré, accueil servi avec HTTP 200 |
| `pnpm dev --port 3101` | Serveur de développement Next standard démarré |
| Vérification navigateur | Public et CRM inspectés aux largeurs 390, 768 et 1440 ; aucun débordement horizontal ; illustration chargée ; aucun avertissement/erreur console observé dans l'onglet final |
| Navigation | Lien espace cliente, retour au studio et route connexion contrôlés |
| Préservation source | Diff nul pour CSS global/public/vendor ; 61 composants UI comparés à HEAD, identiques hors import du hook |
| Git | Branche de travail conservée ; aucun changement indexé, aucun commit et aucun déploiement |

La vérification visuelle est une inspection navigateur, accompagnée de comparaisons source ; ce n'est pas une comparaison automatisée pixel par pixel. Les tests de sécurité valident des règles entièrement fermées, pas une future matrice de droits. Les SDK applicatifs sont préparés et contrôlés par TypeScript, mais aucun parcours Auth/Firestore/Storage complet n'est encore raccordé à l'interface.

## Suite proposée

Faire valider le diff de cette fondation et son commit. Préparer ensuite une mission dédiée à l'authentification : modalités de connexion, première administratrice, matrice des rôles et adhésions au centre. L'hébergement, la région Firebase et les identités de production doivent être décidés avant tout provisioning ou accès réel. Les modules métier viendront après les tests d'autorisation correspondants.
