import React from 'react';
import { Users, MapPin } from 'lucide-react';
import { Structure } from '../../types';
import { AddressSearchField } from './AddressSearchField';

interface GovernanceTabProps {
  structure: Structure;
  onUpdateField: (field: keyof Structure, value: any) => void;
}

export const GovernanceTab: React.FC<GovernanceTabProps> = ({ 
  structure, 
  onUpdateField 
}) => {
  return (
    <div className="space-y-12 animate-in fade-in duration-300">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
           <div className="space-y-8">
              <section className="space-y-6">
                 <div className="flex items-center gap-3 pb-3 border-b-2 border-black/10 dark:border-white/10 text-gray-400">
                    <Users className="w-5 h-5" />
                    <h3 className="text-2xl font-pixel text-gray-900 dark:text-white uppercase tracking-widest leading-none">GOUVERNANCE</h3>
                 </div>
                 <div className="space-y-4">
                    <div>
                       <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">DIRECTEUR / RESPONSABLE</label>
                       <input 
                        type="text" 
                        value={structure.director || ''} 
                        onChange={(e) => onUpdateField('director', e.target.value)} 
                        className="w-full border-2 border-black dark:border-white p-2 bg-white dark:border-slate-800 dark:text-white text-[12px] font-bold uppercase focus:shadow-pixel transition-all" 
                        placeholder="Rechercher..." 
                       />
                    </div>
                    <div>
                       <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">TUTELLES UAI (CODES)</label>
                       <input 
                        type="text" 
                        value={structure.institutionCodes || ''} 
                        onChange={(e) => onUpdateField('institutionCodes', e.target.value)} 
                        className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[11px] font-mono focus:shadow-pixel transition-all" 
                       />
                    </div>
                 </div>
              </section>
           </div>

           <div className="space-y-8">
              <section className="space-y-6">
                 <div className="flex items-center gap-3 pb-3 border-b-2 border-black/10 dark:border-white/10 text-gray-400">
                    <MapPin className="w-5 h-5" />
                    <h3 className="text-2xl font-pixel text-gray-900 dark:text-white uppercase tracking-widest leading-none">LOCALISATION</h3>
                 </div>
                 <div className="space-y-4">
                    <AddressSearchField 
                      initialValue={structure.address || ''} 
                      onAddressSelect={({ label, postcode, city }) => {
                        onUpdateField('address', label);
                        onUpdateField('zipCode', postcode);
                        onUpdateField('city', city);
                      }}
                    />
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">CODE POSTAL</label>
                          <input 
                            type="text" 
                            value={structure.zipCode || ''} 
                            onChange={(e) => onUpdateField('zipCode', e.target.value)} 
                            className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[11px] font-mono focus:shadow-pixel transition-all" 
                          />
                       </div>
                       <div>
                          <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">VILLE</label>
                          <input 
                            type="text" 
                            value={structure.city || ''} 
                            onChange={(e) => onUpdateField('city', e.target.value)} 
                            className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[11px] font-bold uppercase focus:shadow-pixel transition-all" 
                          />
                       </div>
                    </div>
                 </div>
              </section>
           </div>
        </div>
    </div>
  );
};
