package com.kanini.springer.mapper.Drive;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kanini.springer.dto.Drive.CandidateEvaluationResponse;
import com.kanini.springer.entity.Drive.Application;
import com.kanini.springer.entity.Drive.Candidate;
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
        Application application = evaluation.getApplication();
        if (application != null) {
            response.setApplicationId(application.getApplicationId());
            response.setRegistrationCode(application.getRegistrationCode());
            
            // Candidate info from application
            Candidate candidate = application.getCandidate();
            if (candidate != null) {
                response.setCandidateId(candidate.getCandidateId());
                response.setCandidateEmail(candidate.getEmail());
                String candidateName = candidate.getFirstName() +
                        (candidate.getLastName() != null ? " " + candidate.getLastName() : "");
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
