package com.kanini.springer.dto.Common;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for manual override records
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ManualOverrideResponse {
    
    private Long overrideId;
    private String entityType;
    private Long entityId;
    private List<FieldChangeDTO> changes;
    private String overrideReason;
    private Long createdById;
    private String createdByName;
    private LocalDateTime createdAt;
}
