import React, { useMemo, useState } from 'react';
import { ShieldCheck, X, Upload, AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';
import { Researcher, ResearcherStatus } from '../../types';
import {
  ValidationScope,
  ValidationDiff,
  parseValidationList,
  computeValidationDiff,
} from '../../lib/validation';

interface ValidationImportReviewProps {
  researchers: Researcher[];
  /** Applique les validations retenues (la couche appelante persiste ou simule). */
  onApply: (
    diff: ValidationDiff,
    opts: { source: string; date: string; scope: ValidationScope[] },
  ) => void;
  onClose: () => void;
  applying?: boolean;
}

const todayIso = () => new Date().toISOString().split('T')[0];

/**
 * Atelier d'import d'une **liste fiable** (ex. chercheurs de Centrale, du LPPL).
 * Flux propose → revue → applique, calqué sur les autres revues de sync :
 *  1. coller/charger la liste + renseigner source, date, portée, statut par défaut
 *  2. apparier (uid → email → nom) et prévisualiser (validés / homonymes / introuvables)
 *  3. appliquer : pose la couche de validation (prime sur le statut dérivé du LDAP).
 */
export const ValidationImportReview: React.FC<ValidationImportReviewProps> = ({
  researchers, onApply, onClose, applying = false,
}) => {
  const [raw, setRaw] = useState('');
  const [source, setSource] = useState('');
  const [date, setDate] = useState(todayIso());
  const [scope, setScope] = useState<ValidationScope[]>(['statut', 'rattachement']);
  const [defaultStatus, setDefaultStatus] = useState<ResearcherStatus>(ResearcherStatus.INTERNE);
  const [diff, setDiff] = useState<ValidationDiff | null>(null);

  const rows = useMemo(() => parseValidationList(raw), [raw]);

  const toggleScope = (s: ValidationScope) =>
    setScope((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setRaw(String(reader.result || ''));
    reader.readAsText(file);
  };

  const analyze = () => {
    setDiff(
      computeValidationDiff(
        researchers.map((r) => ({
          id: r.id, uid: r.uid, email: r.email, displayName: r.displayName, status: r.status,
        })),
        rows,
        { source: source.trim() || 'Liste fiabilisée', date, scope, defaultStatus },
      ),
    );
  };

  const canAnalyze = rows.length > 0 && scope.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-900 border-4 border-black dark:border-white shadow-pixel w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* En-tête */}
        <div className="flex items-center justify-between px-6 py-4 border-b-4 border-black dark:border-white">
          <h3 className="flex items-center gap-2 font-pixel text-lg text-gray-900 dark:text-white uppercase">
            <ShieldCheck className="w-5 h-5 text-emerald-600" /> Importer une liste fiabilisée
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-black dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-auto space-y-5">
          {/* Étape 1 — saisie */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-gray-500">Liste (coller : nom, email, uid, statut)</label>
              <textarea
                value={raw}
                onChange={(e) => { setRaw(e.target.value); setDiff(null); }}
                rows={6}
                placeholder={'nom,email,uid\nDUPONT Jean,jean.dupont@x.fr,jdupont\n…'}
                className="w-full border-2 border-black dark:border-white bg-white dark:bg-slate-800 p-2 text-[11px] font-mono"
              />
              <label className="inline-flex items-center gap-2 text-[10px] font-bold uppercase text-pixel-blue cursor-pointer">
                <Upload className="w-3.5 h-3.5" /> …ou charger un CSV
                <input
                  type="file"
                  accept=".csv,.txt,text/csv"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) { handleFile(f); setDiff(null); } }}
                />
              </label>
              <p className="text-[10px] text-gray-400 font-mono">{rows.length} ligne(s) détectée(s)</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-500">Source (traçabilité)</label>
                <input
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="Liste Centrale 2026-06"
                  className="w-full border-2 border-black dark:border-white bg-white dark:bg-slate-800 p-2 text-[11px] font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-500">Date de validation</label>
                <input
                  type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="w-full border-2 border-black dark:border-white bg-white dark:bg-slate-800 p-2 text-[11px] font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-500">Statut par défaut</label>
                <select
                  value={defaultStatus}
                  onChange={(e) => setDefaultStatus(e.target.value as ResearcherStatus)}
                  className="w-full border-2 border-black dark:border-white bg-white dark:bg-slate-800 p-2 text-[11px] font-mono uppercase"
                >
                  {Object.values(ResearcherStatus).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <p className="text-[9px] text-gray-400 mt-0.5">Utilisé si la ligne ne précise pas de statut.</p>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-500">Portée de la validation</label>
                <div className="flex gap-4 mt-1">
                  {(['statut', 'rattachement'] as ValidationScope[]).map((s) => (
                    <label key={s} className="flex items-center gap-1.5 text-[11px] font-bold uppercase cursor-pointer">
                      <input type="checkbox" checked={scope.includes(s)} onChange={() => toggleScope(s)} /> {s}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {!diff && (
            <button
              onClick={analyze}
              disabled={!canAnalyze}
              className="w-full py-2.5 bg-pixel-blue text-white font-bold uppercase text-xs border-2 border-black dark:border-white shadow-pixel disabled:opacity-40"
            >
              Analyser l'appariement
            </button>
          )}

          {/* Étape 2 — revue */}
          {diff && (
            <div className="space-y-4">
              <div className="flex gap-2 text-[10px] font-bold uppercase">
                <span className="px-2 py-1 border-2 border-emerald-600 bg-emerald-50 text-emerald-700">{diff.matched.length} à valider</span>
                <span className="px-2 py-1 border-2 border-orange-500 bg-orange-50 text-orange-700">{diff.ambiguous.length} homonymes</span>
                <span className="px-2 py-1 border-2 border-gray-400 bg-gray-50 text-gray-600">{diff.unmatched.length} introuvables</span>
              </div>

              {diff.matched.length > 0 && (
                <div className="border-2 border-black dark:border-white">
                  <div className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-[10px] font-bold uppercase flex items-center gap-1.5 border-b-2 border-black dark:border-white">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Fiches qui seront validées
                  </div>
                  <div className="max-h-48 overflow-auto divide-y divide-black/10 dark:divide-white/10">
                    {diff.matched.map((m) => (
                      <div key={m.researcherId} className="px-3 py-1.5 flex items-center justify-between text-[11px]">
                        <span className="font-bold uppercase">{m.displayName}</span>
                        <span className="flex items-center gap-2 font-mono text-[10px]">
                          <span className="text-gray-400">{m.matchedBy}</span>
                          {m.overrides
                            ? <span className="text-orange-600">{m.currentStatus} → {m.newStatus}</span>
                            : <span className="text-emerald-600">{m.newStatus}</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {diff.ambiguous.length > 0 && (
                <div className="border-2 border-orange-500">
                  <div className="px-3 py-1.5 bg-orange-50 text-[10px] font-bold uppercase flex items-center gap-1.5 border-b-2 border-orange-500 text-orange-700">
                    <AlertTriangle className="w-3.5 h-3.5" /> Homonymes — non appliqués (à lever manuellement)
                  </div>
                  <div className="max-h-32 overflow-auto divide-y divide-orange-200">
                    {diff.ambiguous.map((a, i) => (
                      <div key={i} className="px-3 py-1.5 text-[11px] flex justify-between">
                        <span className="font-bold">{a.row.name || a.row.raw}</span>
                        <span className="font-mono text-[10px] text-gray-400">{a.candidateIds.length} candidats</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {diff.unmatched.length > 0 && (
                <details className="border-2 border-gray-300 dark:border-gray-600">
                  <summary className="px-3 py-1.5 bg-gray-50 dark:bg-slate-800 text-[10px] font-bold uppercase flex items-center gap-1.5 cursor-pointer">
                    <HelpCircle className="w-3.5 h-3.5" /> Introuvables ({diff.unmatched.length})
                  </summary>
                  <div className="max-h-32 overflow-auto px-3 py-1.5 text-[11px] font-mono text-gray-500">
                    {diff.unmatched.map((u, i) => <div key={i}>{u.name || u.email || u.uid || u.raw}</div>)}
                  </div>
                </details>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setDiff(null)}
                  className="px-4 py-2 border-2 border-black dark:border-white text-xs font-bold uppercase bg-white dark:bg-slate-800"
                >
                  Modifier
                </button>
                <button
                  onClick={() => onApply(diff, { source: diff.source, date: diff.date, scope: diff.scope })}
                  disabled={applying || diff.matched.length === 0}
                  className="flex-1 py-2 bg-emerald-600 text-white font-bold uppercase text-xs border-2 border-black dark:border-white shadow-pixel disabled:opacity-40"
                >
                  {applying ? 'Application…' : `Valider ${diff.matched.length} fiche(s)`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
