import axios from "axios";

export interface ApiErrorResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface AppError<T = unknown> {
  message: string;
  success: boolean;
  data?: T;
}

/**
 * Centralized error handler for all API calls
 * Transforms various error types into a consistent AppError structure
 * 
 * @param error - The caught error (Axios error, AppError, or unknown)
 * @returns AppError object with message, success: false, and optional data
 * 
 * @example
 * ```typescript
 * try {
 *   const response = await http.post('/skills', data);
 *   return response.data;
 * } catch (error) {
 *   throw handleAxiosError(error);
 * }
 * ```
 */
export function handleAxiosError<T = unknown>(error: unknown): AppError<T> {

  // CASE 1: Axios error (HTTP request failed)
  if (axios.isAxiosError(error)) {
    // Try to extract ApiResponse from response body
    const apiError = error.response?.data as ApiErrorResponse<T> | undefined;

    if (apiError && apiError.message) {
      // Backend returned structured error with message
      return {
        message: apiError.message,
        success: false,
        data: apiError.data
      };
    }

    // Fallback: use axios error message
    return {
      message: error.message || "Network error occurred",
      success: false
    };
  }

  // CASE 2: Already an AppError object (from manual throws)
  if (typeof error === "object" && error !== null && "message" in error) {
    const err = error as AppError<T>;
    return {
      message: err.message,
      success: err.success !== undefined ? err.success : false,
      data: err.data
    };
  }

  // CASE 3: Unexpected error (string, undefined, etc.)
  return {
    message: typeof error === "string" ? error : "Unexpected error occurred",
    success: false
  };
}