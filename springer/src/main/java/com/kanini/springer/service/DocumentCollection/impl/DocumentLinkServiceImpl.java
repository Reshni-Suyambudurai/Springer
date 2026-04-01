package com.kanini.springer.service.DocumentCollection.impl;

import com.kanini.springer.service.DocumentCollection.*;
import com.kanini.springer.dto.DocumentCollection.*;
import com.kanini.springer.repository.DocumentCollection.DocumentSubmissionRepository;
import com.kanini.springer.entity.DocumentProcessing.DocumentSubmission;
import com.kanini.springer.entity.Drive.Candidate;
import com.kanini.springer.entity.DocumentProcessing.DocumentType;
import com.kanini.springer.repository.Hiring.CandidateRepository;
import com.kanini.springer.repository.Hiring.HiringCycleRepository;
import com.kanini.springer.repository.DocumentCollection.DocumentTypeRepository;
import com.kanini.springer.entity.HiringReq.HiringCycle;
import com.kanini.springer.entity.enums.Enums;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.exception.ValidationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentLinkServiceImpl implements IDocumentLinkService {

    private final ITokenService tokenService;
    private final IEmailService emailService;
    private final DocumentSubmissionRepository documentSubmissionRepository;
    private final CandidateRepository candidateRepository;
    private final HiringCycleRepository cycleRepository;
    private final DocumentTypeRepository documentTypeRepository;

    @Override
    @Transactional
    public DocumentLinkResponse generateSubmissionLink(Long candidateId, Long cycleId,
            List<Long> documentTypeIds) {

        Candidate candidate = candidateRepository.findById(candidateId)
            .orElseThrow(() -> new ResourceNotFoundException("Candidate not found with ID: " + candidateId));

        if (candidate.getEmail() == null || candidate.getEmail().isEmpty()) {
            throw new ValidationException("Candidate email is not available");
        }

        HiringCycle cycle = cycleRepository.findById(cycleId)
            .orElseThrow(() -> new ResourceNotFoundException("Hiring cycle not found with ID: " + cycleId));

        if (cycle.getStatus() != Enums.CycleStatus.OPEN) {
            throw new ValidationException("Cannot send submission link: Hiring cycle " + cycleId + " is not OPEN. Current status: " + cycle.getStatus());
        }

        String linkId = UUID.randomUUID().toString();
        String token = tokenService.generateToken(candidateId, cycleId, "INITIAL_SUBMISSION", 7, candidate.getEmail());
        String submissionLink = buildSubmissionLink(token);

        List<RequiredDocumentDTO> requiredDocs = documentTypeIds.stream()
            .map(docTypeId -> {
                DocumentType docType = documentTypeRepository.findById(docTypeId)
                    .orElseThrow(() -> new ResourceNotFoundException("Document type not found: " + docTypeId));

                // Save PENDING record to DB only if no existing record for this candidate+docType+cycle
                boolean alreadyExists = documentSubmissionRepository
                    .findActiveSubmission(candidateId, docTypeId, cycleId).isPresent();
                if (!alreadyExists) {
                    DocumentSubmission pending = new DocumentSubmission();
                    pending.setCandidate(candidate);
                    pending.setDocumentType(docType);
                    pending.setCycle(cycle);
                    pending.setVerificationStatus(Enums.VerificationStatus.PENDING);
                    documentSubmissionRepository.save(pending);
                }

                return new RequiredDocumentDTO(
                    docTypeId,
                    docType.getDocumentType().name(),
                    true,
                    "PENDING"
                );
            })
            .collect(Collectors.toList());

        LocalDateTime expiryDate = LocalDateTime.now().plusDays(7);

        DocumentLinkResponse response = new DocumentLinkResponse(
            linkId,
            candidateId,
            candidate.getEmail(),
            submissionLink,
            expiryDate,
            requiredDocs
        );

        boolean emailSent = emailService.sendDocumentSubmissionLink(
            candidate.getEmail(),
            candidate.getFirstName() + " " + candidate.getLastName(),
            submissionLink,
            requiredDocs,
            expiryDate
        );

        if (!emailSent) {
            log.warn("Failed to send submission link email to: {}", candidate.getEmail());
        }

        log.info("Generated submission link for candidate: {}, cycle: {}", candidateId, cycleId);
        return response;
    }

    @Override
    public String generateResubmitLink(Long documentId, String rejectionReason) {
        DocumentSubmission document = documentSubmissionRepository.findById(documentId.intValue())
            .orElseThrow(() -> new ResourceNotFoundException("Document not found with ID: " + documentId));

        Long candidateId = document.getCandidate().getCandidateId();
        Long cycleId = document.getCycle().getCycleId();
        Long documentTypeId = document.getDocumentType().getDocumentTypeId();

        String token = tokenService.generateResubmitToken(candidateId, cycleId, documentTypeId, rejectionReason);

        log.info("Generated resubmit link for document: {}", documentId);
        return buildSubmissionLink(token);
    }

    @Override
    public DocumentSubmissionToken validateAndTrackLink(String token) {
        TokenClaims claims = tokenService.validateToken(token);

        Candidate candidate = candidateRepository.findById(claims.getCandidateId())
            .orElseThrow(() -> new ResourceNotFoundException("Candidate not found from token"));

        DocumentSubmissionToken submissionToken = new DocumentSubmissionToken(
            claims.getCandidateId(),
            candidate.getFirstName() + " " + candidate.getLastName(),
            claims.getCycleId(),
            null,
            claims.getExpiryDate(),
            claims.getPurpose(),
            claims.getDocumentTypeId(),
            claims.getCandidateEmail()
        );

        log.info("Validated submission token for candidate: {}", claims.getCandidateId());
        return submissionToken;
    }

    @Override
    public DocumentSubmissionStatusResponse getSubmissionStatus(Long candidateId, Long cycleId, String token) {
        TokenClaims claims = tokenService.validateToken(token);

        if (!claims.getCandidateId().equals(candidateId) || !claims.getCycleId().equals(cycleId)) {
            throw new ValidationException("Token does not match candidate and cycle");
        }

        Candidate candidate = candidateRepository.findById(candidateId)
            .orElseThrow(() -> new ResourceNotFoundException("Candidate not found"));

        List<DocumentSubmission> submissions = documentSubmissionRepository
            .findByCandidateIdAndCycleId(candidateId, cycleId);

        // Fix: Only show document types that the candidate has submissions for, not all doc types in system
        List<DocumentStatusDTO> documentStatuses = submissions.stream()
            .map(submission -> {
                String status = submission.getVerificationStatus().name();
                LocalDateTime uploadedAt = submission.getCreatedAt();
                String rejectionReason = null;
                
                return new DocumentStatusDTO(
                    submission.getDocumentType().getDocumentTypeId(),
                    submission.getDocumentType().getDocumentType().name(),
                    true,
                    status,
                    uploadedAt,
                    rejectionReason
                );
            })
            .collect(Collectors.toList());

        int totalRequired = documentStatuses.size();
        long totalApproved = documentStatuses.stream()
            .filter(d -> "APPROVED".equals(d.getStatus()))
            .count();
        int completionPercentage = totalRequired > 0 ? (int) ((totalApproved * 100) / totalRequired) : 0;

        return new DocumentSubmissionStatusResponse(
            candidateId,
            candidate.getFirstName() + " " + candidate.getLastName(),
            cycleId,
            completionPercentage,
            totalRequired,
            documentStatuses,
            claims.getExpiryDate()
        );
    }

    @Override
    @Transactional
    public boolean sendInitialSubmissionLink(Long candidateId, Long cycleId,
            List<Long> documentTypeIds) {
        try {
            generateSubmissionLink(candidateId, cycleId, documentTypeIds);
            return true;
        } catch (Exception e) {
            log.error("Failed to send initial submission link: {}", e.getMessage(), e);
            return false;
        }
    }

    @Override
    @Transactional
    public boolean sendRejectionEmail(Long documentId, String rejectionReason) {
        try {
            DocumentSubmission document = documentSubmissionRepository.findById(documentId.intValue())
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));

            Candidate candidate = candidateRepository.findById(document.getCandidate().getCandidateId())
                .orElseThrow(() -> new ResourceNotFoundException("Candidate not found"));

            DocumentType docType = documentTypeRepository.findById(document.getDocumentType().getDocumentTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Document type not found"));

            String resubmitLink = generateResubmitLink(documentId, rejectionReason);

            return emailService.sendRejectionEmail(
                candidate.getEmail(),
                candidate.getFirstName() + " " + candidate.getLastName(),
                docType.getDocumentType().name(),
                rejectionReason,
                resubmitLink
            );
        } catch (Exception e) {
            log.error("Failed to send rejection email: {}", e.getMessage(), e);
            return false;
        }
    }

    @Override
    @Transactional
    public boolean resendSubmissionLink(Long candidateId, Long cycleId) {
        try {
            List<DocumentSubmission> existingSubmissions = documentSubmissionRepository
                .findByCandidateIdAndCycleId(candidateId, cycleId);
            
            List<Long> docTypeIds = existingSubmissions.stream()
                .map(submission -> submission.getDocumentType().getDocumentTypeId())
                .collect(Collectors.toList());
            
            if (docTypeIds.isEmpty()) {
                log.warn("No submissions found for candidate {} in cycle {}", candidateId, cycleId);
                return false;
            }
            
            return sendInitialSubmissionLink(candidateId, cycleId, docTypeIds);
        } catch (Exception e) {
            log.error("Failed to resend submission link: {}", e.getMessage(), e);
            return false;
        }
    }

    @Override
    @Transactional
    public java.util.Map<Long, String> sendBulkSubmissionLinks(List<Long> candidateIds,
            Long cycleId, List<Long> documentTypeIds) {

        // Validate cycle once for all candidates
        HiringCycle cycle = cycleRepository.findById(cycleId)
            .orElseThrow(() -> new ResourceNotFoundException("Hiring cycle not found with ID: " + cycleId));

        if (cycle.getStatus() != Enums.CycleStatus.OPEN) {
            throw new ValidationException("Cannot send submission links: Hiring cycle " + cycleId
                + " is not OPEN. Current status: " + cycle.getStatus());
        }

        java.util.Map<Long, String> results = new java.util.LinkedHashMap<>();

        for (Long candidateId : candidateIds) {
            try {
                generateSubmissionLink(candidateId, cycleId, documentTypeIds);
                results.put(candidateId, "SUCCESS");
                log.info("Bulk: sent submission link to candidate {}", candidateId);
            } catch (ResourceNotFoundException e) {
                results.put(candidateId, "FAILED: " + e.getMessage());
                log.warn("Bulk: candidate {} not found — {}", candidateId, e.getMessage());
            } catch (ValidationException e) {
                results.put(candidateId, "FAILED: " + e.getMessage());
                log.warn("Bulk: validation failed for candidate {} — {}", candidateId, e.getMessage());
            } catch (Exception e) {
                results.put(candidateId, "FAILED: Email could not be sent");
                log.error("Bulk: unexpected error for candidate {} — {}", candidateId, e.getMessage(), e);
            }
        }

        log.info("Bulk submission links: {}/{} sent successfully",
            results.values().stream().filter(v -> v.equals("SUCCESS")).count(), candidateIds.size());
        return results;
    }

    @Value("${app.frontend.url}")
    private String frontendUrl;

    private String buildSubmissionLink(String token) {
        return frontendUrl + "/documents/submit?token=" + token;
    }
}
