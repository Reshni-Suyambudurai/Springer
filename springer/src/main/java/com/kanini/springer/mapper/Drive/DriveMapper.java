package com.kanini.springer.mapper.Drive;

import com.kanini.springer.dto.Drive.DriveRequest;
import com.kanini.springer.dto.Drive.DriveResponse;
import com.kanini.springer.entity.Drive.Drive;
import com.kanini.springer.entity.HiringReq.HiringCycle;
import com.kanini.springer.entity.HiringReq.Institute;
import com.kanini.springer.entity.HiringReq.User;
import com.kanini.springer.entity.enums.Enums.DriveMode;
import com.kanini.springer.entity.enums.Enums.DriveStatus;
import com.kanini.springer.repository.Hiring.HiringCycleRepository;
import com.kanini.springer.repository.Hiring.InstituteRepository;
import com.kanini.springer.repository.Hiring.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DriveMapper {
    
    private final HiringCycleRepository hiringCycleRepository;
    private final InstituteRepository instituteRepository;
    private final UserRepository userRepository;
    
    /**
     * Convert Drive entity to DriveResponse DTO
     */
    public DriveResponse toResponse(Drive drive) {
        if (drive == null) {
            return null;
        }
        
        DriveResponse response = new DriveResponse();
        response.setDriveId(drive.getDriveId());
        
        // Cycle info
        if (drive.getCycle() != null) {
            response.setCycleId(drive.getCycle().getCycleId());
            response.setCycleName(drive.getCycle().getCycleName());
        }
        
        response.setDriveName(drive.getDriveName());
        response.setDescription(drive.getDescription());
        
        // Drive mode
        if (drive.getDriveMode() != null) {
            response.setDriveMode(drive.getDriveMode().toString());
        }
        
        // Institute info (nullable for off-campus)
        if (drive.getInstitute() != null) {
            response.setInstituteId(drive.getInstitute().getInstituteId());
            response.setInstituteName(drive.getInstitute().getInstituteName());
        }
        
        response.setStartDate(drive.getStartDate());
        response.setEndDate(drive.getEndDate());
        response.setLocation(drive.getLocation());
        response.setEligibilityLocked(drive.getEligibilityLocked());
        
        if (drive.getStatus() != null) {
            response.setStatus(drive.getStatus().toString());
        }
        
        response.setCreatedAt(drive.getCreatedAt());
        if (drive.getCreatedByUser() != null) {
            response.setCreatedBy(drive.getCreatedByUser().getUserId());
            response.setCreatedByName(drive.getCreatedByUser().getUsername());
        }
        
        response.setUpdatedAt(drive.getUpdatedAt());
        if (drive.getUpdatedByUser() != null) {
            response.setUpdatedBy(drive.getUpdatedByUser().getUserId());
            response.setUpdatedByName(drive.getUpdatedByUser().getUsername());
        }
        
        return response;
    }
    
    /**
     * Convert DriveRequest DTO to Drive entity
     */
    public Drive toEntity(DriveRequest request) {
        if (request == null) {
            return null;
        }
        
        Drive drive = new Drive();
        
        // Fetch and set cycle (required)
        if (request.getCycleId() != null) {
            HiringCycle cycle = hiringCycleRepository.findById(request.getCycleId())
                .orElseThrow(() -> new RuntimeException("Hiring cycle not found with ID: " + request.getCycleId()));
            drive.setCycle(cycle);
        }
        
        drive.setDriveName(request.getDriveName());
        drive.setDescription(request.getDescription());
        
        // Fetch and set institute (optional)
        if (request.getInstituteId() != null) {
            Institute institute = instituteRepository.findById(request.getInstituteId())
                .orElseThrow(() -> new RuntimeException("Institute not found with ID: " + request.getInstituteId()));
            drive.setInstitute(institute);
            drive.setDriveMode(DriveMode.ON_CAMPUS);
        } else {
            drive.setDriveMode(DriveMode.OFF_CAMPUS);
        }
        
        drive.setStartDate(request.getStartDate());
        drive.setEndDate(request.getEndDate());
        drive.setLocation(request.getLocation());
        
        // Set defaults
        drive.setEligibilityLocked(request.getEligibilityLocked() != null ? request.getEligibilityLocked() : false);
        
        // Parse and set status (default to PLANNED)
        if (request.getDriveStatus() != null && !request.getDriveStatus().isBlank()) {
            try {
                drive.setStatus(DriveStatus.valueOf(request.getDriveStatus()));
            } catch (IllegalArgumentException e) {
                drive.setStatus(DriveStatus.PLANNED);
            }
        } else {
            drive.setStatus(DriveStatus.PLANNED);
        }
        
        // Fetch and set created by user
        if (request.getCreatedBy() != null) {
            User createdBy = userRepository.findById(request.getCreatedBy())
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + request.getCreatedBy()));
            drive.setCreatedByUser(createdBy);
        }
        
        return drive;
    }
}
