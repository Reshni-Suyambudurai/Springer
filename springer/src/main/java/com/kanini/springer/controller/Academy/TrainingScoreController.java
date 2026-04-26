package com.kanini.springer.controller.Academy;

import com.kanini.springer.dto.Academy.ExcelUploadResponse;
import com.kanini.springer.dto.Academy.TrainingScoreRequest;
import com.kanini.springer.dto.Academy.TrainingScoreResponse;
import com.kanini.springer.dto.Authentication.ApiResponse;
import com.kanini.springer.service.Academy.ITrainingScoreService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/academy/scores")
@RequiredArgsConstructor
@Validated
public class TrainingScoreController {

    private static final String RETRIEVED_SUCCESSFULLY = " retrieved successfully";

    private final ITrainingScoreService scoreService;
    
    @PostMapping
    public ResponseEntity<ApiResponse<TrainingScoreResponse>> createScore(
            @Valid @RequestBody TrainingScoreRequest request) {
        TrainingScoreResponse response = scoreService.createScore(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Training score created successfully", response));
    }
    
    @GetMapping("/student/{studentId}")
    public ResponseEntity<ApiResponse<List<TrainingScoreResponse>>> getScoresByStudent(
            @PathVariable Long studentId) {
        List<TrainingScoreResponse> response = scoreService.getScoresByStudent(studentId);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Scores for student " + studentId + RETRIEVED_SUCCESSFULLY, response));
    }
    
    @GetMapping("/batch")
    public ResponseEntity<ApiResponse<List<TrainingScoreResponse>>> getScoresByBatchAndCourse(
            @RequestParam Integer programId,
            @RequestParam Integer batchNumber,
            @RequestParam Integer courseId) {
        List<TrainingScoreResponse> response = scoreService.getScoresByBatchAndCourse(programId, batchNumber, courseId);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Scores retrieved successfully", response));
    }
    
    @PatchMapping("/{scoreId}")
    public ResponseEntity<ApiResponse<TrainingScoreResponse>> updateScore(
            @PathVariable Integer scoreId,
            @Valid @RequestBody TrainingScoreRequest request) {
        TrainingScoreResponse response = scoreService.updateScore(scoreId, request);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Training score updated successfully", response));
    }
    
    @DeleteMapping("/{scoreId}")
    public ResponseEntity<ApiResponse<String>> deleteScore(@PathVariable Integer scoreId) {
        scoreService.deleteScore(scoreId);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Training score deleted successfully", null));
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ExcelUploadResponse>> uploadScores(
            @RequestPart("file") MultipartFile file,
            @RequestParam Integer programId,
            @RequestParam Integer batchNumber,
            @RequestParam Integer courseId,
            @RequestParam Long reviewedBy) {
        ExcelUploadResponse response = scoreService.uploadScoresFromExcel(file, programId, batchNumber, courseId, reviewedBy);
        String message = response.getSavedCount() + " score(s) saved, " + response.getFailedCount() + " failed out of " + response.getTotalRows();
        return ResponseEntity.ok(ApiResponse.success(message, response));
    }
}
