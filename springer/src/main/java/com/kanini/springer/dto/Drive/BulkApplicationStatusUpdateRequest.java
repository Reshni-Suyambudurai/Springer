package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for bulk application status updates.
 * Status and updatedBy are common for the entire batch — only the application IDs differ.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkApplicationStatusUpdateRequest {
    
    /**
     * List of application IDs to update
     */
    private List<Long> applicationIds;
    
    /**
     * New application status to apply to all (e.g. IN_DRIVE, SELECTED, FAILED, DROPPED)
     */
    private String applicationStatus;
    
    /**
     * User ID who is performing the update
     */
    private Long updatedBy;
}
