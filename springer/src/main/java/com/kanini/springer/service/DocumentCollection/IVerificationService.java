package com.kanini.springer.service.DocumentCollection;

import com.kanini.springer.dto.DocumentCollection.DocumentCompletionResponse;
import com.kanini.springer.dto.DocumentCollection.VerificationRequest;
import com.kanini.springer.dto.DocumentCollection.VerificationResponse;

import java.util.List;

public interface IVerificationService {
    
    VerificationResponse approveDocument(Long documentId, VerificationRequest request);
    
    VerificationResponse rejectDocument(Long documentId, VerificationRequest request);
    
    List<VerificationResponse> getPendingVerifications(Long cycleId, int page, int size);
    
    List<VerificationResponse> getVerificationHistory(Long documentId);
    
    DocumentCompletionResponse getDocumentCompletionStatus(Long candidateId, Long cycleId);

    boolean getOfferReadyStatus(Long candidateId, Long cycleId);
}
