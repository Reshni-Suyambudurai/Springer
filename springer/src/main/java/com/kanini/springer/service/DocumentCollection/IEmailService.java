package com.kanini.springer.service.DocumentCollection;

import com.kanini.springer.dto.DocumentCollection.*;

public interface IEmailService {

    /**
     * Send document submission link to candidate
     * @param candidateEmail candidate email address
     * @param candidateName candidate name
     * @param submissionLink email link with token
     * @param requiredDocuments list of document types required
     * @param expiryDate when link expires
     * @return true if sent successfully
     */
    boolean sendDocumentSubmissionLink(String candidateEmail, String candidateName,
        String submissionLink, java.util.List<RequiredDocumentDTO> requiredDocuments,
        java.time.LocalDateTime expiryDate);

    /**
     * Send rejection email with resubmit link
     * @param candidateEmail candidate email
     * @param candidateName candidate name
     * @param documentType which document was rejected
     * @param rejectionReason why it was rejected
     * @param resubmitLink link to resubmit this document
     * @return true if sent successfully
     */
    boolean sendRejectionEmail(String candidateEmail, String candidateName,
        String documentType, String rejectionReason, String resubmitLink);

    /**
     * Send offer letter with acceptance/decline links
     * @param candidateEmail candidate email
     * @param candidateName candidate name
     * @param offerDetails offer information
     * @param acceptLink link to accept offer
     * @param declineLink link to decline offer
     * @return true if sent successfully
     */
    boolean sendOfferEmail(String candidateEmail, String candidateName,
        OfferLetterResponse offerDetails, String acceptLink, String declineLink);

    /**
     * Send confirmation of acceptance
     * @param candidateEmail candidate email
     * @param candidateName candidate name
     * @param joiningDate joining date confirmed
     * @return true if sent successfully
     */
    boolean sendOfferAcceptanceConfirmation(String candidateEmail, String candidateName,
        java.time.LocalDate joiningDate);

    /**
     * Send confirmation of decline
     * @param candidateEmail candidate email
     * @param candidateName candidate name
     * @return true if sent successfully
     */
    boolean sendOfferDeclineConfirmation(String candidateEmail, String candidateName);
}
