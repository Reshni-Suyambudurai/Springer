package com.kanini.springer.service.Drive.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kanini.springer.dto.Common.FieldChangeDTO;
import com.kanini.springer.dto.Common.ManualOverrideRequest;
import com.kanini.springer.dto.Drive.*;
import com.kanini.springer.entity.Drive.Application;
import com.kanini.springer.entity.Drive.Candidate;
import com.kanini.springer.entity.Drive.CandidateEvaluation;
import com.kanini.springer.entity.Drive.DriveAssignment;
import com.kanini.springer.entity.Drive.RoundTemplate;
import com.kanini.springer.entity.HiringReq.User;
import com.kanini.springer.entity.enums.Enums.ApplicationStage;
import com.kanini.springer.entity.enums.Enums.ApplicationStatus;
import com.kanini.springer.entity.enums.Enums.AssignmentStatus;
import com.kanini.springer.entity.enums.Enums.EvaluationStatus;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.mapper.Drive.CandidateEvaluationMapper;
import com.kanini.springer.mapper.Drive.RoundTemplateMapper;
import com.kanini.springer.repository.Drive.ApplicationRepository;
import com.kanini.springer.repository.Drive.CandidateEvaluationRepository;
import com.kanini.springer.repository.Drive.CandidatesRepository;
import com.kanini.springer.repository.Drive.DriveAssignmentRepository;
import com.kanini.springer.repository.Drive.RoundTemplateRepository;
import com.kanini.springer.repository.Hiring.UserRepository;
import com.kanini.springer.service.Common.IOverrideService;
import com.kanini.springer.service.Drive.ICandidateEvaluationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
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
    private final DriveAssignmentRepository driveAssignmentRepository;
    private final CandidateEvaluationMapper mapper;
    private final RoundTemplateMapper roundTemplateMapper;
    private final ObjectMapper objectMapper;
    private final IOverrideService overrideService;
    private final EvaluationEmailService evaluationEmailService;
    
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
        if (request.getStatus() == null || request.getStatus().isBlank()) {
            throw new ValidationException("Submission status is required (SUBMIT or DRAFT)");
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
        
        // Validate submission status (SUBMIT, DRAFT, or HOLD)
        String submitStatus = request.getStatus();
        if (!"SUBMIT".equals(submitStatus) && !"DRAFT".equals(submitStatus) && !"HOLD".equals(submitStatus)) {
            throw new ValidationException("Invalid submission status: " + submitStatus + ". Must be SUBMIT, DRAFT, or HOLD");
        }
        
        // Check for existing evaluation for upsert (optimized - single query covers all cases)
        // Fetch all evaluations for this application + round combination
        List<CandidateEvaluation> roundEvals = evaluationRepository
            .findByApplicationApplicationIdAndRoundConfigRoundConfigId(
                request.getApplicationId(), request.getRoundConfigId());
        
        Optional<CandidateEvaluation> existingOpt = Optional.empty();
        
        // First, check for evaluation by this specific reviewer
        for (CandidateEvaluation ce : roundEvals) {
            if (ce.getReviewedBy() != null && ce.getReviewedBy().getUserId().equals(request.getReviewedBy())) {
                existingOpt = Optional.of(ce);
                break;
            }
        }
        
        // If not found, check for HOLD/SKIP by any reviewer (can be overridden)
        if (existingOpt.isEmpty()) {
            for (CandidateEvaluation ce : roundEvals) {
                EvaluationStatus existingStatus = ce.getStatus();
                if (existingStatus == EvaluationStatus.HOLD || existingStatus == EvaluationStatus.SKIP) {
                    existingOpt = Optional.of(ce);
                    break;
                }
            }
        }
        
        CandidateEvaluation evaluation;
        String overriddenStatus = null;
        if (existingOpt.isPresent()) {
            // Update existing evaluation
            evaluation = existingOpt.get();
            EvaluationStatus prevStatus = evaluation.getStatus();
            if (prevStatus == EvaluationStatus.HOLD || prevStatus == EvaluationStatus.SKIP) {
                overriddenStatus = prevStatus.name();
            }
            evaluation.setScore(request.getScore());
            evaluation.setReview(request.getReview());
            evaluation.setStatus(evaluationStatus);
            evaluation.setReviewedBy(reviewedByUser);
            evaluation.setReviewedAt(java.time.LocalDateTime.now());
            if (request.getSectionScore() != null) {
                try {
                    String sectionScoreJson = objectMapper.writeValueAsString(request.getSectionScore());
                    evaluation.setSectionScore(sectionScoreJson);
                } catch (JsonProcessingException e) {
                    throw new ValidationException("Failed to serialize sectionScore to JSON: " + e.getMessage());
                }
            }
        } else {
            // Create new evaluation
            evaluation = new CandidateEvaluation();
            evaluation.setApplication(application);
            evaluation.setRoundConfig(roundTemplate);
            evaluation.setScore(request.getScore());
            evaluation.setReview(request.getReview());
            evaluation.setStatus(evaluationStatus);
            evaluation.setReviewedBy(reviewedByUser);
            if (request.getSectionScore() != null) {
                try {
                    String sectionScoreJson = objectMapper.writeValueAsString(request.getSectionScore());
                    evaluation.setSectionScore(sectionScoreJson);
                } catch (JsonProcessingException e) {
                    throw new ValidationException("Failed to serialize sectionScore to JSON: " + e.getMessage());
                }
            }
        }
        
        // Save evaluation
        CandidateEvaluation savedEvaluation = evaluationRepository.save(evaluation);
        
        // If HOLD/SKIP was overridden, append override history
        if (overriddenStatus != null) {
            appendHistory(application, overriddenStatus + " overridden", reviewedByUser.getUsername(), roundTemplate.getRoundName());
        }
        
        // If DRAFT or HOLD: update only this reviewer's DriveAssignment status
        if ("DRAFT".equals(submitStatus) || "HOLD".equals(submitStatus)) {
            AssignmentStatus draftOrHold = "DRAFT".equals(submitStatus) ? AssignmentStatus.DRAFT : AssignmentStatus.HOLD;
            driveAssignmentRepository.findActiveByUserIdAndApplicationIdAndRoundConfigId(
                    request.getReviewedBy(), request.getApplicationId(), request.getRoundConfigId())
                .ifPresent(assignment -> {
                    assignment.setStatus(draftOrHold);
                    driveAssignmentRepository.save(assignment);
                });
            appendHistory(application, evaluationStatus.name() + " (" + submitStatus + ")", reviewedByUser.getUsername(), roundTemplate.getRoundName());
            applicationRepository.save(application);
            return mapper.toResponse(savedEvaluation);
        }
        
        // On SUBMIT: cascade status to this reviewer's DriveAssignment + Application
        AssignmentStatus assignmentStatus;
        ApplicationStatus appStatus = null; // null = no change

        if (evaluationStatus == EvaluationStatus.PASS) {
            assignmentStatus = AssignmentStatus.SELECTED;
            // If Round 3 (Technical) and PASS → Mark application as SELECTED
            if (roundTemplate.getRoundNo() != null && roundTemplate.getRoundNo() == 3) {
                appStatus = ApplicationStatus.SELECTED;
            } else {
                // For other rounds, update to IN_DRIVE unless already SELECTED
                ApplicationStatus prevStatus = application.getApplicationStatus();
                if (prevStatus == ApplicationStatus.SELECTED) {
                    appStatus = ApplicationStatus.SELECTED;
                } else {
                    appStatus = ApplicationStatus.IN_DRIVE;
                }
            }
        } else if (evaluationStatus == EvaluationStatus.FAIL) {
            assignmentStatus = AssignmentStatus.REJECTED;
            appStatus = ApplicationStatus.FAILED;
        } else if (evaluationStatus == EvaluationStatus.ABSENT) {
            assignmentStatus = AssignmentStatus.REJECTED;
            appStatus = ApplicationStatus.DROPPED;
        } else if (evaluationStatus == EvaluationStatus.HOLD) {
            assignmentStatus = AssignmentStatus.HOLD;
        } else if (evaluationStatus == EvaluationStatus.SKIP) {
            assignmentStatus = AssignmentStatus.SELECTED;
        } else {
            return mapper.toResponse(savedEvaluation);
        }

        // Update only this reviewer's active DriveAssignment for this application
        driveAssignmentRepository.findActiveByUserIdAndApplicationIdAndRoundConfigId(
                request.getReviewedBy(), request.getApplicationId(), request.getRoundConfigId())
            .ifPresent(assignment -> {
                assignment.setStatus(assignmentStatus);
                driveAssignmentRepository.save(assignment);
            });

        // Update Application status only when required
        if (appStatus != null) {
            application.setApplicationStatus(appStatus);
        }

        // Append history and save application
        appendHistory(application, evaluationStatus.name(), reviewedByUser.getUsername(), roundTemplate.getRoundName());
        applicationRepository.save(application);

        // Trigger async evaluation email
        if ("SUBMIT".equals(submitStatus)) {
            triggerEvaluationEmail(evaluationStatus, application, roundTemplate);
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
        
        // 4. Pre-fetch existing evaluations for this round to detect duplicates / overrides (1 DB hit)
        List<Long> allApplicationIds = appByRegCode.values().stream()
            .map(Application::getApplicationId)
            .collect(Collectors.toList());
        Map<Long, CandidateEvaluation> existingEvalByAppId = Map.of();
        if (!allApplicationIds.isEmpty()) {
            existingEvalByAppId = evaluationRepository
                .findByApplicationIdsAndRoundConfigIdFetched(allApplicationIds, request.getRoundConfigId())
                .stream()
                .collect(Collectors.toMap(e -> e.getApplication().getApplicationId(), e -> e, (a, b) -> a));
        }
        
        // 5. Validate all rows first (all-or-nothing)
        List<CandidateEvaluation> evaluationsToSave = new ArrayList<>();
        Map<Long, String> overriddenAppStatus = new LinkedHashMap<>();
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
            // Check for duplicate in DB — allow override if HOLD/SKIP
            CandidateEvaluation existingEval = existingEvalByAppId.get(application.getApplicationId());
            if (existingEval != null) {
                EvaluationStatus existingStatus = existingEval.getStatus();
                if (existingStatus != EvaluationStatus.HOLD && existingStatus != EvaluationStatus.SKIP) {
                    errors.put(i, name + ": Evaluation already exists for this round");
                    continue;
                }
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
            
            // Build or update evaluation entity
            CandidateEvaluation evaluation;
            if (existingEval != null) {
                // Override existing HOLD/SKIP entry
                evaluation = existingEval;
                overriddenAppStatus.put(application.getApplicationId(), existingEval.getStatus().name());
            } else {
                evaluation = new CandidateEvaluation();
                evaluation.setApplication(application);
                evaluation.setRoundConfig(roundTemplate);
            }
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
        
        // 7. Append override history for HOLD/SKIP entries that were overridden (batched by status)
        if (!overriddenAppStatus.isEmpty()) {
            String roundName = roundTemplate.getRoundName();
            String userName = updatedByUser.getUsername();
            
            // Group applications by override status to minimize DB hits
            Map<String, List<Long>> appIdsByStatus = new LinkedHashMap<>();
            for (Map.Entry<Long, String> entry : overriddenAppStatus.entrySet()) {
                String status = entry.getValue() + " overridden";
                appIdsByStatus.computeIfAbsent(status, k -> new ArrayList<>()).add(entry.getKey());
            }
            
            // One DB hit per unique status instead of one per application
            for (Map.Entry<String, List<Long>> entry : appIdsByStatus.entrySet()) {
                appendHistoryBulk(entry.getValue(), entry.getKey(), userName, roundName);
            }
        }
        
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
            .toList();
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
    public CandidateEvaluationResponse getEvaluationByApplicationAndRound(Long applicationId, Long roundConfigId, Long userId) {
        if (applicationId == null) {
            throw new ValidationException("Application ID is required");
        }
        if (roundConfigId == null) {
            throw new ValidationException("Round config ID is required");
        }
        if (userId == null) {
            throw new ValidationException("User ID is required");
        }
        
        CandidateEvaluation evaluation = evaluationRepository
            .findByApplicationApplicationIdAndRoundConfigRoundConfigIdAndReviewedByUserId(applicationId, roundConfigId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Evaluation", "applicationId + roundConfigId + userId", applicationId + "/" + roundConfigId + "/" + userId));
        
        return mapper.toResponse(evaluation);
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

        // Fetch updatedBy user for history
        User updatedByUser = userRepository.findById(request.getUpdatedBy())
            .orElseThrow(() -> new ResourceNotFoundException("User", "ID", request.getUpdatedBy()));
        
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
        Application application = evaluation.getApplication();
        RoundTemplate roundTemplate = evaluation.getRoundConfig();
        String roundName = roundTemplate.getRoundName();
        Integer roundNo = roundTemplate.getRoundNo();
        
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
            
            // If Round 3 and changed to PASS → Mark application as SELECTED
            if (roundNo != null && roundNo == 3) {
                application.setApplicationStatus(ApplicationStatus.SELECTED);
            }
        }
        else if (newStatus == EvaluationStatus.PASS && roundNo != null && roundNo == 3) {
            // If Round 3 and status is PASS (regardless of old status) → Mark application as SELECTED
            application.setApplicationStatus(ApplicationStatus.SELECTED);
        }
        
        // Append history to application
        appendHistory(application, newStatus.name(), updatedByUser.getUsername(), roundName);
        applicationRepository.save(application);
        
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

    // =========================================================================
    // Application history helpers
    // =========================================================================

    private static final DateTimeFormatter HISTORY_FMT = DateTimeFormatter.ofPattern("d/M/yy - h:mma");

    /**
     * Build a formatted history entry string.
     * Example: "Evaluation updated to PASS by admin on 16/4/26 - 9:30pm."
     */
    private String buildHistoryEntry(String status, String userName, String roundName) {
        String ts = LocalDateTime.now().format(HISTORY_FMT).toLowerCase();
        String round = (roundName != null && !roundName.isBlank()) ? " in " + roundName : "";
        return "Evaluation updated to " + status + round + " by " + userName + " on " + ts + ".\n";
    }

    /**
     * Append a history entry to a single Application entity (already loaded).
     */
    private void appendHistory(Application application, String status, String userName, String roundName) {
        String entry = buildHistoryEntry(status, userName, roundName);
        String current = application.getHistory();
        application.setHistory(current == null || current.isEmpty() ? entry : current + entry);
    }

    /**
     * Bulk append a history entry to multiple applications via a single UPDATE query.
     * Use when applications are not loaded as entities (bulk @Modifying flows).
     */
    private void appendHistoryBulk(List<Long> applicationIds, String status, String userName, String roundName) {
        String entry = buildHistoryEntry(status, userName, roundName);
        applicationRepository.appendHistoryByApplicationIds(entry, applicationIds);
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

        // Find the RoundTemplate by roundNo — pick lowest ID to handle seed duplicates gracefully
        List<RoundTemplate> roundTemplates = roundTemplateRepository.findByRoundNoOrderByRoundConfigIdAsc(request.getRoundNo());
        if (roundTemplates.isEmpty()) {
            throw new ResourceNotFoundException("Round template", "roundNo", request.getRoundNo());
        }
        RoundTemplate roundTemplate = roundTemplates.stream()
                .filter(rt -> Boolean.TRUE.equals(rt.getIsActive()))
                .findFirst()
                .orElse(roundTemplates.get(0));

        // Single query with JOIN FETCH to avoid N+1 — loads application, candidate, and reviewedBy
        List<CandidateEvaluation> evaluations = evaluationRepository
                .findByApplicationIdsAndRoundConfigIdFetched(
                        request.getApplicationIds(), roundTemplate.getRoundConfigId());

        RoundEvaluationResponse response = new RoundEvaluationResponse();
        response.setRoundTemplate(roundTemplateMapper.toResponse(roundTemplate));
        response.setEvaluations(evaluations.stream()
                .map(mapper::toResponse)
                .toList());

        return response;
    }

    @Override
    @Transactional
    public void bulkUpdateEvaluationStatus(BulkEvaluationStatusUpdateRequest request) {
        if (request.getStatus() == null || request.getStatus().isBlank()) {
            throw new ValidationException("Status is required");
        }
        if (request.getApplicationIds() == null || request.getApplicationIds().isEmpty()) {
            throw new ValidationException("Application IDs list cannot be empty");
        }
        if (request.getRoundConfigId() == null) {
            throw new ValidationException("Round config ID is required");
        }

        EvaluationStatus status;
        try {
            status = EvaluationStatus.valueOf(request.getStatus());
        } catch (IllegalArgumentException e) {
            throw new ValidationException("Invalid evaluation status: " + request.getStatus());
        }

        List<Long> applicationIds = request.getApplicationIds();
        Long roundConfigId = request.getRoundConfigId();

        // Resolve user name for history
        String userName = "System";
        if (request.getUpdatedBy() != null) {
            userName = userRepository.findById(request.getUpdatedBy())
                    .map(User::getUsername).orElse("Unknown");
        }
        String roundName = roundTemplateRepository.findById(roundConfigId)
                .map(RoundTemplate::getRoundName).orElse(null);

        switch (status) {
            case PASS:
                // Update existing evals → PASS. No ApplicationStatus change.
                evaluationRepository.updateStatusByApplicationIdsAndRoundConfigId(
                        status, applicationIds, roundConfigId);
                break;

            case FAIL:
                // Update existing evals → FAIL. ApplicationStatus → FAILED.
                evaluationRepository.updateStatusByApplicationIdsAndRoundConfigId(
                        status, applicationIds, roundConfigId);
                applicationRepository.updateStatusByApplicationIds(
                        ApplicationStatus.FAILED, applicationIds);
                break;

            case ABSENT: {
                // Check no eval exists for this round
                List<CandidateEvaluation> absentExisting = evaluationRepository
                        .findByApplicationIdsAndRoundConfigIdFetched(applicationIds, roundConfigId);
                if (!absentExisting.isEmpty()) {
                    String absentNames = absentExisting.stream()
                            .map(e -> {
                                Candidate c = e.getApplication().getCandidate();
                                return c != null ? c.getFirstName() + (c.getLastName() != null ? " " + c.getLastName() : "") : "Unknown";
                            }).distinct().collect(Collectors.joining(", "));
                    throw new ValidationException("Evaluations already exist for " + absentNames + " in this round");
                }
                // Mark previous round's (roundConfigId - 1) eval status → ABSENT
                evaluationRepository.updateStatusByApplicationIdsAndRoundConfigId(
                        EvaluationStatus.ABSENT, applicationIds, roundConfigId - 1);
                // ApplicationStatus → DROPPED
                applicationRepository.updateStatusByApplicationIds(
                        ApplicationStatus.DROPPED, applicationIds);
                break;
            }

            case SKIP: {
                if (request.getReason() == null || request.getReason().isBlank()) {
                    throw new ValidationException("Reason is required when status is SKIP");
                }
                Long nextRoundConfigId = roundConfigId + 1;
                // Fetch next round template
                RoundTemplate nextRoundTemplate = roundTemplateRepository.findById(nextRoundConfigId)
                        .orElseThrow(() -> new ResourceNotFoundException("Round template", "ID", nextRoundConfigId));
                // Check if eval already exists for the next round
                List<CandidateEvaluation> skipExisting = evaluationRepository
                        .findByApplicationIdsAndRoundConfigIdFetched(applicationIds, nextRoundConfigId);
                if (!skipExisting.isEmpty()) {
                    String skipNames = skipExisting.stream()
                            .map(e -> {
                                Candidate c = e.getApplication().getCandidate();
                                return c != null ? c.getFirstName() + (c.getLastName() != null ? " " + c.getLastName() : "") : "Unknown";
                            }).distinct().collect(Collectors.joining(", "));
                    throw new ValidationException("Evaluations already exist for " + skipNames + " in " + nextRoundTemplate.getRoundName());
                }
                // Create new CandidateEvaluation at the next round
                User skipReviewedBy = userRepository.findById(request.getUpdatedBy())
                        .orElseThrow(() -> new ResourceNotFoundException("User", "ID", request.getUpdatedBy()));
                List<Application> skipApplications = applicationRepository.findAllById(applicationIds);
                if (skipApplications.size() != applicationIds.size()) {
                    throw new ValidationException("Some applications were not found. Expected "
                            + applicationIds.size() + " but found " + skipApplications.size());
                }
                List<CandidateEvaluation> skipEvals = new ArrayList<>();
                for (Application app : skipApplications) {
                    CandidateEvaluation eval = new CandidateEvaluation();
                    eval.setApplication(app);
                    eval.setRoundConfig(nextRoundTemplate);
                    eval.setStatus(status);
                    eval.setReviewedBy(skipReviewedBy);
                    eval.setReview(request.getReason());
                    skipEvals.add(eval);
                }
                evaluationRepository.saveAll(skipEvals);
                roundName = nextRoundTemplate.getRoundName();
                break;
            }

            case HOLD: {
                // Check no eval exists for this round
                List<CandidateEvaluation> holdExisting = evaluationRepository
                        .findByApplicationIdsAndRoundConfigIdFetched(applicationIds, roundConfigId);
                if (!holdExisting.isEmpty()) {
                    String holdNames = holdExisting.stream()
                            .map(e -> {
                                Candidate c = e.getApplication().getCandidate();
                                return c != null ? c.getFirstName() + (c.getLastName() != null ? " " + c.getLastName() : "") : "Unknown";
                            }).distinct().collect(Collectors.joining(", "));
                    throw new ValidationException("Evaluations already exist for " + holdNames + " in this round");
                }
                // Create new CandidateEvaluation per application
                RoundTemplate holdRoundTemplate = roundTemplateRepository.findById(roundConfigId)
                        .orElseThrow(() -> new ResourceNotFoundException("Round template", "ID", roundConfigId));
                User holdReviewedBy = userRepository.findById(request.getUpdatedBy())
                        .orElseThrow(() -> new ResourceNotFoundException("User", "ID", request.getUpdatedBy()));
                List<Application> holdApplications = applicationRepository.findAllById(applicationIds);
                if (holdApplications.size() != applicationIds.size()) {
                    throw new ValidationException("Some applications were not found. Expected "
                            + applicationIds.size() + " but found " + holdApplications.size());
                }
                List<CandidateEvaluation> holdEvals = new ArrayList<>();
                for (Application app : holdApplications) {
                    CandidateEvaluation eval = new CandidateEvaluation();
                    eval.setApplication(app);
                    eval.setRoundConfig(holdRoundTemplate);
                    eval.setStatus(status);
                    eval.setReviewedBy(holdReviewedBy);
                    holdEvals.add(eval);
                }
                evaluationRepository.saveAll(holdEvals);
                break;
            }

            default:
                throw new ValidationException("Unsupported status: " + status);
        }

        appendHistoryBulk(applicationIds, status.name(), userName, roundName);

        // Trigger async evaluation emails for bulk status update
        triggerBulkEvaluationEmails(status, applicationIds, roundName);
    }

    @Override
    @Transactional
    public void bulkRoundSkip(BulkRoundSkipRequest request) {
        // Validate
        if (request.getApplicationIds() == null || request.getApplicationIds().isEmpty()) {
            throw new ValidationException("Application IDs list cannot be empty");
        }
        if (request.getRoundConfigId() == null) {
            throw new ValidationException("Round config ID is required");
        }
        if (request.getReviewedBy() == null) {
            throw new ValidationException("Reviewed by user ID is required");
        }
        if (request.getStatus() == null || request.getStatus().isBlank()) {
            throw new ValidationException("Status is required");
        }

        String statusStr = request.getStatus();
        if (!"SKIP".equals(statusStr) && !"HOLD".equals(statusStr) && !"ABSENT".equals(statusStr)) {
            throw new ValidationException("Invalid status: " + statusStr + ". Must be SKIP, HOLD, or ABSENT");
        }

        if ("SKIP".equals(statusStr) && (request.getReason() == null || request.getReason().isBlank())) {
            throw new ValidationException("Reason is required when status is SKIP");
        }

        List<Long> applicationIds = request.getApplicationIds();

        // Check for DROPPED/FAILED applications — cannot proceed
        List<Application> droppedCheck = applicationRepository.findAllById(applicationIds);
        List<String> blockedEntries = droppedCheck.stream()
                .filter(a -> a.getApplicationStatus() == ApplicationStatus.DROPPED
                        || a.getApplicationStatus() == ApplicationStatus.FAILED)
                .map(a -> {
                    String name = a.getCandidate() != null
                            ? a.getCandidate().getFirstName() + (a.getCandidate().getLastName() != null ? " " + a.getCandidate().getLastName() : "")
                            : "ID " + a.getApplicationId();
                    return name + " (" + a.getApplicationStatus() + ")";
                })
                .collect(Collectors.toList());
        if (!blockedEntries.isEmpty()) {
            throw new ValidationException("Cannot proceed — applications are DROPPED/FAILED: " + String.join(", ", blockedEntries));
        }

        // Fetch round name for history
        String roundName = roundTemplateRepository.findById(request.getRoundConfigId())
                .map(RoundTemplate::getRoundName).orElse(null);

        if ("ABSENT".equals(statusStr)) {
            // ABSENT: just set Application status to DROPPED — no evaluation record needed
            // 1 DB hit: bulk UPDATE
            int updated = applicationRepository.updateStatusByApplicationIds(
                    ApplicationStatus.DROPPED, applicationIds);
            if (updated != applicationIds.size()) {
                throw new ValidationException("Some applications were not found. Expected "
                        + applicationIds.size() + " but updated " + updated);
            }
            // Append history
            String userName = userRepository.findById(request.getReviewedBy())
                    .map(User::getUsername).orElse("Unknown");
            appendHistoryBulk(applicationIds, "ABSENT", userName, roundName);
            return;
        }

        // SKIP or HOLD: create new CandidateEvaluation entries (these rounds have no prior evaluation)
        EvaluationStatus evalStatus = EvaluationStatus.valueOf(statusStr);

        // Fetch required entities
        RoundTemplate roundTemplate = roundTemplateRepository.findById(request.getRoundConfigId())
                .orElseThrow(() -> new ResourceNotFoundException("Round template", "ID", request.getRoundConfigId()));
        User reviewedByUser = userRepository.findById(request.getReviewedBy())
                .orElseThrow(() -> new ResourceNotFoundException("User", "ID", request.getReviewedBy()));
        List<Application> applications = applicationRepository.findAllById(applicationIds);
        if (applications.size() != applicationIds.size()) {
            throw new ValidationException("Some applications were not found. Expected "
                    + applicationIds.size() + " but found " + applications.size());
        }

        // Check if evaluations already exist for any candidate (same app + round + reviewer)
        List<CandidateEvaluation> existingEvals = evaluationRepository
                .findByApplicationIdsAndRoundConfigIdFetched(applicationIds, request.getRoundConfigId());
        List<CandidateEvaluation> conflicting = existingEvals.stream()
                .filter(e -> e.getReviewedBy() != null && e.getReviewedBy().getUserId().equals(request.getReviewedBy()))
                .toList();
        if (!conflicting.isEmpty()) {
            String names = conflicting.stream()
                    .map(e -> {
                        Candidate c = e.getApplication().getCandidate();
                        String name = c != null ? c.getFirstName() + (c.getLastName() != null ? " " + c.getLastName() : "") : "Unknown";
                        return name + " (status: " + e.getStatus() + ")";
                    })
                    .collect(Collectors.joining(", "));
            throw new ValidationException("Evaluation already exists for: " + names);
        }

        // Create a new CandidateEvaluation for each application
        List<CandidateEvaluation> evaluations = new ArrayList<>();
        for (Application app : applications) {
            CandidateEvaluation eval = new CandidateEvaluation();
            eval.setApplication(app);
            eval.setRoundConfig(roundTemplate);
            eval.setStatus(evalStatus);
            eval.setReviewedBy(reviewedByUser);
            if ("SKIP".equals(statusStr)) {
                eval.setReview(request.getReason());
            }
            evaluations.add(eval);
        }
        evaluationRepository.saveAll(evaluations);

        // Append history
        String userName = reviewedByUser.getUsername();
        appendHistoryBulk(applicationIds, statusStr, userName, roundTemplate.getRoundName());

        // Trigger async evaluation emails for HOLD/ABSENT
        if ("HOLD".equals(statusStr) || "ABSENT".equals(statusStr)) {
            String roundNo = roundTemplate.getRoundNo() != null ? String.valueOf(roundTemplate.getRoundNo()) : "";
            List<EvaluationEmailService.EvaluationEmailRecipient> emailRecipients = applications.stream()
                    .filter(app -> app.getCandidate() != null && app.getCandidate().getEmail() != null)
                    .map(app -> {
                        Candidate c = app.getCandidate();
                        String name = c.getFirstName() + (c.getLastName() != null ? " " + c.getLastName() : "");
                        return new EvaluationEmailService.EvaluationEmailRecipient(c.getEmail(), name, roundNo, statusStr);
                    })
                    .toList();
            evaluationEmailService.sendEvaluationEmails(statusStr, emailRecipients);
        }
    }
    @Override
    @Transactional(readOnly = true)
    public CheckExistingEvaluationsResponse checkExistingEvaluations(CheckExistingEvaluationsRequest request) {
        // Validate required fields
        if (request.getDriveId() == null) {
            throw new ValidationException("Drive ID is required");
        }
        if (request.getRoundConfigId() == null) {
            throw new ValidationException("Round config ID is required");
        }
        if (request.getCandidates() == null || request.getCandidates().isEmpty()) {
            throw new ValidationException("Candidates list cannot be empty");
        }

        CheckExistingEvaluationsResponse response = new CheckExistingEvaluationsResponse();
        response.setTotalChecked(request.getCandidates().size());

        // Extract registration codes and applicationIds (when provided)
        List<String> registrationCodes = request.getCandidates().stream()
                .map(CheckExistingEvaluationsRequest.CandidateCheckData::getRegistrationCode)
                .filter(code -> code != null && !code.isBlank())
                .distinct()
                .collect(Collectors.toList());

        List<Long> providedAppIds = request.getCandidates().stream()
                .map(CheckExistingEvaluationsRequest.CandidateCheckData::getApplicationId)
                .filter(id -> id != null && id > 0)
                .distinct()
                .collect(Collectors.toList());

        if (registrationCodes.isEmpty() && providedAppIds.isEmpty()) {
            response.setExistingCount(0);
            return response;
        }

        // Resolve registration codes to applications for this drive (1 DB hit)
        Map<String, Application> appsByRegCode = new LinkedHashMap<>();
        if (!registrationCodes.isEmpty()) {
            List<Application> apps = applicationRepository.findByRegistrationCodeInWithCandidate(registrationCodes);
            // Filter to only apps belonging to the specified drive
            apps = apps.stream()
                    .filter(app -> app.getDrive() != null && app.getDrive().getDriveId().equals(request.getDriveId()))
                    .toList();
            appsByRegCode = apps.stream()
                    .collect(Collectors.toMap(
                            app -> app.getRegistrationCode().toLowerCase(),
                            app -> app,
                            (a, b) -> a
                    ));
        }

        // Collect all applicationIds (from provided + resolved)
        Set<Long> allApplicationIds = new HashSet<>(providedAppIds);
        appsByRegCode.values().forEach(app -> allApplicationIds.add(app.getApplicationId()));

        List<Long> applicationIds = new ArrayList<>(allApplicationIds);

        if (applicationIds.isEmpty()) {
            response.setExistingCount(0);
            return response;
        }

        // Build map of applicationId -> registrationCode for error reporting
        Map<Long, String> appIdToRegCode = new LinkedHashMap<>();
        for (CheckExistingEvaluationsRequest.CandidateCheckData candidate : request.getCandidates()) {
            if (candidate.getApplicationId() != null && candidate.getApplicationId() > 0) {
                appIdToRegCode.put(candidate.getApplicationId(), candidate.getRegistrationCode());
            }
        }
        // Add resolved mappings
        appsByRegCode.forEach((regCode, app) -> 
            appIdToRegCode.putIfAbsent(app.getApplicationId(), app.getRegistrationCode())
        );

        // Fetch existing evaluations for this round (1 DB hit)
        List<CandidateEvaluation> existingEvaluations = evaluationRepository
                .findByApplicationIdsAndRoundConfigIdFetched(applicationIds, request.getRoundConfigId());

        // Build list of conflicts
        List<CheckExistingEvaluationsResponse.ExistingEvaluationInfo> conflicts = existingEvaluations.stream()
                .map(eval -> {
                    Long appId = eval.getApplication().getApplicationId();
                    String regCode = appIdToRegCode.get(appId);
                    if (regCode == null) {
                        regCode = eval.getApplication().getRegistrationCode();
                    }
                    
                    CheckExistingEvaluationsResponse.ExistingEvaluationInfo info = 
                            new CheckExistingEvaluationsResponse.ExistingEvaluationInfo();
                    info.setRegistrationCode(regCode);
                    info.setReason("Evaluation already exists for this round");
                    return info;
                })
                .toList();

        response.setExistingEvaluations(conflicts);
        response.setExistingCount(conflicts.size());

        return response;
    }

    // =========================================================================
    // Evaluation email helpers
    // =========================================================================

    /**
     * Trigger an async evaluation email for a single candidate after createEvaluation.
     */
    private void triggerEvaluationEmail(EvaluationStatus status, Application application, RoundTemplate roundTemplate) {
        try {
            if (status != EvaluationStatus.PASS && status != EvaluationStatus.FAIL
                    && status != EvaluationStatus.HOLD && status != EvaluationStatus.ABSENT) {
                return;
            }
            Candidate candidate = application.getCandidate();
            if (candidate == null || candidate.getEmail() == null) return;

            String name = candidate.getFirstName()
                    + (candidate.getLastName() != null ? " " + candidate.getLastName() : "");
            String roundNo = roundTemplate.getRoundNo() != null
                    ? String.valueOf(roundTemplate.getRoundNo()) : "";

            evaluationEmailService.sendEvaluationEmail(
                    status.name(), candidate.getEmail(), name, roundNo);
        } catch (Exception e) {
            // Non-blocking — log and continue
            System.err.println("Failed to queue evaluation email: " + e.getMessage());
        }
    }

    /**
     * Trigger async evaluation emails for bulk status updates.
     * Loads applications with candidates in one query.
     */
    private void triggerBulkEvaluationEmails(EvaluationStatus status, List<Long> applicationIds, String roundName) {
        try {
            if (status != EvaluationStatus.PASS && status != EvaluationStatus.FAIL
                    && status != EvaluationStatus.HOLD && status != EvaluationStatus.ABSENT) {
                return;
            }
            List<Application> applications = applicationRepository.findAllById(applicationIds);

            // Resolve round number from round name
            String roundNo = roundTemplateRepository.findAll().stream()
                    .filter(rt -> roundName != null && roundName.equals(rt.getRoundName()) && rt.getRoundNo() != null)
                    .findFirst()
                    .map(rt -> String.valueOf(rt.getRoundNo()))
                    .orElse("");

            List<EvaluationEmailService.EvaluationEmailRecipient> recipients = applications.stream()
                    .filter(app -> app.getCandidate() != null && app.getCandidate().getEmail() != null)
                    .map(app -> {
                        Candidate c = app.getCandidate();
                        String name = c.getFirstName() + (c.getLastName() != null ? " " + c.getLastName() : "");
                        return new EvaluationEmailService.EvaluationEmailRecipient(
                                c.getEmail(), name, roundNo, status.name());
                    })
                    .toList();

            evaluationEmailService.sendEvaluationEmails(status.name(), recipients);
        } catch (Exception e) {
            System.err.println("Failed to queue bulk evaluation emails: " + e.getMessage());
        }
    }
}
