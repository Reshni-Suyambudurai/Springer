package com.kanini.springer.service.Drive.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kanini.springer.dto.Drive.RoundTemplateRequest;
import com.kanini.springer.dto.Drive.RoundTemplateResponse;
import com.kanini.springer.dto.Drive.RoundTemplateUpdateRequest;
import com.kanini.springer.entity.Drive.RoundTemplate;
import com.kanini.springer.entity.HiringReq.User;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.mapper.Drive.RoundTemplateMapper;
import com.kanini.springer.repository.Drive.RoundTemplateRepository;
import com.kanini.springer.repository.Hiring.UserRepository;
import com.kanini.springer.service.Drive.IRoundTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoundTemplateServiceImpl implements IRoundTemplateService {
    
    private final RoundTemplateRepository roundTemplateRepository;
    private final UserRepository userRepository;
    private final RoundTemplateMapper mapper;
    private final ObjectMapper objectMapper;
    
    @Override
    @Transactional
    public RoundTemplateResponse createRoundTemplate(RoundTemplateRequest request) {
        // Validate required fields
        if (request.getRoundNo() == null) {
            throw new ValidationException("Round number is required");
        }
        if (request.getRoundName() == null || request.getRoundName().isBlank()) {
            throw new ValidationException("Round name is required");
        }
        if (request.getOutoffScore() == null) {
            throw new ValidationException("Out of score is required");
        }
        if (request.getMinScore() == null) {
            throw new ValidationException("Minimum score is required");
        }
        if (request.getWeightage() == null) {
            throw new ValidationException("Weightage is required");
        }
        if (request.getCreatedBy() == null) {
            throw new ValidationException("Created by user ID is required");
        }
        
        // Convert request to entity using mapper
        RoundTemplate roundTemplate = mapper.toEntity(request);
        
        // Save round template
        RoundTemplate savedRoundTemplate = roundTemplateRepository.save(roundTemplate);
        
        return mapper.toResponse(savedRoundTemplate);
    }
    
    @Override
    @Transactional(readOnly = true)
    public RoundTemplateResponse getRoundTemplateById(Long roundConfigId) {
        if (roundConfigId == null) {
            throw new ValidationException("Round template ID is required");
        }
        
        RoundTemplate roundTemplate = roundTemplateRepository.findById(roundConfigId)
            .orElseThrow(() -> new ResourceNotFoundException("Round template", "ID", roundConfigId));
        
        return mapper.toResponse(roundTemplate);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<RoundTemplateResponse> getAllRoundTemplates() {
        List<RoundTemplate> roundTemplates = roundTemplateRepository.findAll();
        
        return roundTemplates.stream()
            .map(mapper::toResponse)
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional
    public RoundTemplateResponse updateRoundTemplate(Long roundConfigId, RoundTemplateUpdateRequest request) {
        if (roundConfigId == null) {
            throw new ValidationException("Round template ID is required");
        }
        
        // Find existing round template
        RoundTemplate roundTemplate = roundTemplateRepository.findById(roundConfigId)
            .orElseThrow(() -> new ResourceNotFoundException("Round template", "ID", roundConfigId));
        
        // Update fields if provided
        if (request.getRoundNo() != null) {
            roundTemplate.setRoundNo(request.getRoundNo());
        }
        
        if (request.getRoundName() != null && !request.getRoundName().isBlank()) {
            roundTemplate.setRoundName(request.getRoundName());
        }
        
        if (request.getOutoffScore() != null) {
            roundTemplate.setOutoffScore(request.getOutoffScore());
        }
        
        if (request.getMinScore() != null) {
            roundTemplate.setMinScore(request.getMinScore());
        }
        
        if (request.getWeightage() != null) {
            roundTemplate.setWeightage(request.getWeightage());
        }
        
        if (request.getSections() != null) {
            // Serialize Object to JSON string for database storage
            try {
                String sectionsJson = objectMapper.writeValueAsString(request.getSections());
                roundTemplate.setSections(sectionsJson);
            } catch (JsonProcessingException e) {
                throw new ValidationException("Failed to serialize sections to JSON: " + e.getMessage());
            }
        }
        
        if (request.getIsActive() != null) {
            roundTemplate.setIsActive(request.getIsActive());
        }
        
        // Save updated round template
        RoundTemplate updatedRoundTemplate = roundTemplateRepository.save(roundTemplate);
        
        return mapper.toResponse(updatedRoundTemplate);
    }
    
    @Override
    @Transactional
    public RoundTemplateResponse deleteRoundTemplate(Long roundConfigId) {
        if (roundConfigId == null) {
            throw new ValidationException("Round template ID is required");
        }
        
        // Find existing round template
        RoundTemplate roundTemplate = roundTemplateRepository.findById(roundConfigId)
            .orElseThrow(() -> new ResourceNotFoundException("Round template", "ID", roundConfigId));
        
        // Toggle isActive status (soft delete)
        roundTemplate.setIsActive(!roundTemplate.getIsActive());
        
        // Save updated round template
        RoundTemplate updatedRoundTemplate = roundTemplateRepository.save(roundTemplate);
        
        return mapper.toResponse(updatedRoundTemplate);
    }
}
