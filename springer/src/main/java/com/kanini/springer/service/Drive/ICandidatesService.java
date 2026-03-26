package com.kanini.springer.service.Drive;

import com.kanini.springer.dto.Drive.BulkCandidateCreateResponse;
import com.kanini.springer.dto.Drive.BulkCandidateLifecycleUpdateRequest;
import com.kanini.springer.dto.Drive.BulkCandidateLifecycleUpdateResponse;
import com.kanini.springer.dto.Drive.BulkCandidateStatusUpdateRequest;
import com.kanini.springer.dto.Drive.BulkCandidateStatusUpdateResponse;
import com.kanini.springer.dto.Drive.CandidateRequest;
import com.kanini.springer.dto.Drive.CandidateResponse;
import com.kanini.springer.dto.Drive.CandidateStatusUpdateRequest;
import com.kanini.springer.dto.Drive.CandidateUpdateRequest;
import java.util.List;

/**
 * Service interface for candidate operations
 */
public interface ICandidatesService {
    
    /**
     * Create a single candidate
     */
    CandidateResponse createCandidate(CandidateRequest request);
    
    /**
     * Bulk create candidates with validation
     * All-or-nothing: either all candidates are created or none
     * Validates uniqueness of email and aadhaar
     */
    BulkCandidateCreateResponse bulkCreateCandidates(List<CandidateRequest> requests);
    
    /**
     * Get all candidates
     */
    List<CandidateResponse> getAllCandidates();
    
    /**
     * Get candidate by ID
     */
    CandidateResponse getCandidateById(Long candidateId);
    
    /**
     * Get all candidates by institute ID
     */
    List<CandidateResponse> getCandidatesByInstituteId(Long instituteId);
    
    /**
     * Get all candidates by cycle ID with institute details
     */
    List<CandidateResponse> getCandidatesByCycleId(Long cycleId);
    
    /**
     * Update candidate (with manual override logging)
     */
    /**
     * Update candidate details
     * @param candidateId Candidate ID
     * @param request Update request with mandatory reason field
     * @param updatedBy User ID who is updating
     * @return Updated candidate response
     */
    CandidateResponse updateCandidate(Long candidateId, CandidateUpdateRequest request);
    
    /**
     * Update candidate status
     */
    CandidateResponse updateCandidateStatus(Long candidateId, CandidateStatusUpdateRequest request);
    
    /**
     * Bulk update candidate status
     * Only updates eligible candidates, skips ineligible ones
     * @param request Bulk status update request with candidate IDs, status, and reason
     * @return Response with successful and failed updates
     */
    BulkCandidateStatusUpdateResponse bulkUpdateCandidateStatus(BulkCandidateStatusUpdateRequest request);
    
    /**
     * Bulk update candidate lifecycle status
     * Updates lifecycle status for all specified candidates
     * @param request Bulk lifecycle update request with candidate IDs and new lifecycle status
     * @return Response with successful and failed updates
     */
    BulkCandidateLifecycleUpdateResponse bulkUpdateCandidateLifecycleStatus(BulkCandidateLifecycleUpdateRequest request);
}

