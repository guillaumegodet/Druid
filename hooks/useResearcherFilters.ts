import { useState, useMemo, useEffect } from 'react';
import { Researcher } from '../types';
import { useUrlState } from './useUrlState';

export type SortKey = 'displayName' | 'status' | 'employer' | 'structureName' | 'team';

export interface SortConfig {
  key: SortKey;
  direction: 'asc' | 'desc';
}

export interface IdFilters {
  orcid: boolean;
  hal: boolean;
  idref: boolean;
  scopus: boolean;
}

const PAGE_SIZE = 50;

/**
 * Centralise toute la logique de filtrage, tri et pagination de la liste de chercheurs.
 * Synchronise les filtres et le mode d'affichage avec les paramètres URL.
 */
export function useResearcherFilters(researchers: Researcher[]) {
  const [viewMode, setViewMode] = useState<'list' | 'dashboard'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]);
  const [filterEmployers, setFilterEmployers] = useState<string[]>([]);
  const [filterLabs, setFilterLabs] = useState<string[]>([]);
  const [filterGrades, setFilterGrades] = useState<string[]>([]);
  const [filterContractTypes, setFilterContractTypes] = useState<string[]>([]);
  const [filterLocations, setFilterLocations] = useState<string[]>([]);
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [idFilters, setIdFilters] = useState<IdFilters>({ orcid: false, hal: false, idref: false, scopus: false });
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const splitFilter = (v: string) => (v ? v.split(',').filter(Boolean) : []);

  const { setUrlState } = useUrlState(
    { search: '', status: '', employer: '', lab: '', grade: '', contractType: '', location: '', mode: 'list' },
    (newState) => {
      if (newState.search !== undefined) setSearchTerm(newState.search || '');
      if (newState.status !== undefined) setFilterStatuses(splitFilter(newState.status || ''));
      if (newState.employer !== undefined) setFilterEmployers(splitFilter(newState.employer || ''));
      if (newState.lab !== undefined) setFilterLabs(splitFilter(newState.lab || ''));
      if (newState.grade !== undefined) setFilterGrades(splitFilter(newState.grade || ''));
      if (newState.contractType !== undefined) setFilterContractTypes(splitFilter(newState.contractType || ''));
      if (newState.location !== undefined) setFilterLocations(splitFilter(newState.location || ''));
      if (newState.mode !== undefined) setViewMode((newState.mode as 'list' | 'dashboard') || 'list');
    }
  );

  const employers = useMemo(
    () => Array.from(new Set(researchers.map(r => r.employment.employer).filter(Boolean))),
    [researchers]
  );
  const labs = useMemo(
    () => Array.from(new Set(researchers.flatMap(r => r.affiliations.map(a => a.structureName)).filter(Boolean))),
    [researchers]
  );
  const grades = useMemo(
    () => Array.from(new Set(researchers.map(r => r.employment.grade).filter(Boolean))).sort() as string[],
    [researchers]
  );
  const contractTypes = useMemo(
    () => Array.from(new Set(researchers.map(r => r.employment.contractType).filter(Boolean))).sort() as string[],
    [researchers]
  );
  const locations = useMemo(
    () => [...new Set(researchers.map(r => r.extra?.location || '').filter(Boolean))].sort(),
    [researchers]
  );
  const allGroups = useMemo(
    () => Array.from(new Set(researchers.flatMap(r => r.groups))).sort(),
    [researchers]
  );

  const filteredResearchers = useMemo(() => researchers.filter(r => {
    const primaryLab = r.affiliations.find(a => a.isPrimary)?.structureName || '';
    const matchesSearch =
      r.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      primaryLab.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatuses.length === 0 || filterStatuses.includes(r.status);
    const matchesEmployer = filterEmployers.length === 0 || filterEmployers.includes(r.employment.employer);
    const matchesLab = filterLabs.length === 0 || r.affiliations.some(a => filterLabs.includes(a.structureName));
    const matchesGrade = filterGrades.length === 0 || filterGrades.includes(r.employment.grade || '');
    const matchesContractType = filterContractTypes.length === 0 || filterContractTypes.includes(r.employment.contractType || '');
    const matchesLocation = filterLocations.length === 0 || filterLocations.includes(r.extra?.location || '');
    const matchesPeriod =
      (!filterDateStart || !r.employment.endDate || r.employment.endDate >= filterDateStart) &&
      (!filterDateEnd || !r.employment.startDate || r.employment.startDate <= filterDateEnd);
    const matchesIds =
      (!idFilters.orcid || !!r.identifiers.orcid) &&
      (!idFilters.hal || !!r.identifiers.halId) &&
      (!idFilters.idref || !!r.identifiers.idref) &&
      (!idFilters.scopus || !!r.identifiers.scopusId);
    return matchesSearch && matchesStatus && matchesEmployer && matchesLab && matchesGrade &&
      matchesContractType && matchesLocation && matchesPeriod && matchesIds;
  }), [researchers, searchTerm, filterStatuses, filterEmployers, filterLabs, filterGrades, filterContractTypes, filterLocations, filterDateStart, filterDateEnd, idFilters]);

  const sortedResearchers = useMemo(() => {
    if (!sortConfig) return filteredResearchers;
    return [...filteredResearchers].sort((a, b) => {
      let aVal = '';
      let bVal = '';
      switch (sortConfig.key) {
        case 'displayName': aVal = a.displayName; bVal = b.displayName; break;
        case 'status': aVal = a.status; bVal = b.status; break;
        case 'employer': aVal = a.employment.employer; bVal = b.employment.employer; break;
        case 'structureName':
          aVal = a.affiliations.find(aff => aff.isPrimary)?.structureName || '';
          bVal = b.affiliations.find(aff => aff.isPrimary)?.structureName || '';
          break;
        case 'team':
          aVal = a.affiliations.find(aff => aff.isPrimary)?.team || '';
          bVal = b.affiliations.find(aff => aff.isPrimary)?.team || '';
          break;
        default: return 0;
      }
      return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
  }, [filteredResearchers, sortConfig]);

  const paginatedResearchers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedResearchers.slice(start, start + PAGE_SIZE);
  }, [sortedResearchers, currentPage]);

  const totalPages = Math.ceil(sortedResearchers.length / PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatuses, filterEmployers, filterLabs, filterGrades, filterContractTypes, filterLocations, filterDateStart, filterDateEnd]);

  const handleSort = (key: SortKey) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const updateSearch = (val: string) => { setSearchTerm(val); setUrlState({ search: val }); };
  const updateStatuses = (vals: string[]) => { setFilterStatuses(vals); setUrlState({ status: vals.join(',') }); };
  const updateEmployers = (vals: string[]) => { setFilterEmployers(vals); setUrlState({ employer: vals.join(',') }); };
  const updateLabs = (vals: string[]) => { setFilterLabs(vals); setUrlState({ lab: vals.join(',') }); };
  const updateGrades = (vals: string[]) => { setFilterGrades(vals); setUrlState({ grade: vals.join(',') }); };
  const updateContractTypes = (vals: string[]) => { setFilterContractTypes(vals); setUrlState({ contractType: vals.join(',') }); };
  const updateLocations = (vals: string[]) => { setFilterLocations(vals); setUrlState({ location: vals.join(',') }); };
  const updateViewMode = (val: 'list' | 'dashboard') => { setViewMode(val); setUrlState({ mode: val }); };

  return {
    viewMode, updateViewMode,
    searchTerm, updateSearch,
    filterStatuses, updateStatuses,
    filterEmployers, updateEmployers,
    filterLabs, updateLabs,
    filterGrades, updateGrades,
    filterContractTypes, updateContractTypes,
    filterLocations, updateLocations,
    filterDateStart, setFilterDateStart,
    filterDateEnd, setFilterDateEnd,
    idFilters, setIdFilters,
    employers, labs, grades, contractTypes, locations, allGroups,
    sortedResearchers, paginatedResearchers, totalPages,
    sortConfig, handleSort,
    currentPage, setCurrentPage,
  };
}
