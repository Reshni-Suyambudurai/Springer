package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for updating candidate status
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CandidateStatusUpdateRequest {
    
    private String status; // CandidateStatus enum string
    private Long updatedBy; // User ID who updated the status
}
