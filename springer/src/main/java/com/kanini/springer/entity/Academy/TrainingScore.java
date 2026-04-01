package com.kanini.springer.entity.Academy;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

import com.kanini.springer.entity.HiringReq.User;
import com.kanini.springer.entity.enums.Enums.ScoreStatus;

/**
 * The score secured by each candidates in each course
 */
@Entity
@Table(name = "training_scores",
    indexes = {
        @Index(name = "idx_training_score_course_id", columnList = "course_id")
    },
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_student_course", columnNames = {"student_id", "course_id"})
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrainingScore {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long scoreId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private TrainingCourse course;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private BatchAllocation student;
    
    private Integer score;
    
    @Column(columnDefinition = "TEXT")
    private String review; // Feedback given by the trainer
    
    @Enumerated(EnumType.STRING)
    private ScoreStatus status;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy; // trainer
    
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
