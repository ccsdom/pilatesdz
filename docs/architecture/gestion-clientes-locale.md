# Gestion des clientes — version locale

Étape réalisée le 12 septembre 2026 après validation du périmètre : liste avec recherche, coordonnées, statut de fiche, création et modification, invitation depuis la fiche. Branche `codex/fondation-nextjs-firebase`. Aucun commit ou déploiement.

## Parcours livré

- `/crm/clientes` : annuaire des fiches Firestore du centre, recherche et pagination.
- `/crm/clientes/nouvelle` : création d’une fiche, sans création automatique d’identité Auth.
- `/crm/clientes/{id}` : coordonnées modifiables et préparation de l’invitation.
- `/api/crm/clientes` : lecture administratrice et mutations validées côté serveur.
- `/crm/acces` : accès existants et liens vers leurs fiches ; le formulaire d’invitation crée désormais une fiche puis utilise le même parcours de provisionnement.
- `/crm` : navigation Clientes et aperçu de trois fiches réellement enregistrées. Les anciens noms, forfaits et soldes fictifs de la carte Clientes ont été retirés ; la statistique fictive « 146 clientes » est remplacée par une entrée Annuaire. Le planning et les finances restent explicitement une démonstration.

Pour tester : se connecter au compte administrateur local, ouvrir **Clientes**, choisir **Nouvelle cliente**, enregistrer les coordonnées, modifier la fiche puis cliquer sur **Inviter à l’espace cliente**. Le lien local prépare le choix du mot de passe. Aucun e-mail réel n’est envoyé.

## Modèle et invariants

| Chemin Firestore | Contenu et responsabilité |
| --- | --- |
| `centers/{centerId}/clients/{clientId}` | Fiche métier indépendante de l’existence d’un compte Auth. |
| `centers/{centerId}/members/{uid}` | Rôle et autorisation d’accès au centre ; `clientId` relie l’appartenance à sa fiche. |
| `centers/{centerId}/clientEmails/{sha256(email)}` | Réservation unique d’une adresse normalisée dans ce centre, pointant vers `clientId`. |

La fiche contient `id`, `centerId`, `name`, `email`, `phone`, `status`, `authUid`, `invitationUid`, `version`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy` et `searchPrefixes`. Les instants sont stockés en millisecondes UTC. Les champs de suivi sont minimaux et ne constituent pas encore un journal d’audit exhaustif.

Le nom et l’e-mail sont obligatoires. Le téléphone est facultatif ; s’il est renseigné, il doit contenir de 6 à 15 chiffres et uniquement les caractères usuels de formatage autorisés. L’interface préserve le format saisi. Elle ne déduit pas automatiquement le pays ou l’indicatif. Les tailles et valeurs sont bornées côté serveur.

L’e-mail est normalisé en minuscules, sans espaces périphériques. Une transaction réserve l’index d’e-mail à la création et le déplace lors d’un changement d’adresse avant invitation. Deux créations simultanées ne produisent pas deux fiches avec la même adresse. Cet index n’est pas du chiffrement : les coordonnées restent présentes dans la fiche, protégées par les autorisations.

Le numéro de version augmente à chaque modification des coordonnées ou du statut. Une écriture depuis une ancienne version reçoit un conflit HTTP 409 et ne remplace aucune donnée. Le formulaire conserve la saisie et propose de recharger explicitement la fiche. Les transitions techniques d’invitation ne changent pas cette version métier ; les restrictions d’e-mail et de rôle sont revérifiées dans leur transaction.

### Statut de fiche et accès

`status: active | inactive` concerne le suivi au studio. Il ne désactive pas la connexion. L’interface l’explique à côté du sélecteur ; **Gestion des accès** reste l’outil pour désactiver une appartenance au centre. Une fiche inactive ne peut pas préparer de nouvelle invitation, mais un accès déjà autorisé reste régi par son appartenance. Le passage d’une fiche à active ne réactive jamais une appartenance désactivée.

L’e-mail devient non modifiable ici dès qu’un compte est lié ou qu’une invitation est en préparation. Cette restriction est contrôlée côté serveur, pas seulement dans le formulaire. Le changement d’adresse de connexion nécessite un parcours spécifique de vérification de la nouvelle adresse ; il n’est pas réalisé implicitement par une modification de coordonnées. Le nom, le téléphone et le statut restent modifiables. Le nom affiché dans la gestion des accès est synchronisé dans la même transaction ; l’identité globale Firebase n’est pas renommée pour les autres centres.

## Invitation et reprise après incident

1. Une transaction relit l’administratrice active et la fiche du centre. Une fiche active sans compte réserve un UID stable calculé côté serveur à partir du centre et de l’identifiant de fiche.
2. Firebase Auth crée l’identité avec cet UID et un mot de passe aléatoire non exposé. Une reprise retrouve uniquement l’UID réservé avec la même adresse ; elle ne réinitialise pas son mot de passe.
3. Une seconde transaction revérifie l’administratrice, le statut de la fiche et le lien existant, puis crée ensemble l’appartenance de rôle `client` et la liaison `authUid` / `clientId`.
4. Le lien de choix du mot de passe n’est généré qu’après cette association. Une nouvelle demande depuis une fiche liée réutilise la même identité et refuse les appartenances désactivées.

Un échec réseau ambigu conserve la réservation pour permettre une reprise depuis la même fiche. Un conflit explicite avec un compte sans rapport libère la réservation et permet de corriger l’adresse de la fiche. Aucune identité existante n’est prise en charge par simple correspondance d’e-mail et aucun mot de passe n’est écrasé. Si l’administratrice perd ses droits ou si la fiche devient inactive pendant la création Auth, l’association est refusée ; la reprise nécessite à nouveau les conditions d’autorisation valides.

Auth et Firestore restent deux services sans transaction commune. Cette orchestration limite les doublons et permet la reprise du parcours normal ; un journal d’opérations, une maintenance des identités sans appartenance et une stratégie de livraison fiable restent nécessaires avant production. Une réservation connue issue d’une création interrompue est couverte par les tests HTTP.

## Recherche et pagination

La recherche est exécutée côté serveur sur les seules fiches du centre autorisé. Elle utilise des préfixes du nom complet, de chaque partie du nom, de l’e-mail et des chiffres du téléphone. La casse et les accents latins sont normalisés. Exemples : `emi` trouve `Émilie`, `ben` trouve `Émilie Ben-Ali`, et `055000` trouve un numéro débutant par `0550 00`.

Il s’agit d’une recherche par début de terme, pas d’une recherche approximative ou par sous-chaîne quelconque. Les préfixes sont calculés à la création et recalculés à chaque modification. L’index automatique `array-contains` de Firestore est utilisé, avec l’ordre stable des identifiants de documents. Aucune recherche à travers tous les centres ni chargement intégral de l’annuaire dans le navigateur.

Chaque requête lit au plus 26 résultats pour afficher une page de 25 et détecter la suivante. Le curseur conserve la recherche ; la première page peut être retrouvée depuis les pages suivantes. L’ordre est celui des identifiants, sans promesse de tri alphabétique. Comme toute pagination de données vivantes, des créations ou changements de recherche entre deux pages peuvent modifier les résultats ; le test de pagination couvre un ensemble stable de 28 fiches sans doublon ni omission.

## Séparation des couches et sécurité

| Couche | Fichiers principaux | Responsabilité |
| --- | --- | --- |
| Domaine | `src/domain/models/client.ts`, `src/domain/ports/clients.ts` | Données, validation, normalisation et contrats ; aucune dépendance Firebase. |
| Services | `src/services/clients.ts` | Cas d’usage, rôle administratrice obligatoire, orchestration de l’invitation. |
| Données | `src/repositories/firestore/clients.ts` | Requêtes bornées et transactions ; nouvelle vérification du rôle, du centre et des relations. |
| Adaptateurs serveur | `src/lib/clients/server.ts`, `src/lib/auth/access-management.ts` | Assemblage des services et accès Firebase Admin marqué `server-only`. |
| HTTP | `app/api/crm/clientes/route.ts` | Session, validation stricte, corps limité, origine de mutation exacte et réponses sans cache. |
| Interface | `app/crm/clientes/`, `src/features/clients/` | Pages, formulaires, résultats, erreurs et présentation ivoire/noir/doré. |

Le `centerId`, le rôle et l’UID d’administration viennent exclusivement de la session autorisée. Les corps ne peuvent pas fournir `authUid`, `centerId` ou un rôle. Les chemins et identifiants sont validés avant toute construction de référence. Les lectures, créations, modifications et invitations refusent les clientes ordinaires et les visiteurs. Une fiche d’un autre centre est introuvable depuis les routes du centre courant. La structure prépare plusieurs centres mais aucun sélecteur de centre ou rattachement intercentre n’est ajouté.

Les règles Firestore et Storage restent en refus total pour le SDK client, y compris les fiches, l’index d’e-mails et les appartenances. Les opérations passent par le serveur autorisé, puisque Firebase Admin contourne les règles. Les contrôles du repository relisent le rôle actif de l’administratrice à l’intérieur des transactions.

## Reprise des accès locaux antérieurs

```powershell
pnpm sync:local
```

Le script ne contacte que les émulateurs de démonstration, pour le centre `alger`. Il crée une fiche pour chaque ancienne appartenance cliente sans fiche, réserve son e-mail et relie `clientId`. Il conserve les fiches déjà présentes, les mots de passe et les états des accès. Les conflits de données sont signalés sans écrasement automatique. Une exécution partielle peut être reprise. Il n’importe pas les fausses clientes de la maquette.

`pnpm seed:local` initialise désormais également les fiches des comptes réservés. Comme auparavant, ce seed renouvelle les mots de passe de démonstration : utiliser `sync:local` pour une reprise sans renouvellement. Le script utilise le support TypeScript de Node avec `--experimental-strip-types` pour partager exactement la validation et la normalisation de recherche du domaine.

La synchronisation a été exécutée deux fois sur les deux appartenances locales antérieures. Les nouvelles fiches créées ensuite par les tests navigateur utilisent directement le parcours applicatif. Les tests automatisés emploient les ports dédiés et ne créent pas leurs fixtures dans la démonstration utilisateur.

## Vérifications

- 51 tests unitaires réussis, dont validation, recherche, contrôle des rôles et reprise d’invitation.
- 23 tests HTTP réussis : authentification existante, lecture/création/modification de fiches, doublons simultanés, conflits de version, pagination, isolation des centres, invitation, association et désactivation.
- 8 tests de règles Firebase réussis, incluant les fiches et l’index d’e-mails.
- Total : 82 tests. TypeScript strict, ESLint et compilation Next.js réussis.
- Parcours navigateur vérifié : liste existante, création d’une fiche fictive, modification du téléphone, invitation et recherche du numéro enregistré. La présentation reprend le lotus, l’ivoire, le noir et le doré.
- Aucun changement dans `public/`, `app/globals.css` ou `vendor/`. Aucun secret réel, envoi d’e-mail réel ou déploiement.

## Limites et prochaines décisions

- Configuration Firebase toujours strictement locale ; aucun compte réel ou projet cloud n’est configuré. Les données des émulateurs restent temporaires sans export explicite.
- Changement d’e-mail après association : parcours de vérification à concevoir et valider.
- Livraison privée des invitations, limitation de débit, journal d’audit et conservation des données à compléter avant production.
- Pas de suppression de fiche, de donnée médicale, d’historique de séances ou de forfait. Ces responsabilités appartiennent aux étapes métier suivantes.
- Le planning et les réservations restent la prochaine étape proposée ; les paiements et forfaits suivront.

## Références techniques

- [Transactions Firestore](https://firebase.google.com/docs/firestore/manage-data/transactions).
- [Requêtes Firestore et array-contains](https://firebase.google.com/docs/firestore/query-data/queries).
- [Index automatiques Firestore](https://firebase.google.com/docs/firestore/query-data/index-overview).
