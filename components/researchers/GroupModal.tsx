import React, { useState } from 'react';
import { X } from 'lucide-react';

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (groupName: string) => void;
  selectedCount: number;
  allGroups: string[];
}

export const GroupModal: React.FC<GroupModalProps> = ({ isOpen, onClose, onConfirm, selectedCount, allGroups }) => {
  const [groupInput, setGroupInput] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    const name = groupInput.trim();
    if (name) {
      onConfirm(name);
      setGroupInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
          <h3 className="font-semibold text-gray-800 dark:text-white">Ajouter à un groupe</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nom du groupe</label>
          <input
            type="text"
            value={groupInput}
            onChange={e => setGroupInput(e.target.value)}
            list="existing-groups"
            className="block w-full rounded-md border-gray-300 dark:border-gray-600 p-2 border bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary"
            placeholder="Sélectionnez ou créez..."
            autoFocus
          />
          <datalist id="existing-groups">
            {allGroups.map(g => <option key={g} value={g} />)}
          </datalist>
          <div className="text-sm text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
            {selectedCount} chercheur(s) sélectionné(s)
          </div>
        </div>
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">Annuler</button>
          <button onClick={handleConfirm} disabled={!groupInput.trim()} className="px-4 py-2 text-sm text-white bg-primary rounded-md hover:bg-blue-700 disabled:opacity-50">Valider</button>
        </div>
      </div>
    </div>
  );
};
