import React, { useState } from 'react';
import { ArrowLeft, ExternalLink, Save, RefreshCw, ArrowRight, ArrowLeft as ArrowLeftIcon, AlertTriangle, User, Briefcase, Phone, Hash, Building2, Plus, Trash2, X } from 'lucide-react';
import { Researcher, ResearcherStatus, ComparisonField, Affiliation } from '../types';

/** Props du composant ResearcherDetail */
interface ResearcherDetailProps {
  /** Le chercheur à afficher/éditer */
  researcher: Researcher;
  /** Callback de retour à la liste */
  onBack: () => void;
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
export const ResearcherDetail: React.FC<ResearcherDetailProps> = ({ researcher, onBack }) => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.GENERAL);
  
  // État local pour les affiliations (édition dynamique)
  const [affiliations, setAffiliations] = useState<Affiliation[]>(researcher.affiliations || []);
  const [groups, setGroups] = useState<string[]>(researcher.groups || []);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupValue, setNewGroupValue] = useState('');

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

  /** Ajoute un groupe fonctionnel au profil */
  const handleAddGroup = () => {
    if (newGroupValue.trim() !== "" && !groups.includes(newGroupValue.trim())) {
      setGroups([...groups, newGroupValue.trim()]);
      setNewGroupValue('');
      setIsAddingGroup(false);
    } else {
      setIsAddingGroup(false);
    }
  };

  /** 
   * Rendu d'une ligne de comparaison Source/Local.
   * Affiche les flèches d'enrichissement uniquement en cas de divergence.
   */
  const renderComparisonRow = (field: ComparisonField) => {
    const isDifferent = field.localValue !== field.remoteValue;
    return (
      <tr key={field.key} className="hover:bg-gray-50 dark:hover:bg-gray-700 group border-b dark:border-gray-700">
        <td className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400 w-1/4">{field.label}</td>
        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-200 w-1/3">
           <div className="p-2 rounded border dark:border-gray-600 bg-white dark:bg-gray-700 min-h-[40px] flex items-center">
             {field.localValue || <span className="text-gray-400 italic">Vide</span>}
           </div>
        </td>
        <td className="px-4 py-4 w-[10%] text-center">
           {isDifferent && (
             <div className="flex flex-col gap-2 items-center opacity-100 group-hover:opacity-100">
                <button className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300" title="Importer">
                   <ArrowLeftIcon className="w-4 h-4" />
                </button>
                <button className="p-1.5 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300" title="Pousser">
                   <ArrowRight className="w-4 h-4" />
                </button>
             </div>
           )}
        </td>
        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-200 w-1/3">
          <div className={`p-2 rounded border ${isDifferent ? 'border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800' : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50'} min-h-[40px] flex items-center justify-between`}>
             <span>{field.remoteValue || <span className="text-gray-400 italic">Vide</span>}</span>
             {isDifferent && <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />}
           </div>
        </td>
      </tr>
    );
  };

  /** Simulation de récupération de données distantes pour la comparaison */
  const getFieldsForTab = (tab: Tab): ComparisonField[] => {
    const primaryLab = affiliations.find(a => a.isPrimary)?.structureName || '';
    switch (tab) {
      case Tab.IDREF:
        return [
          { key: 'name', label: 'Nom Prénom', localValue: researcher.displayName, remoteValue: 'DUPONT Jean' },
          { key: 'dob', label: 'Date de naissance', localValue: researcher.birthDate || null, remoteValue: '1985-04-12' },
          { key: 'lab', label: 'Affiliation', localValue: primaryLab, remoteValue: 'Laboratoire Informatique Fondamentale' },
        ];
      default: return [];
    }
  };

  return (
    <div className="flex flex-col h-full bg-background dark:bg-slate-900 relative">
      {/* Header Détaillé */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-8 py-5 flex items-center justify-between sticky top-0 z-10 transition-colors">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              {researcher.lastName} {researcher.firstName}
              {researcher.status === ResearcherStatus.VALIDATED && <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full border border-green-200 whitespace-nowrap">Validé</span>}
            </h2>
            <p className="text-sm text-gray-500">ID: {researcher.id} | Dernière synchro: {researcher.lastSync}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-md shadow-sm">
            <ExternalLink className="w-4 h-4" /> Voir fiche publique
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md shadow-sm">
            <Save className="w-4 h-4" /> Enregistrer
          </button>
        </div>
      </div>

      <div className="p-8 flex-1 overflow-auto">
        {/* Navigation par Onglets */}
        <div className="bg-white dark:bg-gray-800 rounded-t-lg border-b dark:border-gray-700 px-6 pt-4 flex gap-6 overflow-x-auto">
           {Object.values(Tab).map((tab) => (
             <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-4 px-2 text-sm font-medium relative whitespace-nowrap ${activeTab === tab ? 'text-primary dark:text-blue-400 border-b-2 border-primary dark:border-blue-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'}`}>
               {tab}
             </button>
           ))}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-b-lg shadow-sm border border-t-0 dark:border-gray-700 min-h-[400px] transition-colors p-8">
          {activeTab === Tab.GENERAL ? (
            <div className="space-y-8 animate-in fade-in duration-300">
               {/* Section État Civil */}
               <div className="space-y-4">
                 <div className="flex items-center gap-2 pb-2 border-b dark:border-gray-700">
                    <User className="w-5 h-5 text-gray-500" />
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">État Civil</h3>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Civilité</label>
                      <select defaultValue={researcher.civility} className="mt-1 block w-full rounded-md border dark:border-gray-600 p-2 bg-white dark:bg-gray-700 dark:text-white">
                        <option value="M.">M.</option><option value="Mme">Mme</option><option value="Dr">Dr</option><option value="Pr">Pr</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nom d'usage</label>
                      <input type="text" defaultValue={researcher.lastName} className="mt-1 block w-full rounded-md border dark:border-gray-600 p-2 dark:bg-gray-700 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Prénom</label>
                      <input type="text" defaultValue={researcher.firstName} className="mt-1 block w-full rounded-md border dark:border-gray-600 p-2 dark:bg-gray-700 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date de naissance</label>
                      <input type="date" defaultValue={researcher.birthDate} className="mt-1 block w-full rounded-md border dark:border-gray-600 p-2 dark:bg-gray-700 dark:text-white" />
                    </div>
                 </div>
               </div>

               {/* Section Emploi et Typologie */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-4">
                 <div className="space-y-4">
                   <div className="flex items-center gap-2 pb-2 border-b dark:border-gray-700">
                      <Briefcase className="w-5 h-5 text-gray-500" />
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Emploi & Contrat</h3>
                   </div>
                   <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Établissement Employeur</label>
                        <input type="text" defaultValue={researcher.employment.employer} className="mt-1 block w-full rounded-md border dark:border-gray-600 p-2 dark:bg-gray-700 dark:text-white" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Grade / Corps</label>
                        <input type="text" defaultValue={researcher.employment.grade} className="mt-1 block w-full rounded-md border dark:border-gray-600 p-2 dark:bg-gray-700 dark:text-white" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Typologie interne</label>
                        <select defaultValue={researcher.employment.internalTypology} className="mt-1 block w-full rounded-md border dark:border-gray-600 p-2 bg-white dark:bg-gray-700 dark:text-white font-medium text-primary">
                          <option value="">- Non définie -</option>
                          <option value="Enseignant-chercheur">Enseignant-chercheur</option>
                          <option value="Chercheur">Chercheur</option>
                          <option value="Doctorant">Doctorant</option>
                          <option value="Post-doctorant">Post-doctorant</option>
                        </select>
                      </div>
                   </div>
                 </div>

                 {/* Section Appartenances dynamiques */}
                 <div className="space-y-4">
                   <div className="flex items-center justify-between pb-2 border-b dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-gray-500" />
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Appartenances</h3>
                      </div>
                      <button onClick={handleAddAffiliation} className="text-xs flex items-center gap-1 text-primary dark:text-blue-400 font-medium px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20">
                        <Plus className="w-3 h-3" /> Ajouter
                      </button>
                   </div>
                   <div className="overflow-hidden border dark:border-gray-700 rounded-md">
                      <table className="min-w-full divide-y dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                          <tr><th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Structure</th><th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Équipe</th><th className="w-8"></th></tr>
                        </thead>
                        <tbody className="divide-y dark:divide-gray-700">
                          {affiliations.map((aff, idx) => (
                            <tr key={idx} className={aff.isPrimary ? "bg-blue-50/50 dark:bg-blue-900/10" : ""}>
                              <td className="p-2"><input type="text" value={aff.structureName} onChange={(e) => handleAffiliationChange(idx, 'structureName', e.target.value)} className="w-full text-sm border dark:border-gray-600 rounded px-2 py-1 dark:bg-gray-700 dark:text-white" /></td>
                              <td className="p-2"><input type="text" value={aff.team} onChange={(e) => handleAffiliationChange(idx, 'team', e.target.value)} className="w-full text-sm border dark:border-gray-600 rounded px-2 py-1 dark:bg-gray-700 dark:text-white" /></td>
                              <td className="p-2 text-center"><button onClick={() => handleRemoveAffiliation(idx)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                   </div>
                 </div>
               </div>
            </div>
          ) : (
            /* Vue de comparaison Référentiels Externes */
            <div className="p-4 space-y-6">
              <div className="flex items-center gap-3 text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900">
                 <RefreshCw className="w-5 h-5 shrink-0" />
                 <p className="text-sm">Comparaison avec <span className="font-bold">{activeTab.replace('Mise à jour ', '')}</span></p>
              </div>
              <table className="min-w-full">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr><th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Champ</th><th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Druid (Local)</th><th className="w-[10%]"></th><th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Source (Distant)</th></tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">{getFieldsForTab(activeTab).map(renderComparisonRow)}</tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
