// Candidate Type Definitions
// Maps to backend DTOs in com.kanini.springer.dto.Drive

// Enum types matching backend enums
export type ApplicationType = 'STANDARD' | 'PREMIUM';

export type ApplicationStage = 
  | 'APPLIED' 
  | 'SHORTLISTED' 
  | 'INVITED' 
  | 'SCHEDULED' 
  | 'SELECTED' 
  | 'OFFERED' 
  | 'JOINED' 
  | 'REJECTED' 
  | 'ACCEPTED' 
  | 'DROPPED';

export type LifecycleStatus = 'ACTIVE' | 'CLOSED';

// Degree constants and type (compatible with erasableSyntaxOnly)
export const Degree = {
  BE: 'BE',
  BTech: 'B.Tech',
  ME: 'ME',
  MTech: 'M.Tech',
  MSc: 'MSc',
  BSc: 'BSc',
  MCA: 'MCA',
  BCA: 'BCA',
  MBA: 'MBA',
  BBA: 'BBA'
} as const;

export type Degree = typeof Degree[keyof typeof Degree];

// Department constants and type (compatible with erasableSyntaxOnly)
export const Department = {
  CSE: 'CSE',
  EEE: 'EEE',
  IT: 'IT',
  ECE: 'ECE',
  AIML: 'AIML',
  CIVIL: 'Civil',
  MECH: 'Mech',
  FOOD_TECH: 'Food Tech',
  AGRI: 'Agri',
  AIDS: 'AIDS',
  CS: 'CS',
  IOT: 'IoT',
  CYBER_SECURITY: 'Cyber Security',
  DATA_SCIENCE: 'Data Science'
} as const;

export type Department = typeof Department[keyof typeof Department];

export const ValidationStatus = {
  NEW: 'NEW',
  DUPLICATE: 'DUPLICATE',
  OLD: 'OLD',
  ERROR: 'ERROR'
} as const;

export type ValidationStatusType = typeof ValidationStatus[keyof typeof ValidationStatus];

// Candidate Filters Type
export interface CandidateFilters {
  candidateName: string;
  instituteName: string;
  state: string;
  cities: string[];
  degrees: string[];
  departments: string[];
  eligibility: string[];
  applicationTypes: string[];
  applicationStages: string[];
  skills: string[];
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
}

export interface CandidateRequest {
  instituteId: number;
  cycleId?: number;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  cgpa: number; // BigDecimal mapped to number
  historyOfArrears: number;
  degree: string;
  department: string;
  passoutYear: number;
  dateOfBirth: string; // YYYY-MM-DD format from LocalDate
  aadhaarNumber: string;
  applicationType?: ApplicationType;
  skillIds: number[];
}

export interface CandidateResponse {
  candidateId: number;
  instituteId: number;
  instituteName: string;
  state: string;
  city: string;
  cycleId: number;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  cgpa: number;
  historyOfArrears: number;
  degree: string;
  department: string;
  passoutYear: number;
  dateOfBirth: string; // YYYY-MM-DD format
  aadhaarNumber: string;
  isEligible: boolean;
  reason: string;
  statusHistory: string;
  applicationType: ApplicationType;
  applicationStage: ApplicationStage;
  lifecycleStatus: LifecycleStatus;
  createdAt: string; // ISO-8601 format from LocalDateTime
  updatedAt: string; // ISO-8601 format from LocalDateTime
  skillNames: string[];
}

export interface CandidateUpdateRequest {
  isEligible: boolean;
  reason: string; // Required field for eligibility update audit trail
  updatedBy: number; // User ID who is making the update
}

export interface CandidateStatusUpdateRequest {
  status: string;
  updatedBy: number;
}

export interface BulkCandidateStatusUpdateRequest {
  candidateIds: number[];
  status: string;
  reason: string;
  updatedBy: number;
}

export interface BulkCandidateStatusUpdateResponse {
  successfulCandidateIds: number[];
  errorMessages: string[];
  totalProcessed: number;
  successCount: number;
  failureCount: number;
}

export interface BulkCandidateCreateResponse {
  successfulInserts: CandidateResponse[];
  errorMessages: string[];
  totalProcessed: number;
  successCount: number;
  failureCount: number;
}

export interface CandidateValidationRequest {
  tempId: string; // Temporary identifier from frontend (e.g., "row-1", "row-2")
  instituteId: number;
  cycleId: number;
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  cgpa: number;
  historyOfArrears: number;
  degree: string;
  department: string;
  passoutYear: number;
  dateOfBirth: string; // YYYY-MM-DD format
  aadhaarNumber?: string; // Optional
  applicationType: string;
}

export interface CandidateValidationResponse {
  tempId: string; // Matches request tempId for tracking
  status: ValidationStatusType; // Validation status
  comment: string; // Human-readable validation message
  canProceed: boolean; // Whether candidate can be created
}

/**
 * Filter Options Response
 * Contains distinct values for each filter category for a specific cycle
 * Used to populate filter dropdowns in the frontend
 */
export interface FilterOptionsResponse {
  institutes: string[];
  states: string[];
  stateToCitiesMap: Record<string, string[]>; // Maps state to its cities
  degrees: string[];
  departments: string[];
  skills: string[];
}
