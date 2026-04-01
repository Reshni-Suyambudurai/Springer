package com.kanini.springer.service.DocumentCollection;

import com.kanini.springer.dto.DocumentCollection.DocumentLinkResponse;
import com.kanini.springer.dto.DocumentCollection.DocumentSubmissionStatusResponse;

public interface IDocumentLinkService {

    /**
     * Generate submission link for new candidate on selection
     * @param candidateId candidate selected
     * @param cycleId hiring cycle
     * @param documentTypeIds required document types
     * @return DocumentLinkResponse with generated link and token
     */
    DocumentLinkResponse generateSubmissionLink(Long candidateId, Long cycleId,
        java.util.List<Long> documentTypeIds);

    /**
     * Generate resubmit link for rejected document
     * @param documentId rejected document ID
     * @param rejectionReason reason for rejection
     * @return resubmit link with scoped token
     */
    String generateResubmitLink(Long documentId, String rejectionReason);

    /**
     * Validate and track link usage
     * @param token submission link token
     * @return DocumentSubmissionToken with candidate/cycle info
     * @throws com.kanini.springer.exception.ValidationException if token invalid
     */
    DocumentSubmissionToken validateAndTrackLink(String token);

    /**
     * Get candidate's document submission status
     * @param candidateId candidate
     * @param cycleId cycle
     * @param token JWT token for validation
     * @return DocumentSubmissionStatusResponse
     */
    DocumentSubmissionStatusResponse getSubmissionStatus(Long candidateId, Long cycleId, String token);

    /**
     * Send initial submission link via email
     * @param candidateId candidate to send to
     * @param cycleId hiring cycle
     * @param documentTypeIds required documents
     * @return true if email sent successfully
     */
    boolean sendInitialSubmissionLink(Long candidateId, Long cycleId,
        java.util.List<Long> documentTypeIds);

    /**
     * Send rejection email with resubmit link
     * @param documentId rejected document
     * @param rejectionReason reason
     * @return true if email sent successfully
     */
    boolean sendRejectionEmail(Long documentId, String rejectionReason);

    /**
     * Resend submission link (if candidate didn't receive)
     * @param candidateId candidate
     * @param cycleId cycle
     * @return true if email resent
     */
    boolean resendSubmissionLink(Long candidateId, Long cycleId);

    /**
     * Send submission links to multiple candidates at once (bulk)
     * All candidates get the same document type list
     * @param candidateIds list of selected candidate IDs
     * @param cycleId hiring cycle
     * @param documentTypeIds required document types for all candidates
     * @return map of candidateId -> success/failure
     */
    java.util.Map<Long, String> sendBulkSubmissionLinks(java.util.List<Long> candidateIds,
        Long cycleId, java.util.List<Long> documentTypeIds);
}
