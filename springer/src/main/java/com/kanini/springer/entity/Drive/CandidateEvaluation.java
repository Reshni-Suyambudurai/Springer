package com.kanini.springer.entity.Drive;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

import com.kanini.springer.entity.HiringReq.User;
import com.kanini.springer.entity.enums.Enums.EvaluationStatus;

/**
 * For each candidate for each round score,review,.. are entered here
 */
@Entity
@Table(name = "candidates_evaluations",
    indexes = {
        @Index(name = "idx_eval_application_id", columnList = "application_id"),
        @Index(name = "idx_eval_round_config_id", columnList = "round_config_id"),
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CandidateEvaluation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long scoreId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id")
    private Application application;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "round_config_id")
    private RoundTemplate roundConfig;
    
    private Integer score; // score for each round
    
    @Column(columnDefinition = "JSON")
    private String sectionScore; // to store the section scores if available
    
    @Column(columnDefinition = "TEXT")
    private String review; // can be null - review given by the panel member
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy; // panel member
    
    private LocalDateTime reviewedAt;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EvaluationStatus status;
    
    @PrePersist
    protected void onCreate() {
        reviewedAt = LocalDateTime.now();
    }
}
