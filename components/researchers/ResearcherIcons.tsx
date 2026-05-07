import React from 'react';

/**
 * Composant affichant les icônes d'identifiants chercheurs
 * Style Pixel/Lo-fi conforme à l'application.
 */
export const ResearcherIcons: React.FC<{ identifiers: any }> = ({ identifiers }) => {
  const hasOrcid = !!identifiers.orcid;
  const hasHal = !!identifiers.halId;
  const hasIdref = !!identifiers.idref;
  const hasScopus = !!identifiers.scopusId;

  if (!hasOrcid && !hasHal && !hasIdref && !hasScopus) {
    return <span className="text-[10px] text-gray-300 font-mono italic">AUCUN ID</span>;
  }

  const boxStyles = "w-7 h-7 border-2 border-black dark:border-white flex items-center justify-center shadow-pixel-sm transform hover:scale-110 transition-transform cursor-help";

  return (
    <div className="flex gap-2 items-center">
      {/* ORCID */}
      {hasOrcid && (
        <div 
          title={`ORCID: ${identifiers.orcid}`}
          className={`${boxStyles} bg-[#A6CE39]`}
        >
          <span className="text-[13px] font-bold text-white font-pixel">iD</span>
        </div>
      )}

      {/* IdHAL */}
      {hasHal && (
        <div 
          title={`HAL: ${identifiers.halId}`}
          className={`${boxStyles} bg-[#212139]`}
        >
          <div className="relative w-full h-full flex items-center justify-center">
             <div className="absolute inset-0 bg-gradient-to-tr from-purple-800 to-transparent opacity-50"></div>
             <span className="text-[11px] font-bold text-white font-pixel z-10 leading-none">HAL</span>
          </div>
        </div>
      )}

      {/* IdRef */}
      {hasIdref && (
        <div 
          title={`IdRef: ${identifiers.idref}`}
          className={`${boxStyles} bg-white overflow-hidden p-0.5`}
        >
          <img src={`${import.meta.env.BASE_URL}idref.svg`} alt="IdRef" className="w-full h-full object-contain" />
        </div>
      )}

      {/* Scopus */}
      {hasScopus && (
        <div 
          title={`Scopus: ${identifiers.scopusId}`}
          className={`${boxStyles} bg-[#FF8200]`}
        >
          <span className="text-[13px] font-bold text-white font-pixel">SC</span>
        </div>
      )}
    </div>
  );
};
