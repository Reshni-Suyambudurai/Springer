package com.kanini.springer.controller.Academy;

import com.kanini.springer.dto.Academy.LeaveRequestRequest;
import com.kanini.springer.dto.Academy.LeaveRequestResponse;
import com.kanini.springer.dto.Academy.LeaveReviewRequest;
import com.kanini.springer.dto.Authentication.ApiResponse;
import com.kanini.springer.service.Academy.ILeaveRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/academy/leaves")
@RequiredArgsConstructor
public class LeaveRequestController {

    private final ILeaveRequestService leaveService;

    // Intern applies leave
    @PostMapping
    public ResponseEntity<ApiResponse<LeaveRequestResponse>> applyLeave(
            @RequestBody LeaveRequestRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Leave request submitted", leaveService.applyLeave(request)));
    }

    // Get all leaves — TC views, TA views and reviews
    @GetMapping
    public ResponseEntity<ApiResponse<List<LeaveRequestResponse>>> getAllLeaves() {
        return ResponseEntity.ok(ApiResponse.success("All leaves retrieved", leaveService.getAllLeaves()));
    }

    // Get leaves by batch — useful for TC to see their batch
    @GetMapping("/batch")
    public ResponseEntity<ApiResponse<List<LeaveRequestResponse>>> getByBatch(
            @RequestParam Integer programId,
            @RequestParam Integer batchNumber) {
        return ResponseEntity.ok(ApiResponse.success("Batch leaves retrieved",
                leaveService.getLeavesByBatch(programId, batchNumber)));
    }

    // Get leaves for a specific student — intern views own leaves
    @GetMapping("/student/{studentId}")
    public ResponseEntity<ApiResponse<List<LeaveRequestResponse>>> getByStudent(
            @PathVariable Long studentId) {
        return ResponseEntity.ok(ApiResponse.success("Leaves retrieved", leaveService.getLeavesByStudent(studentId)));
    }

    // Get single leave
    @GetMapping("/{leaveId}")
    public ResponseEntity<ApiResponse<LeaveRequestResponse>> getById(
            @PathVariable Long leaveId) {
        return ResponseEntity.ok(ApiResponse.success("Leave retrieved", leaveService.getLeaveById(leaveId)));
    }

    // TA Recruiter approves or rejects — TC cannot use this endpoint
    @PatchMapping("/{leaveId}/review")
    public ResponseEntity<ApiResponse<LeaveRequestResponse>> reviewLeave(
            @PathVariable Long leaveId,
            @RequestBody LeaveReviewRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Leave reviewed", leaveService.reviewLeave(leaveId, request)));
    }
}
