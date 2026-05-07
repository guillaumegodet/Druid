import React from 'react';
import { CheckCircle, AlertCircle, Clock, XCircle } from 'lucide-react';
import { ResearcherStatus } from '../../types';

interface StatusBadgeProps {
  status: ResearcherStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case ResearcherStatus.INTERNE:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 border-2 border-black bg-pixel-teal text-gray-900 text-[10px] font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <CheckCircle className="w-3 h-3" /> Interne
        </span>
      );
    case ResearcherStatus.DEPART:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 border-2 border-black bg-pixel-pink text-white text-[10px] font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <XCircle className="w-3 h-3" /> Départ
        </span>
      );
    case ResearcherStatus.PARTI:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 border-2 border-black bg-pixel-blue text-white text-[10px] font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <Clock className="w-3 h-3" /> Parti
        </span>
      );
    case ResearcherStatus.EXTERNE:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 border-2 border-black bg-pixel-yellow text-gray-900 text-[10px] font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <AlertCircle className="w-3 h-3" /> Externe
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 border-2 border-black dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] uppercase font-bold">
          Aucun statut
        </span>
      );
  }
};
