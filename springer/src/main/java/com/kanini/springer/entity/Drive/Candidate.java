package com.kanini.springer.entity.Drive;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.kanini.springer.entity.Academy.BatchAllocation;
import com.kanini.springer.entity.DocumentProcessing.DocumentSubmission;
import com.kanini.springer.entity.DocumentProcessing.OfferLetter;
import com.kanini.springer.entity.HiringReq.HiringCycle;
import com.kanini.springer.entity.HiringReq.Institute;
import com.kanini.springer.entity.enums.Enums.ApplicationType;
import com.kanini.springer.entity.enums.Enums.ApplicationStage;

import com.kanini.springer.entity.enums.Enums.LifecycleStatus;

/**
 * The candidates details who appear for the drive
 * UNIQUE = constraint + index
 */
@Entity
@Table(name = "candidates", 
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_candidate_email", columnNames = "email"),
        @UniqueConstraint(name = "uk_candidate_aadhaar", columnNames = "aadhaarNumber")
    },
    indexes = {
        @Index(name = "idx_candidate_institute_id", columnList = "institute_id"),
        @Index(name = "idx_candidate_cycle_id", columnList = "cycle_id"),
        @Index(name = "idx_candidate_application_stage", columnList = "applicationStage"),
        @Index(name = "idx_candidate_passout_year", columnList = "passoutYear")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Candidate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long candidateId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "institute_id")
    private Institute institute; // nullable if off-campus pool

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cycle_id")
    private HiringCycle cycle;

    @NotBlank(message = "Candidate first name is required")
    @Pattern(regexp = "^[a-zA-Z\\s.]+$", message = "First name should contain only letters")
    @Size(min = 2, max = 50)
    private String firstName;

    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;

    @NotBlank(message = "Mobile number is required")
    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Mobile number should be a valid 10-digit Indian number")
    private String mobile;

    @Column(precision = 10, scale = 2)
    private BigDecimal cgpa;

    private Integer historyOfArrears; // no of arrears

    private String degree;

    private String department;

    private Integer passoutYear;

    private LocalDate dateOfBirth;

    @Pattern(regexp = "^\\d{12}$", message = "Aadhaar number must be exactly 12 digits")
    private String aadhaarNumber;

    private Boolean isEligible; // Candidate-level eligibility flag

    @Column(columnDefinition = "TEXT")
    private String reason; // Required only when eligibility was overridden/exception

    @Column(columnDefinition = "TEXT")
    private String statusHistory; // To store all the status update action with the userId and createdAt time (JSON format)

    @Enumerated(EnumType.STRING)
    private ApplicationType applicationType; // STANDARD, PREMIUM

    @Enumerated(EnumType.STRING)
    private ApplicationStage applicationStage; // APPLIED, SHORTLISTED, INVITED, SCHEDULED, SELECTED, OFFERED,JOINED, REJECTED, DROPPED

    @Enumerated(EnumType.STRING)
    private LifecycleStatus lifecycleStatus; // ACTIVE, CLOSED


    private LocalDateTime updatedAt;

    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "candidate", cascade = CascadeType.ALL)
    private List<CandidateSkill> candidateSkills;

    @OneToMany(mappedBy = "candidate", cascade = CascadeType.ALL)
    private List<Application> applications;

    @OneToMany(mappedBy = "candidate", cascade = CascadeType.ALL)
    private List<DocumentSubmission> documentSubmissions;

    @OneToMany(mappedBy = "candidate", cascade = CascadeType.ALL)
    private List<OfferLetter> offerLetters;

    @OneToMany(mappedBy = "candidate", cascade = CascadeType.ALL)
    private List<BatchAllocation> batchAllocations;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
