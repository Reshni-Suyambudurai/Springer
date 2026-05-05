package com.kanini.springer.controller.Academy;

import com.kanini.springer.dto.Academy.BatchAllocationRequest;
import com.kanini.springer.dto.Academy.BatchTransferRequest;
import com.kanini.springer.dto.Academy.BatchAllocationResponse;
import com.kanini.springer.dto.Authentication.ApiResponse;
import com.kanini.springer.service.Academy.IBatchAllocationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/academy/batch-allocations")
@RequiredArgsConstructor
@Validated
public class BatchAllocationController {

    private static final String RETRIEVED_SUCCESSFULLY = " retrieved successfully";

    private final IBatchAllocationService allocationService;
    
    @PostMapping
    public ResponseEntity<ApiResponse<BatchAllocationResponse>> createAllocation(
            @Valid @RequestBody BatchAllocationRequest request) {
        BatchAllocationResponse response = allocationService.createAllocation(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Batch allocation created successfully", response));
    }
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<BatchAllocationResponse>>> getAllAllocations() {
        List<BatchAllocationResponse> response = allocationService.getAllAllocations();
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("All allocations retrieved successfully", response));
    }
    
    @GetMapping("/{studentId}")
    public ResponseEntity<ApiResponse<BatchAllocationResponse>> getAllocationById(
            @PathVariable Long studentId) {
        BatchAllocationResponse response = allocationService.getAllocationById(studentId);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Allocation retrieved successfully", response));
    }
    
    @GetMapping("/program/{programId}/filtered")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<BatchAllocationResponse>>> getAllocationsByProgramFiltered(
            @PathVariable Integer programId,
            @RequestParam(required = false) Integer batchNumber,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var result = allocationService.getAllocationsByProgramFiltered(programId, batchNumber, isActive, search, page, size);
        return ResponseEntity.ok(ApiResponse.success("Allocations retrieved", result));
    }

    @GetMapping("/program/{programId}")
    public ResponseEntity<ApiResponse<List<BatchAllocationResponse>>> getAllocationsByProgram(
            @PathVariable Integer programId,
            @RequestParam(required = false) Boolean isActive) {
        List<BatchAllocationResponse> response = isActive != null
                ? allocationService.getAllocationsByProgram(programId, isActive)
                : allocationService.getAllocationsByProgram(programId);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Allocations for program " + programId + RETRIEVED_SUCCESSFULLY, response));
    }
    
    @GetMapping("/program/{programId}/batch/{batchNumber}")
    public ResponseEntity<ApiResponse<List<BatchAllocationResponse>>> getAllocationsByBatch(
            @PathVariable Integer programId,
            @PathVariable Integer batchNumber) {
        List<BatchAllocationResponse> response = allocationService.getAllocationsByBatch(programId, batchNumber);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Allocations for batch " + batchNumber + RETRIEVED_SUCCESSFULLY, response));
    }
    
    @PatchMapping("/{studentId}")
    public ResponseEntity<ApiResponse<BatchAllocationResponse>> updateAllocation(
            @PathVariable Long studentId,
            @Valid @RequestBody BatchAllocationRequest request) {
        BatchAllocationResponse response = allocationService.updateAllocation(studentId, request);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Batch allocation updated successfully", response));
    }
    
    @DeleteMapping("/{studentId}")
    public ResponseEntity<ApiResponse<String>> deleteAllocation(@PathVariable Long studentId) {
        allocationService.deleteAllocation(studentId);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Batch allocation deleted successfully", null));
    }
    
    @PatchMapping("/{studentId}/mark-ready")
    public ResponseEntity<ApiResponse<BatchAllocationResponse>> markProjectReady(
            @PathVariable Long studentId) {
        BatchAllocationResponse response = allocationService.markProjectReady(studentId);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Student marked as project ready", response));
    }

    /**
     * Transfer a student from their current batch to a new batch.
     * Old allocation is deactivated; new allocation is created in the target batch.
     * Overall score is recalculated using best-score-per-course across all allocations.
     * Attendance starts fresh from zero in the new batch.
     */
    @PatchMapping("/{studentId}/transfer")
    public ResponseEntity<ApiResponse<BatchAllocationResponse>> transferStudent(
            @PathVariable Long studentId,
            @Valid @RequestBody BatchTransferRequest request) {
        BatchAllocationResponse response = allocationService.transferStudent(studentId, request);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Student transferred successfully", response));
    }
}
