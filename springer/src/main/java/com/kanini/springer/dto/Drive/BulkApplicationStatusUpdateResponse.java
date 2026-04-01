package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Response DTO for bulk application status updates
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkApplicationStatusUpdateResponse {
    
    /**
     * Total number of applications processed
     */
    private int totalProcessed;
    
    /**
     * Number of successfully updated applications
     */
    private int successCount;
    
    /**
     * Number of failed updates
     */
    private int failureCount;
    
    /**
     * List of successfully updated applications
     */
    private List<ApplicationResponse> successfulUpdates = new ArrayList<>();
    
    /**
     * List of error messages for failed updates
     */
    private List<String> errorMessages = new ArrayList<>();
}
