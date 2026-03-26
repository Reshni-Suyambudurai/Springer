package com.kanini.springer.controller.Hiring;

import com.kanini.springer.dto.Hiring.BulkInsertResponse;
import com.kanini.springer.dto.Hiring.InstituteNameResponse;
import com.kanini.springer.dto.Hiring.InstituteRequest;
import com.kanini.springer.dto.Hiring.InstituteResponse;
import com.kanini.springer.dto.Hiring.InstituteWithTPOsResponse;
import com.kanini.springer.service.Hiring.IInstituteService;
import com.kanini.springer.dto.Authentication.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/institutes")
@RequiredArgsConstructor
@Tag(name = "Institute Management", description = "APIs for managing institutes/colleges")
public class InstituteController {
    
    private final IInstituteService instituteService;
    
    @PostMapping
    @Operation(summary = "Create a new institute", description = "Creates a single institute with required details")
    public ResponseEntity<ApiResponse<InstituteResponse>> createInstitute(@RequestBody InstituteRequest request) {
        // Manual validation for required fields
        if (request.getInstituteName() == null || request.getInstituteName().isBlank()) {
            throw new RuntimeException("Institute name is required");
        }
        
        InstituteResponse response = instituteService.createInstitute(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Institute created successfully", response));
    }
    
    @PostMapping("/bulk")
    @Operation(summary = "Bulk create institutes", description = "Creates multiple institutes at once. All-or-nothing: if any record fails validation, none will be inserted.")
    public ResponseEntity<ApiResponse<BulkInsertResponse<InstituteResponse>>> bulkCreateInstitutes(@RequestBody List<InstituteRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            throw new RuntimeException("Request body cannot be empty");
        }
        
        BulkInsertResponse<InstituteResponse> response = instituteService.bulkCreateInstitutes(requests);
        
        if (!response.getErrorMessages().isEmpty()) {
            // Validation errors occurred - no records inserted
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>(false, "Validation failed. No records inserted.", response));
        }
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "All institutes created successfully", response));
    }
    
    @GetMapping
    @Operation(summary = "Get all institutes", description = "Retrieves all institutes in the system")
    public ResponseEntity<ApiResponse<List<InstituteResponse>>> getAllInstitutes() {
        List<InstituteResponse> responses = instituteService.getAllInstitutes();
        return ResponseEntity.ok(new ApiResponse<>(true, "Institutes retrieved successfully", responses));
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Get institute by ID", description = "Retrieves a specific institute by its ID")
    public ResponseEntity<ApiResponse<InstituteResponse>> getInstituteById(@PathVariable("id") Long instituteId) {
        InstituteResponse response = instituteService.getInstituteById(instituteId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Institute retrieved successfully", response));
    }
    
    @PatchMapping("/{id}")
    @Operation(summary = "Update institute (PATCH)", description = "Partially updates an institute. Only provided fields will be updated.")
    public ResponseEntity<ApiResponse<InstituteResponse>> updateInstitute(
            @PathVariable("id") Long instituteId,
            @RequestBody InstituteRequest request) {
        InstituteResponse response = instituteService.updateInstitute(instituteId, request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Institute updated successfully", response));
    }
    
    @DeleteMapping("/{id}")
    @Operation(summary = "Toggle institute active status", description = "Toggles isActive between true and false (soft delete functionality)")
    public ResponseEntity<ApiResponse<Void>> deleteInstitute(@PathVariable("id") Long instituteId) {
        instituteService.deleteInstitute(instituteId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Institute status toggled successfully", null));
    }
    
    @GetMapping("/with-tpos")
    @Operation(summary = "Get institutes with TPO details (paginated)", description = "Retrieves institutes along with their complete TPO contact information. Default page size is 6.")
    public ResponseEntity<ApiResponse<Page<InstituteWithTPOsResponse>>> getAllInstitutesWithTPOs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<InstituteWithTPOsResponse> responses = instituteService.getAllInstitutesWithTPOs(pageable);
        return ResponseEntity.ok(new ApiResponse<>(true, "Institutes with TPO details retrieved successfully", responses));
    }
    
    @GetMapping("/{id}/with-tpos")
    @Operation(summary = "Get institute with TPOs by ID", description = "Retrieves a specific institute by ID along with all its TPO contacts")
    public ResponseEntity<ApiResponse<InstituteWithTPOsResponse>> getInstituteWithTPOsById(@PathVariable("id") Long instituteId) {
        InstituteWithTPOsResponse response = instituteService.getInstituteWithTPOsById(instituteId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Institute with TPO details retrieved successfully", response));
    }
    
    @GetMapping("/names")
    @Operation(summary = "Get all institute names", description = "Retrieves all institute IDs and names only (lightweight endpoint for dropdowns)")
    public ResponseEntity<ApiResponse<List<InstituteNameResponse>>> getAllInstituteNames() {
        List<InstituteNameResponse> responses = instituteService.getAllInstituteNames();
        return ResponseEntity.ok(new ApiResponse<>(true, "Institute names retrieved successfully", responses));
    }
}
