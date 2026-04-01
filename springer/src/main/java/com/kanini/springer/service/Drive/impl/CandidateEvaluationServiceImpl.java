package com.kanini.springer.service.Drive.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kanini.springer.dto.Common.FieldChangeDTO;
import com.kanini.springer.dto.Common.ManualOverrideRequest;
import com.kanini.springer.dto.Drive.*;
import com.kanini.springer.entity.Drive.Application;
import com.kanini.springer.entity.Drive.Candidate;
import com.kanini.springer.entity.Drive.CandidateEvaluation;
import com.kanini.springer.entity.Drive.RoundTemplate;
import com.kanini.springer.entity.HiringReq.User;
import com.kanini.springer.entity.enums.Enums.ApplicationStage;
import com.kanini.springer.entity.enums.Enums.EvaluationStatus;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.mapper.Drive.CandidateEvaluationMapper;
import com.kanini.springer.repository.Drive.ApplicationRepository;
import com.kanini.springer.repository.Drive.CandidateEvaluationRepository;
import com.kanini.springer.repository.Drive.CandidatesRepository;
import com.kanini.springer.repository.Drive.RoundTemplateRepository;
import com.kanini.springer.repository.Hiring.UserRepository;
import com.kanini.springer.service.Common.IOverrideService;
import com.kanini.springer.service.Drive.ICandidateEvaluationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CandidateEvaluationServiceImpl implements ICandidateEvaluationService {
    
    private final CandidateEvaluationRepository evaluationRepository;
    private final ApplicationRepository applicationRepository;
    private final RoundTemplateRepository roundTemplateRepository;
    private final UserRepository userRepository;
    private final CandidatesRepository candidatesRepository;
    private final CandidateEvaluationMapper mapper;
    private final ObjectMapper objectMapper;
    private final IOverrideService overrideService;
    
    @Override
    @Transactional
    public CandidateEvaluationResponse createEvaluation(CandidateEvaluationRequest request) {
        // Validate required fields
        if (request.getApplicationId() == null) {
            throw new ValidationException("Application ID is required");
        }
        if (request.getRoundConfigId() == null) {
            throw new ValidationException("Round config ID is required");
        }
        if (request.getScore() == null) {
            throw new ValidationException("Score is required");
        }
        if (request.getEvaluationStatus() == null || request.getEvaluationStatus().isBlank()) {
            throw new ValidationException("Evaluation status is required");
        }
        if (request.getReviewedBy() == null) {
            throw new ValidationException("Reviewed by user ID is required");
        }
        
        // Fetch application
        Application application = applicationRepository.findById(request.getApplicationId())
            .orElseThrow(() -> new ResourceNotFoundException("Application", "ID", request.getApplicationId()));
        
        // Fetch round template
        RoundTemplate roundTemplate = roundTemplateRepository.findById(request.getRoundConfigId())
            .orElseThrow(() -> new ResourceNotFoundException("Round template", "ID", request.getRoundConfigId()));
        
        // Fetch reviewed by user
        User reviewedByUser = userRepository.findById(request.getReviewedBy())
            .orElseThrow(() -> new ResourceNotFoundException("User", "ID", request.getReviewedBy()));
        
        // Parse evaluation status
        EvaluationStatus evaluationStatus;
        try {
            evaluationStatus = EvaluationStatus.valueOf(request.getEvaluationStatus());
        } catch (IllegalArgumentException e) {
            throw new ValidationException("Invalid evaluation status: " + request.getEvaluationStatus());
        }
        
        // Create evaluation
        CandidateEvaluation evaluation = new CandidateEvaluation();
        evaluation.setApplication(application);
        evaluation.setRoundConfig(roundTemplate);
        evaluation.setScore(request.getScore());
        evaluation.setReview(request.getReview());
        evaluation.setStatus(evaluationStatus);
        evaluation.setReviewedBy(reviewedByUser);
        
        // Serialize sectionScore to JSON string if provided
        if (request.getSectionScore() != null) {
            try {
                String sectionScoreJson = objectMapper.writeValueAsString(request.getSectionScore());
                evaluation.setSectionScore(sectionScoreJson);
            } catch (JsonProcessingException e) {
                throw new ValidationException("Failed to serialize sectionScore to JSON: " + e.getMessage());
            }
        }
        
        // Save evaluation
        CandidateEvaluation savedEvaluation = evaluationRepository.save(evaluation);
        
        // Update candidate status if FAIL
        if (evaluationStatus == EvaluationStatus.FAIL) {
            updateCandidateStatusOnFailure(application.getCandidate(), roundTemplate.getRoundName());
        }
        
        return mapper.toResponse(savedEvaluation);
    }
    
    @Override
    @Transactional
    public BulkCandidateEvaluationResponse bulkCreateEvaluations(BulkCandidateEvaluationRequest request) {
        BulkCandidateEvaluationResponse response = new BulkCandidateEvaluationResponse();
        
        // Validate required fields
        if (request.getRoundConfigId() == null) {
            throw new ValidationException("Round config ID is required");
        }
        if (request.getReviewedBy() == null) {
            throw new ValidationException("Reviewed by user ID is required");
        }
        if (request.getEvaluations() == null || request.getEvaluations().isEmpty()) {
            throw new ValidationException("Evaluations list cannot be empty");
        }
        
        // Fetch round template (common for all)
        RoundTemplate roundTemplate = roundTemplateRepository.findById(request.getRoundConfigId())
            .orElseThrow(() -> new ResourceNotFoundException("Round template", "ID", request.getRoundConfigId()));
        
        // Fetch reviewed by user (common for all)
        User reviewedByUser = userRepository.findById(request.getReviewedBy())
            .orElseThrow(() -> new ResourceNotFoundException("User", "ID", request.getReviewedBy()));
        
        int totalProcessed = 0;
        int successCount = 0;
        int failureCount = 0;
        
        for (BulkCandidateEvaluationRequest.EvaluationData evalData : request.getEvaluations()) {
            totalProcessed++;
            
            try {
                // Validate individual evaluation data
                if (evalData.getApplicationId() == null) {
                    response.getErrorMessages().add("Application ID is required for evaluation " + totalProcessed);
                    failureCount++;
                    continue;
                }
                if (evalData.getScore() == null) {
                    response.getErrorMessages().add("Score is required for application " + evalData.getApplicationId());
                    failureCount++;
                    continue;
                }
                if (evalData.getEvaluationStatus() == null || evalData.getEvaluationStatus().isBlank()) {
                    response.getErrorMessages().add("Evaluation status is required for application " + evalData.getApplicationId());
                    failureCount++;
                    continue;
                }
                
                // Fetch application
                Application application = applicationRepository.findById(evalData.getApplicationId()).orElse(null);
                
                if (application == null) {
                    response.getErrorMessages().add("Application with ID " + evalData.getApplicationId() + " not found");
                    failureCount++;
                    continue;
                }
                
                // Parse evaluation status
                EvaluationStatus evaluationStatus;
                try {
                    evaluationStatus = EvaluationStatus.valueOf(evalData.getEvaluationStatus());
                } catch (IllegalArgumentException e) {
                    response.getErrorMessages().add("Invalid evaluation status for application " + evalData.getApplicationId() + ": " + evalData.getEvaluationStatus());
                    failureCount++;
                    continue;
                }
                
                // Create evaluation
                CandidateEvaluation evaluation = new CandidateEvaluation();
                evaluation.setApplication(application);
                evaluation.setRoundConfig(roundTemplate);
                evaluation.setScore(evalData.getScore());
                evaluation.setReview(evalData.getReview());
                evaluation.setStatus(evaluationStatus);
                evaluation.setReviewedBy(reviewedByUser);
                
                // Serialize sectionScore to JSON string if provided
                if (evalData.getSectionScore() != null) {
                    try {
                        String sectionScoreJson = objectMapper.writeValueAsString(evalData.getSectionScore());
                        evaluation.setSectionScore(sectionScoreJson);
                    } catch (JsonProcessingException e) {
                        response.getErrorMessages().add("Failed to serialize sectionScore for application " + evalData.getApplicationId());
                        failureCount++;
                        continue;
                    }
                }
                
                // Save evaluation
                CandidateEvaluation savedEvaluation = evaluationRepository.save(evaluation);
                
                // Update candidate status if FAIL
                if (evaluationStatus == EvaluationStatus.FAIL) {
                    updateCandidateStatusOnFailure(application.getCandidate(), roundTemplate.getRoundName());
                }
                
                response.getSuccessfulEvaluations().add(mapper.toResponse(savedEvaluation));
                successCount++;
                
            } catch (Exception e) {
                response.getErrorMessages().add("Error processing evaluation for application " + 
                        (evalData.getApplicationId() != null ? evalData.getApplicationId() : "unknown") + 
                        ": " + e.getMessage());
                failureCount++;
            }
        }
        
        response.setTotalProcessed(totalProcessed);
        response.setSuccessCount(successCount);
        response.setFailureCount(failureCount);
        
        return response;
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<CandidateEvaluationResponse> getAllEvaluations() {
        List<CandidateEvaluation> evaluations = evaluationRepository.findAll();
        
        return evaluations.stream()
            .map(mapper::toResponse)
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<CandidateEvaluationResponse> getEvaluationsByApplicationId(Long applicationId) {
        if (applicationId == null) {
            throw new ValidationException("Application ID is required");
        }
        
        List<CandidateEvaluation> evaluations = evaluationRepository.findByApplicationApplicationId(applicationId);
        
        return evaluations.stream()
            .map(mapper::toResponse)
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<CandidateEvaluationSummaryResponse> getEvaluationsSummaryByDriveId(Long driveId) {
        if (driveId == null) {
            throw new ValidationException("Drive ID is required");
        }
        
        // Get all applications for the drive
        List<Application> applications = applicationRepository.findByDriveDriveId(driveId);
        
        // Map to store candidate evaluations grouped by applicationId
        Map<Long, CandidateEvaluationSummaryResponse> candidateMap = new LinkedHashMap<>();
        
        for (Application application : applications) {
            // Get all evaluations for this application
            List<CandidateEvaluation> evaluations = evaluationRepository.findByApplicationApplicationId(application.getApplicationId());
            
            if (!evaluations.isEmpty()) {
                // Create summary response for this candidate
                CandidateEvaluationSummaryResponse summary = new CandidateEvaluationSummaryResponse();
                summary.setApplicationId(application.getApplicationId());
                
                // Set candidate info
                if (application.getCandidate() != null) {
                    summary.setCandidateId(application.getCandidate().getCandidateId());
                    String candidateName = application.getCandidate().getFirstName() + 
                            (application.getCandidate().getLastName() != null ? 
                                    " " + application.getCandidate().getLastName() : "");
                    summary.setCandidateName(candidateName);
                }
                
                // Add round evaluations
                List<CandidateEvaluationSummaryResponse.RoundEvaluationData> roundDataList = new ArrayList<>();
                for (CandidateEvaluation eval : evaluations) {
                    CandidateEvaluationSummaryResponse.RoundEvaluationData roundData = 
                        new CandidateEvaluationSummaryResponse.RoundEvaluationData();
                    
                    if (eval.getRoundConfig() != null) {
                        roundData.setRoundConfigId(eval.getRoundConfig().getRoundConfigId());
                        roundData.setRoundName(eval.getRoundConfig().getRoundName());
                    }
                    
                    roundData.setScore(eval.getScore());
                    roundData.setReview(eval.getReview());
                    
                    if (eval.getStatus() != null) {
                        roundData.setStatus(eval.getStatus().toString());
                    }
                    
                    roundDataList.add(roundData);
                }
                
                summary.setEvaluations(roundDataList);
                candidateMap.put(application.getApplicationId(), summary);
            }
        }
        
        return new ArrayList<>(candidateMap.values());
    }
    
    @Override
    @Transactional
    public CandidateEvaluationResponse updateEvaluationStatus(Long scoreId, EvaluationStatusUpdateRequest request) {
        if (scoreId == null) {
            throw new ValidationException("Score ID is required");
        }
        
        if (request.getEvaluationStatus() == null || request.getEvaluationStatus().isBlank()) {
            throw new ValidationException("Evaluation status is required");
        }
        
        if (request.getUpdatedBy() == null) {
            throw new ValidationException("Updated by user ID is required");
        }
        
        // Find evaluation
        CandidateEvaluation evaluation = evaluationRepository.findById(scoreId)
            .orElseThrow(() -> new ResourceNotFoundException("Evaluation", "ID", scoreId));
        
        // Store old status for comparison
        EvaluationStatus oldStatus = evaluation.getStatus();
        
        // Parse new status
        EvaluationStatus newStatus;
        try {
            newStatus = EvaluationStatus.valueOf(request.getEvaluationStatus());
        } catch (IllegalArgumentException e) {
            throw new ValidationException("Invalid evaluation status: " + request.getEvaluationStatus());
        }
        
        // Update status
        evaluation.setStatus(newStatus);
        
        Candidate candidate = evaluation.getApplication().getCandidate();
        String roundName = evaluation.getRoundConfig().getRoundName();
        
        // Handle status change logic
        if (newStatus == EvaluationStatus.ABSENT) {
            // Update candidate status to REJECTED and update reason
            updateCandidateStatusOnAbsent(candidate, roundName);
        } 
        else if (oldStatus == EvaluationStatus.PASS && newStatus == EvaluationStatus.FAIL) {
            // PASS → FAIL: Update candidate to REJECTED, log override
            updateCandidateStatusOnFailure(candidate, roundName);
            logManualOverride(candidate, oldStatus, newStatus, "Evaluation status changed from PASS to FAIL", request.getUpdatedBy());
        } 
        else if (oldStatus == EvaluationStatus.FAIL && newStatus == EvaluationStatus.PASS) {
            // FAIL → PASS: Update candidate to SHORTLISTED, log override
            updateCandidateStatusOnPassAfterFail(candidate, roundName);
            logManualOverride(candidate, oldStatus, newStatus, "Evaluation status changed from FAIL to PASS", request.getUpdatedBy());
        }
        
        return mapper.toResponse(evaluation);
    }
    
    /**
     * Helper method to update candidate status when evaluation fails
     */
    private void updateCandidateStatusOnFailure(Candidate candidate, String roundName) {
        candidate.setApplicationStage(ApplicationStage.REJECTED);
        
        String failReason = "Failed in " + roundName;
        if (candidate.getReason() != null && !candidate.getReason().isBlank()) {
            candidate.setReason(candidate.getReason() + ". " + failReason);
        } else {
            candidate.setReason(failReason);
        }
    }
    
    /**
     * Helper method to update candidate status when marked absent
     */
    private void updateCandidateStatusOnAbsent(Candidate candidate, String roundName) {
        candidate.setApplicationStage(ApplicationStage.REJECTED);
        
        String absentReason = "Absent in " + roundName;
        if (candidate.getReason() != null && !candidate.getReason().isBlank()) {
            candidate.setReason(candidate.getReason() + ". " + absentReason);
        } else {
            candidate.setReason(absentReason);
        }
    }
    
    /**
     * Helper method to update candidate status when changed from FAIL to PASS
     */
    private void updateCandidateStatusOnPassAfterFail(Candidate candidate, String roundName) {
        candidate.setApplicationStage(ApplicationStage.SHORTLISTED);
        
        String passReason = "Re-evaluated and passed in " + roundName;
        if (candidate.getReason() != null && !candidate.getReason().isBlank()) {
            candidate.setReason(candidate.getReason() + ". " + passReason);
        } else {
            candidate.setReason(passReason);
        }
    }
    
    /**
     * Helper method to log manual override
     */
    private void logManualOverride(Candidate candidate, EvaluationStatus oldStatus, EvaluationStatus newStatus, 
                                    String reason, Long updatedBy) {
        try {
            List<FieldChangeDTO> changes = new ArrayList<>();
            
            FieldChangeDTO statusChange = new FieldChangeDTO();
            statusChange.setField("evaluationStatus");
            statusChange.setOld(oldStatus != null ? oldStatus.toString() : null);
            statusChange.setNewValue(newStatus.toString());
            changes.add(statusChange);
            
            FieldChangeDTO candidateStatusChange = new FieldChangeDTO();
            candidateStatusChange.setField("applicationStage");
            candidateStatusChange.setOld(candidate.getApplicationStage() != null ? candidate.getApplicationStage().toString() : null);
            candidateStatusChange.setNewValue(candidate.getApplicationStage().toString());
            changes.add(candidateStatusChange);
            
            ManualOverrideRequest overrideRequest = new ManualOverrideRequest();
            overrideRequest.setEntityType("CANDIDATE_EVALUATION");
            overrideRequest.setEntityId(candidate.getCandidateId());
            overrideRequest.setChanges(changes);
            overrideRequest.setOverrideReason(reason);
            overrideRequest.setCreatedBy(updatedBy);
            
            overrideService.logOverride(overrideRequest);
        } catch (Exception e) {
            System.err.println("Error logging manual override: " + e.getMessage());
        }
    }
}
