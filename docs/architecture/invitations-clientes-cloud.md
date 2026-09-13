# Invitations clientes dans Firebase cloud

## Parcours

Depuis Gestion des accès, l’administrateur saisit un nom et une adresse puis choisit **Créer et envoyer l’e-mail d’accès**. Depuis une fiche cliente, il peut choisir **Envoyer l’e-mail d’accès**. Les coordonnées viennent de la fiche enregistrée, et le centre vient de la session administrateur.

Le serveur réserve un UID stable, crée le compte avec un mot de passe aléatoire non communiqué, puis lie la fiche et l’adhésion au centre. Une nouvelle vérification des droits et du statut de la fiche précède cette liaison. Un compte déjà existant ne peut être récupéré qu’avec l’UID réservé correspondant ; les conflits d’adresses sont refusés.

En cloud, l’API Firebase `accounts:sendOobCode` reçoit une demande `PASSWORD_RESET` en français. Firebase délivre son propre e-mail pour permettre à la destinataire de choisir son mot de passe. Aucun SMTP supplémentaire et aucune clé privée ne sont nécessaires. Le traitement du lien utilise la page hébergée par Firebase ; après définition du mot de passe, la cliente revient à l’adresse de connexion de l’application. Le serveur local n’est accessible que sur cet ordinateur : un test depuis un autre appareil nécessite un hébergement ultérieur.

Référence : [API REST Firebase Authentication — envoi d’un e-mail de récupération](https://firebase.google.com/docs/reference/rest/auth#section-send-password-reset-email).

## Garanties et limites

- Toutes les mutations restent réservées aux administrateurs authentifiés du centre, avec contrôle de l’origine et du corps JSON.
- Le serveur retourne `invitationUrl: null` et `emailAccepted: true` uniquement après acceptation HTTP par Firebase. Cette réponse ne garantit pas la réception dans la boîte e-mail.
- Aucun code d’action, lien privé ou corps de réponse fournisseur n’est renvoyé, stocké ou journalisé par ce parcours cloud. Les interfaces masquent également les liens en mode cloud.
- Une transaction Firestore réserve un créneau d’envoi par adresse normalisée, hachée SHA-256, dans `authInvitationLimits`. Le délai minimal est de 60 secondes, y compris après une erreur ou un délai réseau dépassé. Les horodatages proviennent du serveur. Cette limitation applicative complète les quotas Firebase ; elle ne prétend pas bloquer l’utilisation directe de l’API publique de récupération Firebase.
- Après une erreur d’envoi, le compte et l’adhésion déjà créés restent disponibles pour une nouvelle tentative. Le serveur ne peut pas garantir l’envoi exactement une fois après un incident réseau.
- Les émulateurs conservent les liens locaux de démonstration et n’envoient aucun e-mail réel.
- L’adresse e-mail n’est pas marquée vérifiée artificiellement. Aucun droit administrateur n’est attribué à la cliente.

## Vérification

Les tests unitaires du fournisseur simulent les réponses Firebase et couvrent la confidentialité du résultat, les erreurs HTTP, l’absence de configuration, le refus avant envoi et les erreurs réseau. Les tests des services couvrent le résultat cloud sans lien et les restrictions administrateur. Les tests HTTP existants vérifient les parcours locaux avec les émulateurs.

Le formulaire cloud a été ouvert et contrôlé sans soumission. Aucun compte cliente réel ni e-mail réel n’a été créé ou envoyé pendant cette implémentation. La réception réelle et la première connexion cliente restent à tester avec une destinataire explicitement choisie pour ce test.

Résultats : 119 tests unitaires et 49 tests HTTP réussis ; TypeScript, ESLint et `git diff --check` réussis. Le premier passage HTTP avait dépassé le délai d’un test à cause de 4,3 minutes de compilation initiale de la route d’historique ; la relance complète a réussi en 87 secondes sans modification des assertions. Le contrôle des fichiers versionnables n’a détecté aucun justificatif privé. Aucun commit ni déploiement du site.
