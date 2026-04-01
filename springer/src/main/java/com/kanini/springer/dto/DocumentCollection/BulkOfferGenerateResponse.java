package com.kanini.springer.dto.DocumentCollection;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkOfferGenerateResponse {

    private int totalRequested;
    private int totalSuccess;
    private int totalSkipped;
    private int totalFailed;
    private List<CandidateOfferResult> results;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CandidateOfferResult {
        private Long candidateId;
        private String candidateName;
        private String status;  // SUCCESS, SKIPPED, FAILED
        private String reason;  // reason for SKIPPED or FAILED
    }
}
