package com.kanini.springer.mapper.Drive;

import com.kanini.springer.dto.Drive.DriveAssignmentResponse;
import com.kanini.springer.entity.Drive.DriveAssignment;
import org.springframework.stereotype.Component;

@Component
public class DriveAssignmentMapper {
    
    /**
     * Convert DriveAssignment entity to DriveAssignmentResponse DTO
     */
    public DriveAssignmentResponse toResponse(DriveAssignment assignment) {
        if (assignment == null) {
            return null;
        }
        
        DriveAssignmentResponse response = new DriveAssignmentResponse();
        response.setAssignmentId(assignment.getAssignmentId());
        
        // Drive info
        if (assignment.getDrive() != null) {
            response.setDriveId(assignment.getDrive().getDriveId());
            response.setDriveName(assignment.getDrive().getDriveName());
        }
        
        // User (panel member) info
        if (assignment.getUser() != null) {
            response.setUserId(assignment.getUser().getUserId());
            response.setUserName(assignment.getUser().getUsername());
        }
        
        // Application and candidate info
        if (assignment.getApplication() != null) {
            response.setApplicationId(assignment.getApplication().getApplicationId());
            
            if (assignment.getApplication().getCandidate() != null) {
                response.setCandidateId(assignment.getApplication().getCandidate().getCandidateId());
                String candidateName = assignment.getApplication().getCandidate().getFirstName() + 
                        (assignment.getApplication().getCandidate().getLastName() != null ? 
                                " " + assignment.getApplication().getCandidate().getLastName() : "");
                response.setCandidateName(candidateName);
            }
        }
        
        if (assignment.getStatus() != null) {
            response.setStatus(assignment.getStatus().toString());
        }
        
        // Round config info
        if (assignment.getRoundConfig() != null) {
            response.setRoundConfigId(assignment.getRoundConfig().getRoundConfigId());
            response.setRoundName(assignment.getRoundConfig().getRoundName());
        }
        
        response.setIsActive(assignment.getIsActive());
        response.setCreatedAt(assignment.getCreatedAt());
        
        // Created by user info
        if (assignment.getCreatedByUser() != null) {
            response.setCreatedBy(assignment.getCreatedByUser().getUserId());
            response.setCreatedByName(assignment.getCreatedByUser().getUsername());
        }
        
        return response;
    }
}
