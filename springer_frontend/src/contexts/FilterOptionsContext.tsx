import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { candidateApi } from '../services/drive.api';
import type { FilterOptionsResponse } from '../types/TA_Recruiter/Drive/candidate.types';
import { showToast } from '../utils/toast';

interface FilterOptionsContextType {
  filterOptions: FilterOptionsResponse | null;
  loading: boolean;
  currentCycleId: number | null;
  fetchFilterOptions: (cycleId: number) => Promise<void>;
  clearFilterOptions: () => void;
}

const FilterOptionsContext = createContext<FilterOptionsContextType | undefined>(undefined);

export const FilterOptionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [filterOptions, setFilterOptions] = useState<FilterOptionsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentCycleId, setCurrentCycleId] = useState<number | null>(null);

  /**
   * Fetch filter options for a specific cycle
   * Only fetches if the cycle has changed to avoid unnecessary API calls
   */
  const fetchFilterOptions = async (cycleId: number) => {
    // Skip if already loaded for this cycle
    if (currentCycleId === cycleId && filterOptions !== null) {
      return;
    }

    setLoading(true);
    try {
      const response = await candidateApi.getFilterOptions(cycleId);
      
      if (response.success && response.data) {
        setFilterOptions(response.data);
        setCurrentCycleId(cycleId);
      } else {
        showToast('Failed to fetch filter options', 'error');
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
      showToast('Failed to fetch filter options', 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear filter options (e.g., when user logs out or navigates away)
   */
  const clearFilterOptions = () => {
    setFilterOptions(null);
    setCurrentCycleId(null);
  };

  return (
    <FilterOptionsContext.Provider
      value={{
        filterOptions,
        loading,
        currentCycleId,
        fetchFilterOptions,
        clearFilterOptions,
      }}
    >
      {children}
    </FilterOptionsContext.Provider>
  );
};

/**
 * Custom hook to use filter options context
 * Must be used within FilterOptionsProvider
 */
export const useFilterOptions = (): FilterOptionsContextType => {
  const context = useContext(FilterOptionsContext);
  
  if (context === undefined) {
    throw new Error('useFilterOptions must be used within a FilterOptionsProvider');
  }
  
  return context;
};
