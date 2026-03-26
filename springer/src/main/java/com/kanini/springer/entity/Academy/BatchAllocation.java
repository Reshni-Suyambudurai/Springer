package com.kanini.springer.entity.Academy;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.kanini.springer.entity.Drive.Candidate;
import com.kanini.springer.entity.enums.Enums.Performance;

/**
 * It links the selected candidates to the course and program for a year
 */
@Entity
@Table(name = "batch_allocations",
    indexes = {
        @Index(name = "idx_batch_program_id", columnList = "program_id"),
    },
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_program_candidate", columnNames = {"program_id", "candidate_id"})
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BatchAllocation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long studentId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "program_id")
    private TrainingProgram program;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id")
    private Candidate candidate;
    
    @Lob //Large Object. Used to store large data like images, videos, etc.
    private byte[] image;
    
    private Integer batchNumber;
    
    @Column(precision = 5, scale = 2)//precision = total digits, scale = digits after decimal   
    private BigDecimal attendancePercentage;
    
    private Boolean isActive; // true=in training
    
    @Enumerated(EnumType.STRING)
    private Performance performance; // GOOD, EXCELLENT, NEED_LEARNING, DROPPED, PROJECT_READY
    
    private LocalDateTime createdAt;
    
    @OneToMany(mappedBy = "student", cascade = CascadeType.ALL)
    private List<TrainingScore> trainingScores;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
