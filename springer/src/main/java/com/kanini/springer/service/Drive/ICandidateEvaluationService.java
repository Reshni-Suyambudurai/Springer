package com.kanini.springer.service.Drive;

import com.kanini.springer.dto.Drive.*;

import java.util.List;

/**
 * Service interface for Candidate Evaluation operations
 */
public interface ICandidateEvaluationService {
    
    /**
     * Create a single candidate evaluation
     * If evaluationStatus == FAIL:
     * - Update candidate status to REJECTED
     * - Append reason: "Failed in {RoundName}"
     * 
     * @param request Evaluation creation request
     * @return CandidateEvaluationResponse with created evaluation details
     */
    CandidateEvaluationResponse createEvaluation(CandidateEvaluationRequest request);
    
    /**
     * Bulk create candidate evaluations
     * Common: roundConfigId, reviewedBy
     * Different per candidate: applicationId, score, sectionScore, review, evaluationStatus
     * 
     * If evaluationStatus == FAIL:
     * - Update candidate status to REJECTED
     * - Append reason: "Failed in {RoundName}"
     * 
     * @param request Bulk evaluation creation request
     * @return BulkCandidateEvaluationResponse with successful evaluations and errors
     */
    BulkCandidateEvaluationResponse bulkCreateEvaluations(BulkCandidateEvaluationRequest request);
    
    /**
     * Get all candidate evaluations
     * @return List of CandidateEvaluationResponse
     */
    List<CandidateEvaluationResponse> getAllEvaluations();
    
    /**
     * Get evaluations by application ID
     * @param applicationId Application ID
     * @return List of CandidateEvaluationResponse for the specified application
     */
    List<CandidateEvaluationResponse> getEvaluationsByApplicationId(Long applicationId);
    
    /**
     * Get candidate evaluations summary by drive ID
     * Returns all candidates in the drive with their round-wise evaluations
     * 
     * @param driveId Drive ID
     * @return List of CandidateEvaluationSummaryResponse with candidate info and their evaluations
     */
    List<CandidateEvaluationSummaryResponse> getEvaluationsSummaryByDriveId(Long driveId);
    
    /**
     * Update evaluation status
     * 
     * Logic:
     * - If new status == ABSENT:
     *   → Update candidate status to REJECTED, update reason
     * 
     * - If old status == PASS and new status == FAIL:
     *   → Update candidate status to REJECTED, update reason
     *   → Log manual override
     * 
     * - If old status == FAIL and new status == PASS:
     *   → Update candidate status to SHORTLISTED, update reason
     *   → Log manual override
     * 
     * @param scoreId Evaluation score ID
     * @param request Status update request with evaluationStatus and updatedBy
     * @return CandidateEvaluationResponse with updated evaluation
     */
    CandidateEvaluationResponse updateEvaluationStatus(Long scoreId, EvaluationStatusUpdateRequest request);
}
