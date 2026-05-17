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
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/candidate-evaluations")
@RequiredArgsConstructor
@Tag(name = "Candidate Evaluation Management", description = "APIs for managing candidate evaluations and scores")
@PreAuthorize("hasAnyRole('SYSTEM_ADMIN','TA_HEAD','TA_MANAGER','MEMBERS')")
public class CandidateEvaluationController {
    
    private final ICandidateEvaluationService evaluationService;
    // use only for panel to candidate evaluation 
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
    
    @GetMapping("/application/{applicationId}/round/{roundConfigId}/user/{userId}")
    @Operation(summary = "Get evaluation by application ID, round config ID, and user ID",
               description = "Retrieves the single evaluation for a specific application in a specific round by a specific reviewer")
    public ResponseEntity<ApiResponse<CandidateEvaluationResponse>> getEvaluationByApplicationAndRound(
            @PathVariable Long applicationId, @PathVariable Long roundConfigId, @PathVariable Long userId) {
        CandidateEvaluationResponse response = evaluationService.getEvaluationByApplicationAndRound(applicationId, roundConfigId, userId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Evaluation retrieved successfully", response));
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

    @PostMapping("/by-round")
    @Operation(summary = "Get evaluations by round number and application IDs",
               description = "Uses roundNo to find the matching RoundTemplate, then returns the full round template " +
                             "details along with all evaluation records for the given application IDs in that round. " +
                             "Each evaluation includes candidateId and candidateName. " +
                             "Static round mapping: Aptitude=1, Communication=2, Technical=3.")
    public ResponseEntity<ApiResponse<RoundEvaluationResponse>> getEvaluationsByRoundAndApplications(
            @RequestBody RoundEvaluationRequest request) {
        RoundEvaluationResponse response = evaluationService.getEvaluationsByRoundAndApplications(request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Round evaluations retrieved successfully", response));
    }

    @PatchMapping("/bulk-status")
    @Operation(summary = "Bulk update evaluation status",
               description = "Updates the evaluation status for multiple applications at once.")
    public ResponseEntity<ApiResponse<Void>> bulkUpdateEvaluationStatus(
            @RequestBody BulkEvaluationStatusUpdateRequest request) {
        evaluationService.bulkUpdateEvaluationStatus(request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Updated successfully", null));
    }

    @PatchMapping("/bulk-round-skip")
    @Operation(summary = "Bulk skip/hold/absent a round",
               description = "Bulk update for rounds not conducted. " +
                             "SKIP/HOLD: updates CandidateEvaluation status only. " +
                             "ABSENT: sets Application status to DROPPED (no evaluation record touched). " +
                             "All-or-nothing — either all succeed or none.")
    public ResponseEntity<ApiResponse<Void>> bulkRoundSkip(
            @RequestBody BulkRoundSkipRequest request) {
        evaluationService.bulkRoundSkip(request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Round status updated successfully", null));
    }

    @PostMapping("/check-existing")
    @Operation(summary = "Check for existing candidate evaluations",
               description = "Validates that all applications belong to the specified drive, " +
                             "then checks if evaluations already exist for the given roundConfigId. " +
                             "Returns a list of registration codes with existing evaluations and reason. " +
                             "Useful before bulk upload to prevent duplicate evaluation attempts.")
    public ResponseEntity<ApiResponse<CheckExistingEvaluationsResponse>> checkExistingEvaluations(
            @RequestBody CheckExistingEvaluationsRequest request) {
        CheckExistingEvaluationsResponse response = evaluationService.checkExistingEvaluations(request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Evaluation check completed successfully", response));
    }
}

