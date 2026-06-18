import { ResearcherStatus } from '../types';

/**
 * @file validation.ts
 * @description Couche de « fiabilisation » du statut et du rattachement.
 *
 * Le statut affiché est normalement *dérivé* de sources peu fiables : le LDAP
 * (mises à jour RH tardives) pour les internes, et les dates d'emploi pour les
 * externes (récupérés au fil d'enquêtes labo inégales). De temps en temps une
 * liste fiable arrive (ex. chercheurs de Centrale, du LPPL) : on veut alors
 * marquer ces lignes comme **validées manuellement**, avec une date et une
 * source, de sorte que cette information prime sur le dérivé et ne soit pas
 * écrasée par le prochain sync LDAP.
 *
 * La validation est un axe **orthogonal** au statut (axe « fiabilité » vs axe
 * « état ») : une personne peut être « INTERNE validé » ou « DEPART validé ».
 * On ne crée donc PAS de 5e valeur d'enum ; on superpose des colonnes Grist.
 *
 * Ce module est volontairement pur (aucun accès réseau / DOM) pour être
 * testable et répliqué à l'identique dans les deux Druid (Nantes U + démo).
 */

/** Ce qui peut être validé par une liste fiable. */
export type ValidationScope = 'statut' | 'rattachement';

const SCOPE_VALUES: readonly ValidationScope[] = ['statut', 'rattachement'];

/** Couche de validation manuelle posée sur une fiche chercheur. */
export interface ValidationInfo {
  /** La ligne a-t-elle été fiabilisée manuellement ? */
  validated: boolean;
  /** Statut autoritatif quand `scope` inclut 'statut' (prime sur LDAP/dates). */
  validatedStatus?: ResearcherStatus;
  /** Date de la validation (YYYY-MM-DD) — pilote la péremption. */
  validationDate?: string;
  /** Source : « Liste Centrale 2026-06 », « Enquête LPPL »… (traçabilité). */
  validationSource?: string;
  /** Ce que la validation couvre. Défaut historique : statut + rattachement. */
  validationScope: ValidationScope[];
  /** Auteur de la validation (compte applicatif), optionnel. */
  validatedBy?: string;
}

/** Au-delà de cet âge, une validation est considérée « périmée » (à revoir). */
export const VALIDATION_STALE_MONTHS = 18;

/**
 * Noms des colonnes Grist de la couche validation — **identiques** dans les
 * deux Druid pour que le code soit partagé. À créer dans la table `Annuaire`
 * (cf. scripts/add_validation_columns.cjs). `validated` = Bool, `validation_date`
 * = Date, les autres = Text.
 */
export const GRIST_VALIDATION_COLUMNS = {
  validated: 'validated',
  validatedStatus: 'validated_status',
  validationDate: 'validation_date',
  validationSource: 'validation_source',
  validationScope: 'validation_scope',
  validatedBy: 'validated_by',
} as const;

/** Statut par défaut posé par une liste fiable (« ces personnes sont présentes »). */
export const DEFAULT_VALIDATED_STATUS = ResearcherStatus.INTERNE;

const truthy = (v: any): boolean =>
  v === true || v === 1 || v === 'true' || v === 'OUI' || v === 'oui' || v === 'yes';

/** Normalise une chaîne libre vers un ResearcherStatus connu (sinon undefined). */
export const normStatus = (raw: any): ResearcherStatus | undefined => {
  const s = String(raw ?? '').toUpperCase().trim();
  if (s === 'INTERNE') return ResearcherStatus.INTERNE;
  if (s === 'DEPART' || s === 'DÉPART') return ResearcherStatus.DEPART;
  if (s === 'PARTI') return ResearcherStatus.PARTI;
  if (s === 'EXTERNE') return ResearcherStatus.EXTERNE;
  return undefined;
};

/** Décode la portée depuis une cellule Grist (texte « statut,rattachement » ou liste). */
export const parseValidationScope = (raw: any): ValidationScope[] => {
  const items: string[] = Array.isArray(raw)
    ? raw.map(String)
    : String(raw ?? '').split(/[,;|]/);
  const out = items
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is ValidationScope => (SCOPE_VALUES as readonly string[]).includes(s));
  return Array.from(new Set(out));
};

/**
 * Lit la couche validation depuis les champs bruts d'un record Grist.
 * `decodeDate` permet d'injecter le décodeur de date du GristService (les dates
 * Grist arrivent en timestamp Unix), sans créer de cycle d'import.
 */
export const parseValidation = (
  f: Record<string, any>,
  decodeDate: (raw: any) => string = (raw) => (raw ? String(raw) : ''),
): ValidationInfo => {
  const C = GRIST_VALIDATION_COLUMNS;
  const validated = truthy(f[C.validated]);
  let scope = parseValidationScope(f[C.validationScope]);
  // Rétro-compat : une ligne validée sans portée explicite couvre les deux axes.
  if (validated && scope.length === 0) scope = ['statut', 'rattachement'];
  return {
    validated,
    validatedStatus: normStatus(f[C.validatedStatus]),
    validationDate: decodeDate(f[C.validationDate]) || undefined,
    validationSource: f[C.validationSource] ? String(f[C.validationSource]) : undefined,
    validationScope: scope,
    validatedBy: f[C.validatedBy] ? String(f[C.validatedBy]) : undefined,
  };
};

/**
 * Sérialise la couche validation vers des champs Grist. Quand la ligne n'est pas
 * validée, on remet les colonnes à null/false (permet de « dé-valider »).
 * `encodeDate` injecte l'encodeur de date du GristService (ISO → format Grist).
 */
export const validationToGristFields = (
  v: ValidationInfo | undefined,
  encodeDate: (raw: any) => any = (raw) => raw ?? null,
): Record<string, any> => {
  const C = GRIST_VALIDATION_COLUMNS;
  if (!v || !v.validated) {
    return {
      [C.validated]: false,
      [C.validatedStatus]: null,
      [C.validationDate]: null,
      [C.validationSource]: null,
      [C.validationScope]: null,
      [C.validatedBy]: null,
    };
  }
  return {
    [C.validated]: true,
    [C.validatedStatus]: v.validatedStatus || null,
    [C.validationDate]: v.validationDate ? encodeDate(v.validationDate) : null,
    [C.validationSource]: v.validationSource || null,
    [C.validationScope]: v.validationScope.length ? v.validationScope.join(',') : null,
    [C.validatedBy]: v.validatedBy || null,
  };
};

/**
 * Statut final = validation (si elle couvre le statut) AU-DESSUS du dérivé.
 * `derived` est le statut calculé comme aujourd'hui (mapStatus LDAP/Grist) :
 * la validation ne le remplace que si elle est explicitement renseignée.
 */
export const resolveStatus = (
  validation: ValidationInfo | undefined,
  derived: ResearcherStatus,
): ResearcherStatus => {
  if (
    validation?.validated &&
    validation.validationScope.includes('statut') &&
    validation.validatedStatus
  ) {
    return validation.validatedStatus;
  }
  return derived;
};

/** Le rattachement (labo/équipe) est-il verrouillé par une validation ? */
export const isAffiliationValidated = (v?: ValidationInfo): boolean =>
  !!v?.validated && v.validationScope.includes('rattachement');

/**
 * Une validation est-elle périmée (plus vieille que `months`) ? Sert à décolorer
 * le badge et à inviter à revérifier.
 */
export const isValidationStale = (
  validation: ValidationInfo | undefined,
  now: Date,
  months: number = VALIDATION_STALE_MONTHS,
): boolean => {
  if (!validation?.validated || !validation.validationDate) return false;
  const d = new Date(validation.validationDate);
  if (Number.isNaN(d.getTime())) return false;
  const threshold = new Date(d);
  threshold.setMonth(threshold.getMonth() + months);
  return now.getTime() > threshold.getTime();
};

/**
 * Conflit entre une validation et la source dérivée : si la source (LDAP/dates)
 * a changé APRÈS la date de validation et diverge du statut validé, on remonte
 * la ligne « à revoir » plutôt que de masquer indéfiniment un vrai changement.
 * `sourceChangedAt` = date connue du dernier changement de la source (optionnel).
 */
export const hasValidationConflict = (
  validation: ValidationInfo | undefined,
  derived: ResearcherStatus,
): boolean => {
  if (!validation?.validated || !validation.validationScope.includes('statut')) return false;
  if (!validation.validatedStatus) return false;
  return validation.validatedStatus !== derived;
};

// ─── Import de masse d'une liste fiable ───────────────────────────────────────

/** Une ligne lue depuis une liste fiable (CSV collé ou importé). */
export interface ValidationListRow {
  raw: string;
  name?: string;
  email?: string;
  uid?: string;
  status?: ResearcherStatus;
}

/** Un appariement liste ↔ fiche, prêt à être appliqué. */
export interface ValidationMatch {
  researcherId: string;
  uid?: string;
  displayName: string;
  /** Statut actuellement affiché (avant validation). */
  currentStatus: ResearcherStatus;
  /** Statut validé proposé. */
  newStatus: ResearcherStatus;
  /** Le statut validé diffère du statut courant (info pour l'utilisateur). */
  overrides: boolean;
  matchedBy: 'uid' | 'email' | 'name';
}

export interface ValidationDiff {
  source: string;
  date: string;
  scope: ValidationScope[];
  matched: ValidationMatch[];
  ambiguous: { row: ValidationListRow; candidateIds: string[] }[];
  unmatched: ValidationListRow[];
}

const deburr = (s: string): string =>
  String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Clé de nom tolérante (tokens ≥ 2 lettres, triés) pour l'appariement. */
export const nameKey = (s: string): string =>
  Array.from(new Set(deburr(s).split(/[^a-z]+/).filter((t) => t.length >= 2)))
    .sort()
    .join(' ');

/**
 * Parse un texte CSV/collé en lignes de liste fiable. Détecte les colonnes par
 * en-tête (nom/name, email/mail/courriel, uid/id/matricule, statut/status).
 * Sans en-tête reconnaissable, traite chaque ligne comme un nom.
 */
export const parseValidationList = (text: string): ValidationListRow[] => {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const splitLine = (l: string): string[] =>
    l.split(/[,;\t]/).map((c) => c.trim().replace(/^"|"$/g, ''));

  const header = splitLine(lines[0]).map((h) => deburr(h));
  const col = (names: string[]) => header.findIndex((h) => names.some((n) => h === n || h.includes(n)));
  const iName = col(['nom complet', 'displayname', 'nom', 'name']);
  const iEmail = col(['email', 'mail', 'courriel']);
  const iUid = col(['uid', 'matricule', 'identifiant', 'id']);
  const iStatus = col(['statut', 'status', 'etat']);
  const hasHeader = iName >= 0 || iEmail >= 0 || iUid >= 0;

  const body = hasHeader ? lines.slice(1) : lines;
  return body.map((l): ValidationListRow => {
    const cells = splitLine(l);
    if (!hasHeader) return { raw: l, name: l };
    return {
      raw: l,
      name: iName >= 0 ? cells[iName] : undefined,
      email: iEmail >= 0 ? cells[iEmail] : undefined,
      uid: iUid >= 0 ? cells[iUid] : undefined,
      status: iStatus >= 0 ? normStatus(cells[iStatus]) : undefined,
    };
  });
};

/** Apparie une liste fiable aux fiches et calcule les validations à appliquer. */
export const computeValidationDiff = (
  researchers: Array<{
    id: string;
    uid?: string;
    email?: string;
    displayName: string;
    status: ResearcherStatus;
  }>,
  rows: ValidationListRow[],
  opts: { source: string; date: string; scope: ValidationScope[]; defaultStatus?: ResearcherStatus },
): ValidationDiff => {
  const byUid = new Map<string, string[]>();
  const byEmail = new Map<string, string[]>();
  const byName = new Map<string, string[]>();
  const push = (m: Map<string, string[]>, k: string, id: string) => {
    if (!k) return;
    const arr = m.get(k) || [];
    arr.push(id);
    m.set(k, arr);
  };
  const byId = new Map<string, (typeof researchers)[number]>();
  for (const r of researchers) {
    byId.set(r.id, r);
    push(byUid, String(r.uid || '').trim().toLowerCase(), r.id);
    push(byEmail, String(r.email || '').trim().toLowerCase(), r.id);
    push(byName, nameKey(r.displayName), r.id);
  }

  const defaultStatus = opts.defaultStatus ?? DEFAULT_VALIDATED_STATUS;
  const matched: ValidationMatch[] = [];
  const ambiguous: ValidationDiff['ambiguous'] = [];
  const unmatched: ValidationListRow[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    let ids: string[] | undefined;
    let matchedBy: ValidationMatch['matchedBy'] = 'uid';
    const uidKey = String(row.uid || '').trim().toLowerCase();
    const emailKey = String(row.email || '').trim().toLowerCase();
    const nKey = row.name ? nameKey(row.name) : '';
    if (uidKey && byUid.get(uidKey)) { ids = byUid.get(uidKey); matchedBy = 'uid'; }
    else if (emailKey && byEmail.get(emailKey)) { ids = byEmail.get(emailKey); matchedBy = 'email'; }
    else if (nKey && byName.get(nKey)) { ids = byName.get(nKey); matchedBy = 'name'; }

    if (!ids || ids.length === 0) { unmatched.push(row); continue; }
    if (ids.length > 1) { ambiguous.push({ row, candidateIds: ids }); continue; }

    const id = ids[0];
    if (seen.has(id)) continue; // déduplication : une fiche validée une seule fois
    seen.add(id);
    const r = byId.get(id)!;
    const newStatus = row.status ?? defaultStatus;
    matched.push({
      researcherId: id,
      uid: r.uid,
      displayName: r.displayName,
      currentStatus: r.status,
      newStatus,
      overrides: newStatus !== r.status,
      matchedBy,
    });
  }

  return { source: opts.source, date: opts.date, scope: opts.scope, matched, ambiguous, unmatched };
};
