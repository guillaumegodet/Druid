
import React, { useState, useMemo } from 'react';
import { Search, Mail, Save, Layers, Users, ChevronDown, ChevronRight, CheckCircle, AlertCircle, XCircle, Clock, Trash2, Plus, UserPlus, X } from 'lucide-react';
import { MOCK_GROUPS } from '../constants';
import { Group, Researcher, ResearcherStatus } from '../types';

/** Props du composant GroupList */
interface GroupListProps {
  /** Référence à la liste des chercheurs pour gérer les membres */
  researchers: Researcher[];
  /** Fonction pour mettre à jour l'appartenance aux groupes au niveau global */
  setResearchers: React.Dispatch<React.SetStateAction<Researcher[]>>;
}

/**
 * @component GroupList
 * @description Interface de gestion des groupes fonctionnels (ex: Conseil Scientifique).
 * Permet de définir les adresses de listes de diffusion (SYMPA) et de gérer dynamiquement
 * les membres de chaque groupe via une vue dépliable.
 */
export const GroupList: React.FC<GroupListProps> = ({ researchers, setResearchers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  // Gestion des ajouts rapides de membres
  const [addingMemberToGroup, setAddingMemberToGroup] = useState<string | null>(null);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');

  /** État local des configurations SYMPA (Persistance simulée) */
  const [groupConfigs, setGroupConfigs] = useState<Map<string, string>>(() => {
    // Fix: Explicitly type the Map to avoid 'unknown' inference issues when setting values from MOCK_GROUPS.
    const map = new Map<string, string>();
    MOCK_GROUPS.forEach(g => map.set(g.name, g.sympaEmail || ''));
    return map;
  });

  /** Construction dynamique de la liste des groupes (Unions des données et configs) */
  const groups: Group[] = useMemo(() => {
    const allNames = new Set<string>();
    researchers.forEach(r => r.groups.forEach(g => allNames.add(g)));
    groupConfigs.forEach((_, name) => allNames.add(name));

    return Array.from(allNames).map(name => ({
      name,
      sympaEmail: groupConfigs.get(name) || ''
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [researchers, groupConfigs]);

  /** Calcul en temps réel de l'effectif de chaque groupe */
  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    researchers.forEach(r => {
      r.groups.forEach(gName => { counts[gName] = (counts[gName] || 0) + 1; });
    });
    return counts;
  }, [researchers]);

  const handleCreateGroup = () => {
    const name = newGroupName.trim();
    if (name && !groupConfigs.has(name)) {
      setGroupConfigs(prev => new Map(prev).set(name, ''));
      setNewGroupName(''); setIsCreateModalOpen(false);
    }
  };

  /** Supprime un groupe et le retire de tous les profils chercheurs */
  const handleDeleteGroup = (groupName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Supprimer le groupe "${groupName}" ?`)) {
      setResearchers(prev => prev.map(r => ({ ...r, groups: r.groups.filter(g => g !== groupName) })));
      setGroupConfigs(prev => { const nm = new Map(prev); nm.delete(groupName); return nm; });
      if (expandedGroup === groupName) setExpandedGroup(null);
    }
  };

  /** Retire un membre spécifique d'un groupe */
  const handleRemoveMember = (researcherId: string, groupName: string) => {
    setResearchers(prev => prev.map(r => r.id === researcherId ? { ...r, groups: r.groups.filter(g => g !== groupName) } : r));
  };

  /** Ajoute un membre via la recherche rapide */
  const handleAddMember = (researcher: Researcher, groupName: string) => {
    setResearchers(prev => prev.map(r => r.id === researcher.id && !r.groups.includes(groupName) ? { ...r, groups: [...r.groups, groupName] } : r));
    setAddingMemberToGroup(null); setMemberSearchTerm('');
  };

  /** Récupère les membres actuels d'un groupe */
  const getGroupMembers = (groupName: string) => researchers.filter(r => r.groups.includes(groupName));

  /** Filtre les chercheurs éligibles pour l'ajout rapide */
  const getCandidatesForGroup = (groupName: string) => {
    return researchers
      .filter(r => !r.groups.includes(groupName))
      .filter(r => r.displayName.toLowerCase().includes(memberSearchTerm.toLowerCase()))
      .slice(0, 5);
  };

  return (
    <div className="flex flex-col h-full bg-background dark:bg-slate-900 relative">
      {/* Modale de création */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 border-4 border-black dark:border-white p-6 w-full max-w-md shadow-pixel">
             <h3 className="text-xl font-pixel uppercase mb-4 dark:text-white">Nouveau Groupe</h3>
             <input 
               type="text" 
               autoFocus 
               className="w-full border-2 border-black dark:border-white p-2 mb-6 bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-mono uppercase text-xs" 
               value={newGroupName} 
               onChange={(e) => setNewGroupName(e.target.value)} 
               placeholder="NOM DU GROUPE..." 
             />
             <div className="flex justify-end gap-3">
               <button onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-xs font-bold uppercase text-gray-500 hover:text-black dark:hover:text-white transition-colors">Annuler</button>
               <button onClick={handleCreateGroup} className="px-4 py-2 bg-pixel-teal text-white border-2 border-black dark:border-white font-bold uppercase text-xs shadow-pixel hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all">Créer</button>
             </div>
          </div>
        </div>
      )}

      <header className="bg-white dark:bg-slate-900 border-b-4 border-black dark:border-white px-8 py-6 flex flex-col md:flex-row md:items-center justify-between sticky top-0 z-10 transition-colors">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-pixel text-gray-900 dark:text-white tracking-tight">
              GROUPES FONCTIONNELS
            </h2>
            <span className="text-[10px] font-bold border-2 border-black dark:border-white px-2 py-0.5 bg-pixel-yellow/20 text-gray-900 dark:text-pixel-yellow uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
               {groups.length} {groups.length > 1 ? 'GROUPS' : 'GROUP'}
            </span>
          </div>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-mono font-bold uppercase tracking-widest">
            {">"} LISTES TRANSVERSES ET DIFFUSION SYMPA
          </p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)} 
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase text-white bg-pixel-yellow border-2 border-black dark:border-white shadow-pixel hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
        >
          <Plus className="w-4 h-4" /> Nouveau
        </button>
      </header>

      <div className="p-8 flex-1 overflow-auto">
        <div className="bg-white dark:bg-gray-800 border-2 border-black dark:border-white shadow-sm overflow-hidden">
          
          <div className="p-4 border-b-2 border-black dark:border-white bg-gray-50/50 dark:bg-gray-900/50">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input 
                type="text" 
                className="pl-10 pr-3 py-2 border-2 border-black dark:border-white focus:shadow-pixel transition-all w-full bg-white dark:bg-slate-800 text-[10px] font-mono uppercase" 
                placeholder="RECHERCHER GROUPE..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y-2 divide-black dark:divide-white">
              <thead className="bg-slate-100 dark:bg-slate-950 font-pixel">
                <tr>
                  <th className="w-12 border-b-2 border-black dark:border-white"></th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b-2 border-black dark:border-white">Groupe</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b-2 border-black dark:border-white">Membres</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest border-b-2 border-black dark:border-white">Liste SYMPA</th>
                  <th className="w-12 border-b-2 border-black dark:border-white"></th>
                </tr>
              </thead>
              <tbody className="divide-y border-black dark:border-white bg-white dark:bg-slate-900">
                {groups.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase())).map((group) => {
                  const isExpanded = expandedGroup === group.name;
                  return (
                    <React.Fragment key={group.name}>
                      <tr 
                        className={`hover:bg-pixel-yellow/5 dark:hover:bg-pixel-yellow/10 cursor-pointer transition-colors border-b border-black/10 dark:border-white/10 ${isExpanded ? 'bg-pixel-yellow/10 dark:bg-pixel-yellow/20' : ''}`} 
                        onClick={() => setExpandedGroup(isExpanded ? null : group.name)}
                      >
                        <td className="px-6 py-4">{isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 border-2 border-black dark:border-white bg-pixel-yellow/20 flex items-center justify-center text-pixel-yellow-dark dark:text-pixel-yellow font-pixel text-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                              <Layers className="w-4 h-4" />
                            </div>
                            <span className="text-[12px] font-bold text-gray-900 dark:text-white uppercase tracking-tight">{group.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 border-2 border-black dark:border-pixel-yellow bg-pixel-yellow/10 text-slate-900 dark:text-pixel-yellow text-[10px] font-bold uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            {groupCounts[group.name] || 0} MEMBRES
                          </span>
                        </td>
                        <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                            <input 
                              type="email" 
                              value={group.sympaEmail} 
                              onChange={(e) => setGroupConfigs(p => new Map(p).set(group.name, e.target.value))} 
                              className="text-[10px] font-mono border-2 border-black dark:border-white p-1 bg-white dark:bg-slate-800 w-full max-w-xs focus:shadow-pixel transition-all" 
                              placeholder="adresse@sympa.nantes.fr"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={e => handleDeleteGroup(group.name, e)} className="text-gray-400 hover:text-pixel-red transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-50 dark:bg-slate-950/50">
                          <td colSpan={5} className="px-12 py-6 border-b-2 border-black dark:border-white">
                             <div className="flex items-center justify-between mb-4 border-b-2 border-black/10 dark:border-white/10 pb-2">
                                <h4 className="text-[10px] font-pixel uppercase text-gray-500 dark:text-gray-400 tracking-widest">Liste des membres engagés</h4>
                                <button 
                                  onClick={() => setAddingMemberToGroup(group.name)} 
                                  className="text-[10px] font-bold uppercase text-pixel-teal flex items-center gap-1 hover:underline"
                                >
                                  <UserPlus className="w-3.5 h-3.5" /> Ajouter un membre
                                </button>
                             </div>
                             
                             {addingMemberToGroup === group.name && (
                               <div className="mb-4 p-4 border-2 border-dashed border-black dark:border-white bg-white dark:bg-slate-800">
                                 <div className="flex items-center gap-2 mb-2">
                                   <Search className="w-3.5 h-3.5 text-gray-400" />
                                   <input 
                                     autoFocus
                                     type="text" 
                                     className="flex-1 text-[10px] font-mono border-b border-black dark:border-white bg-transparent p-1 uppercase" 
                                     placeholder="RECHERCHER UN NOM..." 
                                     value={memberSearchTerm}
                                     onChange={(e) => setMemberSearchTerm(e.target.value)}
                                   />
                                   <button onClick={() => setAddingMemberToGroup(null)}><X className="w-4 h-4 text-gray-400" /></button>
                                 </div>
                                 <div className="space-y-1">
                                    {getCandidatesForGroup(group.name).map(cand => (
                                      <button 
                                        key={cand.id} 
                                        onClick={() => handleAddMember(cand, group.name)}
                                        className="w-full text-left p-2 text-[10px] font-bold uppercase hover:bg-pixel-teal hover:text-white transition-colors flex items-center justify-between group/cand"
                                      >
                                        <span>{cand.displayName}</span>
                                        <Plus className="w-3 h-3 opacity-0 group-hover/cand:opacity-100" />
                                      </button>
                                    ))}
                                    {memberSearchTerm && getCandidatesForGroup(group.name).length === 0 && (
                                      <p className="text-[9px] text-gray-400 uppercase p-2">Aucun résultat.</p>
                                    )}
                                 </div>
                               </div>
                             )}

                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {getGroupMembers(group.name).map(m => (
                                  <div key={m.id} className="bg-white dark:bg-slate-800 p-3 border-2 border-black dark:border-white flex justify-between items-center group/member shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 bg-pixel-blue/20 text-pixel-blue font-pixel flex items-center justify-center text-xs">
                                        {m.displayName.charAt(0)}
                                      </div>
                                      <span className="text-[10px] font-bold uppercase truncate dark:text-gray-300">{m.displayName}</span>
                                    </div>
                                    <button 
                                      onClick={() => handleRemoveMember(m.id, group.name)} 
                                      className="text-gray-400 hover:text-pixel-red transition-colors"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                                {getGroupMembers(group.name).length === 0 && (
                                  <p className="col-span-3 text-center py-4 text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                                    {"<"} Aucun membre dans ce groupe {">"}
                                  </p>
                                )}
                             </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
