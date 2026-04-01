package com.kanini.springer.controller.Drive;

import com.kanini.springer.dto.Authentication.ApiResponse;
import com.kanini.springer.dto.Drive.BulkCandidateCreateResponse;
import com.kanini.springer.dto.Drive.BulkCandidateLifecycleUpdateRequest;
import com.kanini.springer.dto.Drive.BulkCandidateLifecycleUpdateResponse;
import com.kanini.springer.dto.Drive.BulkCandidateStatusUpdateRequest;
import com.kanini.springer.dto.Drive.BulkCandidateStatusUpdateResponse;
import com.kanini.springer.dto.Drive.CandidateFilterRequest;
import com.kanini.springer.dto.Drive.CandidateRequest;
import com.kanini.springer.dto.Drive.CandidateResponse;
import com.kanini.springer.dto.Drive.CandidateStatusUpdateRequest;
import com.kanini.springer.dto.Drive.CandidateUpdateRequest;
import com.kanini.springer.dto.Drive.CandidateValidationRequest;
import com.kanini.springer.dto.Drive.CandidateValidationResponse;
import com.kanini.springer.dto.Drive.EligibilityRuleUpdateRequest;
import com.kanini.springer.dto.Drive.FilterOptionsResponse;
import com.kanini.springer.service.Drive.ICandidatesService;
import com.kanini.springer.service.Drive.IEligibilityRuleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/candidates")
@RequiredArgsConstructor
@Tag(name = "Candidate Management", description = "APIs for managing candidates in the recruitment system")
public class CandidatesController {
    
    private final ICandidatesService candidatesService;
    private final IEligibilityRuleService eligibilityRuleService;
    
    @PostMapping
    @Operation(summary = "Create a new candidate", description = "Creates a single candidate record")
    public ResponseEntity<ApiResponse<CandidateResponse>> createCandidate(@RequestBody CandidateRequest request) {
        CandidateResponse response = candidatesService.createCandidate(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Candidate created successfully", response));
    }
    
    @PostMapping("/bulk")
    @Operation(summary = "Bulk create candidates", 
               description = "Creates multiple candidates at once with validation. " +
                            "All-or-nothing: either all candidates are created or none. " +
                            "Validates email and aadhaar uniqueness across batch and database.")
    public ResponseEntity<ApiResponse<BulkCandidateCreateResponse>> bulkCreateCandidates(
            @RequestBody List<CandidateRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            throw new RuntimeException("Request body cannot be empty");
        }
        
        BulkCandidateCreateResponse response = candidatesService.bulkCreateCandidates(requests);
        
        // Determine success status based on whether any candidates were created
        boolean isSuccess = response.getSuccessCount() > 0;
        String message = isSuccess 
            ? "All " + response.getSuccessCount() + " candidates created successfully"
            : "Validation failed. No candidates were created. " + response.getErrorMessages().size() + " error(s) found.";
        
        return ResponseEntity.status(isSuccess ? HttpStatus.CREATED : HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(isSuccess, message, response));
    }
    
    @PostMapping("/validate/bulk")
    @Operation(summary = "Bulk validate candidates", 
               description = "Validates candidates before creation. Checks for duplicates in current cycle " +
                            "and previous applications in closed cycles. Returns validation status (NEW/DUPLICATE/OLD) " +
                            "with detailed comments for each candidate.")
    public ResponseEntity<ApiResponse<List<CandidateValidationResponse>>> bulkValidateCandidates(
            @RequestBody List<CandidateValidationRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(false, "Request body cannot be empty", null));
        }
        
        List<CandidateValidationResponse> responses = candidatesService.bulkValidateCandidates(requests);
        return ResponseEntity.ok(new ApiResponse<>(true, "Validation completed successfully", responses));
    }
    
    @GetMapping
    @Operation(summary = "Get all candidates", description = "Retrieves all candidates in the system")
    public ResponseEntity<ApiResponse<List<CandidateResponse>>> getAllCandidates() {
        List<CandidateResponse> responses = candidatesService.getAllCandidates();
        return ResponseEntity.ok(new ApiResponse<>(true, "Candidates retrieved successfully", responses));
    }
    
    @GetMapping("/active/paginated")
    @Operation(summary = "Get active candidates with pagination filtered by cycle", 
               description = "Retrieves active candidates (lifecycleStatus = ACTIVE) for a specific cycle with pagination support for infinite scroll. " +
                            "Returns page metadata including total elements, total pages, current page number, and hasNext flag.")
    public ResponseEntity<ApiResponse<Page<CandidateResponse>>> getActiveCandidatesPaginated(
            @RequestParam Long cycleId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "candidateId") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {
        
        // Create Pageable object with sorting
        Sort sort = sortDirection.equalsIgnoreCase("ASC") 
                ? Sort.by(sortBy).ascending() 
                : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        // Fetch paginated active candidates for the specified cycle
        Page<CandidateResponse> candidatesPage = candidatesService.getActiveCandidatesPaginated(cycleId, pageable);
        
        return ResponseEntity.ok(new ApiResponse<>(true, "Active candidates retrieved successfully", candidatesPage));
    }
    
    @PostMapping("/filter")
    @Operation(summary = "Get candidates with dynamic filtering and pagination", 
               description = "Advanced filtering endpoint supporting multiple criteria including name, institute, location, " +
                            "degree, department, eligibility, application type/stage, skills, and custom sorting. " +
                            "Optimized with server-side filtering for large datasets.")
    public ResponseEntity<ApiResponse<Page<CandidateResponse>>> getCandidatesWithFilters(
            @RequestBody CandidateFilterRequest filterRequest) {
        
        // Set defaults if not provided
        if (filterRequest.getPage() == null) {
            filterRequest.setPage(0);
        }
        if (filterRequest.getSize() == null) {
            filterRequest.setSize(20);
        }
        if (filterRequest.getSortBy() == null || filterRequest.getSortBy().isEmpty()) {
            filterRequest.setSortBy("candidateId");
        }
        if (filterRequest.getSortDirection() == null || filterRequest.getSortDirection().isEmpty()) {
            filterRequest.setSortDirection("DESC");
        }
        
        // Fetch filtered and paginated candidates
        Page<CandidateResponse> candidatesPage = candidatesService.getCandidatesWithFilters(filterRequest);
        
        return ResponseEntity.ok(new ApiResponse<>(true, "Candidates retrieved successfully", candidatesPage));
    }
    
    @GetMapping("/filter-options")
    @Operation(summary = "Get distinct filter options for a cycle", 
               description = "Returns all distinct filter values for candidates with lifecycleStatus = ACTIVE in a specific cycle. " +
                            "Includes: institutes, states, cities, degrees, departments, skills. " +
                            "Also provides stateToCitiesMap for cascading state-city filter dropdowns. " +
                            "Example: { states: ['Karnataka', 'Maharashtra'], stateToCitiesMap: { 'Karnataka': ['Bangalore', 'Mysore'], 'Maharashtra': ['Mumbai', 'Pune'] } }")
    public ResponseEntity<ApiResponse<FilterOptionsResponse>> getFilterOptions(
            @RequestParam Long cycleId) {
        
        FilterOptionsResponse filterOptions = candidatesService.getFilterOptionsByCycle(cycleId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Filter options retrieved successfully", filterOptions));
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Get candidate by ID", description = "Retrieves a specific candidate by their ID")
    public ResponseEntity<ApiResponse<CandidateResponse>> getCandidateById(@PathVariable("id") Long candidateId) {
        CandidateResponse response = candidatesService.getCandidateById(candidateId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Candidate retrieved successfully", response));
    }
    
    @GetMapping("/by-institute/{instituteId}")
    @Operation(summary = "Get candidates by institute", description = "Retrieves all candidates from a specific institute")
    public ResponseEntity<ApiResponse<List<CandidateResponse>>> getCandidatesByInstituteId(
            @PathVariable("instituteId") Long instituteId) {
        List<CandidateResponse> responses = candidatesService.getCandidatesByInstituteId(instituteId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Candidates retrieved successfully", responses));
    }
    
    @GetMapping("/cycle/{cycleId}")
    @Operation(summary = "Get candidates by cycle", description = "Retrieves all candidates from a specific hiring cycle with institute details")
    public ResponseEntity<ApiResponse<List<CandidateResponse>>> getCandidatesByCycleId(
            @PathVariable("cycleId") Long cycleId) {
        List<CandidateResponse> responses = candidatesService.getCandidatesByCycleId(cycleId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Candidates retrieved successfully", responses));
    }
    
    @PatchMapping("/{id}")
    @Operation(summary = "Update candidate eligibility", 
               description = "Updates only the isEligible status with mandatory reason and updatedBy. Automatically logs changes to manual_override table for audit trail.")
    public ResponseEntity<ApiResponse<CandidateResponse>> updateCandidate(
            @PathVariable("id") Long candidateId,
            @RequestBody CandidateUpdateRequest request) {
        CandidateResponse response = candidatesService.updateCandidate(candidateId, request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Candidate eligibility updated successfully", response));
    }
    
    @PatchMapping("/{id}/status")
    @Operation(summary = "Update candidate status", 
               description = "Updates the candidate status. Logs the status change to manual_override table.")
    public ResponseEntity<ApiResponse<CandidateResponse>> updateCandidateStatus(
            @PathVariable("id") Long candidateId,
            @RequestBody CandidateStatusUpdateRequest request) {
        CandidateResponse response = candidatesService.updateCandidateStatus(candidateId, request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Candidate status updated successfully", response));
    }
    
    @PatchMapping("/status/bulk")
    @Operation(summary = "Bulk update candidate status", 
               description = "Updates status for multiple candidates at once. Only eligible candidates are updated for progression statuses. Ineligible candidates are skipped with error messages.")
    public ResponseEntity<ApiResponse<BulkCandidateStatusUpdateResponse>> bulkUpdateCandidateStatus(
            @RequestBody BulkCandidateStatusUpdateRequest request) {
        BulkCandidateStatusUpdateResponse response = candidatesService.bulkUpdateCandidateStatus(request);
        
        String message = String.format("Processed %d candidates: %d successful, %d failed", 
                response.getTotalProcessed(), response.getSuccessCount(), response.getFailureCount());
        
        return ResponseEntity.ok(new ApiResponse<>(true, message, response));
    }
    
    @PatchMapping("/lifecycle-status/bulk")
    @Operation(summary = "Bulk update candidate lifecycle status", 
               description = "Updates lifecycle status (ACTIVE/CLOSED) for multiple candidates at once. Appends update to statusHistory.")
    public ResponseEntity<ApiResponse<BulkCandidateLifecycleUpdateResponse>> bulkUpdateCandidateLifecycleStatus(
            @RequestBody BulkCandidateLifecycleUpdateRequest request) {
        BulkCandidateLifecycleUpdateResponse response = candidatesService.bulkUpdateCandidateLifecycleStatus(request);
        
        String message = String.format("Processed %d candidates: %d successful, %d failed", 
                response.getTotalProcessed(), response.getSuccessCount(), response.getFailureCount());
        
        return ResponseEntity.ok(new ApiResponse<>(true, message, response));
    }
    
    @GetMapping("/eligibility-rules")
    @Operation(summary = "Get eligibility rules", 
               description = "Retrieves all eligibility validation rules from EligibilityRule.json")
    public ResponseEntity<ApiResponse<EligibilityRuleUpdateRequest>> getEligibilityRules() {
        EligibilityRuleUpdateRequest rules = eligibilityRuleService.getAllRules();
        return ResponseEntity.ok(new ApiResponse<>(true, "Eligibility rules retrieved successfully", rules));
    }
    
    @PatchMapping("/eligibility-rules")
    @Operation(summary = "Update eligibility rules", 
               description = "Updates the eligibility validation rules. Rules are applied during candidate creation.")
    public ResponseEntity<ApiResponse<EligibilityRuleUpdateRequest>> updateEligibilityRules(
            @RequestBody EligibilityRuleUpdateRequest request) {
        EligibilityRuleUpdateRequest updatedRules = eligibilityRuleService.updateRules(request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Eligibility rules updated successfully", updatedRules));
    }
}

