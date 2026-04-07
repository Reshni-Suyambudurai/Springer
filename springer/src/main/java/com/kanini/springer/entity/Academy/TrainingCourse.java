package com.kanini.springer.entity.Academy;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Course template — reusable across batches and hiring cycles.
 * Dates, trainer and status are stored per batch in BatchCourse.
 */
@Entity
@Table(name = "training_courses",
    indexes = {
        @Index(name = "idx_course_name", columnList = "courseName"),
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrainingCourse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer courseId;

    private String courseName;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Integer minScore;

    private Integer weightage;

    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL)
    private List<TrainingScore> trainingScores;

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL)
    private List<BatchCourse> batchCourses;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
