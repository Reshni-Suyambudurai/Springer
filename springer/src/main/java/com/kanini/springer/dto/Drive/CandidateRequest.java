package com.kanini.springer.dto.Drive;

import com.kanini.springer.entity.enums.Enums.ApplicationType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Request DTO for creating/updating candidates
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CandidateRequest {
    
    private Long instituteId; // nullable for off-campus candidates
    private Long cycleId; // nullable for candidates not yet assigned to a cycle
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
    private ApplicationType applicationType; // STANDARD or PREMIUM
    private List<Long> skillIds; // List of skill IDs from Skills master table
}

