package com.kanini.springer.dto.Dashboards;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DriveDashboardResponse {

    // Candidate stage summary
    private long totalCandidates;
    private long selectedCount;
    private long rejectedCount;
    private long droppedCount;
    private long acceptedCount;
    private long joinedCount;

    // Drive location analytics: locationName -> count of drives
    private Map<String, Long> driveLocationMap;

    // Institute-wise candidate analytics
    private List<InstituteSummary> instituteSummaries;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InstituteSummary {
        private Long instituteId;
        private String instituteName;
        private long totalCandidates;
        private long selectedCount;
        private long rejectedCount;
        private long droppedCount;
        private long acceptedCount;
        private long joinedCount;
    }
}
