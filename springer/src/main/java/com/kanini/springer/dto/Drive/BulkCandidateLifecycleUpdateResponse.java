package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Response DTO for bulk lifecycle status update operation
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkCandidateLifecycleUpdateResponse {
    
    private List<Long> successfulCandidateIds = new ArrayList<>(); // IDs of successfully updated candidates
    private List<String> errorMessages = new ArrayList<>(); // Error messages for failed updates
    private int totalProcessed; // Total candidates processed
    private int successCount; // Number of successful updates
    private int failureCount; // Number of failed updates
}
