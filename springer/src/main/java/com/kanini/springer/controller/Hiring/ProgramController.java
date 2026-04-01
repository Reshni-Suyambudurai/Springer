package com.kanini.springer.controller.Hiring;

import com.kanini.springer.dto.Authentication.ApiResponse;
import com.kanini.springer.dto.Hiring.InstituteProgramRequest;
import com.kanini.springer.dto.Hiring.ProgramResponse;
import com.kanini.springer.service.Hiring.IProgramService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/programs")
@RequiredArgsConstructor
@Tag(name = "Program Management", description = "APIs for managing academic programs and institute-program mappings")
public class ProgramController {
    
    private final IProgramService programService;
    
    @GetMapping
    @Operation(summary = "Get all programs", description = "Retrieves all available academic programs with their IDs and names")
    public ResponseEntity<ApiResponse<List<ProgramResponse>>> getAllPrograms() {
        List<ProgramResponse> responses = programService.getAllPrograms();
        return ResponseEntity.ok(new ApiResponse<>(true, "Programs retrieved successfully", responses));
    }
    
    @PostMapping("/institute-mappings")
    @Operation(summary = "Add programs to institute(s)", description = "Creates one or more mappings between institutes and programs. Accepts an array of {instituteId, programId} objects.")
    public ResponseEntity<ApiResponse<Void>> addProgramsToInstitute(@RequestBody List<InstituteProgramRequest> requests) {
        if (requests == null || requests.isEmpty()) {
            throw new RuntimeException("Request body cannot be empty");
        }
        
        programService.addProgramsToInstitute(requests);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(true, "Program mappings created successfully", null));
    }
    
    @DeleteMapping("/institute-mappings/{id}")
    @Operation(summary = "Delete institute-program mapping", description = "Removes a specific mapping between an institute and a program by the mapping ID")
    public ResponseEntity<ApiResponse<Void>> removeInstituteProgramMapping(@PathVariable("id") Long instituteProgramId) {
        programService.removeInstituteProgramMapping(instituteProgramId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Institute-program mapping deleted successfully", null));
    }
}
