package com.kanini.springer.controller.Academy;

import com.kanini.springer.dto.Academy.BatchAllocationRequest;
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
    
    @GetMapping("/program/{programId}")
    public ResponseEntity<ApiResponse<List<BatchAllocationResponse>>> getAllocationsByProgram(
            @PathVariable Integer programId) {
        List<BatchAllocationResponse> response = allocationService.getAllocationsByProgram(programId);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Allocations for program " + programId + " retrieved successfully", response));
    }
    
    @GetMapping("/program/{programId}/batch/{batchNumber}")
    public ResponseEntity<ApiResponse<List<BatchAllocationResponse>>> getAllocationsByBatch(
            @PathVariable Integer programId,
            @PathVariable Integer batchNumber) {
        List<BatchAllocationResponse> response = allocationService.getAllocationsByBatch(programId, batchNumber);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Allocations for batch " + batchNumber + " retrieved successfully", response));
    }
    
    @GetMapping("/candidate/{candidateId}")
    public ResponseEntity<ApiResponse<List<BatchAllocationResponse>>> getAllocationsByCandidate(
            @PathVariable Long candidateId) {
        List<BatchAllocationResponse> response = allocationService.getAllocationsByCandidate(candidateId);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Allocations for candidate " + candidateId + " retrieved successfully", response));
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
    
    @GetMapping("/program/{programId}/min-attendance/{minPercentage}")
    public ResponseEntity<ApiResponse<List<BatchAllocationResponse>>> getAllocationsByMinAttendance(
            @PathVariable Integer programId,
            @PathVariable double minPercentage) {
        List<BatchAllocationResponse> response = allocationService.getAllocationsByMinAttendance(programId, minPercentage);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Allocations with minimum attendance " + minPercentage + "% retrieved", response));
    }
    
    @PatchMapping("/{studentId}/mark-ready")
    public ResponseEntity<ApiResponse<BatchAllocationResponse>> markProjectReady(
            @PathVariable Long studentId) {
        BatchAllocationResponse response = allocationService.markProjectReady(studentId);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Student marked as project ready", response));
    }
}
