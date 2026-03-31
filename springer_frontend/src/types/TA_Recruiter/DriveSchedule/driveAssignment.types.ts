// Drive Assignment Type Definitions
// Maps to backend DTOs in com.kanini.springer.dto.Drive

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
  status: string;
  isActive: boolean;
  createdAt: string; // ISO-8601 format from LocalDateTime
  createdBy: number;
  createdByName: string;
}

export interface DriveAssignmentStatusUpdateRequest {
  status: string;
}

export interface BulkDriveAssignmentRequest {
  driveId: number;
  userId: number;
  applicationIds: number[];
  status: string;
  isActive: boolean;
  createdBy: number;
}

export interface BulkDriveAssignmentResponse {
  successfulAssignments: DriveAssignmentResponse[];
  errorMessages: string[];
  totalProcessed: number;
  successCount: number;
  failureCount: number;
}

export interface BulkDeleteAssignmentRequest {
  assignmentIds: number[];
}
