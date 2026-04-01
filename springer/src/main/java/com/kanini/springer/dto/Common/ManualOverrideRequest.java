package com.kanini.springer.dto.Common;

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
    
    private String entityType; // CANDIDATES, DRIVES, etc.
    private Long entityId;
    private List<FieldChangeDTO> changes;
    private String overrideReason;
    private Long createdBy; // User ID who performed the override
}
