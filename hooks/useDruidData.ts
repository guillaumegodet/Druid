import { useState, useEffect, useCallback } from 'react';
import { Researcher, Structure } from '../types';
import { GristService } from '../lib/gristService';
import { MOCK_RESEARCHERS } from '../constants';

/**
 * Hook personnalisé pour gérer les données globales de Druid (Chercheurs et Structures).
 * Gère le chargement, les erreurs et la mise en relation (linking).
 */
export function useDruidData() {
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [structures, setStructures] = useState<Structure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  /** Récupération et synchronisation des données depuis Grist */
  const fetchData = useCallback(async (force = false) => {
    try {
      setLoading(true);
      setError('');
      
      const [resData, structData] = await Promise.all([
        GristService.fetchResearchers(force).catch(err => {
          console.error('Failed to sync researchers:', err);
          return MOCK_RESEARCHERS;
        }),
        GristService.fetchStructures(force).catch((err: any) => {
          console.error('Failed to sync structures:', err);
          return [];
        })
      ]);

      // Cohérence Maximale : Relier les affiliations des chercheurs aux structures via l'ID
      const linkedResearchers = resData.map(r => {
        const linkedAffiliations = r.affiliations.map(aff => {
          if (!aff.structureName) return aff;
          const structureNameUpper = Array.isArray(aff.structureName) 
            ? aff.structureName[0].toUpperCase().trim() 
            : String(aff.structureName).toUpperCase().trim();
          
          const matchedStruct = structData.find(s => 
            s.acronym.toUpperCase().trim() === structureNameUpper || 
            s.officialName.toUpperCase().trim() === structureNameUpper
          );
          
          if (matchedStruct) {
            return { 
              ...aff, 
              structureId: matchedStruct.id,
              structureName: matchedStruct.acronym || structureNameUpper
            };
          }
          return aff;
        });
        return { ...r, affiliations: linkedAffiliations };
      });

      setResearchers(linkedResearchers);
      setStructures(structData);
    } catch (err) {
      console.error('Failed to sync with Grist:', err);
      setError('Impossible de se synchroniser avec Grist.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Chargement initial
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    researchers,
    setResearchers,
    structures,
    setStructures,
    loading,
    error,
    setError,
    setLoading,
    refreshData: () => fetchData(true)
  };
}
