package com.kanini.springer.dto.Drive;

import com.kanini.springer.entity.enums.Enums.DriveMode;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.Map;

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
    private String location;
    private Map<String, Long> applicationsPerBatchTime;

    public UpcomingDriveSummaryResponse(Long driveId, String driveName, DriveMode driveMode, LocalDate startDate) {
        this.driveId = driveId;
        this.driveName = driveName;
        this.driveMode = driveMode;
        this.startDate = startDate;
    }
}
