package com.kanini.springer.controller.Drive;

import com.kanini.springer.dto.Authentication.ApiResponse;
import com.kanini.springer.dto.Drive.*;
import com.kanini.springer.service.Drive.ICandidateEvaluationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/candidate-evaluations")
@RequiredArgsConstructor
@Tag(name = "Candidate Evaluation Management", description = "APIs for managing candidate evaluations and scores")
public class CandidateEvaluationController {
    
    private final ICandidateEvaluationService evaluationService;
    
    @PostMapping
    @Operation(summary = "Create a candidate evaluation", 
               description = "Creates a single candidate evaluation with score and status. " +
                             "If evaluationStatus == FAIL, candidate status is updated to REJECTED " +
                             "and reason is appended with 'Failed in {RoundName}'.")
    public ResponseEntity<ApiResponse<CandidateEvaluationResponse>> createEvaluation(
            @RequestBody CandidateEvaluationRequest request) {
        CandidateEvaluationResponse response = evaluationService.createEvaluation(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Evaluation created successfully", response));
    }
    
    @PostMapping("/bulk")
    @Operation(summary = "Bulk create candidate evaluations", 
               description = "Creates multiple evaluations with common roundConfigId and reviewedBy. " +
                             "For each evaluation with FAIL status, candidate status is updated to REJECTED " +
                             "and reason is appended with 'Failed in {RoundName}'.")
    public ResponseEntity<ApiResponse<BulkCandidateEvaluationResponse>> bulkCreateEvaluations(
            @RequestBody BulkCandidateEvaluationRequest request) {
        BulkCandidateEvaluationResponse response = evaluationService.bulkCreateEvaluations(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Evaluations processed successfully", response));
    }
    
    @GetMapping
    @Operation(summary = "Get all candidate evaluations", 
               description = "Retrieves all candidate evaluations across all applications")
    public ResponseEntity<ApiResponse<List<CandidateEvaluationResponse>>> getAllEvaluations() {
        List<CandidateEvaluationResponse> responses = evaluationService.getAllEvaluations();
        return ResponseEntity.ok(new ApiResponse<>(true, "Evaluations retrieved successfully", responses));
    }
    
    @GetMapping("/application/{applicationId}")
    @Operation(summary = "Get evaluations by application ID", 
               description = "Retrieves all evaluations for a specific application (all rounds)")
    public ResponseEntity<ApiResponse<List<CandidateEvaluationResponse>>> getEvaluationsByApplicationId(
            @PathVariable Long applicationId) {
        List<CandidateEvaluationResponse> responses = evaluationService.getEvaluationsByApplicationId(applicationId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Evaluations retrieved successfully", responses));
    }
    
    @PatchMapping("/{scoreId}/status")
    @Operation(summary = "Update evaluation status", 
               description = "Updates the evaluation status with complex candidate status updates:\n\n" +
                             "- If new status == ABSENT: candidate status → REJECTED, reason updated\n" +
                             "- If PASS → FAIL: candidate status → REJECTED, reason updated, manual override logged\n" +
                             "- If FAIL → PASS: candidate status → SHORTLISTED, reason updated, manual override logged")
    public ResponseEntity<ApiResponse<CandidateEvaluationResponse>> updateEvaluationStatus(
            @PathVariable Long scoreId,
            @RequestBody EvaluationStatusUpdateRequest request) {
        CandidateEvaluationResponse response = evaluationService.updateEvaluationStatus(scoreId, request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Evaluation status updated successfully", response));
    }
}
