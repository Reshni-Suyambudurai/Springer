import { http } from "./api/https";
import { handleAxiosError } from "./api.error";
import type { ApiResponse } from "../types/api.response";
import type {
  DriveRequest,
  DriveResponse,
  DriveUpdateRequest,
  CycleIdRequest,
  DriveIdRequest,
  DriveAnalyticsResponse,
  UpcomingDriveSummaryResponse,
} from "../types/TA_Recruiter/DriveSchedule/driveSchedule.types";
import type {
  ApplicationRequest,
  ApplicationResponse,
  ApplicationStatusUpdateRequest,
  BulkApplicationResponse,
  BulkApplicationStatusUpdateRequest,
  BulkApplicationStatusUpdateResponse,
} from "../types/TA_Recruiter/DriveSchedule/application.types";
import type {
  DriveAssignmentRequest,
  DriveAssignmentResponse,
  DriveAssignmentStatusUpdateRequest,
  BulkDriveAssignmentRequest,
  BulkDriveAssignmentResponse,
  BulkDeleteAssignmentRequest,
} from "../types/TA_Recruiter/DriveSchedule/driveAssignment.types";
import type {
  CandidateEvaluationRequest,
  CandidateEvaluationResponse,
  CandidateEvaluationSummaryResponse,
  EvaluationStatusUpdateRequest,
  BulkCandidateEvaluationRequest,
  BulkCandidateEvaluationResponse,
} from "../types/TA_Recruiter/DriveSchedule/candidateEvaluation.types";

/**
 * Drive Schedule API Service
 * Handles all HTTP requests for drive schedule management
 * Base URL: /api/drive-schedules
 */
export const driveScheduleApi = {
  /**
   * Create a new drive schedule
   * @param request - Drive creation request with cycle ID, name, dates, location, etc.
   * @returns Created drive schedule with assigned ID
   */
  async createDrive(request: DriveRequest) {
    try {
      const response = await http.post<ApiResponse<DriveResponse>>("/drive-schedules", request);
      return response;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get drive schedule by ID
   * @param driveId - The drive schedule ID
   * @returns Drive schedule details with associated drive rounds
   */
  async getDriveById(driveId: number) {
    try {
      const response = await http.get<ApiResponse<DriveResponse>>(`/drive-schedules/${driveId}`);
      return response;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get all drive schedules
   * @returns List of all drive schedules (without drive rounds for performance)
   */
  async getAllDrives() {
    try {
      const response = await http.get<ApiResponse<DriveResponse[]>>("/drive-schedules");
      return response;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Update drive schedule
   * @param driveId - The drive schedule ID to update
   * @param request - Update request with fields to modify
   * @returns Updated drive schedule
   */
  async updateDrive(driveId: number, request: DriveUpdateRequest) {
    try {
      const response = await http.patch<ApiResponse<DriveResponse>>(
        `/drive-schedules/${driveId}`,
        request
      );
      return response;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get candidate evaluations summary by drive ID
   * @param driveId - The drive schedule ID
   * @returns List of candidates with their round-wise evaluation scores
   */
  async getEvaluationsSummaryByDriveId(driveId: number) {
    try {
      const response = await http.get<ApiResponse<CandidateEvaluationSummaryResponse[]>>(
        `/drive-schedules/${driveId}/evaluations-summary`
      );
      return response;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get upcoming drives (start date >= today) for a specific cycle
   * Returns only driveId, driveName, and driveMode
   * @param request - Request with cycleId
   * @returns List of upcoming drives with minimal details
   */
  async getUpcomingDrivesByCycle(request: CycleIdRequest) {
    try {
      const response = await http.post<ApiResponse<UpcomingDriveSummaryResponse[]>>(
        "/drive-schedules/upcoming",
        request
      );
      return response;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get all drive schedules for a specific cycle
   * Returns complete drive details with rounds for all drives in the cycle
   * @param request - Request with cycleId
   * @returns List of all drive schedules for the cycle with complete details
   */
  async getDrivesByCycleId(request: CycleIdRequest) {
    try {
      const response = await http.post<ApiResponse<DriveResponse[]>>(
        "/drive-schedules/by-cycle",
        request
      );
      return response;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get drive analytics by drive ID
   * Returns full drive schedule + application analytics (total count,
   * distinct batch time count, per-batch-time application counts).
   * @param request - Request with driveId
   * @returns DriveAnalyticsResponse with schedule and application counts
   */
  async getDriveAnalytics(request: DriveIdRequest) {
    try {
      const response = await http.post<ApiResponse<DriveAnalyticsResponse>>(
        "/drive-schedules/analytics",
        request
      );
      return response;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },
};

/**
 * Application API Service
 * Handles all HTTP requests for drive application management
 * Base URL: /api/applications
 */
export const applicationApi = {
  /**
   * Create applications for candidates
   * Creates applications for candidates in a drive. Validates candidates have
   * status=SHORTLISTED and isEligible=true.
   * @param request - Application request with driveId, candidateIds, createdBy
   * @returns Bulk application response with success/failure counts
   */
  async createApplications(request: ApplicationRequest) {
    try {
      const response = await http.post<ApiResponse<BulkApplicationResponse>>(
        "/applications",
        request
      );
      return response;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get all applications
   * @returns List of all applications across all drives
   */
  async getAllApplications() {
    try {
      const response = await http.get<ApiResponse<ApplicationResponse[]>>("/applications");
      return response;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get applications by drive ID
   * @param driveId - The drive schedule ID
   * @returns List of applications for the specified drive
   */
  async getApplicationsByDriveId(driveId: number) {
    try {
      const response = await http.get<ApiResponse<ApplicationResponse[]>>(
        `/applications/drive/${driveId}`
      );
      return response;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Update application status
   * @param applicationId - The application ID to update
   * @param request - Status update request
   * @returns Updated application
   */
  async updateApplicationStatus(
    applicationId: number,
    request: ApplicationStatusUpdateRequest
  ) {
    try {
      const response = await http.patch<ApiResponse<ApplicationResponse>>(
        `/applications/${applicationId}/status`,
        request
      );
      return response;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Bulk update application statuses
   * Updates the status of multiple applications and corresponding candidate statuses.
   * Rules:
   * - If application status = SELECTED → candidate status = SELECTED
   * - If application status = FAILED or DROPPED → candidate status = REJECTED
   * @param request - Bulk status update request
   * @returns Bulk update response with success/failure counts
   */
  async bulkUpdateApplicationStatus(request: BulkApplicationStatusUpdateRequest) {
    try {
      const response = await http.patch<ApiResponse<BulkApplicationStatusUpdateResponse>>(
        "/applications/bulk/status",
        request
      );
      return response;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },
};

/**
 * Drive Assignment API Service
 * Handles all HTTP requests for drive panel assignment management
 * Base URL: /api/drive-assignments
 */
export const driveAssignmentApi = {
  /**
   * Create a drive panel assignment
   * POST /api/drive-assignments
   */
  async createAssignment(data: DriveAssignmentRequest): Promise<ApiResponse<DriveAssignmentResponse>> {
    try {
      const response = await http.post('/drive-assignments', data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Bulk create drive panel assignments
   * POST /api/drive-assignments/bulk
   */
  async bulkCreateAssignments(data: BulkDriveAssignmentRequest): Promise<ApiResponse<BulkDriveAssignmentResponse>> {
    try {
      const response = await http.post('/drive-assignments/bulk', data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get all drive assignments
   * GET /api/drive-assignments
   */
  async getAllAssignments(): Promise<ApiResponse<DriveAssignmentResponse[]>> {
    try {
      const response = await http.get('/drive-assignments');
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get assignment by ID
   * GET /api/drive-assignments/{assignmentId}
   */
  async getAssignmentById(assignmentId: number): Promise<ApiResponse<DriveAssignmentResponse>> {
    try {
      const response = await http.get(`/drive-assignments/${assignmentId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get assignments by drive ID
   * GET /api/drive-assignments/drive/{driveId}
   */
  async getAssignmentsByDriveId(driveId: number): Promise<ApiResponse<DriveAssignmentResponse[]>> {
    try {
      const response = await http.get(`/drive-assignments/drive/${driveId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Update assignment status
   * PATCH /api/drive-assignments/{assignmentId}/status
   */
  async updateAssignmentStatus(assignmentId: number, data: DriveAssignmentStatusUpdateRequest): Promise<ApiResponse<DriveAssignmentResponse>> {
    try {
      const response = await http.patch(`/drive-assignments/${assignmentId}/status`, data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Soft delete assignment (toggle isActive status)
   * DELETE /api/drive-assignments/{assignmentId}
   */
  async deleteAssignment(assignmentId: number): Promise<ApiResponse<DriveAssignmentResponse>> {
    try {
      const response = await http.delete(`/drive-assignments/${assignmentId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Bulk soft delete assignments
   * DELETE /api/drive-assignments/bulk
   */
  async bulkDeleteAssignments(data: BulkDeleteAssignmentRequest): Promise<ApiResponse<BulkDriveAssignmentResponse>> {
    try {
      const response = await http.delete('/drive-assignments/bulk', { data });
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  }
};

/**
 * Candidate Evaluation API Service
 * Handles all HTTP requests for candidate evaluation management
 * Base URL: /api/candidate-evaluations
 */
export const candidateEvaluationApi = {
  /**
   * Create a candidate evaluation
   * POST /api/candidate-evaluations
   */
  async createEvaluation(data: CandidateEvaluationRequest): Promise<ApiResponse<CandidateEvaluationResponse>> {
    try {
      const response = await http.post('/candidate-evaluations', data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Bulk create candidate evaluations
   * POST /api/candidate-evaluations/bulk
   */
  async bulkCreateEvaluations(data: BulkCandidateEvaluationRequest): Promise<ApiResponse<BulkCandidateEvaluationResponse>> {
    try {
      const response = await http.post('/candidate-evaluations/bulk', data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get all candidate evaluations
   * GET /api/candidate-evaluations
   */
  async getAllEvaluations(): Promise<ApiResponse<CandidateEvaluationResponse[]>> {
    try {
      const response = await http.get('/candidate-evaluations');
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get evaluations by application ID
   * GET /api/candidate-evaluations/application/{applicationId}
   */
  async getEvaluationsByApplicationId(applicationId: number): Promise<ApiResponse<CandidateEvaluationResponse[]>> {
    try {
      const response = await http.get(`/candidate-evaluations/application/${applicationId}`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Update evaluation status
   * PATCH /api/candidate-evaluations/{scoreId}/status
   */
  async updateEvaluationStatus(scoreId: number, data: EvaluationStatusUpdateRequest): Promise<ApiResponse<CandidateEvaluationResponse>> {
    try {
      const response = await http.patch(`/candidate-evaluations/${scoreId}/status`, data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  }
};

export default driveScheduleApi;
