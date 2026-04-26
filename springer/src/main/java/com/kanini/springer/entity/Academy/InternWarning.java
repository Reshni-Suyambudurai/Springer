package com.kanini.springer.entity.Academy;

import com.kanini.springer.entity.HiringReq.User;
import com.kanini.springer.entity.enums.Enums.WarningType;
import com.kanini.springer.entity.enums.Enums.WarningSeverity;
import com.kanini.springer.entity.enums.Enums.WarningStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "intern_warnings",
    indexes = {
        @Index(name = "idx_warning_student_id", columnList = "student_id"),
        @Index(name = "idx_warning_status",     columnList = "status")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InternWarning {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long warningId;

    // The intern being warned
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private BatchAllocation student;

    // Who issued the warning (TA Recruiter or Training Coordinator)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issued_by", nullable = false)
    private User issuedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WarningType warningType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WarningSeverity severity;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    // Optional — only relevant for PERFORMANCE type warnings
    private Integer courseId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private WarningStatus status = WarningStatus.ACTIVE;

    private LocalDateTime issuedAt;

    // When intern acknowledges the warning
    private LocalDateTime acknowledgedAt;

    // Intern's acknowledgement comment — "I acknowledge and won't repeat this"
    @Column(columnDefinition = "TEXT")
    private String acknowledgementComment;

    @PrePersist
    protected void onCreate() {
        issuedAt = LocalDateTime.now();
        if (status == null) status = WarningStatus.ACTIVE;
    }
}
