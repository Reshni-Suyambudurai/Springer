package com.kanini.springer.dto.Drive;

import com.kanini.springer.entity.enums.Enums.RegistrationStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Response DTO for candidate registration
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CandidateRegistrationResponse {

    private Long registrationId;
    private Long formId;
    private String formName;
    private Long driveId;
    private String driveName;
    private Long instituteId;
    private String instituteName;
    private String fname;
    private String lname;
    private String email;
    private String phone;
    private String collegeName;
    private Integer graduationYear;
    private String degree;
    private String department;
    private BigDecimal cgpa;
    private Integer historyOfArrears;
    private String skills;
    private LocalDate dob;
    private String aadhaarNo;
    private String applicationType;
    private RegistrationStatus status;
    private LocalDateTime submittedAt;
}
