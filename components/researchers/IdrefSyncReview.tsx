import React, { useMemo, useState } from 'react';
import { X, ArrowRight, RefreshCw, AlertTriangle, Search, Save, CheckSquare, Square, HelpCircle, Link2, Check, Unlink, MinusCircle, GitCompare } from 'lucide-react';
import { IdrefDiff, IdrefCandidate, IdrefUpdate } from '../../lib/gristService';

interface IdrefSyncReviewProps {
  diff: IdrefDiff;
  applying?: boolean;
  onApply?: (updates: IdrefUpdate[]) => void;
  onClose: () => void;
}

const StatCard: React.FC<{ label: string; value: number; tone?: string }> = ({ label, value, tone = 'bg-white dark:bg-slate-800' }) => (
  <div className={`border-2 border-black dark:border-white p-3 shadow-pixel-sm ${tone}`}>
    <div className="text-2xl font-pixel text-gray-900 dark:text-white">{value}</div>
    <div className="text-[8px] font-bold font-mono uppercase text-gray-500 dark:text-gray-400">{label}</div>
  </div>
);

const SectionTitle: React.FC<{ icon: React.ReactNode; children: React.ReactNode }> = ({ icon, children }) => (
  <div className="flex items-center gap-2 pb-2 mb-3 border-b-2 border-black/10 dark:border-white/10 text-gray-500 dark:text-gray-400">
    {icon}
    <h3 className="text-sm font-pixel uppercase tracking-widest text-gray-900 dark:text-white">{children}</h3>
  </div>
);

/** Aperçu compact d'un candidat IdRef (nom, métier, dates, identifiants, description tronquée). */
const CandidateLine: React.FC<{ c: IdrefCandidate }> = ({ c }) => (
  <div className="text-[10px] font-mono text-gray-700 dark:text-gray-300">
    <div className="flex flex-wrap items-center gap-2">
      <a href={`https://www.idref.fr/${c.ppn}`} target="_blank" rel="noreferrer" className="px-1.5 py-0.5 bg-pixel-blue/20 text-gray-900 dark:text-white font-bold inline-flex items-center gap-1 hover:underline">
        <Link2 className="w-3 h-3" /> {c.ppn}
      </a>
      <span className="font-bold uppercase">{c.fullName || '—'}</span>
      {c.job && <span className="text-gray-500">· {c.job}</span>}
      {(c.birth || c.death) && <span className="text-gray-400">({c.birth || '?'}{c.death ? `–${c.death}` : ''})</span>}
      {c.gender && <span className="text-gray-400">{c.gender}</span>}
      {c.orcid && <span className="px-1 bg-pixel-teal/20">ORCID {c.orcid}</span>}
      {c.idhal && <span className="px-1 bg-pixel-teal/20">IdHAL {c.idhal}</span>}
    </div>
    {c.description && <div className="mt-1 text-gray-500 line-clamp-2">{c.description}</div>}
  </div>
);

/**
 * Revue de l'alignement IdRef (deux modes) :
 *  - search : À renseigner (cochables) + Ambigus (arbitrage radio) + Conflits + Non trouvés
 *  - verify : À enrichir (cochables) + Écarts de nom (arbitrage) + Conflits
 * N'écrit que ce qui est coché/arbitré ; jamais d'écrasement d'une cellule non vide.
 * Démo statique : « Appliquer » met à jour la vue localement, sans persister dans Grist.
 */
export const IdrefSyncReview: React.FC<IdrefSyncReviewProps> = ({ diff, applying = false, onApply, onClose }) => {
  const isSearch = diff.mode === 'search';

  // Sélection des fiches « à renseigner » (search) / « à enrichir » (verify) — tout coché par défaut.
  const fillList = isSearch ? diff.aRenseigner : diff.aEnrichir;
  const [selected, setSelected] = useState<Set<string>>(() => new Set(fillList.map((r) => r.id)));
  // Arbitrage des ambigus (search) : id → ppn choisi (ou absent = ignoré).
  const [chosen, setChosen] = useState<Record<string, string>>({});
  // Arbitrage des écarts de nom (verify) : id → décision. Pré-réglage : suspect → détacher, sinon confirmer.
  type Decision = 'confirm' | 'detach' | 'ignore';
  const [decisions, setDecisions] = useState<Record<string, Decision>>(() => {
    const d: Record<string, Decision> = {};
    for (const a of diff.aArbitrer) d[a.id] = a.suspect ? 'detach' : 'confirm';
    return d;
  });
  const setDecision = (id: string, dec: Decision) => setDecisions((p) => ({ ...p, [id]: dec }));
  const confirmAll = () => setDecisions(() => Object.fromEntries(diff.aArbitrer.map((a) => [a.id, 'confirm' as Decision])));
  const arbStats = useMemo(() => {
    let confirm = 0, detach = 0;
    for (const a of diff.aArbitrer) { if (decisions[a.id] === 'confirm') confirm++; else if (decisions[a.id] === 'detach') detach++; }
    return { confirm, detach };
  }, [diff.aArbitrer, decisions]);

  const toggle = (id: string) => setSelected((prev) => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
  });
  const allSelected = fillList.length > 0 && selected.size === fillList.length;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(fillList.map((r) => r.id)));

  const updates = useMemo<IdrefUpdate[]>(() => {
    const out: IdrefUpdate[] = [];
    for (const r of fillList) {
      if (!selected.has(r.id)) continue;
      const fields: Record<string, string> = {};
      for (const p of r.proposals) fields[p.field] = p.after;
      if (Object.keys(fields).length) out.push({ id: r.id, uid: r.uid, displayName: r.displayName, fields });
    }
    // Ambigus arbitrés (search) : on n'écrit que l'IdRef choisi (l'ORCID/IdHAL viendront d'un verify).
    if (isSearch) {
      for (const a of diff.ambigus) {
        const ppn = chosen[a.id];
        if (ppn) out.push({ id: a.id, uid: a.uid, displayName: a.displayName, fields: { IdRef: ppn } });
      }
    }
    // Écarts de nom arbitrés (verify) :
    //  - confirmer → marque la fiche validée (IdRef_nom_valide) + applique l'enrichissement retenu
    //  - détacher  → vide l'IdRef (mauvais lien ; un futur search re-cherchera)
    for (const a of diff.aArbitrer) {
      const dec = decisions[a.id];
      if (dec === 'confirm') {
        const fields: Record<string, string> = { IdRef_nom_valide: a.ppn };
        for (const p of a.proposals) fields[p.field] = p.after;
        out.push({ id: a.id, uid: a.uid, displayName: a.displayName, fields });
      } else if (dec === 'detach') {
        out.push({ id: a.id, uid: a.uid, displayName: a.displayName, fields: { IdRef: '' } });
      }
    }
    return out;
  }, [fillList, selected, chosen, decisions, diff, isSearch]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-4xl max-h-[88vh] flex flex-col bg-background dark:bg-slate-900 border-4 border-black dark:border-white shadow-pixel">
        <header className="flex items-center justify-between px-6 py-4 border-b-4 border-black dark:border-white bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <img src={`${import.meta.env.BASE_URL}idref.svg`} alt="IdRef" className="w-5 h-5" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <h2 className="text-lg font-pixel uppercase tracking-tight text-gray-900 dark:text-white">
              Alignement IdRef — {isSearch ? 'recherche des manquants' : 'vérification des existants'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 border-2 border-black dark:border-white shadow-pixel-sm hover:shadow-none transition-all bg-white dark:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="p-6 overflow-auto space-y-8">
          <div className="flex items-center gap-3 p-3 bg-pixel-yellow/20 border-2 border-black dark:border-white text-[10px] font-bold uppercase tracking-wider text-gray-800 dark:text-pixel-yellow">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Démo : données IdRef fictives. Seules les cellules vides sont renseignées ; aucune valeur existante n'est écrasée. « Appliquer » met à jour la vue localement (non persisté).
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Cache IdRef" value={diff.stats.cacheTotal} />
            <StatCard label="Annuaire" value={diff.stats.gristTotal} />
            {isSearch ? (
              <>
                <StatCard label="À renseigner" value={diff.stats.aRenseigner} tone="bg-pixel-blue/20" />
                <StatCard label="Ambigus" value={diff.stats.ambigus} tone="bg-pixel-pink/20" />
                <StatCard label="Conflits" value={diff.stats.conflits} tone="bg-pixel-yellow/20" />
                <StatCard label="Non trouvés" value={diff.stats.nonTrouves} tone="bg-slate-200 dark:bg-slate-700" />
              </>
            ) : (
              <>
                <StatCard label="À enrichir" value={diff.stats.aEnrichir} tone="bg-pixel-teal/20" />
                <StatCard label="Écarts de nom" value={diff.stats.aArbitrer} tone="bg-pixel-pink/20" />
                <StatCard label="Conflits" value={diff.stats.conflits} tone="bg-pixel-yellow/20" />
              </>
            )}
          </div>

          {/* À renseigner / À enrichir */}
          <section>
            <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-black/10 dark:border-white/10">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                {isSearch ? <Search className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                <h3 className="text-sm font-pixel uppercase tracking-widest text-gray-900 dark:text-white">
                  {isSearch ? 'À renseigner' : 'À enrichir (ORCID / IdHAL)'} ({fillList.length})
                </h3>
              </div>
              {fillList.length > 0 && (
                <button onClick={toggleAll} className="flex items-center gap-1.5 text-[9px] font-bold uppercase text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white">
                  {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  {allSelected ? 'Tout décocher' : 'Tout cocher'} ({selected.size}/{fillList.length})
                </button>
              )}
            </div>
            {fillList.length === 0 ? (
              <p className="text-[10px] font-mono uppercase text-gray-400">Rien à {isSearch ? 'renseigner' : 'enrichir'}.</p>
            ) : (
              <div className="space-y-3">
                {fillList.map((r) => (
                  <div key={r.id} className={`border-2 p-3 shadow-pixel-sm transition-colors ${selected.has(r.id) ? 'border-black dark:border-white bg-white dark:bg-slate-800' : 'border-black/20 dark:border-white/20 bg-slate-100/60 dark:bg-slate-950 opacity-60'}`}>
                    <div className="flex items-baseline gap-2 mb-2">
                      <button onClick={() => toggle(r.id)} className="self-center text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white" title="Inclure / exclure">
                        {selected.has(r.id) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      </button>
                      <span className="text-[12px] font-bold uppercase text-gray-900 dark:text-white">{r.displayName || '—'}</span>
                      {r.labo && (
                        <span className="px-1.5 py-0.5 bg-pixel-blue/15 border border-pixel-blue/40 text-pixel-blue dark:text-pixel-cyan text-[8px] font-bold uppercase tracking-wide" title="Labo d'appartenance">{r.labo}</span>
                      )}
                      <span className="text-[8px] font-mono text-gray-400">{r.uid} · {r.id}</span>
                    </div>
                    <div className="pl-6 mb-2"><CandidateLine c={r.candidate} /></div>
                    <div className="pl-6 space-y-1">
                      {r.proposals.map((p, i) => (
                        <div key={i} className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                          <span className="font-bold uppercase text-gray-500 dark:text-gray-400 w-16 shrink-0">{p.label}</span>
                          <span className="px-1.5 py-0.5 bg-pixel-pink/15 text-gray-700 dark:text-gray-300 line-through">∅</span>
                          <ArrowRight className="w-3 h-3 text-gray-400" />
                          <span className="px-1.5 py-0.5 bg-pixel-teal/20 text-gray-900 dark:text-white font-bold">{p.after}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Ambigus (search uniquement) */}
          {isSearch && (
            <section>
              <SectionTitle icon={<HelpCircle className="w-4 h-4" />}>Ambigus — arbitrer ({diff.ambigus.length})</SectionTitle>
              {diff.ambigus.length === 0 ? (
                <p className="text-[10px] font-mono uppercase text-gray-400">Aucun cas ambigu.</p>
              ) : (
                <div className="space-y-3">
                  {diff.ambigus.map((a) => (
                    <div key={a.id} className="border-2 border-pixel-pink bg-pixel-pink/5 p-3">
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-[12px] font-bold uppercase text-gray-900 dark:text-white">{a.displayName || '—'}</span>
                        {a.labo && (
                          <span className="px-1.5 py-0.5 bg-pixel-blue/15 border border-pixel-blue/40 text-pixel-blue dark:text-pixel-cyan text-[8px] font-bold uppercase tracking-wide" title="Labo d'appartenance">{a.labo}</span>
                        )}
                        <span className="text-[8px] font-mono text-gray-400">{a.uid} · {a.candidates.length} candidats</span>
                      </div>
                      <div className="space-y-2">
                        {a.candidates.map((c) => (
                          <label key={c.ppn} className="flex items-start gap-2 cursor-pointer p-1.5 hover:bg-white/60 dark:hover:bg-slate-800/60">
                            <input type="radio" name={`amb-${a.id}`} checked={chosen[a.id] === c.ppn} onChange={() => setChosen((p) => ({ ...p, [a.id]: c.ppn }))} className="mt-0.5" />
                            <CandidateLine c={c} />
                          </label>
                        ))}
                        <label className="flex items-center gap-2 cursor-pointer p-1.5 text-[9px] font-mono uppercase text-gray-500">
                          <input type="radio" name={`amb-${a.id}`} checked={!chosen[a.id]} onChange={() => setChosen((p) => { const n = { ...p }; delete n[a.id]; return n; })} />
                          Ignorer (ne rien écrire)
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Écarts de nom — atelier d'arbitrage (verify uniquement) */}
          {!isSearch && (
            <section>
              <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-black/10 dark:border-white/10">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <GitCompare className="w-4 h-4" />
                  <h3 className="text-sm font-pixel uppercase tracking-widest text-gray-900 dark:text-white">Écarts de nom — arbitrer ({diff.aArbitrer.length})</h3>
                </div>
                {diff.aArbitrer.length > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-mono uppercase text-gray-500">{arbStats.confirm} confirmés · {arbStats.detach} à détacher</span>
                    <button onClick={confirmAll} className="flex items-center gap-1.5 text-[9px] font-bold uppercase text-emerald-600 dark:text-pixel-teal hover:underline">
                      <Check className="w-4 h-4" /> Tout confirmer
                    </button>
                  </div>
                )}
              </div>
              {diff.aArbitrer.length === 0 ? (
                <p className="text-[10px] font-mono uppercase text-gray-400">Aucun écart de nom à arbitrer.</p>
              ) : (
                <>
                  <p className="text-[9px] font-mono uppercase text-gray-400 mb-3">
                    Translittération / nom composé / nom d'épouse = <b>confirmer</b>. Personne différente (en rouge) = <b>détacher</b>. La description IdRef aide à trancher.
                  </p>
                  <div className="space-y-3">
                    {diff.aArbitrer.map((a) => {
                      const dec = decisions[a.id];
                      const DecBtn: React.FC<{ value: Decision; icon: React.ReactNode; label: string; tone: string }> = ({ value, icon, label, tone }) => (
                        <button onClick={() => setDecision(a.id, value)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-bold uppercase border-2 border-black dark:border-white transition-all ${dec === value ? `${tone} text-white shadow-none translate-x-0.5 translate-y-0.5` : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 shadow-pixel-sm'}`}>
                          {icon} {label}
                        </button>
                      );
                      return (
                        <div key={a.id} className={`border-2 p-3 ${a.suspect ? 'border-pixel-pink bg-pixel-pink/5' : 'border-black dark:border-white bg-white dark:bg-slate-800'} ${dec === 'ignore' ? 'opacity-50' : ''} shadow-pixel-sm`}>
                          <div className="flex items-center gap-2 mb-2">
                            {a.suspect && <span className="px-1.5 py-0.5 bg-pixel-pink text-white text-[8px] font-bold uppercase">Probable erreur</span>}
                            <span className="text-[8px] font-mono text-gray-400">{a.uid} · {a.id}</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Grist */}
                            <div className="border border-black/15 dark:border-white/15 p-2">
                              <div className="text-[8px] font-bold uppercase text-gray-400 mb-1">Fiche Grist</div>
                              <div className="text-[11px] font-bold uppercase text-gray-900 dark:text-white">{a.displayName || '—'}</div>
                              <div className="text-[9px] font-mono text-gray-500 mt-1">
                                ORCID : {a.grist.orcid || '∅'}<br />IdHAL : {a.grist.idhal || '∅'}
                              </div>
                            </div>
                            {/* Notice IdRef */}
                            <div className="border border-black/15 dark:border-white/15 p-2">
                              <div className="text-[8px] font-bold uppercase text-gray-400 mb-1 flex items-center gap-1">
                                Notice IdRef
                                <a href={`https://www.idref.fr/${a.ppn}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-pixel-blue hover:underline"><Link2 className="w-3 h-3" />{a.ppn}</a>
                              </div>
                              <div className="text-[11px] font-bold uppercase text-gray-900 dark:text-white">{a.notice.fullName || '—'}</div>
                              <div className="text-[9px] font-mono text-gray-500 mt-1">
                                {a.notice.job && <>{a.notice.job}{(a.notice.birth || a.notice.death) ? ' · ' : ''}</>}
                                {(a.notice.birth || a.notice.death) && <>({a.notice.birth || '?'}{a.notice.death ? `–${a.notice.death}` : ''})</>}<br />
                                ORCID : {a.notice.orcid || '∅'}{a.notice.idhal ? ` · IdHAL : ${a.notice.idhal}` : ''}
                              </div>
                              {a.notice.description && <div className="text-[9px] font-mono text-gray-400 mt-1 line-clamp-2">{a.notice.description}</div>}
                            </div>
                          </div>
                          {/* Enrichissement appliqué si on confirme */}
                          {dec === 'confirm' && a.proposals.length > 0 && (
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[9px] font-mono">
                              <span className="font-bold uppercase text-gray-400">+ à l'enregistrement :</span>
                              {a.proposals.map((p, i) => (
                                <span key={i} className="px-1.5 py-0.5 bg-pixel-teal/20 text-gray-900 dark:text-white font-bold">{p.label} {p.after}</span>
                              ))}
                            </div>
                          )}
                          <div className="mt-2 flex items-center gap-2">
                            <DecBtn value="confirm" icon={<Check className="w-3.5 h-3.5" />} label="Confirmer" tone="bg-pixel-teal" />
                            <DecBtn value="detach" icon={<Unlink className="w-3.5 h-3.5" />} label="Mauvais IdRef" tone="bg-pixel-pink" />
                            <DecBtn value="ignore" icon={<MinusCircle className="w-3.5 h-3.5" />} label="Ignorer" tone="bg-slate-500" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </section>
          )}

          {/* Conflits (info) */}
          <section>
            <SectionTitle icon={<AlertTriangle className="w-4 h-4" />}>Conflits — revue manuelle ({diff.conflits.length})</SectionTitle>
            {diff.conflits.length === 0 ? (
              <p className="text-[10px] font-mono uppercase text-gray-400">Aucun conflit.</p>
            ) : (
              <div className="space-y-2">
                {diff.conflits.map((c) => (
                  <div key={c.id} className="border-2 border-pixel-yellow bg-pixel-yellow/5 p-2 text-[10px] font-mono">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold uppercase text-gray-900 dark:text-white">{c.displayName}</span>
                      <span className="text-gray-400">· {c.reason}</span>
                      {c.ppn && (
                        <a href={`https://www.idref.fr/${c.ppn}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-pixel-blue/20 text-pixel-blue hover:underline font-bold">
                          <Link2 className="w-3 h-3" /> notice {c.ppn}
                        </a>
                      )}
                    </div>
                    <div className="text-gray-600 dark:text-gray-300">{c.detail}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Non trouvés (search, info) */}
          {isSearch && (
            <section>
              <SectionTitle icon={<Search className="w-4 h-4" />}>Non trouvés ({diff.nonTrouves.length})</SectionTitle>
              {diff.nonTrouves.length > 0 && (
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-auto">
                  {diff.nonTrouves.map((n) => (
                    <span key={n.uid} className="px-1.5 py-0.5 border border-black/20 dark:border-white/20 text-[8px] font-mono text-gray-500 dark:text-gray-400">{n.displayName || n.uid}</span>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        <footer className="px-6 py-4 border-t-4 border-black dark:border-white bg-white dark:bg-slate-900 flex items-center justify-between gap-3">
          <span className="text-[8px] font-mono uppercase text-gray-400">Généré le {new Date(diff.generatedAt).toLocaleString('fr-FR')}</span>
          <div className="flex items-center gap-3">
            <button onClick={onClose} disabled={applying} className="px-5 py-2 text-[10px] font-bold uppercase text-gray-900 dark:text-white bg-white dark:bg-slate-800 border-2 border-black dark:border-white shadow-pixel hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all disabled:opacity-50">
              Annuler
            </button>
            <button
              onClick={() => onApply?.(updates)}
              disabled={applying || updates.length === 0}
              className="flex items-center gap-2 px-5 py-2 text-[10px] font-bold uppercase text-white bg-pixel-teal border-2 border-black dark:border-white shadow-pixel hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {applying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {applying ? 'Écriture…' : `Appliquer (${updates.length})`}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
