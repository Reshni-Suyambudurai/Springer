// Candidate Evaluation Type Definitions
// Maps to backend DTOs in com.kanini.springer.dto.Drive

export interface CandidateEvaluationRequest {
  applicationId: number;
  roundConfigId: number;
  score: number;
  sectionScore: Record<string, unknown>; // JSON object
  review: string;
  evaluationStatus: string;
  reviewedBy: number;
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
  applicationId: number;
  score: number;
  sectionScore: Record<string, unknown>; // JSON object
  review: string;
  evaluationStatus: string;
}

export interface BulkCandidateEvaluationRequest {
  roundConfigId: number;
  reviewedBy: number;
  evaluations: EvaluationData[];
}

export interface BulkCandidateEvaluationResponse {
  successfulEvaluations: CandidateEvaluationResponse[];
  errorMessages: string[];
  totalProcessed: number;
  successCount: number;
  failureCount: number;
}
