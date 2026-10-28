# CAP AI — canevas de rapport de stage

## 1. Contexte et problématique

Les équipes commerciales ont besoin d’indicateurs (KPI) rapides à partir d’une base de ventes ou de fichiers (CSV, Excel, PDF). L’analyse manuelle (Excel, requêtes SQL) est lente et peu accessible aux non-techniciens.

**CAP AI** est un assistant conversationnel d’analyse commerciale : l’utilisateur pose une question en langage naturel et obtient des KPI, des graphiques (pie, barres, histogramme, combo) et une interprétation métier.

Le projet s’appuie sur le jeu de données `difficult_dataset` (Sales, Cost, Profit, Region, Description, MixedColumn) : données volontairement imparfaites (valeurs manquantes, texte bruité) pour illustrer le nettoyage et l’analyse.

## 2. Objectifs

- Interroger une base PostgreSQL en français / anglais (NL → SQL).
- Importer un fichier et produire un tableau de bord sans écrire de SQL.
- Afficher les KPI sous forme de graphiques (un type précis si demandé, ex. pie uniquement).
- Fournir une interprétation courte, puis une version détaillée à la demande (« plus d’interprétation »).
- Sécuriser l’accès (comptes internes JWT) et préparer le SSO entreprise **PingID** (OIDC).
- Conserver un historique d’analyses par utilisateur.

## 3. Architecture technique

| Couche | Choix |
|--------|--------|
| Frontend | React, Vite, Tailwind CSS, ECharts |
| Backend | FastAPI (Python), SQLAlchemy |
| Base | PostgreSQL (`regions`, `sales`, `users`, `analysis_history`) |
| IA locale | Ollama / Mistral (questions hors templates SQL) |
| Auth | JWT (email/mot de passe) + module PingID (OIDC / mode démo) |

Flux principal : **Chat React → API FastAPI → PostgreSQL ou fichier pandas → KPI + charts + texte**.

## 4. Données (`difficult_dataset`)

Colonnes : `Date`, `Sales`, `Cost`, `Profit`, `Region`, `Description`, `MixedColumn`.

Régions : North, South, East, West, International.

Particularités (intérêt pédagogique) :
- Sales / Cost / Profit parfois vides ;
- `MixedColumn` hétérogène (OK, error, N/A, 42, 3.14) ;
- Descriptions avec espaces et priorités (urgent, delayed shipment, etc.).

Chargement : script `backend/scripts/load_dataset.py` vers la table `sales`.

## 5. Fonctionnalités réalisées

1. **Chat d’analyse** (base ou fichier joint).
2. **KPI visuels** : pie, histogramme, combo, barres.
3. **Filtrage par type** : « en pie » → uniquement le camembert.
4. **Interprétation IA** : version courte, puis version longue si l’utilisateur demande plus de détails.
5. **Suggestions** de questions (accueil + après une analyse).
6. **Historique** lié à l’utilisateur.
7. **Auth** locale + bouton **Se connecter avec PingID**.

## 6. Authentification PingID

- Objectif entreprise : SSO / MFA PingOne ou PingFederate (flux OIDC Authorization Code).
- Variables : `PINGID_ISSUER`, `PINGID_CLIENT_ID`, `PINGID_CLIENT_SECRET`, `PINGID_REDIRECT_URI`.
- En stage, sans tenant Ping : **mode démo** (`PINGID_DEMO=true`) qui simule le handshake SSO et enregistre `auth_provider = pingid`.
- En production : désactiver la démo et brancher le vrai issuer Ping.

## 7. Limites et perspectives

- L’IA Ollama n’est pas obligatoire (templates SQL + interprétation déterministe).
- PingID réel nécessite un client OIDC fourni par l’entreprise.
- OCR / vision d’images non traités.
- Pistes : SSO PingOne réel, prévisions, export PDF du dashboard, plus de qualité de données.

## 8. Conclusion

CAP AI montre un pipeline complet **données imparfaites → API → chat → KPI graphiques + interprétation**, avec une authentification extensible vers PingID, adapté à un usage interne d’analyse commerciale.
