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
public class VerificationResponse {
    
    private Long documentId;
    
    private Long candidateId;
    
    private String documentType;
    
    private String verificationStatus;
    
    private LocalDateTime verifiedAt;
    
    private Long verifiedBy;
    
    private String rejectionReason;
    
    private String comment;
}
