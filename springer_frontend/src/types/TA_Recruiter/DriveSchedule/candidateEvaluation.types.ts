// Candidate Evaluation Type Definitions
// Maps to backend DTOs in com.kanini.springer.dto.Drive

/**
 * Request DTO for fetching evaluations by round number and application IDs.
 * Static round mapping: Aptitude=1, Communication=2, Technical=3
 */
export interface RoundEvaluationRequest {
  roundNo: number;
  applicationIds: number[];
}

import type { RoundTemplateResponse } from "../Drive/roundTemplate.types";

/**
 * Response DTO for evaluations fetched by round and application IDs.
 * Contains the full round template details and the list of candidate evaluation records.
 */
export interface RoundEvaluationResponse {
  roundTemplate: RoundTemplateResponse;
  evaluations: CandidateEvaluationResponse[];
}

export interface CandidateEvaluationRequest {
  applicationId: number;
  roundConfigId: number;
  score: number;
  sectionScore: Record<string, unknown>; // JSON object
  review: string;
  evaluationStatus: string;
  reviewedBy: number;
  status: string; // "SUBMIT" or "DRAFT"
}

export interface CandidateEvaluationResponse {
  scoreId: number;
  applicationId: number;
  candidateId: number;
  candidateName: string;
  roundConfigId: number;
  roundName: string;
  score: number;
  sectionScore: Record<string, unknown>; // JSON object
  review: string;
  evaluationStatus: string;
  reviewedBy: number;
  reviewedByName: string;
  reviewedAt: string; // ISO-8601 format from LocalDateTime
}

// Nested type for evaluation summary
export interface RoundEvaluationData {
  roundConfigId: number;
  roundName: string;
  score: number;
  review: string;
  status: string;
}

export interface CandidateEvaluationSummaryResponse {
  candidateId: number;
  candidateName: string;
  applicationId: number;
  evaluations: RoundEvaluationData[];
}

export interface EvaluationStatusUpdateRequest {
  evaluationStatus: string;
  updatedBy: number;
}

// Nested type for bulk evaluation
export interface EvaluationData {
  registrationCode: string;
  candidateName: string;
  candidateEmail: string;
  sections: Record<string, number>;
}

export interface BulkCandidateEvaluationRequest {
  roundConfigId: number;
  roundNo: number;
  updatedBy: number;
  evaluations: EvaluationData[];
}

export interface BulkCandidateEvaluationResponse {
  errorMessages: Record<number, string>;
  totalProcessed: number;
  successCount: number;
  failureCount: number;
}

export interface BulkEvaluationStatusUpdateRequest {
  status: string;
  applicationIds: number[];
  roundConfigId: number;
  updatedBy?: number;
  reason?: string;
}

export interface BulkRoundSkipRequest {
  applicationIds: number[];
  roundConfigId: number;
  reviewedBy: number;
  status: 'SKIP' | 'HOLD' | 'ABSENT';
  reason?: string;
}
