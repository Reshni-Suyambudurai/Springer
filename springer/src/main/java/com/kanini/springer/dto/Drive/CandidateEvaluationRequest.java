package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating a single candidate evaluation
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CandidateEvaluationRequest {
    
    private Long applicationId; // required
    private Long roundConfigId; // required
    private Integer score; // required - calculated score from frontend
    private Object sectionScore; // optional - JSON object with section-wise scores
    private String review; // optional - review comments
    private String evaluationStatus; // required - PASS, FAIL, ABSENT, HOLD, SKIP
    private Long reviewedBy; // required - user ID
    private String status; // required - SUBMIT or DRAFT or HOLD -> create if not present or else update
}
