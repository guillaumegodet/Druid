import React from 'react';
import { RefreshCw, MoreHorizontal } from 'lucide-react';
import { Researcher } from '../../types';
import { ResearcherIcons } from './ResearcherIcons';
import { StatusBadge } from './StatusBadge';
import { SortableHeader } from './SortableHeader';
import type { SortKey, SortConfig } from '../../hooks/useResearcherFilters';

interface ResearcherTableProps {
  researchers: Researcher[];
  selectedIds: Set<string>;
  isAllSelected: boolean;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onSelectResearcher: (r: Researcher) => void;
  loading: boolean;
  sortedCount: number;
  sortConfig: SortConfig | null;
  onSort: (key: SortKey) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const ResearcherTable: React.FC<ResearcherTableProps> = ({
  researchers, selectedIds, isAllSelected, onToggleSelect, onToggleSelectAll,
  onSelectResearcher, loading, sortedCount, sortConfig, onSort,
  currentPage, totalPages, onPageChange,
}) => (
  <>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-slate-100 dark:bg-slate-950 font-pixel">
          <tr>
            <th className="px-6 py-3 w-10 border-b-2 border-black dark:border-white">
              <input
                type="checkbox"
                className="border-2 border-black dark:border-white text-primary-dark focus:ring-0"
                checked={isAllSelected}
                onChange={onToggleSelectAll}
              />
            </th>
            <SortableHeader label="Identité" sortKey="displayName" sortConfig={sortConfig} onSort={onSort} />
            <SortableHeader label="Appartenance" sortKey="structureName" sortConfig={sortConfig} onSort={onSort} />
            <SortableHeader label="Employeur" sortKey="employer" sortConfig={sortConfig} onSort={onSort} />
            <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b-2 border-black dark:border-white font-pixel">IDs</th>
            <SortableHeader label="Statut" sortKey="status" sortConfig={sortConfig} onSort={onSort} />
            <th className="relative px-6 py-3 border-b-2 border-black dark:border-white" />
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-slate-900">
          {researchers.map(person => (
            <tr
              key={person.id}
              className={`hover:bg-pixel-pink/5 dark:hover:bg-pixel-pink/10 cursor-pointer border-b border-black/5 dark:border-white/5 group transition-colors ${selectedIds.has(person.id) ? 'bg-pixel-pink/10 dark:bg-pixel-pink/20' : ''}`}
              onClick={() => onSelectResearcher(person)}
            >
              <td className="px-6 py-4" onClick={e => { e.stopPropagation(); onToggleSelect(person.id); }}>
                <input type="checkbox" className="border-2 border-black dark:border-white text-primary-dark focus:ring-0" checked={selectedIds.has(person.id)} readOnly />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-10 w-10 border-2 border-black dark:border-white bg-pixel-pink text-white flex items-center justify-center font-pixel text-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    {person.displayName.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <div className="text-[12px] font-bold text-gray-900 dark:text-white uppercase tracking-tight">{person.displayName}</div>
                    <div className="text-[8px] uppercase font-bold text-gray-400 font-mono tracking-tighter">{person.employment.internalTypology || 'NONE'}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase font-mono">
                {person.affiliations.find(a => a.isPrimary)?.structureName || '-'}
              </td>
              <td className="px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">{person.employment.employer}</td>
              <td className="px-6 py-4"><ResearcherIcons identifiers={person.identifiers} /></td>
              <td className="px-6 py-4"><StatusBadge status={person.status} /></td>
              <td className="px-6 py-4 text-right">
                <button className="text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
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
      {!loading && sortedCount === 0 && (
        <div className="p-20 text-center text-gray-500">Aucun chercheur trouvé.</div>
      )}
    </div>

    {!loading && totalPages > 1 && (
      <div className="px-6 py-5 flex items-center justify-between border-t-2 border-black dark:border-white bg-slate-50 dark:bg-slate-950 font-pixel">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          PAGE <span className="font-bold text-black dark:text-white">{currentPage}</span> / <span className="font-bold text-black dark:text-white">{totalPages}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-4 py-1 border-2 border-black dark:border-white text-xs font-bold uppercase shadow-pixel hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 disabled:opacity-50 transition-all bg-white dark:bg-slate-800"
          >
            {'<'} PREV
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
                  onClick={() => onPageChange(pageNum)}
                  className={`w-8 h-8 border-2 border-black dark:border-white text-xs font-bold transition-all shadow-pixel hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 ${currentPage === pageNum ? 'bg-pixel-blue text-white' : 'bg-white dark:bg-slate-800'}`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-1 border-2 border-black dark:border-white text-xs font-bold uppercase shadow-pixel hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 disabled:opacity-50 transition-all bg-white dark:bg-slate-800"
          >
            NEXT {'>'}
          </button>
        </div>
      </div>
    )}
  </>
);
