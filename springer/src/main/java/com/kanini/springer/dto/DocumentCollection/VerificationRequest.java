package com.kanini.springer.dto.DocumentCollection;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VerificationRequest {
    
    @NotNull(message = "Verified by (User ID) is required")
    private Long verifiedBy;
    
    private String rejectionReason;
    
    private String comment;
}
