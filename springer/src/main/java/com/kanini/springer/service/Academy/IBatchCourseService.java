package com.kanini.springer.service.Academy;

import com.kanini.springer.dto.Academy.BatchCourseRequest;
import com.kanini.springer.dto.Academy.BatchCourseResponse;

import java.util.List;

public interface IBatchCourseService {
    
    BatchCourseResponse linkCourseToBatch(BatchCourseRequest request);

    BatchCourseResponse updateBatchCourseStatus(Integer batchCourseId, String status);

    BatchCourseResponse getBatchCourseById(Integer batchCourseId);
    
    List<BatchCourseResponse> getAllBatchCourses();
    
    List<BatchCourseResponse> getCoursesByProgram(Integer programId);
    
    List<BatchCourseResponse> getCoursesByBatch(Integer programId, Integer batchNumber);
    
    List<BatchCourseResponse> getCoursesByTrainingCourse(Integer courseId);
    
    void removeCourseFromBatch(Integer batchCourseId);
}
