import { Researcher, ResearcherStatus, Structure } from '../types';
import { getPoleFromLab } from './mappings';
import { ResearcherListSchema, StructureListSchema } from './schemas';

const GRIST_DOC_ID = import.meta.env.VITE_GRIST_DOC_ID;
const GRIST_API_KEY = import.meta.env.VITE_GRIST_API_KEY;
const GRIST_BASE_URL = '/api/grist'; // Proxy configuré dans vite.config.ts

const RESEARCHERS_CACHE_KEY = 'druid_researchers_cache';
const STRUCTURES_CACHE_KEY = 'druid_structures_cache';
const DOC_UPDATED_AT_KEY = 'druid_grist_updated_at';

// --- Helpers pour la conversion de dates Grist <-> Druid ---

const fromGristDate = (rawDate: any): string => {
  if (!rawDate) return '';
  if (typeof rawDate === 'number') {
    // Grist renvoie parfois un timestamp (secondes)
    try {
      return new Date(rawDate * 1000).toISOString().split('T')[0];
    } catch {
      return '';
    }
  }
  if (typeof rawDate === 'string') {
    const parts = rawDate.split(/[-/]/);
    if (parts.length === 3) {
      // Si c'est au format JJ-MM-AAAA, on convertit en AAAA-MM-JJ
      if (parts[0].length === 2 && parts[2].length === 4) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      return rawDate;
    }
  }
  return String(rawDate);
};

const toGristDate = (date: any): string | null => {
  if (!date || typeof date !== 'string' || !date.includes('-')) {
    return null;
  }
  const parts = date.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    // Convertit AAAA-MM-JJ en JJ-MM-AAAA
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return date;
};

/**
 * Service pour interagir avec le document Grist Collaboratif.
 */
export const GristService = {
  /**
   * Récupère la date de dernière modification du document Grist.
   */
  getDocUpdatedAt: async (): Promise<string> => {
    try {
      const resp = await fetch(`${GRIST_BASE_URL}/docs/${GRIST_DOC_ID}`);
      if (resp.ok) {
        const data = await resp.json();
        return data.updatedAt || '';
      }
    } catch (e) {
      console.warn('Could not fetch Doc info');
    }
    return '';
  },

  /**
   * Récupère la liste des chercheurs depuis Grist et les mappe au format Druid.
   */
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

      // 2. Charger le cache LDAP
      let ldapCache: Record<string, any> = {};
      try {
        const ldapResp = await fetch('/ldap_status_cache.json');
        if (ldapResp.ok) {
          ldapCache = await ldapResp.json();
        }
      } catch (e) {
        console.warn('LDAP cache not found.');
      }

      // 3. Récupérer les établissements
      const etablissementsResp = await fetch(`${GRIST_BASE_URL}/docs/${GRIST_DOC_ID}/tables/Etablissements/records`);
      const etablissementsMap: Record<number, string> = {};
      if (etablissementsResp.ok) {
        const { records } = await etablissementsResp.json();
        records.forEach((r: any) => {
          etablissementsMap[r.id] = r.fields['Employeur'] || `Etab ${r.id}`;
        });
      }

      // 4. Récupérer les chercheurs
      const recordsResp = await fetch(`${GRIST_BASE_URL}/docs/${GRIST_DOC_ID}/tables/Annuaire/records`);
      if (!recordsResp.ok) throw new Error('Erreur Grist');
      const { records } = await recordsResp.json();
      if (!records || records.length === 0) return [];

      // 5. Mapper
      const researchersMapped = records.map((record: any) => {
        const fields = record.fields;
        const uid = fields['uid_dyna'];
        const employeurId = fields['Employeur'];
        const employeurName = (typeof employeurId === 'number') 
          ? (etablissementsMap[employeurId] || `ID: ${employeurId}`)
          : (employeurId || '');

        let finalStatus = ResearcherStatus.EXTERNE;
        if (uid) {
          if (ldapCache[uid]) {
            const ldapEntry = ldapCache[uid];
            const ldapState = typeof ldapEntry === 'string' ? ldapEntry : ldapEntry.etat;
            
            if (ldapState === 'N') {
              finalStatus = ResearcherStatus.INTERNE;
            } else if (ldapState === 'D') {
              finalStatus = ResearcherStatus.DEPART;
            } else {
              finalStatus = ResearcherStatus.EXTERNE;
            }
          } else {
            finalStatus = ResearcherStatus.PARTI;
          }
        }

        const normalizeCivility = (val: string): string => {
          if (!val) return '';
          const v = val.toUpperCase().trim();
          if (v === 'F' || v === 'FEMME' || v.startsWith('MME') || v.startsWith('MLLE') || v.startsWith('MADAME')) return 'F';
          if (v === 'M' || v === 'HOMME' || v.startsWith('M.') || v.startsWith('MONSIEUR') || v.startsWith('MR')) return 'M';
          return v.charAt(0);
        };

        const gristCiv = fields['Civilite'] || fields['Civilité'] || '';
        let ldapCiv = '';
        if (uid && ldapCache[uid] && (ldapCache[uid] as any).civilite) {
          ldapCiv = (ldapCache[uid] as any).civilite;
        }
        
        // Priorité LDAP, sinon Grist
        let researcherCivility = normalizeCivility(ldapCiv || gristCiv);
        
        let researcherBirthDate = fromGristDate(fields['DATE_DE_NAISSANCE_JJ_MM_AAAA']);

        if (uid && ldapCache[uid] && (ldapCache[uid] as any).birthDate) {
          const ldapBirth = (ldapCache[uid] as any).birthDate;
          if (/^\d{8}$/.test(ldapBirth)) {
            researcherBirthDate = `${ldapBirth.substring(0, 4)}-${ldapBirth.substring(4, 6)}-${ldapBirth.substring(6, 8)}`;
          } else {
            researcherBirthDate = ldapBirth;
          }
        }

        return {
          id: `G-${record.id}`,
          uid: uid || '',
          civility: researcherCivility,
          lastName: fields['Nom'] || '',
          firstName: fields['Prenom'] || '',
          displayName: `${fields['Nom']?.toUpperCase()} ${fields['Prenom']}`,
          email: fields['Email'] || '',
          nationality: fields['Nationalite'] || '',
          birthDate: researcherBirthDate,
          status: finalStatus,
          employment: {
            employer: employeurName,
            contractType: fields['TYPE_EMPLOI'] || '',
            grade: fields['Corps_grade'] || '',
            internalTypology: fields['LIB_TYPE_EMPLOI'] || '',
            startDate: fromGristDate(fields['employment_start_date']),
            endDate: fromGristDate(fields['employment_end_date']),
          },
          affiliations: [{
            structureName: fields['LABO'] || '',
            team: fields['N_de_l_equipe_interne_du_theme_ou_de_l_axe_de_rattachement'] || '',
            startDate: fromGristDate(fields['employment_start_date']),
            isPrimary: true
          }],
          groups: [],
          identifiers: {
            orcid: fields['ORCID'] || '',
            idref: fields['IdRef'] || '',
            halId: fields['IdHAL'] || '',
            scopusId: fields['ID_SCOPUS'] || '',
          },
          nuFields: {
            pole: fields['Pole_de_rattac'] || getPoleFromLab(fields['LABO']),
            composante: fields['Composante_de_'],
            location: fields['Localisation_S'],
            doctoralSchool: fields['ED_de_rattache'],
            hdr: fields['HDR'] === 'OUI',
            hdrYear: fields['ANNEE_HDR'],
          },
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

  /**
   * Récupère la liste des structures avec gestion du cache.
   */
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
      const resp = await fetch(`${GRIST_BASE_URL}/docs/${GRIST_DOC_ID}/tables/Structures_nantes/records`);
      if (!resp.ok) throw new Error('Erreur Structures Grist');
      const { records } = await resp.json();
      if (!records || records.length === 0) return [];
      
      const { getTutelleName } = await import('./uaiMapping');

      const structuresMapped = records.map((record: any) => {
        const fields = record.fields;
        const rawTutelles = fields['tutelles'] || '';
        const supervisors = rawTutelles.split('|')
          .map((uai: string) => uai.trim())
          .filter(Boolean)
          .map((uai: string) => getTutelleName(uai));

        return {
          id: `S-${record.id}`,
          trackingId: fields['tracking_id'] || '',
          level: String(fields['level'] || '2'),
          nature: 'PUBLIC',
          type: fields['structure_type'] || '',
          acronym: fields['acronym'] || '',
          officialName: fields['name'] || '',
          description: fields['description'] || '',
          cluster: getPoleFromLab(fields['acronym']) || '',
          code: String(fields['nns'] || ''),
          rnsrId: String(fields['nns'] || ''),
          status: 'ACTIVE',
          historyLinks: [],
          primaryMission: 'RECHERCHE',
          scientificDomains: [],
          ercFields: [],
          director: fields['director'] || '',
          supervisors,
          institutionCodes: rawTutelles,
          doctoralSchools: [],
          address: fields['city_adress'] || '',
          zipCode: String(fields['city_code'] || ''),
          city: fields['city_name'] || '',
          country: 'FR',
          website: fields['web'] || '',
          rorId: String(fields['ror'] || ''),
          halCollectionUrl: fields['collection_hal'] || '',
          identifiers: {
            halStructIds: [],
            idrefId: '',
            scopusId: String(fields['scopus_id'] || ''),
          },
          signature: fields['signature'] || '',
        };
      });

      const validation = StructureListSchema.safeParse(structuresMapped);
      if (!validation.success) {
        console.warn('Zod Validation Warning (Structures):', validation.error.format());
      }
      
      const structures = validation.success ? (validation.data as Structure[]) : (structuresMapped as Structure[]);
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
    const fields = {
      'Nom': researcher.lastName,
      'Prenom': researcher.firstName,
      'Civilite': researcher.civility,
      'uid_dyna': researcher.uid,
      'Email': researcher.email,
      'Nationalite': researcher.nationality,
      'DATE_DE_NAISSANCE_JJ_MM_AAAA': toGristDate(researcher.birthDate),
      'N_de_l_equipe_interne_du_theme_ou_de_l_axe_de_rattachement': researcher.affiliations[0]?.team || '',
      'employment_start_date': toGristDate(researcher.employment.startDate),
      'employment_end_date': toGristDate(researcher.employment.endDate),
      'ORCID': researcher.identifiers.orcid,
      'IdRef': researcher.identifiers.idref,
      'IdHAL': researcher.identifiers.halId,
      'ID_SCOPUS': researcher.identifiers.scopusId
    };

    const resp = await fetch(`${GRIST_BASE_URL}/docs/${GRIST_DOC_ID}/tables/Annuaire/records`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${GRIST_API_KEY}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ records: [{ fields }] })
    });

    if (!resp.ok) throw new Error('Erreur CREATE Grist');
  },

  updateResearcher: async (researcher: Researcher): Promise<void> => {
    const gristId = parseInt(researcher.id.replace('G-', ''));
    if (isNaN(gristId)) throw new Error('ID invalide');

    const fields = {
      'Nom': researcher.lastName,
      'Prenom': researcher.firstName,
      'Civilite': researcher.civility,
      'Email': researcher.email,
      'Nationalite': researcher.nationality,
      'DATE_DE_NAISSANCE_JJ_MM_AAAA': toGristDate(researcher.birthDate),
      'N_de_l_equipe_interne_du_theme_ou_de_l_axe_de_rattachement': researcher.affiliations[0]?.team || '',
      'ORCID': researcher.identifiers.orcid || null,
      'IdRef': researcher.identifiers.idref || null,
      'IdHAL': researcher.identifiers.halId || null,
      'ID_SCOPUS': researcher.identifiers.scopusId || null,
      'employment_start_date': toGristDate(researcher.employment.startDate),
      'employment_end_date': toGristDate(researcher.employment.endDate)
    };

    const resp = await fetch(`${GRIST_BASE_URL}/docs/${GRIST_DOC_ID}/tables/Annuaire/records`, {
      method: 'PATCH',
      headers: { 
        'Authorization': `Bearer ${GRIST_API_KEY}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ records: [{ id: gristId, fields }] })
    });

    if (!resp.ok) throw new Error('Erreur UPDATE Grist');
  },

  updateStructure: async (structure: any): Promise<void> => {
    const gristId = parseInt(structure.id.replace('S-', ''));
    if (isNaN(gristId)) throw new Error('ID invalide');

    const fields = {
      'tracking_id': structure.trackingId,
      'level': structure.level,
      'structure_type': structure.type,
      'acronym': structure.acronym,
      'name': structure.officialName,
      'description': structure.description,
      'nns': structure.rnsrId,
      'tutelles': structure.institutionCodes,
      'city_adress': structure.address,
      'city_code': structure.zipCode,
      'city_name': structure.city,
      'web': structure.website,
      'ror': structure.rorId,
      'collection_hal': structure.halCollectionUrl,
      'scopus_id': structure.identifiers?.scopusId,
      'signature': structure.signature
    };

    const resp = await fetch(`${GRIST_BASE_URL}/docs/${GRIST_DOC_ID}/tables/Structures_nantes/records`, {
      method: 'PATCH',
      headers: { 
        'Authorization': `Bearer ${GRIST_API_KEY}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ records: [{ id: gristId, fields }] })
    });

    if (!resp.ok) throw new Error('Erreur UPDATE Structure Grist');
  }
};
