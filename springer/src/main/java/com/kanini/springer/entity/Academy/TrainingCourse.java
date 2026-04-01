package com.kanini.springer.entity.Academy;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

import com.kanini.springer.entity.HiringReq.User;
import com.kanini.springer.entity.enums.Enums.CourseStatus;

/**
 * The course and the duration for the program is planned here
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
    
    private String courseName; // ex: Angular, React,...
    
    @Column(columnDefinition = "TEXT")
    private String description; // like what all need to cover in this course
    
    private LocalDateTime startDate;
    
    private LocalDateTime endDate;
    
    private Integer minScore;
    
    private Integer weightage;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conducted_by")
    private User conductedBy; // trainer
    
    @Enumerated(EnumType.STRING)
    private CourseStatus status;
    
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
