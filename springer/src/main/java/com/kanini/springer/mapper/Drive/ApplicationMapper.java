package com.kanini.springer.mapper.Drive;

import com.kanini.springer.dto.Drive.ApplicationResponse;
import com.kanini.springer.entity.Drive.Application;
import org.springframework.stereotype.Component;

@Component
public class ApplicationMapper {
    
    /**
     * Convert Application entity to ApplicationResponse DTO
     */
    public ApplicationResponse toResponse(Application application) {
        if (application == null) {
            return null;
        }
        
        ApplicationResponse response = new ApplicationResponse();
        response.setApplicationId(application.getApplicationId());
        
        // Drive info
        if (application.getDrive() != null) {
            response.setDriveId(application.getDrive().getDriveId());
            response.setDriveName(application.getDrive().getDriveName());
        }
        
        // Candidate info
        if (application.getCandidate() != null) {
            response.setCandidateId(application.getCandidate().getCandidateId());
            String candidateName = application.getCandidate().getFirstName() + 
                    (application.getCandidate().getLastName() != null ? " " + application.getCandidate().getLastName() : "");
            response.setCandidateName(candidateName);
            response.setCandidateEmail(application.getCandidate().getEmail());
        }
        
        response.setBatchTime(application.getBatchTime());
        response.setRegistrationCode(application.getRegistrationCode());
        
        if (application.getApplicationStatus() != null) {
            response.setApplicationStatus(application.getApplicationStatus().toString());
        }
        
        response.setCreatedAt(application.getCreatedAt());
        
        // Created by user info
        if (application.getCreatedByUser() != null) {
            response.setCreatedBy(application.getCreatedByUser().getUserId());
            response.setCreatedByName(application.getCreatedByUser().getUsername());
        }
        
        return response;
    }
}
