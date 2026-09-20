# Statistiques graphiques du tableau de bord

Le tableau de bord `/crm?month=YYYY-MM` propose une vue mensuelle, distincte des compteurs du jour. Le mois courant à Alger est sélectionné par défaut. Les graphiques présentent :

- places réservées et non réservées par jour de séance ;
- encaissements nets enregistrés par date de réception, en dinars ;
- nombre de séances maintenues par intitulé de cours.

Les séances annulées sont exclues des capacités, réservations et répartitions. Le taux de remplissage est pondéré par la capacité totale, pas une moyenne de pourcentages journaliers. Il reste absent lorsqu’aucune capacité n’existe. Ces réservations ne sont ni des présences ni un nombre de clientes uniques. Le planning couvre tout le mois, y compris les séances à venir.

Les encaissements utilisent le rapport existant en mode mois complet, et non sa première page de 50 écritures. Les écritures corrigées sont exclues ; les calculs restent en unités monétaires mineures jusqu’à l’affichage. Les sommes affichées correspondent aux espèces enregistrées, pas au bénéfice. Aucun nom de cliente ou détail de paiement n’est transmis aux composants graphiques.

Les services conservent leurs autorisations administrateur et leur isolation par centre. Les lectures du planning et de caisse sont indépendantes : une indisponibilité s’affiche explicitement et ne devient jamais un zéro. Les plafonds existants de 1 000 séances ou écritures sont conservés ; au-delà, le panneau concerné signale qu’un résultat complet ne peut être affiché. Aucun nouveau repository, index ou accès Firestore direct n’est introduit.

Un tableau dépliable donne les valeurs journalières. Un mois sans données affiche des états vides explicites. La sélection d’un mois recharge les données serveur ; les graphiques ne sont pas des abonnements temps réel.

Validation : tests unitaires des mois complets et bissextiles, frontières de mois à Alger, annulations, capacité pondérée, calculs monétaires, autorisations et rapport complet au-delà de 50 écritures. Contrôle visuel avec données fictives, sans écriture métier cloud.
