import React, { useState } from 'react';
import { ArrowLeft, Save, ExternalLink, RefreshCw, AlertTriangle } from 'lucide-react';
import { Structure, StructureStatus } from '../types';

// Sub-components
import { IdentificationTab } from './structures/IdentificationTab';
import { ClassificationTab } from './structures/ClassificationTab';
import { LifecycleTab } from './structures/LifecycleTab';
import { GovernanceTab } from './structures/GovernanceTab';

interface StructureDetailProps {
  structure: Structure;
  onBack: () => void;
  onSave?: (updated: Structure) => void;
  isSaving?: boolean;
}

enum Tab {
  GENERAL = 'Identification',
  CLASSIFICATION = 'Missions & Classification',
  LIFECYCLE = 'Cycle de vie & Filiation',
  GOVERNANCE = 'Gouvernance & Contact',
}

export const StructureDetail: React.FC<StructureDetailProps> = ({ structure, onBack, onSave, isSaving = false }) => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.GENERAL);
  const [localStructure, setLocalStructure] = useState<Structure>({ ...structure });

  const handleSave = () => {
    if (onSave) {
      onSave(localStructure);
    }
  };

  const updateField = (field: keyof Structure, value: any) => {
    setLocalStructure(prev => ({ ...prev, [field]: value }));
  };

  const getStatusBadge = (status: StructureStatus) => {
    switch (status) {
      case StructureStatus.ACTIVE:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 border-2 border-black dark:border-pixel-teal bg-pixel-teal/20 text-slate-900 dark:text-pixel-teal text-[10px] font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">ACTIVE</span>;
      case StructureStatus.PROJET:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 border-2 border-black dark:border-pixel-blue bg-pixel-blue/20 text-slate-900 dark:text-pixel-blue text-[10px] font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">PROJET</span>;
      case StructureStatus.EN_FERMETURE:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 border-2 border-black dark:border-pixel-yellow bg-pixel-yellow/20 text-slate-900 dark:text-pixel-yellow text-[10px] font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">FERMETURE</span>;
      case StructureStatus.FERMEE:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 border-2 border-black dark:border-pixel-pink bg-pixel-pink/20 text-slate-900 dark:text-pixel-pink text-[10px] font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">FERMÉE</span>;
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case Tab.GENERAL:
        return <IdentificationTab structure={localStructure} onUpdateField={updateField} />;
      case Tab.CLASSIFICATION:
        return <ClassificationTab structure={localStructure} onUpdateField={updateField} />;
      case Tab.LIFECYCLE:
        return <LifecycleTab structure={localStructure} onUpdateField={updateField} />;
      case Tab.GOVERNANCE:
        return <GovernanceTab structure={localStructure} onUpdateField={updateField} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background dark:bg-slate-900 relative">
      <header className="bg-white dark:bg-slate-900 border-b-4 border-black dark:border-white px-8 py-5 flex items-center justify-between sticky top-0 z-10 transition-colors">
        <div className="flex items-center gap-4">
          <button onClick={onBack} disabled={isSaving} className="p-2 border-2 border-black dark:border-white shadow-pixel hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all text-gray-900 dark:text-white bg-white dark:bg-slate-800 disabled:opacity-50">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-pixel text-gray-900 dark:text-white uppercase tracking-tight">{localStructure.acronym}</h2>
              {getStatusBadge(localStructure.status)}
            </div>
            <p className="text-[10px] text-gray-400 font-mono font-bold uppercase mt-1 tracking-tighter">
               {localStructure.officialName}
            </p>
          </div>
        </div>
        
        <div className="flex gap-4">
            {localStructure.website && (
              <a 
                href={localStructure.website} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-2 px-6 py-2 text-[10px] font-bold uppercase text-gray-900 dark:text-white bg-white dark:bg-slate-800 border-2 border-black dark:border-white shadow-pixel hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">SITE WEB</span>
              </a>
            )}
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2 text-[10px] font-bold uppercase text-white bg-primary-dark border-2 border-black dark:border-white shadow-pixel hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all disabled:opacity-50"
            >
               {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
               {isSaving ? 'EN COURS...' : 'ENREGISTRER'}
            </button>
        </div>
      </header>

      <div className="p-4 md:p-8 flex-1 overflow-auto">
         {localStructure.status === StructureStatus.ACTIVE && !localStructure.director && (
            <div className="mb-8 p-6 bg-pixel-pink/10 border-4 border-black dark:border-white shadow-pixel flex items-center gap-4 text-slate-900 dark:text-pixel-pink">
               <AlertTriangle className="w-6 h-6 shrink-0" />
               <p className="text-[12px] font-pixel uppercase tracking-widest">
                 VALIDATION IMPOSSIBLE : UNE STRUCTURE À L'ÉTAT "ACTIVE" DOIT OBLIGATOIREMENT AVOIR UN RESPONSABLE IDENTIFIÉ.
               </p>
            </div>
         )}

         <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
           {Object.values(Tab).map((tab) => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`px-4 py-2 text-[10px] font-bold uppercase border-2 border-black dark:border-white transition-all shadow-pixel-sm active:shadow-none ${
                 activeTab === tab 
                 ? 'bg-pixel-blue text-white translate-x-0.5 translate-y-0.5 shadow-none' 
                 : 'bg-white dark:bg-slate-800 text-gray-500 hover:text-black dark:hover:text-white'
               }`}
             >
               {tab}
             </button>
           ))}
        </div>

        <div className="bg-white dark:bg-slate-900 border-2 border-black dark:border-white shadow-pixel min-h-[500px] p-8 md:p-10 transition-colors">
           {renderTabContent()}
        </div>
      </div>
    </div>
  );
};