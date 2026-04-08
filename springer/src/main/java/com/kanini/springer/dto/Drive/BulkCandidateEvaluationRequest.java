package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Request DTO for bulk creating candidate evaluations from Excel upload.
 * Frontend sends registration_code + candidate info + section scores.
 * Backend resolves applicationId via registration_code and verifies email.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkCandidateEvaluationRequest {
    
    private Long roundConfigId; // required - common for all
    private Integer roundNo; // required - round number (1=Aptitude, 2=Communication, 3=Technical)
    private Long updatedBy; // required - userId performing the upload
    private List<EvaluationData> evaluations; // required - array of evaluation data
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EvaluationData {
        private String registrationCode; // required - used to resolve applicationId
        private String candidateName; // required - for display/logging
        private String candidateEmail; // required - verified against candidate record
        private Map<String, Number> sections; // required - e.g. {"Technical": 10, "Verbal": 20}
    }
}
