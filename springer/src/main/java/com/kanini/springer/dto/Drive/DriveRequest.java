package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/**
 * Request DTO for creating a new drive schedule
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DriveRequest {
    
    private Long cycleId; // required
    private String driveName; // required
    private String description; // optional
    private Long instituteId; // optional (null for off-campus)
    private LocalDate startDate; // required
    private LocalDate endDate; // required
    private String location; // required
    private Boolean eligibilityLocked; // default false if not sent
    private String driveStatus; // default "PLANNED" if not sent
    private Long createdBy; // userId, required
    private List<Long> roundConfigIds; // optional - array of round_config_id
}
