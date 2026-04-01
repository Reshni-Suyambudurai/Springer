package com.kanini.springer.service.Academy;

import com.kanini.springer.dto.Academy.TrainingCourseRequest;
import com.kanini.springer.dto.Academy.TrainingCourseResponse;

import java.util.List;

public interface ITrainingCourseService {
    
    TrainingCourseResponse createCourse(TrainingCourseRequest request);
    
    TrainingCourseResponse getCourseById(Integer courseId);
    
    List<TrainingCourseResponse> getAllCourses();
    
    List<TrainingCourseResponse> getCoursesByStatus(String status);
    
    List<TrainingCourseResponse> getCoursesByTrainer(Long trainerId);
    
    TrainingCourseResponse updateCourse(Integer courseId, TrainingCourseRequest request);
    
    void deleteCourse(Integer courseId);
    
    TrainingCourseResponse updateCourseStatus(Integer courseId, String status);
}
