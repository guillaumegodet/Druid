import React, { useState, useMemo } from 'react';
import { Search, FileDown, UploadCloud, ArrowRight, Activity, Filter, ArrowUp, ArrowDown, ArrowUpDown, Trash2, Merge } from 'lucide-react';
import { MOCK_STRUCTURES } from '../constants';
import { Structure, StructureStatus, StructureLevel } from '../types';
import { SyncDialog } from './SyncDialog';

/** Props du composant StructureList */
interface StructureListProps {
  /** Callback lors de la sélection d'une structure pour voir le détail */
  onSelectStructure: (s: Structure) => void;
}

/** Clés de tri autorisées pour les structures */
type SortKey = 'identity' | 'cluster' | 'supervisors' | 'level' | 'status';

/**
 * @component StructureList
 * @description Vue principale des structures de recherche (Laboratoires, Unités, Équipes).
 * Permet de naviguer dans l'arborescence de l'établissement via des filtres par niveau
 * de structure et par tutelle.
 */
export const StructureList: React.FC<StructureListProps> = ({ onSelectStructure }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);
  const [syncOpen, setSyncOpen] = useState(false);

  // Filtres actifs
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterSupervisor, setFilterSupervisor] = useState<string>('ALL');

  /** Liste des tutelles uniques pour le filtre */
  const supervisors = useMemo(() => Array.from(new Set(MOCK_STRUCTURES.flatMap(s => s.supervisors))).sort(), []);

  /** Filtrage mémorisé des structures */
  const filteredStructures = useMemo(() => {
    return MOCK_STRUCTURES.filter(s => {
      const matchesSearch = 
        s.officialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.acronym.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.rnsrId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLevel = filterLevel === 'ALL' || s.level === filterLevel;
      const matchesStatus = filterStatus === 'ALL' || s.status === filterStatus;
      const matchesSupervisor = filterSupervisor === 'ALL' || s.supervisors.includes(filterSupervisor);
      return matchesSearch && matchesLevel && matchesStatus && matchesSupervisor;
    });
  }, [searchTerm, filterLevel, filterStatus, filterSupervisor]);

  /** Tri mémorisé */
  const sortedStructures = useMemo(() => {
    if (!sortConfig) return filteredStructures;
    return [...filteredStructures].sort((a, b) => {
      let aValue = '', bValue = '';
      switch (sortConfig.key) {
        case 'identity': return sortConfig.direction === 'asc' ? a.acronym.localeCompare(b.acronym) : b.acronym.localeCompare(a.acronym);
        case 'level': aValue = a.level; bValue = b.level; break;
        case 'status': aValue = a.status; bValue = b.status; break;
        default: return 0;
      }
      return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    });
  }, [filteredStructures, sortConfig]);

  const handleSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  /** Formate les badges de niveau conformes au cadre national */
  const getLevelBadge = (level: StructureLevel) => {
      switch(level) {
        case StructureLevel.ETABLISSEMENT: return <span className="text-purple-700 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded border border-purple-100">Établissement</span>;
        case StructureLevel.ENTITE: return <span className="text-indigo-700 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded border border-indigo-100">Unité</span>;
        case StructureLevel.EQUIPE: return <span className="text-gray-500 italic flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>Équipe</span>;
        default: return level;
      }
  };

  return (
    <div className="flex flex-col h-full bg-background dark:bg-slate-900 relative">
      <SyncDialog isOpen={syncOpen} onClose={() => setSyncOpen(false)} title="Exportation" source="RNest" />

      <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-8 py-5 flex items-center justify-between sticky top-0 transition-colors">
        <div><h2 className="text-2xl font-bold text-gray-800 dark:text-white">Structures de recherche</h2><p className="text-sm text-gray-500">Référentiel des laboratoires et équipes</p></div>
        <div className="flex gap-3">
           <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium border dark:border-gray-600 rounded-md dark:text-gray-200"><FileDown className="w-4 h-4" /> Export CSV</button>
           <button onClick={() => setSyncOpen(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-secondary rounded-md shadow-sm"><UploadCloud className="w-4 h-4" /> Export RNest</button>
        </div>
      </header>

      <div className="p-8 flex-1 overflow-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
           <div className="p-4 border-b dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="relative max-w-sm w-full"><Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" /><input type="text" className="pl-10 pr-3 py-2 border dark:border-gray-600 rounded-md w-full dark:bg-gray-700 text-sm" placeholder="Rechercher (Acronyme, RNSR)..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
              {selectedIds.size > 0 && <div className="flex gap-2"><button className="flex items-center gap-2 px-3 py-1.5 text-xs text-warning bg-orange-50 dark:bg-orange-900/30 border dark:border-orange-800 rounded"><Merge className="w-3.5 h-3.5" /> Fusionner</button><button className="flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 bg-red-50 dark:bg-red-900/30 border dark:border-red-800 rounded"><Trash2 className="w-3.5 h-3.5" /> Supprimer</button></div>}
            </div>
            <div className="flex gap-2 pt-2 border-t dark:border-gray-700">
                <Filter className="w-4 h-4 text-gray-400 mt-1" />
                <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} className="text-xs border dark:border-gray-600 rounded p-1 bg-white dark:bg-gray-700"><option value="ALL">Tous niveaux</option><option value={StructureLevel.ETABLISSEMENT}>Établissement</option><option value={StructureLevel.ENTITE}>Unité</option><option value={StructureLevel.EQUIPE}>Équipe</option></select>
                <select value={filterSupervisor} onChange={(e) => setFilterSupervisor(e.target.value)} className="text-xs border dark:border-gray-600 rounded p-1 bg-white dark:bg-gray-700"><option value="ALL">Toutes tutelles</option>{supervisors.map(sup => <option key={sup} value={sup}>{sup}</option>)}</select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr><th className="px-6 py-3 w-10"></th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Structure</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tutelles</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Niveau</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th><th className="w-10"></th></tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700 bg-white dark:bg-gray-800">
                {sortedStructures.map((s) => (
                  <tr key={s.id} className="hover:bg-purple-50/30 dark:hover:bg-purple-900/10 cursor-pointer" onClick={() => onSelectStructure(s)}>
                    <td className="px-6 py-4"><input type="checkbox" className="rounded text-secondary" onClick={(e) => e.stopPropagation()} /></td>
                    <td className="px-6 py-4"><div className="flex flex-col"><span className="text-sm font-bold dark:text-white">{s.acronym}</span><span className="text-xs text-gray-500 line-clamp-1">{s.officialName}</span></div></td>
                    <td className="px-6 py-4"><div className="flex flex-wrap gap-1">{s.supervisors.slice(0, 2).map((sup, i) => <span key={i} className="px-2 py-0.5 text-[10px] rounded bg-gray-100 dark:bg-gray-700 dark:text-gray-300">{sup}</span>)}</div></td>
                    <td className="px-6 py-4 text-xs">{getLevelBadge(s.level)}</td>
                    <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.status === StructureStatus.ACTIVE ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{s.status}</span></td>
                    <td className="px-6 py-4"><ArrowRight className="w-5 h-5 text-gray-400" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
