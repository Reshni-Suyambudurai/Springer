package com.kanini.springer.controller.Academy;

import com.kanini.springer.dto.Academy.TrainingProgramRequest;
import com.kanini.springer.dto.Academy.TrainingProgramResponse;
import com.kanini.springer.dto.Authentication.ApiResponse;
import com.kanini.springer.service.Academy.ITrainingProgramService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/academy/programs")
@RequiredArgsConstructor
@Validated
public class TrainingProgramController {
    
    private final ITrainingProgramService programService;
    
    @PostMapping
    public ResponseEntity<ApiResponse<TrainingProgramResponse>> createProgram(
            @Valid @RequestBody TrainingProgramRequest request) {
        TrainingProgramResponse response = programService.createProgram(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Training program created successfully", response));
    }
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<TrainingProgramResponse>>> getAllPrograms(
            @RequestParam(required = false) Boolean active) {
        List<TrainingProgramResponse> response;
        if (active != null) {
            response = programService.getProgramsByStatus(active);
        } else {
            response = programService.getAllPrograms();
        }
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Programs retrieved successfully", response));
    }

    @GetMapping("/{programId}")
    public ResponseEntity<ApiResponse<TrainingProgramResponse>> getProgramById(
            @PathVariable Integer programId) {
        TrainingProgramResponse response = programService.getProgramById(programId);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Program retrieved successfully", response));
    }
    
    @GetMapping("/years/all")
    public ResponseEntity<ApiResponse<List<Integer>>> getAllDistinctYears() {
        List<Integer> years = programService.getAllDistinctYears();
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Program years retrieved successfully", years));
    }
    
    @PatchMapping("/{programId}")
    public ResponseEntity<ApiResponse<TrainingProgramResponse>> updateProgram(
            @PathVariable Integer programId,
            @Valid @RequestBody TrainingProgramRequest request) {
        TrainingProgramResponse response = programService.updateProgram(programId, request);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Training program updated successfully", response));
    }
    
    @DeleteMapping("/{programId}")
    public ResponseEntity<ApiResponse<String>> deleteProgram(@PathVariable Integer programId) {
        programService.deleteProgram(programId);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Training program deleted successfully", null));
    }
}
