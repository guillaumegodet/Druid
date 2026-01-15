import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { ResearcherList } from './components/ResearcherList';
import { ResearcherDetail } from './components/ResearcherDetail';
import { StructureList } from './components/StructureList';
import { StructureDetail } from './components/StructureDetail';
import { GroupList } from './components/GroupList';
import { ViewState, Researcher, Structure } from './types';
import { MOCK_RESEARCHERS } from './constants';

/**
 * @component App
 * @description Point d'entrée principal de l'application Druid.
 * Gère le routage par état (ViewState), la persistance du mode sombre
 * et le partage des données chercheurs/structures.
 */
function App() {
  /** État de la vue actuelle (Routage interne) */
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.RESEARCHERS_LIST);
  
  /** État d'ouverture de la barre latérale sur mobile */
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  /** 
   * Gestion du Mode Sombre.
   * Initialise l'état via localStorage ou les préférences système.
   */
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  /** Synchronisation de la classe 'dark' sur l'élément document racine */
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  /** 
   * État partagé des chercheurs pour permettre l'interaction entre 
   * les différentes listes (ex: ajout de membres aux groupes).
   */
  const [researchers, setResearchers] = useState<Researcher[]>(MOCK_RESEARCHERS);
  
  const [selectedResearcher, setSelectedResearcher] = useState<Researcher | null>(null);
  const [selectedStructure, setSelectedStructure] = useState<Structure | null>(null);

  /** Déclenche le passage vers la vue détaillée d'un chercheur */
  const handleResearcherSelect = (researcher: Researcher) => {
    setSelectedResearcher(researcher);
    setCurrentView(ViewState.RESEARCHER_DETAIL);
  };

  /** Déclenche le passage vers la vue détaillée d'une structure */
  const handleStructureSelect = (structure: Structure) => {
    setSelectedStructure(structure);
    setCurrentView(ViewState.STRUCTURE_DETAIL);
  };

  /**
   * Rendu conditionnel du contenu principal basé sur currentView.
   * @returns {JSX.Element | null} Le composant correspondant à la vue active.
   */
  const renderContent = () => {
    switch (currentView) {
      case ViewState.RESEARCHERS_LIST:
        return (
          <ResearcherList 
            researchers={researchers}
            setResearchers={setResearchers}
            onSelectResearcher={handleResearcherSelect} 
          />
        );
      case ViewState.RESEARCHER_DETAIL:
        if (!selectedResearcher) return null;
        return (
          <ResearcherDetail 
            researcher={selectedResearcher} 
            onBack={() => setCurrentView(ViewState.RESEARCHERS_LIST)} 
          />
        );
      case ViewState.STRUCTURES_LIST:
        return <StructureList onSelectStructure={handleStructureSelect} />;
      case ViewState.STRUCTURE_DETAIL:
        if (!selectedStructure) return null;
        return (
          <StructureDetail 
            structure={selectedStructure} 
            onBack={() => setCurrentView(ViewState.STRUCTURES_LIST)} 
          />
        );
      case ViewState.GROUPS_LIST:
        return (
          <GroupList 
            researchers={researchers} 
            setResearchers={setResearchers}
          />
        );
      default:
        return <div>View not found</div>;
    }
  };

  return (
    <div className={`flex h-screen w-full bg-background dark:bg-slate-900 text-gray-800 dark:text-gray-100 font-sans overflow-hidden transition-colors duration-200`}>
      
      {/* Barre latérale de navigation */}
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isDarkMode={darkMode}
        toggleTheme={toggleTheme}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
        {/* En-tête Mobile uniquement */}
        <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between shrink-0 transition-colors">
          <div className="flex items-center gap-3">
             <button 
               onClick={() => setIsSidebarOpen(true)} 
               className="p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
               aria-label="Ouvrir le menu"
             >
               <Menu className="w-6 h-6" />
             </button>
             <span className="font-bold text-gray-800 dark:text-white">Druid</span>
          </div>
        </div>

        {/* Zone de contenu dynamique */}
        <main className="flex-1 overflow-hidden relative" id="main-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
