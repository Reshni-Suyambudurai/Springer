package com.kanini.springer.entity.Academy;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Maps batches to their assigned training courses
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
    
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
