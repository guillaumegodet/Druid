import React from 'react';
import { Users, Building2, Settings, Layers, X, Moon, Sun, LogOut } from 'lucide-react';
import { ViewState } from '../types';
import { getUserInfo, logout } from '../lib/auth';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, isOpen, onClose, isDarkMode, toggleTheme }) => {
  const userInfo = getUserInfo() as any;
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
        <div className="p-6 flex items-center justify-between border-b-2 border-black bg-pixel-blue">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border-2 border-white flex items-center justify-center bg-white overflow-hidden shadow-[2px_2px_0px_0px_rgba(255,255,255,0.4)]">
              <img src="/druid_icon.png" alt="Druid Logo" className="w-full h-full object-contain image-pixelated" />
            </div>
            <div className="overflow-hidden">
              <h1 className="font-pixel text-white text-2xl leading-none tracking-tight">DRUID</h1>
              <p className="text-[10px] text-white/70 font-mono leading-tight truncate uppercase" title="Personnel & Unités de recherche">
                Personnel & Unités de recherche
              </p>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden text-white/70 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <p className="px-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 mt-2 font-mono">--- RÉFÉRENTIELS ---</p>
          
          <button
            onClick={() => handleNavClick(ViewState.RESEARCHERS_LIST)}
            className={`w-full flex items-center gap-3 px-3 py-3 font-medium transition-all border-2 ${
              isResearchers
                ? 'bg-pixel-pink border-black dark:border-black text-white shadow-pixel'
                : 'text-gray-600 dark:text-gray-300 border-transparent hover:bg-pixel-pink/10 hover:border-pixel-pink hover:text-pixel-pink dark:hover:text-pixel-pink'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="font-pixel text-xl uppercase tracking-wide">Personnel</span>
          </button>

          <button
            onClick={() => handleNavClick(ViewState.STRUCTURES_LIST)}
            className={`w-full flex items-center gap-3 px-3 py-3 font-medium transition-all border-2 ${
              isStructures
                ? 'bg-pixel-teal border-black dark:border-black text-gray-900 shadow-pixel'
                : 'text-gray-600 dark:text-gray-300 border-transparent hover:bg-pixel-teal/10 hover:border-pixel-teal hover:text-pixel-teal dark:hover:text-pixel-teal'
            }`}
          >
            <Building2 className="w-5 h-5" />
            <span className="font-pixel text-xl uppercase tracking-wide">Structures</span>
          </button>

          <button
            onClick={() => handleNavClick(ViewState.GROUPS_LIST)}
            className={`w-full flex items-center gap-3 px-3 py-3 font-medium transition-all border-2 ${
              isGroups
                ? 'bg-pixel-yellow border-black dark:border-black text-gray-900 shadow-pixel'
                : 'text-gray-600 dark:text-gray-300 border-transparent hover:bg-pixel-yellow/10 hover:border-pixel-yellow hover:text-gray-900 dark:hover:text-pixel-yellow'
            }`}
          >
            <Layers className="w-5 h-5" />
            <span className="font-pixel text-xl uppercase tracking-wide">Groupes</span>
          </button>
        </nav>

        <div className="p-4 border-t-2 border-black dark:border-white space-y-2 bg-slate-50 dark:bg-slate-950/50">
          <div className="px-3 py-2 flex items-center gap-3 mb-2 border-b border-gray-200 dark:border-gray-800">
             <div className="w-8 h-8 rounded-full bg-pixel-blue flex items-center justify-center border border-black dark:border-white text-[10px] font-pixel text-white">
               {userInfo?.name?.substring(0,2).toUpperCase() || '??'}
             </div>
             <div className="overflow-hidden">
                <p className="text-xs font-pixel truncate dark:text-white">{userInfo?.name || 'Inconnu'}</p>
                <p className="text-[8px] font-mono text-gray-500 truncate">{userInfo?.email || ''}</p>
             </div>
          </div>

          <button 
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-black dark:hover:border-white"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            <span className="font-pixel text-lg uppercase tracking-wider">Mode {isDarkMode ? 'Clair' : 'Sombre'}</span>
          </button>

          <button 
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border border-transparent hover:border-red-600"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-pixel text-lg uppercase tracking-wider">Déconnexion</span>
          </button>
        </div>
      </div>
    </>
  );
};