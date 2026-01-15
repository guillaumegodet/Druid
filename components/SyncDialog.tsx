import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, X } from 'lucide-react';

interface SyncDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  source: string;
}

export const SyncDialog: React.FC<SyncDialogProps> = ({ isOpen, onClose, title, source }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'processing' | 'completed'>('processing');

  useEffect(() => {
    if (isOpen) {
      setProgress(0);
      setStatus('processing');
      
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setStatus('completed');
            return 100;
          }
          // Random increment to simulate work
          return prev + Math.floor(Math.random() * 15) + 5;
        });
      }, 500);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-primary text-white">
          <h3 className="font-medium text-lg flex items-center gap-2">
            <Loader2 className={`w-5 h-5 ${status === 'processing' ? 'animate-spin' : ''}`} />
            {title}
          </h3>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
            <span>Synchronisation avec {source}</span>
            <span className="font-bold">{Math.min(progress, 100)}%</span>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full transition-all duration-300 ${status === 'completed' ? 'bg-success' : 'bg-primary'}`} 
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>

          <div className="h-16 flex flex-col justify-center items-center text-gray-500 dark:text-gray-400 text-sm">
             {status === 'processing' ? (
               <p>Traitement des données en cours...</p>
             ) : (
               <div className="flex flex-col items-center text-success animate-bounce">
                 <CheckCircle2 className="w-8 h-8 mb-2" />
                 <p className="font-medium">Synchronisation terminée avec succès !</p>
               </div>
             )}
          </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-900 flex justify-end">
          <button 
            onClick={onClose}
            disabled={status !== 'completed'}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              status === 'completed' 
                ? 'bg-primary text-white hover:bg-blue-700' 
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};