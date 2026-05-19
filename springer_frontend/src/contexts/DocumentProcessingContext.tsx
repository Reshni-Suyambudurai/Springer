import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { hiringCycleApi } from '../services/hiring.api';
import { documentTypeApi, documentSubmissionApi } from '../services/document.api';
import { candidateApi } from '../services/drive.api';
import { showToast } from '../utils/toast';
import type { HiringCycleResponse } from '../types/TA_Recruiter/Hiring/hiringCycle.types';
import type { DocumentTypeResponse, DocumentSubmissionResponse } from '../types/DocumentCollection/document.types';
import type { CandidateListResponse } from '../types/TA_Recruiter/Drive/candidate.types';

interface DocumentProcessingContextType {
  // Data
  cycles: HiringCycleResponse[];
  docTypes: DocumentTypeResponse[];
  submissions: DocumentSubmissionResponse[];
  selectedCandidates: CandidateListResponse[];
  
  // Loading states
  loadingCycles: boolean;
  loadingDocTypes: boolean;
  loadingSubmissions: boolean;
  loadingCandidates: boolean;
  
  // Actions
  fetchCycles: () => Promise<void>;
  fetchDocTypes: () => Promise<void>;
  fetchSubmissions: (cycleId: number) => Promise<void>;
  fetchSelectedCandidates: (cycleId: number) => Promise<void>;
  refreshAll: (cycleId: number) => Promise<void>;
}

const DocumentProcessingContext = createContext<DocumentProcessingContextType | undefined>(undefined);

export const DocumentProcessingProvider = ({ children }: { children: ReactNode }) => {
  const [cycles, setCycles] = useState<HiringCycleResponse[]>([]);
  const [docTypes, setDocTypes] = useState<DocumentTypeResponse[]>([]);
  const [submissions, setSubmissions] = useState<DocumentSubmissionResponse[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<CandidateListResponse[]>([]);
  
  const [loadingCycles, setLoadingCycles] = useState(false);
  const [loadingDocTypes, setLoadingDocTypes] = useState(false);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  const fetchCycles = useCallback(async () => {
    if (loadingCycles || cycles.length > 0) return; // Skip if already loaded
    try {
      setLoadingCycles(true);
      const res = await hiringCycleApi.getAllCycles();
      if (res.success && res.data) setCycles(res.data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load cycles', 'error');
    } finally {
      setLoadingCycles(false);
    }
  }, []);

  const fetchDocTypes = useCallback(async () => {
    if (loadingDocTypes) return;
    try {
      setLoadingDocTypes(true);
      const res = await documentTypeApi.getAllTypes();
      if (res.success && res.data) setDocTypes(res.data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load document types', 'error');
    } finally {
      setLoadingDocTypes(false);
    }
  }, []);

  const fetchSubmissions = useCallback(async (cycleId: number) => {
    if (loadingSubmissions) return;
    try {
      setLoadingSubmissions(true);
      const res = await documentSubmissionApi.getAllSubmissions({ 
        cycleId, 
        applicationStage: 'SELECTED',
        size: 2000 
      });
      if (res.success && res.data) setSubmissions(res.data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load submissions', 'error');
    } finally {
      setLoadingSubmissions(false);
    }
  }, []);

  const fetchSelectedCandidates = useCallback(async (cycleId: number) => {
    if (loadingCandidates) return;
    try {
      setLoadingCandidates(true);
      // Fetch SELECTED candidates for document processing
      const res = await candidateApi.getCandidatesWithFilters({
        cycleId,
        applicationStages: ['SELECTED'],
        page: 0,
        size: 2000,
      });
      if (res.success && res.data) setSelectedCandidates(res.data.content ?? []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load candidates', 'error');
    } finally {
      setLoadingCandidates(false);
    }
  }, []);

  const refreshAll = useCallback(async (cycleId: number) => {
    await Promise.all([
      fetchDocTypes(),
      fetchSubmissions(cycleId),
      fetchSelectedCandidates(cycleId),
    ]);
  }, [fetchDocTypes, fetchSubmissions, fetchSelectedCandidates]);

  return (
    <DocumentProcessingContext.Provider
      value={{
        cycles,
        docTypes,
        submissions,
        selectedCandidates,
        loadingCycles,
        loadingDocTypes,
        loadingSubmissions,
        loadingCandidates,
        fetchCycles,
        fetchDocTypes,
        fetchSubmissions,
        fetchSelectedCandidates,
        refreshAll,
      }}
    >
      {children}
    </DocumentProcessingContext.Provider>
  );
};

export const useDocumentProcessing = () => {
  const context = useContext(DocumentProcessingContext);
  if (!context) {
    throw new Error('useDocumentProcessing must be used within DocumentProcessingProvider');
  }
  return context;
};
