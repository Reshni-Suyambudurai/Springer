package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for checking if candidate evaluations already exist
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CheckExistingEvaluationsRequest {
    
    private Long driveId; // required - drive ID to validate candidates belong to this drive
    private Long roundConfigId; // required - typically 1 for Aptitude/Round1
    private List<CandidateCheckData> candidates; // required - list of candidates to check
    
    /**
     * Inner class representing each candidate to check
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CandidateCheckData {
        private Long applicationId; // optional - if not provided, will be resolved via registrationCode
        private String registrationCode; // required - for matching and error reporting
    }
}
