// Round Template Type Definitions
// Maps to backend DTOs in com.kanini.springer.dto.Drive

export interface RoundTemplateRequest {
  roundNo: number;
  roundName: string;
  outoffScore: number;
  minScore: number;
  weightage: number;
  sections: Record<string, unknown>; // JSON object
  isActive: boolean;
  createdBy: number;
}

export interface RoundTemplateResponse {
  roundConfigId: number;
  roundNo: number;
  roundName: string;
  outoffScore: number;
  minScore: number;
  weightage: number;
  sections: Record<string, unknown>; // JSON object
  isActive: boolean;
  createdAt: string; // ISO-8601 format from LocalDateTime
  createdBy: number;
  createdByName: string;
}

export interface RoundTemplateUpdateRequest {
  roundNo?: number;
  roundName?: string;
  outoffScore?: number;
  minScore?: number;
  weightage?: number;
  sections?: Record<string, unknown>; // JSON object
  isActive?: boolean;
}
