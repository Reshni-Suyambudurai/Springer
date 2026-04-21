package com.kanini.springer.entity.Academy;

import com.kanini.springer.entity.HiringReq.User;
import com.kanini.springer.entity.enums.Enums.LeaveStatus;
import com.kanini.springer.entity.enums.Enums.LeaveType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "leave_requests",
    indexes = {
        @Index(name = "idx_leave_student_id", columnList = "student_id"),
        @Index(name = "idx_leave_status",     columnList = "status")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LeaveRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long leaveId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private BatchAllocation student;

    @Column(nullable = false)
    private LocalDate fromDate;

    @Column(nullable = false)
    private LocalDate toDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LeaveType leaveType;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    // Status — PENDING → APPROVED / REJECTED (TA Recruiter only)
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LeaveStatus status = LeaveStatus.PENDING;

    // TA Recruiter decision
    @Column(columnDefinition = "TEXT")
    private String remarks;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    private LocalDateTime reviewedAt;

    private LocalDateTime appliedAt;

    @PrePersist
    protected void onCreate() {
        appliedAt = LocalDateTime.now();
        if (status == null) status = LeaveStatus.PENDING;
    }
}
