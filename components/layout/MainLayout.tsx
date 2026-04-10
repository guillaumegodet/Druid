import React from 'react';
import { Menu } from 'lucide-react';

interface MainLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  error?: string;
  onErrorDismiss?: () => void;
}

/**
 * Composant de mise en page principal pour Druid.
 * Gère la structure Sidebar + Content et l'affichage des erreurs globales.
 */
export const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  sidebar, 
  isSidebarOpen, 
  setIsSidebarOpen,
  error,
  onErrorDismiss
}) => {
  return (
    <div className="flex h-screen w-full bg-background dark:bg-slate-900 text-gray-800 dark:text-gray-100 font-sans overflow-hidden transition-colors duration-200">
      {sidebar}

      <div className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
        {/* Mobile Header */}
        <div className="md:hidden bg-white dark:bg-slate-900 border-b-4 border-black dark:border-white p-4 flex items-center justify-between shrink-0 transition-colors">
          <div className="flex items-center gap-3">
             <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="p-2 -ml-2 text-gray-900 dark:text-white border-2 border-black dark:border-white shadow-pixel active:shadow-none transition-all focus:outline-none"
             >
               <Menu className="w-6 h-6" />
             </button>
             <div className="flex items-center gap-2">
               <img src="/druid_icon.png" alt="" className="w-8 h-8 border-2 border-black dark:border-white shadow-pixel-sm" />
               <span className="font-pixel text-xl text-gray-900 dark:text-white tracking-widest uppercase">Druid</span>
             </div>
          </div>
        </div>

        <main className="flex-1 overflow-hidden relative" id="main-content">
          {error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-100 border-2 border-red-600 text-red-700 px-4 py-2 shadow-pixel-sm">
              <span className="text-[10px] font-bold uppercase">{error}</span>
              <button onClick={onErrorDismiss} className="ml-4 font-bold hover:text-red-900">×</button>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
};
