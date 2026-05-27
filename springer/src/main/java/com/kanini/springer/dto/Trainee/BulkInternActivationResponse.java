package com.kanini.springer.dto.Trainee;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkInternActivationResponse {
    private int totalRequested;
    private int successCount;
    private int failedCount;
    private List<ActivationResult> results;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActivationResult {
        private Long candidateId;
        private String candidateName;
        private String outlookEmail;
        private boolean success;
        private String message;
        private Long userId;
    }
}
