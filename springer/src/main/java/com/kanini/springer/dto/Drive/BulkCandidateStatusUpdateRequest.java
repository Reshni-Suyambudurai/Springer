package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for bulk status update of multiple candidates
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkCandidateStatusUpdateRequest {
    
    private List<Long> candidateIds; // List of candidate IDs to update (used in select mode)
    private CandidateFilterRequest filterRequest; // Filters to resolve all matching IDs (used in non-select mode)
    private String status; // New status to apply (e.g., SHORTLISTED, SCHEDULED)
    private String reason; // Reason for status update (will be appended to existing reason)
    private Long updatedBy; // User ID who is performing the update
}
