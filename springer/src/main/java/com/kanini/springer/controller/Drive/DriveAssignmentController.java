package com.kanini.springer.controller.Drive;

import com.kanini.springer.dto.Authentication.ApiResponse;
import com.kanini.springer.dto.Drive.*;
import com.kanini.springer.service.Drive.IDriveAssignmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/drive-assignments")
@RequiredArgsConstructor
@Tag(name = "Drive Panel Assignment Management", description = "APIs for managing drive panel assignments")
public class DriveAssignmentController {
    
    private final IDriveAssignmentService driveAssignmentService;
    
    @PostMapping
    @Operation(summary = "Create a drive panel assignment", 
               description = "Creates a single drive panel assignment. " +
                             "Status defaults to PLANNED and isActive defaults to true if not provided.")
    public ResponseEntity<ApiResponse<DriveAssignmentResponse>> createAssignment(@RequestBody DriveAssignmentRequest request) {
        DriveAssignmentResponse response = driveAssignmentService.createAssignment(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Drive assignment created successfully", response));
    }
    
    @PostMapping("/bulk")
    @Operation(summary = "Bulk create drive panel assignments", 
               description = "Creates multiple assignments with same driveId and userId but different applicationIds. " +
                             "Status defaults to PLANNED and isActive defaults to true if not provided.")
    public ResponseEntity<ApiResponse<BulkDriveAssignmentResponse>> bulkCreateAssignments(
            @RequestBody BulkDriveAssignmentRequest request) {
        BulkDriveAssignmentResponse response = driveAssignmentService.bulkCreateAssignments(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Assignments processed successfully", response));
    }
    
    @GetMapping
    @Operation(summary = "Get all drive assignments", 
               description = "Retrieves all drive panel assignments")
    public ResponseEntity<ApiResponse<List<DriveAssignmentResponse>>> getAllAssignments() {
        List<DriveAssignmentResponse> responses = driveAssignmentService.getAllAssignments();
        return ResponseEntity.ok(new ApiResponse<>(true, "Assignments retrieved successfully", responses));
    }
    
    @GetMapping("/{assignmentId}")
    @Operation(summary = "Get assignment by ID", 
               description = "Retrieves a specific drive assignment by its ID")
    public ResponseEntity<ApiResponse<DriveAssignmentResponse>> getAssignmentById(@PathVariable Integer assignmentId) {
        DriveAssignmentResponse response = driveAssignmentService.getAssignmentById(assignmentId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Assignment retrieved successfully", response));
    }
    
    @GetMapping("/drive/{driveId}")
    @Operation(summary = "Get assignments by drive ID", 
               description = "Retrieves all assignments for a specific drive")
    public ResponseEntity<ApiResponse<List<DriveAssignmentResponse>>> getAssignmentsByDriveId(@PathVariable Long driveId) {
        List<DriveAssignmentResponse> responses = driveAssignmentService.getAssignmentsByDriveId(driveId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Assignments retrieved successfully", responses));
    }
    
    @PatchMapping("/{assignmentId}/status")
    @Operation(summary = "Update assignment status", 
               description = "Updates the status of a drive assignment (e.g., PLANNED, DRAFT, SELECTED, REJECTED, CANCELLED)")
    public ResponseEntity<ApiResponse<DriveAssignmentResponse>> updateAssignmentStatus(
            @PathVariable Integer assignmentId,
            @RequestBody DriveAssignmentStatusUpdateRequest request) {
        DriveAssignmentResponse response = driveAssignmentService.updateAssignmentStatus(assignmentId, request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Assignment status updated successfully", response));
    }
    
    @DeleteMapping("/{assignmentId}")
    @Operation(summary = "Soft delete assignment", 
               description = "Toggles the isActive status of an assignment (soft delete)")
    public ResponseEntity<ApiResponse<DriveAssignmentResponse>> deleteAssignment(@PathVariable Integer assignmentId) {
        DriveAssignmentResponse response = driveAssignmentService.deleteAssignment(assignmentId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Assignment status toggled successfully", response));
    }
    
    @DeleteMapping("/bulk")
    @Operation(summary = "Bulk soft delete assignments", 
               description = "Toggles the isActive status of multiple assignments (soft delete)")
    public ResponseEntity<ApiResponse<BulkDriveAssignmentResponse>> bulkDeleteAssignments(
            @RequestBody BulkDeleteAssignmentRequest request) {
        BulkDriveAssignmentResponse response = driveAssignmentService.bulkDeleteAssignments(request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Assignments deletion processed successfully", response));
    }
}
