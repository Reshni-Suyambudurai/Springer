package com.kanini.springer.dto.Drive;

import com.kanini.springer.entity.enums.Enums.DriveMode;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * DTO for upcoming drive summary with minimal fields
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpcomingDriveSummaryResponse {
    private Long driveId;
    private String driveName;
    private DriveMode driveMode;
    private LocalDate startDate;
}
