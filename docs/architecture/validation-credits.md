# Crédits et suivi cliente

## Comportement

- Réserver déplace un crédit disponible vers les crédits réservés. La capacité du créneau et le forfait sont modifiés dans la même transaction.
- Annuler avant le début restitue le crédit et retire les tâches de validation.
- Après le créneau, le manager valide la consommation ou restitue le crédit avec un motif. Une correction ultérieure est possible et tracée. La présence reste une information indépendante.
- Les anciennes réservations sont considérées comme déjà déduites : aucune nouvelle déduction lors de leur validation. L'interface distingue ces déductions historiques.
- Le réglage manuel/automatique s'applique aux nouvelles réservations ; les réservations existantes conservent leur mode. Le mode manuel est utilisé par défaut.
- Les décisions utilisent une version et un identifiant de requête pour empêcher les doubles opérations et les corrections concurrentes silencieuses.

## Traitement automatique

Le point d'entrée POST `/api/internal/credits` vérifie un jeton Google OIDC : signature, audience, expiration et adresse vérifiée du compte de service dédié. Aucun secret partagé ni fichier de clé n'est nécessaire. Ce compte appelant ne reçoit aucun droit sur Firestore.

Cloud Scheduler appelle ce point d'entrée toutes les cinq minutes. Chaque appel traite au plus vingt réservations terminées ; une transaction recontrôle leur état avant consommation. Une tâche en échec est différée d'une heure. Les décisions manuelles retirent la tâche correspondante. Une interruption avant validation ne produit aucun débit partiel ; les tâches encore présentes sont reprises.

L'activation du mode automatique dans le CRM exige un passage réussi du traitement dans les quinze dernières minutes. La liste « À valider » conserve les crédits réservés, y compris ceux dont la tâche automatique a échoué. Surveiller les erreurs Scheduler et le compteur `failed` du document `settings/creditWorker` ; un appel réussi ne garantit pas que chaque réservation a pu être traitée.

### Mise en service à effectuer après déploiement

1. Déployer cette version avec les deux variables `CREDIT_WORKER_*` définies dans `apphosting.yaml`.
2. Avec la connexion Firebase CLI existante et les permissions IAM/Scheduler, exécuter `node scripts/configure-credit-worker.cjs`. L'alternative gcloud est `scripts/configure-credit-worker.ps1`. Ces scripts créent ou actualisent la tâche et lancent un premier passage, sans créer de clé privée.
3. Vérifier le succès de l'exécution dans Cloud Scheduler et l'état disponible dans `/crm/forfaits/validation`.
4. Le manager choisit ensuite le mode automatique pour les nouvelles réservations. Aucun changement de politique n'est imposé par le script.

Le script est livré sans être exécuté lors du développement. Ne pas annoncer le traitement automatique comme opérationnel avant ces vérifications en production.

## Mensurations

`/espace-cliente/mensurations` expose uniquement les dates et mesures du dossier lié au compte connecté. L'identité, l'appartenance au centre et la liaison du dossier sont revérifiées côté serveur. Aucun identifiant de cliente n'est accepté dans l'API publique authentifiée ; les métadonnées administratives ne sont pas transmises. La cliente consulte ses courbes et son historique, sans pouvoir modifier les relevés du CRM.

## Vérifications

Tests unitaires des transitions et de la compatibilité historique ; tests sur émulateurs Firebase des requêtes HTTP, des doubles décisions, des corrections, des autorisations, du traitement automatique, de l'annulation et de la confidentialité des mensurations. Les tests utilisent uniquement des identités et dossiers fictifs.
