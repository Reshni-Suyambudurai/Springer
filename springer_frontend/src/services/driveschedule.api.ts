import { http } from "./api/https";
import { handleAxiosError } from "./api.error";
import type { ApiResponse } from "../types/api.response";
import type {
  DriveRequest,
  DriveResponse,
  DriveUpdateRequest,
} from "../types/TA_Recruiter/DriveSchedule/driveSchedule.types";

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
      // TODO: Define proper type for CandidateEvaluationSummaryResponse
      const response = await http.get<ApiResponse<unknown>>(
        `/drive-schedules/${driveId}/evaluations-summary`
      );
      return response;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },
};

export default driveScheduleApi;
