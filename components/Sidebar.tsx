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
        w-64 bg-white dark:bg-slate-900 border-r-2 border-black dark:border-white h-screen flex flex-col shadow-xl md:shadow-none
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 flex items-center justify-between border-b-2 border-black dark:border-white bg-pixel-blue/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border-2 border-black dark:border-white flex items-center justify-center bg-white overflow-hidden shadow-pixel">
              <img src="/druid_icon.png" alt="Druid Logo" className="w-full h-full object-contain image-pixelated" />
            </div>
            <div className="overflow-hidden">
              <h1 className="font-pixel text-gray-900 dark:text-white text-2xl leading-none tracking-tight">DRUID</h1>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-mono leading-tight truncate uppercase" title="Personnel & Unités de recherche">
                Personnel & Unités de recherche
              </p>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <p className="px-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 mt-2 font-mono">--- RÉFÉRENTIELS ---</p>
          
          <button
            onClick={() => handleNavClick(ViewState.RESEARCHERS_LIST)}
            className={`w-full flex items-center gap-3 px-3 py-3 font-medium transition-all border-2 ${
              isResearchers
                ? 'bg-pixel-pink/20 border-black dark:border-white text-gray-900 dark:text-white shadow-pixel'
                : 'text-gray-600 dark:text-gray-300 border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className={`font-pixel text-xl uppercase tracking-wide ${isResearchers ? "font-bold" : ""}`}>Personnel</span>
          </button>

          <button
            onClick={() => handleNavClick(ViewState.STRUCTURES_LIST)}
            className={`w-full flex items-center gap-3 px-3 py-3 font-medium transition-all border-2 ${
              isStructures
                ? 'bg-pixel-teal/20 border-black dark:border-white text-gray-900 dark:text-white shadow-pixel'
                : 'text-gray-600 dark:text-gray-300 border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <Building2 className="w-5 h-5" />
            <span className={`font-pixel text-xl uppercase tracking-wide ${isStructures ? "font-bold" : ""}`}>Structures</span>
          </button>

          <button
            onClick={() => handleNavClick(ViewState.GROUPS_LIST)}
            className={`w-full flex items-center gap-3 px-3 py-3 font-medium transition-all border-2 ${
              isGroups
                ? 'bg-pixel-yellow/20 border-black dark:border-white text-gray-900 dark:text-white shadow-pixel'
                : 'text-gray-600 dark:text-gray-300 border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <Layers className="w-5 h-5" />
            <span className={`font-pixel text-xl uppercase tracking-wide ${isGroups ? "font-bold" : ""}`}>Groupes</span>
          </button>
        </nav>

        <div className="p-4 border-t-2 border-black dark:border-white space-y-2 bg-slate-50 dark:bg-slate-950/50">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-black dark:hover:border-white">
            <Settings className="w-5 h-5" />
            <span className="font-pixel text-lg uppercase tracking-wider">Réglages</span>
          </button>

          <button 
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-black dark:hover:border-white"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            <span className="font-pixel text-lg uppercase tracking-wider">Mode {isDarkMode ? 'Clair' : 'Sombre'}</span>
          </button>
        </div>
      </div>
    </>
  );
};