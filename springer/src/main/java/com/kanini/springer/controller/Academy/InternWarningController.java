package com.kanini.springer.controller.Academy;

import com.kanini.springer.dto.Academy.InternWarningRequest;
import com.kanini.springer.dto.Academy.InternWarningResponse;
import com.kanini.springer.dto.Authentication.ApiResponse;
import com.kanini.springer.service.Academy.IInternWarningService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/academy/warnings")
@RequiredArgsConstructor
public class InternWarningController {

    private final IInternWarningService warningService;

    // Recruiter / TC issues a warning
    @PreAuthorize("hasAnyRole('TRAINING_COORDINATOR','TA_MANAGER','TA_HEAD')")
    @PostMapping
    public ResponseEntity<ApiResponse<InternWarningResponse>> issueWarning(
            @Valid @RequestBody InternWarningRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Warning issued", warningService.issueWarning(request)));
    }

    // Get all warnings — TC / Recruiter view
    @PreAuthorize("hasAnyRole('TRAINING_COORDINATOR','TA_MANAGER','TA_HEAD')")
    @GetMapping
    public ResponseEntity<ApiResponse<List<InternWarningResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success("All warnings retrieved",
                warningService.getAllWarnings()));
    }

    // Paginated + filtered warnings — for large datasets
    @PreAuthorize("hasAnyRole('TRAINING_COORDINATOR','TA_MANAGER','TA_HEAD','MEMBERS')")
    @GetMapping("/filtered")
    public ResponseEntity<ApiResponse<org.springframework.data.domain.Page<InternWarningResponse>>> getWarningsFiltered(
            @RequestParam(required = false) Integer programId,
            @RequestParam(required = false) List<Integer> programIds,
            @RequestParam(required = false) Integer batchNumber,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String warningType,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var result = warningService.getWarningsFiltered(programId, programIds, batchNumber, status, warningType, search, page, size);
        return ResponseEntity.ok(ApiResponse.success("Warnings retrieved", result));
    }

    // Get all warnings for a specific intern
    @PreAuthorize("hasAnyRole('TRAINING_COORDINATOR','TA_MANAGER','TA_HEAD','INTERN','MEMBERS')")
    @GetMapping("/student/{studentId}")
    public ResponseEntity<ApiResponse<List<InternWarningResponse>>> getByStudent(
            @PathVariable Long studentId) {
        return ResponseEntity.ok(ApiResponse.success("Warnings retrieved",
                warningService.getWarningsByStudent(studentId)));
    }

    // Get all warnings for a batch — TC / Recruiter view
    @PreAuthorize("hasAnyRole('TRAINING_COORDINATOR','TA_MANAGER','TA_HEAD')")
    @GetMapping("/batch")
    public ResponseEntity<ApiResponse<List<InternWarningResponse>>> getByBatch(
            @RequestParam Integer programId,
            @RequestParam Integer batchNumber) {
        return ResponseEntity.ok(ApiResponse.success("Batch warnings retrieved",
                warningService.getWarningsByBatch(programId, batchNumber)));
    }

    // Intern acknowledges a warning with a comment
    @PreAuthorize("hasAnyRole('INTERN')")
    @PatchMapping("/{warningId}/acknowledge")
    public ResponseEntity<ApiResponse<InternWarningResponse>> acknowledge(
            @PathVariable Long warningId,
            @RequestParam String acknowledgementComment) {
        return ResponseEntity.ok(ApiResponse.success("Warning acknowledged",
                warningService.acknowledgeWarning(warningId, acknowledgementComment)));
    }
}
