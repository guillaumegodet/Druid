import React, { useState } from 'react';
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
}

/**
 * @component ResearcherList
 * @description Affiche la table interactive des personnels de recherche.
 * Incorpore la recherche textuelle, des filtres multicritères avancés,
 * le tri multi-colonnes et des actions de masse (groupe, fusion).
 */
export const ResearcherList: React.FC<ResearcherListProps> = ({
  researchers, setResearchers, onSelectResearcher, onNewResearcher,
  loading = false, onManualSync, onSyncToSovisu,
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
        viewMode={filters.viewMode}
        onChangeViewMode={filters.updateViewMode}
        loading={loading}
        onManualSync={onManualSync}
        onSyncToSovisu={onSyncToSovisu}
        onNewResearcher={onNewResearcher}
        showSyncMenu={showSyncMenu}
        onToggleSyncMenu={() => setShowSyncMenu(v => !v)}
        onCloseSyncMenu={() => setShowSyncMenu(false)}
        sortedResearchers={filters.sortedResearchers}
      />

      <div className="p-8 flex-1 overflow-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
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
