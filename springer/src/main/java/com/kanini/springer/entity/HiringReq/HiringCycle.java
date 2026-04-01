package com.kanini.springer.entity.HiringReq;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

import com.kanini.springer.entity.DocumentProcessing.DocumentSubmission;
import com.kanini.springer.entity.DocumentProcessing.OfferLetter;
import com.kanini.springer.entity.Drive.Drive;
import com.kanini.springer.entity.Academy.TrainingProgram;
import com.kanini.springer.entity.enums.Enums.CycleStatus;

/**
 * To store the hiring cycle for each year
 */
@Entity
@Table(name = "hiring_cycles",
    indexes = {
        @Index(name = "idx_cycle_year", columnList = "cycleYear")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HiringCycle {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long cycleId;
    
    private Integer cycleYear; // e.g., 2026
    
    private String cycleName;
    
    private Integer compensationBand;
    
    @Lob
    private byte[] jd; // Job description as blob
    
    private Integer budget;
    
    @Enumerated(EnumType.STRING)
    private CycleStatus status;
    
    private LocalDateTime createdAt;
    
    @OneToMany(mappedBy = "cycle", cascade = CascadeType.ALL)
    private List<HiringDemand> hiringDemands;
    
    @OneToMany(mappedBy = "cycle", cascade = CascadeType.ALL)
    private List<Drive> drives;
    
    @OneToMany(mappedBy = "cycle", cascade = CascadeType.ALL)
    private List<DocumentSubmission> documentSubmissions;
    
    @OneToMany(mappedBy = "cycle", cascade = CascadeType.ALL)
    private List<OfferLetter> offerLetters;
    
    @OneToMany(mappedBy = "cycle", cascade = CascadeType.ALL)
    private List<TrainingProgram> trainingPrograms;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
