import axios from "axios";

export interface ApiErrorResponse {
  success: boolean;
  message: string;
  data: null;
}

export interface AppError {
  message: string;
  success: boolean;
}

export function handleAxiosError(error: unknown): AppError {

  // CASE 1: Axios error (network/server/HTTP) - CHECK THIS FIRST!
  if (axios.isAxiosError(error)) {
    // Extract error message from response body
    const apiError = error.response?.data as ApiErrorResponse | undefined;
    
    // If backend sent a properly formatted error response, use it
    if (apiError && apiError.message) {
      return {
        message: apiError.message,
        success: false
      };
    }
    
    // Otherwise, use axios error message
    return {
      message: error.message || "Unknown server error",
      success: false
    };
  }

  // CASE 2: Manually thrown AppError
  if (typeof error === "object" && error !== null && "message" in error) {
    const err = error as AppError;
    return {
      message: err.message,
      success: false
    };
  }

  // CASE 3: Unexpected non-Axios error
  return {
    message: "Unexpected error occurred",
    success: false
  };
}