package com.kanini.springer.dto.Drive;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Request DTO for candidate self-registration
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CandidateRegistrationRequest {

    @NotNull(message = "Form ID is required")
    private Long formId;

    @NotBlank(message = "First name is required")
    @Size(max = 255)
    private String fname;

    @Size(max = 255)
    private String lname;

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;

    @NotBlank(message = "Phone is required")
    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Phone must be a valid 10-digit Indian number")
    private String phone;

    @NotBlank(message = "College name is required")
    @Size(max = 255)
    private String collegeName;

    @NotNull(message = "Graduation year is required")

    private Integer graduationYear;

    @Size(max = 100)
    private String degree;

    @Size(max = 100)
    private String department;

    @NotNull(message = "CGPA is required")
    @DecimalMin(value = "0.0")
    @DecimalMax(value = "10.0")
    private BigDecimal cgpa;

    @Min(value = 0)
    private Integer historyOfArrears;

    private String skills; // Optional, comma-separated skill IDs

    @NotNull(message = "Date of birth is required")
    @Past(message = "Date of birth must be in the past")
    private LocalDate dob;

    @Pattern(regexp = "^$|^\\d{12}$", message = "Aadhaar must be 12 digits")
    private String aadhaarNo; // Optional, validated only if provided

    @Size(max = 50)
    private String applicationType;

    private Long instituteId;
}
