import React from 'react';
import { User, Briefcase, Building2, Hash, Lock, ExternalLink } from 'lucide-react';
import { Researcher, Affiliation } from '../../types';
import { AffiliationsTable } from './AffiliationsTable';
import { GradeSelect } from './GradeSelect';

const LdapFieldLabel: React.FC<{ label: string; fromLdap?: boolean }> = ({ label, fromLdap }) => (
  <div className="flex items-center gap-2">
    <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">{label}</label>
    {fromLdap && (
      <span className="flex items-center gap-1 px-1 py-0.5 text-[7px] font-bold uppercase font-mono bg-pixel-blue text-white border border-black">
        <Lock className="w-2 h-2" />LDAP
      </span>
    )}
  </div>
);

interface GeneralTabProps {
  researcher: Researcher;
  affiliations: Affiliation[];
  onUpdateField: (field: string, value: any, subObject?: string) => void;
  onAddAffiliation: () => void;
  onRemoveAffiliation: (index: number) => void;
  onAffiliationChange: (index: number, field: keyof Affiliation, value: any) => void;
  onNavigateToStructure?: (structureId: string) => void;
}

export const GeneralTab: React.FC<GeneralTabProps> = ({
  researcher,
  affiliations,
  onUpdateField,
  onAddAffiliation,
  onRemoveAffiliation,
  onAffiliationChange,
  onNavigateToStructure
}) => {
  return (
    <div className="space-y-12 animate-in fade-in duration-300">
       {/* Section État Civil */}
       <div className="space-y-6">
         <div className="flex items-center gap-3 pb-3 border-b-2 border-black/10 dark:border-white/10">
            <User className="w-5 h-5 text-gray-400" />
            <h3 className="text-2xl font-pixel text-gray-900 dark:text-white uppercase tracking-widest leading-none">ÉTAT CIVIL</h3>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-1">
              <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">Civilité</label>
              <select value={researcher.civility} onChange={(e) => onUpdateField('civility', e.target.value)} className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-xs font-bold uppercase focus:ring-0">
                <option value="">-</option>
                <option value="F">F</option>
                <option value="M">M</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">Nom d'usage</label>
              <input type="text" value={researcher.lastName} onChange={(e) => onUpdateField('lastName', e.target.value)} className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[12px] font-bold uppercase focus:shadow-pixel transition-all" />
            </div>
            <div className="space-y-1">
              <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">Prénom</label>
              <input type="text" value={researcher.firstName} onChange={(e) => onUpdateField('firstName', e.target.value)} className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[12px] font-bold uppercase focus:shadow-pixel transition-all" />
            </div>
            <div className="space-y-1">
              <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">Nationalité</label>
              <input type="text" value={researcher.nationality || ''} onChange={(e) => onUpdateField('nationality', e.target.value)} className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[10px] font-bold uppercase focus:shadow-pixel transition-all" />
            </div>
            <div className="space-y-1">
              <LdapFieldLabel label="Date de naissance" fromLdap={researcher.ldapFields?.includes('birthDate')} />
              <input
                type="date"
                value={researcher.birthDate || ''}
                onChange={(e) => onUpdateField('birthDate', e.target.value)}
                disabled={researcher.ldapFields?.includes('birthDate')}
                className={`w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[10px] font-mono focus:shadow-pixel transition-all${researcher.ldapFields?.includes('birthDate') ? ' opacity-60 cursor-not-allowed' : ''}`}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">UID (Dyna)</label>
              <input 
                type="text" 
                value={researcher.uid || ''} 
                onChange={(e) => onUpdateField('uid', e.target.value)} 
                className={`w-full border-2 border-black dark:border-white p-2 bg-slate-50 dark:bg-slate-800 dark:text-white text-[10px] font-mono ${researcher.id.startsWith('NEW-') ? '' : 'opacity-50'}`} 
                readOnly={!researcher.id.startsWith('NEW-')} 
              />
            </div>
         </div>
       </div>

       {/* Section Emploi et Typologie */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 pt-4">
         <div className="space-y-6">
           <div className="flex items-center gap-3 pb-3 border-b-2 border-black/10 dark:border-white/10">
              <Briefcase className="w-5 h-5 text-gray-400" />
              <h3 className="text-2xl font-pixel text-gray-900 dark:text-white uppercase tracking-widest leading-none">EMPLOI & CONTRAT</h3>
           </div>
           <div className="space-y-5">
              <div className="space-y-1">
                <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">Établissement Employeur</label>
                <input type="text" value={researcher.employment.employer} onChange={(e) => onUpdateField('employer', e.target.value, 'employment')} className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[10px] font-bold uppercase transition-all focus:shadow-pixel" />
              </div>
              <div className="space-y-1">
                <LdapFieldLabel label="Grade / Corps" fromLdap={researcher.employment.ldapFields?.includes('grade')} />
                <GradeSelect
                  value={researcher.employment.grade || ''}
                  onChange={(code) => onUpdateField('grade', code, 'employment')}
                  disabled={researcher.employment.ldapFields?.includes('grade')}
                  className={`w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[10px] font-bold uppercase transition-all focus:shadow-pixel${researcher.employment.ldapFields?.includes('grade') ? ' opacity-60 cursor-not-allowed' : ''}`}
                />
              </div>
              <div className="space-y-1">
                <LdapFieldLabel label="Type d'emploi" fromLdap={researcher.employment.ldapFields?.includes('contractType')} />
                <select
                  value={researcher.employment.contractType || ''}
                  onChange={(e) => onUpdateField('contractType', e.target.value, 'employment')}
                  disabled={researcher.employment.ldapFields?.includes('contractType')}
                  className={`w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 text-[10px] font-bold uppercase text-primary-dark dark:text-pixel-blue${researcher.employment.ldapFields?.includes('contractType') ? ' opacity-60 cursor-not-allowed' : ''}`}
                >
                  <option value="">— Non défini —</option>
                  <option value="TITULAIRE">TITULAIRE</option>
                  <option value="CDI UNIVERSITE">CDI UNIVERSITE</option>
                  <option value="CDD UNIVERSITE">CDD UNIVERSITE</option>
                  <option value="APPRENTI">APPRENTI</option>
                  <option value="CHERCHEUR INVITE">CHERCHEUR INVITE</option>
                  <option value="CNRS-INSERM">CNRS-INSERM</option>
                  <option value="DECEDE">DECEDE</option>
                  <option value="DOCTORANT">DOCTORANT</option>
                  <option value="ELU.E ETUDIANT.E">ELU.E ETUDIANT.E</option>
                  <option value="ENSEIGNANT HEBERGE">ENSEIGNANT HEBERGE</option>
                  <option value="MAITRE DE CONFERENCES HONORAIRE">MAITRE DE CONFERENCES HONORAIRE</option>
                  <option value="MEMBRE ASSOCIATION">MEMBRE ASSOCIATION</option>
                  <option value="PERSONNALITE EXTERIEURE">PERSONNALITE EXTERIEURE</option>
                  <option value="PERSONNEL STRUCTURE PARTENAIRE">PERSONNEL STRUCTURE PARTENAIRE</option>
                  <option value="PRESTATAIRE">PRESTATAIRE</option>
                  <option value="PRESTATAIRE INTEGRE">PRESTATAIRE INTEGRE</option>
                  <option value="PROFESSEUR EMERITE">PROFESSEUR EMERITE</option>
                  <option value="RETRAITE">RETRAITE</option>
                  <option value="STAGIAIRE">STAGIAIRE</option>
                  <option value="VACATAIRE">VACATAIRE</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">Date de début</label>
                  <input type="date" value={researcher.employment.startDate || ''} onChange={(e) => onUpdateField('startDate', e.target.value, 'employment')} className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[10px] font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">Date de fin</label>
                  <input type="date" value={researcher.employment.endDate || ''} onChange={(e) => onUpdateField('endDate', e.target.value, 'employment')} className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[10px] font-mono" />
                </div>
              </div>
              <div className="flex gap-6 items-end">
                <div className="flex-1">
                   <div className="mt-2 flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={!!researcher.nuFields?.hdr} 
                        onChange={(e) => onUpdateField('hdr', e.target.checked, 'nuFields')}
                        className="w-5 h-5 border-2 border-black dark:border-white text-primary-dark rounded-none" 
                      />
                      <span className="text-[10px] font-bold uppercase dark:text-gray-300">HABILITÉ À DIRIGER DES RECHERCHES (HDR)</span>
                   </div>
                </div>
                {researcher.nuFields?.hdr && (
                  <div className="w-1/3 space-y-1">
                     <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">Année HDR</label>
                     <input type="text" value={researcher.nuFields?.hdrYear || ''} onChange={(e) => onUpdateField('hdrYear', e.target.value, 'nuFields')} className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[10px] font-mono" />
                  </div>
                )}
              </div>
           </div>
         </div>

         {/* Section Appartenances */}
         <AffiliationsTable 
            affiliations={affiliations}
            onAdd={onAddAffiliation}
            onRemove={onRemoveAffiliation}
            onChange={onAffiliationChange}
            onNavigateToStructure={onNavigateToStructure}
         />
       </div>

       {/* Section Nantes Université */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 pt-8">
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b-2 border-black/10 dark:border-white/10">
                <Building2 className="w-5 h-5 text-gray-400" />
                <h3 className="text-2xl font-pixel text-gray-900 dark:text-white uppercase tracking-widest leading-none">NANTES UNIVERSITÉ</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-1">
                  <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">Pôle</label>
                  <input type="text" value={researcher.nuFields?.pole || ''} onChange={(e) => onUpdateField('pole', e.target.value, 'nuFields')} className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[10px] font-bold uppercase" />
               </div>
               <div className="space-y-1">
                  <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">Composante</label>
                  <input type="text" value={researcher.nuFields?.composante || ''} onChange={(e) => onUpdateField('composante', e.target.value, 'nuFields')} className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[10px] font-bold uppercase" />
               </div>
               <div className="space-y-1">
                  <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">ED de rattachement</label>
                  <input type="text" value={researcher.nuFields?.doctoralSchool || ''} onChange={(e) => onUpdateField('doctoralSchool', e.target.value, 'nuFields')} className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[10px] font-bold uppercase" />
               </div>
               <div className="space-y-1">
                  <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">Localisation (Site)</label>
                  <input type="text" value={researcher.nuFields?.location || ''} onChange={(e) => onUpdateField('location', e.target.value, 'nuFields')} className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[10px] font-bold uppercase" />
               </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-3 border-b-2 border-black/10 dark:border-white/10">
                <Hash className="w-5 h-5 text-gray-400" />
                <h3 className="text-2xl font-pixel text-gray-900 dark:text-white uppercase tracking-widest leading-none">IDENTIFIANTS CHERCHEURS</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">ORCID</label>
                    {researcher.identifiers.orcid && (
                      <a href={`https://orcid.org/${researcher.identifiers.orcid}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[8px] font-bold text-[#A6CE39] hover:underline">
                        <ExternalLink className="w-3 h-3" /> orcid.org
                      </a>
                    )}
                  </div>
                  <input type="text" value={researcher.identifiers.orcid || ''} onChange={(e) => onUpdateField('orcid', e.target.value, 'identifiers')} className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[10px] font-mono tracking-tighter" />
               </div>
               <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">IdRef</label>
                    {researcher.identifiers.idref && (
                      <a href={`https://www.idref.fr/${researcher.identifiers.idref}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[8px] font-bold text-pixel-blue hover:underline">
                        <ExternalLink className="w-3 h-3" /> idref.fr
                      </a>
                    )}
                  </div>
                  <input type="text" value={researcher.identifiers.idref || ''} onChange={(e) => onUpdateField('idref', e.target.value, 'identifiers')} className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[10px] font-mono tracking-tighter" />
               </div>
               <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">IdHAL</label>
                    {researcher.identifiers.halId && (
                      <a href={`https://hal.science/search/index/q/*/authIdHal_s/${researcher.identifiers.halId}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[8px] font-bold text-gray-500 hover:underline">
                        <ExternalLink className="w-3 h-3" /> hal.science
                      </a>
                    )}
                  </div>
                  <input type="text" value={researcher.identifiers.halId || ''} onChange={(e) => onUpdateField('halId', e.target.value, 'identifiers')} className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[10px] font-mono tracking-tighter" />
               </div>
               <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-[8px] font-bold text-gray-400 uppercase font-mono">Scopus ID</label>
                    {researcher.identifiers.scopusId && (
                      <a href={`https://www.scopus.com/authid/detail.uri?authorId=${researcher.identifiers.scopusId}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[8px] font-bold text-[#FF8200] hover:underline">
                        <ExternalLink className="w-3 h-3" /> scopus.com
                      </a>
                    )}
                  </div>
                  <input type="text" value={researcher.identifiers.scopusId || ''} onChange={(e) => onUpdateField('scopusId', e.target.value, 'identifiers')} className="w-full border-2 border-black dark:border-white p-2 bg-white dark:bg-slate-800 dark:text-white text-[10px] font-mono tracking-tighter" />
               </div>
            </div>
          </div>
       </div>
    </div>
  );
};
