package com.kanini.springer.service.Drive.impl;

import com.kanini.springer.dto.Drive.DriveRequest;
import com.kanini.springer.dto.Drive.DriveResponse;
import com.kanini.springer.dto.Drive.DriveUpdateRequest;
import com.kanini.springer.entity.Drive.Drive;
import com.kanini.springer.entity.Drive.DriveRound;
import com.kanini.springer.entity.Drive.RoundTemplate;
import com.kanini.springer.entity.HiringReq.Institute;
import com.kanini.springer.entity.HiringReq.User;
import com.kanini.springer.entity.enums.Enums.DriveMode;
import com.kanini.springer.entity.enums.Enums.DriveStatus;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.mapper.Drive.DriveMapper;
import com.kanini.springer.repository.Drive.DriveRepository;
import com.kanini.springer.repository.Drive.DriveRoundRepository;
import com.kanini.springer.repository.Drive.RoundTemplateRepository;
import com.kanini.springer.repository.Hiring.InstituteRepository;
import com.kanini.springer.repository.Hiring.UserRepository;
import com.kanini.springer.service.Drive.IDriveScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DriveScheduleServiceImpl implements IDriveScheduleService {
    
    private final DriveRepository driveRepository;
    private final DriveRoundRepository driveRoundRepository;
    private final RoundTemplateRepository roundTemplateRepository;
    private final InstituteRepository instituteRepository;
    private final UserRepository userRepository;
    private final DriveMapper mapper;
    
    @Override
    @Transactional
    public DriveResponse createDrive(DriveRequest request) {
        // Validate required fields
        if (request.getCycleId() == null) {
            throw new ValidationException("Cycle ID is required");
        }
        if (request.getDriveName() == null || request.getDriveName().isBlank()) {
            throw new ValidationException("Drive name is required");
        }
        if (request.getStartDate() == null) {
            throw new ValidationException("Start date is required");
        }
        if (request.getEndDate() == null) {
            throw new ValidationException("End date is required");
        }
        if (request.getLocation() == null || request.getLocation().isBlank()) {
            throw new ValidationException("Location is required");
        }
        if (request.getCreatedBy() == null) {
            throw new ValidationException("Created by user ID is required");
        }
        
        // Convert request to entity using mapper
        Drive drive = mapper.toEntity(request);
        
        // Save drive
        Drive savedDrive = driveRepository.save(drive);
        
        // Map drive rounds if roundConfigIds are provided
        if (request.getRoundConfigIds() != null && !request.getRoundConfigIds().isEmpty()) {
            mapDriveRounds(savedDrive, request.getRoundConfigIds());
        }
        
        // Reload drive with rounds to return
        Long driveId = savedDrive.getDriveId();
        Drive reloadedDrive = driveRepository.findById(driveId)
            .orElseThrow(() -> new ResourceNotFoundException("Drive", "ID", driveId));
        
        return mapper.toResponse(reloadedDrive, true);
    }
    
    @Override
    @Transactional(readOnly = true)
    public DriveResponse getDriveById(Long driveId) {
        if (driveId == null) {
            throw new ValidationException("Drive ID is required");
        }
        
        Drive drive = driveRepository.findById(driveId)
            .orElseThrow(() -> new ResourceNotFoundException("Drive", "ID", driveId));
        
        // Include rounds in response
        return mapper.toResponse(drive, true);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<DriveResponse> getAllDrives() {
        List<Drive> drives = driveRepository.findAll();
        
        // Don't include rounds in list response
        return drives.stream()
            .map(drive -> mapper.toResponse(drive, false))
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional
    public DriveResponse updateDrive(Long driveId, DriveUpdateRequest request) {
        if (driveId == null) {
            throw new ValidationException("Drive ID is required");
        }
        
        // Find existing drive
        Drive drive = driveRepository.findById(driveId)
            .orElseThrow(() -> new ResourceNotFoundException("Drive", "ID", driveId));
        
        // Update fields if provided
        if (request.getDriveName() != null && !request.getDriveName().isBlank()) {
            drive.setDriveName(request.getDriveName());
        }
        
        if (request.getDescription() != null) {
            drive.setDescription(request.getDescription());
        }
        
        // Update institute (can set to null for off-campus or update to new institute)
        if (request.getInstituteId() != null) {
            Institute institute = instituteRepository.findById(request.getInstituteId())
                .orElseThrow(() -> new ResourceNotFoundException("Institute", "ID", request.getInstituteId()));
            drive.setInstitute(institute);
            drive.setDriveMode(DriveMode.ON_CAMPUS);
        }
        
        if (request.getStartDate() != null) {
            drive.setStartDate(request.getStartDate());
        }
        
        if (request.getEndDate() != null) {
            drive.setEndDate(request.getEndDate());
        }
        
        if (request.getLocation() != null && !request.getLocation().isBlank()) {
            drive.setLocation(request.getLocation());
        }
        
        if (request.getEligibilityLocked() != null) {
            drive.setEligibilityLocked(request.getEligibilityLocked());
        }
        
        // Update status if provided
        if (request.getDriveStatus() != null && !request.getDriveStatus().isBlank()) {
            try {
                DriveStatus newStatus = DriveStatus.valueOf(request.getDriveStatus());
                drive.setStatus(newStatus);
            } catch (IllegalArgumentException e) {
                throw new ValidationException("Invalid drive status: " + request.getDriveStatus());
            }
        }
        
        // Set updated by user
        if (request.getUpdatedBy() != null) {
            User updatedBy = userRepository.findById(request.getUpdatedBy())
                .orElseThrow(() -> new ResourceNotFoundException("User", "ID", request.getUpdatedBy()));
            drive.setUpdatedByUser(updatedBy);
        }
        
        // Update drive rounds if roundConfigIds are provided
        if (request.getRoundConfigIds() != null) {
            // Delete existing rounds and create new ones
            driveRoundRepository.deleteByDriveDriveId(driveId);
            driveRoundRepository.flush(); // Ensure deletions are committed
            
            if (!request.getRoundConfigIds().isEmpty()) {
                mapDriveRounds(drive, request.getRoundConfigIds());
            }
        }
        
        // Save updated drive
        Drive updatedDrive = driveRepository.save(drive);
        
        // Reload with rounds
        Long savedDriveId = updatedDrive.getDriveId();
        Drive reloadedDrive = driveRepository.findById(savedDriveId)
            .orElseThrow(() -> new ResourceNotFoundException("Drive", "ID", savedDriveId));
        
        return mapper.toResponse(reloadedDrive, true);
    }
    
    /**
     * Helper method to map drive rounds
     */
    private void mapDriveRounds(Drive drive, List<Long> roundConfigIds) {
        List<DriveRound> driveRounds = new ArrayList<>();
        
        for (Long roundConfigId : roundConfigIds) {
            RoundTemplate roundTemplate = roundTemplateRepository.findById(roundConfigId)
                .orElseThrow(() -> new ResourceNotFoundException("Round template", "ID", roundConfigId));
            
            DriveRound driveRound = new DriveRound();
            driveRound.setDrive(drive);
            driveRound.setRoundConfig(roundTemplate);
            
            driveRounds.add(driveRound);
        }
        
        if (!driveRounds.isEmpty()) {
            driveRoundRepository.saveAll(driveRounds);
        }
    }
}

