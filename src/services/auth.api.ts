import { http } from "./api/https";
import type { LoginRequest, LoginResponse, ApiResponse } from "../types/auth.types";
import { handleAxiosError } from "./api.error";

export const authApi = {
  /**
   * Login user with email and password
   * @param credentials - LoginRequest with email and password
   * @returns Promise with LoginResponse
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await http.post<ApiResponse<LoginResponse>>(
        "/auth/login",
        credentials
      );

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw {
          message: response.data.message || "Login failed",
          success: false,
        };
      }
    } catch (error) {
      throw handleAxiosError(error);
    }
  },
};
