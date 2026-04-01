package com.kanini.springer.controller.Academy;

import com.kanini.springer.dto.Academy.TrainingScoreRequest;
import com.kanini.springer.dto.Academy.TrainingScoreResponse;
import com.kanini.springer.dto.Authentication.ApiResponse;
import com.kanini.springer.service.Academy.ITrainingScoreService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/academy/scores")
@RequiredArgsConstructor
@Validated
public class TrainingScoreController {
    
    private final ITrainingScoreService scoreService;
    
    @PostMapping
    public ResponseEntity<ApiResponse<TrainingScoreResponse>> createScore(
            @Valid @RequestBody TrainingScoreRequest request) {
        TrainingScoreResponse response = scoreService.createScore(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Training score created successfully", response));
    }
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<TrainingScoreResponse>>> getAllScores() {
        List<TrainingScoreResponse> response = scoreService.getAllScores();
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("All scores retrieved successfully", response));
    }
    
    @GetMapping("/{scoreId}")
    public ResponseEntity<ApiResponse<TrainingScoreResponse>> getScoreById(
            @PathVariable Integer scoreId) {
        TrainingScoreResponse response = scoreService.getScoreById(scoreId);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Score retrieved successfully", response));
    }
    
    @GetMapping("/student/{studentId}")
    public ResponseEntity<ApiResponse<List<TrainingScoreResponse>>> getScoresByStudent(
            @PathVariable Long studentId) {
        List<TrainingScoreResponse> response = scoreService.getScoresByStudent(studentId);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Scores for student " + studentId + " retrieved successfully", response));
    }
    
    @GetMapping("/course/{courseId}")
    public ResponseEntity<ApiResponse<List<TrainingScoreResponse>>> getScoresByCourse(
            @PathVariable Integer courseId) {
        List<TrainingScoreResponse> response = scoreService.getScoresByCourse(courseId);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Scores for course " + courseId + " retrieved successfully", response));
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<List<TrainingScoreResponse>>> getScoresByStatus(
            @PathVariable String status) {
        List<TrainingScoreResponse> response = scoreService.getScoresByStatus(status);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Scores with status " + status + " retrieved successfully", response));
    }
    
    @GetMapping("/reviewer/{reviewerId}")
    public ResponseEntity<ApiResponse<List<TrainingScoreResponse>>> getScoresByReviewer(
            @PathVariable Long reviewerId) {
        List<TrainingScoreResponse> response = scoreService.getScoresByReviewer(reviewerId);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Scores reviewed by " + reviewerId + " retrieved successfully", response));
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
}
