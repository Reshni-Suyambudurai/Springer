package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Summary response for candidate evaluations grouped by candidate
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CandidateEvaluationSummaryResponse {
    
    private Long candidateId;
    private String candidateName;
    private Long applicationId;
    private List<RoundEvaluationData> evaluations = new ArrayList<>();
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoundEvaluationData {
        private Long roundConfigId;
        private String roundName;
        private Integer score;
        private String review;
        private String status;
    }
}
