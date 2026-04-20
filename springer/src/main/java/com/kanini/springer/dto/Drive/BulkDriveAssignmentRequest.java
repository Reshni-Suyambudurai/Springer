package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for bulk creating drive assignments
 * Common fields (driveId, status, isActive, createdBy) + list of {applicationId, userId} pairs
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkDriveAssignmentRequest {
    
    private Long driveId;                   // required - common for all
    private Long roundConfigId;             // optional - which round template (takes priority)
    private Integer roundNo;                // optional - resolve to roundConfigId if roundConfigId is null
    private String status;                  // optional - default PLANNED
    private Boolean isActive;               // optional - default true
    private Long createdBy;                 // required - userId
    private List<AssignmentEntry> entries;  // required - list of {applicationId, userId} pairs

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssignmentEntry {
        private Long applicationId;
        private Long userId;
        private Long replaceUserId;  // optional — if set, find existing assignment for this user and replace with userId
    }
}
