package com.kanini.springer.dto.DocumentCollection;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentCompletionResponse {
    
    private Long candidateId;
    
    private String candidateName;
    
    private Long cycleId;
    
    private Integer completePercentage;
    
    private Integer totalRequired;
    
    private Integer totalApproved;
    
    private Integer totalPending;
    
    private Integer totalRejected;
    
    private List<DocumentStatusDetail> documents;
    
    private Boolean isOfferReady;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DocumentStatusDetail {
        private String documentType;
        private String status;
        private String verifiedAt;
    }
}
