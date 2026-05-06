package com.kanini.springer.controller.Academy;

import com.kanini.springer.dto.Academy.LeaveRequestRequest;
import com.kanini.springer.dto.Academy.LeaveRequestResponse;
import com.kanini.springer.dto.Academy.LeaveReviewRequest;
import com.kanini.springer.dto.Authentication.ApiResponse;
import com.kanini.springer.service.Academy.ILeaveRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/academy/leaves")
@RequiredArgsConstructor
public class LeaveRequestController {

    private final ILeaveRequestService leaveService;

    @PreAuthorize("hasAnyRole('INTERN')")
    @PostMapping
    public ResponseEntity<ApiResponse<LeaveRequestResponse>> applyLeave(
            @Valid @RequestBody LeaveRequestRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Leave request submitted", leaveService.applyLeave(request)));
    }

    @PreAuthorize("hasAnyRole('TRAINING_COORDINATOR','TA_MANAGER','TA_HEAD')")
    @GetMapping
    public ResponseEntity<ApiResponse<List<LeaveRequestResponse>>> getAllLeaves() {
        return ResponseEntity.ok(ApiResponse.success("All leaves retrieved", leaveService.getAllLeaves()));
    }

    @PreAuthorize("hasAnyRole('TRAINING_COORDINATOR','TA_MANAGER','TA_HEAD')")
    @GetMapping("/filtered")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<LeaveRequestResponse>>> getLeavesFiltered(
            @RequestParam(required = false) Integer programId,
            @RequestParam(required = false) Integer batchNumber,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var result = leaveService.getLeavesFiltered(programId, batchNumber, status, search, page, size);
        return ResponseEntity.ok(ApiResponse.success("Leaves retrieved", result));
    }

    @PreAuthorize("hasAnyRole('TRAINING_COORDINATOR','TA_MANAGER','TA_HEAD')")
    @GetMapping("/batch")
    public ResponseEntity<ApiResponse<List<LeaveRequestResponse>>> getByBatch(
            @RequestParam Integer programId,
            @RequestParam Integer batchNumber) {
        return ResponseEntity.ok(ApiResponse.success("Batch leaves retrieved",
                leaveService.getLeavesByBatch(programId, batchNumber)));
    }

    @PreAuthorize("hasAnyRole('INTERN','TRAINING_COORDINATOR','TA_MANAGER','TA_HEAD')")
    @GetMapping("/student/{studentId}")
    public ResponseEntity<ApiResponse<List<LeaveRequestResponse>>> getByStudent(
            @PathVariable Long studentId) {
        return ResponseEntity.ok(ApiResponse.success("Leaves retrieved", leaveService.getLeavesByStudent(studentId)));
    }

    @PreAuthorize("hasAnyRole('INTERN','TRAINING_COORDINATOR','TA_MANAGER','TA_HEAD')")
    @GetMapping("/{leaveId}")
    public ResponseEntity<ApiResponse<LeaveRequestResponse>> getById(
            @PathVariable Long leaveId) {
        return ResponseEntity.ok(ApiResponse.success("Leave retrieved", leaveService.getLeaveById(leaveId)));
    }

    @PreAuthorize("hasAnyRole('TRAINING_COORDINATOR','TA_MANAGER','TA_HEAD')")
    @PatchMapping("/{leaveId}/review")
    public ResponseEntity<ApiResponse<LeaveRequestResponse>> reviewLeave(
            @PathVariable Long leaveId,
            @Valid @RequestBody LeaveReviewRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Leave reviewed", leaveService.reviewLeave(leaveId, request)));
    }
}
