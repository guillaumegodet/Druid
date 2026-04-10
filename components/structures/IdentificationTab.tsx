import React from 'react';
import { Building, Layers } from 'lucide-react';
import { Structure, StructureLevel, StructureNature } from '../../types';

interface IdentificationTabProps {
  structure: Structure;
  onUpdateField: (field: keyof Structure, value: any) => void;
}

export const IdentificationTab: React.FC<IdentificationTabProps> = ({ 
  structure, 
  onUpdateField 
}) => {
  return (
    <div className="space-y-12 animate-in fade-in duration-300">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6">
             <div className="flex items-center gap-3 pb-3 border-b-2 border-black/10 dark:border-white/10 text-gray-400">
                <Building className="w-5 h-5" />
                <h3 className="text-2xl font-pixel text-gray-900 dark:text-white uppercase tracking-widest leading-none">DÉNOMINATIONS</h3>
             </div>
             <div className="space-y-4">
               <div>
                  <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">NOM OFFICIEL (COMPLET)</label>
                  <input 
                    type="text" 
                    value={structure.officialName} 
                    onChange={(e) => onUpdateField('officialName', e.target.value)} 
                    className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[12px] font-bold uppercase transition-all focus:shadow-pixel" 
                  />
               </div>
               <div>
                  <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">NOM COURT / SIGLE / ACRONYME</label>
                  <input 
                    type="text" 
                    value={structure.acronym} 
                    onChange={(e) => onUpdateField('acronym', e.target.value)} 
                    className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[12px] font-bold uppercase transition-all focus:shadow-pixel" 
                  />
               </div>
               <div>
                  <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">DESCRIPTION</label>
                  <textarea 
                    value={structure.description || ''} 
                    onChange={(e) => onUpdateField('description', e.target.value)} 
                    rows={3} 
                    className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[10px] font-bold uppercase transition-all focus:shadow-pixel" 
                  />
               </div>
             </div>
          </div>

          <div className="space-y-6">
             <div className="flex items-center gap-3 pb-3 border-b-2 border-black/10 dark:border-white/10 text-gray-400">
                <Layers className="w-5 h-5" />
                <h3 className="text-2xl font-pixel text-gray-900 dark:text-white uppercase tracking-widest leading-none">TYPOLOGIE & CODES</h3>
             </div>
             <div className="space-y-4">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div>
                      <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">NIVEAU (CADRE NATIONAL)</label>
                      <select 
                        value={structure.level} 
                        onChange={(e) => onUpdateField('level', e.target.value)} 
                        className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[10px] font-bold uppercase transition-all focus:shadow-pixel"
                      >
                         <option value={StructureLevel.ETABLISSEMENT}>Établissement (Niveau 4)</option>
                         <option value={StructureLevel.INTERMEDIAIRE}>Structure Intermédiaire (Niveau 3)</option>
                         <option value={StructureLevel.ENTITE}>Unité (Niveau 2)</option>
                         <option value={StructureLevel.EQUIPE}>Équipe (Niveau 1)</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">NATURE</label>
                      <select 
                        value={structure.nature} 
                        onChange={(e) => onUpdateField('nature', e.target.value)} 
                        className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[10px] font-bold uppercase transition-all focus:shadow-pixel"
                      >
                         <option value={StructureNature.PUBLIC}>Public</option>
                         <option value={StructureNature.PRIVE}>Privé</option>
                         <option value={StructureNature.MIXTE}>Mixte</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">TYPE</label>
                      <input 
                        type="text" 
                        value={structure.type} 
                        onChange={(e) => onUpdateField('type', e.target.value)} 
                        className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[12px] font-bold uppercase transition-all focus:shadow-pixel" 
                      />
                   </div>
                   <div>
                      <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">NUMÉRO UNITÉ</label>
                      <input 
                        type="text" 
                        value={structure.code} 
                        onChange={(e) => onUpdateField('code', e.target.value)} 
                        className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[12px] font-mono transition-all focus:shadow-pixel" 
                      />
                   </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                     <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">PÔLE</label>
                     <input 
                       type="text" 
                       value={structure.cluster || ''} 
                       onChange={(e) => onUpdateField('cluster', e.target.value)} 
                       className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[12px] font-bold uppercase transition-all focus:shadow-pixel" 
                       placeholder="ex: Pôle Sciences" 
                     />
                  </div>
                  <div>
                     <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">ID RNSR (NATIONAL)</label>
                     <input 
                       type="text" 
                       value={structure.rnsrId || ''} 
                       onChange={(e) => onUpdateField('rnsrId', e.target.value)} 
                       className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[12px] font-mono transition-all focus:shadow-pixel" 
                       placeholder="ex: 201822446V" 
                     />
                  </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                     <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">ID ROR (GLOBAL)</label>
                     <input 
                       type="text" 
                       value={structure.rorId || ''} 
                       onChange={(e) => onUpdateField('rorId', e.target.value)} 
                       className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[12px] font-mono transition-all focus:shadow-pixel" 
                       placeholder="ex: 04z8jg214" 
                     />
                  </div>
                  <div>
                     <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">ID SCOPUS</label>
                     <input 
                       type="text" 
                       value={structure.identifiers?.scopusId || ''} 
                       onChange={(e) => onUpdateField('identifiers', { ...structure.identifiers, scopusId: e.target.value })} 
                       className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[12px] font-mono transition-all focus:shadow-pixel" 
                       placeholder="ex: 60028048" 
                     />
                  </div>
               </div>
             </div>
          </div>
       </div>
    </div>
  );
};
