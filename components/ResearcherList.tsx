import React, { useState, useMemo } from 'react';
import { 
  CheckCircle, AlertCircle, RefreshCw, Clock, XCircle, MoreHorizontal, 
  Search, Merge, FileDown, Filter, Users, X, ArrowUp, ArrowDown, ArrowUpDown, Plus, LayoutGrid, List
} from 'lucide-react';
import { ResearcherDashboard } from './ResearcherDashboard';
import { Researcher, ResearcherStatus } from '../types';
import { SYNC_SOURCES } from '../constants';
import { SyncDialog } from './SyncDialog';
import { POLE_LAB_MAPPING, getPoleFromLab } from '../lib/mappings';
import { ExportService } from '../lib/exportService';
import { ResearcherIcons } from './researchers/ResearcherIcons';
import { useUrlState } from '../hooks/useUrlState';

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
  /** Création d'une nouvelle fiche */
  onNewResearcher?: () => void;
  /** État de chargement des données */
  loading?: boolean;
  /** Callback pour forcer la synchronisation manuelle */
  onManualSync?: () => void;
}

/** Clés autorisées pour le tri de la table */
type SortKey = 'displayName' | 'status' | 'employer' | 'structureName' | 'team';

/**
 * @component ResearcherList
 * @description Affiche la table interactive des personnels de recherche.
 * Incorpore la recherche textuelle, des filtres multicritères avancés, 
 * le tri multi-colonnes et des actions de masse (groupe, fusion).
 */
export const ResearcherList: React.FC<ResearcherListProps> = ({ researchers, setResearchers, onSelectResearcher, onNewResearcher, loading = false, onManualSync }) => {
  // 1. Enrichissement des données en temps réel (Priorité calcul > Grist vide)
  const enrichedResearchers = useMemo(() => {
    return researchers.map(r => {
      const primaryLab = r.affiliations.find(a => a.isPrimary)?.structureName || r.affiliations[0]?.structureName || '';
      const calculatedPole = getPoleFromLab(primaryLab);
      
      return {
        ...r,
        nuFields: {
          ...r.nuFields,
          pole: r.nuFields?.pole || calculatedPole
        }
      };
    });
  }, [researchers]);

  // États de sélection et recherche
  const [viewMode, setViewMode] = useState<'list' | 'dashboard'>('list');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  
  // États des filtres avancés
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterEmployer, setFilterEmployer] = useState<string>('ALL');
  const [filterLab, setFilterLab] = useState<string>('ALL');
  const [filterTypology, setFilterTypology] = useState<string>('ALL');
  const [filterPole, setFilterPole] = useState<string>('ALL');

  // Synchronisation avec l'URL
  const { setUrlState } = useUrlState(
    { 
      search: '', 
      status: 'ALL', 
      employer: 'ALL', 
      lab: 'ALL', 
      typology: 'ALL', 
      pole: 'ALL',
      mode: 'list'
    },
    (newState) => {
      if (newState.search !== undefined) setSearchTerm(newState.search || '');
      if (newState.status !== undefined) setFilterStatus(newState.status || 'ALL');
      if (newState.employer !== undefined) setFilterEmployer(newState.employer || 'ALL');
      if (newState.lab !== undefined) setFilterLab(newState.lab || 'ALL');
      if (newState.typology !== undefined) setFilterTypology(newState.typology || 'ALL');
      if (newState.pole !== undefined) setFilterPole(newState.pole || 'ALL');
      if (newState.mode !== undefined) setViewMode((newState.mode as 'list' | 'dashboard') || 'list');
    }
  );

  // Mise à jour de l'URL lors des changements d'état
  const updateSearch = (val: string) => { setSearchTerm(val); setUrlState({ search: val }); };
  const updateStatus = (val: string) => { setFilterStatus(val); setUrlState({ status: val }); };
  const updateEmployer = (val: string) => { setFilterEmployer(val); setUrlState({ employer: val }); };
  const updateLab = (val: string) => { setFilterLab(val); setUrlState({ lab: val }); };
  const updateTypology = (val: string) => { setFilterTypology(val); setUrlState({ typology: val }); };
  const updatePole = (val: string) => { setFilterPole(val); setUrlState({ pole: val }); };
  const updateViewMode = (val: 'list' | 'dashboard') => { setViewMode(val); setUrlState({ mode: val }); };

  // Configuration du tri
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);

  // Gestion de la modale "Ajout au groupe"
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupInput, setGroupInput] = useState('');
  
  const [filterDateStart, setFilterDateStart] = useState<string>('');
  const [filterDateEnd, setFilterDateEnd] = useState<string>('');
  
  // Filtres identifiants
  const [idFilters, setIdFilters] = useState({
    orcid: false,
    hal: false,
    idref: false,
    scopus: false
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50; 

  // Gestion de la synchronisation externe
  const [showSyncMenu, setShowSyncMenu] = useState(false);
  const [activeSync, setActiveSync] = useState<{ isOpen: boolean, source: string } | null>(null);

  /** Extraction dynamique des valeurs uniques pour remplir les sélecteurs de filtres */
  const employers = useMemo(() => Array.from(new Set(enrichedResearchers.map(r => r.employment.employer).filter(Boolean))), [enrichedResearchers]);
  const labs = useMemo(() => Array.from(new Set(enrichedResearchers.flatMap(r => r.affiliations.map(a => a.structureName)).filter(Boolean))), [enrichedResearchers]);
  const typologies = useMemo(() => Array.from(new Set(enrichedResearchers.map(r => r.employment.internalTypology).filter(Boolean))), [enrichedResearchers]);
  const poles = useMemo(() => Object.keys(POLE_LAB_MAPPING), []);
  const allGroups = useMemo(() => Array.from(new Set(enrichedResearchers.flatMap(r => r.groups))).sort(), [enrichedResearchers]);

  /** 
   * LOGIQUE DE FILTRAGE
   * Utilise useMemo pour ne recalculer que lorsque les critères ou les données changent.
   */
  const filteredResearchers = useMemo(() => {
    return enrichedResearchers.filter(r => {
      const primaryLab = r.affiliations.find(a => a.isPrimary)?.structureName || '';

      const matchesSearch = 
        r.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        primaryLab.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;
      const matchesEmployer = filterEmployer === 'ALL' || r.employment.employer === filterEmployer;
      const matchesLab = filterLab === 'ALL' || r.affiliations.some(a => a.structureName === filterLab);
      const matchesTypology = filterTypology === 'ALL' || r.employment.internalTypology === filterTypology;
      const matchesPole = filterPole === 'ALL' || r.nuFields?.pole === filterPole;

      const researcherArrival = r.employment.startDate;
      const researcherDeparture = r.employment.endDate;

      const matchesPeriod = 
        (!filterDateStart || !researcherDeparture || researcherDeparture >= filterDateStart) &&
        (!filterDateEnd || !researcherArrival || researcherArrival <= filterDateEnd);

      const matchesIds = 
        (!idFilters.orcid || !!r.identifiers.orcid) &&
        (!idFilters.hal || !!r.identifiers.halId) &&
        (!idFilters.idref || !!r.identifiers.idref) &&
        (!idFilters.scopus || !!r.identifiers.scopusId);

      return matchesSearch && matchesStatus && matchesEmployer && matchesLab && matchesTypology && matchesPole && matchesPeriod && matchesIds;
    });
  }, [researchers, searchTerm, filterStatus, filterEmployer, filterLab, filterTypology, filterPole, filterDateStart, filterDateEnd, idFilters]);

  // Réinitialiser la pagination lors d'un changement de filtre
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterEmployer, filterLab, filterTypology, filterPole, filterDateStart, filterDateEnd]);

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

  // Découpage pour pagination
  const paginatedResearchers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedResearchers.slice(start, start + pageSize);
  }, [sortedResearchers, currentPage]);

  const totalPages = Math.ceil(sortedResearchers.length / pageSize);

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
      case ResearcherStatus.INTERNE:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 border-2 border-black dark:border-pixel-teal bg-pixel-teal/20 text-slate-900 dark:text-pixel-teal text-[10px] font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
            <CheckCircle className="w-3 h-3" /> Interne
          </span>
        );
      case ResearcherStatus.DEPART:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 border-2 border-black dark:border-pixel-pink bg-pixel-pink/20 text-slate-900 dark:text-pixel-pink text-[10px] font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
            <XCircle className="w-3 h-3" /> Départ
          </span>
        );
      case ResearcherStatus.PARTI:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 border-2 border-black dark:border-pixel-blue bg-pixel-blue/20 text-slate-900 dark:text-pixel-blue text-[10px] font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
            <Clock className="w-3 h-3" /> Parti
          </span>
        );
      case ResearcherStatus.EXTERNE:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 border-2 border-black dark:border-pixel-yellow bg-pixel-yellow/20 text-slate-900 dark:text-pixel-yellow text-[10px] font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
            <AlertCircle className="w-3 h-3" /> Externe
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 border-2 border-black dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] uppercase font-bold">
            Aucun statut
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
      <SyncDialog 
        isOpen={!!activeSync} 
        onClose={() => setActiveSync(null)}
        title="Synchronisation"
        source={activeSync?.source || ''}
      />

      {/* Modale d''ajout groupé */}
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
      <header className="bg-white dark:bg-slate-900 border-b-4 border-black dark:border-white px-8 py-6 flex flex-col md:flex-row md:items-center justify-between sticky top-0 z-10 transition-colors">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-pixel text-gray-900 dark:text-white tracking-tight">
              PERSONNEL DE RECHERCHE
            </h2>
            <span className="text-[10px] font-bold border-2 border-black dark:border-white px-2 py-0.5 bg-pixel-blue/20 text-gray-900 dark:text-pixel-blue uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
               {sortedResearchers.length} {sortedResearchers.length > 1 ? 'RECORDS' : 'RECORD'}
            </span>
          </div>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-mono font-bold uppercase tracking-widest">
            {">"} GESTION ET VALIDATION DES IDENTITÉS
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
                  <div className="flex items-center gap-2 border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 transition-all focus-within:shadow-pixel group w-full">
                    <Search className="w-4 h-4 text-gray-400 group-focus-within:text-primary-dark transition-colors" />
                    <input 
                      type="text" 
                      placeholder="RECHERCHER PERSONNEL..." 
                      className="bg-transparent border-none focus:ring-0 text-[11px] font-bold uppercase w-full dark:text-white"
                      value={searchTerm}
                      onChange={(e) => updateSearch(e.target.value)}
                    />
                  </div>
                  <div className="hidden sm:flex border-2 border-black dark:border-white p-1 bg-white dark:bg-slate-800 shadow-pixel-sm">
                    <button 
                      onClick={() => updateViewMode('list')}
                      className={`p-1.5 transition-all ${viewMode === 'list' ? 'bg-primary-dark text-white' : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500'}`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => updateViewMode('dashboard')}
                      className={`p-1.5 transition-all ${viewMode === 'dashboard' ? 'bg-primary-dark text-white' : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500'}`}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                  </div>

          <div className="relative group/export">
            <button className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase text-gray-700 dark:text-white bg-white dark:bg-slate-800 border-2 border-black dark:border-white shadow-pixel hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
              <FileDown className="w-4 h-4" /> Export
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border-2 border-black dark:border-white shadow-pixel z-20 opacity-0 invisible group-hover/export:opacity-100 group-hover/export:visible transition-all">
               <button 
                onClick={() => ExportService.exportToCSV(sortedResearchers.map(r => ({ Nom: r.displayName, Email: r.email, Statut: r.status, Labo: r.affiliations[0]?.structureName || '' })), 'chercheurs_druid')}
                className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors border-b-2 border-black dark:border-white"
               >
                 CSV
               </button>
               <button 
                onClick={() => ExportService.exportToExcel(sortedResearchers.map(r => ({ Nom: r.displayName, Email: r.email, Statut: r.status, Labo: r.affiliations[0]?.structureName || '' })), 'chercheurs_druid')}
                className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors border-b-2 border-black dark:border-white"
               >
                 Excel (.xlsx)
               </button>
               <button 
                onClick={() => ExportService.exportResearchersPDF(sortedResearchers)}
                className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
               >
                 PDF
               </button>
            </div>
          </div>
          <button onClick={onNewResearcher} className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase text-white bg-pixel-teal border-2 border-black dark:border-white shadow-pixel hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
            <Plus className="w-4 h-4" /> Nouveau
          </button>
          <div className="relative">
            <button onClick={() => setShowSyncMenu(!showSyncMenu)} className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase text-white bg-primary-dark border-2 border-black dark:border-white shadow-pixel hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Synchroniser
            </button>
            {showSyncMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border-2 border-black dark:border-white shadow-pixel z-20 overflow-hidden">
                <button 
                  onClick={() => { setShowSyncMenu(false); onManualSync?.(); }} 
                  className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase text-primary-dark dark:text-pixel-blue hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black border-b-2 border-black dark:border-white flex items-center gap-2 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Forcer mise à jour Grist
                </button>
                <button 
                  onClick={() => { setShowSyncMenu(false); onManualSync?.(); }} 
                  className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase text-emerald-600 dark:text-pixel-teal hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black flex items-center gap-2 transition-colors"
                >
                  <Users className="w-4 h-4" />
                  Synchroniser LDAP
                </button>
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
                <input type="text" className="pl-10 pr-3 py-2 border-2 border-black dark:border-white focus:shadow-pixel transition-all w-full bg-white dark:bg-slate-800 text-[10px] font-mono uppercase" placeholder="RECHERCHER PERSONNEL..." value={searchTerm} onChange={(e) => updateSearch(e.target.value)} />
              </div>
              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2">
                   <button onClick={() => setIsGroupModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase text-secondary bg-purple-50 dark:bg-pixel-pink/10 border-2 border-black dark:border-white hover:bg-purple-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                     <Users className="w-3.5 h-3.5" /> Groupe
                   </button>
                   <button className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase text-warning bg-orange-50 dark:bg-pixel-yellow/10 border-2 border-black dark:border-white hover:bg-orange-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                     <Merge className="w-3.5 h-3.5" /> Fusion
                   </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t-2 border-black/10 dark:border-white/10">
              <Filter className="w-4 h-4 text-gray-400 mt-1.5" />
              
                    <div className="space-y-1">
                      <label className="text-[8px] font-mono font-bold text-gray-400 uppercase tracking-tighter">STATUT</label>
                      <select 
                        value={filterStatus}
                        onChange={(e) => updateStatus(e.target.value)}
                        className="w-full border-2 border-black dark:border-white p-1 text-[10px] font-bold bg-white dark:bg-slate-800 dark:text-white"
                      >
                        <option value="ALL">TOUS STATUTS</option>
                        <option value={ResearcherStatus.INTERNE}>INTERNE</option>
                        <option value={ResearcherStatus.DEPART}>DÉPART</option>
                        <option value={ResearcherStatus.PARTI}>PARTI</option>
                        <option value={ResearcherStatus.EXTERNE}>EXTERNE</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-mono font-bold text-gray-400 uppercase tracking-tighter">EMPLOYEUR</label>
                      <select 
                        value={filterEmployer}
                        onChange={(e) => updateEmployer(e.target.value)}
                        className="w-full border-2 border-black dark:border-white p-1 text-[10px] font-bold bg-white dark:bg-slate-800 dark:text-white"
                      >
                        <option value="ALL">TOUS EMPLOYEURS</option>
                        {employers.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-mono font-bold text-gray-400 uppercase tracking-tighter">LABO (AFFIL. PRINCIPALE)</label>
                      <select 
                        value={filterLab}
                        onChange={(e) => updateLab(e.target.value)}
                        className="w-full border-2 border-black dark:border-white p-1 text-[10px] font-bold bg-white dark:bg-slate-800 dark:text-white"
                      >
                        <option value="ALL">TOUS LABORATOIRES</option>
                        {labs.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-mono font-bold text-gray-400 uppercase tracking-tighter">TYPOLOGIE INTERNE</label>
                      <select 
                        value={filterTypology}
                        onChange={(e) => updateTypology(e.target.value)}
                        className="w-full border-2 border-black dark:border-white p-1 text-[10px] font-bold bg-white dark:bg-slate-800 dark:text-white"
                      >
                        <option value="ALL">TOUTES TYPOLOGIES</option>
                        {typologies.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-mono font-bold text-gray-400 uppercase tracking-tighter">PÔLE S&T</label>
                      <select 
                        value={filterPole}
                        onChange={(e) => updatePole(e.target.value)}
                        className="w-full border-2 border-black dark:border-white p-1 text-[10px] font-bold bg-white dark:bg-slate-800 dark:text-white"
                      >
                        <option value="ALL">TOUS PÔLES</option>
                        {poles.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
              
              <div className="flex flex-wrap gap-4 pt-4 border-t-2 border-black/10 dark:border-white/10 mt-2">
                <div className="flex items-center gap-2">
                   <span className="text-[8px] text-gray-400 font-bold uppercase mr-2">Identifiants :</span>
                   <label className="flex items-center gap-1.5 cursor-pointer group">
                      <input type="checkbox" checked={idFilters.orcid} onChange={e => setIdFilters({...idFilters, orcid: e.target.checked})} className="hidden" />
                      <div className={`w-6 h-6 border-2 border-black dark:border-white flex items-center justify-center transition-colors ${idFilters.orcid ? 'bg-[#A6CE39]' : 'bg-white dark:bg-slate-800'}`}>
                         {idFilters.orcid && <span className="text-[12px] font-bold text-white">iD</span>}
                      </div>
                      <span className="text-[9px] font-bold uppercase text-gray-500 group-hover:text-black dark:group-hover:text-white transition-colors">ORCID</span>
                   </label>
                   <label className="flex items-center gap-1.5 cursor-pointer group ml-2">
                      <input type="checkbox" checked={idFilters.hal} onChange={e => setIdFilters({...idFilters, hal: e.target.checked})} className="hidden" />
                      <div className={`w-6 h-6 border-2 border-black dark:border-white flex items-center justify-center transition-colors ${idFilters.hal ? 'bg-[#212139]' : 'bg-white dark:bg-slate-800'}`}>
                         {idFilters.hal && <span className="text-[10px] font-bold text-white">H</span>}
                      </div>
                      <span className="text-[9px] font-bold uppercase text-gray-500 group-hover:text-black dark:group-hover:text-white transition-colors">HAL</span>
                   </label>
                   <label className="flex items-center gap-1.5 cursor-pointer group ml-2">
                      <input type="checkbox" checked={idFilters.idref} onChange={e => setIdFilters({...idFilters, idref: e.target.checked})} className="hidden" />
                      <div className={`w-6 h-6 border-2 border-black dark:border-white flex items-center justify-center transition-colors overflow-hidden bg-white `}>
                         {idFilters.idref && <img src="/idref.svg" alt="IDRef" className="w-full h-full object-contain" />}
                      </div>
                      <span className="text-[9px] font-bold uppercase text-gray-500 group-hover:text-black dark:group-hover:text-white transition-colors">IdRef</span>
                   </label>
                   <label className="flex items-center gap-1.5 cursor-pointer group ml-2">
                      <input type="checkbox" checked={idFilters.scopus} onChange={e => setIdFilters({...idFilters, scopus: e.target.checked})} className="hidden" />
                      <div className={`w-6 h-6 border-2 border-black dark:border-white flex items-center justify-center transition-colors ${idFilters.scopus ? 'bg-[#FF8200]' : 'bg-white dark:bg-slate-800'}`}>
                         {idFilters.scopus && <span className="text-[12px] font-bold text-white">SC</span>}
                      </div>
                      <span className="text-[9px] font-bold uppercase text-gray-500 group-hover:text-black dark:group-hover:text-white transition-colors">SCOPUS</span>
                   </label>
                </div>

                <div className="flex items-center gap-2 border-l-2 border-black dark:border-white pl-4">
                  <span className="text-[8px] text-gray-400 font-bold uppercase">Dates :</span>
                  <input 
                    type="date" 
                    value={filterDateStart} 
                    onChange={(e) => setFilterDateStart(e.target.value)} 
                    className="text-[10px] border-2 border-black dark:border-white p-0.5 bg-white dark:bg-slate-800 font-mono" 
                  />
                  <span className="text-[10px] text-gray-400 font-mono">{"->"}</span>
                  <input 
                    type="date" 
                    value={filterDateEnd} 
                    onChange={(e) => setFilterDateEnd(e.target.value)} 
                    className="text-[10px] border-2 border-black dark:border-white p-0.5 bg-white dark:bg-slate-800 font-mono" 
                  />
                </div>
              </div>
            </div>
          </div>

          {viewMode === 'list' ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-slate-100 dark:bg-slate-950 font-pixel">
                    <tr>
                      <th className="px-6 py-3 w-10 border-b-2 border-black dark:border-white">
                        <input type="checkbox" className="border-2 border-black dark:border-white text-primary-dark focus:ring-0" checked={isAllSelected} onChange={toggleSelectAll} />
                      </th>
                      <SortableHeader label="Identité" sortKey="displayName" />
                      <SortableHeader label="Appartenance" sortKey="structureName" />
                      <SortableHeader label="Employeur" sortKey="employer" />
                      <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b-2 border-black dark:border-white font-pixel">IDs</th>
                      <SortableHeader label="Statut" sortKey="status" />
                      <th className="relative px-6 py-3 border-b-2 border-black dark:border-white"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900">
                    {paginatedResearchers.map((person) => (
                      <tr key={person.id} className={`hover:bg-pixel-blue/5 dark:hover:bg-pixel-blue/10 cursor-pointer border-b border-black/5 dark:border-white/5 group transition-colors ${selectedIds.has(person.id) ? 'bg-pixel-blue/10 dark:bg-pixel-blue/20' : ''}`} onClick={() => onSelectResearcher(person)}>
                        <td className="px-6 py-4" onClick={(e) => { e.stopPropagation(); toggleSelect(person.id); }}>
                          <input type="checkbox" className="border-2 border-black dark:border-white text-primary-dark focus:ring-0" checked={selectedIds.has(person.id)} readOnly />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 border-2 border-black dark:border-white bg-pixel-blue/20 flex items-center justify-center text-primary-dark dark:text-pixel-blue font-pixel text-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                              {person.displayName.charAt(0)}
                            </div>
                            <div className="ml-4">
                              <div className="text-[12px] font-bold text-gray-900 dark:text-white uppercase tracking-tight">{person.displayName}</div>
                              <div className="text-[8px] uppercase font-bold text-gray-400 font-mono tracking-tighter">{person.employment.internalTypology || 'NONE'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase font-mono">{person.affiliations.find(a => a.isPrimary)?.structureName || '-'}</td>
                        <td className="px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">{person.employment.employer}</td>
                        <td className="px-6 py-4">
                           <ResearcherIcons identifiers={person.identifiers} />
                        </td>
                        <td className="px-6 py-4">{getStatusBadge(person.status)}</td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-gray-400 hover:text-black dark:hover:text-white transition-colors"><MoreHorizontal className="w-5 h-5" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {loading && (
                  <div className="p-20 flex flex-col items-center justify-center gap-4">
                    <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-gray-500 dark:text-gray-400">Synchronisation avec Grist en cours...</p>
                  </div>
                )}
                {!loading && sortedResearchers.length === 0 && (
                  <div className="p-20 text-center text-gray-500">Aucun chercheur trouvé.</div>
                )}
              </div>
              
              {/* Pagination Controls */}
              {!loading && totalPages > 1 && (
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
                    <div className="flex items-center gap-2">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                         let pageNum = i + 1;
                         if (totalPages > 5 && currentPage > 3) {
                           pageNum = currentPage - 2 + i;
                           if (pageNum > totalPages - 4) pageNum = totalPages - 4 + i;
                         }
                         if (pageNum > totalPages) return null;
                         
                         return (
                          <button 
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-8 h-8 border-2 border-black dark:border-white text-xs font-bold transition-all shadow-pixel hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 ${currentPage === pageNum ? 'bg-primary-dark text-white' : 'bg-white dark:bg-slate-800'}`}
                          >
                            {pageNum}
                          </button>
                         );
                      })}
                    </div>
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
            </>
          ) : (
            <ResearcherDashboard researchers={sortedResearchers} />
          )}
        </div>
      </div>
    </div>
  );
};
