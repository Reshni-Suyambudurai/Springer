package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for bulk creating candidate evaluations
 * Common: roundConfigId, reviewedBy, reviewedAt
 * Different per candidate: applicationId, score, sectionScore, review, evaluationStatus
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkCandidateEvaluationRequest {
    
    private Long roundConfigId; // required - common for all
    private Long reviewedBy; // required - common for all
    private List<EvaluationData> evaluations; // required - array of evaluation data
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EvaluationData {
        private Long applicationId; // required
        private Integer score; // required - calculated from frontend
        private Object sectionScore; // optional - JSON object
        private String review; // optional
        private String evaluationStatus; // required - PASS, FAIL, ABSENT, HOLD
    }
}
