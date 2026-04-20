package com.kanini.springer.entity.Academy;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Stores the start and end date for each batch within a training program.
 * One record per batch per program.
 * End date can be updated manually when a batch is extended.
 */
@Entity
@Table(name = "batch_schedules",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_program_batch_schedule", columnNames = {"program_id", "batchNumber"})
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BatchSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer batchScheduleId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "program_id", nullable = false)
    private TrainingProgram program;

    @Column(nullable = false)
    private Integer batchNumber;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

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
