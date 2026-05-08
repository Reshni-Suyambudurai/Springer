package com.kanini.springer.service.Drive.impl;

import com.kanini.springer.dto.Common.FieldChangeDTO;
import com.kanini.springer.dto.Common.ManualOverrideRequest;
import com.kanini.springer.dto.Common.PersonalizedRecipient;
import com.kanini.springer.dto.Drive.ApplicationRequest;
import com.kanini.springer.dto.Drive.ApplicationResponse;
import com.kanini.springer.dto.Drive.ApplicationStatusUpdateRequest;
import com.kanini.springer.dto.Drive.BatchTimeUpdateRequest;
import com.kanini.springer.dto.Drive.BulkApplicationResponse;
import com.kanini.springer.dto.Drive.BulkApplicationStatusUpdateRequest;
import com.kanini.springer.dto.Drive.BulkApplicationStatusUpdateResponse;
import com.kanini.springer.dto.Drive.CandidateHistoryResponse;
import com.kanini.springer.dto.Drive.FinalizeApplicationsRequest;
import com.kanini.springer.dto.Drive.FinalizeApplicationsResponse;
import com.kanini.springer.entity.Drive.Application;
import com.kanini.springer.entity.Drive.Candidate;
import com.kanini.springer.entity.Drive.CandidateEvaluation;
import com.kanini.springer.entity.Drive.Drive;
import com.kanini.springer.entity.Drive.DriveAssignment;
import com.kanini.springer.entity.HiringReq.User;
import com.kanini.springer.entity.enums.Enums.ApplicationStatus;
import com.kanini.springer.entity.enums.Enums.OverrideEntityType;
import com.kanini.springer.entity.enums.Enums.ApplicationStage;
import com.kanini.springer.entity.enums.Enums.DriveStatus;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.mapper.Drive.ApplicationMapper;
import com.kanini.springer.repository.Drive.ApplicationRepository;
import com.kanini.springer.repository.Drive.CandidateEvaluationRepository;
import com.kanini.springer.repository.Drive.CandidatesRepository;
import com.kanini.springer.repository.Drive.DriveAssignmentRepository;
import com.kanini.springer.repository.Drive.DriveRepository;
import com.kanini.springer.repository.Hiring.UserRepository;
import com.kanini.springer.repository.Common.EmailTemplateRepository;
import com.kanini.springer.service.Drive.IApplicationService;
import com.kanini.springer.service.Common.IEmailTemplateService;
import com.kanini.springer.service.Common.IOverrideService;
import com.kanini.springer.repository.Common.ManualOverrideRepository;
import com.kanini.springer.mapper.Common.ManualOverrideMapper;
import com.kanini.springer.dto.Common.ManualOverrideResponse;
import com.kanini.springer.entity.utils.ManualOverride;
import com.kanini.springer.specification.CandidateSpecification;
import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Root;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ApplicationServiceImpl implements IApplicationService {
    
    private final ApplicationRepository applicationRepository;
    private final CandidatesRepository candidatesRepository;
    private final DriveRepository driveRepository;
    private final DriveAssignmentRepository driveAssignmentRepository;
    private final CandidateEvaluationRepository candidateEvaluationRepository;
    private final UserRepository userRepository;
    private final ApplicationMapper mapper;
    private final EntityManager entityManager;
    private final IOverrideService overrideService;
    private final ManualOverrideRepository manualOverrideRepository;
    private final ManualOverrideMapper manualOverrideMapper;
    private final IEmailTemplateService emailTemplateService;
    private final EmailTemplateRepository emailTemplateRepository;

    @Value("${email.template.drive-invitation-id:9}")
    private int driveInvitationTemplateId;
    
    @Override
    @Transactional
    public BulkApplicationResponse createApplications(ApplicationRequest request) {
        BulkApplicationResponse response = new BulkApplicationResponse();
        
        // Validate required fields
        if (request.getDriveId() == null) {
            throw new ValidationException("Drive ID is required");
        }
        if (request.getCreatedBy() == null) {
            throw new ValidationException("Created by user ID is required");
        }

        // Resolve candidate IDs: either from explicit list (select mode) or from filters (non-select mode)
        List<Long> candidateIds = request.getCandidateIds();
        if (candidateIds == null || candidateIds.isEmpty()) {
            if (request.getFilterRequest() != null) {
                // Lightweight ID-only query using CriteriaQuery — SELECT candidate_id only, no entity loading
                Specification<Candidate> spec = CandidateSpecification.withFilters(request.getFilterRequest());
                CriteriaBuilder cb = entityManager.getCriteriaBuilder();
                CriteriaQuery<Long> idQuery = cb.createQuery(Long.class);
                Root<Candidate> root = idQuery.from(Candidate.class);
                idQuery.select(root.get("candidateId"));

                jakarta.persistence.criteria.Predicate predicate = spec.toPredicate(root, idQuery, cb);
                if (predicate != null) {
                    idQuery.where(predicate);
                }

                candidateIds = entityManager.createQuery(idQuery).getResultList();
            }
        }

        if (candidateIds == null || candidateIds.isEmpty()) {
            throw new ValidationException("Candidate IDs list cannot be empty");
        }
        
        // Fetch drive
        Drive drive = driveRepository.findById(request.getDriveId())
            .orElseThrow(() -> new ResourceNotFoundException("Drive", "ID", request.getDriveId()));
        
        // Fetch created by user
        User createdByUser = userRepository.findById(request.getCreatedBy())
            .orElseThrow(() -> new ResourceNotFoundException("User", "ID", request.getCreatedBy()));
        
        // Batch fetch all candidates (1 query instead of N)
        Map<Long, Candidate> candidateMap = candidatesRepository.findAllById(candidateIds)
            .stream().collect(Collectors.toMap(Candidate::getCandidateId, c -> c));
        
        int totalProcessed = 0;
        int successCount = 0;
        int failureCount = 0;
        List<Application> applicationsToSave = new ArrayList<>();
        List<Candidate> candidatesToUpdate = new ArrayList<>();
        
        for (Long candidateId : candidateIds) {
            totalProcessed++;
            
            try {
                // Lookup from pre-fetched map
                Candidate candidate = candidateMap.get(candidateId);
                
                if (candidate == null) {
                    response.getErrorMessages().add("Candidate with ID " + candidateId + " not found");
                    failureCount++;
                    continue;
                }
                
                String candidateName = candidate.getFirstName() + 
                        (candidate.getLastName() != null ? " " + candidate.getLastName() : "");
                
                // Validate: applicationStage must be SHORTLISTED or INVITED
                if (candidate.getApplicationStage() != ApplicationStage.SHORTLISTED && candidate.getApplicationStage() != ApplicationStage.INVITED) {
                    response.getErrorMessages().add(candidateName + " (ID: " + candidateId + ") is not SHORTLISTED or INVITED. Current status: " + 
                            (candidate.getApplicationStage() != null ? candidate.getApplicationStage() : "null"));
                    failureCount++;
                    continue;
                }
                
                // Validate: isEligible must be true
                if (!Boolean.TRUE.equals(candidate.getIsEligible())) {
                    response.getErrorMessages().add(candidateName + " (ID: " + candidateId + ") is not eligible (isEligible = false)");
                    failureCount++;
                    continue;
                }
                
                // Create application
                Application application = new Application();
                application.setDrive(drive);
                application.setCandidate(candidate);
                application.setBatchTime(request.getBatchTime());
                application.setApplicationStatus(ApplicationStatus.ALLOTED);
                application.setCreatedByUser(createdByUser);
                
                // Generate unique 6-digit registration code per drive
                String registrationCode = generateRegistrationCode(drive.getDriveId());
                application.setRegistrationCode(registrationCode);
                
                applicationsToSave.add(application);
                
                // Update candidate status to SCHEDULED
                candidate.setApplicationStage(ApplicationStage.SCHEDULED);
                candidatesToUpdate.add(candidate);
                
                successCount++;
                
            } catch (Exception e) {
                response.getErrorMessages().add("Error processing candidate " + candidateId + ": " + e.getMessage());
                failureCount++;
            }
        }
        
        // Batch save all applications and update all candidates (2 queries instead of 2N)
        List<Application> savedApplications = applicationRepository.saveAll(applicationsToSave);
        candidatesRepository.saveAll(candidatesToUpdate);
        
        for (Application saved : savedApplications) {
            response.getSuccessfulApplications().add(mapper.toResponse(saved));
        }
        
        response.setTotalProcessed(totalProcessed);
        response.setSuccessCount(successCount);
        response.setFailureCount(failureCount);

        // ── Trigger drive invitation emails (fire-and-forget, never fails the response) ──
        if (successCount > 0) {
            triggerDriveInvitationEmails(drive, savedApplications);
        }
        
        return response;
    }

    /**
     * Fetches the drive-invitation email template and triggers a personalized send
     * for every successfully created application.
     * Runs fully asynchronous inside the mail thread pool — never throws.
     */
    private void triggerDriveInvitationEmails(Drive drive, List<Application> savedApplications) {
        try {
            emailTemplateRepository.findById(driveInvitationTemplateId).ifPresentOrElse(
                template -> {
                    DateTimeFormatter dateFmt  = DateTimeFormatter.ofPattern("dd MMM yyyy");
                    DateTimeFormatter timeFmt  = DateTimeFormatter.ofPattern("hh:mm a");

                    String startDate = drive.getStartDate() != null
                            ? drive.getStartDate().format(dateFmt) : "";

                    List<PersonalizedRecipient> recipients = savedApplications.stream()
                            .filter(a -> a.getCandidate() != null
                                    && a.getCandidate().getEmail() != null)
                            .map(a -> {
                                String candidateName = a.getCandidate().getFirstName()
                                        + (a.getCandidate().getLastName() != null
                                                ? " " + a.getCandidate().getLastName() : "");
                                String batchTime = a.getBatchTime() != null
                                        ? a.getBatchTime().format(timeFmt) : "";
                                return new PersonalizedRecipient(
                                        a.getCandidate().getEmail(),
                                        candidateName,
                                        a.getRegistrationCode(),
                                        batchTime,
                                        null);
                            })
                            .collect(Collectors.toList());

                    emailTemplateService.sendPersonalizedBulkEmail(
                            template.getBody(),
                            template.getSubject(),
                            drive.getDriveName(),
                            startDate,
                            drive.getLocation() != null ? drive.getLocation() : "",
                            recipients);

                    log.info("📧 Drive invitation emails queued for {} recipients (drive='{}')",
                             recipients.size(), drive.getDriveName());
                },
                () -> log.warn("⚠️ Drive invitation template ID={} not found — emails skipped",
                               driveInvitationTemplateId)
            );
        } catch (Exception ex) {
            log.error("⚠️ Failed to queue drive invitation emails — scheduling result unaffected", ex);
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<ApplicationResponse> getAllApplications() {
        List<Application> applications = applicationRepository.findAll();
        
        return applications.stream()
            .map(mapper::toResponse)
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<ApplicationResponse> getApplicationsByDriveId(Long driveId) {
        if (driveId == null) {
            throw new ValidationException("Drive ID is required");
        }
        
        List<Application> applications = applicationRepository.findByDriveDriveId(driveId);
        
        List<ApplicationResponse> responses = applications.stream()
            .map(mapper::toResponse)
            .collect(Collectors.toList());

        // Enrich with latest evaluation status
        List<Long> applicationIds = applications.stream()
            .map(Application::getApplicationId)
            .collect(Collectors.toList());
        if (!applicationIds.isEmpty()) {
            // row = [applicationId, evaluationStatus, roundConfigId]
            Map<Long, Object[]> latestMap = candidateEvaluationRepository
                .findLatestStatusByApplicationIds(applicationIds)
                .stream()
                .collect(Collectors.toMap(
                    row -> (Long) row[0],
                    row -> row,
                    (first, _second) -> first  // keep first = latest (ORDER BY scoreId DESC)
                ));
            for (ApplicationResponse r : responses) {
                Object[] row = latestMap.get(r.getApplicationId());
                if (row != null) {
                    r.setEvaluationStatus(row[1].toString());
                    r.setLatestRoundConfigId((Long) row[2]);
                } else {
                    r.setEvaluationStatus("PENDING");
                    r.setLatestRoundConfigId(0L);
                }
            }
        }

        return responses;
    }
    
    @Override
    @Transactional
    public ApplicationResponse updateApplicationStatus(Long applicationId, ApplicationStatusUpdateRequest request) {
        if (applicationId == null) {
            throw new ValidationException("Application ID is required");
        }
        
        if (request.getApplicationStatus() == null || request.getApplicationStatus().isBlank()) {
            throw new ValidationException("Application status is required");
        }
        
        // Find application
        Application application = applicationRepository.findById(applicationId)
            .orElseThrow(() -> new ResourceNotFoundException("Application", "ID", applicationId));
        
        // Parse and validate status
        ApplicationStatus newStatus;
        try {
            newStatus = ApplicationStatus.valueOf(request.getApplicationStatus());
        } catch (IllegalArgumentException e) {
            throw new ValidationException("Invalid application status: " + request.getApplicationStatus());
        }
        
        // Validate transition
        validateStatusTransition(application.getApplicationStatus(), newStatus, applicationId);
        
        // Update status
        application.setApplicationStatus(newStatus);
        
        // Update candidate stage based on new status
        updateCandidateStage(application.getCandidate(), newStatus);
        
        // Save
        Application updatedApplication = applicationRepository.save(application);
        
        return mapper.toResponse(updatedApplication);
    }
    
    @Override
    @Transactional
    public BulkApplicationStatusUpdateResponse bulkUpdateApplicationStatus(BulkApplicationStatusUpdateRequest request) {
        BulkApplicationStatusUpdateResponse response = new BulkApplicationStatusUpdateResponse();
        
        // Validate required fields
        if (request.getApplicationIds() == null || request.getApplicationIds().isEmpty()) {
            throw new ValidationException("Application IDs list cannot be empty");
        }
        
        if (request.getApplicationStatus() == null || request.getApplicationStatus().isBlank()) {
            throw new ValidationException("Application status is required");
        }
        
        // Parse and validate the common status once
        ApplicationStatus newStatus;
        try {
            newStatus = ApplicationStatus.valueOf(request.getApplicationStatus());
        } catch (IllegalArgumentException e) {
            throw new ValidationException("Invalid application status: " + request.getApplicationStatus());
        }

        // Resolve updatedBy user
        User updatedByUser = null;
        if (request.getUpdatedBy() != null) {
            updatedByUser = userRepository.findById(request.getUpdatedBy())
                .orElseThrow(() -> new ResourceNotFoundException("User", "ID", request.getUpdatedBy()));
        }
        
        // Batch fetch all applications (1 query instead of N)
        Map<Long, Application> applicationMap = applicationRepository.findAllById(request.getApplicationIds())
            .stream().collect(Collectors.toMap(Application::getApplicationId, a -> a));
        
        int totalProcessed = 0;
        int successCount = 0;
        int failureCount = 0;
        List<Application> applicationsToSave = new ArrayList<>();
        List<Candidate> candidatesToSave = new ArrayList<>();
        
        for (Long appId : request.getApplicationIds()) {
            totalProcessed++;
            
            try {
                if (appId == null) {
                    response.getErrorMessages().add("Null application ID at entry #" + totalProcessed);
                    failureCount++;
                    continue;
                }
                
                Application application = applicationMap.get(appId);
                
                if (application == null) {
                    response.getErrorMessages().add("Application not found with ID: " + appId);
                    failureCount++;
                    continue;
                }
                
                // Validate transition
                ApplicationStatus currentStatus = application.getApplicationStatus();
                if (!isValidTransition(currentStatus, newStatus)) {
                    response.getErrorMessages().add("Invalid transition from " + currentStatus + " to " + newStatus 
                            + " for application ID: " + appId);
                    failureCount++;
                    continue;
                }
                
                // Update application status
                application.setApplicationStatus(newStatus);
                if (updatedByUser != null) {
                    application.setUpdatedByUser(updatedByUser);
                }
                applicationsToSave.add(application);
                
                // Update candidate stage
                Candidate candidate = application.getCandidate();
                if (candidate != null) {
                    ApplicationStage newCandidateStage = mapToCandidateStage(newStatus);
                    if (newCandidateStage != null) {
                        candidate.setApplicationStage(newCandidateStage);
                        candidatesToSave.add(candidate);
                    }
                }
                
                successCount++;
                
            } catch (Exception e) {
                response.getErrorMessages().add("Error processing application " + appId + ": " + e.getMessage());
                failureCount++;
            }
        }
        
        // Batch save all applications and candidates (2 queries instead of 2N)
        List<Application> savedApplications = applicationRepository.saveAll(applicationsToSave);
        candidatesRepository.saveAll(candidatesToSave);
        
        // Update Drive status to IN_PROGRESS if there are successful updates
        if (!savedApplications.isEmpty()) {
            Application firstApp = savedApplications.get(0);
            Drive drive = firstApp.getDrive();
            if (drive != null && drive.getStatus() != DriveStatus.IN_PROGRESS) {
                drive.setStatus(DriveStatus.IN_PROGRESS);
                driveRepository.save(drive);
            }
        }
        
        for (Application saved : savedApplications) {
            response.getSuccessfulUpdates().add(mapper.toResponse(saved));
        }
        
        response.setTotalProcessed(totalProcessed);
        response.setSuccessCount(successCount);
        response.setFailureCount(failureCount);
        
        return response;
    }

    // =========================================================================
    // Status transition helpers
    // =========================================================================

    /**
     * Validates that the status transition is allowed.
     * Rules:
     *   ALLOTED   → IN_DRIVE
     *   IN_DRIVE  → DROPPED, FAILED, SELECTED
     */
    private void validateStatusTransition(ApplicationStatus current, ApplicationStatus target, Long applicationId) {
        if (!isValidTransition(current, target)) {
            throw new ValidationException("Invalid status transition from " + current + " to " + target 
                    + " for application ID: " + applicationId);
        }
    }

    private boolean isValidTransition(ApplicationStatus current, ApplicationStatus target) {
        if (current == null) return false;
        return switch (current) {
            case ALLOTED  -> target == ApplicationStatus.IN_DRIVE;
            case IN_DRIVE -> target == ApplicationStatus.DROPPED 
                          || target == ApplicationStatus.FAILED 
                          || target == ApplicationStatus.SELECTED;
            default       -> false;
        };
    }

    private ApplicationStage mapToCandidateStage(ApplicationStatus status) {
        return switch (status) {
            case SELECTED -> ApplicationStage.SELECTED;
            case FAILED, DROPPED -> ApplicationStage.REJECTED;
            default -> null;
        };
    }

    private void updateCandidateStage(Candidate candidate, ApplicationStatus newStatus) {
        if (candidate == null) return;
        ApplicationStage newStage = mapToCandidateStage(newStatus);
        if (newStage != null) {
            candidate.setApplicationStage(newStage);
            candidatesRepository.save(candidate);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, List<Long>> getBatchCandidatesByDriveId(Long driveId) {
        if (driveId == null) throw new ValidationException("Drive ID is required");
        // Projection query — only applicationId + batchTime, no entity hydration
        List<Object[]> rows = applicationRepository.findApplicationIdAndBatchTimeByDriveId(driveId);
        return rows.stream().collect(Collectors.groupingBy(
                row -> row[1] != null ? row[1].toString() : "UNSCHEDULED",
                Collectors.mapping(row -> (Long) row[0], Collectors.toList())
        ));
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getDistinctBatchTimesByDriveId(Long driveId) {
        if (driveId == null) throw new ValidationException("Drive ID is required");
        return applicationRepository.findDistinctBatchTimesByDriveId(driveId)
                .stream().map(LocalDateTime::toString).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ApplicationResponse updateApplicationBatchTime(BatchTimeUpdateRequest request) {
        if (request.getDriveId() == null || request.getApplicationId() == null
                || request.getOldBatchTime() == null || request.getNewBatchTime() == null
                || request.getUpdatedBy() == null) {
            throw new ValidationException("driveId, applicationId, oldBatchTime, newBatchTime and updatedBy are required");
        }
        
        // Fetch updatedBy user
        User updatedByUser = userRepository.findById(request.getUpdatedBy())
                .orElseThrow(() -> new ResourceNotFoundException("User", "ID", request.getUpdatedBy()));
        
        int updated = applicationRepository.updateBatchTime(
                request.getDriveId(), request.getApplicationId(),
                request.getOldBatchTime(), request.getNewBatchTime());
        if (updated == 0) {
            throw new ResourceNotFoundException("Application",
                    "driveId/applicationId/oldBatchTime",
                    request.getDriveId() + "/" + request.getApplicationId() + "/" + request.getOldBatchTime());
        }
        
        // Fetch and update the application with updatedBy user
        Application application = applicationRepository.findById(request.getApplicationId())
                .orElseThrow(() -> new ResourceNotFoundException("Application", "ID", request.getApplicationId()));
        application.setUpdatedByUser(updatedByUser);
        applicationRepository.save(application);
        
        return mapper.toResponse(application);
    }

    @Override
    @Transactional(readOnly = true)
    public CandidateHistoryResponse getCandidateHistory(Long driveId, Long candidateId) {
        if (driveId == null) {
            throw new ValidationException("Drive ID is required");
        }
        if (candidateId == null) {
            throw new ValidationException("Candidate ID is required");
        }

        Application application = applicationRepository.findByDriveIdAndCandidateIdWithDetails(driveId, candidateId)
                .orElseThrow(() -> new ResourceNotFoundException("Application", "driveId + candidateId", driveId + "/" + candidateId));

        List<DriveAssignment> assignments = driveAssignmentRepository.findByApplicationIdWithDetails(application.getApplicationId());
        List<CandidateEvaluation> evaluations = candidateEvaluationRepository.findByApplicationIdWithDetails(application.getApplicationId());
        List<ManualOverride> overrides = manualOverrideRepository.findByEntityTypeAndEntityIdWithUser(
                OverrideEntityType.APPLICATIONS, application.getApplicationId());

        CandidateHistoryResponse response = mapper.toCandidateHistoryResponse(application, assignments, evaluations);
        response.setOverrides(manualOverrideMapper.toResponseList(overrides));
        return response;
    }

    /**
     * Generates a unique 6-digit registration code (100000–999999).
     * Retries if the generated code already exists in the database.
     */
    private String generateRegistrationCode(Long driveId) {
        String code;
        int maxAttempts = 10;
        int attempt = 0;
        do {
            code = String.valueOf(ThreadLocalRandom.current().nextInt(100000, 1000000));
            attempt++;
            if (attempt > maxAttempts) {
                throw new ValidationException("Unable to generate a unique registration code after " + maxAttempts + " attempts");
            }
        } while (applicationRepository.existsByDriveDriveIdAndRegistrationCode(driveId, code));
        return code;
    }

    @Override
    @Transactional
    public ApplicationResponse overrideDriveStatus(Long applicationId, ApplicationStatus status, String reason, Long userId) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application", "ID", applicationId));

        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User", "ID", userId);
        }

        String oldStatus = application.getApplicationStatus().name();
        application.setApplicationStatus(status);
        Application saved = applicationRepository.save(application);

        // Log to manual_override
        FieldChangeDTO change = new FieldChangeDTO();
        change.setField("applicationStatus");
        change.setOld(oldStatus);
        change.setNewValue(status.name());

        ManualOverrideRequest overrideRequest = new ManualOverrideRequest();
        overrideRequest.setEntityType("APPLICATIONS");
        overrideRequest.setEntityId(applicationId);
        overrideRequest.setChanges(List.of(change));
        overrideRequest.setOverrideReason(reason);
        overrideRequest.setCreatedBy(userId);
        overrideService.logOverride(overrideRequest);

        return mapper.toResponse(saved);
    }
    
    @Override
    @Transactional
    public FinalizeApplicationsResponse finalizeApplications(FinalizeApplicationsRequest request) {
        if (request.getApplicationIds() == null || request.getApplicationIds().isEmpty()) {
            throw new ValidationException("Application IDs list cannot be empty");
        }
        
        // Fetch all applications with candidates in one query to avoid N+1
        List<Application> applications = applicationRepository.findAllById(request.getApplicationIds());
        
        if (applications.isEmpty()) {
            throw new ResourceNotFoundException("Applications", "IDs", request.getApplicationIds().toString());
        }
        
        // Verify all requested IDs exist
        if (applications.size() != request.getApplicationIds().size()) {
            List<Long> foundIds = applications.stream().map(Application::getApplicationId).collect(Collectors.toList());
            List<Long> missingIds = request.getApplicationIds().stream()
                    .filter(id -> !foundIds.contains(id))
                    .collect(Collectors.toList());
            throw new ResourceNotFoundException("Applications", "IDs", missingIds.toString());
        }
        
        List<FinalizeApplicationsResponse.ApplicationUpdateDetail> details = new ArrayList<>();
        
        List<Candidate> candidatesToSave = new ArrayList<>();
        for (Application application : applications) {
            Candidate candidate = application.getCandidate();
            if (candidate == null) {
                throw new ValidationException("Application " + application.getApplicationId() + " has no associated candidate");
            }

            ApplicationStatus appStatus = application.getApplicationStatus();
            ApplicationStage previousStage = candidate.getApplicationStage();
            ApplicationStage newStage = switch (appStatus) {
                case SELECTED -> ApplicationStage.SELECTED;
                case DROPPED  -> ApplicationStage.DROPPED;
                default       -> ApplicationStage.REJECTED; // FAILED, ALLOTED, IN_DRIVE
            };

            candidate.setApplicationStage(newStage);
            candidatesToSave.add(candidate);

            FinalizeApplicationsResponse.ApplicationUpdateDetail detail =
                new FinalizeApplicationsResponse.ApplicationUpdateDetail();
            detail.setApplicationId(application.getApplicationId());
            detail.setCandidateId(candidate.getCandidateId());
            detail.setCandidateName(candidate.getFirstName() +
                (candidate.getLastName() != null ? " " + candidate.getLastName() : ""));
            detail.setPreviousStage(previousStage != null ? previousStage.toString() : "NONE");
            detail.setNewStage(newStage.toString());
            detail.setApplicationStatus(appStatus.toString());
            details.add(detail);
        }

        // Batch save all candidates — 1 query instead of N
        candidatesRepository.saveAll(candidatesToSave);

        // Update Drive status to CLOSED if isClosed is true
        if (Boolean.TRUE.equals(request.getIsClosed()) && !applications.isEmpty()) {
            Application firstApp = applications.get(0);
            Drive drive = firstApp.getDrive();
            if (drive != null && drive.getStatus() != DriveStatus.CLOSED) {
                drive.setStatus(DriveStatus.CLOSED);
                driveRepository.save(drive);
            }
        }
        
        FinalizeApplicationsResponse response = new FinalizeApplicationsResponse();
        response.setUpdatedCount(details.size());
        response.setDetails(details);
        
        return response;
    }
    
}
