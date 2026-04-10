import React from 'react';
import { Activity, Hash } from 'lucide-react';
import { Structure, StructureMission } from '../../types';

interface ClassificationTabProps {
  structure: Structure;
  onUpdateField: (field: keyof Structure, value: any) => void;
}

export const ClassificationTab: React.FC<ClassificationTabProps> = ({ 
  structure, 
  onUpdateField 
}) => {
  return (
    <div className="space-y-12 animate-in fade-in duration-300">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6">
             <div className="flex items-center gap-3 pb-3 border-b-2 border-black/10 dark:border-white/10 text-gray-400">
               <Activity className="w-5 h-5" />
               <h3 className="text-2xl font-pixel text-gray-900 dark:text-white uppercase tracking-widest leading-none">MISSIONS</h3>
             </div>
             <div className="space-y-4">
               <div>
                 <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">MISSION PRINCIPALE</label>
                 <select 
                    value={structure.primaryMission} 
                    onChange={(e) => onUpdateField('primaryMission', e.target.value)} 
                    className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[11px] font-bold uppercase transition-all focus:shadow-pixel"
                 >
                    <option value={StructureMission.RECHERCHE}>Recherche</option>
                    <option value={StructureMission.SERVICES_SCIENTIFIQUES}>Services Scientifiques</option>
                    <option value={StructureMission.SERVICES_ADMINISTRATIFS}>Services Administratifs</option>
                 </select>
               </div>
               <div>
                 <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">MISSION SECONDAIRE</label>
                 <select 
                    value={structure.secondaryMission || ''} 
                    onChange={(e) => onUpdateField('secondaryMission', e.target.value)} 
                    className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[11px] font-bold uppercase transition-all focus:shadow-pixel"
                 >
                    <option value="">- Aucune -</option>
                    <option value={StructureMission.RECHERCHE}>Recherche</option>
                    <option value={StructureMission.SERVICES_SCIENTIFIQUES}>Services Scientifiques</option>
                    <option value={StructureMission.SERVICES_ADMINISTRATIFS}>Services Administratifs</option>
                 </select>
               </div>
             </div>
          </div>

          <div className="space-y-6">
             <div className="flex items-center gap-3 pb-3 border-b-2 border-black/10 dark:border-white/10 text-gray-400">
               <Hash className="w-5 h-5" />
               <h3 className="text-2xl font-pixel text-gray-900 dark:text-white uppercase tracking-widest leading-none">THÉMATIQUES</h3>
             </div>
             <div className="space-y-4">
               <div>
                 <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">DOMAINE HCÉRES</label>
                 <input 
                    type="text" 
                    value={structure.hceresDomain || ''} 
                    onChange={(e) => onUpdateField('hceresDomain', e.target.value)} 
                    className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[11px] font-bold uppercase focus:shadow-pixel" 
                    placeholder="ex: ST6" 
                 />
               </div>
               <div>
                 <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">VAGUE D'ÉVALUATION</label>
                 <input 
                    type="text" 
                    value={structure.evaluationWave || ''} 
                    onChange={(e) => onUpdateField('evaluationWave', e.target.value)} 
                    className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[11px] font-bold uppercase focus:shadow-pixel" 
                    placeholder="ex: Vague C" 
                 />
               </div>
             </div>
          </div>
       </div>
    </div>
  );
};
