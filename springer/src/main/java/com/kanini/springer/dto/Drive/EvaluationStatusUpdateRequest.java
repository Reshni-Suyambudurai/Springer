package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for updating evaluation status
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EvaluationStatusUpdateRequest {
    
    private String evaluationStatus; // required - new status
    private Long updatedBy; // required - user ID for manual override logging
}
