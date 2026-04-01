package com.kanini.springer.mapper.DocumentCollection;

import com.kanini.springer.dto.DocumentCollection.DocumentSubmissionResponse;
import com.kanini.springer.entity.DocumentProcessing.DocumentSubmission;
import org.springframework.stereotype.Component;

@Component
public class DocumentSubmissionMapper {
    
    public DocumentSubmissionResponse toResponse(DocumentSubmission entity) {
        if (entity == null) {
            return null;
        }
        
        DocumentSubmissionResponse response = new DocumentSubmissionResponse();
        response.setDocumentId(entity.getCandidateDocumentId().longValue());
        
        if (entity.getCandidate() != null) {
            response.setCandidateId(entity.getCandidate().getCandidateId());
            response.setCandidateName(buildCandidateName(entity.getCandidate().getFirstName(), entity.getCandidate().getLastName()));
        }
        
        if (entity.getCycle() != null) {
            response.setCycleId(entity.getCycle().getCycleId());
        }
        
        if (entity.getVerificationStatus() != null) {
            response.setVerificationStatus(entity.getVerificationStatus().name());
        }
        
        response.setUploadedAt(entity.getCreatedAt());
        
        if (entity.getDocumentType() != null) {
            response.setDocumentType(entity.getDocumentType().getDocumentType().name());
        }
        
        return response;
    }
    
    private String buildCandidateName(String firstName, String lastName) {
        if (firstName == null) {
            return lastName != null ? lastName : "Unknown";
        }
        if (lastName == null) {
            return firstName;
        }
        return firstName + " " + lastName;
    }
}
