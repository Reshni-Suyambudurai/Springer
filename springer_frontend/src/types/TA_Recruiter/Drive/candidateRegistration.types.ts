/**
 * Candidate Registration Types
 * Types for public candidate self-registration form and TA review system
 */

/**
 * Registration status enum
 */
export type RegistrationStatus = 'PENDING' | 'IMPORTED';

/**
 * Request DTO for candidate self-registration
 */
export interface CandidateRegistrationRequest {
  formId: number;
  instituteId?: number;
  fname: string;
  lname?: string;
  email: string;
  phone: string; // Format: 10-digit Indian mobile (6-9 followed by 9 digits)
  collegeName: string;
  graduationYear: number;
  degree: string;
  department: string;
  cgpa: number; // Range: 0.0-10.0
  historyOfArrears: number; // Min: 0
  skills?: string; // Comma-separated skill IDs
  dob: string; // ISO date format (YYYY-MM-DD)
  aadhaarNo?: string; // 12 digits (optional)
  applicationType?: string; // STANDARD or PREMIUM
}

/**
 * Response DTO for candidate registration
 */
export interface CandidateRegistrationResponse {
  registrationId: number;
  formId: number;
  formName: string;
  driveId: number;
  driveName: string;
  instituteId?: number;
  instituteName?: string;
  fname: string;
  lname?: string;
  email: string;
  phone: string;
  collegeName: string;
  graduationYear: number;
  degree: string;
  department: string;
  cgpa: number;
  historyOfArrears: number;
  skills?: string;
  dob: string; // ISO date format
  aadhaarNo?: string;
  applicationType?: string;
  status: RegistrationStatus;
  submittedAt: string; // ISO datetime format
}

/**
 * Statistics for candidate registrations by drive
 */
export interface CandidateRegistrationStats {
  totalRegistrations: number;
  pendingCount: number;
  importedCount: number;
  uniqueColleges: number;
  collegeNames: string[];
}

/**
 * Request DTO for bulk deleting candidate registrations
 */
export interface BulkDeleteRegistrationRequest {
  registrationIds: number[];
}

/**
 * Request DTO for partially updating a candidate registration.
 * All fields except registrationId are optional — only provided fields are updated.
 */
export interface CandidateRegistrationUpdateRequest {
  registrationId: number;
  collegeName?: string;
  email?: string;
  mobile?: string;
}
