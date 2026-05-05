package com.kanini.springer.dto.Academy;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

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
    private String instituteName;
    private String mobile;
    private String degree;
    private Long cycleId;
    private String updatedAt;
    private Long userId;
}
