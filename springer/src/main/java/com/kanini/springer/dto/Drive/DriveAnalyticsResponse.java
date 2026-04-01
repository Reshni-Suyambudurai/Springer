package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Response DTO for drive analytics.
 * Combines full drive schedule data with application-level analytics counts.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DriveAnalyticsResponse {

    /** Full drive schedule details */
    private DriveResponse driveSchedule;

    /** Total number of applications for this drive */
    private Long totalApplications;

    /** Number of distinct batch times scheduled across all applications */
    private Long distinctBatchTimeCount;

    /**
     * Number of applications per batch time.
     * Key   = batch time as ISO-8601 string (e.g. "2026-04-15T09:00:00")
     * Value = count of applications in that batch
     */
    private Map<String, Long> applicationsPerBatchTime;
}
