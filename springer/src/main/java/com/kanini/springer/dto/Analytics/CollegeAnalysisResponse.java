package com.kanini.springer.dto.Analytics;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * College-level analysis response for a given cycle.
 * Only includes institutes where at least 1 candidate applied in that cycle.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CollegeAnalysisResponse {

    private Long instituteId;
    private String instituteName;

    // Candidate counts (from Candidate.applicationStage for the given cycleId)
    private long totalAppliedCount;
    private long selectedCount;
    private long rejectedCount;
    private long droppedCount;
    private long acceptedCount;
    private long joinedCount;
    private long notJoinedCount;
    private long offerRejectedCount;
}
