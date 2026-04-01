package com.kanini.springer.dto.Drive;

import com.kanini.springer.entity.enums.Enums.ApplicationType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Request DTO for bulk candidate validation
 * Includes temporary ID from frontend for tracking
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CandidateValidationRequest {
    
    private String tempId; // Temporary ID from frontend for tracking
    private Long instituteId;
    private Long cycleId; // The cycle to which the candidate is being added
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
    private String aadhaarNumber; // Optional but if present, used for 100% match
    private ApplicationType applicationType;
}
