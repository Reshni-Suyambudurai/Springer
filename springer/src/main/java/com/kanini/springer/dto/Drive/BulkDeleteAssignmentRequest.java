package com.kanini.springer.dto.Drive;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for bulk soft delete of assignments
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkDeleteAssignmentRequest {
    
    private List<Integer> assignmentIds; // required - array of assignment IDs
}
