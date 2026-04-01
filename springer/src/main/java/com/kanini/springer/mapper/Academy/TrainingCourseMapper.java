package com.kanini.springer.mapper.Academy;

import com.kanini.springer.dto.Academy.TrainingCourseRequest;
import com.kanini.springer.dto.Academy.TrainingCourseResponse;
import com.kanini.springer.entity.Academy.TrainingCourse;
import org.springframework.stereotype.Component;

@Component
public class TrainingCourseMapper {
    
    public TrainingCourseResponse toResponse(TrainingCourse entity) {
        if (entity == null) {
            return null;
        }
        
        TrainingCourseResponse response = new TrainingCourseResponse();
        response.setCourseId(entity.getCourseId());
        response.setCourseName(entity.getCourseName());
        response.setDescription(entity.getDescription());
        response.setStartDate(entity.getStartDate() != null ? entity.getStartDate().toLocalDate() : null);
        response.setEndDate(entity.getEndDate() != null ? entity.getEndDate().toLocalDate() : null);
        response.setMinScore(entity.getMinScore());
        response.setWeightage(entity.getWeightage());
        response.setConductedBy(entity.getConductedBy() != null ? entity.getConductedBy().getUserId() : null);
        response.setStatus(entity.getStatus() != null ? entity.getStatus().toString() : null);
        response.setCreatedAt(entity.getCreatedAt());
        
        return response;
    }
    
    public TrainingCourse toEntity(TrainingCourseRequest request) {
        if (request == null) {
            return null;
        }
        
        TrainingCourse entity = new TrainingCourse();
        entity.setCourseName(request.getCourseName());
        entity.setDescription(request.getDescription());
        entity.setStartDate(request.getStartDate() != null ? request.getStartDate().atStartOfDay() : null);
        entity.setEndDate(request.getEndDate() != null ? request.getEndDate().atStartOfDay() : null);
        entity.setMinScore(request.getMinScore());
        entity.setWeightage(request.getWeightage());
        
        return entity;
    }
}
