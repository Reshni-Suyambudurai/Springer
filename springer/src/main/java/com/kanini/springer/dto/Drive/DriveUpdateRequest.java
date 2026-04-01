package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * Request DTO for updating a drive schedule
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DriveUpdateRequest {
    
    private String driveName;
    private String description;
    private Long instituteId;
    private LocalDate startDate;
    private LocalDate endDate;
    private String location;
    private Boolean eligibilityLocked;
    private String driveStatus;
    private Long updatedBy; // userId
    private List<Long> roundConfigIds; // optional - can update drive rounds
}
