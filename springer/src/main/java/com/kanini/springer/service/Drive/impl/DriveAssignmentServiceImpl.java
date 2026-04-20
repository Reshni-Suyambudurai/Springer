package com.kanini.springer.service.Drive.impl;

import com.kanini.springer.dto.Drive.*;
import com.kanini.springer.entity.Drive.Application;
import com.kanini.springer.entity.Drive.Drive;
import com.kanini.springer.entity.Drive.DriveAssignment;
import com.kanini.springer.entity.Drive.RoundTemplate;
import com.kanini.springer.entity.HiringReq.User;
import com.kanini.springer.entity.enums.Enums.AssignmentStatus;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.mapper.Drive.DriveAssignmentMapper;
import com.kanini.springer.entity.Drive.CandidateEvaluation;
import com.kanini.springer.repository.Drive.ApplicationRepository;
import com.kanini.springer.repository.Drive.CandidateEvaluationRepository;
import com.kanini.springer.repository.Drive.DriveAssignmentRepository;
import com.kanini.springer.repository.Drive.DriveRepository;
import com.kanini.springer.repository.Drive.RoundTemplateRepository;
import com.kanini.springer.repository.Hiring.UserRepository;
import com.kanini.springer.service.Drive.IDriveAssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DriveAssignmentServiceImpl implements IDriveAssignmentService {
    
    private final DriveAssignmentRepository driveAssignmentRepository;
    private final CandidateEvaluationRepository candidateEvaluationRepository;
    private final DriveRepository driveRepository;
    private final UserRepository userRepository;
    private final ApplicationRepository applicationRepository;
    private final RoundTemplateRepository roundTemplateRepository;
    private final DriveAssignmentMapper mapper;
    
    @Override
    @Transactional
    public DriveAssignmentResponse createAssignment(DriveAssignmentRequest request) {
        // Validate required fields
        if (request.getDriveId() == null) {
            throw new ValidationException("Drive ID is required");
        }
        if (request.getUserId() == null) {
            throw new ValidationException("User ID is required");
        }
        if (request.getApplicationId() == null) {
            throw new ValidationException("Application ID is required");
        }
        if (request.getCreatedBy() == null) {
            throw new ValidationException("Created by user ID is required");
        }
        
        // Fetch drive
        Drive drive = driveRepository.findById(request.getDriveId())
            .orElseThrow(() -> new ResourceNotFoundException("Drive", "ID", request.getDriveId()));
        
        // Fetch user (panel member)
        User user = userRepository.findById(request.getUserId())
            .orElseThrow(() -> new ResourceNotFoundException("User", "ID", request.getUserId()));
        
        // Fetch application
        Application application = applicationRepository.findById(request.getApplicationId())
            .orElseThrow(() -> new ResourceNotFoundException("Application", "ID", request.getApplicationId()));
        
        // Fetch created by user
        User createdByUser = userRepository.findById(request.getCreatedBy())
            .orElseThrow(() -> new ResourceNotFoundException("User", "ID", request.getCreatedBy()));
        
        // Create assignment
        DriveAssignment assignment = new DriveAssignment();
        assignment.setDrive(drive);
        assignment.setUser(user);
        assignment.setApplication(application);
        assignment.setCreatedByUser(createdByUser);
        
        // Set round config if provided
        if (request.getRoundConfigId() != null) {
            RoundTemplate roundConfig = roundTemplateRepository.findById(request.getRoundConfigId())
                .orElseThrow(() -> new ResourceNotFoundException("RoundTemplate", "ID", request.getRoundConfigId()));
            assignment.setRoundConfig(roundConfig);
        }
        
        // Set status (default PLANNED)
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            try {
                assignment.setStatus(AssignmentStatus.valueOf(request.getStatus()));
            } catch (IllegalArgumentException e) {
                assignment.setStatus(AssignmentStatus.PLANNED);
            }
        } else {
            assignment.setStatus(AssignmentStatus.PLANNED);
        }
        
        // Set isActive (default true)
        assignment.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
        
        // Save assignment
        DriveAssignment savedAssignment = driveAssignmentRepository.save(assignment);
        
        return mapper.toResponse(savedAssignment);
    }
    
    @Override
    @Transactional
    public BulkDriveAssignmentResponse bulkCreateAssignments(BulkDriveAssignmentRequest request) {
        BulkDriveAssignmentResponse response = new BulkDriveAssignmentResponse();
        
        // Validate required fields
        if (request.getDriveId() == null) {
            throw new ValidationException("Drive ID is required");
        }
        if (request.getEntries() == null || request.getEntries().isEmpty()) {
            throw new ValidationException("Entries list cannot be empty");
        }
        if (request.getCreatedBy() == null) {
            throw new ValidationException("Created by user ID is required");
        }
        
        // 1 query — fetch drive
        Drive drive = driveRepository.findById(request.getDriveId())
            .orElseThrow(() -> new ResourceNotFoundException("Drive", "ID", request.getDriveId()));
        
        // 1 query — fetch created by user
        User createdByUser = userRepository.findById(request.getCreatedBy())
            .orElseThrow(() -> new ResourceNotFoundException("User", "ID", request.getCreatedBy()));
        
        // Collect unique IDs from entries
        Set<Long> userIds = request.getEntries().stream()
            .map(BulkDriveAssignmentRequest.AssignmentEntry::getUserId)
            .collect(Collectors.toSet());
        List<Long> applicationIds = request.getEntries().stream()
            .map(BulkDriveAssignmentRequest.AssignmentEntry::getApplicationId)
            .collect(Collectors.toList());
        
        // 1 query — batch fetch all panel member users
        Map<Long, User> userMap = userRepository.findAllById(userIds)
            .stream().collect(Collectors.toMap(User::getUserId, u -> u));
        
        // 1 query — batch fetch all applications
        Map<Long, Application> applicationMap = applicationRepository.findAllById(applicationIds)
            .stream().collect(Collectors.toMap(Application::getApplicationId, a -> a));
        
        // 1 query (optional) — fetch round config once (roundConfigId takes priority, else resolve from roundNo)
        RoundTemplate roundConfig = null;
        if (request.getRoundConfigId() != null) {
            roundConfig = roundTemplateRepository.findById(request.getRoundConfigId())
                .orElseThrow(() -> new ResourceNotFoundException("RoundTemplate", "ID", request.getRoundConfigId()));
        } else if (request.getRoundNo() != null) {
            roundConfig = roundTemplateRepository.findByRoundNo(request.getRoundNo())
                .orElseThrow(() -> new ResourceNotFoundException("RoundTemplate", "roundNo", request.getRoundNo()));
        }
        
        // 1 query — fetch existing active assignments for upsert (keyed by applicationId + userId)
        Map<String, DriveAssignment> existingAssignments = Map.of();
        if (roundConfig != null) {
            existingAssignments = driveAssignmentRepository
                .findActiveByDriveRoundAndApplicationIds(request.getDriveId(), roundConfig.getRoundConfigId(), applicationIds)
                .stream().collect(Collectors.toMap(
                    a -> a.getApplication().getApplicationId() + "_" + a.getUser().getUserId(),
                    a -> a, (a, b) -> a));
        }
        
        // Parse status (default PLANNED)
        AssignmentStatus status = AssignmentStatus.PLANNED;
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            try {
                status = AssignmentStatus.valueOf(request.getStatus());
            } catch (IllegalArgumentException e) {
                status = AssignmentStatus.PLANNED;
            }
        }
        
        Boolean isActive = request.getIsActive() != null ? request.getIsActive() : true;
        
        int totalProcessed = 0;
        int successCount = 0;
        int failureCount = 0;
        List<DriveAssignment> assignmentsToSave = new ArrayList<>();
        
        for (BulkDriveAssignmentRequest.AssignmentEntry entry : request.getEntries()) {
            totalProcessed++;
            
            try {
                User user = userMap.get(entry.getUserId());
                if (user == null) {
                    response.getErrorMessages().add("User with ID " + entry.getUserId() + " not found");
                    failureCount++;
                    continue;
                }
                
                Application application = applicationMap.get(entry.getApplicationId());
                if (application == null) {
                    response.getErrorMessages().add("Application with ID " + entry.getApplicationId() + " not found");
                    failureCount++;
                    continue;
                }
                
                // Upsert logic:
                // If replaceUserId is set, find old assignment and update its user
                // Otherwise, if same app+user exists, skip; else create new
                if (entry.getReplaceUserId() != null) {
                    String oldKey = entry.getApplicationId() + "_" + entry.getReplaceUserId();
                    DriveAssignment existing = existingAssignments.get(oldKey);
                    if (existing != null) {
                        existing.setUser(user);
                        existing.setUpdatedByUser(createdByUser);
                        assignmentsToSave.add(existing);
                    } else {
                        // Old assignment not found, create new
                        DriveAssignment assignment = new DriveAssignment();
                        assignment.setDrive(drive);
                        assignment.setUser(user);
                        assignment.setApplication(application);
                        assignment.setStatus(status);
                        assignment.setIsActive(isActive);
                        assignment.setCreatedByUser(createdByUser);
                        if (roundConfig != null) {
                            assignment.setRoundConfig(roundConfig);
                        }
                        assignmentsToSave.add(assignment);
                    }
                } else {
                    String key = entry.getApplicationId() + "_" + entry.getUserId();
                    DriveAssignment existing = existingAssignments.get(key);
                    if (existing != null) {
                        // Same panel member already assigned — skip
                        existing.setUpdatedByUser(createdByUser);
                        assignmentsToSave.add(existing);
                    } else {
                        DriveAssignment assignment = new DriveAssignment();
                        assignment.setDrive(drive);
                        assignment.setUser(user);
                        assignment.setApplication(application);
                        assignment.setStatus(status);
                        assignment.setIsActive(isActive);
                        assignment.setCreatedByUser(createdByUser);
                        if (roundConfig != null) {
                            assignment.setRoundConfig(roundConfig);
                        }
                        assignmentsToSave.add(assignment);
                    }
                }
                successCount++;
                
            } catch (Exception e) {
                response.getErrorMessages().add("Error processing entry (app=" + entry.getApplicationId() 
                    + ", user=" + entry.getUserId() + "): " + e.getMessage());
                failureCount++;
            }
        }
        
        // 1 query — batch save all assignments
        List<DriveAssignment> savedAssignments = driveAssignmentRepository.saveAll(assignmentsToSave);
        for (DriveAssignment saved : savedAssignments) {
            String candidateName = "";
            if (saved.getApplication() != null && saved.getApplication().getCandidate() != null) {
                candidateName = saved.getApplication().getCandidate().getFirstName()
                    + (saved.getApplication().getCandidate().getLastName() != null 
                        ? " " + saved.getApplication().getCandidate().getLastName() : "");
            }
            response.getSuccessfulAssignments().add(
                new BulkDriveAssignmentResponse.AssignmentSummary(
                    saved.getApplication().getApplicationId(), candidateName));
        }
        
        response.setTotalProcessed(totalProcessed);
        response.setSuccessCount(successCount);
        response.setFailureCount(failureCount);
        
        return response;
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<DriveAssignmentResponse> getAllAssignments() {
        List<DriveAssignment> assignments = driveAssignmentRepository.findAll();
        
        return assignments.stream()
            .map(mapper::toResponse)
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public DriveAssignmentResponse getAssignmentById(Integer assignmentId) {
        if (assignmentId == null) {
            throw new ValidationException("Assignment ID is required");
        }
        
        DriveAssignment assignment = driveAssignmentRepository.findById(assignmentId)
            .orElseThrow(() -> new ResourceNotFoundException("Assignment", "ID", assignmentId));
        
        return mapper.toResponse(assignment);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<DriveAssignmentResponse> getAssignmentsByDriveId(Long driveId) {
        if (driveId == null) {
            throw new ValidationException("Drive ID is required");
        }
        
        List<DriveAssignment> assignments = driveAssignmentRepository.findByDriveDriveId(driveId);
        
        return assignments.stream()
            .map(mapper::toResponse)
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional
    public DriveAssignmentResponse updateAssignmentStatus(Integer assignmentId, DriveAssignmentStatusUpdateRequest request) {
        if (assignmentId == null) {
            throw new ValidationException("Assignment ID is required");
        }
        
        if (request.getStatus() == null || request.getStatus().isBlank()) {
            throw new ValidationException("Status is required");
        }
        
        // Find assignment
        DriveAssignment assignment = driveAssignmentRepository.findById(assignmentId)
            .orElseThrow(() -> new ResourceNotFoundException("Assignment", "ID", assignmentId));
        
        // Parse and validate status
        AssignmentStatus newStatus;
        try {
            newStatus = AssignmentStatus.valueOf(request.getStatus());
        } catch (IllegalArgumentException e) {
            throw new ValidationException("Invalid status: " + request.getStatus());
        }
        
        // Update status
        assignment.setStatus(newStatus);
        
        return mapper.toResponse(assignment);
    }
    
    @Override
    @Transactional
    public DriveAssignmentResponse deleteAssignment(Integer assignmentId) {
        if (assignmentId == null) {
            throw new ValidationException("Assignment ID is required");
        }
        
        // Find assignment
        DriveAssignment assignment = driveAssignmentRepository.findById(assignmentId)
            .orElseThrow(() -> new ResourceNotFoundException("Assignment", "ID", assignmentId));
        
        // Toggle isActive (soft delete)
        assignment.setIsActive(!assignment.getIsActive());
        
        return mapper.toResponse(assignment);
    }
    
    @Override
    @Transactional
    public BulkDriveAssignmentResponse bulkDeleteAssignments(BulkDeleteAssignmentRequest request) {
        BulkDriveAssignmentResponse response = new BulkDriveAssignmentResponse();
        
        if (request.getAssignmentIds() == null || request.getAssignmentIds().isEmpty()) {
            throw new ValidationException("Assignment IDs list cannot be empty");
        }
        
        // Batch fetch all assignments (1 query instead of N)
        Map<Integer, DriveAssignment> assignmentMap = driveAssignmentRepository.findAllById(request.getAssignmentIds())
            .stream().collect(Collectors.toMap(DriveAssignment::getAssignmentId, a -> a));
        
        int totalProcessed = 0;
        int successCount = 0;
        int failureCount = 0;
        
        for (Integer assignmentId : request.getAssignmentIds()) {
            totalProcessed++;
            
            try {
                // Lookup from pre-fetched map
                DriveAssignment assignment = assignmentMap.get(assignmentId);
                
                if (assignment == null) {
                    response.getErrorMessages().add("Assignment with ID " + assignmentId + " not found");
                    failureCount++;
                    continue;
                }
                
                // Toggle isActive (soft delete)
                assignment.setIsActive(!assignment.getIsActive());
                
                String candidateName = "";
                if (assignment.getApplication() != null && assignment.getApplication().getCandidate() != null) {
                    candidateName = assignment.getApplication().getCandidate().getFirstName()
                        + (assignment.getApplication().getCandidate().getLastName() != null 
                            ? " " + assignment.getApplication().getCandidate().getLastName() : "");
                }
                response.getSuccessfulAssignments().add(
                    new BulkDriveAssignmentResponse.AssignmentSummary(
                        assignment.getApplication().getApplicationId(), candidateName));
                successCount++;
                
            } catch (Exception e) {
                response.getErrorMessages().add("Error deleting assignment " + assignmentId + ": " + e.getMessage());
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
    public List<PanelAllocationStatusResponse> getAllocationStatus(Long driveId, Integer roundNo, List<Long> applicationIds) {
        // 1 query — resolve roundNo → roundConfigId
        RoundTemplate roundConfig = roundTemplateRepository.findByRoundNo(roundNo)
            .orElseThrow(() -> new ResourceNotFoundException("RoundTemplate", "roundNo", roundNo));
        
        Long roundConfigId = roundConfig.getRoundConfigId();
        
        // 1 query — fetch active assignments (may have multiple per applicationId)
        Map<Long, List<DriveAssignment>> assignmentsByApp = driveAssignmentRepository
            .findActiveByDriveRoundAndApplicationIds(driveId, roundConfigId, applicationIds)
            .stream().collect(Collectors.groupingBy(a -> a.getApplication().getApplicationId()));
        
        // 1 query — fetch ALL evaluations, indexed by appId → reviewerUserId for O(1) lookup
        Map<Long, Map<Long, CandidateEvaluation>> evalsByAppAndUser = candidateEvaluationRepository
            .findByApplicationIdsAndRoundConfigIdFetched(applicationIds, roundConfigId)
            .stream()
            .collect(Collectors.groupingBy(
                e -> e.getApplication().getApplicationId(),
                Collectors.toMap(
                    e -> e.getReviewedBy() != null ? e.getReviewedBy().getUserId() : -1L,
                    e -> e,
                    (a, b) -> a
                )
            ));
        
        // Build response — one per applicationId, all panels in the array
        return applicationIds.stream().map(appId -> {
            List<DriveAssignment> assignments = assignmentsByApp.getOrDefault(appId, List.of());
            Map<Long, CandidateEvaluation> evalsByUser = evalsByAppAndUser.getOrDefault(appId, Map.of());
            
            PanelAllocationStatusResponse dto = new PanelAllocationStatusResponse();
            dto.setApplicationId(appId);
            
            List<PanelAllocationStatusResponse.AdditionalPanel> panels = new ArrayList<>();
            for (DriveAssignment assignment : assignments) {
                User panelUser = assignment.getUser();
                CandidateEvaluation eval = evalsByUser.get(panelUser.getUserId());
                String evalStatus = (eval != null && eval.getStatus() != null) ? eval.getStatus().name() : "PENDING";
                boolean evaluated = !"PENDING".equals(evalStatus);
                Integer score = (eval != null && evaluated) ? eval.getScore() : null;
                panels.add(new PanelAllocationStatusResponse.AdditionalPanel(
                    evaluated, panelUser.getUserId(), panelUser.getUsername(), evalStatus, score));
            }
            dto.setAdditionalPanels(panels);
            
            return dto;
        }).collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<DriveAssignmentResponse> getAssignmentsByUserId(Long userId, Long driveId) {
        if (userId == null) {
            throw new ValidationException("User ID is required");
        }
        if (driveId == null) {
            throw new ValidationException("Drive ID is required");
        }
        
        return driveAssignmentRepository.findActiveByUserIdAndDriveIdProjected(userId, driveId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<DriveAssignmentResponse> getAssignmentsByUserIdAndStatus(Long userId, String statuses) {
        if (userId == null) {
            throw new ValidationException("User ID is required");
        }
        if (statuses == null || statuses.isBlank()) {
            throw new ValidationException("Status is required");
        }
        
        List<AssignmentStatus> statusList = new ArrayList<>();
        for (String s : statuses.split(",")) {
            try {
                statusList.add(AssignmentStatus.valueOf(s.trim()));
            } catch (IllegalArgumentException e) {
                throw new ValidationException("Invalid status: " + s.trim());
            }
        }
        
        return driveAssignmentRepository.findActiveByUserIdAndStatusesProjected(userId, statusList);
    }
}
