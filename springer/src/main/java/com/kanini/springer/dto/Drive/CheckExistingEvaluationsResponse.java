package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Response DTO for checking existing candidate evaluations
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CheckExistingEvaluationsResponse {
    
    private int totalChecked; // total number of candidates checked
    private int existingCount; // number of candidates with existing evaluations
    private List<ExistingEvaluationInfo> existingEvaluations = new ArrayList<>(); // details of existing evaluations
    
    /**
     * Inner class representing evaluation conflict information
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExistingEvaluationInfo {
        private String registrationCode; // registration code for identification
        private String reason; // reason why evaluation exists (e.g., "Evaluation already exists for this round")
    }
}
