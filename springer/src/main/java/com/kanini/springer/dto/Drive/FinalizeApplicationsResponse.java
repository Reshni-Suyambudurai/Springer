package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response DTO for finalizing applications
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FinalizeApplicationsResponse {
    
    private Integer updatedCount;
    private List<ApplicationUpdateDetail> details;
    
    /**
     * Details of each application update
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApplicationUpdateDetail {
        private Long applicationId;
        private Long candidateId;
        private String candidateName;
        private String previousStage;
        private String newStage;
        private String applicationStatus;
    }
}
