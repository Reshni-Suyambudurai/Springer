package com.kanini.springer.dto.Analytics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Cycle-level drive analysis response.
 * Aggregates candidate counts, drive type breakdown, and per-drive details for a given cycleId.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DriveDetailsAnalysisResponse {

    private Long cycleId;
    private String cycleName;
    private Integer cycleYear;

    // Cycle-level candidate counts (from Candidate.applicationStage)
    private long totalCandidates;
    private long selectedCount;
    private long rejectedCount;
    private long droppedCount;
    private long acceptedCount;
    private long joinedCount;

    // Drive type counts
    private long onCampusDriveCount;
    private long offCampusDriveCount;

    // Per-drive breakdown
    private List<DriveBreakdown> drives;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DriveBreakdown {
        private Long driveId;
        private String driveName;
        private String driveMode;
        private String location;
        private String instituteName; // null for OFF_CAMPUS
        private LocalDate startDate;

        private long distinctBatchCount;
        private Map<String, Long> batchApplicationCounts;

        // Application-level status counts for this drive
        private long appliedCount;
        private long selectedCount;
        private long droppedCount;
        private long rejectedCount; // FAILED in ApplicationStatus
    }
}
