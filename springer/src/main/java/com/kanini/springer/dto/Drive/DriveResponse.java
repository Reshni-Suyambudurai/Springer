package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for Drive schedule
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DriveResponse {
    
    private Long driveId;
    private Long cycleId;
    private String cycleName;
    private String driveName;
    private String description;
    private String driveMode; // ON_CAMPUS / OFF_CAMPUS
    private Long instituteId;
    private String instituteName;
    private LocalDate startDate;
    private LocalDate endDate;
    private String location;
    private Boolean eligibilityLocked;
    private String status;
    private LocalDateTime createdAt;
    private Long createdBy;
    private String createdByName;
    private LocalDateTime updatedAt;
    private Long updatedBy;
    private String updatedByName;
    private List<DriveRoundResponse> driveRounds; // included only for getById
}
