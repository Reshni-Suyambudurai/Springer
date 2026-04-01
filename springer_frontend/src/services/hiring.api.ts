import {http} from "./api/https";
import { handleAxiosError } from "./api.error";

// Common type imports
import type { ApiResponse } from "../types/api.response";

// Hiring-specific type imports
import type { HiringCycleResponse, HiringCycleSummaryResponse } from "../types/TA_Recruiter/Hiring/hiringCycle.types";
import type { HiringDemandRequest, HiringDemandResponse } from "../types/TA_Recruiter/Hiring/hiringDemand.types";
import type { SkillRequest, SkillResponse } from "../types/TA_Recruiter/Hiring/skill.types";
import type { 
  InstituteRequest, 
  InstituteResponse, 
  InstituteWithTPOsResponse,
  PagedInstituteWithTPOsResponse,
  InstituteNameResponse
} from "../types/TA_Recruiter/Hiring/institute.types";
import type { 
  InstituteContactRequest, 
  InstituteContactResponse,
  BulkInsertResponse
} from "../types/TA_Recruiter/Hiring/instituteContact.types";
import type { 
  ProgramResponse,
  InstituteProgramRequest
} from "../types/TA_Recruiter/Hiring/program.types";


// ==================== HIRING CYCLE APIs ====================
export const hiringCycleApi = {
  /**
   * Create a new hiring cycle with optional JD file
   * POST /api/hiring/cycles
   */
  async createCycle(data: {
    cycleYear: number;
    cycleName: string;
    compensationBand?: number;
    budget?: number;
    jd?: File;
  }): Promise<ApiResponse<HiringCycleResponse>> {
    try {
      const formData = new FormData();
      formData.append('cycleYear', data.cycleYear.toString());
      formData.append('cycleName', data.cycleName);
      if (data.compensationBand) formData.append('compensationBand', data.compensationBand.toString());
      if (data.budget) formData.append('budget', data.budget.toString());
      if (data.jd) formData.append('jd', data.jd);

      const response = await http.post('/hiring/cycles', formData);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get hiring cycle by ID
   * GET /api/hiring/cycles/{cycleId}
   */
  async getCycleById(cycleId: number): Promise<ApiResponse<HiringCycleResponse>> {
    try {
      const response = await http.get(`/hiring/cycles/${cycleId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get all hiring cycles or filter by status
   * GET /api/hiring/cycles
   */
  async getAllCycles(status?: string): Promise<ApiResponse<HiringCycleResponse[]>> {
    try {
      const params = status ? { status } : {};
      const response = await http.get('/hiring/cycles', { params });
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get all hiring cycle summaries (cycleId, cycleYear, cycleName only)
   * GET /api/hiring/cycles/summary
   */
  async getAllCycleSummaries(): Promise<ApiResponse<HiringCycleSummaryResponse[]>> {
    try {
      const response = await http.get('/hiring/cycles/summary');
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Update hiring cycle
   * PATCH /api/hiring/cycles/{cycleId}
   */
  async updateCycle(cycleId: number, data: {
    cycleYear?: number;
    cycleName?: string;
    compensationBand?: number;
    budget?: number;
    jd?: File;
  }): Promise<ApiResponse<HiringCycleResponse>> {
    try {
      const formData = new FormData();
      if (data.cycleYear) formData.append('cycleYear', data.cycleYear.toString());
      if (data.cycleName) formData.append('cycleName', data.cycleName);
      if (data.compensationBand) formData.append('compensationBand', data.compensationBand.toString());
      if (data.budget) formData.append('budget', data.budget.toString());
      if (data.jd) formData.append('jd', data.jd);

      const response = await http.patch(`/hiring/cycles/${cycleId}`, formData);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Delete hiring cycle
   * DELETE /api/hiring/cycles/{cycleId}
   */
  async deleteCycle(cycleId: number): Promise<ApiResponse<string>> {
    try {
      const response = await http.delete(`/hiring/cycles/${cycleId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Toggle cycle status (OPEN/CLOSED)
   * PATCH /api/hiring/cycles/{cycleId}/toggle-status
   */
  async toggleCycleStatus(cycleId: number): Promise<ApiResponse<HiringCycleResponse>> {
    try {
      const response = await http.patch(`/hiring/cycles/${cycleId}/toggle-status`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Download JD file for a cycle
   * GET /api/hiring/cycles/{cycleId}/jd
   */
  async downloadJd(cycleId: number): Promise<Blob> {
    try {
      const response = await http.get(`/hiring/cycles/${cycleId}/jd`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  }
};

// ==================== HIRING DEMAND APIs ====================
export const hiringDemandApi = {
  /**
   * Create a new hiring demand
   * POST /api/hiring/demands
   */
  async createDemand(data: HiringDemandRequest, userId: number): Promise<ApiResponse<HiringDemandResponse>> {
    try {
      const response = await http.post(`/hiring/demands?userId=${userId}`, data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get hiring demand by ID
   * GET /api/hiring/demands/{demandId}
   */
  async getDemandById(demandId: number): Promise<ApiResponse<HiringDemandResponse>> {
    try {
      const response = await http.get(`/hiring/demands/${demandId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get all hiring demands with optional filters
   * GET /api/hiring/demands
   */
  async getAllDemands(filters?: { cycleId?: number; status?: string }): Promise<ApiResponse<HiringDemandResponse[]>> {
    try {
      const params: Record<string, string | number> = {};
      if (filters?.cycleId) params.cycleId = filters.cycleId;
      if (filters?.status) params.status = filters.status;
      
      const response = await http.get('/hiring/demands', { params });
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Update hiring demand
   * PATCH /api/hiring/demands/{demandId}
   */
  async updateDemand(demandId: number, data: Partial<HiringDemandRequest>): Promise<ApiResponse<HiringDemandResponse>> {
    try {
      const response = await http.patch(`/hiring/demands/${demandId}`, data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Delete hiring demand
   * DELETE /api/hiring/demands/{demandId}
   */
  async deleteDemand(demandId: number): Promise<ApiResponse<string>> {
    try {
      const response = await http.delete(`/hiring/demands/${demandId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  }
};

// ==================== SKILLS APIs ====================
export const skillsApi = {
  /**
   * Create a new skill
   * POST /api/skills
   */
  async createSkill(data: SkillRequest): Promise<ApiResponse<SkillResponse>> {
    try {
      const response = await http.post('/skills', data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get skill by ID
   * GET /api/skills/{id}
   */
  async getSkillById(id: number): Promise<ApiResponse<SkillResponse>> {
    try {
      const response = await http.get(`/skills/${id}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get all skills
   * GET /api/skills
   */
  async getAllSkills(): Promise<ApiResponse<SkillResponse[]>> {
    try {
      const response = await http.get('/skills');
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get skill by name
   * GET /api/skills/name/{skillName}
   */
  async getSkillByName(skillName: string): Promise<ApiResponse<SkillResponse>> {
    try {
      const response = await http.get(`/skills/name/${skillName}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Update skill
   * PUT /api/skills/{id}
   */
  async updateSkill(id: number, data: SkillRequest): Promise<ApiResponse<SkillResponse>> {
    try {
      const response = await http.put(`/skills/${id}`, data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Delete skill
   * DELETE /api/skills/{id}
   */
  async deleteSkill(id: number): Promise<ApiResponse<string>> {
    try {
      const response = await http.delete(`/skills/${id}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  }
};

// ==================== INSTITUTE APIs ====================
export const instituteApi = {
  /**
   * Create a new institute
   * POST /api/institutes
   */
  async createInstitute(data: InstituteRequest): Promise<ApiResponse<InstituteResponse>> {
    try {
      const response = await http.post('/institutes', data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Bulk create institutes
   * POST /api/institutes/bulk
   */
  async bulkCreateInstitutes(data: InstituteRequest[]): Promise<ApiResponse<BulkInsertResponse<InstituteResponse>>> {
    try {
      const response = await http.post('/institutes/bulk', data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get all institutes
   * GET /api/institutes
   */
  async getAllInstitutes(): Promise<ApiResponse<InstituteResponse[]>> {
    try {
      const response = await http.get('/institutes');
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get institute by ID
   * GET /api/institutes/{id}
   */
  async getInstituteById(id: number): Promise<ApiResponse<InstituteResponse>> {
    try {
      const response = await http.get(`/institutes/${id}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Update institute
   * PATCH /api/institutes/{id}
   */
  async updateInstitute(id: number, data: Partial<InstituteRequest>): Promise<ApiResponse<InstituteResponse>> {
    try {
      const response = await http.patch(`/institutes/${id}`, data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Toggle institute active status
   * DELETE /api/institutes/{id}
   */
  async deleteInstitute(id: number): Promise<ApiResponse<string>> {
    try {
      const response = await http.delete(`/institutes/${id}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get all institutes with TPO details (paginated)
   * GET /api/institutes/with-tpos
   */
  async getAllInstitutesWithTPOs(page: number = 0, size: number = 6): Promise<ApiResponse<PagedInstituteWithTPOsResponse>> {
    try {
      const response = await http.get('/institutes/with-tpos', {
        params: { page, size }
      });
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get institute with TPOs by ID
   * GET /api/institutes/{id}/with-tpos
   */
  async getInstituteWithTPOsById(id: number): Promise<ApiResponse<InstituteWithTPOsResponse>> {
    try {
      const response = await http.get(`/institutes/${id}/with-tpos`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get all institute names (lightweight for dropdowns)
   * GET /api/institutes/names
   */
  async getAllInstituteNames(): Promise<ApiResponse<InstituteNameResponse[]>> {
    try {
      const response = await http.get('/institutes/names');
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  }
};

// ==================== INSTITUTE TPO (Contact) APIs ====================
export const instituteTPOApi = {
  /**
   * Create a new TPO contact
   * POST /api/institutes/contacts
   */
  async createContact(data: InstituteContactRequest): Promise<ApiResponse<InstituteContactResponse>> {
    try {
      const response = await http.post('/institutes/contacts', data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Bulk create TPO contacts for specific institute
   * POST /api/institutes/contacts/institute/{instituteId}/bulk
   */
  async bulkCreateContactsForInstitute(instituteId: number, data: Omit<InstituteContactRequest, 'instituteId'>[]): Promise<ApiResponse<BulkInsertResponse<InstituteContactResponse>>> {
    try {
      const response = await http.post(`/institutes/contacts/institute/${instituteId}/bulk`, data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Bulk create TPO contacts across multiple institutes
   * POST /api/institutes/contacts/bulk
   */
  async bulkCreateAllContacts(data: InstituteContactRequest[]): Promise<ApiResponse<BulkInsertResponse<InstituteContactResponse>>> {
    try {
      const response = await http.post('/institutes/contacts/bulk', data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get all contacts for an institute
   * GET /api/institutes/contacts/institute/{instituteId}
   */
  async getContactsByInstituteId(instituteId: number): Promise<ApiResponse<InstituteContactResponse[]>> {
    try {
      const response = await http.get(`/institutes/contacts/institute/${instituteId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get contact by ID
   * GET /api/institutes/contacts/{tpoId}
   */
  async getContactById(tpoId: number): Promise<ApiResponse<InstituteContactResponse>> {
    try {
      const response = await http.get(`/institutes/contacts/${tpoId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Update TPO contact
   * PATCH /api/institutes/contacts/{tpoId}
   */
  async updateContact(tpoId: number, data: Partial<InstituteContactRequest>): Promise<ApiResponse<InstituteContactResponse>> {
    try {
      const response = await http.patch(`/institutes/contacts/${tpoId}`, data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Toggle TPO contact status
   * DELETE /api/institutes/contacts/{tpoId}
   */
  async deleteContact(tpoId: number): Promise<ApiResponse<string>> {
    try {
      const response = await http.delete(`/institutes/contacts/${tpoId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  }
};

// ==================== PROGRAM MANAGEMENT APIs ====================
export const programApi = {
  /**
   * Get all programs
   * GET /api/programs
   */
  async getAllPrograms(): Promise<ApiResponse<ProgramResponse[]>> {
    try {
      const response = await http.get('/programs');
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Add programs to institute(s)
   * POST /api/programs/institute-mappings
   */
  async addProgramsToInstitute(mappings: InstituteProgramRequest[]): Promise<ApiResponse<void>> {
    try {
      const response = await http.post('/programs/institute-mappings', mappings);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Delete institute-program mapping
   * DELETE /api/programs/institute-mappings/{id}
   */
  async removeInstituteProgramMapping(instituteProgramId: number): Promise<ApiResponse<string>> {
    try {
      const response = await http.delete(`/programs/institute-mappings/${instituteProgramId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  }
};
