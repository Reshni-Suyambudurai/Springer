package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Response DTO for bulk drive assignment operations
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkDriveAssignmentResponse {
    
    private List<DriveAssignmentResponse> successfulAssignments = new ArrayList<>();
    private List<String> errorMessages = new ArrayList<>();
    private int totalProcessed;
    private int successCount;
    private int failureCount;
}
