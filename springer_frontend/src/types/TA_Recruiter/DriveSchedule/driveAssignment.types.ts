// Drive Assignment Type Definitions
// Maps to backend DTOs in com.kanini.springer.dto.Drive

export const AssignmentStatus = {
  PLANNED: "PLANNED",
  DRAFT: "DRAFT",
  SELECTED: "SELECTED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
  HOLD : "HOLD"
} as const;

export type AssignmentStatus = (typeof AssignmentStatus)[keyof typeof AssignmentStatus];

export interface DriveAssignmentRequest {
  driveId: number;
  userId: number;
  applicationId: number;
  status: string;
  isActive: boolean;
  createdBy: number;
}

export interface DriveAssignmentResponse {
  assignmentId: number;
  driveId: number;
  driveName: string;
  userId: number;
  userName: string;
  applicationId: number;
  candidateId: number;
  candidateName: string;
  roundConfigId: number | null;
  roundName: string | null;
  status: string;
  isActive: boolean;
  createdAt: string; // ISO-8601 format from LocalDateTime
  createdBy: number;
  createdByName: string;
}

export interface DriveAssignmentStatusUpdateRequest {
  status: string;
}

export interface BulkDriveAssignmentEntry {
  applicationId: number;
  userId: number;
  replaceUserId?: number;  // if set, updates existing assignment for this user → new userId
}

export interface BulkDriveAssignmentRequest {
  driveId: number;
  roundConfigId?: number;
  roundNo?: number;
  status: string;
  isActive: boolean;
  createdBy: number;
  entries: BulkDriveAssignmentEntry[];
}

export interface BulkAssignmentSummary {
  applicationId: number;
  candidateName: string;
}

export interface BulkDriveAssignmentResponse {
  successfulAssignments: BulkAssignmentSummary[];
  errorMessages: string[];
  totalProcessed: number;
  successCount: number;
  failureCount: number;
}

export interface BulkDeleteAssignmentRequest {
  assignmentIds: number[];
}

export interface PanelAllocationStatusResponse {
  applicationId: number;
  additionalPanels: { evaluated: boolean; userId: number; panelName: string; evaluationStatus: string; score: number | null }[];
}
