package com.kanini.springer.controller.Common;

import com.kanini.springer.dto.Authentication.ApiResponse;
import com.kanini.springer.dto.Common.ManualOverrideRequest;
import com.kanini.springer.dto.Common.ManualOverrideResponse;
import com.kanini.springer.service.Common.IOverrideService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/overrides")
@RequiredArgsConstructor
@Tag(name = "Manual Override Audit", description = "APIs for managing manual override audit records")
public class OverrideController {
    
    private final IOverrideService overrideService;
    
    @PostMapping
    @Operation(summary = "Log a manual override", description = "Creates an audit record for a manual override operation. Stores field-level changes, reason, and user who performed the override.")
    public ResponseEntity<ApiResponse<ManualOverrideResponse>> logOverride(@RequestBody ManualOverrideRequest request) {
        ManualOverrideResponse response = overrideService.logOverride(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Manual override logged successfully", response));
    }
    
    @GetMapping
    @Operation(summary = "Get all manual overrides", description = "Retrieves all manual override audit records. Supports optional query parameters for filtering.")
    public ResponseEntity<ApiResponse<List<ManualOverrideResponse>>> getAllOverrides(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) Long userId) {
        
        List<ManualOverrideResponse> responses;
        String message = "Manual overrides retrieved successfully";
        
        // Apply filters based on query parameters
        if (fromDate != null) {
            responses = overrideService.getOverridesByDate(fromDate);
            message = "Manual overrides from " + fromDate + " retrieved successfully";
        } else if (entityType != null && !entityType.isBlank()) {
            responses = overrideService.getOverridesByEntityType(entityType);
            message = "Manual overrides for entity type " + entityType + " retrieved successfully";
        } else if (userId != null) {
            responses = overrideService.getOverridesByUserId(userId);
            message = "Manual overrides by user ID " + userId + " retrieved successfully";
        } else {
            responses = overrideService.getAllOverrides();
        }
        
        return ResponseEntity.ok(new ApiResponse<>(true, message, responses));
    }
    
    @GetMapping("/by-date")
    @Operation(summary = "Get overrides by date", description = "Retrieves all override records from a specific date onwards")
    public ResponseEntity<ApiResponse<List<ManualOverrideResponse>>> getOverridesByDate(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate) {
        List<ManualOverrideResponse> responses = overrideService.getOverridesByDate(fromDate);
        return ResponseEntity.ok(new ApiResponse<>(true, "Overrides from " + fromDate + " retrieved successfully", responses));
    }
    
    @GetMapping("/by-entity-type")
    @Operation(summary = "Get overrides by entity type", description = "Retrieves all override records for a specific entity type (e.g., CANDIDATES, DRIVES, etc.)")
    public ResponseEntity<ApiResponse<List<ManualOverrideResponse>>> getOverridesByEntityType(
            @RequestParam String entityType) {
        List<ManualOverrideResponse> responses = overrideService.getOverridesByEntityType(entityType);
        return ResponseEntity.ok(new ApiResponse<>(true, "Overrides for " + entityType + " retrieved successfully", responses));
    }
    
    @GetMapping("/by-entity-id")
    @Operation(summary = "Get overrides by entity type and ID", description = "Retrieves all override records for a specific entity type and entity ID")
    public ResponseEntity<ApiResponse<List<ManualOverrideResponse>>> getOverridesByEntityTypeAndEntityId(
            @RequestParam String entityType,
            @RequestParam Long entityId) {
        List<ManualOverrideResponse> responses = overrideService.getOverridesByEntityTypeAndEntityId(entityType, entityId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Overrides for " + entityType + " with ID " + entityId + " retrieved successfully", responses));
    }
    
    @GetMapping("/by-user")
    @Operation(summary = "Get overrides by user", description = "Retrieves all override records created by a specific user")
    public ResponseEntity<ApiResponse<List<ManualOverrideResponse>>> getOverridesByUserId(
            @RequestParam Long userId) {
        List<ManualOverrideResponse> responses = overrideService.getOverridesByUserId(userId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Overrides by user " + userId + " retrieved successfully", responses));
    }
}

