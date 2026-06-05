import React from 'react';
import { Layers, Network, X, Plus, Star } from 'lucide-react';
import { Structure, Membership, SupervisionCode } from '../../types';

interface GovernanceTabProps {
  structure: Structure;
  /** Toutes les structures, pour le sélecteur d'appartenances « de la base » (réfs local-) */
  allStructures?: Structure[];
  onUpdateField: (field: keyof Structure, value: any) => void;
}

type Kind = 'inclusion' | 'participation';

const LEVEL_LABEL: Record<string, string> = {
  '4': 'Établissement',
  '3': 'Str. intermédiaire',
  '2': 'Unité',
  '1': 'Équipe',
};

const SUPERVISION_OPTIONS: { value: SupervisionCode | ''; label: string }[] = [
  { value: '', label: '—' },
  { value: 'main_supervision', label: 'Tutelle principale' },
  { value: 'associated_supervision', label: 'Tutelle associée' },
  { value: 'participating_supervision', label: 'Participation' },
];

const selectCls =
  'w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[11px] font-bold uppercase focus:shadow-pixel transition-all';
const dateCls =
  'text-[10px] border-2 border-black dark:border-white p-1 bg-white dark:bg-slate-800 dark:text-white font-mono';
const textCls =
  'border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[11px] font-mono focus:shadow-pixel transition-all';
const addBtnCls =
  'px-2 border-2 border-black dark:border-white bg-pixel-teal text-gray-900 shadow-pixel-sm hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center';
const labelCls = 'block text-[8px] font-bold text-gray-400 uppercase font-mono mb-1';

/** Saisie d'une institution externe par code UAI ou ROR. */
const AddExternal: React.FC<{ onAdd: (m: Membership) => void }> = ({ onAdd }) => {
  const [uai, setUai] = React.useState('');
  const [ror, setRor] = React.useState('');
  const pushUai = () => { const v = uai.trim(); if (v) { onAdd({ refType: 'uai', ref: v, supervision: '', startDate: '', endDate: '' }); setUai(''); } };
  const pushRor = () => { const v = ror.trim(); if (v) { onAdd({ refType: 'ror', ref: v, supervision: '', startDate: '', endDate: '' }); setRor(''); } };
  return (
    <div className="flex flex-wrap items-end gap-4">
      <div>
        <label className={labelCls}>Ajouter par code UAI (institution externe)</label>
        <div className="flex gap-1">
          <input value={uai} onChange={(e) => setUai(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && pushUai()} placeholder="ex: 0753639Y" className={textCls} />
          <button type="button" onClick={pushUai} title="Ajouter cette institution UAI" className={addBtnCls}><Plus className="w-4 h-4" /></button>
        </div>
      </div>
      <div>
        <label className={labelCls}>Ajouter par identifiant ROR (institution externe)</label>
        <div className="flex gap-1">
          <input value={ror} onChange={(e) => setRor(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && pushRor()} placeholder="ex: 05hz99a17" className={textCls} />
          <button type="button" onClick={pushRor} title="Ajouter cette institution ROR" className={addBtnCls}><Plus className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
};

export const GovernanceTab: React.FC<GovernanceTabProps> = ({ structure, allStructures = [], onUpdateField }) => {
  const inclusions = structure.inclusions || [];
  const participations = structure.participations || [];
  const level = String(structure.level);

  const byLid = new Map(allStructures.filter((s) => s.localId).map((s) => [String(s.localId), s]));

  /**
   * Niveaux de structures cibles autorisés selon le niveau courant et le type d'appartenance :
   *  - institutions (4)             : incluses/participent à des institutions
   *  - intermédiaires (3) / unités (2) : à des institutions ou des str. intermédiaires
   *  - équipes (1)                  : incluses dans des unités (pas de participation)
   */
  const allowedLevels = (kind: Kind): string[] => {
    if (level === '4') return ['4'];
    if (level === '3' || level === '2') return ['4', '3'];
    if (level === '1') return kind === 'inclusion' ? ['2'] : [];
    return ['4', '3'];
  };
  const externalAllowed = (kind: Kind) => allowedLevels(kind).includes('4');

  const labelFor = (m: Membership): string => {
    if (m.refType === 'uai') return `UAI ${m.ref}`;
    if (m.refType === 'ror') return `ROR ${m.ref}`;
    const s = byLid.get(String(m.ref));
    return s ? (s.acronym || s.officialName || `local-${m.ref}`) : `local-${m.ref}`;
  };
  const subLabelFor = (m: Membership): string => {
    if (m.refType === 'uai') return `uai-${m.ref}`;
    if (m.refType === 'ror') return `ror-${m.ref}`;
    const s = byLid.get(String(m.ref));
    if (!s) return `local-${m.ref}`;
    const lvl = LEVEL_LABEL[String(s.level)] || '';
    return `${lvl}${s.type ? ` · ${s.type}` : ''} · local-${m.ref}`;
  };

  const fieldOf = (kind: Kind): keyof Structure => (kind === 'inclusion' ? 'inclusions' : 'participations');
  const listOf = (kind: Kind): Membership[] => (kind === 'inclusion' ? inclusions : participations);
  const commit = (kind: Kind, list: Membership[]) => onUpdateField(fieldOf(kind), list);
  const patchEntry = (kind: Kind, idx: number, patch: Partial<Membership>) => {
    const l = [...listOf(kind)];
    l[idx] = { ...l[idx], ...patch };
    commit(kind, l);
  };
  const removeEntry = (kind: Kind, idx: number) => {
    const l = [...listOf(kind)];
    l.splice(idx, 1);
    commit(kind, l);
  };
  const keyOf = (m: Membership) => `${m.refType}:${String(m.ref).toLowerCase()}`;
  const addEntry = (kind: Kind, m: Membership) => {
    if (!m.ref) return;
    const l = listOf(kind);
    if (l.some((x) => keyOf(x) === keyOf(m))) return;
    commit(kind, [...l, m]);
  };

  const localOptions = (kind: Kind): Structure[] => {
    const levels = new Set(allowedLevels(kind));
    const existing = new Set(listOf(kind).filter((m) => m.refType === 'local').map((m) => String(m.ref)));
    return allStructures
      .filter((s) => s.localId && String(s.localId) !== String(structure.localId)
        && levels.has(String(s.level)) && !existing.has(String(s.localId)))
      .sort((a, b) => (a.acronym || '').localeCompare(b.acronym || ''));
  };

  const renderEntry = (kind: Kind, m: Membership, idx: number) => {
    const isMain = m.supervision === 'main_supervision';
    return (
      <div key={`${keyOf(m)}-${idx}`} className="border-2 border-black dark:border-white bg-white dark:bg-slate-800 shadow-pixel-sm">
        <div className="flex items-start justify-between gap-3 px-3 py-2 border-b-2 border-black/10 dark:border-white/10">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[8px] font-mono font-bold px-1 border border-black/30 dark:border-white/30 text-gray-500 uppercase">{m.refType}</span>
              <span className="text-[12px] font-bold uppercase text-gray-900 dark:text-white truncate">{labelFor(m)}</span>
              {isMain && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 border-2 border-black bg-pixel-yellow text-gray-900 text-[8px] font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <Star className="w-3 h-3" /> Tutelle principale
                </span>
              )}
            </div>
            <div className="text-[8px] font-mono text-gray-400 uppercase mt-0.5 truncate">{subLabelFor(m)}</div>
          </div>
          <button onClick={() => removeEntry(kind, idx)} className="text-gray-400 hover:text-pixel-pink transition-colors shrink-0" title="Retirer cette appartenance">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex flex-wrap items-end gap-3 px-3 py-2">
          {kind === 'participation' && (
            <div>
              <label className={labelCls}>Type de participation</label>
              <select value={m.supervision || ''} onChange={(e) => patchEntry(kind, idx, { supervision: e.target.value as SupervisionCode | '' })} className="border-2 border-black dark:border-white p-1 bg-white dark:bg-slate-800 dark:text-white text-[10px] font-bold uppercase">
                {SUPERVISION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className={labelCls}>Date de début</label>
            <input type="date" value={m.startDate || ''} onChange={(e) => patchEntry(kind, idx, { startDate: e.target.value })} className={dateCls} />
          </div>
          <div>
            <label className={labelCls}>Date de fin</label>
            <input type="date" value={m.endDate || ''} onChange={(e) => patchEntry(kind, idx, { endDate: e.target.value })} className={dateCls} />
          </div>
        </div>
      </div>
    );
  };

  const renderSection = (kind: Kind, title: string, Icon: typeof Layers, desc: string) => {
    const list = listOf(kind);
    const opts = localOptions(kind);
    const canExternal = externalAllowed(kind);
    const noTargets = opts.length === 0 && !canExternal;
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b-2 border-black/10 dark:border-white/10 text-gray-400">
          <Icon className="w-5 h-5" />
          <h3 className="text-2xl font-pixel text-gray-900 dark:text-white uppercase tracking-widest leading-none">{title}</h3>
          <span className="text-[10px] font-bold border-2 border-black dark:border-white px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300">{list.length}</span>
        </div>
        <p className="text-[9px] font-mono text-gray-400 uppercase -mt-2">{desc}</p>

        {list.length === 0 ? (
          <p className="text-[10px] font-mono text-gray-400 uppercase">Aucune {kind === 'inclusion' ? 'inclusion' : 'participation'}.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">{list.map((m, i) => renderEntry(kind, m, i))}</div>
        )}

        <div className="space-y-3 pt-3 border-t-2 border-black/10 dark:border-white/10">
          {opts.length > 0 && (
            <div className="max-w-md">
              <label className={labelCls}>Ajouter une structure de la base</label>
              <select
                value=""
                onChange={(e) => { if (e.target.value) addEntry(kind, { refType: 'local', ref: e.target.value, supervision: '', startDate: '', endDate: '' }); }}
                className={selectCls}
              >
                <option value="">+ Choisir une structure…</option>
                {opts.map((s) => (
                  <option key={s.localId} value={String(s.localId)}>
                    {(s.acronym || s.localId)}{s.type ? ` — ${s.type}` : ''}{LEVEL_LABEL[String(s.level)] ? ` (${LEVEL_LABEL[String(s.level)]})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
          {canExternal && <AddExternal onAdd={(m) => addEntry(kind, m)} />}
          {noTargets && <p className="text-[9px] font-mono text-gray-400 uppercase">Ce type de structure n'admet pas d'ajout ici.</p>}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-300">
      {renderSection(
        'inclusion',
        'Inclusions',
        Layers,
        "Appartenance forte : la structure est incluse dans une structure parente (ex. équipe → unité).",
      )}
      {renderSection(
        'participation',
        'Participations',
        Network,
        "Tutelles et appartenances plus larges (ex. unité → établissement / structure intermédiaire). Le code « Tutelle principale » désigne la tutelle de référence.",
      )}
    </div>
  );
};
