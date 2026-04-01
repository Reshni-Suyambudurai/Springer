package com.kanini.springer.controller.Drive;

import com.kanini.springer.dto.Authentication.ApiResponse;
import com.kanini.springer.dto.Drive.ApplicationRequest;
import com.kanini.springer.dto.Drive.ApplicationResponse;
import com.kanini.springer.dto.Drive.ApplicationStatusUpdateRequest;
import com.kanini.springer.dto.Drive.BulkApplicationResponse;
import com.kanini.springer.dto.Drive.BulkApplicationStatusUpdateRequest;
import com.kanini.springer.dto.Drive.BulkApplicationStatusUpdateResponse;
import com.kanini.springer.service.Drive.IApplicationService;
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

    @GetMapping("/drive/{driveId}/batches")
    @Operation(summary = "Get batch-wise candidates for a drive",
               description = "Returns a map of batchTime → list of applications for that batch. " +
                             "Applications with no batchTime are grouped under the key 'UNSCHEDULED'.")
    public ResponseEntity<ApiResponse<Map<String, List<ApplicationResponse>>>> getBatchCandidatesByDriveId(
            @PathVariable Long driveId) {
        Map<String, List<ApplicationResponse>> batchMap = applicationService.getBatchCandidatesByDriveId(driveId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Batch candidates retrieved successfully", batchMap));
    }
}
