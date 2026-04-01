package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for candidate evaluation
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CandidateEvaluationResponse {
    
    private Long scoreId;
    private Long applicationId;
    private Long candidateId;
    private String candidateName;
    private Long roundConfigId;
    private String roundName;
    private Integer score;
    private Object sectionScore; // JSON object
    private String review;
    private String evaluationStatus;
    private Long reviewedBy;
    private String reviewedByName;
    private LocalDateTime reviewedAt;
}
