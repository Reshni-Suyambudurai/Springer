// Application Type Definitions
// Maps to backend DTOs in com.kanini.springer.dto.Drive

/**
 * Application Status enum matching backend
 */
export type ApplicationStatus =
  | 'ALLOTED'
  | 'IN_DRIVE'
  | 'DROPPED'
  | 'FAILED'
  | 'SELECTED';

export interface ApplicationRequest {
  driveId: number;
  candidateIds: number[];
  batchTime?: string; // ISO-8601 format (LocalDateTime) - scheduled batch time
  createdBy: number;
}

export interface ApplicationResponse {
  applicationId: number;
  driveId: number;
  driveName: string;
  candidateId: number;
  candidateName: string;
  candidateEmail: string;
  batchTime?: string; // ISO-8601 format (LocalDateTime)
  registrationCode: string;
  applicationStatus: ApplicationStatus;
  createdAt: string; // ISO-8601 format from LocalDateTime
  createdBy: number;
  createdByName: string;
}

export interface ApplicationStatusUpdateRequest {
  applicationStatus: ApplicationStatus;
}

export interface BulkApplicationResponse {
  successfulApplications: ApplicationResponse[];
  errorMessages: string[];
  totalProcessed: number;
  successCount: number;
  failureCount: number;
}

// Nested type for bulk application status update
export interface ApplicationStatusData {
  applicationId: number;
  applicationStatus: ApplicationStatus;
}

export interface BulkApplicationStatusUpdateRequest {
  applications: ApplicationStatusData[];
  updatedBy: number;
}

export interface BulkApplicationStatusUpdateResponse {
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  successfulUpdates: ApplicationResponse[];
  errorMessages: string[];
}
