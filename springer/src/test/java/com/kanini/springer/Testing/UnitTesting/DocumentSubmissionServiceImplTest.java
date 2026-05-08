package com.kanini.springer.Testing.UnitTesting;

import com.kanini.springer.dto.DocumentCollection.DocumentSubmissionRequest;
import com.kanini.springer.dto.DocumentCollection.DocumentSubmissionResponse;
import com.kanini.springer.entity.DocumentProcessing.DocumentSubmission;
import com.kanini.springer.entity.DocumentProcessing.DocumentType;
import com.kanini.springer.entity.Drive.Candidate;
import com.kanini.springer.entity.HiringReq.HiringCycle;
import com.kanini.springer.entity.enums.Enums;
import com.kanini.springer.exception.ResourceNotFoundException;
import com.kanini.springer.exception.ValidationException;
import com.kanini.springer.mapper.DocumentCollection.DocumentSubmissionMapper;
import com.kanini.springer.repository.DocumentCollection.DocumentSubmissionRepository;
import com.kanini.springer.repository.DocumentCollection.DocumentTypeRepository;
import com.kanini.springer.repository.Hiring.CandidateRepository;
import com.kanini.springer.repository.Hiring.HiringCycleRepository;
import com.kanini.springer.service.DocumentCollection.impl.DocumentSubmissionServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DocumentSubmissionServiceImplTest {

    @InjectMocks private DocumentSubmissionServiceImpl service;
    @Mock private DocumentSubmissionRepository submissionRepository;
    @Mock private DocumentTypeRepository typeRepository;
    @Mock private CandidateRepository candidateRepository;
    @Mock private HiringCycleRepository cycleRepository;
    @Mock private DocumentSubmissionMapper mapper;

    private DocumentSubmissionRequest buildRequest(Long candidateId, Long typeId, Long cycleId, int fileSize) {
        DocumentSubmissionRequest req = new DocumentSubmissionRequest();
        req.setCandidateId(candidateId);
        req.setDocumentTypeId(typeId);
        req.setCycleId(cycleId);
        req.setFile(new MockMultipartFile("file", "test.pdf", "application/pdf", new byte[fileSize]));
        return req;
    }

    private DocumentSubmission buildSubmission(Integer id, Enums.VerificationStatus status) {
        DocumentSubmission sub = new DocumentSubmission();
        sub.setCandidateDocumentId(id);
        sub.setVerificationStatus(status);
        sub.setUploadedFile(new byte[]{1, 2, 3});
        Candidate c = new Candidate(); c.setCandidateId(1L);
        sub.setCandidate(c);
        DocumentType dt = new DocumentType(); dt.setDocumentTypeId(1L);
        sub.setDocumentType(dt);
        return sub;
    }

    @Nested @DisplayName("submitDocument")
    class SubmitDocument {

        @Test @DisplayName("success - submits valid document")
        void submit_valid_success() {
            DocumentType docType = new DocumentType(); docType.setDocumentTypeId(1L);
            Candidate candidate = new Candidate(); candidate.setCandidateId(1L);
            HiringCycle cycle = new HiringCycle(); cycle.setCycleId(1L);
            DocumentSubmission saved = buildSubmission(1, Enums.VerificationStatus.COLLECTED);
            DocumentSubmissionResponse response = new DocumentSubmissionResponse();

            when(typeRepository.findById(1L)).thenReturn(Optional.of(docType));
            when(candidateRepository.findById(1L)).thenReturn(Optional.of(candidate));
            when(cycleRepository.findById(1L)).thenReturn(Optional.of(cycle));
            when(submissionRepository.findActiveSubmission(1L, 1L, 1L)).thenReturn(Optional.empty());
            when(submissionRepository.save(any())).thenReturn(saved);
            when(mapper.toResponse(saved)).thenReturn(response);

            DocumentSubmissionResponse result = service.submitDocument(buildRequest(1L, 1L, 1L, 100));
            assertThat(result).isNotNull();
            verify(submissionRepository).save(any());
        }

        @Test @DisplayName("failure - throws ValidationException when candidateId is null")
        void submit_nullCandidateId_throwsValidation() {
            DocumentSubmissionRequest req = buildRequest(null, 1L, 1L, 100);
            assertThatThrownBy(() -> service.submitDocument(req))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Candidate ID is required");
        }

        @Test @DisplayName("failure - throws ValidationException when file is empty")
        void submit_emptyFile_throwsValidation() {
            DocumentSubmissionRequest req = buildRequest(1L, 1L, 1L, 0);
            assertThatThrownBy(() -> service.submitDocument(req))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("File is required");
        }

        @Test @DisplayName("failure - throws ValidationException when document already COLLECTED")
        void submit_alreadyCollected_throwsValidation() {
            DocumentSubmission existing = buildSubmission(1, Enums.VerificationStatus.COLLECTED);
            DocumentType docType = new DocumentType(); docType.setDocumentTypeId(1L);
            Candidate candidate = new Candidate(); candidate.setCandidateId(1L);
            HiringCycle cycle = new HiringCycle(); cycle.setCycleId(1L);

            when(typeRepository.findById(1L)).thenReturn(Optional.of(docType));
            when(candidateRepository.findById(1L)).thenReturn(Optional.of(candidate));
            when(cycleRepository.findById(1L)).thenReturn(Optional.of(cycle));
            when(submissionRepository.findActiveSubmission(1L, 1L, 1L)).thenReturn(Optional.of(existing));

            DocumentSubmissionRequest req = buildRequest(1L, 1L, 1L, 100);
            assertThatThrownBy(() -> service.submitDocument(req))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("already submitted");
        }

        @Test @DisplayName("failure - throws ResourceNotFoundException when candidate not found")
        void submit_candidateNotFound_throwsNotFound() {
            DocumentType docType = new DocumentType(); docType.setDocumentTypeId(1L);
            when(typeRepository.findById(1L)).thenReturn(Optional.of(docType));
            when(candidateRepository.findById(999L)).thenReturn(Optional.empty());

            DocumentSubmissionRequest req = buildRequest(999L, 1L, 1L, 100);
            assertThatThrownBy(() -> service.submitDocument(req))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested @DisplayName("getSubmissionById")
    class GetById {

        @Test @DisplayName("success - returns submission for valid ID")
        void getById_found_returnsResponse() {
            DocumentSubmission sub = buildSubmission(1, Enums.VerificationStatus.COLLECTED);
            DocumentSubmissionResponse response = new DocumentSubmissionResponse();

            when(submissionRepository.findByIdWithDetails(1)).thenReturn(Optional.of(sub));
            when(mapper.toResponse(sub)).thenReturn(response);

            assertThat(service.getSubmissionById(1L)).isNotNull();
        }

        @Test @DisplayName("failure - throws ResourceNotFoundException when not found")
        void getById_notFound_throwsNotFound() {
            when(submissionRepository.findByIdWithDetails(99)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> service.getSubmissionById(99L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested @DisplayName("getSubmissionsByCandidate")
    class GetByCandidate {

        @Test @DisplayName("success - returns submissions for valid candidate")
        void getByCandidate_found_returnsList() {
            DocumentSubmission sub = buildSubmission(1, Enums.VerificationStatus.COLLECTED);
            DocumentSubmissionResponse response = new DocumentSubmissionResponse();

            when(candidateRepository.existsById(1L)).thenReturn(true);
            when(submissionRepository.findByCandidateId(1L)).thenReturn(List.of(sub));
            when(mapper.toResponse(sub)).thenReturn(response);

            assertThat(service.getSubmissionsByCandidate(1L)).hasSize(1);
        }

        @Test @DisplayName("failure - throws ResourceNotFoundException when candidate not found")
        void getByCandidate_notFound_throwsNotFound() {
            when(candidateRepository.existsById(999L)).thenReturn(false);
            assertThatThrownBy(() -> service.getSubmissionsByCandidate(999L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested @DisplayName("deleteSubmission")
    class DeleteSubmission {

        @Test @DisplayName("success - deletes COLLECTED submission")
        void delete_collected_deletesSuccessfully() {
            DocumentSubmission sub = buildSubmission(1, Enums.VerificationStatus.COLLECTED);
            when(submissionRepository.findByIdWithDetails(1)).thenReturn(Optional.of(sub));

            service.deleteSubmission(1L);
            verify(submissionRepository).delete(sub);
        }

        @Test @DisplayName("failure - throws ValidationException when document is APPROVED")
        void delete_approved_throwsValidation() {
            DocumentSubmission sub = buildSubmission(1, Enums.VerificationStatus.APPROVED);
            when(submissionRepository.findByIdWithDetails(1)).thenReturn(Optional.of(sub));

            assertThatThrownBy(() -> service.deleteSubmission(1L))
                    .isInstanceOf(ValidationException.class)
                    .hasMessageContaining("Cannot delete");
        }

        @Test @DisplayName("failure - throws ResourceNotFoundException when not found")
        void delete_notFound_throwsNotFound() {
            when(submissionRepository.findByIdWithDetails(99)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> service.deleteSubmission(99L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested @DisplayName("downloadDocument")
    class DownloadDocument {

        @Test @DisplayName("success - returns file bytes")
        void download_found_returnsBytes() {
            DocumentSubmission sub = buildSubmission(1, Enums.VerificationStatus.COLLECTED);
            when(submissionRepository.findByIdWithDetails(1)).thenReturn(Optional.of(sub));

            byte[] result = service.downloadDocument(1L);
            assertThat(result).isNotEmpty();
        }

        @Test @DisplayName("failure - throws ResourceNotFoundException when not found")
        void download_notFound_throwsNotFound() {
            when(submissionRepository.findByIdWithDetails(99)).thenReturn(Optional.empty());
            assertThatThrownBy(() -> service.downloadDocument(99L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }
}
