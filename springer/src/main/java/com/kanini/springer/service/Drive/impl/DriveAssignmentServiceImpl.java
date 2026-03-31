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
import com.kanini.springer.repository.Drive.ApplicationRepository;
import com.kanini.springer.repository.Drive.DriveAssignmentRepository;
import com.kanini.springer.repository.Drive.DriveRepository;
import com.kanini.springer.repository.Drive.RoundTemplateRepository;
import com.kanini.springer.repository.Hiring.UserRepository;
import com.kanini.springer.service.Drive.IDriveAssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DriveAssignmentServiceImpl implements IDriveAssignmentService {
    
    private final DriveAssignmentRepository driveAssignmentRepository;
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
        if (request.getUserId() == null) {
            throw new ValidationException("User ID is required");
        }
        if (request.getApplicationIds() == null || request.getApplicationIds().isEmpty()) {
            throw new ValidationException("Application IDs list cannot be empty");
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
        
        // Fetch created by user
        User createdByUser = userRepository.findById(request.getCreatedBy())
            .orElseThrow(() -> new ResourceNotFoundException("User", "ID", request.getCreatedBy()));
        
        // Parse status (default PLANNED)
        AssignmentStatus status = AssignmentStatus.PLANNED;
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            try {
                status = AssignmentStatus.valueOf(request.getStatus());
            } catch (IllegalArgumentException e) {
                status = AssignmentStatus.PLANNED;
            }
        }
        
        // Set isActive (default true)
        Boolean isActive = request.getIsActive() != null ? request.getIsActive() : true;
        
        int totalProcessed = 0;
        int successCount = 0;
        int failureCount = 0;
        
        for (Long applicationId : request.getApplicationIds()) {
            totalProcessed++;
            
            try {
                // Fetch application
                Application application = applicationRepository.findById(applicationId).orElse(null);
                
                if (application == null) {
                    response.getErrorMessages().add("Application with ID " + applicationId + " not found");
                    failureCount++;
                    continue;
                }
                
                // Create assignment
                DriveAssignment assignment = new DriveAssignment();
                assignment.setDrive(drive);
                assignment.setUser(user);
                assignment.setApplication(application);
                assignment.setStatus(status);
                assignment.setIsActive(isActive);
                assignment.setCreatedByUser(createdByUser);
                
                // Set round config if provided
                if (request.getRoundConfigId() != null) {
                    RoundTemplate roundConfig = roundTemplateRepository.findById(request.getRoundConfigId())
                        .orElseThrow(() -> new ResourceNotFoundException("RoundTemplate", "ID", request.getRoundConfigId()));
                    assignment.setRoundConfig(roundConfig);
                }
                
                // Save assignment
                DriveAssignment savedAssignment = driveAssignmentRepository.save(assignment);
                
                response.getSuccessfulAssignments().add(mapper.toResponse(savedAssignment));
                successCount++;
                
            } catch (Exception e) {
                response.getErrorMessages().add("Error processing application " + applicationId + ": " + e.getMessage());
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
        
        int totalProcessed = 0;
        int successCount = 0;
        int failureCount = 0;
        
        for (Integer assignmentId : request.getAssignmentIds()) {
            totalProcessed++;
            
            try {
                // Find assignment
                DriveAssignment assignment = driveAssignmentRepository.findById(assignmentId).orElse(null);
                
                if (assignment == null) {
                    response.getErrorMessages().add("Assignment with ID " + assignmentId + " not found");
                    failureCount++;
                    continue;
                }
                
                // Toggle isActive (soft delete)
                assignment.setIsActive(!assignment.getIsActive());
                
                response.getSuccessfulAssignments().add(mapper.toResponse(assignment));
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
}
