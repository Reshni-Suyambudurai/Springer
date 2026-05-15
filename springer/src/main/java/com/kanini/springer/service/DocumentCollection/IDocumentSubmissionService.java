package com.kanini.springer.service.DocumentCollection;

import com.kanini.springer.dto.DocumentCollection.DocumentSubmissionRequest;
import com.kanini.springer.dto.DocumentCollection.DocumentSubmissionResponse;

import java.util.List;

public interface IDocumentSubmissionService {
    
    DocumentSubmissionResponse submitDocument(DocumentSubmissionRequest request);
    
    DocumentSubmissionResponse getSubmissionById(Long documentId);
    
    List<DocumentSubmissionResponse> getSubmissionsByCandidate(Long candidateId);
    
    List<DocumentSubmissionResponse> getAllSubmissions(String status, Long cycleId, int page, int size);
    
    List<DocumentSubmissionResponse> getAllSubmissions(String status, Long cycleId, String applicationStage, int page, int size);
    
    byte[] downloadDocument(Long documentId);
    
    void deleteSubmission(Long documentId);
}
