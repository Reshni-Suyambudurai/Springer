package com.kanini.springer.mapper.Academy;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kanini.springer.dto.Academy.TrainingScoreRequest;
import com.kanini.springer.dto.Academy.TrainingScoreResponse;
import com.kanini.springer.entity.Academy.TrainingScore;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class TrainingScoreMapper {
    
    public TrainingScoreResponse toResponse(TrainingScore entity) {
        if (entity == null) {
            return null;
        }
        
        TrainingScoreResponse response = new TrainingScoreResponse();
        response.setScoreId(entity.getScoreId() != null ? entity.getScoreId().intValue() : null);
        response.setScore(entity.getScore());
        // maxScore: 100 for technical, sum of sub-field maxScores for communication
        if (entity.getCourse() != null && Boolean.TRUE.equals(entity.getCourse().getIsCommunication())
                && entity.getCourse().getCommunicationTemplate() != null) {
            response.setMaxScore(sumMaxScoresFromTemplate(entity.getCourse().getCommunicationTemplate()));
        } else {
            response.setMaxScore(100);
        }
        response.setReview(entity.getReview());
        response.setStatus(entity.getStatus() != null ? entity.getStatus().toString() : null);
        response.setCommunicationBreakdown(entity.getCommunicationBreakdown());
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
        entity.setCommunicationBreakdown(request.getCommunicationBreakdown());
        
        return entity;
    }

    /** Sums all maxScore values from a communicationTemplate JSON string. Returns 0 on parse error. */
    public int sumMaxScoresFromTemplate(String template) {
        try {
            List<Map<String, Object>> fields = new ObjectMapper()
                    .readValue(template, new TypeReference<>() {});
            return fields.stream()
                    .mapToInt(f -> f.get("maxScore") instanceof Number n ? n.intValue() : 0)
                    .sum();
        } catch (Exception e) {
            return 0;
        }
    }
}
