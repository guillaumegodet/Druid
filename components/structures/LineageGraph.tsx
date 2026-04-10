import React from 'react';
import { ArrowRight, History, GitMerge, GitBranch } from 'lucide-react';
import { Structure, LineageType, LineageLink } from '../../types';

interface LineageGraphProps {
  currentStructure: Structure;
}

/**
 * Composant de visualisation graphique du lignage (historique) de la structure.
 * Style Pixel/Lo-fi avec connecteurs SVG.
 */
export const LineageGraph: React.FC<LineageGraphProps> = ({ currentStructure }) => {
  const links = currentStructure.historyLinks || [];
  
  if (links.length === 0) {
    return (
      <div className="p-8 border-2 border-dashed border-black/20 dark:border-white/20 flex flex-col items-center justify-center text-gray-400 gap-4 bg-slate-50/50 dark:bg-slate-900/50">
        <History className="w-12 h-12 opacity-20" />
        <p className="text-[10px] font-pixel uppercase tracking-widest text-center">AUCUN ANTÉCÉDENT ENREGISTRÉ POUR CETTE UNITÉ</p>
      </div>
    );
  }

  const getTypeIcon = (type: LineageType) => {
    switch (type) {
      case LineageType.FUSION: return <GitMerge className="w-4 h-4" />;
      case LineageType.SCISSION: return <GitBranch className="w-4 h-4" />;
      default: return <History className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: LineageType) => {
    switch (type) {
      case LineageType.SUCCESSION: return "bg-pixel-blue";
      case LineageType.INTEGRATION: return "bg-pixel-teal";
      case LineageType.FUSION: return "bg-pixel-pink";
      case LineageType.SCISSION: return "bg-pixel-yellow";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="relative p-8 bg-slate-50 dark:bg-slate-950 border-4 border-black dark:border-white shadow-pixel-sm overflow-x-auto min-h-[300px] flex items-center justify-center">
      <div className="flex items-center gap-16 min-w-max">
        
        {/* Colonnes des ancêtres */}
        <div className="flex flex-col gap-8">
           {links.map((link, idx) => (
             <div key={idx} className="relative flex items-center gap-4">
                <div className="flex flex-col items-end">
                   <div className="px-4 py-3 border-4 border-black dark:border-white bg-white dark:bg-slate-800 shadow-pixel-sm max-w-[200px]">
                      <h4 className="text-[10px] font-bold uppercase truncate text-gray-900 dark:text-white">{link.relatedStructureName}</h4>
                      <p className="text-[8px] font-mono text-gray-400 mt-1">{link.date}</p>
                   </div>
                   <div className={`mt-2 px-2 py-0.5 ${getTypeColor(link.type)} text-white text-[7px] font-bold uppercase`}>
                      {link.type}
                   </div>
                </div>

                {/* Connecteur SVG */}
                <svg className="w-16 h-8 text-black dark:text-white overflow-visible" preserveAspectRatio="none">
                   <path 
                    d="M 0 16 L 64 16" 
                    stroke="currentColor" 
                    strokeWidth="4" 
                    fill="none" 
                    strokeDasharray="8 4"
                   />
                   <rect x="56" y="12" width="8" height="8" fill="currentColor" />
                </svg>
             </div>
           ))}
        </div>

        {/* Structure Actuelle */}
        <div className="relative">
           <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="px-3 py-1 bg-black text-white dark:bg-white dark:text-black text-[9px] font-pixel uppercase tracking-tighter">UNITÉ CIBLE</span>
           </div>
           <div className="p-8 border-4 border-black dark:border-white bg-pixel-blue text-white shadow-pixel transform hover:scale-105 transition-transform cursor-default ring-4 ring-pixel-blue/30">
              <h3 className="text-2xl font-pixel uppercase tracking-widest">{currentStructure.acronym}</h3>
              <p className="text-[9px] font-mono mt-2 opacity-80">{currentStructure.code}</p>
           </div>
           {/* Indicateur de statut actuel */}
           <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
              <div className="px-4 py-1 border-2 border-black dark:border-white bg-white dark:bg-slate-900 text-black dark:text-white text-[8px] font-bold uppercase shadow-pixel-sm">
                 {currentStructure.status}
              </div>
           </div>
        </div>

        {/* Prochaines étapes (Placeholder pour montrer la direction) */}
        <div className="flex flex-col gap-8 opacity-20">
           <div className="flex items-center gap-4">
              <svg className="w-16 h-8 text-black dark:text-white" preserveAspectRatio="none">
                 <path d="M 0 16 L 64 16" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="8 4" />
              </svg>
              <div className="px-4 py-3 border-4 border-black/50 border-dashed bg-transparent">
                 <div className="w-24 h-4 bg-black/10"></div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};
