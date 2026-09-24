# Activation de l'accès après inscription

## Corrections

- La réservation reste confirmée indépendamment de la création de l'accès.
- La réponse distingue absence d'e-mail, accès en attente, accès créé avec invitation en attente et activation préparée.
- Sans e-mail, aucune identité Firebase fictive ni appartenance au centre n'est créée. Le formulaire explique que l'e-mail est nécessaire à l'accès en ligne ; la réservation par téléphone reste possible. La fiche conserve le fonctionnement de contact provisoire existant et devra être complétée au studio.
- Le lien entre fiche et membre actif est établi après réussite de Firebase Authentication, avec contrôle de la fiche et des droits existants.
- Le bouton « Réessayer l'activation » réutilise la demande initiale : ni nouvelle fiche ni nouvelle place réservée. La reprise reste possible sur l'écran de confirmation ; après sa fermeture, la cliente peut utiliser le mot de passe oublié si son compte existe, ou contacter le studio.
- Un accès désactivé n'est pas réactivé par une reprise. Un compte Firebase préexistant avec un autre UID n'est pas récupéré.
- L'envoi accepté est mémorisé sur le reçu pour éviter de renvoyer un e-mail lors d'un rejeu ultérieur réussi. La limitation existante d'une minute s'applique aux demandes d'envoi en production.
- Aucun lien de mot de passe n'est stocké dans le reçu. Les liens directs sont réservés aux émulateurs ; la production passe par l'e-mail privé.

Le parcours CRM existant continue de tenter l'invitation à la création de la fiche et propose sa reprise depuis le dossier. L'acceptation d'envoi ne prouve pas la réception dans la boîte e-mail.

## Tests de régression ajoutés

1. Conflit avec un compte Auth indépendant : réservation confirmée, accès en attente, aucun membre actif prématuré.
2. Suppression du conflit sur émulateur puis reprise : même réservation, une seule place occupée, compte Auth et fiche correctement liés, lien local fourni.
3. Désactivation du membre puis rejeu : l'accès reste désactivé.
4. Réservation sans e-mail : réservation confirmée, absence de compte Auth et d'annonce d'envoi, rejeu sans doublon.

Aucune donnée de production modifiée. Aucun commit ni déploiement réalisé à cette étape.

## Résultats

- 16 tests d'intégration réussis sur émulateurs : 5 parcours publics et 11 parcours CRM clientes, aucun échec.
- TypeScript strict et ESLint sur les fichiers modifiés : réussis.
- `git diff --check` : réussi (avertissements de fins de ligne uniquement).
- Rapport technique local : `outputs/qa-inscription.json`, ignoré par Git.
- La réception réelle des e-mails en production n'a pas été testée ; les invitations locales utilisent les liens de l'émulateur.
