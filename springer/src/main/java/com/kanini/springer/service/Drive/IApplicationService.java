package com.kanini.springer.service.Drive;

import com.kanini.springer.dto.Drive.ApplicationRequest;
import com.kanini.springer.dto.Drive.ApplicationResponse;
import com.kanini.springer.dto.Drive.ApplicationStatusUpdateRequest;
import com.kanini.springer.dto.Drive.BulkApplicationResponse;
import com.kanini.springer.dto.Drive.BulkApplicationStatusUpdateRequest;
import com.kanini.springer.dto.Drive.BulkApplicationStatusUpdateResponse;

import java.util.List;
import java.util.Map;

/**
 * Service interface for Application operations
 */
public interface IApplicationService {
    
    /**
     * Create applications for candidates
     * Validates: candidateStatus = SHORTLISTED and isEligible = true
     * Actions: 
     * - Creates application with IN_DRIVE status and GUID registration code
     * - Updates candidate status to SCHEDULED
     * 
     * @param request Application creation request with driveId, candidateIds, createdBy
     * @return BulkApplicationResponse with successful applications and errors
     */
    BulkApplicationResponse createApplications(ApplicationRequest request);
    
    /**
     * Get all applications
     * @return List of ApplicationResponse
     */
    List<ApplicationResponse> getAllApplications();
    
    /**
     * Get applications by drive ID
     * @param driveId Drive ID
     * @return List of ApplicationResponse for the specified drive
     */
    List<ApplicationResponse> getApplicationsByDriveId(Long driveId);
    
    /**
     * Update application status
     * @param applicationId Application ID to update
     * @param request Status update request
     * @return ApplicationResponse with updated status
     */
    ApplicationResponse updateApplicationStatus(Long applicationId, ApplicationStatusUpdateRequest request);
    
    /**
     * Bulk update application statuses and corresponding candidate statuses
     * Rules:
     * - If application status = SELECTED → candidate status = SELECTED
     * - If application status = FAILED or DROPPED → candidate status = REJECTED
     * 
     * @param request Bulk status update request with list of application IDs and statuses
     * @return BulkApplicationStatusUpdateResponse with successful updates and errors
     */
    BulkApplicationStatusUpdateResponse bulkUpdateApplicationStatus(BulkApplicationStatusUpdateRequest request);

    /**
     * Get all distinct batch times for a drive, each mapped to the list of applications in that batch.
     * Null batchTime applications are grouped under the key "UNSCHEDULED".
     *
     * @param driveId Drive ID
     * @return Map of batchTime string → list of ApplicationResponse
     */
    Map<String, List<ApplicationResponse>> getBatchCandidatesByDriveId(Long driveId);
}
