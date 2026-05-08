import { http } from "./api/https";
import { handleAxiosError } from "./api.error";

import type { ApiResponse } from "../types/api.response";
import type { CreateUserRequest, UserResponse } from "../types/Common/admin.types";

export const adminApi = {
  /**
   * Create a new user
   * POST /api/admin/users
   */
  async createUser(data: CreateUserRequest): Promise<ApiResponse<UserResponse>> {
    try {
      const response = await http.post('/admin/users', data);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Get all users except those with INTERN role
   * GET /api/admin/users
   */
  async getAllUsersExceptInternRole(): Promise<ApiResponse<UserResponse[]>> {
    try {
      const response = await http.get('/admin/users');
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },

  /**
   * Toggle active/inactive status of a user by ID
   * PATCH /api/admin/users/{id}/toggle-status
   */
  async toggleStatusUsingId(userId: number): Promise<ApiResponse<UserResponse>> {
    try {
      const response = await http.patch(`/admin/users/${userId}/toggle-status`);
      return response.data;
    } catch (error) {
      throw handleAxiosError(error);
    }
  },
};
