package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for bulk candidate validation
 * Returns temp ID and validation comment for each candidate
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CandidateValidationResponse {
    
    private String tempId; // Matches the temporary ID from request
    private String status; // NEW, DUPLICATE, OLD
    private String comment; // Detailed comment explaining the status
    private Boolean canProceed; // true for NEW and OLD, false for DUPLICATE
}
