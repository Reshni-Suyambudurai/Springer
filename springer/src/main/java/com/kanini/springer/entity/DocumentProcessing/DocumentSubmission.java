package com.kanini.springer.entity.DocumentProcessing;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

import com.kanini.springer.entity.Drive.Candidate;
import com.kanini.springer.entity.HiringReq.HiringCycle;
import com.kanini.springer.entity.enums.Enums.VerificationStatus;

/**
 * Each doc submitted by the selected candidates
 */
@Entity
@Table(name = "document_submissions",
    indexes = {
        @Index(name = "idx_doc_candidate_id", columnList = "candidate_id"),
      }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentSubmission {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer candidateDocumentId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_type_id")
    private DocumentType documentType;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id")
    private Candidate candidate;
    
    private Long uploadedNo; // file reg no
    
    @Lob
    private byte[] uploadedFile; // file data or path
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cycle_id")
    private HiringCycle cycle; // can be derived via drive
    
    @Enumerated(EnumType.STRING)
    private VerificationStatus verificationStatus;
    
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
