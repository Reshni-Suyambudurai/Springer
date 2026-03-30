package com.kanini.springer.controller.Drive;

import com.kanini.springer.dto.Authentication.ApiResponse;
import com.kanini.springer.dto.Drive.CandidateEvaluationSummaryResponse;
import com.kanini.springer.dto.Drive.DriveRequest;
import com.kanini.springer.dto.Drive.DriveResponse;
import com.kanini.springer.dto.Drive.DriveUpdateRequest;
import com.kanini.springer.service.Drive.ICandidateEvaluationService;
import com.kanini.springer.service.Drive.IDriveScheduleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/drive-schedules")
@RequiredArgsConstructor
@Tag(name = "Drive Schedule Management", description = "APIs for managing drive schedules and rounds")
public class DriveScheduleController {
    
    private final IDriveScheduleService driveScheduleService;
    private final ICandidateEvaluationService evaluationService;
    
    @PostMapping
    @Operation(summary = "Create a new drive schedule", 
               description = "Creates a new drive schedule with optional round configurations. " +
                             "Drive status defaults to PLANNED if not provided. " +
                             "eligibilityLocked defaults to false.")
    public ResponseEntity<ApiResponse<DriveResponse>> createDrive(@RequestBody DriveRequest request) {
        DriveResponse response = driveScheduleService.createDrive(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Drive schedule created successfully", response));
    }
    
    @GetMapping("/{driveId}")
    @Operation(summary = "Get drive schedule by ID", 
               description = "Retrieves a specific drive schedule by ID with associated drive rounds")
    public ResponseEntity<ApiResponse<DriveResponse>> getDriveById(@PathVariable Long driveId) {
        DriveResponse response = driveScheduleService.getDriveById(driveId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Drive schedule retrieved successfully", response));
    }
    
    @GetMapping
    @Operation(summary = "Get all drive schedules", 
               description = "Retrieves all drive schedules (without drive rounds for performance)")
    public ResponseEntity<ApiResponse<List<DriveResponse>>> getAllDrives() {
        List<DriveResponse> responses = driveScheduleService.getAllDrives();
        return ResponseEntity.ok(new ApiResponse<>(true, "Drive schedules retrieved successfully", responses));
    }
    
    @PatchMapping("/{driveId}")
    @Operation(summary = "Update drive schedule", 
               description = "Updates a drive schedule including drive rounds. " +
                             "When updating, updatedAt and updatedBy fields are automatically set.")
    public ResponseEntity<ApiResponse<DriveResponse>> updateDrive(
            @PathVariable Long driveId,
            @RequestBody DriveUpdateRequest request) {
        DriveResponse response = driveScheduleService.updateDrive(driveId, request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Drive schedule updated successfully", response));
    }
    
    @GetMapping("/{driveId}/evaluations-summary")
    @Operation(summary = "Get candidate evaluations summary by drive ID", 
               description = "Retrieves all candidates in the drive with their round-wise evaluation scores. " +
                             "Returns candidate name, application ID, and array of evaluations with " +
                             "roundConfigId, roundName, score, review, and status for each round.")
    public ResponseEntity<ApiResponse<List<CandidateEvaluationSummaryResponse>>> getEvaluationsSummaryByDriveId(
            @PathVariable Long driveId) {
        List<CandidateEvaluationSummaryResponse> responses = evaluationService.getEvaluationsSummaryByDriveId(driveId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Evaluations summary retrieved successfully", responses));
    }
}

