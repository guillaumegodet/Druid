import React, { useState } from 'react';
import { ArrowLeft, Save, RefreshCw, FileDown } from 'lucide-react';
import { Researcher, ResearcherStatus, ComparisonField, Affiliation } from '../types';
import { ExportService } from '../lib/exportService';

// Sub-components
import { GeneralTab } from './researchers/GeneralTab';
import { ComparisonView } from './researchers/ComparisonView';

/** Props du composant ResearcherDetail */
interface ResearcherDetailProps {
  /** Le chercheur à afficher/éditer */
  researcher: Researcher;
  /** Callback de retour à la liste */
  onBack: () => void;
  /** Callback d'enregistrement */
  onSave?: (updated: Researcher) => void;
  /** État de sauvegarde en cours */
  isSaving?: boolean;
  /** Callback personnalisé pour naviguer vers la fiche de la structure */
  onNavigateToStructure?: (structureId: string) => void;
}

/** Énumération des onglets disponibles */
enum Tab {
  GENERAL = 'Informations générales',
  IDREF = 'Mise à jour IdRef',
  ORCID = 'Mise à jour ORCID',
  HAL = 'Mise à jour HAL',
}

/**
 * @component ResearcherDetail
 * @description Vue détaillée permettant l'édition complète d'un profil chercheur.
 * Comprend un module de synchronisation bi-directionnelle pour comparer les données 
 * locales avec les référentiels externes (IdRef, ORCID, HAL).
 */
export const ResearcherDetail: React.FC<ResearcherDetailProps> = ({ researcher, onBack, onSave, isSaving, onNavigateToStructure }) => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.GENERAL);
  
  // État local pour le formulaire
  const [localResearcher, setLocalResearcher] = useState<Researcher>({...researcher});
  const [affiliations, setAffiliations] = useState<Affiliation[]>(researcher.affiliations || []);
  const [groups, setGroups] = useState<string[]>(researcher.groups || []);

  /** Ajoute une ligne d'affiliation vide */
  const handleAddAffiliation = () => {
    setAffiliations([...affiliations, { structureName: '', team: '', startDate: '', isPrimary: affiliations.length === 0 }]);
  };

  /** Supprime une ligne d'affiliation par index */
  const handleRemoveAffiliation = (index: number) => {
    const newAffiliations = [...affiliations];
    newAffiliations.splice(index, 1);
    setAffiliations(newAffiliations);
  };

  /** Gère le changement d'une propriété d'affiliation */
  const handleAffiliationChange = (index: number, field: keyof Affiliation, value: any) => {
    const newAffiliations = [...affiliations];
    if (field === 'isPrimary' && value === true) {
      newAffiliations.forEach(a => a.isPrimary = false); // Une seule principale autorisée
    }
    // @ts-ignore
    newAffiliations[index][field] = value;
    setAffiliations(newAffiliations);
  };

  /** Aide pour mettre à jour un champ du formulaire */
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

  /** Synthèse et sauvegarde */
  const handleSave = () => {
    const updated: Researcher = {
      ...localResearcher,
      affiliations,
      groups
    };
    onSave?.(updated);
  };

  /** Données de comparaison simulées pour les onglets de synchronisation */
  const getFieldsForTab = (tab: Tab): ComparisonField[] => {
    const primaryLab = affiliations.find(a => a.isPrimary)?.structureName || '';
    switch (tab) {
      case Tab.IDREF:
        return [
          { key: 'name', label: 'Nom Prénom', localValue: researcher.displayName, remoteValue: 'DUPONT Jean' },
          { key: 'dob', label: 'Date de naissance', localValue: researcher.birthDate || null, remoteValue: '1985-04-12' },
          { key: 'lab', label: 'Affiliation', localValue: primaryLab, remoteValue: 'Laboratoire Informatique Fondamentale' },
        ];
      case Tab.ORCID:
        return [
          { key: 'orcid', label: 'ORCID ID', localValue: researcher.identifiers.orcid || null, remoteValue: '0000-0002-1825-0097' },
        ];
      default: return [];
    }
  };

  const renderTabContent = () => {
    if (activeTab === Tab.GENERAL) {
      return (
        <GeneralTab 
          researcher={localResearcher}
          affiliations={affiliations}
          onUpdateField={updateField}
          onAddAffiliation={handleAddAffiliation}
          onRemoveAffiliation={handleRemoveAffiliation}
          onAffiliationChange={handleAffiliationChange}
          onNavigateToStructure={onNavigateToStructure}
        />
      );
    }

    return (
      <ComparisonView 
        tabTitle={activeTab.replace('Mise à jour ', '')}
        fields={getFieldsForTab(activeTab)}
        onImport={(key) => console.log('Import', key)}
        onPush={(key) => console.log('Push', key)}
      />
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 relative">
      {/* Header Détaillé */}
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
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
           {Object.values(Tab).map((tab) => (
             <button 
              key={tab} 
              onClick={() => setActiveTab(tab)} 
              className={`px-4 py-2 text-[10px] font-bold uppercase border-2 border-black dark:border-white transition-all shadow-pixel-sm active:shadow-none ${activeTab === tab ? 'bg-pixel-blue text-white translate-x-0.5 translate-y-0.5 shadow-none' : 'bg-white dark:bg-slate-800 text-gray-500 hover:text-black dark:hover:text-white'}`}
             >
               {tab}
             </button>
           ))}
        </div>

        <div className="bg-white dark:bg-slate-900 border-2 border-black dark:border-white shadow-pixel min-h-[400px] transition-colors p-10">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};
