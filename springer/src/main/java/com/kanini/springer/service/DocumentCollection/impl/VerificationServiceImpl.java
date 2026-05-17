package com.kanini.springer.service.DocumentCollection.impl;

import com.kanini.springer.dto.DocumentCollection.DocumentCompletionResponse;
import com.kanini.springer.dto.DocumentCollection.VerificationRequest;
import com.kanini.springer.dto.DocumentCollection.VerificationResponse;
import com.kanini.springer.entity.DocumentProcessing.DocumentSubmission;
import com.kanini.springer.entity.enums.Enums;
import com.kanini.springer.entity.utils.AuditTrail;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.repository.DocumentCollection.DocumentTypeRepository;
import com.kanini.springer.repository.DocumentCollection.DocumentSubmissionRepository;
import com.kanini.springer.repository.AuditTrailRepository;
import com.kanini.springer.repository.Hiring.UserRepository;
import com.kanini.springer.entity.HiringReq.User;
import com.kanini.springer.service.DocumentCollection.IVerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VerificationServiceImpl implements IVerificationService {

    private static final String DOCUMENT_NOT_FOUND = "Document not found with ID: ";

    private final DocumentSubmissionRepository submissionRepository;
    private final DocumentTypeRepository typeRepository;
    private final AuditTrailRepository auditTrailRepository;
    private final UserRepository userRepository;
    
    @Override
    @Transactional
    public VerificationResponse approveDocument(Long documentId, VerificationRequest request) {
        DocumentSubmission submission = submissionRepository.findById(documentId.intValue())
                .orElseThrow(() -> new ResourceNotFoundException(DOCUMENT_NOT_FOUND + documentId));
        
        if (submission.getVerificationStatus() != Enums.VerificationStatus.COLLECTED) {
            throw new ValidationException("Only COLLECTED documents can be approved. Current status: "
                    + submission.getVerificationStatus().name());
        }
        
        String oldStatus = submission.getVerificationStatus().name();
        submission.setVerificationStatus(Enums.VerificationStatus.APPROVED);
        DocumentSubmission updated = submissionRepository.save(submission);
        
        User verifier = userRepository.findById(request.getVerifiedBy())
            .orElseThrow(() -> new ResourceNotFoundException("Verifier user not found with ID: " + request.getVerifiedBy()));
        AuditTrail auditEntry = new AuditTrail();
        auditEntry.setEntityType(Enums.AuditEntityType.DOC);
        auditEntry.setEntityId(updated.getCandidateDocumentId().longValue());
        auditEntry.setAction(Enums.AuditAction.APPROVED);
        auditEntry.setChanges("{\"oldStatus\":\"" + oldStatus + "\",\"newStatus\":\"" + updated.getVerificationStatus().name() + "\"}");
        auditEntry.setUpdatedBy(verifier);
        auditEntry.setUpdatedAt(LocalDateTime.now());
        auditTrailRepository.save(auditEntry);
        
        return VerificationResponse.builder()
                .documentId(updated.getCandidateDocumentId().longValue())
                .candidateId(updated.getCandidate().getCandidateId())
                .documentType(updated.getDocumentType().getDocumentType())
                .verificationStatus(updated.getVerificationStatus().name())
                .verifiedAt(LocalDateTime.now())
                .verifiedBy(request.getVerifiedBy())
                .comment(request.getComment())
                .build();
    }
    
    @Override
    @Transactional
    public VerificationResponse rejectDocument(Long documentId, VerificationRequest request) {
        DocumentSubmission submission = submissionRepository.findById(documentId.intValue())
                .orElseThrow(() -> new ResourceNotFoundException(DOCUMENT_NOT_FOUND + documentId));

        if (submission.getVerificationStatus() != Enums.VerificationStatus.COLLECTED
                && submission.getVerificationStatus() != Enums.VerificationStatus.PENDING) {
            throw new ValidationException("Only COLLECTED or PENDING documents can be rejected. Current status: "
                    + submission.getVerificationStatus().name());
        }
        
        if (request.getRejectionReason() == null || request.getRejectionReason().trim().isEmpty()) {
            throw new ValidationException("Rejection reason is required");
        }
        
        String oldStatus = submission.getVerificationStatus().name();
        submission.setVerificationStatus(Enums.VerificationStatus.REJECTED);
        User verifier = userRepository.findById(request.getVerifiedBy())
            .orElseThrow(() -> new ResourceNotFoundException("Verifier user not found with ID: " + request.getVerifiedBy()));
        AuditTrail auditEntry = new AuditTrail();
        auditEntry.setEntityType(Enums.AuditEntityType.DOC);
        auditEntry.setEntityId(submission.getCandidateDocumentId().longValue());
        auditEntry.setAction(Enums.AuditAction.REJECTED);
        auditEntry.setChanges("{\"oldStatus\":\"" + oldStatus + "\",\"newStatus\":\"" + submission.getVerificationStatus().name() + "\"}");
        auditEntry.setUpdatedBy(verifier);
        auditEntry.setUpdatedAt(LocalDateTime.now());
        auditTrailRepository.save(auditEntry);
        
        submission = submissionRepository.save(submission);
        
        return VerificationResponse.builder()
                .documentId(submission.getCandidateDocumentId().longValue())
                .candidateId(submission.getCandidate().getCandidateId())
                .documentType(submission.getDocumentType().getDocumentType())
                .verificationStatus(submission.getVerificationStatus().name())
                .verifiedAt(LocalDateTime.now())
                .verifiedBy(request.getVerifiedBy())
                .rejectionReason(request.getRejectionReason())
                .comment(request.getComment())
                .build();
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<VerificationResponse> getPendingVerifications(Long cycleId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);

        // Issue 6 fix: always filter by COLLECTED status directly in query, not in memory
        Page<DocumentSubmission> pageResult;
        if (cycleId != null) {
            pageResult = submissionRepository.findByVerificationStatusAndCycleId(
                    Enums.VerificationStatus.COLLECTED, cycleId, pageable);
        } else {
            pageResult = submissionRepository.findByVerificationStatus(
                    Enums.VerificationStatus.COLLECTED, pageable);
        }

        return pageResult.getContent().stream()
                .map(s -> VerificationResponse.builder()
                        .documentId(s.getCandidateDocumentId().longValue())
                        .candidateId(s.getCandidate().getCandidateId())
                        .documentType(s.getDocumentType().getDocumentType())
                        .verificationStatus(s.getVerificationStatus().name())
                        .build())
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<VerificationResponse> getVerificationHistory(Long documentId) {
        DocumentSubmission submission = submissionRepository.findById(documentId.intValue())
                .orElseThrow(() -> new ResourceNotFoundException(DOCUMENT_NOT_FOUND + documentId));
        
        // Fix: Query audit trail for actual document verification history (APPROVED/REJECTED actions only)
        List<AuditTrail> auditRecords = auditTrailRepository.findByEntityTypeAndEntityId(
                Enums.AuditEntityType.DOC, 
                documentId
        );
        
        List<VerificationResponse> history = new ArrayList<>();
        
        // Always include the initial COLLECTED status (document upload)
        history.add(VerificationResponse.builder()
                .documentId(documentId)
                .verificationStatus(Enums.VerificationStatus.COLLECTED.name())
                .verifiedAt(submission.getCreatedAt())
                .build());
        
        // Add audit trail records (APPROVED or REJECTED actions)
        auditRecords.stream()
                .filter(audit -> audit.getAction() == Enums.AuditAction.APPROVED || 
                               audit.getAction() == Enums.AuditAction.REJECTED)
                .forEach(audit -> {
                    String status = audit.getAction() == Enums.AuditAction.APPROVED ? 
                            Enums.VerificationStatus.APPROVED.name() : 
                            Enums.VerificationStatus.REJECTED.name();
                    history.add(VerificationResponse.builder()
                            .documentId(documentId)
                            .verificationStatus(status)
                            .verifiedAt(audit.getUpdatedAt())
                            .verifiedBy(audit.getUpdatedBy() != null ? audit.getUpdatedBy().getUserId() : null)
                            .build());
                });
        
        return history;
    }
    
    @Override
    @Transactional(readOnly = true)
    public DocumentCompletionResponse getDocumentCompletionStatus(Long candidateId, Long cycleId) {
        // Only active submissions (excludes REJECTED and PENDING) — REJECTED are historical, not current state
        List<DocumentSubmission> submissions = submissionRepository.findActiveSubmissionsByCandidateAndCycle(candidateId, cycleId);

        int totalRequired = submissions.size();
        int totalApproved = (int) submissions.stream()
                .filter(s -> s.getVerificationStatus() == Enums.VerificationStatus.APPROVED)
                .count();
        int totalPending = (int) submissions.stream()
                .filter(s -> s.getVerificationStatus() == Enums.VerificationStatus.COLLECTED)
                .count();
        int totalRejected = 0; // REJECTED rows excluded from active submissions

        int completePercentage = totalRequired > 0 ? (totalApproved * 100) / totalRequired : 0;
        boolean isOfferReady = totalRequired > 0 && totalApproved == totalRequired;
        
        // Show all submissions (including REJECTED history) in the documents list for frontend display
        List<DocumentSubmission> allSubmissions = submissionRepository.findByCandidateIdAndCycleId(candidateId, cycleId);
        List<DocumentCompletionResponse.DocumentStatusDetail> documents = allSubmissions.stream()
                .map(s -> DocumentCompletionResponse.DocumentStatusDetail.builder()
                        .documentType(s.getDocumentType() != null ? s.getDocumentType().getDocumentType() : "UNKNOWN")
                        .status(s.getVerificationStatus() != null ? s.getVerificationStatus().name() : "PENDING")
                        .verifiedAt(s.getCreatedAt() != null ? s.getCreatedAt().toString() : "")
                        .build())
                .toList();
        
        return DocumentCompletionResponse.builder()
                .candidateId(candidateId)
                .cycleId(cycleId)
                .completePercentage(completePercentage)
                .totalRequired(totalRequired)
                .totalApproved(totalApproved)
                .totalPending(totalPending)
                .totalRejected(totalRejected)
                .documents(documents)
                .isOfferReady(isOfferReady)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public boolean getOfferReadyStatus(Long candidateId, Long cycleId) {
        List<DocumentSubmission> submissions = submissionRepository.findActiveSubmissionsByCandidateAndCycle(candidateId, cycleId);
        if (submissions.isEmpty()) return false;
        return submissions.stream().allMatch(s -> s.getVerificationStatus() == Enums.VerificationStatus.APPROVED);
    }
}
