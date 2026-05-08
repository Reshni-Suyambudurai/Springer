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

    /**
     * Marks this course as a Communication course.
     * When true, scores use sub-field breakdown instead of a single score.
     * weightage is ignored for communication courses — score shown separately.
     */
    @Column(nullable = false, columnDefinition = "TINYINT(1) DEFAULT 0")
    private Boolean isCommunication = false;

    /**
     * JSON template for Communication course sub-fields. Stored at course level
     * so it is consistent across all batches in a program.
     * Default: [{"name":"Grammar","maxScore":20},{"name":"Proactiveness","maxScore":20},{"name":"Fluency","maxScore":10}]
     * Format: [{"name":"<field>","maxScore":<int>}, ...]
     * Null for non-communication courses.
     */
    @Column(columnDefinition = "JSON")
    private String communicationTemplate;

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
