import React, { useState, useMemo } from 'react';
import { Search, FileDown, UploadCloud, ArrowRight, Filter, Merge, Trash2, ArrowUp, ArrowDown, Users, CheckCircle, Network } from 'lucide-react';
import { Structure, StructureStatus, StructureLevel } from '../types';

import { SyncDialog } from './SyncDialog';
import { ExportService } from '../lib/exportService';
import { useUrlState } from '../hooks/useUrlState';

/** Props du composant StructureList */
interface StructureListProps {
  /** Liste des structures à afficher */
  structures: Structure[];
  /** Callback lors de la sélection d'une structure pour voir le détail */
  onSelectStructure: (s: Structure) => void;
}

/** Clés de tri autorisées pour les structures */
type SortKey = 'identity' | 'supervisors' | 'level' | 'status';

/**
 * @component StructureList
 * @description Vue principale des structures de recherche (Laboratoires, Unités, Équipes).
 */
export const StructureList: React.FC<StructureListProps> = ({ structures, onSelectStructure }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);
  const [syncOpen, setSyncOpen] = useState(false);

  // Filtres actifs
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterSupervisor, setFilterSupervisor] = useState<string>('ALL');
  const [filterPole, setFilterPole] = useState<string>('ALL');

  // Synchronisation avec l'URL
  const { setUrlState } = useUrlState(
    { 
      search: '', 
      level: 'ALL', 
      status: 'ALL', 
      supervisor: 'ALL', 
      pole: 'ALL' 
    },
    (newState) => {
      if (newState.search !== undefined) setSearchTerm(newState.search || '');
      if (newState.level !== undefined) setFilterLevel(newState.level || 'ALL');
      if (newState.status !== undefined) setFilterStatus(newState.status || 'ALL');
      if (newState.supervisor !== undefined) setFilterSupervisor(newState.supervisor || 'ALL');
      if (newState.pole !== undefined) setFilterPole(newState.pole || 'ALL');
    }
  );

  // Mise à jour de l'URL lors des changements d'état
  const updateSearch = (val: string) => { setSearchTerm(val); setUrlState({ search: val }); };
  const updateLevel = (val: string) => { setFilterLevel(val); setUrlState({ level: val }); };
  const updateStatus = (val: string) => { setFilterStatus(val); setUrlState({ status: val }); };
  const updateSupervisor = (val: string) => { setFilterSupervisor(val); setUrlState({ supervisor: val }); };
  const updatePole = (val: string) => { setFilterPole(val); setUrlState({ pole: val }); };

  // Pagination virtuelle
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const supervisors = useMemo(() => Array.from(new Set(structures.flatMap(s => s.supervisors))).sort(), [structures]);
  const poles = useMemo(() => [...new Set(structures.map(s => s.cluster || '').filter(Boolean))].sort(), [structures]);

  const filteredStructures = useMemo(() => {
    return structures.filter(s => {
      const matchesSearch = 
        s.officialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.acronym.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.rnsrId.toLowerCase().includes(searchTerm.toLowerCase());
      const levelString = String(s.level);
      const matchesLevel = filterLevel === 'ALL' || levelString === filterLevel;
      const matchesStatus = filterStatus === 'ALL' || s.status === filterStatus;
      const matchesSupervisor = filterSupervisor === 'ALL' || s.supervisors.includes(filterSupervisor);
      const matchesPole = filterPole === 'ALL' || s.cluster === filterPole;
      return matchesSearch && matchesLevel && matchesStatus && matchesSupervisor && matchesPole;
    });
  }, [structures, searchTerm, filterLevel, filterStatus, filterSupervisor, filterPole]);

  const sortedStructures = useMemo(() => {
    if (!sortConfig) return filteredStructures;
    return [...filteredStructures].sort((a, b) => {
      let aValue = '', bValue = '';
      switch (sortConfig.key) {
        case 'identity': aValue = a.acronym || ''; bValue = b.acronym || ''; break;
        case 'supervisors': aValue = a.supervisors[0] || ''; bValue = b.supervisors[0] || ''; break;
        case 'level': aValue = String(a.level) || ''; bValue = String(b.level) || ''; break;
        case 'status': aValue = a.status || ''; bValue = b.status || ''; break;
        default: return 0;
      }
      return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    });
  }, [filteredStructures, sortConfig]);

  const paginatedStructures = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedStructures.slice(start, start + pageSize);
  }, [sortedStructures, currentPage]);

  const totalPages = Math.ceil(sortedStructures.length / pageSize);

  const handleSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const isAllSelected = paginatedStructures.length > 0 && paginatedStructures.every(s => selectedIds.has(s.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const newSelected = new Set(selectedIds);
      paginatedStructures.forEach(s => newSelected.delete(s.id));
      setSelectedIds(newSelected);
    } else {
      const newSelected = new Set(selectedIds);
      paginatedStructures.forEach(s => newSelected.add(s.id));
      setSelectedIds(newSelected);
    }
  };

  const getLevelBadge = (level: string | number) => {
    const strLvl = String(level);
    switch(strLvl) {
      case StructureLevel.ETABLISSEMENT: 
      case 'ETABLISSEMENT':
      case '4':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 border-2 border-black dark:border-purple-400 bg-purple-100 dark:bg-purple-900/30 text-slate-900 dark:text-purple-300 text-[10px] font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">Établissement</span>;
      case StructureLevel.ENTITE:
      case 'ENTITE':
      case '2':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 border-2 border-black dark:border-indigo-400 bg-indigo-100 dark:bg-indigo-900/30 text-slate-900 dark:text-indigo-300 text-[10px] font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">Unité</span>;
      case StructureLevel.INTERMEDIAIRE:
      case 'INTERMEDIAIRE':
      case '3':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 border-2 border-black dark:border-blue-400 bg-blue-100 dark:bg-blue-900/30 text-slate-900 dark:text-blue-300 text-[10px] font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">Str. intermédiaire</span>;
      case StructureLevel.EQUIPE:
      case 'EQUIPE':
      case '1':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 border-2 border-black dark:border-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 text-slate-900 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">Équipe</span>;
      default: return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 border-2 border-black bg-gray-100 text-gray-700 text-[10px] font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">{strLvl}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 border-2 border-black text-[10px] font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${status === 'ACTIVE' || status === StructureStatus.ACTIVE ? 'bg-pixel-teal text-gray-900' : 'bg-pixel-blue text-white'}`}>
        {status === 'ACTIVE' || status === StructureStatus.ACTIVE ? <CheckCircle className="w-3 h-3" /> : ''}
        {status}
      </span>
    );
  };

  const SortableHeader = ({ label, sortKey }: { label: string, sortKey: SortKey }) => {
    const isActive = sortConfig?.key === sortKey;
    return (
      <th 
        scope="col" 
        className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest cursor-pointer group hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors select-none border-b-2 border-black dark:border-white font-pixel"
        onClick={() => handleSort(sortKey)}
      >
        <div className="flex items-center gap-1">
          {label}
          <span className={`transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            {isActive && sortConfig?.direction === 'desc' ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />}
          </span>
        </div>
      </th>
    );
  };

  return (
    <div className="flex flex-col h-full bg-background dark:bg-slate-900 relative">
      <SyncDialog isOpen={syncOpen} onClose={() => setSyncOpen(false)} title="Exportation" source="RNest" />

      <header className="bg-white dark:bg-slate-900 border-b-4 border-black dark:border-white px-8 py-6 flex flex-col md:flex-row md:items-center justify-between sticky top-0 z-10 transition-colors">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-pixel text-gray-900 dark:text-white tracking-tight">
              STRUCTURES DE RECHERCHE
            </h2>
            <span className="text-[10px] font-bold border-2 border-black dark:border-white px-2 py-0.5 bg-pixel-teal text-gray-900 uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
               {sortedStructures.length} {sortedStructures.length > 1 ? 'RECORDS' : 'RECORD'}
            </span>
          </div>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-mono font-bold uppercase tracking-widest">
            {">"} RÉFÉRENTIEL DES LABORATOIRES ET ÉQUIPES
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
          <div className="relative group/export">
            <button className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase text-gray-700 dark:text-white bg-white dark:bg-slate-800 border-2 border-black dark:border-white shadow-pixel hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
              <FileDown className="w-4 h-4" /> Export
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border-2 border-black dark:border-white shadow-pixel z-20 opacity-0 invisible group-hover/export:opacity-100 group-hover/export:visible transition-all">
               <button 
                onClick={() => ExportService.exportToCSV(sortedStructures.map(s => ({ Acronyme: s.acronym, Nom: s.officialName, Tutelles: s.supervisors.join('|'), Statut: s.status })), 'structures_druid')}
                className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors border-b-2 border-black dark:border-white"
               >
                 CSV
               </button>
               <button 
                onClick={() => ExportService.exportToExcel(sortedStructures.map(s => ({ Acronyme: s.acronym, Nom: s.officialName, Tutelles: s.supervisors.join('|'), Statut: s.status })), 'structures_druid')}
                className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors border-b-2 border-black dark:border-white"
               >
                 Excel (.xlsx)
               </button>
            </div>
          </div>
          <button onClick={() => setSyncOpen(true)} className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase text-white bg-secondary border-2 border-black dark:border-white shadow-pixel hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
            <UploadCloud className="w-4 h-4" /> Export RNest
          </button>
        </div>
      </header>

      <div className="p-8 flex-1 overflow-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
           <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input 
                  type="text" 
                  className="pl-10 pr-3 py-2 border-2 border-black dark:border-white focus:shadow-pixel transition-all w-full bg-white dark:bg-slate-800 text-[10px] font-mono uppercase" 
                  placeholder="RECHERCHER STRUCTURE..." 
                  value={searchTerm} 
                  onChange={(e) => updateSearch(e.target.value)} 
                />
              </div>

              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2">
                   <button className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase bg-pixel-blue text-white border-2 border-black shadow-pixel-sm">
                      <Merge className="w-3.5 h-3.5" /> Fusionner ({selectedIds.size})
                   </button>
                   <button className="p-2 text-pixel-pink border-2 border-pixel-pink bg-white shadow-pixel-sm active:shadow-none transition-all">
                      <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 pt-2 border-t-2 border-black/10 dark:border-white/10">
                <Filter className="w-4 h-4 text-gray-400 mt-1.5" />
                <select 
                  value={filterLevel} 
                  onChange={(e) => updateLevel(e.target.value)} 
                  className="text-[10px] font-bold uppercase border-2 border-black dark:border-white p-1 bg-white dark:bg-slate-800"
                >
                  <option value="ALL">TOUS NIVEAUX</option>
                  <option value={StructureLevel.ETABLISSEMENT}>Établissement (Niv. 4)</option>
                  <option value={StructureLevel.INTERMEDIAIRE}>Intermédiaire (Niv. 3)</option>
                  <option value={StructureLevel.ENTITE}>Unité (Niv. 2)</option>
                  <option value={StructureLevel.EQUIPE}>Équipe (Niv. 1)</option>
                </select>
                <select 
                  value={filterStatus} 
                  onChange={(e) => updateStatus(e.target.value)} 
                  className="text-[10px] font-bold uppercase border-2 border-black dark:border-white p-1 bg-white dark:bg-slate-800"
                >
                  <option value="ALL">TOUS STATUTS</option>
                  <option value={StructureStatus.ACTIVE}>ACTIVE</option>
                  <option value={StructureStatus.PROJET}>PROJET</option>
                  <option value={StructureStatus.EN_FERMETURE}>FERMETURE</option>
                  <option value={StructureStatus.FERMEE}>FERMÉE</option>
                </select>
                <select 
                  value={filterSupervisor} 
                  onChange={(e) => updateSupervisor(e.target.value)} 
                  className="text-[10px] font-bold uppercase border-2 border-black dark:border-white p-1 bg-white dark:bg-slate-800 max-w-[200px]"
                >
                  <option value="ALL">TOUTES TUTELLES</option>
                  {supervisors.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select 
                  value={filterPole} 
                  onChange={(e) => updatePole(e.target.value)} 
                  className="text-[10px] font-bold uppercase border-2 border-black dark:border-white p-1 bg-white dark:bg-slate-800"
                >
                  <option value="ALL">TOUS PÔLES</option>
                  {poles.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-slate-100 dark:bg-slate-950 font-pixel">
                <tr>
                  <th className="px-6 py-3 w-10 border-b-2 border-black dark:border-white">
                    <input type="checkbox" className="border-2 border-black dark:border-white text-primary-dark focus:ring-0" checked={isAllSelected} onChange={toggleSelectAll} />
                  </th>
                  <SortableHeader label="Structure" sortKey="identity" />
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b-2 border-black dark:border-white font-pixel">IDs</th>
                  <SortableHeader label="Tutelles" sortKey="supervisors" />
                  <SortableHeader label="Niveau" sortKey="level" />
                  <SortableHeader label="Statut" sortKey="status" />
                  <th className="px-6 py-3 border-b-2 border-black dark:border-white w-10"></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900">
                {paginatedStructures.map((s) => (
                  <tr key={s.id} className={`hover:bg-pixel-teal/5 dark:hover:bg-pixel-teal/10 cursor-pointer border-b border-black/5 dark:border-white/5 group transition-colors ${selectedIds.has(s.id) ? 'bg-pixel-teal/10 dark:bg-pixel-teal/20' : ''}`} onClick={() => onSelectStructure(s)}>
                    <td className="px-6 py-4" onClick={(e) => { e.stopPropagation(); toggleSelect(s.id); }}>
                       <input type="checkbox" className="border-2 border-black dark:border-white text-primary-dark focus:ring-0" checked={selectedIds.has(s.id)} readOnly />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 border-2 border-black dark:border-white bg-pixel-teal text-gray-900 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                           <Network className="w-5 h-5" />
                        </div>
                        <div className="ml-4">
                          <span className="text-[12px] font-bold text-gray-900 dark:text-white uppercase tracking-tight">{s.acronym}</span>
                          <span className="block text-[8px] uppercase font-bold text-gray-400 font-mono tracking-tighter line-clamp-1">{s.officialName}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {s.rnsrId && (
                          <div className="flex items-center gap-1.5 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all">
                            <span className="text-[9px] font-bold bg-slate-100 dark:bg-slate-800 px-1 border border-black/10 dark:border-white/10 text-gray-500 font-mono">RNSR</span>
                            <span className="text-[9px] font-mono text-gray-600 dark:text-gray-400">{s.rnsrId}</span>
                          </div>
                        )}
                        {s.rorId && (
                          <div className="flex items-center gap-1.5 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all">
                             <span className="text-[9px] font-bold bg-blue-50 dark:bg-blue-900/20 px-1 border border-blue-200 dark:border-blue-800 text-blue-600 font-mono">ROR</span>
                             <span className="text-[9px] font-mono text-gray-600 dark:text-gray-400">{s.rorId}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        {s.supervisors.map((sup, i) => (
                          <span key={i} className="px-1.5 py-0.5 text-[8px] font-bold uppercase rounded-sm border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                             {sup}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs">{getLevelBadge(s.level)}</td>
                    <td className="px-6 py-4">{getStatusBadge(s.status)}</td>
                    <td className="px-6 py-4 text-right">
                       <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {sortedStructures.length === 0 && (
               <div className="p-20 text-center text-gray-500 font-bold uppercase text-sm">Aucune structure trouvée.</div>
            )}
          </div>
          
          {totalPages > 1 && (
            <div className="px-6 py-5 flex items-center justify-between border-t-2 border-black dark:border-white bg-slate-50 dark:bg-slate-950 font-pixel">
               <div className="text-sm text-gray-500 dark:text-gray-400">
                 PAGE <span className="font-bold text-black dark:text-white">{currentPage}</span> / <span className="font-bold text-black dark:text-white">{totalPages}</span>
               </div>
               <div className="flex gap-2">
                 <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-1 border-2 border-black dark:border-white text-xs font-bold uppercase shadow-pixel hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 disabled:opacity-50 transition-all bg-white dark:bg-slate-800"
                  >
                    {"<"} PREV
                  </button>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-1 border-2 border-black dark:border-white text-xs font-bold uppercase shadow-pixel hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 disabled:opacity-50 transition-all bg-white dark:bg-slate-800"
                  >
                    NEXT {">"}
                  </button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
