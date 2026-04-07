package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Response DTO for bulk candidate evaluation operations.
 * All-or-nothing: either all rows are inserted or none.
 * errorMessages: key = row index (0-based), value = error reason.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkCandidateEvaluationResponse {
    
    private Map<Integer, String> errorMessages = new LinkedHashMap<>();
    private int totalProcessed;
    private int successCount;
    private int failureCount;
}
