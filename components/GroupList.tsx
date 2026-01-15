
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
    Array.from(groupConfigs.keys()).forEach(name => allNames.add(name));

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-2xl border dark:border-gray-700">
             <h3 className="text-lg font-bold mb-4 dark:text-white">Nouveau Groupe</h3>
             <input type="text" autoFocus className="w-full border dark:border-gray-600 rounded p-2 mb-6 dark:bg-gray-700 dark:text-white" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Nom du groupe..." />
             <div className="flex justify-end gap-3"><button onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-sm text-gray-500">Annuler</button><button onClick={handleCreateGroup} className="px-4 py-2 bg-primary text-white rounded">Créer</button></div>
          </div>
        </div>
      )}

      <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-8 py-5 flex items-center justify-between sticky top-0 transition-colors">
        <div><h2 className="text-2xl font-bold dark:text-white flex items-center gap-2"><Layers className="text-primary" /> Groupes Fonctionnels</h2><p className="text-sm text-gray-500">Listes transverses et diffusion SYMPA</p></div>
        <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md"><Plus className="w-4 h-4" /> Créer</button>
      </header>

      <div className="p-8 flex-1 overflow-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr><th className="w-10"></th><th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Groupe</th><th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Membres</th><th className="px-6 py-3 text-left text-xs text-gray-500 uppercase">Liste SYMPA</th><th className="w-10"></th></tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700 bg-white dark:bg-gray-800">
                {groups.map((group) => {
                  const isExpanded = expandedGroup === group.name;
                  return (
                    <React.Fragment key={group.name}>
                      <tr className={`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${isExpanded ? 'bg-blue-50/20' : ''}`} onClick={() => setExpandedGroup(isExpanded ? null : group.name)}>
                        <td className="px-6 py-4">{isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</td>
                        <td className="px-6 py-4 font-bold dark:text-white">{group.name}</td>
                        <td className="px-6 py-4"><span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-xs">{groupCounts[group.name] || 0}</span></td>
                        <td className="px-6 py-4"><input type="email" value={group.sympaEmail} onChange={(e) => setGroupConfigs(p => new Map(p).set(group.name, e.target.value))} onClick={e => e.stopPropagation()} className="text-sm border dark:border-gray-600 rounded p-1 w-full max-w-xs dark:bg-gray-700" /></td>
                        <td className="px-6 py-4"><button onClick={e => handleDeleteGroup(group.name, e)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-gray-50 dark:bg-gray-900/50">
                          <td colSpan={5} className="px-12 py-4">
                             <div className="flex items-center justify-between mb-4">
                                <h4 className="text-xs font-bold uppercase text-gray-400">Liste des membres</h4>
                                <button onClick={() => setAddingMemberToGroup(group.name)} className="text-xs text-primary flex items-center gap-1"><UserPlus className="w-3.5 h-3.5" /> Ajouter</button>
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {getGroupMembers(group.name).map(m => (
                                  <div key={m.id} className="bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-700 flex justify-between items-center group/member">
                                    <span className="text-sm truncate dark:text-gray-300">{m.displayName}</span>
                                    <button onClick={() => handleRemoveMember(m.id, group.name)} className="opacity-0 group-hover/member:opacity-100 text-red-400"><X className="w-3 h-3" /></button>
                                  </div>
                                ))}
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
