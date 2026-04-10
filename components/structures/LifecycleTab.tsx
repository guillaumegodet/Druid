import React from 'react';
import { Network, Trash2, History } from 'lucide-react';
import { Structure, StructureStatus, LineageType, LineageLink } from '../../types';
import { LineageGraph } from './LineageGraph';

interface LifecycleTabProps {
  structure: Structure;
  onUpdateField: (field: keyof Structure, value: any) => void;
}

export const LifecycleTab: React.FC<LifecycleTabProps> = ({ 
  structure, 
  onUpdateField 
}) => {
  const handleLinkChange = (index: number, field: keyof LineageLink, value: any) => {
    const newLinks = [...(structure.historyLinks || [])];
    newLinks[index] = { ...newLinks[index], [field]: value };
    onUpdateField('historyLinks', newLinks);
  };

  const handleAddLink = () => {
    const newLink: LineageLink = {
      relatedStructureId: '',
      relatedStructureName: '',
      type: LineageType.SUCCESSION,
      date: new Date().toISOString().split('T')[0]
    };
    onUpdateField('historyLinks', [...(structure.historyLinks || []), newLink]);
  };

  const handleRemoveLink = (index: number) => {
    const newLinks = [...(structure.historyLinks || [])];
    newLinks.splice(index, 1);
    onUpdateField('historyLinks', newLinks);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-300">
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 p-6 border-2 border-black dark:border-white bg-slate-50 dark:bg-slate-800 shadow-pixel-sm h-fit">
             <h3 className="text-xl font-pixel text-gray-900 dark:text-white uppercase tracking-widest mb-6 border-b-2 border-black/10 dark:border-white/10 pb-2">ÉTAT ACTUEL</h3>
             <div className="space-y-6">
                <div>
                   <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">STATUT DE L'UNITÉ</label>
                   <select 
                     value={structure.status} 
                     onChange={(e) => onUpdateField('status', e.target.value)} 
                     className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[11px] font-bold uppercase transition-all focus:shadow-pixel mt-1"
                   >
                     <option value={StructureStatus.PROJET}>Projet</option>
                     <option value={StructureStatus.ACTIVE}>Active</option>
                     <option value={StructureStatus.EN_FERMETURE}>En fermeture</option>
                     <option value={StructureStatus.FERMEE}>Fermée</option>
                   </select>
                </div>
                <div>
                   <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">DATE CRÉATION</label>
                   <input 
                     type="date" 
                     value={structure.creationDate || ''} 
                     onChange={(e) => onUpdateField('creationDate', e.target.value)} 
                     className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[11px] font-mono mt-1" 
                   />
                </div>
                <div>
                   <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">DATE FERMETURE</label>
                   <input 
                     type="date" 
                     value={structure.closeDate || ''} 
                     onChange={(e) => onUpdateField('closeDate', e.target.value)} 
                     className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[11px] font-mono mt-1" 
                   />
                </div>
             </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
             <div className="flex items-center gap-3 pb-3 border-b-2 border-black/10 dark:border-white/10 text-gray-400">
               <History className="w-5 h-5" />
               <h3 className="text-2xl font-pixel text-gray-900 dark:text-white uppercase tracking-widest leading-none">VISUALISATION DU LIGNAGE</h3>
             </div>
             <LineageGraph currentStructure={structure} />
          </div>
       </div>

       <div className="space-y-6">
           <div className="flex items-center gap-3 pb-3 border-b-2 border-black/10 dark:border-white/10 text-gray-400">
             <Network className="w-5 h-5" />
             <h3 className="text-2xl font-pixel text-gray-900 dark:text-white uppercase tracking-widest leading-none">GESTION DES FILIATIONS</h3>
           </div>
           <div className="border-4 border-black dark:border-white shadow-pixel overflow-hidden">
              <table className="min-w-full divide-y-2 divide-black dark:divide-white">
                <thead className="bg-slate-100 dark:bg-slate-950">
                   <tr>
                      <th className="px-6 py-3 text-left text-[9px] font-bold text-gray-400 uppercase font-mono border-r-2 border-black dark:border-white">TYPE</th>
                      <th className="px-6 py-3 text-left text-[9px] font-bold text-gray-400 uppercase font-mono border-r-2 border-black dark:border-white">STRUCTURE LIÉE</th>
                      <th className="px-6 py-3 text-left text-[9px] font-bold text-gray-400 uppercase font-mono">DATE</th>
                      <th className="w-16"></th>
                   </tr>
                </thead>
                <tbody className="divide-y-2 divide-black dark:divide-white bg-white dark:bg-slate-900">
                   {(structure.historyLinks || []).map((link, idx) => (
                      <tr key={idx}>
                         <td className="px-6 py-4 border-r-2 border-black dark:border-white">
                            <select 
                              value={link.type} 
                              onChange={(e) => handleLinkChange(idx, 'type', e.target.value as LineageType)} 
                              className="w-full border-2 border-black/10 focus:border-black dark:border-white/10 p-1 bg-white dark:bg-slate-800 text-[10px] font-bold uppercase"
                            >
                                <option value={LineageType.SUCCESSION}>Succède à</option>
                                <option value={LineageType.INTEGRATION}>Intégration</option>
                                <option value={LineageType.FUSION}>Fusion</option>
                                <option value={LineageType.SCISSION}>Scission</option>
                            </select>
                         </td>
                         <td className="px-6 py-4 border-r-2 border-black dark:border-white">
                            <input 
                              type="text" 
                              value={link.relatedStructureName} 
                              onChange={(e) => handleLinkChange(idx, 'relatedStructureName', e.target.value)} 
                              className="w-full text-[11px] font-bold uppercase border-2 border-black/10 bg-white dark:bg-slate-800 dark:text-white p-1" 
                            />
                         </td>
                         <td className="px-6 py-4 border-r-2 border-black dark:border-white">
                            <input 
                              type="date" 
                              value={link.date} 
                              onChange={(e) => handleLinkChange(idx, 'date', e.target.value)} 
                              className="w-full font-mono text-[10px] border-2 border-black/10 bg-white dark:bg-slate-800 dark:text-white p-1" 
                            />
                         </td>
                         <td className="px-4 py-4 text-center">
                            <button onClick={() => handleRemoveLink(idx)} className="text-gray-400 hover:text-pixel-pink transition-colors">
                               <Trash2 className="w-4 h-4" />
                            </button>
                         </td>
                      </tr>
                   ))}
                </tbody>
              </table>
              <div className="bg-slate-50 dark:bg-slate-950 p-4 border-t-2 border-black dark:border-white text-right">
                 <button 
                  onClick={handleAddLink} 
                  className="px-5 py-2 bg-white dark:bg-slate-800 border-2 border-black dark:border-white text-[10px] font-bold uppercase shadow-pixel-sm active:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                 >
                   + AJOUTER UN LIEN
                 </button>
              </div>
           </div>
       </div>
    </div>
  );
};
