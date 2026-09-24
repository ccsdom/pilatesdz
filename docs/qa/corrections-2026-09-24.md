# Corrections de la recette du 24 septembre 2026

Travail réalisé sur `codex/fondation-nextjs-firebase`. Le rapport de recette initial est conservé comme constat de production. Les corrections ci-dessous sont locales : aucun déploiement, commit ou changement de données de production n'a été effectué.

## Suivi des anomalies

| Référence | Correction | Vérification / limite |
|---|---|---|
| A01 — Réservations invisibles | Lecture directe des réservations du centre, par pages de 20, au lieu de parcourir 30 créneaux futurs puis tronquer leurs réservations. Curseur composé séance/cliente, contrôle de l'appartenance au centre et du membre administrateur actif. Les erreurs ne sont plus ignorées ni présentées comme une liste vide. | Régression sur émulateur : 44 réservations, plusieurs clientes sur le même créneau, créneaux de même date, nombreuses séances futures vides, anciennes réservations sans `bookedAt`, absence de doublon entre pages et refus du rôle cliente. Index de groupe à publier avant l'application. L'ordre de pagination est celui des références stables, pas un tri chronologique global. |
| A02 — Offres contradictoires | Le résumé public reprend les constantes des offres : 4 ou 8 séances mensuelles, remise trimestrielle de 20 %. | Accueil corrigé vérifié dans le navigateur local ; calculs commerciaux couverts par les tests unitaires existants. |
| A03 — Capacité 4–6 | Accueil, Studio et Les Cours reprennent la capacité commune de 4 personnes. | Anciennes mentions recherchées dans le code ; capacité corrigée visible sur l'accueil local. |
| A04 — Horaires contradictoires | En-tête et Contact corrigés à 10h00–20h00, du samedi au jeudi. | En-tête vérifié au navigateur local ; recherche des anciennes heures dans le code. |
| A05 — Dashboard mobile | Conteneurs de graphiques et grilles autorisés à rétrécir ; légende des cours sur sa propre ligne ; défilement du tableau limité à son conteneur. | Navigateur local à 390 × 844 : largeur du document 375 px, tableau détaillé fermé puis ouvert. Vérification visuelle effectuée avec graphiques et données de recette. |
| A06 — Menu mobile et Échap | Menu fondé sur le dialogue accessible Radix : focus dans le menu, fermeture Échap et restitution du focus. Fermeture après sélection d'un lien et lors du passage à la largeur ordinateur. | Échap vérifié au navigateur local : fermeture et focus revenu sur « Ouvrir le menu ». |
| O01 — Doublon de fiche | Vérification des fiches existantes en complément du registre d'e-mails, pour protéger aussi les anciennes fiches sans entrée dans ce registre. Une modification ne peut plus effacer le verrou d'e-mail appartenant à une autre fiche. | Création avec e-mail d'une ancienne fiche refusée sur émulateur. Les deux fiches réelles n'ont pas été fusionnées : même e-mail ne suffit pas à autoriser la fusion des historiques et crédits. |
| O02 — Annulation H-12 | Réservation publique et CGV alignées sur le comportement existant : annulation avant le début, libération du crédit réservé, consommation après validation, validité inchangée. Suppression des promesses contradictoires H-12 et du débit immédiat annoncé à tort. | Règle de fonctionnement inchangée. Les tests unitaires et d'intégration contrôlent séparément réservation, restitution et validation des crédits. |
| O03 — CSV non confirmé | Remplacement du téléchargement Blob par une route authentifiée de téléchargement CSV, avec nom de fichier, UTF-8, absence de cache et validation du mois. Les erreurs de données font échouer l'export au lieu de livrer un rapport incomplet. | Test HTTP sur émulateur : 401 sans session, 403 pour cliente, 400 pour mois invalide, 200 avec pièce jointe CSV et dates du mois attendu pour administrateur. Téléchargement dans le navigateur de production à rejouer après déploiement. |

## Qualité du code

Les contrôles ont également révélé des erreurs ESLint existantes : apostrophes JSX, imports inutilisés, exceptions typées `any` et initialisations d'état dans des effets. Elles ont été corrigées sans modifier le rendu textuel. L'aperçu de séance est remonté pour chaque ouverture/séance, ce qui évite d'afficher les détails chargés pour une ancienne sélection ; son instant de référence est capturé à l'ouverture.

## Contrôles complémentaires

La suite d'intégration a aussi révélé qu'une date impossible du planning renvoyait 503 : la génération automatique des créneaux validait la date avant le service métier sans traduire l'erreur de saisie. Elle renvoie désormais 400, avant toute écriture.

Les fixtures d'intégration ont été adaptées au fonctionnement actuel : créneaux distincts des ouvertures automatiques, compteurs comparés à leur état initial et création automatique des accès clientes prise en compte. Les assertions sur la capacité, les crédits, les autorisations et la concurrence sont conservées.

### Résultats finaux locaux

| Contrôle | Résultat |
|---|---|
| Tests unitaires Vitest | 221 réussis |
| Suite HTTP complète avec émulateurs Firebase | 88 réussis, 0 échec, 0 ignoré |
| TypeScript strict | Réussi après la dernière correction |
| ESLint | 313 fichiers, 0 erreur, 0 avertissement |
| Compilation Next.js de production | Réussie ; les ajustements finaux de validation des dates et du menu ont ensuite été contrôlés par TypeScript et ESLint |
| Navigateur local | Dashboard mobile et menu Échap vérifiés ; contenu commercial de l'accueil vérifié |
| `git diff --check` | Réussi ; avertissements de conversion LF/CRLF uniquement |

Résultats détaillés locaux : `outputs/qa-integration-final.json`, `outputs/qa-eslint-final.json`, `outputs/qa-build.log` (fichiers de travail ignorés par Git). Aucun secret réel ajouté. Aucun commit ni déploiement effectué.

## Mise en production

1. Publier la configuration d'index Firestore : groupe `bookings`, champ `centerId`, portée `COLLECTION_GROUP`, ordre ascendant. Attendre sa disponibilité. La base existante est Standard, à Paris (`europe-west9`), vérifiée en lecture seule.
2. Publier l'application après validation des changements et des résultats de tests.
3. Rejouer en production la liste des réservations (grille, liste, filtres, pagination, erreur), le CSV, les textes publics, le menu au clavier et le dashboard à 390 px.
4. Pour O01, faire confirmer l'identité et la fiche de référence, puis inventorier abonnements, paiements, réservations et mensurations avant toute fusion. Aucune suppression automatique de doublon.

Les scénarios non exécutés ou partiels de la recette ne sont pas assimilés à des défauts prouvés ni déclarés validés en production par les tests locaux.
