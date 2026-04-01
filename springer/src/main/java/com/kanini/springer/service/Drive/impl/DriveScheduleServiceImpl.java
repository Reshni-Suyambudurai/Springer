package com.kanini.springer.service.Drive.impl;

import com.kanini.springer.dto.Drive.DriveAnalyticsResponse;
import com.kanini.springer.dto.Drive.DriveRequest;
import com.kanini.springer.dto.Drive.DriveResponse;
import com.kanini.springer.dto.Drive.DriveUpdateRequest;
import com.kanini.springer.dto.Drive.UpcomingDriveSummaryResponse;
import com.kanini.springer.entity.Drive.Drive;
import com.kanini.springer.entity.Drive.RoundTemplate;
import com.kanini.springer.entity.HiringReq.Institute;
import com.kanini.springer.entity.HiringReq.User;
import com.kanini.springer.entity.enums.Enums.DriveMode;
import com.kanini.springer.entity.enums.Enums.DriveStatus;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.mapper.Drive.DriveMapper;
import com.kanini.springer.repository.Drive.ApplicationRepository;
import com.kanini.springer.repository.Drive.DriveRepository;
import com.kanini.springer.repository.Drive.RoundTemplateRepository;
import com.kanini.springer.repository.Hiring.InstituteRepository;
import com.kanini.springer.repository.Hiring.UserRepository;
import com.kanini.springer.service.Drive.IDriveScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DriveScheduleServiceImpl implements IDriveScheduleService {
    
    private final DriveRepository driveRepository;
    private final RoundTemplateRepository roundTemplateRepository;
    private final ApplicationRepository applicationRepository;
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
        
        // Reload drive to return
        Long driveId = savedDrive.getDriveId();
        Drive reloadedDrive = driveRepository.findById(driveId)
            .orElseThrow(() -> new ResourceNotFoundException("Drive", "ID", driveId));
        
        return mapper.toResponse(reloadedDrive);
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
        return mapper.toResponse(drive);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<DriveResponse> getAllDrives() {
        List<Drive> drives = driveRepository.findAll();
        
        // Don't include rounds in list response
        return drives.stream()
            .map(mapper::toResponse)
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
        
        // Save updated drive
        Drive updatedDrive = driveRepository.save(drive);
        
        // Reload with rounds
        Long savedDriveId = updatedDrive.getDriveId();
        Drive reloadedDrive = driveRepository.findById(savedDriveId)
            .orElseThrow(() -> new ResourceNotFoundException("Drive", "ID", savedDriveId));
        
        return mapper.toResponse(reloadedDrive);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<UpcomingDriveSummaryResponse> getUpcomingDrivesByCycle(Long cycleId) {
        if (cycleId == null) {
            throw new ValidationException("Cycle ID is required");
        }
        
        // Get upcoming drives (start date >= today)
        List<Drive> upcomingDrives = driveRepository.findUpcomingDrivesByCycleId(
            cycleId, 
            java.time.LocalDate.now()
        );
        
        // Map to summary response DTOs
        return upcomingDrives.stream()
            .map(drive -> new UpcomingDriveSummaryResponse(
                drive.getDriveId(),
                drive.getDriveName(),
                drive.getDriveMode(),
                drive.getStartDate()
            ))
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<DriveResponse> getDrivesByCycleId(Long cycleId) {
        if (cycleId == null) {
            throw new ValidationException("Cycle ID is required");
        }
        
        // Get all drives for the cycle
        List<Drive> drives = driveRepository.findByCycleCycleId(cycleId);
        
        // Map to DriveResponse DTOs
        return drives.stream()
            .map(mapper::toResponse)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DriveAnalyticsResponse getDriveAnalytics(Long driveId) {
        if (driveId == null) {
            throw new ValidationException("Drive ID is required");
        }

        // Fetch full drive schedule
        Drive drive = driveRepository.findById(driveId)
            .orElseThrow(() -> new ResourceNotFoundException("Drive", "ID", driveId));

        DriveResponse driveResponse = mapper.toResponse(drive);

        // Total applications
        Long totalApplications = applicationRepository.countByDriveDriveId(driveId);

        // Distinct batch time count
        Long distinctBatchTimeCount = applicationRepository.countDistinctBatchTimeByDriveId(driveId);

        // Applications per batch time
        List<Object[]> grouped = applicationRepository.countApplicationsGroupedByBatchTime(driveId);
        Map<String, Long> applicationsPerBatchTime = new LinkedHashMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
        for (Object[] row : grouped) {
            String key = row[0] != null
                ? ((LocalDateTime) row[0]).format(formatter)
                : "unscheduled";
            Long count = ((Number) row[1]).longValue();
            applicationsPerBatchTime.put(key, count);
        }

        return new DriveAnalyticsResponse(driveResponse, totalApplications, distinctBatchTimeCount, applicationsPerBatchTime);
    }
}

