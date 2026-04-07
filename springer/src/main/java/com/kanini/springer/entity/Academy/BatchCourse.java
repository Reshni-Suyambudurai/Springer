package com.kanini.springer.entity.Academy;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

import com.kanini.springer.entity.HiringReq.User;
import com.kanini.springer.entity.enums.Enums.CourseStatus;

/**
 * Per-batch course schedule.
 * One course template can run in multiple batches with different dates and trainers.
 */
@Entity
@Table(name = "batch_courses",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_program_batch_course", columnNames = {"program_id", "batchNo", "course_id"})
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BatchCourse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer batchCourseId;

    private Integer batchNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private TrainingCourse course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "program_id")
    private TrainingProgram program;

    private LocalDateTime startDate;

    private LocalDateTime endDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conducted_by")
    private User conductedBy;

    @Enumerated(EnumType.STRING)
    private CourseStatus status;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (this.status == null) this.status = CourseStatus.PLANNED;
    }
}
