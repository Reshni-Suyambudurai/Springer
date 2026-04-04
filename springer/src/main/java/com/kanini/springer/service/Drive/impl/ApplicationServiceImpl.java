package com.kanini.springer.service.Drive.impl;

import com.kanini.springer.dto.Drive.ApplicationRequest;
import com.kanini.springer.dto.Drive.ApplicationResponse;
import com.kanini.springer.dto.Drive.ApplicationStatusUpdateRequest;
import com.kanini.springer.dto.Drive.BulkApplicationResponse;
import com.kanini.springer.dto.Drive.BulkApplicationStatusUpdateRequest;
import com.kanini.springer.dto.Drive.BulkApplicationStatusUpdateResponse;
import com.kanini.springer.entity.Drive.Application;
import com.kanini.springer.entity.Drive.Candidate;
import com.kanini.springer.entity.Drive.Drive;
import com.kanini.springer.entity.HiringReq.User;
import com.kanini.springer.entity.enums.Enums.ApplicationStatus;
import com.kanini.springer.entity.enums.Enums.ApplicationStage;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.mapper.Drive.ApplicationMapper;
import com.kanini.springer.repository.Drive.ApplicationRepository;
import com.kanini.springer.repository.Drive.CandidatesRepository;
import com.kanini.springer.repository.Drive.DriveRepository;
import com.kanini.springer.repository.Hiring.UserRepository;
import com.kanini.springer.service.Drive.IApplicationService;
import com.kanini.springer.specification.CandidateSpecification;
import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Root;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ApplicationServiceImpl implements IApplicationService {
    
    private final ApplicationRepository applicationRepository;
    private final CandidatesRepository candidatesRepository;
    private final DriveRepository driveRepository;
    private final UserRepository userRepository;
    private final ApplicationMapper mapper;
    private final EntityManager entityManager;
    
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
                
                // Generate GUID for registration code
                String registrationCode = "KA-DRIVE";
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
        
        return response;
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
        
        return applications.stream()
            .map(mapper::toResponse)
            .collect(Collectors.toList());
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
        
        // Update status
        application.setApplicationStatus(newStatus);
        
        // Save
        Application updatedApplication = applicationRepository.save(application);
        
        return mapper.toResponse(updatedApplication);
    }
    
    @Override
    @Transactional
    public BulkApplicationStatusUpdateResponse bulkUpdateApplicationStatus(BulkApplicationStatusUpdateRequest request) {
        BulkApplicationStatusUpdateResponse response = new BulkApplicationStatusUpdateResponse();
        
        // Validate required fields
        if (request.getApplications() == null || request.getApplications().isEmpty()) {
            throw new ValidationException("Applications list cannot be empty");
        }
        
        // Collect valid application IDs and batch fetch (1 query instead of N)
        List<Long> applicationIds = request.getApplications().stream()
            .map(BulkApplicationStatusUpdateRequest.ApplicationStatusData::getApplicationId)
            .filter(id -> id != null)
            .collect(Collectors.toList());
        Map<Long, Application> applicationMap = applicationRepository.findAllById(applicationIds)
            .stream().collect(Collectors.toMap(Application::getApplicationId, a -> a));
        
        int totalProcessed = 0;
        int successCount = 0;
        int failureCount = 0;
        List<Application> applicationsToSave = new ArrayList<>();
        List<Candidate> candidatesToSave = new ArrayList<>();
        
        for (BulkApplicationStatusUpdateRequest.ApplicationStatusData appData : request.getApplications()) {
            totalProcessed++;
            
            try {
                // Validate application data
                if (appData.getApplicationId() == null) {
                    response.getErrorMessages().add("Application ID is required for entry #" + totalProcessed);
                    failureCount++;
                    continue;
                }
                
                if (appData.getApplicationStatus() == null || appData.getApplicationStatus().isBlank()) {
                    response.getErrorMessages().add("Application status is required for application ID: " + appData.getApplicationId());
                    failureCount++;
                    continue;
                }
                
                // Lookup from pre-fetched map
                Application application = applicationMap.get(appData.getApplicationId());
                
                if (application == null) {
                    response.getErrorMessages().add("Application not found with ID: " + appData.getApplicationId());
                    failureCount++;
                    continue;
                }
                
                // Parse and validate status
                ApplicationStatus newStatus;
                try {
                    newStatus = ApplicationStatus.valueOf(appData.getApplicationStatus());
                } catch (IllegalArgumentException e) {
                    response.getErrorMessages().add("Invalid application status '" + appData.getApplicationStatus() + 
                            "' for application ID: " + appData.getApplicationId());
                    failureCount++;
                    continue;
                }
                
                // Update application status
                application.setApplicationStatus(newStatus);
                applicationsToSave.add(application);
                
                // Update candidate status based on application status
                Candidate candidate = application.getCandidate();
                if (candidate != null) {
                    ApplicationStage newCandidateStage = null;
                    
                    if (newStatus == ApplicationStatus.SELECTED) {
                        // If application status is SELECTED → candidate stage = SELECTED
                        newCandidateStage = ApplicationStage.SELECTED;
                    } else if (newStatus == ApplicationStatus.FAILED || newStatus == ApplicationStatus.DROPPED) {
                        // If application status is FAILED or DROPPED → candidate stage = REJECTED
                        newCandidateStage = ApplicationStage.REJECTED;
                    }
                    
                    // Update candidate stage if applicable
                    if (newCandidateStage != null) {
                        candidate.setApplicationStage(newCandidateStage);
                        candidatesToSave.add(candidate);
                    }
                }
                
                successCount++;
                
            } catch (Exception e) {
                response.getErrorMessages().add("Error processing application " + appData.getApplicationId() + ": " + e.getMessage());
                failureCount++;
            }
        }
        
        // Batch save all applications and candidates (2 queries instead of 2N)
        List<Application> savedApplications = applicationRepository.saveAll(applicationsToSave);
        candidatesRepository.saveAll(candidatesToSave);
        
        for (Application saved : savedApplications) {
            response.getSuccessfulUpdates().add(mapper.toResponse(saved));
        }
        
        response.setTotalProcessed(totalProcessed);
        response.setSuccessCount(successCount);
        response.setFailureCount(failureCount);
        
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, List<Long>> getBatchCandidatesByDriveId(Long driveId) {
        if (driveId == null) {
            throw new ValidationException("Drive ID is required");
        }
        List<Application> applications = applicationRepository.findByDriveDriveId(driveId);
        return applications.stream()
                .collect(Collectors.groupingBy(
                        a -> a.getBatchTime() != null ? a.getBatchTime().toString() : "UNSCHEDULED",
                        Collectors.mapping(Application::getApplicationId, Collectors.toList())
                ));
    }
}
