package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating a single drive assignment
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DriveAssignmentRequest {
    
    private Long driveId;        // required
    private Long userId;         // required - panel member user ID
    private Long applicationId;  // required
    private Long roundConfigId;  // required - which round template this assignment is for
    private String status;       // optional - default PLANNED
    private Boolean isActive;    // optional - default true
    private Long createdBy;      // required - userId
}
