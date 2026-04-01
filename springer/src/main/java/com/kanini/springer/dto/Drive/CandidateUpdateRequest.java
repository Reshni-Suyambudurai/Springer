package com.kanini.springer.dto.Drive;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for updating candidate eligibility status
 * Used to manually override isEligible flag with audit trail
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CandidateUpdateRequest {
    
    @NotNull(message = "Eligibility status is required")
    private Boolean isEligible; // Can be manually overridden
    
    @NotBlank(message = "Reason is required for eligibility status update")
    private String reason; // Mandatory reason for update audit trail
    
    @NotNull(message = "User ID (updatedBy) is required")
    private Long updatedBy; // User who is making the update
}
