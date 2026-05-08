package com.kanini.springer.Testing.UnitTesting;

import com.kanini.springer.dto.DocumentCollection.VerificationRequest;
import com.kanini.springer.dto.DocumentCollection.VerificationResponse;
import com.kanini.springer.entity.DocumentProcessing.DocumentSubmission;
import com.kanini.springer.entity.DocumentProcessing.DocumentType;
import com.kanini.springer.entity.Drive.Candidate;
import com.kanini.springer.entity.HiringReq.User;
import com.kanini.springer.entity.enums.Enums;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.repository.AuditTrailRepository;
import com.kanini.springer.repository.DocumentCollection.DocumentSubmissionRepository;
import com.kanini.springer.repository.DocumentCollection.DocumentTypeRepository;
import com.kanini.springer.repository.Hiring.UserRepository;
import com.kanini.springer.service.DocumentCollection.impl.VerificationServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link VerificationServiceImpl}.
 * Uses Mockito only — no Spring context loaded.
 */
@ExtendWith(MockitoExtension.class)
class VerificationServiceImplTest {

    @InjectMocks
    private VerificationServiceImpl service;

    @Mock
    private DocumentSubmissionRepository submissionRepository;

    @Mock
    private DocumentTypeRepository typeRepository;

    @Mock
    private AuditTrailRepository auditTrailRepository;

    @Mock
    private UserRepository userRepository;

    // =========================================================================
    // Helpers
    // =========================================================================

    private DocumentSubmission buildSubmission(Integer id, Enums.VerificationStatus status) {
        DocumentSubmission sub = new DocumentSubmission();
        sub.setCandidateDocumentId(id);
        sub.setVerificationStatus(status);
        sub.setCreatedAt(LocalDateTime.now());

        Candidate candidate = new Candidate();
        candidate.setCandidateId(1L);
        sub.setCandidate(candidate);

        DocumentType docType = new DocumentType();
        docType.setDocumentTypeId(1L);
        docType.setDocumentType(Enums.DocumentType.RESUME);
        sub.setDocumentType(docType);

        return sub;
    }

    private VerificationRequest buildRequest(Long verifiedBy, String rejectionReason) {
        VerificationRequest req = new VerificationRequest();
        req.setVerifiedBy(verifiedBy);
        req.setComment("Test comment");
        req.setRejectionReason(rejectionReason);
        return req;
    }

    private User buildUser(Long id) {
        User user = new User();
        user.setUserId(id);
        return user;
    }

    // =========================================================================
    // approveDocument
    // =========================================================================

    @Nested
    @DisplayName("approveDocument")
    class ApproveDocument {

        @Test
        @DisplayName("success - approves COLLECTED document")
        void approveDocument_collected_success() {
            DocumentSubmission sub = buildSubmission(1, Enums.VerificationStatus.COLLECTED);
            VerificationRequest request = buildRequest(1L, null);
            User verifier = buildUser(1L);

            when(submissionRepository.findById(1)).thenReturn(Optional.of(sub));
            when(userRepository.findById(1L)).thenReturn(Optional.of(verifier));
            when(submissionRepository.save(any(DocumentSubmission.class))).thenReturn(sub);
            when(auditTrailRepository.save(any())).thenReturn(null);

            VerificationResponse result = service.approveDocument(1L, request);

            assertThat(result).isNotNull();
            assertThat(result.getVerificationStatus()).isEqualTo("APPROVED");
            assertThat(result.getVerifiedBy()).isEqualTo(1L);
            verify(submissionRepository).save(sub);
        }

        @Test
        @DisplayName("failure - throws ValidationException when document is PENDING (only COLLECTED allowed)")
        void approveDocument_pending_throwsValidation() {
            DocumentSubmission sub = buildSubmission(1, Enums.VerificationStatus.PENDING);

            when(submissionRepository.findById(1)).thenReturn(Optional.of(sub));

            assertThatThrownBy(() -> service.approveDocument(1L, buildRequest(1L, null)))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Only COLLECTED");
        }

        @Test
        @DisplayName("failure - throws ResourceNotFoundException when document not found")
        void approveDocument_notFound_throwsNotFound() {
            when(submissionRepository.findById(99)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.approveDocument(99L, buildRequest(1L, null)))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("failure - throws ValidationException when document already APPROVED")
        void approveDocument_alreadyApproved_throwsValidation() {
            DocumentSubmission sub = buildSubmission(1, Enums.VerificationStatus.APPROVED);

            when(submissionRepository.findById(1)).thenReturn(Optional.of(sub));

            assertThatThrownBy(() -> service.approveDocument(1L, buildRequest(1L, null)))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Only COLLECTED");
        }

        @Test
        @DisplayName("failure - throws ValidationException when document already REJECTED")
        void approveDocument_alreadyRejected_throwsValidation() {
            DocumentSubmission sub = buildSubmission(1, Enums.VerificationStatus.REJECTED);

            when(submissionRepository.findById(1)).thenReturn(Optional.of(sub));

            assertThatThrownBy(() -> service.approveDocument(1L, buildRequest(1L, null)))
                    .isInstanceOf(ValidationException.class);
        }
    }

    // =========================================================================
    // rejectDocument
    // =========================================================================

    @Nested
    @DisplayName("rejectDocument")
    class RejectDocument {

        @Test
        @DisplayName("success - rejects COLLECTED document with reason")
        void rejectDocument_collected_success() {
            DocumentSubmission sub = buildSubmission(1, Enums.VerificationStatus.COLLECTED);
            VerificationRequest request = buildRequest(1L, "Document is blurry");
            User verifier = buildUser(1L);

            when(submissionRepository.findById(1)).thenReturn(Optional.of(sub));
            when(userRepository.findById(1L)).thenReturn(Optional.of(verifier));
            when(submissionRepository.save(any(DocumentSubmission.class))).thenReturn(sub);
            when(auditTrailRepository.save(any())).thenReturn(null);

            VerificationResponse result = service.rejectDocument(1L, request);

            assertThat(result).isNotNull();
            assertThat(result.getVerificationStatus()).isEqualTo("REJECTED");
            assertThat(result.getRejectionReason()).isEqualTo("Document is blurry");
        }

        @Test
        @DisplayName("failure - throws ValidationException when rejection reason is empty")
        void rejectDocument_emptyReason_throwsValidation() {
            DocumentSubmission sub = buildSubmission(1, Enums.VerificationStatus.COLLECTED);
            VerificationRequest request = buildRequest(1L, "");

            when(submissionRepository.findById(1)).thenReturn(Optional.of(sub));

            assertThatThrownBy(() -> service.rejectDocument(1L, request))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Rejection reason is required");
        }

        @Test
        @DisplayName("failure - throws ValidationException when rejection reason is null")
        void rejectDocument_nullReason_throwsValidation() {
            DocumentSubmission sub = buildSubmission(1, Enums.VerificationStatus.COLLECTED);
            VerificationRequest request = buildRequest(1L, null);

            when(submissionRepository.findById(1)).thenReturn(Optional.of(sub));

            assertThatThrownBy(() -> service.rejectDocument(1L, request))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Rejection reason is required");
        }

        @Test
        @DisplayName("failure - throws ResourceNotFoundException when document not found")
        void rejectDocument_notFound_throwsNotFound() {
            when(submissionRepository.findById(99)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.rejectDocument(99L, buildRequest(1L, "reason")))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("failure - throws ValidationException when document already APPROVED")
        void rejectDocument_alreadyApproved_throwsValidation() {
            DocumentSubmission sub = buildSubmission(1, Enums.VerificationStatus.APPROVED);

            when(submissionRepository.findById(1)).thenReturn(Optional.of(sub));

            assertThatThrownBy(() -> service.rejectDocument(1L, buildRequest(1L, "reason")))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("COLLECTED or PENDING documents can be rejected");
        }
    }
}
