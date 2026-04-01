// Institute Contact (TPO) Type Definitions
// Maps to backend DTOs in com.kanini.springer.dto.Hiring

export interface InstituteContactRequest {
  instituteId: number;
  tpoName: string;
  tpoEmail: string;
  tpoMobile: string;
  tpoStatus: string; // ACTIVE, INACTIVE
  isPrimary: boolean;
}

export interface InstituteContactResponse {
  tpoId: number;
  instituteId: number;
  instituteName: string;
  tpoName: string;
  tpoEmail: string;
  tpoMobile: string;
  tpoStatus: string;
  isPrimary: boolean;
  createdAt: string; // ISO-8601 format from LocalDateTime
}

// Bulk insert error details
export interface BulkInsertError {
  identifier: string; // name or email or ID
  errorMessage: string;
}

// Generic bulk insert response
export interface BulkInsertResponse<T> {
  successfulInserts: T[];
  errorMessages: string[];
  totalProcessed: number;
  successCount: number;
  failureCount: number;
}

