import React from 'react';
import { RefreshCw, AlertTriangle, ArrowLeft as ArrowLeftIcon, ArrowRight } from 'lucide-react';
import { ComparisonField } from '../../types';

interface ComparisonViewProps {
  tabTitle: string;
  fields: ComparisonField[];
  onImport: (key: string) => void;
  onPush: (key: string) => void;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ 
  tabTitle, 
  fields,
  onImport,
  onPush
}) => {
  const renderRow = (field: ComparisonField) => {
    const isDifferent = field.localValue !== field.remoteValue;
    return (
      <tr key={field.key} className="hover:bg-pixel-blue/5 group border-b-2 border-black/10 dark:border-white/10 transition-colors">
        <td className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase font-mono w-1/4 border-r-2 border-black dark:border-white">{field.label}</td>
        <td className="px-6 py-4 text-[11px] text-gray-900 dark:text-white w-1/3 border-r-2 border-black dark:border-white">
           <div className="p-3 border-2 border-black dark:border-white bg-white dark:bg-slate-800 min-h-[44px] flex items-center font-bold tracking-tight">
             {field.localValue || <span className="text-gray-400 italic opacity-50">NULL</span>}
           </div>
        </td>
        <td className="px-4 py-4 w-[10%] text-center border-r-2 border-black dark:border-white">
           {isDifferent && (
             <div className="flex flex-col gap-3 items-center">
                <button 
                  onClick={() => onImport(field.key)}
                  className="p-2 border-2 border-black dark:border-white bg-pixel-blue text-white shadow-pixel-sm active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all" 
                  title="Import from Source"
                >
                   <ArrowLeftIcon className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => onPush(field.key)}
                  className="p-2 border-2 border-black dark:border-white bg-pixel-pink text-white shadow-pixel-sm active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all" 
                  title="Push to Source"
                >
                   <ArrowRight className="w-4 h-4" />
                </button>
             </div>
           )}
        </td>
        <td className="px-6 py-4 text-[11px] text-gray-900 dark:text-white w-1/3">
          <div className={`p-3 border-2 ${isDifferent ? 'border-pixel-pink bg-pixel-pink/5 dark:bg-pixel-pink/10' : 'border-black dark:border-white bg-slate-50 dark:bg-slate-800/50'} min-h-[44px] flex items-center justify-between font-bold`}>
             <span className={isDifferent ? 'text-pixel-pink' : ''}>{field.remoteValue || <span className="text-gray-400 italic opacity-50">NULL</span>}</span>
             {isDifferent && <AlertTriangle className="w-4 h-4 text-pixel-pink shrink-0 animate-pulse" />}
           </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center gap-4 text-primary-dark dark:text-pixel-blue bg-pixel-blue/10 p-6 border-2 border-black dark:border-white shadow-pixel-sm">
         <RefreshCw className="w-6 h-6 shrink-0 inline-block mr-2" />
         <p className="text-[12px] font-pixel uppercase tracking-widest">
           COMPARAISON AVEC LA SOURCE : <span className="text-black dark:text-white">{tabTitle}</span>
         </p>
      </div>
      <div className="border-2 border-black dark:border-white shadow-pixel-sm overflow-hidden">
        <table className="min-w-full divide-y-2 divide-black dark:divide-white">
          <thead className="bg-slate-100 dark:bg-slate-950">
            <tr>
              <th className="px-6 py-3 text-left text-[10px] font-bold uppercase font-mono border-r-2 border-black dark:border-white">Champ</th>
              <th className="px-6 py-3 text-left text-[10px] font-bold uppercase font-mono border-r-2 border-black dark:border-white">Druid (Local)</th>
              <th className="w-[10%] border-r-2 border-black dark:border-white"></th>
              <th className="px-6 py-3 text-left text-[10px] font-bold uppercase font-mono">Source (Distant)</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-black dark:divide-white bg-white dark:bg-slate-900">
            {fields.map(renderRow)}
          </tbody>
        </table>
      </div>
    </div>
  );
};
