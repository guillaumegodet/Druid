
import { useEffect, useCallback } from 'react';

/**
 * Hook pour synchroniser l'état de l'application avec les paramètres d'URL.
 */
export function useUrlState<T extends Record<string, string | null>>(
  initialState: T,
  onUpdate: (newState: T) => void
) {
  // Lire l'état initial depuis l'URL au montage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const newState = { ...initialState };
    
    Object.keys(initialState).forEach((key) => {
      const value = params.get(key);
      if (value !== null) {
        (newState as any)[key] = value;
      }
    });
    
    onUpdate(newState);
  }, []);

  // Fonction pour mettre à jour l'URL sans recharger la page
  const setUrlState = useCallback((updates: Partial<T>) => {
    const params = new URLSearchParams(window.location.search);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '' || value === 'ALL') {
        params.delete(key);
      } else {
        params.set(key, value as string);
      }
    });

    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({ ...window.history.state }, '', newUrl);
  }, []);

  return { setUrlState };
}
