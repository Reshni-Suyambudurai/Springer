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
import com.kanini.springer.mapper.Drive.RoundTemplateMapper;
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
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
    private final RoundTemplateMapper roundTemplateMapper;
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
        if (request.getUpdatedBy() == null) {
            throw new ValidationException("Updated by user ID is required");
        }
        if (request.getEvaluations() == null || request.getEvaluations().isEmpty()) {
            throw new ValidationException("Evaluations list cannot be empty");
        }
        
        // 1. Fetch round template (1 DB hit)
        RoundTemplate roundTemplate = roundTemplateRepository.findById(request.getRoundConfigId())
            .orElseThrow(() -> new ResourceNotFoundException("Round template", "ID", request.getRoundConfigId()));
        
        // 2. Fetch user (1 DB hit)
        User updatedByUser = userRepository.findById(request.getUpdatedBy())
            .orElseThrow(() -> new ResourceNotFoundException("User", "ID", request.getUpdatedBy()));
        
        // 3. Collect all registration codes and batch fetch applications + candidates (1 DB hit)
        List<String> registrationCodes = request.getEvaluations().stream()
            .map(BulkCandidateEvaluationRequest.EvaluationData::getRegistrationCode)
            .filter(code -> code != null && !code.isBlank())
            .distinct()
            .collect(Collectors.toList());
        
        Map<String, Application> appByRegCode = Map.of();
        if (!registrationCodes.isEmpty()) {
            List<Application> applications = applicationRepository.findByRegistrationCodeInWithCandidate(registrationCodes);
            appByRegCode = applications.stream()
                .collect(Collectors.toMap(Application::getRegistrationCode, app -> app, (a, b) -> a));
        }
        
        // 4. Pre-fetch existing evaluations for this round to detect duplicates (1 DB hit)
        List<Long> allApplicationIds = appByRegCode.values().stream()
            .map(Application::getApplicationId)
            .collect(Collectors.toList());
        Set<Long> existingAppIds = Set.of();
        if (!allApplicationIds.isEmpty()) {
            existingAppIds = evaluationRepository
                .findByApplicationIdsAndRoundConfigIdFetched(allApplicationIds, request.getRoundConfigId())
                .stream()
                .map(e -> e.getApplication().getApplicationId())
                .collect(Collectors.toSet());
        }
        
        // 5. Validate all rows first (all-or-nothing)
        List<CandidateEvaluation> evaluationsToSave = new ArrayList<>();
        Map<Integer, String> errors = new LinkedHashMap<>();
        Set<Long> seenAppIds = new HashSet<>();
        
        List<BulkCandidateEvaluationRequest.EvaluationData> evalList = request.getEvaluations();
        for (int i = 0; i < evalList.size(); i++) {
            BulkCandidateEvaluationRequest.EvaluationData evalData = evalList.get(i);
            String name = evalData.getCandidateName() != null ? evalData.getCandidateName() : "Unknown";
            
            // Validate registration code
            if (evalData.getRegistrationCode() == null || evalData.getRegistrationCode().isBlank()) {
                errors.put(i, name + ": Registration code is required");
                continue;
            }
            
            // Look up application from pre-fetched map
            Application application = appByRegCode.get(evalData.getRegistrationCode());
            if (application == null) {
                errors.put(i, name + ": No application found for registration code " + evalData.getRegistrationCode());
                continue;
            }
            
            // Verify candidate exists
            Candidate candidate = application.getCandidate();
            if (candidate == null) {
                errors.put(i, name + ": No candidate linked to registration code " + evalData.getRegistrationCode());
                continue;
            }
            
            // Verify email against the candidate record
            if (evalData.getCandidateEmail() != null && !evalData.getCandidateEmail().isBlank()
                    && !evalData.getCandidateEmail().equalsIgnoreCase(candidate.getEmail())) {
                errors.put(i, name + ": Email mismatch — expected " + candidate.getEmail() + " but got " + evalData.getCandidateEmail());
                continue;
            }            
            // Check for duplicate in DB
            if (existingAppIds.contains(application.getApplicationId())) {
                errors.put(i, name + ": Evaluation already exists for this round");
                continue;
            }
            
            // Check for duplicate within this upload batch
            if (!seenAppIds.add(application.getApplicationId())) {
                errors.put(i, name + ": Duplicate entry in upload \u2014 registration code " + evalData.getRegistrationCode() + " appears more than once");
                continue;
            }            
            // Compute total score from sections
            int totalScore = 0;
            if (evalData.getSections() != null) {
                for (Number val : evalData.getSections().values()) {
                    totalScore += (val != null ? val.intValue() : 0);
                }
            }
            
            // Build evaluation entity
            CandidateEvaluation evaluation = new CandidateEvaluation();
            evaluation.setApplication(application);
            evaluation.setRoundConfig(roundTemplate);
            evaluation.setScore(totalScore);
            evaluation.setStatus(EvaluationStatus.PENDING);
            evaluation.setReviewedBy(updatedByUser);
            
            // Serialize sections to JSON sectionScore
            if (evalData.getSections() != null && !evalData.getSections().isEmpty()) {
                try {
                    evaluation.setSectionScore(objectMapper.writeValueAsString(evalData.getSections()));
                } catch (JsonProcessingException e) {
                    errors.put(i, name + ": Failed to serialize section scores");
                    continue;
                }
            }
            
            evaluationsToSave.add(evaluation);
        }
        
        int totalProcessed = evalList.size();
        
        // 5. All-or-nothing: if any validation errors, return without saving
        if (!errors.isEmpty()) {
            response.setErrorMessages(errors);
            response.setTotalProcessed(totalProcessed);
            response.setSuccessCount(0);
            response.setFailureCount(errors.size());
            return response;
        }
        
        // 6. Bulk save all evaluations (1 DB hit)
        evaluationRepository.saveAll(evaluationsToSave);
        
        response.setTotalProcessed(totalProcessed);
        response.setSuccessCount(evaluationsToSave.size());
        response.setFailureCount(0);
        
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

    @Override
    @Transactional(readOnly = true)
    public RoundEvaluationResponse getEvaluationsByRoundAndApplications(RoundEvaluationRequest request) {
        if (request.getRoundNo() == null) {
            throw new ValidationException("Round number is required");
        }
        if (request.getApplicationIds() == null || request.getApplicationIds().isEmpty()) {
            throw new ValidationException("Application IDs list cannot be empty");
        }

        // Find the RoundTemplate by roundNo
        RoundTemplate roundTemplate = roundTemplateRepository.findByRoundNo(request.getRoundNo())
                .orElseThrow(() -> new ResourceNotFoundException("Round template", "roundNo", request.getRoundNo()));

        // Single query with JOIN FETCH to avoid N+1 — loads application, candidate, and reviewedBy
        List<CandidateEvaluation> evaluations = evaluationRepository
                .findByApplicationIdsAndRoundConfigIdFetched(
                        request.getApplicationIds(), roundTemplate.getRoundConfigId());

        RoundEvaluationResponse response = new RoundEvaluationResponse();
        response.setRoundTemplate(roundTemplateMapper.toResponse(roundTemplate));
        response.setEvaluations(evaluations.stream()
                .map(mapper::toResponse)
                .collect(Collectors.toList()));

        return response;
    }
}
