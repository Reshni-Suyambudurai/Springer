import { useState, useMemo } from "react";
import type { CandidateResponse } from "../types/TA_Recruiter/Drive/candidate.types";

interface Filters {
  candidateName: string;
  instituteName: string;
  state: string;
  cities: string[];
  degrees: string[];
  departments: string[];
  eligibility: string[];
  applicationTypes: string[];
  applicationStages: string[];
  skills: string[];
  sortBy: string;
  sortDirection: 'ASC' | 'DESC';
}

/**
 * Custom hook for managing candidate filter state.
 * 
 * NOTE: This hook does NOT perform client-side filtering.
 * Filtering is handled by the backend /filter endpoint - the 'filters' object
 * is passed to fetchCandidates() which sends it to the backend.
 * 
 * This hook only manages filter state and extracts unique applicationStages/Types
 * (which are not available in FilterOptionsContext).
 */
export const useCandidateFilters = (allCandidates: CandidateResponse[]) => {
  const [filters, setFilters] = useState<Filters>({
    candidateName: "",
    instituteName: "",
    state: "",
    cities: [],
    degrees: [],
    departments: [],
    eligibility: [],
    applicationTypes: [],
    applicationStages: [],
    skills: [],
    sortBy: "candidateId",
    sortDirection: "DESC",
  });

  // Extract unique application stages and types from backend-filtered results
  // (These are not available in FilterOptionsContext)
  const uniqueApplicationStages = useMemo(
    () => Array.from(new Set(allCandidates.map((cand) => cand.applicationStage).filter(Boolean))).sort(),
    [allCandidates]
  );

  const uniqueApplicationTypes = useMemo(
    () => Array.from(new Set(allCandidates.map((cand) => cand.applicationType).filter(Boolean))).sort(),
    [allCandidates]
  );

  const handleFilterChange = (field: keyof Filters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
      // Clear cities when state changes
      ...(field === "state" ? { cities: [] } : {}),
    }));
  };

  const handleCheckboxToggle = (field: keyof Filters, value: string) => {
    setFilters((prev) => {
      const currentArray = prev[field] as string[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter((item) => item !== value)
        : [...currentArray, value];
      
      return {
        ...prev,
        [field]: newArray,
      };
    });
  };

  const clearFilters = () => {
    setFilters({
      candidateName: "",
      instituteName: "",
      state: "",
      cities: [],
      degrees: [],
      departments: [],
      eligibility: [],
      applicationTypes: [],
      applicationStages: [],
      skills: [],
      sortBy: "candidateId",
      sortDirection: "DESC",
    });
  };

  const hasActiveFilters = Boolean(
    filters.candidateName ||
    filters.instituteName ||
    filters.state ||
    filters.cities.length > 0 ||
    filters.degrees.length > 0 ||
    filters.departments.length > 0 ||
    filters.eligibility.length > 0 ||
    filters.applicationTypes.length > 0 ||
    filters.applicationStages.length > 0 ||
    filters.skills.length > 0
  );

  return {
    filters,
    handleFilterChange,
    handleCheckboxToggle,
    clearFilters,
    setFilters,
    uniqueApplicationStages,
    uniqueApplicationTypes,
    hasActiveFilters,
  };
};
