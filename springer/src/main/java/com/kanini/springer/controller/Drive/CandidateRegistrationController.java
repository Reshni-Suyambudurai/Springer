package com.kanini.springer.controller.Drive;

import com.kanini.springer.dto.Authentication.ApiResponse;
import com.kanini.springer.dto.Drive.BulkDeleteRegistrationRequest;
import com.kanini.springer.dto.Drive.CandidateRegistrationRequest;
import com.kanini.springer.dto.Drive.CandidateRegistrationResponse;
import com.kanini.springer.dto.Drive.CandidateRegistrationUpdateRequest;
import com.kanini.springer.service.Drive.ICandidateRegistrationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for managing candidate registrations
 */
@RestController
@RequestMapping("/api/candidate-registrations")
@RequiredArgsConstructor
@Tag(name = "Candidate Registration Management", description = "APIs for managing candidate self-registrations")
public class CandidateRegistrationController {

    private final ICandidateRegistrationService registrationService;

    @PostMapping("/drive/{driveId}/register")
    @Operation(summary = "Submit candidate registration", 
               description = "Allows a candidate to self-register for a drive without authentication")
    public ResponseEntity<ApiResponse<CandidateRegistrationResponse>> submitRegistration(
            @PathVariable Long driveId,
            @Valid @RequestBody CandidateRegistrationRequest request) {
        
        CandidateRegistrationResponse response = registrationService.submitRegistration(driveId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Registration submitted successfully", response));
    }

    @GetMapping("/drive/{driveId}")
    @Operation(summary = "Get all registrations for a drive", 
               description = "Retrieves all candidate registrations for a specific drive")
    public ResponseEntity<ApiResponse<List<CandidateRegistrationResponse>>> getAllRegistrations(
            @PathVariable Long driveId) {
        
        List<CandidateRegistrationResponse> responses = registrationService.getAllRegistrations(driveId);
        return ResponseEntity.ok(
                new ApiResponse<>(true, "Registrations retrieved successfully", responses));
    }

    @GetMapping("/form/{formId}")
    @Operation(summary = "Get registrations by form ID", 
               description = "Retrieves all candidate registrations for a specific form")
    public ResponseEntity<ApiResponse<List<CandidateRegistrationResponse>>> getRegistrationsByFormId(
            @PathVariable Long formId) {
        
        List<CandidateRegistrationResponse> responses = registrationService.getRegistrationsByFormId(formId);
        return ResponseEntity.ok(
                new ApiResponse<>(true, "Registrations retrieved successfully", responses));
    }

    @GetMapping("/{registrationId}")
    @Operation(summary = "Get registration by ID", 
               description = "Retrieves a specific candidate registration by ID")
    public ResponseEntity<ApiResponse<CandidateRegistrationResponse>> getRegistrationById(
            @PathVariable Long registrationId) {
        
        CandidateRegistrationResponse response = registrationService.getRegistrationById(registrationId);
        return ResponseEntity.ok(
                new ApiResponse<>(true, "Registration retrieved successfully", response));
    }

    @PatchMapping("/{registrationId}")
    @Operation(summary = "Partially update a registration",
               description = "Updates collegeName, email, and/or mobile of an existing registration. Only provided fields are updated.")
    public ResponseEntity<ApiResponse<CandidateRegistrationResponse>> updateRegistration(
            @PathVariable Long registrationId,
            @Valid @RequestBody CandidateRegistrationUpdateRequest request) {

        CandidateRegistrationResponse response = registrationService.updateRegistration(registrationId, request);
        return ResponseEntity.ok(
                new ApiResponse<>(true, "Registration updated successfully", response));
    }

    @DeleteMapping("/{registrationId}")
    @Operation(summary = "Delete registration", 
               description = "Deletes a candidate registration by ID")
    public ResponseEntity<ApiResponse<Void>> deleteRegistration(
            @PathVariable Long registrationId) {
        
        registrationService.deleteRegistration(registrationId);
        return ResponseEntity.ok(
                new ApiResponse<>(true, "Registration deleted successfully", null));
    }

    @DeleteMapping("/bulk")
    @Operation(summary = "Bulk delete registrations", 
               description = "Deletes multiple candidate registrations by their IDs. All IDs must exist or the operation will fail.")
    public ResponseEntity<ApiResponse<Void>> bulkDeleteRegistrations(
            @Valid @RequestBody BulkDeleteRegistrationRequest request) {
        
        registrationService.bulkDeleteRegistrations(request.getRegistrationIds());
        return ResponseEntity.ok(
                new ApiResponse<>(true, 
                        String.format("Successfully deleted %d registration(s)", request.getRegistrationIds().size()), 
                        null));
    }
}
