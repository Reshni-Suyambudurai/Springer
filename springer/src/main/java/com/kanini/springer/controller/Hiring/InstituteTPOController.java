package com.kanini.springer.controller.Hiring;

import com.kanini.springer.dto.Hiring.BulkInsertResponse;
import com.kanini.springer.dto.Hiring.InstituteContactRequest;
import com.kanini.springer.dto.Hiring.InstituteContactResponse;
import com.kanini.springer.service.Hiring.IInstituteTPOService;
import com.kanini.springer.dto.Authentication.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/institutes/contacts")
@RequiredArgsConstructor
@Tag(name = "Institute Contact (TPO) Management", description = "APIs for managing institute contacts and placement officers")
public class InstituteTPOController {
    
    private final IInstituteTPOService tpoService;
    
    @PostMapping
    @Operation(summary = "Create a new TPO contact", description = "Creates a single TPO contact for an institute")
    public ResponseEntity<ApiResponse<InstituteContactResponse>> createContact(@RequestBody InstituteContactRequest request) {
        // Manual validation for required fields
        if (request.getInstituteId() == null) {
            throw new RuntimeException("Institute ID is required");
        }
        if (request.getTpoName() == null || request.getTpoName().isBlank()) {
            throw new RuntimeException("TPO name is required");
        }
        if (request.getTpoEmail() == null || request.getTpoEmail().isBlank()) {
            throw new RuntimeException("TPO email is required");
        }
        if (request.getTpoMobile() == null || request.getTpoMobile().isBlank()) {
            throw new RuntimeException("TPO mobile is required");
        }
        
        InstituteContactResponse response = tpoService.createContact(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Contact created successfully", response));
    }
    
    @PostMapping("/institute/{instituteId}/bulk")
    @Operation(summary = "Bulk create TPO contacts for specific institute", description = "Creates multiple TPO contacts for a specific institute. All-or-nothing: if any record fails validation, none will be inserted.")
    public ResponseEntity<ApiResponse<BulkInsertResponse<InstituteContactResponse>>> bulkCreateContacts(
            @PathVariable("instituteId") Long instituteId,
            @RequestBody List<InstituteContactRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            throw new RuntimeException("Request body cannot be empty");
        }
        
        BulkInsertResponse<InstituteContactResponse> response = tpoService.bulkCreateContacts(instituteId, requests);
        
        if (!response.getErrorMessages().isEmpty()) {
            // Validation errors occurred - no records inserted
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>(false, "Validation failed. No records inserted.", response));
        }
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "All contacts created successfully", response));
    }
    
    @PostMapping("/bulk")
    @Operation(summary = "Bulk create TPO contacts across multiple institutes", description = "Creates multiple TPO contacts across different institutes. Each request must contain instituteId. All-or-nothing: if any record fails validation, none will be inserted.")
    public ResponseEntity<ApiResponse<BulkInsertResponse<InstituteContactResponse>>> bulkCreateAllContacts(
            @RequestBody List<InstituteContactRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            throw new RuntimeException("Request body cannot be empty");
        }
        
        BulkInsertResponse<InstituteContactResponse> response = tpoService.bulkCreateAllContacts(requests);
        
        if (!response.getErrorMessages().isEmpty()) {
            // Validation errors occurred - no records inserted
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>(false, "Validation failed. No records inserted.", response));
        }
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "All contacts created successfully", response));
    }
    
    @GetMapping("/institute/{instituteId}")
    @Operation(summary = "Get all contacts for an institute", description = "Retrieves all TPO contacts for a specific institute")
    public ResponseEntity<ApiResponse<List<InstituteContactResponse>>> getContactsByInstituteId(
            @PathVariable("instituteId") Long instituteId) {
        List<InstituteContactResponse> responses = tpoService.getContactsByInstituteId(instituteId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Contacts retrieved successfully", responses));
    }
    
    @GetMapping("/{tpoId}")
    @Operation(summary = "Get contact by ID", description = "Retrieves a specific TPO contact by its ID")
    public ResponseEntity<ApiResponse<InstituteContactResponse>> getContactById(@PathVariable("tpoId") Integer tpoId) {
        InstituteContactResponse response = tpoService.getContactById(tpoId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Contact retrieved successfully", response));
    }
    
    @PatchMapping("/{tpoId}")
    @Operation(summary = "Update TPO contact (PATCH)", description = "Partially updates a TPO contact. Only provided fields will be updated.")
    public ResponseEntity<ApiResponse<InstituteContactResponse>> updateContact(
            @PathVariable("tpoId") Integer tpoId,
            @RequestBody InstituteContactRequest request) {
        InstituteContactResponse response = tpoService.updateContact(tpoId, request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Contact updated successfully", response));
    }
    
    @DeleteMapping("/{tpoId}")
    @Operation(summary = "Toggle TPO contact status", description = "Toggles tpoStatus between ACTIVE and INACTIVE (soft delete functionality)")
    public ResponseEntity<ApiResponse<Void>> deleteContact(@PathVariable("tpoId") Integer tpoId) {
        tpoService.deleteContact(tpoId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Contact status toggled successfully", null));
    }
}
