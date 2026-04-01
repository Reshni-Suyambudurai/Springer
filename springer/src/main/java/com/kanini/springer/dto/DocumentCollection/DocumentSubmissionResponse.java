package com.kanini.springer.dto.DocumentCollection;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentSubmissionResponse {
    
    private Long documentId;
    
    private Long candidateId;
    
    private String candidateName;
    
    private String documentType;
    
    private Long cycleId;
    
    private String verificationStatus;
    
    private LocalDateTime uploadedAt;
    
    private LocalDateTime verifiedAt;
    
    private Long verifiedBy;
}
