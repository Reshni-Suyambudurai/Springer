import {http} from "./api/https";
import { handleAxiosError } from "./api.error";

// Common type imports
import type { ApiResponse, Page } from "../types/api.response";

// Drive-specific type imports
import type { 
  RoundTemplateRequest, 
  RoundTemplateResponse, 
  RoundTemplateUpdateRequest 
} from "../types/TA_Recruiter/Drive/roundTemplate.types";
import type { 
  EligibilityRuleUpdateRequest
} from "../types/TA_Recruiter/Drive/eligibility.types";
import type { 
  CandidateRequest, 
  CandidateResponse,
  CandidateUpdateRequest,
  CandidateStatusUpdateRequest,
  BulkCandidateStatusUpdateRequest,
  BulkCandidateStatusUpdateResponse,
  BulkCandidateCreateResponse,
  CandidateValidationRequest,
  CandidateValidationResponse,
  FilterOptionsResponse
} from "../types/TA_Recruiter/Drive/candidate.types";

// ==================== ROUND TEMPLATE APIs ====================
export const roundTemplateApi = {
  /**
   * Create a new round template
   * POST /api/round-templates
   */
  async createRoundTemplate(data: RoundTemplateRequest): Promise<ApiResponse<RoundTemplateResponse>> {
    try {
      const response = await http.post('/round-templates', data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get round template by ID
   * GET /api/round-templates/{roundConfigId}
   */
  async getRoundTemplateById(roundConfigId: number): Promise<ApiResponse<RoundTemplateResponse>> {
    try {
      const response = await http.get(`/round-templates/${roundConfigId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get all round templates
   * GET /api/round-templates
   */
  async getAllRoundTemplates(): Promise<ApiResponse<RoundTemplateResponse[]>> {
    try {
      const response = await http.get('/round-templates');
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Update round template
   * PATCH /api/round-templates/{roundConfigId}
   */
  async updateRoundTemplate(roundConfigId: number, data: RoundTemplateUpdateRequest): Promise<ApiResponse<RoundTemplateResponse>> {
    try {
      const response = await http.patch(`/round-templates/${roundConfigId}`, data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Soft delete round template (toggle isActive status)
   * DELETE /api/round-templates/{roundConfigId}
   */
  async deleteRoundTemplate(roundConfigId: number): Promise<ApiResponse<RoundTemplateResponse>> {
    try {
      const response = await http.delete(`/round-templates/${roundConfigId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  }
};

// ==================== CANDIDATE APIs ====================
export const candidateApi = {
  /**
   * Create a new candidate
   * POST /api/candidates
   */
  async createCandidate(data: CandidateRequest): Promise<ApiResponse<CandidateResponse>> {
    try {
      const response = await http.post('/candidates', data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Bulk create candidates
   * POST /api/candidates/bulk
   */
  async bulkCreateCandidates(data: CandidateRequest[]): Promise<ApiResponse<BulkCandidateCreateResponse>> {
    try {
      const response = await http.post('/candidates/bulk', data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Bulk validate candidates before creation
   * POST /api/candidates/validate/bulk
   */
  async bulkValidateCandidates(data: CandidateValidationRequest[]): Promise<ApiResponse<CandidateValidationResponse[]>> {
    try {
      const response = await http.post('/candidates/validate/bulk', data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get all candidates
   * GET /api/candidates
   */
  async getAllCandidates(): Promise<ApiResponse<CandidateResponse[]>> {
    try {
      const response = await http.get('/candidates');
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get active candidates with pagination (for infinite scroll)
   * GET /api/candidates/active/paginated
   */
  async getActiveCandidatesPaginated(
    cycleId: number,
    page: number = 0,
    size: number = 20,
    sortBy: string = 'candidateId',
    sortDirection: 'ASC' | 'DESC' = 'DESC'
  ): Promise<ApiResponse<Page<CandidateResponse>>> {
    try {
      const response = await http.get('/candidates/active/paginated', {
        params: { cycleId, page, size, sortBy, sortDirection }
      });
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get candidates with dynamic filtering and pagination
   * POST /api/candidates/filter
   */
  async getCandidatesWithFilters(filterRequest: {
    cycleId: number;
    lifecycleStatus?: string;
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
    page?: number;
    size?: number;
  }): Promise<ApiResponse<Page<CandidateResponse>>> {
    try {
      const response = await http.post('/candidates/filter', filterRequest);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get candidate by ID
   * GET /api/candidates/{id}
   */
  async getCandidateById(candidateId: number): Promise<ApiResponse<CandidateResponse>> {
    try {
      const response = await http.get(`/candidates/${candidateId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get candidates by institute ID
   * GET /api/candidates/by-institute/{instituteId}
   */
  async getCandidatesByInstituteId(instituteId: number): Promise<ApiResponse<CandidateResponse[]>> {
    try {
      const response = await http.get(`/candidates/by-institute/${instituteId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get candidates by cycle ID
   * GET /api/candidates/cycle/{cycleId}
   */
  async getCandidatesByCycleId(cycleId: number): Promise<ApiResponse<CandidateResponse[]>> {
    try {
      const response = await http.get(`/candidates/cycle/${cycleId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Update candidate eligibility status
   * PATCH /api/candidates/{id}
   */
  async updateCandidate(candidateId: number, data: CandidateUpdateRequest): Promise<ApiResponse<CandidateResponse>> {
    try {
      const response = await http.patch(`/candidates/${candidateId}`, data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Update candidate status
   * PATCH /api/candidates/{id}/status
   */
  async updateCandidateStatus(candidateId: number, data: CandidateStatusUpdateRequest): Promise<ApiResponse<CandidateResponse>> {
    try {
      const response = await http.patch(`/candidates/${candidateId}/status`, data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Bulk update candidate status
   * PATCH /api/candidates/status/bulk
   */
  async bulkUpdateCandidateStatus(data: BulkCandidateStatusUpdateRequest): Promise<ApiResponse<BulkCandidateStatusUpdateResponse>> {
    try {
      const response = await http.patch('/candidates/status/bulk', data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get eligibility rules
   * GET /api/candidates/eligibility-rules
   */
  async getEligibilityRules(): Promise<ApiResponse<EligibilityRuleUpdateRequest>> {
    try {
      const response = await http.get('/candidates/eligibility-rules');
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Update eligibility rules
   * PATCH /api/candidates/eligibility-rules
   */
  async updateEligibilityRules(data: EligibilityRuleUpdateRequest): Promise<ApiResponse<EligibilityRuleUpdateRequest>> {
    try {
      const response = await http.patch('/candidates/eligibility-rules', data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get distinct filter options for a specific cycle
   * GET /api/candidates/filter-options
   * Returns all unique values for institutes, states, cities, degrees, departments, and skills
   * for candidates with lifecycleStatus = ACTIVE in the specified cycle
   */
  async getFilterOptions(cycleId: number): Promise<ApiResponse<FilterOptionsResponse>> {
    try {
      const response = await http.get('/candidates/filter-options', {
        params: { cycleId }
      });
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  }
};
