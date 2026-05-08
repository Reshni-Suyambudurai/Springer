/**
 * Form Types
 * Types for registration form management
 */

/**
 * Request DTO for creating a new form
 */
export interface FormRequest {
  driveId: number;
  formName: string;
  status?: boolean;
}

/**
 * Request DTO for updating a form
 */
export interface FormUpdateRequest {
  formName?: string;
  status?: boolean;
}

/**
 * Response DTO for form
 */
export interface FormResponse {
  formId: number;
  driveId: number;
  driveName: string;
  formName: string;
  status: boolean;
  createdAt: string; // ISO datetime format
  updatedAt: string; // ISO datetime format
}
