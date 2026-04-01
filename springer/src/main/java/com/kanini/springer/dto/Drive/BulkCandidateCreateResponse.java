package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Response DTO for bulk candidate creation
 * Follows all-or-nothing pattern: either all candidates are created or none
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkCandidateCreateResponse {
    
    private List<CandidateResponse> successfulInserts = new ArrayList<>();
    private List<String> errorMessages = new ArrayList<>();
    private int totalProcessed;
    private int successCount;
    private int failureCount;
}
