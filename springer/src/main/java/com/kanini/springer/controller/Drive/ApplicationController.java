package com.kanini.springer.controller.Drive;

import com.kanini.springer.dto.Authentication.ApiResponse;
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
import com.kanini.springer.service.Drive.IApplicationService;
import com.kanini.springer.dto.Drive.OverrideDriveStatusRequest;
import com.kanini.springer.entity.enums.Enums.ApplicationStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
@Tag(name = "Application Management", description = "APIs for managing drive applications")
public class ApplicationController {
    
    private final IApplicationService applicationService;
    
    @PostMapping
    @Operation(summary = "Create applications for candidates", 
               description = "Creates applications for candidates in a drive. " +
                             "Validates that candidates have status=SHORTLISTED and isEligible=true. " +
                             "Successful candidates get applicationStatus=IN_DRIVE, registrationCode (GUID), " +
                             "and their candidate status is updated to SCHEDULED.")
    public ResponseEntity<ApiResponse<BulkApplicationResponse>> createApplications(@RequestBody ApplicationRequest request) {
        BulkApplicationResponse response = applicationService.createApplications(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Applications processed successfully", response));
    }
    
    @GetMapping
    @Operation(summary = "Get all applications", 
               description = "Retrieves all applications across all drives")
    public ResponseEntity<ApiResponse<List<ApplicationResponse>>> getAllApplications() {
        List<ApplicationResponse> responses = applicationService.getAllApplications();
        return ResponseEntity.ok(new ApiResponse<>(true, "Applications retrieved successfully", responses));
    }
    
    @GetMapping("/drive/{driveId}")
    @Operation(summary = "Get applications by drive ID", 
               description = "Retrieves all applications for a specific drive")
    public ResponseEntity<ApiResponse<List<ApplicationResponse>>> getApplicationsByDriveId(@PathVariable Long driveId) {
        List<ApplicationResponse> responses = applicationService.getApplicationsByDriveId(driveId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Applications retrieved successfully", responses));
    }
    
    @PatchMapping("/{applicationId}/status")
    @Operation(summary = "Update application status", 
               description = "Updates the status of an application (e.g., IN_DRIVE, DROPPED, PASSED, FAILED, SELECTED)")
    public ResponseEntity<ApiResponse<ApplicationResponse>> updateApplicationStatus(
            @PathVariable Long applicationId,
            @RequestBody ApplicationStatusUpdateRequest request) {
        ApplicationResponse response = applicationService.updateApplicationStatus(applicationId, request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Application status updated successfully", response));
    }
    
    @PatchMapping("/bulk/status")
    @Operation(summary = "Bulk update application statuses",
               description = "Updates the status of multiple applications and corresponding candidate statuses. " +
                             "Rules: " +
                             "- If application status = SELECTED → candidate status = SELECTED. " +
                             "- If application status = FAILED or DROPPED → candidate status = REJECTED.")
    public ResponseEntity<ApiResponse<BulkApplicationStatusUpdateResponse>> bulkUpdateApplicationStatus(
            @RequestBody BulkApplicationStatusUpdateRequest request) {
        BulkApplicationStatusUpdateResponse response = applicationService.bulkUpdateApplicationStatus(request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Bulk application status update processed successfully", response));
    }

    @GetMapping("/drive/{driveId}/batch-times")
    @Operation(summary = "Get distinct batch times for a drive",
               description = "Returns all distinct non-null batch times for the given drive, sorted ascending.")
    public ResponseEntity<ApiResponse<List<String>>> getDistinctBatchTimes(@PathVariable Long driveId) {
        List<String> batchTimes = applicationService.getDistinctBatchTimesByDriveId(driveId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Batch times retrieved successfully", batchTimes));
    }

    @PatchMapping("/batch-time-update")
    @Operation(summary = "Update batch time of an application",
               description = "Updates batchTime for a specific application. Validates driveId, applicationId and oldBatchTime match.")
    public ResponseEntity<ApiResponse<ApplicationResponse>> updateBatchTime(
            @RequestBody BatchTimeUpdateRequest request) {
        ApplicationResponse response = applicationService.updateApplicationBatchTime(request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Batch time updated successfully", response));
    }

    @GetMapping("/drive/{driveId}/batches")
    @Operation(summary = "Get batch-wise application IDs for a drive",
               description = "Returns a map of batchTime → list of application IDs for that batch. " +
                             "Applications with no batchTime are grouped under the key 'UNSCHEDULED'.")
    public ResponseEntity<ApiResponse<Map<String, List<Long>>>> getBatchCandidatesByDriveId(
            @PathVariable Long driveId) {
        Map<String, List<Long>> batchMap = applicationService.getBatchCandidatesByDriveId(driveId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Batch candidates retrieved successfully", batchMap));
    }

    @GetMapping("/drive/{driveId}/candidate/{candidateId}/history")
    @Operation(summary = "Get candidate history in a drive",
               description = "Retrieves full candidate history including drive info, application details, " +
                             "panel assignments, and all evaluations for a specific candidate in a specific drive.")
    public ResponseEntity<ApiResponse<CandidateHistoryResponse>> getCandidateHistory(
            @PathVariable Long driveId, @PathVariable Long candidateId) {
        CandidateHistoryResponse response = applicationService.getCandidateHistory(driveId, candidateId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Candidate history retrieved successfully", response));
    }

    @PatchMapping("/override-status")
    @Operation(summary = "Override application drive status",
               description = "Manually overrides the application status with a reason. Logs to manual_override table.")
    public ResponseEntity<ApiResponse<ApplicationResponse>> overrideDriveStatus(
            @RequestBody OverrideDriveStatusRequest request) {
        ApplicationStatus status = ApplicationStatus.valueOf(request.getStatus());
        ApplicationResponse response = applicationService.overrideDriveStatus(
                request.getApplicationId(), status, request.getReason(), request.getUserId());
        return ResponseEntity.ok(new ApiResponse<>(true, "Application status overridden successfully", response));
    }
    
    @PostMapping("/finalize")
    @Operation(summary = "Finalize applications - Apply application status to candidate stages",
               description = "Updates candidate applicationStage based on application status. " +
                             "Mapping: SELECTED→SELECTED, FAILED→REJECTED, DROPPED→DROPPED, ALLOTED/IN_DRIVE→REJECTED")
    public ResponseEntity<ApiResponse<FinalizeApplicationsResponse>> finalizeApplications(
            @RequestBody FinalizeApplicationsRequest request) {
        FinalizeApplicationsResponse response = applicationService.finalizeApplications(request);
        return ResponseEntity.ok(new ApiResponse<>(true, 
                "Applications finalized successfully. " + response.getUpdatedCount() + " candidates updated.", 
                response));
    }
}
