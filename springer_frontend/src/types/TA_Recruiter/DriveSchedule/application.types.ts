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
    driveId?: number;
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
  evaluationStatus: string; // Latest evaluation status (PENDING, PASS, FAIL, ABSENT, HOLD, SKIP)
  latestRoundConfigId: number; // Round config ID of latest evaluation (0 if none)
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

/**
 * Candidate history response for a specific drive+candidate.
 * Maps to backend CandidateHistoryResponse DTO.
 */
export interface CandidateHistoryResponse {
  driveId: number;
  driveName: string;
  driveMode: string;
  driveStatus: string;

  applicationId: number;
  candidateId: number;
  candidateName: string;
  batchTime: string | null;
  registrationCode: string | null;
  applicationStatus: string;
  history: string | null;

  assignments: CandidateHistoryAssignment[];
  evaluations: CandidateHistoryEvaluation[];
  overrides: CandidateHistoryOverride[];
}

export interface CandidateHistoryAssignment {
  assignmentId: number;
  roundConfigId: number;
  roundName: string;
  roundNo: number;
  panelMemberId: number;
  panelMemberName: string;
  status: string;
  isActive: boolean;
  createdAt: string;
}

export interface CandidateHistoryEvaluation {
  scoreId: number;
  roundConfigId: number;
  roundName: string;
  roundNo: number;
  score: number;
  outoffScore: number;
  sectionScore: Record<string, unknown> | null;
  review: string | null;
  evaluationStatus: string;
  reviewedBy: number;
  reviewedByName: string;
  reviewedAt: string;
}

export interface CandidateHistoryOverride {
  overrideId: number;
  entityType: string;
  entityId: number;
  changes: { field: string; old: unknown; newValue: unknown }[];
  overrideReason: string;
  createdById: number;
  createdByName: string;
  createdAt: string;
}

// Finalize Applications Types
export interface FinalizeApplicationsRequest {
  applicationIds: number[];
  isClosed?: boolean;
}

export interface FinalizeApplicationsResponse {
  updatedCount: number;
  details: ApplicationUpdateDetail[];
}

export interface ApplicationUpdateDetail {
  applicationId: number;
  candidateId: number;
  candidateName: string;
  previousStage: string;
  newStage: string;
  applicationStatus: string;
}

// Batch Time Update Types
export interface BatchTimeUpdateRequest {
  driveId: number;
  applicationId: number;
  oldBatchTime: string; // ISO-8601 format (LocalDateTime)
  newBatchTime: string; // ISO-8601 format (LocalDateTime)
  updatedBy: number;
}
