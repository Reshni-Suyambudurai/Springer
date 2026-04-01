import { useState, useCallback } from 'react';
import { candidateApi } from '../services/drive.api';
import type { CandidateResponse } from '../types/TA_Recruiter/Drive/candidate.types';
import { showToast } from '../utils/toast';

interface CandidateFilters {
  candidateName?: string;
  instituteName?: string;
  state?: string;
  cities?: string[];
  degrees?: string[];
  departments?: string[];
  eligibility?: string[];
  applicationTypes?: string[];
  applicationStages?: string[];
  skills?: string[];
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

interface UseCandidatesPaginationReturn {
  allCandidates: CandidateResponse[];
  candidatesLoading: boolean;
  loadingMore: boolean;
  hasMorePages: boolean;
  currentPage: number;
  fetchCandidates: (cycleId: number, filters?: CandidateFilters, loadMore?: boolean) => Promise<void>;
  handleScroll: (event: React.UIEvent<HTMLDivElement>, cycleId: number | null, filters?:  CandidateFilters) => void;
  resetPagination: () => void;
}

/**
 * Custom hook for fetching and paginating candidates with infinite scroll
 * Supports filtering by lifecycle status and dynamic filters
 * 
 * @param lifecycleStatus - Filter candidates by lifecycle status ('ACTIVE' or 'CLOSED')
 * @returns Pagination state and handlers
 */
export const useCandidatesPagination = (
  lifecycleStatus: 'ACTIVE' | 'CLOSED' = 'ACTIVE'
): UseCandidatesPaginationReturn => {
  const [allCandidates, setAllCandidates] = useState<CandidateResponse[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [hasMorePages, setHasMorePages] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  /**
   * Fetch candidates for a specific cycle with pagination and filters
   * @param cycleId - The hiring cycle ID
   * @param filters - Optional filter criteria
   * @param loadMore - If true, appends to existing candidates; if false, replaces them
   */
  const fetchCandidates = useCallback(async (
    cycleId: number,
    filters: CandidateFilters = {},
    loadMore: boolean = false
  ) => {
    if (loadMore) {
      setLoadingMore(true);
    } else {
      setCandidatesLoading(true);
      setAllCandidates([]);
      setCurrentPage(0);
      setHasMorePages(true);
    }

    try {
      const pageToFetch = loadMore ? currentPage + 1 : 0;
      
      // Build filter request
      const filterRequest = {
        cycleId,
        lifecycleStatus,
        candidateName: filters.candidateName || undefined,
        instituteName: filters.instituteName || undefined,
        state: filters.state || undefined,
        cities: filters.cities && filters.cities.length > 0 ? filters.cities : undefined,
        degrees: filters.degrees && filters.degrees.length > 0 ? filters.degrees : undefined,
        departments: filters.departments && filters.departments.length > 0 ? filters.departments : undefined,
        eligibility: filters.eligibility && filters.eligibility.length > 0 ? filters.eligibility : undefined,
        applicationTypes: filters.applicationTypes && filters.applicationTypes.length > 0 ? filters.applicationTypes : undefined,
        applicationStages: filters.applicationStages && filters.applicationStages.length > 0 ? filters.applicationStages : undefined,
        skills: filters.skills && filters.skills.length > 0 ? filters.skills : undefined,
        sortBy: filters.sortBy || 'candidateId',
        sortDirection: filters.sortDirection || 'DESC',
        page: pageToFetch,
        size: 20,
      };

      const response = await candidateApi.getCandidatesWithFilters(filterRequest);

      if (response.data) {
        const newCandidates = response.data.content;

        if (loadMore) {
          setAllCandidates(prev => [...prev, ...newCandidates]);
          setCurrentPage(pageToFetch);
        } else {
          setAllCandidates(newCandidates);
          setCurrentPage(0);
        }

        setHasMorePages(!response.data.last);
      }
    } catch (error) {
      const statusLabel = lifecycleStatus.toLowerCase();
      showToast(`Failed to fetch ${statusLabel} candidates`, "error");
      console.error(`Error fetching ${statusLabel} candidates:`, error);
    } finally {
      setCandidatesLoading(false);
      setLoadingMore(false);
    }
  }, [currentPage, lifecycleStatus]);

  /**
   * Handle scroll event for infinite scroll
   * Triggers loading more candidates when scrolled 80% down
   */
  const handleScroll = useCallback((
    event: React.UIEvent<HTMLDivElement>,
    cycleId: number | null,
    filters: CandidateFilters = {}
  ) => {
    const target = event.currentTarget;
    const scrollPercentage = (target.scrollTop + target.clientHeight) / target.scrollHeight;

    // Load more when scrolled 80% down
    if (
      scrollPercentage > 0.8 &&
      hasMorePages &&
      !loadingMore &&
      !candidatesLoading &&
      cycleId !== null
    ) {
      fetchCandidates(cycleId, filters, true);
    }
  }, [hasMorePages, loadingMore, candidatesLoading, fetchCandidates]);

  /**
   * Reset pagination state (useful when switching cycles)
   */
  const resetPagination = useCallback(() => {
    setAllCandidates([]);
    setCurrentPage(0);
    setHasMorePages(true);
    setCandidatesLoading(false);
    setLoadingMore(false);
  }, []);

  return {
    allCandidates,
    candidatesLoading,
    loadingMore,
    hasMorePages,
    currentPage,
    fetchCandidates,
    handleScroll,
    resetPagination,
  };
};
