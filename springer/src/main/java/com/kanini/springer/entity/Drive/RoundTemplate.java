package com.kanini.springer.entity.Drive;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

import com.kanini.springer.entity.HiringReq.User;

/**
 * All the rounds will be stored here
 */
@Entity
@Table(name = "round_templates",
    indexes = {
     
        @Index(name = "idx_round_template_active", columnList = "isActive"),
  
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoundTemplate {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long roundConfigId;
    
    private Integer roundNo; // 1/2/3...
    
    private String roundName; // technical round, communication round
    
    private Integer outoffScore; // e.g., 100
    
    private Integer minScore; // e.g., 80
    
    private Integer weightage; // e.g., 0.4
    
    @Column(columnDefinition = "JSON")
    private String sections; // can be null - sub-category marks like {apptitude, logical, problem-solving, verbal}
    
    private Boolean isActive; // is this round active
    
    private LocalDateTime createdAt;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;
    
    
    @OneToMany(mappedBy = "roundConfig", cascade = CascadeType.ALL)
    private List<CandidateEvaluation> candidateEvaluations;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
