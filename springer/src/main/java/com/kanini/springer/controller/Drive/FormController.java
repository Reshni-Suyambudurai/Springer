package com.kanini.springer.controller.Drive;

import com.kanini.springer.dto.Authentication.ApiResponse;
import com.kanini.springer.dto.Drive.FormRequest;
import com.kanini.springer.dto.Drive.FormResponse;
import com.kanini.springer.dto.Drive.FormUpdateRequest;
import com.kanini.springer.service.Drive.IFormService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for managing forms
 */
@RestController
@RequestMapping("/api/forms")
@RequiredArgsConstructor
@Tag(name = "Form Management", description = "APIs for managing registration forms")
public class FormController {

    private final IFormService formService;

    @PostMapping
    @Operation(summary = "Create a new form", 
               description = "Creates a new registration form for a drive")
    public ResponseEntity<ApiResponse<FormResponse>> createForm(
            @Valid @RequestBody FormRequest request) {
        
        FormResponse response = formService.createForm(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Form created successfully", response));
    }

    @GetMapping
    @Operation(summary = "Get all forms", 
               description = "Retrieves all registration forms")
    public ResponseEntity<ApiResponse<List<FormResponse>>> getAllForms() {
        
        List<FormResponse> responses = formService.getAllForms();
        return ResponseEntity.ok(
                new ApiResponse<>(true, "Forms retrieved successfully", responses));
    }

    @GetMapping("/drive/{driveId}")
    @Operation(summary = "Get forms by drive ID", 
               description = "Retrieves all forms for a specific drive")
    public ResponseEntity<ApiResponse<List<FormResponse>>> getFormsByDriveId(
            @PathVariable Long driveId) {
        
        List<FormResponse> responses = formService.getFormsByDriveId(driveId);
        return ResponseEntity.ok(
                new ApiResponse<>(true, "Forms retrieved successfully", responses));
    }

    @GetMapping("/drive/{driveId}/active")
    @Operation(summary = "Get active forms by drive ID", 
               description = "Retrieves all active forms for a specific drive")
    public ResponseEntity<ApiResponse<List<FormResponse>>> getActiveFormsByDriveId(
            @PathVariable Long driveId) {
        
        List<FormResponse> responses = formService.getActiveFormsByDriveId(driveId);
        return ResponseEntity.ok(
                new ApiResponse<>(true, "Active forms retrieved successfully", responses));
    }

    @GetMapping("/{formId}")
    @Operation(summary = "Get form by ID", 
               description = "Retrieves a specific form by ID")
    public ResponseEntity<ApiResponse<FormResponse>> getFormById(
            @PathVariable Long formId) {
        
        FormResponse response = formService.getFormById(formId);
        return ResponseEntity.ok(
                new ApiResponse<>(true, "Form retrieved successfully", response));
    }

    @PatchMapping("/{formId}")
    @Operation(summary = "Update form", 
               description = "Updates an existing form")
    public ResponseEntity<ApiResponse<FormResponse>> updateForm(
            @PathVariable Long formId,
            @Valid @RequestBody FormUpdateRequest request) {
        
        FormResponse response = formService.updateForm(formId, request);
        return ResponseEntity.ok(
                new ApiResponse<>(true, "Form updated successfully", response));
    }

    @DeleteMapping("/{formId}")
    @Operation(summary = "Delete form", 
               description = "Deletes a form by ID")
    public ResponseEntity<ApiResponse<Void>> deleteForm(
            @PathVariable Long formId) {
        
        formService.deleteForm(formId);
        return ResponseEntity.ok(
                new ApiResponse<>(true, "Form deleted successfully", null));
    }
}
