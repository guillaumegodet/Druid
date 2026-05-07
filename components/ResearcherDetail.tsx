import React, { useState } from 'react';
import { ArrowLeft, Save, RefreshCw, FileDown } from 'lucide-react';
import { Researcher, ResearcherStatus, Affiliation } from '../types';
import { ExportService } from '../lib/exportService';
import { GeneralTab } from './researchers/GeneralTab';

interface ResearcherDetailProps {
  researcher: Researcher;
  onBack: () => void;
  onSave?: (updated: Researcher) => void;
  isSaving?: boolean;
  onNavigateToStructure?: (structureId: string) => void;
}

export const ResearcherDetail: React.FC<ResearcherDetailProps> = ({ researcher, onBack, onSave, isSaving, onNavigateToStructure }) => {
  const [localResearcher, setLocalResearcher] = useState<Researcher>({ ...researcher });
  const [affiliations, setAffiliations] = useState<Affiliation[]>(researcher.affiliations || []);
  const [groups] = useState<string[]>(researcher.groups || []);

  const handleAddAffiliation = () => {
    setAffiliations([...affiliations, { structureName: '', team: '', startDate: '', isPrimary: affiliations.length === 0 }]);
  };

  const handleRemoveAffiliation = (index: number) => {
    const updated = [...affiliations];
    updated.splice(index, 1);
    setAffiliations(updated);
  };

  const handleAffiliationChange = (index: number, field: keyof Affiliation, value: any) => {
    const updated = [...affiliations];
    if (field === 'isPrimary' && value === true) {
      updated.forEach(a => a.isPrimary = false);
    }
    // @ts-ignore
    updated[index][field] = value;
    setAffiliations(updated);
  };

  const updateField = (field: string, value: any, subObject?: string) => {
    setLocalResearcher(prev => {
      const copy = { ...prev };
      if (subObject) {
        // @ts-ignore
        copy[subObject] = { ...copy[subObject], [field]: value };
      } else {
        // @ts-ignore
        copy[field] = value;
      }
      return copy;
    });
  };

  const handleSave = () => {
    onSave?.({ ...localResearcher, affiliations, groups });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 relative">
      <div className="bg-white dark:bg-slate-900 border-b-4 border-black dark:border-white px-8 py-5 flex items-center justify-between sticky top-0 z-10 transition-colors">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 border-2 border-black dark:border-white shadow-pixel hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all text-gray-900 dark:text-white bg-white dark:bg-slate-800">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-3xl font-pixel text-gray-900 dark:text-white flex items-center gap-3 uppercase tracking-wider">
              {researcher.lastName} {researcher.firstName}
              {researcher.status === ResearcherStatus.INTERNE && <span className="bg-pixel-teal text-gray-900 text-[10px] px-2 py-0.5 border-2 border-black dark:border-white font-mono font-bold uppercase">Interne</span>}
              {researcher.status === ResearcherStatus.DEPART && <span className="bg-pixel-pink text-white text-[10px] px-2 py-0.5 border-2 border-black dark:border-white font-mono font-bold uppercase">Départ</span>}
              {researcher.status === ResearcherStatus.PARTI && <span className="bg-pixel-blue text-white text-[10px] px-2 py-0.5 border-2 border-black dark:border-white font-mono font-bold uppercase">Parti</span>}
              {researcher.status === ResearcherStatus.EXTERNE && <span className="bg-pixel-yellow text-gray-900 text-[10px] px-2 py-0.5 border-2 border-black dark:border-white font-mono font-bold uppercase">Externe</span>}
            </h2>
            <p className="text-[10px] text-gray-400 font-mono font-bold uppercase mt-1">UID: {researcher.uid || 'NON-RENSEIGNÉ'} • Last Sync: {researcher.lastSync}</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => ExportService.exportSingleResearcherPDF(localResearcher)}
            className="flex items-center gap-2 px-6 py-2 text-[10px] font-bold uppercase text-gray-700 dark:text-white bg-white dark:bg-slate-800 border-2 border-black dark:border-white shadow-pixel hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
          >
            <FileDown className="w-4 h-4" /> Export PDF
          </button>
          <button onClick={onBack} disabled={isSaving} className="px-6 py-2 text-[10px] font-bold uppercase text-gray-900 dark:text-white border-2 border-black dark:border-white shadow-pixel hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all bg-white dark:bg-slate-800">
            Cancel
          </button>
          <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-6 py-2 text-[10px] font-bold uppercase text-white bg-pixel-blue border-2 border-black dark:border-white shadow-pixel hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all disabled:opacity-50">
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {researcher.id.startsWith('NEW-') ? 'Create Profile' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="p-8 flex-1 overflow-auto">
        <div className="bg-white dark:bg-slate-900 border-2 border-black dark:border-white shadow-pixel min-h-[400px] transition-colors p-10">
          <GeneralTab
            researcher={localResearcher}
            affiliations={affiliations}
            onUpdateField={updateField}
            onAddAffiliation={handleAddAffiliation}
            onRemoveAffiliation={handleRemoveAffiliation}
            onAffiliationChange={handleAffiliationChange}
            onNavigateToStructure={onNavigateToStructure}
          />
        </div>
      </div>
    </div>
  );
};
