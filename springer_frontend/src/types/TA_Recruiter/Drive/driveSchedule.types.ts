// Drive Schedule Type Definitions
// Maps to backend DTOs in com.kanini.springer.dto.Drive

export interface DriveRequest {
  cycleId: number;
  driveName: string;
  description: string;
  instituteId: number;
  startDate: string; // YYYY-MM-DD format from LocalDate
  endDate: string; // YYYY-MM-DD format from LocalDate
  location: string;
  eligibilityLocked: boolean;
  cutoffLocked: boolean;
  driveStatus: string;
  createdBy: number;
  roundConfigIds: number[];
}

export interface DriveRoundResponse {
  roundId: number;
  roundConfigId: number;
  roundName: string;
  roundNo: number;
}

export interface DriveResponse {
  driveId: number;
  cycleId: number;
  cycleName: string;
  driveName: string;
  description: string;
  driveMode: string; // ON_CAMPUS or OFF_CAMPUS
  instituteId: number;
  instituteName: string;
  startDate: string; // YYYY-MM-DD format
  endDate: string; // YYYY-MM-DD format
  location: string;
  eligibilityLocked: boolean;
  cutoffLocked: boolean;
  status: string;
  createdAt: string; // ISO-8601 format from LocalDateTime
  createdBy: number;
  createdByName: string;
  updatedAt: string; // ISO-8601 format from LocalDateTime
  updatedBy: number;
  updatedByName: string;
  driveRounds: DriveRoundResponse[];
}

export interface DriveUpdateRequest {
  driveName?: string;
  description?: string;
  instituteId?: number;
  startDate?: string;
  endDate?: string;
  location?: string;
  eligibilityLocked?: boolean;
  cutoffLocked?: boolean;
  driveStatus?: string;
  updatedBy?: number;
  roundConfigIds?: number[];
}

// Eligibility Rule structures
export interface EligibilityRuleDTO {
  field: string;
  operator: string; // ">=", "<=", ">", "<", "==", "BETWEEN", "IN"
  value?: number | null;
  min?: number | null;
  max?: number | null;
  allowedValues?: string[];
  message: string;
}

export interface EligibilityRuleUpdateRequest {
  rules: EligibilityRuleDTO[];
  logic: string; // AND or OR
}

export interface EligibilityValidationResult {
  eligible: boolean;
  failedReasons: string[];
}
