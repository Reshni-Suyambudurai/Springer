package com.kanini.springer.entity.Academy;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Tracks daily attendance for each candidate in a batch.
 * One record per candidate per day — unique constraint prevents duplicate marking.
 */
@Entity
@Table(name = "training_day_attendance",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_student_attendance_date", columnNames = {"student_id", "attendanceDate"})
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrainingDayAttendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long attendanceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private BatchAllocation student;

    @Column(nullable = false)
    private LocalDate attendanceDate;

    @Column(nullable = false)
    private Boolean isPresent;
}
