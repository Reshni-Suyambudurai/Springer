package com.kanini.springer.service.Drive;

import com.kanini.springer.dto.Drive.BulkCandidateCreateResponse;
import com.kanini.springer.dto.Drive.BulkCandidateLifecycleUpdateRequest;
import com.kanini.springer.dto.Drive.BulkCandidateLifecycleUpdateResponse;
import com.kanini.springer.dto.Drive.BulkCandidateStatusUpdateRequest;
import com.kanini.springer.dto.Drive.BulkCandidateStatusUpdateResponse;
import com.kanini.springer.dto.Drive.CandidateFilterRequest;
import com.kanini.springer.dto.Drive.CandidateRequest;
import com.kanini.springer.dto.Drive.CandidateResponse;
import com.kanini.springer.dto.Drive.CandidateStatusUpdateRequest;
import com.kanini.springer.dto.Drive.CandidateUpdateRequest;
import com.kanini.springer.dto.Drive.CandidateValidationRequest;
import com.kanini.springer.dto.Drive.CandidateValidationResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
    
    /**
     * Bulk validate candidates before creation
     * Checks if candidates are NEW, DUPLICATE (in same cycle), or OLD (in previous closed cycles)
     * @param requests List of candidate validation requests with temporary IDs
     * @return List of validation responses with status and comments for each candidate
     */
    List<CandidateValidationResponse> bulkValidateCandidates(List<CandidateValidationRequest> requests);
    
    /**
     * Get active candidates with pagination filtered by cycle
     * Returns only candidates with lifecycleStatus = ACTIVE for a specific cycle
     * Supports infinite scroll with page-based loading
     * 
     * @param cycleId Cycle ID to filter candidates
     * @param pageable Pagination information (page number, page size, sorting)
     * @return Page of active candidates for the specified cycle with all related data
     */
    Page<CandidateResponse> getActiveCandidatesPaginated(Long cycleId, Pageable pageable);
    
    /**
     * Get candidates with dynamic filtering and pagination
     * Supports complex filters including name, institute, location, degree, etc.
     * Optimized with JPA Specifications for performance
     * 
     * @param filterRequest Filter criteria and pagination info
     * @return Page of candidates matching the filter criteria
     */
    Page<CandidateResponse> getCandidatesWithFilters(CandidateFilterRequest filterRequest);
    
    /**
     * Get distinct filter options for a specific cycle with ACTIVE lifecycle status
     * Returns all unique values for institutes, states, cities, degrees, departments, and skills
     * Used to populate filter dropdowns in the frontend
     * 
     * @param cycleId Cycle ID to fetch filter options for
     * @return FilterOptionsResponse containing all distinct filter values
     */
    com.kanini.springer.dto.Drive.FilterOptionsResponse getFilterOptionsByCycle(Long cycleId);
}

