package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for bulk application status updates
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkApplicationStatusUpdateRequest {
    
    /**
     * List of application status update data
     */
    private List<ApplicationStatusData> applications;
    
    /**
     * User ID who is performing the update
     */
    private Long updatedBy;
    
    /**
     * Nested class for individual application status data
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApplicationStatusData {
        /**
         * Application ID to update
         */
        private Long applicationId;
        
        /**
         * New application status (e.g., SELECTED, FAILED, DROPPED)
         */
        private String applicationStatus;
    }
}
