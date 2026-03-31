package com.kanini.springer.service.Drive;

import com.kanini.springer.dto.Drive.DriveRequest;
import com.kanini.springer.dto.Drive.DriveResponse;
import com.kanini.springer.dto.Drive.DriveUpdateRequest;
import com.kanini.springer.dto.Drive.UpcomingDriveSummaryResponse;

import java.util.List;

/**
 * Service interface for Drive Schedule operations
 */
public interface IDriveScheduleService {
    
    /**
     * Create a new drive schedule
     * @param request Drive creation request with cycleId, driveName, dates, location, etc.
     * @return DriveResponse with created drive details
     */
    DriveResponse createDrive(DriveRequest request);
    
    /**
     * Get drive schedule by ID with drive rounds
     * @param driveId Drive ID
     * @return DriveResponse with drive details and associated rounds
     */
    DriveResponse getDriveById(Long driveId);
    
    /**
     * Get all drive schedules (without rounds)
     * @return List of DriveResponse with basic drive details
     */
    List<DriveResponse> getAllDrives();
    
    /**
     * Update drive schedule and optionally drive rounds
     * @param driveId Drive ID to update
     * @param request Update request with fields to modify
     * @return DriveResponse with updated drive details
     */
    DriveResponse updateDrive(Long driveId, DriveUpdateRequest request);
    
    /**
     * Get upcoming drives (start date >= today) for a specific cycle
     * Returns only driveId, driveName, and driveMode
     * @param cycleId Hiring cycle ID
     * @return List of UpcomingDriveSummaryResponse with minimal drive details
     */
    List<UpcomingDriveSummaryResponse> getUpcomingDrivesByCycle(Long cycleId);
    
    /**
     * Get all drive schedules for a specific cycle
     * Returns complete drive details with rounds
     * @param cycleId Hiring cycle ID
     * @return List of DriveResponse with drive details
     */
    List<DriveResponse> getDrivesByCycleId(Long cycleId);
}

