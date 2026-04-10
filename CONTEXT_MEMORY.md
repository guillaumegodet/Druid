# 🧭 CONTEXT_MEMORY.md - Druid Project

Ce fichier est le journal de bord technique et le référentiel d'architecture du projet Druid. Il doit être mis à jour après chaque modification majeure.

---

## 🎯 Objectif Global
**Druid** est une application de cartographie et de gestion des personnels de recherche et des structures. Elle sert d'interface moderne (Lo-fi Pixel Aesthetic) pour synchroniser et enrichir les données stockées sur **Grist**.

---

## 🏗️ Architecture & Décisions Techniques

### Stack Technique
- **Frontend** : React (Vite) + TypeScript.
- **Styling** : Tailwind CSS avec un thème personnalisé "Lo-fi Pixel / Brutalist".
- **Backend-as-a-Service** : Grist API.
- **APIs Externes** : API Base Adresse Nationale (BAN) pour l'autocomplétion.

### Décisions d'Architecture
1. **Hooks Personnalisés (`useDruidData`)** : Extraction de la logique de synchronisation et de gestion d'état depuis `App.tsx` pour permettre une réutilisation et une meilleure lisibilité.
2. **Modularisation des Formulaires** : Découpage des vues complexes (`StructureDetail`) en onglets atomiques pour faciliter la maintenance et éviter les fichiers géants (>500 lignes).
3. **Mise en Relation (Linking) Front-end** : Réalisation du croisement dynamique entre les chercheurs (affiliations textuelles) et les structures (IDs réels) lors du chargement des données pour assurer une cohérence maximale sans modifier la structure Grist initiale.
4. **Sécurité `.env`** : Migration des clés API vers des variables d'environnement (`VITE_GRIST_API_KEY`) pour éviter l'exposition des secrets sur Git.
5. **Layout Unifié** : Utilisation d'un `MainLayout` pour gérer la structure Sidebar/Contenu et les notifications globales (erreurs, chargements).

---

## 📂 Arborescence Actuelle (Résumé)
```text
Druid/
├── .agents/             # Règles et workflows IA
├── components/          # Composants UI
│   ├── layout/          # Mise en page (MainLayout)
│   ├── structures/      # Sous-composants pour les structures (Tabs, BAN search)
│   ├── researchers/     # Sous-composants pour les chercheurs (Tabs, Affiliations)
│   ├── Sidebar.tsx
│   ├── ResearcherList.tsx
│   └── ...
├── hooks/               # Logique réutilisable (useDruidData)
├── lib/                 # Services (gristService.ts) et utilitaires
├── types.ts             # Définitions TypeScript globales
├── constants.ts         # Mock data et configurations
├── App.tsx              # Orchestrateur principal
├── .env                 # Secrets (ignoré par Git)
└── CONTEXT_MEMORY.md    # Ce fichier
```

---

## 📜 Journal des Modifications (Dernières actions)
- **[2026-04-08] Refactoring Modulaire (Phase 2)** :
    - Découpage de `ResearcherDetail.tsx` en composants atomiques (`GeneralTab`, `ComparisonView`, `AffiliationsTable`).
    - Centralisation des sous-composants dans `components/researchers/`.
- **[2026-04-08] Refactoring Modulaire (Phase 1)** :
    - Création du hook `useDruidData`.
    - Création de `MainLayout`.
    - Découpage de `StructureDetail.tsx` en onglets (`Identification`, `Classification`, `Lifecycle`, `Governance`).
    - Intégration de l'AddressSearchField (API BAN) en composant autonome.
- **[2026-04-08] Persistence & Sécurité** :
    - Implémentation de `updateStructure` dans `GristService`.
    - Mise en place du système `.env` et protection `.gitignore`.
    - Correction des types TypeScript pour `import.meta.env` via `vite-env.d.ts`.

---

## 📅 To-Do List (Prochaines étapes)
- [x] **Découpage ResearcherDetail** : Appliquer la même modularité (tabs) que pour StructureDetail.
- [x] **Validation Zod** : Ajouter des schémas de validation pour sécuriser l'ingestion des APIs (Researcher & Structure).
- [x] **Gestion du Cache** : Implémenter un cache local (localStorage) basé sur la date de modification réelle du document Grist (`updatedAt`).
- [x] **Historisation / Lineage** : Mise en place d'une visualisation graphique (LineageGraph) dans l'onglet Lifecycle des structures.
- [x] **Export PDF/Excel/CSV** : Système d'exportation massif (listes) et individuel (fiche détail) opérationnel.
- [x] **Identifiants Chercheurs** : Ajout d'une colonne IDs (ORCID, HAL, IdRef, Scopus) avec pictos stylisés, filtres multicritères et dataviz de couverture.

---
*Note : Ce fichier est maintenu par Antigravity à chaque étape clé.*
