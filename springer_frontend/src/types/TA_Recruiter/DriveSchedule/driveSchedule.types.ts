// Drive Schedule Type Definitions
// Maps to backend DTOs in com.kanini.springer.dto.Drive

// Drive Status enum matching backend
export type DriveStatus = 
  | 'PLANNED' 
  | 'SCHEDULED' 
  | 'ONGOING' 
  | 'COMPLETED' 
  | 'CANCELLED';

// Drive Mode enum matching backend
export type DriveMode = 'ON_CAMPUS' | 'OFF_CAMPUS';

// Location enum for frontend
export const DriveLocation = {
  COIMBATORE: 'COIMBATORE',
  BANGALORE: 'BANGALORE',
  CHENNAI: 'CHENNAI',
  PUNE: 'PUNE'
} as const;

export type DriveLocation = typeof DriveLocation[keyof typeof DriveLocation];

/**
 * Request DTO for creating a new drive schedule
 */
export interface DriveRequest {
  cycleId: number; // required
  driveName: string; // required
  description?: string; // optional
  instituteId?: number; // optional (null for off-campus)
  startDate: string; // YYYY-MM-DD format (LocalDate)
  endDate: string; // YYYY-MM-DD format (LocalDate)
  location: string; // required
  eligibilityLocked?: boolean; // default false if not sent
  driveStatus?: DriveStatus; // default "PLANNED" if not sent
  createdBy: number; // userId, required
  roundConfigIds?: number[]; // optional - array of round_config_id
}

/**
 * Request DTO for updating a drive schedule
 */
export interface DriveUpdateRequest {
  driveName?: string;
  description?: string;
  instituteId?: number;
  startDate?: string; // YYYY-MM-DD format
  endDate?: string; // YYYY-MM-DD format
  location?: string;
  eligibilityLocked?: boolean;
  driveStatus?: DriveStatus;
  updatedBy: number; // userId
  roundConfigIds?: number[]; // can update rounds
}

/**
 * Response DTO for Drive schedule
 */
export interface DriveResponse {
  driveId: number;
  cycleId: number;
  cycleName: string;
  driveName: string;
  description?: string;
  driveMode: DriveMode; // ON_CAMPUS / OFF_CAMPUS
  instituteId?: number;
  instituteName?: string;
  startDate: string; // YYYY-MM-DD format
  endDate: string; // YYYY-MM-DD format
  location: string;
  eligibilityLocked: boolean;
  status: DriveStatus;
  createdAt: string; // ISO-8601 format from LocalDateTime
  createdBy: number;
  createdByName: string;
  updatedAt?: string; // ISO-8601 format from LocalDateTime
  updatedBy?: number;
  updatedByName?: string;
}

/**
 * Summary response for listing drives
 */
export interface DriveSummaryResponse {
  driveId: number;
  cycleId: number;
  cycleName: string;
  driveName: string;
  driveMode: DriveMode;
  instituteName?: string;
  startDate: string;
  endDate: string;
  location: string;
  status: DriveStatus;
  eligibilityLocked: boolean;
}

/**
 * Request DTO for fetching drives by cycle ID
 */
export interface CycleIdRequest {
  cycleId: number;
}

/**
 * Upcoming drive summary response with minimal fields
 */
export interface UpcomingDriveSummaryResponse {
  driveId: number;
  driveName: string;
  driveMode: DriveMode;
}
