import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fromGristDate,
  toGristDate,
  mapStatus,
  normCivility,
  researcherToGristFields,
  GristService,
} from '../gristService';
import { ResearcherStatus } from '../../types';

// ─── fromGristDate ────────────────────────────────────────────────────────────

describe('fromGristDate', () => {
  it('returns empty string for null', () => {
    expect(fromGristDate(null)).toBe('');
  });

  it('returns empty string for 0 (falsy number)', () => {
    expect(fromGristDate(0)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(fromGristDate('')).toBe('');
  });

  it('converts a Unix timestamp (seconds) to ISO date', () => {
    // 2024-01-01 00:00:00 UTC
    expect(fromGristDate(1704067200)).toBe('2024-01-01');
  });

  it('converts DD-MM-YYYY string to ISO YYYY-MM-DD', () => {
    expect(fromGristDate('15-01-2024')).toBe('2024-01-15');
  });

  it('converts DD/MM/YYYY string to ISO YYYY-MM-DD', () => {
    expect(fromGristDate('15/01/2024')).toBe('2024-01-15');
  });

  it('returns an already ISO-formatted date unchanged', () => {
    expect(fromGristDate('2024-01-15')).toBe('2024-01-15');
  });

  it('returns string representation for unrecognised number', () => {
    // non-zero number that isn't a plausible timestamp
    const result = fromGristDate(42);
    expect(typeof result).toBe('string');
  });
});

// ─── toGristDate ─────────────────────────────────────────────────────────────

describe('toGristDate', () => {
  it('returns null for null input', () => {
    expect(toGristDate(null)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(toGristDate('')).toBeNull();
  });

  it('returns null for a value without a hyphen', () => {
    expect(toGristDate('20240115')).toBeNull();
  });

  it('converts YYYY-MM-DD to DD-MM-YYYY (Grist format)', () => {
    expect(toGristDate('2024-01-15')).toBe('15-01-2024');
  });

  it('returns input unchanged if it does not start with a 4-digit year', () => {
    // Already in Grist format — no double-conversion
    expect(toGristDate('15-01-2024')).toBe('15-01-2024');
  });
});

// ─── mapStatus ───────────────────────────────────────────────────────────────

describe('mapStatus', () => {
  describe('with LDAP state (takes priority over Grist field)', () => {
    it('maps ldapState "N" (normal) to INTERNE', () => {
      expect(mapStatus('', 'N')).toBe(ResearcherStatus.INTERNE);
    });

    it('maps ldapState "D" (départ) to DEPART', () => {
      expect(mapStatus('', 'D')).toBe(ResearcherStatus.DEPART);
    });

    it('maps any other ldapState to EXTERNE', () => {
      expect(mapStatus('INTERNE', 'X')).toBe(ResearcherStatus.EXTERNE);
      expect(mapStatus('INTERNE', 'R')).toBe(ResearcherStatus.EXTERNE);
    });
  });

  describe('without LDAP state (falls back to Grist field)', () => {
    it('maps "INTERNE" to INTERNE', () => {
      expect(mapStatus('INTERNE')).toBe(ResearcherStatus.INTERNE);
    });

    it('maps "interne" (lowercase) to INTERNE', () => {
      expect(mapStatus('interne')).toBe(ResearcherStatus.INTERNE);
    });

    it('maps "DEPART" to DEPART', () => {
      expect(mapStatus('DEPART')).toBe(ResearcherStatus.DEPART);
    });

    it('maps "PARTI" to PARTI', () => {
      expect(mapStatus('PARTI')).toBe(ResearcherStatus.PARTI);
    });

    it('maps empty string to EXTERNE (default)', () => {
      expect(mapStatus('')).toBe(ResearcherStatus.EXTERNE);
    });

    it('maps an unknown value to EXTERNE (default)', () => {
      expect(mapStatus('INCONNU')).toBe(ResearcherStatus.EXTERNE);
    });
  });
});

// ─── normCivility ─────────────────────────────────────────────────────────────

describe('normCivility', () => {
  it('returns empty string for empty input', () => {
    expect(normCivility('')).toBe('');
  });

  it('maps "F" to "F"', () => {
    expect(normCivility('F')).toBe('F');
  });

  it('maps "MME" to "F"', () => {
    expect(normCivility('MME')).toBe('F');
  });

  it('maps "Madame" (mixed case) to "F"', () => {
    expect(normCivility('Madame')).toBe('F');
  });

  it('maps "M" to "M"', () => {
    expect(normCivility('M')).toBe('M');
  });

  it('maps "M." to "M"', () => {
    expect(normCivility('M.')).toBe('M');
  });

  it('maps "MR" to "M"', () => {
    expect(normCivility('MR')).toBe('M');
  });

  it('maps "Monsieur" (mixed case) to "M"', () => {
    expect(normCivility('Monsieur')).toBe('M');
  });

  it('returns the first character uppercased for unrecognised values', () => {
    expect(normCivility('Dr')).toBe('D');
    expect(normCivility('Pr')).toBe('P');
  });
});

// ─── researcherToGristFields ──────────────────────────────────────────────────

describe('researcherToGristFields', () => {
  const baseResearcher = {
    id: 'G-42',
    uid: 'jdoe',
    civility: 'M',
    lastName: 'Doe',
    firstName: 'John',
    displayName: 'DOE John',
    email: 'john.doe@example.com',
    eppn: 'jdoe@example.com',
    nationality: 'FR',
    birthDate: '1985-06-15',
    status: ResearcherStatus.INTERNE,
    employment: {
      employer: 'Université de Nantes',
      institutionId: '0440984F',
      contractType: 'CDI',
      grade: 'MCF',
      internalTypology: '',
      startDate: '2010-09-01',
      endDate: '',
      ldapFields: [],
    },
    affiliations: [{
      structureName: 'LS2N',
      team: 'GDD',
      startDate: '2010-09-01',
      endDate: undefined,
      isPrimary: true,
    }],
    groups: [],
    identifiers: {
      orcid: '0000-0001-2345-6789',
      idref: '123456789',
      halId: 'john-doe',
      scopusId: '12345',
    },
    extra: {
      hdr: true,
      location: 'Nantes',
    },
    ldapFields: [],
    lastSync: '2024-01-15',
  };

  it('maps personal identity fields', () => {
    const fields = researcherToGristFields(baseResearcher as any);
    expect(fields.last_name).toBe('Doe');
    expect(fields.first_names).toBe('John');
    expect(fields.gender).toBe('M');
    expect(fields.contact_email).toBe('john.doe@example.com');
  });

  it('converts birthDate from ISO to Grist format', () => {
    const fields = researcherToGristFields(baseResearcher as any);
    expect(fields.birthdate).toBe('15-06-1985');
  });

  it('maps primary affiliation fields', () => {
    const fields = researcherToGristFields(baseResearcher as any);
    expect(fields.main_research_structure).toBe('LS2N');
    expect(fields.team).toBe('GDD');
  });

  it('converts employment dates from ISO to Grist format', () => {
    const fields = researcherToGristFields(baseResearcher as any);
    expect(fields.employment_start_date).toBe('01-09-2010');
    expect(fields.employment_end_date).toBeNull();
  });

  it('maps identifiers', () => {
    const fields = researcherToGristFields(baseResearcher as any);
    expect(fields.orcid).toBe('0000-0001-2345-6789');
    expect(fields.idref).toBe('123456789');
    expect(fields.idhals).toBe('john-doe');
    expect(fields.scopus).toBe('12345');
  });

  it('maps hdr flag', () => {
    const fields = researcherToGristFields(baseResearcher as any);
    expect(fields.hdr).toBe(true);
  });

  it('maps empty affiliation gracefully', () => {
    const researcher = { ...baseResearcher, affiliations: [] };
    const fields = researcherToGristFields(researcher as any);
    expect(fields.main_research_structure).toBe('');
    expect(fields.team).toBe('');
  });

  it('maps null optional fields to null (not empty string)', () => {
    const researcher = {
      ...baseResearcher,
      nationality: '',
      extra: { hdr: false, location: '' },
    };
    const fields = researcherToGristFields(researcher as any);
    expect(fields.nationality).toBeNull();
    expect(fields.localisation).toBeNull();
  });
});

// ─── GristService.fetchResearchers ────────────────────────────────────────────

describe('GristService.fetchResearchers', () => {
  const mockLocalStorage = {
    store: {} as Record<string, string>,
    getItem: vi.fn((key: string) => mockLocalStorage.store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { mockLocalStorage.store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete mockLocalStorage.store[key]; }),
    clear: vi.fn(() => { mockLocalStorage.store = {}; }),
  };

  const gristRecord = (overrides: Record<string, any> = {}) => ({
    id: 1,
    fields: {
      tracking_id: 'jdoe',
      last_name: 'Doe',
      first_names: 'John',
      contact_email: 'john.doe@example.com',
      status: 'INTERNE',
      position: 'MCF',
      main_research_structure: 'LS2N',
      team: 'GDD',
      hdr: false,
      orcid: '0000-0001-2345-6789',
      idhals: 'john-doe',
      ...overrides,
    },
  });

  const makeFetch = (records: any[], ldapCache: Record<string, any> = {}) =>
    vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ updatedAt: 'ts-1' }) })       // getDocUpdatedAt
      .mockResolvedValueOnce({ ok: true, json: async () => ldapCache })                      // ldap cache
      .mockResolvedValueOnce({ ok: true, json: async () => ({ records }) });                 // researchers

  beforeEach(() => {
    vi.stubGlobal('localStorage', mockLocalStorage);
    mockLocalStorage.clear();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('maps a Grist record to a valid Researcher shape', async () => {
    vi.stubGlobal('fetch', makeFetch([gristRecord()]));
    const researchers = await GristService.fetchResearchers(true);
    expect(researchers).toHaveLength(1);
    const r = researchers[0];
    expect(r.id).toBe('G-1');
    expect(r.lastName).toBe('Doe');
    expect(r.firstName).toBe('John');
    expect(r.email).toBe('john.doe@example.com');
    expect(r.status).toBe(ResearcherStatus.INTERNE);
    expect(r.affiliations[0].structureName).toBe('LS2N');
    expect(r.identifiers.orcid).toBe('0000-0001-2345-6789');
    expect(r.identifiers.halId).toBe('john-doe');
  });

  it('overrides status with LDAP dynaEtat when LDAP cache is present', async () => {
    const ldapCache = { jdoe: { etat: 'D', civilite: '', birthDate: '', eppn: '' } };
    vi.stubGlobal('fetch', makeFetch([gristRecord({ status: 'INTERNE' })], ldapCache));
    const researchers = await GristService.fetchResearchers(true);
    // LDAP 'D' → DEPART, overrides Grist 'INTERNE'
    expect(researchers[0].status).toBe(ResearcherStatus.DEPART);
  });

  it('parses a Grist Unix timestamp birthdate to ISO format', async () => {
    vi.stubGlobal('fetch', makeFetch([gristRecord({ birthdate: 1704067200 })]));
    const researchers = await GristService.fetchResearchers(true);
    expect(researchers[0].birthDate).toBe('2024-01-01');
  });

  it('maps hdr=true', async () => {
    vi.stubGlobal('fetch', makeFetch([gristRecord({ hdr: true })]));
    const researchers = await GristService.fetchResearchers(true);
    expect(researchers[0].extra?.hdr).toBe(true);
  });

  it('maps hdr="OUI" (legacy string) to true', async () => {
    vi.stubGlobal('fetch', makeFetch([gristRecord({ hdr: 'OUI' })]));
    const researchers = await GristService.fetchResearchers(true);
    expect(researchers[0].extra?.hdr).toBe(true);
  });

  it('returns cached data when updatedAt matches and force=false', async () => {
    const cached = [{ id: 'G-99', lastName: 'Cached' }];
    mockLocalStorage.store['druid_researchers_cache'] = JSON.stringify(cached);
    mockLocalStorage.store['druid_grist_updated_at'] = 'ts-1';

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ updatedAt: 'ts-1' }) }); // getDocUpdatedAt only
    vi.stubGlobal('fetch', fetchMock);

    const researchers = await GristService.fetchResearchers(false);
    expect(researchers).toEqual(cached);
    // Only one fetch call (getDocUpdatedAt), no researchers fetch
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns empty array when Grist returns no records', async () => {
    vi.stubGlobal('fetch', makeFetch([]));
    const researchers = await GristService.fetchResearchers(true);
    expect(researchers).toEqual([]);
  });

  it('falls back to cache on network error', async () => {
    const cached = [{ id: 'G-1', lastName: 'Fallback' }];
    mockLocalStorage.store['druid_researchers_cache'] = JSON.stringify(cached);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const researchers = await GristService.fetchResearchers(true);
    expect(researchers).toEqual(cached);
  });
});
