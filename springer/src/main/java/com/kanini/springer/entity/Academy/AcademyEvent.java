package com.kanini.springer.entity.Academy;

import com.kanini.springer.entity.HiringReq.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

/**
 * Events created by HR/Coordinator for interns
 * e.g. meetings, reviews, client visits, assessments
 */
@Entity
@Table(name = "academy_events",
    indexes = {
        @Index(name = "idx_event_program_id", columnList = "program_id"),
        @Index(name = "idx_event_date", columnList = "event_date")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AcademyEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long eventId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private LocalDate eventDate;

    private LocalTime eventTime;

    // MEETING | ASSESSMENT | REVIEW | SESSION | CLIENT_VISIT | OTHER
    @Column(nullable = false)
    private String eventType;

    // ONLINE or OFFLINE
    private String venue;

    // Scope — null means all programs
    private Integer programId;

    // null means all batches in that program
    private Integer batchNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
