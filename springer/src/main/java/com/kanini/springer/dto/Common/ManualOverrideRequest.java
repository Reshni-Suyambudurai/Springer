package com.kanini.springer.dto.Common;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for logging a manual override
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ManualOverrideRequest {
    
    @NotBlank(message = "Entity type is required")
    private String entityType; // CANDIDATES, DRIVES, etc.
    @NotNull(message = "Entity ID is required")
    private Long entityId;
    private List<FieldChangeDTO> changes;
    @NotBlank(message = "Override reason is required")
    @Size(max = 1000, message = "Override reason cannot exceed 1000 characters")
    private String overrideReason;
    @NotNull(message = "Created by user ID is required")
    private Long createdBy; // User ID who performed the override
}
