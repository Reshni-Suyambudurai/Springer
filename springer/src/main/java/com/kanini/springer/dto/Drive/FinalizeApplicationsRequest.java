package com.kanini.springer.dto.Drive;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for finalizing applications - applying application status to candidate stage
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FinalizeApplicationsRequest {
    
    @NotEmpty(message = "Application IDs list cannot be empty")
    private List<Long> applicationIds;
    
    private Boolean isClosed = false;
}
