import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import type { SortKey, SortConfig } from '../../hooks/useResearcherFilters';

interface SortableHeaderProps {
  label: string;
  sortKey: SortKey;
  sortConfig: SortConfig | null;
  onSort: (key: SortKey) => void;
}

export const SortableHeader: React.FC<SortableHeaderProps> = ({ label, sortKey, sortConfig, onSort }) => {
  const isActive = sortConfig?.key === sortKey;
  return (
    <th
      scope="col"
      className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest cursor-pointer group hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors select-none border-b-2 border-black dark:border-white font-pixel"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        <span className={`transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          {isActive && sortConfig?.direction === 'desc'
            ? <ArrowDown className="w-3.5 h-3.5" />
            : <ArrowUp className="w-3.5 h-3.5" />}
        </span>
      </div>
    </th>
  );
};
