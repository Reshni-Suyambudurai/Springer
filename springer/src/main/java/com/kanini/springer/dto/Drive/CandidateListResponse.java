package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Lightweight response DTO for candidate list/table views.
 * Contains only the fields displayed in the candidate table UI.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CandidateListResponse {
    private Long candidateId;
    private String firstName;
    private String lastName;
    private String instituteName;
    private BigDecimal cgpa;
    private Integer historyOfArrears;
    private Integer passoutYear;
    private String applicationStage;
    private String applicationType;
    private Boolean isEligible;
    private String reason;
}
