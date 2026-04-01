package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for updating assignment status
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DriveAssignmentStatusUpdateRequest {
    
    private String status; // required - new status
}
