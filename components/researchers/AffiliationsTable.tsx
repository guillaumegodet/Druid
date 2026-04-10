import React from 'react';
import { Building2, Plus, Trash2, ExternalLink } from 'lucide-react';
import { Affiliation } from '../../types';

interface AffiliationsTableProps {
  affiliations: Affiliation[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, field: keyof Affiliation, value: any) => void;
  onNavigateToStructure?: (structureId: string) => void;
}

export const AffiliationsTable: React.FC<AffiliationsTableProps> = ({ 
  affiliations, 
  onAdd, 
  onRemove, 
  onChange,
  onNavigateToStructure
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b-2 border-black/10 dark:border-white/10">
         <div className="flex items-center gap-3">
           <Building2 className="w-5 h-5 text-gray-400" />
           <h3 className="text-2xl font-pixel text-gray-900 dark:text-white uppercase tracking-widest leading-none">APPARTENANCES</h3>
         </div>
         <button 
          onClick={onAdd} 
          className="px-3 py-1 text-[8px] font-bold uppercase text-primary-dark dark:text-white border-2 border-black dark:border-white bg-white dark:bg-slate-800 shadow-pixel-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
         >
           + Ajouter
         </button>
      </div>
      <div className="border-2 border-black dark:border-white overflow-hidden shadow-pixel-sm">
         <table className="min-w-full divide-y-2 divide-black dark:divide-white">
           <thead className="bg-slate-50 dark:bg-slate-950">
             <tr>
               <th className="px-4 py-2 text-left text-[8px] font-bold text-gray-400 uppercase font-mono border-r-2 border-black dark:border-white">Structure</th>
               <th className="px-4 py-2 text-left text-[8px] font-bold text-gray-400 uppercase font-mono border-r-2 border-black dark:border-white">Équipe</th>
               <th className="px-4 py-2 text-left text-[8px] font-bold text-gray-400 uppercase font-mono border-r-2 border-black dark:border-white">Début</th>
               <th className="px-4 py-2 text-left text-[8px] font-bold text-gray-400 uppercase font-mono">Fin</th>
               <th className="w-10"></th>
             </tr>
           </thead>
           <tbody className="divide-y-2 divide-black dark:divide-white bg-white dark:bg-slate-900">
             {affiliations.map((aff, idx) => (
               <tr key={idx} className={aff.isPrimary ? "bg-pixel-blue/5" : ""}>
                 <td className="p-2 border-r-2 border-black dark:border-white relative group">
                   <div className="flex items-center gap-1">
                     <input 
                      type="text" 
                      value={aff.structureName} 
                      onChange={(e) => onChange(idx, 'structureName', e.target.value)} 
                      className="w-full text-[10px] border-2 border-black/20 focus:border-black dark:border-white/20 p-1 bg-white dark:bg-slate-800 dark:text-white uppercase font-bold" 
                     />
                     {aff.structureId && onNavigateToStructure && (
                        <button 
                          onClick={() => onNavigateToStructure(aff.structureId!)} 
                          title="Afficher la fiche détaillée de cette structure"
                          className="p-1 px-1.5 border-2 border-transparent hover:border-black dark:hover:border-white hover:bg-slate-100 dark:hover:bg-slate-800 text-gray-500 hover:text-pixel-blue transition-all shrink-0"
                        >
                           <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                     )}
                   </div>
                 </td>
                 <td className="p-2 border-r-2 border-black dark:border-white">
                   <input 
                    type="text" 
                    value={aff.team} 
                    onChange={(e) => onChange(idx, 'team', e.target.value)} 
                    className="w-full text-[10px] border-2 border-black/20 focus:border-black dark:border-white/20 p-1 bg-white dark:bg-slate-800 dark:text-white uppercase font-bold" 
                   />
                 </td>
                 <td className="p-2 border-r-2 border-black dark:border-white">
                   <input 
                    type="date" 
                    value={aff.startDate} 
                    onChange={(e) => onChange(idx, 'startDate', e.target.value)} 
                    className="w-full text-[10px] border-2 border-black/20 focus:border-black dark:border-white/20 p-1 bg-white dark:bg-slate-800 dark:text-white font-mono" 
                   />
                 </td>
                 <td className="p-2">
                   <input 
                    type="date" 
                    value={aff.endDate || ''} 
                    onChange={(e) => onChange(idx, 'endDate', e.target.value)} 
                    className="w-full text-[10px] border-2 border-black/20 focus:border-black dark:border-white/20 p-1 bg-white dark:bg-slate-800 dark:text-white font-mono" 
                   />
                 </td>
                 <td className="p-2 text-center">
                   <button onClick={() => onRemove(idx)} className="text-gray-400 hover:text-pixel-pink transition-colors">
                     <Trash2 className="w-4 h-4" />
                   </button>
                 </td>
               </tr>
             ))}
           </tbody>
         </table>
      </div>
    </div>
  );
};
