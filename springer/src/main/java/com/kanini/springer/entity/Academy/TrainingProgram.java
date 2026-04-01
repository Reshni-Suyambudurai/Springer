package com.kanini.springer.entity.Academy;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

import com.kanini.springer.entity.HiringReq.HiringCycle;

/**
 * We start the training program for the candidates
 */
@Entity
@Table(name = "training_programs",
    indexes = {     
      
        @Index(name = "idx_program_location", columnList = "location"),
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrainingProgram {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer programId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cycle_id")
    private HiringCycle cycle;
    
    private String programName; // like 2025 Hiring
    
    private Integer programYear; // should match cycle_year typically
    
    private Integer capacity;
    
    private Integer numberOfBatches;
    
    private String location; // training planned location ie bangalore or chennai

    private boolean status;
    
    private LocalDateTime createdAt;
    
    @OneToMany(mappedBy = "program", cascade = CascadeType.ALL)
    private List<BatchAllocation> batchAllocations;
    
    @OneToMany(mappedBy = "program", cascade = CascadeType.ALL)
    private List<BatchCourse> batchCourses;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
