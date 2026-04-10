import React from 'react';
import { User, Briefcase, Building2, Hash } from 'lucide-react';
import { Researcher, Affiliation } from '../../types';
import { AffiliationsTable } from './AffiliationsTable';

interface GeneralTabProps {
  researcher: Researcher;
  affiliations: Affiliation[];
  onUpdateField: (field: string, value: any, subObject?: string) => void;
  onAddAffiliation: () => void;
  onRemoveAffiliation: (index: number) => void;
  onAffiliationChange: (index: number, field: keyof Affiliation, value: any) => void;
  onNavigateToStructure?: (structureId: string) => void;
}

export const GeneralTab: React.FC<GeneralTabProps> = ({
  researcher,
  affiliations,
  onUpdateField,
  onAddAffiliation,
  onRemoveAffiliation,
  onAffiliationChange,
  onNavigateToStructure
}) => {
  return (
    <div className="space-y-12 animate-in fade-in duration-300">
       {/* Section État Civil */}
       <div className="space-y-6">
         <div className="flex items-center gap-3 pb-3 border-b-2 border-black/10 dark:border-white/10">
            <User className="w-5 h-5 text-gray-400" />
            <h3 className="text-2xl font-pixel text-gray-900 dark:text-white uppercase tracking-widest leading-none">ÉTAT CIVIL</h3>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-1">
              <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">Civilité</label>
              <select value={researcher.civility} onChange={(e) => onUpdateField('civility', e.target.value)} className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-xs font-bold uppercase focus:ring-0">
                <option value="">-</option>
                <option value="F">F</option>
                <option value="M">M</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">Nom d'usage</label>
              <input type="text" value={researcher.lastName} onChange={(e) => onUpdateField('lastName', e.target.value)} className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[12px] font-bold uppercase focus:shadow-pixel transition-all" />
            </div>
            <div className="space-y-1">
              <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">Prénom</label>
              <input type="text" value={researcher.firstName} onChange={(e) => onUpdateField('firstName', e.target.value)} className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[12px] font-bold uppercase focus:shadow-pixel transition-all" />
            </div>
            <div className="space-y-1">
              <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">Nationalité</label>
              <input type="text" value={researcher.nationality || ''} onChange={(e) => onUpdateField('nationality', e.target.value)} className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[10px] font-bold uppercase focus:shadow-pixel transition-all" />
            </div>
            <div className="space-y-1">
              <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">Date de naissance</label>
              <input type="date" value={researcher.birthDate || ''} onChange={(e) => onUpdateField('birthDate', e.target.value)} className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[10px] font-mono focus:shadow-pixel transition-all" />
            </div>
            <div className="space-y-1">
              <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">UID (Dyna)</label>
              <input 
                type="text" 
                value={researcher.uid || ''} 
                onChange={(e) => onUpdateField('uid', e.target.value)} 
                className={`w-full border-2 border-black dark:border-white p-2 bg-slate-50 dark:bg-slate-800 dark:text-white text-[10px] font-mono ${researcher.id.startsWith('NEW-') ? '' : 'opacity-50'}`} 
                readOnly={!researcher.id.startsWith('NEW-')} 
              />
            </div>
         </div>
       </div>

       {/* Section Emploi et Typologie */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 pt-4">
         <div className="space-y-6">
           <div className="flex items-center gap-3 pb-3 border-b-2 border-black/10 dark:border-white/10">
              <Briefcase className="w-5 h-5 text-gray-400" />
              <h3 className="text-2xl font-pixel text-gray-900 dark:text-white uppercase tracking-widest leading-none">EMPLOI & CONTRAT</h3>
           </div>
           <div className="space-y-5">
              <div className="space-y-1">
                <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">Établissement Employeur</label>
                <input type="text" value={researcher.employment.employer} onChange={(e) => onUpdateField('employer', e.target.value, 'employment')} className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[10px] font-bold uppercase transition-all focus:shadow-pixel" />
              </div>
              <div className="space-y-1">
                <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">Grade / Corps</label>
                <input type="text" value={researcher.employment.grade || ''} onChange={(e) => onUpdateField('grade', e.target.value, 'employment')} className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[10px] font-bold uppercase transition-all focus:shadow-pixel" />
              </div>
              <div className="space-y-1">
                <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">Typologie interne</label>
                <select value={researcher.employment.internalTypology || ''} onChange={(e) => onUpdateField('internalTypology', e.target.value, 'employment')} className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 text-[10px] font-bold uppercase text-primary-dark dark:text-pixel-blue">
                  <option value="">- Non définie -</option>
                  <option value="Enseignant-chercheur">Enseignant-chercheur</option>
                  <option value="Chercheur">Chercheur</option>
                  <option value="Doctorant">Doctorant</option>
                  <option value="Post-doctorant">Post-doctorant</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">Date de début</label>
                  <input type="date" value={researcher.employment.startDate || ''} onChange={(e) => onUpdateField('startDate', e.target.value, 'employment')} className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[10px] font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">Date de fin</label>
                  <input type="date" value={researcher.employment.endDate || ''} onChange={(e) => onUpdateField('endDate', e.target.value, 'employment')} className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[10px] font-mono" />
                </div>
              </div>
              <div className="flex gap-6 items-end">
                <div className="flex-1">
                   <div className="mt-2 flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={!!researcher.nuFields?.hdr} 
                        onChange={(e) => onUpdateField('hdr', e.target.checked, 'nuFields')}
                        className="w-5 h-5 border-2 border-black dark:border-white text-primary-dark rounded-none" 
                      />
                      <span className="text-[10px] font-bold uppercase dark:text-gray-300">HABILITÉ À DIRIGER DES RECHERCHES (HDR)</span>
                   </div>
                </div>
                {researcher.nuFields?.hdr && (
                  <div className="w-1/3 space-y-1">
                     <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">Année HDR</label>
                     <input type="text" value={researcher.nuFields?.hdrYear || ''} onChange={(e) => onUpdateField('hdrYear', e.target.value, 'nuFields')} className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[10px] font-mono" />
                  </div>
                )}
              </div>
           </div>
         </div>

         {/* Section Appartenances */}
         <AffiliationsTable 
            affiliations={affiliations}
            onAdd={onAddAffiliation}
            onRemove={onRemoveAffiliation}
            onChange={onAffiliationChange}
            onNavigateToStructure={onNavigateToStructure}
         />
       </div>

       {/* Section Nantes Université */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 pt-8">
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b-2 border-black/10 dark:border-white/10">
                <Building2 className="w-5 h-5 text-gray-400" />
                <h3 className="text-2xl font-pixel text-gray-900 dark:text-white uppercase tracking-widest leading-none">NANTES UNIVERSITÉ</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-1">
                  <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">Pôle</label>
                  <input type="text" value={researcher.nuFields?.pole || ''} onChange={(e) => onUpdateField('pole', e.target.value, 'nuFields')} className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[10px] font-bold uppercase" />
               </div>
               <div className="space-y-1">
                  <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">Composante</label>
                  <input type="text" value={researcher.nuFields?.composante || ''} onChange={(e) => onUpdateField('composante', e.target.value, 'nuFields')} className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[10px] font-bold uppercase" />
               </div>
               <div className="space-y-1">
                  <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">ED de rattachement</label>
                  <input type="text" value={researcher.nuFields?.doctoralSchool || ''} onChange={(e) => onUpdateField('doctoralSchool', e.target.value, 'nuFields')} className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[10px] font-bold uppercase" />
               </div>
               <div className="space-y-1">
                  <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">Localisation (Site)</label>
                  <input type="text" value={researcher.nuFields?.location || ''} onChange={(e) => onUpdateField('location', e.target.value, 'nuFields')} className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[10px] font-bold uppercase" />
               </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b-2 border-black/10 dark:border-white/10">
                <Hash className="w-5 h-5 text-gray-400" />
                <h3 className="text-2xl font-pixel text-gray-900 dark:text-white uppercase tracking-widest leading-none">IDENTIFIANTS PIVOT</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-1">
                  <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">ORCID</label>
                  <input type="text" value={researcher.identifiers.orcid || ''} onChange={(e) => onUpdateField('orcid', e.target.value, 'identifiers')} className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[10px] font-mono tracking-tighter" />
               </div>
               <div className="space-y-1">
                  <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">IdRef</label>
                  <input type="text" value={researcher.identifiers.idref || ''} onChange={(e) => onUpdateField('idref', e.target.value, 'identifiers')} className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[10px] font-mono tracking-tighter" />
               </div>
               <div className="space-y-1">
                  <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">IdHAL</label>
                  <input type="text" value={researcher.identifiers.halId || ''} onChange={(e) => onUpdateField('halId', e.target.value, 'identifiers')} className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[10px] font-mono tracking-tighter" />
               </div>
               <div className="space-y-1">
                  <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">Scopus ID</label>
                  <input type="text" value={researcher.identifiers.scopusId || ''} onChange={(e) => onUpdateField('scopusId', e.target.value, 'identifiers')} className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[10px] font-mono tracking-tighter" />
               </div>
            </div>
          </div>
       </div>
    </div>
  );
};
