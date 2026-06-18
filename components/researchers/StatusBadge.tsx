import React from 'react';
import { CheckCircle, AlertCircle, Clock, XCircle, ShieldCheck, ShieldAlert } from 'lucide-react';
import { ResearcherStatus } from '../../types';
import { ValidationInfo, isValidationStale } from '../../lib/validation';

interface StatusBadgeProps {
  status: ResearcherStatus;
  /** Couche de validation manuelle — ajoute un décorateur « validé / périmé ». */
  validation?: ValidationInfo;
}

const StatusChip: React.FC<{ status: ResearcherStatus }> = ({ status }) => {
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

/**
 * Décorateur « validé » : axe orthogonal au statut. Indique que la ligne a été
 * fiabilisée manuellement (✓ + source/date en tooltip), ou « périmé » si la
 * validation est trop ancienne (à revérifier).
 */
export const ValidationMark: React.FC<{ validation?: ValidationInfo; now?: Date }> = ({
  validation,
  now = new Date(),
}) => {
  if (!validation?.validated) return null;
  const stale = isValidationStale(validation, now);
  const tooltip = [
    validation.validationSource ? `Source : ${validation.validationSource}` : null,
    validation.validationDate ? `Validé le ${validation.validationDate}` : null,
    validation.validationScope.length ? `Porte sur : ${validation.validationScope.join(' + ')}` : null,
    validation.validatedBy ? `Par ${validation.validatedBy}` : null,
    stale ? '⚠ Validation périmée — à revérifier' : null,
  ].filter(Boolean).join('\n');
  return (
    <span
      title={tooltip}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 border-2 text-[9px] font-bold uppercase tracking-wider ${
        stale
          ? 'border-orange-500 bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300'
          : 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
      }`}
    >
      {stale ? <ShieldAlert className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
      {stale ? 'Périmé' : 'Validé'}
    </span>
  );
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, validation }) => (
  <span className="inline-flex items-center gap-1.5">
    <StatusChip status={status} />
    <ValidationMark validation={validation} />
  </span>
);
