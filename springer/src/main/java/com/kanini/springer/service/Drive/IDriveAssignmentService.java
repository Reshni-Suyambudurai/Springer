package com.kanini.springer.service.Drive;

import com.kanini.springer.dto.Drive.*;

import java.util.List;

/**
 * Service interface for Drive Assignment operations
 */
public interface IDriveAssignmentService {
    
    /**
     * Create a single drive assignment
     * @param request Assignment creation request
     * @return DriveAssignmentResponse with created assignment details
     */
    DriveAssignmentResponse createAssignment(DriveAssignmentRequest request);
    
    /**
     * Bulk create drive assignments with same driveId and userId but different applicationIds
     * @param request Bulk assignment creation request
     * @return BulkDriveAssignmentResponse with successful assignments and errors
     */
    BulkDriveAssignmentResponse bulkCreateAssignments(BulkDriveAssignmentRequest request);
    
    /**
     * Get all drive assignments
     * @return List of DriveAssignmentResponse
     */
    List<DriveAssignmentResponse> getAllAssignments();
    
    /**
     * Get assignment by ID
     * @param assignmentId Assignment ID
     * @return DriveAssignmentResponse
     */
    DriveAssignmentResponse getAssignmentById(Integer assignmentId);
    
    /**
     * Get assignments by drive ID
     * @param driveId Drive ID
     * @return List of DriveAssignmentResponse for the specified drive
     */
    List<DriveAssignmentResponse> getAssignmentsByDriveId(Long driveId);
    
    /**
     * Update assignment status
     * @param assignmentId Assignment ID to update
     * @param request Status update request
     * @return DriveAssignmentResponse with updated status
     */
    DriveAssignmentResponse updateAssignmentStatus(Integer assignmentId, DriveAssignmentStatusUpdateRequest request);
    
    /**
     * Soft delete assignment by toggling isActive
     * @param assignmentId Assignment ID
     * @return DriveAssignmentResponse with updated isActive status
     */
    DriveAssignmentResponse deleteAssignment(Integer assignmentId);
    
    /**
     * Bulk soft delete assignments
     * @param request Bulk delete request with assignment IDs
     * @return BulkDriveAssignmentResponse with results
     */
    BulkDriveAssignmentResponse bulkDeleteAssignments(BulkDeleteAssignmentRequest request);
}
