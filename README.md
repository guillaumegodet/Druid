# 🧙‍♂️ Druid (Directory for Researchers, Units & Identifiers)

**Druid** est une plateforme de gestion et de pilotage des personnels de recherche. Conçue pour centraliser les identités, les affiliations et les indicateurs RH de la recherche, elle fait le pont entre les sources institutionnelles (LDAP) et la curation collaborative (Grist).

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/Stack-React_19-61dafb.svg)
![Vite](https://img.shields.io/badge/Stack-Vite_6-646cff.svg)
![Tailwind](https://img.shields.io/badge/Styling-Tailwind_3-38bdf8.svg)

---

## 🚀 Fonctionnalités Clés

### 📂 Gestion des Identités & Curation
- **Synchro Multi-sources** : Récupération automatique des statuts et dates de naissance depuis le LDAP Université.
- **Curation Collaborative** : Interface fluide pour modifier et valider les données directement synchronisées avec **Grist**.
- **Gestion des Affiliations** : Suivi précis des rattachements aux laboratoires et équipes de recherche.

### 📊 Dashboard Analytique (Dataviz)
Visualisations dynamiques basées sur les filtres actifs :
- **Parité Genre** : Analyse de la répartition Hommes/Femmes.
- **Pyramide des Âges** : Tranches d'âges basées sur les données LDAP.
- **Répartition par Grade** : identification des corps et grades dominants.
- **Top Employeurs & Labos** : Mapping des forces vives par tutelles et appartenances.

### 🔍 Filtres Avancés & Intelligence de Données
- **Moteur de Recherche** : Recherche plein texte sur l'identité, l'email ou le labo.
- **Filtres par Pôle** : Mapping intelligent déduisant automatiquement le Pôle (Humanités, S&T, Santé, Sociétés) à partir du laboratoire.
- **Filtre Temporel** : Visualisation des chercheurs présents sur une période donnée (Date d'arrivée / départ).

---

## 🛠️ Stack Technique

- **Frontend** : [React 19](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool** : [Vite](https://vitejs.dev/)
- **Visualisation** : [Recharts](https://recharts.org/)
- **Design System** : [Tailwind CSS](https://tailwindcss.com/)
- **Iconographie** : [Lucide React](https://lucide.dev/)
- **Backend (Proxy/Sync)** : Intégration custom dans les middlewares Vite pour l'exécution de scripts Node de synchronisation.

---

## ⚙️ Configuration & Installation

### Pré-requis
- Node.js (v18+)
- Accès au LDAP Université (VPN nécessaire pour la synchro)

### Installation
```bash
# Installation des dépendances
npm install

# Lancement en mode développement
npm run dev
```

### Variables d'environnement
Le projet utilise un fichier `.env` pour sécuriser les accès :
- `VITE_GRIST_API_KEY` : Clé API pour la lecture/écriture dans Grist.
- `LDAP_PASSWORD` : Identifiants pour le script de synchronisation.

---

## 📁 Structure du Projet

- `/components` : Composants UI (Dashboard, Liste, Détails).
- `/lib` : Services API (Grist) et référentiels de mappings (Labos/Pôles).
- `/scripts` : Scripts de synchronisation LDAP (`sync_ldap.cjs`).
- `/public` : Cache local des données LDAP (`ldap_status_cache.json`).

---

## 🤝 Contribution
Ce projet est développé pour optimiser le pilotage de la recherche. Pour toute demande de nouveau graphique ou de nouvelle source de données, veuillez contacter l'administrateur du projet.

---
*Réalisé avec ❤️ par le service Bibliométrie du SCD de Nantes Universitépour l'excellence de la recherche.*
