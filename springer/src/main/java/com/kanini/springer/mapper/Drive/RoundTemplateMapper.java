package com.kanini.springer.mapper.Drive;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kanini.springer.dto.Drive.RoundTemplateRequest;
import com.kanini.springer.dto.Drive.RoundTemplateResponse;
import com.kanini.springer.entity.Drive.RoundTemplate;
import com.kanini.springer.entity.HiringReq.User;
import com.kanini.springer.repository.Hiring.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RoundTemplateMapper {
    
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    
    /**
     * Convert RoundTemplate entity to RoundTemplateResponse DTO
     */
    public RoundTemplateResponse toResponse(RoundTemplate roundTemplate) {
        if (roundTemplate == null) {
            return null;
        }
        
        RoundTemplateResponse response = new RoundTemplateResponse();
        response.setRoundConfigId(roundTemplate.getRoundConfigId());
        response.setRoundNo(roundTemplate.getRoundNo());
        response.setRoundName(roundTemplate.getRoundName());
        response.setOutoffScore(roundTemplate.getOutoffScore());
        response.setMinScore(roundTemplate.getMinScore());
        response.setWeightage(roundTemplate.getWeightage());
        
        // Deserialize JSON string to Object for response
        if (roundTemplate.getSections() != null && !roundTemplate.getSections().isBlank()) {
            try {
                Object sectionsObject = objectMapper.readValue(roundTemplate.getSections(), Object.class);
                response.setSections(sectionsObject);
            } catch (JsonProcessingException e) {
                // If parsing fails, return the raw string
                response.setSections(roundTemplate.getSections());
            }
        }
        
        response.setIsActive(roundTemplate.getIsActive());
        response.setCreatedAt(roundTemplate.getCreatedAt());
        
        // Created by user info
        if (roundTemplate.getCreatedBy() != null) {
            response.setCreatedBy(roundTemplate.getCreatedBy().getUserId());
            response.setCreatedByName(roundTemplate.getCreatedBy().getUsername());
        }
        
        return response;
    }
    
    /**
     * Convert RoundTemplateRequest DTO to RoundTemplate entity
     */
    public RoundTemplate toEntity(RoundTemplateRequest request) {
        if (request == null) {
            return null;
        }
        
        RoundTemplate roundTemplate = new RoundTemplate();
        roundTemplate.setRoundNo(request.getRoundNo());
        roundTemplate.setRoundName(request.getRoundName());
        roundTemplate.setOutoffScore(request.getOutoffScore());
        roundTemplate.setMinScore(request.getMinScore());
        roundTemplate.setWeightage(request.getWeightage());
        
        // Serialize Object to JSON string for database storage
        if (request.getSections() != null) {
            try {
                String sectionsJson = objectMapper.writeValueAsString(request.getSections());
                roundTemplate.setSections(sectionsJson);
            } catch (JsonProcessingException e) {
                throw new RuntimeException("Failed to serialize sections to JSON: " + e.getMessage());
            }
        }
        
        // Set isActive (default true)
        roundTemplate.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
        
        // Fetch and set created by user
        if (request.getCreatedBy() != null) {
            User createdByUser = userRepository.findById(request.getCreatedBy())
                .orElseThrow(() -> new RuntimeException("Created by user not found with ID: " + request.getCreatedBy()));
            roundTemplate.setCreatedBy(createdByUser);
        }
        
        return roundTemplate;
    }
}
