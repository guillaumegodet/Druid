
import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { ResearcherList } from './components/ResearcherList';
import { ResearcherDetail } from './components/ResearcherDetail';
import { StructureList } from './components/StructureList';
import { StructureDetail } from './components/StructureDetail';
import { GroupList } from './components/GroupList';
import { ViewState, Researcher, Structure, ResearcherStatus } from './types';
import { GristService, IdrefDiff, IdrefUpdate } from './lib/gristService';
import { IdrefSyncReview } from './components/researchers/IdrefSyncReview';
import { ValidationImportReview } from './components/researchers/ValidationImportReview';
import { ValidationDiff, ValidationScope, ValidationInfo } from './lib/validation';
import { csvEscape, isoDateOrEmpty } from './lib/csvUtils';
import { useDruidData } from './hooks/useDruidData';
import { useUrlState } from './hooks/useUrlState';
import { MainLayout } from './components/layout/MainLayout';

/**
 * @component App
 * @description Point d'entrée principal de l'application Druid.
 */
function App() {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.RESEARCHERS_LIST);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) return savedTheme === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

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

  // Utilisation du hook de données déporté
  const { 
    researchers, 
    setResearchers, 
    structures, 
    loading, 
    error, 
    setError, 
    setLoading, 
    refreshData 
  } = useDruidData();

  const [selectedResearcher, setSelectedResearcher] = useState<Researcher | null>(null);
  const [selectedStructure, setSelectedStructure] = useState<Structure | null>(null);

  // Alignement IdRef (démo statique : cache d'exemple, pas de backend).
  const [idrefDiff, setIdrefDiff] = useState<IdrefDiff | null>(null);
  const [idrefBusy, setIdrefBusy] = useState(false);

  // Import d'une liste fiabilisée (validation manuelle du statut/rattachement).
  const [validationImportOpen, setValidationImportOpen] = useState(false);

  // Synchronisation avec l'URL
  const { setUrlState } = useUrlState(
    { page: ViewState.RESEARCHERS_LIST, id: null },
    (newState) => {
      if (newState.page) setCurrentView(newState.page as ViewState);
    }
  );

  // Effet pour sélectionner l'entité si un ID est présent dans l'URL (une fois les données chargées)
  useEffect(() => {
    if (loading) return;
    
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const page = params.get('page');

    if (id && page === ViewState.RESEARCHER_DETAIL && researchers.length > 0) {
      const r = researchers.find(res => res.id === id);
      if (r) setSelectedResearcher(r);
    } else if (id && page === ViewState.STRUCTURE_DETAIL && structures.length > 0) {
      const s = structures.find(st => st.id === id);
      if (s) setSelectedStructure(s);
    }
  }, [loading, researchers, structures]);

  const handleResearcherSelect = (researcher: Researcher) => {
    setSelectedResearcher(researcher);
    setCurrentView(ViewState.RESEARCHER_DETAIL);
    setUrlState({ page: ViewState.RESEARCHER_DETAIL, id: researcher.id });
  };

  const handleStructureSelect = (structure: Structure) => {
    setSelectedStructure(structure);
    setCurrentView(ViewState.STRUCTURE_DETAIL);
    setUrlState({ page: ViewState.STRUCTURE_DETAIL, id: structure.id });
  };

  const setViewAndUrl = (view: ViewState) => {
    setCurrentView(view);
    setUrlState({ page: view, id: null });
  };

  const handleNewResearcher = () => {
    const newResearcher: Researcher = {
      id: `NEW-${Date.now()}`,
      uid: '',
      lastName: '',
      firstName: '',
      displayName: 'Nouveau personnel',
      email: '',
      nationality: '',
      birthDate: '',
      status: ResearcherStatus.EXTERNE,
      employment: {
        employer: '',
        contractType: '',
        grade: '',
        internalTypology: '',
        startDate: '',
        endDate: '',
      },
      affiliations: [
        {
          structureName: '',
          team: '',
          startDate: '',
          isPrimary: true
        }
      ],
      groups: [],
      identifiers: {},
      extra: {},
      lastSync: new Date().toISOString().split('T')[0],
      civility: ''
    };
    setSelectedResearcher(newResearcher);
    setCurrentView(ViewState.RESEARCHER_DETAIL);
  };

  // Alignement IdRef : sur la démo Pages, computeIdrefDiff lit le cache statique pré-calculé
  // (public/idref_align_cache.json) et le compare aux chercheurs déjà chargés. Aucun appel réseau
  // vers idref.fr (bloqué par CORS), aucun backend.
  const handleAlignIdref = async (mode: 'search' | 'verify') => {
    try {
      setError('');
      setIdrefBusy(true);
      const diff = await GristService.computeIdrefDiff(mode, researchers);
      setIdrefDiff(diff);
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'alignement IdRef");
    } finally {
      setIdrefBusy(false);
    }
  };

  // Démo : « Appliquer » met à jour la liste en mémoire (la table Grist de démo est en lecture
  // seule). Mappe les libellés IdRef/ORCID/IdHAL vers le modèle ; IdRef='' = détachement.
  const handleApplyIdref = (updates: IdrefUpdate[]) => {
    const byId = new Map(updates.map((u) => [u.id, u.fields]));
    setResearchers((prev) =>
      prev.map((r) => {
        const fields = byId.get(r.id);
        if (!fields) return r;
        const identifiers = { ...r.identifiers };
        if ('IdRef' in fields) identifiers.idref = fields.IdRef;
        if ('ORCID' in fields) identifiers.orcid = fields.ORCID;
        if ('IdHAL' in fields) identifiers.halId = fields.IdHAL;
        return { ...r, identifiers };
      })
    );
    setIdrefDiff(null);
    window.alert(`Démo : ${updates.length} fiche(s) mise(s) à jour localement (non persisté dans Grist).`);
  };

  // Démo : la table Grist est en lecture seule → on applique les validations en
  // mémoire (comme l'alignement IdRef). En prod (Druid Nantes), l'équivalent
  // persiste les colonnes de validation via GristService.updateResearcher.
  const handleApplyValidation = (
    diff: ValidationDiff,
    opts: { source: string; date: string; scope: ValidationScope[] },
  ) => {
    const byId = new Map(diff.matched.map((m) => [m.researcherId, m]));
    setResearchers((prev) =>
      prev.map((r) => {
        const m = byId.get(r.id);
        if (!m) return r;
        const coversStatus = opts.scope.includes('statut');
        const validation: ValidationInfo = {
          validated: true,
          validatedStatus: coversStatus ? m.newStatus : r.validation?.validatedStatus,
          validationDate: opts.date,
          validationSource: opts.source,
          validationScope: opts.scope,
        };
        return { ...r, validation, status: coversStatus ? m.newStatus : r.status };
      }),
    );
    setValidationImportOpen(false);
    window.alert(`Démo : ${diff.matched.length} fiche(s) validée(s) localement (non persisté dans Grist).`);
  };

  const handleSyncToSovisu = () => {
    try {
      const CSV_HEADERS = [
        'first_names', 'last_name', 'main_research_structure', 'tracking_id', 'local',
        'eppn', 'idhals', 'idhali', 'orcid', 'idref', 'scopus',
        'institution_identifier', 'institution_id_nomenclature', 'position',
        'employment_start_date', 'employment_end_date', 'hdr',
      ];

      const structureByAcronym: Record<string, typeof structures[0]> = {};
      for (const s of structures) {
        if (s.acronym) structureByAcronym[s.acronym.toUpperCase().trim()] = s;
      }

      const rows = [CSV_HEADERS.join(',')];
      for (const r of researchers) {
        if (!r.uid) continue;
        const labName = r.affiliations?.[0]?.structureName || '';
        const struct = structureByAcronym[labName.toUpperCase().trim()];
        const trackingId = struct?.trackingId || '';
        const uai = r.employment?.institutionId || '';
        rows.push([
          r.firstName, r.lastName, trackingId, r.uid, r.uid,
          r.eppn || '', r.identifiers?.halId || '', '',
          r.identifiers?.orcid || '', r.identifiers?.idref || '',
          r.identifiers?.scopusId || '', uai, uai ? 'UAI' : '',
          r.employment?.grade || '',
          isoDateOrEmpty(r.employment?.startDate), isoDateOrEmpty(r.employment?.endDate),
          r.extra?.hdr ? 'OUI' : '',
        ].map(csvEscape).join(','));
      }

      const blob = new Blob([rows.join('\n') + '\n'], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'people.csv';
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'export people.csv');
    }
  };

  const handleSaveResearcher = async (updatedResearcher: Researcher) => {
    try {
      setLoading(true);
      if (updatedResearcher.id.startsWith('NEW-')) {
        await GristService.createResearcher(updatedResearcher);
      } else {
        await GristService.updateResearcher(updatedResearcher);
      }
      await refreshData(); // Rafraîchir pour voir le nouveau record
      setCurrentView(ViewState.RESEARCHERS_LIST);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStructure = async (updatedStructure: Structure) => {
    try {
      setLoading(true);
      await GristService.updateStructure(updatedStructure);
      await refreshData(); // Refresh data
      setCurrentView(ViewState.STRUCTURES_LIST);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'enregistrement de la structure');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case ViewState.RESEARCHERS_LIST:
        return (
          <ResearcherList 
            researchers={researchers}
            setResearchers={setResearchers}
            onSelectResearcher={handleResearcherSelect}
            onNewResearcher={handleNewResearcher}
            loading={loading}
            onManualSync={() => refreshData()}
            onSyncToSovisu={handleSyncToSovisu}
            onAlignIdref={handleAlignIdref}
            idrefBusy={idrefBusy}
            onImportValidation={() => setValidationImportOpen(true)}
          />
        );
      case ViewState.RESEARCHER_DETAIL:
        if (!selectedResearcher) return null;
        return (
          <ResearcherDetail
            researcher={selectedResearcher}
            allStructures={structures}
            onBack={() => setViewAndUrl(ViewState.RESEARCHERS_LIST)}
            onSave={handleSaveResearcher}
            isSaving={loading}
            onNavigateToStructure={(id) => {
              const st = structures.find(s => s.id === id);
              if (st) {
                handleStructureSelect(st);
              }
            }}
          />
        );
      case ViewState.STRUCTURES_LIST:
        return <StructureList structures={structures} onSelectStructure={handleStructureSelect} />;
      case ViewState.STRUCTURE_DETAIL:
        if (!selectedStructure) return null;
        return (
          <StructureDetail
            structure={selectedStructure}
            allStructures={structures}
            onBack={() => setViewAndUrl(ViewState.STRUCTURES_LIST)}
            onSave={handleSaveStructure}
            isSaving={loading}
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
    <MainLayout
      isSidebarOpen={isSidebarOpen}
      setIsSidebarOpen={setIsSidebarOpen}
      error={error}
      onErrorDismiss={() => setError('')}
      sidebar={
        <Sidebar 
          currentView={currentView} 
          onChangeView={setViewAndUrl} 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isDarkMode={darkMode}
          toggleTheme={toggleTheme}
        />
      }
    >
      {renderContent()}
      {idrefDiff && (
        <IdrefSyncReview
          diff={idrefDiff}
          applying={false}
          onApply={handleApplyIdref}
          onClose={() => setIdrefDiff(null)}
        />
      )}
      {validationImportOpen && (
        <ValidationImportReview
          researchers={researchers}
          onApply={handleApplyValidation}
          onClose={() => setValidationImportOpen(false)}
        />
      )}
    </MainLayout>
  );
}

export default App;
