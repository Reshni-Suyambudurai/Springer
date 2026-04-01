package com.kanini.springer.controller.Drive;

import com.kanini.springer.dto.Authentication.ApiResponse;
import com.kanini.springer.dto.Drive.RoundTemplateRequest;
import com.kanini.springer.dto.Drive.RoundTemplateResponse;
import com.kanini.springer.dto.Drive.RoundTemplateUpdateRequest;
import com.kanini.springer.service.Drive.IRoundTemplateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/round-templates")
@RequiredArgsConstructor
@Tag(name = "Round Template Management", description = "APIs for managing round templates/configurations")
public class RoundTemplateController {
    
    private final IRoundTemplateService roundTemplateService;
    
    @PostMapping
    @Operation(summary = "Create a new round template", 
               description = "Creates a new round template configuration. " +
                             "isActive defaults to true if not provided.")
    public ResponseEntity<ApiResponse<RoundTemplateResponse>> createRoundTemplate(@RequestBody RoundTemplateRequest request) {
        RoundTemplateResponse response = roundTemplateService.createRoundTemplate(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Round template created successfully", response));
    }
    
    @GetMapping("/{roundConfigId}")
    @Operation(summary = "Get round template by ID", 
               description = "Retrieves a specific round template by its ID")
    public ResponseEntity<ApiResponse<RoundTemplateResponse>> getRoundTemplateById(@PathVariable Long roundConfigId) {
        RoundTemplateResponse response = roundTemplateService.getRoundTemplateById(roundConfigId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Round template retrieved successfully", response));
    }
    
    @GetMapping
    @Operation(summary = "Get all round templates", 
               description = "Retrieves all round templates including active and inactive ones")
    public ResponseEntity<ApiResponse<List<RoundTemplateResponse>>> getAllRoundTemplates() {
        List<RoundTemplateResponse> responses = roundTemplateService.getAllRoundTemplates();
        return ResponseEntity.ok(new ApiResponse<>(true, "Round templates retrieved successfully", responses));
    }
    
    @PatchMapping("/{roundConfigId}")
    @Operation(summary = "Update round template", 
               description = "Updates a round template configuration. Only provided fields will be updated.")
    public ResponseEntity<ApiResponse<RoundTemplateResponse>> updateRoundTemplate(
            @PathVariable Long roundConfigId,
            @RequestBody RoundTemplateUpdateRequest request) {
        RoundTemplateResponse response = roundTemplateService.updateRoundTemplate(roundConfigId, request);
        return ResponseEntity.ok(new ApiResponse<>(true, "Round template updated successfully", response));
    }
    
    @DeleteMapping("/{roundConfigId}")
    @Operation(summary = "Soft delete round template", 
               description = "Toggles the isActive status of a round template (soft delete). " +
                             "If currently active, sets to inactive and vice versa.")
    public ResponseEntity<ApiResponse<RoundTemplateResponse>> deleteRoundTemplate(@PathVariable Long roundConfigId) {
        RoundTemplateResponse response = roundTemplateService.deleteRoundTemplate(roundConfigId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Round template status toggled successfully", response));
    }
}
