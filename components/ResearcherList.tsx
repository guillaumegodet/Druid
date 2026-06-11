import React, { useState } from 'react';
import { List, LayoutGrid } from 'lucide-react';
import { ResearcherDashboard } from './ResearcherDashboard';
import { Researcher } from '../types';
import { SyncDialog } from './SyncDialog';
import { useResearcherFilters } from '../hooks/useResearcherFilters';
import { FilterPanel } from './researchers/FilterPanel';
import { ListHeader } from './researchers/ListHeader';
import { ResearcherTable } from './researchers/ResearcherTable';
import { GroupModal } from './researchers/GroupModal';

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
  /** Callback pour télécharger people.csv */
  onSyncToSovisu?: () => void;
  /** Callback d'alignement IdRef (démo statique) */
  onAlignIdref?: (mode: 'search' | 'verify') => void;
  /** Alignement IdRef en cours */
  idrefBusy?: boolean;
}

/**
 * @component ResearcherList
 * @description Affiche la table interactive des personnels de recherche.
 * Incorpore la recherche textuelle, des filtres multicritères avancés,
 * le tri multi-colonnes et des actions de masse (groupe, fusion).
 */
export const ResearcherList: React.FC<ResearcherListProps> = ({
  researchers, setResearchers, onSelectResearcher, onNewResearcher,
  loading = false, onManualSync, onSyncToSovisu, onAlignIdref, idrefBusy = false,
}) => {
  const filters = useResearcherFilters(researchers);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [showSyncMenu, setShowSyncMenu] = useState(false);
  const [activeSync, setActiveSync] = useState<{ isOpen: boolean; source: string } | null>(null);

  const isAllSelected =
    filters.sortedResearchers.length > 0 &&
    filters.sortedResearchers.every(r => selectedIds.has(r.id));

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filters.sortedResearchers.forEach(r => next.delete(r.id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filters.sortedResearchers.forEach(r => next.add(r.id));
        return next;
      });
    }
  };

  const handleConfirmGroupAdd = (groupName: string) => {
    setResearchers(prev => prev.map(r =>
      selectedIds.has(r.id) && !r.groups.includes(groupName)
        ? { ...r, groups: [...r.groups, groupName] }
        : r
    ));
    setSelectedIds(new Set());
    setIsGroupModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-background dark:bg-slate-900 relative">
      <SyncDialog
        isOpen={!!activeSync}
        onClose={() => setActiveSync(null)}
        title="Synchronisation"
        source={activeSync?.source || ''}
      />

      <GroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onConfirm={handleConfirmGroupAdd}
        selectedCount={selectedIds.size}
        allGroups={filters.allGroups}
      />

      <ListHeader
        count={filters.sortedResearchers.length}
        loading={loading}
        onManualSync={onManualSync}
        onSyncToSovisu={onSyncToSovisu}
        onNewResearcher={onNewResearcher}
        showSyncMenu={showSyncMenu}
        onToggleSyncMenu={() => setShowSyncMenu(v => !v)}
        onCloseSyncMenu={() => setShowSyncMenu(false)}
        sortedResearchers={filters.sortedResearchers}
        onAlignIdref={onAlignIdref}
        idrefBusy={idrefBusy}
      />

      <div className="p-8 flex-1 overflow-auto">
        {/* Onglets de bascule Liste / Dataviz — l'onglet actif « collé » à la carte */}
        <div className="flex items-end gap-1.5 px-1">
          {([
            { key: 'list', label: 'Liste', Icon: List },
            { key: 'dashboard', label: 'Dataviz', Icon: LayoutGrid },
          ] as const).map(({ key, label, Icon }) => {
            const active = filters.viewMode === key;
            return (
              <button
                key={key}
                onClick={() => filters.updateViewMode(key)}
                aria-pressed={active}
                title={key === 'list' ? 'Vue liste (tableau)' : 'Vue dataviz (graphiques)'}
                className={`relative flex items-center gap-2 px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest font-pixel border-2 border-black dark:border-white border-b-0 rounded-t-md transition-all ${
                  active
                    ? 'bg-pixel-blue text-white shadow-[3px_-3px_0px_0px_rgba(0,0,0,0.2)] -mb-[2px] z-10'
                    : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 translate-y-[3px] hover:translate-y-[1px] hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            );
          })}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg rounded-tl-none shadow-sm border border-gray-200 dark:border-gray-700">
          <FilterPanel
            searchTerm={filters.searchTerm}
            onSearchChange={filters.updateSearch}
            filterStatuses={filters.filterStatuses}
            onStatusChange={filters.updateStatuses}
            filterEmployers={filters.filterEmployers}
            onEmployerChange={filters.updateEmployers}
            filterLabs={filters.filterLabs}
            onLabChange={filters.updateLabs}
            filterGrades={filters.filterGrades}
            onGradeChange={filters.updateGrades}
            filterContractTypes={filters.filterContractTypes}
            onContractTypeChange={filters.updateContractTypes}
            filterLocations={filters.filterLocations}
            onLocationChange={filters.updateLocations}
            filterDateStart={filters.filterDateStart}
            filterDateEnd={filters.filterDateEnd}
            onDateStartChange={filters.setFilterDateStart}
            onDateEndChange={filters.setFilterDateEnd}
            idFilters={filters.idFilters}
            onIdFiltersChange={filters.setIdFilters}
            employers={filters.employers}
            labs={filters.labs}
            grades={filters.grades}
            contractTypes={filters.contractTypes}
            locations={filters.locations}
            selectedCount={selectedIds.size}
            onOpenGroupModal={() => setIsGroupModalOpen(true)}
          />

          {filters.viewMode === 'list' ? (
            <ResearcherTable
              researchers={filters.paginatedResearchers}
              selectedIds={selectedIds}
              isAllSelected={isAllSelected}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
              onSelectResearcher={onSelectResearcher}
              loading={loading}
              sortedCount={filters.sortedResearchers.length}
              sortConfig={filters.sortConfig}
              onSort={filters.handleSort}
              currentPage={filters.currentPage}
              totalPages={filters.totalPages}
              onPageChange={filters.setCurrentPage}
            />
          ) : (
            <ResearcherDashboard researchers={filters.sortedResearchers} />
          )}
        </div>
      </div>
    </div>
  );
};
