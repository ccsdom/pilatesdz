# Authentification et accès par centre — version locale

Ce document décrit l’étape initiale. La [gestion des accès clientes](gestion-acces-locale.md) ajoute maintenant invitations, récupération et désactivation. Les tests utilisent désormais des ports dédiés et peuvent s’exécuter pendant la démonstration ; voir le README pour les commandes actuelles.

12 septembre 2026. Mise en œuvre après demande de poursuivre le projet. Branche `codex/fondation-nextjs-firebase`, sans commit ni déploiement.

## Périmètre et choix provisoires

Connexion par e-mail/mot de passe, sans écran ou endpoint d'inscription publique. Les comptes de cette mission sont uniquement des comptes fictifs dans les émulateurs. Le parcours d'invitation réel et la récupération de mot de passe ne sont pas implémentés : aucun message n'est envoyé. Le formulaire invite à contacter le centre en cas de besoin.

| Décision locale | Valeur |
| --- | --- |
| Centre actif | `alger`, issu de la configuration serveur |
| Rôles | `client` pour l'espace cliente ; `admin` pour le CRM |
| Source des permissions | `centers/{centerId}/members/{uid}` avec `uid`, `centerId`, `role`, `active` |
| Durée maximale de session | 8 heures, non glissante |
| Connexion récente exigée | `auth_time` de moins de 5 minutes |
| Projet | `demo-pilates-center-alger`, exclusivement sur les émulateurs |

Les administratrices ne reçoivent pas implicitement le rôle cliente. Les rôles coach, accueil et administration globale restent hors périmètre. Une identité Firebase ou une revendication `admin` dans son jeton n'accorde aucun accès sans adhésion locale valide. L'absence d'inscription dans l'application ne désactive pas à elle seule les API d'inscription de Firebase : les comptes sans adhésion restent refusés côté serveur.

## Session et séparation des responsabilités

1. `LoginForm` utilise Firebase Auth avec persistance en mémoire. Aucun refresh token n'est conservé dans le stockage du navigateur.
2. Le jeton d'identité est transmis à `POST /api/auth/session`. L'endpoint accepte uniquement du JSON venant de l'origine locale explicitement configurée, refuse les champs supplémentaires et limite le corps à 12 000 octets. Il ne fait confiance à aucun en-tête de proxy pour définir cette origine.
3. Le service vérifie le jeton, la récence de connexion et l'adhésion active au centre. Le rôle envoyé par le navigateur ne participe jamais à la décision.
4. Firebase Admin crée et vérifie un cookie de session Firebase. Celui-ci est conservé dans un document serveur `authSessions/{sha256(identifiantAléatoire)}`, avec l'UID et l'expiration. Le navigateur reçoit uniquement un identifiant aléatoire de 256 bits dans un cookie `HttpOnly`, `SameSite=Strict`, `Path=/`, sans domaine partagé. Le flag `Secure` est prévu en production ; Firebase production demeure bloqué.
5. À chaque requête privée, le serveur contrôle l'existence et l'expiration de ce document, la validité/révocation Firebase, le statut du compte et l'adhésion courante. Aucune permission n'est placée dans un cache partagé.
6. La déconnexion supprime immédiatement le document de la session courante, demande la révocation des jetons Firebase de l'utilisateur et efface le cookie. La suppression du document garantit le refus immédiat du cookie courant même si la révocation Firebase a une granularité à la seconde.

Le document de session contient un justificatif sensible : les règles Firestore le rendent inaccessible aux SDK clients. Il ne doit jamais être exposé par une API, journalisé ni exporté dans Git. En production, prévoir un champ horodatage et une politique TTL pour nettoyer les sessions expirées ; le champ local `expiresAt` actuel est un nombre de millisecondes et ne configure pas un TTL Firestore. Dans les émulateurs, les données sont éphémères. L'expiration est déjà vérifiée à chaque accès, indépendamment d'un nettoyage.

La création du justificatif suit le mécanisme des [sessions Firebase Admin](https://firebase.google.com/docs/auth/admin/manage-cookies), auquel une référence opaque et révocable côté serveur a été ajoutée. Les autorisations sont vérifiées au niveau serveur et des données, conformément aux [principes Next.js d'authentification](https://nextjs.org/docs/app/guides/authentication).

## Routes et couches

- `app/api/auth/session` : échange d'identité et création de session.
- `app/api/auth/me` : contexte minimal autorisé, ou 401/403 ; réponse non mise en cache.
- `app/api/auth/logout` : déconnexion par POST de même origine.
- `app/crm/page.tsx` et `app/espace-cliente/page.tsx` : pages dynamiques Node.js, garde serveur avant tout rendu privé. Sans session, redirection vers `/connexion`. Sans permission, une vue de refus remplace entièrement le contenu privé.
- `src/domain/ports/auth.ts` et `models/access.ts` : contrats purs.
- `src/services/auth-service.ts` : décisions d'accès indépendantes de Firebase.
- `src/repositories/firestore/memberships.ts` : lecture et validation stricte des adhésions.
- `src/lib/auth/server.ts` : adaptation Firebase et registre de sessions, marqué `server-only`.

Le CRM conserve les mêmes données fictives ; cette mission n'ajoute aucune fonction CRM métier. Les règles Firestore et Storage restent entièrement fermées. La détection de métadonnées GCP est désactivée dans cet environnement local pour éviter les recherches réseau inutiles.

## Démonstration et tests

Exécuter `pnpm emulators`, puis `pnpm seed:local` dans un autre terminal, puis `pnpm dev:local`. Ouvrir `http://127.0.0.1:3100/connexion`. Les identifiants fictifs se trouvent dans `.firebase/demo-accounts.json`, ignoré par Git. Le seed ne touche que les deux UID réservés `demo-admin-alger` et `demo-client-alger` et renouvelle leurs mots de passe à chaque exécution.

Les tests unitaires couvrent l'absence de session, la récence, le centre, l'identité, l'adhésion, les rôles et les requêtes non autorisées. Les tests HTTP avec émulateurs vérifient les pages et API réelles, notamment l'absence de données CRM dans la réponse à une cliente, les revendications de rôle trompeuses, les désactivations, l'expiration et la réutilisation après déconnexion. Les tests de règles incluent désormais les documents de session et l'auto-attribution du rôle admin.

## Avant toute utilisation réelle

Valider le parcours de connexion/invitation, la durée de session, les rôles et la création de la première administratrice réelle. Préparer ensuite la configuration Firebase cloud, l'origine HTTPS, la limitation de débit, la récupération de compte, les protections contre les abus, les journaux sans justificatifs sensibles et le nettoyage des sessions. Ces points restent nécessaires avant publication ; la version actuelle refuse explicitement Firebase en production.

## Résultats de vérification

- TypeScript strict et ESLint : réussis.
- Build Next.js : réussi ; pages privées et API d'authentification dynamiques, accueil et connexion prérendus.
- Vitest : 28 tests unitaires, 11 tests HTTP avec émulateurs et 8 tests de règles réussis, soit 47 tests.
- Le premier passage HTTP a rencontré un délai de détection de métadonnées GCP. Après désactivation de cette détection dans le mode local, les 11 tests ont réussi en environ 12 secondes, sans augmenter leur délai maximal.
- Navigateur : connexions cliente et administratrice, refus du CRM pour la cliente, déconnexion et affichage mobile du formulaire vérifiés. Les comptes de test du navigateur ont été déconnectés après contrôle.
- Script de seed exécuté deux fois avec succès, identifiants fictifs confirmés ignorés par Git. Aucun secret réel ajouté.
- Identité visuelle : CSS global, ressources de marque et vendor inchangés. Aucun commit, aucun déploiement.

Le serveur local et les émulateurs de démonstration restent démarrés pour l'essai utilisateur. Les processus créés pour les suites automatisées ont été arrêtés par leurs lanceurs.
