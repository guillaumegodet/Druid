import React, { useState, useMemo } from 'react';
import { 
  CheckCircle, AlertCircle, RefreshCw, Clock, XCircle, MoreHorizontal, 
  Search, Merge, FileDown, Filter, Users, X, ArrowUp, ArrowDown, ArrowUpDown
} from 'lucide-react';
import { Researcher, ResearcherStatus } from '../types';
import { SYNC_SOURCES } from '../constants';
import { SyncDialog } from './SyncDialog';

/**
 * Props pour le composant ResearcherList
 */
interface ResearcherListProps {
  /** Liste complète des chercheurs */
  researchers: Researcher[];
  /** Fonction de mise à jour de la liste (utilisée pour les groupes ou fusions) */
  setResearchers: React.Dispatch<React.SetStateAction<Researcher[]>>;
  /** Callback lors de la sélection d'un chercheur pour voir le détail */
  onSelectResearcher: (researcher: Researcher) => void;
}

/** Clés autorisées pour le tri de la table */
type SortKey = 'displayName' | 'status' | 'employer' | 'structureName' | 'team';

/**
 * @component ResearcherList
 * @description Affiche la table interactive des personnels de recherche.
 * Incorpore la recherche textuelle, des filtres multicritères avancés, 
 * le tri multi-colonnes et des actions de masse (groupe, fusion).
 */
export const ResearcherList: React.FC<ResearcherListProps> = ({ researchers, setResearchers, onSelectResearcher }) => {
  // États de sélection et recherche
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  
  // Configuration du tri
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);

  // Gestion de la modale "Ajout au groupe"
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupInput, setGroupInput] = useState('');
  
  // États des filtres avancés
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterEmployer, setFilterEmployer] = useState<string>('ALL');
  const [filterLab, setFilterLab] = useState<string>('ALL');
  const [filterTypology, setFilterTypology] = useState<string>('ALL');

  // Gestion de la synchronisation externe
  const [showSyncMenu, setShowSyncMenu] = useState(false);
  const [activeSync, setActiveSync] = useState<{ isOpen: boolean, source: string } | null>(null);

  /** Extraction dynamique des valeurs uniques pour remplir les sélecteurs de filtres */
  const employers = useMemo(() => Array.from(new Set(researchers.map(r => r.employment.employer).filter(Boolean))), [researchers]);
  const labs = useMemo(() => Array.from(new Set(researchers.flatMap(r => r.affiliations.map(a => a.structureName)).filter(Boolean))), [researchers]);
  const typologies = useMemo(() => Array.from(new Set(researchers.map(r => r.employment.internalTypology).filter(Boolean))), [researchers]);
  const allGroups = useMemo(() => Array.from(new Set(researchers.flatMap(r => r.groups))).sort(), [researchers]);

  /** 
   * LOGIQUE DE FILTRAGE
   * Utilise useMemo pour ne recalculer que lorsque les critères ou les données changent.
   */
  const filteredResearchers = useMemo(() => {
    return researchers.filter(r => {
      const primaryLab = r.affiliations.find(a => a.isPrimary)?.structureName || '';

      const matchesSearch = 
        r.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        primaryLab.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;
      const matchesEmployer = filterEmployer === 'ALL' || r.employment.employer === filterEmployer;
      const matchesLab = filterLab === 'ALL' || r.affiliations.some(a => a.structureName === filterLab);
      const matchesTypology = filterTypology === 'ALL' || r.employment.internalTypology === filterTypology;

      return matchesSearch && matchesStatus && matchesEmployer && matchesLab && matchesTypology;
    });
  }, [researchers, searchTerm, filterStatus, filterEmployer, filterLab, filterTypology]);

  /** LOGIQUE DE TRI appliqué après le filtrage */
  const sortedResearchers = useMemo(() => {
    if (!sortConfig) return filteredResearchers;

    return [...filteredResearchers].sort((a, b) => {
      let aValue = '';
      let bValue = '';

      switch (sortConfig.key) {
        case 'displayName':
          aValue = a.displayName; bValue = b.displayName;
          break;
        case 'status':
          aValue = a.status; bValue = b.status;
          break;
        case 'employer':
          aValue = a.employment.employer; bValue = b.employment.employer;
          break;
        case 'structureName':
          aValue = a.affiliations.find(aff => aff.isPrimary)?.structureName || '';
          bValue = b.affiliations.find(aff => aff.isPrimary)?.structureName || '';
          break;
        case 'team':
          aValue = a.affiliations.find(aff => aff.isPrimary)?.team || '';
          bValue = b.affiliations.find(aff => aff.isPrimary)?.team || '';
          break;
        default:
          return 0;
      }

      return sortConfig.direction === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    });
  }, [filteredResearchers, sortConfig]);

  /** Bascule le tri sur une colonne spécifique */
  const handleSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  /** Gère la sélection/désélection individuelle d'un chercheur */
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  /** État calculé pour la case "Tout sélectionner" */
  const isAllSelected = sortedResearchers.length > 0 && sortedResearchers.every(r => selectedIds.has(r.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const newSelected = new Set(selectedIds);
      sortedResearchers.forEach(r => newSelected.delete(r.id));
      setSelectedIds(newSelected);
    } else {
      const newSelected = new Set(selectedIds);
      sortedResearchers.forEach(r => newSelected.add(r.id));
      setSelectedIds(newSelected);
    }
  };

  /** Validation de l'ajout massif à un groupe */
  const handleConfirmGroupAdd = () => {
    const groupName = groupInput.trim();
    if (groupName !== "") {
      setResearchers(prev => prev.map(r => {
        if (selectedIds.has(r.id) && !r.groups.includes(groupName)) {
          return { ...r, groups: [...r.groups, groupName] };
        }
        return r;
      }));
      setSelectedIds(new Set());
      setIsGroupModalOpen(false);
    }
  };

  /** 
   * Rendu du badge de statut coloré.
   * @param {ResearcherStatus} status - Le statut à afficher.
   */
  const getStatusBadge = (status: ResearcherStatus) => {
    switch (status) {
      case ResearcherStatus.VALIDATED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800 whitespace-nowrap">
            <CheckCircle className="w-3 h-3" /> Validé
          </span>
        );
      case ResearcherStatus.LEFT:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-600 whitespace-nowrap">
            <XCircle className="w-3 h-3" /> Parti
          </span>
        );
      case ResearcherStatus.ANTICIPATED:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border border-blue-200 dark:border-blue-800 whitespace-nowrap">
            <Clock className="w-3 h-3" /> Anticipé
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 border border-orange-200 dark:border-orange-800 whitespace-nowrap">
            <AlertCircle className="w-3 h-3" /> Forme auteur
          </span>
        );
    }
  };

  /** Composant interne pour les en-têtes de colonnes triables */
  const SortableHeader = ({ label, sortKey }: { label: string, sortKey: SortKey }) => {
    const isActive = sortConfig?.key === sortKey;
    return (
      <th 
        scope="col" 
        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none"
        onClick={() => handleSort(sortKey)}
      >
        <div className="flex items-center gap-1">
          {label}
          <span className={`transition-opacity ${isActive ? 'opacity-100 text-primary dark:text-blue-400' : 'opacity-0 group-hover:opacity-50'}`}>
            {isActive && sortConfig?.direction === 'desc' ? <ArrowDown className="w-3.5 h-3.5" /> : isActive ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowUpDown className="w-3.5 h-3.5" />}
          </span>
        </div>
      </th>
    );
  };

  return (
    <div className="flex flex-col h-full bg-background dark:bg-slate-900 relative">
      <SyncDialog 
        isOpen={!!activeSync} 
        onClose={() => setActiveSync(null)}
        title="Synchronisation"
        source={activeSync?.source || ''}
      />

      {/* Modale d'ajout groupé */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
              <h3 className="font-semibold text-gray-800 dark:text-white">Ajouter à un groupe</h3>
              <button onClick={() => setIsGroupModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nom du groupe</label>
              <input
                type="text"
                value={groupInput}
                onChange={(e) => setGroupInput(e.target.value)}
                list="existing-groups"
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary"
                placeholder="Sélectionnez ou créez..."
                autoFocus
              />
              <datalist id="existing-groups">
                {allGroups.map(g => <option key={g} value={g} />)}
              </datalist>
              <div className="text-sm text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                 {selectedIds.size} chercheur(s) sélectionné(s)
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
              <button onClick={() => setIsGroupModalOpen(false)} className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">Annuler</button>
              <button onClick={handleConfirmGroupAdd} disabled={!groupInput.trim()} className="px-4 py-2 text-sm text-white bg-primary rounded-md hover:bg-blue-700 disabled:opacity-50">Valider</button>
            </div>
          </div>
        </div>
      )}

      {/* Header avec bouton synchro et export */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-5 flex flex-col md:flex-row md:items-center justify-between sticky top-0 z-10 transition-colors">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Personnel de recherche</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestion et validation des identités</p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
            <FileDown className="w-4 h-4" /> Export CSV
          </button>
          <div className="relative">
            <button onClick={() => setShowSyncMenu(!showSyncMenu)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-blue-700">
              <RefreshCw className="w-4 h-4" /> Synchroniser
            </button>
            {showSyncMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg z-20 border border-gray-100 dark:border-gray-700 overflow-hidden">
                {SYNC_SOURCES.map((source) => (
                  <button key={source.id} onClick={() => { setShowSyncMenu(false); setActiveSync({ isOpen: true, source: source.label }); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                    {source.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Table et Filtres */}
      <div className="p-8 flex-1 overflow-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input type="text" className="pl-10 pr-3 py-2 border dark:border-gray-600 rounded-md w-full bg-white dark:bg-gray-700 text-sm" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2">
                   <button onClick={() => setIsGroupModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 text-xs text-secondary bg-purple-50 dark:bg-purple-900/30 border dark:border-purple-800 rounded hover:bg-purple-100">
                     <Users className="w-3.5 h-3.5" /> Groupe
                   </button>
                   <button className="flex items-center gap-2 px-3 py-1.5 text-xs text-warning bg-orange-50 dark:bg-orange-900/30 border dark:border-orange-800 rounded hover:bg-orange-100">
                     <Merge className="w-3.5 h-3.5" /> Fusion
                   </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t dark:border-gray-700">
              <Filter className="w-4 h-4 text-gray-400 mt-1.5" />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="text-xs border dark:border-gray-600 rounded p-1 bg-white dark:bg-gray-700">
                <option value="ALL">Tous statuts</option>
                <option value={ResearcherStatus.VALIDATED}>Validé</option>
                <option value={ResearcherStatus.NON_VALIDATED}>Forme Auteur</option>
                <option value={ResearcherStatus.ANTICIPATED}>Anticipé</option>
              </select>
              <select value={filterTypology} onChange={(e) => setFilterTypology(e.target.value)} className="text-xs border dark:border-gray-600 rounded p-1 bg-white dark:bg-gray-700">
                <option value="ALL">Toutes typologies</option>
                {typologies.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={filterEmployer} onChange={(e) => setFilterEmployer(e.target.value)} className="text-xs border dark:border-gray-600 rounded p-1 bg-white dark:bg-gray-700">
                <option value="ALL">Tous employeurs</option>
                {employers.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 w-10">
                    <input type="checkbox" className="rounded text-primary focus:ring-primary" checked={isAllSelected} onChange={toggleSelectAll} />
                  </th>
                  <SortableHeader label="Identité" sortKey="displayName" />
                  <SortableHeader label="Statut" sortKey="status" />
                  <SortableHeader label="Employeur" sortKey="employer" />
                  <SortableHeader label="Appartenance" sortKey="structureName" />
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Groupes</th>
                  <th className="relative px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {sortedResearchers.map((person) => (
                  <tr key={person.id} className={`hover:bg-blue-50/30 dark:hover:bg-blue-900/10 cursor-pointer ${selectedIds.has(person.id) ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`} onClick={() => onSelectResearcher(person)}>
                    <td className="px-6 py-4" onClick={(e) => { e.stopPropagation(); toggleSelect(person.id); }}>
                      <input type="checkbox" className="rounded text-primary focus:ring-primary" checked={selectedIds.has(person.id)} readOnly />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-primary dark:text-blue-200 font-bold text-sm">
                          {person.displayName.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{person.displayName}</div>
                          <div className="text-[10px] uppercase font-bold text-gray-400">{person.employment.internalTypology || 'Non définie'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(person.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{person.employment.employer}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{person.affiliations.find(a => a.isPrimary)?.structureName || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {person.groups.map((g, i) => <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border dark:border-gray-600">{g}</span>)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-gray-400 hover:text-gray-600"><MoreHorizontal className="w-5 h-5" /></button>
                    </td>
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
