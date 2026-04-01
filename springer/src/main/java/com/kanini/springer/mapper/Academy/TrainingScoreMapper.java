package com.kanini.springer.mapper.Academy;

import com.kanini.springer.dto.Academy.TrainingScoreRequest;
import com.kanini.springer.dto.Academy.TrainingScoreResponse;
import com.kanini.springer.entity.Academy.TrainingScore;
import org.springframework.stereotype.Component;

@Component
public class TrainingScoreMapper {
    
    public TrainingScoreResponse toResponse(TrainingScore entity) {
        if (entity == null) {
            return null;
        }
        
        TrainingScoreResponse response = new TrainingScoreResponse();
        response.setScoreId(entity.getScoreId() != null ? entity.getScoreId().intValue() : null);
        response.setScore(entity.getScore());
        response.setReview(entity.getReview());
        response.setStatus(entity.getStatus() != null ? entity.getStatus().toString() : null);
        response.setReviewedBy(entity.getReviewedBy() != null ? entity.getReviewedBy().getUserId() : null);
        response.setCreatedAt(entity.getCreatedAt());
        
        if (entity.getCourse() != null) {
            response.setCourseId(entity.getCourse().getCourseId());
        }
        
        if (entity.getStudent() != null) {
            response.setStudentId(entity.getStudent().getStudentId());
        }
        
        return response;
    }
    
    public TrainingScore toEntity(TrainingScoreRequest request) {
        if (request == null) {
            return null;
        }
        
        TrainingScore entity = new TrainingScore();
        entity.setScore(request.getScore());
        entity.setReview(request.getReview());
        
        return entity;
    }
}
