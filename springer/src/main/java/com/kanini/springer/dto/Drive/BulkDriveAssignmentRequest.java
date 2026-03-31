package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for bulk creating drive assignments
 * Multiple applicationIds with same driveId, userId, and roundConfigId
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkDriveAssignmentRequest {
    
    private Long driveId;           // required - common for all
    private Long userId;            // required - common for all
    private Long roundConfigId;     // required - which round template these assignments are for
    private List<Long> applicationIds; // required - multiple applications
    private String status;          // optional - default PLANNED
    private Boolean isActive;       // optional - default true
    private Long createdBy;         // required - userId
}
