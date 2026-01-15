/**
 * @file types.ts
 * @description Définitions des types et enums pour l'application Druid.
 * Regroupe les référentiels chercheurs, structures et gestion administrative.
 */

/** États de vue pour la navigation principale */
export enum ViewState {
  RESEARCHERS_LIST = 'RESEARCHERS_LIST',
  RESEARCHER_DETAIL = 'RESEARCHER_DETAIL',
  STRUCTURES_LIST = 'STRUCTURES_LIST',
  STRUCTURE_DETAIL = 'STRUCTURE_DETAIL',
  GROUPS_LIST = 'GROUPS_LIST',
}

/** Statuts administratifs d'un personnel de recherche */
export enum ResearcherStatus {
  VALIDATED = 'VALIDATED',      // Identité vérifiée et active
  NON_VALIDATED = 'NON_VALIDATED', // Forme auteur issue de publications, à valider
  LEFT = 'LEFT',                // Personnel ayant quitté l'établissement
  ANTICIPATED = 'ANTICIPATED',  // Recrutement futur enregistré
}

/** Représente un lien historique ou actuel avec une structure */
export interface Affiliation {
  id?: string;
  structureId?: string;    // Référence interne Druid
  structureName: string;   // Nom affiché (ex: LS2N)
  team: string;            // Équipe au sein de la structure
  startDate: string;       // YYYY-MM-DD
  endDate?: string;        // YYYY-MM-DD (optionnel si actif)
  isPrimary: boolean;      // Définit l'appartenance principale pour les signatures
}

/** Informations liées au contrat de travail et au grade */
export interface Employment {
  employer: string;        // Établissement payeur (ex: Université, CNRS)
  contractType?: string;   // Titulaire, Contractuel, etc.
  grade?: string;          // Corps / Grade (ex: PU, MCF, DR, CR)
  internalTypology?: string; // Catégorie interne (Chercheur, Enseignant-chercheur, Doctorant)
  cnu?: string;            // Section du Conseil National des Universités
  startDate?: string;
  endDate?: string;
}

/** Objet principal représentant un chercheur ou personnel d'appui */
export interface Researcher {
  id: string;              // UUID interne
  uid?: string;            // Matricule établissement (supannEmpId)
  
  // État Civil
  civility: string;        // M., Mme, Dr, Pr
  lastName: string;        // Nom d'usage
  firstName: string;       // Prénom
  birthName?: string;      // Nom de famille / naissance
  birthDate?: string;      // YYYY-MM-DD
  nationality?: string;
  
  displayName: string;     // Nom formaté pour les listes (ex: "DUPONT Jean")

  // Coordonnées
  email: string;
  secondaryEmail?: string;
  phone?: string;
  
  status: ResearcherStatus;
  employment: Employment;
  affiliations: Affiliation[]; 
  
  groups: string[];        // Groupes fonctionnels (ex: "Conseil Scientifique")

  /** Identifiants pivots pour l'interopérabilité */
  identifiers: {
    orcid?: string;        // ID chercheur international
    idref?: string;        // ID Autorité ABES
    halId?: string;        // ID Forme auteur HAL
    scopusId?: string;     // ID Elsevier
    researcherId?: string; // ID Web of Science
  };
  lastSync?: string;       // Date de dernière mise à jour via source externe
}

/** Groupe fonctionnel transverse */
export interface Group {
  name: string;
  sympaEmail?: string;     // Adresse de la liste de diffusion liée
  description?: string;
}

/** Niveaux de structure conformes au Cadre National (RNSR) */
export enum StructureLevel {
  ETABLISSEMENT = 'ETABLISSEMENT', // Personnalité morale (ex: Université)
  INTERMEDIAIRE = 'INTERMEDIAIRE', // Regroupement (UFR, Dépt, Pôle)
  ENTITE = 'ENTITE',               // Unité de recherche (ex: UMR)
  EQUIPE = 'EQUIPE',               // Équipe de recherche interne
}

/** Statut du cycle de vie d'une structure */
export enum StructureStatus {
  PROJET = 'PROJET',               // Avant création administrative officielle
  ACTIVE = 'ACTIVE',               // Structure existante (nécessite un directeur)
  EN_FERMETURE = 'EN_FERMETURE',   // Période transitoire
  FERMEE = 'FERMEE',               // Structure historique
}

/** Nature juridique de la structure */
export enum StructureNature {
  PUBLIC = 'PUBLIC',
  PRIVE = 'PRIVE',
  MIXTE = 'MIXTE',
}

/** Mission principale exercée */
export enum StructureMission {
  RECHERCHE = 'RECHERCHE',
  SERVICES_SCIENTIFIQUES = 'SERVICES_SCIENTIFIQUES',
  SERVICES_ADMINISTRATIFS = 'SERVICES_ADMINISTRATIFS',
}

/** Types d'événements de filiation (Lineage) */
export enum LineageType {
  SUCCESSION = 'SUCCESSION', // A est remplacée par B
  INTEGRATION = 'INTEGRATION', // B est absorbée par A
  FUSION = 'FUSION',         // A et B deviennent C
  SCISSION = 'SCISSION',       // A devient B et C
}

/** Lien de filiation entre deux structures */
export interface LineageLink {
  relatedStructureId: string;
  relatedStructureName: string;
  type: LineageType;
  date: string;
}

/** Objet principal représentant une Structure de recherche */
export interface Structure {
  id: string;
  trackingId?: string;      // ID de suivi interne établissement
  
  // Identification
  level: StructureLevel;
  nature: StructureNature;
  type: string;             // Label (ex: UMR, EA, ERL)
  acronym: string; 
  officialName: string; 
  description?: string;
  cluster?: string;         // Pôle ou composante de rattachement
  
  code: string;             // Numéro de l'unité (ex: 7020)
  rnsrId: string;           // Identifiant national (RNSR)
  rnestId?: string;         // Identifiant spécifique (RNest)
  siren?: string;           // Uniquement pour l'établissement

  // Cycle de vie
  status: StructureStatus;
  historyLinks: LineageLink[];
  creationDate?: string;
  closeDate?: string;

  // Missions & Classification
  primaryMission: StructureMission;
  secondaryMission?: StructureMission;
  scientificDomains: string[]; // ex: "Informatique"
  ercFields: string[];        // Panels ERC (ex: PE6_1)
  hceresDomain?: string;      // Domaine HCERES
  evaluationWave?: string;    // Vague A, B, C...

  // Gouvernance
  director: string;           // Nom du responsable
  supervisors: string[];      // Organismes de tutelle (Université, CNRS...)
  institutionCodes?: string;  // Codes UAI des tutelles
  doctoralSchools: string[];  // Écoles doctorales de rattachement

  // Localisation
  address: string;
  zipCode: string;
  city: string;
  country: string;
  website?: string;
  socials?: {
    twitter?: string;
    linkedin?: string;
    facebook?: string;
  };
  email?: string;
  phone?: string;
  
  // Identifiants tiers
  rorId?: string;             // Research Organization Registry
  halCollectionUrl?: string;  // Lien vers le portail HAL
  identifiers: {
    halStructIds?: string[];  // IDs structures HAL
    idrefId?: string;
    scopusId?: string; 
  };
  signature?: string;         // Modèle de signature bibliographique
}

/** Option pour les menus de synchronisation */
export interface SyncOption {
  id: string;
  label: string;
  icon?: string;
}

/** Structure de comparaison pour les mises à jour bi-directionnelles */
export interface ComparisonField {
  key: string;
  label: string;
  localValue: string | null;
  remoteValue: string | null;
}
