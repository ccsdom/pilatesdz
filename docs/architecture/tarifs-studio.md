# Tarifs et format des cours

Conditions validées par le centre le 12 septembre 2026, en dinars algériens :

| Offre | Prix |
| --- | ---: |
| Séance découverte | 2 500 DA |
| Séance libre | 3 500 DA |
| 4 séances par mois | 12 000 DA / mois |
| 8 séances par mois | 20 000 DA / mois |
| Paiement trimestriel, 4 séances par mois | 28 800 DA |
| Paiement trimestriel, 8 séances par mois | 48 000 DA |

Le trimestre correspond à trois mensualités avec une réduction de 20 %. La fréquence reste de 4 ou 8 séances **par mois**. La réduction ne s’applique pas aux séances à l’unité.

Les conditions sont centralisées dans `src/domain/models/studio-offers.ts` et affichées sur le site public et dans le CRM, rubrique Forfaits. Cette présentation n’encaisse ni n’enregistre un paiement.

Les nouveaux cours durent exactement 60 minutes et accueillent au maximum 4 personnes. Le formulaire propose 4 places ; une capacité plus basse reste possible. Le service serveur refuse une durée différente ou une capacité supérieure à 4. Les séances historiques restent lisibles avec leurs paramètres d’origine ; aucune donnée existante n’est réécrite.

Les règles d’abonnement ont ensuite été validées : début à la date d’achat, périodes mensuelles anniversaires, aucun report. Le trimestre ouvre trois lots mensuels séparés. Le parcours est décrit dans `abonnements-mensuels-trimestriels.md`. Les forfaits manuels restent disponibles pour les crédits exceptionnels. La validité des séances unitaires, les restrictions éventuelles de la découverte et les conditions de remboursement restent à définir.

## Vérifications

111 tests unitaires et 49 tests HTTP sur émulateurs réussis. Les contrôles couvrent les montants trimestriels, les limites des nouveaux cours et la lecture des séances historiques. TypeScript réussit. Le site public, le catalogue du CRM et le formulaire de séance ont été ouverts dans le navigateur local cloud et leurs valeurs vérifiées. Aucune écriture métier cloud, aucun encaissement et aucun déploiement du site n’ont été effectués pour cette intégration.

ESLint n’a pas abouti : les tentatives globale et ciblée sont restées bloquées pendant le chargement des règles. Le journal de diagnostic local est `.firebase/tarifs-eslint.log`, ignoré par Git. Le lint reste à relancer ; il ne doit pas être présenté comme réussi pour cette modification. `git diff --check` réussit.

Mise à jour lors de l’étape des invitations clientes : ESLint a été relancé sur l’ensemble du dépôt et a réussi. Le blocage de ce contrôle est donc levé.
