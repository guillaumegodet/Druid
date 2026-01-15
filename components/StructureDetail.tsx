import React, { useState } from 'react';
import { ArrowLeft, Save, Building, Users, MapPin, Globe, ExternalLink, Hash, FileText, Activity, Layers, Network, AlertTriangle, Database, BookOpen, Trash2, Plus } from 'lucide-react';
import { Structure, StructureStatus, StructureLevel, StructureNature, StructureMission, LineageType, LineageLink } from '../types';

interface StructureDetailProps {
  structure: Structure;
  onBack: () => void;
}

enum Tab {
  GENERAL = 'Identification',
  CLASSIFICATION = 'Missions & Classification',
  LIFECYCLE = 'Cycle de vie & Filiation',
  GOVERNANCE = 'Gouvernance & Contact',
}

export const StructureDetail: React.FC<StructureDetailProps> = ({ structure, onBack }) => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.GENERAL);
  const [historyLinks, setHistoryLinks] = useState<LineageLink[]>(structure.historyLinks || []);

  const handleAddLink = () => {
    setHistoryLinks([
      ...historyLinks,
      {
        relatedStructureId: '',
        relatedStructureName: '',
        type: LineageType.SUCCESSION,
        date: new Date().toISOString().split('T')[0]
      }
    ]);
  };

  const handleRemoveLink = (index: number) => {
    const newLinks = [...historyLinks];
    newLinks.splice(index, 1);
    setHistoryLinks(newLinks);
  };

  const handleLinkChange = (index: number, field: keyof LineageLink, value: any) => {
    const newLinks = [...historyLinks];
    // @ts-ignore
    newLinks[index][field] = value;
    setHistoryLinks(newLinks);
  };
  
  // Fonction utilitaire pour le badge statut
  const getStatusBadge = (status: StructureStatus) => {
    switch (status) {
      case StructureStatus.ACTIVE:
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800 whitespace-nowrap">Active</span>;
      case StructureStatus.PROJET:
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border border-blue-200 dark:border-blue-800 whitespace-nowrap">Projet</span>;
      case StructureStatus.EN_FERMETURE:
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 border border-orange-200 dark:border-orange-800 whitespace-nowrap">En fermeture</span>;
      case StructureStatus.FERMEE:
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800 whitespace-nowrap">Fermée</span>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background dark:bg-slate-900 relative">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-8 py-5 flex flex-col md:flex-row items-start md:items-center justify-between sticky top-0 z-10 gap-4 transition-colors">
        <div className="flex items-center gap-4 w-full">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500 dark:text-gray-400 shrink-0">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white truncate">{structure.acronym}</h2>
              {getStatusBadge(structure.status)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2 truncate">
               {structure.officialName}
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
            {structure.website && (
              <a 
                href={structure.website} 
                target="_blank" 
                rel="noreferrer"
                className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">Web</span>
              </a>
            )}
            <button className="flex-1 md:flex-none justify-center flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-secondary rounded-md hover:bg-purple-700 shadow-sm transition-all">
               <Save className="w-4 h-4" />
               Enregistrer
            </button>
        </div>
      </div>

      <div className="p-4 md:p-8 flex-1 overflow-auto">
        
         {/* Warning validation Active sans directeur */}
         {structure.status === StructureStatus.ACTIVE && !structure.director && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3 text-red-800 dark:text-red-300">
               <AlertTriangle className="w-5 h-5 shrink-0" />
               <span className="text-sm font-medium">Validation impossible : Une structure à l'état "Active" doit obligatoirement avoir un responsable identifié.</span>
            </div>
         )}

         {/* Navigation Tabs */}
         <div className="bg-white dark:bg-gray-800 rounded-t-lg border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 pt-4 flex gap-6 overflow-x-auto transition-colors">
           {Object.values(Tab).map((tab) => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`pb-4 px-2 text-sm font-medium transition-all relative whitespace-nowrap ${
                 activeTab === tab 
                 ? 'text-secondary dark:text-purple-400' 
                 : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
               }`}
             >
               {tab}
               {activeTab === tab && (
                 <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary dark:bg-purple-400 rounded-t-full"></div>
               )}
             </button>
           ))}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-b-lg shadow-sm border border-t-0 border-gray-200 dark:border-gray-700 min-h-[500px] p-4 md:p-8 transition-colors">
          
          {/* --- TAB 1: IDENTIFICATION --- */}
          {activeTab === Tab.GENERAL && (
            <div className="space-y-8 animate-in fade-in duration-300">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                     <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                        <Building className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        Dénominations
                     </h3>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nom officiel (Complet)</label>
                        <input type="text" defaultValue={structure.officialName} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nom court / Sigle / Acronyme</label>
                        <input type="text" defaultValue={structure.acronym} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                        <textarea defaultValue={structure.description} rows={3} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                     </div>
                  </div>

                  <div className="space-y-4">
                     <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                        <Layers className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        Typologie & Codes
                     </h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Niveau (Cadre National)</label>
                            <select defaultValue={structure.level} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                               <option value={StructureLevel.ETABLISSEMENT}>Établissement</option>
                               <option value={StructureLevel.INTERMEDIAIRE}>Structure Intermédiaire</option>
                               <option value={StructureLevel.ENTITE}>Entité (Unité)</option>
                               <option value={StructureLevel.EQUIPE}>Équipe</option>
                            </select>
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nature</label>
                            <select defaultValue={structure.nature} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                               <option value={StructureNature.PUBLIC}>Public</option>
                               <option value={StructureNature.PRIVE}>Privé</option>
                               <option value={StructureNature.MIXTE}>Mixte</option>
                            </select>
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type (ex: UMR)</label>
                            <input type="text" defaultValue={structure.type} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Numéro unité</label>
                            <input type="text" defaultValue={structure.code} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                         </div>
                     </div>

                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Pôle / Rattachement structurel</label>
                        <input type="text" defaultValue={structure.cluster} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="ex: Pôle Sciences" />
                     </div>
                  </div>
               </div>

               {/* Section Identifiants Externes */}
               <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-4">
                     <Hash className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                     Identifiants Externes & Référentiels
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* RNSR */}
                        <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                            <Hash className="w-5 h-5 text-blue-500 mt-1" />
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Code RNSR</label>
                                <input type="text" defaultValue={structure.rnsrId} className="mt-1 block w-full text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-gray-900 dark:text-white" />
                            </div>
                        </div>

                         {/* ROR */}
                        <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                            <Globe className="w-5 h-5 text-green-600 mt-1" />
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">ID ROR</label>
                                <input type="text" defaultValue={structure.rorId} className="mt-1 block w-full text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-gray-900 dark:text-white" placeholder="00z0..." />
                            </div>
                        </div>
                        
                        {/* IdRef */}
                         <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                            <span className="w-5 h-5 flex items-center justify-center font-bold text-yellow-600 text-xs border border-yellow-600 rounded-full mt-1 shrink-0">Id</span>
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">IdRef (ABES)</label>
                                <input type="text" defaultValue={structure.identifiers.idrefId} className="mt-1 block w-full text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-gray-900 dark:text-white" />
                            </div>
                        </div>

                        {/* Scopus */}
                        <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                            <Database className="w-5 h-5 text-orange-500 mt-1" />
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Scopus Affiliation ID</label>
                                <input type="text" defaultValue={structure.identifiers.scopusId} className="mt-1 block w-full text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-gray-900 dark:text-white" />
                            </div>
                        </div>

                         {/* HAL Structures IDs */}
                        <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 lg:col-span-2">
                            <BookOpen className="w-5 h-5 text-indigo-600 mt-1" />
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Identifiants Structure HAL (Multiples)</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                   {structure.identifiers.halStructIds?.map((id, idx) => (
                                      <span key={idx} className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm flex items-center gap-1 shadow-sm text-gray-900 dark:text-white">
                                         {id}
                                         <button className="text-gray-400 hover:text-red-500 ml-1">×</button>
                                      </span>
                                   ))}
                                </div>
                                <div className="flex gap-2">
                                  <input type="text" placeholder="Ajouter un ID HAL..." className="flex-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-gray-900 dark:text-white" />
                                  <button className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50">Ajouter</button>
                                </div>
                            </div>
                        </div>

                        {/* HAL Collection */}
                        <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 lg:col-span-3">
                            <ExternalLink className="w-5 h-5 text-indigo-400 mt-1" />
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">URL Collection HAL</label>
                                <input type="text" defaultValue={structure.halCollectionUrl} className="mt-1 block w-full text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-gray-900 dark:text-white" placeholder="https://hal.science/..." />
                            </div>
                        </div>

                         {/* Tracking & SIREN */}
                        <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                             <Activity className="w-5 h-5 text-gray-400 mt-1" />
                             <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Tracking ID (Interne)</label>
                                <input type="text" defaultValue={structure.trackingId} className="mt-1 block w-full text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-gray-900 dark:text-white" />
                            </div>
                        </div>

                        {structure.level === StructureLevel.ETABLISSEMENT && (
                             <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                                <FileText className="w-5 h-5 text-gray-400 mt-1" />
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">SIREN</label>
                                    <input type="text" defaultValue={structure.siren} className="mt-1 block w-full text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-gray-900 dark:text-white" />
                                </div>
                            </div>
                        )}
                  </div>
               </div>
            </div>
          )}

          {/* --- TAB 2: CLASSIFICATION --- */}
          {activeTab === Tab.CLASSIFICATION && (
             <div className="space-y-8 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                        <Activity className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        Missions
                      </h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mission Principale</label>
                        <select defaultValue={structure.primaryMission} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                           <option value={StructureMission.RECHERCHE}>Recherche</option>
                           <option value={StructureMission.SERVICES_SCIENTIFIQUES}>Services Scientifiques</option>
                           <option value={StructureMission.SERVICES_ADMINISTRATIFS}>Services Administratifs</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mission Secondaire</label>
                        <select defaultValue={structure.secondaryMission} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                           <option value="">- Aucune -</option>
                           <option value={StructureMission.RECHERCHE}>Recherche</option>
                           <option value={StructureMission.SERVICES_SCIENTIFIQUES}>Services Scientifiques</option>
                           <option value={StructureMission.SERVICES_ADMINISTRATIFS}>Services Administratifs</option>
                        </select>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                        <Hash className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        Classification & Évaluation
                      </h3>
                       <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Domaine Hcéres</label>
                        <input type="text" defaultValue={structure.hceresDomain} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="ex: ST6" />
                      </div>
                       <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vague d'évaluation</label>
                        <input type="text" defaultValue={structure.evaluationWave} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="ex: Vague C" />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Champs disciplinaires ERC</label>
                        <div className="flex flex-wrap gap-2">
                           {structure.ercFields?.map((erc, idx) => (
                              <span key={idx} className="px-3 py-1 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded-full text-sm border border-yellow-200 dark:border-yellow-800 flex items-center gap-2">
                                {erc}
                                <button className="hover:text-red-500">×</button>
                              </span>
                           ))}
                            <button className="px-3 py-1 bg-white dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600 rounded-full text-sm text-gray-500 dark:text-gray-400 hover:text-secondary hover:border-secondary transition-colors">
                              + Ajouter
                            </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Domaines scientifiques (Mots-clés)</label>
                        <div className="flex flex-wrap gap-2">
                           {structure.scientificDomains?.map((dom, idx) => (
                              <span key={idx} className="px-3 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm border border-purple-100 dark:border-purple-800 flex items-center gap-2">
                                {dom}
                                <button className="hover:text-red-500">×</button>
                              </span>
                           ))}
                             <button className="px-3 py-1 bg-white dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600 rounded-full text-sm text-gray-500 dark:text-gray-400 hover:text-secondary hover:border-secondary transition-colors">
                              + Ajouter
                            </button>
                        </div>
                      </div>
                   </div>
                </div>
             </div>
          )}

          {/* --- TAB 3: LIFECYCLE --- */}
           {activeTab === Tab.LIFECYCLE && (
             <div className="space-y-8 animate-in fade-in duration-300">
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                   <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-4">
                     <Activity className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                     État courant et Dates
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Statut de la structure</label>
                         <select defaultValue={structure.status} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border focus:border-secondary bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                           <option value={StructureStatus.PROJET}>Projet (Avant création administrative)</option>
                           <option value={StructureStatus.ACTIVE}>Active</option>
                           <option value={StructureStatus.EN_FERMETURE}>En fermeture</option>
                           <option value={StructureStatus.FERMEE}>Fermée</option>
                         </select>
                         <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Le statut "Active" requiert un directeur renseigné.</p>
                      </div>
                      <div>
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date de création</label>
                         <input type="date" defaultValue={structure.creationDate} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                      </div>
                      <div>
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date de fermeture</label>
                         <input type="date" defaultValue={structure.closeDate} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                      </div>
                   </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-4">
                     <Network className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                     Historique & Filiation (Lineage)
                   </h3>
                   <div className="border rounded-md overflow-x-auto bg-white dark:bg-gray-800 shadow-sm border-gray-200 dark:border-gray-700">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                           <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase min-w-[180px]">Type d'événement</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase min-w-[200px]">Structure liée</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-40">Date</th>
                              <th className="relative px-6 py-3 w-16"><span className="sr-only">Actions</span></th>
                           </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                           {historyLinks.length > 0 ? (
                              historyLinks.map((link, idx) => (
                                 <tr key={idx}>
                                    <td className="px-6 py-3 whitespace-nowrap align-top">
                                       <select 
                                         value={link.type}
                                         onChange={(e) => handleLinkChange(idx, 'type', e.target.value)}
                                         className="block w-full text-xs border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:border-secondary focus:ring focus:ring-secondary focus:ring-opacity-50 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                       >
                                           <option value={LineageType.SUCCESSION}>Succède à / Précède</option>
                                           <option value={LineageType.INTEGRATION}>Intégration</option>
                                           <option value={LineageType.FUSION}>Fusion</option>
                                           <option value={LineageType.SCISSION}>Scission</option>
                                       </select>
                                    </td>
                                    <td className="px-6 py-3 align-top">
                                       <input 
                                         type="text" 
                                         value={link.relatedStructureName}
                                         onChange={(e) => handleLinkChange(idx, 'relatedStructureName', e.target.value)}
                                         className="block w-full text-sm border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:border-secondary py-1.5 mb-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                         placeholder="Rechercher une structure..."
                                       />
                                       <div className="flex items-center gap-2">
                                         <span className="text-xs text-gray-500 dark:text-gray-400">ID:</span>
                                         <input 
                                            type="text" 
                                            value={link.relatedStructureId}
                                            onChange={(e) => handleLinkChange(idx, 'relatedStructureId', e.target.value)}
                                            className="block w-24 text-xs text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 rounded-sm shadow-sm py-0.5 px-1 bg-gray-50 dark:bg-gray-900"
                                            placeholder="ex: UMR123"
                                         />
                                       </div>
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap align-top">
                                       <input 
                                         type="date" 
                                         value={link.date}
                                         onChange={(e) => handleLinkChange(idx, 'date', e.target.value)}
                                         className="block w-full text-sm border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:border-secondary py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                       />
                                    </td>
                                    <td className="px-6 py-3 text-right align-top pt-4">
                                       <button 
                                         onClick={() => handleRemoveLink(idx)}
                                         className="text-gray-400 hover:text-red-500 transition-colors"
                                         title="Supprimer la ligne"
                                       >
                                          <Trash2 className="w-4 h-4" />
                                       </button>
                                    </td>
                                 </tr>
                              ))
                           ) : (
                              <tr>
                                 <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400 italic bg-gray-50/50 dark:bg-gray-900/50">
                                    Aucun événement de filiation enregistré (Fusion, Scission, Succession...)
                                 </td>
                              </tr>
                           )}
                        </tbody>
                      </table>
                      <div className="bg-gray-50 dark:bg-gray-900 px-6 py-3 border-t border-gray-200 dark:border-gray-700">
                         <button 
                           onClick={handleAddLink}
                           className="text-sm font-medium text-secondary dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                         >
                           <Plus className="w-4 h-4" />
                           Ajouter un lien de filiation
                         </button>
                      </div>
                   </div>
                </div>
             </div>
           )}

           {/* --- TAB 4: GOVERNANCE & CONTACT --- */}
           {activeTab === Tab.GOVERNANCE && (
              <div className="space-y-8 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {/* Gouvernance */}
                     <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                           <Users className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                           Gouvernance
                        </h3>
                         <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Directeur / Responsable</label>
                            <input type="text" defaultValue={structure.director} className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Rechercher un chercheur..." />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Obligatoire pour le statut Active.</p>
                         </div>
                         
                         <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Établissements de tutelle (Noms)</label>
                           <div className="flex flex-wrap gap-2 mb-3">
                              {structure.supervisors.map((sup, idx) => (
                                <span key={idx} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded text-sm border border-gray-200 dark:border-gray-600 flex items-center gap-2">
                                  {sup}
                                  <button className="hover:text-red-500">×</button>
                                </span>
                              ))}
                              <button className="px-3 py-1 bg-white dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600 rounded text-sm text-gray-500 dark:text-gray-400 hover:text-secondary hover:border-secondary transition-colors">
                                + Ajouter
                              </button>
                           </div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Codes UAI Tutelles</label>
                           <input type="text" defaultValue={structure.institutionCodes} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="ex: 0751717J|0753639Y" />
                        </div>

                         <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Écoles Doctorales</label>
                           <div className="flex flex-wrap gap-2">
                              {structure.doctoralSchools?.map((ed, idx) => (
                                <span key={idx} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm border border-blue-100 dark:border-blue-800 flex items-center gap-2">
                                  {ed}
                                  <button className="hover:text-blue-900">×</button>
                                </span>
                              ))}
                              <button className="px-3 py-1 bg-white dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600 rounded-full text-sm text-gray-500 dark:text-gray-400 hover:text-secondary hover:border-secondary transition-colors">
                                + Ajouter
                              </button>
                           </div>
                        </div>
                     </div>

                     {/* Contact & Localisation */}
                     <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                           <MapPin className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                           Localisation & Contact
                        </h3>
                        <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Adresse (BAN)</label>
                           <div className="flex gap-2">
                              <input type="text" defaultValue={structure.address} className="mt-1 flex-1 rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                              <button className="mt-1 px-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600">
                                 🔍 BAN
                              </button>
                           </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Code Postal</label>
                              <input type="text" defaultValue={structure.zipCode} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                           </div>
                           <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ville</label>
                              <input type="text" defaultValue={structure.city} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                           </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                           <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Réseaux Sociaux & Web</h4>
                           <div className="grid grid-cols-1 gap-2">
                               <input type="text" defaultValue={structure.website} className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Site Web" />
                               <input type="text" className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Twitter URL" />
                               <input type="text" className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="LinkedIn URL" />
                           </div>
                        </div>
                        
                        <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Modèle de signature</label>
                             <textarea defaultValue={structure.signature} rows={2} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                        </div>
                     </div>
                  </div>
              </div>
           )}

        </div>
      </div>
    </div>
  );
};