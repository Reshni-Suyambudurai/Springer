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
  CandidateDocResponse,
  CandidateListResponse,
  CandidateUpdateRequest,
  CandidateStatusUpdateRequest,
  BulkCandidateStatusUpdateRequest,
  BulkCandidateStatusUpdateResponse,
  BulkCandidateLifecycleUpdateRequest,
  BulkCandidateLifecycleUpdateResponse,
  BulkCandidateCreateResponse,
  CandidateValidationRequest,
  CandidateValidationResponse,
  FilterOptionsResponse
} from "../types/TA_Recruiter/Drive/candidate.types";
import type { DriveDashboardResponse, DriveDetailsAnalysisResponse, CollegeAnalysisResponse } from "../types/TA_Recruiter/Drive/dashboard.types";
import type {
  CandidateRegistrationRequest,
  CandidateRegistrationResponse,
  BulkDeleteRegistrationRequest
} from "../types/TA_Recruiter/Drive/candidateRegistration.types";
import type {
  FormRequest,
  FormResponse,
  FormUpdateRequest
} from "../types/TA_Recruiter/Drive/form.types";

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
    driveId?: number;
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
  }): Promise<ApiResponse<Page<CandidateListResponse>>> {
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

  async getCandidatesByCycleIdAndStage(cycleId: number, stage: string): Promise<ApiResponse<CandidateResponse[]>> {
    try {
      const response = await http.get(`/candidates/cycle/${cycleId}/stage/${stage}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get candidates by cycle ID and application stages (lightweight)
   * GET /api/candidates/cycle/{cycleId}/stages?stages=SELECTED&stages=OFFERED
   */
  async getCandidatesByCycleAndStages(cycleId: number, stages: string[]): Promise<ApiResponse<CandidateDocResponse[]>> {
    try {
      const params = new URLSearchParams();
      stages.forEach(s => params.append('stages', s));
      const response = await http.get(`/candidates/cycle/${cycleId}/stages?${params.toString()}`);
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
   * Bulk update candidate lifecycle status
   * PATCH /api/candidates/lifecycle-status/bulk
   */
  async bulkUpdateCandidateLifecycleStatus(data: BulkCandidateLifecycleUpdateRequest): Promise<ApiResponse<BulkCandidateLifecycleUpdateResponse>> {
    try {
      const response = await http.patch('/candidates/lifecycle-status/bulk', data);
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

// ==================== DRIVE DASHBOARD APIs ====================
export const driveDashboardApi = {
  /**
   * Get drive summary for a cycle
   * POST /api/dashboards/drive/summary
   */
  async getDriveSummary(cycleId: number): Promise<ApiResponse<DriveDashboardResponse>> {
    try {
      const response = await http.post('/dashboards/drive/summary', { cycleId });
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get drive details analysis for a cycle
   * POST /api/dashboards/drive/drive-details-analysis
   */
  async getDriveDetailsAnalysis(cycleId: number): Promise<ApiResponse<DriveDetailsAnalysisResponse>> {
    try {
      const response = await http.post('/dashboards/drive/drive-details-analysis', { cycleId });
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get college analysis for a cycle
   * POST /api/dashboards/drive/college-analysis
   */
  async getCollegeAnalysis(cycleId: number): Promise<ApiResponse<CollegeAnalysisResponse[]>> {
    try {
      const response = await http.post('/dashboards/drive/college-analysis', { cycleId });
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  }
};

// ==================== CANDIDATE REGISTRATION APIs ====================
export const candidateRegistrationApi = {
  /**
   * Submit a new candidate registration (Public endpoint)
   * POST /api/candidate-registrations/drive/{driveId}/register
   */
  async submitRegistration(
    driveId: number,
    data: CandidateRegistrationRequest
  ): Promise<ApiResponse<CandidateRegistrationResponse>> {
    try {
      const response = await http.post(`/candidate-registrations/drive/${driveId}/register`, data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get all registrations for a drive
   * GET /api/candidate-registrations/drive/{driveId}
   */
  async getAllRegistrations(driveId: number): Promise<ApiResponse<CandidateRegistrationResponse[]>> {
    try {
      const response = await http.get(`/candidate-registrations/drive/${driveId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get registrations by form ID
   * GET /api/candidate-registrations/form/{formId}
   */
  async getRegistrationsByFormId(formId: number): Promise<ApiResponse<CandidateRegistrationResponse[]>> {
    try {
      const response = await http.get(`/candidate-registrations/form/${formId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get registration by ID
   * GET /api/candidate-registrations/{registrationId}
   */
  async getRegistrationById(registrationId: number): Promise<ApiResponse<CandidateRegistrationResponse>> {
    try {
      const response = await http.get(`/candidate-registrations/${registrationId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Delete a registration
   * DELETE /api/candidate-registrations/{registrationId}
   */
  async deleteRegistration(registrationId: number): Promise<ApiResponse<void>> {
    try {
      const response = await http.delete(`/candidate-registrations/${registrationId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Bulk delete registrations
   * DELETE /api/candidate-registrations/bulk
   */
  async bulkDeleteRegistrations(request: BulkDeleteRegistrationRequest): Promise<ApiResponse<void>> {
    try {
      const response = await http.delete('/candidate-registrations/bulk', { data: request });
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  }
};

// ==================== FORM APIs ====================
export const formApi = {
  /**
   * Create a new form
   * POST /api/forms
   */
  async createForm(data: FormRequest): Promise<ApiResponse<FormResponse>> {
    try {
      const response = await http.post('/forms', data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get all forms
   * GET /api/forms
   */
  async getAllForms(): Promise<ApiResponse<FormResponse[]>> {
    try {
      const response = await http.get('/forms');
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get forms by drive ID
   * GET /api/forms/drive/{driveId}
   */
  async getFormsByDriveId(driveId: number): Promise<ApiResponse<FormResponse[]>> {
    try {
      const response = await http.get(`/forms/drive/${driveId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get active forms by drive ID
   * GET /api/forms/drive/{driveId}/active
   */
  async getActiveFormsByDriveId(driveId: number): Promise<ApiResponse<FormResponse[]>> {
    try {
      const response = await http.get(`/forms/drive/${driveId}/active`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get form by ID
   * GET /api/forms/{formId}
   */
  async getFormById(formId: number): Promise<ApiResponse<FormResponse>> {
    try {
      const response = await http.get(`/forms/${formId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Update form
   * PATCH /api/forms/{formId}
   */
  async updateForm(formId: number, data: FormUpdateRequest): Promise<ApiResponse<FormResponse>> {
    try {
      const response = await http.patch(`/forms/${formId}`, data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Delete form
   * DELETE /api/forms/{formId}
   */
  async deleteForm(formId: number): Promise<ApiResponse<void>> {
    try {
      const response = await http.delete(`/forms/${formId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  }
};
