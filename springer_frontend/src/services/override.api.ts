import {http} from "./api/https";
import { handleAxiosError } from "./api.error";

// Common type imports
import type { ApiResponse } from "../types/api.response";

// Override-specific type imports
import type { 
  ManualOverrideRequest, 
  ManualOverrideResponse,
  OverrideQueryParams
} from "../types/Common/override.types";

// ==================== MANUAL OVERRIDE AUDIT APIs ====================
export const overrideApi = {
  /**
   * Log a manual override
   * POST /api/overrides
   */
  async logOverride(data: ManualOverrideRequest): Promise<ApiResponse<ManualOverrideResponse>> {
    try {
      const response = await http.post('/overrides', data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get all manual overrides with optional filtering
   * GET /api/overrides
   */
  async getAllOverrides(params?: OverrideQueryParams): Promise<ApiResponse<ManualOverrideResponse[]>> {
    try {
      const response = await http.get('/overrides', { params });
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get overrides by date
   * GET /api/overrides/by-date
   */
  async getOverridesByDate(fromDate: string): Promise<ApiResponse<ManualOverrideResponse[]>> {
    try {
      const response = await http.get('/overrides/by-date', {
        params: { fromDate }
      });
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get overrides by entity type
   * GET /api/overrides/by-entity-type
   */
  async getOverridesByEntityType(entityType: string): Promise<ApiResponse<ManualOverrideResponse[]>> {
    try {
      const response = await http.get('/overrides/by-entity-type', {
        params: { entityType }
      });
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get overrides by entity type and entity ID
   * GET /api/overrides/by-entity
   */
  async getOverridesByEntityTypeAndEntityId(entityType: string, entityId: number): Promise<ApiResponse<ManualOverrideResponse[]>> {
    try {
      const response = await http.get('/overrides/by-entity-id', {
        params: { entityType, entityId }
      });
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get overrides by user
   * GET /api/overrides/by-user
   */
  async getOverridesByUserId(userId: number): Promise<ApiResponse<ManualOverrideResponse[]>> {
    try {
      const response = await http.get('/overrides/by-user', {
        params: { userId }
      });
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  }
};
