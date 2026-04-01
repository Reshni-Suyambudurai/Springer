package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for candidate data
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CandidateResponse {
    
    private Long candidateId;
    private Long instituteId;
    private String instituteName;
    private String state;
    private String city;
    private Long cycleId;
    private String firstName;
    private String lastName;
    private String email;
    private String mobile;
    private BigDecimal cgpa;
    private Integer historyOfArrears;
    private String degree;
    private String department;
    private Integer passoutYear;
    private LocalDate dateOfBirth;
    private String aadhaarNumber;
    private Boolean isEligible;
    private String reason;
    private String statusHistory;
    private String applicationType; // STANDARD or PREMIUM
    private String applicationStage; // APPLIED, SHORTLISTED, etc.
    private String lifecycleStatus; // ACTIVE or CLOSED
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<String> skillNames; // List of skill names
}
