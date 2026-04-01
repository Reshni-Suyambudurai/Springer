package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for Application
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationResponse {
    
    private Long applicationId;
    private Long driveId;
    private String driveName;
    private Long candidateId;
    private String candidateName;
    private String candidateEmail;
    private LocalDateTime batchTime;
    private String registrationCode;
    private String applicationStatus;
    private LocalDateTime createdAt;
    private Long createdBy;
    private String createdByName;
}
