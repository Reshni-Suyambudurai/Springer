package com.kanini.springer.mapper.Drive;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kanini.springer.dto.Drive.CandidateEvaluationResponse;
import com.kanini.springer.entity.Drive.CandidateEvaluation;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CandidateEvaluationMapper {
    
    private final ObjectMapper objectMapper;
    
    /**
     * Convert CandidateEvaluation entity to CandidateEvaluationResponse DTO
     */
    public CandidateEvaluationResponse toResponse(CandidateEvaluation evaluation) {
        if (evaluation == null) {
            return null;
        }
        
        CandidateEvaluationResponse response = new CandidateEvaluationResponse();
        response.setScoreId(evaluation.getScoreId());
        
        // Application info
        if (evaluation.getApplication() != null) {
            response.setApplicationId(evaluation.getApplication().getApplicationId());
            
            // Candidate info from application
            if (evaluation.getApplication().getCandidate() != null) {
                response.setCandidateId(evaluation.getApplication().getCandidate().getCandidateId());
                String candidateName = evaluation.getApplication().getCandidate().getFirstName() + 
                        (evaluation.getApplication().getCandidate().getLastName() != null ? 
                                " " + evaluation.getApplication().getCandidate().getLastName() : "");
                response.setCandidateName(candidateName);
            }
        }
        
        // Round config info
        if (evaluation.getRoundConfig() != null) {
            response.setRoundConfigId(evaluation.getRoundConfig().getRoundConfigId());
            response.setRoundName(evaluation.getRoundConfig().getRoundName());
        }
        
        response.setScore(evaluation.getScore());
        
        // Deserialize sectionScore JSON string to Object
        if (evaluation.getSectionScore() != null && !evaluation.getSectionScore().isBlank()) {
            try {
                Object sectionScoreObject = objectMapper.readValue(evaluation.getSectionScore(), Object.class);
                response.setSectionScore(sectionScoreObject);
            } catch (JsonProcessingException e) {
                // If parsing fails, return the raw string
                response.setSectionScore(evaluation.getSectionScore());
            }
        }
        
        response.setReview(evaluation.getReview());
        
        if (evaluation.getStatus() != null) {
            response.setEvaluationStatus(evaluation.getStatus().toString());
        }
        
        // Reviewed by user info
        if (evaluation.getReviewedBy() != null) {
            response.setReviewedBy(evaluation.getReviewedBy().getUserId());
            response.setReviewedByName(evaluation.getReviewedBy().getUsername());
        }
        
        response.setReviewedAt(evaluation.getReviewedAt());
        
        return response;
    }
}
