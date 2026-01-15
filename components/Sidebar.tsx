import React from 'react';
import { Users, Building2, Settings, Layers, X, Moon, Sun } from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, isOpen, onClose, isDarkMode, toggleTheme }) => {
  const isResearchers = currentView === ViewState.RESEARCHERS_LIST || currentView === ViewState.RESEARCHER_DETAIL;
  const isStructures = currentView === ViewState.STRUCTURES_LIST || currentView === ViewState.STRUCTURE_DETAIL;
  const isGroups = currentView === ViewState.GROUPS_LIST;

  const handleNavClick = (view: ViewState) => {
    onChangeView(view);
    onClose(); // Fermer le menu sur mobile après un clic
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 md:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-30
        w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen flex flex-col shadow-xl md:shadow-none
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-white font-bold text-xl">D</div>
            <div className="overflow-hidden">
              <h1 className="font-bold text-gray-800 dark:text-white text-lg leading-tight">Druid</h1>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-tight truncate" title="Directory of researchers, units & identifiers">
                Directory of researchers...
              </p>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="px-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 mt-2">Référentiels</p>
          
          <button
            onClick={() => handleNavClick(ViewState.RESEARCHERS_LIST)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors ${
              isResearchers
                ? 'bg-blue-50 dark:bg-blue-900/30 text-primary dark:text-blue-400 border-l-4 border-primary'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-5 h-5" />
            Personnel de recherche
          </button>

          <button
            onClick={() => handleNavClick(ViewState.STRUCTURES_LIST)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors ${
              isStructures
                ? 'bg-blue-50 dark:bg-blue-900/30 text-primary dark:text-blue-400 border-l-4 border-primary'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Building2 className="w-5 h-5" />
            Structures de recherche
          </button>

          <button
            onClick={() => handleNavClick(ViewState.GROUPS_LIST)}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors ${
              isGroups
                ? 'bg-blue-50 dark:bg-blue-900/30 text-primary dark:text-blue-400 border-l-4 border-primary'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-5 h-5" />
            Groupes
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors">
            <Settings className="w-5 h-5" />
            Paramètres
          </button>

          <button 
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            Mode {isDarkMode ? 'Clair' : 'Sombre'}
          </button>
        </div>
      </div>
    </>
  );
};