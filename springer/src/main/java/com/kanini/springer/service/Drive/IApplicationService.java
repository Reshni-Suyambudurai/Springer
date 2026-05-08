package com.kanini.springer.service.Drive;

import com.kanini.springer.dto.Drive.ApplicationRequest;
import com.kanini.springer.dto.Drive.ApplicationResponse;
import com.kanini.springer.dto.Drive.ApplicationStatusUpdateRequest;
import com.kanini.springer.dto.Drive.BatchTimeUpdateRequest;
import com.kanini.springer.dto.Drive.BulkApplicationResponse;
import com.kanini.springer.dto.Drive.BulkApplicationStatusUpdateRequest;
import com.kanini.springer.dto.Drive.BulkApplicationStatusUpdateResponse;
import com.kanini.springer.dto.Drive.CandidateHistoryResponse;
import com.kanini.springer.dto.Drive.FinalizeApplicationsRequest;
import com.kanini.springer.dto.Drive.FinalizeApplicationsResponse;
import com.kanini.springer.entity.enums.Enums.ApplicationStatus;

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
     * Get all distinct batch times for a drive, each mapped to the list of application IDs in that batch.
     * Null batchTime applications are grouped under the key "UNSCHEDULED".
     *
     * @param driveId Drive ID
     * @return Map of batchTime string → list of application IDs
     */
    Map<String, List<Long>> getBatchCandidatesByDriveId(Long driveId);

    /**
     * Get candidate history for a specific drive and candidate.
     * Includes drive info, application details, panel assignments, and evaluations.
     *
     * @param driveId Drive ID
     * @param candidateId Candidate ID
     * @return CandidateHistoryResponse with full history
     */
    CandidateHistoryResponse getCandidateHistory(Long driveId, Long candidateId);

    /**
     * Override the application status with a reason, logged to manual_override.
     */
    ApplicationResponse overrideDriveStatus(Long applicationId, ApplicationStatus status, String reason, Long userId);

    /**
     * Get all distinct non-null batch times for a drive.
     */
    List<String> getDistinctBatchTimesByDriveId(Long driveId);

    /**
     * Update batch time of an application after validating driveId, applicationId,
     * and matching old batch time.
     */
    ApplicationResponse updateApplicationBatchTime(BatchTimeUpdateRequest request);
    
    /**
     * Finalize applications - Apply application status to candidate stages
     * Maps application status to candidate application stage:
     * - SELECTED → SELECTED
     * - FAILED → REJECTED
     * - DROPPED → DROPPED
     * - ALLOTED, IN_DRIVE → REJECTED
     * 
     * @param request FinalizeApplicationsRequest with list of application IDs
     * @return FinalizeApplicationsResponse with update counts and details
     */
    FinalizeApplicationsResponse finalizeApplications(FinalizeApplicationsRequest request);
}
