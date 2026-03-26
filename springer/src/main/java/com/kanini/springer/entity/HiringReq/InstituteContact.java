package com.kanini.springer.entity.HiringReq;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

import com.kanini.springer.entity.enums.Enums.ContactStatus;

/**
 * Its contains the colleges placement coordinator details
 */
@Entity
@Table(name = "institute_contacts",
    indexes = {
        @Index(name = "idx_contact_institute_id", columnList = "institute_id"),
        
        @Index(name = "idx_contact_status", columnList = "tpoStatus"),
    
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InstituteContact {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer tpoId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "institute_id")
    private Institute institute;
    
    @NotBlank(message = "TPO name is required")
    @Pattern(regexp = "^[a-zA-Z\\s.]+$", message = "TPO name should not contain numbers or special characters")
    @Size(min = 2, max = 100, message = "TPO name must be between 2 and 100 characters")
    private String tpoName;
    
    @NotBlank(message = "TPO email is required")
    @Email(message = "TPO email should be valid")
    private String tpoEmail;
    
    @NotBlank(message = "TPO mobile number is required")
    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Mobile number should be a valid 10-digit Indian number")
    private String tpoMobile;
    
    private String tpoDesignation; // qualification of the tpo
    
    @Enumerated(EnumType.STRING)
    private ContactStatus tpoStatus;
    
    private Boolean isPrimary; // true=primary contact
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
      
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
