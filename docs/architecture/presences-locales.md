# Présences et absences locales

## Fonctionnement

Le détail administratif d’une séance (`/crm/planning/{id}`) contient désormais une feuille de présence, les compteurs de participantes présentes, absentes et non renseignées, et le pointage de chaque réservation confirmée.

Les trois états sont `unmarked` (non renseignée), `present` (présente) et `absent` (absente). Une absence n’est jamais déduite automatiquement d’un pointage manquant. Pour cette étape, la feuille s’ouvre après la fin du cours, calculée côté serveur avec son horaire et sa durée. Les séances annulées et les réservations annulées ne peuvent pas être pointées.

L’administration renseigne un premier état, puis peut corriger ce pointage avec un motif de 5 à 300 caractères. Une correction peut aussi remettre le statut à « Non renseignée » pour une vérification ultérieure. Le bouton Historique affiche les changements du plus récent au plus ancien et permet de consulter les pages précédentes de 20 événements.

Le pointage n’ajoute aucun débit ni remboursement : le crédit reste celui consommé à la réservation. Il ne change ni les places occupées ni le statut de réservation. Les éventuelles règles commerciales sur les absences et les exceptions restent à définir séparément. Aucun message n’est envoyé.

## Architecture

| Fichier ou dossier | Responsabilité |
| --- | --- |
| `src/domain/models/attendance.ts` | États, libellés, validation, ouverture après la fin du cours |
| `src/domain/ports/attendance.ts` | Contrat de pointage et de consultation de l’historique |
| `src/services/attendance.ts` | Rôle administrateur, validation des identifiants, motifs et curseurs |
| `src/repositories/firestore/attendance.ts` | Transactions, contrôle du centre et de l’adhésion, versionnement et historique |
| `src/lib/attendance/server.ts` | Assemblage serveur avec Firebase Admin |
| `app/api/presences/route.ts` | API GET/POST authentifiée, protection d’origine, JSON limité et réponses sans cache |
| `src/features/planning/attendance-form.tsx` | Saisie, correction motivée, actualisation et historique paginé |
| `src/repositories/firestore/planning.ts` | Lecture du pointage dans la liste administrative des participantes |
| `app/crm/planning/[id]/page.tsx` | Composition de la feuille et compteurs |

## Données et concurrence

Le document `centers/{centerId}/sessions/{sessionId}/bookings/{clientId}` conserve le champ `attendance`, composé de `status` et `version`. Les anciennes réservations sans ce champ sont présentées comme non renseignées, version zéro, sans migration ni écriture rétroactive.

Les changements sont ajoutés dans la sous-collection `attendanceEvents`. Chaque événement contient son UUID de requête, l’ancien état, le nouvel état, la révision, l’heure serveur, l’identifiant du compte administrateur et le motif. Aucun événement n’est modifié ou supprimé par le service. Le journal est propre à cette réservation et à ce centre.

La requête indique la version consultée. Deux modifications concurrentes fondées sur cette même version ne peuvent pas s’écraser : une seule réussit, l’autre reçoit un conflit explicite et doit actualiser la feuille. Rejouer une requête déjà enregistrée ne crée pas un nouvel événement et ne revient pas sur une correction ultérieure. Réutiliser son UUID avec un contenu différent est refusé. Enregistrer l’état déjà courant ne crée pas de faux changement.

Le document de réservation et l’événement sont écrits dans une même transaction. L’historique est ordonné et paginé par révision, ce qui reste stable même lorsque plusieurs événements ont le même horodatage. Une limite technique d’un million de corrections par réservation empêche un dépassement du compteur.

## Autorisations et confidentialité

Les opérations sont réservées aux administratrices actives du centre. L’adhésion, le rôle, le centre, la séance et l’identité de la réservation sont revérifiés dans chaque transaction. La vérification horaire utilise l’horloge serveur, indépendamment des boutons présentés par l’interface.

Les clientes ne peuvent ni pointer ni consulter l’historique administratif. La réponse planning côté cliente continue à exclure la liste des participantes et les motifs de correction. Les règles Firestore refusent également tout accès direct aux pointages et événements, même en présence de revendications de rôle. Firebase Admin reste exclusivement côté serveur et limité aux émulateurs locaux.

Les motifs servent uniquement à expliquer une correction de présence ; il n’est pas nécessaire d’y saisir des informations personnelles sensibles. L’historique affiche l’identifiant du compte administratif responsable pour permettre la traçabilité.

## Vérifications et limites

Les tests unitaires couvrent l’ouverture exacte à la fin du cours, les états initiaux, les entrées invalides, les corrections motivées et l’interdiction aux clientes. Les tests HTTP couvrent les accès anonymes, la protection d’origine, les adhésions révoquées, l’isolation des centres, les réservations inexistantes/annulées, le pointage avant la fin, les demandes répétées, les corrections concurrentes, la pagination de l’historique et l’absence d’effet sur les crédits et places. Les tests de règles interdisent les modifications directes et l’accès à l’historique.

Le contrôle navigateur utilise une séance fictive terminée, une réservation fictive sans débit et le compte de démonstration. Cette donnée reste uniquement dans l’émulateur et ne modifie aucun compte ou crédit réel.

Bilan : 143 tests réussis (90 unitaires, 45 HTTP, 8 de règles Firebase), contrôle TypeScript et build Next réussis. ESLint termine sans erreur après diagnostic de lancements restés bloqués ; aucune règle n’a été désactivée. Le navigateur vérifie le premier pointage, une correction motivée, les compteurs et l’historique daté. Les fichiers de marque et styles globaux sont inchangés. Aucun secret réel, commit supplémentaire ou déploiement n’est ajouté.

Cette étape ne fournit pas encore de rôle coach, de pointage en masse, d’export, de statistiques d’assiduité globales ou d’historique personnel côté cliente. Les règles commerciales d’absence, la durée de conservation et les droits d’un futur rôle coach restent à valider avant leur mise en œuvre. Aucun déploiement n’est réalisé.
