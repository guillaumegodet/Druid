import React from 'react';
import { Search, Filter, Users, Merge } from 'lucide-react';
import { ResearcherStatus } from '../../types';
import { MultiSelectFilter } from './MultiSelectFilter';
import type { IdFilters } from '../../hooks/useResearcherFilters';

interface FilterPanelProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  filterStatuses: string[];
  onStatusChange: (vals: string[]) => void;
  filterEmployers: string[];
  onEmployerChange: (vals: string[]) => void;
  filterLabs: string[];
  onLabChange: (vals: string[]) => void;
  filterGrades: string[];
  onGradeChange: (vals: string[]) => void;
  filterContractTypes: string[];
  onContractTypeChange: (vals: string[]) => void;
  filterLocations: string[];
  onLocationChange: (vals: string[]) => void;
  filterDateStart: string;
  filterDateEnd: string;
  onDateStartChange: (val: string) => void;
  onDateEndChange: (val: string) => void;
  idFilters: IdFilters;
  onIdFiltersChange: (filters: IdFilters) => void;
  employers: string[];
  labs: string[];
  grades: string[];
  contractTypes: string[];
  locations: string[];
  selectedCount: number;
  onOpenGroupModal: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  searchTerm, onSearchChange,
  filterStatuses, onStatusChange,
  filterEmployers, onEmployerChange,
  filterLabs, onLabChange,
  filterGrades, onGradeChange,
  filterContractTypes, onContractTypeChange,
  filterLocations, onLocationChange,
  filterDateStart, filterDateEnd, onDateStartChange, onDateEndChange,
  idFilters, onIdFiltersChange,
  employers, labs, grades, contractTypes, locations,
  selectedCount, onOpenGroupModal,
}) => (
  <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 space-y-4">
    <div className="flex items-center justify-between">
      <div className="relative max-w-sm w-full">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input
          type="text"
          className="pl-10 pr-3 py-2 border-2 border-black dark:border-white focus:shadow-pixel transition-all w-full bg-white dark:bg-slate-800 text-[10px] font-mono uppercase"
          placeholder="RECHERCHER PERSONNEL..."
          value={searchTerm}
          onChange={e => onSearchChange(e.target.value)}
        />
      </div>
      {selectedCount > 0 && (
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenGroupModal}
            className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase text-secondary bg-purple-50 dark:bg-pixel-pink/10 border-2 border-black dark:border-white hover:bg-purple-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
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

      <MultiSelectFilter
        label="STATUT"
        options={[
          { value: ResearcherStatus.INTERNE, label: 'INTERNE' },
          { value: ResearcherStatus.DEPART,  label: 'DÉPART' },
          { value: ResearcherStatus.PARTI,   label: 'PARTI' },
          { value: ResearcherStatus.EXTERNE, label: 'EXTERNE' },
        ]}
        selected={filterStatuses}
        onChange={onStatusChange}
      />
      <MultiSelectFilter
        label="EMPLOYEUR"
        options={employers.map(e => ({ value: e, label: e }))}
        selected={filterEmployers}
        onChange={onEmployerChange}
      />
      <MultiSelectFilter
        label="LABO (AFFIL. PRINCIPALE)"
        options={labs.map(l => ({ value: l, label: l }))}
        selected={filterLabs}
        onChange={onLabChange}
      />
      <MultiSelectFilter
        label="GRADE / CORPS"
        options={grades.map(g => ({ value: g, label: g }))}
        selected={filterGrades}
        onChange={onGradeChange}
      />
      <MultiSelectFilter
        label="TYPE D'EMPLOI"
        options={contractTypes.map(c => ({ value: c, label: c }))}
        selected={filterContractTypes}
        onChange={onContractTypeChange}
      />
      <MultiSelectFilter
        label="LOCALISATION"
        options={locations.map(l => ({ value: l, label: l }))}
        selected={filterLocations}
        onChange={onLocationChange}
      />

      <div className="flex flex-wrap gap-4 pt-4 border-t-2 border-black/10 dark:border-white/10 mt-2">
        <div className="flex items-center gap-2">
          <span className="text-[8px] text-gray-400 font-bold uppercase mr-2">Identifiants :</span>

          <label className="flex items-center gap-1.5 cursor-pointer group">
            <input type="checkbox" checked={idFilters.orcid} onChange={e => onIdFiltersChange({ ...idFilters, orcid: e.target.checked })} className="hidden" />
            <div className={`w-6 h-6 border-2 border-black dark:border-white flex items-center justify-center transition-colors ${idFilters.orcid ? 'bg-[#A6CE39]' : 'bg-white dark:bg-slate-800'}`}>
              {idFilters.orcid && <span className="text-[12px] font-bold text-white">iD</span>}
            </div>
            <span className="text-[9px] font-bold uppercase text-gray-500 group-hover:text-black dark:group-hover:text-white transition-colors">ORCID</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer group ml-2">
            <input type="checkbox" checked={idFilters.hal} onChange={e => onIdFiltersChange({ ...idFilters, hal: e.target.checked })} className="hidden" />
            <div className={`w-6 h-6 border-2 border-black dark:border-white flex items-center justify-center transition-colors ${idFilters.hal ? 'bg-[#212139]' : 'bg-white dark:bg-slate-800'}`}>
              {idFilters.hal && <span className="text-[10px] font-bold text-white">H</span>}
            </div>
            <span className="text-[9px] font-bold uppercase text-gray-500 group-hover:text-black dark:group-hover:text-white transition-colors">HAL</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer group ml-2">
            <input type="checkbox" checked={idFilters.idref} onChange={e => onIdFiltersChange({ ...idFilters, idref: e.target.checked })} className="hidden" />
            <div className="w-6 h-6 border-2 border-black dark:border-white flex items-center justify-center transition-colors overflow-hidden bg-white">
              {idFilters.idref && <img src={`${import.meta.env.BASE_URL}idref.svg`} alt="IDRef" className="w-full h-full object-contain" />}
            </div>
            <span className="text-[9px] font-bold uppercase text-gray-500 group-hover:text-black dark:group-hover:text-white transition-colors">IdRef</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer group ml-2">
            <input type="checkbox" checked={idFilters.scopus} onChange={e => onIdFiltersChange({ ...idFilters, scopus: e.target.checked })} className="hidden" />
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
            onChange={e => onDateStartChange(e.target.value)}
            className="text-[10px] border-2 border-black dark:border-white p-0.5 bg-white dark:bg-slate-800 font-mono"
          />
          <span className="text-[10px] text-gray-400 font-mono">{'->'}</span>
          <input
            type="date"
            value={filterDateEnd}
            onChange={e => onDateEndChange(e.target.value)}
            className="text-[10px] border-2 border-black dark:border-white p-0.5 bg-white dark:bg-slate-800 font-mono"
          />
        </div>
      </div>
    </div>
  </div>
);
