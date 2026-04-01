// Hiring Cycle Type Definitions
// Maps to backend DTOs in com.kanini.springer.dto.Hiring

export interface HiringCycleRequest {
  cycleYear: number;
  cycleName: string;
  compensationBand: number;
  budget: number;
  jd?: File; // Optional file upload for Job Description
}

export interface HiringCycleResponse {
  cycleId: number;
  cycleYear: number;
  cycleName: string;
  compensationBand: number;
  budget: number;
  hasJd: boolean;
  status: string;
  createdAt: string; // ISO-8601 format from LocalDateTime
}

export interface HiringCycleSummaryResponse {
  cycleId: number;
  cycleYear: number;
  cycleName: string;
  status :string;
}

// For creating/updating cycle with form data
export interface HiringCycleFormData {
  cycleYear: number;
  cycleName: string;
  compensationBand: number;
  budget: number;
  jd?: File;
}


