package com.kanini.springer.entity.Academy;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Stores certificates uploaded by interns during training
 * Multiple certificates per student allowed
 */
@Entity
@Table(name = "intern_certificates",
    indexes = {
        @Index(name = "idx_cert_student_id", columnList = "student_id")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InternCertificate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long certificateId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private BatchAllocation student;

    @Column(nullable = false)
    private String certificateName;

    @Column(nullable = false)
    private String issuer;

    private LocalDate issueDate;

    @Lob
    private byte[] fileData;

    private LocalDateTime uploadedAt;

    @PrePersist
    protected void onCreate() {
        uploadedAt = LocalDateTime.now();
    }
}
