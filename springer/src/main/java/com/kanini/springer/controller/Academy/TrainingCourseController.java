package com.kanini.springer.controller.Academy;

import com.kanini.springer.dto.Academy.TrainingCourseRequest;
import com.kanini.springer.dto.Academy.TrainingCourseResponse;
import com.kanini.springer.dto.Authentication.ApiResponse;
import com.kanini.springer.service.Academy.ITrainingCourseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/academy/courses")
@RequiredArgsConstructor
@Validated
public class TrainingCourseController {
    
    private final ITrainingCourseService courseService;
    
    @PostMapping
    public ResponseEntity<ApiResponse<TrainingCourseResponse>> createCourse(
            @Valid @RequestBody TrainingCourseRequest request) {
        TrainingCourseResponse response = courseService.createCourse(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Training course created successfully", response));
    }
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<TrainingCourseResponse>>> getAllCourses() {
        List<TrainingCourseResponse> response = courseService.getAllCourses();
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("All courses retrieved successfully", response));
    }
    
    @GetMapping("/{courseId}")
    public ResponseEntity<ApiResponse<TrainingCourseResponse>> getCourseById(
            @PathVariable Integer courseId) {
        TrainingCourseResponse response = courseService.getCourseById(courseId);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Course retrieved successfully", response));
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<List<TrainingCourseResponse>>> getCoursesByStatus(
            @PathVariable String status) {
        List<TrainingCourseResponse> response = courseService.getCoursesByStatus(status);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Courses with status " + status + " retrieved successfully", response));
    }
    
    @GetMapping("/trainer/{trainerId}")
    public ResponseEntity<ApiResponse<List<TrainingCourseResponse>>> getCoursesByTrainer(
            @PathVariable Long trainerId) {
        List<TrainingCourseResponse> response = courseService.getCoursesByTrainer(trainerId);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Courses conducted by trainer " + trainerId + " retrieved successfully", response));
    }
    
    @PatchMapping("/{courseId}")
    public ResponseEntity<ApiResponse<TrainingCourseResponse>> updateCourse(
            @PathVariable Integer courseId,
            @Valid @RequestBody TrainingCourseRequest request) {
        TrainingCourseResponse response = courseService.updateCourse(courseId, request);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Training course updated successfully", response));
    }
    
    @PatchMapping("/{courseId}/status")
    public ResponseEntity<ApiResponse<TrainingCourseResponse>> updateCourseStatus(
            @PathVariable Integer courseId,
            @RequestParam String status) {
        TrainingCourseResponse response = courseService.updateCourseStatus(courseId, status);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Course status updated to " + status, response));
    }
    
    @DeleteMapping("/{courseId}")
    public ResponseEntity<ApiResponse<String>> deleteCourse(@PathVariable Integer courseId) {
        courseService.deleteCourse(courseId);
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.success("Training course deleted successfully", null));
    }
}
