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
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

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
    private final ApplicationContext applicationContext;

    private IDocumentLinkService getSelf() {
        return applicationContext.getBean(IDocumentLinkService.class);
    }

    @Override
    @Transactional
    public DocumentLinkResponse generateSubmissionLink(Long candidateId, Long cycleId,
            List<Long> documentTypeIds) {
        return getSelf().generateSubmissionLink(candidateId, cycleId, documentTypeIds, null);
    }

    @Override
    @Transactional
    public DocumentLinkResponse generateSubmissionLink(Long candidateId, Long cycleId,
            List<Long> documentTypeIds, LocalDateTime submissionDeadline) {

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

        LocalDateTime expiryDate = resolveSubmissionDeadline(submissionDeadline);

        String linkId = UUID.randomUUID().toString();
        String token = tokenService.generateToken(candidateId, cycleId, "INITIAL_SUBMISSION", expiryDate, candidate.getEmail());
        String submissionLink = buildSubmissionLink(token);

        List<RequiredDocumentDTO> requiredDocs = documentTypeIds.stream()
            .map(docTypeId -> {
                DocumentType docType = documentTypeRepository.findById(docTypeId)
                    .orElseThrow(() -> new ResourceNotFoundException("Document type not found: " + docTypeId));

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

                return new RequiredDocumentDTO(docTypeId, docType.getDocumentType(), true, "PENDING");
            })
            .toList();

        DocumentLinkResponse response = new DocumentLinkResponse(
            linkId, candidateId, candidate.getEmail(), submissionLink, expiryDate, requiredDocs);

        boolean emailSent = emailService.sendDocumentSubmissionLink(
            candidate.getEmail(),
            candidate.getFirstName() + " " + candidate.getLastName(),
            submissionLink, requiredDocs, expiryDate);

        if (!emailSent) {
            throw new ValidationException(
                "Failed to send email to '" + candidate.getEmail() +
                "'. Please verify the email address is valid and try again.");
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

        log.info("Validated submission token for candidate: {}", claims.getCandidateId());
        return new DocumentSubmissionToken(
            claims.getCandidateId(),
            candidate.getFirstName() + " " + candidate.getLastName(),
            claims.getCycleId(), null, claims.getExpiryDate(),
            claims.getPurpose(), claims.getDocumentTypeId(), claims.getCandidateEmail());
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

        List<DocumentStatusDTO> documentStatuses = submissions.stream()
            .map(submission -> new DocumentStatusDTO(
                submission.getDocumentType().getDocumentTypeId(),
                submission.getDocumentType().getDocumentType(),
                true,
                submission.getVerificationStatus().name(),
                submission.getCreatedAt(),
                null))
            .toList();

        int totalRequired = documentStatuses.size();
        long totalApproved = documentStatuses.stream().filter(d -> "APPROVED".equals(d.getStatus())).count();
        int completionPercentage = totalRequired > 0 ? (int) ((totalApproved * 100) / totalRequired) : 0;

        return new DocumentSubmissionStatusResponse(
            candidateId, candidate.getFirstName() + " " + candidate.getLastName(),
            cycleId, completionPercentage, totalRequired, documentStatuses, claims.getExpiryDate());
    }

    @Override
    @Transactional
    public boolean sendInitialSubmissionLink(Long candidateId, Long cycleId, List<Long> documentTypeIds) {
        return getSelf().sendInitialSubmissionLink(candidateId, cycleId, documentTypeIds, null);
    }

    @Override
    @Transactional
    public boolean sendInitialSubmissionLink(Long candidateId, Long cycleId,
            List<Long> documentTypeIds, LocalDateTime submissionDeadline) {
        try {
            getSelf().generateSubmissionLink(candidateId, cycleId, documentTypeIds, submissionDeadline);
            return true;
        } catch (Exception e) {
            log.error("Failed to send initial submission link: {}", e.getMessage(), e);
            return false;
        }
    }

    @Override
    @Transactional
    public boolean sendDocumentRejectionLink(Long documentId, String rejectionReason) {
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
                docType.getDocumentType(), rejectionReason, resubmitLink);
        } catch (Exception e) {
            log.error("Failed to send document rejection link: {}", e.getMessage(), e);
            return false;
        }
    }

    @Override
    @Transactional
    public boolean resendSubmissionLink(Long candidateId, Long cycleId, java.util.List<Long> documentTypeIds) {
        return getSelf().resendSubmissionLink(candidateId, cycleId, documentTypeIds, null);
    }

    @Override
    @Transactional
    public boolean resendSubmissionLink(Long candidateId, Long cycleId,
            java.util.List<Long> documentTypeIds, LocalDateTime submissionDeadline) {
        try {
            List<DocumentSubmission> existingSubmissions = documentSubmissionRepository
                .findByCandidateIdAndCycleId(candidateId, cycleId)
                .stream()
                .filter(s -> s.getVerificationStatus() == Enums.VerificationStatus.PENDING
                          || s.getVerificationStatus() == Enums.VerificationStatus.REJECTED)
                .toList();

            List<Long> docTypeIds;
            if (documentTypeIds != null && !documentTypeIds.isEmpty()) {
                Set<Long> selectedTypeIds = new HashSet<>(documentTypeIds);
                docTypeIds = existingSubmissions.stream()
                    .map(s -> s.getDocumentType().getDocumentTypeId())
                    .filter(selectedTypeIds::contains)
                    .toList();
                log.info("Resending with {} out of {} selected document types", docTypeIds.size(), documentTypeIds.size());
            } else {
                docTypeIds = existingSubmissions.stream()
                    .map(s -> s.getDocumentType().getDocumentTypeId())
                    .toList();
            }

            if (docTypeIds.isEmpty()) {
                log.warn("No documents to resend for candidate {} in cycle {}", candidateId, cycleId);
                return false;
            }

            log.info("Resending submission link for candidate {} in cycle {} with {} documents",
                candidateId, cycleId, docTypeIds.size());
            return getSelf().sendInitialSubmissionLink(candidateId, cycleId, docTypeIds, submissionDeadline);
        } catch (Exception e) {
            log.error("Failed to resend submission link: {}", e.getMessage(), e);
            return false;
        }
    }

    @Override
    @Transactional
    public java.util.Map<Long, String> sendBulkSubmissionLinks(List<Long> candidateIds,
            Long cycleId, List<Long> documentTypeIds) {
        return getSelf().sendBulkSubmissionLinks(candidateIds, cycleId, documentTypeIds, null);
    }

    @Override
    @Transactional
    public java.util.Map<Long, String> sendBulkSubmissionLinks(List<Long> candidateIds,
            Long cycleId, List<Long> documentTypeIds, LocalDateTime submissionDeadline) {

        HiringCycle cycle = cycleRepository.findById(cycleId)
            .orElseThrow(() -> new ResourceNotFoundException("Hiring cycle not found with ID: " + cycleId));

        if (cycle.getStatus() != Enums.CycleStatus.OPEN) {
            throw new ValidationException("Cannot send submission links: Hiring cycle " + cycleId
                + " is not OPEN. Current status: " + cycle.getStatus());
        }

        java.util.Map<Long, String> results = new java.util.LinkedHashMap<>();

        for (Long candidateId : candidateIds) {
            try {
                getSelf().generateSubmissionLink(candidateId, cycleId, documentTypeIds, submissionDeadline);
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

    private LocalDateTime resolveSubmissionDeadline(LocalDateTime submissionDeadline) {
        LocalDateTime fallback = LocalDateTime.now().plusDays(7);
        if (submissionDeadline == null) return fallback;
        if (!submissionDeadline.isAfter(LocalDateTime.now())) {
            throw new ValidationException("Submission deadline must be in the future");
        }
        return submissionDeadline;
    }

    private String buildSubmissionLink(String token) {
        return frontendUrl + "/documents/submit?token=" + token;
    }
}
