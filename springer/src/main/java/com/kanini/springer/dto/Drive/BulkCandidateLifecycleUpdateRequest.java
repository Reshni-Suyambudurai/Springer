package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for bulk lifecycle status update of multiple candidates
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkCandidateLifecycleUpdateRequest {
    
    private List<Long> candidateIds; // List of candidate IDs to update
    private String lifecycleStatus; // New lifecycle status (ACTIVE or CLOSED)
    private Long updatedBy; // User ID who is performing the update
}
