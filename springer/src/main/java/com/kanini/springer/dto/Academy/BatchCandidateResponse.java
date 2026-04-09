package com.kanini.springer.dto.Academy;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Lightweight response DTO for batch allocation candidate selection dialog.
 * Contains only the fields displayed when selecting candidates for batch allocation.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BatchCandidateResponse {
    private Long candidateId;
    private String firstName;
    private String lastName;
    private String email;
    private String department;
    private BigDecimal cgpa;
    private String applicationStage;
}
