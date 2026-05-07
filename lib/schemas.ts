import { z } from 'zod';
import { 
  ResearcherStatus, 
  StructureLevel, 
  StructureNature, 
  StructureStatus, 
  StructureMission, 
  LineageType 
} from '../types';

/**
 * @file schemas.ts
 * @description Schémas de validation Zod pour les données Grist.
 * Permet de garantir l'intégrité des données à l'entrée de l'application.
 */

// --- Éléments de base ---

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal('')).nullable();

// --- Researcher Schemas ---

export const AffiliationSchema = z.object({
  id: z.string().optional(),
  structureId: z.string().optional(),
  structureName: z.string().default(''),
  team: z.string().default(''),
  startDate: z.string().default(''),
  endDate: z.string().optional().nullable(),
  isPrimary: z.boolean().default(false),
});

export const EmploymentSchema = z.object({
  employer: z.string().default(''),
  contractType: z.string().optional().nullable(),
  grade: z.string().optional().nullable(),
  internalTypology: z.string().optional().nullable(),
  cnu: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  ldapFields: z.array(z.string()).optional().default([]),
});

export const NURelatedSchema = z.object({
  pole: z.string().optional().nullable(),
  composante: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  doctoralSchool: z.string().optional().nullable(),
  hdr: z.boolean().default(false),
  hdrYear: z.string().optional().nullable(),
});

export const ResearcherIdentifiersSchema = z.object({
  orcid: z.string().optional().nullable(),
  idref: z.string().optional().nullable(),
  halId: z.string().optional().nullable(),
  scopusId: z.string().optional().nullable(),
  researcherId: z.string().optional().nullable(),
});

export const ResearcherSchema = z.object({
  id: z.string(),
  uid: z.string().optional().nullable(),
  civility: z.string().default(''),
  lastName: z.string().default(''),
  firstName: z.string().default(''),
  birthName: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  displayName: z.string().default(''),
  email: z.string().email().or(z.literal('')).default(''),
  secondaryEmail: z.string().email().or(z.literal('')).optional().nullable(),
  phone: z.string().optional().nullable(),
  status: z.nativeEnum(ResearcherStatus).default(ResearcherStatus.UNKNOWN),
  employment: EmploymentSchema,
  affiliations: z.array(AffiliationSchema).default([]),
  groups: z.array(z.string()).default([]),
  identifiers: ResearcherIdentifiersSchema,
  nuFields: NURelatedSchema.optional(),
  ldapFields: z.array(z.string()).optional().default([]),
  lastSync: z.string().optional().nullable(),
});

// --- Structure Schemas ---

export const LineageLinkSchema = z.object({
  relatedStructureId: z.string(),
  relatedStructureName: z.string(),
  type: z.nativeEnum(LineageType),
  date: z.string(),
});

export const StructureIdentifiersSchema = z.object({
  halStructIds: z.array(z.string()).default([]),
  idrefId: z.string().optional().nullable(),
  scopusId: z.string().optional().nullable(),
});

export const StructureSchema = z.object({
  id: z.string(),
  trackingId: z.string().optional().nullable(),
  level: z.nativeEnum(StructureLevel).default(StructureLevel.ENTITE),
  nature: z.nativeEnum(StructureNature).default(StructureNature.PUBLIC),
  type: z.string().default(''),
  acronym: z.string().default(''),
  officialName: z.string().default(''),
  description: z.string().optional().nullable(),
  cluster: z.string().optional().nullable(),
  code: z.string().default(''),
  rnsrId: z.string().default(''),
  rnestId: z.string().optional().nullable(),
  siren: z.string().optional().nullable(),
  status: z.nativeEnum(StructureStatus).default(StructureStatus.ACTIVE),
  historyLinks: z.array(LineageLinkSchema).default([]),
  creationDate: z.string().optional().nullable(),
  closeDate: z.string().optional().nullable(),
  primaryMission: z.nativeEnum(StructureMission).default(StructureMission.RECHERCHE),
  secondaryMission: z.nativeEnum(StructureMission).optional().nullable(),
  scientificDomains: z.array(z.string()).default([]),
  ercFields: z.array(z.string()).default([]),
  hceresDomain: z.string().optional().nullable(),
  evaluationWave: z.string().optional().nullable(),
  director: z.string().default(''),
  supervisors: z.array(z.string()).default([]),
  institutionCodes: z.string().optional().nullable(),
  doctoralSchools: z.array(z.string()).default([]),
  address: z.string().default(''),
  zipCode: z.string().default(''),
  city: z.string().default(''),
  country: z.string().default('FR'),
  website: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  rorId: z.string().optional().nullable(),
  halCollectionUrl: z.string().optional().nullable(),
  identifiers: StructureIdentifiersSchema,
  signature: z.string().optional().nullable(),
});

// Schémas pour les listes (utilisés lors du fetch Grist)
export const ResearcherListSchema = z.array(ResearcherSchema);
export const StructureListSchema = z.array(StructureSchema);
