package com.kanini.springer.controller.Academy;

import com.kanini.springer.dto.Academy.BatchCourseRequest;
import com.kanini.springer.dto.Academy.BatchCourseResponse;
import com.kanini.springer.dto.Authentication.ApiResponse;
import com.kanini.springer.service.Academy.IBatchCourseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/academy/batch-courses")
@RequiredArgsConstructor
@Validated
public class BatchCourseController {

    private static final String RETRIEVED_SUCCESSFULLY = " retrieved successfully";

    private final IBatchCourseService batchCourseService;
    
    @PostMapping
    public ResponseEntity<ApiResponse<BatchCourseResponse>> linkCourseToBatch(
            @Valid @RequestBody BatchCourseRequest request) {
        BatchCourseResponse response = batchCourseService.linkCourseToBatch(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Course linked to batch successfully", response));
    }
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<BatchCourseResponse>>> getAllBatchCourses() {
        List<BatchCourseResponse> response = batchCourseService.getAllBatchCourses();
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("All batch-course links retrieved successfully", response));
    }
    
    @GetMapping("/{batchCourseId}")
    public ResponseEntity<ApiResponse<BatchCourseResponse>> getBatchCourseById(
            @PathVariable Integer batchCourseId) {
        BatchCourseResponse response = batchCourseService.getBatchCourseById(batchCourseId);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Batch course retrieved successfully", response));
    }
    
    @GetMapping("/program/{programId}")
    public ResponseEntity<ApiResponse<List<BatchCourseResponse>>> getCoursesByProgram(
            @PathVariable Integer programId) {
        List<BatchCourseResponse> response = batchCourseService.getCoursesByProgram(programId);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Courses for program " + programId + RETRIEVED_SUCCESSFULLY, response));
    }
    
    @GetMapping("/program/{programId}/batch/{batchNumber}")
    public ResponseEntity<ApiResponse<List<BatchCourseResponse>>> getCoursesByBatch(
            @PathVariable Integer programId,
            @PathVariable Integer batchNumber) {
        List<BatchCourseResponse> response = batchCourseService.getCoursesByBatch(programId, batchNumber);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Courses for batch " + batchNumber + RETRIEVED_SUCCESSFULLY, response));
    }
    
    @GetMapping("/course/{courseId}")
    public ResponseEntity<ApiResponse<List<BatchCourseResponse>>> getCoursesByTrainingCourse(
            @PathVariable Integer courseId) {
        List<BatchCourseResponse> response = batchCourseService.getCoursesByTrainingCourse(courseId);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Batches linked to course " + courseId + RETRIEVED_SUCCESSFULLY, response));
    }
    
    @PatchMapping("/{batchCourseId}/status")
    public ResponseEntity<ApiResponse<BatchCourseResponse>> updateBatchCourseStatus(
            @PathVariable Integer batchCourseId,
            @RequestParam String status) {
        BatchCourseResponse response = batchCourseService.updateBatchCourseStatus(batchCourseId, status);
        return ResponseEntity.ok(ApiResponse.success("Batch course status updated successfully", response));
    }

    @DeleteMapping("/{batchCourseId}")
    public ResponseEntity<ApiResponse<String>> removeCourseFromBatch(
            @PathVariable Integer batchCourseId) {
        batchCourseService.removeCourseFromBatch(batchCourseId);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Course removed from batch successfully", null));
    }

    @GetMapping("/conducted-by/{userId}")
    public ResponseEntity<ApiResponse<List<BatchCourseResponse>>> getCoursesByConductor(
            @PathVariable Long userId) {
        List<BatchCourseResponse> response = batchCourseService.getCoursesByConductor(userId);
        return ResponseEntity.ok(ApiResponse.success("Courses conducted by user" + RETRIEVED_SUCCESSFULLY, response));
    }

    @PatchMapping("/{batchCourseId}/reschedule")
    public ResponseEntity<ApiResponse<BatchCourseResponse>> rescheduleBatchCourse(
            @PathVariable Integer batchCourseId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        BatchCourseResponse response = batchCourseService.rescheduleBatchCourse(batchCourseId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success("Batch course rescheduled successfully", response));
    }
}
