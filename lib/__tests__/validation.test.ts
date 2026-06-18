import { describe, it, expect } from 'vitest';
import {
  parseValidation,
  validationToGristFields,
  resolveStatus,
  isValidationStale,
  isAffiliationValidated,
  hasValidationConflict,
  parseValidationScope,
  parseValidationList,
  computeValidationDiff,
  nameKey,
  ValidationInfo,
} from '../validation';
import { ResearcherStatus } from '../../types';

const validated = (over: Partial<ValidationInfo> = {}): ValidationInfo => ({
  validated: true,
  validatedStatus: ResearcherStatus.INTERNE,
  validationDate: '2026-06-01',
  validationSource: 'Liste Centrale 2026-06',
  validationScope: ['statut', 'rattachement'],
  ...over,
});

// ─── resolveStatus : validation prime sur le dérivé ───────────────────────────

describe('resolveStatus', () => {
  it('renvoie le dérivé quand il n’y a pas de validation', () => {
    expect(resolveStatus(undefined, ResearcherStatus.DEPART)).toBe(ResearcherStatus.DEPART);
  });

  it('la validation INTERNE prime sur un dérivé DEPART (LDAP en retard)', () => {
    expect(resolveStatus(validated(), ResearcherStatus.DEPART)).toBe(ResearcherStatus.INTERNE);
  });

  it('ignore la validation si la portée ne couvre pas le statut', () => {
    const v = validated({ validationScope: ['rattachement'] });
    expect(resolveStatus(v, ResearcherStatus.DEPART)).toBe(ResearcherStatus.DEPART);
  });

  it('ignore une validation sans statut renseigné', () => {
    const v = validated({ validatedStatus: undefined });
    expect(resolveStatus(v, ResearcherStatus.EXTERNE)).toBe(ResearcherStatus.EXTERNE);
  });

  it('ignore une validation à false', () => {
    const v = validated({ validated: false });
    expect(resolveStatus(v, ResearcherStatus.EXTERNE)).toBe(ResearcherStatus.EXTERNE);
  });
});

// ─── isValidationStale ────────────────────────────────────────────────────────

describe('isValidationStale', () => {
  it('non périmée juste après la validation', () => {
    expect(isValidationStale(validated({ validationDate: '2026-06-01' }), new Date('2026-09-01'))).toBe(false);
  });

  it('périmée au-delà de 18 mois', () => {
    expect(isValidationStale(validated({ validationDate: '2024-01-01' }), new Date('2026-06-01'))).toBe(true);
  });

  it('horizon paramétrable (12 mois)', () => {
    expect(isValidationStale(validated({ validationDate: '2025-01-01' }), new Date('2026-06-01'), 12)).toBe(true);
  });

  it('false si pas validé ou pas de date', () => {
    expect(isValidationStale(validated({ validated: false }), new Date('2030-01-01'))).toBe(false);
    expect(isValidationStale(validated({ validationDate: undefined }), new Date('2030-01-01'))).toBe(false);
  });
});

// ─── isAffiliationValidated / hasValidationConflict ──────────────────────────

describe('verrou rattachement & conflit', () => {
  it('rattachement verrouillé quand la portée le couvre', () => {
    expect(isAffiliationValidated(validated())).toBe(true);
    expect(isAffiliationValidated(validated({ validationScope: ['statut'] }))).toBe(false);
  });

  it('conflit quand le statut validé diverge du dérivé', () => {
    expect(hasValidationConflict(validated(), ResearcherStatus.DEPART)).toBe(true);
    expect(hasValidationConflict(validated(), ResearcherStatus.INTERNE)).toBe(false);
  });
});

// ─── parse / serialize Grist ──────────────────────────────────────────────────

describe('parseValidationScope', () => {
  it('décode le texte « statut,rattachement »', () => {
    expect(parseValidationScope('statut,rattachement')).toEqual(['statut', 'rattachement']);
  });
  it('décode une liste Grist et ignore l’inconnu', () => {
    expect(parseValidationScope(['statut', 'bidon'])).toEqual(['statut']);
  });
  it('vide si rien', () => {
    expect(parseValidationScope(null)).toEqual([]);
  });
});

describe('parseValidation', () => {
  it('lit les colonnes Grist', () => {
    const v = parseValidation({
      validated: true,
      validated_status: 'INTERNE',
      validation_date: '2026-06-01',
      validation_source: 'Liste LPPL',
      validation_scope: 'statut,rattachement',
      validated_by: 'godet-g',
    });
    expect(v.validated).toBe(true);
    expect(v.validatedStatus).toBe(ResearcherStatus.INTERNE);
    expect(v.validationDate).toBe('2026-06-01');
    expect(v.validationSource).toBe('Liste LPPL');
    expect(v.validationScope).toEqual(['statut', 'rattachement']);
    expect(v.validatedBy).toBe('godet-g');
  });

  it('défaut de portée = les deux axes si validé sans scope', () => {
    const v = parseValidation({ validated: true, validated_status: 'INTERNE' });
    expect(v.validationScope).toEqual(['statut', 'rattachement']);
  });

  it('non validé si colonne absente', () => {
    expect(parseValidation({}).validated).toBe(false);
  });
});

describe('validationToGristFields', () => {
  it('sérialise une validation', () => {
    const f = validationToGristFields(validated());
    expect(f.validated).toBe(true);
    expect(f.validated_status).toBe(ResearcherStatus.INTERNE);
    expect(f.validation_scope).toBe('statut,rattachement');
  });

  it('remet à null/false quand non validé (dé-validation)', () => {
    const f = validationToGristFields(undefined);
    expect(f.validated).toBe(false);
    expect(f.validated_status).toBeNull();
    expect(f.validation_date).toBeNull();
  });

  it('round-trip parse∘serialize', () => {
    const f = validationToGristFields(validated());
    const v = parseValidation(f);
    expect(v.validatedStatus).toBe(ResearcherStatus.INTERNE);
    expect(v.validationScope).toEqual(['statut', 'rattachement']);
  });
});

// ─── Import de masse ──────────────────────────────────────────────────────────

describe('parseValidationList', () => {
  it('détecte les colonnes par en-tête', () => {
    const rows = parseValidationList('nom,email,uid\nDUPONT Jean,jean@x.fr,jdupont\nMARTIN Alice,,amartin');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ name: 'DUPONT Jean', email: 'jean@x.fr', uid: 'jdupont' });
    expect(rows[1].uid).toBe('amartin');
  });

  it('sans en-tête : chaque ligne est un nom', () => {
    const rows = parseValidationList('DUPONT Jean\nMARTIN Alice');
    expect(rows.map((r) => r.name)).toEqual(['DUPONT Jean', 'MARTIN Alice']);
  });

  it('lit le statut quand présent', () => {
    const rows = parseValidationList('nom;statut\nX Y;DEPART');
    expect(rows[0].status).toBe(ResearcherStatus.DEPART);
  });
});

describe('computeValidationDiff', () => {
  const researchers = [
    { id: 'G-1', uid: 'jdupont', email: 'jean.dupont@x.fr', displayName: 'DUPONT Jean', status: ResearcherStatus.DEPART },
    { id: 'G-2', uid: 'amartin', email: 'alice@x.fr', displayName: 'MARTIN Alice', status: ResearcherStatus.EXTERNE },
    { id: 'G-3', uid: '', email: '', displayName: 'MARTIN Alice', status: ResearcherStatus.EXTERNE }, // homonyme
  ];
  const opts = { source: 'Liste Centrale', date: '2026-06-18', scope: ['statut', 'rattachement'] as const };

  it('apparie par uid et marque l’override', () => {
    const diff = computeValidationDiff(researchers, [{ raw: '', uid: 'jdupont' }], { ...opts, scope: [...opts.scope] });
    expect(diff.matched).toHaveLength(1);
    expect(diff.matched[0].researcherId).toBe('G-1');
    expect(diff.matched[0].matchedBy).toBe('uid');
    expect(diff.matched[0].newStatus).toBe(ResearcherStatus.INTERNE);
    expect(diff.matched[0].overrides).toBe(true); // DEPART → INTERNE
  });

  it('apparie par email quand pas d’uid', () => {
    const diff = computeValidationDiff(researchers, [{ raw: '', email: 'alice@x.fr' }], { ...opts, scope: [...opts.scope] });
    expect(diff.matched[0].researcherId).toBe('G-2');
    expect(diff.matched[0].matchedBy).toBe('email');
  });

  it('signale les homonymes en ambigus', () => {
    const diff = computeValidationDiff(researchers, [{ raw: '', name: 'Martin Alice' }], { ...opts, scope: [...opts.scope] });
    expect(diff.ambiguous).toHaveLength(1);
    expect(diff.ambiguous[0].candidateIds.sort()).toEqual(['G-2', 'G-3']);
  });

  it('non apparié si introuvable', () => {
    const diff = computeValidationDiff(researchers, [{ raw: '', uid: 'inconnu' }], { ...opts, scope: [...opts.scope] });
    expect(diff.unmatched).toHaveLength(1);
  });

  it('respecte le statut de la ligne quand fourni', () => {
    const diff = computeValidationDiff(researchers, [{ raw: '', uid: 'jdupont', status: ResearcherStatus.DEPART }], { ...opts, scope: [...opts.scope] });
    expect(diff.matched[0].newStatus).toBe(ResearcherStatus.DEPART);
    expect(diff.matched[0].overrides).toBe(false);
  });
});

describe('nameKey', () => {
  it('insensible à la casse/accents/ordre', () => {
    expect(nameKey('DUPONT Jean')).toBe(nameKey('jean dupont'));
    expect(nameKey('Géraldine É.')).toBe(nameKey('geraldine'));
  });
});
