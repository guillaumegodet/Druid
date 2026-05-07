import { Researcher, ResearcherStatus, Structure } from '../types';
import { ResearcherListSchema, StructureListSchema } from './schemas';

const GRIST_DOC_ID = import.meta.env.VITE_GRIST_DOC_ID;
const GRIST_API_KEY = import.meta.env.VITE_GRIST_API_KEY;
const GRIST_RESEARCHERS_TABLE = import.meta.env.VITE_GRIST_RESEARCHERS_TABLE || 'Annuaire';
const GRIST_STRUCTURES_TABLE = import.meta.env.VITE_GRIST_STRUCTURES_TABLE || 'Structures';
const GRIST_BASE_URL = import.meta.env.VITE_GRIST_BASE_URL || '/api/grist';

const RESEARCHERS_CACHE_KEY = 'druid_researchers_cache';
const STRUCTURES_CACHE_KEY = 'druid_structures_cache';
const DOC_UPDATED_AT_KEY = 'druid_grist_updated_at';

// --- Date helpers ---

const fromGristDate = (rawDate: any): string => {
  if (!rawDate) return '';
  if (typeof rawDate === 'number') {
    try {
      return new Date(rawDate * 1000).toISOString().split('T')[0];
    } catch {
      return '';
    }
  }
  if (typeof rawDate === 'string') {
    const parts = rawDate.split(/[-/]/);
    if (parts.length === 3) {
      if (parts[0].length === 2 && parts[2].length === 4) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      return rawDate;
    }
  }
  return String(rawDate);
};

const toGristDate = (date: any): string | null => {
  if (!date || typeof date !== 'string' || !date.includes('-')) return null;
  const parts = date.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return date;
};

// Map Grist status field or LDAP state to ResearcherStatus
const mapStatus = (gristStatus: string, ldapState?: string): ResearcherStatus => {
  if (ldapState) {
    if (ldapState === 'N') return ResearcherStatus.INTERNE;
    if (ldapState === 'D') return ResearcherStatus.DEPART;
    return ResearcherStatus.EXTERNE;
  }
  const s = (gristStatus || '').toUpperCase();
  if (s === 'INTERNE') return ResearcherStatus.INTERNE;
  if (s === 'DEPART') return ResearcherStatus.DEPART;
  if (s === 'PARTI') return ResearcherStatus.PARTI;
  return ResearcherStatus.EXTERNE;
};

// Build Grist fields object for create/update (column names from standardized schema)
const researcherToGristFields = (r: Researcher) => ({
  last_name: r.lastName,
  first_names: r.firstName,
  gender: r.civility,
  contact_email: r.email,
  nationality: r.nationality || null,
  birthdate: toGristDate(r.birthDate),   
  eppn: r.eppn || null,
  status: r.status,
  main_research_structure: r.affiliations[0]?.structureName || '',
  team: r.affiliations[0]?.team || '',
  membership_start_date: toGristDate(r.affiliations[0]?.startDate),
  membership_end_date: toGristDate(r.affiliations[0]?.endDate ?? r.employment.endDate),
  employment_start_date: toGristDate(r.employment.startDate),
  employment_end_date: toGristDate(r.employment.endDate),
  position: r.employment.grade || null,
  membership_type: r.employment.contractType || null,
  institution_identifier: r.employment.institutionId || null,
  orcid: r.identifiers.orcid || null,
  idref: r.identifiers.idref || null,
  idhals: r.identifiers.halId || null,
  scopus: r.identifiers.scopusId || null,
  hdr: r.extra?.hdr ?? false,
  localisation: r.extra?.location || null,
});

export const GristService = {
  getDocUpdatedAt: async (): Promise<string> => {
    try {
      const resp = await fetch(`${GRIST_BASE_URL}/docs/${GRIST_DOC_ID}`);
      if (resp.ok) {
        const data = await resp.json();
        return data.updatedAt || '';
      }
    } catch {
      console.warn('Could not fetch Grist doc info');
    }
    return '';
  },

  fetchResearchers: async (force = false): Promise<Researcher[]> => {
    try {
      const remoteUpdatedAt = await GristService.getDocUpdatedAt();
      const cachedData = localStorage.getItem(RESEARCHERS_CACHE_KEY);
      const cachedUpdatedAt = localStorage.getItem(DOC_UPDATED_AT_KEY);

      if (!force && cachedData && cachedUpdatedAt === remoteUpdatedAt) {
        console.log('Using cached researchers...');
        return JSON.parse(cachedData);
      }

      console.log('Fetching fresh researchers from Grist...');

      // LDAP cache is optional — enriches status/civility/birthdate when available
      let ldapCache: Record<string, any> = {};
      try {
        const ldapResp = await fetch('/ldap_status_cache.json');
        if (ldapResp.ok) ldapCache = await ldapResp.json();
      } catch {
        // no LDAP cache — non-blocking
      }

      const recordsResp = await fetch(
        `${GRIST_BASE_URL}/docs/${GRIST_DOC_ID}/tables/${GRIST_RESEARCHERS_TABLE}/records`
      );
      if (!recordsResp.ok) throw new Error('Erreur Grist researchers');
      const { records } = await recordsResp.json();
      if (!records || records.length === 0) return [];

      const researchersMapped = records.map((record: any) => {
        const f = record.fields;
        const uid = f['tracking_id'] || '';

        // LDAP enrichment (optional)
        const ldapEntry = uid ? ldapCache[uid] : null;
        const ldapState: string | undefined = ldapEntry
          ? (typeof ldapEntry === 'string' ? ldapEntry : ldapEntry.etat)
          : undefined;

        const status = mapStatus(f['status'] || '', ldapState);

        // Civility: LDAP takes priority, then Grist gender field
        const normCivility = (val: string) => {
          if (!val) return '';
          const v = val.toUpperCase().trim();
          if (v === 'F' || v.startsWith('F') || v.startsWith('MME') || v.startsWith('MADAME')) return 'F';
          if (v === 'M' || v.startsWith('M.') || v.startsWith('MR') || v.startsWith('MONSIEUR')) return 'M';
          return v.charAt(0);
        };
        const ldapCivility = ldapEntry?.civilite || '';
        const civility = normCivility(ldapCivility || f['gender'] || '');

        // Birth date: LDAP takes priority
        let birthDate = fromGristDate(f['birthdate']);   
        if (ldapEntry?.birthDate) {
          const lb = ldapEntry.birthDate;
          if (/^\d{8}$/.test(lb)) {
            birthDate = `${lb.substring(0, 4)}-${lb.substring(4, 6)}-${lb.substring(6, 8)}`;
          } else if (lb) {
            birthDate = lb;
          }
        }

        const ldapEppn: string = ldapEntry?.eppn || '';
        const firstName = f['first_names'] || '';
        const lastName = f['last_name'] || '';

        return {
          id: `G-${record.id}`,
          uid,
          civility,
          lastName,
          firstName,
          displayName: `${lastName.toUpperCase()} ${firstName}`,
          email: f['contact_email'] || '',
          eppn: ldapEppn || f['eppn'] || '',
          nationality: f['nationality'] || '',
          birthDate,
          status,
          employment: {
            employer: f['institution_id_nomenclature'] || f['institution_identifier'] || '',
            institutionId: f['institution_identifier'] || '',
            contractType: f['membership_type'] || '',
            grade: f['position'] || '',
            startDate: fromGristDate(f['employment_start_date']),
            endDate: fromGristDate(f['employment_end_date']),
            ldapFields: [],
          },
          affiliations: [{
            structureName: f['main_research_structure'] || '',
            team: f['team'] || '',
            startDate: fromGristDate(f['membership_start_date']),
            endDate: fromGristDate(f['membership_end_date']) || undefined,
            isPrimary: true,
          }],
          groups: [],
          identifiers: {
            orcid: f['orcid'] || '',
            idref: f['idref'] || '',
            halId: f['idhals'] || f['idhali'] || '',
            scopusId: f['scopus'] || '',
          },
          extra: {
            hdr: f['hdr'] === true || f['hdr'] === 'OUI',
            location: f['localisation'] || '',
          },
          ldapFields: [],
          lastSync: new Date().toISOString().split('T')[0],
        };
      });

      const validation = ResearcherListSchema.safeParse(researchersMapped);
      if (!validation.success) {
        console.warn('Zod Validation Warning (Researchers):', validation.error.format());
      }

      const researchers = validation.success ? validation.data : researchersMapped as Researcher[];
      localStorage.setItem(RESEARCHERS_CACHE_KEY, JSON.stringify(researchers));
      localStorage.setItem(DOC_UPDATED_AT_KEY, remoteUpdatedAt);
      return researchers;
    } catch (error) {
      console.error('Grist Sync Error:', error);
      const cached = localStorage.getItem(RESEARCHERS_CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    }
  },

  fetchStructures: async (force = false): Promise<Structure[]> => {
    try {
      const remoteUpdatedAt = await GristService.getDocUpdatedAt();
      const cachedData = localStorage.getItem(STRUCTURES_CACHE_KEY);
      const cachedUpdatedAt = localStorage.getItem(DOC_UPDATED_AT_KEY);

      if (!force && cachedData && cachedUpdatedAt === remoteUpdatedAt) {
        console.log('Using cached structures...');
        return JSON.parse(cachedData);
      }

      console.log('Fetching fresh structures from Grist...');
      const resp = await fetch(
        `${GRIST_BASE_URL}/docs/${GRIST_DOC_ID}/tables/${GRIST_STRUCTURES_TABLE}/records`
      );
      if (!resp.ok) throw new Error('Erreur Structures Grist');
      const { records } = await resp.json();
      if (!records || records.length === 0) return [];

      const structuresMapped = records.map((record: any) => {
        const f = record.fields;
        const rawTutelles = f['tutelles'] || f['supervisors'] || '';
        const supervisors = rawTutelles
          .split('|')
          .map((s: string) => s.trim())
          .filter(Boolean);

        return {
          id: `S-${record.id}`,
          trackingId: f['tracking_id'] || '',
          level: String(f['level'] || '2'),
          nature: 'PUBLIC',
          type: f['structure_type'] || f['type'] || '',
          acronym: f['acronym'] || '',
          officialName: f['name'] || f['officialName'] || '',
          description: f['description'] || '',
          cluster: '',
          code: String(f['nns'] || f['code'] || ''),
          rnsrId: String(f['nns'] || f['rnsr_id'] || ''),
          status: 'ACTIVE',
          historyLinks: [],
          primaryMission: 'RECHERCHE',
          scientificDomains: [],
          ercFields: [],
          director: f['director'] || '',
          supervisors,
          institutionCodes: rawTutelles,
          doctoralSchools: [],
          address: f['city_adress'] || f['address'] || '',
          zipCode: String(f['city_code'] || f['zip_code'] || ''),
          city: f['city_name'] || f['city'] || '',
          country: f['country'] || 'FR',
          website: f['web'] || f['website'] || '',
          rorId: String(f['ror'] || f['ror_id'] || ''),
          halCollectionUrl: f['collection_hal'] || '',
          identifiers: {
            halStructIds: [],
            idrefId: '',
            scopusId: String(f['scopus_id'] || ''),
          },
          signature: f['signature'] || '',
        };
      });

      const validation = StructureListSchema.safeParse(structuresMapped);
      if (!validation.success) {
        console.warn('Zod Validation Warning (Structures):', validation.error.format());
      }

      const structures = validation.success
        ? (validation.data as Structure[])
        : (structuresMapped as Structure[]);
      localStorage.setItem(STRUCTURES_CACHE_KEY, JSON.stringify(structures));
      localStorage.setItem(DOC_UPDATED_AT_KEY, remoteUpdatedAt);
      return structures;
    } catch (error) {
      console.error('Grist Structures Sync Error:', error);
      const cached = localStorage.getItem(STRUCTURES_CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    }
  },

  createResearcher: async (researcher: Researcher): Promise<void> => {
    const resp = await fetch(
      `${GRIST_BASE_URL}/docs/${GRIST_DOC_ID}/tables/${GRIST_RESEARCHERS_TABLE}/records`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GRIST_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ records: [{ fields: researcherToGristFields(researcher) }] }),
      }
    );
    if (!resp.ok) throw new Error('Erreur CREATE Grist');
  },

  updateResearcher: async (researcher: Researcher): Promise<void> => {
    const gristId = parseInt(researcher.id.replace('G-', ''));
    if (isNaN(gristId)) throw new Error('ID invalide');

    const resp = await fetch(
      `${GRIST_BASE_URL}/docs/${GRIST_DOC_ID}/tables/${GRIST_RESEARCHERS_TABLE}/records`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${GRIST_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          records: [{ id: gristId, fields: researcherToGristFields(researcher) }],
        }),
      }
    );
    if (!resp.ok) throw new Error('Erreur UPDATE Grist');
  },

  updateStructure: async (structure: any): Promise<void> => {
    const gristId = parseInt(structure.id.replace('S-', ''));
    if (isNaN(gristId)) throw new Error('ID invalide');

    const fields = {
      tracking_id: structure.trackingId,
      level: structure.level,
      structure_type: structure.type,
      acronym: structure.acronym,
      name: structure.officialName,
      description: structure.description,
      nns: structure.rnsrId,
      tutelles: structure.institutionCodes,
      city_adress: structure.address,
      city_code: structure.zipCode,
      city_name: structure.city,
      web: structure.website,
      ror: structure.rorId,
      collection_hal: structure.halCollectionUrl,
      scopus_id: structure.identifiers?.scopusId,
      signature: structure.signature,
    };

    const resp = await fetch(
      `${GRIST_BASE_URL}/docs/${GRIST_DOC_ID}/tables/${GRIST_STRUCTURES_TABLE}/records`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${GRIST_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ records: [{ id: gristId, fields }] }),
      }
    );
    if (!resp.ok) throw new Error('Erreur UPDATE Structure Grist');
  },
};
