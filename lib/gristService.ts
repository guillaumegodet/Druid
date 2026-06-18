import { Researcher, ResearcherStatus, Structure, Membership } from '../types';
import { ResearcherListSchema, StructureListSchema } from './schemas';
import { parseValidation, resolveStatus, validationToGristFields } from './validation';

const GRIST_DOC_ID = import.meta.env.VITE_GRIST_DOC_ID;
const GRIST_API_KEY = import.meta.env.VITE_GRIST_API_KEY;
const GRIST_RESEARCHERS_TABLE = import.meta.env.VITE_GRIST_RESEARCHERS_TABLE || 'Annuaire';
const GRIST_STRUCTURES_TABLE = import.meta.env.VITE_GRIST_STRUCTURES_TABLE || 'Structures';
const GRIST_BASE_URL = import.meta.env.VITE_GRIST_BASE_URL || '/api/grist';

const RESEARCHERS_CACHE_KEY = 'druid_researchers_cache';
const STRUCTURES_CACHE_KEY = 'druid_structures_cache';
const DOC_UPDATED_AT_KEY = 'druid_grist_updated_at';

// --- Date helpers ---

export const fromGristDate = (rawDate: any): string => {
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

export const toGristDate = (date: any): string | null => {
  if (!date || typeof date !== 'string' || !date.includes('-')) return null;
  const parts = date.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return date;
};

/** Maps a Grist status string or an LDAP dynaEtat code to a ResearcherStatus. */
export const mapStatus = (gristStatus: string, ldapState?: string): ResearcherStatus => {
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

/** Normalises a raw civility string (LDAP or Grist) to 'M', 'F', or the first character. */
export const normCivility = (val: string): string => {
  if (!val) return '';
  const v = val.toUpperCase().trim();
  if (v === 'F' || v.startsWith('F') || v.startsWith('MME') || v.startsWith('MADAME')) return 'F';
  if (v === 'M' || v.startsWith('M.') || v.startsWith('MR') || v.startsWith('MONSIEUR')) return 'M';
  return v.charAt(0);
};

/** Builds the Grist fields object for create/update (column names match the standardized Grist schema). */
export const researcherToGristFields = (r: Researcher) => ({
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
  // Couche de fiabilisation (statut/rattachement validés) — colonnes dédiées.
  ...validationToGristFields(r.validation, toGristDate),
});

// --- Helpers pour le format de la table Structures V2 (= structures.csv CRISalid) ---

/** Décode un champ multi-libellé V2 `Valeur[fr]|Autre[en]` (langue préférée, sinon 1re). */
const parseMultiLabel = (raw: any, preferLang = 'fr'): string => {
  if (!raw || typeof raw !== 'string') return '';
  const parts = raw.split('|').map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return '';
  const parsed = parts.map((p) => {
    const m = p.match(/^(.*?)\s*\[([a-zA-Z]{2})\]\s*$/);
    return m ? { value: m[1].trim(), lang: m[2].toLowerCase() } : { value: p, lang: '' };
  });
  const preferred = parsed.find((p) => p.lang === preferLang);
  return (preferred || parsed[0]).value;
};

/** Ré-encode une valeur simple au format multi-libellé V2 (`Valeur[fr]`). */
const encodeMultiLabel = (value: any, lang = 'fr'): string => {
  const v = value === null || value === undefined ? '' : String(value).trim();
  return v ? `${v}[${lang}]` : '';
};

/**
 * Dérive le niveau (StructureLevel) depuis generic_type + type V2 :
 *   établissement (4) : generic_type=institution, ou type EPE/GE/EPST
 *   intermédiaire (3) : UFR, POLE
 *   équipe (1)        : ER
 *   unité (2)         : UMR, UR, … (défaut)
 */
const deriveStructureLevel = (genericType: any, type?: any): string => {
  const gt = String(genericType || '').toLowerCase();
  const t = String(type || '').toUpperCase();
  if (gt === 'institution' || t === 'EPE' || t === 'GE' || t === 'EPST') return '4';
  if (t === 'ER') return '1';
  if (t === 'UFR' || t === 'POLE') return '3';
  return '2';
};

/** `YYYYMMDD` -> `YYYY-MM-DD` (vide si invalide). */
const compactToIso = (d: any): string => {
  const s = String(d || '');
  return /^\d{8}$/.test(s) ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : '';
};
/** `YYYY-MM-DD` -> `YYYYMMDD` (vide si invalide). */
const isoToCompact = (d: any): string => {
  const s = String(d || '');
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s.replace(/-/g, '') : '';
};

const SUPERVISION_CODES = new Set([
  'main_supervision', 'associated_supervision', 'participating_supervision',
]);

/**
 * Décode une colonne d'appartenance (`inclusions` ou `participations`) en Membership[].
 * Grammaire : `<refType>-<ref>[<supervision>]?[<YYYYMMDD>-<YYYYMMDD>?]?`
 * (un local_id nu sans préfixe est traité comme `local`).
 */
const parseMembershipList = (raw: any): Membership[] => {
  if (!raw || typeof raw !== 'string') return [];
  return raw.split('|').map((p) => p.trim()).filter(Boolean).map((entry): Membership => {
    const refPart = entry.split('[')[0].trim();
    const m = refPart.match(/^(local|uai|ror)-(.+)$/i);
    const refType = (m ? m[1].toLowerCase() : 'local') as Membership['refType'];
    const ref = m ? m[2] : refPart;
    let supervision: Membership['supervision'] = '';
    let startDate = '';
    let endDate = '';
    const brackets = entry.match(/\[([^\]]*)\]/g) || [];
    for (const b of brackets) {
      const inner = b.slice(1, -1).trim();
      if (SUPERVISION_CODES.has(inner)) {
        supervision = inner as Membership['supervision'];
      } else {
        const dm = inner.match(/^(\d{8})?-(\d{8})?$/);
        if (dm) { startDate = compactToIso(dm[1] || ''); endDate = compactToIso(dm[2] || ''); }
      }
    }
    return { refType, ref, supervision, startDate, endDate };
  });
};

/** Ré-encode un Membership[] vers la colonne `inclusions`/`participations`. */
const serializeMembershipList = (list: any): string => {
  if (!Array.isArray(list)) return '';
  return list.filter((m: any) => m && m.ref).map((m: any) => {
    let out = `${m.refType || 'local'}-${String(m.ref).trim()}`;
    if (m.supervision) out += `[${m.supervision}]`;
    const start = isoToCompact(m.startDate) || '20000101';
    const end = isoToCompact(m.endDate);
    out += `[${start}-${end}]`;
    return out;
  }).join('|');
};

/** V2 `main_mission` (texte) -> StructureMission Druid. */
const missionFromV2 = (raw: any): string => {
  const v = String(raw || '').toLowerCase();
  if (v.includes('scient')) return 'SERVICES_SCIENTIFIQUES';
  if (v.includes('admin')) return 'SERVICES_ADMINISTRATIFS';
  return 'RECHERCHE';
};
/** StructureMission Druid -> valeur texte V2. */
const missionToV2 = (mission: any): string => {
  switch (mission) {
    case 'SERVICES_SCIENTIFIQUES': return 'scientific_services';
    case 'SERVICES_ADMINISTRATIFS': return 'administrative_services';
    case 'RECHERCHE': return 'research';
    default: return '';
  }
};

// --- Alignement IdRef (démo statique) ---
// Sur la démo GitHub Pages il n'y a pas de backend : le navigateur ne peut pas interroger
// www.idref.fr (CORS) ni lancer le script de moissonnage. On livre donc un cache d'exemple
// pré-calculé (public/idref_align_cache.json) et computeIdrefDiff le compare aux chercheurs
// déjà chargés depuis Grist. L'écriture (« Appliquer ») est simulée côté client (cf. App.tsx),
// la table Grist de démo étant en lecture seule.

export interface IdrefCandidate {
  ppn: string;
  fullName: string;
  job?: string;
  birth?: string;
  death?: string;
  description?: string;
  orcid?: string;
  idhal?: string;
  isni?: string;
  gender?: string | null;
}

/** Proposition d'écriture d'un identifiant (cellule vide uniquement). */
export interface IdrefFieldProposal {
  field: 'IdRef' | 'ORCID' | 'IdHAL';
  label: string;
  after: string;
}

export interface IdrefDiff {
  generatedAt: string;
  mode: 'search' | 'verify';
  stats: {
    cacheTotal: number;
    gristTotal: number;
    aRenseigner: number;
    ambigus: number;
    aEnrichir: number;
    aArbitrer: number;
    conflits: number;
    nonTrouves: number;
  };
  /** search : IdRef vide + un seul candidat → on propose IdRef (+ ORCID/IdHAL si vides) */
  aRenseigner: { id: string; uid: string; displayName: string; labo: string; candidate: IdrefCandidate; proposals: IdrefFieldProposal[] }[];
  /** search : plusieurs candidats → l'utilisateur arbitre */
  ambigus: { id: string; uid: string; displayName: string; labo: string; candidates: IdrefCandidate[] }[];
  /** verify : notice relue, nom concordant, ORCID/IdHAL absents → enrichissement sûr */
  aEnrichir: { id: string; uid: string; displayName: string; labo: string; ppn: string; candidate: IdrefCandidate; proposals: IdrefFieldProposal[] }[];
  /** verify : écart de nom → atelier d'arbitrage (confirmer = même personne / détacher = mauvais IdRef).
   *  suspect = aucun token de nom partagé. */
  aArbitrer: { id: string; uid: string; displayName: string; ppn: string; notice: IdrefCandidate; grist: { orcid: string; idhal: string }; proposals: IdrefFieldProposal[]; suspect: boolean }[];
  /** info : valeur ≠ notice (nom concordant), ou notice illisible — jamais écrasé */
  conflits: { id: string; uid: string; displayName: string; reason: string; detail: string; ppn?: string }[];
  /** info : aucun candidat trouvé */
  nonTrouves: { uid: string; displayName: string }[];
}

/** Une écriture concrète décidée par l'UI : champs → valeur. */
export interface IdrefUpdate {
  id: string;
  uid: string;
  displayName: string;
  fields: Record<string, string>; // ex. { IdRef: '028736036', ORCID: '0000-...' }
}

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

        // Statut dérivé (LDAP/Grist) puis surcouche de validation manuelle
        // (prime sur le dérivé, ne masque pas l'enregistrement de la source).
        const derivedStatus = mapStatus(f['status'] || '', ldapState);
        const validation = parseValidation(f, fromGristDate);
        const status = resolveStatus(validation, derivedStatus);

        // Civility: LDAP takes priority, then Grist gender field
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
            // L'employeur = institution_identifier (ex. DEMO-UNIV). institution_id_nomenclature
            // est la nomenclature de l'identifiant (ex. « local »), pas l'employeur.
            employer: f['institution_identifier'] || '',
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
          validation,
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

      // Carte local_id -> acronyme (résolution des réfs `local-` en libellés lisibles).
      const acronymByLid: Record<string, string> = {};
      records.forEach((rec: any) => {
        const lid = String(rec.fields['local_id'] || '');
        if (lid) acronymByLid[lid] = parseMultiLabel(rec.fields['short_labels']) || lid;
      });

      const structuresMapped = records.map((record: any) => {
        const f = record.fields;
        const inclusions = parseMembershipList(f['inclusions']);
        const participations = parseMembershipList(f['participations']);
        const acronym = parseMultiLabel(f['short_labels']) || f['acronym'] || '';

        // Tutelles (pour la colonne « Tutelles » de la liste) = participations à code
        // de supervision, résolues en libellés ; les participations faibles (pôles) en sont exclues.
        const resolve = (m: Membership): string => {
          if (m.refType === 'uai') return `UAI ${m.ref}`;
          if (m.refType === 'ror') return `ROR ${m.ref}`;
          return acronymByLid[String(m.ref)] || m.ref;
        };
        const supervisors = participations.filter((m) => m.supervision).map(resolve);
        const institutionCodes = participations
          .filter((m) => m.supervision)
          .map((m) => `${m.refType}-${m.ref}`)
          .join('|');

        return {
          id: `S-${record.id}`,
          localId: String(f['local_id'] || ''),
          trackingId: String(f['tracking_id'] || ''),
          inclusions,
          participations,
          level: deriveStructureLevel(f['generic_type'], f['type']),
          nature: 'PUBLIC',
          type: f['type'] || f['structure_type'] || '',
          acronym,
          officialName: parseMultiLabel(f['long_labels']) || f['name'] || '',
          description: parseMultiLabel(f['descriptions']) || f['description'] || '',
          cluster: '',
          code: String(f['nns'] || f['code'] || ''),
          rnsrId: String(f['nns'] || f['rnsr_id'] || ''),
          status: 'ACTIVE',
          historyLinks: [],
          primaryMission: missionFromV2(f['main_mission']),
          secondaryMission: f['secondary_missions'] ? missionFromV2(f['secondary_missions']) : undefined,
          scientificDomains: [],
          ercFields: [],
          director: f['director'] || '',
          supervisors,
          institutionCodes,
          doctoralSchools: [],
          address: f['city_adress'] || f['address'] || '',
          zipCode: String(f['city_code'] || f['zip_code'] || ''),
          city: f['city_name'] || f['city'] || '',
          country: f['country'] || 'FR',
          website: f['web'] || f['website'] || '',
          rorId: String(f['ror'] || f['ror_id'] || ''),
          halCollectionUrl: f['hal_collection'] || f['collection_hal'] || '',
          identifiers: {
            halStructIds: [],
            idrefId: '',
            scopusId: String(f['scopus'] || f['scopus_id'] || ''),
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

    // Écriture vers la table Structures V2 (= structures.csv CRISalid). Les colonnes
    // sans équivalent V2 (adresse, directeur, statut, niveau dérivé) ne sont pas réinjectées.
    const fields = {
      type: structure.type,
      short_labels: encodeMultiLabel(structure.acronym),
      long_labels: encodeMultiLabel(structure.officialName),
      descriptions: encodeMultiLabel(structure.description),
      nns: structure.rnsrId,
      // Appartenances : ré-encodage des deux familles.
      inclusions: serializeMembershipList(structure.inclusions),
      participations: serializeMembershipList(structure.participations),
      main_mission: missionToV2(structure.primaryMission),
      web: structure.website,
      ror: structure.rorId,
      hal_collection: structure.halCollectionUrl,
      scopus: structure.identifiers?.scopusId,
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

  /**
   * LECTURE SEULE : compare le cache d'alignement IdRef (public/idref_align_cache.json,
   * clé = tracking_id) aux chercheurs déjà chargés. Classe selon le mode :
   *  - search : aRenseigner (1 candidat, IdRef vide), ambigus (>1), nonTrouves (0)
   *  - verify : aEnrichir (ORCID/IdHAL absents), aArbitrer (écart de nom), conflits
   * Ne propose JAMAIS d'écraser une valeur non vide. Sur la démo statique le cache est fictif.
   */
  computeIdrefDiff: async (mode: 'search' | 'verify', researchers: Researcher[]): Promise<IdrefDiff> => {
    let cache: Record<string, any> = {};
    try {
      const r = await fetch(`${import.meta.env.BASE_URL}idref_align_cache.json`, { cache: 'no-store' });
      if (r.ok) cache = await r.json();
    } catch (e) { console.warn('Cache IdRef introuvable'); }

    const byUid: Record<string, Researcher> = {};
    for (const r of researchers) { if (r.uid && !byUid[r.uid]) byUid[r.uid] = r; }

    // Comparaisons tolérantes (PPN sur chiffres+X, ORCID/IdHAL sur trim/lower).
    const ppnDigits = (v: any) => String(v || '').match(/([0-9]{6,}[0-9X])/i)?.[1]?.toUpperCase() || '';
    const norm = (v: any) => String(v || '').trim().toLowerCase();

    const aRenseigner: IdrefDiff['aRenseigner'] = [];
    const ambigus: IdrefDiff['ambigus'] = [];
    const aEnrichir: IdrefDiff['aEnrichir'] = [];
    const aArbitrer: IdrefDiff['aArbitrer'] = [];
    const conflits: IdrefDiff['conflits'] = [];
    const nonTrouves: IdrefDiff['nonTrouves'] = [];

    // Deux noms partagent-ils au moins un token significatif (≥3 lettres) ? Sinon « suspect ».
    const deburr = (s: string) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const tokens = (s: string) => new Set(deburr(s).split(/[^a-z]+/).filter((t) => t.length >= 3));
    const shareToken = (a: string, b: string) => {
      const ta = tokens(a); const tb = tokens(b);
      for (const t of ta) if (tb.has(t)) return true;
      return false;
    };

    // Cellules courantes du chercheur (modèle), mappées vers les libellés IdRef/ORCID/IdHAL.
    const cellsOf = (r: Researcher) => ({
      IdRef: r.identifiers?.idref || '',
      ORCID: r.identifiers?.orcid || '',
      IdHAL: r.identifiers?.halId || '',
    });

    // proposals (cellules vides) + conflits (cellules ≠) pour un candidat donné.
    const compare = (cells: { IdRef: string; ORCID: string; IdHAL: string }, cand: IdrefCandidate) => {
      const proposals: IdrefFieldProposal[] = [];
      const localConflicts: string[] = [];
      const fields: { field: IdrefFieldProposal['field']; label: string; cand: string; cur: string; eq: boolean }[] = [
        { field: 'IdRef', label: 'IdRef', cand: cand.ppn || '', cur: cells.IdRef, eq: ppnDigits(cand.ppn) === ppnDigits(cells.IdRef) },
        { field: 'ORCID', label: 'ORCID', cand: cand.orcid || '', cur: cells.ORCID, eq: norm(cand.orcid) === norm(cells.ORCID) },
        { field: 'IdHAL', label: 'IdHAL', cand: cand.idhal || '', cur: cells.IdHAL, eq: norm(cand.idhal) === norm(cells.IdHAL) },
      ];
      for (const x of fields) {
        if (!x.cand) continue;
        if (!String(x.cur).trim()) proposals.push({ field: x.field, label: x.label, after: x.cand });
        else if (!x.eq) localConflicts.push(`${x.label}: Grist «${x.cur}» ≠ notice «${x.cand}»`);
      }
      return { proposals, localConflicts };
    };

    let cacheTotal = 0;
    for (const [uid, raw] of Object.entries(cache)) {
      const entry: any = raw;
      if (entry.mode !== mode) continue;       // vue par mode (le cache contient les deux)
      cacheTotal++;
      const rec = byUid[uid];
      if (!rec) continue;                       // entrée de cache sans fiche (uid disparu)
      const cells = cellsOf(rec);
      const id = rec.id;
      const displayName = entry.queryName || rec.displayName;
      const labo = rec.affiliations?.[0]?.structureName || '';

      if (mode === 'search') {
        if (entry.status === 'not_found' || !entry.candidates?.length) {
          nonTrouves.push({ uid, displayName });
        } else if (entry.status === 'ambiguous' || entry.candidates.length > 1) {
          ambigus.push({ id, uid, displayName, labo, candidates: entry.candidates });
        } else {
          const cand: IdrefCandidate = entry.candidates[0];
          const { proposals, localConflicts } = compare(cells, cand);
          if (proposals.length) aRenseigner.push({ id, uid, displayName, labo, candidate: cand, proposals });
          if (localConflicts.length) conflits.push({ id, uid, displayName, reason: 'Divergence identifiant', detail: localConflicts.join(' · '), ppn: cand.ppn });
        }
      } else { // verify
        const cand: IdrefCandidate | undefined = entry.candidates?.[0];
        const ppn = entry.ppn || cand?.ppn || '';
        if (entry.status === 'notice_error' || !cand) {
          conflits.push({ id, uid, displayName, reason: 'Notice illisible', detail: `PPN ${ppn || '?'} : notice IdRef inaccessible`, ppn });
          continue;
        }
        const { proposals, localConflicts } = compare(cells, cand);
        // Pas de colonne IdRef_nom_valide dans la table de démo → jamais « déjà confirmé ».
        if (entry.nameMismatch) {
          aArbitrer.push({
            id, uid, displayName, ppn, notice: cand,
            grist: { orcid: cells.ORCID, idhal: cells.IdHAL },
            proposals,
            suspect: !shareToken(displayName, cand.fullName),
          });
        } else {
          if (proposals.length) aEnrichir.push({ id, uid, displayName, labo, ppn, candidate: cand, proposals });
          if (localConflicts.length) conflits.push({ id, uid, displayName, reason: 'Divergence identifiant', detail: localConflicts.join(' · '), ppn });
        }
      }
    }

    return {
      generatedAt: new Date().toISOString(),
      mode,
      stats: {
        cacheTotal,
        gristTotal: researchers.length,
        aRenseigner: aRenseigner.length,
        ambigus: ambigus.length,
        aEnrichir: aEnrichir.length,
        aArbitrer: aArbitrer.length,
        conflits: conflits.length,
        nonTrouves: nonTrouves.length,
      },
      aRenseigner, ambigus, aEnrichir, aArbitrer, conflits, nonTrouves,
    };
  },
};
