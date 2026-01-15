
import { Researcher, ResearcherStatus, Structure, SyncOption, StructureLevel, StructureStatus, StructureNature, StructureMission, LineageType, Group } from './types';

export const MOCK_RESEARCHERS: Researcher[] = [
  {
    id: 'R001',
    uid: 'u12345',
    civility: 'M.',
    firstName: 'Jean',
    lastName: 'Dupont',
    birthName: 'Dupont',
    birthDate: '1980-05-15',
    nationality: 'Française',
    displayName: 'Dupont, Jean',
    email: 'jean.dupont@univ-example.fr',
    secondaryEmail: 'j.dupont@gmail.com',
    phone: '+33 4 91 23 45 67',
    status: ResearcherStatus.VALIDATED,
    employment: {
      employer: 'Université',
      contractType: 'Titulaire',
      grade: 'Professeur des Universités',
      internalTypology: 'Enseignant-chercheur',
      cnu: '27',
      startDate: '2010-09-01'
    },
    affiliations: [
      {
        structureName: 'LIF',
        team: 'Algorithmique',
        startDate: '2010-09-01',
        endDate: '2017-12-31',
        isPrimary: false
      },
      {
        structureName: 'LIS',
        team: 'Algorithmique & Graphes',
        startDate: '2018-01-01',
        isPrimary: true
      }
    ],
    groups: ['Conseil Scientifique', 'Pilotes Open Science'],
    identifiers: {
      orcid: '0000-0001-2345-6789',
      idref: '123456789',
      halId: 'jean-dupont',
    },
    lastSync: '2023-10-25',
  },
  {
    id: 'R002',
    civility: 'Mme',
    firstName: 'Alice',
    lastName: 'Martin',
    displayName: 'Martin, Alice',
    email: 'alice.martin@external.org',
    status: ResearcherStatus.NON_VALIDATED,
    employment: {
      employer: 'CNRS',
      contractType: 'Contractuel',
      grade: 'Chargé de Recherche',
      internalTypology: 'Chercheur',
      cnu: '30',
      startDate: '2020-01-01'
    },
    affiliations: [
       {
        structureName: 'CEREGE',
        team: 'Climat',
        startDate: '2020-01-01',
        isPrimary: true
      }
    ],
    groups: [],
    identifiers: {},
    lastSync: '-',
  },
  {
    id: 'R003',
    uid: 'u67890',
    civility: 'Mme',
    firstName: 'Marie',
    lastName: 'Curie',
    birthName: 'Sklodowska',
    birthDate: '1867-11-07',
    nationality: 'Polonaise / Française',
    displayName: 'Curie, Marie',
    email: 'marie.curie@univ-example.fr',
    status: ResearcherStatus.LEFT,
    employment: {
      employer: 'Université',
      contractType: 'Titulaire',
      grade: 'Professeur',
      internalTypology: 'Enseignant-chercheur',
      startDate: '1906-05-01',
      endDate: '1934-07-04'
    },
    affiliations: [
      {
        structureName: 'Institut du Radium',
        team: 'Radioactivité',
        startDate: '1909-01-01',
        endDate: '1934-07-04',
        isPrimary: true
      }
    ],
    groups: ['Anciens Membres'],
    identifiers: {
      idref: '987654321',
    },
    lastSync: '2023-10-26',
  },
  {
    id: 'R004',
    civility: '',
    firstName: 'A.',
    lastName: 'Martin',
    displayName: 'A. Martin',
    email: '-',
    status: ResearcherStatus.NON_VALIDATED,
    employment: {
      employer: 'Unknown',
      internalTypology: 'Doctorant',
    },
    affiliations: [
      {
        structureName: 'Unknown',
        team: '-',
        startDate: '',
        isPrimary: true
      }
    ],
    groups: [],
    identifiers: {},
    lastSync: '-',
  },
  {
    id: 'R005',
    uid: 'u99999',
    civility: 'M.',
    firstName: 'Alan',
    lastName: 'Turing',
    birthDate: '1912-06-23',
    nationality: 'Britannique',
    displayName: 'Turing, Alan',
    email: 'alan.turing@univ-example.fr',
    status: ResearcherStatus.ANTICIPATED,
    employment: {
       employer: 'CNRS',
       contractType: 'Invité',
       grade: 'Directeur de Recherche',
       internalTypology: 'Chercheur',
       cnu: '27',
       startDate: '2024-01-01'
    },
    affiliations: [
      {
        structureName: 'LIS',
        team: 'IA & Logique',
        startDate: '2024-01-01',
        isPrimary: true
      }
    ],
    groups: ['Recrutements 2024'],
    identifiers: {
        orcid: '0000-0002-1234-5678'
    },
    lastSync: '-',
  },
];

export const MOCK_STRUCTURES: Structure[] = [
  // ÉTABLISSEMENT
  {
    id: 'S000',
    trackingId: 'ETAB-044',
    level: StructureLevel.ETABLISSEMENT,
    status: StructureStatus.ACTIVE,
    nature: StructureNature.PUBLIC,
    acronym: 'NU',
    officialName: 'Nantes Université',
    description: 'Établissement public expérimental d’enseignement supérieur et de recherche.',
    type: 'EPE',
    code: '044',
    rnsrId: '202223456A',
    siren: '130029747',
    rorId: '04z8jg214',
    director: 'Carine Bernault',
    supervisors: [],
    doctoralSchools: [],
    primaryMission: StructureMission.RECHERCHE,
    scientificDomains: ['Pluridisciplinaire'],
    ercFields: [],
    address: '1 Quai de Tourville',
    zipCode: '44000',
    city: 'Nantes',
    country: 'France',
    website: 'https://www.univ-nantes.fr',
    email: 'contact@univ-nantes.fr',
    identifiers: {
      idrefId: '026396486',
    },
    historyLinks: [],
    creationDate: '2022-01-01'
  },
  // STRUCTURE INTERMÉDIAIRE
  {
    id: 'S_INT_01',
    trackingId: 'POLE-SCI',
    level: StructureLevel.INTERMEDIAIRE,
    status: StructureStatus.ACTIVE,
    nature: StructureNature.PUBLIC,
    acronym: 'Pôle Sciences',
    officialName: 'Pôle Sciences et Technologie',
    type: 'Pôle',
    code: 'P01',
    rnsrId: '',
    cluster: 'Nantes Université',
    director: 'Prof. Science',
    supervisors: ['Nantes Université'],
    doctoralSchools: [],
    primaryMission: StructureMission.SERVICES_ADMINISTRATIFS,
    scientificDomains: ['Sciences Fondamentales'],
    ercFields: [],
    address: '2 rue de la Houssinière',
    zipCode: '44300',
    city: 'Nantes',
    country: 'France',
    identifiers: {},
    historyLinks: [],
    creationDate: '2022-01-01'
  },
  // UNITÉ DE RECHERCHE
  {
    id: 'S001',
    trackingId: 'U7020_1',
    level: StructureLevel.ENTITE,
    status: StructureStatus.ACTIVE,
    nature: StructureNature.MIXTE,
    acronym: 'LIS',
    officialName: 'Laboratoire d\'Informatique et Systèmes',
    description: 'Le LIS est une Unité Mixte de Recherche qui rassemble les activités de recherche en informatique et en automatique.',
    type: 'UMR',
    code: '7020',
    rnsrId: '201822446V',
    rnestId: 'STR-001',
    rorId: '00z0af360',
    cluster: 'Pôle Sciences',
    director: 'Prof. Ada Lovelace',
    supervisors: ['CNRS', 'Aix-Marseille Université', 'Université de Toulon'],
    institutionCodes: '130015506|0131843H',
    doctoralSchools: ['ED 184 - Maths Info', 'ED 548 - Mer et Sciences'],
    
    primaryMission: StructureMission.RECHERCHE,
    scientificDomains: ['Informatique', 'Automatique', 'Signal'],
    ercFields: ['PE6_10', 'PE6_11'],
    hceresDomain: 'ST6',
    evaluationWave: 'Vague C',

    address: 'Campus de Saint-Jérôme, Avenue Escadrille Normandie-Niemen',
    zipCode: '13397',
    city: 'Marseille',
    country: 'France',
    website: 'https://www.lis-lab.fr',
    halCollectionUrl: 'https://hal.archives-ouvertes.fr/LIS',
    email: 'contact@lis-lab.fr',
    phone: '+33 4 91 28 00 00',
    identifiers: {
      halStructIds: ['123456', '987654'],
      idrefId: '026359874',
      scopusId: '60028048'
    },
    historyLinks: [
       { relatedStructureId: 'OLD-001', relatedStructureName: 'LIF (Laboratoire Informatique Fondamentale)', type: LineageType.FUSION, date: '2018-01-01' },
       { relatedStructureId: 'OLD-002', relatedStructureName: 'LSIS', type: LineageType.FUSION, date: '2018-01-01' }
    ],
    signature: 'Aix Marseille Univ, Université de Toulon, CNRS, LIS, Marseille, France',
    creationDate: '2018-01-01'
  },
  {
    id: 'S002',
    trackingId: 'U7330_2',
    level: StructureLevel.ENTITE,
    status: StructureStatus.ACTIVE,
    nature: StructureNature.MIXTE,
    acronym: 'CEREGE',
    officialName: 'Centre Européen de Recherche et d’Enseignement des Géosciences de l’Environnement',
    type: 'UMR',
    code: '7330',
    rnsrId: '199512067E',
    rnestId: 'STR-002',
    cluster: 'Pôle Environnement',
    director: 'Dr. Jane Goodall',
    supervisors: ['CNRS', 'AMU', 'IRD', 'INRAE', 'Collège de France'],
    doctoralSchools: ['ED 251 - Sciences de l\'Environnement'],
    
    primaryMission: StructureMission.RECHERCHE,
    scientificDomains: ['Géosciences', 'Environnement', 'Climat'],
    ercFields: ['PE10'],
    evaluationWave: 'Vague C',

    address: 'Europole de l\'Arbois, BP 80',
    zipCode: '13545',
    city: 'Aix-en-Provence',
    country: 'France',
    website: 'https://www.cerege.fr',
    email: 'direction@cerege.fr',
    phone: '+33 4 42 97 15 00',
    identifiers: {
      halStructIds: ['789012'],
    },
    historyLinks: [],
    creationDate: '1995-01-01'
  },
  // ÉQUIPE
  {
    id: 'S_TEAM_01',
    trackingId: 'TEAM-TAL',
    level: StructureLevel.EQUIPE,
    status: StructureStatus.ACTIVE,
    nature: StructureNature.PUBLIC,
    acronym: 'TAL',
    officialName: 'Traitement Automatique du Langage',
    type: 'Equipe',
    code: 'E01',
    rnsrId: '',
    cluster: 'LIS', // Rattachement au labo
    director: 'Dr. Noam Chomsky',
    supervisors: ['CNRS', 'AMU'],
    doctoralSchools: [],
    primaryMission: StructureMission.RECHERCHE,
    scientificDomains: ['Linguistique', 'IA'],
    ercFields: ['PE6'],
    address: 'Campus St Jérôme',
    zipCode: '13013',
    city: 'Marseille',
    country: 'France',
    identifiers: {
        halStructIds: ['556677']
    },
    historyLinks: [],
    creationDate: '2019-01-01'
  },
  {
    id: 'S003',
    trackingId: 'PROJ-001',
    level: StructureLevel.ENTITE,
    status: StructureStatus.PROJET,
    nature: StructureNature.PUBLIC,
    acronym: 'IA-LAB',
    officialName: 'Institut d\'Intelligence Artificielle',
    type: 'UPR',
    code: 'PROJ-AI',
    rnsrId: '',
    director: '', // Pas de directeur car statut Projet
    supervisors: ['Université'],
    doctoralSchools: [],
    primaryMission: StructureMission.RECHERCHE,
    scientificDomains: ['IA', 'Data Science'],
    ercFields: [],
    address: 'To be defined',
    zipCode: '',
    city: 'Marseille',
    country: 'France',
    identifiers: {},
    historyLinks: [],
    creationDate: '2025-01-01' // Futur
  }
];

export const MOCK_GROUPS: Group[] = [
  { name: 'Conseil Scientifique', sympaEmail: 'cs-labo@univ.fr' },
  { name: 'Pilotes Open Science', sympaEmail: 'open-science@univ.fr' },
  { name: 'Anciens Membres' }, // Pas d'email configuré
];

export const SYNC_SOURCES: SyncOption[] = [
  { id: 'LDAP', label: 'LDAP Université' },
  { id: 'RESEDA', label: 'RESEDA (CNRS)' },
  { id: 'ORCID', label: 'ORCID' },
  { id: 'IDREF', label: 'IdRef (ABES)' },
  { id: 'SCOPUS', label: 'Scopus' },
  { id: 'AUREHAL', label: 'AuréHAL' },
];
