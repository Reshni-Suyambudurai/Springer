package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for drive assignment
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DriveAssignmentResponse {
    
    private Integer assignmentId;
    private Long driveId;
    private String driveName;
    private Long userId;
    private String userName;
    private Long applicationId;
    private Long candidateId;
    private String candidateName;
    private Long roundConfigId;
    private String roundName;
    private String status;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private Long createdBy;
    private String createdByName;
}
