package com.kanini.springer.service.DocumentCollection;

import com.kanini.springer.dto.DocumentCollection.RequiredDocumentDTO;

import java.time.LocalDateTime;
import java.util.List;

public interface IEmailService {

    boolean sendDocumentSubmissionLink(String candidateEmail, String candidateName,
        String submissionLink, List<RequiredDocumentDTO> requiredDocuments,
        LocalDateTime expiryDate);

    boolean sendRejectionEmail(String candidateEmail, String candidateName,
        String documentType, String rejectionReason, String resubmitLink);

    boolean sendInternWelcomeEmail(String internEmail, String internName, String tempPassword);

    boolean sendWarningEmail(String internEmail, String internName,
        String warningType, String severity, String message, String issuedBy);
}
