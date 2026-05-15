package com.kanini.springer.entity.Drive;

import com.kanini.springer.entity.HiringReq.Institute;
import com.kanini.springer.entity.enums.Enums.RegistrationStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Entity for storing candidate self-registration data before import to candidates table
 */
@Entity
@Table(name = "candidate_registration",
   
    indexes = {
        @Index(name = "idx_registration_drive_id", columnList = "drive_id"),
        @Index(name = "idx_registration_form_id", columnList = "form_id"),
        @Index(name = "idx_registration_status", columnList = "status"),
        @Index(name = "idx_registration_submitted_at", columnList = "submitted_at")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CandidateRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "registration_id")
    private Long registrationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "form_id", nullable = false)
    @NotNull(message = "Form is required")
    private Form form;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "drive_id", nullable = false)
    private Drive drive;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "institute_id")
    private Institute institute;

    @NotBlank(message = "First name is required")
    @Size(max = 255)
    @Column(nullable = false)
    private String fname;

    @Size(max = 255)
    private String lname;

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    @Size(max = 255)
    @Column(nullable = false)
    private String email;

    @NotBlank(message = "Phone is required")
    @Size(max = 20)
    @Column(nullable = false, length = 20)
    private String phone;

    @NotBlank(message = "College name is required")
    @Size(max = 255)
    @Column(name = "college_name", nullable = false)
    private String collegeName;

    @NotNull(message = "Graduation year is required")
 
    @Column(name = "graduation_year", nullable = false)
    private Integer graduationYear;

    @Size(max = 100)
    private String degree;

    @Size(max = 100)
    private String department;

    @NotNull(message = "CGPA is required")
    @DecimalMin(value = "0.0")
    @DecimalMax(value = "10.0")
    @Column(nullable = false, precision = 4, scale = 2)
    private BigDecimal cgpa;

    @Min(value = 0)
    @Column(name = "history_of_arrears")
    private Integer historyOfArrears;

    @Column(columnDefinition = "TEXT")
    private String skills; // Optional, comma-separated skill IDs

    private LocalDate dob;

    @Size(max = 12)
    @Pattern(regexp = "^$|^\\d{12}$", message = "Aadhaar must be 12 digits")
    @Column(name = "aadhaar_no", length = 12)
    private String aadhaarNo; // Optional, validated only if provided

    @Size(max = 50)
    @Column(name = "application_type", length = 50)
    private String applicationType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RegistrationStatus status = RegistrationStatus.PENDING;

    @Column(name = "submitted_at", nullable = false, updatable = false)
    private LocalDateTime submittedAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (submittedAt == null) {
            submittedAt = LocalDateTime.now();
        }
        if (status == null) {
            status = RegistrationStatus.PENDING;
        }
    }
}
