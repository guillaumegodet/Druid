import React from 'react';
import { FileDown, Plus, RefreshCw, Users, Search, GitCompare } from 'lucide-react';
import { Researcher } from '../../types';
import { ExportService } from '../../lib/exportService';
import { hasRole } from '../../lib/auth';

interface ListHeaderProps {
  count: number;
  loading: boolean;
  onManualSync?: () => void;
  onSyncToSovisu?: () => void;
  onNewResearcher?: () => void;
  showSyncMenu: boolean;
  onToggleSyncMenu: () => void;
  onCloseSyncMenu: () => void;
  sortedResearchers: Researcher[];
  onAlignIdref?: (mode: 'search' | 'verify') => void;
  idrefBusy?: boolean;
}

export const ListHeader: React.FC<ListHeaderProps> = ({
  count, loading, onManualSync, onSyncToSovisu,
  onNewResearcher, showSyncMenu, onToggleSyncMenu, onCloseSyncMenu, sortedResearchers,
  onAlignIdref, idrefBusy = false,
}) => {
  const exportRows = sortedResearchers.map(r => ({
    Nom: r.displayName,
    Email: r.email,
    Statut: r.status,
    Labo: r.affiliations[0]?.structureName || '',
  }));

  return (
    <header className="bg-white dark:bg-slate-900 border-b-4 border-black dark:border-white px-8 py-6 flex flex-col md:flex-row md:items-center justify-between sticky top-0 z-10 transition-colors">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-pixel text-gray-900 dark:text-white tracking-tight">
            PERSONNEL DE RECHERCHE
          </h2>
          <span className="text-[10px] font-bold border-2 border-black dark:border-white px-2 py-0.5 bg-pixel-pink text-white uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            {count} {count > 1 ? 'RECORDS' : 'RECORD'}
          </span>
        </div>
        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-mono font-bold uppercase tracking-widest">
          {'>'} GESTION ET VALIDATION DES IDENTITÉS
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
        <div className="relative group/export">
          <button className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase text-gray-700 dark:text-white bg-white dark:bg-slate-800 border-2 border-black dark:border-white shadow-pixel hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
            <FileDown className="w-4 h-4" /> Export
          </button>
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border-2 border-black dark:border-white shadow-pixel z-20 opacity-0 invisible group-hover/export:opacity-100 group-hover/export:visible transition-all">
            <button
              onClick={() => ExportService.exportToCSV(exportRows, 'chercheurs_druid')}
              className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors border-b-2 border-black dark:border-white"
            >
              CSV
            </button>
            <button
              onClick={() => ExportService.exportToExcel(exportRows, 'chercheurs_druid')}
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

        {hasRole('admin') && (
          <button onClick={onNewResearcher} className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase text-white bg-pixel-teal border-2 border-black dark:border-white shadow-pixel hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
            <Plus className="w-4 h-4" /> Nouveau
          </button>
        )}

        <div className="relative">
          <button onClick={onToggleSyncMenu} className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase text-white bg-pixel-blue border-2 border-black dark:border-white shadow-pixel hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Synchroniser
          </button>
          {showSyncMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border-2 border-black dark:border-white shadow-pixel z-20 overflow-hidden">
              <button
                onClick={() => { onCloseSyncMenu(); onManualSync?.(); }}
                className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase text-primary-dark dark:text-pixel-blue hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black border-b-2 border-black dark:border-white flex items-center gap-2 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Forcer mise à jour Grist
              </button>
              <button
                disabled
                className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase text-gray-300 dark:text-gray-600 border-b-2 border-black dark:border-white flex items-center gap-2 cursor-not-allowed"
              >
                <Users className="w-4 h-4" />
                Synchroniser LDAP
              </button>
              {onAlignIdref && (
                <>
                  <button
                    onClick={() => { onCloseSyncMenu(); onAlignIdref('search'); }}
                    disabled={idrefBusy}
                    className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase text-pixel-blue dark:text-pixel-cyan hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black border-b-2 border-black dark:border-white flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Search className={`w-4 h-4 ${idrefBusy ? 'animate-pulse' : ''}`} />
                    Aligner IdRef — chercher manquants
                  </button>
                  <button
                    onClick={() => { onCloseSyncMenu(); onAlignIdref('verify'); }}
                    disabled={idrefBusy}
                    className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase text-pixel-blue dark:text-pixel-cyan hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black border-b-2 border-black dark:border-white flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <GitCompare className={`w-4 h-4 ${idrefBusy ? 'animate-pulse' : ''}`} />
                    Vérifier IdRef (notices)
                  </button>
                </>
              )}
              <button
                onClick={() => { onCloseSyncMenu(); onSyncToSovisu?.(); }}
                className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase text-orange-600 dark:text-orange-400 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black flex items-center gap-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Synchroniser avec SoVisu+
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
