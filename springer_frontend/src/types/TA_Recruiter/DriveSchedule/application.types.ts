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
  candidateIds?: number[];
  filterRequest?: {
    cycleId: number;
    lifecycleStatus?: string;
    candidateName?: string;
    instituteName?: string;
    state?: string;
    cities?: string[];
    degrees?: string[];
    departments?: string[];
    eligibility?: string[];
    applicationTypes?: string[];
    applicationStages?: string[];
    skills?: string[];
  };
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
  updatedAt?: string; // ISO-8601 format from LocalDateTime
  updatedBy?: number;
  updatedByName?: string;
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

export interface BulkApplicationStatusUpdateRequest {
  applicationIds: number[];
  applicationStatus: ApplicationStatus;
  updatedBy: number;
}

export interface BulkApplicationStatusUpdateResponse {
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  successfulUpdates: ApplicationResponse[];
  errorMessages: string[];
}

/**
 * Map of batchTime → list of application IDs for that batch.
 * Applications with no batchTime are grouped under 'UNSCHEDULED'.
 */
export type BatchCandidatesMap = Record<string, number[]>;
